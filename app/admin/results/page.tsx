"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { FileText, Download, Upload, Search, Filter, Eye, TrendingUp, CheckCircle, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const categories = ["براعم وذو الهمم", "أشبال وزهرات", "كشافة ومرشدات", "متقدم ورائدات", "جوالة ودليلات"]

interface ExamResult {
  id: string
  studentName: string
  studentEmail: string
  category: string
  examTitle: string
  startedAt: string
  completedAt: string
  autoScore: number
  manualScore?: number
  finalScore?: number
  status: "completed" | "in_progress" | "locked"
  duration: number
  tabSwitches: number
}

export default function ResultsPage() {
  const [results, setResults] = useState<ExamResult[]>([])
  const [filteredResults, setFilteredResults] = useState<ExamResult[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadType, setUploadType] = useState<"questions" | "users">("questions")
  const { toast } = useToast()

  // Fetch results from API
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch("/api/admin/results")
        if (response.ok) {
          const data = await response.json()
          setResults(data)
          setFilteredResults(data)
        }
      } catch (error) {
        console.error("Error fetching results:", error)
        // Fallback to sample data for demo
        const sampleResults: ExamResult[] = [
          {
            id: "1",
            studentName: "أحمد محمد علي",
            studentEmail: "ahmed@example.com",
            category: "كشافة ومرشدات",
            examTitle: "امتحان الكشافة الأساسي",
            startedAt: "2025-01-14T10:00:00Z",
            completedAt: "2025-01-14T11:15:00Z",
            autoScore: 85,
            manualScore: 90,
            finalScore: 88,
            status: "locked",
            duration: 75,
            tabSwitches: 1,
          },
          {
            id: "2",
            studentName: "فاطمة أحمد حسن",
            studentEmail: "fatima@example.com",
            category: "مرشدات",
            examTitle: "امتحان المرشدات المتقدم",
            startedAt: "2025-01-14T14:00:00Z",
            completedAt: "2025-01-14T15:30:00Z",
            autoScore: 92,
            manualScore: 95,
            finalScore: 94,
            status: "locked",
            duration: 90,
            tabSwitches: 0,
          },
          {
            id: "3",
            studentName: "محمد عبد الله",
            studentEmail: "mohammed@example.com",
            category: "أشبال",
            examTitle: "امتحان الأشبال الأساسي",
            startedAt: "2025-01-14T16:00:00Z",
            completedAt: "",
            autoScore: 0,
            status: "in_progress",
            duration: 45,
            tabSwitches: 2,
          },
        ]
        setResults(sampleResults)
        setFilteredResults(sampleResults)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [])

  // Filter results
  useEffect(() => {
    let filtered = results

    if (selectedCategory !== "all") {
      filtered = filtered.filter((result) => result.category === selectedCategory)
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((result) => result.status === selectedStatus)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (result) =>
          result.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.examTitle.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredResults(filtered)
  }, [results, selectedCategory, selectedStatus, searchTerm])

  const handleFileUpload = async () => {
    if (!uploadFile) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملف Excel",
        variant: "destructive",
      })
      return
    }

    const formData = new FormData()
    formData.append("file", uploadFile)
    formData.append("type", uploadType)

    try {
      const response = await fetch("/api/admin/upload-excel", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "تم رفع الملف بنجاح",
          description: `تم إضافة ${result.count} عنصر جديد`,
        })
        setShowUploadDialog(false)
        setUploadFile(null)
        // Refresh data
        window.location.reload()
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      toast({
        title: "خطأ في رفع الملف",
        description: "يرجى التأكد من صيغة الملف والمحاولة مرة أخرى",
        variant: "destructive",
      })
    }
  }

  const exportResults = () => {
    // Create CSV content
    const headers = [
      "اسم الطالب",
      "البريد الإلكتروني",
      "الفئة",
      "عنوان الامتحان",
      "تاريخ البدء",
      "تاريخ الانتهاء",
      "الدرجة التلقائية",
      "تقييم القائد",
      "الدرجة النهائية",
      "الحالة",
    ]
    const csvContent = [
      headers.join(","),
      ...filteredResults.map((result) =>
        [
          result.studentName,
          result.studentEmail,
          result.category,
          result.examTitle,
          new Date(result.startedAt).toLocaleDateString("ar-EG"),
          result.completedAt ? new Date(result.completedAt).toLocaleDateString("ar-EG") : "غير مكتمل",
          result.autoScore,
          result.manualScore || "غير محدد",
          result.finalScore || "غير محدد",
          result.status === "completed" ? "مكتمل" : result.status === "locked" ? "مقفل" : "قيد التنفيذ",
        ].join(","),
      ),
    ].join("\n")

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `exam_results_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            مكتمل
          </Badge>
        )
      case "locked":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            مقفل
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            قيد التنفيذ
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800">{score}%</Badge>
    if (score >= 70) return <Badge className="bg-blue-100 text-blue-800">{score}%</Badge>
    if (score >= 50) return <Badge className="bg-yellow-100 text-yellow-800">{score}%</Badge>
    return <Badge className="bg-red-100 text-red-800">{score}%</Badge>
  }

  const stats = {
    total: results.length,
    completed: results.filter((r) => r.status === "locked").length,
    inProgress: results.filter((r) => r.status === "in_progress").length,
    averageScore:
      results.filter((r) => r.finalScore).reduce((acc, r) => acc + (r.finalScore || 0), 0) /
        results.filter((r) => r.finalScore).length || 0,
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">نتائج الامتحانات</h1>
          <p className="text-muted-foreground">عرض وإدارة نتائج جميع الامتحانات</p>
        </div>
        <div className="flex items-center gap-4">
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 ml-2" />
                رفع ملف Excel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>رفع ملف Excel</DialogTitle>
                <DialogDescription>يمكنك رفع ملف Excel يحتوي على الأسئلة أو بيانات المستخدمين</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>نوع البيانات</Label>
                  <Select value={uploadType} onValueChange={(value: "questions" | "users") => setUploadType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="questions">أسئلة الامتحان</SelectItem>
                      <SelectItem value="users">بيانات المستخدمين</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>ملف Excel</Label>
                  <Input type="file" accept=".xlsx,.xls" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                  <p className="text-xs text-muted-foreground mt-1">يجب أن يكون الملف بصيغة .xlsx أو .xls</p>
                </div>
                <Button onClick={handleFileUpload} className="w-full" disabled={!uploadFile}>
                  رفع الملف
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={exportResults}>
            <Download className="h-4 w-4 ml-2" />
            تصدير النتائج
          </Button>
          <img src="/logo.png" alt="الشعار" className="h-12 w-12" />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الامتحانات</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الامتحانات المكتملة</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيد التنفيذ</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط الدرجات</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{Math.round(stats.averageScore)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            تصفية النتائج
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label>البحث</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث بالاسم أو البريد الإلكتروني..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>الفئة</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الحالة</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="locked">مقفل</SelectItem>
                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory("all")
                  setSelectedStatus("all")
                  setSearchTerm("")
                }}
              >
                إعادة تعيين
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>النتائج ({filteredResults.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent mx-auto mb-2" />
              جاري تحميل النتائج...
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">لا توجد نتائج تطابق المعايير المحددة</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-2">اسم الطالب</th>
                    <th className="text-right p-2">الفئة</th>
                    <th className="text-right p-2">عنوان الامتحان</th>
                    <th className="text-right p-2">تاريخ البدء</th>
                    <th className="text-right p-2">المدة</th>
                    <th className="text-right p-2">الدرجة التلقائية</th>
                    <th className="text-right p-2">تقييم القائد</th>
                    <th className="text-right p-2">الدرجة النهائية</th>
                    <th className="text-right p-2">الحالة</th>
                    <th className="text-right p-2">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result) => (
                    <tr key={result.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{result.studentName}</div>
                          <div className="text-sm text-muted-foreground">{result.studentEmail}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">{result.category}</Badge>
                      </td>
                      <td className="p-2">{result.examTitle}</td>
                      <td className="p-2">
                        <div className="text-sm">{new Date(result.startedAt).toLocaleDateString("ar-EG")}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(result.startedAt).toLocaleTimeString("ar-EG")}
                        </div>
                      </td>
                      <td className="p-2">{result.duration} دقيقة</td>
                      <td className="p-2">{getScoreBadge(result.autoScore)}</td>
                      <td className="p-2">
                        {result.manualScore ? (
                          getScoreBadge(result.manualScore)
                        ) : (
                          <span className="text-muted-foreground">غير محدد</span>
                        )}
                      </td>
                      <td className="p-2">
                        {result.finalScore ? (
                          getScoreBadge(result.finalScore)
                        ) : (
                          <span className="text-muted-foreground">غير محدد</span>
                        )}
                      </td>
                      <td className="p-2">{getStatusBadge(result.status)}</td>
                      <td className="p-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
