import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

/**
 * Hook avançado para gerenciamento de permissões - OTIMIZADO
 * Usa memoização e cache para melhor performance
 */
export function usePermissionsOptimized() {
  const { profile, hasPermission, hasRole, getActiveCompany, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [userRoles, setUserRoles] = useState([])

  // Memoizar empresa ativa
  const activeCompany = useMemo(() => getActiveCompany(), [getActiveCompany])

  // Memoizar verificações de roles básicos
  const roleChecks = useMemo(() => {
    if (!profile) return {}
    
    return {
      isSuperAdmin: profile.role === 'super_admin',
      isConsultant: ['super_admin', 'consultant'].includes(profile.role),
      isCompanyAdmin: ['super_admin', 'consultant', 'company_admin'].includes(profile.role),
      isUser: ['super_admin', 'consultant', 'company_admin', 'user'].includes(profile.role)
    }
  }, [profile])

  // Memoizar permissões básicas (mais usadas no dashboard)
  const basicPermissions = useMemo(() => {
    if (!profile) return {}

    const { isSuperAdmin, isConsultant, isCompanyAdmin } = roleChecks
    
    return {
      canInviteUsers: isSuperAdmin || isConsultant || isCompanyAdmin,
      canManageUsers: isSuperAdmin || isConsultant || isCompanyAdmin,
      canViewUsers: true, // Todos podem ver usuários
      canDeleteUsers: isSuperAdmin || isConsultant,
      canManageCompanies: isSuperAdmin || isConsultant,
      canViewCompanies: isSuperAdmin || isConsultant || isCompanyAdmin,
      canCreateCompanies: isSuperAdmin,
      canAccessAdminPanel: isSuperAdmin || isConsultant || isCompanyAdmin,
      canManageSystem: isSuperAdmin,
      canViewReports: isSuperAdmin || isConsultant || isCompanyAdmin
    }
  }, [profile, roleChecks])

  // Memoizar permissões avançadas (menos usadas)
  const advancedPermissions = useMemo(() => {
    if (!profile) return {}

    const { isSuperAdmin, isConsultant, isCompanyAdmin } = roleChecks
    
    return {
      canCreateProjects: true, // Todos podem criar projetos
      canManageProjects: isSuperAdmin || isConsultant || isCompanyAdmin,
      canViewProjects: true, // Todos podem ver projetos
      canDeleteProjects: isSuperAdmin || isConsultant || isCompanyAdmin
    }
  }, [profile, roleChecks])

  // Combinar todas as permissões
  const permissions = useMemo(() => ({
    ...basicPermissions,
    ...advancedPermissions,
    ...roleChecks
  }), [basicPermissions, advancedPermissions, roleChecks])

  // Calcular roles do usuário (otimizado)
  const calculateUserRoles = useCallback(() => {
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
    
    // Roles por empresa (se existir)
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
  }, [profile])

  // Atualizar estado quando necessário
  useEffect(() => {
    if (profile && !loading) {
      setUserRoles(calculateUserRoles())
      setIsLoading(false)
    } else if (!profile && !loading) {
      setUserRoles([])
      setIsLoading(false)
    }
  }, [profile, loading, calculateUserRoles])

  // Verificação contextual otimizada
  const hasCompanyPermission = useCallback((companyId, permission) => {
    if (!profile) return false
    
    // Super admin sempre tem acesso
    if (profile.role === 'super_admin') return true
    
    // Verificar na empresa específica
    return profile.user_companies?.some(uc => 
      uc.company_id === companyId && 
      uc.is_active && 
      (uc.permissions?.includes(permission) || 
       ['consultant', 'company_admin'].includes(uc.role))
    )
  }, [profile])

  // Verificar acesso à empresa
  const canAccessCompany = useCallback((companyId) => {
    if (!profile) return false
    if (profile.role === 'super_admin') return true
    
    return profile.user_companies?.some(uc => 
      uc.company_id === companyId && uc.is_active
    )
  }, [profile])

  // Obter empresas do usuário (otimizado)
  const getUserCompanies = useMemo(() => {
    if (!profile?.user_companies) return []
    
    return profile.user_companies
      .filter(uc => uc.is_active)
      .map(uc => ({
        ...uc,
        company: uc.companies || { id: uc.company_id }
      }))
  }, [profile])

  // Debug: obter resumo das permissões (otimizado)
  const getPermissionsSummary = useCallback(() => {
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
      companiesCount: getUserCompanies.length
    }
  }, [profile, permissions, userRoles, activeCompany, isLoading, getUserCompanies])

  return {
    // Estados
    profile,
    activeCompany,
    isLoading,
    permissions,
    userRoles,

    // Verificações básicas (memoizadas)
    hasPermission,
    hasRole,
    
    // Verificações específicas (extraídas das permissões memoizadas)
    canInviteUsers: permissions.canInviteUsers || false,
    canManageUsers: permissions.canManageUsers || false,
    canViewUsers: permissions.canViewUsers || false,
    canDeleteUsers: permissions.canDeleteUsers || false,
    canManageCompanies: permissions.canManageCompanies || false,
    canViewCompanies: permissions.canViewCompanies || false,
    canCreateCompanies: permissions.canCreateCompanies || false,
    canAccessAdminPanel: permissions.canAccessAdminPanel || false,
    canManageSystem: permissions.canManageSystem || false,
    canViewReports: permissions.canViewReports || false,
    canCreateProjects: permissions.canCreateProjects || false,
    canManageProjects: permissions.canManageProjects || false,
    canViewProjects: permissions.canViewProjects || false,
    canDeleteProjects: permissions.canDeleteProjects || false,

    // Verificações de role (memoizadas)
    isSuperAdmin: permissions.isSuperAdmin || false,
    isConsultant: permissions.isConsultant || false,
    isCompanyAdmin: permissions.isCompanyAdmin || false,
    isUser: permissions.isUser || false,

    // Verificações contextuais (callback memoized)
    hasCompanyPermission,
    canAccessCompany,
    
    // Utilitários (memoizados)
    getUserCompanies,
    getPermissionsSummary,
    
    // Re-exportar função de verificação
    checkPermission: hasPermission,
    checkRole: hasRole
  }
}
