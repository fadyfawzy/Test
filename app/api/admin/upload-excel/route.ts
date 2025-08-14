import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create Supabase client for API routes
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Helper function to parse CSV content
function parseCSV(content: string): any[] {
  const lines = content.trim().split("\n")
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
    if (values.length === headers.length) {
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index]
      })
      rows.push(row)
    }
  }

  return rows
}

// Helper function to hash password (simple implementation)
function hashPassword(password: string): string {
  // In production, use proper password hashing like bcrypt
  return Buffer.from(password).toString("base64")
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string

    if (!file) {
      return NextResponse.json({ error: "لم يتم توفير ملف" }, { status: 400 })
    }

    // Read file content
    const buffer = await file.arrayBuffer()
    const content = new TextDecoder("utf-8").decode(buffer)

    // Parse CSV content
    const rows = parseCSV(content)

    if (rows.length === 0) {
      return NextResponse.json({ error: "الملف فارغ أو تنسيق غير صحيح" }, { status: 400 })
    }

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    if (type === "users") {
      // Process users CSV with format: Code, Name, Church, Category, Password, Email
      for (const row of rows) {
        try {
          // Validate required fields
          if (!row.Code || !row.Name || !row.Email || !row.Password) {
            errors.push(`صف مفقود بيانات مطلوبة: ${row.Name || "غير محدد"}`)
            errorCount++
            continue
          }

          // Check if user already exists
          const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .or(`email.eq.${row.Email},code.eq.${row.Code}`)
            .single()

          if (existingUser) {
            errors.push(`المستخدم موجود بالفعل: ${row.Email}`)
            errorCount++
            continue
          }

          // Insert new user
          const { data: newUser, error } = await supabase
            .from("users")
            .insert([
              {
                code: row.Code,
                name: row.Name,
                church: row.Church || null,
                category: row.Category || null,
                password_hash: hashPassword(row.Password),
                email: row.Email,
                role: "student",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ])
            .select()
            .single()

          if (error) {
            errors.push(`خطأ في إضافة المستخدم ${row.Name}: ${error.message}`)
            errorCount++
            continue
          }

          // Log admin action
          await supabase.from("admin_logs").insert([
            {
              action: "add_user_csv",
              resource_type: "users",
              resource_id: newUser.id,
              details: {
                user_data: {
                  code: row.Code,
                  name: row.Name,
                  email: row.Email,
                  church: row.Church,
                  category: row.Category,
                },
                source: "csv_upload",
              },
              created_at: new Date().toISOString(),
            },
          ])

          successCount++
        } catch (error) {
          errors.push(`خطأ في معالجة المستخدم ${row.Name}: ${error}`)
          errorCount++
        }
      }
    } else if (type === "questions") {
      // Process questions CSV with format: Category, Type, Question, Question EN, Option 1-4, Correct Answer, Image
      for (const row of rows) {
        try {
          // Validate required fields
          if (!row.Question || !row.Category || !row.Type) {
            errors.push(`سؤال مفقود بيانات مطلوبة: ${row.Question || "غير محدد"}`)
            errorCount++
            continue
          }

          // Prepare options for multiple choice questions
          let options = null
          let correctAnswer = row["Correct Answer"]

          if (row.Type === "mcq") {
            const optionsList = [row["Option 1"], row["Option 2"], row["Option 3"], row["Option 4"]].filter(
              (opt) => opt && opt.trim(),
            )

            if (optionsList.length < 2) {
              errors.push(`السؤال يحتاج خيارات كافية: ${row.Question}`)
              errorCount++
              continue
            }

            options = JSON.stringify(optionsList)

            // Convert correct answer number to actual text
            const answerIndex = Number.parseInt(correctAnswer) - 1
            if (answerIndex >= 0 && answerIndex < optionsList.length) {
              correctAnswer = optionsList[answerIndex]
            }
          }

          // Insert new question
          const { data: newQuestion, error } = await supabase
            .from("questions")
            .insert([
              {
                question_text: row.Question,
                question_text_en: row["Question EN"] || null,
                question_type: row.Type === "mcq" ? "multiple_choice" : row.Type,
                options: options,
                correct_answer: correctAnswer,
                category: row.Category,
                image_url: row.Image || null,
                points: 1,
                difficulty: "medium",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ])
            .select()
            .single()

          if (error) {
            errors.push(`خطأ في إضافة السؤال: ${error.message}`)
            errorCount++
            continue
          }

          // Log admin action
          await supabase.from("admin_logs").insert([
            {
              action: "add_question_csv",
              resource_type: "questions",
              resource_id: newQuestion.id,
              details: {
                question_data: {
                  question: row.Question,
                  category: row.Category,
                  type: row.Type,
                },
                source: "csv_upload",
              },
              created_at: new Date().toISOString(),
            },
          ])

          successCount++
        } catch (error) {
          errors.push(`خطأ في معالجة السؤال: ${error}`)
          errorCount++
        }
      }
    } else {
      return NextResponse.json({ error: "نوع ملف غير مدعوم" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      successCount,
      errorCount,
      errors: errors.slice(0, 10), // Limit errors shown
      message: `تم رفع ${successCount} عنصر بنجاح${errorCount > 0 ? ` مع ${errorCount} أخطاء` : ""}`,
    })
  } catch (error) {
    console.error("Error processing upload:", error)
    return NextResponse.json({ error: "فشل في معالجة الملف" }, { status: 500 })
  }
}
