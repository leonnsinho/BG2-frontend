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
  Filter,
  Edit,
  Eye,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  TrendingUp,
  DollarSign
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

  // Mapear dados das jornadas
  const journeysData = {
    'estrategica': {
      name: 'Jornada Estratégica',
      description: 'Planejamento estratégico, visão, missão, valores e direcionamento organizacional',
      icon: Target,
      color: '#3B82F6',
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgLight: 'bg-blue-50',
      categories: ['Visão e Propósito', 'Análise e Diagnóstico', 'Planejamento Estratégico', 'Execução e Monitoramento']
    },
    'financeira': {
      name: 'Jornada Financeira',
      description: 'Gestão financeira completa, fluxo de caixa, DRE, indicadores e planejamento orçamentário',
      icon: DollarSign,
      color: '#10B981',
      bgColor: 'bg-green-500',
      textColor: 'text-green-700',
      bgLight: 'bg-green-50',
      categories: ['Planejamento Financeiro', 'Controle Financeiro', 'Análise e Relatórios', 'Gestão de Riscos']
    },
    'pessoas-cultura': {
      name: 'Jornada Pessoas e Cultura',
      description: 'Gestão de pessoas, cultura organizacional, desenvolvimento e performance',
      icon: Users,
      color: '#F59E0B',
      bgColor: 'bg-amber-500',
      textColor: 'text-amber-700',
      bgLight: 'bg-amber-50',
      categories: ['Recrutamento e Seleção', 'Desenvolvimento', 'Performance', 'Cultura Organizacional']
    },
    'receita-crm': {
      name: 'Jornada Receita/CRM',
      description: 'Gestão comercial, vendas, relacionamento com clientes e geração de receita',
      icon: TrendingUp,
      color: '#EF4444',
      bgColor: 'bg-red-500',
      textColor: 'text-red-700',
      bgLight: 'bg-red-50',
      categories: ['Prospecção', 'Vendas', 'Relacionamento', 'Pós-Venda']
    },
    'operacional': {
      name: 'Jornada Operacional',
      description: 'Processos operacionais, qualidade, automações e excelência operacional',
      icon: Settings,
      color: '#8B5CF6',
      bgColor: 'bg-purple-500',
      textColor: 'text-purple-700',
      bgLight: 'bg-purple-50',
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando processos...</p>
        </div>
      </div>
    )
  }

  if (!journey) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">Jornada não encontrada</h1>
          <p className="mt-2 text-gray-600">A jornada "{journeySlug}" não foi encontrada.</p>
          <button
            onClick={() => navigate('/journey-management')}
            className="mt-4 text-primary-600 hover:text-primary-800"
          >
            Voltar ao gerenciamento
          </button>
        </div>
      </div>
    )
  }

  const Icon = journey.icon

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/journey-management')}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                
                <div className={`p-3 rounded-lg ${journey.bgColor}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{journey.name}</h1>
                  <p className="mt-1 text-sm text-gray-500">{journey.description}</p>
                </div>
              </div>
              
              {company && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4" />
                    <span>Empresa: {company.name}</span>
                  </div>
                  
                  <button
                    onClick={() => navigate(`/journey-management/${journeySlug}`)}
                    className="text-sm text-red-600 hover:text-red-800"
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
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar processos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <div className="text-lg font-medium text-gray-900">
                    {evaluations.filter(e => e.current_score >= 4).length}
                  </div>
                  <div className="text-sm text-gray-500">Excelentes</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <div className="text-lg font-medium text-gray-900">
                    {evaluations.filter(e => e.current_score >= 3).length}
                  </div>
                  <div className="text-sm text-gray-500">Satisfatórios</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <div className="text-lg font-medium text-gray-900">
                    {evaluations.filter(e => e.current_score < 3 && e.current_score > 0).length}
                  </div>
                  <div className="text-sm text-gray-500">Precisam Atenção</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-gray-600" />
                </div>
                <div className="ml-4">
                  <div className="text-lg font-medium text-gray-900">
                    {processes.length - evaluations.length}
                  </div>
                  <div className="text-sm text-gray-500">Não Avaliados</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Processos */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Processos ({filteredProcesses.length} de {processes.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredProcesses.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">Nenhum processo encontrado.</p>
              </div>
            ) : (
              filteredProcesses.map((process) => {
                const evaluation = getProcessEvaluation(process.id)
                
                return (
                  <div key={process.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {process.code}
                          </span>
                          
                          {process.category && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${journey.bgLight} ${journey.textColor}`}>
                              {process.category}
                            </span>
                          )}
                        </div>
                        
                        <h4 className="text-lg font-medium text-gray-900 mb-2">
                          {process.name}
                        </h4>
                        
                        {process.description && (
                          <p className="text-sm text-gray-600 mb-4">
                            {process.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Peso: {process.weight}</span>
                          <span>Ordem: {process.order_index}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 ml-6">
                        {evaluation ? (
                          <div className="text-right">
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(evaluation.current_score)}`}>
                              {evaluation.current_score}/5 - {getScoreLabel(evaluation.current_score)}
                            </div>
                            
                            {evaluation.target_score && (
                              <div className="text-xs text-gray-500 mt-1">
                                Meta: {evaluation.target_score}/5
                              </div>
                            )}
                          </div>
                        ) : company ? (
                          <div className="text-right">
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Não Avaliado
                            </div>
                          </div>
                        ) : null}
                        
                        <div className="flex space-x-2">
                          <button
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {company && (
                            <button
                              onClick={() => navigate(`/journey-management/${journeySlug}/${process.id}/evaluate?company=${companyId}`)}
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
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