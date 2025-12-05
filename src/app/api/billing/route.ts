import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db, users, subscriptions, tokenTransactions } from "@/lib/db"
import { eq, desc } from "drizzle-orm"

export async function GET() {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1)

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Get active subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1)

    // Get recent token transactions (billing history)
    const transactions = await db
      .select()
      .from(tokenTransactions)
      .where(eq(tokenTransactions.userId, user.id))
      .orderBy(desc(tokenTransactions.createdAt))
      .limit(10)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        tokens: user.tokens,
        subscriptionTier: user.subscriptionTier,
      },
      subscription: subscription ? {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
      } : null,
      transactions: transactions.map(t => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        description: t.description,
        createdAt: t.createdAt,
      })),
    })
  } catch (error) {
    console.error("Billing API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch billing data" },
      { status: 500 }
    )
  }
}
