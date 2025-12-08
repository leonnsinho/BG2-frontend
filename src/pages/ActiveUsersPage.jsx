import React, { useState, useEffect } from 'react'
import { Users, Search, CheckCircle, XCircle, Clock, Calendar, Mail, Phone, Shield } from 'lucide-react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'

const ActiveUsersPage = () => {
  const { profile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'active', 'inactive'

  useEffect(() => {
    loadUsers()
  }, [profile])

  const loadUsers = async () => {
    try {
      setLoading(true)
      addLog('Iniciando carregamento de usuários')
      addLog('Company ID do perfil', { company_id: profile?.company_id, profile_completo: profile })

      // Buscar company_id da primeira empresa do usuário
      const companyId = profile?.company_id || profile?.user_companies?.[0]?.company_id

      addLog('Company ID identificado', { 
        company_id_profile: profile?.company_id,
        company_id_user_companies: profile?.user_companies?.[0]?.company_id,
        company_id_final: companyId
      })

      // Verificar se temos um company_id válido
      if (!companyId) {
        addLog('⚠️ ERRO: company_id não encontrado no perfil ou em user_companies')
        setUsers([])
        return
      }

      addLog('Fazendo query no Supabase', { company_id: companyId })

      // Buscar todos os usuários da tabela user_companies com a mesma empresa
      const { data, error } = await supabase
        .from('user_companies')
        .select(`
          id,
          user_id,
          company_id,
          role,
          is_active,
          joined_at,
          companies (
            id,
            name
          ),
          profiles:user_id (
            id,
            email,
            full_name,
            role,
            phone,
            avatar_url,
            is_active,
            created_at
          )
        `)
        .eq('company_id', companyId)
        .order('profiles(full_name)', { ascending: true })

      if (error) {
        addLog('❌ Erro na query do Supabase', error)
        throw error
      }

      // Buscar último login de cada usuário da view user_login_stats
      addLog('Buscando estatísticas de login dos usuários')
      const { data: loginStats, error: loginStatsError } = await supabase
        .from('user_login_stats')
        .select('user_id, last_login, login_count_7days')

      if (loginStatsError) {
        addLog('⚠️ Erro ao buscar estatísticas de login (não crítico)', loginStatsError)
      }

      // Criar mapa de logins para fácil acesso
      const loginMap = new Map()
      loginStats?.forEach(stat => {
        loginMap.set(stat.user_id, {
          last_login: stat.last_login,
          login_count_7days: stat.login_count_7days
        })
      })

      addLog('✅ Dados recebidos do Supabase', { 
        total_registros: data?.length,
        total_login_stats: loginStats?.length,
        primeiros_3: data?.slice(0, 3),
        todos_roles: data?.map(d => ({ 
          nome: d.profiles?.full_name, 
          role_profiles: d.profiles?.role,
          role_user_companies: d.role 
        }))
      })

      // Formatar os dados para melhor visualização
      const formattedUsers = data
        ?.filter(uc => {
          const temPerfil = !!uc.profiles
          const roleCorreto = uc.role === 'user' // Filtrar pelo role em user_companies, não em profiles
          addLog(`Filtrando usuário: ${uc.profiles?.full_name}`, {
            tem_perfil: temPerfil,
            role_no_profiles: uc.profiles?.role,
            role_no_user_companies: uc.role,
            role_correto: roleCorreto,
            sera_incluido: temPerfil && roleCorreto
          })
          return temPerfil && roleCorreto
        })
        ?.map(uc => {
          const loginInfo = loginMap.get(uc.profiles.id)
          return {
            id: uc.profiles.id,
            email: uc.profiles.email,
            full_name: uc.profiles.full_name,
            role: uc.profiles.role,
            phone: uc.profiles.phone,
            avatar_url: uc.profiles.avatar_url,
            is_active: uc.is_active, // Status na empresa
            last_login: loginInfo?.last_login || null, // Último login da tabela user_login_history
            login_count_7days: loginInfo?.login_count_7days || 0,
            created_at: uc.profiles.created_at,
            company_name: uc.companies?.name || 'N/A',
            company_role: uc.role, // Papel na empresa
            joined_at: uc.joined_at
          }
        }) || []

      addLog('✅ Usuários formatados', { 
        total: formattedUsers.length,
        usuarios: formattedUsers.map(u => ({ nome: u.full_name, email: u.email, cargo: u.company_role }))
      })
      setUsers(formattedUsers)
    } catch (error) {
      addLog('❌ ERRO ao carregar usuários', error)
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
      addLog('Carregamento finalizado')
    }
  }

  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active)

    return matchesSearch && matchesStatus
  })

  // Calcular estatísticas
  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    recentLogin: users.filter(u => u.login_count_7days > 0).length // Usuários que logaram nos últimos 7 dias
  }

  // Função para formatar a data do último login
  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return 'Nunca'
    
    const now = new Date()
    const loginDate = new Date(lastLogin)
    const diffMs = now - loginDate
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `Há ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`
    if (diffHours < 24) return `Há ${diffHours} hora${diffHours !== 1 ? 's' : ''}`
    if (diffDays < 30) return `Há ${diffDays} dia${diffDays !== 1 ? 's' : ''}`
    
    return loginDate.toLocaleDateString('pt-BR')
  }

  // Função para obter a cor do badge de status
  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
          <CheckCircle size={14} />
          <span>Ativo</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
        <XCircle size={14} />
        <span>Inativo</span>
      </span>
    )
  }

  // Função para obter o nome do papel (role)
  const getRoleName = (role) => {
    const roles = {
      'super_admin': 'Super Admin',
      'company_admin': 'Admin da Empresa',
      'gestor': 'Gestor',
      'gestor_financeiro': 'Gestor Financeiro',
      'gestor_estrategico': 'Gestor Estratégico',
      'gestor_pessoas_cultura': 'Gestor de Pessoas',
      'gestor_vendas_marketing': 'Gestor de Vendas',
      'gestor_operacional': 'Gestor Operacional',
      'user': 'Usuário'
    }
    return roles[role] || role
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Users className="text-[#00A4A6]" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Usuários Ativos</h1>
          </div>
          <p className="text-gray-600">Gerencie e monitore todos os usuários da sua empresa</p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Usuários</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Usuários Ativos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
              </div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Usuários Inativos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
              <XCircle className="text-red-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#00A4A6]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ativos (7 dias)</p>
                <p className="text-3xl font-bold text-gray-900">{stats.recentLogin}</p>
              </div>
              <Clock className="text-[#00A4A6]" size={32} />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A4A6] focus:border-transparent"
              />
            </div>

            {/* Filtro de Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A4A6] focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Apenas Ativos</option>
              <option value="inactive">Apenas Inativos</option>
            </select>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A4A6]"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Cargo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Último Login
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Membro desde
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.full_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00A4A6] to-[#008B8D] flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{user.full_name || 'Sem nome'}</p>
                            <p className="text-sm text-gray-500">{user.company_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail size={14} />
                            <span>{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone size={14} />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Shield size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-700">{getRoleName(user.company_role)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(user.is_active)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Clock size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-700">{formatLastLogin(user.last_login)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Calendar size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* Footer com resumo */}
      <div className="mt-6 text-center text-sm text-gray-600">
        Mostrando {filteredUsers.length} de {users.length} usuários
      </div>
    </div>
  )
}

export default ActiveUsersPage
