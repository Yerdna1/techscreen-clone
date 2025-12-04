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
    model: "anthropic/claude-sonnet-4", // Using Claude via OpenRouter
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
    model: "anthropic/claude-sonnet-4", // Using Claude via OpenRouter
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
