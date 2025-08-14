"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Users, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface BulkSelectionToolbarProps {
  selectedCount: number
  totalCount: number
  onSelectAll: (checked: boolean) => void
  onDeleteSelected: () => void
  onClearSelection: () => void
  resourceType: "users" | "questions"
}

export function BulkSelectionToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeleteSelected,
  onClearSelection,
  resourceType,
}: BulkSelectionToolbarProps) {
  const isAllSelected = selectedCount === totalCount && totalCount > 0
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount

  const resourceIcon = resourceType === "users" ? Users : FileText
  const ResourceIcon = resourceIcon

  return (
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isAllSelected}
            ref={(el) => {
              if (el) el.indeterminate = isIndeterminate
            }}
            onCheckedChange={onSelectAll}
            aria-label="تحديد الكل"
          />
          <span className="text-sm font-medium">تحديد الكل ({totalCount})</span>
        </div>

        {selectedCount > 0 && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <ResourceIcon className="h-3 w-3" />
            {selectedCount} محدد
          </Badge>
        )}
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClearSelection}>
            إلغاء التحديد
          </Button>
          <Button variant="destructive" size="sm" onClick={onDeleteSelected} className="flex items-center gap-1">
            <Trash2 className="h-4 w-4" />
            حذف المحدد ({selectedCount})
          </Button>
        </div>
      )}
    </div>
  )
}
