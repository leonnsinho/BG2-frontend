import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import {
  Building2,
  Search,
  AlertCircle,
  Clock,
  Users,
  Calendar,
  TrendingDown,
  Mail,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'

function daysSince(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export default function RelatorioEmpresasInativasPage() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Empresas no plano free com status inativo e com mais de 14 dias desde a criação
      const { data: companiesData, error } = await supabase
        .from('companies')
        .select('*')
        .eq('subscription_plan', 'free')
        .in('subscription_status', ['inactive', 'suspended'])
        .order('created_at', { ascending: false })

      if (error) throw error

      const now = Date.now()
      const TRIAL_DAYS = 14
      // Filtra apenas as que já passaram do período de teste
      const trialExpired = (companiesData || []).filter(c => {
        const created = new Date(c.created_at).getTime()
        return (now - created) > TRIAL_DAYS * 24 * 60 * 60 * 1000
      })

      // Buscar usuários e admins de cada empresa
      const companyIds = trialExpired.map(c => c.id)

      let userCountMap = {}
      let adminMap = {}

      if (companyIds.length > 0) {
        const { data: ucData } = await supabase
          .from('user_companies')
          .select('user_id, company_id, role')
          .in('company_id', companyIds)
          .eq('is_active', true)

        const userIds = [...new Set((ucData || []).map(uc => uc.user_id))]
        let profilesMap = {}
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds)
          ;(profiles || []).forEach(p => { profilesMap[p.id] = p })
        }

        ;(ucData || []).forEach(uc => {
          if (!userCountMap[uc.company_id]) userCountMap[uc.company_id] = 0
          userCountMap[uc.company_id]++
          if (uc.role === 'company_admin' && !adminMap[uc.company_id]) {
            adminMap[uc.company_id] = profilesMap[uc.user_id] || null
          }
        })
      }

      const enriched = trialExpired.map(c => {
        const daysTotal = daysSince(c.created_at)
        const daysPostTrial = daysTotal - TRIAL_DAYS
        return {
          ...c,
          usersCount: userCountMap[c.id] || 0,
          admin: adminMap[c.id] || null,
          daysPostTrial,
          daysTotal,
        }
      })

      setCompanies(enriched)
    } catch (err) {
      console.error('Erro ao carregar relatório:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = companies.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name?.toLowerCase().includes(q) ||
      c.admin?.full_name?.toLowerCase().includes(q) ||
      c.admin?.email?.toLowerCase().includes(q)
    )
  })

  const recentlyInactive = companies.filter(c => c.daysPostTrial <= 30).length
  const avgDays = companies.length
    ? Math.round(companies.reduce((acc, c) => acc + c.daysPostTrial, 0) / companies.length)
    : 0

  const tagColor = (days) => {
    if (days <= 7) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    if (days <= 30) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 bg-red-500 rounded-xl">
            <TrendingDown className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Empresas Inativas Pós-Teste</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Empresas que finalizaram o período de teste de 14 dias sem contratar nenhum plano
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total inativas</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{companies.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Inativas há menos de 30 dias</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{recentlyInactive}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Média de dias pós-trial</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgDays}</p>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Barra de filtros */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar empresa, admin ou e-mail..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{search ? 'Nenhuma empresa encontrada.' : 'Nenhuma empresa inativa pós-teste.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Empresa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Admin</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Criada em</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Pós-trial</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Usuários</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.size || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.admin ? (
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{c.admin.full_name}</p>
                          <a
                            href={`mailto:${c.admin.email}`}
                            onClick={e => e.stopPropagation()}
                            className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                          >
                            <Mail className="h-3 w-3" />
                            {c.admin.email}
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Sem admin</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        {formatDate(c.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${tagColor(c.daysPostTrial)}`}>
                        <Clock className="h-3 w-3" />
                        {c.daysPostTrial}d sem plano
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Users className="h-3.5 w-3.5 shrink-0" />
                        {c.usersCount}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/admin/company-dashboard?company=${c.id}`)}
                        className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        title="Ver empresa"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
            {filtered.length} empresa{filtered.length !== 1 ? 's' : ''} exibida{filtered.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
