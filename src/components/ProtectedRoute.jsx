import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/useAuth'
import { Loading } from './ui/Loading'

// Componente para proteger rotas que precisam de autenticação
export function ProtectedRoute({ children, requiredRole = null, fallback = null }) {
  const { user, profile, loading } = useAuth()
  const permissions = usePermissions()
  const [profileLoadTimeout, setProfileLoadTimeout] = useState(false)
  
  // Timeout para evitar loading infinito do perfil
  useEffect(() => {
    if (user && !profile && !loading) {
      const timer = setTimeout(() => {
        setProfileLoadTimeout(true)
      }, 3000) // 3 segundos de timeout
      
      return () => clearTimeout(timer)
    } else {
      setProfileLoadTimeout(false)
    }
  }, [user, profile, loading])
  
  // Se ainda está carregando a autenticação inicial
  if (loading || permissions.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    )
  }

  // Se não há usuário autenticado, redirecionar para login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Se há usuário mas não há perfil e não deu timeout ainda, mostrar loading
  if (user && !profile && !profileLoadTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Carregando perfil..." />
      </div>
    )
  }

  // Após timeout ou com perfil carregado, prosseguir com verificação de roles
  // (mesmo sem perfil completo, usuário pode acessar funcionalidades básicas)

  // Verificar se há role requerida
  if (requiredRole) {
    const roleArray = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    
    const hasRequiredRole = () => {
      // Super admin tem acesso a tudo
      if (permissions.isSuperAdmin()) return true
      
      // Verificar role específica
      if (roleArray.includes('super_admin') && permissions.isSuperAdmin()) return true
      if (roleArray.includes('consultant') && permissions.isConsultant()) return true
      if (roleArray.includes('company_admin') && permissions.isCompanyAdmin()) return true
      if (roleArray.includes('user') && permissions.isUser()) return true
      
      return false
    }

    if (!hasRequiredRole()) {
      return fallback || <AccessDenied />
    }
  }

  return children
}

// Componente para acesso negado
function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mt-4">
            Acesso Negado
          </h2>
          <p className="mt-2 text-gray-600">
            Você não tem permissão para acessar esta página.
          </p>
          <div className="mt-4">
            <Navigate to="/dashboard" replace />
          </div>
        </div>
      </div>
    </div>
  )
}
