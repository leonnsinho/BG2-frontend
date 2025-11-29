import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Calendar, 
  Building2, 
  Target, 
  BarChart3,
  LineChart as LineChartIcon,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Download
} from 'lucide-react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { 
  getAllJourneySnapshots, 
  createAllJourneySnapshots,
  getCompanyMaturityStats 
} from '../../services/journeySnapshotService'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area,
  AreaChart
} from 'recharts'
import toast from 'react-hot-toast'

const CompanyMaturityProgressPage = () => {
  const { profile } = useAuth()
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [timeRange, setTimeRange] = useState('1month') // 1week, 1month, 1year, 5years
  const [journeys, setJourneys] = useState([])
  const [maturityData, setMaturityData] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProcesses: 0,
    matureProcesses: 0,
    inProgressProcesses: 0,
    pendingProcesses: 0,
    averageMaturity: 0,
    growthRate: 0
  })

  // Cores das jornadas
  const journeyColors = {
    'estrategica': '#3B82F6',
    'financeira': '#10B981',
    'pessoas-cultura': '#8B5CF6',
    'receita-crm': '#F59E0B',
    'operacional': '#EF4444'
  }

  useEffect(() => {
    loadCompanies()
    loadJourneys()
  }, [])

  useEffect(() => {
    if (selectedCompany) {
      loadMaturityData()
    }
  }, [selectedCompany, timeRange])

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setCompanies(data || [])
      
      // Selecionar primeira empresa por padrão
      if (data && data.length > 0) {
        setSelectedCompany(data[0])
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
    }
  }

  const loadJourneys = async () => {
    try {
      const { data, error } = await supabase
        .from('journeys')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setJourneys(data || [])
    } catch (error) {
      console.error('Erro ao carregar jornadas:', error)
    }
  }

  const loadMaturityData = async () => {
    if (!selectedCompany) return
    
    setLoading(true)
    try {
      // Calcular data inicial baseada no timeRange
      const now = new Date()
      let startDate = new Date()
      let snapshotType = 'weekly'
      
      switch (timeRange) {
        case '1week':
          startDate.setDate(now.getDate() - 7)
          snapshotType = 'weekly'
          break
        case '1month':
          startDate.setMonth(now.getMonth() - 1)
          snapshotType = 'weekly'
          break
        case '1year':
          startDate.setFullYear(now.getFullYear() - 1)
          snapshotType = 'monthly'
          break
        case '5years':
          startDate.setFullYear(now.getFullYear() - 5)
          snapshotType = 'quarterly'
          break
      }

      console.log('📊 Carregando snapshots de jornadas:', { 
        companyId: selectedCompany.id, 
        startDate, 
        snapshotType 
      })

      // NOVO: Usar snapshots de jornadas para análise temporal
      const snapshotsByJourney = await getAllJourneySnapshots(
        selectedCompany.id,
        startDate,
        now,
        snapshotType
      )

      console.log('✅ Snapshots carregados:', snapshotsByJourney)

      // Se não houver snapshots, tentar criar um agora
      if (Object.keys(snapshotsByJourney).length === 0) {
        console.log('⚠️ Nenhum snapshot encontrado, criando snapshots agora...')
        try {
          await createAllJourneySnapshots(selectedCompany.id, snapshotType)
          // Recarregar após criar
          const newSnapshots = await getAllJourneySnapshots(
            selectedCompany.id,
            startDate,
            now,
            snapshotType
          )
          Object.assign(snapshotsByJourney, newSnapshots)
        } catch (createError) {
          console.error('❌ Erro ao criar snapshots:', createError)
        }
      }

      // Processar snapshots para formato de gráfico
      const processedData = processSnapshotsTimeline(snapshotsByJourney)
      setMaturityData(processedData)

      // Calcular estatísticas baseadas nos snapshots
      await calculateStatsFromSnapshots(selectedCompany.id, startDate, now)
      
    } catch (error) {
      console.error('Erro ao carregar dados de amadurecimento:', error)
    } finally {
      setLoading(false)
    }
  }

  const processSnapshotsTimeline = (snapshotsByJourney) => {
    // Criar mapa de datas únicas
    const dateMap = {}
    
    // Coletar todas as datas de todos as jornadas
    Object.keys(snapshotsByJourney).forEach(journeySlug => {
      const snapshots = snapshotsByJourney[journeySlug].snapshots || []
      snapshots.forEach(snapshot => {
        const date = new Date(snapshot.date).toLocaleDateString('pt-BR')
        if (!dateMap[date]) {
          dateMap[date] = {
            date,
            estrategica: 0,
            financeira: 0,
            'pessoas-cultura': 0,
            'receita-crm': 0,
            operacional: 0
          }
        }
        dateMap[date][journeySlug] = snapshot.percentage
      })
    })

    // Converter para array e ordenar
    return Object.values(dateMap).sort((a, b) => 
      new Date(a.date.split('/').reverse().join('-')) - 
      new Date(b.date.split('/').reverse().join('-'))
    )
  }

  const calculateStatsFromSnapshots = async (companyId, startDate, endDate) => {
    try {
      // Usar serviço de estatísticas agregadas
      const companyStats = await getCompanyMaturityStats(companyId, startDate, endDate)

      // Buscar dados adicionais para completar estatísticas
      const { data: allProcesses } = await supabase
        .from('processes')
        .select('id, journey_id')
        .eq('company_id', companyId)
        .eq('is_active', true)

      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, status')
        .eq('company_id', companyId)
        .gte('updated_at', startDate.toISOString())
        .lte('updated_at', endDate.toISOString())

      const totalProcesses = allProcesses?.length || 0
      const matureProcesses = companyStats.matureProcesses || 0
      const inProgressProcesses = tasks?.filter(t => t.status === 'completed').length || 0
      const pendingProcesses = totalProcesses - matureProcesses

      setStats({
        totalProcesses,
        matureProcesses,
        inProgressProcesses,
        pendingProcesses,
        averageMaturity: companyStats.averageMaturity || 0,
        growthRate: companyStats.growthRate || 0
      })
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error)
      setStats({
        totalProcesses: 0,
        matureProcesses: 0,
        inProgressProcesses: 0,
        pendingProcesses: 0,
        averageMaturity: 0,
        growthRate: 0
      })
    }
  }

  const processMaturityTimeline = (evaluations, tasks) => {
    const timeline = {}
    
    // Processar avaliações
    evaluations.forEach(evaluation => {
      const date = new Date(evaluation.evaluated_at).toLocaleDateString('pt-BR')
      const journeySlug = evaluation.process?.journey?.slug
      
      if (!timeline[date]) {
        timeline[date] = {
          date,
          estrategica: 0,
          financeira: 0,
          'pessoas-cultura': 0,
          'receita-crm': 0,
          operacional: 0,
          count: {}
        }
      }

      if (journeySlug) {
        if (!timeline[date].count[journeySlug]) {
          timeline[date].count[journeySlug] = { total: 0, mature: 0 }
        }
        timeline[date].count[journeySlug].total++
        if (evaluation.is_mature) {
          timeline[date].count[journeySlug].mature++
        }
      }
    })

    // Calcular percentuais
    Object.keys(timeline).forEach(date => {
      const counts = timeline[date].count
      Object.keys(counts).forEach(journey => {
        timeline[date][journey] = counts[journey].total > 0
          ? Math.round((counts[journey].mature / counts[journey].total) * 100)
          : 0
      })
      delete timeline[date].count
    })

    return Object.values(timeline).sort((a, b) => 
      new Date(a.date.split('/').reverse().join('-')) - 
      new Date(b.date.split('/').reverse().join('-'))
    )
  }

  const calculateStats = async (evaluations, tasks) => {
    // Buscar todos os processos da empresa
    const { data: allProcesses } = await supabase
      .from('processes')
      .select('id, journey_id')
      .eq('company_id', selectedCompany.id)

    const totalProcesses = allProcesses?.length || 0
    
    // Contar processos maduros (última avaliação)
    const latestEvaluations = {}
    evaluations.forEach(evaluation => {
      if (!latestEvaluations[evaluation.process_id] || 
          new Date(evaluation.evaluated_at) > new Date(latestEvaluations[evaluation.process_id].evaluated_at)) {
        latestEvaluations[evaluation.process_id] = evaluation
      }
    })

    const matureProcesses = Object.values(latestEvaluations).filter(e => e.is_mature).length
    const inProgressProcesses = tasks.length
    const pendingProcesses = totalProcesses - matureProcesses

    const averageMaturity = totalProcesses > 0 
      ? Math.round((matureProcesses / totalProcesses) * 100) 
      : 0

    // Calcular taxa de crescimento (comparar primeiro e último período)
    let growthRate = 0
    if (maturityData.length >= 2) {
      const first = maturityData[0]
      const last = maturityData[maturityData.length - 1]
      const firstAvg = (first.estrategica + first.financeira + first['pessoas-cultura'] + first['receita-crm'] + first.operacional) / 5
      const lastAvg = (last.estrategica + last.financeira + last['pessoas-cultura'] + last['receita-crm'] + last.operacional) / 5
      growthRate = firstAvg > 0 ? Math.round(((lastAvg - firstAvg) / firstAvg) * 100) : 0
    }

    setStats({
      totalProcesses,
      matureProcesses,
      inProgressProcesses,
      pendingProcesses,
      averageMaturity,
      growthRate
    })
  }

  const getJourneyRadarData = () => {
    if (maturityData.length === 0) return []

    const latest = maturityData[maturityData.length - 1]
    return [
      { journey: 'Estratégica', maturity: latest.estrategica || 0, fullMark: 100 },
      { journey: 'Financeira', maturity: latest.financeira || 0, fullMark: 100 },
      { journey: 'Pessoas', maturity: latest['pessoas-cultura'] || 0, fullMark: 100 },
      { journey: 'Receita', maturity: latest['receita-crm'] || 0, fullMark: 100 },
      { journey: 'Operacional', maturity: latest.operacional || 0, fullMark: 100 }
    ]
  }

  const exportToCSV = () => {
    if (!maturityData.length) return

    const headers = ['Data', 'Estratégica', 'Financeira', 'Pessoas & Cultura', 'Receita', 'Operacional']
    const rows = maturityData.map(d => [
      d.date,
      d.estrategica,
      d.financeira,
      d['pessoas-cultura'],
      d['receita-crm'],
      d.operacional
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `maturidade_${selectedCompany?.name}_${timeRange}.csv`
    a.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-[#EBA500] to-[#d99500] rounded-2xl shadow-lg">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-[#373435]">
              Progresso de Amadurecimento
            </h1>
            <p className="text-gray-600 text-lg">
              Análise temporal de maturidade dos processos por jornada
            </p>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Seleção de Empresa */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#EBA500]" />
              Empresa
            </label>
            <select
              value={selectedCompany?.id || ''}
              onChange={(e) => {
                const company = companies.find(c => c.id === e.target.value)
                setSelectedCompany(company)
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#EBA500] transition-colors bg-white"
            >
              <option value="">Selecione uma empresa</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Período */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#EBA500]" />
              Período
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#EBA500] transition-colors bg-white"
            >
              <option value="1week">Última Semana</option>
              <option value="1month">Último Mês</option>
              <option value="1year">Último Ano</option>
              <option value="5years">Últimos 5 Anos</option>
            </select>
          </div>

          {/* Exportar */}
          <div className="flex items-end">
            <button
              onClick={exportToCSV}
              disabled={!maturityData.length}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg text-white rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Download className="h-5 w-5" />
              Exportar CSV
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      ) : !selectedCompany ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-16 text-center">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Selecione uma empresa para visualizar os dados</p>
        </div>
      ) : (
        <>
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Maturidade Média</span>
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-[#373435] mb-1">
                {stats.averageMaturity}%
              </div>
              <div className="flex items-center gap-1 text-sm">
                {stats.growthRate > 0 ? (
                  <>
                    <ArrowUp className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-semibold">+{stats.growthRate}%</span>
                  </>
                ) : stats.growthRate < 0 ? (
                  <>
                    <ArrowDown className="h-4 w-4 text-red-500" />
                    <span className="text-red-600 font-semibold">{stats.growthRate}%</span>
                  </>
                ) : (
                  <>
                    <Minus className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Estável</span>
                  </>
                )}
                <span className="text-gray-500">no período</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Processos Maduros</span>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-[#373435] mb-1">
                {stats.matureProcesses}
              </div>
              <div className="text-sm text-gray-500">
                de {stats.totalProcesses} processos
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Em Progresso</span>
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-[#373435] mb-1">
                {stats.inProgressProcesses}
              </div>
              <div className="text-sm text-gray-500">
                tarefas completadas
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Pendentes</span>
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="text-3xl font-bold text-[#373435] mb-1">
                {stats.pendingProcesses}
              </div>
              <div className="text-sm text-gray-500">
                processos restantes
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Gráfico de Linha - Evolução Temporal */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <LineChartIcon className="h-5 w-5 text-[#EBA500]" />
                <h2 className="text-xl font-bold text-[#373435]">Evolução Temporal</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={maturityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '12px'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="estrategica" stroke="#3B82F6" strokeWidth={2} name="Estratégica" />
                  <Line type="monotone" dataKey="financeira" stroke="#10B981" strokeWidth={2} name="Financeira" />
                  <Line type="monotone" dataKey="pessoas-cultura" stroke="#8B5CF6" strokeWidth={2} name="Pessoas" />
                  <Line type="monotone" dataKey="receita-crm" stroke="#F59E0B" strokeWidth={2} name="Receita" />
                  <Line type="monotone" dataKey="operacional" stroke="#EF4444" strokeWidth={2} name="Operacional" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Radar - Estado Atual */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Target className="h-5 w-5 text-[#EBA500]" />
                <h2 className="text-xl font-bold text-[#373435]">Estado Atual das Jornadas</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={getJourneyRadarData()}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis 
                    dataKey="journey" 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                  />
                  <Radar 
                    name="Maturidade %" 
                    dataKey="maturity" 
                    stroke="#EBA500" 
                    fill="#EBA500" 
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de Área - Comparação Acumulada */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-5 w-5 text-[#EBA500]" />
              <h2 className="text-xl font-bold text-[#373435]">Comparação Acumulada de Maturidade</h2>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={maturityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '12px'
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="estrategica" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Estratégica" />
                <Area type="monotone" dataKey="financeira" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Financeira" />
                <Area type="monotone" dataKey="pessoas-cultura" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} name="Pessoas" />
                <Area type="monotone" dataKey="receita-crm" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} name="Receita" />
                <Area type="monotone" dataKey="operacional" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Operacional" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}

export default CompanyMaturityProgressPage
