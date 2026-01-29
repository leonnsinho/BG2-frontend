import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'

/**
 * Hook para verificar permissões de ferramentas/telas do usuário
 */
export function useToolPermissions() {
  const { user, getActiveCompany, profile } = useAuth()
  const [permissions, setPermissions] = useState({})
  const [loading, setLoading] = useState(true)

  // useEffect que monitora mudanças no userId e companyId
  useEffect(() => {
    const userId = user?.id
    const selectedCompany = getActiveCompany?.()
    const companyId = selectedCompany?.id

    console.log('🔧 [DEBUG] useEffect EXECUTOU!', {
      hasUser: !!user,
      userId,
      hasCompany: !!selectedCompany,
      companyId,
      profileCompanies: profile?.user_companies
    })

    // Se não tem user ou company, limpa permissões e retorna
    if (!userId || !companyId) {
      console.log('🔧 useEffect - user ou company não disponível:', {
        userId,
        companyId
      })
      setPermissions({})
      setLoading(false)
      return
    }

    // Função assíncrona para carregar permissões
    const loadPermissions = async () => {
      try {
        setLoading(true)

        console.log('🔧 Carregando permissões de ferramentas...', {
          userId,
          companyId
        })

        // Buscar todas as ferramentas
        const { data: tools, error: toolsError } = await supabase
          .from('system_tools')
          .select('id, slug')
          .eq('is_active', true)

        if (toolsError) throw toolsError

        // Buscar permissões do usuário
        const { data: userPermissions, error: permError } = await supabase
          .from('user_tool_permissions')
          .select('tool_id, permission_type')
          .eq('user_id', userId)
          .eq('company_id', companyId)

        if (permError) throw permError

        console.log('🔧 Ferramentas encontradas:', tools)
        console.log('🔧 Permissões do usuário:', userPermissions)

        // Criar mapa de permissões
        const permMap = {}
        userPermissions?.forEach(perm => {
          const tool = tools?.find(t => t.id === perm.tool_id)
          if (tool) {
            permMap[tool.slug] = perm.permission_type
          }
        })

        console.log('🔧 Mapa de permissões final:', permMap)
        setPermissions(permMap)
      } catch (error) {
        console.error('Erro ao carregar permissões de ferramentas:', error)
        setPermissions({})
      } finally {
        setLoading(false)
      }
    }

    loadPermissions()
  }, [user?.id, profile?.user_companies, getActiveCompany])

  /**
   * Verifica se o usuário tem acesso a uma ferramenta específica
   * @param {string} toolSlug - Slug da ferramenta (ex: 'performance-evaluation')
   * @returns {boolean} - true se tem acesso, false caso contrário
   */
  const hasToolAccess = (toolSlug) => {
    // Se não tem permissão explícita, permite por padrão
    if (!permissions[toolSlug]) {
      console.log(`🔧 Ferramenta "${toolSlug}": SEM permissão explícita, PERMITINDO por padrão`)
      return true
    }
    
    // Se tem permissão explícita, verifica o tipo
    const hasAccess = permissions[toolSlug] === 'allow'
    console.log(`🔧 Ferramenta "${toolSlug}": permissão = ${permissions[toolSlug]}, acesso = ${hasAccess}`)
    return hasAccess
  }

  /**
   * Verifica se uma ferramenta está explicitamente bloqueada
   * @param {string} toolSlug - Slug da ferramenta
   * @returns {boolean} - true se bloqueada, false caso contrário
   */
  const isToolDenied = (toolSlug) => {
    return permissions[toolSlug] === 'deny'
  }

  return {
    permissions,
    loading,
    hasToolAccess,
    isToolDenied
  }
}
