import { NextResponse } from "next/server"
import { db, users, apiKeys } from "@/lib/db"
import { eq } from "drizzle-orm"

// Validate API key and return user info
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { apiKey } = body as { apiKey: string }

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      )
    }

    // Find the API key
    const [keyRecord] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.key, apiKey))
      .limit(1)

    if (!keyRecord) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      )
    }

    // Get the user
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        tokens: users.tokens,
        subscriptionTier: users.subscriptionTier,
      })
      .from(users)
      .where(eq(users.id, keyRecord.userId))
      .limit(1)

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        tokens: user.tokens,
        subscriptionTier: user.subscriptionTier,
      },
    })
  } catch (error) {
    console.error("API Key Auth Error:", error)
    return NextResponse.json(
      { error: "Failed to validate API key" },
      { status: 500 }
    )
  }
}
