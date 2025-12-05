import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db, users, apiKeys } from "@/lib/db"
import { eq } from "drizzle-orm"
import { randomBytes } from "crypto"

// Generate a secure API key
function generateApiKey(): string {
  const prefix = "lhe_"
  const key = randomBytes(32).toString("hex")
  return `${prefix}${key}`
}

// GET - List user's API keys
export async function GET() {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's API keys (mask the actual key for security)
    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        key: apiKeys.key,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, user.id))

    // Mask keys - only show first 8 and last 4 characters
    const maskedKeys = keys.map((k) => ({
      ...k,
      key: `${k.key.slice(0, 8)}...${k.key.slice(-4)}`,
    }))

    return NextResponse.json({ keys: maskedKeys })
  } catch (error) {
    console.error("Error fetching API keys:", error)
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 })
  }
}

// POST - Create a new API key
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name = "Desktop App" } = body

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user already has an API key (limit to 1 for simplicity)
    const existingKeys = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, user.id))

    if (existingKeys.length >= 3) {
      return NextResponse.json(
        { error: "Maximum 3 API keys allowed. Please delete an existing key first." },
        { status: 400 }
      )
    }

    // Generate new API key
    const key = generateApiKey()

    // Save to database
    const [newKey] = await db
      .insert(apiKeys)
      .values({
        userId: user.id,
        key,
        name,
      })
      .returning()

    // Return the full key only on creation (user must save it)
    return NextResponse.json({
      success: true,
      key: {
        id: newKey.id,
        name: newKey.name,
        key: key, // Full key shown only on creation
        createdAt: newKey.createdAt,
      },
      message: "API key created. Save this key - it won't be shown again!",
    })
  } catch (error) {
    console.error("Error creating API key:", error)
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 })
  }
}

// DELETE - Delete an API key
export async function DELETE(req: Request) {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const keyId = searchParams.get("id")

    if (!keyId) {
      return NextResponse.json({ error: "Key ID required" }, { status: 400 })
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete the key (only if it belongs to the user)
    const [deletedKey] = await db
      .delete(apiKeys)
      .where(eq(apiKeys.id, keyId))
      .returning()

    if (!deletedKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "API key deleted" })
  } catch (error) {
    console.error("Error deleting API key:", error)
    return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 })
  }
}
