import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'

export const usePriorityProcesses = () => {
  const { profile } = useAuth()
  const [priorityProcesses, setPriorityProcesses] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [debugLogs, setDebugLogs] = useState([])

  const addDebugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLogs(prev => [...prev.slice(-15), { timestamp, message }])
    console.log(`[HOOK] ${message}`)
  }

  const getCompanyId = () => {
    if (profile?.company_id) return profile.company_id
    if (profile?.user_companies && profile.user_companies.length > 0) {
      return profile.user_companies[0].company_id
    }
    return null
  }

  const loadProcesses = async () => {
    const companyId = getCompanyId()
    
    if (!companyId) {
      addDebugLog('❌ Company ID não encontrado')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      addDebugLog(`🚀 Carregando para company: ${companyId}`)

      const { data: journeys, error: journeyError } = await supabase
        .from('journeys')
        .select('id, name, slug')
        .order('name')

      if (journeyError) {
        throw journeyError
      }

      addDebugLog(`✅ ${journeys?.length || 0} jornadas encontradas`)
      
      // Debug das jornadas encontradas na base
      if (journeys?.length > 0) {
        const journeySlugs = journeys.map(j => j.slug).join(', ')
        addDebugLog(`📋 Jornadas na base: ${journeySlugs}`)
      }

      const mockJourneyMapping = {
        1: 'estrategica',
        2: 'financeira', 
        3: 'pessoas-cultura',
        4: 'receita-crm',
        5: 'operacional'
      }

      const processesData = {}
      
      for (const [mockId, slug] of Object.entries(mockJourneyMapping)) {
        const journey = journeys?.find(j => j.slug === slug)
        if (journey) {
          addDebugLog(`🔍 Buscando processos para jornada ${slug} (${journey.id})`)
          
          // Primeiro: buscar todos os processos da jornada
          const { data: allProcesses, error: processError } = await supabase
            .from('processes')
            .select('id, name')
            .eq('journey_id', journey.id)
          
          if (processError) {
            addDebugLog(`❌ Erro ao buscar processos: ${processError.message}`)
            continue
          }
          
          addDebugLog(`📊 Encontrados ${allProcesses?.length || 0} processos na jornada ${slug}`)
          
          if (allProcesses && allProcesses.length > 0) {
            // Segundo: buscar avaliações desses processos
            const processIds = allProcesses.map(p => p.id)
            const { data: evaluations } = await supabase
              .from('process_evaluations')
              .select('process_id, priority_score')
              .in('process_id', processIds)
              .eq('company_id', companyId)
              .order('priority_score', { ascending: false })
            
            addDebugLog(`📈 Encontradas ${evaluations?.length || 0} avaliações para jornada ${slug}`)
            
            // Terceiro: combinar processos com avaliações e ordenar
            const processesWithScores = allProcesses.map(process => {
              const evaluation = evaluations?.find(e => e.process_id === process.id)
              return {
                id: process.id,
                name: process.name,
                priority_score: evaluation?.priority_score || 0
              }
            }).sort((a, b) => b.priority_score - a.priority_score)
            .slice(0, 5) // Top 5
            
            if (processesWithScores.length > 0) {
              processesData[mockId] = processesWithScores.map((p, index) => ({
                id: p.id,
                nome: p.name,
                prioridade: index + 1,
                priority_score: p.priority_score,
                journey_id: journey.id
              }))
              
              addDebugLog(`✅ Jornada ${mockId} (${slug}): ${processesWithScores.length} processos prioritários`)
              addDebugLog(`📋 Scores: ${processesWithScores.map(p => `${p.name}(${p.priority_score})`).join(', ')}`)
            }
          }
        }
      }

      setPriorityProcesses(processesData)
      
    } catch (error) {
      addDebugLog(`❌ Erro: ${error.message}`)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    
    const companyId = getCompanyId()
    
    // Debug para entender o estado do profile
    if (profile) {
      addDebugLog(`🔍 Profile: id=${profile.id}, company_id=${profile.company_id}, user_companies=${profile.user_companies?.length || 0}`)
    }
    
    if (profile && companyId) {
      loadProcesses().then(() => {
        if (mounted) {
          addDebugLog('🎯 Carregamento concluído')
        }
      })
    } else if (profile) {
      addDebugLog('⚠️ Aguardando company_id...')
      setLoading(false)
    }

    return () => {
      mounted = false
    }
  }, [profile?.id, profile?.company_id, profile?.user_companies?.length])

  const getProcessesByJourney = (journeyId) => {
    return priorityProcesses[journeyId] || []
  }

  const hasProcesses = (journeyId) => {
    return (priorityProcesses[journeyId] || []).length > 0
  }

  const refetch = () => {
    if (getCompanyId()) {
      loadProcesses()
    }
  }

  return {
    priorityProcesses,
    loading,
    error,
    refetch,
    getProcessesByJourney,
    hasProcesses,
    debugLogs
  }
}