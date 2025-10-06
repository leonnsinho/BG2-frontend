import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

/**
 * Hook para buscar métricas do dashboard do Super Admin
 */
export const useSuperAdminMetrics = () => {
  const [metrics, setMetrics] = useState({
    // Logins na última semana vs total de usuários
    loginsWeek: {
      current: 0,
      total: 0,
      loading: true
    },
    // Novas contas na última semana (meta: 50)
    newAccounts: {
      current: 0,
      target: 50,
      loading: true
    },
    // Novas tarefas na última semana (meta: 50)
    newTasks: {
      current: 0,
      target: 50,
      loading: true
    },
    // Novas empresas na última semana (meta: 25)
    newCompanies: {
      current: 0,
      target: 25,
      loading: true
    }
  })

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    try {
      // Calcular data de 7 dias atrás
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoISO = sevenDaysAgo.toISOString()

      // 1. LOGINS DA ÚLTIMA SEMANA vs TOTAL DE USUÁRIOS
      const [loginStatsResult, totalUsersResult] = await Promise.all([
        supabase
          .from('user_login_stats')
          .select('user_id, login_count_7days')
          .gt('login_count_7days', 0),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
      ])

      const usersWithLogins = loginStatsResult.data?.length || 0
      const totalUsers = totalUsersResult.count || 0

      // 2. NOVAS CONTAS NA ÚLTIMA SEMANA (todos os roles)
      const { count: newAccountsCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgoISO)

      // 3. NOVAS TAREFAS NA ÚLTIMA SEMANA
      const { count: newTasksCount } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgoISO)

      // 4. NOVAS EMPRESAS NA ÚLTIMA SEMANA
      const { count: newCompaniesCount } = await supabase
        .from('companies')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgoISO)

      // Atualizar métricas
      setMetrics({
        loginsWeek: {
          current: usersWithLogins,
          total: totalUsers,
          loading: false
        },
        newAccounts: {
          current: newAccountsCount || 0,
          target: 50,
          loading: false
        },
        newTasks: {
          current: newTasksCount || 0,
          target: 50,
          loading: false
        },
        newCompanies: {
          current: newCompaniesCount || 0,
          target: 25,
          loading: false
        }
      })

      console.log('📊 Métricas carregadas:', {
        logins: `${usersWithLogins}/${totalUsers}`,
        newAccounts: newAccountsCount,
        newTasks: newTasksCount,
        newCompanies: newCompaniesCount
      })

    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
      
      // Marcar todas como não loading em caso de erro
      setMetrics(prev => ({
        loginsWeek: { ...prev.loginsWeek, loading: false },
        newAccounts: { ...prev.newAccounts, loading: false },
        newTasks: { ...prev.newTasks, loading: false },
        newCompanies: { ...prev.newCompanies, loading: false }
      }))
    }
  }

  return { metrics, reload: loadMetrics }
}
