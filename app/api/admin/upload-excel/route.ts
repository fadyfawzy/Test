import { type NextRequest, NextResponse } from "next/server"
import { addUser } from "@/lib/database"

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
        { name: "أحمد محمد", email: "ahmed@example.com", role: "student" as const },
        { name: "فاطمة علي", email: "fatima@example.com", role: "student" as const },
        { name: "محمد حسن", email: "mohammed@example.com", role: "student" as const },
      ]

      for (const userData of sampleUsers) {
        try {
          await addUser(userData)
          count++
        } catch (error) {
          console.error("Error adding user:", error)
        }
      }
    } else if (type === "questions") {
      // Simulate adding questions from Excel
      // In real implementation, parse Excel and extract question data
      count = 5 // Simulated count
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
