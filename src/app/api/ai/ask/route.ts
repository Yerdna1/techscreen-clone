import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { generateAIResponse } from "@/lib/ai/openai"
import { ajAI } from "@/lib/arcjet"
import type { ProgrammingLanguage, InputType } from "@/types"

// Simplified API that uses free model without database
// TODO: Re-enable database integration when database is properly set up
export async function POST(req: Request) {
  try {
    // Arcjet protection - rate limiting and bot detection
    const decision = await ajAI.protect(req, { requested: 1 })

    if (decision.isDenied()) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      )
    }

    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { question, language } = body as {
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

    // Generate AI response using free model
    const aiResponse = await generateAIResponse(question, language || "javascript")

    return NextResponse.json({
      success: true,
      response: aiResponse,
      tokensRemaining: 999, // Unlimited for now with free model
    })
  } catch (error) {
    console.error("AI Ask Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to generate response: ${errorMessage}` },
      { status: 500 }
    )
  }
}
