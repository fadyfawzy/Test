"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Upload, Download, Plus, Trash2, Edit, Search, Eye, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { BulkSelectionToolbar } from "@/components/bulk-selection-toolbar"
import { ArabicConfirmationDialog } from "@/components/arabic-confirmation-dialog"
import { getQuestions, deleteQuestions, logAdminAction, type Question } from "@/lib/database"

const categories = ["براعم وذو الهمم", "أشبال وزهرات", "كشافة ومرشدات", "متقدم ورائدات", "جوالة ودليلات"]

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null)
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null)
  const [newQuestion, setNewQuestion] = useState({
    category: "",
    question_type: "multiple_choice" as "multiple_choice" | "true_false" | "essay",
    question_text: "",
    options: ["", "", "", ""],
    correct_answer: "",
    points: 1,
    difficulty: "medium" as "easy" | "medium" | "hard",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setIsLoading(true)
        const questionData = await getQuestions()
        setQuestions(questionData)
      } catch (error) {
        console.error("Error loading questions:", error)
        toast({
          title: "خطأ في تحميل البيانات",
          description: "حدث خطأ أثناء تحميل قائمة الأسئلة",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadQuestions()
  }, [toast])

  const filteredQuestions = questions.filter((question) => {
    const matchesSearch = question.question_text.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || question.category === selectedCategory
    const matchesType = selectedType === "all" || question.question_type === selectedType
    return matchesSearch && matchesCategory && matchesType
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuestions(new Set(filteredQuestions.map((question) => question.id)))
    } else {
      setSelectedQuestions(new Set())
    }
  }

  const handleSelectQuestion = (questionId: string, checked: boolean) => {
    const newSelected = new Set(selectedQuestions)
    if (checked) {
      newSelected.add(questionId)
    } else {
      newSelected.delete(questionId)
    }
    setSelectedQuestions(newSelected)
  }

  const handleBulkDelete = () => {
    if (selectedQuestions.size === 0) return
    setShowDeleteConfirmation(true)
  }

  const confirmBulkDelete = async () => {
    try {
      const selectedIds = Array.from(selectedQuestions)
      await deleteQuestions(selectedIds)

      await logAdminAction(
        "current-admin-id", // In real app, get from auth context
        "bulk_delete_questions",
        "questions",
        undefined,
        { deleted_count: selectedIds.length, question_ids: selectedIds },
      )

      setQuestions((prev) => prev.filter((question) => !selectedQuestions.has(question.id)))
      setSelectedQuestions(new Set())
      setShowDeleteConfirmation(false)

      toast({
        title: "تم حذف الأسئلة بنجاح",
        description: `تم حذف ${selectedIds.length} سؤال من النظام`,
      })
    } catch (error) {
      console.error("Error deleting questions:", error)
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف الأسئلة",
        variant: "destructive",
      })
    }
  }

  const handleSingleDelete = (id: string) => {
    setQuestionToDelete(id)
    setShowDeleteConfirmation(true)
  }

  const confirmSingleDelete = async () => {
    if (!questionToDelete) return

    try {
      await deleteQuestions([questionToDelete])

      await logAdminAction(
        "current-admin-id", // In real app, get from auth context
        "delete_question",
        "questions",
        questionToDelete,
        { question_id: questionToDelete },
      )

      setQuestions((prev) => prev.filter((question) => question.id !== questionToDelete))
      toast({
        title: "تم حذف السؤال",
        description: "تم حذف السؤال من النظام",
      })
    } catch (error) {
      console.error("Error deleting question:", error)
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف السؤال",
        variant: "destructive",
      })
    }

    setQuestionToDelete(null)
    setShowDeleteConfirmation(false)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string
        const lines = csv.split("\n")

        const newQuestions: Question[] = []
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(",").map((v) => v.trim())
            const question: Question = {
              id: Date.now().toString() + i,
              category: values[0] || "",
              question_type: (values[1] as "multiple_choice" | "true_false" | "essay") || "multiple_choice",
              question_text: values[2] || "",
              options: [values[3] || "", values[4] || "", values[5] || "", values[6] || ""],
              correct_answer: values[7] || "",
              points: Number.parseInt(values[8]) || 1,
              difficulty: (values[9] as "easy" | "medium" | "hard") || "medium",
            }
            newQuestions.push(question)
          }
        }

        setQuestions((prev) => [...prev, ...newQuestions])
        toast({
          title: "تم رفع الملف بنجاح",
          description: `تم إضافة ${newQuestions.length} سؤال جديد`,
        })
      } catch (error) {
        toast({
          title: "خطأ في رفع الملف",
          description: "يرجى التأكد من صيغة الملف",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  const handleDownloadTemplate = () => {
    const csvContent = `Category,Type,Question,Option 1,Option 2,Option 3,Option 4,Correct Answer,Points,Difficulty
جوالة ودليلات,اختيار متعدد,من صفات الجوال؟,الاتكال على الغير,التعاون,السلبية,التردد,الخيار الثاني,1,متوسط`
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "questions_template.csv"
    link.click()
  }

  const handleAddQuestion = () => {
    if (!newQuestion.category || !newQuestion.question_text) {
      toast({
        title: "خطأ",
        description: "يرجى ملء الحقول المطلوبة",
        variant: "destructive",
      })
      return
    }

    const question: Question = {
      id: Date.now().toString(),
      category: newQuestion.category,
      question_type: newQuestion.question_type,
      question_text: newQuestion.question_text,
      options: newQuestion.options,
      correct_answer: newQuestion.correct_answer,
      points: newQuestion.points,
      difficulty: newQuestion.difficulty,
    }

    setQuestions((prev) => [...prev, question])
    setNewQuestion({
      category: "",
      question_type: "multiple_choice",
      question_text: "",
      options: ["", "", "", ""],
      correct_answer: "",
      points: 1,
      difficulty: "medium",
    })
    setIsAddDialogOpen(false)
    toast({
      title: "تم إضافة السؤال بنجاح",
      description: "تم إضافة السؤال للنظام",
    })
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إدارة الأسئلة</h1>
            <p className="text-muted-foreground">إدارة بنك الأسئلة والامتحانات</p>
          </div>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="الشعار" className="h-12 w-12" />
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>جاري تحميل الأسئلة...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الأسئلة</h1>
          <p className="text-muted-foreground">إدارة بنك الأسئلة والامتحانات</p>
        </div>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="الشعار" className="h-12 w-12" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[hsl(var(--logo-purple))] hover:bg-[hsl(var(--logo-purple))]/90">
              <Plus className="h-4 w-4 ml-2" />
              إضافة سؤال
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إضافة سؤال جديد</DialogTitle>
              <DialogDescription>أدخل بيانات السؤال الجديد</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">الفئة *</Label>
                  <Select
                    value={newQuestion.category}
                    onValueChange={(value) => setNewQuestion((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">نوع السؤال *</Label>
                  <Select
                    value={newQuestion.question_type}
                    onValueChange={(value: "multiple_choice" | "true_false" | "essay") =>
                      setNewQuestion((prev) => ({ ...prev, question_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">اختيار متعدد</SelectItem>
                      <SelectItem value="true_false">صح أم خطأ</SelectItem>
                      <SelectItem value="essay">مقالي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="question">السؤال *</Label>
                <Textarea
                  id="question"
                  value={newQuestion.question_text}
                  onChange={(e) => setNewQuestion((prev) => ({ ...prev, question_text: e.target.value }))}
                  placeholder="اكتب السؤال هنا..."
                  rows={3}
                />
              </div>

              {newQuestion.question_type === "multiple_choice" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="option1">الخيار الأول</Label>
                      <Input
                        id="option1"
                        value={newQuestion.options[0]}
                        onChange={(e) => {
                          const newOptions = [...newQuestion.options]
                          newOptions[0] = e.target.value
                          setNewQuestion((prev) => ({ ...prev, options: newOptions }))
                        }}
                        placeholder="الخيار الأول"
                      />
                    </div>
                    <div>
                      <Label htmlFor="option2">الخيار الثاني</Label>
                      <Input
                        id="option2"
                        value={newQuestion.options[1]}
                        onChange={(e) => {
                          const newOptions = [...newQuestion.options]
                          newOptions[1] = e.target.value
                          setNewQuestion((prev) => ({ ...prev, options: newOptions }))
                        }}
                        placeholder="الخيار الثاني"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="option3">الخيار الثالث</Label>
                      <Input
                        id="option3"
                        value={newQuestion.options[2]}
                        onChange={(e) => {
                          const newOptions = [...newQuestion.options]
                          newOptions[2] = e.target.value
                          setNewQuestion((prev) => ({ ...prev, options: newOptions }))
                        }}
                        placeholder="الخيار الثالث"
                      />
                    </div>
                    <div>
                      <Label htmlFor="option4">الخيار الرابع</Label>
                      <Input
                        id="option4"
                        value={newQuestion.options[3]}
                        onChange={(e) => {
                          const newOptions = [...newQuestion.options]
                          newOptions[3] = e.target.value
                          setNewQuestion((prev) => ({ ...prev, options: newOptions }))
                        }}
                        placeholder="الخيار الرابع"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="correct">الإجابة الصحيحة</Label>
                    <Select
                      value={newQuestion.correct_answer}
                      onValueChange={(value) => setNewQuestion((prev) => ({ ...prev, correct_answer: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الإجابة الصحيحة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={newQuestion.options[0]}>الخيار الأول</SelectItem>
                        <SelectItem value={newQuestion.options[1]}>الخيار الثاني</SelectItem>
                        <SelectItem value={newQuestion.options[2]}>الخيار الثالث</SelectItem>
                        <SelectItem value={newQuestion.options[3]}>الخيار الرابع</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {newQuestion.question_type === "true_false" && (
                <div>
                  <Label htmlFor="correct-tf">الإجابة الصحيحة</Label>
                  <Select
                    value={newQuestion.correct_answer}
                    onValueChange={(value) => setNewQuestion((prev) => ({ ...prev, correct_answer: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الإجابة الصحيحة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="صحيح">صحيح</SelectItem>
                      <SelectItem value="خطأ">خطأ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button onClick={handleAddQuestion} className="w-full">
                إضافة السؤال
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4 ml-2" />
          رفع ملف CSV
        </Button>
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />

        <Button variant="outline" onClick={handleDownloadTemplate}>
          <Download className="h-4 w-4 ml-2" />
          تحميل القالب
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">البحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="البحث في الأسئلة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category-filter">الفئة</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
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
              <Label htmlFor="type-filter">النوع</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="multiple_choice">اختيار متعدد</SelectItem>
                  <SelectItem value="true_false">صح أم خطأ</SelectItem>
                  <SelectItem value="essay">مقالي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Selection Toolbar */}
      {filteredQuestions.length > 0 && (
        <BulkSelectionToolbar
          selectedCount={selectedQuestions.size}
          totalCount={filteredQuestions.length}
          onSelectAll={handleSelectAll}
          onDeleteSelected={handleBulkDelete}
          onClearSelection={() => setSelectedQuestions(new Set())}
          resourceType="questions"
        />
      )}

      {/* Questions Table */}
      <Card>
        <CardHeader>
          <CardTitle>الأسئلة ({filteredQuestions.length})</CardTitle>
          <CardDescription>قائمة بجميع الأسئلة في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <span className="sr-only">تحديد</span>
                </TableHead>
                <TableHead>السؤال</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الصعوبة</TableHead>
                <TableHead>النقاط</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuestions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedQuestions.has(question.id)}
                      onCheckedChange={(checked) => handleSelectQuestion(question.id, checked as boolean)}
                      aria-label={`تحديد السؤال: ${question.question_text.substring(0, 30)}...`}
                    />
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="truncate">{question.question_text}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-[hsl(var(--logo-blue))]/10 text-[hsl(var(--logo-blue))]">
                      {question.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={question.question_type === "multiple_choice" ? "default" : "secondary"}>
                      {question.question_type === "multiple_choice"
                        ? "اختيار متعدد"
                        : question.question_type === "true_false"
                          ? "صح أم خطأ"
                          : "مقالي"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {question.difficulty === "easy" ? "سهل" : question.difficulty === "medium" ? "متوسط" : "صعب"}
                    </Badge>
                  </TableCell>
                  <TableCell>{question.points}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setPreviewQuestion(question)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSingleDelete(question.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewQuestion} onOpenChange={() => setPreviewQuestion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>معاينة السؤال</DialogTitle>
          </DialogHeader>
          {previewQuestion && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-2">{previewQuestion.question_text}</p>
                <div className="flex gap-2 mb-4">
                  <Badge variant="secondary">{previewQuestion.category}</Badge>
                  <Badge variant={previewQuestion.question_type === "multiple_choice" ? "default" : "secondary"}>
                    {previewQuestion.question_type === "multiple_choice"
                      ? "اختيار متعدد"
                      : previewQuestion.question_type === "true_false"
                        ? "صح أم خطأ"
                        : "مقالي"}
                  </Badge>
                  <Badge variant="outline">{previewQuestion.points} نقطة</Badge>
                </div>
              </div>

              {previewQuestion.question_type === "multiple_choice" && previewQuestion.options && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">الخيارات:</p>
                  {previewQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded border ${option === previewQuestion.correct_answer ? "bg-green-50 border-green-200" : "bg-gray-50"}`}
                    >
                      <span className="text-sm">
                        {index + 1}. {option}
                      </span>
                      {option === previewQuestion.correct_answer && (
                        <span className="text-green-600 text-xs mr-2">(الإجابة الصحيحة)</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {previewQuestion.question_type === "true_false" && (
                <div>
                  <p className="text-sm font-medium">الإجابة الصحيحة:</p>
                  <div className="p-2 rounded border bg-green-50 border-green-200">
                    <span className="text-sm">{previewQuestion.correct_answer}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Arabic Confirmation Dialog */}
      <ArabicConfirmationDialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        onConfirm={questionToDelete ? confirmSingleDelete : confirmBulkDelete}
        title={questionToDelete ? "حذف سؤال" : "حذف أسئلة"}
        description={
          questionToDelete
            ? "هل أنت متأكد من حذف هذا السؤال؟ سيتم حذفه من جميع الامتحانات المرتبطة به."
            : `هل أنت متأكد من حذف الأسئلة المحددة؟ سيتم حذفها من جميع الامتحانات المرتبطة بها.`
        }
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        icon="delete"
        count={questionToDelete ? 1 : selectedQuestions.size}
      />
    </div>
  )
}
