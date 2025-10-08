import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    })
  : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  const isStripeEnabled = process.env.FEATURE_STRIPE_ENABLED === 'true'

  // Seeds mode: Stripe is not enabled
  if (!isStripeEnabled || !stripe || !webhookSecret) {
    return NextResponse.json(
      {
        error: 'Stripe webhook is not configured',
        message: 'Webhook処理は現在準備中です',
      },
      { status: 503 }
    )
  }

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // TODO: Get user_id from session.metadata when authentication is implemented
        // For now, we'll skip creating entitlement
        console.log('Checkout session completed:', session.id)

        // When authentication is implemented:
        // const userId = session.metadata?.user_id
        // if (userId && session.subscription) {
        //   await db.entitlement.create({
        //     data: {
        //       id: crypto.randomUUID(),
        //       userId,
        //       stripeSubscriptionId: session.subscription as string,
        //       status: 'active',
        //       currentPeriodStart: new Date(),
        //       currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        //     },
        //   })
        // }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const subAny = subscription as any

        // Update entitlement status
        await db.entitlement.updateMany({
          where: {
            stripeSubscriptionId: subscription.id,
          },
          data: {
            status: subscription.status === 'active' ? 'active' : 'cancelled',
            currentPeriodStart: new Date((subAny.current_period_start || subAny.currentPeriodStart) * 1000),
            currentPeriodEnd: new Date((subAny.current_period_end || subAny.currentPeriodEnd) * 1000),
          },
        })

        console.log('Subscription updated:', subscription.id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Mark entitlement as cancelled
        await db.entitlement.updateMany({
          where: {
            stripeSubscriptionId: subscription.id,
          },
          data: {
            status: 'cancelled',
          },
        })

        console.log('Subscription deleted:', subscription.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const invoiceAny = invoice as any

        // Mark entitlement as past_due
        if (invoiceAny.subscription) {
          await db.entitlement.updateMany({
            where: {
              stripeSubscriptionId: invoiceAny.subscription as string,
            },
            data: {
              status: 'past_due',
            },
          })
        }

        console.log('Invoice payment failed:', invoice.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: 'Webhook処理中にエラーが発生しました',
      },
      { status: 500 }
    )
  }
}
