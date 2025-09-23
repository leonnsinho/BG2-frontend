import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'

/**
 * Hook simplificado para buscar processos prioritários
 */
export const usePriorityProcesses = () => {
  const { profile } = useAuth()
  const [priorityProcesses, setPriorityProcesses] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [debugLogs, setDebugLogs] = useState([])

  // Função para adicionar logs de debug
  const addDebugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLogs(prev => [...prev.slice(-15), { timestamp, message }])
    console.log(`[HOOK] ${message}`)
  }

  // Função para obter o company_id correto
  const getCompanyId = () => {
    if (profile?.company_id) return profile.company_id
    if (profile?.user_companies && profile.user_companies.length > 0) {
      return profile.user_companies[0].company_id
    }
    return null
  }

  // Função simplificada para carregar dados
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

      // Buscar todas as jornadas primeiro para descobrir UUIDs
      const { data: journeys, error: journeyError } = await supabase
        .from('journeys')
        .select('id, name, slug')
        .order('name')

      if (journeyError) {
        throw journeyError
      }

      addDebugLog(`✅ ${journeys?.length || 0} jornadas encontradas`)

      // Para cada jornada mock, tentar encontrar processos
      const mockJourneyMapping = {
        1: 'estrategica',
        2: 'financeira', 
        3: 'pessoas-cultura',
        4: 'vendas-marketing',
        5: 'operacional'
      }

      const processesData = {}
      
      for (const [mockId, slug] of Object.entries(mockJourneyMapping)) {
        const journey = journeys?.find(j => j.slug === slug)
        if (journey) {
          // Buscar alguns processos da jornada
          const { data: processes } = await supabase
            .from('processes')
            .select('id, name')
            .eq('journey_id', journey.id)
            .limit(5)
          
          if (processes && processes.length > 0) {
            // Simular dados com priority_score mock
            processesData[mockId] = processes.map((p, index) => ({
              id: p.id,
              nome: p.name,
              prioridade: index + 1,
              priority_score: 100 - (index * 10), // Mock scores
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

  // Carregar dados quando perfil estiver disponível
  useEffect(() => {
    let mounted = true
    
    if (profile && getCompanyId()) {
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
  }, [profile?.id, profile?.user_companies]) // Dependências mais específicas

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
import { supabase } from '../services/supabase'
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
  const [debugLogs, setDebugLogs] = useState([])

  // Função para adicionar logs de debug
  const addDebugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLogs(prev => [...prev.slice(-20), { timestamp, message }]) // Manter últimos 20
    console.log(message) // Manter também no console para desenvolvimento
  }

  // Função para buscar os top 5 processos de uma jornada específica
  const fetchTopProcessesByJourney = async (journeyId, companyId) => {
    try {
      addDebugLog(`🔍 Buscando processos da jornada ${journeyId} para company ${companyId}`)
      
      // Primeiro, vamos fazer uma query mais simples para debugar
      addDebugLog('🧪 Testando conexão com process_evaluations...')
      
      const { data: testData, error: testError } = await supabase
        .from('process_evaluations')
        .select('*')
        .limit(3)
        
      if (testError) {
        addDebugLog(`❌ Erro no teste de conexão: ${testError.message}`)
        throw testError
      }
      
      addDebugLog(`✅ Teste de conexão OK. Dados encontrados: ${testData?.length || 0}`)
      
      // Agora vamos fazer a query real de forma mais simples - usando duas queries separadas
      // Primeiro: buscar processos da jornada (sem filtrar por company por enquanto)
      const { data: processesData, error: processesError } = await supabase
        .from('processes')
        .select('*') // Pegar todas as colunas para ver a estrutura
        .eq('journey_id', journeyId)
        .limit(10) // Limitar para não sobrecarregar

      if (processesError) {
        addDebugLog(`❌ Erro ao buscar processos: ${processesError.message}`)
        throw processesError
      }

      addDebugLog(`📋 Processos encontrados na jornada ${journeyId}: ${processesData?.length || 0}`)
      
      if (processesData && processesData.length > 0) {
        addDebugLog(`📋 Exemplo de processo da jornada ${journeyId}: ${JSON.stringify(processesData[0])}`)
      }

      if (!processesData || processesData.length === 0) {
        addDebugLog(`⚠️ Nenhum processo encontrado para jornada ${journeyId}`)
        return []
      }

      // Segundo: buscar avaliações desses processos
      const processIds = processesData.map(p => p.id)
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('process_evaluations')
        .select('process_id, priority_score')
        .in('process_id', processIds)
        .not('priority_score', 'is', null)
        .order('priority_score', { ascending: false })
        .limit(5)

      if (evaluationsError) {
        addDebugLog(`❌ Erro ao buscar avaliações: ${evaluationsError.message}`)
        throw evaluationsError
      }

      addDebugLog(`� Avaliações encontradas: ${evaluationsData?.length || 0}`)

      // Terceiro: combinar os dados
      const formattedProcesses = evaluationsData.map((evaluation, index) => {
        const processo = processesData.find(p => p.id === evaluation.process_id)
        return {
          id: processo.id,
          nome: processo.name,
          prioridade: index + 1, // Posição no ranking (1-5)
          priority_score: evaluation.priority_score,
          journey_id: processo.journey_id
        }
      })

      if (formattedProcesses.length > 0) {
        addDebugLog(`✅ Jornada ${journeyId}: ${formattedProcesses.length} processos formatados`)
        formattedProcesses.forEach((p, i) => {
          addDebugLog(`  ${i+1}. ${p.nome} (Score: ${p.priority_score})`)
        })
      } else {
        addDebugLog(`⚠️ Jornada ${journeyId}: processos encontrados mas sem avaliações com priority_score`)
      }
      
      return formattedProcesses
      
    } catch (error) {
      addDebugLog(`❌ Erro geral na jornada ${journeyId}: ${error.message}`)
      return []
    }
  }

  // Função para carregar processos de todas as jornadas
  const loadAllJourneysProcesses = async (companyId) => {
    if (!companyId) {
      addDebugLog('⚠️ Company ID não disponível para buscar processos')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      addDebugLog(`🚀 Iniciando carregamento para company: ${companyId}`)

      // Primeiro, verificar se há dados na tabela process_evaluations
      addDebugLog('🧪 Verificando tabela process_evaluations...')
      const { data: checkData, error: checkError } = await supabase
        .from('process_evaluations')
        .select('id')
        .limit(1)

      if (checkError) {
        addDebugLog(`❌ Erro ao verificar dados: ${checkError.message}`)
        throw checkError
      }

      if (!checkData || checkData.length === 0) {
        addDebugLog('⚠️ Tabela process_evaluations está vazia!')
        setPriorityProcesses({}) // Deixar vazio para usar mock no componente
        setLoading(false)
        return
      }

      addDebugLog(`✅ Dados encontrados na tabela process_evaluations`)

      // Vamos também verificar quantos processos existem para esta company
      addDebugLog('📊 Verificando processos da company...')
      
      // Primeiro vamos descobrir a estrutura da tabela processes
      const { data: sampleProcess, error: sampleError } = await supabase
        .from('processes')
        .select('*')
        .limit(1)

      if (sampleError) {
        addDebugLog(`❌ Erro ao verificar estrutura: ${sampleError.message}`)
      } else {
        if (sampleProcess && sampleProcess.length > 0) {
          const columns = Object.keys(sampleProcess[0])
          addDebugLog(`� Colunas da tabela processes: ${columns.join(', ')}`)
        } else {
          addDebugLog('⚠️ Tabela processes está vazia')
        }
      }
      
      const { data: processCount, error: processError } = await supabase
        .from('processes')
        .select('*')
        .limit(10) // Pegar alguns registros para análise

      if (processError) {
        addDebugLog(`❌ Erro ao contar processos: ${processError.message}`)
      } else {
        addDebugLog(`📊 Total de processos encontrados: ${processCount?.length || 0}`)
        if (processCount && processCount.length > 0) {
          addDebugLog(`📋 Exemplo de processo: ${JSON.stringify(processCount[0])}`)
        }
      }

      // Verificar se há avaliações (process_evaluations) para esses processos
      if (processCount && processCount.length > 0) {
        addDebugLog('📈 Verificando avaliações com priority_score...')
        const processIds = processCount.map(p => p.id)
        const { data: evaluationCount, error: evalError } = await supabase
          .from('process_evaluations')
          .select('process_id, priority_score')
          .in('process_id', processIds)
          .not('priority_score', 'is', null)

        if (evalError) {
          addDebugLog(`❌ Erro ao verificar avaliações: ${evalError.message}`)
        } else {
          addDebugLog(`📈 Avaliações com priority_score: ${evaluationCount?.length || 0}`)
          if (evaluationCount && evaluationCount.length > 0) {
            addDebugLog(`🔢 Scores encontrados: ${evaluationCount.map(e => e.priority_score).join(', ')}`)
          } else {
            addDebugLog(`⚠️ PROBLEMA: Existem ${processCount.length} processos mas 0 avaliações com priority_score`)
          }
        }
      }

      // IDs das 5 jornadas padrão - DESCOBRIR OS UUIDs REAIS
      addDebugLog(`🎯 Primeiro vamos descobrir os UUIDs das jornadas...`)
      
      // Buscar todas as jornadas para descobrir os UUIDs reais
      const { data: journeysData, error: journeysError } = await supabase
        .from('journeys')
        .select('id, name, slug')
        .order('id')

      if (journeysError) {
        addDebugLog(`❌ Erro ao buscar jornadas: ${journeysError.message}`)
        throw journeysError
      }

      if (!journeysData || journeysData.length === 0) {
        addDebugLog('⚠️ Nenhuma jornada encontrada na tabela journeys')
        setPriorityProcesses({})
        setLoading(false)
        return
      }

      addDebugLog(`✅ Jornadas encontradas: ${journeysData.length}`)
      journeysData.forEach(j => {
        addDebugLog(`  📋 ${j.name} (${j.slug}) - ID: ${j.id}`)
      })

      // Mapear jornadas para os IDs corretos do mock
      const journeyMapping = {
        1: journeysData.find(j => j.slug === 'estrategica')?.id,
        2: journeysData.find(j => j.slug === 'financeira')?.id,
        3: journeysData.find(j => j.slug === 'pessoas-cultura')?.id,
        4: journeysData.find(j => j.slug === 'vendas-marketing')?.id,
        5: journeysData.find(j => j.slug === 'operacional')?.id
      }

      addDebugLog(`🗺️ Mapeamento jornadas: ${JSON.stringify(journeyMapping)}`)
      
      // Buscar processos para cada jornada em paralelo
      const journeyProcessPromises = Object.entries(journeyMapping).map(([mockId, realId]) => {
        if (realId) {
          return fetchTopProcessesByJourney(mockId, realId, companyId)
        } else {
          addDebugLog(`⚠️ Jornada ${mockId} não encontrada na base de dados`)
          return Promise.resolve([])
        }
      })

      const results = await Promise.all(journeyProcessPromises)
      
      // Organizar resultados por ID de jornada (usando IDs do mock)
      const processesData = {}
      Object.keys(journeyMapping).forEach((mockId, index) => {
        processesData[mockId] = results[index]
      })

      addDebugLog(`✅ Carregamento concluído. Jornadas com processos: ${Object.keys(processesData).filter(k => processesData[k].length > 0).join(', ')}`)
      setPriorityProcesses(processesData)
      
    } catch (error) {
      addDebugLog(`❌ Erro ao carregar processos: ${error.message}`)
      setError(error.message)
      setPriorityProcesses({})
    } finally {
      setLoading(false)
    }
  }

  // Função para obter o company_id correto do perfil
  const getCompanyId = () => {
    // Primeiro tentar profile.company_id (estrutura direta)
    if (profile?.company_id) {
      return profile.company_id
    }
    
    // Senão, tentar user_companies[0].company_id (estrutura com relacionamento)
    if (profile?.user_companies && profile.user_companies.length > 0) {
      return profile.user_companies[0].company_id
    }
    
    return null
  }

  // Carregar dados quando o perfil estiver disponível
  useEffect(() => {
    const companyId = getCompanyId()
    
    console.log('🔄 useEffect do hook executado. Profile:', {
      company_id_direto: profile?.company_id,
      user_companies_length: profile?.user_companies?.length || 0,
      company_id_extraido: companyId,
      email: profile?.email
    })
    
    if (companyId) {
      addDebugLog(`🎯 Company ID encontrado: ${companyId}`)
      
      // Timeout de segurança para evitar loading infinito
      const timeoutId = setTimeout(() => {
        addDebugLog('⏰ Timeout atingido, forçando finalização do loading')
        setLoading(false)
      }, 10000) // 10 segundos

      loadAllJourneysProcesses(companyId).finally(() => {
        clearTimeout(timeoutId)
      })

      return () => clearTimeout(timeoutId)
    } else {
      addDebugLog(`❌ Nenhum company_id encontrado no profile`)
      // Se não há company_id, parar o loading
      setLoading(false)
    }
  }, [profile?.company_id, profile?.user_companies])

  // Função para recarregar dados
  const refetch = () => {
    const companyId = getCompanyId()
    if (companyId) {
      loadAllJourneysProcesses(companyId)
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
    hasProcesses,
    debugLogs
  }
}
