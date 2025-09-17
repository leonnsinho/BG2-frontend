import React, { memo, useMemo, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { DashboardSkeleton, SmartLoader } from '../components/ui/DashboardLoaders'
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
  const { user, profile, loading: authLoading } = useAuth()
  const { 
    activeCompany, 
    isSuperAdmin, 
    isConsultant, 
    isCompanyAdmin,
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
