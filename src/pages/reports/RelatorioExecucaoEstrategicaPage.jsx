import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import {
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  Award,
  Filter,
  RefreshCw,
  ChevronRight,
  Loader,
  FileText,
  Zap,
  CalendarRange,
  X
} from 'lucide-react'

// ── helpers ────────────────────────────────────────────────────────────────────

const PERIODS = [
  { label: 'Mês', value: '1m' },
  { label: 'Últimos 3 meses', value: '3m' },
  { label: 'Últimos 6 meses', value: '6m' },
  { label: 'Este ano', value: '1y' }
]

function getPeriodStart(value) {
  const now = new Date()
  if (value === '3m') { const d = new Date(now); d.setMonth(d.getMonth() - 3); return d.toISOString() }
  if (value === '6m') { const d = new Date(now); d.setMonth(d.getMonth() - 6); return d.toISOString() }
  if (value === '1y') return new Date(now.getFullYear(), 0, 1).toISOString()
  return null
}

function formatMonthLabel(ym) {
  if (!ym) return 'Mês'
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

function pct(num, denom) {
  if (!denom) return 0
  return Math.round((num / denom) * 100)
}

function formatName(n) {
  if (!n) return 'Sem nome'
  const parts = n.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1]}`
}

// ── sub-components ─────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, iconBg, value, label, sub, borderColor = 'border-gray-100' }) {
  return (
    <div className={`bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border-2 ${borderColor} flex flex-col gap-1`}>
      <div className="flex items-center justify-between mb-1">
        <div className={`p-2 rounded-xl ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-xs sm:text-sm font-semibold text-gray-700">{label}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function PctBar({ label, value, color, count, total }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs sm:text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs sm:text-sm font-bold text-gray-900">{value}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-0.5">{count} de {total} ações</p>
    </div>
  )
}

// ── main component ─────────────────────────────────────────────────────────────

export default function RelatorioExecucaoEstrategicaPage() {
  const { profile } = useAuth()

  const [period, setPeriod] = useState('3m')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [tasks, setTasks] = useState([])
  const [assigneeCompletions, setAssigneeCompletions] = useState([]) // { userId, name, count }
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  // ── resolve company id ────────────────────────────────────────────────────────

  const companyId = useMemo(() => {
    if (profile?.company_id) return profile.company_id
    const active = profile?.user_companies?.find(uc => uc.is_active)
    return active?.company_id || profile?.user_companies?.[0]?.company_id || null
  }, [profile])

  // ── data loading ──────────────────────────────────────────────────────────────

  const loadData = async (showRefresh = false) => {
    if (!companyId) return
    if (showRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      // Determine range to apply
      let periodStart = null
      let periodEnd = null

      if (period === '1m') {
        const [y, m] = selectedMonth.split('-').map(Number)
        periodStart = new Date(y, m - 1, 1).toISOString()
        periodEnd = new Date(y, m, 0, 23, 59, 59).toISOString() // last day of month
      } else if (period === 'custom') {
        if (customStart) periodStart = new Date(customStart).toISOString()
        if (customEnd) periodEnd = new Date(customEnd + 'T23:59:59').toISOString()
      } else {
        periodStart = getPeriodStart(period)
      }

      // 1. Fetch tasks with due_date defined for this company
      let query = supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          due_date,
          created_at,
          process_id,
          journey_id,
          assigned_to,
          assigned_to_name,
          total_assignees,
          completed_assignees
        `)
        .eq('company_id', companyId)
        .not('due_date', 'is', null)

      if (periodStart) {
        query = query.gte('created_at', periodStart)
      }
      if (periodEnd) {
        query = query.lte('created_at', periodEnd)
      }

      const { data: tasksData, error: tasksError } = await query.order('created_at', { ascending: false })

      if (tasksError) throw tasksError

      setTasks(tasksData || [])

      // 2. Fetch who completed tasks (task_assignees with has_completed = true)
      if (tasksData && tasksData.length > 0) {
        const taskIds = tasksData.map(t => t.id)

        const { data: completedAssignees, error: caError } = await supabase
          .from('task_assignees')
          .select('user_id, has_completed, task_id')
          .in('task_id', taskIds)
          .eq('has_completed', true)

        if (!caError && completedAssignees && completedAssignees.length > 0) {
          // Count completions per user
          const countMap = {}
          completedAssignees.forEach(a => {
            countMap[a.user_id] = (countMap[a.user_id] || 0) + 1
          })

          // Fetch names
          const userIds = Object.keys(countMap)
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds)

          const leaderboard = Object.entries(countMap)
            .map(([userId, count]) => {
              const p = profiles?.find(pr => pr.id === userId)
              return {
                userId,
                name: p?.full_name || p?.email || 'Usuário',
                count
              }
            })
            .sort((a, b) => b.count - a.count)

          setAssigneeCompletions(leaderboard)
        } else {
          setAssigneeCompletions([])
        }
      } else {
        setAssigneeCompletions([])
      }

      setLastUpdated(new Date())
    } catch (err) {
      console.error('Erro ao carregar relatório:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (period === 'custom' && !customStart && !customEnd) return
    loadData()
  }, [companyId, period, selectedMonth, customStart, customEnd])

  const handleSelectPeriod = (value) => {
    if (value === 'custom') {
      setShowCustom(true)
      setPeriod('custom')
    } else {
      setShowCustom(false)
      setCustomStart('')
      setCustomEnd('')
      setPeriod(value)
    }
  }

  // Label shown in header when using custom range
  const customLabel = useMemo(() => {
    if (period !== 'custom') return null
    const fmt = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''
    if (customStart && customEnd) return `${fmt(customStart)} – ${fmt(customEnd)}`
    if (customStart) return `A partir de ${fmt(customStart)}`
    if (customEnd) return `Até ${fmt(customEnd)}`
    return 'Período personalizado'
  }, [period, customStart, customEnd])

  // ── derived metrics ───────────────────────────────────────────────────────────

  const now = new Date()

  const totalComPrazo = tasks.length

  const concluidas = tasks.filter(t => t.status === 'completed')
  const naoConcluidas = tasks.filter(t => t.status !== 'completed')
  const atrasadas = naoConcluidas.filter(t => t.due_date && new Date(t.due_date) < now)
  const dentroDoP = naoConcluidas.filter(t => t.due_date && new Date(t.due_date) >= now)

  const pctConcluidas = pct(concluidas.length, totalComPrazo)
  const pctAtrasadas = pct(atrasadas.length, totalComPrazo)
  const pctDentroP = pct(dentroDoP.length, totalComPrazo)

  // Taxa de conclusão geral = concluídas / total (inclui sem prazo se quiseres — aqui usamos o total filtrado)
  const taxaConclusaoGeral = pctConcluidas

  const topPerformer = assigneeCompletions[0] || null

  // ── render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500] mx-auto mb-4" />
          <p className="text-gray-600">Carregando relatório...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

        {/* ── Header ── */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-[#EBA500]/10 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-[#EBA500]" />
                </div>
                <span className="text-xs font-semibold text-[#EBA500] uppercase tracking-wide">Relatórios / Performance</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Execução Estratégica</h1>
              <p className="text-sm sm:text-base text-gray-500 mt-1">
                Acompanhe o desempenho das ações do planejamento estratégico
              </p>
            </div>

            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>

          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-2">
              Última atualização: {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        {/* ── Filtro de período ── */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-5 sm:mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-xs sm:text-sm font-semibold text-gray-600">Período:</span>
            </div>

            {/* Quick periods */}
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => handleSelectPeriod(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  period === p.value
                    ? 'bg-[#EBA500] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p.value === '1m' && period === '1m' ? formatMonthLabel(selectedMonth) : p.label}
              </button>
            ))}

            {/* Month picker — shows below buttons when Mês is active */}

            {/* Personalizar toggle */}
            <button
              onClick={() => handleSelectPeriod('custom')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all border ${
                period === 'custom'
                  ? 'bg-[#EBA500] text-white border-[#EBA500] shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              {period === 'custom' && customLabel ? customLabel : 'Personalizar'}
            </button>
          </div>

          {/* Month picker */}
          {period === '1m' && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">Selecione o mês</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#EBA500] focus:ring-2 focus:ring-amber-500/20 transition-all min-h-[40px]"
                />
              </div>
            </div>
          )}

          {/* Custom date range inputs */}
          {showCustom && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">De</label>
                <input
                  type="date"
                  value={customStart}
                  max={customEnd || undefined}
                  onChange={e => setCustomStart(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#EBA500] focus:ring-2 focus:ring-amber-500/20 transition-all min-h-[40px]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">Até</label>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart || undefined}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#EBA500] focus:ring-2 focus:ring-amber-500/20 transition-all min-h-[40px]"
                />
              </div>
              <button
                onClick={() => { setCustomStart(''); setCustomEnd('') }}
                className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-500 hover:text-red-500 bg-gray-100 hover:bg-red-50 rounded-xl transition-all min-h-[40px]"
                title="Limpar datas"
              >
                <X className="h-3.5 w-3.5" />
                Limpar
              </button>
            </div>
          )}
        </div>

        {/* ── Empty state ── */}
        {totalComPrazo === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma ação com prazo no período</h3>
            <p className="text-sm text-gray-500">
              Tente selecionar um período maior ou adicione ações com prazo no Planejamento Estratégico.
            </p>
          </div>
        ) : (
          <>
            {/* ── Métricas principais ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
              <StatCard
                icon={Target}
                iconBg="bg-[#EBA500]/10 text-[#EBA500]"
                value={totalComPrazo}
                label="Ações com prazo no período"
                sub="Apenas ações com data definida"
                borderColor="border-amber-200"
              />
              <StatCard
                icon={CheckCircle2}
                iconBg="bg-green-100 text-green-600"
                value={`${pctConcluidas}%`}
                label="Metas concluídas"
                sub={`${concluidas.length} ações`}
                borderColor={pctConcluidas >= 70 ? 'border-green-200' : 'border-gray-100'}
              />
              <StatCard
                icon={AlertTriangle}
                iconBg="bg-red-100 text-red-600"
                value={`${pctAtrasadas}%`}
                label="Metas em atraso"
                sub={`${atrasadas.length} ações`}
                borderColor={pctAtrasadas > 20 ? 'border-red-200' : 'border-gray-100'}
              />
              <StatCard
                icon={Clock}
                iconBg="bg-blue-100 text-blue-600"
                value={`${pctDentroP}%`}
                label="Dentro do prazo"
                sub={`${dentroDoP.length} ações abertas`}
                borderColor="border-gray-100"
              />
            </div>

            {/* ── Grid principal ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">

              {/* ── Distribuição de status ── */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">Distribuição de Status</h2>
                </div>

                <div className="space-y-4">
                  <PctBar
                    label="Concluídas"
                    value={pctConcluidas}
                    color="bg-gradient-to-r from-green-400 to-green-500"
                    count={concluidas.length}
                    total={totalComPrazo}
                  />
                  <PctBar
                    label="Em atraso"
                    value={pctAtrasadas}
                    color="bg-gradient-to-r from-red-400 to-red-500"
                    count={atrasadas.length}
                    total={totalComPrazo}
                  />
                  <PctBar
                    label="Dentro do prazo (abertas)"
                    value={pctDentroP}
                    color="bg-gradient-to-r from-blue-400 to-blue-500"
                    count={dentroDoP.length}
                    total={totalComPrazo}
                  />
                </div>

                {/* Taxa geral */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">Taxa de conclusão geral</span>
                    <span className={`text-lg font-bold ${taxaConclusaoGeral >= 70 ? 'text-green-600' : taxaConclusaoGeral >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {taxaConclusaoGeral}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3.5">
                    <div
                      className={`h-3.5 rounded-full transition-all duration-700 ${
                        taxaConclusaoGeral >= 70
                          ? 'bg-gradient-to-r from-green-400 to-green-600'
                          : taxaConclusaoGeral >= 40
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                          : 'bg-gradient-to-r from-red-400 to-red-500'
                      }`}
                      style={{ width: `${taxaConclusaoGeral}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {concluidas.length} de {totalComPrazo} ações concluídas no planejamento
                  </p>
                </div>
              </div>

              {/* ── Performance por liderança ── */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-1.5 bg-amber-50 rounded-lg">
                    <Award className="h-4 w-4 text-[#EBA500]" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">Performance por Liderança</h2>
                </div>

                {assigneeCompletions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="p-3 bg-gray-100 rounded-full mb-3">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">Nenhuma ação foi concluída por responsáveis neste período.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assigneeCompletions.slice(0, 6).map((user, idx) => {
                      const maxCount = assigneeCompletions[0].count
                      const barPct = pct(user.count, maxCount)
                      const medals = ['🥇', '🥈', '🥉']
                      return (
                        <div key={user.userId} className="flex items-center gap-3">
                          <div className="w-7 text-center flex-shrink-0">
                            {idx < 3
                              ? <span className="text-base">{medals[idx]}</span>
                              : <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{formatName(user.name)}</span>
                              <span className="text-xs font-bold text-gray-700 ml-2 flex-shrink-0">{user.count} ação{user.count !== 1 ? 'ões' : ''}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-700 ${
                                  idx === 0
                                    ? 'bg-gradient-to-r from-[#EBA500] to-amber-400'
                                    : idx === 1
                                    ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                                    : idx === 2
                                    ? 'bg-gradient-to-r from-amber-700 to-amber-600'
                                    : 'bg-gradient-to-r from-blue-400 to-blue-500'
                                }`}
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {topPerformer && (
                  <div className="mt-5 pt-4 border-t border-amber-100 flex items-center gap-3 bg-amber-50/60 rounded-xl p-3">
                    <div className="p-2 bg-[#EBA500]/10 rounded-lg flex-shrink-0">
                      <Zap className="h-4 w-4 text-[#EBA500]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 font-medium">Destaque do período</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{formatName(topPerformer.name)}</p>
                      <p className="text-xs text-gray-500">{topPerformer.count} ação{topPerformer.count !== 1 ? 'ões' : ''} concluída{topPerformer.count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Últimas ações em atraso ── */}
              {atrasadas.length > 0 && (
                <div className="lg:col-span-2 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-red-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">Ações em Atraso</h2>
                    <span className="ml-auto text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded-full">
                      {atrasadas.length} ação{atrasadas.length !== 1 ? 'ões' : ''}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {atrasadas.slice(0, 20).map(task => {
                      const daysLate = Math.floor((now - new Date(task.due_date)) / (1000 * 60 * 60 * 24))
                      return (
                        <div key={task.id} className="flex items-start gap-3 p-3 bg-red-50/50 rounded-xl border border-red-100">
                          <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{task.title}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 text-xs text-red-600">
                                <Calendar className="h-3 w-3" />
                                Venceu {new Date(task.due_date).toLocaleDateString('pt-BR')}
                              </span>
                              <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                                {daysLate}d atrasada{daysLate !== 1 ? 's' : ''}
                              </span>
                              {task.assigned_to_name && (
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Users className="h-3 w-3" />
                                  {formatName(task.assigned_to_name)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {atrasadas.length > 20 && (
                      <p className="text-xs text-center text-gray-400 py-2">
                        + {atrasadas.length - 20} ações não exibidas
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ── Resumo de conclusões ── */}
              <div className={`bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 ${atrasadas.length === 0 ? 'lg:col-span-2' : ''}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-green-50 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">Últimas Concluídas</h2>
                </div>

                {concluidas.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500">Nenhuma ação concluída neste período.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {concluidas.slice(0, 15).map(task => (
                      <div key={task.id} className="flex items-start gap-3 p-3 bg-green-50/50 rounded-xl border border-green-100">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{task.title}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              Prazo {new Date(task.due_date).toLocaleDateString('pt-BR')}
                            </span>
                            {task.assigned_to_name && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Users className="h-3 w-3" />
                                {formatName(task.assigned_to_name)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {concluidas.length > 15 && (
                      <p className="text-xs text-center text-gray-400 py-2">
                        + {concluidas.length - 15} ações não exibidas
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
