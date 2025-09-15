import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useUserContext } from '../contexts/UserContext'
import { Link } from 'react-router-dom'
import { 
  Target, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Settings,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Award,
  ChevronRight
} from 'lucide-react'

// Mapeamento de ícones das jornadas
const JOURNEY_ICONS = {
  'estrategica': Target,
  'financeira': TrendingUp,
  'pessoas-cultura': Users,
  'receita-crm': DollarSign,
  'operacional': Settings
}

// Níveis de maturidade
const MATURITY_LEVELS = [
  { min: 0, max: 1, label: 'Crítico', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  { min: 1.1, max: 2, label: 'Básico', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  { min: 2.1, max: 3, label: 'Intermediário', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  { min: 3.1, max: 4, label: 'Avançado', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { min: 4.1, max: 5, label: 'Otimizado', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' }
]

function getMaturityLevel(score) {
  return MATURITY_LEVELS.find(level => score >= level.min && score <= level.max) || MATURITY_LEVELS[0]
}

export default function MatrizBossaDashboard() {
  const { activeCompany } = useUserContext()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (activeCompany) {
      fetchDashboardData()
    }
  }, [activeCompany])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      setError(null)

      // Buscar dados consolidados usando a view diagnosis_summary
      const { data: summaryData, error: summaryError } = await supabase
        .from('diagnosis_summary')
        .select('*')
        .eq('company_id', activeCompany.id)
        .single()

      if (summaryError && summaryError.code !== 'PGRST116') {
        throw summaryError
      }

      // Buscar dados detalhados por jornada
      const { data: journeyStats, error: journeyError } = await supabase
        .from('journey_maturity')
        .select('*')
        .eq('company_id', activeCompany.id)
        .order('journey_order')

      if (journeyError && journeyError.code !== 'PGRST116') {
        throw journeyError
      }

      // Se não há dados de avaliação, buscar estrutura básica
      if (!summaryData && (!journeyStats || journeyStats.length === 0)) {
        const { data: basicJourneys, error: basicError } = await supabase
          .from('journeys')
          .select(`
            id, name, slug, color, order_index,
            processes:processes(count)
          `)
          .eq('is_active', true)
          .order('order_index')

        if (basicError) throw basicError

        const basicStats = basicJourneys.map(journey => ({
          journey_id: journey.id,
          journey_name: journey.name,
          journey_slug: journey.slug,
          journey_color: journey.color,
          journey_order: journey.order_index,
          total_processes: journey.processes?.length || 0,
          evaluated_processes: 0,
          average_score: 0,
          completion_percentage: 0
        }))

        setDashboardData({
          summary: {
            total_processes: basicStats.reduce((sum, j) => sum + j.total_processes, 0),
            evaluated_processes: 0,
            overall_score: 0,
            completion_percentage: 0
          },
          journeys: basicStats
        })
      } else {
        setDashboardData({
          summary: summaryData || {
            total_processes: journeyStats?.reduce((sum, j) => sum + j.total_processes, 0) || 0,
            evaluated_processes: journeyStats?.reduce((sum, j) => sum + j.evaluated_processes, 0) || 0,
            overall_score: journeyStats?.length > 0 
              ? journeyStats.reduce((sum, j) => sum + j.average_score, 0) / journeyStats.length 
              : 0,
            completion_percentage: journeyStats?.length > 0
              ? journeyStats.reduce((sum, j) => sum + j.completion_percentage, 0) / journeyStats.length
              : 0
          },
          journeys: journeyStats || []
        })
      }

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
      setError('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (!activeCompany) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Empresa não selecionada</span>
        </div>
        <p className="text-yellow-700 text-sm mt-1">
          Selecione uma empresa para visualizar o dashboard da Matriz Bossa.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <p className="text-gray-600 text-sm">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Erro ao carregar dashboard</span>
        </div>
        <p className="text-red-700 text-sm mt-1">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!dashboardData) return null

  const { summary, journeys } = dashboardData
  const overallMaturity = getMaturityLevel(summary.overall_score || 0)

  return (
    <div className="space-y-6">
      
      {/* Resumo Geral */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Resumo da Avaliação</h2>
            <p className="text-gray-600 text-sm">{activeCompany.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{summary.total_processes}</div>
            <div className="text-sm text-gray-600">Processos Totais</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{summary.evaluated_processes}</div>
            <div className="text-sm text-gray-600">Avaliados</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{summary.completion_percentage?.toFixed(1)}%</div>
            <div class="text-sm text-gray-600">Progresso</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{summary.overall_score?.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Nota Geral</div>
          </div>
        </div>

        {/* Nível de Maturidade Geral */}
        {summary.overall_score > 0 && (
          <div className={`p-4 rounded-lg ${overallMaturity.bgColor} ${overallMaturity.borderColor} border`}>
            <div className="flex items-center gap-2 mb-2">
              <Award className={`w-5 h-5 ${overallMaturity.color}`} />
              <span className={`font-semibold ${overallMaturity.color}`}>
                Nível de Maturidade: {overallMaturity.label}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(summary.overall_score / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Progresso por Jornada */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Progresso por Jornada
        </h3>

        <div className="space-y-4">
          {journeys.map((journey) => {
            const IconComponent = JOURNEY_ICONS[journey.journey_slug] || Target
            const maturityLevel = getMaturityLevel(journey.average_score || 0)
            const completionPercentage = journey.completion_percentage || 0
            const isCompleted = completionPercentage === 100

            return (
              <Link
                key={journey.journey_id}
                to={`/matriz-bossa/${journey.journey_slug}`}
                onClick={(e) => {
                  console.log('Navegando para:', `/matriz-bossa/${journey.journey_slug}`)
                }}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group cursor-pointer"
              >
                {/* Ícone da jornada */}
                <div 
                  className="flex items-center justify-center w-10 h-10 rounded-lg"
                  style={{ 
                    backgroundColor: `${journey.journey_color}20`,
                    color: journey.journey_color 
                  }}
                >
                  <IconComponent className="w-5 h-5" />
                </div>

                {/* Informações da jornada */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {journey.journey_name}
                    </h4>
                    <div className="flex items-center gap-2 text-sm">
                      {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      <span className={isCompleted ? 'text-green-600 font-medium' : 'text-gray-600'}>
                        {journey.evaluated_processes}/{journey.total_processes}
                      </span>
                    </div>
                  </div>
                  
                  {/* Barra de progresso */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-600 w-12 text-right">
                      {completionPercentage.toFixed(0)}%
                    </div>
                  </div>

                  {/* Score e maturidade */}
                  {journey.evaluated_processes > 0 && (
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <span className={`${maturityLevel.color} font-medium`}>
                        {maturityLevel.label}
                      </span>
                      <span className="text-gray-600">
                        Média: {journey.average_score?.toFixed(1)}/5
                      </span>
                    </div>
                  )}
                </div>

                {/* Seta para indicar que é clicável */}
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </Link>
            )
          })}
        </div>

        {/* Estado vazio */}
        {journeys.length === 0 && (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Nenhuma avaliação encontrada</p>
            <p className="text-gray-500 text-sm">
              Comece avaliando os processos para ver o progresso aqui.
            </p>
          </div>
        )}
      </div>

      {/* Próximos Passos */}
      {summary.completion_percentage < 100 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">🎯 Próximos passos</h4>
          <div className="text-sm text-blue-700 space-y-1 mb-3">
            {summary.evaluated_processes === 0 ? (
              <p>• Comece avaliando os processos da <strong>Jornada Estratégica</strong></p>
            ) : (
              <>
                <p>• Continue avaliando os processos restantes ({summary.total_processes - summary.evaluated_processes} pendentes)</p>
                <p>• Revise avaliações com pontuação baixa (0-2) para identificar prioridades</p>
                <p>• Documente ações de melhoria nas observações dos processos</p>
              </>
            )}
          </div>
          
          {/* Botão de teste de navegação */}
          <div className="flex gap-2">
            <Link 
              to="/matriz-bossa"
              className="inline-flex items-center px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
              onClick={(e) => console.log('Teste navegação para /matriz-bossa')}
            >
              Ir para Matriz Bossa
            </Link>
            
            <Link 
              to="/matriz-bossa/estrategica"
              className="inline-flex items-center px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
              onClick={(e) => console.log('Teste navegação para /matriz-bossa/estrategica')}
            >
              Jornada Estratégica
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}