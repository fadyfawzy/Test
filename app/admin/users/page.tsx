"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Download, Plus, Trash2, Edit, Search, Loader2 } from "lucide-react"
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

type User = {
  id: string
  name: string
  email: string
  role: "student" | "admin" | "leader"
  created_at: string
}

const categories = ["براعم وذو الهمم", "أشبال وزهرات", "كشافة ومرشدات", "متقدم ورائدات", "جوالة ودليلات"]

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "student" as "student" | "admin" | "leader",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/admin/users")
        if (!response.ok) {
          throw new Error("Failed to fetch users")
        }
        const data = await response.json()
        setUsers(data.users)
      } catch (error) {
        console.error("Error loading users:", error)
        toast({
          title: "خطأ في تحميل البيانات",
          description: "حدث خطأ أثناء تحميل قائمة المستخدمين",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [toast])

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || user.role === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(filteredUsers.map((user) => user.id)))
    } else {
      setSelectedUsers(new Set())
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers)
    if (checked) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedUsers(newSelected)
  }

  const handleBulkDelete = () => {
    if (selectedUsers.size === 0) return
    setShowDeleteConfirmation(true)
  }

  const confirmBulkDelete = async () => {
    try {
      const selectedIds = Array.from(selectedUsers)
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete",
          userIds: selectedIds,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete users")
      }

      // Remove deleted users from local state
      setUsers((prev) => prev.filter((user) => !selectedUsers.has(user.id)))
      setSelectedUsers(new Set())
      setShowDeleteConfirmation(false)

      toast({
        title: "تم حذف المستخدمين بنجاح",
        description: `تم حذف ${selectedIds.length} مستخدم من النظام`,
      })
    } catch (error) {
      console.error("Error deleting users:", error)
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف المستخدمين",
        variant: "destructive",
      })
    }
  }

  const handleSingleDelete = (id: string) => {
    setUserToDelete(id)
    setShowDeleteConfirmation(true)
  }

  const confirmSingleDelete = async () => {
    if (!userToDelete) return

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete",
          userIds: [userToDelete],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete user")
      }

      setUsers((prev) => prev.filter((user) => user.id !== userToDelete))
      toast({
        title: "تم حذف المستخدم",
        description: "تم حذف المستخدم من النظام",
      })
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف المستخدم",
        variant: "destructive",
      })
    }

    setUserToDelete(null)
    setShowDeleteConfirmation(false)
  }

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.role) {
      toast({
        title: "خطأ",
        description: "يرجى ملء الحقول المطلوبة",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "add",
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add user")
      }

      const data = await response.json()
      setUsers((prev) => [...prev, data.user])
      toast({
        title: "تم إضافة المستخدم بنجاح",
        description: `تم إضافة ${newUser.name} للنظام`,
      })
    } catch (error) {
      console.error("Error adding user:", error)
      toast({
        title: "خطأ في الإضافة",
        description: "حدث خطأ أثناء إضافة المستخدم",
        variant: "destructive",
      })
    }

    setNewUser({
      name: "",
      email: "",
      role: "student",
    })
    setIsAddDialogOpen(false)
  }

  const handleDownloadUsers = () => {
    const headers = "ID,Name,Email,Role,Created At"
    const csvContent = [
      headers,
      ...users.map((user) => `${user.id},${user.name},${user.email},${user.role},${user.created_at}`),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "users_export.csv"
    link.click()
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
            <p className="text-muted-foreground">إدارة حسابات المستخدمين والكشافة</p>
          </div>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="الشعار" className="h-12 w-12" />
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>جاري تحميل المستخدمين...</span>
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
          <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
          <p className="text-muted-foreground">إدارة حسابات المستخدمين والكشافة</p>
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
              إضافة مستخدم
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مستخدم جديد</DialogTitle>
              <DialogDescription>أدخل بيانات المستخدم الجديد</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">الاسم *</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="أحمد محمد"
                />
              </div>
              <div>
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="example@email.com"
                />
              </div>
              <div>
                <Label htmlFor="role">الدور *</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: "student" | "admin" | "leader") =>
                    setNewUser((prev) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">طالب</SelectItem>
                    <SelectItem value="admin">مدير</SelectItem>
                    <SelectItem value="leader">قائد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddUser} className="w-full">
                إضافة المستخدم
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={handleDownloadUsers}>
          <Download className="h-4 w-4 ml-2" />
          تصدير المستخدمين
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
                  placeholder="البحث بالاسم أو البريد الإلكتروني..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category-filter">الدور</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأدوار</SelectItem>
                  <SelectItem value="student">طالب</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                  <SelectItem value="leader">قائد</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Selection Toolbar */}
      {filteredUsers.length > 0 && (
        <BulkSelectionToolbar
          selectedCount={selectedUsers.size}
          totalCount={filteredUsers.length}
          onSelectAll={handleSelectAll}
          onDeleteSelected={handleBulkDelete}
          onClearSelection={() => setSelectedUsers(new Set())}
          resourceType="users"
        />
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>المستخدمون ({filteredUsers.length})</CardTitle>
          <CardDescription>قائمة بجميع المستخدمين المسجلين في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <span className="sr-only">تحديد</span>
                </TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>تاريخ التسجيل</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                      aria-label={`تحديد ${user.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-[hsl(var(--logo-blue))]/10 text-[hsl(var(--logo-blue))]">
                      {user.role === "student" ? "طالب" : user.role === "admin" ? "مدير" : "قائد"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString("ar-EG")}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSingleDelete(user.id)}
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

      {/* Arabic Confirmation Dialog */}
      <ArabicConfirmationDialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        onConfirm={userToDelete ? confirmSingleDelete : confirmBulkDelete}
        title={userToDelete ? "حذف مستخدم" : "حذف مستخدمين"}
        description={
          userToDelete
            ? "هل أنت متأكد من حذف هذا المستخدم؟ سيتم حذف جميع بياناته وامتحاناته."
            : `هل أنت متأكد من حذف المستخدمين المحددين؟ سيتم حذف جميع بياناته وامتحاناته.`
        }
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        icon="delete"
        count={userToDelete ? 1 : selectedUsers.size}
      />
    </div>
  )
}
