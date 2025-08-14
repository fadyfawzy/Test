import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create Supabase client for API routes
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    const { data: users, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ users: users || [] })
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
      const { data: newUser, error } = await supabase
        .from("users")
        .insert([
          {
            name,
            email,
            role,
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
          action: "add_user",
          resource_type: "users",
          resource_id: newUser.id,
          details: { user_data: { name, email, role } },
          created_at: new Date().toISOString(),
        },
      ])

      return NextResponse.json({ user: newUser })
    }

    if (action === "delete") {
      const { userIds } = data
      const { error } = await supabase.from("users").delete().in("id", userIds)

      if (error) {
        throw error
      }

      // Log admin action
      await supabase.from("admin_logs").insert([
        {
          admin_id: "current-admin-id", // In real app, get from auth context
          action: userIds.length > 1 ? "bulk_delete_users" : "delete_user",
          resource_type: "users",
          resource_id: userIds.length === 1 ? userIds[0] : null,
          details: { deleted_count: userIds.length, user_ids: userIds },
          created_at: new Date().toISOString(),
        },
      ])

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error processing user request:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
