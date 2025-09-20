import React, { memo, useMemo, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import { Layout } from '../components/layout/Layout'
import { Sidebar } from '../components/layout/Sidebar'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { DashboardSkeleton, SmartLoader } from '../components/ui/DashboardLoaders'
import UnlinkedUserMessage from '../components/common/UnlinkedUserMessage'
import { GestorDashboard } from '../components/dashboard/GestorDashboard'
import { 
  Users, 
  Building2, 
  BarChart3, 
  Target, 
  TrendingUp,
  Calendar,
  Bell,
  Settings,
  LogOut
} from 'lucide-react'

// Dados estáticos movidos para fora do componente para evitar re-criação
const DASHBOARD_STATS = [
  {
    name: 'Empresas Ativas',
    value: '12',
    change: '+2.1%',
    icon: Building2,
    color: 'primary'
  },
  {
    name: 'Usuários Total',
    value: '48',
    change: '+5.4%',
    icon: Users,
    color: 'secondary'
  },
  {
    name: 'Metas Concluídas',
    value: '23',
    change: '+12.5%',
    icon: Target,
    color: 'success'
  },
  {
    name: 'Receita Mensal',
    value: 'R$ 45.2k',
    change: '+8.2%',
    icon: TrendingUp,
    color: 'warning'
  }
]

const RECENT_ACTIVITIES = [
  {
    id: 1,
    type: 'login',
    user: 'João Silva',
    action: 'fez login no sistema',
    time: '2 minutos atrás',
    company: 'TechCorp'
  },
  {
    id: 2,
    type: 'goal',
    user: 'Maria Santos',
    action: 'concluiu meta "Aumentar vendas"',
    time: '15 minutos atrás',
    company: 'VendaCorp'
  },
  {
    id: 3,
    type: 'company',
    user: 'Pedro Costa',
    action: 'atualizou dados da empresa',
    time: '1 hora atrás',
    company: 'StartupXYZ'
  },
  {
    id: 4,
    type: 'report',
    user: 'Ana Oliveira',
    action: 'gerou relatório financeiro',
    time: '2 horas atrás',
    company: 'FinanceCorp'
  }
]

// Componente de estatística otimizado
const StatCard = memo(({ stat }) => {
  const getColorClasses = (color) => {
    const colorMap = {
      primary: { bg: 'bg-blue-100', text: 'text-blue-600' },
      secondary: { bg: 'bg-purple-100', text: 'text-purple-600' },
      success: { bg: 'bg-green-100', text: 'text-green-600' },
      warning: { bg: 'bg-amber-100', text: 'text-amber-600' },
      danger: { bg: 'bg-red-100', text: 'text-red-600' }
    }
    return colorMap[color] || colorMap.primary
  }
  
  const colors = getColorClasses(stat.color)
  
  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
          <stat.icon className={`w-6 h-6 ${colors.text}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{stat.name}</p>
          <div className="flex items-center">
            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            <p className="ml-2 text-sm text-green-600">{stat.change}</p>
          </div>
        </div>
      </div>
    </Card>
  )
})

StatCard.displayName = 'StatCard'

export function DashboardPage() {
  const { user, profile, loading: authLoading, isUnlinkedUser } = useAuth()
  const { 
    activeCompany, 
    isSuperAdmin, 
    isConsultant, 
    isCompanyAdmin,
    isGestor,
    isLoading: permissionsLoading 
  } = usePermissions()

  // Memoizar informações do usuário para evitar recálculos
  const userInfo = useMemo(() => {
    if (!profile && !user) return { name: 'Carregando...', roleDisplay: '' }
    
    // Priorizar full_name do profile, depois metadados do user, depois email
    let name = 'Usuário'
    
    if (profile?.full_name) {
      name = profile.full_name
    } else if (user?.user_metadata?.full_name) {
      name = user.user_metadata.full_name
    } else if (user?.email) {
      // Extrair nome do email se não houver nome completo
      const emailName = user.email.split('@')[0]
      name = emailName.charAt(0).toUpperCase() + emailName.slice(1)
    }
    
    const company = activeCompany ? `${activeCompany.name} • ` : ''
    
    console.log('Dashboard - Dados do perfil:', {
      profile: profile,
      activeCompany: activeCompany,
      user_companies: profile?.user_companies
    })
    
    const roleMap = {
      'super_admin': 'Super Administrador',
      'consultant': 'Consultor',
      'gestor': 'Gestor',
      'gestor_financeiro': 'Gestor Financeiro',
      'gestor_estrategico': 'Gestor Estratégico',
      'gestor_pessoas_cultura': 'Gestor de Pessoas e Cultura',
      'gestor_vendas_marketing': 'Gestor de Vendas e Marketing',
      'gestor_operacional': 'Gestor Operacional',
      'company_admin': 'Administrador',
      'user': 'Usuário'
    }
    
    // Usar role da empresa ativa se existir, senão usar role global
    const activeCompanyRole = profile?.user_companies?.find(uc => 
      uc.is_active && uc.companies?.id === activeCompany?.id
    )?.role
    
    console.log('Dashboard - Role calculation:', {
      activeCompanyRole: activeCompanyRole,
      profileRole: profile?.role,
      activeCompanyId: activeCompany?.id
    })
    
    const effectiveRole = activeCompanyRole || profile?.role || 'user'
    const roleDisplay = company + (roleMap[effectiveRole] || 'Usuário')
    
    console.log('Dashboard - Final role display:', roleDisplay)
    
    return { name, roleDisplay }
  }, [profile, user, activeCompany])

  // Loading otimizado com skeleton
  if (authLoading || permissionsLoading) {
    return (
      <Layout>
        <Suspense fallback={<SmartLoader />}>
          <DashboardSkeleton />
        </Suspense>
      </Layout>
    )
  }

  // Dashboard específico para usuários não vinculados
  if (isUnlinkedUser()) {
    return (
      <div className="min-h-screen bg-background">
        {/* Sidebar */}
        <Sidebar 
          isOpen={false} 
          onClose={() => {}} 
        />

        {/* Main Content sem Header */}
        <div className="flex flex-col lg:ml-72">
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
              <div className="max-w-4xl w-full text-center px-6">
                {/* Saudação personalizada simplificada */}
                <div className="mb-12">              
                  <h1 className="text-4xl font-light text-neutral-900 mb-3">
                    Olá, {userInfo.name}
                  </h1>
                  
                  <div className="flex items-center justify-center space-x-2 mb-6">
                    <div className="w-12 h-0.5 bg-primary-500"></div>
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <div className="w-12 h-0.5 bg-primary-500"></div>
                  </div>
                  
                  <p className="text-lg text-neutral-600 font-light">
                    Bem-vindo ao seu painel pessoal no <span className="font-medium text-primary-600">BG2</span>
                  </p>
                </div>

                {/* Cards explicativos em lista */}
                <div className="space-y-4 mb-8">
                  <div className="bg-background shadow-soft border border-neutral-100 rounded-xl p-6 text-left hover:shadow-medium transition-all duration-300 hover:border-primary-200">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-sm font-bold text-primary-600">1</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-neutral-800 mb-2">Tarefas Atribuídas</h4>
                        <p className="text-sm text-neutral-600 leading-relaxed">
                          Gestores da sua empresa atribuirão tarefas específicas das jornadas para você. 
                          Elas aparecerão automaticamente na seção "Metas Atribuídas" para acompanhamento.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-background shadow-soft border border-neutral-100 rounded-xl p-6 text-left hover:shadow-medium transition-all duration-300 hover:border-primary-200">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-sm font-bold text-primary-600">2</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-neutral-800 mb-2">Acompanhamento de Progresso</h4>
                        <p className="text-sm text-neutral-600 leading-relaxed">
                          Visualize o progresso, prazos e status de cada tarefa de forma organizada. 
                          Tenha controle total sobre suas responsabilidades e marcos importantes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status da conta com animação de loading */}
                <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 mb-8 relative overflow-hidden">
                  {/* Animação de loading no fundo */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-100 to-transparent opacity-30 animate-pulse"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-center space-x-3 mb-3">
                      {/* Spinner de loading */}
                      <div className="relative">
                        <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin"></div>
                      </div>
                      <span className="text-sm font-medium text-primary-800">Configurando sua conta</span>
                    </div>
                    <p className="text-sm text-primary-700">
                      Sua conta está sendo configurada pelos gestores da empresa. 
                      Em breve você terá acesso completo às suas tarefas personalizadas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Dashboard específico para gestores
  if (isGestor()) {
    return (
      <Layout>
        <GestorDashboard />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Otimizado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Olá, {userInfo.name}! 👋
            </h1>
            <p className="text-gray-600">{userInfo.roleDisplay}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              <Bell className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Notificações</span>
            </Button>
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              <Settings className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Configurações</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid Otimizado */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DASHBOARD_STATS.map((stat) => (
            <StatCard key={stat.name} stat={stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Recent Activity - Agora ocupa toda a largura */}
          <div>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Atividades Recentes
                </h3>
                <Button variant="outline" size="sm">
                  Ver todas
                </Button>
              </div>
              <div className="space-y-4">
                {RECENT_ACTIVITIES.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      {activity.type === 'login' && <LogOut className="w-4 h-4 text-gray-600" />}
                      {activity.type === 'goal' && <Target className="w-4 h-4 text-green-600" />}
                      {activity.type === 'company' && <Building2 className="w-4 h-4 text-blue-600" />}
                      {activity.type === 'report' && <BarChart3 className="w-4 h-4 text-amber-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                      </p>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <span>{activity.company}</span>
                        <span className="mx-2">•</span>
                        <span>{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Visão Geral do Progresso
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-primary-600">85%</span>
              </div>
              <h4 className="font-medium text-gray-900">Jornada Estratégica</h4>
              <p className="text-sm text-gray-600">17 de 20 processos concluídos</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-success-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-success-600">92%</span>
              </div>
              <h4 className="font-medium text-gray-900">Jornada Financeira</h4>
              <p className="text-sm text-gray-600">23 de 25 processos concluídos</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-warning-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-warning-600">67%</span>
              </div>
              <h4 className="font-medium text-gray-900">Jornada Pessoas</h4>
              <p className="text-sm text-gray-600">12 de 18 processos concluídos</p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
