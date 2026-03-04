import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine, ResponsiveContainer, Area, AreaChart
} from 'recharts'
import {
  BarChart3, TrendingUp, TrendingDown, Target, Filter,
  RefreshCw, Loader, FileText, ChevronLeft, ChevronRight,
  Award, AlertCircle, CheckCircle2, Minus, ArrowUpRight, ArrowDownRight, Download
} from 'lucide-react'

// ── constants ─────────────────────────────────────────────────────────────────

const MONTHS     = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
const MONTH_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const JOURNEY_COLORS = {
  'Estratégia':       '#EBA500',
  'Financeira':       '#10b981',
  'Receita':          '#3b82f6',
  'Pessoas & Cultura':'#8b5cf6',
  'Operacional':      '#f59e0b',
}

const JOURNEY_BG = {
  'Estratégia':       'bg-amber-50 text-amber-700 border-amber-200',
  'Financeira':       'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Receita':          'bg-blue-50 text-blue-700 border-blue-200',
  'Pessoas & Cultura':'bg-purple-50 text-purple-700 border-purple-200',
  'Operacional':      'bg-orange-50 text-orange-700 border-orange-200',
}

const JOURNEYS = ['Todas', 'Estratégia', 'Financeira', 'Receita', 'Pessoas & Cultura', 'Operacional']

// ── helpers ───────────────────────────────────────────────────────────────────

function parseNum(v) {
  if (v === null || v === undefined || v === '') return null
  const n = parseFloat(String(v).replace(/[^0-9.,\-]/g, '').replace(',', '.'))
  return isNaN(n) ? null : n
}

// Linear regression → returns array of {trend} for each month index
function computeTrend(points) {
  const pts = points.map((v, i) => ({ x: i, y: v })).filter(p => p.y !== null)
  if (pts.length < 2) return null
  const n = pts.length
  const sx  = pts.reduce((s, p) => s + p.x, 0)
  const sy  = pts.reduce((s, p) => s + p.y, 0)
  const sxy = pts.reduce((s, p) => s + p.x * p.y, 0)
  const sx2 = pts.reduce((s, p) => s + p.x * p.x, 0)
  const denom = n * sx2 - sx * sx
  if (denom === 0) return null
  const m = (n * sxy - sx * sy) / denom
  const b = (sy - m * sx) / n
  return points.map((_, i) => parseFloat((m * i + b).toFixed(2)))
}

function pctAttain(value, meta) {
  const v = parseNum(value), m = parseNum(meta)
  if (v === null || m === null || m === 0) return null
  return Math.round((v / m) * 100)
}

function attainColor(pct, polarity = 'positive') {
  if (pct === null) return { dot: 'bg-gray-200', text: 'text-gray-400', bar: 'bg-gray-200' }
  const isNeg = polarity === 'negative'
  const good  = isNeg ? pct <= 100 : pct >= 100
  const mid   = isNeg ? pct <= 120 : pct >= 80
  if (good) return { dot: 'bg-emerald-500', text: 'text-emerald-600', bar: 'bg-emerald-500' }
  if (mid)  return { dot: 'bg-amber-400',   text: 'text-amber-600',   bar: 'bg-amber-400' }
  return           { dot: 'bg-red-400',    text: 'text-red-500',    bar: 'bg-red-400' }
}

function cellClass(pct, polarity = 'positive') {
  if (pct === null) return ''
  const isNeg = polarity === 'negative'
  const good  = isNeg ? pct <= 100 : pct >= 100
  const mid   = isNeg ? pct <= 120 : pct >= 80
  if (good) return 'bg-emerald-50 text-emerald-700 font-semibold'
  if (mid)  return 'bg-amber-50 text-amber-700 font-semibold'
  return 'bg-red-50 text-red-600 font-semibold'
}

function badgeClass(pct, polarity = 'positive') {
  if (pct === null) return ''
  const isNeg = polarity === 'negative'
  const good  = isNeg ? pct <= 100 : pct >= 100
  const mid   = isNeg ? pct <= 120 : pct >= 80
  if (good) return 'bg-emerald-100 text-emerald-700'
  if (mid)  return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-600'
}

function fmtValue(v, type) {
  const n = parseNum(v)
  if (n === null) return '–'
  if (type === 'Monetário' || type === 'Financeiro')
    return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  if (type === 'Percentual') return `${n}%`
  if (type === 'Dias') return `${n} dias`
  return String(n)
}

// Custom tooltip
function ChartTooltip({ active, payload, label, meta, type }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map(entry => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
          <span className="text-gray-500 capitalize">{entry.name}:</span>
          <span className="font-bold text-gray-900">
            {entry.value !== null && entry.value !== undefined
              ? fmtValue(entry.value, type)
              : '–'}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── small components ──────────────────────────────────────────────────────────

function SummaryCard({ icon: Icon, iconCls, value, label, sub, border }) {
  return (
    <div className={`bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border-2 ${border} flex flex-col gap-1`}>
      <div className={`p-2 rounded-xl w-fit ${iconCls} mb-1`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-xs sm:text-sm font-semibold text-gray-700">{label}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function RelatorioEvolucaoKPIsPage() {
  const { profile } = useAuth()

  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [journeyFilter, setJourneyFilter] = useState('Todas')
  const [selectedIndicatorId, setSelectedIndicatorId] = useState(null)

  const [indicators, setIndicators] = useState([])
  const [companyData, setCompanyData] = useState([])   // company_indicators rows
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)

  // ── resolve company id ───────────────────────────────────────────────────────

  const companyId = useMemo(() => {
    if (profile?.company_id) return profile.company_id
    const active = profile?.user_companies?.find(uc => uc.is_active)
    return active?.company_id || profile?.user_companies?.[0]?.company_id || null
  }, [profile])

  // ── data loading ─────────────────────────────────────────────────────────────

  const loadData = useCallback(async (showRefresh = false) => {
    if (!companyId) return
    if (showRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const [{ data: inds, error: e1 }, { data: cd, error: e2 }] = await Promise.all([
        supabase
          .from('management_indicators')
          .select('id, name, journey, type, meta, polarity, is_active')
          .eq('company_id', companyId)
          .eq('is_active', true)
          .order('journey')
          .order('name'),
        supabase
          .from('company_indicators')
          .select('*')
          .eq('company_id', companyId)
          .eq('year', selectedYear)
      ])

      if (e1) throw e1
      if (e2) throw e2

      setIndicators(inds || [])
      setCompanyData(cd || [])

      // Auto-select first indicator if none selected or selection gone
      if (inds?.length) {
        setSelectedIndicatorId(prev => {
          if (prev && inds.find(i => i.id === prev)) return prev
          return inds[0].id
        })
      }
    } catch (err) {
      console.error('Erro ao carregar KPIs:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [companyId, selectedYear])

  useEffect(() => { loadData() }, [loadData])

  // ── derived data ─────────────────────────────────────────────────────────────

  // Map indicator_id → company_indicators row
  const cdMap = useMemo(() => {
    const m = {}
    companyData.forEach(r => { m[r.indicator_id] = r })
    return m
  }, [companyData])

  const filteredIndicators = useMemo(() =>
    journeyFilter === 'Todas'
      ? indicators
      : indicators.filter(i => i.journey === journeyFilter),
    [indicators, journeyFilter]
  )

  // Summary stats
  const stats = useMemo(() => {
    let above = 0, below = 0, onTrack = 0, dataCount = 0
    indicators.forEach(ind => {
      const row = cdMap[ind.id]
      if (!row) return
      // Use latest month that has data
      const values = MONTHS.map(m => parseNum(row[m])).filter(v => v !== null)
      if (!values.length) return
      dataCount++
      const latest = values[values.length - 1]
      const pct = pctAttain(latest, ind.meta)
      if (pct === null) return
      const isNeg = ind.polarity === 'negative'
      const good  = isNeg ? pct <= 100 : pct >= 100
      const mid   = isNeg ? pct <= 120 : pct >= 80
      if (good) above++
      else if (mid) onTrack++
      else below++
    })
    const avgAttain = dataCount === 0 ? null : Math.round(
      indicators
        .map(ind => {
          const row = cdMap[ind.id]
          if (!row) return null
          const vals = MONTHS.map(m => parseNum(row[m])).filter(v => v !== null)
          if (!vals.length) return null
          return pctAttain(vals[vals.length - 1], ind.meta)
        })
        .filter(v => v !== null)
        .reduce((s, v, _, a) => s + v / a.length, 0)
    )
    return { above, onTrack, below, avgAttain, total: indicators.length }
  }, [indicators, cdMap])

  // Selected indicator data for chart
  const selectedIndicator = useMemo(() =>
    indicators.find(i => i.id === selectedIndicatorId) || null,
    [indicators, selectedIndicatorId]
  )

  const chartData = useMemo(() => {
    if (!selectedIndicator) return []
    const row = cdMap[selectedIndicator.id]
    const metaNum = parseNum(selectedIndicator.meta)
    const rawValues = MONTHS.map(m => (row ? parseNum(row[m]) : null))
    const trendArr = computeTrend(rawValues)

    return MONTHS.map((m, i) => ({
      month: MONTH_LABELS[i],
      valor: rawValues[i],
      meta: metaNum,
      tendencia: trendArr ? trendArr[i] : null,
    }))
  }, [selectedIndicator, cdMap])

  // Trend direction for selected indicator
  const trendDir = useMemo(() => {
    if (!selectedIndicator) return null
    const row = cdMap[selectedIndicator.id]
    if (!row) return null
    const vals = MONTHS.map(m => parseNum(row[m])).filter(v => v !== null)
    if (vals.length < 2) return null
    const diff = vals[vals.length - 1] - vals[0]
    return diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat'
  }, [selectedIndicator, cdMap])

  // ── export PDF ─────────────────────────────────────────────────────────────

  const exportarPDF = async () => {
    setExporting(true)
    try {
      let companyName = 'Empresa'
      let logoUrl = null
      if (companyId) {
        const { data: comp } = await supabase
          .from('companies')
          .select('name, logo_url')
          .eq('id', companyId)
          .single()
        if (comp) {
          companyName = comp.name || 'Empresa'
          logoUrl = comp.logo_url || null
        }
      }

      const geradoEm = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

      // Logo → base64
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

      const statBox = (value, label, color) => `
        <div style="flex:1;min-width:110px;background:#2a2828;border:1px solid ${color}33;border-radius:10px;padding:14px 10px;text-align:center">
          <div style="font-size:26px;font-weight:900;color:${color};line-height:1">${value}</div>
          <div style="font-size:10px;color:#aaa;margin-top:6px;text-transform:uppercase;letter-spacing:.5px">${label}</div>
        </div>`

      const attainBg  = (pct, polarity = 'positive') => { if (pct === null) return '#333'; const isNeg = polarity === 'negative'; const good = isNeg ? pct <= 100 : pct >= 100; const mid = isNeg ? pct <= 120 : pct >= 80; return good ? '#14532d' : mid ? '#78350f' : '#7f1d1d' }
      const attainClr = (pct, polarity = 'positive') => { if (pct === null) return '#555'; const isNeg = polarity === 'negative'; const good = isNeg ? pct <= 100 : pct >= 100; const mid = isNeg ? pct <= 120 : pct >= 80; return good ? '#4ade80' : mid ? '#fbbf24' : '#f87171' }

      const journeyColor = (j) => ({
        'Estratégia': '#EBA500', 'Financeira': '#10b981', 'Receita': '#3b82f6',
        'Pessoas & Cultura': '#8b5cf6', 'Operacional': '#f59e0b'
      })[j] || '#EBA500'

      const tableRows = indicators.map((ind, i) => {
        const row = cdMap[ind.id]
        const vals = MONTHS.map(m => (row ? parseNum(row[m]) : null))
        const latestVal = vals.filter(v => v !== null).slice(-1)[0] ?? null
        const attp = pctAttain(latestVal, ind.meta)
        const rowBg = i % 2 === 0 ? '#252323' : '#2a2828'
        const jc = journeyColor(ind.journey)
        const monthCells = vals.map(v => {
          const a = pctAttain(v, ind.meta)
          const bg = a === null ? 'transparent' : attainBg(a, ind.polarity) + '44'
          const cl = attainClr(a, ind.polarity)
          return `<td style="padding:5px 4px;text-align:center;font-size:9px;font-weight:${v!==null?'600':'400'};color:${cl};background:${bg}">${v !== null ? fmtValue(v, ind.type) : '–'}</td>`
        }).join('')
        return `<tr style="background:${rowBg}">
          <td style="padding:6px 8px;font-size:10px;font-weight:700;color:#e8e8e8;white-space:nowrap">
            <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${jc};margin-right:5px;vertical-align:middle"></span>${ind.name}
          </td>
          <td style="padding:5px 4px;text-align:center;font-size:9px;color:#888">${fmtValue(ind.meta, ind.type)}</td>
          ${monthCells}
          <td style="padding:5px 6px;text-align:center">
            ${attp !== null ? `<span style="background:${attainBg(attp, ind.polarity)};color:${attainClr(attp, ind.polarity)};font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px">${attp}%</span>` : '<span style="color:#555">–</span>'}
          </td>
        </tr>`
      }).join('')

      // ── Construir gráfico SVG programaticamente a partir dos dados ──────────
      let chartSvgHtml = ''
      if (selectedIndicator && chartData.length && !chartData.every(d => d.valor === null)) {
        const W = 720, H = 200
        const pad = { l: 56, r: 22, t: 16, b: 32 }
        const pw = W - pad.l - pad.r   // plot width
        const ph = H - pad.t - pad.b   // plot height

        const allNums = [
          ...chartData.map(d => d.valor).filter(v => v !== null),
          ...chartData.map(d => d.tendencia).filter(v => v !== null),
        ]
        const metaNum = parseNum(selectedIndicator.meta)
        if (metaNum !== null) allNums.push(metaNum)

        const rawMin = Math.min(...allNums)
        const rawMax = Math.max(...allNums)
        const range = rawMax - rawMin || 1
        const yMin = rawMin - range * 0.12
        const yMax = rawMax + range * 0.12

        const xOf = (i) => pad.l + (i / (MONTH_LABELS.length - 1)) * pw
        const yOf = (v) => pad.t + ph - ((v - yMin) / (yMax - yMin)) * ph

        const linePath = (points) => {
          const pts = points.map((v, i) => v !== null ? [xOf(i), yOf(v)] : null)
          let d = ''; let prevNull = true
          pts.forEach(p => {
            if (!p) { prevNull = true; return }
            d += prevNull ? `M${p[0].toFixed(1)},${p[1].toFixed(1)}` : `L${p[0].toFixed(1)},${p[1].toFixed(1)}`
            prevNull = false
          })
          return d
        }

        const trendPath = (() => {
          const pts = chartData.map((d, i) => d.tendencia !== null ? [xOf(i), yOf(d.tendencia)] : null).filter(Boolean)
          if (pts.length < 2) return ''
          return `M${pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L')}`
        })()

        const formatY = (v) => {
          if (Math.abs(v) >= 1000000) return `${(v/1000000).toFixed(1)}M`
          if (Math.abs(v) >= 1000) return `${(v/1000).toFixed(0)}k`
          return v % 1 === 0 ? String(v) : v.toFixed(1)
        }

        // Y-axis gridlines
        const gridSteps = 4
        const grids = Array.from({ length: gridSteps + 1 }, (_, i) => {
          const v = yMin + (yMax - yMin) * (i / gridSteps)
          const y = yOf(v).toFixed(1)
          return `<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" stroke="#3a3838" stroke-width="1" />
            <text x="${pad.l - 4}" y="${y}" text-anchor="end" dominant-baseline="middle" font-size="8" fill="#666">${formatY(v)}</text>`
        }).join('')

        // X-axis labels
        const xLabels = MONTH_LABELS.map((ml, i) =>
          `<text x="${xOf(i).toFixed(1)}" y="${H - 4}" text-anchor="middle" font-size="8" fill="#666">${ml}</text>`
        ).join('')

        // Meta reference line
        const metaLine = metaNum !== null ? (() => {
          const y = yOf(metaNum).toFixed(1)
          return `<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="6,3" />
            <text x="${W - pad.r + 3}" y="${y}" dominant-baseline="middle" font-size="8" fill="#9ca3af">Meta</text>`
        })() : ''

        // Dot circles for actual values
        const dots = chartData.map((d, i) => d.valor !== null
          ? `<circle cx="${xOf(i).toFixed(1)}" cy="${yOf(d.valor).toFixed(1)}" r="4" fill="${indicatorColor}" stroke="#1a1a1a" stroke-width="2" />`
          : ''
        ).join('')

        chartSvgHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;background:#1e1c1c;border-radius:6px">
          <rect width="${W}" height="${H}" fill="#1e1c1c" rx="6" />
          ${grids}
          ${xLabels}
          ${metaLine}
          ${trendPath ? `<path d="${trendPath}" fill="none" stroke="#f97316" stroke-width="2" stroke-dasharray="6,3" />` : ''}
          <path d="${linePath(chartData.map(d => d.valor))}" fill="none" stroke="${indicatorColor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
          ${dots}
        </svg>`
      }

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Evolução dos KPIs – ${companyName} – ${selectedYear}</title>
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
    .cover-section { text-align:center; padding:14px 0 12px; border-bottom:1px solid #EBA50033; margin-bottom:14px; }
    .report-title { font-size:18px; font-weight:900; color:#f0ece6; text-transform:uppercase; letter-spacing:2px; margin-bottom:10px; }
    .company-name { font-size:12px; font-weight:700; color:#EBA500; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
    .bg2-tag { display:inline-block; border:1px solid #EBA500; color:#EBA500; font-size:9px; font-weight:700; letter-spacing:1.5px; padding:3px 10px; border-radius:2px; }
    .year-badge { display:inline-block; background:#EBA50022; color:#EBA500; font-size:9px; font-weight:700; padding:3px 12px; border-radius:20px; margin-top:6px; }
    .section-title { font-size:9px; font-weight:700; color:#EBA500; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:10px; display:flex; align-items:center; gap:6px; }
    .section-title::after { content:''; flex:1; height:1px; background:#EBA50033; }
    .stats-row { display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
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
    <div class="cover-section">
      ${logoHtml}
      <div class="report-title">Relatório de Evolução dos KPIs</div>
      <div class="company-name">${companyName}</div>
      <div class="bg2-tag">BG2</div>
      <div><span class="year-badge">${selectedYear}</span></div>
      <div style="font-size:9px;color:#666;margin-top:6px">Gerado em ${geradoEm}</div>
    </div>
    <div class="section-title">Resumo de Performance</div>
    <div class="stats-row">
      ${statBox(stats.total, 'KPIs Ativos', '#EBA500')}
      ${statBox(stats.above, 'Acima da Meta', '#4ade80')}
      ${statBox(stats.onTrack, 'Em Acompanhamento', '#fbbf24')}
      ${statBox(stats.below, 'Abaixo da Meta', '#f87171')}
      ${statBox(stats.avgAttain !== null ? stats.avgAttain + '%' : '–', 'Atingimento Médio', stats.avgAttain !== null && stats.avgAttain >= 70 ? '#4ade80' : stats.avgAttain !== null && stats.avgAttain >= 40 ? '#fbbf24' : '#f87171')}
    </div>
    ${selectedIndicator && chartSvgHtml ? `
    <div class="section-title">Gráfico de Evolução — ${selectedIndicator.name}</div>
    <div style="background:#2a2828;border:1px solid #ffffff0f;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:11px;font-weight:700;color:#e8e8e8">${selectedIndicator.name}</span>
        <span style="font-size:9px;color:#888;border:1px solid #ffffff22;padding:2px 8px;border-radius:20px">${selectedIndicator.journey}</span>
      </div>
      <div style="display:flex;gap:16px;margin-bottom:8px;font-size:9px">
        <span style="display:flex;align-items:center;gap:4px"><span style="display:inline-block;width:10px;height:3px;background:${indicatorColor};border-radius:2px"></span><span style="color:#ccc">Valor Real</span></span>
        <span style="display:flex;align-items:center;gap:4px"><span style="display:inline-block;width:10px;height:3px;background:#f97316;border-radius:2px;opacity:.7"></span><span style="color:#ccc">Tendência</span></span>
        ${parseNum(selectedIndicator?.meta) !== null ? '<span style="display:flex;align-items:center;gap:4px"><span style="display:inline-block;width:10px;height:0px;border-top:2px dashed #d1d5db"></span><span style="color:#ccc">Meta</span></span>' : ''}
      </div>
      ${chartSvgHtml}
    </div>` : ''}
    <div class="section-title">Histórico Anual — ${indicators.length} KPI${indicators.length !== 1 ? 's' : ''}</div>
    <div style="background:#2a2828;border:1px solid #ffffff0f;border-radius:8px;overflow:hidden;margin-bottom:14px">
      <table>
        <thead>
          <tr style="background:#1a1a1a">
            <th style="padding:6px 8px;font-size:8px;color:#888;font-weight:700;text-transform:uppercase;text-align:left;min-width:140px">KPI</th>
            <th style="padding:6px 4px;font-size:8px;color:#888;font-weight:700;text-transform:uppercase;text-align:center;width:50px">Meta</th>
            ${MONTH_LABELS.map(ml => `<th style="padding:6px 4px;font-size:8px;color:#888;font-weight:700;text-transform:uppercase;text-align:center;width:42px">${ml}</th>`).join('')}
            <th style="padding:6px 6px;font-size:8px;color:#EBA500;font-weight:700;text-transform:uppercase;text-align:center;width:52px">Ating.</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
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

  const indicatorColor = selectedIndicator
    ? (JOURNEY_COLORS[selectedIndicator.journey] || '#EBA500')
    : '#EBA500'

  // Last value & attainment for selected indicator
  const selRow = selectedIndicator ? cdMap[selectedIndicator.id] : null
  const selValues = selRow ? MONTHS.map(m => parseNum(selRow[m])) : []
  const selLastVal = selValues.filter(v => v !== null).slice(-1)[0] ?? null
  const selAttain = pctAttain(selLastVal, selectedIndicator?.meta)
  const selColor = attainColor(selAttain)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                <BarChart3 className="h-5 w-5 text-[#EBA500]" />
              </div>
              <span className="text-xs font-semibold text-[#EBA500] tracking-widest uppercase">Relatório</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              Evolução dos KPIs
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Histórico de performance anual com análise de tendência mês a mês
            </p>
          </div>

          <div className="flex items-center gap-2 self-start">
            {/* Year selector */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl shadow-sm">
              <button
                onClick={() => setSelectedYear(y => y - 1)}
                className="p-2 hover:bg-gray-50 rounded-l-xl transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-gray-500" />
              </button>
              <span className="px-3 text-sm font-semibold text-gray-700 select-none min-w-[52px] text-center">
                {selectedYear}
              </span>
              <button
                onClick={() => setSelectedYear(y => Math.min(y + 1, currentYear))}
                disabled={selectedYear >= currentYear}
                className="p-2 hover:bg-gray-50 rounded-r-xl transition-colors disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Atualizando…' : 'Atualizar'}
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

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
          <SummaryCard icon={Target}       iconCls="bg-amber-50 text-[#EBA500]"     value={stats.total}      label="KPIs Ativos"        border="border-amber-200" />
          <SummaryCard icon={CheckCircle2} iconCls="bg-emerald-50 text-emerald-600" value={stats.above}      label="Acima da Meta"      border="border-emerald-200" sub={stats.total ? `${Math.round(stats.above/stats.total*100)}% do total` : undefined} />
          <SummaryCard icon={AlertCircle}  iconCls="bg-red-50 text-red-500"         value={stats.below}      label="Abaixo da Meta"     border="border-red-200"  sub={stats.total ? `${Math.round(stats.below/stats.total*100)}% do total` : undefined} />
          <SummaryCard icon={TrendingUp}   iconCls="bg-blue-50 text-blue-600"       value={stats.avgAttain !== null ? `${stats.avgAttain}%` : '–'} label="Atingimento Médio" border="border-blue-200" />
        </div>

        {/* ── Journey filter tabs ── */}
        <div className="flex flex-wrap gap-2 mb-5">
          {JOURNEYS.map(j => (
            <button
              key={j}
              onClick={() => setJourneyFilter(j)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all border ${
                journeyFilter === j
                  ? 'bg-[#EBA500] text-white border-[#EBA500] shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {j}
            </button>
          ))}
        </div>

        {indicators.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum KPI encontrado</h3>
            <p className="text-sm text-gray-500">
              Adicione indicadores em Indicadores de Gestão para visualizar a evolução.
            </p>
          </div>
        ) : (
          <>
            {/* ── KPI selector + detail chart ── */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-5 sm:mb-6">

              {/* KPI selector */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <span className="text-xs sm:text-sm font-semibold text-gray-600">KPI:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {filteredIndicators.map(ind => (
                    <button
                      key={ind.id}
                      onClick={() => setSelectedIndicatorId(ind.id)}
                      title={ind.journey}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border truncate max-w-[200px] ${
                        selectedIndicatorId === ind.id
                          ? 'text-white shadow-sm border-transparent'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                      style={selectedIndicatorId === ind.id
                        ? { backgroundColor: JOURNEY_COLORS[ind.journey] || '#EBA500', borderColor: JOURNEY_COLORS[ind.journey] || '#EBA500' }
                        : {}
                      }
                    >
                      {ind.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected KPI header */}
              {selectedIndicator && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${JOURNEY_BG[selectedIndicator.journey] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {selectedIndicator.journey}
                      </span>
                      {trendDir === 'up' && selectedIndicator?.polarity !== 'negative' && <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600"><ArrowUpRight className="h-3.5 w-3.5" />Tendência positiva</span>}
                      {trendDir === 'down' && selectedIndicator?.polarity !== 'negative' && <span className="flex items-center gap-0.5 text-xs font-semibold text-red-500"><ArrowDownRight className="h-3.5 w-3.5" />Tendência negativa</span>}
                      {trendDir === 'down' && selectedIndicator?.polarity === 'negative' && <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600"><ArrowDownRight className="h-3.5 w-3.5" />Tendência positiva</span>}
                      {trendDir === 'up' && selectedIndicator?.polarity === 'negative' && <span className="flex items-center gap-0.5 text-xs font-semibold text-red-500"><ArrowUpRight className="h-3.5 w-3.5" />Tendência negativa</span>}
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedIndicator.name}</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    {selLastVal !== null && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Último valor</p>
                        <p className="text-xl font-bold text-gray-900">{fmtValue(selLastVal, selectedIndicator.type)}</p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Meta</p>
                      <p className="text-xl font-bold text-gray-700">{fmtValue(selectedIndicator.meta, selectedIndicator.type)}</p>
                    </div>
                    {selAttain !== null && (
                      <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl font-bold text-sm flex-shrink-0 ${
                        (() => { const isNeg = selectedIndicator?.polarity === 'negative'; const g = isNeg ? selAttain <= 100 : selAttain >= 100; const m = isNeg ? selAttain <= 120 : selAttain >= 80; return g ? 'bg-emerald-50 text-emerald-600' : m ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500' })()
                      }`}>
                        <span className="text-xl font-extrabold leading-none">{selAttain}%</span>
                        <span className="text-[10px] font-semibold mt-0.5 opacity-70">ating.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Chart */}
              {selectedIndicator ? (
                chartData.every(d => d.valor === null) ? (
                  <div className="py-12 text-center">
                    <Minus className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Nenhum dado registrado para este KPI em {selectedYear}</p>
                  </div>
                ) : (
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11, fill: '#9ca3af' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#9ca3af' }}
                          axisLine={false}
                          tickLine={false}
                          width={40}
                        />
                        <Tooltip content={<ChartTooltip type={selectedIndicator?.type} />} />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                        />

                        {/* Meta reference line */}
                        {parseNum(selectedIndicator?.meta) !== null && (
                          <ReferenceLine
                            y={parseNum(selectedIndicator.meta)}
                            stroke="#d1d5db"
                            strokeDasharray="6 3"
                            strokeWidth={1.5}
                            label={{ value: 'Meta', position: 'right', fontSize: 10, fill: '#9ca3af' }}
                          />
                        )}

                        {/* Trend line */}
                        <Line
                          type="monotone"
                          dataKey="tendencia"
                          name="Tendência"
                          stroke="#f97316"
                          strokeWidth={2.5}
                          strokeDasharray="6 3"
                          dot={false}
                          activeDot={{ r: 5, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
                          connectNulls
                        />

                        {/* Actual values */}
                        <Line
                          type="monotone"
                          dataKey="valor"
                          name="Valor Real"
                          stroke={indicatorColor}
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: indicatorColor, strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, fill: indicatorColor, stroke: '#fff', strokeWidth: 2 }}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )
              ) : (
                <div className="py-12 text-center text-sm text-gray-400">Selecione um KPI acima</div>
              )}
            </div>

            {/* ── Annual performance table ── */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-800">
                  Histórico Anual {selectedYear} — todos os KPIs
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Clique em um KPI para ver o gráfico detalhado
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider min-w-[180px]">KPI</th>
                      <th className="px-2 py-3 text-center font-semibold text-gray-500 uppercase tracking-wider w-16">Meta</th>
                      {MONTH_LABELS.map(ml => (
                        <th key={ml} className="px-2 py-3 text-center font-semibold text-gray-500 uppercase tracking-wider w-12">{ml}</th>
                      ))}
                      <th className="px-3 py-3 text-center font-semibold text-gray-500 uppercase tracking-wider w-20">Ating.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredIndicators.map(ind => {
                      const row = cdMap[ind.id]
                      const vals = MONTHS.map(m => (row ? parseNum(row[m]) : null))
                      const latestVal = vals.filter(v => v !== null).slice(-1)[0] ?? null
                      const attain = pctAttain(latestVal, ind.meta)
                      const ac = attainColor(attain, ind.polarity)
                      const isSelected = selectedIndicatorId === ind.id
                      const jColor = JOURNEY_COLORS[ind.journey] || '#EBA500'

                      return (
                        <tr
                          key={ind.id}
                          onClick={() => setSelectedIndicatorId(ind.id)}
                          className={`cursor-pointer transition-colors ${isSelected ? 'bg-amber-50/40' : 'hover:bg-gray-50/60'}`}
                        >
                          {/* KPI name */}
                          <td className={`sticky left-0 z-10 px-4 py-3 ${isSelected ? 'bg-amber-50/40' : 'bg-white'}`}>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ background: jColor }}
                              />
                              <span className="font-semibold text-gray-900 truncate max-w-[140px]" title={ind.name}>{ind.name}</span>
                            </div>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border mt-0.5 inline-block ${JOURNEY_BG[ind.journey] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                              {ind.journey}
                            </span>
                          </td>

                          {/* Meta */}
                          <td className="px-2 py-3 text-center text-gray-500 font-medium">
                            {fmtValue(ind.meta, ind.type)}
                          </td>

                          {/* Monthly values */}
                          {vals.map((v, i) => {
                            const a = pctAttain(v, ind.meta)
                            const cellColor = cellClass(a, ind.polarity)
                            return (
                              <td key={i} className={`px-1 py-3 text-center rounded ${cellColor}`}>
                                {v !== null ? fmtValue(v, ind.type) : <span className="text-gray-300">–</span>}
                              </td>
                            )
                          })}

                          {/* Attainment */}
                          <td className="px-3 py-3 text-center">
                            {attain !== null ? (
                              <span className={`inline-flex items-center justify-center px-2 py-1 rounded-lg font-bold text-xs ${badgeClass(attain, ind.polarity)}`}>
                                {attain}%
                              </span>
                            ) : <span className="text-gray-300">–</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
