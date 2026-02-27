import { NextResponse } from 'next/server'
import { addContact, removeContact } from '@/lib/email/resend'

export const runtime = 'edge'

/* ── POST /api/subscribe — add email to digest list ── */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, firstName } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    await addContact(email.toLowerCase().trim(), firstName)

    return NextResponse.json({
      success: true,
      message: "You're in! Expect your first digest tomorrow morning.",
    })
  } catch (error: any) {
    console.error('Subscribe error:', error)

    // Resend returns 409 if already subscribed
    if (error?.message?.includes('409')) {
      return NextResponse.json({
        success: true,
        message: "You're already subscribed — see you tomorrow morning!",
      })
    }

    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

/* ── DELETE /api/subscribe — unsubscribe from digest ── */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    await removeContact(email.toLowerCase().trim())

    return NextResponse.json({
      success: true,
      message: "You've been unsubscribed. Sorry to see you go!",
    })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
