"use client"

import { useState, forwardRef } from "react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Filter, Check } from "lucide-react"

interface UserFiltersProps {
  onFilterChange: (filters: UserFilters) => void
}

export interface UserFilters {
  roles: string[]
  status: string | null
}

export const UserFilters = forwardRef<HTMLButtonElement, UserFiltersProps>(({ onFilterChange }, ref) => {
  const [filters, setFilters] = useState<UserFilters>({
    roles: [],
    status: null
  })

  // Lista de roles disponibles
  const availableRoles = [
    { id: "ROLE_RH", name: "Recursos Humanos" },
    { id: "ROLE_ADMIN", name: "Administrador" },
    { id: "ROLE_CHECKTIME", name: "Asistencia" },
    { id: "ROLE_SUPERVISOR", name: "Supervisor" }
  ]

  // Función para manejar cambios en los filtros de rol
  const handleRoleToggle = (roleId: string) => {
    setFilters(prev => {
      const newRoles = prev.roles.includes(roleId)
        ? prev.roles.filter(id => id !== roleId)
        : [...prev.roles, roleId]
      
      const newFilters = { ...prev, roles: newRoles }
      onFilterChange(newFilters)
      return newFilters
    })
  }

  // Función para manejar cambios en el filtro de estado
  const handleStatusChange = (status: string | null) => {
    setFilters(prev => {
      const newFilters = { ...prev, status }
      onFilterChange(newFilters)
      return newFilters
    })
  }

  // Función para limpiar todos los filtros
  const clearFilters = () => {
    const newFilters = { roles: [], status: null }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  // Contar filtros activos
  const activeFiltersCount = filters.roles.length + (filters.status ? 1 : 0)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button ref={ref} variant="outline" size="sm" className="border-border bg-transparent">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Filtrar por rol</DropdownMenuLabel>
        {availableRoles.map(role => (
          <DropdownMenuCheckboxItem
            key={role.id}
            checked={filters.roles.includes(role.id)}
            onCheckedChange={() => handleRoleToggle(role.id)}
          >
            {role.name}
          </DropdownMenuCheckboxItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={filters.status === "active"}
          onCheckedChange={(checked) => handleStatusChange(checked ? "active" : null)}
        >
          Activos
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={filters.status === "inactive"}
          onCheckedChange={(checked) => handleStatusChange(checked ? "inactive" : null)}
        >
          Inactivos
        </DropdownMenuCheckboxItem>
        
        {activeFiltersCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={clearFilters}
            >
              Limpiar filtros
            </Button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
