import { NextResponse } from 'next/server'
import { generateDigestContent } from '@/lib/email/digest-content'
import { renderDigestEmail } from '@/lib/email/digest-template'
import { listContacts, sendBatchEmails, sendEmail } from '@/lib/email/resend'

/**
 * POST /api/cron/digest
 *
 * Daily breakfast digest cron job.
 * Intended to run at 7:00 AM UK time via Vercel cron.
 *
 * Flow:
 * 1. Generate digest content from last 24h posts
 * 2. Render HTML email
 * 3. Fetch subscriber list from Resend
 * 4. Send in batches of 100
 *
 * vercel.json config:
 * {
 *   "crons": [{
 *     "path": "/api/cron/digest",
 *     "schedule": "0 7 * * *"
 *   }]
 * }
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret (Vercel sends this header for cron jobs)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Generate content
    const content = await generateDigestContent()
    if (!content) {
      return NextResponse.json({
        success: true,
        message: 'No stories in the last 24h — digest skipped.',
        sent: 0,
      })
    }

    // 2. Render email
    const html = renderDigestEmail(content)
    const subject = `⚡ PLHub Digest — ${content.topStory.title}`

    // 3. Get subscribers
    const contacts = await listContacts()
    const activeSubscribers = contacts.filter((c) => !c.unsubscribed)

    if (activeSubscribers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active subscribers — digest generated but not sent.',
        sent: 0,
        stories: content.stories.length + 1,
      })
    }

    // 4. Send in batches of 100 (Resend batch limit)
    const BATCH_SIZE = 100
    let totalSent = 0

    for (let i = 0; i < activeSubscribers.length; i += BATCH_SIZE) {
      const batch = activeSubscribers.slice(i, i + BATCH_SIZE)

      if (batch.length === 1) {
        // Single email — use regular send
        await sendEmail({
          to: batch[0].email,
          subject,
          html,
        })
      } else {
        // Batch send
        await sendBatchEmails(
          batch.map((contact) => ({
            to: contact.email,
            subject,
            html,
          }))
        )
      }

      totalSent += batch.length
    }

    return NextResponse.json({
      success: true,
      message: `Breakfast digest sent to ${totalSent} subscribers.`,
      sent: totalSent,
      stories: content.stories.length + 1,
      topStory: content.topStory.title,
    })
  } catch (error: any) {
    console.error('Digest cron error:', error)
    return NextResponse.json(
      { error: 'Digest failed', details: error?.message },
      { status: 500 }
    )
  }
}

/* GET handler for manual testing */
export async function GET(request: Request) {
  // For testing: generate content and return preview without sending
  try {
    const content = await generateDigestContent()
    if (!content) {
      return NextResponse.json({ message: 'No stories to include in digest' })
    }

    const html = renderDigestEmail(content)

    // Return HTML preview
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Preview failed', details: error?.message },
      { status: 500 }
    )
  }
}
