import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create Supabase client for API routes
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Read file content
    const buffer = await file.arrayBuffer()
    const content = new TextDecoder().decode(buffer)

    // For demo purposes, we'll simulate processing
    // In a real implementation, you'd use a library like xlsx to parse Excel files

    let count = 0

    if (type === "users") {
      // Simulate adding users from Excel
      // In real implementation, parse Excel and extract user data
      const sampleUsers = [
        { name: "أحمد محمد", email: "ahmed@example.com", role: "student" },
        { name: "فاطمة علي", email: "fatima@example.com", role: "student" },
        { name: "محمد حسن", email: "mohammed@example.com", role: "student" },
      ]

      for (const userData of sampleUsers) {
        try {
          const { data: newUser, error } = await supabase
            .from("users")
            .insert([
              {
                name: userData.name,
                email: userData.email,
                role: userData.role,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ])
            .select()
            .single()

          if (error) {
            console.error("Error adding user:", error)
            continue
          }

          // Log admin action
          await supabase.from("admin_logs").insert([
            {
              user_id: "current-admin-id", // In real app, get from auth context
              action: "add_user_excel",
              resource_type: "users",
              resource_id: newUser.id,
              details: { user_data: userData, source: "excel_upload" },
              created_at: new Date().toISOString(),
            },
          ])

          count++
        } catch (error) {
          console.error("Error adding user:", error)
        }
      }
    } else if (type === "questions") {
      // Simulate adding questions from Excel
      // In real implementation, parse Excel and extract question data
      const sampleQuestions = [
        {
          question_text: "ما هو لون العلم السعودي؟",
          question_type: "multiple_choice",
          options: JSON.stringify(["أخضر", "أحمر", "أزرق", "أبيض"]),
          correct_answer: "أخضر",
          category: "كشافة ومرشدات",
          points: 1,
          difficulty: "easy",
        },
        {
          question_text: "الكشافة حركة تربوية تطوعية",
          question_type: "true_false",
          options: JSON.stringify(["صحيح", "خطأ"]),
          correct_answer: "صحيح",
          category: "كشافة ومرشدات",
          points: 1,
          difficulty: "easy",
        },
      ]

      for (const questionData of sampleQuestions) {
        try {
          const { data: newQuestion, error } = await supabase
            .from("questions")
            .insert([
              {
                ...questionData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ])
            .select()
            .single()

          if (error) {
            console.error("Error adding question:", error)
            continue
          }

          // Log admin action
          await supabase.from("admin_logs").insert([
            {
              user_id: "current-admin-id", // In real app, get from auth context
              action: "add_question_excel",
              resource_type: "questions",
              resource_id: newQuestion.id,
              details: { question_data: questionData, source: "excel_upload" },
              created_at: new Date().toISOString(),
            },
          ])

          count++
        } catch (error) {
          console.error("Error adding question:", error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      count,
      message: `تم رفع ${count} عنصر بنجاح`,
    })
  } catch (error) {
    console.error("Error processing upload:", error)
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 })
  }
}
