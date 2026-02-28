import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const maxDuration = 10

export async function GET(req: NextRequest) {
  // Protect with auth header
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServerClient()

    // First, check if the column already exists
    console.log('Checking if score_significance column exists...')
    const { data: testData, error: testError } = await supabase
      .from('posts')
      .select('score_significance')
      .limit(1)

    if (!testError) {
      console.log('Column already exists')
      return NextResponse.json({
        success: true,
        message: 'Column score_significance already exists',
        status: 'already_exists',
      })
    }

    // Column doesn't exist, but we can't create it via the client library
    // We need to provide instructions
    console.log('Column does not exist:', testError.message)

    return NextResponse.json(
      {
        success: false,
        error: 'score_significance column does not exist',
        message: 'The score_significance column needs to be added manually via Supabase SQL editor',
        instructions: {
          step1: 'Go to Supabase dashboard: https://app.supabase.com',
          step2: 'Select your project',
          step3: 'Go to SQL Editor',
          step4: 'Click "New Query"',
          step5: 'Run this SQL:',
          sql: 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS score_significance INTEGER DEFAULT 12; UPDATE posts SET score_significance = 12 WHERE score_significance IS NULL;',
        },
      },
      { status: 500 }
    )
  } catch (err) {
    console.error('Migration check error:', err)
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err) },
      { status: 500 }
    )
  }
}
