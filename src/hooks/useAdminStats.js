import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export const useAdminStats = () => {
  const [stats, setStats] = useState({
    activeCompanies: { value: '0', change: '+0 este mês', loading: true },
    totalUsers: { value: '0', change: '+0 esta semana', loading: true },
    activeJourneys: { value: '0', change: '+0 hoje', loading: true },
    systemUptime: { value: '99.9%', change: '30 dias', loading: false } // Estático por enquanto
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)

        // Buscar empresas ativas
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('id, created_at')
          .eq('is_active', true)

        if (companiesError) throw companiesError

        // Buscar total de usuários
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, created_at')

        if (usersError) throw usersError

        // Buscar jornadas ativas
        const { data: journeysData, error: journeysError } = await supabase
          .from('journeys')
          .select('id, created_at')
          .eq('is_active', true)

        if (journeysError) throw journeysError

        // Calcular mudanças (exemplo: últimos 30 dias para empresas, 7 dias para usuários, hoje para jornadas)
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        // Calcular empresas criadas no último mês
        const newCompaniesThisMonth = companiesData?.filter(company => 
          new Date(company.created_at) >= thirtyDaysAgo
        ).length || 0

        // Calcular usuários criados na última semana
        const newUsersThisWeek = usersData?.filter(user => 
          new Date(user.created_at) >= sevenDaysAgo
        ).length || 0

        // Calcular jornadas criadas hoje
        const newJourneysToday = journeysData?.filter(journey => 
          new Date(journey.created_at) >= today
        ).length || 0

        setStats({
          activeCompanies: {
            value: String(companiesData?.length || 0),
            change: newCompaniesThisMonth > 0 ? `+${newCompaniesThisMonth} este mês` : 'Sem mudanças este mês',
            loading: false
          },
          totalUsers: {
            value: String(usersData?.length || 0),
            change: newUsersThisWeek > 0 ? `+${newUsersThisWeek} esta semana` : 'Sem mudanças esta semana',
            loading: false
          },
          activeJourneys: {
            value: String(journeysData?.length || 0),
            change: newJourneysToday > 0 ? `+${newJourneysToday} hoje` : 'Sem mudanças hoje',
            loading: false
          },
          systemUptime: {
            value: '99.9%',
            change: '30 dias',
            loading: false
          }
        })

      } catch (err) {
        console.error('Erro ao buscar estatísticas:', err)
        setError(err.message)
        
        // Valores de fallback em caso de erro
        setStats({
          activeCompanies: { value: 'Erro', change: 'Não foi possível carregar', loading: false },
          totalUsers: { value: 'Erro', change: 'Não foi possível carregar', loading: false },
          activeJourneys: { value: 'Erro', change: 'Não foi possível carregar', loading: false },
          systemUptime: { value: '99.9%', change: '30 dias', loading: false }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const refresh = () => {
    setLoading(true)
    setError(null)
    // Re-executar o useEffect
    window.location.reload() // Método simples, pode ser melhorado
  }

  return {
    stats,
    loading,
    error,
    refresh
  }
}