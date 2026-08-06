// Snapshot of the 24-item stratified sample used to validate the extractor.
// 4 most-recent posts from each of the 6 producing feeds, taken 2026-08-06.
// Frozen deliberately: tests must be deterministic and offline. `yieldedClaims`
// records which articles the live Opus 5 extraction returned >=1 claim for.

export interface SampleArticle {
  n: number
  feed: string
  title: string
  content: string
  yieldedClaims: boolean
}

export const SAMPLE_24: SampleArticle[] = [
  {
    "n": 1,
    "feed": "BBC Sport",
    "title": "Rush urges Liverpool to give Iraola time to succeed",
    "content": "Liverpool legend Ian Rush says new boss Andoni Iraola deserves time to succeed at Anfield but should target winning silverware in his debut campaign.",
    "yieldedClaims": false
  },
  {
    "n": 2,
    "feed": "BBC Sport",
    "title": "Mourinho, Ferguson & search for new club - what next for Smalling?",
    "content": "Snubbing university, genetics testing for supplements, Sir Alex Ferguson and Jose Mourinho - Chris Smalling is not your ordinary footballer.",
    "yieldedClaims": false
  },
  {
    "n": 3,
    "feed": "BBC Sport",
    "title": "'Show me they want me' - will World Cup hero Torres stay at Barcelona?",
    "content": "Ferran Torres has come under fire from Barcelona supporters after leaving the door open to a potential move away from the club.",
    "yieldedClaims": true
  },
  {
    "n": 4,
    "feed": "BBC Sport",
    "title": "Players who turned World Cup heroics into big transfers",
    "content": "BBC Sport looks back at some of the players whose standout performances at the World Cup earned a big transfer.",
    "yieldedClaims": false
  },
  {
    "n": 5,
    "feed": "Sky Sports",
    "title": "Bethell to miss Pakistan Test series as Pope recalled",
    "content": "Jacob Bethell will miss the entirety of England's upcoming Test series against Pakistan, while Ollie Pope and Brydon Carse have been named in the 16-man squad.",
    "yieldedClaims": false
  },
  {
    "n": 6,
    "feed": "Sky Sports",
    "title": "Why Jimenez’s Wolves return means so much to fans",
    "content": "The most romantic signing of the summer came early. Raul Jimenez is back at Wolves. And for the club's supporters, they are not so much welcoming back a former favourite but revisiting a chapter of their own lives. For a generation, Jimenez is the Wolves No 9.",
    "yieldedClaims": true
  },
  {
    "n": 7,
    "feed": "Sky Sports",
    "title": "'Relieved, excited, and energised!' - Parker's plans revealed after drug ban lifted",
    "content": "Joseph Parker is 'relieved' after a ban was lifted for a failed drug test and he will return to the ring this year, says manager David Higgins.",
    "yieldedClaims": false
  },
  {
    "n": 8,
    "feed": "Sky Sports",
    "title": "Griekspoor causes huge shock by defeating top-seed Zverev",
    "content": "Highlights from Alexander Zverev against Tallon Griekspoor in the Canadian Open.",
    "yieldedClaims": false
  },
  {
    "n": 9,
    "feed": "The Guardian",
    "title": "Alessia Russo: ‘When you join the club, you take on a part of Arsenal and the love’",
    "content": "The honorary Gooner’s game went up a level last season. Now, the forward wants to push on for more trophies, starting with the WSL\nArms hooked over the bar at the front of the bus, sunglasses on, a drink in one hand and the other pointed towards the fans as she vibed along to the music and joined in with the singing and chanting, Alessia Russo was having a blast.\n“I had the time of my life that day,” says the Arsenal forward of the 9km parade through the red smoke-filled streets of north London after Arsenal men’s Premier League triumph and Arsenal women’s Champions Cup success.\n Continue reading...",
    "yieldedClaims": false
  },
  {
    "n": 10,
    "feed": "The Guardian",
    "title": "Fifa insists Gianni Infantino will remain president after crisis meeting",
    "content": "Statement said Infantino sent written apologies to members\n\nInfantino sorry for failing to consult them over World Cup sell-off\n\nFifa on Wednesday night confirmed that Gianni Infantino will remain as president after a meeting of their senior executives in Rabat.\nIn a statement which also revealed that Infantino has sent written apologies to the Fifa council and the 211 member associations for failing to consult them over the World Cup sell-off, the world governing body said that he retains the full support of his leadership team.\n Continue reading...",
    "yieldedClaims": false
  },
  {
    "n": 11,
    "feed": "The Guardian",
    "title": "Real Madrid agree club-record £115m deal for Yan Diomandé and want to keep Vinícius",
    "content": "Forward becomes most expensive African player\n\nClub are in positive talks with Vinícius Júnior\n\nReal Madrid have agreed a club-record fee of €135m (£115.7m) with RB Leipzig for Yan Diomande and are confident of warding off Arsenal’s interest in Vinícius Júnior after offering an improved contract to the Brazil forward.\nAfter several weeks of negotiations that saw Paris Saint-Germain pull out of the race, the deal for Diomande – the 19-year-old who joined the German side from Leganés last summer and starred for Côte d’Ivoire at the World Cup – was finally struck on Wednesday afternoon. It is understood that Madrid will pay an initial €125m plus another €10m in add-ons, a total that would eclipse the fee the Spanish side paid Borussia Dortmund to sign Jude Bellingham in 2023, believed to have been worth up to €134m including add-ons.\n Continue reading...",
    "yieldedClaims": true
  },
  {
    "n": 12,
    "feed": "The Guardian",
    "title": "Infantino is getting his karmic kicking, but why did football take so long to rebel against Fifa? | Jonathan Liew",
    "content": "Federation leaders are massing forces at the gates, but years after the first proposed selling off of its commercial legacy and the Qatar World Cup\nIn recent decades the city of Salé, just across the river from Rabat on Morocco’s Atlantic coast, has undergone a remarkable transformation. At the start of this century it was a gritty working-class area, whose old town was still weathered enough to serve as a body double for the Somali capital Mogadishu in the film Black Hawk Down. But in recent decades, under the country’s autocratic government, the area has been transformed beyond measure, and largely beyond control.\nThe population has trebled in the space of 40 years. Slums have been cleared, often forcibly, to make way for grand megaprojects: a new tram system, luxury tourist spaces, a sparkling marina, a blue-chip business park called Technopolis, and – since last July – the African headquarters of Fifa. And in a way, this hub of disruption and avarice, unshakeable volition and rampant capitalism, feels like the perfect location from which a besieged warlord might choose to make his desperate last stand.\n Continue reading...",
    "yieldedClaims": false
  },
  {
    "n": 13,
    "feed": "ESPN FC",
    "title": "Why Man United swapped Skinner for Olid, and where they go from here",
    "content": "Less than a month out from the WSL season, Manchester United have appointed Eva Olid to take over as manager, but why have they changed direction?",
    "yieldedClaims": false
  },
  {
    "n": 14,
    "feed": "ESPN FC",
    "title": "Transfer rumors, news: Liverpool offered Real Madrid CB amid defensive woes",
    "content": "Liverpool have been offered a way to fix their woeful defensive depth, while Man United are looking at USMNT's Antonee Robinson. Transfer Talk has the latest.",
    "yieldedClaims": true
  },
  {
    "n": 15,
    "feed": "ESPN FC",
    "title": "Arteta: Arsenal 'fuming' after Betis friendly loss",
    "content": "Mikel Arteta said his Arsenal players were \"fuming\" after defensive errors saw them fall to a 3-1 preseason defeat to Real Betis in Dublin on Wednesday.",
    "yieldedClaims": false
  },
  {
    "n": 16,
    "feed": "ESPN FC",
    "title": "USMNT transfer grades: Arfsten gets a B+ for Boro move",
    "content": "The 2026 summer transfer window is well underway, with several U.S. players finding new homes. ESPN sets out to grade the biggest deals.",
    "yieldedClaims": false
  },
  {
    "n": 17,
    "feed": "FourFourTwo",
    "title": " Real Madrid transfer HIJACKED as Manchester City breathe sigh of relief: report ",
    "content": "Rodri looked set to join Real Madrid this summer, but there's been a twist in the tale",
    "yieldedClaims": true
  },
  {
    "n": 18,
    "feed": "FourFourTwo",
    "title": " I've done a complete U-turn on Roberto De Zerbi, here's why Tottenham Hotspur can launch a title challenge under him ",
    "content": "Roberto De Zerbi looks set to transform Tottenham Hotspur into genuine Premier League title contenders this season",
    "yieldedClaims": false
  },
  {
    "n": 19,
    "feed": "FourFourTwo",
    "title": " How Vinicius Jr. is USING Arsenal to his advantage in Real Madrid transfer negotiations ",
    "content": "Vinicius Jr. is the at the centre of a tug-of-war between Arsenal and Real Madrid - but does the Brazilian really have any intention of leaving Spain?",
    "yieldedClaims": true
  },
  {
    "n": 20,
    "feed": "FourFourTwo",
    "title": " How Manchester United finally fixed their transfer strategy ",
    "content": "Manchester United are reborn in the transfer market: in our latest video deep dive, FourFourTwo's Matt Frohlich looks at how they did it",
    "yieldedClaims": false
  },
  {
    "n": 21,
    "feed": "The Independent",
    "title": "Arsenal v Real Betis LIVE: Gunners play friendly in Dublin after agreeing Bruno Guimaraes fee",
    "content": "Mikel Arteta’s side continue their pre-season campaign at the Aviva Stadium on a day where they moved a step closer to  signing Newcastle captain and midfielder Bruno Guimaraes",
    "yieldedClaims": true
  },
  {
    "n": 22,
    "feed": "The Independent",
    "title": "Why Arsenal had to sign Bruno Guimaraes – and how he fits into Mikel Arteta’s midfield",
    "content": "The Brazilian is the king of midfield ‘duels’ – one of Mikel Arteta’s favourite buzzwords – but also brings his range of passing to increase the competition for places at the Premier League champions",
    "yieldedClaims": true
  },
  {
    "n": 23,
    "feed": "The Independent",
    "title": "Co-owner David Sullivan told to stay away from West Ham home games",
    "content": "Sulllivan has been advised not to attend West Ham’s home matches following allegations of historic sexual misconduct due to the ‘potential for demonstrations and anti-social behaviour by some spectators’",
    "yieldedClaims": false
  },
  {
    "n": 24,
    "feed": "The Independent",
    "title": "Newcastle are at a crossroads – can little-known manager Matthias Jaissle find a new way?",
    "content": "Stripped of their stars, manager and identity, Newcastle look in decline – but, Richard Jolly writes, Matthias Jaissle may prove a shrewd appointment",
    "yieldedClaims": false
  }
]
