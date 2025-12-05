import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { generateAIResponse, generateVisionAIResponse } from "@/lib/ai/openai"
import { ajAI } from "@/lib/arcjet"
import { db, users, questions } from "@/lib/db"
import { eq } from "drizzle-orm"
import type { ProgrammingLanguage } from "@/types"

// Desktop API endpoint - requires Clerk auth
// Saves questions to history for authenticated users
export async function POST(req: Request) {
  try {
    // Arcjet protection - rate limiting only
    const decision = await ajAI.protect(req, { requested: 1 })

    if (decision.isDenied()) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      )
    }

    // Require authentication
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json(
        { error: "Please sign in to use the assistant" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { question, language, screenshot } = body as {
      question: string
      language: ProgrammingLanguage
      screenshot?: string // Base64 image data
    }

    // If we have a screenshot, use vision AI even without a question
    if (!question?.trim() && !screenshot) {
      return NextResponse.json(
        { error: "Question or screenshot is required" },
        { status: 400 }
      )
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1)

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please sign out and sign in again." },
        { status: 404 }
      )
    }

    // Check token balance
    if (user.tokens <= 0) {
      return NextResponse.json(
        { error: "No tokens remaining. Please upgrade your plan." },
        { status: 403 }
      )
    }

    let aiResponse
    const inputType = screenshot ? "screenshot" : "text"
    const inputContent = question || "[Screenshot analysis]"

    // Use vision AI if screenshot is provided
    if (screenshot) {
      aiResponse = await generateVisionAIResponse(
        question || "",
        screenshot,
        language || "javascript"
      )
    } else {
      // Generate AI response using FREE model (text only)
      aiResponse = await generateAIResponse(question, language || "javascript")
    }

    // Save question to history
    await db.insert(questions).values({
      userId: user.id,
      inputType,
      inputContent,
      programmingLanguage: language || "javascript",
      response: JSON.stringify(aiResponse),
      tokensUsed: 1,
    })

    // Deduct token
    await db
      .update(users)
      .set({
        tokens: user.tokens - 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    return NextResponse.json({
      success: true,
      response: aiResponse,
      tokensRemaining: user.tokens - 1,
    })
  } catch (error) {
    console.error("Desktop AI Ask Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to generate response: ${errorMessage}` },
      { status: 500 }
    )
  }
}
