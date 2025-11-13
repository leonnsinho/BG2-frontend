import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import { 
  Users, 
  Target, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Calendar,
  FileText,
  Building2
} from 'lucide-react'

export default function CompanyAdminDashboard() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    activeUsers: 0
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    if (profile?.company_id || (profile?.user_companies && profile.user_companies.length > 0)) {
      loadDashboardData()
    }
  }, [profile])

  const getCompanyId = () => {
    return profile?.company_id || profile?.user_companies?.[0]?.company_id
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const companyId = getCompanyId()
      
      if (!companyId) {
        console.error('Company ID não encontrado')
        return
      }

      // Buscar nome da empresa
      const { data: companyData } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single()
      
      if (companyData) {
        setCompanyName(companyData.name)
      }

      // Buscar total de usuários da empresa
      const { data: userCompanies, error: ucError } = await supabase
        .from('user_companies')
        .select('user_id, is_active')
        .eq('company_id', companyId)

      const totalUsers = userCompanies?.length || 0
      const activeUsers = userCompanies?.filter(uc => uc.is_active).length || 0

      // Buscar tarefas da empresa
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, status, due_date')
        .eq('company_id', companyId)

      const now = new Date()
      const overdueTasks = tasks?.filter(t => 
        t.status !== 'completed' && 
        t.due_date && 
        new Date(t.due_date) < now
      ).length || 0

      setStats({
        totalUsers,
        totalTasks: tasks?.length || 0,
        pendingTasks: tasks?.filter(t => t.status === 'pending').length || 0,
        inProgressTasks: tasks?.filter(t => t.status === 'in_progress').length || 0,
        completedTasks: tasks?.filter(t => t.status === 'completed').length || 0,
        overdueTasks,
        activeUsers
      })

      // Buscar atividades recentes (últimas tarefas criadas/atualizadas)
      const { data: recentTasks } = await supabase
        .from('tasks')
        .select('id, title, status, created_at, updated_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentActivities(recentTasks || [])

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckCircle2
      case 'in_progress': return Clock
      case 'pending': return AlertCircle
      default: return FileText
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50'
      case 'in_progress': return 'text-blue-600 bg-blue-50'
      case 'pending': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Concluída'
      case 'in_progress': return 'Em Andamento'
      case 'pending': return 'Pendente'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header com Saudação */}
        <div className="mb-10">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#EBA500] to-[#d99500] rounded-2xl flex items-center justify-center shadow-lg">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#EBA500] rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-[#373435] tracking-tight">
                      {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Administrador'}!
                    </h1>
                    {companyName && (
                      <p className="text-lg text-gray-600 font-medium flex items-center mt-1">
                        <Building2 className="w-4 h-4 mr-2 text-[#EBA500]" />
                        Administrando: {companyName}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 text-lg">
                  Acompanhe as métricas e o progresso da sua empresa
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Total de Usuários */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                <TrendingUp className="h-4 w-4" />
                <span>{stats.activeUsers} ativos</span>
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total de Usuários</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>

          {/* Total de Tarefas */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                <span>{Math.round((stats.completedTasks / stats.totalTasks) * 100) || 0}%</span>
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total de Tarefas</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
          </div>
        </div>

        {/* Grid com 2 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Status das Tarefas */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Status das Tarefas</h2>
            </div>

            <div className="space-y-4">
              {/* Pendentes */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Pendentes</p>
                    <p className="text-sm text-gray-600">Aguardando início</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.pendingTasks}</span>
              </div>

              {/* Em Andamento */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-200 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">Em Andamento</p>
                    <p className="text-sm text-blue-600">Em execução</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-900">{stats.inProgressTasks}</span>
              </div>

              {/* Concluídas */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-200 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">Concluídas</p>
                    <p className="text-sm text-green-600">Finalizadas com sucesso</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-900">{stats.completedTasks}</span>
              </div>

              {/* Atrasadas */}
              {stats.overdueTasks > 0 && (
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border-2 border-red-200 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-200 rounded-lg">
                      <Calendar className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-900">Atrasadas</p>
                      <p className="text-sm text-red-600">Requerem atenção urgente</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-red-900">{stats.overdueTasks}</span>
                </div>
              )}
            </div>
          </div>

          {/* Atividades Recentes */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Atividades Recentes</h2>
            </div>

            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma atividade recente</p>
                </div>
              ) : (
                recentActivities.map((activity) => {
                  const StatusIcon = getStatusIcon(activity.status)
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{activity.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(activity.status)}`}>
                            {getStatusLabel(activity.status)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(activity.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Métricas de Performance */}
        <div className="mt-6 bg-gradient-to-br from-[#EBA500]/10 to-[#d99500]/10 rounded-2xl p-6 border border-[#EBA500]/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#EBA500] rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Métricas de Performance</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Taxa de Conclusão</span>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round((stats.completedTasks / stats.totalTasks) * 100) || 0}%
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((stats.completedTasks / stats.totalTasks) * 100) || 0}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Usuários Ativos</span>
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round((stats.activeUsers / stats.totalUsers) * 100) || 0}%
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((stats.activeUsers / stats.totalUsers) * 100) || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
