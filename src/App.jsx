import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { UserProvider } from './contexts/UserContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import { InviteSystem } from './components/InviteSystem'
import AcceptInvitePage from './pages/AcceptInvitePage'
import { SystemTestPage } from './pages/SystemTestPage'
import MatrizBossaPage from './pages/MatrizBossaPage'
import JourneyProcessesPage from './pages/JourneyProcessesPage'
import ProcessEvaluationPage from './pages/ProcessEvaluationPage'
import ProcessManagementPage from './pages/ProcessManagementPage'
import ProcessPersonalizationPage from './pages/ProcessPersonalizationPage'
import JornadasPage from './pages/JornadasPage'
import CreateCompanyPage from './pages/CreateCompanyPage'
import { useAuth } from './contexts/AuthContext'
import { ToastContainer } from './components/ui/FeedbackComponents'
import { useUserContext } from './contexts/UserContext'

// Componente para gerenciar notificações globais
function NotificationManager() {
  const { notifications, removeNotification } = useUserContext()

  return (
    <ToastContainer 
      toasts={notifications} 
      onRemove={removeNotification} 
    />
  )
}

// Componente para redirecionar baseado no estado de auth
function RootRedirect() {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return <Navigate to={user ? "/dashboard" : "/login"} replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      
      {/* Rotas protegidas */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      
      <Route 
        path="/matriz-bossa" 
        element={
          <ProtectedRoute>
            <MatrizBossaPage />
          </ProtectedRoute>
        }
      />
      
      <Route 
        path="/matriz-bossa/:slug" 
        element={
          <ProtectedRoute>
            <JourneyProcessesPage />
          </ProtectedRoute>
        }
      />
      
      <Route 
        path="/matriz-bossa/:slug/:processId/avaliar" 
        element={
          <ProtectedRoute>
            <ProcessEvaluationPage />
          </ProtectedRoute>
        }
      />
      
      <Route 
        path="/invites" 
        element={
          <ProtectedRoute requiredRole={['super_admin', 'consultant', 'company_admin']}>
            <InviteSystem />
          </ProtectedRoute>
        }
      />
      
      {/* Página de Testes do Sistema (apenas para desenvolvimento) */}
      <Route 
        path="/system-test" 
        element={
          <ProtectedRoute>
            <SystemTestPage />
          </ProtectedRoute>
        }
      />
      
      {/* Página de aceitar convite (pública) */}
      <Route 
        path="/accept-invite" 
        element={<AcceptInvitePage />} 
      />
      
      {/* Rotas das Jornadas de Negócio */}
      <Route 
        path="/jornadas" 
        element={
          <ProtectedRoute>
            <JornadasPage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/jornadas/:slug" 
        element={
          <ProtectedRoute>
            <JornadasPage />
          </ProtectedRoute>
        }
      />
      
      {/* Rotas de Gestão de Processos Personalizados */}
      <Route 
        path="/process-management" 
        element={
          <ProtectedRoute>
            <ProcessManagementPage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/process/:processId/personalize" 
        element={
          <ProtectedRoute>
            <ProcessPersonalizationPage />
          </ProtectedRoute>
        }
      />
      
      {/* Rota de Criação de Empresas (Super Admin) */}
      <Route 
        path="/companies/new" 
        element={
          <ProtectedRoute requiredRole={['super_admin']}>
            <CreateCompanyPage />
          </ProtectedRoute>
        }
      />
      
      {/* Redirecionar raiz baseado no estado de auth */}
      <Route path="/" element={<RootRedirect />} />
      
      {/* Rota 404 - redirecionar para login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
            <NotificationManager />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
        </Router>
      </UserProvider>
    </AuthProvider>
  )
}

export default App
