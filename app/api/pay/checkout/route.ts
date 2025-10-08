import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    })
  : null

export async function GET(request: NextRequest) {
  const isStripeEnabled = process.env.FEATURE_STRIPE_ENABLED === 'true'

  // Seeds mode: Stripe is not enabled
  if (!isStripeEnabled || !stripe) {
    return NextResponse.json(
      {
        error: 'Stripe payment is not enabled',
        message: 'この機能は現在準備中です',
      },
      { status: 503 }
    )
  }

  try {
    const origin = request.nextUrl.origin

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: 'プレミアムプラン',
              description: '医療政策・医療DX・AIに関する記事の全文閲覧とニュースレター配信',
            },
            unit_amount: 500,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        // TODO: Add user_id when authentication is implemented
      },
    })

    // Redirect to Stripe Checkout
    return NextResponse.redirect(session.url!)
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        message: '決済セッションの作成に失敗しました',
      },
      { status: 500 }
    )
  }
}
