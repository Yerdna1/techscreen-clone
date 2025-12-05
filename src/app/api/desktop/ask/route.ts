import { NextResponse } from "next/server"
import { generateAIResponse, generateVisionAIResponse } from "@/lib/ai/openai"
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

    let aiResponse

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

    return NextResponse.json({
      success: true,
      response: aiResponse,
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
