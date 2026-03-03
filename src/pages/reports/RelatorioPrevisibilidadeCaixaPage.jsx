import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import {
  TrendingUp, TrendingDown, DollarSign, Calendar,
  AlertCircle, RefreshCw, Loader, Building2,
  ArrowUpCircle, ArrowDownCircle, Wallet, ChevronDown
} from 'lucide-react'

// ── helpers ───────────────────────────────────────────────────────────────────

const fmtCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const fmtDate = (s) => {
  if (!s) return '–'
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

const today = () => new Date().toISOString().split('T')[0]

const addDays = (base, n) => {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

const monthLabel = (isoDate) => {
  const [y, m] = isoDate.split('-')
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${months[parseInt(m) - 1]}/${y.slice(2)}`
}

// ── main component ────────────────────────────────────────────────────────────

export default function RelatorioPrevisibilidadeCaixaPage() {
  const { profile } = useAuth()

  // ── state ──
  const [loading, setLoading]       = useState(true)
  const [companies, setCompanies]   = useState([])
  const [selectedCompany, setSelectedCompany] = useState('all')
  const [showCompanyDrop, setShowCompanyDrop] = useState(false)
  const [horizon, setHorizon]       = useState(90) // dias futuros
  const [entradas, setEntradas]     = useState([])
  const [saidas, setSaidas]         = useState([])
  const [activeTab, setActiveTab]   = useState('receber') // 'receber' | 'pagar'

  const isSuperAdmin = profile?.role === 'super_admin'

  const companyId = isSuperAdmin
    ? (selectedCompany === 'all' ? null : selectedCompany)
    : profile?.company_id

  const companyName = isSuperAdmin
    ? (selectedCompany === 'all' ? 'Todas as Empresas' : companies.find(c => c.id === selectedCompany)?.name || 'Empresa')
    : (companies.find(c => c.id === profile?.company_id)?.name || 'Empresa')

  // ── load companies ──
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('companies').select('id, name').order('name')
      setCompanies(data || [])
    }
    load()
  }, [])

  // ── load data ──
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const start = today()
      const end   = addDays(start, horizon)

      let qE = supabase
        .from('dfc_entradas')
        .select('id, valor, vencimento, categoria, item_id, is_parcelado, lancamento_pai_id')
        .gte('vencimento', start)
        .lte('vencimento', end)
        .or('is_parcelado.is.false,lancamento_pai_id.not.is.null')
        .order('vencimento', { ascending: true })

      let qS = supabase
        .from('dfc_saidas')
        .select('id, valor, vencimento, categoria, item_id, is_parcelado, lancamento_pai_id')
        .gte('vencimento', start)
        .lte('vencimento', end)
        .or('is_parcelado.is.false,lancamento_pai_id.not.is.null')
        .order('vencimento', { ascending: true })

      if (companyId) {
        qE = qE.eq('company_id', companyId)
        qS = qS.eq('company_id', companyId)
      }

      const [{ data: e }, { data: s }] = await Promise.all([qE, qS])
      setEntradas(e || [])
      setSaidas(s || [])
    } catch (err) {
      console.error('Erro ao carregar previsibilidade:', err)
    } finally {
      setLoading(false)
    }
  }, [companyId, horizon])

  useEffect(() => { loadData() }, [loadData])

  // ── derived ──
  const t0  = today()
  const t30 = addDays(t0, 30)
  const t60 = addDays(t0, 60)
  const t90 = addDays(t0, 90)

  const sumPeriod = (rows, from, to) =>
    rows.filter(r => r.vencimento >= from && r.vencimento <= to)
        .reduce((s, r) => s + (r.valor || 0), 0)

  const totalReceber = entradas.reduce((s, r) => s + (r.valor || 0), 0)
  const totalPagar   = saidas.reduce((s, r) => s + (r.valor || 0), 0)
  const saldoLiquido = totalReceber - totalPagar

  const t31 = addDays(t0, 31)
  const t61 = addDays(t0, 61)
  const periodos = [
    { label: '1 – 30 dias',  receber: sumPeriod(entradas, t0, t30), pagar: sumPeriod(saidas, t0, t30) },
    { label: '31 – 60 dias', receber: sumPeriod(entradas, t31, t60), pagar: sumPeriod(saidas, t31, t60) },
    { label: '61 – 90 dias', receber: sumPeriod(entradas, t61, t90), pagar: sumPeriod(saidas, t61, t90) },
  ]

  // Chart: agrupado por mês
  const buildMonthChart = () => {
    const map = {}
    const addRow = (rows, type) => {
      rows.forEach(r => {
        const k = monthLabel(r.vencimento)
        if (!map[k]) map[k] = { mes: k, receber: 0, pagar: 0 }
        map[k][type] += r.valor || 0
      })
    }
    addRow(entradas, 'receber')
    addRow(saidas, 'pagar')
    // sort by date
    return Object.values(map).sort((a, b) => {
      const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
      const [ma, ya] = a.mes.split('/')
      const [mb, yb] = b.mes.split('/')
      return ya !== yb ? ya - yb : months.indexOf(ma) - months.indexOf(mb)
    })
  }

  const chartData = buildMonthChart()

  // ── custom tooltip ──
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-bold text-gray-800 mb-2">{label}</p>
        {payload.map(p => (
          <div key={p.name} className="flex items-center gap-2">
            <span style={{ color: p.fill }} className="font-medium">{p.name}:</span>
            <span className="text-gray-700">{fmtCurrency(p.value)}</span>
          </div>
        ))}
        {payload.length === 2 && (
          <div className="mt-1 pt-1 border-t border-gray-100 flex items-center gap-2">
            <span className="text-gray-500">Saldo:</span>
            <span className={`font-bold ${(payload[0].value - payload[1].value) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {fmtCurrency(payload[0].value - payload[1].value)}
            </span>
          </div>
        )}
      </div>
    )
  }

  // ── card summary ──
  const SummaryCard = ({ icon: Icon, label, value, color, sub }) => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{fmtCurrency(value)}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )

  // ── period bar ──
  const PeriodBar = ({ label, receber, pagar }) => {
    const saldo = receber - pagar
    const max = Math.max(receber, pagar, 1)
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-gray-700">{label}</span>
          <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${saldo >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {fmtCurrency(saldo)}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16">Receber</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(receber / max) * 100}%` }} />
            </div>
            <span className="text-xs font-medium text-gray-700 w-24 text-right">{fmtCurrency(receber)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16">Pagar</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div className="bg-red-400 h-full rounded-full" style={{ width: `${(pagar / max) * 100}%` }} />
            </div>
            <span className="text-xs font-medium text-gray-700 w-24 text-right">{fmtCurrency(pagar)}</span>
          </div>
        </div>
      </div>
    )
  }

  // ── table rows ──
  const tableRows = (activeTab === 'receber' ? entradas : saidas)
    .slice(0, 50)

  // ── render ──
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-0.5">
              Relatórios Financeiros Estratégicos
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary-600" />
              Previsibilidade de Caixa
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Contas a pagar vs receber · Projeção 30/60/90 dias</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 self-start sm:self-auto"
          >
            {loading ? <Loader className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Atualizar
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Filtros */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex flex-wrap gap-4 items-end">

            {/* Horizonte */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Horizonte</label>
              <div className="flex gap-2">
                {[30, 60, 90].map(d => (
                  <button
                    key={d}
                    onClick={() => setHorizon(d)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      horizon === d ? 'bg-primary-500 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {d} dias
                  </button>
                ))}
              </div>
            </div>

            {/* Empresa (super admin) */}
            {isSuperAdmin && (
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  <Building2 className="h-3 w-3 inline mr-1" />Empresa
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowCompanyDrop(v => !v)}
                    className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <span>{companyName}</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                  {showCompanyDrop && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                      <button
                        onClick={() => { setSelectedCompany('all'); setShowCompanyDrop(false) }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${selectedCompany === 'all' ? 'font-semibold text-primary-600' : 'text-gray-700'}`}
                      >
                        Todas as Empresas
                      </button>
                      {companies.map(c => (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedCompany(c.id); setShowCompanyDrop(false) }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${selectedCompany === c.id ? 'font-semibold text-primary-600' : 'text-gray-700'}`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader className="h-8 w-8 animate-spin text-primary-500" />
            <p className="text-gray-500 text-sm">Carregando previsão de caixa...</p>
          </div>
        ) : (
          <>
            {/* Cards de resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryCard
                icon={ArrowUpCircle}
                label="Total a Receber"
                value={totalReceber}
                color="bg-emerald-500"
                sub={`Próximos ${horizon} dias · ${entradas.length} lançamento${entradas.length !== 1 ? 's' : ''}`}
              />
              <SummaryCard
                icon={ArrowDownCircle}
                label="Total a Pagar"
                value={totalPagar}
                color="bg-red-500"
                sub={`Próximos ${horizon} dias · ${saidas.length} lançamento${saidas.length !== 1 ? 's' : ''}`}
              />
              <SummaryCard
                icon={saldoLiquido >= 0 ? TrendingUp : TrendingDown}
                label="Saldo Projetado"
                value={saldoLiquido}
                color={saldoLiquido >= 0 ? 'bg-blue-500' : 'bg-amber-500'}
                sub={saldoLiquido >= 0 ? 'Caixa positivo no período' : 'Atenção: déficit projetado'}
              />
            </div>

            {/* Projeção 30/60/90 dias */}
            <div>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                Projeção por Período
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {periodos.map(p => (
                  <PeriodBar key={p.label} {...p} />
                ))}
              </div>
            </div>

            {/* Gráfico mensal */}
            {chartData.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
                  Fluxo Mensal Projetado
                </h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      formatter={v => <span style={{ fontSize: 12, color: '#374151' }}>{v}</span>}
                    />
                    <ReferenceLine y={0} stroke="#e5e7eb" />
                    <Bar dataKey="receber" name="A Receber" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pagar"   name="A Pagar"   fill="#f87171" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Tabela de lançamentos */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Tab header */}
              <div className="border-b border-gray-200 px-5 flex gap-0">
                <button
                  onClick={() => setActiveTab('receber')}
                  className={`py-4 px-5 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === 'receber'
                      ? 'border-emerald-500 text-emerald-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  A Receber
                  <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
                    {entradas.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('pagar')}
                  className={`py-4 px-5 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === 'pagar'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  A Pagar
                  <span className="ml-2 text-xs bg-red-100 text-red-600 rounded-full px-2 py-0.5">
                    {saidas.length}
                  </span>
                </button>
              </div>

              {tableRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                  <AlertCircle className="h-8 w-8" />
                  <p className="text-sm">Nenhum lançamento encontrado para o período selecionado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                        <th className="text-left px-5 py-3 font-semibold">Vencimento</th>
                        <th className="text-left px-5 py-3 font-semibold">Dias</th>
                        <th className="text-right px-5 py-3 font-semibold">Valor</th>
                        <th className="text-left px-5 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tableRows.map((row, i) => {
                        const diff = Math.round((new Date(row.vencimento + 'T00:00:00') - new Date(today() + 'T00:00:00')) / 86400000)
                        const isUrgent = diff <= 7
                        const isWarning = diff > 7 && diff <= 30
                        return (
                          <tr key={row.id || i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3 font-medium text-gray-800">{fmtDate(row.vencimento)}</td>
                            <td className="px-5 py-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                isUrgent ? 'bg-red-100 text-red-700' :
                                isWarning ? 'bg-amber-100 text-amber-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {diff === 0 ? 'hoje' : `+${diff}d`}
                              </span>
                            </td>
                            <td className={`px-5 py-3 text-right font-semibold ${
                              activeTab === 'receber' ? 'text-emerald-700' : 'text-red-600'
                            }`}>
                              {fmtCurrency(row.valor)}
                            </td>
                            <td className="px-5 py-3">
                              {isUrgent ? (
                                <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                                  <AlertCircle className="h-3.5 w-3.5" /> Urgente
                                </span>
                              ) : isWarning ? (
                                <span className="text-xs text-amber-600 font-medium">Atenção</span>
                              ) : (
                                <span className="text-xs text-gray-400">Normal</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {tableRows.length === 50 && (
                    <p className="text-xs text-gray-400 text-center py-3 border-t border-gray-100">
                      Mostrando os primeiros 50 lançamentos
                    </p>
                  )}
                </div>
              )}
            </div>

          </>
        )}

      </div>
    </div>
  )
}
