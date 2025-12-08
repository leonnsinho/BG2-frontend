import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { 
  Users, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  UserPlus,
  Mail,
  Building2,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Link as LinkIcon,
  DollarSign,
  Target,
  TrendingUp,
  Settings
} from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'

const ROLES = {
  'super_admin': { 
    label: 'Super Admin', 
    color: 'red',
    icon: Shield
  },
  'gestor': { 
    label: 'Gestor Geral', 
    color: 'purple',
    icon: Users
  },
  'gestor_financeiro': { 
    label: 'Gestor Financeiro', 
    color: 'green',
    icon: DollarSign
  },
  'gestor_estrategico': { 
    label: 'Gestor Estratégico', 
    color: 'blue',
    icon: Target
  },
  'gestor_pessoas_cultura': { 
    label: 'Gestor Pessoas & Cultura', 
    color: 'pink',
    icon: Users
  },
  'gestor_vendas_marketing': { 
    label: 'Gestor Vendas & Marketing', 
    color: 'orange',
    icon: TrendingUp
  },
  'gestor_operacional': { 
    label: 'Gestor Operacional', 
    color: 'teal',
    icon: Settings
  },
  'company_admin': { 
    label: 'Admin Empresa', 
    color: 'blue',
    icon: Building2
  },
  'user': { 
    label: 'Usuário', 
    color: 'gray',
    icon: Users
  }
}

const STATUS_COLORS = {
  'active': 'green',
  'inactive': 'red',
  'pending': 'yellow'
}

export default function UsersManagementPage() {
  const { user, profile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false)
  const [companies, setCompanies] = useState([])
  const [updating, setUpdating] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)
  const [avatarUrls, setAvatarUrls] = useState({})

  // Obter empresa do usuário atual se for company_admin
  const getCurrentUserCompany = () => {
    if (!profile?.user_companies) return null
    return profile.user_companies.find(uc => uc.is_active)?.companies
  }

  // Verificar se o usuário atual é super_admin
  const isSuperAdmin = () => {
    return profile?.role === 'super_admin'
  }

  // Verificar se o usuário atual é company_admin
  const isCompanyAdmin = () => {
    return profile?.role === 'company_admin' || 
           profile?.user_companies?.some(uc => uc.is_active && uc.role === 'company_admin')
  }

  useEffect(() => {
    if (profile) {
      loadUsers()
      loadCompanies()
    }
  }, [profile])

  // Carregar avatars dos usuários
  useEffect(() => {
    const loadAvatars = async () => {
      const urls = {}
      for (const user of users) {
        if (user.avatar_url) {
          const { data } = await supabase.storage
            .from('profile-avatars')
            .createSignedUrl(user.avatar_url, 3600)
          if (data?.signedUrl) {
            urls[user.id] = data.signedUrl
          }
        }
      }
      setAvatarUrls(urls)
    }
    
    if (users.length > 0) {
      loadAvatars()
    }
  }, [users])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      console.log('🔍 DIAGNÓSTICO: Iniciando carregamento de usuários')
      console.log('👤 Usuário atual:', {
        id: profile?.id,
        email: profile?.email,
        role: profile?.role
      })
      
      // Buscar usuários da tabela profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) {
        console.error('❌ Erro ao buscar profiles:', profilesError)
        throw profilesError
      }

      console.log('✅ Profiles carregados:', profiles?.length)
      console.log('📋 Primeiros 3 profiles:', profiles?.slice(0, 3))

      // Buscar vinculações de usuários com empresas
      const { data: userCompanies, error: userCompaniesError } = await supabase
        .from('user_companies')
        .select(`
          *,
          companies (
            id,
            name
          )
        `)
        .eq('is_active', true)

      if (userCompaniesError) {
        console.error('❌ Erro ao buscar user_companies:', userCompaniesError)
        throw userCompaniesError
      }

      console.log('✅ Vinculações carregadas:', userCompanies?.length)
      console.log('📋 Primeiros 3 user_companies:', userCompanies?.slice(0, 3))

      // Combinar dados
      let combinedUsers = profiles.map(profile => {
        // Encontrar vinculação ativa do usuário
        const userCompany = userCompanies?.find(uc => 
          uc.user_id === profile.id
        )
        
        console.log(`Usuário ${profile.email}: ID=${profile.id}, empresa encontrada:`, userCompany?.companies?.name || 'nenhuma', 'Role global:', profile.role, 'Role na empresa:', userCompany?.role)
        
        return {
          ...profile,
          email: profile.email,
          status: profile.is_active ? 'active' : 'inactive',
          companies: userCompany?.companies, // Empresa vinculada através de user_companies
          company_role: userCompany?.role, // Role na empresa
          last_sign_in_at: profile.last_login
        }
      })

      console.log('📊 Usuários combinados (antes de filtrar):', combinedUsers.length)
      
      // Filtrar usuários baseado no perfil do usuário atual
      if (isCompanyAdmin() && !isSuperAdmin()) {
        const currentUserCompany = getCurrentUserCompany()
        console.log('👤 É Company Admin (não super admin)')
        console.log('🏢 Empresa atual:', currentUserCompany?.name || 'nenhuma')
        
        if (currentUserCompany) {
          console.log('🔍 Filtrando usuários para company_admin da empresa:', currentUserCompany.name)
          // Filtrar apenas usuários da mesma empresa, excluindo o próprio usuário atual
          const beforeFilter = combinedUsers.length
          combinedUsers = combinedUsers.filter(user => {
            const isSameCompany = user.companies?.id === currentUserCompany.id
            const isNotCurrentUser = user.id !== profile.id
            
            console.log(`  - ${user.email}: empresa=${user.companies?.name}, mesmaEmpresa=${isSameCompany}, naoEuMesmo=${isNotCurrentUser}, incluir=${isSameCompany && isNotCurrentUser}`)
            
            return isSameCompany && isNotCurrentUser
          })
          console.log('📊 Usuários filtrados:', combinedUsers.length, 'de', beforeFilter)
        } else {
          console.log('⚠️ Company admin sem empresa vinculada!')
        }
      } else if (isSuperAdmin()) {
        console.log('🔑 Super admin: mostrando todos os usuários, excluindo a si mesmo')
        const beforeFilter = combinedUsers.length
        // Super admin vê todos, mas não a si mesmo
        combinedUsers = combinedUsers.filter(user => {
          const isNotCurrentUser = user.id !== profile.id
          console.log(`  - ${user.email}: naoEuMesmo=${isNotCurrentUser}`)
          return isNotCurrentUser
        })
        console.log('📊 Usuários visíveis:', combinedUsers.length, 'de', beforeFilter)
      } else {
        console.log('⚠️ Usuário não é nem super_admin nem company_admin!')
        console.log('   Role:', profile?.role)
      }

      console.log('✅ Usuários finais para exibir:', combinedUsers.length)
      setUsers(combinedUsers)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async (userId, updates) => {
    try {
      setUpdating(true)
      
      console.log('🔄 Tentando atualizar usuário...')
      console.log('   - User ID:', userId)
      console.log('   - Updates:', updates)
      console.log('   - Campo full_name:', updates.full_name)
      
      // Verificar se o registro existe antes de atualizar
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (checkError) {
        console.error('❌ Erro ao buscar profile:', checkError)
        throw checkError
      }
      
      console.log('📋 Profile atual:', existingProfile)
      
      // Atualizar com timestamp
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }
      
      console.log('📝 Dados para atualizar:', updateData)
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()

      if (error) {
        console.error('❌ Erro ao atualizar no Supabase:', error)
        throw error
      }
      
      console.log('✅ Resposta do Supabase:', data)
      console.log('✅ Novo full_name:', data?.[0]?.full_name)

      await loadUsers()
      setIsEditModalOpen(false)
      setSelectedUser(null)
      alert('Nome do usuário atualizado com sucesso!')
    } catch (error) {
      console.error('❌ ERRO COMPLETO:', error)
      alert('Erro ao atualizar usuário: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    try {
      setUpdating(true);
      
      // Get current user status
      const currentUser = users.find(u => u.id === userId);
      if (!currentUser) return;

      const newActiveStatus = !currentUser.is_active;
      const action = newActiveStatus ? 'ativar' : 'desativar';
      
      if (!confirm(`Tem certeza que deseja ${action} este usuário?`)) {
        return;
      }
      
      // Update user status
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: newActiveStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      await loadUsers();
      alert(`Usuário ${newActiveStatus ? 'ativado' : 'desativado'} com sucesso`);
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      alert('Erro ao alterar status do usuário');
    } finally {
      setUpdating(false);
    }
  }

  // Carregar empresas
  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
    }
  }

  // Vincular usuário a empresa ou alterar empresa existente
  const handleLinkToCompany = async (userId, companyId, role = 'user') => {
    try {
      setUpdating(true)
      
      console.log('Processando vinculação - usuário:', userId, 'empresa:', companyId, 'role:', role)
      
      // Primeiro, desativar qualquer vinculação existente
      const { error: deactivateError } = await supabase
        .from('user_companies')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_active', true)

      if (deactivateError) {
        console.error('Erro ao desativar vinculação anterior:', deactivateError)
        throw deactivateError
      }

      // Verificar se já existe vinculação com a nova empresa
      const { data: existingLink } = await supabase
        .from('user_companies')
        .select('id, is_active')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .single()

      if (existingLink) {
        // Reativar vinculação existente com nova role
        const { error: updateError } = await supabase
          .from('user_companies')
          .update({
            is_active: true,
            role: role,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLink.id)

        if (updateError) throw updateError
        console.log('Vinculação existente reativada')
      } else {
        // Criar nova vinculação
        const { data: insertResult, error: insertError } = await supabase
          .from('user_companies')
          .insert({
            user_id: userId,
            company_id: companyId,
            role: role,
            is_active: true,
            created_at: new Date().toISOString()
          })
          .select()

        if (insertError) {
          console.error('Erro ao inserir nova vinculação:', insertError)
          throw insertError
        }
        
        console.log('Nova vinculação criada:', insertResult)
      }

      await loadUsers()
      setIsLinkModalOpen(false)
      setSelectedUser(null)
      
      // Verificar se o usuário já tinha empresa para determinar a mensagem
      const currentUser = users.find(u => u.id === userId)
      const wasEdit = Boolean(currentUser?.companies?.id)
      
      alert(wasEdit 
        ? 'Empresa do usuário alterada com sucesso!' 
        : 'Usuário vinculado à empresa com sucesso!'
      )
    } catch (error) {
      console.error('Erro ao vincular usuário:', error)
      alert('Erro ao vincular usuário à empresa: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  // Desvincular usuário da empresa
  const handleUnlinkFromCompany = async (userId) => {
    try {
      if (!confirm('Tem certeza que deseja desvincular este usuário da empresa?')) {
        return
      }

      setUpdating(true)
      
      console.log('Desvinculando usuário:', userId)
      
      // Desativar vinculação existente
      const { error } = await supabase
        .from('user_companies')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) {
        console.error('Erro ao desativar vinculação:', error)
        throw error
      }

      await loadUsers()
      alert('Usuário desvinculado da empresa com sucesso!')
    } catch (error) {
      console.error('Erro ao desvincular usuário:', error)
      alert('Erro ao desvincular usuário da empresa: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  // Criar novo usuário
  const handleCreateUser = async (e) => {
    e.preventDefault()
    
    if (!newUserEmail || !newUserEmail.includes('@')) {
      toast.error('Digite um email válido')
      return
    }

    setCreatingUser(true)
    
    try {
      console.log('🚀 Criando novo usuário:', newUserEmail)
      
      // Gerar senha temporária segura
      const tempPassword = 'temp' + Math.random().toString(36).slice(-8) + '123!'
      
      // Criar usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: newUserEmail,
        password: tempPassword,
        options: {
          data: {
            role: 'user', // Role padrão
            needs_completion: true, // Marca que precisa completar cadastro
            created_via: 'admin_panel',
            created_at: new Date().toISOString()
          },
          emailRedirectTo: `${window.location.origin}/complete-signup`
        }
      })

      if (error) {
        console.error('❌ Erro ao criar usuário:', error)
        throw error
      }

      console.log('✅ Usuário criado:', data)
      
      toast.success(`✅ Convite enviado para ${newUserEmail}! O usuário receberá um email para completar o cadastro.`)
      
      // Limpar e fechar modal
      setNewUserEmail('')
      setIsCreateUserModalOpen(false)
      
      // Recarregar lista de usuários
      await loadUsers()
      
    } catch (error) {
      console.error('❌ Erro:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setCreatingUser(false)
    }
  }

  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.companies?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Verificar tanto o role global quanto o role da empresa
    const effectiveRole = user.company_role || user.role
    const matchesRole = !roleFilter || user.role === roleFilter || user.company_role === roleFilter
    const matchesStatus = !statusFilter || user.status === statusFilter
    
    // Filtro de empresa (apenas para super admins)
    const matchesCompany = companyFilter === 'all' || user.companies?.id === companyFilter

    return matchesSearch && matchesRole && matchesStatus && matchesCompany
  })

  const getRoleInfo = (role) => ROLES[role] || ROLES.user

  // Verificar permissão de acesso
  if (!isSuperAdmin() && !isCompanyAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="p-8 bg-white rounded-3xl shadow-sm border border-gray-200/50">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#373435] mb-2">Acesso Negado</h1>
            <p className="text-gray-600 mb-6">
              Você não tem permissão para acessar a gestão de usuários.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#373435] mb-2 sm:mb-3">
              Gerenciamento de Usuários
            </h1>
            <p className="text-gray-600 text-base sm:text-lg">
              Gerencie usuários, funções e vínculos com empresas no sistema.
            </p>
          </div>
          <button
            onClick={() => setIsCreateUserModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-[#EBA500] text-white rounded-lg hover:bg-[#d49400] transition-colors min-h-[44px] sm:min-h-0 touch-manipulation"
          >
            <UserPlus className="h-5 w-5" />
            <span>Criar Usuário</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white shadow-sm border border-gray-200/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${isSuperAdmin() ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3 sm:gap-4`}>
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-3 sm:py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] transition-all duration-200 min-h-[44px] sm:min-h-0"
              />
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-3 sm:py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] transition-all duration-200 min-h-[44px] sm:min-h-0 touch-manipulation"
            >
              <option value="">Todas as funções</option>
              {Object.entries(ROLES).map(([key, role]) => (
                <option key={key} value={key}>{role.label}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-3 sm:py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] transition-all duration-200 min-h-[44px] sm:min-h-0 touch-manipulation"
            >
              <option value="">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="pending">Pendente</option>
            </select>

            {/* Filtro de Empresa - Apenas para Super Admins */}
            {isSuperAdmin() && (
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="px-3 py-3 sm:py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] transition-all duration-200 min-h-[44px] sm:min-h-0 touch-manipulation"
              >
                <option value="all">Todas as empresas</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            )}

            <button
              onClick={() => {
                setSearchTerm('')
                setRoleFilter('')
                setStatusFilter('')
                setCompanyFilter('all')
              }}
              className="px-4 py-3 sm:py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-[#373435] rounded-2xl hover:from-gray-200 hover:to-gray-300 focus:outline-none focus:ring-2 focus:ring-[#373435]/20 font-medium transition-all duration-200 min-h-[44px] sm:min-h-0 touch-manipulation"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="bg-white shadow-sm border border-gray-200/50 rounded-2xl sm:rounded-3xl overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-100">
            <h2 className="text-lg sm:text-xl font-semibold text-[#373435] flex items-center">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-[#EBA500]" />
              <span className="truncate">
                {isSuperAdmin() 
                  ? `Usuários (${filteredUsers.length})`
                  : `Empresa (${filteredUsers.length})`
                }
              </span>
            </h2>
            {!isSuperAdmin() && getCurrentUserCompany() && (
              <p className="text-xs sm:text-sm text-gray-600 mt-2 flex items-center">
                <Building2 className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                <span className="truncate">{getCurrentUserCompany().name}</span>
              </p>
            )}
          </div>
          
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                <tr>
                  <th className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                    Função
                  </th>
                  <th className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-right text-xs font-semibold text-[#373435] uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {filteredUsers.map((user) => {
                  // Usar o role da empresa se existir, senão usar o role global
                  const effectiveRole = user.company_role || user.role
                  const roleInfo = getRoleInfo(effectiveRole)
                  const RoleIcon = roleInfo.icon

                  return (
                    <tr key={user.id} className="hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-[#EBA500]/5 transition-all duration-200">
                      <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {avatarUrls[user.id] ? (
                              <img 
                                src={avatarUrls[user.id]} 
                                alt={user.full_name || 'Avatar'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <span 
                              className="text-sm font-medium text-gray-700"
                              style={{ display: avatarUrls[user.id] ? 'none' : 'flex' }}
                            >
                              {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                            <div className="text-xs sm:text-sm font-semibold text-[#373435] truncate">
                              {user.full_name || 'Nome não informado'}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 flex items-center truncate">
                              <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-2xl text-xs font-medium bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/20 text-[#EBA500] border border-[#EBA500]/30`}>
                          <RoleIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="hidden sm:inline">{roleInfo.label}</span>
                          <span className="sm:hidden truncate max-w-[80px]">{roleInfo.label}</span>
                        </div>
                      </td>
                      
                      <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-900 flex items-center">
                          <Building2 className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                          {user.companies?.name ? (
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span className="truncate max-w-[100px] sm:max-w-none">{user.companies.name}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setIsLinkModalOpen(true)
                                  }}
                                  className="text-blue-600 hover:text-blue-800 p-1.5 sm:p-1 h-auto min-h-[32px] sm:min-h-0 rounded-md hover:bg-blue-50 transition-colors duration-200 touch-manipulation"
                                  title="Alterar empresa"
                                >
                                  <Edit className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                                </button>
                                <button
                                  onClick={() => handleUnlinkFromCompany(user.id)}
                                  className="text-red-600 hover:text-red-800 p-1.5 sm:p-1 h-auto min-h-[32px] sm:min-h-0 rounded-md hover:bg-red-50 transition-colors duration-200 touch-manipulation"
                                  title="Desvincular da empresa"
                                >
                                  <XCircle className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span className="text-gray-500 text-xs sm:text-sm">Não vinculado</span>
                              <button
                                onClick={() => {
                                  setSelectedUser(user)
                                  setIsLinkModalOpen(true)
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1.5 sm:p-1 h-auto min-h-[32px] sm:min-h-0 rounded-md hover:bg-blue-50 transition-colors duration-200 touch-manipulation"
                                title="Vincular à empresa"
                              >
                                <LinkIcon className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-2xl text-xs font-medium bg-gradient-to-r ${
                          user.status === 'active' 
                            ? 'from-green-50 to-green-100 text-green-700 border border-green-200'
                            : user.status === 'inactive'
                            ? 'from-red-50 to-red-100 text-red-700 border border-red-200'
                            : 'from-yellow-50 to-yellow-100 text-yellow-700 border border-yellow-200'
                        }`}>
                          {user.status === 'active' && <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0" />}
                          {user.status === 'inactive' && <XCircle className="h-3 w-3 mr-1 flex-shrink-0" />}
                          {user.status === 'pending' && <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />}
                          <span className="hidden sm:inline">{user.status === 'active' ? 'Ativo' : user.status === 'inactive' ? 'Inativo' : 'Pendente'}</span>
                        </div>
                      </td>
                      
                      <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setIsViewModalOpen(true)
                            }}
                            className="text-gray-600 hover:text-gray-800 p-2 sm:p-2 rounded-2xl hover:bg-gray-100 transition-all duration-200 min-h-[40px] sm:min-h-0 touch-manipulation"
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setIsEditModalOpen(true)
                            }}
                            className="text-blue-600 hover:text-blue-800 p-2 sm:p-2 rounded-2xl hover:bg-blue-50 transition-all duration-200 min-h-[40px] sm:min-h-0 touch-manipulation"
                            title="Editar usuário"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className={`p-2 sm:p-2 rounded-2xl transition-all duration-200 min-h-[40px] sm:min-h-0 touch-manipulation ${
                              user.is_active 
                                ? "text-red-600 hover:text-red-900 hover:bg-red-50" 
                                : "text-green-600 hover:text-green-900 hover:bg-green-50"
                            }`}
                            title={user.is_active ? "Desativar usuário" : "Ativar usuário"}
                          >
                            {user.is_active ? (
                              <Trash2 className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 sm:py-12 px-4">
              <Users className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
              <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">
                Nenhum usuário encontrado
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                {searchTerm || roleFilter || statusFilter
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Convide usuários para começar.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal de Visualização */}
        {isViewModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" onClick={() => setIsViewModalOpen(false)}>
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Detalhes do Usuário
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                      <p className="text-sm text-gray-900">{selectedUser.full_name || 'Não informado'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedUser.email}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Função</label>
                      <p className="text-sm text-gray-900">
                        {getRoleInfo(selectedUser.company_role || selectedUser.role).label}
                        {selectedUser.company_role && selectedUser.company_role !== selectedUser.role && (
                          <span className="text-xs text-gray-500 ml-2">
                            (Global: {getRoleInfo(selectedUser.role).label})
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Empresa</label>
                      <p className="text-sm text-gray-900">{selectedUser.companies?.name || 'Não vinculado'}</p>
                      {selectedUser.company_role && (
                        <p className="text-xs text-gray-500 mt-1">
                          Função na empresa: {getRoleInfo(selectedUser.company_role).label}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Data de Criação</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedUser.created_at)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="px-6 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-[#373435] rounded-2xl hover:from-gray-200 hover:to-gray-300 focus:outline-none focus:ring-2 focus:ring-[#373435]/20 font-medium transition-all duration-200"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Vinculação de Empresa */}
        {isLinkModalOpen && selectedUser && (
          <LinkUserModal
            user={selectedUser}
            companies={companies}
            onClose={() => {
              setIsLinkModalOpen(false)
              setSelectedUser(null)
            }}
            onLink={handleLinkToCompany}
            loading={updating}
          />
        )}

        {/* Modal de Criar Usuário */}
        {isCreateUserModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-[#373435] mb-4">Criar Novo Usuário</h3>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email do Usuário
                  </label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="usuario@empresa.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBA500]"
                    required
                    disabled={creatingUser}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Como funciona:</strong>
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Usuário receberá email de confirmação</li>
                    <li>Ao clicar, será direcionado para completar cadastro</li>
                    <li>Preencherá nome e senha</li>
                    <li>Será criado com role "Usuário" (sem empresa)</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateUserModalOpen(false)
                      setNewUserEmail('')
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    disabled={creatingUser}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#EBA500] text-white rounded-lg hover:bg-[#d49400] disabled:opacity-50"
                    disabled={creatingUser}
                  >
                    {creatingUser ? 'Enviando...' : 'Enviar Convite'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Edição */}
        {isEditModalOpen && selectedUser && (
          <EditUserModal
            user={selectedUser}
            onClose={() => {
              setIsEditModalOpen(false)
              setSelectedUser(null)
            }}
            onSave={handleUpdateUser}
            loading={updating}
          />
        )}
      </div>
    </div>
  )
}

// Componente Modal de Edição
function EditUserModal({ user, onClose, onSave, loading }) {
  const [fullName, setFullName] = useState(user.full_name || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!fullName.trim()) {
      alert('Por favor, preencha o nome do usuário')
      return
    }
    
    console.log('📝 Enviando atualização - User ID:', user.id, 'Nome:', fullName)
    
    // Enviar apenas o nome para atualização
    onSave(user.id, { full_name: fullName.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Editar Nome do Usuário
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nome completo do usuário"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EBA500]"
                    autoFocus
                    required
                  />
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    <strong>Email:</strong> {user.email}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Função:</strong> {user.role || 'user'}
                  </p>
                  {user.companies?.name && (
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Empresa:</strong> {user.companies.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:ml-3 sm:w-auto px-6 py-2 bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/5 text-[#EBA500] rounded-2xl hover:from-[#EBA500]/20 hover:to-[#EBA500]/10 border border-[#EBA500]/30 font-medium transition-all duration-200"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full sm:mt-0 sm:w-auto px-6 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-[#373435] rounded-2xl hover:from-gray-200 hover:to-gray-300 focus:outline-none focus:ring-2 focus:ring-[#373435]/20 font-medium transition-all duration-200"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Componente Modal de Vinculação
function LinkUserModal({ user, companies, onClose, onLink, loading }) {
  const isEdit = Boolean(user.companies?.id)
  const [selectedCompanyId, setSelectedCompanyId] = useState(user.companies?.id || '')
  const [selectedRole, setSelectedRole] = useState(user.company_role || 'user')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedCompanyId) {
      alert('Por favor, selecione uma empresa')
      return
    }
    
    const userId = user.id
    console.log('Modal: Tentando vincular usuário ID:', userId, 'Dados do usuário:', {
      id: user.id,
      email: user.email
    })
    
    onLink(userId, selectedCompanyId, selectedRole)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {isEdit ? 'Alterar Empresa do Usuário' : 'Vincular Usuário à Empresa'}
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  {isEdit 
                    ? `Alterar a empresa de ${user.full_name || user.email}`
                    : `Vincular ${user.full_name || user.email} a uma empresa`
                  }
                </p>
                
                {isEdit && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>Empresa atual:</strong> {user.companies?.name}
                    </p>
                    <p className="text-sm text-yellow-700">
                      <strong>Função atual:</strong> {user.company_role || 'user'}
                    </p>
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isEdit ? 'Nova Empresa' : 'Empresa'}
                  </label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecione uma empresa...</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Função na Empresa
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">Usuário</option>
                    <option value="company_admin">Admin da Empresa</option>
                    <option value="gestor">Gestor Geral</option>
                    <option value="gestor_financeiro">Gestor Financeiro</option>
                    <option value="gestor_estrategico">Gestor Estratégico</option>
                    <option value="gestor_pessoas_cultura">Gestor de Pessoas & Cultura</option>
                    <option value="gestor_vendas_marketing">Gestor de Vendas & Marketing</option>
                    <option value="gestor_operacional">Gestor Operacional</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 <strong>Gestor Geral</strong> tem acesso a todas as jornadas. 
                    <strong>Gestores específicos</strong> têm acesso apenas às suas jornadas.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:ml-3 sm:w-auto px-6 py-2 bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/5 text-[#EBA500] rounded-2xl hover:from-[#EBA500]/20 hover:to-[#EBA500]/10 border border-[#EBA500]/30 font-medium transition-all duration-200"
              >
                {loading 
                  ? (isEdit ? 'Alterando...' : 'Vinculando...') 
                  : (isEdit ? 'Alterar' : 'Vincular')
                }
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full sm:mt-0 sm:w-auto px-6 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-[#373435] rounded-2xl hover:from-gray-200 hover:to-gray-300 focus:outline-none focus:ring-2 focus:ring-[#373435]/20 font-medium transition-all duration-200"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}