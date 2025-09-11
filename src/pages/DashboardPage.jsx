import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/useAuth'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
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

export function DashboardPage() {
  const { user, profile } = useAuth()
  const { activeCompany, isSuperAdmin, isConsultant, isCompanyAdmin } = usePermissions()

  const stats = [
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

  const recentActivities = [
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

  const quickActions = [
    {
      title: 'Nova Empresa',
      description: 'Cadastrar nova empresa no sistema',
      icon: Building2,
      href: '/companies/new',
      color: 'primary',
      show: isSuperAdmin() || isConsultant()
    },
    {
      title: 'Convidar Usuário',
      description: 'Enviar convite para novo usuário',
      icon: Users,
      href: '/users/invite',
      color: 'secondary',
      show: isCompanyAdmin()
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
  ].filter(action => action.show)

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Olá, {profile?.full_name || user?.email}! 👋
            </h1>
            <p className="text-gray-600">
              {activeCompany ? `${activeCompany.name} • ` : ''}
              {profile?.role === 'super_admin' && 'Super Administrador'}
              {profile?.role === 'consultant' && 'Consultor'}
              {profile?.role === 'company_admin' && 'Administrador'}
              {profile?.role === 'user' && 'Usuário'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Bell className="w-4 h-4 mr-2" />
              Notificações
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.name} className="p-6">
              <div className="flex items-center">
                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <div className="flex items-center">
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <p className="ml-2 text-sm text-success-600">{stat.change}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ações Rápidas
              </h3>
              <div className="space-y-3">
                {quickActions.map((action) => (
                  <a
                    key={action.title}
                    href={action.href}
                    className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-10 h-10 bg-${action.color}-100 rounded-lg flex items-center justify-center`}>
                      <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{action.title}</p>
                      <p className="text-xs text-gray-600">{action.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
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
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      {activity.type === 'login' && <LogOut className="w-4 h-4 text-gray-600" />}
                      {activity.type === 'goal' && <Target className="w-4 h-4 text-success-600" />}
                      {activity.type === 'company' && <Building2 className="w-4 h-4 text-primary-600" />}
                      {activity.type === 'report' && <BarChart3 className="w-4 h-4 text-warning-600" />}
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
