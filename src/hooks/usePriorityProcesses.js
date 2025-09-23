import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

/**
 * Hook para buscar os 5 processos mais prioritários de cada jornada
 * 
 * Fluxo da Query:
 * 1. process_evaluations (priority_score) 
 * 2. JOIN processes (process_id -> id, journey_id)
 * 3. JOIN journeys (journey_id -> id)
 * 4. Filtrar por company_id do usuário
 * 5. Ordenar por priority_score DESC
 * 6. LIMIT 5 por jornada
 */
export const usePriorityProcesses = () => {
  const { profile } = useAuth()
  const [priorityProcesses, setPriorityProcesses] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Função para buscar os top 5 processos de uma jornada específica
  const fetchTopProcessesByJourney = async (journeyId, companyId) => {
    try {
      console.log(`🔍 Buscando top 5 processos da jornada ${journeyId} para company ${companyId}`)
      
      const { data, error } = await supabase
        .from('process_evaluations')
        .select(`
          priority_score,
          processes (
            id,
            name,
            journey_id,
            journeys (
              id,
              name,
              slug
            )
          )
        `)
        .eq('processes.journey_id', journeyId)
        .eq('processes.company_id', companyId)
        .not('priority_score', 'is', null) // Só processos que têm priority_score
        .order('priority_score', { ascending: false })
        .limit(5)

      if (error) {
        console.error(`❌ Erro ao buscar processos da jornada ${journeyId}:`, error)
        throw error
      }

      // Transformar dados para o formato esperado
      const formattedProcesses = data.map((item, index) => ({
        id: item.processes.id,
        nome: item.processes.name,
        prioridade: index + 1, // Posição no ranking (1-5)
        priority_score: item.priority_score,
        journey_id: item.processes.journey_id,
        journey_name: item.processes.journeys?.name,
        journey_slug: item.processes.journeys?.slug
      }))

      console.log(`✅ Encontrados ${formattedProcesses.length} processos para jornada ${journeyId}:`, formattedProcesses)
      return formattedProcesses
      
    } catch (error) {
      console.error(`❌ Erro ao buscar processos da jornada ${journeyId}:`, error)
      return []
    }
  }

  // Função para carregar processos de todas as jornadas
  const loadAllJourneysProcesses = async () => {
    if (!profile?.company_id) {
      console.warn('⚠️ Company ID não disponível para buscar processos')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log('🚀 Iniciando carregamento de processos prioritários para company:', profile.company_id)

      // IDs das 5 jornadas padrão (assumindo que são fixas no sistema)
      const journeyIds = [1, 2, 3, 4, 5] // Estratégica, Financeira, Pessoas, Vendas, Operacional
      
      // Buscar processos para cada jornada em paralelo
      const journeyProcessPromises = journeyIds.map(journeyId => 
        fetchTopProcessesByJourney(journeyId, profile.company_id)
      )

      const results = await Promise.all(journeyProcessPromises)
      
      // Organizar resultados por ID de jornada
      const processesData = {}
      journeyIds.forEach((journeyId, index) => {
        processesData[journeyId] = results[index]
      })

      console.log('✅ Todos os processos carregados:', processesData)
      setPriorityProcesses(processesData)
      
    } catch (error) {
      console.error('❌ Erro ao carregar processos prioritários:', error)
      setError(error.message)
      setPriorityProcesses({})
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados quando o perfil estiver disponível
  useEffect(() => {
    if (profile?.company_id) {
      loadAllJourneysProcesses()
    }
  }, [profile?.company_id])

  // Função para recarregar dados
  const refetch = () => {
    if (profile?.company_id) {
      loadAllJourneysProcesses()
    }
  }

  // Função para obter processos de uma jornada específica
  const getProcessesByJourney = (journeyId) => {
    return priorityProcesses[journeyId] || []
  }

  // Função para verificar se uma jornada tem processos
  const hasProcesses = (journeyId) => {
    const processes = priorityProcesses[journeyId] || []
    return processes.length > 0
  }

  return {
    priorityProcesses,
    loading,
    error,
    refetch,
    getProcessesByJourney,
    hasProcesses
  }
}
