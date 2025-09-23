import React, { memo, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/FeedbackComponents'
import { 
  Users, 
  Building2, 
  BarChart3, 
  Target, 
  TrendingUp,
  Calendar,
  Bell,
  Settings,
  LogOut,
  Shield,
  Zap,
  Globe,
  Activity
} from 'lucide-react'

// Dados estáticos otimizados para Super Admin BG2
const SUPER_ADMIN_STATS = [
  {
    name: 'Empresas Ativas',
    value: '12',
    change: '+2 este mês',
    icon: Building2,
    color: 'primary',
    bgGradient: 'from-primary-50 to-primary-100',
    iconBg: 'bg-primary-500',
    trend: 'up'
  },
  {
    name: 'Total de Usuários',
    value: '248',
    change: '+18 esta semana',
    icon: Users,
    color: 'secondary',
    bgGradient: 'from-blue-50 to-blue-100',
    iconBg: 'bg-blue-500',
    trend: 'up'
  },
  {
    name: 'Jornadas Ativas',
    value: '127',
    change: '+5 hoje',
    icon: Target,
    color: 'success',
    bgGradient: 'from-success-50 to-success-100',
    iconBg: 'bg-success-500',
    trend: 'up'
  },
  {
    name: 'Sistema Uptime',
    value: '99.9%',
    change: '30 dias',
    icon: Activity,
    color: 'warning',
    bgGradient: 'from-emerald-50 to-emerald-100',
    iconBg: 'bg-emerald-500',
    trend: 'stable'
  }
]

const RECENT_ACTIVITIES = [
  {
    id: 1,
    type: 'company',
    title: 'Nova empresa cadastrada',
    description: 'TechStart Solutions foi registrada no sistema',
    time: '5 minutos atrás',
    icon: Building2,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50'
  },
  {
    id: 2,
    type: 'user',
    title: 'Usuários em massa',
    description: '12 novos usuários convidados pela InnovateCorp',
    time: '1 hora atrás',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    id: 3,
    type: 'alert',
    title: 'Sistema otimizado',
    description: 'Performance melhorada em 15% após atualizações',
    time: '2 horas atrás',
    icon: Zap,
    color: 'text-success-600',
    bgColor: 'bg-success-50'
  },
  {
    id: 4,
    type: 'security',
    title: 'Backup automático',
    description: 'Backup de segurança executado com sucesso',
    time: '4 horas atrás',
    icon: Shield,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  }
]

const QUICK_ACTIONS = [
  {
    title: 'Nova Empresa',
    description: 'Cadastrar empresa no sistema',
    icon: Building2,
    href: '/companies/new',
    color: 'primary',
    bgGradient: 'from-primary-500 to-primary-600',
    hoverGradient: 'hover:from-primary-600 hover:to-primary-700'
  },
  {
    title: 'Gerenciar Usuários',
    description: 'Administrar contas globais',
    icon: Users,
    href: '/admin/users',
    color: 'blue',
    bgGradient: 'from-blue-500 to-blue-600',
    hoverGradient: 'hover:from-blue-600 hover:to-blue-700'
  },
  {
    title: 'Atribuir Jornadas',
    description: 'Configurar acessos e permissões',
    icon: Target,
    href: '/admin/journey-assignments',
    color: 'success',
    bgGradient: 'from-success-500 to-success-600',
    hoverGradient: 'hover:from-success-600 hover:to-success-700'
  },
  {
    title: 'Relatórios Globais',
    description: 'Métricas do sistema completo',
    icon: BarChart3,
    href: '/admin/reports',
    color: 'purple',
    bgGradient: 'from-purple-500 to-purple-600',
    hoverGradient: 'hover:from-purple-600 hover:to-purple-700'
  }
]

const SYSTEM_HEALTH = [
  {
    metric: 'Disponibilidade',
    value: '99.9%',
    status: 'excellent',
    color: 'text-success-600',
    bgColor: 'bg-success-100'
  },
  {
    metric: 'Tempo de Resposta',
    value: '127ms',
    status: 'good',
    color: 'text-primary-600',
    bgColor: 'bg-primary-100'
  },
  {
    metric: 'Uso da CPU',
    value: '23%',
    status: 'excellent',
    color: 'text-success-600',
    bgColor: 'bg-success-100'
  },
  {
    metric: 'Armazenamento',
    value: '67%',
    status: 'warning',
    color: 'text-warning-600',
    bgColor: 'bg-warning-100'
  }
]

// Componente de estatística BG2
const SuperAdminStatCard = memo(({ stat }) => {
  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-success-500" />
    if (trend === 'stable') return <Activity className="w-4 h-4 text-neutral-500" />
    return <TrendingUp className="w-4 h-4 text-danger-500 rotate-180" />
  }
  
  return (
    <div className={`bg-gradient-to-br ${stat.bgGradient} border border-white/50 backdrop-blur-sm rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center mb-4 shadow-md`}>
            <stat.icon className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm font-medium text-neutral-600 mb-1">{stat.name}</p>
          <p className="text-3xl font-black text-neutral-900 mb-2">{stat.value}</p>
          <div className="flex items-center text-xs text-neutral-500">
            {getTrendIcon(stat.trend)}
            <span className="ml-1">{stat.change}</span>
          </div>
        </div>
      </div>
    </div>
  )
})

SuperAdminStatCard.displayName = 'SuperAdminStatCard'

// Componente de ação rápida BG2
const QuickActionCard = memo(({ action }) => {
  return (
    <a
      href={action.href}
      className={`group block p-6 bg-gradient-to-br ${action.bgGradient} ${action.hoverGradient} rounded-2xl text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl transform`}
    >
      <div className="flex items-start">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
          <action.icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <h4 className="font-bold text-white mb-2">{action.title}</h4>
      <p className="text-white/80 text-sm font-medium">{action.description}</p>
    </a>
  )
})

QuickActionCard.displayName = 'QuickActionCard'

// Componente de atividade BG2
const ActivityItem = memo(({ activity }) => {
  return (
    <div className="group flex items-start space-x-4 p-4 rounded-xl hover:bg-neutral-50 transition-all duration-200">
      <div className={`w-12 h-12 ${activity.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <activity.icon className={`w-6 h-6 ${activity.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-neutral-900 mb-1">{activity.title}</h4>
        <p className="text-sm text-neutral-600 mb-2">{activity.description}</p>
        <span className="text-xs text-neutral-400 font-medium">{activity.time}</span>
      </div>
    </div>
  )
})

ActivityItem.displayName = 'ActivityItem'

// Componente de health do sistema
const SystemHealthItem = memo(({ health }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'text-success-600'
      case 'good': return 'text-primary-600'
      case 'warning': return 'text-warning-600'
      case 'danger': return 'text-danger-600'
      default: return 'text-neutral-600'
    }
  }

  return (
    <div className="text-center p-4">
      <div className={`w-16 h-16 mx-auto ${health.bgColor} rounded-2xl flex items-center justify-center mb-3`}>
        <span className={`text-xl font-black ${health.color}`}>{health.value}</span>
      </div>
      <h4 className="font-semibold text-neutral-900 text-sm">{health.metric}</h4>
    </div>
  )
})

SystemHealthItem.displayName = 'SystemHealthItem'

export function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const { 
    activeCompany, 
    isSuperAdmin, 
    isConsultant, 
    isCompanyAdmin,
    isLoading: permissionsLoading 
  } = usePermissions()

  // Memoizar informações do usuário
  const userInfo = useMemo(() => {
    if (!profile && !user) return { name: 'Carregando...', roleDisplay: '' }
    
    const name = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin'
    
    const roleMap = {
      'super_admin': 'Super Administrador',
      'consultant': 'Consultor',
      'company_admin': 'Administrador',
      'user': 'Usuário'
    }
    
    const effectiveRole = profile?.role || 'user'
    const roleDisplay = roleMap[effectiveRole] || 'Usuário'
    
    return { name, roleDisplay }
  }, [profile, user])

  // Loading state otimizado
  if (authLoading || permissionsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" text="Carregando dashboard..." />
        </div>
      </Layout>
    )
  }

  // Dashboard específico para Super Admin
  if (isSuperAdmin) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30">
          <div className="space-y-8">
            
            {/* Header BG2 */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-primary-400/5 to-transparent rounded-3xl"></div>
              <div className="relative p-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-4xl font-black text-neutral-900">
                          Olá, {userInfo.name}! 
                        </h1>
                        <p className="text-lg text-neutral-600 font-light flex items-center">
                          <Globe className="w-4 h-4 mr-2 text-primary-500" />
                          {userInfo.roleDisplay} • Controle Global
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="bg-white/80 backdrop-blur-sm border-neutral-200 hover:bg-white hover:shadow-md transition-all duration-200"
                    >
                      <Bell className="w-5 h-5 mr-2 text-neutral-600" />
                      Alertas
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="bg-white/80 backdrop-blur-sm border-neutral-200 hover:bg-white hover:shadow-md transition-all duration-200"
                    >
                      <Settings className="w-5 h-5 mr-2 text-neutral-600" />
                      Configurações
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid BG2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {SUPER_ADMIN_STATS.map((stat) => (
                <SuperAdminStatCard key={stat.name} stat={stat} />
              ))}
            </div>

            {/* Quick Actions Grid BG2 */}
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Ações Rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {QUICK_ACTIONS.map((action) => (
                  <QuickActionCard key={action.title} action={action} />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Recent Activities BG2 */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden">
                  <div className="p-8 border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-neutral-900 flex items-center">
                        <Activity className="w-6 h-6 mr-3 text-primary-500" />
                        Atividades do Sistema
                      </h3>
                      <Button variant="outline" size="sm" className="bg-white border-neutral-200">
                        Ver todas
                      </Button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-2">
                      {RECENT_ACTIVITIES.map((activity) => (
                        <ActivityItem key={activity.id} activity={activity} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* System Health BG2 */}
              <div>
                <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden">
                  <div className="p-6 border-b border-neutral-100 bg-gradient-to-r from-success-50 to-white">
                    <h3 className="text-lg font-bold text-neutral-900 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-success-500" />
                      Status do Sistema
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      {SYSTEM_HEALTH.map((health, index) => (
                        <SystemHealthItem key={index} health={health} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Global Overview BG2 */}
            <div className="bg-gradient-to-br from-white via-neutral-50 to-primary-50/20 rounded-3xl shadow-sm border border-neutral-100 p-8">
              <h3 className="text-2xl font-bold text-neutral-900 mb-8 flex items-center">
                <Globe className="w-7 h-7 mr-3 text-primary-500" />
                Visão Global do Sistema
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
                    <span className="text-3xl font-black text-primary-700">85%</span>
                  </div>
                  <h4 className="font-bold text-neutral-900 mb-2">Adoção Geral</h4>
                  <p className="text-sm text-neutral-600">210 de 248 usuários ativos</p>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-success-100 to-success-200 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
                    <span className="text-3xl font-black text-success-700">92%</span>
                  </div>
                  <h4 className="font-bold text-neutral-900 mb-2">Satisfação</h4>
                  <p className="text-sm text-neutral-600">Baseado em feedback</p>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
                    <span className="text-3xl font-black text-blue-700">127</span>
                  </div>
                  <h4 className="font-bold text-neutral-900 mb-2">Jornadas Ativas</h4>
                  <p className="text-sm text-neutral-600">Across 12 companies</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Dashboard padrão para outros roles (mantém o layout anterior)
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header padrão */}
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

        {/* Conteúdo padrão para outros usuários */}
        <div className="bg-neutral-100 rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-neutral-700 mb-4">Dashboard em Desenvolvimento</h2>
          <p className="text-neutral-600">Dashboard específico para seu perfil será implementado em breve.</p>
        </div>
      </div>
    </Layout>
  )
}
