import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db, users, subscriptions, tokenTransactions } from "@/lib/db"
import { eq } from "drizzle-orm"
import { PRICING_PLANS } from "@/config/pricing"
import type { SubscriptionTier } from "@/types"

// Sync subscription status from Polar
export async function POST() {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Sync - Looking up user with clerkId:", clerkId)

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isSandbox = process.env.POLAR_SANDBOX === "true"
    const polarToken = isSandbox
      ? process.env.POLAR_ACCESS_TOKEN_SANDBOX
      : process.env.POLAR_ACCESS_TOKEN
    const polarOrgId = process.env.NEXT_PUBLIC_POLAR_ORG_ID

    if (!polarToken || !polarOrgId) {
      return NextResponse.json({ error: "Polar not configured" }, { status: 500 })
    }

    // Look up customer in Polar by clerk_id metadata
    const customersApiUrl = isSandbox
      ? `https://sandbox-api.polar.sh/v1/customers?organization_id=${polarOrgId}&metadata[clerk_id]=${clerkId}`
      : `https://api.polar.sh/v1/customers?organization_id=${polarOrgId}&metadata[clerk_id]=${clerkId}`

    console.log("Sync - Looking up Polar customer:", customersApiUrl)

    const customersResponse = await fetch(customersApiUrl, {
      headers: {
        "Authorization": `Bearer ${polarToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!customersResponse.ok) {
      const errorText = await customersResponse.text()
      console.error("Sync - Customer lookup failed:", errorText)
      return NextResponse.json({
        error: "Failed to look up customer",
        details: errorText
      }, { status: 500 })
    }

    const customersData = await customersResponse.json()
    console.log("Sync - Customers data:", JSON.stringify(customersData, null, 2))

    if (!customersData.items || customersData.items.length === 0) {
      return NextResponse.json({
        message: "No Polar customer found for this user",
        clerkId,
        user: { id: user.id, email: user.email }
      })
    }

    const customerId = customersData.items[0].id

    // Get subscriptions for this customer
    const subscriptionsApiUrl = isSandbox
      ? `https://sandbox-api.polar.sh/v1/subscriptions?organization_id=${polarOrgId}&customer_id=${customerId}`
      : `https://api.polar.sh/v1/subscriptions?organization_id=${polarOrgId}&customer_id=${customerId}`

    console.log("Sync - Looking up subscriptions:", subscriptionsApiUrl)

    const subscriptionsResponse = await fetch(subscriptionsApiUrl, {
      headers: {
        "Authorization": `Bearer ${polarToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!subscriptionsResponse.ok) {
      const errorText = await subscriptionsResponse.text()
      console.error("Sync - Subscriptions lookup failed:", errorText)
      return NextResponse.json({
        error: "Failed to look up subscriptions",
        details: errorText
      }, { status: 500 })
    }

    const subscriptionsData = await subscriptionsResponse.json()
    console.log("Sync - Subscriptions data:", JSON.stringify(subscriptionsData, null, 2))

    // Find active subscription
    const activeSubscription = subscriptionsData.items?.find(
      (sub: { status: string }) => sub.status === "active"
    )

    if (!activeSubscription) {
      // No active subscription - ensure user is on free tier
      await db
        .update(users)
        .set({
          subscriptionTier: "free",
          subscriptionId: null,
          tokens: Math.max(user.tokens, 3), // Keep existing tokens if more than free tier
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))

      return NextResponse.json({
        message: "No active subscription found",
        user: { id: user.id, email: user.email },
        subscriptions: subscriptionsData.items || []
      })
    }

    // Determine plan from product ID
    const productId = activeSubscription.product_id || activeSubscription.product?.id
    const plan = determinePlanFromProductId(productId)
    const planConfig = PRICING_PLANS.find((p) => p.id === plan)

    console.log("Sync - Active subscription:", {
      id: activeSubscription.id,
      status: activeSubscription.status,
      productId,
      plan
    })

    // Update or create subscription record
    const existingSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.polarSubscriptionId, activeSubscription.id))
      .limit(1)

    const startDate = activeSubscription.current_period_start
      ? new Date(activeSubscription.current_period_start)
      : new Date()
    const endDate = activeSubscription.current_period_end
      ? new Date(activeSubscription.current_period_end)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    if (existingSubscription.length > 0) {
      await db
        .update(subscriptions)
        .set({
          status: activeSubscription.status as "active" | "cancelled" | "past_due",
          plan,
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.polarSubscriptionId, activeSubscription.id))
    } else {
      await db.insert(subscriptions).values({
        userId: user.id,
        polarSubscriptionId: activeSubscription.id,
        plan,
        status: activeSubscription.status as "active" | "cancelled" | "past_due",
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
      })
    }

    // Update user
    const previousTier = user.subscriptionTier
    const tokensToAdd = planConfig ? planConfig.tokens : 0

    await db
      .update(users)
      .set({
        subscriptionTier: plan,
        subscriptionId: activeSubscription.id,
        tokens: tokensToAdd,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    // Record transaction if tier changed
    if (previousTier !== plan && planConfig) {
      await db.insert(tokenTransactions).values({
        userId: user.id,
        amount: planConfig.tokens,
        type: "subscription_reset",
        description: `Synced subscription to ${plan} plan`,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Subscription synced successfully",
      previousTier,
      newTier: plan,
      subscription: {
        id: activeSubscription.id,
        status: activeSubscription.status,
        plan,
        tokens: tokensToAdd
      }
    })
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json(
      { error: "Failed to sync subscription" },
      { status: 500 }
    )
  }
}

function determinePlanFromProductId(productId: string): SubscriptionTier {
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
