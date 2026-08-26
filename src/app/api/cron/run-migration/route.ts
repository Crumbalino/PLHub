import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { logCronJob } from '@/lib/cron-logging'

export const maxDuration = 10

export async function GET(req: NextRequest) {
  // Protect with auth header
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // A 401 is not a run and is deliberately not logged — that matches the five
  // routes that already log, and keeps a misconfigured caller from burying the
  // real history.
  const startedAt = Date.now()

  try {
    const supabase = createServerClient()

    // First, check if the column already exists
    const { data: testData, error: testError } = await supabase
      .from('posts')
      .select('score_significance')
      .limit(1)

    if (!testError) {
      await logCronJob({
        jobName: 'run_migration',
        status: 'success',
        errorMessage: null,
        executionTimeMs: Date.now() - startedAt,
      })
      return NextResponse.json({
        success: true,
        message: 'Column score_significance already exists',
        status: 'already_exists',
      })
    }

    // Column doesn't exist, but we can't create it via the client library
    // We need to provide instructions
    await logCronJob({
      jobName: 'run_migration',
      status: 'error',
      errorMessage: 'score_significance column does not exist; needs manual SQL',
      executionTimeMs: Date.now() - startedAt,
    })
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
    await logCronJob({
      jobName: 'run_migration',
      status: 'error',
      errorMessage: err instanceof Error ? err.message : String(err),
      executionTimeMs: Date.now() - startedAt,
    })
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err) },
      { status: 500 }
    )
  }
}
