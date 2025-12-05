import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db, users, questions } from "@/lib/db"
import { eq, desc } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Get limit from query params (default 50)
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")

    // Fetch user's question history
    const questionHistory = await db
      .select({
        id: questions.id,
        inputType: questions.inputType,
        inputContent: questions.inputContent,
        programmingLanguage: questions.programmingLanguage,
        response: questions.response,
        tokensUsed: questions.tokensUsed,
        createdAt: questions.createdAt,
      })
      .from(questions)
      .where(eq(questions.userId, user.id))
      .orderBy(desc(questions.createdAt))
      .limit(limit)

    return NextResponse.json({
      history: questionHistory,
      total: questionHistory.length,
    })
  } catch (error) {
    console.error("History API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    )
  }
}

// Delete a question from history
export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { questionId } = await request.json()

    if (!questionId) {
      return NextResponse.json(
        { error: "Question ID required" },
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
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Verify the question belongs to this user and delete it
    const [question] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1)

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      )
    }

    if (question.userId !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to delete this question" },
        { status: 403 }
      )
    }

    await db
      .delete(questions)
      .where(eq(questions.id, questionId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete history error:", error)
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    )
  }
}
