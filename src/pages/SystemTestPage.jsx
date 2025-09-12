import React, { useState, useEffect } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { 
  LoadingSpinner, 
  SkeletonLoader, 
  SkeletonCard, 
  EmptyState,
  ProgressBar,
  ErrorState,
  StatusBadge,
  Tooltip
} from '../components/ui/FeedbackComponents'
import { usePermissions } from '../hooks/usePermissions'
import { useActivityLogs } from '../hooks/useActivityLogs'
import { useUserContext } from '../contexts/UserContext'
import { useValidation } from '../services/validationService'
import { 
  Users, 
  Settings, 
  Activity, 
  Shield, 
  TestTube,
  Download,
  Trash2,
  Eye,
  CheckCircle
} from 'lucide-react'

export function SystemTestPage() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showError, setShowError] = useState(false)
  
  // Hooks personalizados
  const permissions = usePermissions()
  const {
    logActivity,
    logLogin,
    getLocalLogs,
    clearLocalLogs,
    exportLogs,
    getActivityStats
  } = useActivityLogs()
  
  const {
    showSuccess,
    showError: showErrorNotification,
    showWarning,
    showInfo,
    preferences,
    updatePreference,
    ui,
    toggleSidebar
  } = useUserContext()
  
  const { validateUser, validatePassword, isValidEmail } = useValidation()

  const [activityStats, setActivityStats] = useState(null)

  useEffect(() => {
    // Carregar estatísticas de atividade
    setActivityStats(getActivityStats())
  }, [])

  // Testar loading
  const testLoading = async () => {
    setLoading(true)
    setProgress(0)
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer)
          setLoading(false)
          showSuccess('Loading test completado!')
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  // Testar notificações
  const testNotifications = () => {
    showSuccess('Sucesso!', 'Operação realizada')
    setTimeout(() => showWarning('Aviso importante', 'Verifique os dados'), 1000)
    setTimeout(() => showInfo('Informação', 'Teste de notificação'), 2000)
    setTimeout(() => showErrorNotification('Erro simulado', 'Este é um erro de teste'), 3000)
  }

  // Testar logs de atividade
  const testActivityLogs = async () => {
    await logActivity('test.performed', {
      test_type: 'system_test',
      timestamp: new Date().toISOString()
    })
    
    await logLogin('test')
    
    showInfo('Logs de teste criados! Verifique o console ou exporte.')
    setActivityStats(getActivityStats())
  }

  // Testar validações
  const testValidations = async () => {
    const testData = {
      email: 'teste@exemplo.com',
      full_name: 'Usuário Teste',
      phone: '(11) 99999-9999'
    }
    
    const validation = await validateUser(testData)
    const passwordTest = validatePassword('MinhaSenh@123')
    const emailTest = isValidEmail('test@test.com')
    
    console.log('🧪 Resultados dos testes:')
    console.log('Validação de usuário:', validation)
    console.log('Validação de senha:', passwordTest)
    console.log('Validação de email:', emailTest)
    
    showInfo('Testes de validação executados! Verifique o console.')
  }

  // Testar preferências
  const testPreferences = async () => {
    await updatePreference('theme', preferences.theme === 'light' ? 'dark' : 'light')
    showSuccess('Tema alternado!')
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <TestTube className="w-6 h-6 mr-2 text-blue-600" />
            Sistema de Testes - Marco 2 Dia 9
          </h1>
          <p className="text-gray-600 mt-1">
            Teste todos os novos hooks, contextos e componentes implementados
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <StatusBadge 
            status="Marco 2 Day 9" 
            variant="success" 
          />
          <StatusBadge 
            status={`Tema: ${preferences.theme}`} 
            variant="info" 
          />
        </div>
      </div>

      {/* Seção de Permissões */}
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <Shield className="w-5 h-5 text-green-600 mr-2" />
          <h2 className="text-lg font-semibold">Sistema de Permissões</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Usuário Atual</h3>
            <p className="text-sm text-gray-600">
              {permissions.profile?.full_name || 'Carregando...'}
            </p>
            <p className="text-xs text-gray-500">
              Role: {permissions.profile?.role || 'N/A'}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Permissões</h3>
            <div className="space-y-1 text-xs">
              <div className="flex items-center">
                {permissions.canInviteUsers ? <CheckCircle className="w-3 h-3 text-green-500 mr-1" /> : <span className="w-3 h-3 text-red-500 mr-1">✗</span>}
                Convidar Usuários
              </div>
              <div className="flex items-center">
                {permissions.canManageUsers ? <CheckCircle className="w-3 h-3 text-green-500 mr-1" /> : <span className="w-3 h-3 text-red-500 mr-1">✗</span>}
                Gerenciar Usuários
              </div>
              <div className="flex items-center">
                {permissions.canManageCompanies ? <CheckCircle className="w-3 h-3 text-green-500 mr-1" /> : <span className="w-3 h-3 text-red-500 mr-1">✗</span>}
                Gerenciar Empresas
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Roles</h3>
            <div className="space-y-1 text-xs">
              <div>Super Admin: {permissions.isSuperAdmin ? '✓' : '✗'}</div>
              <div>Consultor: {permissions.isConsultant ? '✓' : '✗'}</div>
              <div>Admin: {permissions.isCompanyAdmin ? '✓' : '✗'}</div>
              <div>Usuário: {permissions.isUser ? '✓' : '✗'}</div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Estado</h3>
            <div className="text-xs space-y-1">
              <div>Loading: {permissions.isLoading ? 'Sim' : 'Não'}</div>
              <div>Empresas: {permissions.getUserCompanies().length}</div>
              <div>Empresa Ativa: {permissions.activeCompany?.name || 'Nenhuma'}</div>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={() => console.log('📊 Resumo completo:', permissions.getPermissionsSummary())}
          className="mt-4 bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <Eye className="w-4 h-4 mr-2" />
          Ver Resumo no Console
        </Button>
      </Card>

      {/* Seção de Logs de Atividade */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Activity className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold">Logs de Atividade</h2>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={testActivityLogs}
              variant="outline"
              size="sm"
            >
              Criar Logs de Teste
            </Button>
            <Button 
              onClick={exportLogs}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-1" />
              Exportar
            </Button>
            <Button 
              onClick={clearLocalLogs}
              variant="outline"
              size="sm"
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          </div>
        </div>
        
        {activityStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{activityStats.total}</div>
              <div className="text-sm text-blue-700">Total de Logs</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{activityStats.last24h}</div>
              <div className="text-sm text-green-700">Últimas 24h</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{activityStats.lastWeek}</div>
              <div className="text-sm text-yellow-700">Última Semana</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(activityStats.byUser).length}
              </div>
              <div className="text-sm text-purple-700">Usuários Únicos</div>
            </div>
          </div>
        )}
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Logs Recentes</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {getLocalLogs().slice(0, 5).map((log, index) => (
              <div key={index} className="text-xs bg-white p-2 rounded">
                <span className="font-mono text-blue-600">{log.action}</span>
                <span className="text-gray-500 ml-2">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Seção de Componentes UI */}
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <Settings className="w-5 h-5 text-purple-600 mr-2" />
          <h2 className="text-lg font-semibold">Componentes de Feedback</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Loading e Progress */}
          <div className="space-y-4">
            <h3 className="font-medium">Loading & Progress</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <LoadingSpinner size="sm" />
                <LoadingSpinner size="md" />
                <LoadingSpinner size="lg" />
              </div>
              
              <ProgressBar value={progress} showLabel />
              
              <div className="flex space-x-2">
                <Button onClick={testLoading} disabled={loading} size="sm">
                  {loading ? 'Testando...' : 'Testar Loading'}
                </Button>
              </div>
            </div>

            {loading && (
              <div className="space-y-2">
                <SkeletonLoader count={2} />
                <SkeletonCard className="mt-4" />
              </div>
            )}
          </div>

          {/* Status e Notificações */}
          <div className="space-y-4">
            <h3 className="font-medium">Status & Notificações</h3>
            
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="Ativo" variant="success" />
              <StatusBadge status="Pendente" variant="warning" />
              <StatusBadge status="Erro" variant="error" />
              <StatusBadge status="Info" variant="info" />
            </div>
            
            <div className="space-y-2">
              <Button onClick={testNotifications} size="sm" className="w-full">
                Testar Notificações
              </Button>
              
              <div className="flex space-x-2">
                <Tooltip content="Este é um tooltip de exemplo">
                  <Button variant="outline" size="sm">
                    Hover para Tooltip
                  </Button>
                </Tooltip>
                
                <Button onClick={() => setShowError(!showError)} variant="outline" size="sm">
                  {showError ? 'Esconder' : 'Mostrar'} Erro
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {showError && (
          <ErrorState
            title="Erro de Demonstração"
            message="Esta é uma demonstração do componente ErrorState"
            onRetry={() => {
              setShowError(false)
              showSuccess('Erro resolvido!')
            }}
          />
        )}
      </Card>

      {/* Seção de Testes de Sistema */}
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <TestTube className="w-5 h-5 text-indigo-600 mr-2" />
          <h2 className="text-lg font-semibold">Testes de Sistema</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={testValidations}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Testar Validações
          </Button>
          
          <Button 
            onClick={testPreferences}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Alternar Tema
          </Button>
          
          <Button 
            onClick={toggleSidebar}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Toggle Sidebar: {ui.sidebarOpen ? 'Aberta' : 'Fechada'}
          </Button>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Estado do Contexto</h3>
          <div className="text-sm space-y-1">
            <div>Tema: {preferences.theme}</div>
            <div>Idioma: {preferences.language}</div>
            <div>Sidebar: {ui.sidebarOpen ? 'Aberta' : 'Fechada'}</div>
            <div>Notificações Email: {preferences.notifications.email ? 'Sim' : 'Não'}</div>
          </div>
        </div>
      </Card>

      {/* Estados Vazios */}
      <Card className="p-6">
        <EmptyState
          icon={Users}
          title="Nenhum dado para exibir"
          description="Este é um exemplo de estado vazio. Normalmente seria mostrado quando não há dados para exibir."
          action={
            <Button variant="outline">
              Ação de Exemplo
            </Button>
          }
        />
      </Card>
    </div>
  )
}
