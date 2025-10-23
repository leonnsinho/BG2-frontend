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
  Loader
} from 'lucide-react'

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
        query = query.eq('company_id', currentCompany.id)
      }

      const { data: usersData, error: usersError } = await query
        .order('last_login_at', { ascending: false, nullsFirst: false })

      if (usersError) {
        console.error('❌ Erro ao buscar user_activity_summary:', usersError.message, usersError)
        throw usersError
      }

      console.log('✅ Dados de usuários carregados:', usersData?.length, 'usuários')
      setUsers(usersData || [])

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

        setStats({
          total_users: totalUsers,
          active_users: activeUsers,
          active_percentage: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
          total_logins: totalLogins,
          avg_login_count: totalUsers > 0 ? totalLogins / totalUsers : 0,
          inactive_users: inactiveUsers,
          never_accessed_users: neverAccessedUsers
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
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-[#EBA500]/5 border-b border-gray-200/50 shadow-sm -mx-8 -mt-8 px-8 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#373435] mb-1">Atividade de Usuários</h1>
            <p className="mt-2 text-base text-gray-600">
              {isCompanyAdmin() && !isSuperAdmin() 
                ? `Monitore o engajamento dos usuários da ${getCurrentUserCompany()?.name || 'sua empresa'}`
                : 'Monitore o engajamento e uso da plataforma por todos os usuários'
              }
            </p>
            {isCompanyAdmin() && !isSuperAdmin() && (
              <div className="mt-3 inline-flex items-center px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                <Building2 className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-700">
                  Visualizando apenas usuários de: {getCurrentUserCompany()?.name}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-2.5 bg-[#EBA500] text-white rounded-xl hover:bg-[#EBA500]/90 transition-all font-medium shadow-sm hover:shadow-md"
          >
            <Download className="h-4 w-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm border border-gray-200/50 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-sm">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-[#373435]">{stats.total_users}</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">Total de Usuários</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl shadow-sm border border-gray-200/50 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl shadow-sm">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-[#373435]">{stats.active_users}</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">Usuários Ativos</div>
                <div className="text-xs text-green-600 font-semibold mt-1">
                  {stats.active_percentage?.toFixed(1)}% do total
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-[#EBA500]/10 rounded-2xl shadow-sm border border-gray-200/50 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-[#EBA500]/20 to-[#EBA500]/30 rounded-xl shadow-sm">
                  <TrendingUp className="h-6 w-6 text-[#EBA500]" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-[#373435]">{stats.total_logins}</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">Total de Logins</div>
                <div className="text-xs text-[#EBA500] font-semibold mt-1">
                  ~{stats.avg_login_count?.toFixed(1)} por usuário
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-red-50/30 rounded-2xl shadow-sm border border-gray-200/50 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl shadow-sm">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-[#373435]">
                  {stats.inactive_users + stats.never_accessed_users}
                </div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">Inativos/Nunca Acessaram</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#373435] flex items-center">
            <Filter className="h-4 w-4 mr-2 text-[#EBA500]" />
            Filtros
          </h3>
          {(searchTerm || statusFilter !== 'all' || roleFilter !== 'all' || companyFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setRoleFilter('all')
                setCompanyFilter('all')
              }}
              className="text-xs text-[#EBA500] hover:text-[#EBA500]/80 font-medium flex items-center space-x-1 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] transition-all"
            />
          </div>

          {/* Filtro de Status */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] transition-all appearance-none bg-white"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="moderate">Moderado</option>
              <option value="inactive">Inativo</option>
              <option value="very_inactive">Muito Inativo</option>
              <option value="never_accessed">Nunca Acessou</option>
            </select>
          </div>

          {/* Filtro de Função */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] transition-all appearance-none bg-white"
            >
              <option value="all">Todas as funções</option>
              {isSuperAdmin() && <option value="super_admin">Super Admin</option>}
              <option value="company_admin">Admin da Empresa</option>
              <option value="gestor">Gestor</option>
              <option value="user">Usuário</option>
            </select>
          </div>

          {/* Filtro de Empresa - Apenas para Super Admin */}
          {isSuperAdmin() && (
            <div className="relative">
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] transition-all appearance-none bg-white"
              >
                <option value="all">Todas as empresas</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Último Login
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Logins
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Tarefas
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
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
                          <div className="h-10 w-10 bg-gradient-to-br from-[#EBA500] to-[#EBA500]/80 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
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
                      <div className="flex items-center text-sm text-gray-900">
                        <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                        {formatDate(user.last_login_at)}
                      </div>
                      {user.days_since_last_login !== null && (
                        <div className="text-xs text-gray-500 mt-1">
                          há {user.days_since_last_login} {user.days_since_last_login === 1 ? 'dia' : 'dias'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-semibold">{user.login_count || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center space-x-3">
                          <div className="text-center">
                            <div className="font-semibold text-blue-600">{user.tasks_created || 0}</div>
                            <div className="text-xs text-gray-500">Tarefas</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-green-600">{user.tasks_completed || 0}</div>
                            <div className="text-xs text-gray-500">Concluídas</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-purple-600">{user.comments_made || 0}</div>
                            <div className="text-xs text-gray-500">Comentários</div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé com total de resultados */}
        {filteredUsers.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Exibindo <span className="font-semibold text-gray-900">{filteredUsers.length}</span> de{' '}
              <span className="font-semibold text-gray-900">{users.length}</span> usuário(s)
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserActivityPage
