import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Layout } from './layout/Layout'
import { Sidebar } from './layout/Sidebar'
import { useAuth } from '../contexts/AuthContext'
import LoadingScreen from './LoadingScreen'
import LogoutScreen from './LogoutScreen'

/**
 * Layout persistente para rotas protegidas
 * Mantém o Sidebar montado durante a navegação para transições fluidas
 */
export const ProtectedLayout = () => {
  const { user, loading, profile, isLoggingOut } = useAuth()

  // Se está fazendo logout, mostrar tela de logout
  if (isLoggingOut) {
    return <LogoutScreen />
  }

  // Se ainda está carregando, mostrar tela de loading
  if (loading) {
    return <LoadingScreen />
  }

  // Se não há usuário autenticado, redirecionar para login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Se há usuário mas ainda não carregou o perfil, mostrar loading
  if (!profile) {
    return <LoadingScreen />
  }

  return (
    <Layout sidebar={<Sidebar />}>
      <Outlet />
    </Layout>
  )
}
