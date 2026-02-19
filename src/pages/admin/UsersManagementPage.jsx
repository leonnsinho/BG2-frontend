import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import SuperAdminBanner from '../../components/SuperAdminBanner'
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
  Settings,
  User,
  Calendar,
  GraduationCap,
  BarChart3,
  Heart,
  MoreVertical,
  X,
  Wrench
} from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'
import ToolManagementModal from '../../components/admin/ToolManagementModal'

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
  const [searchParams] = useSearchParams()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  // Inicializar companyFilter com valor da URL se existir
  const initialCompanyFilter = searchParams.get('company') || searchParams.get('companyId') || 'all'
  const [companyFilter, setCompanyFilter] = useState(initialCompanyFilter)
  
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
  const [companyLogoUrls, setCompanyLogoUrls] = useState({})
  
  // Estado para o modal de ações do usuário
  const [showActionsModal, setShowActionsModal] = useState(false)
  const [selectedUserForActions, setSelectedUserForActions] = useState(null)
  const [actionsModalAnimating, setActionsModalAnimating] = useState(false)

  // Estados para gerenciamento de jornadas
  const [journeys, setJourneys] = useState([])
  const [assignments, setAssignments] = useState([])
  const [modalAssignments, setModalAssignments] = useState([]) // Assignments específicos do modal
  const [showJourneyModal, setShowJourneyModal] = useState(false)
  const [selectedUserForJourney, setSelectedUserForJourney] = useState(null)
  const [modalAnimating, setModalAnimating] = useState(false)

  // Estados para gerenciamento de ferramentas
  const [showToolModal, setShowToolModal] = useState(false)
  const [selectedUserForTools, setSelectedUserForTools] = useState(null)

  // Ícones das jornadas
  const journeyIcons = {
    'estrategica': GraduationCap,
    'financeira': BarChart3,
    'pessoas-cultura': Users,
    'processos-tecnologia': Settings,
    'vendas-marketing': TrendingUp,
    'ambiental-social': Heart
  }

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
      
      // Sincronizar companyFilter com a URL quando mudar
      const companyFromUrl = searchParams.get('company') || searchParams.get('companyId')
      if (companyFromUrl && companyFromUrl !== companyFilter) {
        setCompanyFilter(companyFromUrl)
      }
    }
  }, [profile, searchParams])

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

  // Carregar jornadas e atribuições
  useEffect(() => {
    loadJourneys()
    loadAssignments()
  }, [])

  // ESC para fechar modal de jornadas
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && showJourneyModal) {
        closeJourneyModal()
      }
    }
    
    window.addEventListener('keydown', handleEsc)
    if (showJourneyModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [showJourneyModal])

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
            name,
            logo_url
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
      
      // Carregar logos das empresas
      const logoUrls = {}
      const uniqueCompanies = [...new Set(combinedUsers.map(u => u.companies).filter(Boolean))]
      
      for (const company of uniqueCompanies) {
        if (company.logo_url) {
          const { data } = await supabase.storage
            .from('company-avatars')
            .createSignedUrl(company.logo_url, 3600) // 1 hora
          
          if (data?.signedUrl) {
            logoUrls[company.id] = data.signedUrl
          }
        }
      }
      setCompanyLogoUrls(logoUrls)
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

  // Funções de Jornadas
  const loadJourneys = async () => {
    try {
      const { data, error } = await supabase
        .from('journeys')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) throw error
      setJourneys(data || [])
    } catch (error) {
      console.error('Erro ao carregar jornadas:', error)
    }
  }

  const loadAssignments = async () => {
    try {
      let query = supabase
        .from('user_journey_assignments')
        .select(`
          *,
          journey:journeys(name, slug)
        `)
      
      // Filtrar por empresa se não for 'all'
      if (companyFilter && companyFilter !== 'all') {
        query = query.eq('company_id', companyFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setAssignments(data || [])
    } catch (error) {
      console.error('Erro ao carregar atribuições:', error)
    }
  }

  const getManualAssignments = (userId) => {
    const user = users.find(u => u.id === userId)
    const userCompany = user?.company_id
    
    const userAssignments = assignments.filter(a => 
      a.user_id === userId && 
      a.is_active && 
      (!userCompany || a.company_id === userCompany)
    )
    
    return userAssignments.map(a => a.journey?.slug).filter(Boolean)
  }

  const isManuallyAssigned = (userId, journeySlug) => {
    // Usar modalAssignments dentro do modal
    const assignmentsToCheck = showJourneyModal ? modalAssignments : assignments
    return assignmentsToCheck.some(a => 
      a.user_id === userId && 
      a.journey?.slug === journeySlug && 
      a.is_active === true
    )
  }

  const openJourneyModal = async (user) => {
    setSelectedUserForJourney(user)
    setShowJourneyModal(true)
    setTimeout(() => setModalAnimating(true), 10)
    
    // Carregar assignments apenas da empresa do usuário no state separado
    try {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()
      
      if (userCompany) {
        const { data: userAssignments } = await supabase
          .from('user_journey_assignments')
          .select(`
            *,
            journey:journeys(name, slug)
          `)
          .eq('company_id', userCompany.company_id)
        
        setModalAssignments(userAssignments || [])
        console.log('📝 Assignments carregados para modal (empresa do usuário):', userCompany.company_id, userAssignments)
      }
    } catch (error) {
      console.error('Erro ao carregar assignments do usuário:', error)
    }
  }

  const closeJourneyModal = () => {
    setModalAnimating(false)
    setTimeout(() => {
      setShowJourneyModal(false)
      setSelectedUserForJourney(null)
      setModalAssignments([]) // Limpar assignments do modal
    }, 200)
  }

  const closeActionsModal = () => {
    setActionsModalAnimating(false)
    setTimeout(() => {
      setShowActionsModal(false)
      setSelectedUserForActions(null)
    }, 200)
  }

  const assignJourney = async (journeyId) => {
    if (!selectedUserForJourney) return

    try {
      // Buscar company_id do usuário
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', selectedUserForJourney.id)
        .eq('is_active', true)
        .single()

      if (!userCompany) {
        alert('Usuário não está vinculado a nenhuma empresa')
        return
      }

      const { error } = await supabase.rpc('assign_journey_to_user', {
        p_user_id: selectedUserForJourney.id,
        p_journey_id: journeyId,
        p_company_id: userCompany.company_id
      })

      if (error) throw error

      // Recarregar assignments apenas da empresa do usuário no modal
      const { data: userAssignments } = await supabase
        .from('user_journey_assignments')
        .select(`
          *,
          journey:journeys(name, slug)
        `)
        .eq('company_id', userCompany.company_id)
      
      setModalAssignments(userAssignments || [])
      
      // Também atualizar assignments globais para refletir na tabela
      await loadAssignments()
    } catch (error) {
      console.error('Erro ao atribuir jornada:', error)
      alert('Erro ao atribuir jornada: ' + error.message)
    }
  }

  const revokeJourneyAccess = async (journeyId) => {
    if (!selectedUserForJourney) return

    try {
      console.log('🗑️ Removendo jornada:', { userId: selectedUserForJourney.id, journeyId })
      
      // Buscar company_id do usuário
      const { data: userCompany, error: companyError } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', selectedUserForJourney.id)
        .eq('is_active', true)
        .single()

      console.log('🏢 Company encontrada:', userCompany, 'Erro:', companyError)

      if (!userCompany) {
        alert('Usuário não está vinculado a nenhuma empresa')
        return
      }

      console.log('📞 Chamando RPC remove_journey_assignment:', {
        p_user_id: selectedUserForJourney.id,
        p_journey_id: journeyId,
        p_company_id: userCompany.company_id
      })

      const { data, error } = await supabase.rpc('remove_journey_assignment', {
        p_user_id: selectedUserForJourney.id,
        p_journey_id: journeyId,
        p_company_id: userCompany.company_id
      })

      console.log('✅ Resposta RPC completa:', JSON.stringify({ data, error }, null, 2))
      
      // Verificar se a função retornou erro no JSON
      if (data && !data.success) {
        console.error('❌ RPC retornou success=false:', data)
        throw new Error(data.error || 'Falha ao remover jornada')
      }

      if (error) throw error

      console.log('🔄 Recarregando assignments...')
      
      // Recarregar apenas da empresa do usuário no modal
      const { data: updatedAssignments } = await supabase
        .from('user_journey_assignments')
        .select(`
          *,
          journey:journeys(name, slug)
        `)
        .eq('company_id', userCompany.company_id)
      
      setModalAssignments(updatedAssignments || [])
      
      // Também atualizar assignments globais para refletir na tabela
      await loadAssignments()
      
      // Verificar o que ficou ativo após a remoção
      const remainingAssignments = (updatedAssignments || []).filter(a => 
        a.user_id === selectedUserForJourney.id && a.is_active
      )
      console.log('🔍 Assignments restantes após remoção (filtrados por company:', userCompany.company_id, '):', JSON.stringify(remainingAssignments.map(a => ({
        assignment_id: a.id,
        journey_id: a.journey_id,
        company_id: a.company_id,
        journey_name: a.journey?.name,
        is_active: a.is_active,
        TENTOU_REMOVER_ESTE: journeyId === a.journey_id && userCompany.company_id === a.company_id ? '❌ SIM! BUG!' : '✅ Não'
      })), null, 2))
      
      console.log('✅ Jornada removida com sucesso!')
    } catch (error) {
      console.error('❌ Erro ao remover acesso:', error)
      alert('Erro ao remover acesso: ' + error.message)
    }
  }

  const clearAllJourneys = async () => {
    if (!selectedUserForJourney) return
    
    if (!confirm(`Tem certeza que deseja remover TODAS as jornadas de ${selectedUserForJourney.full_name}?`)) {
      return
    }

    try {
      // Buscar company_id do usuário
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', selectedUserForJourney.id)
        .eq('is_active', true)
        .single()

      if (!userCompany) {
        alert('Usuário não está vinculado a nenhuma empresa')
        return
      }

      // Desativar todas as atribuições do usuário nesta empresa
      const { error } = await supabase
        .from('user_journey_assignments')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', selectedUserForJourney.id)
        .eq('company_id', userCompany.company_id)
        .eq('is_active', true)

      if (error) throw error

      // Recarregar assignments do modal
      const { data: updatedAssignments } = await supabase
        .from('user_journey_assignments')
        .select(`
          *,
          journey:journeys(name, slug)
        `)
        .eq('company_id', userCompany.company_id)
      
      setModalAssignments(updatedAssignments || [])
      
      // Atualizar assignments globais
      await loadAssignments()
      
      alert('Todas as jornadas foram removidas!')
    } catch (error) {
      console.error('Erro ao limpar jornadas:', error)
      alert('Erro ao limpar jornadas: ' + error.message)
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
      <SuperAdminBanner />
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
                  <th className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-center text-xs font-semibold text-[#373435] uppercase tracking-wider w-20">
                    Ações
                  </th>
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
                    Jornadas
                  </th>
                  <th className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {filteredUsers.map((user) => {
                  // Usar o role da empresa se existir, senão usar o role global
                  const effectiveRole = user.company_role || user.role
                  const roleInfo = getRoleInfo(effectiveRole)
                  const RoleIcon = roleInfo.icon
                  const isGestor = user.company_role === 'gestor' || user.role === 'gestor'

                  return (
                    <tr 
                      key={user.id} 
                      className={`transition-all duration-200 ${
                        isGestor 
                          ? 'bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/5 hover:from-[#EBA500]/20 hover:to-[#EBA500]/10 border-l-4 border-[#EBA500]'
                          : 'hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-[#EBA500]/5'
                      }`}
                    >
                      {/* Coluna de Ações - Primeira coluna com botão único */}
                      <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-center">
                        <button
                          onClick={() => {
                            setSelectedUserForActions(user)
                            setShowActionsModal(true)
                            setTimeout(() => setActionsModalAnimating(true), 10)
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#EBA500]/10 to-[#EBA500]/20 hover:from-[#EBA500]/20 hover:to-[#EBA500]/30 text-[#EBA500] transition-all duration-200 border border-[#EBA500]/30 hover:border-[#EBA500]/50"
                          title="Abrir menu de ações"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </td>
                      
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
                        <div className="flex items-center justify-center">
                          {user.companies ? (
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#EBA500]/20 to-[#EBA500]/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {companyLogoUrls[user.companies.id] ? (
                                <img 
                                  src={companyLogoUrls[user.companies.id]} 
                                  alt={user.companies.name}
                                  className="w-full h-full object-cover"
                                  title={user.companies.name}
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextSibling.style.display = 'flex'
                                  }}
                                />
                              ) : null}
                              <Building2 
                                className="h-5 w-5 sm:h-6 sm:w-6 text-[#EBA500]" 
                                style={{ display: companyLogoUrls[user.companies.id] ? 'none' : 'flex' }}
                              />
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs sm:text-sm">-</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Coluna Jornadas */}
                      <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                        {(user.company_role === 'gestor' || user.role === 'gestor') ? (
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-sm">
                            {getManualAssignments(user.id).length}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
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

              <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-gradient-to-br from-[#EBA500]/5 to-white px-6 pt-6 pb-5">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EBA500] to-[#EBA500]/80 flex items-center justify-center shadow-lg">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-[#373435]">
                        Detalhes de {selectedUser.full_name || selectedUser.email}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">Informações completas do usuário</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <User className="h-3.5 w-3.5" />
                        Nome Completo
                      </label>
                      <p className="text-base text-gray-900 mt-2 font-medium">{selectedUser.full_name || 'Não informado'}</p>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        Email
                      </label>
                      <p className="text-base text-gray-900 mt-2 font-medium break-all">{selectedUser.email}</p>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5" />
                        Função
                      </label>
                      <p className="text-base text-gray-900 mt-2 font-medium">
                        {getRoleInfo(selectedUser.company_role || selectedUser.role).label}
                      </p>
                      {selectedUser.company_role && selectedUser.company_role !== selectedUser.role && (
                        <p className="text-xs text-gray-500 mt-1">
                          Função global: {getRoleInfo(selectedUser.role).label}
                        </p>
                      )}
                    </div>
                    
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5" />
                        Empresa
                      </label>
                      <p className="text-base text-gray-900 mt-2 font-medium">{selectedUser.companies?.name || 'Não vinculado'}</p>
                      {selectedUser.company_role && (
                        <p className="text-xs text-gray-500 mt-1">
                          Função na empresa: {getRoleInfo(selectedUser.company_role).label}
                        </p>
                      )}
                    </div>
                    
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 md:col-span-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        Data de Criação
                      </label>
                      <p className="text-base text-gray-900 mt-2 font-medium">{formatDate(selectedUser.created_at)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-4 flex justify-end">
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 text-white rounded-2xl hover:from-[#EBA500]/90 hover:to-[#EBA500] shadow-md hover:shadow-lg font-semibold transition-all duration-200"
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
            currentUserProfile={profile}
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

        {/* Modal de Ações do Usuário */}
        {showActionsModal && selectedUserForActions && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={closeActionsModal}
          >
            <div 
              className={`relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col transition-all duration-300 ${
                actionsModalAnimating ? 'translate-y-0 sm:scale-100 opacity-100' : 'translate-y-full sm:translate-y-0 sm:scale-95 opacity-0'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Fixo */}
              <div className="flex-shrink-0 relative px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-100">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#EBA500] to-[#d49400] flex items-center justify-center shadow-lg">
                    {avatarUrls[selectedUserForActions.id] ? (
                      <img 
                        src={avatarUrls[selectedUserForActions.id]} 
                        alt={selectedUserForActions.full_name || 'Avatar'}
                        className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                      />
                    ) : (
                      <span className="text-lg sm:text-2xl font-bold text-white">
                        {selectedUserForActions.full_name?.charAt(0) || selectedUserForActions.email?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                      {selectedUserForActions.full_name || 'Usuário'}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1 truncate">
                      <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                      <span className="truncate">{selectedUserForActions.email}</span>
                    </p>
                  </div>
                  <button
                    onClick={closeActionsModal}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-all"
                  >
                    <X className="h-5 w-5 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>

              {/* Conteúdo com Scroll Interno */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
                {/* Info Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl sm:rounded-2xl p-2 sm:p-4 border border-blue-200/50">
                    <p className="text-[10px] sm:text-xs font-medium text-blue-600 uppercase tracking-wide mb-0.5 sm:mb-1">Função</p>
                    <p className="text-xs sm:text-sm font-bold text-blue-900 truncate" title={getRoleInfo(selectedUserForActions.company_role || selectedUserForActions.role).label}>
                      {getRoleInfo(selectedUserForActions.company_role || selectedUserForActions.role).label}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl sm:rounded-2xl p-2 sm:p-4 border border-purple-200/50">
                    <p className="text-[10px] sm:text-xs font-medium text-purple-600 uppercase tracking-wide mb-0.5 sm:mb-1">Empresa</p>
                    <p className="text-xs sm:text-sm font-bold text-purple-900 truncate" title={selectedUserForActions.companies?.name}>
                      {selectedUserForActions.companies?.name || 'Sem vínculo'}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl sm:rounded-2xl p-2 sm:p-4 border border-emerald-200/50">
                    <p className="text-[10px] sm:text-xs font-medium text-emerald-600 uppercase tracking-wide mb-0.5 sm:mb-1">Status</p>
                    <span className={`inline-flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm font-bold ${
                      selectedUserForActions.status === 'active' 
                        ? 'text-emerald-700'
                        : selectedUserForActions.status === 'inactive'
                        ? 'text-red-700'
                        : 'text-yellow-700'
                    }`}>
                      {selectedUserForActions.status === 'active' && <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                      {selectedUserForActions.status === 'inactive' && <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                      {selectedUserForActions.status === 'pending' && <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                      {selectedUserForActions.status === 'active' ? 'Ativo' : selectedUserForActions.status === 'inactive' ? 'Inativo' : 'Pendente'}
                    </span>
                  </div>
                </div>

                {/* Ações */}
                <div className="space-y-2 sm:space-y-3">
                  {/* Editar Nome */}
                  <button
                    onClick={() => {
                      setSelectedUser(selectedUserForActions)
                      setIsEditModalOpen(true)
                      closeActionsModal()
                    }}
                    className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100/30 hover:from-blue-100 hover:to-blue-200/50 border border-blue-200/50 hover:border-blue-300 transition-all duration-200 group hover:shadow-md active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                      <Edit className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-semibold text-sm sm:text-base text-gray-900">Editar Nome</p>
                      <p className="text-xs text-gray-600 hidden sm:block">Alterar o nome de exibição</p>
                    </div>
                  </button>

                  {/* Vincular/Alterar Empresa */}
                  <button
                    onClick={() => {
                      setSelectedUser(selectedUserForActions)
                      setIsLinkModalOpen(true)
                      closeActionsModal()
                    }}
                    className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-50 to-purple-100/30 hover:from-purple-100 hover:to-purple-200/50 border border-purple-200/50 hover:border-purple-300 transition-all duration-200 group hover:shadow-md active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-semibold text-sm sm:text-base text-gray-900">
                        {selectedUserForActions.companies?.name ? 'Alterar Empresa/Função' : 'Vincular à Empresa'}
                      </p>
                      <p className="text-xs text-gray-600 hidden sm:block">
                        {selectedUserForActions.companies?.name ? 'Modificar vinculação' : 'Associar a empresa'}
                      </p>
                    </div>
                  </button>

                  {/* Gerenciar Jornadas */}
                  {(selectedUserForActions.company_role === 'gestor' || selectedUserForActions.role === 'gestor') && (
                    <button
                      onClick={() => {
                        openJourneyModal(selectedUserForActions)
                        closeActionsModal()
                      }}
                      className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100/30 hover:from-emerald-100 hover:to-emerald-200/50 border border-emerald-200/50 hover:border-emerald-300 transition-all duration-200 group hover:shadow-md active:scale-[0.98]"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                        <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-semibold text-sm sm:text-base text-gray-900">Gerenciar Jornadas</p>
                        <p className="text-xs text-gray-600">{getManualAssignments(selectedUserForActions.id).length} atribuída(s)</p>
                      </div>
                    </button>
                  )}

                  {/* Gerenciar Ferramentas */}
                  {selectedUserForActions.companies?.id && (
                    <button
                      onClick={() => {
                        setSelectedUserForTools(selectedUserForActions)
                        setShowToolModal(true)
                        closeActionsModal()
                      }}
                      className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/30 hover:from-amber-100 hover:to-amber-200/50 border border-amber-200/50 hover:border-amber-300 transition-all duration-200 group hover:shadow-md active:scale-[0.98]"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                        <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-semibold text-sm sm:text-base text-gray-900">Gerenciar Ferramentas</p>
                        <p className="text-xs text-gray-600">Controlar acesso a telas específicas</p>
                      </div>
                    </button>
                  )}

                  {/* Desvincular da Empresa */}
                  {selectedUserForActions.companies?.name && (
                    <button
                      onClick={() => {
                        handleUnlinkFromCompany(selectedUserForActions.id)
                        closeActionsModal()
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-orange-100/30 hover:from-orange-100 hover:to-orange-200/50 border border-orange-200/50 hover:border-orange-300 transition-all duration-200 group hover:shadow-md"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <XCircle className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-gray-900">Desvincular da Empresa</p>
                        <p className="text-xs text-gray-600">Remover vinculação atual</p>
                      </div>
                    </button>
                  )}

                  {/* Ativar/Desativar */}
                  <button
                    onClick={() => {
                      handleDeleteUser(selectedUserForActions.id)
                      closeActionsModal()
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group hover:shadow-md ${
                      selectedUserForActions.is_active
                        ? 'bg-gradient-to-r from-red-50 to-red-100/30 hover:from-red-100 hover:to-red-200/50 border border-red-200/50 hover:border-red-300'
                        : 'bg-gradient-to-r from-green-50 to-green-100/30 hover:from-green-100 hover:to-green-200/50 border border-green-200/50 hover:border-green-300'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      {selectedUserForActions.is_active ? (
                        <Trash2 className="h-5 w-5 text-red-600" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900">
                        {selectedUserForActions.is_active ? 'Desativar Usuário' : 'Ativar Usuário'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {selectedUserForActions.is_active ? 'Bloquear acesso ao sistema' : 'Reativar acesso'}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Footer Fixo */}
              <div className="flex-shrink-0 px-8 py-4 border-t border-gray-100">
                <button
                  onClick={closeActionsModal}
                  className="w-full px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl hover:from-gray-900 hover:to-black transition-all font-medium shadow-lg hover:shadow-xl"
                >
                  Fechar
                </button>
              </div>
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

        {/* Modal de Gerenciamento de Jornadas - Design Moderno */}
        {showJourneyModal && selectedUserForJourney && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeJourneyModal}
          >
            <div 
              className={`bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col transition-all duration-300 ${
                modalAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Fixo */}
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <GraduationCap className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Gerenciar Jornadas
                    </h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {selectedUserForJourney.full_name || selectedUserForJourney.email}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={closeJourneyModal}
                  className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-105"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Conteúdo Scrollável */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="space-y-3">
                  {journeys.map(journey => {
                    const Icon = journeyIcons[journey.slug] || GraduationCap
                    const isManuallyAssignedToUser = isManuallyAssigned(selectedUserForJourney.id, journey.slug)
                    
                    return (
                      <div
                        key={journey.id}
                        className={`rounded-2xl p-5 transition-all duration-200 ${
                          isManuallyAssignedToUser
                            ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300 shadow-md' 
                            : 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                            isManuallyAssignedToUser
                              ? 'bg-white text-emerald-600' 
                              : 'bg-white text-gray-600'
                          }`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-bold text-gray-900 text-lg">
                                  {journey.name}
                                </h4>
                              </div>
                              
                              {isManuallyAssignedToUser && (
                                <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full whitespace-nowrap">
                                  Ativa
                                </span>
                              )}
                            </div>
                            
                            <div className="mt-4">
                              {isManuallyAssignedToUser ? (
                                <button
                                  onClick={() => revokeJourneyAccess(journey.id)}
                                  className="w-full px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2"
                                >
                                  <X className="w-4 h-4" />
                                  Remover Jornada
                                </button>
                              ) : (
                                <button
                                  onClick={() => assignJourney(journey.id)}
                                  className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2"
                                >
                                  <GraduationCap className="w-4 h-4" />
                                  Atribuir Jornada
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {journeys.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <GraduationCap className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">Nenhuma jornada disponível</p>
                  </div>
                )}
              </div>

              {/* Footer Fixo */}
              <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
                <div className="flex gap-3">
                  <button
                    onClick={clearAllJourneys}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Limpar Todas
                  </button>
                  <button
                    onClick={closeJourneyModal}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all duration-200 font-semibold shadow-md hover:shadow-lg hover:scale-[1.02]"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tool Management Modal */}
      {showToolModal && selectedUserForTools && (
        <ToolManagementModal
          user={selectedUserForTools}
          companyId={selectedUserForTools.companies?.id}
          onClose={() => setShowToolModal(false)}
        />
      )}
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
function LinkUserModal({ user, companies, onClose, onLink, loading, currentUserProfile }) {
  const isEdit = Boolean(user.companies?.id)
  const [selectedCompanyId, setSelectedCompanyId] = useState(user.companies?.id || '')
  const [selectedRole, setSelectedRole] = useState(user.company_role || 'user')
  
  // Verificar se o usuário atual é super_admin
  const isSuperAdmin = currentUserProfile?.role === 'super_admin'
  
  // Company admin só pode alterar role, não a empresa
  const canChangeCompany = isSuperAdmin

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
                {isEdit 
                  ? (canChangeCompany 
                      ? `Alterar a empresa e função de ${user.full_name || user.email}`
                      : `Alterar a função de ${user.full_name || user.email}`)
                  : `Vincular ${user.full_name || user.email} a uma empresa`
                }
              </h3>
              
              <div className="mb-4">
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empresa
                  </label>
                  {canChangeCompany ? (
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
                  ) : (
                    <div className="w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md text-gray-700">
                      {companies.find(c => c.id === selectedCompanyId)?.name || 'Nenhuma empresa'}
                    </div>
                  )}
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
                  </select>
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