import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { Layout } from '../components/layout/Layout'
import { 
  ArrowLeft,
  Search,
  Filter,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  Settings,
  Star,
  CheckCircle2,
  Circle,
  Loader2
} from 'lucide-react'

// Mapeamento de ícones
const JOURNEY_ICONS = {
  'estrategica': Target,
  'financeira': TrendingUp,
  'pessoas-cultura': Users,
  'receita-crm': DollarSign,
  'operacional': Settings
}

export default function JourneyProcessesPage() {
  const { slug } = useParams()
  console.log('🎯 JourneyProcessesPage renderizado com slug:', slug)
  const [journey, setJourney] = useState(null)
  const [processes, setProcesses] = useState([])
  const [filteredProcesses, setFilteredProcesses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showEvaluated, setShowEvaluated] = useState('all') // all, evaluated, not-evaluated

  useEffect(() => {
    console.log('🔍 JourneyProcessesPage montado com slug:', slug)
    fetchJourneyData()
  }, [slug])

  useEffect(() => {
    applyFilters()
  }, [processes, searchTerm, selectedCategory, showEvaluated])

  async function fetchJourneyData() {
    try {
      console.log('📊 Iniciando busca por dados da jornada:', slug)
      setLoading(true)
      setError(null)

      // Buscar dados da jornada
      console.log('📊 Fazendo query para journey com slug:', slug)
      const { data: journeyData, error: journeyError } = await supabase
        .from('journeys')
        .select('*')
        .eq('slug', slug)
        .single()

      console.log('📊 Journey data encontrada:', journeyData)
      console.log('📊 Journey error:', journeyError)
      console.log('📊 Slug procurado:', slug)
      console.log('📊 Tipo do slug:', typeof slug)

      if (journeyError) {
        console.log('❌ Erro ao buscar jornada:', journeyError)
        
        // Fallback: vamos listar todas as jornadas para debug
        console.log('🔍 Listando todas as jornadas para debug...')
        const { data: allJourneys, error: allError } = await supabase
          .from('journeys')
          .select('id, name, slug')
        
        console.log('📋 Todas as jornadas:', allJourneys)
        console.log('📋 Erro ao listar:', allError)
        
        throw journeyError
      }
      
      if (!journeyData) {
        console.log('❌ Jornada não encontrada para slug:', slug)
        
        // Fallback: vamos listar todas as jornadas para debug
        console.log('🔍 Listando todas as jornadas para debug...')
        const { data: allJourneys, error: allError } = await supabase
          .from('journeys')
          .select('id, name, slug')
        
        console.log('📋 Todas as jornadas:', allJourneys)
        throw new Error('Jornada não encontrada')
      }

      setJourney(journeyData)

      // Buscar processos da jornada com avaliações
      const { data: processesData, error: processesError } = await supabase
        .from('processes')
        .select(`
          *,
          process_evaluations (
            id,
            current_score,
            evaluated_at
          )
        `)
        .eq('journey_id', journeyData.id)
        .eq('is_active', true)
        .order('order_index')

      if (processesError) throw processesError

      // Processar dados dos processos
      const processedProcesses = processesData.map(process => ({
        ...process,
        hasEvaluation: process.process_evaluations?.length > 0,
        lastScore: process.process_evaluations?.[0]?.current_score || null,
        lastEvaluationDate: process.process_evaluations?.[0]?.evaluated_at
      }))

      setProcesses(processedProcesses)

      // Extrair categorias únicas
      const uniqueCategories = [...new Set(processedProcesses.map(p => p.category))]
        .filter(Boolean)
        .sort()
      
      setCategories(uniqueCategories)

    } catch (error) {
      console.error('Erro ao carregar dados da jornada:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let filtered = [...processes]

    // Filtro por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(process =>
        process.name.toLowerCase().includes(term) ||
        process.description?.toLowerCase().includes(term) ||
        process.category?.toLowerCase().includes(term)
      )
    }

    // Filtro por categoria
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(process => process.category === selectedCategory)
    }

    // Filtro por status de avaliação
    if (showEvaluated === 'evaluated') {
      filtered = filtered.filter(process => process.hasEvaluation)
    } else if (showEvaluated === 'not-evaluated') {
      filtered = filtered.filter(process => !process.hasEvaluation)
    }

    setFilteredProcesses(filtered)
  }

  function getScoreColor(score) {
    if (score === null) return 'text-gray-400'
    if (score <= 1) return 'text-red-500'
    if (score <= 2) return 'text-orange-500'
    if (score <= 3) return 'text-yellow-500'
    if (score <= 4) return 'text-blue-500'
    return 'text-green-500'
  }

  function getScoreLabel(score) {
    if (score === null) return 'Não avaliado'
    const labels = ['Inexistente', 'Inicial', 'Básico', 'Intermediário', 'Avançado', 'Otimizado']
    return labels[score] || 'Inválido'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-gray-600">Carregando jornada: {slug}</p>
              <p className="text-xs text-gray-400">🔍 Debug: JourneyProcessesPage carregado</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-2">⚠️ Erro ao carregar</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <Link
                to="/matriz-bossa"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Voltar à Matriz Bossa
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!journey) return null

  const IconComponent = JOURNEY_ICONS[journey.slug] || Target
  const stats = {
    total: processes.length,
    evaluated: processes.filter(p => p.hasEvaluation).length,
    avgScore: processes.filter(p => p.hasEvaluation).length > 0 
      ? (processes.filter(p => p.hasEvaluation).reduce((sum, p) => sum + p.lastScore, 0) / 
         processes.filter(p => p.hasEvaluation).length).toFixed(1)
      : 0
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/matriz-bossa"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar à Matriz Bossa
          </Link>
          
          <div className="flex items-start gap-6 bg-white rounded-xl shadow-md p-6">
            <div 
              className="flex items-center justify-center w-16 h-16 rounded-xl"
              style={{ 
                backgroundColor: `${journey.color}20`,
                color: journey.color 
              }}
            >
              <IconComponent className="w-8 h-8" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {journey.name}
              </h1>
              <p className="text-gray-600 mb-4">
                {journey.description}
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm text-gray-600">Processos</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.evaluated}</div>
                  <div className="text-sm text-gray-600">Avaliados</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.avgScore}</div>
                  <div className="text-sm text-gray-600">Nota Média</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar processos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtro por categoria */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas as categorias</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* Filtro por status */}
            <select
              value={showEvaluated}
              onChange={(e) => setShowEvaluated(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos os processos</option>
              <option value="evaluated">Já avaliados</option>
              <option value="not-evaluated">Não avaliados</option>
            </select>
          </div>

          {/* Resultados da filtragem */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <div>
              Mostrando {filteredProcesses.length} de {processes.length} processos
            </div>
            {(searchTerm || selectedCategory !== 'all' || showEvaluated !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('all')
                  setShowEvaluated('all')
                }}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* Lista de Processos */}
        <div className="space-y-4">
          {filteredProcesses.map((process) => (
            <div
              key={process.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  
                  {/* Header do processo */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {process.code}
                      </span>
                      {process.category && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {process.category}
                        </span>
                      )}
                    </div>
                    
                    {/* Status de avaliação */}
                    <div className="flex items-center gap-1">
                      {process.hasEvaluation ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                  </div>

                  {/* Nome e descrição */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {process.name}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {process.description}
                  </p>

                  {/* Avaliação atual */}
                  {process.hasEvaluation && (
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Última avaliação:</span>
                        <span className={`font-semibold ${getScoreColor(process.lastScore)}`}>
                          {process.lastScore}/5 - {getScoreLabel(process.lastScore)}
                        </span>
                      </div>
                      {process.lastEvaluationDate && (
                        <div className="text-gray-400">
                          {new Date(process.lastEvaluationDate).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex flex-col gap-2 ml-6">
                  <Link
                    to={`/matriz-bossa/${slug}/${process.id}/avaliar`}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-center text-sm"
                  >
                    {process.hasEvaluation ? 'Reavaliar' : 'Avaliar'}
                  </Link>
                  
                  {process.weight > 1 && (
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <Star className="w-3 h-3" />
                      <span>Peso {process.weight}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Estado vazio */}
        {filteredProcesses.length === 0 && (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum processo encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar os filtros ou termos de busca.
            </p>
          </div>
        )}
      </div>
    </div>
    </Layout>
  )
}