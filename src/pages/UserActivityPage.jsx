import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  Users,
  Activity,
  Clock,
  TrendingUp,
  Search,
  Filter,
  Download,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Building2,
  Loader,
  Eye,
  X,
  FileText
} from 'lucide-react'

// Injetar animação CSS para o modal (mesma do sistema)
if (typeof document !== 'undefined' && !document.getElementById('modal-slide-animation')) {
  const style = document.createElement('style')
  style.id = 'modal-slide-animation'
  style.textContent = `
    @keyframes modalSlideIn {
      0% {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `
  document.head.appendChild(style)
}

function UserActivityPage() {
  const { profile } = useAuth()
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [companies, setCompanies] = useState([])
  const [avatarUrls, setAvatarUrls] = useState({})
  
  // 🔥 NOVO: Estado para modal de tarefas
  const [showTasksModal, setShowTasksModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userTasks, setUserTasks] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [taskCreators, setTaskCreators] = useState({})
  
  // Estado para modal de status
  const [showStatusModal, setShowStatusModal] = useState(false) // 🔥 Mapa de IDs para nomes
  const [taskFilter, setTaskFilter] = useState('all') // 🔥 NOVO: Filtro de tarefas

  // Verificar se é super_admin
  const isSuperAdmin = () => {
    return profile?.role === 'super_admin'
  }

  // Verificar se é company_admin
  const isCompanyAdmin = () => {
    return profile?.role === 'company_admin' || 
           profile?.user_companies?.some(uc => uc.is_active && uc.role === 'company_admin')
  }

  // Obter empresa do company_admin
  const getCurrentUserCompany = () => {
    if (!profile?.user_companies) return null
    return profile.user_companies.find(uc => uc.is_active)?.companies
  }

  useEffect(() => {
    fetchUserActivity()
    fetchCompanies()
  }, [])

  // Carregar avatars dos usuários
  useEffect(() => {
    const loadAvatars = async () => {
      if (users.length === 0) return
      
      console.log('📸 Carregando avatares. Total de usuários:', users.length)
      
      // Buscar avatar_url da tabela profiles
      const userIds = users.map(u => u.id)
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', userIds)
      
      if (error) {
        console.error('❌ Erro ao buscar profiles:', error)
        return
      }
      
      console.log('📋 Profiles carregados:', profilesData)
      
      const urls = {}
      for (const profile of (profilesData || [])) {
        console.log('👤 Profile:', profile.id, 'avatar_url:', profile.avatar_url)
        if (profile.avatar_url) {
          const { data, error: urlError } = await supabase.storage
            .from('profile-avatars')
            .createSignedUrl(profile.avatar_url, 3600)
          
          if (urlError) {
            console.error('❌ Erro ao gerar URL para', profile.id, urlError)
          }
          
          if (data?.signedUrl) {
            console.log('✅ URL gerada para', profile.id)
            urls[profile.id] = data.signedUrl
          }
        }
      }
      console.log('📦 Total de avatares carregados:', Object.keys(urls).length)
      setAvatarUrls(urls)
    }
    
    loadAvatars()
  }, [users])

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
    }
  }

  const fetchUserActivity = async () => {
    try {
      setLoading(true)
      console.log('📊 Carregando atividade de usuários...')
      console.log('👤 Perfil do usuário:', {
        role: profile?.role,
        isSuperAdmin: isSuperAdmin(),
        isCompanyAdmin: isCompanyAdmin()
      })

      // Obter empresa atual se for company_admin
      const currentCompany = getCurrentUserCompany()
      console.log('🏢 Empresa atual:', currentCompany?.name || 'nenhuma')

      // Buscar dados da view com filtro por empresa se necessário
      let query = supabase
        .from('user_activity_summary')
        .select('*')

      // Se for company_admin (e não super_admin), filtrar por empresa
      if (isCompanyAdmin() && !isSuperAdmin() && currentCompany) {
        console.log('🔍 Filtrando por empresa:', currentCompany.id)
        query = query.eq('primary_company_id', currentCompany.id)
      }

      const { data: usersData, error: usersError } = await query
        .order('last_login_at', { ascending: false, nullsFirst: false })

      if (usersError) {
        console.error('❌ Erro ao buscar user_activity_summary:', usersError)
        console.error('❌ Código do erro:', usersError.code)
        console.error('❌ Detalhes:', usersError.details)
        console.error('❌ Mensagem:', usersError.message)
        
        // Se a view não existir, tentar criar dados mock ou buscar direto do profiles
        if (usersError.code === '42P01' || usersError.message.includes('does not exist')) {
          console.warn('⚠️ View user_activity_summary não existe. Buscando dados de profiles...')
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
          
          if (profilesError) {
            console.error('❌ Erro ao buscar profiles:', profilesError)
            throw profilesError
          }
          
          console.log('✅ Dados de profiles carregados:', profilesData?.length, 'usuários')
          // Formatar dados do profiles para estrutura esperada
          const formattedData = (profilesData || []).map(p => ({
            id: p.id,
            email: p.email,
            full_name: p.full_name,
            role: p.role,
            last_login_at: p.last_login_at,
            login_count: p.login_count || 0,
            first_login_at: p.first_login_at,
            last_activity_at: p.last_activity_at,
            registered_at: p.created_at,
            is_active: p.is_active,
            days_since_last_login: p.last_login_at ? Math.floor((new Date() - new Date(p.last_login_at)) / (1000 * 60 * 60 * 24)) : null,
            activity_status: !p.last_login_at ? 'never_accessed' : 
                            Math.floor((new Date() - new Date(p.last_login_at)) / (1000 * 60 * 60 * 24)) < 7 ? 'active' :
                            Math.floor((new Date() - new Date(p.last_login_at)) / (1000 * 60 * 60 * 24)) < 30 ? 'moderate' :
                            Math.floor((new Date() - new Date(p.last_login_at)) / (1000 * 60 * 60 * 24)) < 90 ? 'inactive' : 'very_inactive',
            tasks_created: 0,
            tasks_completed: 0,
            task_completion_rate: 0,
            comments_made: 0,
            companies_count: 0,
            primary_company_name: null,
            primary_company_id: null,
            tasks_overdue: 0
          }))
          setUsers(formattedData)
        } else {
          throw usersError
        }
      } else {
        console.log('✅ Dados de usuários carregados:', usersData?.length, 'usuários')
        console.log('📋 Primeiros 3 usuários:', usersData?.slice(0, 3))
        setUsers(usersData || [])
      }

      // Buscar estatísticas
      console.log('📊 Carregando estatísticas...')
      
      // Se for company_admin, calcular estatísticas apenas da empresa
      if (isCompanyAdmin() && !isSuperAdmin() && currentCompany && usersData) {
        const filteredUsers = usersData
        const totalUsers = filteredUsers.length
        const activeUsers = filteredUsers.filter(u => u.activity_status === 'active').length
        const totalLogins = filteredUsers.reduce((sum, u) => sum + (u.login_count || 0), 0)
        const inactiveUsers = filteredUsers.filter(u => u.activity_status === 'inactive' || u.activity_status === 'very_inactive').length
        const neverAccessedUsers = filteredUsers.filter(u => u.activity_status === 'never_accessed').length
        const totalOverdueTasks = filteredUsers.reduce((sum, u) => sum + (u.tasks_overdue || 0), 0)

        setStats({
          total_users: totalUsers,
          active_users: activeUsers,
          active_percentage: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
          total_logins: totalLogins,
          avg_login_count: totalUsers > 0 ? totalLogins / totalUsers : 0,
          inactive_users: inactiveUsers,
          never_accessed_users: neverAccessedUsers,
          total_overdue_tasks: totalOverdueTasks
        })
        console.log('✅ Estatísticas da empresa calculadas')
      } else {
        // Super admin - usar RPC para estatísticas globais
        const { data: statsData, error: statsError } = await supabase
          .rpc('get_user_activity_stats')

        if (statsError) {
          console.error('❌ Erro ao carregar estatísticas:', statsError.message, statsError)
        } else if (statsData && statsData.length > 0) {
          console.log('✅ Estatísticas globais carregadas:', statsData[0])
          setStats(statsData[0])
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar atividade de usuários:', error.message || error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar usuários
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.primary_company_name?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || user.activity_status === statusFilter
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesCompany = companyFilter === 'all' || user.company_id === companyFilter

      return matchesSearch && matchesStatus && matchesRole && matchesCompany
    })
  }, [users, searchTerm, statusFilter, roleFilter, companyFilter])

  const getStatusBadge = (status) => {
    const badges = {
      active: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: CheckCircle,
        label: 'Ativo'
      },
      moderate: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: AlertCircle,
        label: 'Moderado'
      },
      inactive: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        icon: Clock,
        label: 'Inativo'
      },
      very_inactive: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: XCircle,
        label: 'Muito Inativo'
      },
      never_accessed: {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        icon: XCircle,
        label: 'Nunca Acessou'
      }
    }

    const badge = badges[status] || badges.never_accessed
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    )
  }

  const getRoleLabel = (role) => {
    const roles = {
      super_admin: 'Super Admin',
      company_admin: 'Admin da Empresa',
      gestor: 'Gestor',
      gestor_financeiro: 'Gestor Financeiro',
      gestor_estrategico: 'Gestor Estratégico',
      gestor_pessoas_cultura: 'Gestor de Pessoas',
      gestor_vendas_marketing: 'Gestor de Vendas',
      gestor_operacional: 'Gestor Operacional',
      user: 'Usuário'
    }
    return roles[role] || role
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 🔥 NOVO: Função para buscar tarefas detalhadas do usuário
  const fetchUserTasks = async (userId) => {
    setLoadingTasks(true)
    try {
      console.log('🔍 Buscando tarefas para usuário:', userId)
      
      // Buscar apenas os dados básicos da tarefa sem joins
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro na query:', error)
        throw error
      }
      
      console.log('📋 Tarefas carregadas:', data?.length)
      console.log('📦 Dados das tarefas:', data)
      setUserTasks(data || [])

      // 🔥 Buscar nomes dos criadores
      if (data && data.length > 0) {
        const creatorIds = [...new Set(data.map(task => task.created_by).filter(Boolean))]
        
        if (creatorIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', creatorIds)

          if (!profilesError && profiles) {
            const creatorsMap = {}
            profiles.forEach(profile => {
              creatorsMap[profile.id] = profile.full_name || profile.email
            })
            console.log('👥 Criadores carregados:', creatorsMap)
            setTaskCreators(creatorsMap)
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar tarefas:', error.message || error)
      setUserTasks([])
    } finally {
      setLoadingTasks(false)
    }
  }

  // 🔥 NOVO: Abrir modal de tarefas
  const openTasksModal = (user) => {
    setSelectedUser(user)
    setShowTasksModal(true)
    fetchUserTasks(user.id)
  }

  // 🔥 NOVO: Fechar modal de tarefas
  const closeTasksModal = () => {
    setShowTasksModal(false)
    setSelectedUser(null)
    setUserTasks([])
    setTaskCreators({}) // 🔥 Limpar mapa de criadores
    setTaskFilter('all') // 🔥 Resetar filtro
  }

  // 🔥 NOVO: Função para obter badge de status da tarefa
  const getTaskStatusBadge = (status) => {
    const badges = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Concluída' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Em Progresso' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelada' }
    }
    const badge = badges[status] || badges.pending
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  // 🔥 NOVO: Função para verificar se tarefa está atrasada
  const isTaskOverdue = (task) => {
    if (task.status === 'completed' || !task.due_date) return false
    return new Date(task.due_date) < new Date()
  }

  // 🔥 NOVO: Filtrar tarefas baseado no filtro selecionado
  const getFilteredTasks = () => {
    if (taskFilter === 'all') return userTasks

    return userTasks.filter(task => {
      switch (taskFilter) {
        case 'completed':
          return task.status === 'completed'
        case 'pending':
          return task.status === 'pending'
        case 'in_progress':
          return task.status === 'in_progress'
        case 'overdue':
          return isTaskOverdue(task)
        default:
          return true
      }
    })
  }

  // 🔥 NOVO: Contar tarefas por filtro
  const getTaskFilterCounts = () => {
    return {
      all: userTasks.length,
      completed: userTasks.filter(t => t.status === 'completed').length,
      pending: userTasks.filter(t => t.status === 'pending').length,
      in_progress: userTasks.filter(t => t.status === 'in_progress').length,
      overdue: userTasks.filter(t => isTaskOverdue(t)).length
    }
  }

  const exportToCSV = () => {
    const headers = [
      'Nome',
      'Email',
      'Função',
      'Empresa',
      'Status',
      'Último Login',
      'Total de Logins',
      'Primeiro Login',
      'Tarefas Atribuídas',
      'Tarefas Concluídas',
      'Tarefas Atrasadas',
      'Taxa de Conclusão (%)',
      'Comentários'
    ]

    const rows = filteredUsers.map(user => [
      user.full_name || '-',
      user.email,
      getRoleLabel(user.role),
      user.primary_company_name || '-',
      getStatusBadge(user.activity_status).props.children[1],
      formatDate(user.last_login_at),
      user.login_count || 0,
      formatDate(user.first_login_at),
      user.tasks_created || 0,
      user.tasks_completed || 0,
      user.tasks_overdue || 0,
      user.task_completion_rate || 0,
      user.comments_made || 0
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `atividade-usuarios-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader className="h-12 w-12 text-[#EBA500] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando atividade de usuários...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#373435]">Atividade de Usuários</h1>
            <p className="mt-1 text-sm text-gray-600">
              {isCompanyAdmin() && !isSuperAdmin() 
                ? `Monitore o engajamento dos usuários da ${getCurrentUserCompany()?.name || 'sua empresa'}`
                : 'Monitore o engajamento e uso da plataforma'
              }
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowStatusModal(true)}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all font-medium"
            >
              <AlertCircle className="h-4 w-4" />
              <span>Ver Status</span>
            </button>
            
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-[#EBA500] text-white rounded-2xl hover:bg-[#EBA500]/90 transition-all font-medium"
            >
              <Download className="h-4 w-4" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-gray-200/50 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold text-[#373435] mt-1">{stats.total_users}</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white border border-gray-200/50 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.active_users}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.active_percentage?.toFixed(1)}%</p>
              </div>
              <Activity className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white border border-gray-200/50 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Logins</p>
                <p className="text-2xl font-bold text-[#373435] mt-1">{stats.total_logins?.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">~{stats.avg_login_count?.toFixed(1)} por usuário</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white border border-gray-200/50 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inativos</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {stats.inactive_users + stats.never_accessed_users}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-400" />
            </div>
          </div>

          <div className="bg-white border border-gray-200/50 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tarefas Atrasadas</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.total_overdue_tasks || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] transition-all"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] transition-all"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="moderate">Moderado</option>
            <option value="inactive">Inativo</option>
            <option value="very_inactive">Muito Inativo</option>
            <option value="never_accessed">Nunca Acessou</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] transition-all"
          >
            <option value="all">Todas as funções</option>
            {isSuperAdmin() && <option value="super_admin">Super Admin</option>}
            <option value="company_admin">Admin da Empresa</option>
            <option value="gestor">Gestor</option>
            <option value="user">Usuário</option>
          </select>

          {isSuperAdmin() && (
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] transition-all"
            >
              <option value="all">Todas as empresas</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white border border-gray-200/50 rounded-2xl sm:rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg sm:text-xl font-semibold text-[#373435] flex items-center">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 mr-3 text-[#EBA500]" />
            Usuários ({filteredUsers.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                  Último Login
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                  Logins
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                  Tarefas
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#373435] uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum usuário encontrado</h3>
                    <p className="text-gray-600">
                      {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' || companyFilter !== 'all'
                        ? 'Tente ajustar os filtros de busca'
                        : 'Não há usuários cadastrados no momento'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 bg-gradient-to-br from-[#EBA500] to-[#EBA500]/80 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                            {avatarUrls[user.id] ? (
                              <img 
                                src={avatarUrls[user.id]} 
                                alt={user.full_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <span 
                              className="text-white font-semibold"
                              style={{ display: avatarUrls[user.id] ? 'none' : 'flex' }}
                            >
                              {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.full_name || 'Sem nome'}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getRoleLabel(user.role)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Building2 className="h-4 w-4 mr-1.5 text-gray-400" />
                        {user.primary_company_name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.activity_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(user.last_login_at)}
                      </div>
                      {user.days_since_last_login !== null && (
                        <div className="text-xs text-gray-500">
                          há {user.days_since_last_login} {user.days_since_last_login === 1 ? 'dia' : 'dias'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-semibold">{user.login_count || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-semibold">{user.tasks_created || 0}</div>
                        <div className="text-xs text-gray-500">
                          {user.tasks_completed || 0} concluídas
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openTasksModal(user)}
                        className="text-[#EBA500] hover:text-[#EBA500]/80 font-medium"
                      >
                        <Eye className="h-4 w-4 inline mr-1" />
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Explicação dos Status */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowStatusModal(false)}>
          <div 
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#EBA500] to-[#EBA500]/80 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Status de Atividade</h2>
                    <p className="text-sm text-white/90 mt-1">Entenda como os usuários são classificados</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-xl transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                {/* Ativo */}
                <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-green-900 mb-2">Ativo</h3>
                      <p className="text-sm text-green-800 leading-relaxed">
                        Usuário realizou login <span className="font-semibold">nos últimos 7 dias</span>. 
                        Demonstra engajamento regular e uso consistente da plataforma.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Moderado */}
                <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-yellow-900 mb-2">Moderado</h3>
                      <p className="text-sm text-yellow-800 leading-relaxed">
                        Último login realizado entre <span className="font-semibold">8 e 30 dias atrás</span>. 
                        Uso ocasional da plataforma, pode necessitar de re-engajamento.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Inativo */}
                <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-orange-900 mb-2">Inativo</h3>
                      <p className="text-sm text-orange-800 leading-relaxed">
                        Último login realizado entre <span className="font-semibold">31 e 60 dias atrás</span>. 
                        Requer atenção para reativar o uso da plataforma.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Muito Inativo */}
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <XCircle className="h-5 w-5 text-red-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-red-900 mb-2">Muito Inativo</h3>
                      <p className="text-sm text-red-800 leading-relaxed">
                        Último login realizado <span className="font-semibold">há mais de 60 dias</span>. 
                        Usuário pode estar desengajado ou não necessitar mais do acesso.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Nunca Acessou */}
                <div className="bg-gray-50 border-l-4 border-gray-400 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <XCircle className="h-5 w-5 text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Nunca Acessou</h3>
                      <p className="text-sm text-gray-800 leading-relaxed">
                        Usuário foi convidado mas <span className="font-semibold">ainda não realizou o primeiro login</span>. 
                        Verifique se o convite foi recebido corretamente.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dica */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">💡 Dica de Engajamento</h4>
                      <p className="text-xs text-blue-800 leading-relaxed">
                        Usuários com status <span className="font-semibold">Inativo</span> ou <span className="font-semibold">Muito Inativo</span> podem 
                        se beneficiar de comunicação direta, treinamento adicional ou verificação se ainda necessitam do acesso à plataforma.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <button
                onClick={() => setShowStatusModal(false)}
                className="w-full px-4 py-2 bg-[#EBA500] text-white rounded-xl hover:bg-[#EBA500]/90 transition-all font-medium"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 NOVO: Modal de Tarefas Detalhadas */}
      {showTasksModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-in fade-in duration-300">
          <div 
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
            style={{
              animation: 'modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-[#EBA500] to-[#EBA500]/80 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1 truncate">
                    Tarefas de {selectedUser.full_name}
                  </h2>
                  <p className="text-white/90 text-xs sm:text-sm truncate">
                    {selectedUser.email}
                  </p>
                </div>
                <button
                  onClick={closeTasksModal}
                  className="text-white hover:bg-white/20 p-2 rounded-xl transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Estatísticas Rápidas */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mt-4 sm:mt-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 border border-white/20">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{selectedUser.tasks_created || 0}</div>
                  <div className="text-[10px] sm:text-xs text-white/80 font-medium">Total de Tarefas</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-2xl font-bold text-white">{selectedUser.tasks_completed || 0}</div>
                  <div className="text-xs text-white/80 font-medium">Concluídas</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-2xl font-bold text-white">{selectedUser.tasks_overdue || 0}</div>
                  <div className="text-xs text-white/80 font-medium">Atrasadas</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-2xl font-bold text-white">
                    {selectedUser.task_completion_rate ? `${selectedUser.task_completion_rate}%` : '0%'}
                  </div>
                  <div className="text-xs text-white/80 font-medium">Taxa de Conclusão</div>
                </div>
              </div>
            </div>

            {/* 🔥 NOVO: Barra de Filtros de Tarefas */}
            <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 flex-shrink-0">Filtrar:</span>
                
                {(() => {
                  const counts = getTaskFilterCounts()
                  const filters = [
                    { value: 'all', label: 'Todas', count: counts.all, color: 'gray' },
                    { value: 'completed', label: 'Concluídas', count: counts.completed, color: 'green' },
                    { value: 'in_progress', label: 'Em Andamento', count: counts.in_progress, color: 'blue' },
                    { value: 'pending', label: 'Pendentes', count: counts.pending, color: 'yellow' },
                    { value: 'overdue', label: 'Atrasadas', count: counts.overdue, color: 'red' }
                  ]

                  const colorClasses = {
                    gray: {
                      active: 'bg-gray-600 text-white border-gray-600',
                      inactive: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    },
                    green: {
                      active: 'bg-green-600 text-white border-green-600',
                      inactive: 'bg-white text-green-700 border-green-300 hover:bg-green-50'
                    },
                    blue: {
                      active: 'bg-blue-600 text-white border-blue-600',
                      inactive: 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                    },
                    yellow: {
                      active: 'bg-yellow-600 text-white border-yellow-600',
                      inactive: 'bg-white text-yellow-700 border-yellow-300 hover:bg-yellow-50'
                    },
                    red: {
                      active: 'bg-red-600 text-white border-red-600',
                      inactive: 'bg-white text-red-700 border-red-300 hover:bg-red-50'
                    }
                  }

                  return filters.map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => setTaskFilter(filter.value)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium border-2 transition-all flex-shrink-0 touch-manipulation ${
                        taskFilter === filter.value
                          ? colorClasses[filter.color].active
                          : colorClasses[filter.color].inactive
                      }`}
                    >
                      {filter.label} ({filter.count})
                    </button>
                  ))
                })()}
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 overflow-y-auto max-h-[calc(95vh-340px)] sm:max-h-[calc(90vh-340px)]">
              {console.log('🎨 Renderizando modal - userTasks:', userTasks.length, 'loadingTasks:', loadingTasks)}
              {loadingTasks ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <Loader className="h-6 w-6 sm:h-8 sm:w-8 text-[#EBA500] animate-spin" />
                  <p className="text-sm sm:text-base text-gray-600 ml-3">Carregando tarefas...</p>
                </div>
              ) : userTasks.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2 px-4">
                    Nenhuma tarefa encontrada
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 px-4">
                    Este usuário não possui tarefas atribuídas.
                  </p>
                </div>
              ) : (() => {
                const filteredTasks = getFilteredTasks()
                
                if (filteredTasks.length === 0) {
                  return (
                    <div className="text-center py-8 sm:py-12">
                      <Filter className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2 px-4">
                        Nenhuma tarefa encontrada
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 px-4">
                        Não há tarefas com o filtro selecionado.
                      </p>
                    </div>
                  )
                }

                return (
                <div className="space-y-3 sm:space-y-4">
                  {console.log('🎯 Mapeando tarefas filtradas:', filteredTasks)}
                  {filteredTasks.map((task) => {
                    const isOverdue = isTaskOverdue(task)
                    
                    return (
                      <div
                        key={task.id}
                        className={`bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border-2 transition-all hover:shadow-md ${
                          isOverdue
                            ? 'border-red-200 bg-red-50/30'
                            : 'border-gray-200/50 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-[#373435] mb-1.5 sm:mb-2 break-words">
                              {task.title}
                            </h3>
                            {task.description && (
                              <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 break-words leading-relaxed">
                                {task.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1.5 sm:gap-2 flex-shrink-0">
                            <div className="text-xs sm:text-sm">
                              {getTaskStatusBadge(task.status)}
                            </div>
                            {isOverdue && (
                              <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold bg-red-100 text-red-800">
                                <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                                Atrasada
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Informações da Tarefa */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                          <div>
                            <div className="text-[10px] sm:text-xs text-gray-500 mb-1 font-medium">Criação</div>
                            <div className="flex items-center text-xs sm:text-sm text-gray-900">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 text-gray-400 flex-shrink-0" />
                              {formatDate(task.created_at)}
                            </div>
                          </div>

                          {task.due_date && (
                            <div>
                              <div className="text-[10px] sm:text-xs text-gray-500 mb-1 font-medium">Vencimento</div>
                              <div className={`flex items-center text-xs sm:text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                                {formatDate(task.due_date)}
                              </div>
                            </div>
                          )}

                          {task.completed_at && (
                            <div>
                              <div className="text-[10px] sm:text-xs text-gray-500 mb-1 font-medium">Conclusão</div>
                              <div className="flex items-center text-xs sm:text-sm text-green-600 font-semibold">
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                                {formatDate(task.completed_at)}
                              </div>
                            </div>
                          )}

                          <div>
                            <div className="text-[10px] sm:text-xs text-gray-500 mb-1 font-medium">Criado por</div>
                            <div className="text-xs sm:text-sm text-gray-900 font-medium truncate">
                              {task.created_by ? (taskCreators[task.created_by] || 'Carregando...') : 'Sistema'}
                            </div>
                          </div>
                        </div>

                        {/* Prioridade */}
                        {task.priority && (
                          <div className="mt-2 sm:mt-3 flex items-center flex-wrap gap-1">
                            <span className="text-[10px] sm:text-xs text-gray-500">Prioridade:</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] sm:text-xs font-medium ${
                              task.priority === 'high' ? 'bg-red-100 text-red-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                )
              })()}
            </div>

            {/* Footer do Modal */}
            <div className="bg-gray-50 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                  Exibindo: <span className="font-semibold text-gray-900">{getFilteredTasks().length}</span> de <span className="font-semibold text-gray-900">{userTasks.length}</span> tarefa(s)
                </div>
                <button
                  onClick={closeTasksModal}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 min-h-[44px] bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center space-x-2 touch-manipulation"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Fechar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserActivityPage
