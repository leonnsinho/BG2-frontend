import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabase'

export function useLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { signIn } = useAuth()

  const login = async (email, password) => {
    setLoading(true)
    setError(null)

    try {
      const result = await signIn(email, password)
      
      if (result.error) {
        setError(result.error)
        return { success: false, error: result.error }
      }

      return { success: true, user: result.user }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    login,
    loading,
    error,
    clearError: () => setError(null)
  }
}

export function useRegister() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { signUp } = useAuth()

  const register = async (email, password, userData = {}) => {
    setLoading(true)
    setError(null)

    try {
      const result = await signUp(email, password, userData)
      
      if (result.error) {
        setError(result.error)
        return { success: false, error: result.error }
      }

      return { success: true, user: result.user }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    register,
    loading,
    error,
    clearError: () => setError(null)
  }
}

export function useLogout() {
  const [loading, setLoading] = useState(false)
  const { signOut } = useAuth()

  const logout = async () => {
    setLoading(true)
    try {
      await signOut()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    logout,
    loading
  }
}

export function useProfile() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { profile, updateProfile, fetchProfile } = useAuth()

  const updateUserProfile = async (updates) => {
    setLoading(true)
    setError(null)

    try {
      const result = await updateProfile(updates)
      
      if (result.error) {
        setError(result.error)
        return { success: false, error: result.error }
      }

      return { success: true, profile: result.data }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (!profile?.id) return { success: false, error: 'No user profile' }

    setLoading(true)
    try {
      const updatedProfile = await fetchProfile(profile.id)
      return { success: true, profile: updatedProfile }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    profile,
    updateUserProfile,
    refreshProfile,
    loading,
    error,
    clearError: () => setError(null)
  }
}

export function usePermissions() {
  const { profile, hasPermission, hasRole, getActiveCompany, loading } = useAuth()

  const checkPermission = (permission) => hasPermission(permission)
  const checkRole = (roles) => hasRole(roles)
  const activeCompany = getActiveCompany()

  const isSuperAdmin = () => hasRole('super_admin')
  
  // Gestor geral (antigo consultant) - tem acesso a tudo
  const isGestor = () => hasRole(['super_admin', 'gestor'])
  
  // Gestores específicos por jornada
  const isGestorFinanceiro = () => hasRole(['super_admin', 'gestor', 'gestor_financeiro'])
  const isGestorEstrategico = () => hasRole(['super_admin', 'gestor', 'gestor_estrategico']) 
  const isGestorPessoasCultura = () => hasRole(['super_admin', 'gestor', 'gestor_pessoas_cultura'])
  const isGestorVendasMarketing = () => hasRole(['super_admin', 'gestor', 'gestor_vendas_marketing'])
  const isGestorOperacional = () => hasRole(['super_admin', 'gestor', 'gestor_operacional'])
  
  // Função para verificar se tem acesso a jornada específica
  const hasJourneyAccess = (journeyType) => {
    // Super admin e gestor geral têm acesso a tudo
    if (isSuperAdmin() || hasRole('gestor')) return true
    
    // Verificar acesso específico por jornada baseado no role
    const journeyRoleMap = {
      'financeira': 'gestor_financeiro',
      'estrategica': 'gestor_estrategico', 
      'pessoas-cultura': 'gestor_pessoas_cultura',
      'receita-crm': 'gestor_vendas_marketing',
      'operacional': 'gestor_operacional'
    }
    
    return hasRole(journeyRoleMap[journeyType])
  }
  
  // FUNÇÃO DESABILITADA - Sistema simplificado usa apenas atribuições manuais
  // Função para obter as jornadas baseadas no role (base) - NÃO USADA NO SISTEMA SIMPLIFICADO
  const getRoleBasedJourneys = () => {
    // No sistema simplificado, retornamos array vazio para forçar uso apenas de atribuições manuais
    return []
    
    /* CÓDIGO ANTIGO COMENTADO:
    // Super admin e gestor geral têm acesso a tudo
    if (isSuperAdmin() || hasRole('gestor')) {
      return ['estrategica', 'financeira', 'pessoas-cultura', 'receita-crm', 'operacional']
    }
    
    const journeys = []
    if (hasRole('gestor_financeiro')) journeys.push('financeira')
    if (hasRole('gestor_estrategico')) journeys.push('estrategica') 
    if (hasRole('gestor_pessoas_cultura')) journeys.push('pessoas-cultura')
    if (hasRole('gestor_vendas_marketing')) journeys.push('receita-crm')
    if (hasRole('gestor_operacional')) journeys.push('operacional')
    
    return journeys
    */
  }
  
  // Função para obter jornadas efetivas (apenas atribuições manuais no sistema simplificado)
  const getAccessibleJourneys = async () => {
    try {
      if (!profile?.id) {
        return []
      }

      const { data, error } = await supabase
        .rpc('get_user_effective_journeys', {
          p_user_id: profile.id
        })

      if (error) {
        console.error('❌ Erro ao buscar jornadas efetivas:', error)
        return []
      }
      
      // Retornar apenas jornadas ativas (sistema simplificado)
      const journeySlugs = data?.map(journey => journey.journey_slug) || []
      return journeySlugs
    } catch (error) {
      console.error('❌ Erro ao buscar jornadas:', error)
      return []
    }
  }
  
  // Função para obter jornadas atribuídas manualmente (igual à função principal no sistema simplificado)
  const getManuallyAssignedJourneys = async () => {
    return await getAccessibleJourneys() // No sistema simplificado, são as mesmas
  }

  // Manter compatibilidade com roles antigos
  const isConsultant = () => hasRole(['super_admin', 'gestor']) // gestor é o novo consultant
  // Verificações de status do usuário
  const isUnlinkedUser = () => {
    if (!profile) return false
    
    // Super admins nunca são considerados não vinculados
    if (profile.role === 'super_admin') {
      return false
    }
    
    // Consultores também não são considerados não vinculados (acesso global)
    if (profile.role === 'consultant') {
      return false
    }
    
    // Se não tem user_companies ou está vazio, é não vinculado
    if (!profile.user_companies || profile.user_companies.length === 0) {
      return true
    }
    
    // Se não tem nenhuma empresa ativa, é não vinculado
    const hasActiveCompany = profile.user_companies.some(uc => uc.is_active)
    return !hasActiveCompany
  }
  
  const isCompanyAdmin = () => hasRole(['super_admin', 'gestor', 'company_admin'])
  const isUser = () => hasRole(['super_admin', 'gestor', 'company_admin', 'user'])
  
  // Função para verificar se é qualquer tipo de gestor
  const isAnyManager = () => hasRole([
    'gestor', 'gestor_financeiro', 'gestor_estrategico', 
    'gestor_pessoas_cultura', 'gestor_vendas_marketing', 'gestor_operacional'
  ])

  return {
    profile,
    activeCompany,
    checkPermission,
    checkRole,
    isSuperAdmin,
    isGestor,
    isGestorFinanceiro,
    isGestorEstrategico,
    isGestorPessoasCultura,
    isGestorVendasMarketing,
    isGestorOperacional,
    hasJourneyAccess,
    getAccessibleJourneys,
    getRoleBasedJourneys,
    getManuallyAssignedJourneys,
    isAnyManager,
    // Manter compatibilidade
    isConsultant,
    isCompanyAdmin,
    isUser,
    isUnlinkedUser, // Nova função para usuários não vinculados
    isLoading: loading
  }
}
