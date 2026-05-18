import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { exportTableToPdf } from '../../utils/exportPdf'
import {
  Building2,
  Search,
  Users,
  Calendar,
  Clock,
  Mail,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Hourglass,
  FileDown,
} from 'lucide-react'

const TRIAL_DAYS = 14

const PERIODS = [
  { label: 'Últimos 7 dias',    days: 7 },
  { label: 'Últimos 30 dias',   days: 30 },
  { label: 'Últimos 3 meses',   days: 90 },
  { label: 'Últimos 6 meses',   days: 180 },
  { label: 'Este ano',          days: null, thisYear: true },
  { label: 'Personalizado',     days: null, custom: true },
]

const STATUS_INFO = {
  trial:     { label: 'Em Trial',      bg: 'bg-blue-100 dark:bg-blue-900/30',    text: 'text-blue-700 dark:text-blue-300',   icon: Hourglass },
  active:    { label: 'Converteu',     bg: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-700 dark:text-green-300', icon: CheckCircle },
  inactive:  { label: 'Não converteu', bg: 'bg-red-100 dark:bg-red-900/30',     text: 'text-red-700 dark:text-red-300',     icon: XCircle },
  suspended: { label: 'Suspenso',      bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', icon: AlertCircle },
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('pt-BR')
}

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d
}

function daysSince(d) {
  return Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24))
}

function trialProgress(createdAt) {
  const elapsed = Math.min(daysSince(createdAt), TRIAL_DAYS)
  return Math.round((elapsed / TRIAL_DAYS) * 100)
}

export default function RelatorioTrialPage() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[2]) // Últimos 3 meses
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const navigate = useNavigate()

  useEffect(() => { loadData() }, [selectedPeriod, customStart, customEnd])

  const getDateRange = () => {
    if (selectedPeriod.custom) {
      if (!customStart || !customEnd) return null
      return { start: new Date(customStart + 'T00:00:00'), end: new Date(customEnd + 'T23:59:59') }
    }
    const end = new Date()
    let start
    if (selectedPeriod.thisYear) {
      start = new Date(new Date().getFullYear(), 0, 1)
    } else {
      start = new Date()
      start.setDate(start.getDate() - selectedPeriod.days)
    }
    return { start, end }
  }

  const loadData = async () => {
    const range = getDateRange()
    if (!range) return

    setLoading(true)
    try {
      const { data: companiesData, error } = await supabase
        .from('companies')
        .select('*')
        .gte('created_at', range.start.toISOString())
        .lte('created_at', range.end.toISOString())
        .order('created_at', { ascending: false })

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

      const enriched = (companiesData || []).map(c => {
        const trialEnd = addDays(c.created_at, TRIAL_DAYS)
        const trialEnded = new Date() > trialEnd
        const daysElapsed = daysSince(c.created_at)
        return {
          ...c,
          usersCount: userCountMap[c.id] || 0,
          admin: adminMap[c.id] || null,
          trialEnd,
          trialEnded,
          daysElapsed,
          progress: trialProgress(c.created_at),
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
    const matchesStatus = filterStatus === 'all' || c.subscription_status === filterStatus
    const q = search.toLowerCase()
    const matchesSearch = !search ||
      c.name?.toLowerCase().includes(q) ||
      c.admin?.full_name?.toLowerCase().includes(q) ||
      c.admin?.email?.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  const counts = {
    total:    companies.length,
    trial:    companies.filter(c => c.subscription_status === 'trial').length,
    active:   companies.filter(c => c.subscription_status === 'active').length,
    inactive: companies.filter(c => ['inactive', 'suspended'].includes(c.subscription_status)).length,
  }

  const conversionRate = counts.total > 0
    ? Math.round((counts.active / counts.total) * 100)
    : 0

  const handleExportPdf = () => {
    const subtitle = `Período: ${selectedPeriod.label} · Conversão: ${conversionRate}%`
    exportTableToPdf({
      title: 'Histórico de Trials',
      subtitle,
      stats: [
        { label: 'Total no período', value: counts.total },
        { label: 'Ainda em trial',    value: counts.trial },
        { label: 'Converteram',       value: counts.active },
        { label: 'Não converteram',   value: counts.inactive },
        { label: 'Taxa de conversão', value: `${conversionRate}%` },
      ],
      head: ['Empresa', 'Admin', 'E-mail admin', 'Início trial', 'Fim trial', 'Status', 'Usuários'],
      body: filtered.map(c => [
        c.name,
        c.admin?.full_name || '—',
        c.admin?.email || '—',
        formatDate(c.created_at),
        formatDate(c.trialEnd),
        STATUS_INFO[c.subscription_status]?.label ?? c.subscription_status,
        String(c.usersCount),
      ]),
      filename: `trials-${new Date().toISOString().slice(0, 10)}`,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500 rounded-xl">
            <Hourglass className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Histórico de Trials</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Empresas criadas no período — trial de {TRIAL_DAYS} dias
            </p>
          </div>
        </div>

        {/* Seletor de período */}
        <div className="flex items-center gap-2">
          <div className="relative">
            {showPeriodDropdown && (
              <div className="fixed inset-0 z-10" onClick={() => setShowPeriodDropdown(false)} />
            )}
            <button
              onClick={() => setShowPeriodDropdown(v => !v)}
              className="relative z-20 flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            >
              <Calendar className="h-4 w-4 text-gray-400" />
              {selectedPeriod.label}
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>
            {showPeriodDropdown && (
              <div className="absolute right-0 top-full mt-1 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl min-w-[200px] py-1">
                {PERIODS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => { setSelectedPeriod(p); setShowPeriodDropdown(false) }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedPeriod.label === p.label ? 'font-semibold text-primary-600' : 'text-gray-700 dark:text-gray-200'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input de datas customizadas */}
      {selectedPeriod.custom && (
        <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-2xl p-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Período:</span>
          <input
            type="date"
            value={customStart}
            onChange={e => setCustomStart(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-400">até</span>
          <input
            type="date"
            value={customEnd}
            onChange={e => setCustomEnd(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total no período', value: counts.total,    color: 'blue',   icon: Building2 },
          { label: 'Ainda em trial',   value: counts.trial,    color: 'blue',   icon: Hourglass },
          { label: 'Converteram',      value: counts.active,   color: 'green',  icon: CheckCircle },
          { label: 'Não converteram',  value: counts.inactive, color: 'red',    icon: XCircle },
        ].map(s => {
          const cls = {
            blue:  { bg: 'bg-blue-100 dark:bg-blue-900/30',  text: 'text-blue-600 dark:text-blue-400',  card: '' },
            green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', card: '' },
            red:   { bg: 'bg-red-100 dark:bg-red-900/30',    text: 'text-red-600 dark:text-red-400',    card: '' },
          }[s.color]
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${cls.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-5 w-5 ${cls.text}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Taxa de conversão */}
      {counts.total > 0 && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Taxa de conversão</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{conversionRate}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-green-500 h-2.5 rounded-full transition-all"
              style={{ width: `${conversionRate}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">{counts.active} de {counts.total} empresas converteram para um plano pago</p>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
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

          {/* Filtro por status */}
          <div className="relative">
            {showStatusDropdown && (
              <div className="fixed inset-0 z-10" onClick={() => setShowStatusDropdown(false)} />
            )}
            <button
              onClick={() => setShowStatusDropdown(v => !v)}
              className={`relative z-20 flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors whitespace-nowrap ${
                filterStatus !== 'all'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              {filterStatus === 'all' ? 'Todos os status' : (STATUS_INFO[filterStatus]?.label ?? filterStatus)}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showStatusDropdown && (
              <div className="absolute right-0 top-full mt-1 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl min-w-[170px] py-1">
                <button
                  onClick={() => { setFilterStatus('all'); setShowStatusDropdown(false) }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${filterStatus === 'all' ? 'font-semibold text-primary-600' : 'text-gray-700 dark:text-gray-200'}`}
                >
                  Todos
                </button>
                {Object.entries(STATUS_INFO).map(([key, info]) => (
                  <button
                    key={key}
                    onClick={() => { setFilterStatus(key); setShowStatusDropdown(false) }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${filterStatus === key ? 'font-semibold text-primary-600' : 'text-gray-700 dark:text-gray-200'}`}
                  >
                    {info.label}
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
          <button
            onClick={handleExportPdf}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <FileDown className="h-4 w-4" />
            Exportar PDF
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{search || filterStatus !== 'all' ? 'Nenhuma empresa encontrada.' : 'Nenhuma empresa no período selecionado.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Empresa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Admin</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Início trial</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fim trial</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Progresso</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Usuários</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(c => {
                  const statusInfo = STATUS_INFO[c.subscription_status] || STATUS_INFO.inactive
                  const StatusIcon = statusInfo.icon
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-blue-600" />
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
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          {formatDate(c.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          {formatDate(c.trialEnd)}
                        </div>
                      </td>
                      <td className="px-4 py-3 min-w-[120px]">
                        {c.trialEnded ? (
                          <span className="text-xs text-gray-400">Trial encerrado</span>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-500">{c.daysElapsed}d / {TRIAL_DAYS}d</span>
                              <span className="text-xs font-semibold text-blue-600">{c.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full"
                                style={{ width: `${c.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.bg} ${statusInfo.text}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
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
          </div>
        )}
      </div>
    </div>
  )
}
