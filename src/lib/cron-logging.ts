import { createServerClient } from '@/lib/supabase'

export type CronLogStatus = 'success' | 'error'

export interface CronLogData {
  jobName: string
  status: CronLogStatus
  storiesProcessed?: number
  errorMessage?: string | null
  executionTimeMs: number
}

export async function logCronJob(data: CronLogData) {
  try {
    const supabase = createServerClient()

    await supabase.from('cron_logs').insert({
      job_name: data.jobName,
      status: data.status,
      stories_processed: data.storiesProcessed ?? null,
      error_message: data.errorMessage ?? null,
      execution_time_ms: data.executionTimeMs,
    })
  } catch (err) {
    // Silently fail logging to prevent cron job failure
    console.error('[Cron Logging] Failed to log cron job:', err)
  }
}
