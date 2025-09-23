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
          const { data: processes } = await supabase
            .from('processes')
            .select('id, name')
            .eq('journey_id', journey.id)
            .limit(5)
          
          if (processes && processes.length > 0) {
            processesData[mockId] = processes.map((p, index) => ({
              id: p.id,
              nome: p.name,
              prioridade: index + 1,
              priority_score: 100 - (index * 10),
              journey_id: journey.id
            }))
            
            addDebugLog(`✅ Jornada ${mockId} (${slug}): ${processes.length} processos`)
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