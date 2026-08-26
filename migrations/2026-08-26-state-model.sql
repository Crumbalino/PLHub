-- =====================================================================
-- THE FOOTBALL HUB — state model  ·  P0
-- 20260826010000
--
-- SUPERSEDES 20260826000000_movement_ledger.sql.
-- That migration's story_events was claim-scoped. The thesis needs ONE
-- log across every kind of state, because "what did we know on 14 August"
-- spans availability, the table and claims. Two logs would mean two
-- queries and two truths. Deliberate foundational change, not a layer.
--
-- BITEMPORAL, everywhere it matters:
--   valid_from / valid_to        when the fact was true in the world
--   recorded_at / superseded_at  when we learned it
-- Nothing is ever UPDATEd. Every change closes a row and opens a new one.
--
-- AUTHORITATIVE vs CONTESTED is explicit on every state table, because
-- derivations must never silently mix them.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------ enums ---
do $$ begin
  if not exists (select 1 from pg_type where typname = 'confidence') then
    create type confidence as enum ('authoritative','contested','derived');
  end if;
  if not exists (select 1 from pg_type where typname = 'state_entity') then
    create type state_entity as enum
      ('club','player','fixture','result','table_position',
       'availability','discipline','claim');
  end if;
  if not exists (select 1 from pg_type where typname = 'state_event_type') then
    create type state_event_type as enum
      ('APPEARED','CORROBORATION','DEVELOPMENT','CONFLICT',
       'OFFICIAL','CORRECTION','MERGE','VALUE_CHANGE','SILENT_EDIT');
  end if;
  if not exists (select 1 from pg_type where typname = 'competition') then
    create type competition as enum ('PL','FAC','EFL','UCL','UEL','UECL','OTHER');
  end if;
  if not exists (select 1 from pg_type where typname = 'availability_status') then
    create type availability_status as enum
      ('available','doubtful','out','suspended','unavailable');
  end if;
end $$;

-- ------------------------------------------------------------ clubs ---
create table if not exists club (
  slug        text primary key,
  name        text not null,
  short_name  text not null,
  fpl_id      integer unique,
  badge_code  text,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------- player ---
-- position_bucket is FPL's only granularity: GKP/DEF/MID/FWD.
-- There is deliberately NO centre_back column. No free source provides
-- finer positions, so derivations at that granularity are refused
-- rather than guessed. See derive/refusals.ts.
create table if not exists player (
  id              uuid primary key default gen_random_uuid(),
  fpl_id          integer unique,
  club_slug       text references club(slug),
  web_name        text not null,
  full_name       text,
  position_bucket text check (position_bucket in ('GKP','DEF','MID','FWD')),
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------- fixture ---
-- competition is load-bearing: PL yellow cards do not carry into the
-- cups, so every disciplinary derivation must know which competition
-- the next fixture belongs to.
create table if not exists fixture (
  id            uuid primary key default gen_random_uuid(),
  fpl_id        integer unique,
  competition   competition not null,
  home_slug     text references club(slug),
  away_slug     text references club(slug),
  kickoff_at    timestamptz,
  matchweek     integer,
  started       boolean not null default false,
  finished      boolean not null default false,
  recorded_at   timestamptz not null default now()
);
create index if not exists fixture_club_time_idx
  on fixture (home_slug, kickoff_at), fixture (away_slug, kickoff_at);

-- ----------------------------------------------------------- result ---
create table if not exists result (
  fixture_id   uuid primary key references fixture(id) on delete cascade,
  home_goals   integer not null,
  away_goals   integer not null,
  home_xg      numeric(5,2),
  away_xg      numeric(5,2),
  recorded_at  timestamptz not null default now()
);

-- --------------------------------------------------- table_position ---
-- APPEND ONLY. This is the snapshot that makes "5th -> 5th" and
-- "spurs have moved above brighton" possible. It is an INSERT on a poll
-- that already runs, not a new job.
create table if not exists table_position (
  id           uuid primary key default gen_random_uuid(),
  club_slug    text not null references club(slug),
  position     integer not null,
  played       integer not null,
  points       integer not null,
  goal_diff    integer not null,
  valid_from   timestamptz not null default now(),
  valid_to     timestamptz,
  recorded_at  timestamptz not null default now(),
  source       text not null default 'football-data.org'
);
create index if not exists table_position_current_idx
  on table_position (club_slug, valid_from desc) where valid_to is null;

-- ----------------------------------------------------- availability ---
-- news_verbatim is the club's own wording and is NEVER rewritten.
create table if not exists availability (
  id             uuid primary key default gen_random_uuid(),
  player_id      uuid not null references player(id) on delete cascade,
  status         availability_status not null,
  chance_pct     integer,
  news_verbatim  text,
  expected_back  date,
  valid_from     timestamptz not null default now(),
  valid_to       timestamptz,
  recorded_at    timestamptz not null default now(),
  conf           confidence not null default 'authoritative',
  source         text not null default 'fpl'
);
create index if not exists availability_current_idx
  on availability (player_id, valid_from desc) where valid_to is null;

-- ------------------------------------------------------- discipline ---
-- Per competition, because thresholds and carry-over differ.
create table if not exists discipline (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references player(id) on delete cascade,
  competition   competition not null,
  yellow_cards  integer not null default 0,
  red_cards     integer not null default 0,
  appearances   integer not null default 0,
  valid_from    timestamptz not null default now(),
  valid_to      timestamptz,
  recorded_at   timestamptz not null default now(),
  source        text not null default 'fpl',
  unique (player_id, competition, valid_from)
);
create index if not exists discipline_current_idx
  on discipline (player_id, competition, valid_from desc) where valid_to is null;

-- ------------------------------------------------------------ claim ---
-- The contested-state entity. Was story_clusters.
create table if not exists claim (
  id                uuid primary key default gen_random_uuid(),
  entity_slug       text not null,
  headline          text,
  category          text,
  state_version     integer not null default 0,   -- monotonic, never reset
  outlet_count      integer not null default 0,
  status            text not null default 'live'
                    check (status in ('live','official','corrected','merged')),
  merged_into       uuid references claim(id) on delete set null,
  -- extraction fields. NULL means "not reported", which is displayable.
  fee_stated        text,
  timeline_stated   text,
  player_id         uuid references player(id),
  first_event_at    timestamptz,
  last_event_at     timestamptz,
  conf              confidence not null default 'contested',
  created_at        timestamptz not null default now()
);
create index if not exists claim_entity_idx
  on claim (entity_slug, status, last_event_at desc);

create table if not exists claim_source (
  id                   uuid primary key default gen_random_uuid(),
  claim_id             uuid not null references claim(id) on delete cascade,
  outlet_domain        text not null,
  byline               text,
  url                  text not null,
  published_at         timestamptz,        -- as stated. Often wrong.
  first_seen_at        timestamptz not null default now(),  -- our clock. Reliable.
  content_hash         text,               -- hashed at fetch. Free.
  cites_other_outlet   text,               -- cheapest independence signal we have
  tier                 integer,            -- editorial judgement, not a score
  withdrawn_at         timestamptz,
  unique (claim_id, outlet_domain)         -- one corroboration per domain, ever
);

-- ------------------------------------------------------ state_event ---
-- THE log. One row per change to any state, for every entity type.
create table if not exists state_event (
  id                uuid primary key default gen_random_uuid(),
  entity_type       state_entity not null,
  entity_id         text not null,          -- uuid or slug
  club_slug         text,                   -- denormalised for the club query
  type              state_event_type not null,
  field             text,
  previous_value    text,
  new_value         text,
  source_domain     text,
  source_url        text,
  summary           text not null,
  version_at_event  integer not null,
  occurred_at       timestamptz not null default now()
);
create index if not exists state_event_entity_idx
  on state_event (entity_type, entity_id, version_at_event);
create index if not exists state_event_club_time_idx
  on state_event (club_slug, occurred_at desc);

-- ------------------------------------------------------ derivation ---
-- Every generated line, with the inputs that produced it, so any public
-- claim of consequence is auditable.
create table if not exists derivation (
  id           uuid primary key default gen_random_uuid(),
  rule_id      text not null,
  club_slug    text not null references club(slug),
  text         text not null,
  inputs       jsonb not null,
  lens         text not null default 'football'
               check (lens in ('football','fpl','both')),
  suppressed   boolean not null default false,
  suppress_reason text,
  generated_at timestamptz not null default now()
);
create index if not exists derivation_club_idx
  on derivation (club_slug, generated_at desc) where suppressed = false;

-- --------------------------------------------------- staleness rules ---
-- Data, not code comments, so a derivation can refuse at runtime.
create table if not exists staleness_limit (
  state        state_entity primary key,
  max_age_mins integer not null,
  note         text
);
insert into staleness_limit (state, max_age_mins, note) values
  ('table_position', 120,  'hourly poll; 5 min during live windows'),
  ('availability',   720,  'four polls a day'),
  ('discipline',     1440, 'daily plus post-match'),
  ('fixture',        1440, 'daily'),
  ('result',         15,   'must be fresh during a live window'),
  ('claim',          2880, '48h to cold')
on conflict (state) do nothing;

-- ----------------------------------------------- atomic event writer ---
-- Increments the entity version and writes the event in one statement,
-- so no application code can race it. MERGE never increments.
create or replace function record_state_event(
  p_entity_type    state_entity,
  p_entity_id      text,
  p_type           state_event_type,
  p_summary        text,
  p_club_slug      text default null,
  p_field          text default null,
  p_previous_value text default null,
  p_new_value      text default null,
  p_source_domain  text default null,
  p_source_url     text default null
) returns state_event
language plpgsql
as $$
declare
  v_version integer;
  v_row     state_event;
begin
  if p_entity_type = 'claim' then
    if p_type = 'MERGE' then
      select state_version into v_version from claim where id = p_entity_id::uuid for update;
    else
      update claim
         set state_version  = state_version + 1,
             last_event_at  = now(),
             first_event_at = coalesce(first_event_at, now()),
             outlet_count   = case when p_type = 'CORROBORATION'
                                   then outlet_count + 1 else outlet_count end,
             status         = case p_type
                                when 'OFFICIAL'   then 'official'
                                when 'CORRECTION' then 'corrected'
                                else status end
       where id = p_entity_id::uuid
       returning state_version into v_version;
    end if;
    if v_version is null then
      raise exception 'record_state_event: no claim %', p_entity_id;
    end if;
  else
    -- Authoritative entities have no per-row version counter; the log
    -- itself is the sequence. Use the count of prior events.
    select coalesce(count(*), 0) + 1 into v_version
      from state_event
     where entity_type = p_entity_type and entity_id = p_entity_id;
  end if;

  insert into state_event (
    entity_type, entity_id, club_slug, type, field,
    previous_value, new_value, source_domain, source_url,
    summary, version_at_event
  ) values (
    p_entity_type, p_entity_id, p_club_slug, p_type, p_field,
    p_previous_value, p_new_value, p_source_domain, p_source_url,
    p_summary, v_version
  ) returning * into v_row;

  return v_row;
end;
$$;

-- ------------------------------------------------------------- merge ---
create or replace function merge_claims(
  p_absorbed uuid, p_survivor uuid, p_reason text default 'duplicate cluster'
) returns void language plpgsql as $$
begin
  if p_absorbed = p_survivor then
    raise exception 'merge_claims: cannot merge a claim into itself';
  end if;
  update claim set merged_into = p_survivor, status = 'merged' where id = p_absorbed;
  perform record_state_event('claim', p_absorbed::text, 'MERGE', p_reason);
  perform record_state_event('claim', p_survivor::text, 'MERGE', p_reason);
end; $$;

-- --------------------------------------------------------------- RLS ---
-- Plain CREATE POLICY. "create policy if not exists" is invalid Postgres
-- and has broken migrations on this project before.
do $$
declare t text;
begin
  foreach t in array array['club','player','fixture','result','table_position',
                           'availability','discipline','claim','claim_source',
                           'state_event','derivation','staleness_limit']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I_read on %I', t, t);
    execute format('create policy %I_read on %I for select using (true)', t, t);
  end loop;
end $$;

-- Writes are service-role only. No client writes state.
