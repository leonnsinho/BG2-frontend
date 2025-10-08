import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

/**
 * Hook avançado para gerenciamento de permissões
 * Fornece funções para verificar permissões específicas, roles e contextos
 */
export function usePermissions() {
  const { profile, hasPermission, hasRole, getActiveCompany, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [permissions, setPermissions] = useState({})
  const [userRoles, setUserRoles] = useState([])

  // Atualizar estado quando profile muda
  useEffect(() => {
    if (profile && !loading) {
      calculatePermissions()
      setIsLoading(false)
    } else if (!profile && !loading) {
      setPermissions({})
      setUserRoles([])
      setIsLoading(false)
    }
  }, [profile, loading])

  // Calcular todas as permissões do usuário
  const calculatePermissions = () => {
    const perms = {
      // Permissões de gestão de usuários
      canInviteUsers: canInviteUsers(),
      canManageUsers: canManageUsers(),
      canViewUsers: canViewUsers(),
      canDeleteUsers: canDeleteUsers(),
      
      // Permissões de empresa
      canManageCompanies: canManageCompanies(),
      canViewCompanies: canViewCompanies(),
      canCreateCompanies: canCreateCompanies(),
      
      // Permissões de sistema
      canAccessAdminPanel: canAccessAdminPanel(),
      canManageSystem: canManageSystem(),
      canViewReports: canViewReports(),
      
      // Permissões de projetos/mapas
      canCreateProjects: canCreateProjects(),
      canManageProjects: canManageProjects(),
      canViewProjects: canViewProjects(),
      canDeleteProjects: canDeleteProjects(),
      
      // Permissões especiais
      isSuperAdmin: isSuperAdmin(),
      isConsultant: isConsultant(),
      isCompanyAdmin: isCompanyAdmin(),
      isUser: isUser()
    }

    const roles = getUserRoles()
    
    setPermissions(perms)
    setUserRoles(roles)
  }

  // Verificações específicas de permissão
  const canInviteUsers = () => {
    return hasRole(['super_admin', 'consultant', 'company_admin'])
  }

  const canManageUsers = () => {
    return hasRole(['super_admin', 'consultant', 'company_admin'])
  }

  const canViewUsers = () => {
    return hasRole(['super_admin', 'consultant', 'company_admin', 'user'])
  }

  const canDeleteUsers = () => {
    return hasRole(['super_admin', 'consultant'])
  }

  const canManageCompanies = () => {
    return hasRole(['super_admin', 'consultant'])
  }

  const canViewCompanies = () => {
    return hasRole(['super_admin', 'consultant', 'company_admin'])
  }

  const canCreateCompanies = () => {
    return hasRole(['super_admin'])
  }

  const canAccessAdminPanel = () => {
    return hasRole(['super_admin', 'consultant', 'company_admin'])
  }

  const canManageSystem = () => {
    return hasRole(['super_admin'])
  }

  const canViewReports = () => {
    return hasRole(['super_admin', 'consultant', 'company_admin'])
  }

  const canCreateProjects = () => {
    return hasRole(['super_admin', 'consultant', 'company_admin', 'user'])
  }

  const canManageProjects = () => {
    return hasRole(['super_admin', 'consultant', 'company_admin'])
  }

  const canViewProjects = () => {
    return hasRole(['super_admin', 'consultant', 'company_admin', 'user'])
  }

  const canDeleteProjects = () => {
    return hasRole(['super_admin', 'consultant', 'company_admin'])
  }

  // Verificações de role
  const isSuperAdmin = () => hasRole('super_admin')
  const isConsultant = () => hasRole(['super_admin', 'consultant'])
  const isCompanyAdmin = () => {
    return hasRole(['super_admin', 'consultant', 'company_admin'])
  }
  const isUser = () => hasRole(['super_admin', 'consultant', 'company_admin', 'user'])

  // Nova função específica para gestor
  const isGestor = () => {
    return hasRole(['gestor', 'gestor_financeiro', 'gestor_operacional', 'gestor_comercial', 'gestor_rh'])
  }

  // Verificar se é usuário não vinculado
  const isUnlinkedUser = () => {
    if (!profile) return false
    
    // Super admins e consultants nunca são considerados "não vinculados"
    if (['super_admin', 'consultant'].includes(profile.role)) {
      console.log('🔒 Usuário é super admin ou consultant - não está desvinculado')
      return false
    }

    // Se tem role global diferente de 'user', não está desvinculado
    if (profile.role && profile.role !== 'user') {
      return false
    }

    // Se não tem user_companies ou está vazio, é desvinculado
    if (!profile.user_companies || profile.user_companies.length === 0) {
      return true
    }

    // Se tem user_companies mas nenhuma está ativa, é desvinculado
    const hasActiveCompany = profile.user_companies.some(uc => uc.is_active)
    return !hasActiveCompany
  }

  // Verificar se é qualquer tipo de gestor
  const isAnyManager = () => {
    return hasRole([
      'gestor', 'gestor_financeiro', 'gestor_estrategico', 
      'gestor_pessoas_cultura', 'gestor_vendas_marketing', 'gestor_operacional'
    ])
  }

  // Obter todos os roles do usuário
  const getUserRoles = () => {
    if (!profile) return []
    
    const roles = []
    
    // Role global
    if (profile.role) {
      roles.push({
        role: profile.role,
        context: 'global',
        company: null
      })
    }
    
    // Roles por empresa
    if (profile.user_companies) {
      profile.user_companies.forEach(uc => {
        if (uc.is_active) {
          roles.push({
            role: uc.role,
            context: 'company',
            company: uc.companies || { id: uc.company_id }
          })
        }
      })
    }
    
    return roles
  }

  // Verificar permissão específica no contexto de uma empresa
  const hasCompanyPermission = (companyId, permission) => {
    if (!profile) return false
    
    // Super admin tem todas as permissões
    if (profile.role === 'super_admin') return true
    
    // Verificar na empresa específica
    return profile.user_companies?.some(uc => 
      uc.company_id === companyId && 
      uc.is_active && 
      (uc.permissions?.includes(permission) || 
       ['consultant', 'company_admin'].includes(uc.role))
    )
  }

  // Obter empresa ativa
  const activeCompany = getActiveCompany()

  // Obter empresas do usuário
  const getUserCompanies = () => {
    if (!profile?.user_companies) return []
    
    return profile.user_companies
      .filter(uc => uc.is_active)
      .map(uc => ({
        ...uc,
        company: uc.companies || { id: uc.company_id }
      }))
  }

  // Verificar se pode acessar uma empresa específica
  const canAccessCompany = (companyId) => {
    if (!profile) return false
    if (profile.role === 'super_admin') return true
    
    return profile.user_companies?.some(uc => 
      uc.company_id === companyId && uc.is_active
    )
  }

  // Debug: obter resumo das permissões
  const getPermissionsSummary = () => {
    return {
      profile: profile ? {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name
      } : null,
      permissions,
      userRoles,
      activeCompany,
      isLoading,
      companiesCount: getUserCompanies().length
    }
  }

  return {
    // Estados
    profile,
    activeCompany,
    isLoading,
    permissions,
    userRoles,

    // Verificações básicas
    hasPermission,
    hasRole,
    
    // Verificações específicas
    canInviteUsers,
    canManageUsers,
    canViewUsers,
    canDeleteUsers,
    canManageCompanies,
    canViewCompanies,
    canCreateCompanies,
    canAccessAdminPanel,
    canManageSystem,
    canViewReports,
    canCreateProjects,
    canManageProjects,
    canViewProjects,
    canDeleteProjects,

    // Verificações de role
    isSuperAdmin,
    isConsultant,
    isCompanyAdmin,
    isUser,
    isGestor,
    isUnlinkedUser,
    isAnyManager,

    // Verificações contextuais
    hasCompanyPermission,
    canAccessCompany,
    
    // Utilitários
    getUserCompanies,
    getPermissionsSummary,
    
    // Re-exportar função de verificação
    checkPermission: hasPermission,
    checkRole: hasRole,

    // Compatibilidade
    loading: isLoading
  }
}
