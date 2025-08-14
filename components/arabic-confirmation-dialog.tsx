"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Trash2, Users, FileText } from "lucide-react"

interface ArabicConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "destructive" | "default"
  icon?: "warning" | "delete" | "users" | "questions"
  count?: number
}

export function ArabicConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  variant = "destructive",
  icon = "warning",
  count,
}: ArabicConfirmationDialogProps) {
  const getIcon = () => {
    switch (icon) {
      case "delete":
        return <Trash2 className="h-6 w-6 text-red-600" />
      case "users":
        return <Users className="h-6 w-6 text-blue-600" />
      case "questions":
        return <FileText className="h-6 w-6 text-green-600" />
      default:
        return <AlertTriangle className="h-6 w-6 text-amber-600" />
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {getIcon()}
            <AlertDialogTitle className="text-right">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-right leading-relaxed">
            {description}
            {count && count > 0 && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <span className="font-semibold text-foreground">عدد العناصر المحددة: {count}</span>
              </div>
            )}
            <div className="mt-3 text-sm text-muted-foreground">⚠️ هذا الإجراء لا يمكن التراجع عنه</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogCancel className="mt-0">{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={variant === "destructive" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
