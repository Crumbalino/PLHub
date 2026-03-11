import { createServerClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    const cardId = params.cardId;

    if (!cardId) {
      return NextResponse.json(
        { error: 'Card ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Fetch all reaction counts for this card
    const { data, error } = await supabase
      .rpc('get_card_reactions', {
        p_card_id: cardId,
      });

    if (error) {
      console.error('[Reactions API] RPC error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reactions' },
        { status: 500 }
      );
    }

    // Convert array of rows to object indexed by reaction_idx
    const reactions: Record<number, number> = {};
    if (data && Array.isArray(data)) {
      for (const row of data) {
        reactions[row.reaction_idx] = row.count;
      }
    }

    return NextResponse.json({
      success: true,
      cardId,
      reactions,
    });
  } catch (err) {
    console.error('[Reactions API] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    const cardId = params.cardId;
    const body = await request.json();
    const { reactionIdx } = body;

    // Validate inputs
    if (!cardId) {
      return NextResponse.json(
        { error: 'Card ID is required' },
        { status: 400 }
      );
    }

    if (typeof reactionIdx !== 'number' || reactionIdx < 0 || reactionIdx > 9) {
      return NextResponse.json(
        { error: 'Reaction index must be a number between 0 and 9' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Call the increment_reaction function
    const { data, error } = await supabase
      .rpc('increment_reaction', {
        p_card_id: cardId,
        p_reaction_idx: reactionIdx,
      });

    if (error) {
      console.error('[Reactions API] RPC error:', error);
      return NextResponse.json(
        { error: 'Failed to increment reaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cardId,
      reactionIdx,
      count: data?.count || 1,
    });
  } catch (err) {
    console.error('[Reactions API] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
