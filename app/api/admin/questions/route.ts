import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create Supabase client for API routes
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    const { data: questions, error } = await supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ questions: questions || [] })
  } catch (error) {
    console.error("Error fetching questions:", error)
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, questionData, questionIds } = body

    if (action === "add") {
      const { data: newQuestion, error } = await supabase
        .from("questions")
        .insert([
          {
            category: questionData.category,
            question_type: questionData.question_type,
            question_text: questionData.question_text,
            options: questionData.options,
            correct_answer: questionData.correct_answer,
            points: questionData.points,
            difficulty: questionData.difficulty,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) {
        throw error
      }

      // Log admin action
      await supabase.from("admin_logs").insert([
        {
          admin_id: "current-admin-id", // In real app, get from auth context
          action: "add_question",
          resource_type: "questions",
          resource_id: newQuestion.id,
          details: { question_data: questionData },
          created_at: new Date().toISOString(),
        },
      ])

      return NextResponse.json({ question: newQuestion })
    }

    if (action === "delete") {
      const { error } = await supabase.from("questions").delete().in("id", questionIds)

      if (error) {
        throw error
      }

      // Log admin action
      await supabase.from("admin_logs").insert([
        {
          admin_id: "current-admin-id", // In real app, get from auth context
          action: questionIds.length > 1 ? "bulk_delete_questions" : "delete_question",
          resource_type: "questions",
          resource_id: questionIds.length === 1 ? questionIds[0] : null,
          details: {
            deleted_count: questionIds.length,
            question_ids: questionIds,
          },
          created_at: new Date().toISOString(),
        },
      ])

      return NextResponse.json({
        success: true,
        message: `Deleted ${questionIds.length} question(s)`,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error processing questions request:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
