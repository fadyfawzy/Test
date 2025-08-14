import { NextResponse } from "next/server"
import { getUsers, getQuestions, getExamAttempts } from "@/lib/database"

export async function GET() {
  try {
    const [users, questions, examAttempts] = await Promise.all([getUsers(), getQuestions(), getExamAttempts()])

    // Calculate statistics from real data
    const completedAttempts = examAttempts.filter((attempt) => attempt.completed_at)
    const successfulAttempts = completedAttempts.filter((attempt) => attempt.final_score && attempt.final_score >= 70)

    const stats = {
      totalUsers: users.length,
      totalQuestions: questions.length,
      completedExams: completedAttempts.length,
      successRate:
        completedAttempts.length > 0 ? Math.round((successfulAttempts.length / completedAttempts.length) * 100) : 0,
    }

    // Generate recent activity from real exam attempts
    const recentAttempts = completedAttempts
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
      .slice(0, 4)
      .map((attempt) => {
        const completedTime = new Date(attempt.completed_at!)
        const now = new Date()
        const diffMinutes = Math.floor((now.getTime() - completedTime.getTime()) / (1000 * 60))

        let timeText = ""
        if (diffMinutes < 1) {
          timeText = "الآن"
        } else if (diffMinutes < 60) {
          timeText = `منذ ${diffMinutes} دقيقة`
        } else if (diffMinutes < 1440) {
          const hours = Math.floor(diffMinutes / 60)
          timeText = `منذ ${hours} ساعة`
        } else {
          const days = Math.floor(diffMinutes / 1440)
          timeText = `منذ ${days} يوم`
        }

        return {
          user: (attempt as any).users?.name || "مستخدم غير معروف",
          action: `أكمل امتحان ${(attempt as any).exams?.title || "امتحان"}`,
          time: timeText,
        }
      })

    // Calculate category distribution from real questions
    const categories = ["براعم وذو الهمم", "أشبال وزهرات", "كشافة ومرشدات", "متقدم ورائدات", "جوالة ودليلات"]
    const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-red-500"]

    const categoryDistribution = categories.map((category, index) => {
      const categoryQuestions = questions.filter((q) => q.category === category)
      return {
        name: category,
        count: categoryQuestions.length,
        color: colors[index],
      }
    })

    return NextResponse.json({
      stats,
      recentActivity: recentAttempts,
      categoryStats: categoryDistribution,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
