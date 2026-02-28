import { supabase } from '@/lib/supabase'
import { generateSummary } from '@/lib/claude'

export async function POST(request: Request) {
  try {
    const { postId, title, content } = await request.json()

    if (!postId || !title) {
      return Response.json(
        { error: 'postId and title are required' },
        { status: 400 }
      )
    }

    // Check if summary already exists in Supabase
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('summary, summary_hook, score_significance')
      .eq('id', postId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Supabase fetch error:', fetchError)
      return Response.json(
        { error: 'Failed to fetch post' },
        { status: 500 }
      )
    }

    // If summary exists, return it immediately
    if (post?.summary) {
      return Response.json({
        summary: post.summary,
        hook: post.summary_hook || null,
        significance: post.score_significance || null,
      })
    }

    // Generate summary, hook, and significance if not exists
    const { summary: generatedSummary, hook: generatedHook, significance: generatedSignificance } = await generateSummary(title, content || null)

    if (!generatedSummary) {
      return Response.json(
        { error: 'Failed to generate summary' },
        { status: 500 }
      )
    }

    // Save summary, hook, and significance to Supabase
    const updateData: Record<string, string | number | null> = { summary: generatedSummary }
    if (generatedHook) {
      updateData.summary_hook = generatedHook
    }
    if (generatedSignificance !== null && generatedSignificance !== undefined) {
      updateData.score_significance = generatedSignificance
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      // Still return the generated values even if save fails
      return Response.json({
        summary: generatedSummary,
        hook: generatedHook || null,
        significance: generatedSignificance || null,
      })
    }

    return Response.json({
      summary: generatedSummary,
      hook: generatedHook || null,
      significance: generatedSignificance || null,
    })
  } catch (error) {
    console.error('Summary API error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
