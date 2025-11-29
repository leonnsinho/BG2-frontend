import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { UserProvider } from './contexts/UserContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ProtectedLayout } from './components/ProtectedLayout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import AssignedGoalsPage from './pages/AssignedGoalsPage'
import { PlanejamentoEstrategicoPage } from './pages/PlanejamentoEstrategicoPage'
import ConvitesSimples from './pages/ConvitesSimples'
import AcceptInviteNova from './pages/AcceptInviteNova'
import CompleteSignupPage from './pages/CompleteSignupPage'
import { SystemTestPage } from './pages/SystemTestPage'
import MatrizBossaPage from './pages/MatrizBossaPage'
import JourneyProcessesPage from './pages/JourneyProcessesPage'
import ProcessEvaluationPage from './pages/ProcessEvaluationPage'
import ProcessManagementPage from './pages/ProcessManagementPage'
import ProcessPersonalizationPage from './pages/ProcessPersonalizationPage'
import JornadasPage from './pages/JornadasPage'
import CreateCompanyPage from './pages/CreateCompanyPage'
import JourneyManagementOverview from './pages/JourneyManagement/index'
import JourneyDetail from './pages/JourneyManagement/JourneyDetail'
import ProcessEvaluationForm from './pages/JourneyManagement/ProcessEvaluationForm'
import UsersManagementPage from './pages/admin/UsersManagementPage'
import JourneyAssignmentsPage from './pages/admin/JourneyAssignmentsPage'
import CompaniesManagementPage from './pages/admin/CompaniesManagementPage'
import CategoriesManagementPage from './pages/admin/CategoriesManagementPage'
import ProcessRequestsPage from './pages/ProcessRequestsPage'
import AllProcessesPage from './pages/AllProcessesPage'
import OperationalPoliciesPage from './pages/OperationalPoliciesPage'
import TasksInProgressNew from './pages/TasksInProgressNew'
import TasksPage from './pages/TasksPage'
import ActiveUsersPage from './pages/ActiveUsersPage'
import UserActivityPage from './pages/UserActivityPage'
import MaturityApprovalsPage from './pages/MaturityApprovalsPage'
import FluxoCaixaPage from './pages/financeiro/FluxoCaixaPage'
import DrePage from './pages/financeiro/DrePage'
import DfcPage from './pages/financeiro/DfcPage'
import CompanyMaturityProgressPage from './pages/reports/CompanyMaturityProgressPage'
import CompanyMaturityProgressPageNew from './pages/reports/CompanyMaturityProgressPageNew'
import { useAuth } from './contexts/AuthContext'
import { ToastContainer } from './components/ui/FeedbackComponents'
import { useUserContext } from './contexts/UserContext'
import LoadingScreen from './components/LoadingScreen'
import LogoutScreen from './components/LogoutScreen'
import UpdateNotification from './components/UpdateNotification'

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
  const { user, loading, isLoggingOut } = useAuth()
  
  if (isLoggingOut) {
    return <LogoutScreen />
  }
  
  if (loading) {
    return <LoadingScreen />
  }
  
  return <Navigate to={user ? "/dashboard" : "/login"} replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Rotas públicas (sem Layout/Sidebar) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/accept-invite" element={<AcceptInviteNova />} />
      <Route path="/complete-signup" element={<CompleteSignupPage />} />
      
      {/* Rotas protegidas com Layout/Sidebar persistente */}
      <Route element={<ProtectedLayout />}>
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
          path="/goals/assigned" 
          element={
            <ProtectedRoute>
              <AssignedGoalsPage />
            </ProtectedRoute>
          }
        />
      
      <Route 
        path="/planejamento-estrategico" 
        element={
          <ProtectedRoute>
            <PlanejamentoEstrategicoPage />
          </ProtectedRoute>
        }
      />
      
      <Route 
        path="/tarefas-andamento" 
        element={
          <ProtectedRoute>
            <TasksInProgressNew />
          </ProtectedRoute>
        }
      />
      
      <Route 
        path="/tarefas" 
        element={
          <ProtectedRoute>
            <TasksPage />
          </ProtectedRoute>
        }
      />
      
      <Route 
        path="/usuarios-ativos" 
        element={
          <ProtectedRoute>
            <ActiveUsersPage />
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
        element={<AcceptInviteNova />} 
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
      
      {/* Rotas de Administração (Super Admin e Company Admin) */}
      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute requiredRole={['super_admin', 'company_admin']}>
            <UsersManagementPage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/admin/journey-assignments" 
        element={
          <ProtectedRoute requiredRole={['super_admin', 'company_admin']}>
            <JourneyAssignmentsPage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/admin/process-requests" 
        element={
          <ProtectedRoute requiredRole={['super_admin']}>
            <ProcessRequestsPage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/admin/all-processes" 
        element={
          <ProtectedRoute requiredRole={['super_admin']}>
            <AllProcessesPage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/admin/categories" 
        element={
          <ProtectedRoute requiredRole={['super_admin']}>
            <CategoriesManagementPage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/operational-policies" 
        element={
          <ProtectedRoute requiredRole={['company_admin']}>
            <OperationalPoliciesPage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/admin/companies" 
        element={
          <ProtectedRoute requiredRole={['super_admin']}>
            <CompaniesManagementPage />
          </ProtectedRoute>
        }
      />

      {/* Rotas de Relatórios (Super Admin e Company Admin) */}
      <Route 
        path="/reports/user-activity" 
        element={
          <ProtectedRoute requiredRole={['super_admin', 'company_admin']}>
            <UserActivityPage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/reports/company-usage" 
        element={
          <ProtectedRoute requiredRole={['super_admin', 'company_admin']}>
            <CompanyMaturityProgressPageNew />
          </ProtectedRoute>
        }
      />

      {/* Rota de Aprovações de Amadurecimento (Company Admin) */}
      <Route 
        path="/maturity-approvals" 
        element={
          <ProtectedRoute requiredRole={['super_admin', 'company_admin']}>
            <MaturityApprovalsPage />
          </ProtectedRoute>
        }
      />
      
      {/* Rotas de Gerenciamento de Jornadas (Super Admin) */}
      <Route 
        path="/journey-management" 
        element={
          <ProtectedRoute requiredRole={['super_admin', 'company_admin']}>
            <JourneyManagementOverview />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/journey-management/overview" 
        element={
          <ProtectedRoute requiredRole={['super_admin', 'company_admin']}>
            <JourneyManagementOverview />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/journey-management/:journeySlug" 
        element={
          <ProtectedRoute requiredRole={['super_admin', 'company_admin']}>
            <JourneyDetail />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/journey-management/:journeySlug/:processId/evaluate" 
        element={
          <ProtectedRoute requiredRole={['super_admin', 'company_admin']}>
            <ProcessEvaluationForm />
          </ProtectedRoute>
        }
      />
      
      {/* Rotas Financeiras - Gestor Financeiro e gestores com jornada financeira */}
      <Route 
        path="/financeiro/fluxo-caixa" 
        element={
          <ProtectedRoute requiredRole={['super_admin', 'gestor', 'gestor_financeiro', 'gestor_estrategico', 'gestor_pessoas_cultura', 'gestor_vendas_marketing', 'gestor_operacional']}>
            <FluxoCaixaPage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/financeiro/dre" 
        element={
          <ProtectedRoute requiredRole={['super_admin', 'gestor', 'gestor_financeiro', 'gestor_estrategico', 'gestor_pessoas_cultura', 'gestor_vendas_marketing', 'gestor_operacional']}>
            <DrePage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/financeiro/dfc" 
        element={
          <ProtectedRoute requiredRole={['super_admin', 'gestor', 'gestor_financeiro', 'gestor_estrategico', 'gestor_pessoas_cultura', 'gestor_vendas_marketing', 'gestor_operacional']}>
            <DfcPage />
          </ProtectedRoute>
        }
      />
      </Route>
      
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
            <UpdateNotification />
          </div>
        </Router>
      </UserProvider>
    </AuthProvider>
  )
}

export default App
