import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { 
  Users,
  GraduationCap,
  BarChart3,
  Heart,
  Megaphone,
  Settings
} from 'lucide-react'

export default function JourneyAssignmentsPage() {
  const { profile, hasRole } = useAuth()
  const [users, setUsers] = useState([])
  const [journeys, setJourneys] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [modalAnimating, setModalAnimating] = useState(false)

  // Mapeamento de ícones por tipo de jornada
  const journeyIcons = {
    'estrategica': GraduationCap,
    'financeira': BarChart3,
    'pessoas-cultura': Heart,
    'receita-crm': Megaphone,
    'operacional': Settings
  }

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'super_admin': 'Super Admin',
      'gestor': 'Gestor Geral',
      'gestor_financeiro': 'Gestor Financeiro',
      'gestor_estrategico': 'Gestor Estratégico',
      'gestor_pessoas_cultura': 'Gestor Pessoas & Cultura',
      'gestor_vendas_marketing': 'Gestor Vendas & Marketing',
      'gestor_operacional': 'Gestor Operacional',
      'company_admin': 'Admin da Empresa',
      'user': 'Usuário'
    }
    return roleMap[role] || role
  }

  // Verificar se usuário tem permissão
  useEffect(() => {
    if (!hasRole(['super_admin', 'company_admin'])) {
      toast.error('Você não tem permissão para acessar esta página')
      window.history.back()
      return
    }
    
    // Super admin precisa ter pelo menos uma empresa para gerenciar
    if (profile.role === 'super_admin' && !profile.company_id) {
      console.log('Super admin acessando sistema de atribuições globais')
    }
  }, [hasRole, profile])

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData()
  }, [])

  // Fechar modal com ESC
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && showAssignmentModal) {
        closeAssignmentModal()
      }
    }

    if (showAssignmentModal) {
      document.addEventListener('keydown', handleEscKey)
      // Prevenir scroll do body quando modal está aberto
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
      document.body.style.overflow = 'unset'
    }
  }, [showAssignmentModal])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      // Para super_admin, carregar usuários de todas as empresas
      // Para company_admin, carregar apenas usuários da sua empresa
      let usersQuery, usersData

      if (hasRole('super_admin')) {
        // Super admin vê todos os usuários com seus company roles (exceto ele mesmo)
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .neq('id', profile.id) // Excluir o usuário atual
          .order('full_name')

        if (profilesError) throw profilesError

        // Buscar os company roles para cada usuário
        const profileIds = (profilesData || []).map(p => p.id)
        
        let userCompaniesData = []
        if (profileIds.length > 0) {
          const { data: ucData, error: ucError } = await supabase
            .from('user_companies')
            .select('user_id, role, company_id')
            .in('user_id', profileIds)
            .eq('is_active', true)

          if (!ucError) {
            userCompaniesData = ucData || []
          }
        }

        // Combinar os dados
        usersData = (profilesData || []).map(profile => {
          const userCompany = userCompaniesData.find(uc => uc.user_id === profile.id)
          return {
            ...profile,
            company_role: userCompany?.role || null,
            company_id: userCompany?.company_id || null
          }
        })

      } else {
        // Company admin vê apenas usuários da sua empresa (exceto ele mesmo)
        const activeCompany = profile.user_companies?.find(uc => uc.is_active)
        if (!activeCompany?.company_id) {
          throw new Error('Empresa ativa não encontrada')
        }

        // Primeiro buscar as relações user_companies da empresa (excluindo o usuário atual)
        const { data: userCompaniesData, error: ucError } = await supabase
          .from('user_companies')
          .select('user_id, role')
          .eq('company_id', activeCompany.company_id)
          .eq('is_active', true)
          .neq('user_id', profile.id) // Excluir o usuário atual

        if (ucError) throw ucError
        
        if (!userCompaniesData || userCompaniesData.length === 0) {
          usersData = []
        } else {
          // Depois buscar os profiles dos usuários
          const userIds = userCompaniesData.map(uc => uc.user_id)
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email, full_name, role')
            .in('id', userIds)

          if (profilesError) throw profilesError

          // Combinar os dados
          usersData = (profilesData || []).map(profile => {
            const userCompany = userCompaniesData.find(uc => uc.user_id === profile.id)
            return {
              ...profile,
              company_role: userCompany?.role || null
            }
          })
        }
      }

      // Carregar jornadas
      const { data: journeysData, error: journeysError } = await supabase
        .from('journeys')
        .select('*')
        .order('name')

      if (journeysError) throw journeysError

      // Carregar atribuições manuais
      let assignmentsQuery = supabase
        .from('user_journey_assignments')
        .select(`
          *,
          journey:journeys(name, slug),
          user_profile:profiles!user_journey_assignments_user_id_fkey(full_name, email),
          assigned_by_profile:profiles!user_journey_assignments_assigned_by_fkey(full_name, email)
        `)

      // Se não for super_admin, filtrar por empresa do usuário logado
      if (!hasRole('super_admin')) {
        // Obter a empresa ativa do usuário logado
        const activeCompany = profile.user_companies?.find(uc => uc.is_active)
        if (activeCompany?.company_id) {
          assignmentsQuery = assignmentsQuery.eq('company_id', activeCompany.company_id)
        }
      }

      const { data: assignmentsData, error: assignmentsError } = await assignmentsQuery

      if (assignmentsError) throw assignmentsError

      setUsers(usersData || [])
      setJourneys(journeysData || [])
      setAssignments(assignmentsData || [])

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  // Função para obter jornadas atribuídas manualmente
  const getManualAssignments = (userId) => {
    return assignments
      .filter(a => a.user_id === userId && a.is_active)
      .map(a => a.journey.slug)
  }

  // Verificar se jornada está atribuída manualmente
  const isManuallyAssigned = (userId, journeySlug) => {
    return assignments.some(a => 
      a.user_id === userId && a.journey.slug === journeySlug && a.is_active === true
    )
  }

  // Atribuir jornada manualmente
  const assignJourney = async (userId, journeyId) => {
    try {
      // Encontrar o usuário na lista
      const targetUser = users.find(u => u.id === userId)
      if (!targetUser) {
        toast.error('Usuário não encontrado')
        return
      }

      // Obter company_id do usuário logado (admin que está fazendo a atribuição)
      let companyId = null

      if (hasRole('super_admin')) {
        // Super admin pode usar qualquer company_id, vamos usar o da empresa do usuário target
        const { data: targetUserCompanies } = await supabase
          .from('user_companies')
          .select('company_id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .limit(1)

        if (targetUserCompanies && targetUserCompanies.length > 0) {
          companyId = targetUserCompanies[0].company_id
        }
      } else {
        // Company admin usa sua empresa ativa
        const activeCompany = profile.user_companies?.find(uc => uc.is_active)
        if (activeCompany?.company_id) {
          companyId = activeCompany.company_id
        }
      }

      if (!companyId) {
        toast.error('Empresa ativa não encontrada')
        return
      }

      const { error } = await supabase
        .rpc('assign_journey_to_user', {
          p_user_id: userId,
          p_journey_id: journeyId,
          p_company_id: companyId
        })

      if (error) throw error

      toast.success('Jornada atribuída com sucesso')
      await loadInitialData()
    } catch (error) {
      console.error('Erro ao atribuir jornada:', error)
      toast.error('Erro ao atribuir jornada')
    }
  }

  // Remover atribuição manual
  const removeJourneyAssignment = async (userId, journeyId) => {
    try {
      // Encontrar o usuário na lista
      const targetUser = users.find(u => u.id === userId)
      if (!targetUser) {
        toast.error('Usuário não encontrado')
        return
      }

      // Obter company_id do usuário logado (admin que está fazendo a remoção)
      let companyId = null

      if (hasRole('super_admin')) {
        // Super admin pode usar qualquer company_id, vamos usar o da empresa do usuário target
        const { data: targetUserCompanies } = await supabase
          .from('user_companies')
          .select('company_id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .limit(1)

        if (targetUserCompanies && targetUserCompanies.length > 0) {
          companyId = targetUserCompanies[0].company_id
        }
      } else {
        // Company admin usa sua empresa ativa
        const activeCompany = profile.user_companies?.find(uc => uc.is_active)
        if (activeCompany?.company_id) {
          companyId = activeCompany.company_id
        }
      }

      if (!companyId) {
        toast.error('Empresa ativa não encontrada')
        return
      }

      const { error } = await supabase
        .rpc('remove_journey_assignment', {
          p_user_id: userId,
          p_journey_id: journeyId,
          p_company_id: companyId
        })

      if (error) throw error

      toast.success('Atribuição removida com sucesso')
      await loadInitialData()
    } catch (error) {
      console.error('Erro ao remover atribuição:', error)
      toast.error('Erro ao remover atribuição')
    }
  }

  // Remover atribuição de jornada
  const revokeJourneyAccess = async (userId, journeyId) => {
    try {
      // Encontrar o usuário na lista
      const targetUser = users.find(u => u.id === userId)
      if (!targetUser) {
        toast.error('Usuário não encontrado')
        return
      }

      // Obter company_id do usuário logado (admin que está fazendo a remoção)
      let companyId = null

      if (hasRole('super_admin')) {
        // Super admin pode usar qualquer company_id, vamos usar o da empresa do usuário target
        const { data: targetUserCompanies } = await supabase
          .from('user_companies')
          .select('company_id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .limit(1)

        if (targetUserCompanies && targetUserCompanies.length > 0) {
          companyId = targetUserCompanies[0].company_id
        }
      } else {
        // Company admin usa sua empresa ativa
        const activeCompany = profile.user_companies?.find(uc => uc.is_active)
        if (activeCompany?.company_id) {
          companyId = activeCompany.company_id
        }
      }

      if (!companyId) {
        toast.error('Empresa ativa não encontrada')
        return
      }

      // Simplesmente deletar a atribuição da tabela
      const { error } = await supabase
        .from('user_journey_assignments')
        .delete()
        .eq('user_id', userId)
        .eq('journey_id', journeyId)
        .eq('company_id', companyId)

      if (error) throw error

      toast.success('Acesso removido com sucesso')
      await loadInitialData()
    } catch (error) {
      console.error('Erro ao revogar acesso:', error)
      toast.error('Erro ao revogar acesso à jornada')
    }
  }

  const openAssignmentModal = (user) => {
    setSelectedUser(user)
    setShowAssignmentModal(true)
    // Pequeno delay para permitir que o modal seja renderizado antes da animação
    setTimeout(() => setModalAnimating(true), 10)
  }

  const closeAssignmentModal = () => {
    setModalAnimating(false)
    // Aguardar a animação de saída antes de remover o modal
    setTimeout(() => {
      setShowAssignmentModal(false)
      setSelectedUser(null)
    }, 200)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#373435] mb-3">
            Atribuição de Jornadas
          </h1>
          <p className="text-gray-600 text-lg">
            Gerencie as atribuições manuais de jornadas para usuários além do acesso baseado em seus roles.
          </p>
        </div>

        {/* Lista de usuários */}
        {users.length === 0 && !loading ? (
          <div className="bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/5 border border-[#EBA500]/30 rounded-3xl p-8 text-center">
            <h3 className="text-lg font-semibold text-[#373435] mb-3">
              Nenhum usuário encontrado
            </h3>
            <p className="text-gray-600">
              {profile.role === 'super_admin' 
                ? 'Como super admin, você tem acesso global mas não há usuários com empresa definida.'
                : 'Não há usuários registrados na sua empresa.'
              }
            </p>
          </div>
        ) : (
          <div className="bg-white shadow-sm border border-gray-200/50 rounded-3xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-[#373435] flex items-center">
              <Users className="h-6 w-6 mr-3 text-[#EBA500]" />
              Usuários e Acessos às Jornadas
            </h2>
          </div>        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                  Role
                </th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                  Jornadas Atribuídas
                </th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {users.map((user) => {
                const manualJourneys = getManualAssignments(user.id)
                
                return (
                  <tr key={user.id} className="hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-[#EBA500]/5 transition-all duration-200">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-semibold text-[#373435]">
                            {user.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-2xl text-xs font-medium bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/20 text-[#EBA500] border border-[#EBA500]/30">
                        {getRoleDisplayName(user.company_role || user.role)}
                      </span>
                    </td>
                    
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-2">
                        {manualJourneys.map(slug => {
                          const journey = journeys.find(j => j.slug === slug)
                          if (!journey) return null
                          
                          return (
                            <span 
                              key={slug}
                              className="inline-flex items-center px-3 py-1 rounded-2xl text-xs font-medium bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200"
                            >
                              ⭐ {journey.name}
                            </span>
                          )
                        })}
                        {manualJourneys.length === 0 && (
                          <span className="text-sm text-gray-400 italic">Nenhuma jornada atribuída</span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openAssignmentModal(user)}
                        className="text-[#EBA500] hover:text-[#EBA500]/80 bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/5 hover:from-[#EBA500]/20 hover:to-[#EBA500]/10 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 border border-[#EBA500]/30 hover:shadow-md"
                      >
                        Gerenciar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Modal de Atribuição */}
      {showAssignmentModal && selectedUser && (
        <div 
          className={`fixed inset-0 bg-gray-900 transition-all duration-200 overflow-y-auto h-full w-full z-50 flex items-center justify-center ${
            modalAnimating ? 'bg-opacity-60' : 'bg-opacity-0'
          }`}
          onClick={closeAssignmentModal}
        >
          <div 
            className={`relative mx-auto p-8 border border-gray-200/50 w-96 shadow-2xl rounded-3xl bg-white transition-all duration-200 transform ${
              modalAnimating 
                ? 'scale-100 opacity-100 translate-y-0' 
                : 'scale-95 opacity-0 translate-y-4'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[#373435]">
                  Atribuir Jornadas para {selectedUser.full_name}
                </h3>
                <button
                  onClick={closeAssignmentModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-full"
                  aria-label="Fechar modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {journeys.map((journey, index) => {
                  const isManuallyAssignedToUser = isManuallyAssigned(selectedUser.id, journey.slug)
                  const IconComponent = journeyIcons[journey.slug] || Settings
                  
                  // Apenas 2 estados: atribuído ou não atribuído
                  let cardStyle = 'bg-gray-50 border-gray-200 hover:border-gray-300' // Estado padrão
                  if (isManuallyAssignedToUser) {
                    cardStyle = 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-300 shadow-sm' // Atribuído
                  }
                  
                  return (
                    <div 
                      key={journey.id}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${cardStyle} ${
                        modalAnimating 
                          ? 'transform translate-x-0 opacity-100' 
                          : 'transform translate-x-4 opacity-0'
                      }`}
                      style={{
                        transitionDelay: modalAnimating ? `${index * 50}ms` : '0ms'
                      }}
                    >
                      <div className="flex items-center">
                        <IconComponent className={`h-5 w-5 mr-3 ${
                          journey.color ? `text-[${journey.color}]` : 'text-[#EBA500]'
                        }`} />
                        <div>
                          <div className="font-semibold text-[#373435]">
                            {journey.name}
                          </div>
                          {isManuallyAssignedToUser && (
                            <div className="text-xs text-emerald-600 font-medium">
                              ⭐ Atribuído
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Botão para atribuir ou remover */}
                        {!isManuallyAssignedToUser ? (
                          <button
                            onClick={() => assignJourney(selectedUser.id, journey.id)}
                            className="px-3 py-1 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 rounded-2xl hover:from-emerald-100 hover:to-emerald-200 border border-emerald-200 font-medium text-sm transition-all duration-200"
                            title="Atribuir jornada"
                          >
                            Atribuir
                          </button>
                        ) : (
                          <button
                            onClick={() => revokeJourneyAccess(selectedUser.id, journey.id)}
                            className="px-3 py-1 bg-gradient-to-r from-red-50 to-red-100 text-red-700 rounded-2xl hover:from-red-100 hover:to-red-200 border border-red-200 font-medium text-sm transition-all duration-200"
                            title="Remover atribuição"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  onClick={closeAssignmentModal}
                  className="px-6 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-[#373435] rounded-2xl hover:from-gray-200 hover:to-gray-300 focus:outline-none focus:ring-2 focus:ring-[#373435]/20 font-medium transition-all duration-200"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}