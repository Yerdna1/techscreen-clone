import { NextRequest, NextResponse } from "next/server"
import { db, users, subscriptions, tokenTransactions } from "@/lib/db"
import { eq } from "drizzle-orm"
import { PRICING_PLANS } from "@/config/pricing"
import type { SubscriptionTier } from "@/types"

// Polar webhook types
interface PolarWebhookEvent {
  type: string
  data: {
    id: string
    customer_id: string
    product_id: string
    status: string
    current_period_start: string
    current_period_end: string
    metadata?: {
      user_id?: string
      clerk_id?: string
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error("POLAR_WEBHOOK_SECRET not configured")
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
    }

    // Verify webhook signature (implement based on Polar's docs)
    const signature = request.headers.get("x-polar-signature")
    // TODO: Verify signature

    const event: PolarWebhookEvent = await request.json()

    switch (event.type) {
      case "subscription.created":
      case "subscription.updated": {
        const { id, customer_id, status, current_period_start, current_period_end, metadata } = event.data

        const clerkId = metadata?.clerk_id
        if (!clerkId) {
          console.error("No clerk_id in subscription metadata")
          return NextResponse.json({ error: "Missing clerk_id" }, { status: 400 })
        }

        // Get user
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, clerkId))
          .limit(1)

        if (!user) {
          console.error("User not found:", clerkId)
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Determine plan tier based on product ID or price
        // This should be configured based on your Polar product IDs
        const plan = determinePlanFromProductId(event.data.product_id)
        const planConfig = PRICING_PLANS.find((p) => p.id === plan)

        // Update or create subscription
        const existingSubscription = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.polarSubscriptionId, id))
          .limit(1)

        if (existingSubscription.length > 0) {
          await db
            .update(subscriptions)
            .set({
              status: status as "active" | "cancelled" | "past_due",
              plan,
              currentPeriodStart: new Date(current_period_start),
              currentPeriodEnd: new Date(current_period_end),
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.polarSubscriptionId, id))
        } else {
          await db.insert(subscriptions).values({
            userId: user.id,
            polarSubscriptionId: id,
            plan,
            status: status as "active" | "cancelled" | "past_due",
            currentPeriodStart: new Date(current_period_start),
            currentPeriodEnd: new Date(current_period_end),
          })
        }

        // Update user subscription tier and reset tokens
        if (status === "active" && planConfig) {
          await db
            .update(users)
            .set({
              subscriptionTier: plan,
              subscriptionId: id,
              tokens: planConfig.tokens,
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id))

          // Record token reset transaction
          await db.insert(tokenTransactions).values({
            userId: user.id,
            amount: planConfig.tokens,
            type: "subscription_reset",
            description: `Subscription reset to ${plan} plan`,
          })
        }

        break
      }

      case "subscription.cancelled": {
        const { id, metadata } = event.data

        const clerkId = metadata?.clerk_id
        if (!clerkId) {
          return NextResponse.json({ error: "Missing clerk_id" }, { status: 400 })
        }

        // Update subscription status
        await db
          .update(subscriptions)
          .set({
            status: "cancelled",
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.polarSubscriptionId, id))

        // Get user and downgrade to free
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, clerkId))
          .limit(1)

        if (user) {
          await db
            .update(users)
            .set({
              subscriptionTier: "free",
              subscriptionId: null,
              tokens: 3, // Reset to free tier tokens
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id))
        }

        break
      }

      default:
        console.log("Unhandled Polar webhook event:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Polar webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

function determinePlanFromProductId(productId: string): SubscriptionTier {
  // Map your Polar product IDs to plans
  // This should be configured based on your actual Polar product setup
  const productMap: Record<string, SubscriptionTier> = {
    // Replace with your actual Polar product IDs
    "prod_essential": "essential",
    "prod_professional": "professional",
    "prod_expert": "expert",
  }

  return productMap[productId] || "free"
}
