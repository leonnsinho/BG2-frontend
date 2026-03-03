import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Target,
  Filter,
  RefreshCw,
  Loader,
  FileText,
  CalendarRange,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search
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

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatName(n) {
  if (!n) return 'Usuário'
  const parts = n.trim().split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1]}`
}

const AVATAR_COLORS = [
  'bg-amber-100 text-amber-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-purple-100 text-purple-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
]

function avatarColor(idx) {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length]
}

// ── sub-components ─────────────────────────────────────────────────────────────

function SummaryCard({ icon: Icon, iconBg, value, label, borderColor = 'border-gray-100' }) {
  return (
    <div className={`bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border-2 ${borderColor} flex flex-col gap-1`}>
      <div className="flex items-center justify-between mb-1">
        <div className={`p-2 rounded-xl ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-xs sm:text-sm font-semibold text-gray-700">{label}</p>
    </div>
  )
}

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ChevronsUpDown className="h-3.5 w-3.5 text-gray-300" />
  return sortDir === 'asc'
    ? <ChevronUp className="h-3.5 w-3.5 text-[#EBA500]" />
    : <ChevronDown className="h-3.5 w-3.5 text-[#EBA500]" />
}

// ── main component ─────────────────────────────────────────────────────────────

export default function RelatorioProdutividadeUsuarioPage() {
  const { profile } = useAuth()

  const [period, setPeriod] = useState('3m')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const [userData, setUserData] = useState([])   // [{ userId, name, atribuidas, concluidas, atrasadas, emAndamento }]
  const [avatarUrls, setAvatarUrls] = useState({}) // userId → signed URL
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('atribuidas')
  const [sortDir, setSortDir] = useState('desc')

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
      const now = new Date()

      // Determine date range
      let periodStart = null
      let periodEnd = null

      if (period === '1m') {
        const [y, m] = selectedMonth.split('-').map(Number)
        periodStart = new Date(y, m - 1, 1).toISOString()
        periodEnd = new Date(y, m, 0, 23, 59, 59).toISOString()
      } else if (period === 'custom') {
        if (customStart) periodStart = new Date(customStart).toISOString()
        if (customEnd) periodEnd = new Date(customEnd + 'T23:59:59').toISOString()
      } else {
        periodStart = getPeriodStart(period)
      }

      // 1. Fetch tasks for this company in the period
      let taskQuery = supabase
        .from('tasks')
        .select('id, title, status, due_date, created_at, assigned_to, assigned_to_name')
        .eq('company_id', companyId)

      if (periodStart) taskQuery = taskQuery.gte('created_at', periodStart)
      if (periodEnd)   taskQuery = taskQuery.lte('created_at', periodEnd)

      const { data: tasks, error: tasksErr } = await taskQuery
      if (tasksErr) throw tasksErr

      if (!tasks || tasks.length === 0) {
        setUserData([])
        setLastUpdated(new Date())
        return
      }

      const taskIds = tasks.map(t => t.id)

      // 2. Fetch task_assignees for these tasks (no user_name column — resolved via profiles)
      const { data: assignees, error: assigneesErr } = await supabase
        .from('task_assignees')
        .select('task_id, user_id, has_completed')
        .in('task_id', taskIds)

      if (assigneesErr) throw assigneesErr

      // 3. Collect all user_ids (from assignees + assigned_to fallback)
      const assigneeUserIds = new Set((assignees || []).map(a => a.user_id).filter(Boolean))
      tasks.forEach(t => { if (t.assigned_to) assigneeUserIds.add(t.assigned_to) })

      // 4. Fetch profiles to get names + avatar paths
      const profileMap = {}
      const rawAvatarMap = {} // userId → storage path
      if (assigneeUserIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', [...assigneeUserIds])
        ;(profiles || []).forEach(p => {
          profileMap[p.id] = p.full_name || 'Usuário'
          if (p.avatar_url) rawAvatarMap[p.id] = p.avatar_url
        })
      }

      // 4b. Generate signed URLs for avatars
      const signedMap = {}
      await Promise.all(
        Object.entries(rawAvatarMap).map(async ([uid, path]) => {
          const { data } = await supabase.storage
            .from('profile-avatars')
            .createSignedUrl(path, 3600)
          if (data?.signedUrl) signedMap[uid] = data.signedUrl
        })
      )
      setAvatarUrls(signedMap)

      // 5. Build a map: taskId → task info
      const taskMap = {}
      tasks.forEach(t => { taskMap[t.id] = t })

      // 6. Aggregate by user
      const userMap = {}

      const processAssignee = (userId, task) => {
        if (!userId) return
        if (!userMap[userId]) {
          userMap[userId] = {
            userId,
            name: profileMap[userId] || tasks.find(t => t.assigned_to === userId)?.assigned_to_name || 'Usuário',
            atribuidas: 0, concluidas: 0, atrasadas: 0, emAndamento: 0
          }
        }
        const u = userMap[userId]
        u.atribuidas++

        const isCompleted = task.status === 'completed'
        const isOverdue = !isCompleted && task.due_date && new Date(task.due_date) < now

        if (isCompleted)     u.concluidas++
        else if (isOverdue)  u.atrasadas++
        else                 u.emAndamento++
      }

      if (assignees && assignees.length > 0) {
        // Deduplicate: one entry per (userId, taskId) pair
        const seen = new Set()
        assignees.forEach(a => {
          const key = `${a.user_id}:${a.task_id}`
          if (seen.has(key)) return
          seen.add(key)
          const task = taskMap[a.task_id]
          if (task) processAssignee(a.user_id, task)
        })
      }

      // Fallback: tasks with assigned_to that have no entry in task_assignees
      tasks.forEach(t => {
        if (!t.assigned_to) return
        const alreadyCounted = assignees?.some(a => a.task_id === t.id && a.user_id === t.assigned_to)
        if (!alreadyCounted) processAssignee(t.assigned_to, t)
      })

      const result = Object.values(userMap)
      setUserData(result)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Erro ao carregar produtividade:', err)
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

  const customLabel = useMemo(() => {
    if (period !== 'custom') return null
    const fmt = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''
    if (customStart && customEnd) return `${fmt(customStart)} – ${fmt(customEnd)}`
    if (customStart) return `A partir de ${fmt(customStart)}`
    if (customEnd) return `Até ${fmt(customEnd)}`
    return 'Período personalizado'
  }, [period, customStart, customEnd])

  // ── derived / sorted data ─────────────────────────────────────────────────────

  const totals = useMemo(() => {
    const t = { atribuidas: 0, concluidas: 0, atrasadas: 0, emAndamento: 0 }
    userData.forEach(u => {
      t.atribuidas  += u.atribuidas
      t.concluidas  += u.concluidas
      t.atrasadas   += u.atrasadas
      t.emAndamento += u.emAndamento
    })
    return t
  }, [userData])

  const filteredSorted = useMemo(() => {
    let list = userData.filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase())
    )
    list = [...list].sort((a, b) => {
      const va = a[sortField] ?? 0
      const vb = b[sortField] ?? 0
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      return sortDir === 'asc' ? va - vb : vb - va
    })
    return list
  }, [userData, search, sortField, sortDir])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  // ── render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-[#EBA500] mx-auto mb-3" />
          <p className="text-sm text-gray-500">Carregando relatório…</p>
        </div>
      </div>
    )
  }

  const columns = [
    { key: 'name',        label: 'Usuário',        align: 'left' },
    { key: 'atribuidas',  label: 'Atribuídas',     align: 'center' },
    { key: 'concluidas',  label: 'Concluídas',     align: 'center' },
    { key: 'atrasadas',   label: 'Atrasadas',      align: 'center' },
    { key: 'emAndamento', label: 'Em Andamento',   align: 'center' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                <Users className="h-5 w-5 text-[#EBA500]" />
              </div>
              <span className="text-xs font-semibold text-[#EBA500] tracking-widest uppercase">Relatório</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              Produtividade por Usuário
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Ações atribuídas, concluídas, atrasadas e em andamento por colaborador
            </p>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50 self-start"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando…' : 'Atualizar'}
          </button>
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

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
          <SummaryCard
            icon={Target}
            iconBg="bg-amber-50 text-[#EBA500]"
            value={totals.atribuidas}
            label="Ações Atribuídas"
            borderColor="border-amber-200"
          />
          <SummaryCard
            icon={CheckCircle2}
            iconBg="bg-emerald-50 text-emerald-600"
            value={totals.concluidas}
            label="Ações Concluídas"
            borderColor="border-emerald-200"
          />
          <SummaryCard
            icon={AlertTriangle}
            iconBg="bg-red-50 text-red-500"
            value={totals.atrasadas}
            label="Ações Atrasadas"
            borderColor="border-red-200"
          />
          <SummaryCard
            icon={Clock}
            iconBg="bg-blue-50 text-blue-600"
            value={totals.emAndamento}
            label="Em Andamento"
            borderColor="border-blue-200"
          />
        </div>

        {/* ── Empty state ── */}
        {userData.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma ação encontrada no período</h3>
            <p className="text-sm text-gray-500">
              Tente selecionar um período diferente ou verifique se há ações atribuídas no Planejamento Estratégico.
            </p>
          </div>
        ) : (
          <>
            {/* ── Search + table ── */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

              {/* Search bar */}
              <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar usuário…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <span className="text-xs text-gray-400 ml-1">{filteredSorted.length} usuário{filteredSorted.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Table — desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {columns.map(col => (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none ${
                            col.align === 'center' ? 'text-center' : 'text-left'
                          }`}
                        >
                          <span className="inline-flex items-center gap-1">
                            {col.label}
                            <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredSorted.map((user, idx) => {
                      const pctConcluidas = totals.atribuidas === 0 ? 0 : Math.round((user.concluidas / user.atribuidas) * 100)
                      return (
                        <tr key={user.userId} className="hover:bg-amber-50/30 transition-colors">
                          {/* Usuário */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              {avatarUrls[user.userId] ? (
                                <img
                                  src={avatarUrls[user.userId]}
                                  alt={user.name}
                                  className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-1 ring-gray-200"
                                />
                              ) : (
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${avatarColor(idx)}`}>
                                  {initials(user.name)}
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{formatName(user.name)}</p>
                                <div className="mt-1 w-24 bg-gray-100 rounded-full h-1.5">
                                  <div
                                    className="h-1.5 rounded-full bg-emerald-400 transition-all duration-700"
                                    style={{ width: `${pctConcluidas}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">{pctConcluidas}% concluídas</p>
                              </div>
                            </div>
                          </td>
                          {/* Atribuídas */}
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 text-[#EBA500] font-bold text-sm">
                              {user.atribuidas}
                            </span>
                          </td>
                          {/* Concluídas */}
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-sm">
                              {user.concluidas}
                            </span>
                          </td>
                          {/* Atrasadas */}
                          <td className="px-4 py-3.5 text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                              user.atrasadas > 0 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'
                            }`}>
                              {user.atrasadas}
                            </span>
                          </td>
                          {/* Em Andamento */}
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold text-sm">
                              {user.emAndamento}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cards — mobile */}
              <div className="sm:hidden divide-y divide-gray-50">
                {filteredSorted.map((user, idx) => {
                  const pctConcluidas = user.atribuidas === 0 ? 0 : Math.round((user.concluidas / user.atribuidas) * 100)
                  return (
                    <div key={user.userId} className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {avatarUrls[user.userId] ? (
                          <img
                            src={avatarUrls[user.userId]}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-1 ring-gray-200"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${avatarColor(idx)}`}>
                            {initials(user.name)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{formatName(user.name)}</p>
                          <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-emerald-400 transition-all duration-700"
                              style={{ width: `${pctConcluidas}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{pctConcluidas}% concluídas</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: 'Atribuídas', val: user.atribuidas, cls: 'bg-amber-50 text-[#EBA500]' },
                          { label: 'Concluídas', val: user.concluidas, cls: 'bg-emerald-50 text-emerald-600' },
                          { label: 'Atrasadas',  val: user.atrasadas,  cls: user.atrasadas > 0 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400' },
                          { label: 'Andamento',  val: user.emAndamento, cls: 'bg-blue-50 text-blue-600' },
                        ].map(stat => (
                          <div key={stat.label} className={`rounded-xl p-2.5 text-center ${stat.cls}`}>
                            <p className="text-lg font-bold leading-none">{stat.val}</p>
                            <p className="text-[10px] font-semibold mt-1 leading-tight opacity-80">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

            </div>

            {lastUpdated && (
              <p className="text-xs text-gray-400 mt-3 text-right">
                Última atualização: {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
