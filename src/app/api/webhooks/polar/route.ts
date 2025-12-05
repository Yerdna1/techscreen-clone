import { NextRequest, NextResponse } from "next/server"
import { db, users, subscriptions, tokenTransactions } from "@/lib/db"
import { eq } from "drizzle-orm"
import { PRICING_PLANS } from "@/config/pricing"
import type { SubscriptionTier } from "@/types"

// Polar webhook types - supports multiple event structures
interface PolarWebhookEvent {
  type: string
  data: {
    id: string
    customer_id?: string
    product_id?: string
    product?: {
      id: string
    }
    status: string
    current_period_start?: string
    current_period_end?: string
    started_at?: string
    ended_at?: string
    metadata?: {
      user_id?: string
      clerk_id?: string
    }
    customer_metadata?: {
      clerk_id?: string
    }
    customer?: {
      metadata?: {
        clerk_id?: string
      }
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

    console.log("Polar webhook received:", event.type, JSON.stringify(event.data, null, 2))

    switch (event.type) {
      case "subscription.created":
      case "subscription.updated":
      case "subscription.active": {
        const { id, status } = event.data

        // Get product ID from either format
        const productId = event.data.product_id || event.data.product?.id

        // Get period dates from either format
        const periodStart = event.data.current_period_start || event.data.started_at
        const periodEnd = event.data.current_period_end || event.data.ended_at

        // Look for clerk_id in multiple places
        const clerkId = event.data.metadata?.clerk_id ||
                        event.data.customer_metadata?.clerk_id ||
                        event.data.customer?.metadata?.clerk_id

        if (!clerkId) {
          console.error("No clerk_id in subscription data:", event.data)
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

        // Determine plan tier based on product ID
        const plan = productId ? determinePlanFromProductId(productId) : "free"
        const planConfig = PRICING_PLANS.find((p) => p.id === plan)

        console.log("Processing subscription:", { id, status, productId, plan, clerkId })

        // Update or create subscription
        const existingSubscription = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.polarSubscriptionId, id))
          .limit(1)

        // Use sensible defaults for dates if not provided
        const startDate = periodStart ? new Date(periodStart) : new Date()
        const endDate = periodEnd ? new Date(periodEnd) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

        if (existingSubscription.length > 0) {
          await db
            .update(subscriptions)
            .set({
              status: status as "active" | "cancelled" | "past_due",
              plan,
              currentPeriodStart: startDate,
              currentPeriodEnd: endDate,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.polarSubscriptionId, id))
        } else {
          await db.insert(subscriptions).values({
            userId: user.id,
            polarSubscriptionId: id,
            plan,
            status: status as "active" | "cancelled" | "past_due",
            currentPeriodStart: startDate,
            currentPeriodEnd: endDate,
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
  const isSandbox = process.env.POLAR_SANDBOX === "true"

  // Map Polar product IDs to plans (both live and sandbox)
  const productMap: Record<string, SubscriptionTier> = {
    // Live product IDs
    [process.env.POLAR_PRODUCT_PROFESSIONAL || ""]: "professional",
    [process.env.POLAR_PRODUCT_ENTERPRISE || ""]: "enterprise",
    // Sandbox product IDs
    [process.env.POLAR_PRODUCT_PROFESSIONAL_SANDBOX || ""]: "professional",
    [process.env.POLAR_PRODUCT_ENTERPRISE_SANDBOX || ""]: "enterprise",
  }

  return productMap[productId] || "free"
}
