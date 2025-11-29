/**
 * =====================================================
 * SERVIÇO DE SNAPSHOTS DE MATURIDADE POR JORNADA
 * =====================================================
 * Gerencia snapshots periódicos do progresso de
 * amadurecimento para análise temporal
 * =====================================================
 */

import { supabase } from './supabase'

/**
 * Criar snapshot manual de uma jornada
 * @param {string} companyId - ID da empresa
 * @param {string} journeyId - ID da jornada
 * @param {string} snapshotType - Tipo: 'weekly', 'monthly', 'quarterly', 'yearly'
 * @param {Date} snapshotDate - Data do snapshot (opcional, padrão: hoje)
 * @returns {Object} Snapshot criado
 */
export const createJourneySnapshot = async (
  companyId,
  journeyId,
  snapshotType = 'weekly',
  snapshotDate = null
) => {
  try {
    console.log('📸 Criando snapshot de jornada:', { companyId, journeyId, snapshotType })

    const { data, error } = await supabase.rpc('create_journey_maturity_snapshot', {
      p_company_id: companyId,
      p_journey_id: journeyId,
      p_snapshot_type: snapshotType,
      p_snapshot_date: snapshotDate ? snapshotDate.toISOString().split('T')[0] : null
    })

    if (error) throw error

    console.log('✅ Snapshot criado:', data)
    return data
  } catch (error) {
    console.error('❌ Erro ao criar snapshot:', error)
    throw error
  }
}

/**
 * Criar snapshots de todas as jornadas de uma empresa
 * @param {string} companyId - ID da empresa
 * @param {string} snapshotType - Tipo: 'weekly', 'monthly', 'quarterly', 'yearly'
 * @param {Date} snapshotDate - Data do snapshot (opcional, padrão: hoje)
 * @returns {Array} Lista de snapshots criados
 */
export const createAllJourneySnapshots = async (
  companyId,
  snapshotType = 'weekly',
  snapshotDate = null
) => {
  try {
    console.log('📸 Criando snapshots de todas as jornadas:', { companyId, snapshotType })

    const { data, error } = await supabase.rpc('create_all_journey_snapshots', {
      p_company_id: companyId,
      p_snapshot_type: snapshotType,
      p_snapshot_date: snapshotDate ? snapshotDate.toISOString().split('T')[0] : null
    })

    if (error) throw error

    console.log(`✅ ${data?.length || 0} snapshots criados`)
    return data
  } catch (error) {
    console.error('❌ Erro ao criar snapshots:', error)
    throw error
  }
}

/**
 * Obter timeline de snapshots de uma jornada
 * @param {string} companyId - ID da empresa
 * @param {string} journeyId - ID da jornada
 * @param {Date} startDate - Data inicial
 * @param {Date} endDate - Data final (opcional, padrão: hoje)
 * @param {string} snapshotType - Tipo de snapshot
 * @returns {Array} Timeline com snapshots e taxa de crescimento
 */
export const getJourneyMaturityTimeline = async (
  companyId,
  journeyId,
  startDate,
  endDate = new Date(),
  snapshotType = 'weekly'
) => {
  try {
    const { data, error } = await supabase.rpc('get_journey_maturity_timeline', {
      p_company_id: companyId,
      p_journey_id: journeyId,
      p_start_date: startDate.toISOString().split('T')[0],
      p_end_date: endDate.toISOString().split('T')[0],
      p_snapshot_type: snapshotType
    })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('❌ Erro ao buscar timeline:', error)
    throw error
  }
}

/**
 * Obter todos os snapshots de uma empresa (todas as jornadas)
 * @param {string} companyId - ID da empresa
 * @param {Date} startDate - Data inicial
 * @param {Date} endDate - Data final (opcional, padrão: hoje)
 * @param {string} snapshotType - Tipo de snapshot
 * @returns {Object} Snapshots agrupados por jornada
 */
export const getAllJourneySnapshots = async (
  companyId,
  startDate,
  endDate = new Date(),
  snapshotType = 'weekly'
) => {
  try {
    const { data, error } = await supabase
      .from('journey_maturity_snapshots')
      .select(`
        *,
        journey:journeys (
          id,
          name,
          slug
        )
      `)
      .eq('company_id', companyId)
      .eq('snapshot_type', snapshotType)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .lte('snapshot_date', endDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true })

    if (error) throw error

    // Agrupar por jornada
    const byJourney = {}
    data?.forEach(snapshot => {
      const slug = snapshot.journey?.slug
      if (slug) {
        if (!byJourney[slug]) {
          byJourney[slug] = {
            name: snapshot.journey.name,
            id: snapshot.journey.id,
            snapshots: []
          }
        }
        byJourney[slug].snapshots.push({
          date: snapshot.snapshot_date,
          percentage: parseFloat(snapshot.maturity_percentage),
          total: snapshot.total_processes,
          mature: snapshot.mature_processes,
          inProgress: snapshot.in_progress_processes,
          pending: snapshot.pending_processes
        })
      }
    })

    return byJourney
  } catch (error) {
    console.error('❌ Erro ao buscar snapshots:', error)
    throw error
  }
}

/**
 * Obter último snapshot de cada jornada
 * @param {string} companyId - ID da empresa
 * @returns {Object} Último snapshot de cada jornada
 */
export const getLatestJourneySnapshots = async (companyId) => {
  try {
    const { data, error } = await supabase
      .from('mv_latest_journey_maturity')
      .select('*')
      .eq('company_id', companyId)

    if (error) throw error

    // Transformar em objeto com slug como chave
    const snapshots = {}
    data?.forEach(snapshot => {
      snapshots[snapshot.journey_slug] = {
        percentage: parseFloat(snapshot.maturity_percentage),
        total: snapshot.total_processes,
        mature: snapshot.mature_processes,
        date: snapshot.snapshot_date
      }
    })

    return snapshots
  } catch (error) {
    console.error('❌ Erro ao buscar últimos snapshots:', error)
    throw error
  }
}

/**
 * Comparar progresso entre dois períodos
 * @param {string} companyId - ID da empresa
 * @param {string} journeyId - ID da jornada
 * @param {Date} startDate1 - Início do período 1
 * @param {Date} endDate1 - Fim do período 1
 * @param {Date} startDate2 - Início do período 2
 * @param {Date} endDate2 - Fim do período 2
 * @returns {Object} Comparação entre períodos
 */
export const compareMaturityPeriods = async (
  companyId,
  journeyId,
  startDate1,
  endDate1,
  startDate2,
  endDate2
) => {
  try {
    // Buscar snapshots do período 1
    const { data: period1, error: error1 } = await supabase
      .from('journey_maturity_snapshots')
      .select('maturity_percentage')
      .eq('company_id', companyId)
      .eq('journey_id', journeyId)
      .gte('snapshot_date', startDate1.toISOString().split('T')[0])
      .lte('snapshot_date', endDate1.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: false })
      .limit(1)

    if (error1) throw error1

    // Buscar snapshots do período 2
    const { data: period2, error: error2 } = await supabase
      .from('journey_maturity_snapshots')
      .select('maturity_percentage')
      .eq('company_id', companyId)
      .eq('journey_id', journeyId)
      .gte('snapshot_date', startDate2.toISOString().split('T')[0])
      .lte('snapshot_date', endDate2.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: false })
      .limit(1)

    if (error2) throw error2

    const percentage1 = period1?.[0]?.maturity_percentage || 0
    const percentage2 = period2?.[0]?.maturity_percentage || 0
    const difference = percentage2 - percentage1
    const growthRate = percentage1 > 0 ? (difference / percentage1) * 100 : 0

    return {
      period1: {
        start: startDate1,
        end: endDate1,
        percentage: parseFloat(percentage1)
      },
      period2: {
        start: startDate2,
        end: endDate2,
        percentage: parseFloat(percentage2)
      },
      comparison: {
        difference: parseFloat(difference.toFixed(2)),
        growthRate: parseFloat(growthRate.toFixed(2)),
        trend: difference > 0 ? 'up' : difference < 0 ? 'down' : 'stable'
      }
    }
  } catch (error) {
    console.error('❌ Erro ao comparar períodos:', error)
    throw error
  }
}

/**
 * Obter estatísticas agregadas de uma empresa
 * @param {string} companyId - ID da empresa
 * @param {Date} startDate - Data inicial
 * @param {Date} endDate - Data final
 * @returns {Object} Estatísticas agregadas
 */
export const getCompanyMaturityStats = async (
  companyId,
  startDate,
  endDate = new Date()
) => {
  try {
    const { data, error } = await supabase
      .from('journey_maturity_snapshots')
      .select('*')
      .eq('company_id', companyId)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .lte('snapshot_date', endDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: false })

    if (error) throw error

    if (!data || data.length === 0) {
      return {
        averageMaturity: 0,
        totalProcesses: 0,
        matureProcesses: 0,
        journeyCount: 0,
        trend: 'stable',
        growthRate: 0
      }
    }

    // Calcular médias
    const totalProcesses = data.reduce((sum, s) => sum + s.total_processes, 0)
    const matureProcesses = data.reduce((sum, s) => sum + s.mature_processes, 0)
    const averageMaturity = data.reduce((sum, s) => sum + parseFloat(s.maturity_percentage), 0) / data.length

    // Pegar primeiro e último snapshot para calcular crescimento
    const latest = data[0]
    const oldest = data[data.length - 1]
    const growthRate = oldest.maturity_percentage > 0
      ? ((latest.maturity_percentage - oldest.maturity_percentage) / oldest.maturity_percentage) * 100
      : 0

    return {
      averageMaturity: parseFloat(averageMaturity.toFixed(2)),
      totalProcesses,
      matureProcesses,
      journeyCount: new Set(data.map(s => s.journey_id)).size,
      trend: growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'stable',
      growthRate: parseFloat(growthRate.toFixed(2))
    }
  } catch (error) {
    console.error('❌ Erro ao calcular estatísticas:', error)
    throw error
  }
}

/**
 * Deletar snapshots antigos (cleanup)
 * @param {Date} beforeDate - Deletar snapshots anteriores a esta data
 * @returns {number} Quantidade de snapshots deletados
 */
export const deleteOldSnapshots = async (beforeDate) => {
  try {
    const { data, error } = await supabase
      .from('journey_maturity_snapshots')
      .delete()
      .lt('snapshot_date', beforeDate.toISOString().split('T')[0])
      .select()

    if (error) throw error

    console.log(`🗑️ ${data?.length || 0} snapshots antigos deletados`)
    return data?.length || 0
  } catch (error) {
    console.error('❌ Erro ao deletar snapshots:', error)
    throw error
  }
}
