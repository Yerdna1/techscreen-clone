import { NextResponse } from "next/server"
import { generateAIResponse } from "@/lib/ai/openai"
import { ajAI } from "@/lib/arcjet"
import type { ProgrammingLanguage } from "@/types"

// Public API endpoint for desktop app - no auth required
// Uses FREE model on OpenRouter so no token tracking needed
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

    const body = await req.json()
    const { question, language } = body as {
      question: string
      language: ProgrammingLanguage
    }

    if (!question?.trim()) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      )
    }

    // Generate AI response using FREE model
    const aiResponse = await generateAIResponse(question, language || "javascript")

    return NextResponse.json({
      success: true,
      response: aiResponse,
    })
  } catch (error) {
    console.error("Desktop AI Ask Error:", error)
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    )
  }
}
