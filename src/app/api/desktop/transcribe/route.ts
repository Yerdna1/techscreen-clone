import { NextResponse } from "next/server"

// Use Groq for fast, free Whisper transcription
// Groq offers whisper-large-v3 for free with very fast inference
const GROQ_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get("audio") as File | null

    if (!audioFile) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 }
      )
    }

    // Check if GROQ_API_KEY is set
    if (!process.env.GROQ_API_KEY) {
      // Fallback: return error asking for key
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured. Please add it to environment variables." },
        { status: 500 }
      )
    }

    // Create form data for Groq API
    const groqFormData = new FormData()
    groqFormData.append("file", audioFile)
    groqFormData.append("model", "whisper-large-v3")
    groqFormData.append("response_format", "json")
    groqFormData.append("language", "en") // Force English transcription

    // Send to Groq Whisper API
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: groqFormData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Groq API Error:", error)
      return NextResponse.json(
        { error: "Transcription failed" },
        { status: 500 }
      )
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      text: result.text,
    })
  } catch (error) {
    console.error("Transcription Error:", error)
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    )
  }
}
