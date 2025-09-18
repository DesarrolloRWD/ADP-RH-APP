"use client"

import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

export function AdminMenu() {
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-300 border-none px-3 py-2 rounded-full shadow-sm"
      >
        <Settings className="w-4 h-4" />
        <span>Administración</span>
      </Button>
    </div>
  )
}
