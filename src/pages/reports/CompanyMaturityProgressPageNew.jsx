import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Calendar, 
  Building2, 
  Target, 
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  BarChart3,
  Activity,
  X
} from 'lucide-react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import toast from 'react-hot-toast'

const CompanyMaturityProgressPageNew = () => {
  const { profile } = useAuth()
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [timeRange, setTimeRange] = useState('1month')
  const [journeyData, setJourneyData] = useState([])
  const [selectedJourney, setSelectedJourney] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [dateDetails, setDateDetails] = useState(null)
  const [loadingDateDetails, setLoadingDateDetails] = useState(false)
  const [loading, setLoading] = useState(true)

  // Mapa de nomes de jornadas
  const journeyNames = {
    'd6d46578-9071-484b-99c0-24039fee5d0a': { name: 'Jornada Estratégica', color: '#3B82F6', slug: 'estrategica' },
    '2988b17f-3a22-42fd-a1c1-0b8826c30144': { name: 'Jornada Financeira', color: '#10B981', slug: 'financeira' },
    'e4a4f8e2-5c3d-4b1a-9f7e-8d9c6b2a1f3e': { name: 'Jornada Pessoas & Cultura', color: '#8B5CF6', slug: 'pessoas-cultura' },
    'a7b9c1d3-2e4f-5g6h-7i8j-9k0l1m2n3o4p': { name: 'Jornada Receita & CRM', color: '#F59E0B', slug: 'receita-crm' },
    'f5e4d3c2-b1a9-8h7g-6f5e-4d3c2b1a0987': { name: 'Jornada Operacional', color: '#EF4444', slug: 'operacional' }
  }

  useEffect(() => {
    if (profile) {
      loadCompanies()
    }
  }, [profile])

  useEffect(() => {
    if (selectedCompany) {
      loadJourneyProgress()
    }
  }, [selectedCompany, timeRange])

  const loadCompanies = async () => {
    try {
      console.log('🏢 Carregando empresas para perfil:', profile)
      
      // Verificar se é company_admin em user_companies
      const isCompanyAdmin = profile?.user_companies?.some(uc => 
        uc.role === 'company_admin' && uc.is_active
      )
      
      // Pegar a empresa do company_admin
      const companyAdmin = profile?.user_companies?.find(uc => 
        uc.role === 'company_admin' && uc.is_active
      )
      
      console.log('🔑 É Company Admin?', isCompanyAdmin)
      console.log('🏢 Empresa do Admin:', companyAdmin)
      
      // Se for Company Admin, buscar apenas a empresa dele
      let query = supabase
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .order('name')

      // Filtrar por empresa se for company_admin
      if (isCompanyAdmin && companyAdmin?.company_id) {
        console.log('✅ Filtrando para company_admin:', companyAdmin.company_id)
        query = query.eq('id', companyAdmin.company_id)
      } else {
        console.log('⚠️ Carregando todas as empresas')
      }

      const { data, error } = await query

      if (error) throw error
      
      console.log('📊 Empresas carregadas:', data)
      setCompanies(data || [])
      
      if (data && data.length > 0) {
        setSelectedCompany(data[0])
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
      toast.error('Erro ao carregar empresas')
    }
  }

  const loadJourneyProgress = async () => {
    if (!selectedCompany) return
    
    setLoading(true)
    try {
      // Calcular datas baseado no timeRange
      const now = new Date()
      let startDate = new Date()
      
      switch (timeRange) {
        case '1week':
          startDate.setDate(now.getDate() - 7)
          break
        case '1month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case '3months':
          startDate.setMonth(now.getMonth() - 3)
          break
        case '1year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
        case '5years':
          startDate.setFullYear(now.getFullYear() - 5)
          break
      }

      // Formatar datas no formato YYYY-MM-DD sem problemas de timezone
      const formatDate = (date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      const fromDate = formatDate(startDate)
      const toDate = formatDate(now)

      console.log('📊 Carregando snapshots:', { 
        companyId: selectedCompany.id,
        from: fromDate,
        to: toDate
      })

      // Buscar snapshots do período
      const { data: snapshots, error } = await supabase
        .from('journey_maturity_snapshots')
        .select(`
          *,
          journeys!inner(id, name, slug, icon)
        `)
        .eq('company_id', selectedCompany.id)
        .gte('snapshot_date', fromDate)
        .lte('snapshot_date', toDate)
        .order('snapshot_date', { ascending: true })

      if (error) {
        console.error('❌ Erro ao buscar snapshots:', error)
        throw error
      }

      console.log('✅ Snapshots encontrados:', snapshots)

      // Agrupar por jornada
      const journeyMap = {}
      
      snapshots.forEach(snapshot => {
        const journeyId = snapshot.journey_id
        if (!journeyMap[journeyId]) {
          journeyMap[journeyId] = {
            id: journeyId,
            name: snapshot.journeys.name,
            slug: snapshot.journeys.slug,
            icon: snapshot.journeys.icon,
            color: journeyNames[journeyId]?.color || '#6B7280',
            snapshots: [],
            currentMaturity: 0,
            previousMaturity: 0,
            totalProcesses: 0,
            matureProcesses: 0,
            inProgressProcesses: 0,
            pendingProcesses: 0,
            growthRate: 0
          }
        }
        
        journeyMap[journeyId].snapshots.push(snapshot)
      })

      // Calcular métricas para cada jornada
      const journeyList = Object.values(journeyMap).map(journey => {
        const sortedSnapshots = journey.snapshots.sort((a, b) => 
          new Date(a.snapshot_date + 'T00:00:00') - new Date(b.snapshot_date + 'T00:00:00')
        )

        const latestSnapshot = sortedSnapshots[sortedSnapshots.length - 1]
        const firstSnapshot = sortedSnapshots[0]

        journey.currentMaturity = latestSnapshot?.maturity_percentage || 0
        journey.previousMaturity = firstSnapshot?.maturity_percentage || 0
        journey.totalProcesses = latestSnapshot?.total_processes || 0
        journey.matureProcesses = latestSnapshot?.mature_processes || 0
        journey.inProgressProcesses = latestSnapshot?.in_progress_processes || 0
        journey.pendingProcesses = latestSnapshot?.pending_processes || 0
        
        // Calcular taxa de crescimento
        if (firstSnapshot && latestSnapshot && firstSnapshot.id !== latestSnapshot.id) {
          const growth = latestSnapshot.maturity_percentage - firstSnapshot.maturity_percentage
          journey.growthRate = parseFloat(growth.toFixed(2))
        }

        return journey
      })

      console.log('📊 Jornadas processadas:', journeyList)
      setJourneyData(journeyList)

    } catch (error) {
      console.error('Erro ao carregar progresso:', error)
      toast.error('Erro ao carregar dados de maturidade')
    } finally {
      setLoading(false)
    }
  }

  const loadDateDetails = async (snapshotDate, journeyId) => {
    setLoadingDateDetails(true)
    try {
      console.log('📅 Carregando detalhes do dia:', { snapshotDate, journeyId, companyId: selectedCompany.id })

      // Buscar processos que foram marcados como amadurecidos neste dia
      const { data: evaluations, error: evalError } = await supabase
        .from('process_evaluations')
        .select(`
          *,
          processes!inner(id, name, journey_id)
        `)
        .eq('company_id', selectedCompany.id)
        .eq('processes.journey_id', journeyId)
        .eq('has_process', true)
        .gte('updated_at', snapshotDate + 'T00:00:00')
        .lte('updated_at', snapshotDate + 'T23:59:59')

      if (evalError) throw evalError

      // Para cada processo amadurecido, buscar tarefas concluídas
      const processesWithTasks = await Promise.all(
        evaluations.map(async (evaluation) => {
          // Buscar TODAS as tarefas do processo (não filtrar por status aqui)
          const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('process_id', evaluation.process_id)
            .eq('company_id', selectedCompany.id)
            .order('created_at', { ascending: false })

          if (tasksError) {
            console.error('Erro ao buscar tarefas:', tasksError)
            return {
              process: evaluation.processes,
              tasks: []
            }
          }

          console.log(`📋 Tarefas do processo ${evaluation.processes.name}:`, tasks)

          return {
            process: evaluation.processes,
            evaluation: evaluation,
            tasks: tasks || []
          }
        })
      )

      console.log('✅ Detalhes carregados:', processesWithTasks)

      setDateDetails({
        date: snapshotDate,
        processes: processesWithTasks
      })

    } catch (error) {
      console.error('❌ Erro ao carregar detalhes do dia:', error)
      toast.error('Erro ao carregar detalhes do dia')
    } finally {
      setLoadingDateDetails(false)
    }
  }

  const formatTimelineData = (journey) => {
    if (!journey || !journey.snapshots.length) return []

    return journey.snapshots
      .sort((a, b) => new Date(a.snapshot_date + 'T00:00:00') - new Date(b.snapshot_date + 'T00:00:00'))
      .map(snapshot => {
        // Parse da data sem timezone (formato YYYY-MM-DD)
        const [year, month, day] = snapshot.snapshot_date.split('-')
        const date = new Date(year, month - 1, day)
        
        return {
          date: date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short'
          }),
          fullDate: snapshot.snapshot_date, // Data completa para buscar detalhes
          maturity: snapshot.maturity_percentage,
          mature: snapshot.mature_processes,
          total: snapshot.total_processes
        }
      })
  }

  const getGrowthIcon = (growthRate) => {
    if (growthRate > 0) return <ArrowUp className="h-4 w-4 text-green-500" />
    if (growthRate < 0) return <ArrowDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getGrowthColor = (growthRate) => {
    if (growthRate > 0) return 'text-green-600'
    if (growthRate < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const exportToCSV = () => {
    if (!journeyData.length) return

    const headers = ['Jornada', '% Atual', '% Anterior', 'Crescimento', 'Total Processos', 'Maduros', 'Em Progresso', 'Pendentes']
    const rows = journeyData.map(j => [
      j.name,
      j.currentMaturity.toFixed(2),
      j.previousMaturity.toFixed(2),
      j.growthRate.toFixed(2),
      j.totalProcesses,
      j.matureProcesses,
      j.inProgressProcesses,
      j.pendingProcesses
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `maturidade_${selectedCompany?.name}_${new Date().toISOString()}.csv`
    link.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-[#EBA500] to-[#d99500] rounded-2xl shadow-lg">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-[#373435]">
              Amadurecimento por Jornada
            </h1>
            <p className="text-gray-600 text-lg">
              Progresso temporal de maturidade dos processos
            </p>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-6 mb-6">
        {(() => {
          const isCompanyAdmin = profile?.user_companies?.some(uc => 
            uc.role === 'company_admin' && uc.is_active
          )
          
          return (
            <div className={`grid grid-cols-1 ${isCompanyAdmin ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-4`}>
              {/* Empresa - Só mostra dropdown se NÃO for company_admin */}
              {!isCompanyAdmin ? (
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#EBA500] transition-colors"
                  >
                    <option value="">Selecione uma empresa</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#EBA500]" />
                    Empresa
                  </label>
                  <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-semibold">
                    {selectedCompany?.name || 'Carregando...'}
                  </div>
                </div>
              )}

              {/* Exportar */}
              <div className="flex items-end">
                <button
                  onClick={exportToCSV}
                  disabled={!journeyData.length}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg text-white rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  Exportar CSV
                </button>
              </div>
            </div>
          )
        })()}
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
      ) : journeyData.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-16 text-center">
          <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">Nenhum dado de maturidade encontrado</p>
          <p className="text-gray-500 text-sm">Confirme processos como amadurecidos para gerar métricas</p>
        </div>
      ) : (
        <>
          {/* Cards de Jornadas com Progress Bar */}
          <div className="grid grid-cols-1 gap-6 mb-6">
            {journeyData.map(journey => (
              <div 
                key={journey.id}
                className={`bg-white rounded-3xl shadow-lg border-2 ${selectedJourney?.id === journey.id ? 'border-[#EBA500]' : 'border-gray-200'} p-6 hover:shadow-xl transition-all cursor-pointer`}
                onClick={() => setSelectedJourney(selectedJourney?.id === journey.id ? null : journey)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: journey.color }}
                      />
                      <h3 className="text-xl font-bold text-[#373435]">{journey.name}</h3>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 font-medium">Maturidade Atual</span>
                        <span className="text-2xl font-bold" style={{ color: journey.color }}>
                          {journey.currentMaturity.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500 relative"
                          style={{ 
                            width: `${journey.currentMaturity}%`,
                            backgroundColor: journey.color
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                        </div>
                      </div>
                    </div>

                    {/* Métricas */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          {getGrowthIcon(journey.growthRate)}
                          <span className={`text-lg font-bold ${getGrowthColor(journey.growthRate)}`}>
                            {journey.growthRate > 0 ? '+' : ''}{journey.growthRate}%
                          </span>
                        </div>
                        <span className="text-xs text-gray-600">Crescimento</span>
                      </div>

                      <div className="text-center p-3 bg-green-50 rounded-xl">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-lg font-bold text-green-700">
                            {journey.matureProcesses}
                          </span>
                        </div>
                        <span className="text-xs text-gray-600">Maduros</span>
                      </div>

                      <div className="text-center p-3 bg-orange-50 rounded-xl">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <span className="text-lg font-bold text-orange-700">
                            {journey.inProgressProcesses}
                          </span>
                        </div>
                        <span className="text-xs text-gray-600">Em Progresso</span>
                      </div>

                      <div className="text-center p-3 bg-red-50 rounded-xl">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-lg font-bold text-red-700">
                            {journey.pendingProcesses}
                          </span>
                        </div>
                        <span className="text-xs text-gray-600">Pendentes</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gráfico de Linha (expandido ao clicar) */}
                {selectedJourney?.id === journey.id && (
                  <div 
                    className="mt-6 pt-6 border-t-2 border-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-[#EBA500]" />
                        Evolução Temporal
                      </h4>
                      
                      {/* Seletor de Período */}
                      <div className="w-48">
                        <select
                          value={timeRange}
                          onChange={(e) => setTimeRange(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#EBA500] transition-colors text-sm"
                        >
                          <option value="1week">Última Semana</option>
                          <option value="1month">Último Mês</option>
                          <option value="3months">Últimos 3 Meses</option>
                          <option value="1year">Último Ano</option>
                          <option value="5years">Últimos 5 Anos</option>
                        </select>
                      </div>
                    </div>
                    
                    <div onClick={(e) => e.stopPropagation()}>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart 
                          data={formatTimelineData(journey)}
                          onClick={(data) => {
                            console.log('🖱️ Clique no gráfico detectado:', data)
                            
                            // Recharts retorna os dados de forma diferente
                            if (data && data.activeLabel !== undefined) {
                              const chartData = formatTimelineData(journey)
                              const clickedPoint = chartData.find(point => point.date === data.activeLabel)
                              
                              if (clickedPoint && clickedPoint.fullDate) {
                                console.log('📅 Dados do ponto clicado:', clickedPoint)
                                setSelectedDate(clickedPoint.fullDate)
                                loadDateDetails(clickedPoint.fullDate, journey.id)
                              } else {
                                console.log('⚠️ Ponto não encontrado para:', data.activeLabel)
                              }
                            } else {
                              console.log('⚠️ activeLabel não encontrado')
                            }
                          }}
                        >
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
                          formatter={(value, name) => {
                            if (name === 'maturity') return [`${value.toFixed(1)}%`, 'Maturidade']
                            return [value, name]
                          }}
                          cursor={{ stroke: journey.color, strokeWidth: 2, strokeDasharray: '5 5' }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="maturity" 
                          stroke={journey.color}
                          strokeWidth={3}
                          dot={{ fill: journey.color, r: 6, cursor: 'pointer' }}
                          activeDot={{ r: 8, cursor: 'pointer' }}
                          name="% Maturidade"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    </div>

                    {/* Card de Detalhes do Dia */}
                    {selectedDate && dateDetails && dateDetails.date === selectedDate && (
                      <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            Detalhes de {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </h5>
                          <button
                            onClick={() => {
                              setSelectedDate(null)
                              setDateDetails(null)
                            }}
                            className="text-gray-500 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded-lg"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        {loadingDateDetails ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-600 mt-2">Carregando detalhes...</p>
                          </div>
                        ) : dateDetails.processes.length === 0 ? (
                          <div className="text-center py-8">
                            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600">Nenhum processo amadurecido neste dia</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {dateDetails.processes.map((item, idx) => {
                              console.log(`🔍 Renderizando processo ${idx}:`, item)
                              console.log(`📋 Total de tarefas: ${item.tasks?.length || 0}`)
                              
                              return (
                              <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                                <div className="flex items-start gap-3 mb-3">
                                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                  <div className="flex-1">
                                    <h6 className="font-bold text-gray-800">{item.process.name}</h6>
                                    <p className="text-sm text-gray-500">
                                      Processo amadurecido
                                    </p>
                                  </div>
                                </div>

                                {item.tasks && item.tasks.length > 0 ? (
                                  <div className="mt-3 pl-8">
                                    <p className="text-xs font-semibold text-gray-600 mb-2">
                                      Tarefas ({item.tasks.length})
                                    </p>
                                    <div className="space-y-2">
                                      {item.tasks.map((task, taskIdx) => {
                                        console.log(`📝 Renderizando tarefa ${taskIdx}:`, task)
                                        const isCompleted = task.status === 'completed' || task.status === 'done'
                                        const isPending = task.status === 'pending'
                                        const isInProgress = task.status === 'in_progress' || task.status === 'in-progress'
                                        
                                        // Tentar diferentes campos para o nome da tarefa
                                        const taskName = task.name || task.title || task.description || task.task_name || `Tarefa ${task.id?.slice(0, 8)}`
                                        
                                        return (
                                          <div key={task.id} className="flex items-start gap-2 text-sm">
                                            <div 
                                              className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                                                isCompleted ? 'bg-green-500' : 
                                                isInProgress ? 'bg-yellow-500' : 
                                                'bg-gray-400'
                                              }`}
                                            />
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-gray-700">{taskName}</p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                  isCompleted ? 'bg-green-100 text-green-700' :
                                                  isInProgress ? 'bg-yellow-100 text-yellow-700' :
                                                  'bg-gray-100 text-gray-700'
                                                }`}>
                                                  {task.status === 'completed' || task.status === 'done' ? 'Concluída' :
                                                   task.status === 'in_progress' || task.status === 'in-progress' ? 'Em Progresso' :
                                                   task.status === 'pending' ? 'Pendente' :
                                                   task.status || 'Sem status'}
                                                </span>
                                              </div>
                                              {task.completed_at && (
                                                <p className="text-xs text-gray-500">
                                                  Concluída em {new Date(task.completed_at).toLocaleDateString('pt-BR')}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-2 pl-8 text-sm text-gray-500 italic">
                                    Sem tarefas registradas
                                  </div>
                                )}
                              </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default CompanyMaturityProgressPageNew
