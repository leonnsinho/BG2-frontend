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
  ArrowUpCircle, ArrowDownCircle, Wallet, ChevronDown, Download
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
  const [exporting, setExporting]   = useState(false)

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

  // ── export PDF ──────────────────────────────────────────────────────────────
  const exportarPDF = async () => {
    setExporting(true)
    try {
      let logoUrl = null
      let fetchedCompanyName = companyName
      if (companyId) {
        const { data: comp } = await supabase
          .from('companies')
          .select('name, logo_url')
          .eq('id', companyId)
          .single()
        if (comp) {
          fetchedCompanyName = comp.name || companyName
          logoUrl = comp.logo_url || null
        }
      }

      const geradoEm = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

      let logoBase64 = null
      if (logoUrl) {
        try {
          const { data: signedData } = await supabase.storage
            .from('company-avatars')
            .createSignedUrl(logoUrl, 3600)
          if (signedData?.signedUrl) {
            const resp = await fetch(signedData.signedUrl)
            const blob = await resp.blob()
            logoBase64 = await new Promise((res) => {
              const reader = new FileReader()
              reader.onloadend = () => res(reader.result)
              reader.readAsDataURL(blob)
            })
          }
        } catch { logoBase64 = null }
      }

      const logoHtml = logoBase64
        ? `<img src="${logoBase64}" alt="logo" style="max-height:54px;max-width:160px;object-fit:contain;margin-bottom:10px" />`
        : ''

      const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

      const statBox = (value, label, color) =>
        `<div style="flex:1;min-width:120px;background:#2a2828;border:1px solid ${color}33;border-radius:10px;padding:14px 10px;text-align:center">
          <div style="font-size:13px;font-weight:900;color:${color};line-height:1.2">${value}</div>
          <div style="font-size:10px;color:#aaa;margin-top:6px;text-transform:uppercase;letter-spacing:.5px">${label}</div>
        </div>`

      // Period rows
      const periodRows = periodos.map(p => {
        const s = p.receber - p.pagar
        const sc = s >= 0 ? '#4ade80' : '#f87171'
        return `<tr>
          <td style="padding:8px 10px;font-size:11px;font-weight:600;color:#e8e8e8">${p.label}</td>
          <td style="padding:8px 10px;text-align:right;font-size:11px;font-weight:700;color:#4ade80">${fmt(p.receber)}</td>
          <td style="padding:8px 10px;text-align:right;font-size:11px;font-weight:700;color:#f87171">${fmt(p.pagar)}</td>
          <td style="padding:8px 10px;text-align:right;font-size:12px;font-weight:900;color:${sc}">${fmt(s)}</td>
        </tr>`
      }).join('')

      // SVG bar chart from chartData
      let chartSvgHtml = ''
      if (chartData.length > 0) {
        const W = 700, H = 180
        const pad = { l: 68, r: 18, t: 14, b: 30 }
        const pw = W - pad.l - pad.r
        const ph = H - pad.t - pad.b
        const n = chartData.length
        const maxVal = Math.max(...chartData.flatMap(d => [d.receber, d.pagar]), 1)
        const yMax = maxVal * 1.1
        const barW = Math.max(6, (pw / n) * 0.35)
        const gap  = pw / n
        const yOf  = (v) => pad.t + ph - (v / yMax) * ph
        const fmtY = (v) => v >= 1000000 ? `R$${(v/1000000).toFixed(1)}M` : `R$${(v/1000).toFixed(0)}k`
        const gridSteps = 4
        const grids = Array.from({ length: gridSteps + 1 }, (_, i) => {
          const v = (yMax / gridSteps) * i
          const y = yOf(v).toFixed(1)
          return `<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" stroke="#3a3838" stroke-width="1"/>
            <text x="${pad.l - 4}" y="${y}" text-anchor="end" dominant-baseline="middle" font-size="8" fill="#666">${fmtY(v)}</text>`
        }).join('')
        const bars = chartData.map((d, i) => {
          const cx = pad.l + gap * i + gap / 2
          const rH = (d.receber / yMax) * ph
          const pH = (d.pagar / yMax) * ph
          return `<rect x="${(cx - barW - 2).toFixed(1)}" y="${(pad.t + ph - rH).toFixed(1)}" width="${barW.toFixed(1)}" height="${rH.toFixed(1)}" fill="#10b981" rx="2"/>
            <rect x="${(cx + 2).toFixed(1)}" y="${(pad.t + ph - pH).toFixed(1)}" width="${barW.toFixed(1)}" height="${pH.toFixed(1)}" fill="#f87171" rx="2"/>
            <text x="${cx.toFixed(1)}" y="${H - 4}" text-anchor="middle" font-size="8" fill="#666">${d.mes}</text>`
        }).join('')
        chartSvgHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;background:#1e1c1c;border-radius:6px">
          <rect width="${W}" height="${H}" fill="#1e1c1c" rx="6"/>
          ${grids}
          ${bars}
          <rect x="${pad.l + 8}" y="${pad.t}" width="8" height="8" fill="#10b981" rx="2"/>
          <text x="${pad.l + 20}" y="${pad.t + 7}" font-size="8" fill="#ccc">A Receber</text>
          <rect x="${pad.l + 80}" y="${pad.t}" width="8" height="8" fill="#f87171" rx="2"/>
          <text x="${pad.l + 92}" y="${pad.t + 7}" font-size="8" fill="#ccc">A Pagar</text>
        </svg>`
      }

      // Entries table (first 25 of each)
      const makeRows = (rows, isReceber) => rows.slice(0, 25).map((r, i) => {
        const diff = Math.round((new Date(r.vencimento + 'T00:00:00') - new Date(today() + 'T00:00:00')) / 86400000)
        const bg = i % 2 === 0 ? '#252323' : '#2a2828'
        const urg = diff <= 7 ? '#f87171' : diff <= 30 ? '#fbbf24' : '#888'
        const [y, m, d] = r.vencimento.split('-')
        return `<tr style="background:${bg}">
          <td style="padding:5px 8px;font-size:10px;color:#ccc">${d}/${m}/${y}</td>
          <td style="padding:5px 8px;font-size:10px;color:${urg};font-weight:600">${diff === 0 ? 'hoje' : `+${diff}d`}</td>
          <td style="padding:5px 8px;text-align:right;font-size:10px;font-weight:700;color:${isReceber ? '#4ade80' : '#f87171'}">${fmt(r.valor)}</td>
        </tr>`
      }).join('')

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Previsibilidade de Caixa – ${fetchedCompanyName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&family=EB+Garamond:ital@1&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; color-adjust:exact !important; }
    @page { size: A4 landscape; margin: 0; }
    html { background:#373535 !important; }
    body { font-family:'Inter',sans-serif; background-color:#373535 !important; color:#e8e8e8; min-height:100vh; }
    .page { min-height:100vh; padding:18px; display:flex; flex-direction:column; background-color:#373535 !important; }
    .frame { flex:1; border:1.5px solid #EBA500; border-radius:4px; display:flex; flex-direction:column; padding:14px 20px; }
    .top-bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid #EBA50033; }
    .top-bar span { font-size:10px; color:#EBA500; font-weight:300; letter-spacing:.5px; }
    .cover { text-align:center; padding:14px 0 12px; border-bottom:1px solid #EBA50033; margin-bottom:14px; }
    .report-title { font-size:18px; font-weight:900; color:#f0ece6; text-transform:uppercase; letter-spacing:2px; margin-bottom:10px; }
    .company-name { font-size:12px; font-weight:700; color:#EBA500; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
    .bg2-tag { display:inline-block; border:1px solid #EBA500; color:#EBA500; font-size:9px; font-weight:700; letter-spacing:1.5px; padding:3px 10px; border-radius:2px; }
    .badge { display:inline-block; background:#EBA50022; color:#EBA500; font-size:9px; font-weight:600; padding:3px 10px; border-radius:20px; margin-top:6px; }
    .section-title { font-size:9px; font-weight:700; color:#EBA500; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:10px; display:flex; align-items:center; gap:6px; }
    .section-title::after { content:''; flex:1; height:1px; background:#EBA50033; }
    .stats-row { display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
    .two-col { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:14px; }
    .card { background:#2a2828; border:1px solid #ffffff0f; border-radius:8px; padding:12px 14px; }
    table { width:100%; border-collapse:collapse; }
    .footer { display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding-top:8px; border-top:1px solid #EBA50033; }
    .footer-left { font-size:9px; color:#9a9a9a; }
    .footer-right { font-size:10px; color:#9a9a9a; }
    .footer-right em { font-family:'EB Garamond',Georgia,serif; font-style:italic; font-size:12px; color:#ccc; }
    @media print { html,body { background-color:#373535 !important; } * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; } }
  </style>
</head>
<body style="background-color:#373535;color:#e8e8e8">
<div class="page" style="background-color:#373535">
  <div class="frame">
    <div class="top-bar"><span>bg2plan</span><span>Um jeito atraente de fazer gestão.</span></div>
    <div class="cover">
      ${logoHtml}
      <div class="report-title">Previsibilidade de Caixa</div>
      <div class="company-name">${fetchedCompanyName}</div>
      <div class="bg2-tag">BG2</div>
      <div><span class="badge">Próximos ${horizon} dias</span></div>
      <div style="font-size:9px;color:#666;margin-top:6px">Gerado em ${geradoEm}</div>
    </div>

    <div class="section-title">Resumo do Período</div>
    <div class="stats-row">
      ${statBox(fmt(totalReceber), 'A Receber', '#4ade80')}
      ${statBox(fmt(totalPagar), 'A Pagar', '#f87171')}
      ${statBox(fmt(saldoLiquido), 'Saldo Projetado', saldoLiquido >= 0 ? '#60a5fa' : '#f87171')}
      ${statBox(String(entradas.length), 'Entradas', '#4ade80')}
      ${statBox(String(saidas.length), 'Saídas', '#f87171')}
    </div>

    <div class="two-col">
      <div>
        <div class="section-title">Projeção por Período</div>
        <div class="card">
          <table>
            <thead><tr style="background:#1a1a1a">
              <th style="padding:6px 10px;font-size:9px;color:#888;font-weight:700;text-transform:uppercase;text-align:left">Período</th>
              <th style="padding:6px 8px;font-size:9px;color:#4ade80;font-weight:700;text-transform:uppercase;text-align:right">A Receber</th>
              <th style="padding:6px 8px;font-size:9px;color:#f87171;font-weight:700;text-transform:uppercase;text-align:right">A Pagar</th>
              <th style="padding:6px 8px;font-size:9px;color:#EBA500;font-weight:700;text-transform:uppercase;text-align:right">Saldo</th>
            </tr></thead>
            <tbody>${periodRows}</tbody>
          </table>
        </div>

        <div class="section-title" style="margin-top:12px">Laçamentos a Receber</div>
        <div class="card">
          <table>
            <thead><tr style="background:#1a1a1a">
              <th style="padding:5px 8px;font-size:9px;color:#888;font-weight:700;text-transform:uppercase;text-align:left">Vencimento</th>
              <th style="padding:5px 8px;font-size:9px;color:#888;font-weight:700;text-transform:uppercase;text-align:left">Dias</th>
              <th style="padding:5px 8px;font-size:9px;color:#4ade80;font-weight:700;text-transform:uppercase;text-align:right">Valor</th>
            </tr></thead>
            <tbody>${makeRows(entradas, true)}</tbody>
          </table>
          ${entradas.length > 25 ? `<p style="font-size:9px;color:#555;text-align:center;padding:5px">+ ${entradas.length - 25} não exibidos</p>` : ''}
        </div>
      </div>

      <div>
        ${chartSvgHtml ? `<div class="section-title">Fluxo Mensal Projetado</div><div class="card" style="margin-bottom:14px">${chartSvgHtml}</div>` : ''}
        <div class="section-title">Laçamentos a Pagar</div>
        <div class="card">
          <table>
            <thead><tr style="background:#1a1a1a">
              <th style="padding:5px 8px;font-size:9px;color:#888;font-weight:700;text-transform:uppercase;text-align:left">Vencimento</th>
              <th style="padding:5px 8px;font-size:9px;color:#888;font-weight:700;text-transform:uppercase;text-align:left">Dias</th>
              <th style="padding:5px 8px;font-size:9px;color:#f87171;font-weight:700;text-transform:uppercase;text-align:right">Valor</th>
            </tr></thead>
            <tbody>${makeRows(saidas, false)}</tbody>
          </table>
          ${saidas.length > 25 ? `<p style="font-size:9px;color:#555;text-align:center;padding:5px">+ ${saidas.length - 25} não exibidos</p>` : ''}
        </div>
      </div>
    </div>

    <div class="footer">
      <span class="footer-left">www.bg2plan.com.br</span>
      <span class="footer-right">Powered by <em>bossa</em></span>
    </div>
  </div>
</div>
<script>window.onload = () => { setTimeout(() => window.print(), 500) }<\/script>
</body></html>`

      const win = window.open('', '_blank')
      win.document.write(html)
      win.document.close()
    } catch (err) {
      console.error('Erro ao exportar PDF:', err)
    } finally {
      setExporting(false)
    }
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
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Atualizar
            </button>
            <button
              onClick={exportarPDF}
              disabled={exporting || loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#373535] text-[#EBA500] border border-[#EBA500]/60 rounded-xl text-sm font-medium hover:bg-[#2a2828] transition-all shadow-sm disabled:opacity-60"
            >
              {exporting ? <Loader className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Exportar PDF
            </button>
          </div>
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
