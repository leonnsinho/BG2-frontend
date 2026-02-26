import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import { useNavigate, Link } from 'react-router-dom'
import { useToolPermissions } from '../../hooks/useToolPermissions'
import toast from 'react-hot-toast'
import { 
  Users, 
  Target, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Calendar,
  FileText,
  Building2,
  ArrowUpCircle,
  ArrowDownCircle,
  UserCircle,
  Award,
  Sun,
  Moon,
  Link as LinkIcon,
  Copy,
  Check
} from 'lucide-react'

// Componente de Atalhos Rápidos
const QuickAppsCard = () => {
  const navigate = useNavigate()
  const { hasToolAccess, loading: toolPermissionsLoading } = useToolPermissions()

  const apps = [
    {
      name: 'Fluxo De Caixa',
      image: '/fluxo de caixa.png',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      shadowColor: 'rgba(16, 185, 129, 0.4)',
      href: '/dfc',
      toolSlug: 'dfc-complete'
    },
    {
      name: 'Avaliação De Desempenho',
      image: '/avaliação de desempenho.png',
      gradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
      shadowColor: 'rgba(168, 85, 247, 0.4)',
      href: '/performance-evaluation',
      toolSlug: 'performance-evaluation'
    },
    {
      name: 'Indicadores De Gestão',
      image: '/indicadores de gestão.png',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      shadowColor: 'rgba(245, 158, 11, 0.4)',
      href: '/indicators',
      toolSlug: 'management-indicators'
    },
    {
      name: 'CRM',
      image: '/crm.png',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      shadowColor: 'rgba(59, 130, 246, 0.4)',
      href: '/crm',
      disabled: true
    }
  ]

  // Filtrar apps baseado nas permissões
  const filteredApps = apps.filter(app => {
    // Se o app está desabilitado (em breve), sempre mostrar
    if (app.disabled) return true
    // Se tem toolSlug, verificar permissão
    if (app.toolSlug) return hasToolAccess(app.toolSlug)
    // Se não tem toolSlug, sempre mostrar
    return true
  })

  return (
    <div className="mb-6 sm:mb-8">
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Fundo com gradiente animado */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#EBA500]/10 via-[#373435]/5 to-purple-500/10"></div>
        
        {/* Padrão de grid sutil */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, rgba(235, 165, 0, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(235, 165, 0, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}></div>
        
        {/* Círculos decorativos blur */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#EBA500]/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        {/* Brilho superior */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
        
        {/* Conteúdo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-[#EBA500] to-[#d89500] shadow-lg">
              <div className="grid grid-cols-2 gap-0.5">
                <div className="w-1 h-1 bg-white rounded-sm"></div>
                <div className="w-1 h-1 bg-white rounded-sm"></div>
                <div className="w-1 h-1 bg-white rounded-sm"></div>
                <div className="w-1 h-1 bg-white rounded-sm"></div>
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#373435] to-[#5a5556] bg-clip-text text-transparent">
              Biblioteca de Ferramentas
            </h2>
          </div>
        </div>
        
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
          {filteredApps.map((app) => {
            const isDisabled = app.disabled
            
            return (
              <div key={app.name} className="flex flex-col items-center group">
                <button
                  onClick={() => !isDisabled && navigate(app.href)}
                  disabled={isDisabled}
                  className={`relative w-full aspect-square rounded-[28%] transition-all duration-300 ${
                    isDisabled 
                      ? 'cursor-not-allowed opacity-60 scale-95' 
                      : 'cursor-pointer hover:scale-105 active:scale-95'
                  }`}
                  style={{
                    background: app.gradient,
                    boxShadow: isDisabled 
                      ? '0 4px 12px rgba(0,0,0,0.1)'
                      : `0 8px 24px ${app.shadowColor}, 0 4px 12px rgba(0,0,0,0.1)`
                  }}
                >
                  {/* Badge "Em breve" */}
                  {isDisabled && (
                    <div className="absolute -top-1 -right-1 z-10">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur opacity-75"></div>
                        <span className="relative flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-[8px] font-black rounded-full shadow-lg border-2 border-white">
                          !
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Brilho superior */}
                  <div className="absolute inset-0 rounded-[28%] bg-gradient-to-b from-white/30 via-transparent to-transparent pointer-events-none"></div>
                  
                  {/* Ícone do App */}
                  <div className="absolute inset-0 flex items-center justify-center p-3">
                    <img 
                      src={app.image}
                      alt={app.name}
                      className={`w-full h-full object-contain transition-all duration-300 ${
                        !isDisabled && 'group-hover:scale-110'
                      }`}
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                    />
                  </div>
                </button>
                
                {/* Nome do App */}
                <span className={`mt-2 text-[10px] sm:text-xs font-semibold text-center leading-tight transition-all duration-300 ${
                  isDisabled 
                    ? 'text-gray-400' 
                    : 'text-[#373435] group-hover:text-[#EBA500] group-hover:scale-105'
                }`}>
                  {app.name}
                </span>
                
                {/* Indicador "Em breve" */}
                {isDisabled && (
                  <span className="mt-1 text-[8px] sm:text-[9px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                    Em breve
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Componente de Link de Convite
const InviteLinkCard = ({ companyId }) => {
  const [inviteToken, setInviteToken] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInviteToken()
  }, [companyId])

  const loadInviteToken = async () => {
    if (!companyId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('companies')
        .select('invite_token')
        .eq('id', companyId)
        .single()

      if (error) throw error
      if (data?.invite_token) {
        setInviteToken(data.invite_token)
      }
    } catch (error) {
      console.error('Erro ao carregar token de convite:', error)
      toast.error('Erro ao carregar link de convite')
    } finally {
      setLoading(false)
    }
  }

  const getInviteUrl = () => {
    if (!inviteToken) return ''
    const baseUrl = window.location.origin
    return `${baseUrl}/register?invite=${inviteToken}`
  }

  const copyInviteLink = async () => {
    const inviteUrl = getInviteUrl()
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      toast.success('Link copiado para área de transferência!')
      setTimeout(() => setCopied(false), 3000)
    } catch (error) {
      console.error('Erro ao copiar:', error)
      toast.error('Erro ao copiar link')
    }
  }

  if (loading) {
    return (
      <div className="mb-6 sm:mb-8">
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!inviteToken) return null

  return (
    <div className="mb-6 sm:mb-8">
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Fundo com gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
        
        {/* Padrão de grid sutil */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}></div>
        
        {/* Círculos decorativos blur */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"></div>
        
        {/* Brilho superior */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        
        {/* Conteúdo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <LinkIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Link de Convite da Empresa
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                Compartilhe este link para cadastrar novos usuários
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={getInviteUrl()}
                readOnly
                className="w-full px-4 py-3 pr-12 bg-white border-2 border-gray-200 rounded-xl text-sm font-mono text-gray-700 focus:outline-none focus:border-blue-400 transition-colors"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <LinkIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <button
              onClick={copyInviteLink}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all transform active:scale-95 ${
                copied
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/30'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span className="hidden sm:inline">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="hidden sm:inline">Copiar Link</span>
                  <span className="sm:hidden">Copiar</span>
                </>
              )}
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50/50 border border-blue-200/50 rounded-xl">
            <p className="text-xs text-blue-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                Novos usuários que se cadastrarem usando este link serão automaticamente associados à sua empresa.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Função auxiliar para obter cores do gradiente
const getGradientColors = (colorClass) => {
  const colorMap = {
    'from-green-500 to-emerald-600': '#10b981, #059669',
    'from-red-500 to-rose-600': '#ef4444, #e11d48',
    'from-blue-500 to-indigo-600': '#3b82f6, #4f46e5',
    'from-purple-500 to-violet-600': '#a855f7, #7c3aed'
  }
  return colorMap[colorClass] || '#EBA500, #373435'
}

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
  const [companyId, setCompanyId] = useState(null)

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
      const currentCompanyId = getCompanyId()
      
      if (!currentCompanyId) {
        console.error('Company ID não encontrado')
        return
      }

      setCompanyId(currentCompanyId)

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
                      Olá, {profile?.full_name?.split(' ')[0] || 'Administrador'}!
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
              
              {/* Ícone decorativo Sol/Lua - apenas desktop */}
              <div className="hidden lg:flex items-center justify-center">
                {(() => {
                  const hour = new Date().getHours()
                  const isDay = hour >= 6 && hour < 18
                  
                  if (isDay) {
                    return (
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                        <div className="relative w-14 h-14 lg:w-20 lg:h-20 flex items-center justify-center">
                          <img 
                            src="/sun.gif" 
                            alt="Sol"
                            className="w-full h-full object-contain drop-shadow-2xl"
                          />
                        </div>
                      </div>
                    )
                  } else {
                    return (
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                        <div className="relative w-14 h-14 lg:w-20 lg:h-20 flex items-center justify-center">
                          <img 
                            src="/moon.gif" 
                            alt="Lua"
                            className="w-full h-full object-contain drop-shadow-2xl"
                          />
                        </div>
                      </div>
                    )
                  }
                })()}
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
                <div className="text-center py-6 sm:py-8 px-4">
                  <div className="p-3 bg-[#EBA500]/10 rounded-full w-fit mx-auto mb-3">
                    <Target className="h-8 w-8 sm:h-10 sm:w-10 text-[#EBA500]" />
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-gray-700 mb-1">
                    Você ainda não iniciou seu planejamento estratégico.
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mb-4">
                    Defina objetivos, metas e acompanhe o progresso da sua empresa.
                  </p>
                  <Link
                    to="/planejamento-estrategico"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#EBA500] text-white text-sm font-medium rounded-xl hover:bg-[#d99500] active:scale-95 transition-all shadow-sm"
                  >
                    <Target className="h-4 w-4" />
                    Planejamento Estratégico
                  </Link>
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

        {/* Biblioteca de Ferramentas */}
        <QuickAppsCard />

        {/* Link de Convite da Empresa */}
        {companyId && <InviteLinkCard companyId={companyId} />}

      </div>
    </div>
  )
}
