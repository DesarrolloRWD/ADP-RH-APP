"use client"

import { useState, forwardRef, useEffect } from "react"
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
import { getUserData } from "@/lib/auth"

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
  const [isUserRH, setIsUserRH] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // Detectar si el usuario actual es RH o ADMIN
  // Efecto para detectar el rol del usuario
  useEffect(() => {
    const userData = getUserData();
    if (userData && userData.roles) {
      let roles: string[] = [];
      
      // Extraer roles del userData
      if (Array.isArray(userData.roles)) {
        roles = userData.roles.map((r: any) => {
          if (typeof r === 'object' && r.nombre) return r.nombre;
          if (typeof r === 'string') return r;
          return '';
        }).filter(Boolean);
      } else if (typeof userData.roles === 'string') {
        roles = [userData.roles];
      }
      
      // Verificar si el usuario tiene rol RH o ADMIN
      setIsUserRH(roles.some(r => r.includes('RH') || r.includes('ROLE_RH')));
      setIsUserAdmin(roles.some(r => r.includes('ADMIN') || r.includes('ROLE_ADMIN')));
    }
  }, []);
  
  // Efecto para notificar cambios en los filtros al componente padre
  useEffect(() => {
    // Notificar al componente padre sobre los cambios en los filtros
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // Lista de roles disponibles filtrada según el rol del usuario
  const availableRoles = [
    { id: "ROLE_RH", name: "Recursos Humanos" },
    // Solo mostrar el rol ADMIN si el usuario es ADMIN
    ...(isUserAdmin ? [{ id: "ROLE_ADMIN", name: "Administrador" }] : []),
    { id: "ROLE_CHECKTIME", name: "Asistencia" },
    { id: "ROLE_SUPERVISOR", name: "Supervisor" }
  ]

  // Función para manejar cambios en los filtros de rol
  const handleRoleToggle = (roleId: string) => {
    // Si el usuario es RH y no es ADMIN, no permitir seleccionar el rol ADMIN
    if (isUserRH && !isUserAdmin && roleId === "ROLE_ADMIN") {
      return;
    }
    
    setFilters(prev => {
      const newRoles = prev.roles.includes(roleId)
        ? prev.roles.filter(id => id !== roleId)
        : [...prev.roles, roleId]
      
      return { ...prev, roles: newRoles }
    })
  }

  // Función para manejar cambios en el filtro de estado
  const handleStatusChange = (status: string | null) => {
    setFilters(prev => {
      return { ...prev, status }
    })
  }

  // Función para limpiar todos los filtros
  const clearFilters = () => {
    setFilters({ roles: [], status: null })
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
