import { useState, useEffect } from 'react'
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

  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      // Para super_admin, carregar usuários de todas as empresas
      // Para company_admin, carregar apenas usuários da sua empresa
      let usersQuery, usersData

      if (hasRole('super_admin')) {
        // Super admin vê todos os usuários
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            role
          `)
          .order('full_name')

        if (error) throw error
        usersData = data || []

      } else {
        // Company admin vê apenas usuários da sua empresa
        const activeCompany = profile.user_companies?.find(uc => uc.is_active)
        if (!activeCompany?.company_id) {
          throw new Error('Empresa ativa não encontrada')
        }

        // Primeiro buscar as relações user_companies da empresa
        const { data: userCompaniesData, error: ucError } = await supabase
          .from('user_companies')
          .select('user_id, role')
          .eq('company_id', activeCompany.company_id)
          .eq('is_active', true)

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
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Atribuição de Jornadas
        </h1>
        <p className="text-gray-600">
          Gerencie as atribuições manuais de jornadas para usuários além do acesso baseado em seus roles.
        </p>
      </div>

      {/* Lista de usuários */}
      {users.length === 0 && !loading ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Nenhum usuário encontrado
          </h3>
          <p className="text-yellow-700">
            {profile.role === 'super_admin' 
              ? 'Como super admin, você tem acesso global mas não há usuários com empresa definida.'
              : 'Não há usuários registrados na sua empresa.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Users className="h-6 w-6 mr-2 text-yellow-500" />
            Usuários e Acessos às Jornadas
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jornadas Atribuídas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => {
                const manualJourneys = getManualAssignments(user.id)
                
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {manualJourneys.map(slug => {
                          const journey = journeys.find(j => j.slug === slug)
                          if (!journey) return null
                          
                          return (
                            <span 
                              key={slug}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                            >
                              ⭐ {journey.name}
                            </span>
                          )
                        })}
                        {manualJourneys.length === 0 && (
                          <span className="text-sm text-gray-400">Nenhuma jornada atribuída</span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openAssignmentModal(user)}
                        className="text-yellow-600 hover:text-yellow-900 bg-yellow-50 hover:bg-yellow-100 px-3 py-1 rounded-md text-sm font-medium transition-colors"
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Atribuir Jornadas para {selectedUser.full_name}
              </h3>
              
              <div className="space-y-3">
                {journeys.map(journey => {
                  const isManuallyAssignedToUser = isManuallyAssigned(selectedUser.id, journey.slug)
                  const IconComponent = journeyIcons[journey.slug] || Settings
                  
                  // Apenas 2 estados: atribuído ou não atribuído
                  let cardStyle = 'bg-gray-50 border-gray-200' // Estado padrão
                  if (isManuallyAssignedToUser) {
                    cardStyle = 'bg-green-50 border-green-200' // Atribuído
                  }
                  
                  return (
                    <div 
                      key={journey.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${cardStyle}`}
                    >
                      <div className="flex items-center">
                        <IconComponent className={`h-5 w-5 mr-3 ${
                          journey.color ? `text-[${journey.color}]` : 'text-gray-500'
                        }`} />
                        <div>
                          <div className="font-medium text-gray-900">
                            {journey.name}
                          </div>
                          {isManuallyAssignedToUser && (
                            <div className="text-xs text-green-600">
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
                            className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                            title="Atribuir jornada"
                          >
                            Atribuir
                          </button>
                        ) : (
                          <button
                            onClick={() => revokeJourneyAccess(selectedUser.id, journey.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
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

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}