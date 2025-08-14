import { type NextRequest, NextResponse } from "next/server"
import { getUsers, addUser, deleteUsers, logAdminAction } from "@/lib/database"

export async function GET() {
  try {
    const users = await getUsers()
    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    if (action === "add") {
      const { name, email, role } = data
      const newUser = await addUser({ name, email, role })

      await logAdminAction(
        "current-admin-id", // In real app, get from auth context
        "add_user",
        "users",
        newUser.id,
        { user_data: { name, email, role } },
      )

      return NextResponse.json({ user: newUser })
    }

    if (action === "delete") {
      const { userIds } = data
      await deleteUsers(userIds)

      await logAdminAction(
        "current-admin-id", // In real app, get from auth context
        userIds.length > 1 ? "bulk_delete_users" : "delete_user",
        "users",
        userIds.length === 1 ? userIds[0] : undefined,
        { deleted_count: userIds.length, user_ids: userIds },
      )

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error processing user request:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
