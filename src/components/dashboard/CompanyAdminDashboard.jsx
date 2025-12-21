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
  const [avatarUrl, setAvatarUrl] = useState('')
  const [companyLogo, setCompanyLogo] = useState('')

  // Carregar avatar do perfil
  useEffect(() => {
    const loadAvatar = async () => {
      if (!profile?.id) return

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', profile.id)
          .single()

        if (profileError) throw profileError

        if (profileData?.avatar_url) {
          const { data: urlData, error: urlError } = await supabase.storage
            .from('profile-avatars')
            .createSignedUrl(profileData.avatar_url, 3600)

          if (!urlError && urlData?.signedUrl) {
            setAvatarUrl(urlData.signedUrl)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar avatar:', error)
      }
    }

    loadAvatar()
  }, [profile?.id])

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

      // Buscar nome e logo da empresa
      const { data: companyData } = await supabase
        .from('companies')
        .select('name, logo_url')
        .eq('id', companyId)
        .single()
      
      if (companyData) {
        setCompanyName(companyData.name)
        
        // Carregar logo se existir
        if (companyData.logo_url) {
          try {
            const { data: logoData, error: logoError } = await supabase.storage
              .from('company-avatars')
              .createSignedUrl(companyData.logo_url, 3600)

            if (!logoError && logoData?.signedUrl) {
              setCompanyLogo(logoData.signedUrl)
            }
          } catch (logoError) {
            console.error('Erro ao carregar logo:', logoError)
          }
        }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header com Saudação */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex-1 min-w-0 w-full">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  {/* Foto de perfil */}
                  {avatarUrl && (
                    <div className="relative flex-shrink-0">
                      <img 
                        src={avatarUrl} 
                        alt={profile?.full_name || 'Administrador'}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-[#EBA500]"
                        onError={(e) => {
                          e.target.parentElement.style.display = 'none'
                        }}
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#373435] tracking-tight truncate">
                      {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Administrador'}!
                    </h1>
                    {companyName && (
                      <div className="flex items-center gap-2 mt-1 text-gray-600">
                        {companyLogo ? (
                          <img 
                            src={companyLogo} 
                            alt={companyName}
                            className="w-4 h-4 sm:w-5 sm:h-5 object-contain rounded"
                            onError={(e) => {
                              e.target.style.display = 'none'
                            }}
                          />
                        ) : (
                          <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-[#EBA500] flex-shrink-0" />
                        )}
                        <p className="text-sm sm:text-base lg:text-lg font-medium truncate">
                          Administrando: {companyName}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                  Acompanhe as métricas e o progresso da sua empresa
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 mb-6 sm:mb-8">
          {/* Total de Usuários */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-2.5 lg:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-xs sm:text-sm font-semibold">
                <TrendingUp className="h-4 w-4" />
                <span>{stats.activeUsers} ativos</span>
              </div>
            </div>
            <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Total de Usuários</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>

          {/* Total de Tarefas */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-2.5 lg:p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-xs sm:text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                <span>{Math.round((stats.completedTasks / stats.totalTasks) * 100) || 0}%</span>
              </div>
            </div>
            <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Total de Tarefas</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
          </div>
        </div>

        {/* Grid com 2 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
          
          {/* Status das Tarefas */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Status das Tarefas</h2>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Pendentes */}
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-gray-200 rounded-lg flex-shrink-0">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">Pendentes</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Aguardando início</p>
                  </div>
                </div>
                <span className="text-xl sm:text-2xl font-bold text-gray-900 flex-shrink-0">{stats.pendingTasks}</span>
              </div>

              {/* Em Andamento */}
              <div className="flex items-center justify-between p-3 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl hover:bg-blue-100 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-blue-200 rounded-lg flex-shrink-0">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-blue-900 text-sm sm:text-base">Em Andamento</p>
                    <p className="text-xs sm:text-sm text-blue-600 truncate">Em execução</p>
                  </div>
                </div>
                <span className="text-xl sm:text-2xl font-bold text-blue-900 flex-shrink-0">{stats.inProgressTasks}</span>
              </div>

              {/* Concluídas */}
              <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg sm:rounded-xl hover:bg-green-100 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-green-200 rounded-lg flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-green-900 text-sm sm:text-base">Concluídas</p>
                    <p className="text-xs sm:text-sm text-green-600 truncate">Finalizadas com sucesso</p>
                  </div>
                </div>
                <span className="text-xl sm:text-2xl font-bold text-green-900 flex-shrink-0">{stats.completedTasks}</span>
              </div>

              {/* Atrasadas */}
              {stats.overdueTasks > 0 && (
                <div className="flex items-center justify-between p-3 sm:p-4 bg-red-50 rounded-lg sm:rounded-xl border-2 border-red-200 animate-pulse">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="p-1.5 sm:p-2 bg-red-200 rounded-lg flex-shrink-0">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-red-900 text-sm sm:text-base">Atrasadas</p>
                      <p className="text-xs sm:text-sm text-red-600 truncate">Requerem atenção urgente</p>
                    </div>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-red-900 flex-shrink-0">{stats.overdueTasks}</span>
                </div>
              )}
            </div>
          </div>

          {/* Atividades Recentes */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Atividades Recentes</h2>
            </div>

            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-gray-500">
                  <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm sm:text-base">Nenhuma atividade recente</p>
                </div>
              ) : (
                recentActivities.map((activity) => {
                  const StatusIcon = getStatusIcon(activity.status)
                  return (
                    <div key={activity.id} className="flex items-start gap-2 sm:gap-3 p-3 sm:p-3 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors">
                      <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${getStatusColor(activity.status)}`}>
                        <StatusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">{activity.title}</p>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                          <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(activity.status)}`}>
                            {getStatusLabel(activity.status)}
                          </span>
                          <span className="text-[10px] sm:text-xs text-gray-500">
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
        <div className="mt-4 sm:mt-5 lg:mt-6 bg-gradient-to-br from-[#EBA500]/10 to-[#d99500]/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-[#EBA500]/20">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-1.5 sm:p-2 bg-[#EBA500] rounded-lg flex-shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Métricas de Performance</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Taxa de Conclusão</span>
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {Math.round((stats.completedTasks / stats.totalTasks) * 100) || 0}%
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((stats.completedTasks / stats.totalTasks) * 100) || 0}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Usuários Ativos</span>
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
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
