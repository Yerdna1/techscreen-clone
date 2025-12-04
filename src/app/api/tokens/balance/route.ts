import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db, users } from "@/lib/db"
import { eq } from "drizzle-orm"
import { aj } from "@/lib/arcjet"

export async function GET(request: NextRequest) {
  try {
    // Arcjet protection
    const decision = await aj.protect(request)

    if (decision.isDenied()) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      )
    }

    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const [user] = await db
      .select({
        tokens: users.tokens,
        subscriptionTier: users.subscriptionTier,
      })
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1)

    if (!user) {
      // Create user if doesn't exist
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: userId,
          email: "user@example.com",
          tokens: 3,
        })
        .returning({
          tokens: users.tokens,
          subscriptionTier: users.subscriptionTier,
        })

      return NextResponse.json({
        tokens: newUser?.tokens || 3,
        subscriptionTier: newUser?.subscriptionTier || "free",
      })
    }

    return NextResponse.json({
      tokens: user.tokens,
      subscriptionTier: user.subscriptionTier,
    })
  } catch (error) {
    console.error("Token balance error:", error)
    return NextResponse.json(
      { error: "Failed to get token balance" },
      { status: 500 }
    )
  }
}
