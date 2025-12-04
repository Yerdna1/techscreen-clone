import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { generateAIResponse } from "@/lib/ai/openai"
import { db, users, questions, tokenTransactions } from "@/lib/db"
import { eq } from "drizzle-orm"
import { ajAI } from "@/lib/arcjet"
import type { ProgrammingLanguage, InputType } from "@/types"

export async function POST(request: NextRequest) {
  try {
    // Arcjet protection - rate limiting and bot detection
    const decision = await ajAI.protect(request)

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json(
          { error: "Too many requests. Please slow down." },
          { status: 429 }
        )
      }
      if (decision.reason.isBot()) {
        return NextResponse.json(
          { error: "Bot detected" },
          { status: 403 }
        )
      }
      return NextResponse.json(
        { error: "Request blocked" },
        { status: 403 }
      )
    }

    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { question, language, inputType } = body as {
      question: string
      language: ProgrammingLanguage
      inputType: InputType
    }

    if (!question?.trim()) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      )
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1)

    if (!user) {
      // Create user if doesn't exist
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: userId,
          email: "user@example.com", // Will be updated from Clerk webhook
          tokens: 3,
        })
        .returning()

      if (!newUser) {
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        )
      }
    }

    const currentUser = user || (await db.select().from(users).where(eq(users.clerkId, userId)).limit(1))[0]

    // Check tokens
    if (currentUser.tokens <= 0) {
      return NextResponse.json(
        { error: "No tokens remaining. Please upgrade your plan." },
        { status: 402 }
      )
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(question, language || "javascript")

    // Deduct token and save question
    await db.transaction(async (tx) => {
      // Deduct token
      await tx
        .update(users)
        .set({ tokens: currentUser.tokens - 1 })
        .where(eq(users.id, currentUser.id))

      // Save question
      await tx.insert(questions).values({
        userId: currentUser.id,
        inputType: inputType || "text",
        inputContent: question,
        programmingLanguage: language || "javascript",
        response: JSON.stringify(aiResponse),
        tokensUsed: 1,
      })

      // Record transaction
      await tx.insert(tokenTransactions).values({
        userId: currentUser.id,
        amount: -1,
        type: "usage",
        description: `AI response for ${language || "javascript"} question`,
      })
    })

    return NextResponse.json({
      success: true,
      response: aiResponse,
      tokensRemaining: currentUser.tokens - 1,
    })
  } catch (error) {
    console.error("AI Ask Error:", error)
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    )
  }
}
