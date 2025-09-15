"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Shield, Settings, Users, ChevronDown, ChevronUp } from "lucide-react"
import { useRouter } from "next/navigation"

export function AdminMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-300 border-none px-3 py-2 rounded-full shadow-sm"
      >
        <Settings className="w-4 h-4" />
        <span>Administración</span>
        {isOpen ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => {
                router.push('/admin/roles')
                setIsOpen(false)
              }}
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
              role="menuitem"
            >
              <Shield className="mr-2 h-4 w-4 text-purple-500" />
              Administrar Roles
            </button>
            <button
              onClick={() => {
                router.push('/admin/users')
                setIsOpen(false)
              }}
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
              role="menuitem"
            >
              <Users className="mr-2 h-4 w-4 text-blue-500" />
              Gestionar Usuarios
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
