import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import {
  Building2,
  Search,
  Users,
  Calendar,
  CheckCircle,
  Briefcase,
  Zap,
  Crown,
  Globe,
  Mail,
  ExternalLink,
  RefreshCw,
  ChevronDown,
} from 'lucide-react'

const PLANS = {
  individual:    { label: 'Individual',    color: 'gray',   icon: Briefcase },
  profissional:  { label: 'Profissional',  color: 'amber',  icon: Zap },
  premium:       { label: 'Premium',       color: 'purple', icon: Crown },
  enterprise:    { label: 'Enterprise',    color: 'slate',  icon: Globe },
  free:          { label: 'Gratuito',      color: 'green',  icon: CheckCircle },
}

const COLOR = {
  gray:   { bg: 'bg-gray-100 dark:bg-gray-700/50',   text: 'text-gray-700 dark:text-gray-300',   dot: 'bg-gray-400',   ring: 'border-gray-200 dark:border-gray-600',   stat: 'bg-gray-50 dark:bg-gray-800' },
  amber:  { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-400',  ring: 'border-amber-200 dark:border-amber-700', stat: 'bg-amber-50 dark:bg-amber-900/10' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500', ring: 'border-purple-200 dark:border-purple-700', stat: 'bg-purple-50 dark:bg-purple-900/10' },
  slate:  { bg: 'bg-slate-100 dark:bg-slate-700/50', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-500',  ring: 'border-slate-200 dark:border-slate-600',  stat: 'bg-slate-50 dark:bg-slate-800' },
  green:  { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-400',  ring: 'border-green-200 dark:border-green-700',  stat: 'bg-green-50 dark:bg-green-900/10' },
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('pt-BR')
}

function daysSince(d) {
  return Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24))
}

export default function RelatorioEmpresasAtivasPage() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [showPlanDropdown, setShowPlanDropdown] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: companiesData, error } = await supabase
        .from('companies')
        .select('*')
        .eq('subscription_status', 'active')
        .order('subscription_plan', { ascending: true })

      if (error) throw error

      const companyIds = (companiesData || []).map(c => c.id)
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

      const enriched = (companiesData || []).map(c => ({
        ...c,
        usersCount: userCountMap[c.id] || 0,
        admin: adminMap[c.id] || null,
        daysActive: daysSince(c.created_at),
      }))

      setCompanies(enriched)
    } catch (err) {
      console.error('Erro ao carregar relatório:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = companies.filter(c => {
    const matchesPlan = filterPlan === 'all' || c.subscription_plan === filterPlan
    const q = search.toLowerCase()
    const matchesSearch = !search ||
      c.name?.toLowerCase().includes(q) ||
      c.admin?.full_name?.toLowerCase().includes(q) ||
      c.admin?.email?.toLowerCase().includes(q)
    return matchesPlan && matchesSearch
  })

  // Contagens por plano
  const planCounts = Object.keys(PLANS).reduce((acc, plan) => {
    acc[plan] = companies.filter(c => c.subscription_plan === plan).length
    return acc
  }, {})

  const planOptions = Object.entries(PLANS).filter(([key]) => planCounts[key] > 0)

  const selectedPlanLabel = filterPlan === 'all' ? 'Todos os planos' : (PLANS[filterPlan]?.label ?? filterPlan)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2.5 bg-green-500 rounded-xl">
          <CheckCircle className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Empresas Ativas por Plano</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Visão geral das empresas com assinatura ativa
          </p>
        </div>
      </div>

      {/* Cards por plano */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {Object.entries(PLANS).map(([key, plan]) => {
          const c = COLOR[plan.color]
          const Icon = plan.icon
          const count = planCounts[key] || 0
          return (
            <button
              key={key}
              onClick={() => setFilterPlan(filterPlan === key ? 'all' : key)}
              className={`rounded-2xl border p-4 text-left transition-all ${c.ring} ${filterPlan === key ? c.stat + ' shadow-md' : 'bg-white dark:bg-gray-800 hover:shadow'}`}
            >
              <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center mb-2`}>
                <Icon className={`h-4 w-4 ${c.text}`} />
              </div>
              <p className={`text-xl font-bold text-gray-900 dark:text-white`}>{count}</p>
              <p className={`text-xs font-medium mt-0.5 ${c.text}`}>{plan.label}</p>
            </button>
          )
        })}
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Filtros */}
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

          {/* Filtro por plano (dropdown) */}
          <div className="relative">
            {showPlanDropdown && (
              <div className="fixed inset-0 z-10" onClick={() => setShowPlanDropdown(false)} />
            )}
            <button
              onClick={() => setShowPlanDropdown(v => !v)}
              className={`relative z-20 flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors whitespace-nowrap ${
                filterPlan !== 'all'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              {selectedPlanLabel}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showPlanDropdown && (
              <div className="absolute right-0 top-full mt-1 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl min-w-[170px] py-1">
                <button
                  onClick={() => { setFilterPlan('all'); setShowPlanDropdown(false) }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${filterPlan === 'all' ? 'font-semibold text-primary-600' : 'text-gray-700 dark:text-gray-200'}`}
                >
                  Todos os planos
                </button>
                {planOptions.map(([key, plan]) => (
                  <button
                    key={key}
                    onClick={() => { setFilterPlan(key); setShowPlanDropdown(false) }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between ${filterPlan === key ? 'font-semibold text-primary-600' : 'text-gray-700 dark:text-gray-200'}`}
                  >
                    {plan.label}
                    <span className="text-xs text-gray-400 ml-2">{planCounts[key]}</span>
                  </button>
                ))}
              </div>
            )}
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
            <p className="text-sm">{search || filterPlan !== 'all' ? 'Nenhuma empresa encontrada.' : 'Nenhuma empresa ativa.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Empresa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Plano</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Admin</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cliente desde</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Renovação</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Usuários</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(c => {
                  const plan = PLANS[c.subscription_plan] || { label: c.subscription_plan, color: 'gray', icon: Building2 }
                  const col = COLOR[plan.color]
                  const Icon = plan.icon
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{c.name}</p>
                            <p className="text-xs text-gray-400">{c.size || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${col.bg} ${col.text}`}>
                          <Icon className="h-3 w-3" />
                          {plan.label}
                        </span>
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
                        {c.subscription_renewal_date ? (
                          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            {formatDate(c.subscription_renewal_date)}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
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
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Ver
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
            {filtered.length} empresa{filtered.length !== 1 ? 's' : ''} exibida{filtered.length !== 1 ? 's' : ''}
            {filterPlan !== 'all' && ` · filtro: ${selectedPlanLabel}`}
          </div>
        )}
      </div>
    </div>
  )
}
