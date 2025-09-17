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
  LogOut
} from 'lucide-react'

// Dados estáticos otimizados (movidos para fora do componente)
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

const COLOR_CLASSES = {
  primary: { bg: 'bg-blue-100', text: 'text-blue-600' },
  secondary: { bg: 'bg-purple-100', text: 'text-purple-600' },
  success: { bg: 'bg-green-100', text: 'text-green-600' },
  warning: { bg: 'bg-amber-100', text: 'text-amber-600' },
  danger: { bg: 'bg-red-100', text: 'text-red-600' }
}

const PROGRESS_DATA = [
  {
    percentage: 85,
    title: 'Jornada Estratégica',
    subtitle: '17 de 20 processos concluídos',
    color: 'primary'
  },
  {
    percentage: 92,
    title: 'Jornada Financeira',
    subtitle: '23 de 25 processos concluídos',
    color: 'success'
  },
  {
    percentage: 67,
    title: 'Jornada Pessoas',
    subtitle: '12 de 18 processos concluídos',
    color: 'warning'
  }
]

// Componente de estatística otimizado
const StatCard = memo(({ stat }) => {
  const colors = COLOR_CLASSES[stat.color] || COLOR_CLASSES.primary
  
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

// Componente de ação rápida otimizado
const QuickActionCard = memo(({ action }) => {
  const colors = COLOR_CLASSES[action.color] || COLOR_CLASSES.primary
  
  return (
    <a
      href={action.href}
      className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
    >
      <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
        <action.icon className={`w-5 h-5 ${colors.text}`} />
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium text-gray-900">{action.title}</p>
        <p className="text-xs text-gray-600">{action.description}</p>
      </div>
    </a>
  )
})

QuickActionCard.displayName = 'QuickActionCard'

// Componente de atividade otimizado
const ActivityItem = memo(({ activity }) => {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'login': return <LogOut className="w-4 h-4 text-gray-600" />
      case 'goal': return <Target className="w-4 h-4 text-green-600" />
      case 'company': return <Building2 className="w-4 h-4 text-blue-600" />
      case 'report': return <BarChart3 className="w-4 h-4 text-amber-600" />
      default: return <Users className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className="flex items-start space-x-3">
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        {getActivityIcon()}
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
  )
})

ActivityItem.displayName = 'ActivityItem'

// Componente de progresso otimizado
const ProgressCircle = memo(({ data }) => {
  const colors = COLOR_CLASSES[data.color] || COLOR_CLASSES.primary
  
  return (
    <div className="text-center">
      <div className={`w-20 h-20 mx-auto ${colors.bg} rounded-full flex items-center justify-center mb-3`}>
        <span className={`text-2xl font-bold ${colors.text}`}>{data.percentage}%</span>
      </div>
      <h4 className="font-medium text-gray-900">{data.title}</h4>
      <p className="text-sm text-gray-600">{data.subtitle}</p>
    </div>
  )
})

ProgressCircle.displayName = 'ProgressCircle'

export function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const { 
    activeCompany, 
    isSuperAdmin, 
    isConsultant, 
    isCompanyAdmin,
    isLoading: permissionsLoading 
  } = usePermissions()

  // Memoizar ações rápidas para evitar recálculo
  const quickActions = useMemo(() => {
    const actions = [
      {
        title: 'Nova Empresa',
        description: 'Cadastrar nova empresa no sistema',
        icon: Building2,
        href: '/companies/new',
        color: 'primary',
        show: isSuperAdmin || isConsultant
      },
      {
        title: 'Convidar Usuário',
        description: 'Enviar convite para novo usuário',
        icon: Users,
        href: '/invites',
        color: 'secondary',
        show: isCompanyAdmin || isSuperAdmin || isConsultant
      },
      {
        title: 'Criar Meta',
        description: 'Definir nova meta SMART',
        icon: Target,
        href: '/goals/new',
        color: 'success',
        show: true
      },
      {
        title: 'Ver Relatórios',
        description: 'Acessar relatórios e dashboards',
        icon: BarChart3,
        href: '/reports',
        color: 'warning',
        show: true
      }
    ]

    return actions.filter(action => action.show)
  }, [isSuperAdmin, isConsultant, isCompanyAdmin])

  // Memoizar informações do usuário
  const userInfo = useMemo(() => {
    if (!profile && !user) return { name: 'Carregando...', roleDisplay: '' }
    
    const name = profile?.full_name || user?.email || 'Usuário'
    const company = activeCompany ? `${activeCompany.name} • ` : ''
    
    console.log('Dashboard - Dados do perfil:', {
      profile: profile,
      activeCompany: activeCompany,
      user_companies: profile?.user_companies
    })
    
    const roleMap = {
      'super_admin': 'Super Administrador',
      'consultant': 'Consultor',
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions Otimizado */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ações Rápidas
              </h3>
              <div className="space-y-3">
                {quickActions.map((action) => (
                  <QuickActionCard key={action.title} action={action} />
                ))}
              </div>
            </Card>
          </div>

          {/* Recent Activity Otimizado */}
          <div className="lg:col-span-2">
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
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Progress Overview Otimizado */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Visão Geral do Progresso
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PROGRESS_DATA.map((data, index) => (
              <ProgressCircle key={index} data={data} />
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
