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

    // Se não tem user ou company, limpa permissões e retorna
    if (!userId || !companyId) {
      setPermissions({})
      setLoading(false)
      return
    }

    // Função assíncrona para carregar permissões
    const loadPermissions = async () => {
      try {
        setLoading(true)

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

        // Criar mapa de permissões
        const permMap = {}
        userPermissions?.forEach(perm => {
          const tool = tools?.find(t => t.id === perm.tool_id)
          if (tool) {
            permMap[tool.slug] = perm.permission_type
          }
        })

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
      return true
    }

    // Se tem permissão explícita, verifica o tipo
    return permissions[toolSlug] === 'allow'
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
