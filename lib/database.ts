import { createClient } from "./supabase/server"

// Database types
export interface User {
  id: string
  email: string
  name: string
  role: "student" | "admin" | "leader"
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  question_text: string
  question_type: "multiple_choice" | "true_false" | "essay"
  options?: string[]
  correct_answer?: string
  points: number
  category?: string
  difficulty: "easy" | "medium" | "hard"
  created_at: string
  updated_at: string
}

export interface Exam {
  id: string
  title: string
  description?: string
  duration_minutes: number
  passing_score: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ExamAttempt {
  id: string
  user_id: string
  exam_id: string
  started_at: string
  completed_at?: string
  auto_score: number
  manual_score?: number
  final_score?: number
  is_locked: boolean
  leader_evaluation?: any
  created_at: string
  updated_at: string
}

// Database operations
export async function getUsers() {
  const supabase = createClient()
  const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data as User[]
}

export async function getQuestions() {
  const supabase = createClient()
  const { data, error } = await supabase.from("questions").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data as Question[]
}

export async function getExams() {
  const supabase = createClient()
  const { data, error } = await supabase.from("exams").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data as Exam[]
}

export async function getExamAttempts() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("exam_attempts")
    .select(`
      *,
      users(name, email),
      exams(title)
    `)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function addUser(userData: { name: string; email: string; role: "student" | "admin" | "leader" }) {
  const supabase = createClient()
  const { data, error } = await supabase.from("users").insert([userData]).select().single()

  if (error) throw error
  return data as User
}

export async function addQuestion(questionData: {
  question_text: string
  question_type: "multiple_choice" | "true_false" | "essay"
  options?: string[]
  correct_answer?: string
  points: number
  category?: string
  difficulty: "easy" | "medium" | "hard"
}) {
  const supabase = createClient()
  const { data, error } = await supabase.from("questions").insert([questionData]).select().single()

  if (error) throw error
  return data as Question
}

export async function deleteUsers(userIds: string[]) {
  const supabase = createClient()
  const { error } = await supabase.from("users").delete().in("id", userIds)

  if (error) throw error
}

export async function deleteQuestions(questionIds: string[]) {
  const supabase = createClient()
  const { error } = await supabase.from("questions").delete().in("id", questionIds)

  if (error) throw error
}

export async function logAdminAction(
  userId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: any,
) {
  const supabase = createClient()
  const { error } = await supabase.from("admin_logs").insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details,
  })

  if (error) console.error("Failed to log admin action:", error)
}
