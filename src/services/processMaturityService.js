/**
 * =====================================================
 * SERVIÇO DE AMADURECIMENTO DE PROCESSOS
 * =====================================================
 * Gerencia o fluxo de validação e aprovação do
 * amadurecimento de processos através da conclusão
 * de tarefas
 * =====================================================
 */

import { supabase } from './supabase'

/**
 * Calcular progresso de amadurecimento de um processo
 * @param {string} processId - ID do processo
 * @param {string} companyId - ID da empresa
 * @returns {Object} { total, completed, percentage }
 */
export const calculateProcessProgress = async (processId, companyId) => {
  try {
    console.log('📊 Calculando progresso do processo:', { processId, companyId })

    if (!processId || !companyId) {
      console.warn('⚠️ ProcessId ou CompanyId não fornecido')
      return { total: 0, completed: 0, percentage: 0 }
    }

    // Query direta para contar tarefas (mais confiável que RPC)
    // Adicionar timeout de 10 segundos
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout ao buscar tarefas')), 10000)
    )

    const queryPromise = supabase
      .from('tasks')
      .select('id, status, contributes_to_maturity', { count: 'exact' })
      .eq('process_id', processId)
      .eq('company_id', companyId)

    const { data: tasks, error } = await Promise.race([queryPromise, timeoutPromise])

    if (error) {
      console.error('❌ Erro ao buscar tarefas:', error)
      throw error
    }

    // Filtrar tarefas que contribuem para amadurecimento
    const relevantTasks = tasks?.filter(t => t.contributes_to_maturity !== false) || []
    const total = relevantTasks.length
    const completed = relevantTasks.filter(t => t.status === 'completed').length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    console.log('✅ Progresso calculado:', { total, completed, percentage })
    
    return {
      total,
      completed,
      percentage
    }
  } catch (error) {
    console.error('❌ Erro ao calcular progresso:', error)
    // Retornar valores padrão em caso de erro
    return { total: 0, completed: 0, percentage: 0 }
  }
}

/**
 * Criar solicitação de amadurecimento (Gestor)
 * @param {string} processId - ID do processo
 * @param {string} companyId - ID da empresa
 * @param {string} journeyId - ID da jornada
 * @param {string} gestorId - ID do gestor solicitante
 * @param {string} notes - Observações (opcional)
 * @returns {Object} Solicitação criada
 */
export const requestMaturityApproval = async (processId, companyId, journeyId, gestorId, notes = '') => {
  try {
    console.log('🚀 Criando solicitação de amadurecimento:', { processId, companyId, journeyId, gestorId })

    // Validar parâmetros
    if (!processId || !companyId || !journeyId || !gestorId) {
      throw new Error('Parâmetros obrigatórios não fornecidos')
    }

    // 1. Verificar se já existe uma solicitação pendente ou aprovada
    const { data: existing, error: checkError } = await supabase
      .from('process_maturity_requests')
      .select('id, status')
      .eq('process_id', processId)
      .eq('company_id', companyId)
      .in('status', ['pending', 'gestor_approved'])
      .maybeSingle()

    if (checkError) {
      console.error('Erro ao verificar solicitações existentes:', checkError)
      throw checkError
    }

    if (existing) {
      throw new Error('Já existe uma solicitação pendente para este processo')
    }

    // 2. Calcular progresso
    const progress = await calculateProcessProgress(processId, companyId)

    console.log('📊 Progresso calculado:', progress)

    if (progress.percentage < 100) {
      throw new Error(`Processo ainda não atingiu 100% de conclusão (atual: ${progress.percentage.toFixed(1)}%)`)
    }

    if (progress.total === 0) {
      throw new Error('Não há tarefas associadas a este processo')
    }

    // 3. Criar solicitação diretamente com status gestor_approved
    const requestData = {
      process_id: processId,
      company_id: companyId,
      journey_id: journeyId,
      total_tasks: progress.total,
      completed_tasks: progress.completed,
      completion_percentage: progress.percentage,
      status: 'gestor_approved', // Já cria como aprovado pelo gestor
      requested_by: gestorId,
      gestor_approved_by: gestorId,
      gestor_approved_at: new Date().toISOString(),
      gestor_notes: notes || null
    }

    console.log('📝 Dados da solicitação:', requestData)

    const { data, error } = await supabase
      .from('process_maturity_requests')
      .insert(requestData)
      .select()
      .single()

    if (error) {
      console.error('Erro ao inserir solicitação:', error)
      throw error
    }

    console.log('✅ Solicitação criada com sucesso:', data)
    return data
  } catch (error) {
    console.error('❌ Erro ao criar solicitação:', error)
    
    // Formatar mensagem de erro de forma mais amigável
    let errorMessage = 'Erro ao criar solicitação de amadurecimento'
    
    if (error.message) {
      errorMessage = error.message
    } else if (error.code) {
      switch (error.code) {
        case '23505': // Unique constraint violation
          errorMessage = 'Já existe uma solicitação para este processo'
          break
        case '23503': // Foreign key violation
          errorMessage = 'Dados inválidos. Verifique o processo, empresa ou jornada.'
          break
        case 'PGRST116': // No rows found
          errorMessage = 'Processo não encontrado'
          break
        default:
          errorMessage = `Erro no banco de dados (${error.code})`
      }
    }
    
    throw new Error(errorMessage)
  }
}

/**
 * Aprovação do Gestor
 * @param {string} requestId - ID da solicitação
 * @param {string} gestorId - ID do gestor
 * @param {string} notes - Observações (opcional)
 * @returns {Object} Solicitação atualizada
 */
export const gestorApproveMaturity = async (requestId, gestorId, notes = '') => {
  try {
    console.log('✅ Gestor aprovando amadurecimento:', { requestId, gestorId })

    const { data, error } = await supabase
      .from('process_maturity_requests')
      .update({
        status: 'gestor_approved',
        gestor_approved_by: gestorId,
        gestor_approved_at: new Date().toISOString(),
        gestor_notes: notes
      })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error

    console.log('✅ Aprovação do gestor registrada:', data)

    // TODO: Criar notificação para Company Admin
    // Será implementado quando integrarmos com sistema de notificações

    return data
  } catch (error) {
    console.error('❌ Erro ao aprovar como gestor:', error)
    throw error
  }
}

/**
 * Aprovação Final do Company Admin
 * @param {string} requestId - ID da solicitação
 * @param {string} adminId - ID do admin
 * @param {string} notes - Observações (opcional)
 * @returns {Object} Solicitação atualizada
 */
export const adminApproveMaturity = async (requestId, adminId, notes = '') => {
  try {
    console.log('🎉 Admin aprovando amadurecimento:', { requestId, adminId })

    // 1. Buscar dados da solicitação
    const { data: request, error: fetchError } = await supabase
      .from('process_maturity_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError) throw fetchError

    // 2. Atualizar solicitação para aprovada
    const { data, error } = await supabase
      .from('process_maturity_requests')
      .update({
        status: 'admin_approved',
        admin_approved_by: adminId,
        admin_approved_at: new Date().toISOString(),
        admin_notes: notes
      })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error

    console.log('✅ Aprovação do admin registrada:', data)

    // 3. ATUALIZAR AVALIAÇÃO DO PROCESSO - MARCAR COMO AMADURECIDO
    const { error: evalError } = await supabase
      .from('process_evaluations')
      .update({ 
        has_process: true,
        updated_at: new Date().toISOString()
      })
      .eq('process_id', request.process_id)
      .eq('company_id', request.company_id)

    if (evalError) {
      console.error('❌ Erro ao atualizar avaliação:', evalError)
      throw evalError
    }

    console.log('🎉 Processo marcado como AMADURECIDO no banco de dados!')

    // 4. REGISTRAR NO HISTÓRICO DE MATURIDADE (para análise temporal)
    const { error: historyError } = await supabase
      .from('process_maturity_evaluations')
      .insert({
        process_id: request.process_id,
        company_id: request.company_id,
        evaluated_by: adminId,
        is_mature: true,
        maturity_score: 100, // Processo aprovado = 100%
        notes: notes || 'Processo aprovado após conclusão de todas as tarefas',
        evaluated_at: new Date().toISOString()
      })

    if (historyError) {
      console.error('⚠️ Erro ao registrar histórico (não crítico):', historyError)
      // Não lançar erro - o histórico é secundário
    } else {
      console.log('📊 Histórico de maturidade registrado com sucesso')
    }

    // 5. SNAPSHOT AUTOMÁTICO será criado pelo trigger do banco
    // O trigger auto_snapshot_on_process_approval detecta a aprovação
    // e cria snapshot automaticamente da jornada
    console.log('📸 Snapshot automático será criado pelo trigger do banco de dados')

    // TODO: Criar notificação para o gestor
    // Será implementado quando integrarmos com sistema de notificações

    return data
  } catch (error) {
    console.error('❌ Erro ao aprovar como admin:', error)
    throw error
  }
}

/**
 * Rejeitar solicitação
 * @param {string} requestId - ID da solicitação
 * @param {string} userId - ID de quem está rejeitando
 * @param {string} reason - Motivo da rejeição
 * @returns {Object} Solicitação atualizada
 */
export const rejectMaturityRequest = async (requestId, userId, reason) => {
  try {
    console.log('❌ Rejeitando solicitação:', { requestId, userId, reason })

    const { data, error } = await supabase
      .from('process_maturity_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        rejected_by: userId,
        rejected_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error

    console.log('✅ Solicitação rejeitada:', data)

    // TODO: Criar notificação para o solicitante
    // Será implementado quando integrarmos com sistema de notificações

    return data
  } catch (error) {
    console.error('❌ Erro ao rejeitar solicitação:', error)
    throw error
  }
}

/**
 * Listar solicitações pendentes para aprovação do admin
 * @param {string} companyId - ID da empresa (opcional para super_admin)
 * @returns {Array} Lista de solicitações
 */
export const getPendingMaturityRequests = async (companyId = null) => {
  try {
    console.log('📋 Buscando solicitações pendentes...')

    let query = supabase
      .from('maturity_requests_full')
      .select('*')
      .eq('status', 'gestor_approved')
      .order('requested_at', { ascending: false })

    // Filtrar por empresa se não for super_admin
    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query

    if (error) throw error

    console.log(`✅ ${data?.length || 0} solicitações pendentes encontradas`)
    return data || []
  } catch (error) {
    console.error('❌ Erro ao buscar solicitações:', error)
    throw error
  }
}

/**
 * Listar solicitações do gestor
 * @param {string} gestorId - ID do gestor
 * @param {string} companyId - ID da empresa
 * @returns {Array} Lista de solicitações
 */
export const getGestorMaturityRequests = async (gestorId, companyId) => {
  try {
    console.log('📋 Buscando solicitações do gestor...')

    const { data, error } = await supabase
      .from('maturity_requests_full')
      .select('*')
      .eq('requested_by', gestorId)
      .eq('company_id', companyId)
      .order('requested_at', { ascending: false })

    if (error) throw error

    console.log(`✅ ${data?.length || 0} solicitações encontradas`)
    return data || []
  } catch (error) {
    console.error('❌ Erro ao buscar solicitações:', error)
    throw error
  }
}

/**
 * Verificar se processo pode ser amadurecido
 * @param {string} processId - ID do processo
 * @param {string} companyId - ID da empresa
 * @returns {Object} { canMature, reason, progress }
 */
export const canProcessBeMature = async (processId, companyId) => {
  try {
    // 1. Calcular progresso
    const progress = await calculateProcessProgress(processId, companyId)

    // 2. Verificar se já existe solicitação pendente
    const { data: existing } = await supabase
      .from('process_maturity_requests')
      .select('status')
      .eq('process_id', processId)
      .eq('company_id', companyId)
      .in('status', ['pending', 'gestor_approved'])
      .maybeSingle()

    if (existing) {
      return {
        canMature: false,
        reason: 'Já existe uma solicitação pendente',
        progress
      }
    }

    if (progress.total === 0) {
      return {
        canMature: false,
        reason: 'Nenhuma tarefa associada ao processo',
        progress
      }
    }

    if (progress.percentage < 100) {
      return {
        canMature: false,
        reason: `Apenas ${progress.percentage.toFixed(1)}% das tarefas concluídas`,
        progress
      }
    }

    return {
      canMature: true,
      reason: 'Processo pronto para validação',
      progress
    }
  } catch (error) {
    console.error('❌ Erro ao verificar amadurecimento:', error)
    return {
      canMature: false,
      reason: 'Erro ao verificar status',
      progress: { total: 0, completed: 0, percentage: 0 }
    }
  }
}

/**
 * Registrar avaliação manual de maturidade
 * Usado quando gestor/admin avalia processo diretamente (fora do fluxo de tarefas)
 * @param {string} processId - ID do processo
 * @param {string} companyId - ID da empresa
 * @param {string} evaluatedBy - ID do avaliador
 * @param {boolean} isMature - Se o processo está maduro
 * @param {number} maturityScore - Score de 0-100 (opcional)
 * @param {string} notes - Observações (opcional)
 * @returns {Object} Avaliação criada
 */
export const recordMaturityEvaluation = async (
  processId, 
  companyId, 
  evaluatedBy, 
  isMature, 
  maturityScore = null,
  notes = ''
) => {
  try {
    console.log('📝 Registrando avaliação manual de maturidade:', {
      processId,
      companyId,
      evaluatedBy,
      isMature,
      maturityScore
    })

    const evaluationData = {
      process_id: processId,
      company_id: companyId,
      evaluated_by: evaluatedBy,
      is_mature: isMature,
      maturity_score: maturityScore,
      notes: notes || null,
      evaluated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('process_maturity_evaluations')
      .insert(evaluationData)
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao registrar avaliação:', error)
      throw error
    }

    console.log('✅ Avaliação registrada com sucesso:', data)
    return data
  } catch (error) {
    console.error('❌ Erro ao registrar avaliação manual:', error)
    throw error
  }
}

/**
 * Obter histórico de avaliações de um processo
 * @param {string} processId - ID do processo
 * @param {string} companyId - ID da empresa
 * @returns {Array} Histórico de avaliações
 */
export const getProcessEvaluationHistory = async (processId, companyId) => {
  try {
    const { data, error } = await supabase
      .from('process_maturity_evaluations')
      .select(`
        *,
        evaluator:profiles!evaluated_by (
          id,
          full_name,
          role
        )
      `)
      .eq('process_id', processId)
      .eq('company_id', companyId)
      .order('evaluated_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('❌ Erro ao buscar histórico de avaliações:', error)
    throw error
  }
}

/**
 * Obter estatísticas de maturidade por empresa e período
 * @param {string} companyId - ID da empresa
 * @param {Date} startDate - Data inicial
 * @param {Date} endDate - Data final (opcional, padrão: agora)
 * @returns {Object} Estatísticas agregadas
 */
export const getMaturityStats = async (companyId, startDate, endDate = new Date()) => {
  try {
    const { data, error } = await supabase
      .from('process_maturity_evaluations')
      .select(`
        *,
        process:processes (
          id,
          nome,
          journey_id,
          journey:journeys (id, name, slug)
        )
      `)
      .eq('company_id', companyId)
      .gte('evaluated_at', startDate.toISOString())
      .lte('evaluated_at', endDate.toISOString())

    if (error) throw error

    // Agregar por jornada
    const byJourney = {}
    data?.forEach(evaluation => {
      const journeySlug = evaluation.process?.journey?.slug
      if (journeySlug) {
        if (!byJourney[journeySlug]) {
          byJourney[journeySlug] = {
            name: evaluation.process.journey.name,
            total: 0,
            mature: 0,
            averageScore: 0
          }
        }
        byJourney[journeySlug].total++
        if (evaluation.is_mature) {
          byJourney[journeySlug].mature++
        }
      }
    })

    // Calcular percentuais
    Object.keys(byJourney).forEach(slug => {
      const journey = byJourney[slug]
      journey.maturityPercentage = journey.total > 0 
        ? Math.round((journey.mature / journey.total) * 100)
        : 0
    })

    return {
      totalEvaluations: data?.length || 0,
      byJourney,
      period: {
        start: startDate,
        end: endDate
      }
    }
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error)
    throw error
  }
}

/**
 * Obter histórico de solicitações de um processo
 * @param {string} processId - ID do processo
 * @param {string} companyId - ID da empresa
 * @returns {Array} Histórico de solicitações
 */
export const getProcessMaturityHistory = async (processId, companyId) => {
  try {
    const { data, error } = await supabase
      .from('maturity_requests_full')
      .select('*')
      .eq('process_id', processId)
      .eq('company_id', companyId)
      .order('requested_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error)
    throw error
  }
}
