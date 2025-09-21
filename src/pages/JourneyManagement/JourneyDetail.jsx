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
          const { data: evaluationsData, error: evaluationsError } = await supabase
            .from('process_evaluations')
            .select(`
              *,
              process:processes(id, name, code)
            `)
            .eq('company_id', companyId)
            .in('process_id', processesData?.map(p => p.id) || [])

          if (evaluationsError) {
            console.warn('Erro ao carregar avaliações:', evaluationsError)
          } else {
            setEvaluations(evaluationsData || [])
          }
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
                        
                        {process.description && (
                          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                            {process.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-[#EBA500] rounded-full"></span>
                            <span>Peso: {process.weight}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-[#373435] rounded-full"></span>
                            <span>Ordem: {process.order_index}</span>
                          </span>
                        </div>
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
                            className="p-3 text-gray-400 hover:text-[#EBA500] hover:bg-[#EBA500]/10 rounded-2xl transition-all duration-200"
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {company && (
                            <button
                              onClick={() => navigate(`/journey-management/${journeySlug}/${process.id}/evaluate?company=${companyId}`)}
                              className="p-3 text-gray-400 hover:text-[#EBA500] hover:bg-[#EBA500]/10 rounded-2xl transition-all duration-200"
                              title="Avaliar processo"
                            >
                              <Edit className="h-4 w-4" />
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
    </div>
  )
}

export default JourneyDetail