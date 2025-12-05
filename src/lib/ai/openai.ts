import OpenAI from "openai"
import type { AIResponse, ProgrammingLanguage } from "@/types"

// Use OpenRouter as the API provider
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://techscreen-clone.vercel.app",
    "X-Title": "TechScreen AI",
  },
})

// Free models available on OpenRouter (add :free suffix)
// Best free models for coding:
// - amazon/nova-2-lite-v1:free - fast and capable
// - deepseek/deepseek-chat-v3-0324:free - excellent for coding
// - meta-llama/llama-4-maverick:free - 400B MoE model
const FREE_MODEL = "amazon/nova-2-lite-v1:free"

const SYSTEM_PROMPT = `You are an expert programming assistant helping someone during a technical interview.
Your role is to provide clear, accurate, and helpful responses to coding questions.

For each question, structure your response in this format:
1. THOUGHTS: Brief analysis of the problem and approach (2-3 sentences)
2. CODE: The solution code (if applicable)
3. KEY_POINTS: 3-5 bullet points explaining the key concepts

Guidelines:
- Be concise but thorough
- Write clean, well-commented code
- Explain time and space complexity when relevant
- Mention edge cases to consider
- If the question is unclear, make reasonable assumptions and state them

Remember: The user is in an interview setting, so be quick and precise.`

export async function generateAIResponse(
  question: string,
  language: ProgrammingLanguage
): Promise<AIResponse> {
  const languageContext = language !== "other"
    ? `The user is working with ${language}. Provide code examples in ${language}.`
    : "Provide code examples in the most appropriate language."

  const response = await openai.chat.completions.create({
    model: FREE_MODEL, // Using free model via OpenRouter
    messages: [
      {
        role: "system",
        content: `${SYSTEM_PROMPT}\n\n${languageContext}`
      },
      {
        role: "user",
        content: question
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  })

  const content = response.choices[0]?.message?.content || ""

  return parseAIResponse(content, language)
}

function parseAIResponse(content: string, language: ProgrammingLanguage): AIResponse {
  // Try to parse structured response
  const thoughtsMatch = content.match(/(?:THOUGHTS?:?\s*)([\s\S]*?)(?=CODE:|KEY[_\s]?POINTS?:|$)/i)
  const codeMatch = content.match(/(?:CODE:?\s*```[\w]*\n?)([\s\S]*?)(?:```)/i) ||
                    content.match(/(?:CODE:?\s*)([\s\S]*?)(?=KEY[_\s]?POINTS?:|$)/i)
  const keyPointsMatch = content.match(/(?:KEY[_\s]?POINTS?:?\s*)([\s\S]*?)$/i)

  const thoughts = thoughtsMatch?.[1]?.trim() || content.split("\n\n")[0] || content

  let code = codeMatch?.[1]?.trim() || null
  if (code) {
    // Clean up code block markers if present
    code = code.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "")
  }

  const keyPointsText = keyPointsMatch?.[1]?.trim() || ""
  const keyPoints = keyPointsText
    .split(/\n[-•*]\s*|\n\d+\.\s*/)
    .map((point) => point.trim())
    .filter((point) => point.length > 0)

  return {
    thoughts,
    code,
    keyPoints: keyPoints.length > 0 ? keyPoints : ["Review the solution above", "Consider edge cases", "Test with sample inputs"],
    language,
  }
}

export async function generateAIResponseStream(
  question: string,
  language: ProgrammingLanguage
) {
  const languageContext = language !== "other"
    ? `The user is working with ${language}. Provide code examples in ${language}.`
    : "Provide code examples in the most appropriate language."

  const stream = await openai.chat.completions.create({
    model: FREE_MODEL, // Using free model via OpenRouter
    messages: [
      {
        role: "system",
        content: `${SYSTEM_PROMPT}\n\n${languageContext}`
      },
      {
        role: "user",
        content: question
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
    stream: true,
  })

  return stream
}

// Free vision model on OpenRouter
// Options: google/gemini-2.0-flash-exp:free (rate limited), nvidia/nemotron-nano-12b-v2-vl:free
// Using nvidia/nemotron-nano-12b-v2-vl:free - dedicated vision-language model with good rate limits
const FREE_VISION_MODEL = "nvidia/nemotron-nano-12b-v2-vl:free"

const VISION_SYSTEM_PROMPT = `You are an expert programming assistant helping someone during a technical interview.
You can see screenshots of their screen which may contain:
- Coding problems/questions
- Code they're working on
- Error messages
- Technical documentation

Analyze the screenshot and help them understand and solve the problem.

For each question, structure your response in this format:
1. THOUGHTS: What you see in the screenshot and your analysis (2-3 sentences)
2. CODE: The solution code (if applicable)
3. KEY_POINTS: 3-5 bullet points explaining the key concepts

Guidelines:
- First describe what you see in the screenshot
- If there's a coding problem, provide a clear solution
- If there's an error, explain the cause and fix
- Be concise but thorough
- Write clean, well-commented code

Remember: The user is in an interview setting, so be quick and precise.`

export async function generateVisionAIResponse(
  question: string,
  screenshotBase64: string,
  language: ProgrammingLanguage
): Promise<AIResponse> {
  // Check if API key is configured
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured")
  }

  const languageContext = language !== "other"
    ? `The user is working with ${language}. Provide code examples in ${language}.`
    : "Provide code examples in the most appropriate language."

  // Build content array with text and image
  const userContent: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = []

  // Add the question text first (some models prefer text before image)
  const questionText = question?.trim()
    ? question
    : "Please analyze this screenshot and help me understand/solve what's shown. If it's a coding problem, provide the solution."

  userContent.push({
    type: "text",
    text: questionText
  })

  // Add the screenshot image
  // Ensure proper data URL format
  const imageUrl = screenshotBase64.startsWith("data:")
    ? screenshotBase64
    : `data:image/png;base64,${screenshotBase64}`

  userContent.push({
    type: "image_url",
    image_url: {
      url: imageUrl
    }
  })

  try {
    const response = await openai.chat.completions.create({
      model: FREE_VISION_MODEL,
      messages: [
        {
          role: "system",
          content: `${VISION_SYSTEM_PROMPT}\n\n${languageContext}`
        },
        {
          role: "user",
          content: userContent
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content || ""

    if (!content) {
      throw new Error("Empty response from vision model")
    }

    return parseAIResponse(content, language)
  } catch (error) {
    console.error("Vision AI error:", error)
    throw error
  }
}
