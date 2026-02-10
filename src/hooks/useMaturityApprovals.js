import { useState, useEffect, useCallback } from 'react'
import { getPendingMaturityRequests } from '../services/processMaturityService'
import { useAuth } from '../contexts/AuthContext'

/**
 * Hook para gerenciar aprovações de amadurecimento
 * Retorna o número de aprovações pendentes e função para recarregar
 */
export const useMaturityApprovals = () => {
  const { profile } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const loadPendingCount = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      // Obter company_id do perfil
      const companyId = profile?.user_companies?.[0]?.company_id

      if (!companyId) {
        setPendingCount(0)
        setLastUpdate(new Date())
        return
      }

      // Buscar solicitações pendentes (status = 'gestor_approved')
      const requests = await getPendingMaturityRequests(companyId)
      const count = requests?.length || 0

      setPendingCount(count)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Erro ao carregar aprovações pendentes:', err)
      setError(err.message)
      // Não zerar o contador em caso de erro, manter o último valor conhecido
    } finally {
      setLoading(false)
    }
  }, [profile?.user_companies])

  useEffect(() => {
    if (profile?.id) {
      loadPendingCount()

      // Recarregar a cada 30 segundos
      const interval = setInterval(() => loadPendingCount(true), 30000)

      // Escutar evento customizado de mudança de aprovação
      const handleApprovalChange = () => {
        loadPendingCount(true)
      }

      window.addEventListener('maturity-approval-changed', handleApprovalChange)

      return () => {
        clearInterval(interval)
        window.removeEventListener('maturity-approval-changed', handleApprovalChange)
      }
    }
  }, [profile?.id, loadPendingCount])

  return {
    pendingCount,
    loading,
    error,
    lastUpdate,
    reload: () => loadPendingCount(true)
  }
}
