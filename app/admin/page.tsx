"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, HelpCircle, FileText, TrendingUp, Loader2 } from "lucide-react"

interface DashboardStats {
  totalUsers: number
  totalQuestions: number
  completedExams: number
  successRate: number
}

interface RecentActivity {
  user: string
  action: string
  time: string
}

interface CategoryStats {
  name: string
  count: number
  color: string
}

interface DashboardData {
  stats: DashboardStats
  recentActivity: RecentActivity[]
  categoryStats: CategoryStats[]
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: {
      totalUsers: 0,
      totalQuestions: 0,
      completedExams: 0,
      successRate: 0,
    },
    recentActivity: [],
    categoryStats: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/admin/dashboard")

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data")
        }

        const data = await response.json()
        setDashboardData(data)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setError("فشل في تحميل بيانات لوحة التحكم")
        setDashboardData({
          stats: {
            totalUsers: 0,
            totalQuestions: 0,
            completedExams: 0,
            successRate: 0,
          },
          recentActivity: [],
          categoryStats: [],
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const statsCards = [
    {
      title: "إجمالي المستخدمين",
      value: dashboardData.stats.totalUsers.toLocaleString(),
      description: "مستخدم مسجل",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "الأسئلة المتاحة",
      value: dashboardData.stats.totalQuestions.toLocaleString(),
      description: "سؤال في النظام",
      icon: HelpCircle,
      color: "text-green-600",
    },
    {
      title: "الامتحانات المكتملة",
      value: dashboardData.stats.completedExams.toLocaleString(),
      description: "امتحان مكتمل",
      icon: FileText,
      color: "text-purple-600",
    },
    {
      title: "معدل النجاح",
      value: `${dashboardData.stats.successRate}%`,
      description: "من إجمالي الامتحانات",
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ]

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">نظرة عامة</h1>
          <p className="text-muted-foreground">مرحباً بك في لوحة تحكم منصة الامتحانات</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>جاري تحميل البيانات...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">نظرة عامة</h1>
          <p className="text-muted-foreground">مرحباً بك في لوحة تحكم منصة الامتحانات</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-2">{error}</p>
            <button onClick={() => window.location.reload()} className="text-blue-600 hover:underline">
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">نظرة عامة</h1>
        <p className="text-muted-foreground">مرحباً بك في لوحة تحكم منصة الامتحانات</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>النشاط الأخير</CardTitle>
            <CardDescription>آخر الامتحانات المكتملة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 space-x-reverse">
                    <div className="h-2 w-2 bg-blue-600 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.user}</p>
                      <p className="text-xs text-muted-foreground">{activity.action}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">{activity.time}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">لا توجد امتحانات مكتملة بعد</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الفئات</CardTitle>
            <CardDescription>توزيع الأسئلة حسب الفئة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.categoryStats.map((category) => (
                <div key={category.name} className="flex items-center space-x-4 space-x-reverse">
                  <div className={`h-3 w-3 rounded-full ${category.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{category.name}</p>
                  </div>
                  <div className="text-sm font-bold">{category.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
