import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loading } from './ui/Loading'

// Componente para proteger rotas que precisam de autenticação
export function ProtectedRoute({ children, fallback = null }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Componente para proteger rotas baseadas em roles
export function RoleProtectedRoute({ children, roles, fallback = null }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    )
  }

  if (!user) {
    return fallback || <LoginRedirect />
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Carregando perfil..." />
      </div>
    )
  }

  // Verificar se o usuário tem algum dos roles necessários
  const hasRequiredRole = () => {
    const roleArray = Array.isArray(roles) ? roles : [roles]
    
    // Super admin tem acesso a tudo
    if (profile.role === 'super_admin') return true
    
    // Verificar role global
    if (roleArray.includes(profile.role)) return true
    
    // Verificar roles nas empresas
    return profile.user_companies?.some(uc => 
      uc.is_active && roleArray.includes(uc.role)
    )
  }

  if (!hasRequiredRole()) {
    return fallback || <AccessDenied />
  }

  return children
}

// Componente para proteger rotas baseadas em permissões
export function PermissionProtectedRoute({ children, permissions, fallback = null }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    )
  }

  if (!user) {
    return fallback || <LoginRedirect />
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Carregando perfil..." />
      </div>
    )
  }

  // Verificar se o usuário tem alguma das permissões necessárias
  const hasRequiredPermission = () => {
    const permissionArray = Array.isArray(permissions) ? permissions : [permissions]
    
    // Super admin tem todas as permissões
    if (profile.role === 'super_admin') return true
    
    // Verificar permissões específicas
    return profile.user_companies?.some(uc => 
      uc.is_active && permissionArray.some(perm => uc.permissions?.includes(perm))
    )
  }

  if (!hasRequiredPermission()) {
    return fallback || <AccessDenied />
  }

  return children
}

// Componente para redirecionar para login
function LoginRedirect() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Acesso Restrito
          </h2>
          <p className="mt-2 text-gray-600">
            Você precisa fazer login para acessar esta página.
          </p>
          <div className="mt-4">
            <a
              href="/login"
              className="btn btn-primary"
            >
              Fazer Login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente para acesso negado
function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-danger-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <a
              href="/dashboard"
              className="btn btn-primary"
            >
              Voltar ao Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
