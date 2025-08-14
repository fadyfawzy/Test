import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create Supabase client for API routes
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    // Fetch exam attempts with related user and exam data
    const { data: attempts, error } = await supabase
      .from("exam_attempts")
      .select(`
        *,
        users(name, email),
        exams(title, description)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    // Transform database data to match frontend interface
    const results = (attempts || []).map((attempt: any) => ({
      id: attempt.id,
      studentName: attempt.users?.name || "غير محدد",
      studentEmail: attempt.users?.email || "غير محدد",
      category: "كشافة ومرشدات", // You might want to add category to database
      examTitle: attempt.exams?.title || "امتحان غير محدد",
      startedAt: attempt.started_at,
      completedAt: attempt.completed_at,
      autoScore: attempt.auto_score || 0,
      manualScore: attempt.manual_score,
      finalScore: attempt.final_score,
      status: attempt.is_locked ? "locked" : attempt.completed_at ? "completed" : "in_progress",
      duration: attempt.completed_at
        ? Math.round((new Date(attempt.completed_at).getTime() - new Date(attempt.started_at).getTime()) / (1000 * 60))
        : 0,
      tabSwitches: 0, // You might want to add this to database
    }))

    // Calculate statistics
    const totalExams = results.length
    const completedExams = results.filter((r) => r.status === "completed").length
    const inProgressExams = results.filter((r) => r.status === "in_progress").length
    const averageScore =
      completedExams > 0
        ? Math.round(
            results.filter((r) => r.status === "completed").reduce((sum, r) => sum + (r.finalScore || 0), 0) /
              completedExams,
          )
        : 0

    return NextResponse.json({
      results,
      statistics: {
        totalExams,
        completedExams,
        inProgressExams,
        averageScore,
      },
    })
  } catch (error) {
    console.error("Error fetching results:", error)
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 })
  }
}
