import { NextResponse } from "next/server"
import { getExamAttempts } from "@/lib/database"

export async function GET() {
  try {
    const attempts = await getExamAttempts()

    // Transform database data to match frontend interface
    const results = attempts.map((attempt: any) => ({
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

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error fetching results:", error)
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 })
  }
}
