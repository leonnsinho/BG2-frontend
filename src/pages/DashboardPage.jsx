import React, { memo, useMemo, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import { useAdminStats } from '../hooks/useAdminStats'
import { useSuperAdminMetrics } from '../hooks/useSuperAdminMetrics'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { DashboardSkeleton, SmartLoader } from '../components/ui/DashboardLoaders'
import UnlinkedUserMessage from '../components/common/UnlinkedUserMessage'
import { GestorDashboard } from '../components/dashboard/GestorDashboard'
import { UserDashboard } from '../components/dashboard/UserDashboard'
import CompanyAdminDashboard from '../components/dashboard/CompanyAdminDashboard'
import { ProgressMetric } from '../components/dashboard/ProgressMetric'
import { 
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { 
  Users, 
  Building2, 
  BarChart3, 
  Target, 
  TrendingUp,
  Calendar,
  Bell,
  LogOut,
  Zap,
  Globe,
  Activity,
  UserPlus,
  CheckSquare,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'

// Estilos CSS para animações
const styles = `
  @keyframes drawCircle {
    from {
      stroke-dashoffset: 226.19;
    }
    to {
      stroke-dashoffset: 0;
    }
  }
  
  @keyframes pulse-icon {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
  
  .animate-draw-circle {
    animation: drawCircle 2s ease-out forwards;
  }
  
  .animate-pulse-icon {
    animation: pulse-icon 2s infinite;
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}

// Dados estáticos para ações rápidas e ferramentas
const QUICK_ACTIONS = [
  {
    title: 'Gerenciar Empresas',
    description: 'Visualizar e administrar empresas',
    icon: Building2,
    href: '/companies',
    color: 'primary',
    featured: true
  },
  {
    title: 'Usuários Globais',
    description: 'Administrar contas do sistema',
    icon: Users,
    href: '/admin/users',
    color: 'blue'
  },
  {
    title: 'Atribuir Jornadas',
    description: 'Configurar acessos e permissões',
    icon: Target,
    href: '/admin/journey-assignments',
    color: 'success'
  },
  {
    title: 'Relatórios Avançados',
    description: 'Analytics e métricas detalhadas',
    icon: BarChart3,
    href: '/admin/reports',
    color: 'purple',
    featured: true
  }
]

const SYSTEM_METRICS = [
  { label: 'Uptime', value: '99.9%', status: 'excellent' },
  { label: 'Resposta', value: '127ms', status: 'good' },
  { label: 'CPU', value: '23%', status: 'excellent' },
  { label: 'Storage', value: '67%', status: 'warning' }
]

const API_CONNECTIONS = [
  {
    name: 'Supabase Database',
    service: 'supabase',
    status: 'connected',
    responseTime: '45ms',
    lastCheck: new Date()
  },
  {
    name: 'Resend Email API',
    service: 'resend',
    status: 'connected',
    responseTime: '120ms',
    lastCheck: new Date()
  },
  {
    name: 'Storage Service',
    service: 'storage',
    status: 'connected',
    responseTime: '78ms',
    lastCheck: new Date()
  },
  {
    name: 'Authentication',
    service: 'auth',
    status: 'connected',
    responseTime: '32ms',
    lastCheck: new Date()
  }
]

// 🔥 NOVO: Dados para gráficos de evolução semanal
const WEEKLY_CHART_DATA = [
  { day: 'Dom', logins: 45, newUsers: 3, tasks: 12, companies: 1 },
  { day: 'Seg', logins: 78, newUsers: 5, tasks: 24, companies: 2 },
  { day: 'Ter', logins: 92, newUsers: 8, tasks: 31, companies: 3 },
  { day: 'Qua', logins: 85, newUsers: 6, tasks: 28, companies: 2 },
  { day: 'Qui', logins: 103, newUsers: 12, tasks: 35, companies: 4 },
  { day: 'Sex', logins: 95, newUsers: 9, tasks: 29, companies: 3 },
  { day: 'Sáb', logins: 52, newUsers: 4, tasks: 15, companies: 1 }
]

// 🔥 NOVO: Componente de Card com Comparativo
const TrendCard = memo(({ title, value, trend, trendValue, icon: Icon, color = 'blue', loading }) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUpRight className="h-4 w-4" />
    if (trend === 'down') return <ArrowDownRight className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 bg-green-50'
    if (trend === 'down') return 'text-red-600 bg-red-50'
    return 'text-gray-600 bg-gray-50'
  }

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    yellow: 'bg-[#EBA500]'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse">
        <div className="h-16 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${getTrendColor()}`}>
          {getTrendIcon()}
          {trendValue}
        </div>
      </div>
      <div className="mb-1">
        <div className="text-3xl font-bold text-[#373435] mb-1">{value}</div>
        <div className="text-sm text-gray-600">{title}</div>
      </div>
    </div>
  )
})

TrendCard.displayName = 'TrendCard'

// 🔥 NOVO: Componente de Gráfico de Área
const WeeklyAreaChart = memo(({ data, dataKey, color = '#3B82F6', title }) => {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-900">{payload[0].payload.day}</p>
          <p className="text-sm text-gray-600">{title}: <span className="font-bold" style={{ color }}>{payload[0].value}</span></p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="day" 
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={2}
            fillOpacity={1} 
            fill={`url(#color${dataKey})`} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
})

WeeklyAreaChart.displayName = 'WeeklyAreaChart'

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

const RECENT_ACTIVITIES_DEFAULT = [
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

// Componente de estatística com loading para dados reais
const SuperAdminStatCard = memo(({ stat, loading }) => {
  // Sempre usar cor amarela BG2 para todos os cards
  const colors = {
    bg: 'bg-gradient-to-br from-[#EBA500] to-[#EBA500]/80',
    ring: 'ring-[#EBA500]/20',
    progress: 'stroke-[#EBA500]',
    icon: 'text-white',
    value: 'text-[#373435]'
  }
  
  return (
    <div className="group">
      <div className="flex flex-col items-center p-6 bg-white rounded-2xl border border-neutral-100 hover:border-neutral-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
        
        {/* Círculo Principal com Animação */}
        <div className="relative mb-4">
          {/* Círculo de Progresso Animado */}
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
              {/* Círculo de fundo */}
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-neutral-200"
              />
              {/* Círculo de progresso animado */}
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={226.19}
                strokeDashoffset={0}
                className={`${colors.progress} transition-all duration-1000 ease-out`}
                strokeLinecap="round"
                style={{
                  animation: 'drawCircle 2s ease-out forwards'
                }}
              />
            </svg>
            
            {/* Ícone no centro do círculo */}
            <div className={`absolute inset-0 flex items-center justify-center w-12 h-12 ${colors.bg} rounded-full m-auto shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                stat.icon && React.createElement(stat.icon, { className: `w-5 h-5 ${colors.icon}` })
              )}
            </div>
          </div>
        </div>

        {/* Informações */}
        <div className="text-center space-y-2">
          {loading ? (
            <>
              <div className="w-16 h-8 bg-neutral-200 rounded animate-pulse mx-auto"></div>
              <div className="w-20 h-4 bg-neutral-200 rounded animate-pulse mx-auto"></div>
            </>
          ) : (
            <>
              <div className={`text-2xl font-bold ${colors.value} group-hover:scale-105 transition-transform duration-300`}>
                {stat.value}
              </div>
              <div className="text-sm font-medium text-neutral-600 px-2">
                {stat.name}
              </div>
            </>
          )}
          
          {/* Indicador de Tendência */}
          {stat.trend && !loading && (
            <div className="flex items-center justify-center space-x-1 mt-2">
              {stat.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
              {stat.trend === 'down' && <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />}
              {stat.change && (
                <span className={`text-xs font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 
                  stat.trend === 'down' ? 'text-red-600' : 
                  'text-neutral-500'
                }`}>
                  {stat.change}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

SuperAdminStatCard.displayName = 'SuperAdminStatCard'

// Componente de ação rápida com mais personalidade
const QuickActionCard = memo(({ action }) => {
  const getColorClasses = (color, featured) => {
    // Estética escura para todos os cards
    return {
      background: 'bg-[#373435] hover:bg-[#373435]/90 text-white border-[#373435]',
      icon: 'text-[#EBA500]',
      title: 'text-white'
    }
  }
  
  const colors = getColorClasses(action.color, action.featured)
  
  return (
    <Link
      to={action.href}
      className={`group block p-8 border rounded-3xl ${colors.background} hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${colors.icon} bg-white/10 rounded-2xl flex items-center justify-center`}>
          <action.icon className="w-6 h-6" />
        </div>
      </div>
      <div>
        <div className={`text-xl font-bold ${colors.title} mb-2`}>{action.title}</div>
        <div className={`text-sm opacity-80 text-white/80`}>{action.description}</div>
      </div>
    </Link>
  )
})

QuickActionCard.displayName = 'QuickActionCard'

QuickActionCard.displayName = 'QuickActionCard'

// Componente de métrica do sistema com mais personalidade
const SystemMetricItem = memo(({ metric }) => {
  const getStatusColor = (status) => {
    const statusMap = {
      excellent: 'text-white bg-success-500',
      good: 'text-white bg-[#EBA500]',
      warning: 'text-white bg-warning-500'
    }
    return statusMap[status] || statusMap.good
  }
  
  return (
    <div className="text-center">
      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl ${getStatusColor(metric.status)} mb-4 shadow-lg`}>
        <span className="text-xl font-black">{metric.value}</span>
      </div>
      <div className="text-sm font-bold text-[#373435]">{metric.label}</div>
    </div>
  )
})

SystemMetricItem.displayName = 'SystemMetricItem'

// Componente de status de API
const ApiConnectionItem = memo(({ connection }) => {
  const getStatusConfig = (status) => {
    const statusMap = {
      connected: {
        color: 'bg-success-500',
        textColor: 'text-success-600',
        bgColor: 'bg-success-50',
        label: 'Conectado'
      },
      warning: {
        color: 'bg-warning-500',
        textColor: 'text-warning-600',
        bgColor: 'bg-warning-50',
        label: 'Instável'
      },
      error: {
        color: 'bg-red-500',
        textColor: 'text-red-600',
        bgColor: 'bg-red-50',
        label: 'Erro'
      }
    }
    return statusMap[status] || statusMap.connected
  }

  const getServiceIcon = (service) => {
    const iconMap = {
      supabase: '🗄️',
      resend: '📧',
      storage: '☁️',
      auth: '🔐'
    }
    return iconMap[service] || '🔧'
  }
  
  const statusConfig = getStatusConfig(connection.status)
  
  return (
    <div className={`p-4 ${statusConfig.bgColor} rounded-2xl border border-white/50`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="text-lg">{getServiceIcon(connection.service)}</div>
          <div>
            <div className="font-semibold text-[#373435] text-sm">{connection.name}</div>
            <div className="flex items-center space-x-2 mt-1">
              <div className={`w-2 h-2 ${statusConfig.color} rounded-full`}></div>
              <span className={`text-xs font-medium ${statusConfig.textColor}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between text-xs text-neutral-500">
        <span>{connection.responseTime}</span>
        <span>Agora</span>
      </div>
    </div>
  )
})

ApiConnectionItem.displayName = 'ApiConnectionItem'

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

const DashboardPage = memo(() => {
  const { user, profile } = useAuth()
  const { isSuperAdmin, isGestor, isCompanyAdmin, isUnlinkedUser, loading } = usePermissions()
  const { stats, loading: statsLoading, error: statsError, refresh } = useAdminStats()
  
  // Hook para métricas com progress bars - DEVE estar no topo, antes de condicionais
  const { metrics, weeklyComparison } = useSuperAdminMetrics()

  // Função para obter saudação baseada no horário
  const getGreeting = () => {
    const hour = new Date().getHours()
    
    if (hour >= 5 && hour < 12) {
      return 'Bom dia'
    } else if (hour >= 12 && hour < 18) {
      return 'Boa tarde'
    } else {
      return 'Boa noite'
    }
  }

  // Loading otimizado com skeleton
  if (loading) {
    return (
      <Suspense fallback={<SmartLoader />}>
        <DashboardSkeleton />
      </Suspense>
    )
  }

  // Verificar se o usuário é Super Admin - Design BG2 com Dados Reais
  if (isSuperAdmin()) {
    // Mapear dados do hook para o formato dos cards
    const adminStats = [
      {
        name: 'Empresas Ativas',
        value: stats.activeCompanies.value,
        change: stats.activeCompanies.change,
        icon: Building2,
        color: 'primary',
        accent: true,
        loading: stats.activeCompanies.loading
      },
      {
        name: 'Total de Usuários',
        value: stats.totalUsers.value,
        change: stats.totalUsers.change,
        icon: Users,
        color: 'blue',
        loading: stats.totalUsers.loading
      },
      {
        name: 'Jornadas Ativas',
        value: stats.activeJourneys.value,
        change: stats.activeJourneys.change,
        icon: Target,
        color: 'success',
        loading: stats.activeJourneys.loading
      },
      {
        name: 'Total de Processos',
        value: stats.totalProcesses.value,
        change: stats.totalProcesses.change,
        icon: BarChart3,
        color: 'primary',
        loading: stats.totalProcesses.loading
      },
      {
        name: 'Sistema Uptime',
        value: stats.systemUptime.value,
        change: stats.systemUptime.change,
        icon: Activity,
        color: 'neutral',
        accent: true,
        loading: stats.systemUptime.loading
      }
    ]

    return (
      <div className="min-h-screen bg-white">
        <div className="p-8 max-w-7xl mx-auto">
          
          {/* Saudação personalizada */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#373435] mb-2">
              {getGreeting()}, {profile?.full_name || user?.email?.split('@')[0] || 'Admin'}!
            </h1>
            <p className="text-lg text-neutral-600">
              Bem-vindo ao painel administrativo do sistema
            </p>
          </div>
            
            {/* Header com botão de refresh se houver erro */}
            {statsError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center">
                      <Activity className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-800">Erro ao carregar estatísticas</p>
                      <p className="text-sm text-red-600">{statsError}</p>
                    </div>
                  </div>
                  <button
                    onClick={refresh}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    Tentar Novamente
                  </button>
                </div>
              </div>
            )}
            
            {/* 🔥 NOVO: Cards de KPIs Principais com Comparativos */}
            <div className="mb-12">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-[#373435] mb-2">Visão Geral do Sistema</h3>
                <p className="text-[#373435]/60">Principais indicadores em tempo real</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <TrendCard
                  title="Total de Empresas"
                  value={stats.activeCompanies.value || '0'}
                  trend={weeklyComparison?.companies?.trend || 'neutral'}
                  trendValue={`${weeklyComparison?.companies?.value || '0%'} vs semana passada`}
                  icon={Building2}
                  color="blue"
                  loading={stats.activeCompanies.loading}
                />
                <TrendCard
                  title="Total de Usuários"
                  value={stats.totalUsers.value || '0'}
                  trend={weeklyComparison?.users?.trend || 'neutral'}
                  trendValue={`${weeklyComparison?.users?.value || '0%'} vs semana passada`}
                  icon={Users}
                  color="green"
                  loading={stats.totalUsers.loading}
                />
                <TrendCard
                  title="Total de Tarefas"
                  value={stats.totalTasks.value || '0'}
                  trend="neutral"
                  trendValue={stats.totalTasks.change || 'Em andamento'}
                  icon={CheckSquare}
                  color="purple"
                  loading={stats.totalTasks.loading}
                />
              </div>
            </div>

            {/* 🔥 NOVO: Progresso Semanal com Gráficos Visuais */}
            <div className="mb-12">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-[#373435] mb-2">Progresso Semanal</h3>
                <p className="text-[#373435]/60">Evolução detalhada dos últimos 7 dias com comparativos</p>
              </div>

              {/* Grid de Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Gráfico de Logins */}
                <div className="bg-white border-2 border-blue-500/20 rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-[#373435] mb-1">Logins Diários</h4>
                      <p className="text-sm text-gray-600">Total da semana: {metrics.loginsWeek.current || 0}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                      weeklyComparison?.logins?.trend === 'up' ? 'bg-green-50' :
                      weeklyComparison?.logins?.trend === 'down' ? 'bg-red-50' : 'bg-gray-50'
                    }`}>
                      {weeklyComparison?.logins?.trend === 'up' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : weeklyComparison?.logins?.trend === 'down' ? (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      ) : (
                        <Minus className="h-4 w-4 text-gray-600" />
                      )}
                      <span className={`text-sm font-semibold ${
                        weeklyComparison?.logins?.trend === 'up' ? 'text-green-600' :
                        weeklyComparison?.logins?.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {weeklyComparison?.logins?.value || '0%'} vs semana passada
                      </span>
                    </div>
                  </div>
                  <WeeklyAreaChart 
                    data={WEEKLY_CHART_DATA} 
                    dataKey="logins" 
                    color="#3B82F6"
                    title="Logins"
                  />
                </div>

                {/* Gráfico de Novos Usuários */}
                <div className="bg-white border-2 border-green-500/20 rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-[#373435] mb-1">Novos Usuários</h4>
                      <p className="text-sm text-gray-600">Total da semana: {metrics.newAccounts.current || 0}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                      weeklyComparison?.newAccounts?.trend === 'up' ? 'bg-green-50' :
                      weeklyComparison?.newAccounts?.trend === 'down' ? 'bg-red-50' : 'bg-gray-50'
                    }`}>
                      {weeklyComparison?.newAccounts?.trend === 'up' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : weeklyComparison?.newAccounts?.trend === 'down' ? (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      ) : (
                        <Minus className="h-4 w-4 text-gray-600" />
                      )}
                      <span className={`text-sm font-semibold ${
                        weeklyComparison?.newAccounts?.trend === 'up' ? 'text-green-600' :
                        weeklyComparison?.newAccounts?.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {weeklyComparison?.newAccounts?.value || '0%'} vs semana passada
                      </span>
                    </div>
                  </div>
                  <WeeklyAreaChart 
                    data={WEEKLY_CHART_DATA} 
                    dataKey="newUsers" 
                    color="#10B981"
                    title="Novos Usuários"
                  />
                </div>

                {/* Gráfico de Tarefas */}
                <div className="bg-white border-2 border-[#EBA500]/20 rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-[#373435] mb-1">Tarefas Criadas</h4>
                      <p className="text-sm text-gray-600">Total da semana: {metrics.newTasks.current || 0}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                      weeklyComparison?.tasks?.trend === 'up' ? 'bg-green-50' :
                      weeklyComparison?.tasks?.trend === 'down' ? 'bg-red-50' : 'bg-gray-50'
                    }`}>
                      {weeklyComparison?.tasks?.trend === 'up' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : weeklyComparison?.tasks?.trend === 'down' ? (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      ) : (
                        <Minus className="h-4 w-4 text-gray-600" />
                      )}
                      <span className={`text-sm font-semibold ${
                        weeklyComparison?.tasks?.trend === 'up' ? 'text-green-600' :
                        weeklyComparison?.tasks?.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {weeklyComparison?.tasks?.value || '0%'} vs semana passada
                      </span>
                    </div>
                  </div>
                  <WeeklyAreaChart 
                    data={WEEKLY_CHART_DATA} 
                    dataKey="tasks" 
                    color="#EBA500"
                    title="Tarefas"
                  />
                </div>

                {/* Gráfico de Empresas */}
                <div className="bg-white border-2 border-purple-500/20 rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-[#373435] mb-1">Empresas Cadastradas</h4>
                      <p className="text-sm text-gray-600">Total da semana: {metrics.newCompanies.current || 0}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                      weeklyComparison?.newCompanies?.trend === 'up' ? 'bg-green-50' :
                      weeklyComparison?.newCompanies?.trend === 'down' ? 'bg-red-50' : 'bg-gray-50'
                    }`}>
                      {weeklyComparison?.newCompanies?.trend === 'up' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : weeklyComparison?.newCompanies?.trend === 'down' ? (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      ) : (
                        <Minus className="h-4 w-4 text-gray-600" />
                      )}
                      <span className={`text-sm font-semibold ${
                        weeklyComparison?.newCompanies?.trend === 'up' ? 'text-green-600' :
                        weeklyComparison?.newCompanies?.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {weeklyComparison?.newCompanies?.value || '0%'} vs semana passada
                      </span>
                    </div>
                  </div>
                  <WeeklyAreaChart 
                    data={WEEKLY_CHART_DATA} 
                    dataKey="companies" 
                    color="#A855F7"
                    title="Empresas"
                  />
                </div>
              </div>

              {/* Progress Bars Resumidas */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 border-2 border-gray-200 rounded-3xl p-6">
                <h4 className="text-lg font-bold text-[#373435] mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#EBA500]" />
                  Metas da Semana
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ProgressMetric
                    title="Logins (meta: {metrics.loginsWeek.total})"
                    current={metrics.loginsWeek.current}
                    target={metrics.loginsWeek.total}
                    color="blue"
                    loading={metrics.loginsWeek.loading}
                  />
                  <ProgressMetric
                    title="Novas Contas (meta: {metrics.newAccounts.target})"
                    current={metrics.newAccounts.current}
                    target={metrics.newAccounts.target}
                    color="success"
                    loading={metrics.newAccounts.loading}
                  />
                  <ProgressMetric
                    title="Tarefas (meta: {metrics.newTasks.target})"
                    current={metrics.newTasks.current}
                    target={metrics.newTasks.target}
                    color="primary"
                    loading={metrics.newTasks.loading}
                  />
                  <ProgressMetric
                    title="Empresas (meta: {metrics.newCompanies.target})"
                    current={metrics.newCompanies.current}
                    target={metrics.newCompanies.target}
                    color="purple"
                    loading={metrics.newCompanies.loading}
                  />
                </div>
              </div>
            </div>

            {/* Ações Principais - Destaque */}
            <div className="mb-12">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-[#373435] mb-2">Ações Principais</h3>
                <p className="text-neutral-600">Funcionalidades essenciais do sistema</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {QUICK_ACTIONS.map((action) => (
                  <QuickActionCard key={action.title} action={action} />
                ))}
              </div>
            </div>

            {/* Status do Sistema com Destaque BG2 */}
            <div className="bg-white border border-[#EBA500]/20 rounded-3xl p-8 shadow-lg ring-1 ring-[#EBA500]/5">
              <div className="mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#EBA500] rounded-2xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#373435] mb-1">Status do Sistema</h3>
                    <p className="text-neutral-600">Monitoramento em tempo real</p>
                  </div>
                </div>
              </div>
              
              {/* Conexões APIs */}
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-[#373435] rounded-xl flex items-center justify-center">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#373435]">Conexões APIs</h4>
                    <p className="text-sm text-neutral-500">Status dos serviços externos</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {API_CONNECTIONS.map((connection) => (
                    <ApiConnectionItem key={connection.service} connection={connection} />
                  ))}
                </div>
              </div>
              
              {/* Status Global com Personalidade */}
              <div className="pt-8 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-4 h-4 bg-success-500 rounded-full animate-pulse shadow-lg shadow-success-200"></div>
                    <div>
                      <span className="text-lg font-bold text-[#373435]">Sistema Operacional</span>
                      <p className="text-sm text-neutral-500">Todos os serviços funcionando perfeitamente</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-[#EBA500]">99.9% Uptime</div>
                    <div className="text-xs text-neutral-400">Atualizado agora</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    )
  }

  // Dashboard específico para Company Admin
  if (isCompanyAdmin() && !isUnlinkedUser()) {
    return <CompanyAdminDashboard />
  }

  // Dashboard específico para gestores
  if (isGestor() && !isUnlinkedUser()) {
    return <GestorDashboard />
  }

  // Usuário não está vinculado a uma empresa
  if (isUnlinkedUser()) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <UnlinkedUserMessage />
      </div>
    )
  }

  // Dashboard específico para usuários comuns (role 'user')
  if (profile?.role === 'user' && !isUnlinkedUser()) {
    return <UserDashboard />
  }

  // Dashboard padrão para outros tipos de usuário
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Bem-vindo ao seu painel de controle
        </p>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Suas Atividades
            </h3>
            <p className="text-gray-600">
              Você ainda não possui atividades registradas.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Progresso
            </h3>
            <p className="text-gray-600">
              Acompanhe seu desenvolvimento aqui.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Próximos Passos
            </h3>
            <p className="text-gray-600">
              Configure seu perfil para começar.
            </p>
          </Card>
        </div>
      </div>
    )
})

DashboardPage.displayName = 'DashboardPage'

export { DashboardPage }
export default DashboardPage
