import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import { 
  Target, 
  Building2, 
  Users, 
  ChevronLeft,
  Search,
  Edit,
  Eye,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  TrendingUp,
  DollarSign,
  ArrowLeft,
  Home
} from 'lucide-react'

const JourneyDetail = () => {
  const { journeySlug } = useParams()
  const [searchParams] = useSearchParams()
  const companyId = searchParams.get('company')
  const navigate = useNavigate()
  const { profile } = useAuth()
  
  const [journey, setJourney] = useState(null)
  const [company, setCompany] = useState(null)
  const [processes, setProcesses] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedProcess, setSelectedProcess] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Mapear dados das jornadas com cores BG2
  const journeysData = {
    'estrategica': {
      name: 'Jornada Estratégica',
      description: 'Planejamento estratégico, visão, missão, valores e direcionamento organizacional',
      icon: Target,
      color: '#EBA500',
      bgColor: 'bg-[#EBA500]',
      textColor: 'text-[#EBA500]',
      bgLight: 'bg-[#EBA500]/10',
      bgHover: 'hover:bg-[#EBA500]/20',
      categories: ['Visão e Propósito', 'Análise e Diagnóstico', 'Planejamento Estratégico', 'Execução e Monitoramento']
    },
    'financeira': {
      name: 'Jornada Financeira',
      description: 'Gestão financeira completa, fluxo de caixa, DRE, indicadores e planejamento orçamentário',
      icon: DollarSign,
      color: '#373435',
      bgColor: 'bg-[#373435]',
      textColor: 'text-[#373435]',
      bgLight: 'bg-[#373435]/10',
      bgHover: 'hover:bg-[#373435]/20',
      categories: ['Planejamento Financeiro', 'Controle Financeiro', 'Análise e Relatórios', 'Gestão de Riscos']
    },
    'pessoas-cultura': {
      name: 'Jornada Pessoas e Cultura',
      description: 'Gestão de pessoas, cultura organizacional, desenvolvimento e performance',
      icon: Users,
      color: '#EBA500',
      bgColor: 'bg-[#EBA500]',
      textColor: 'text-[#EBA500]',
      bgLight: 'bg-[#EBA500]/10',
      bgHover: 'hover:bg-[#EBA500]/20',
      categories: ['Recrutamento e Seleção', 'Desenvolvimento', 'Performance', 'Cultura Organizacional']
    },
    'receita-crm': {
      name: 'Jornada Receita/CRM',
      description: 'Gestão comercial, vendas, relacionamento com clientes e geração de receita',
      icon: TrendingUp,
      color: '#373435',
      bgColor: 'bg-[#373435]',
      textColor: 'text-[#373435]',
      bgLight: 'bg-[#373435]/10',
      bgHover: 'hover:bg-[#373435]/20',
      categories: ['Prospecção', 'Vendas', 'Relacionamento', 'Pós-Venda']
    },
    'operacional': {
      name: 'Jornada Operacional',
      description: 'Processos operacionais, qualidade, automações e excelência operacional',
      icon: Settings,
      color: '#EBA500',
      bgColor: 'bg-[#EBA500]',
      textColor: 'text-[#EBA500]',
      bgLight: 'bg-[#EBA500]/10',
      bgHover: 'hover:bg-[#EBA500]/20',
      categories: ['Processos', 'Qualidade', 'Produtividade', 'Automação']
    }
  }

  // Carregar dados da jornada e processos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Obter dados da jornada
        const journeyData = journeysData[journeySlug]
        if (!journeyData) {
          console.error('Jornada não encontrada:', journeySlug)
          return
        }
        setJourney(journeyData)

        // Carregar empresa se especificada
        if (companyId) {
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', companyId)
            .single()

          if (companyError) throw companyError
          setCompany(companyData)
        }

        // Carregar jornada do banco para obter o ID
        const { data: journeyDbData, error: journeyError } = await supabase
          .from('journeys')
          .select('id')
          .eq('slug', journeySlug)
          .single()

        if (journeyError) {
          console.warn('Jornada não encontrada no banco:', journeyError)
          return
        }

        // Carregar processos da jornada
        const { data: processesData, error: processesError } = await supabase
          .from('processes')
          .select('*')
          .eq('journey_id', journeyDbData.id)
          .eq('is_active', true)
          .order('order_index')

        if (processesError) throw processesError
        setProcesses(processesData || [])

        // Carregar avaliações se uma empresa está selecionada
        if (companyId && journeyDbData.id) {
          console.log('🔍 Carregando avaliações para:', { companyId, journeyId: journeyDbData.id })
          
          // Primeiro, vamos verificar se existem avaliações para esta empresa
          const { data: evaluationsCheck, error: checkError } = await supabase
            .from('process_evaluations')
            .select('*')
            .eq('company_id', companyId)
            .limit(5)

          console.log('🧪 Teste de avaliações existentes:', {
            count: evaluationsCheck?.length || 0,
            sample: evaluationsCheck?.[0],
            error: checkError
          })

          const { data: evaluationsData, error: evaluationsError } = await supabase
            .from('process_evaluations')
            .select(`
              id,
              process_id,
              company_id,
              current_score,
              target_score,
              importance_score,
              urgency_score,
              ease_score,
              notes,
              created_at,
              updated_at,
              process:processes(id, name, code)
            `)
            .eq('company_id', companyId)
            .in('process_id', processesData?.map(p => p.id) || [])

          console.log('📊 Dados de avaliações carregados:', {
            count: evaluationsData?.length || 0,
            data: evaluationsData,
            error: evaluationsError
          })

          if (evaluationsError) {
            console.warn('Erro ao carregar avaliações:', evaluationsError)
            setProcesses(processesData || [])
          } else {
            setEvaluations(evaluationsData || [])
            
            // Enriquecer os processos com dados de avaliação
            const enrichedProcesses = processesData?.map(process => {
              const evaluation = evaluationsData?.find(evalData => evalData.process_id === process.id)
              console.log(`🔍 Processo ${process.name}:`, {
                processId: process.id,
                evaluation: evaluation,
                importance: evaluation?.importance_score,
                urgency: evaluation?.urgency_score,
                ease: evaluation?.ease_score,
                current: evaluation?.current_score
              })
              
              return {
                ...process,
                importance_score: evaluation?.importance_score || null,
                urgency_score: evaluation?.urgency_score || null,
                ease_score: evaluation?.ease_score || null,
                current_score: evaluation?.current_score || null,
                target_score: evaluation?.target_score || null,
                evaluation_id: evaluation?.id || null,
                evaluation_data: evaluation // Para debug
              }
            }) || []
            
            console.log('✅ Processos enriquecidos:', enrichedProcesses.filter(p => p.evaluation_id))
            setProcesses(enrichedProcesses)
          }
        } else {
          console.log('⚠️ Sem empresa selecionada, carregando processos básicos')
          setProcesses(processesData || [])
        }

      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [journeySlug, companyId])

  // Filtrar processos
  const filteredProcesses = processes.filter(process => {
    const matchesSearch = process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         process.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         process.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || process.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Obter categorias únicas
  const categories = [...new Set(processes.map(p => p.category).filter(Boolean))]

  // Obter status de avaliação para um processo
  const getProcessEvaluation = (processId) => {
    return evaluations.find(evaluation => evaluation.process_id === processId)
  }

  const getScoreColor = (score) => {
    if (score >= 4) return 'bg-green-100 text-green-800'
    if (score >= 3) return 'bg-yellow-100 text-yellow-800'
    if (score >= 2) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  const getScoreLabel = (score) => {
    if (score === 5) return 'Excelente'
    if (score === 4) return 'Bom'
    if (score === 3) return 'Regular'
    if (score === 2) return 'Ruim'
    if (score === 1) return 'Muito Ruim'
    return 'Não Avaliado'
  }

  // Função para mostrar detalhes do processo
  const showProcessDetails = (process) => {
    console.log('🔍 Dados completos do processo selecionado:', process)
    console.log('📊 Campos específicos:', {
      id: process.id,
      name: process.name,
      importance_score: process.importance_score,
      urgency_score: process.urgency_score,
      ease_score: process.ease_score,
      current_score: process.current_score,
      evaluation_id: process.evaluation_id,
      evaluation_data: process.evaluation_data
    })
    setSelectedProcess(process)
    setShowDetailsModal(true)
  }

  // Função para calcular nota de priorização (baseada na importância, urgência e facilidade)
  const calculatePriorityScore = (importance, urgency, ease) => {
    if (!importance || !urgency || !ease) return 0
    // Fórmula: (Importância × 3 + Urgência × 2 + Facilidade × 1) / 6
    return Math.round(((importance * 3 + urgency * 2 + ease * 1) / 6) * 100) / 100
  }

  // Função para obter cor da priorização
  const getPriorityColor = (score) => {
    if (score >= 4.5) return 'bg-red-100 text-red-800 border-red-200'
    if (score >= 3.5) return 'bg-orange-100 text-orange-800 border-orange-200'
    if (score >= 2.5) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (score >= 1.5) return 'bg-blue-100 text-blue-800 border-blue-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  // Função para obter label da priorização
  const getPriorityLabel = (score) => {
    if (score >= 4.5) return 'Crítica'
    if (score >= 3.5) return 'Alta'
    if (score >= 2.5) return 'Média'
    if (score >= 1.5) return 'Baixa'
    return 'Indefinida'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500] mx-auto"></div>
          <p className="mt-4 text-[#373435]">Carregando processos...</p>
        </div>
      </div>
    )
  }

  if (!journey) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-[#373435]">Jornada não encontrada</h1>
          <p className="mt-2 text-gray-600">A jornada "{journeySlug}" não foi encontrada.</p>
          <button
            onClick={() => navigate('/journey-management')}
            className="mt-4 text-[#EBA500] hover:text-[#EBA500]/80 font-medium"
          >
            Voltar ao gerenciamento
          </button>
        </div>
      </div>
    )
  }

  const Icon = journey.icon

  // Modal de detalhes do processo
  const ProcessDetailsModal = () => {
    if (!selectedProcess) return null

    const priorityScore = calculatePriorityScore(
      selectedProcess.importance_score,
      selectedProcess.urgency_score,
      selectedProcess.ease_score
    )

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-2xl text-sm font-medium bg-gradient-to-r from-[#373435]/10 to-[#373435]/20 text-[#373435] border border-[#373435]/20">
                    {selectedProcess.code}
                  </span>
                  {selectedProcess.category && (
                    <span className="inline-flex items-center px-3 py-1 rounded-2xl text-sm font-medium bg-gradient-to-r from-[#EBA500]/20 to-[#EBA500]/30 text-[#EBA500] border border-[#EBA500]/30">
                      {selectedProcess.category}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-[#373435]">{selectedProcess.name}</h3>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-all duration-200"
              >
                ✕
              </button>
            </div>

            {/* Descrição */}
            {selectedProcess.description && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-[#373435] mb-3">Descrição</h4>
                <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl">
                  {selectedProcess.description}
                </p>
              </div>
            )}

            </div>
            </div>

            {/* Debug Section - Temporária */}
            <div className="mb-8 p-4 bg-gray-100 rounded-2xl">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Debug - Dados Raw:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>ID: {selectedProcess.id}</div>
                <div>Evaluation ID: {selectedProcess.evaluation_id || 'Nenhum'}</div>
                <div>Importance Score: {JSON.stringify(selectedProcess.importance_score)}</div>
                <div>Urgency Score: {JSON.stringify(selectedProcess.urgency_score)}</div>
                <div>Ease Score: {JSON.stringify(selectedProcess.ease_score)}</div>
                <div>Current Score: {JSON.stringify(selectedProcess.current_score)}</div>
                {selectedProcess.evaluation_data && (
                  <div className="mt-2">
                    <strong>Evaluation Data:</strong>
                    <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(selectedProcess.evaluation_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Métricas de Priorização */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-[#373435]">Análise de Priorização</h4>
                {selectedProcess.evaluation_id && (
                  <div className="flex items-center space-x-2 text-sm bg-green-100 text-green-800 px-3 py-1 rounded-2xl border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Processo Avaliado</span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Importância para a Empresa */}
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-blue-800">Importância para a Empresa</h5>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div
                          key={star}
                          className={`w-4 h-4 rounded-full ${
                            star <= (selectedProcess.importance_score || 0)
                              ? 'bg-blue-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-blue-700">
                    {selectedProcess.importance_score ? 
                      `${selectedProcess.importance_score}/5 - Avaliado` : 
                      'Ainda não avaliado'
                    }
                  </p>
                </div>

                {/* Urgência para Realização */}
                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-orange-800">Urgência para Realização</h5>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div
                          key={star}
                          className={`w-4 h-4 rounded-full ${
                            star <= (selectedProcess.urgency_score || 0)
                              ? 'bg-orange-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-orange-700">
                    {selectedProcess.urgency_score ? 
                      `${selectedProcess.urgency_score}/5 - Avaliado` : 
                      'Ainda não avaliado'
                    }
                  </p>
                </div>

                {/* Facilidade para Implementar */}
                <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-green-800">Facilidade para Implementar</h5>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div
                          key={star}
                          className={`w-4 h-4 rounded-full ${
                            star <= (selectedProcess.ease_score || 0)
                              ? 'bg-green-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-green-700">
                    {selectedProcess.ease_score ? 
                      `${selectedProcess.ease_score}/5 - Avaliado` : 
                      'Ainda não avaliado'
                    }
                  </p>
                </div>

                {/* Nota de Priorização */}
                <div className={`p-6 rounded-2xl border ${priorityScore > 0 ? getPriorityColor(priorityScore) : 'bg-gray-50 border-gray-200'}`}>
                  <div className="text-center">
                    <h5 className="font-semibold mb-2">Nota de Priorização</h5>
                    <div className="text-3xl font-bold mb-1">
                      {priorityScore > 0 ? priorityScore.toFixed(1) : 'N/A'}
                    </div>
                    <p className="text-sm font-medium">
                      {priorityScore > 0 ? getPriorityLabel(priorityScore) : 'Necessária avaliação completa'}
                    </p>
                    {priorityScore === 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Avalie importância, urgência e facilidade para calcular
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="pt-6 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Peso do Processo:</span>
                  <span className="ml-2 font-medium text-[#373435]">{selectedProcess.weight || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Ordem:</span>
                  <span className="ml-2 font-medium text-[#373435]">{selectedProcess.order_index || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 text-[#373435] bg-gray-100 hover:bg-gray-200 rounded-2xl font-medium transition-all duration-200"
              >
                Fechar
              </button>
              {company && (
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    navigate(`/journey-management/${journeySlug}/${selectedProcess.id}/evaluate?company=${companyId}`)
                  }}
                  className="flex items-center space-x-2 px-6 py-2 bg-[#EBA500] hover:bg-[#EBA500]/90 text-white rounded-2xl font-medium transition-all duration-200"
                >
                  <Edit className="h-4 w-4" />
                  <span>Avaliar Processo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/journey-management')}
                  className="flex items-center space-x-2 px-4 py-2 text-[#373435] bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-[#EBA500]/30 transition-all duration-200 shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm font-medium">Voltar</span>
                </button>
                
                <div className={`p-4 rounded-2xl ${journey.bgColor} shadow-sm`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold text-[#373435]">{journey.name}</h1>
                  <p className="mt-2 text-base text-gray-600">{journey.description}</p>
                </div>
              </div>
              
              {company && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 bg-[#EBA500]/10 px-3 py-2 rounded-2xl">
                    <Building2 className="h-4 w-4 text-[#EBA500]" />
                    <span className="text-[#373435] font-medium">Empresa: {company.name}</span>
                  </div>
                  
                  <button
                    onClick={() => navigate(`/journey-management/${journeySlug}`)}
                    className="text-sm text-red-500 hover:text-red-600 font-medium"
                  >
                    Remover filtro
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros e Busca */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200/50 p-8 mb-8">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar processos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] sm:text-sm transition-all duration-200"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full pl-4 pr-10 py-3 text-base border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] sm:text-sm rounded-2xl transition-all duration-200"
              >
                <option value="all">Todas as categorias</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        {company && evaluations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-8 w-8 text-[#EBA500]" />
                </div>
                <div className="ml-4">
                  <div className="text-lg font-medium text-[#373435]">
                    {evaluations.filter(e => e.current_score >= 4).length}
                  </div>
                  <div className="text-sm text-gray-500">Excelentes</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <div className="ml-4">
                  <div className="text-lg font-medium text-[#373435]">
                    {evaluations.filter(e => e.current_score >= 3).length}
                  </div>
                  <div className="text-sm text-gray-500">Satisfatórios</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                </div>
                <div className="ml-4">
                  <div className="text-lg font-medium text-[#373435]">
                    {evaluations.filter(e => e.current_score < 3 && e.current_score > 0).length}
                  </div>
                  <div className="text-sm text-gray-500">Precisam Atenção</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-4">
                  <div className="text-lg font-medium text-[#373435]">
                    {processes.length - evaluations.length}
                  </div>
                  <div className="text-sm text-gray-500">Não Avaliados</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Processos */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200/50">
          <div className="px-8 py-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-[#373435]">
              Processos ({filteredProcesses.length} de {processes.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            {filteredProcesses.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Nenhum processo encontrado.</p>
              </div>
            ) : (
              filteredProcesses.map((process) => {
                const evaluation = getProcessEvaluation(process.id)
                
                return (
                  <div key={process.id} className="p-8 hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-[#EBA500]/5 transition-all duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-2xl text-sm font-medium bg-gradient-to-r from-[#373435]/10 to-[#373435]/20 text-[#373435] border border-[#373435]/20">
                            {process.code}
                          </span>
                          
                          {process.category && (
                            <span className="inline-flex items-center px-3 py-1 rounded-2xl text-sm font-medium bg-gradient-to-r from-[#EBA500]/20 to-[#EBA500]/30 text-[#EBA500] border border-[#EBA500]/30">
                              {process.category}
                            </span>
                          )}
                        </div>
                        
                        <h4 className="text-lg font-semibold text-[#373435] mb-3">
                          {process.name}
                        </h4>
                      </div>
                      
                      <div className="flex items-center space-x-4 ml-6">
                        {evaluation ? (
                          <div className="text-right">
                            <div className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-medium ${getScoreColor(evaluation.current_score)}`}>
                              {evaluation.current_score}/5 - {getScoreLabel(evaluation.current_score)}
                            </div>
                            
                            {evaluation.target_score && (
                              <div className="text-xs text-gray-500 mt-2">
                                Meta: {evaluation.target_score}/5
                              </div>
                            )}
                          </div>
                        ) : company ? (
                          <div className="text-right">
                            <div className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              Não Avaliado
                            </div>
                          </div>
                        ) : null}
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => showProcessDetails(process)}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#373435] text-sm font-medium rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Ver Detalhes</span>
                          </button>
                          
                          {company && (
                            <button
                              onClick={() => navigate(`/journey-management/${journeySlug}/${process.id}/evaluate?company=${companyId}`)}
                              className="flex items-center space-x-2 px-4 py-2 bg-[#EBA500] hover:bg-[#EBA500]/90 text-white text-sm font-medium rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Avaliar processo"
                            >
                              <Edit className="h-4 w-4" />
                              <span>Avaliar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {showDetailsModal && <ProcessDetailsModal />}
    </div>
  )
}

export default JourneyDetail