import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useUserContext } from '../contexts/UserContext'
import { Layout } from '../components/layout/Layout'
import { 
  ArrowLeft,
  Star,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  Settings,
  MessageSquare
} from 'lucide-react'
import toast from 'react-hot-toast'

// Configuração da escala de avaliação
const EVALUATION_SCALE = [
  { 
    score: 0, 
    label: 'Inexistente', 
    description: 'O processo não existe na empresa',
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700'
  },
  { 
    score: 1, 
    label: 'Inicial', 
    description: 'Processo básico, informal e não documentado',
    color: 'bg-red-400',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600'
  },
  { 
    score: 2, 
    label: 'Básico', 
    description: 'Processo documentado mas pouco seguido',
    color: 'bg-orange-400',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600'
  },
  { 
    score: 3, 
    label: 'Intermediário', 
    description: 'Processo bem definido e seguido regularmente',
    color: 'bg-yellow-400',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700'
  },
  { 
    score: 4, 
    label: 'Avançado', 
    description: 'Processo otimizado com métricas e controles',
    color: 'bg-blue-400',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600'
  },
  { 
    score: 5, 
    label: 'Otimizado', 
    description: 'Processo automatizado e continuamente melhorado',
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600'
  }
]

// Mapeamento de ícones das jornadas
const JOURNEY_ICONS = {
  'estrategica': Target,
  'financeira': TrendingUp,
  'pessoas-cultura': Users,
  'receita-crm': DollarSign,
  'operacional': Settings
}

export default function ProcessEvaluationPage() {
  const { slug, processId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { activeCompany } = useUserContext()
  
  const [journey, setJourney] = useState(null)
  const [process, setProcess] = useState(null)
  const [currentEvaluation, setCurrentEvaluation] = useState(null)
  const [score, setScore] = useState(null)
  const [observations, setObservations] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProcessData()
  }, [slug, processId])

  async function fetchProcessData() {
    try {
      setLoading(true)
      setError(null)

      // Buscar dados do processo com a jornada
      const { data: processData, error: processError } = await supabase
        .from('processes')
        .select(`
          *,
          journey:journeys (*)
        `)
        .eq('id', processId)
        .single()

      if (processError) throw processError
      if (!processData) throw new Error('Processo não encontrado')

      setProcess(processData)
      setJourney(processData.journey)

      // Buscar avaliação atual se existir
      if (activeCompany) {
        const { data: evaluationData, error: evaluationError } = await supabase
          .from('process_evaluations')
          .select('*')
          .eq('process_id', processId)
          .eq('company_id', activeCompany.id)
          .order('evaluated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (evaluationError && evaluationError.code !== 'PGRST116') {
          throw evaluationError
        }

        if (evaluationData) {
          setCurrentEvaluation(evaluationData)
          setScore(evaluationData.current_score)
          setObservations(evaluationData.observations || '')
        }
      }

    } catch (error) {
      console.error('Erro ao carregar dados do processo:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function saveEvaluation() {
    if (score === null) {
      toast.error('Selecione uma pontuação para o processo')
      return
    }

    if (!activeCompany) {
      toast.error('Empresa não selecionada')
      return
    }

    try {
      setSaving(true)

      const evaluationData = {
        company_id: activeCompany.id,
        process_id: processId,
        current_score: score,
        observations: observations.trim() || null,
        evaluator_id: user.id,
        evaluated_at: new Date().toISOString()
      }

      let result
      if (currentEvaluation) {
        // Atualizar avaliação existente
        result = await supabase
          .from('process_evaluations')
          .update(evaluationData)
          .eq('id', currentEvaluation.id)
          .select()
      } else {
        // Criar nova avaliação
        result = await supabase
          .from('process_evaluations')
          .insert(evaluationData)
          .select()
      }

      if (result.error) throw result.error

      toast.success(currentEvaluation ? 'Avaliação atualizada com sucesso!' : 'Avaliação salva com sucesso!')
      
      // Aguardar um pouco antes de navegar
      setTimeout(() => {
        navigate(`/matriz-bossa/${slug}`)
      }, 1500)

    } catch (error) {
      console.error('Erro ao salvar avaliação:', error)
      toast.error('Erro ao salvar avaliação. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-gray-600">Carregando processo...</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <div className="text-red-500 text-lg mb-2">Erro ao carregar</div>
                <p className="text-gray-600 mb-4">{error}</p>
                <Link
                  to={`/matriz-bossa/${slug}`}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Voltar aos processos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!process || !journey) return null

  const IconComponent = JOURNEY_ICONS[journey.slug] || Target
  const selectedScale = EVALUATION_SCALE.find(s => s.score === score)

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            to={`/matriz-bossa/${slug}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar aos processos
          </Link>
          
          {/* Info da jornada */}
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="flex items-center justify-center w-10 h-10 rounded-lg"
              style={{ 
                backgroundColor: `${journey.color}20`,
                color: journey.color 
              }}
            >
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{journey.name}</h2>
              <p className="text-sm text-gray-600">Avaliação de processo</p>
            </div>
          </div>
        </div>

        {/* Card principal */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          
          {/* Header do processo */}
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono bg-gray-200 text-gray-700 px-2 py-1 rounded">
                    {process.code}
                  </span>
                  {process.category && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {process.category}
                    </span>
                  )}
                  {process.weight > 1 && (
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <Star className="w-3 h-3" />
                      <span>Peso {process.weight}</span>
                    </div>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {process.name}
                </h1>
                <p className="text-gray-600">
                  {process.description}
                </p>
                {process.detailed_description && (
                  <p className="text-gray-500 text-sm mt-2">
                    {process.detailed_description}
                  </p>
                )}
              </div>
              
              {currentEvaluation && (
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-1">Avaliação atual</div>
                  <div className="text-lg font-semibold text-blue-600">
                    {currentEvaluation.current_score}/5
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Escala de avaliação */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Como você avalia este processo na sua empresa?
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {EVALUATION_SCALE.map((scale) => (
                <button
                  key={scale.score}
                  onClick={() => setScore(scale.score)}
                  className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                    score === scale.score
                      ? `border-blue-500 ${scale.bgColor} ring-2 ring-blue-200`
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-6 h-6 rounded-full ${scale.color} flex items-center justify-center text-white text-sm font-bold`}>
                      {scale.score}
                    </div>
                    <span className="font-semibold text-gray-900">{scale.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {scale.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Seleção atual */}
            {selectedScale && (
              <div className={`p-4 rounded-lg ${selectedScale.bgColor} border ${selectedScale.textColor.replace('text-', 'border-')} mb-6`}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className={`w-5 h-5 ${selectedScale.textColor}`} />
                  <span className="font-semibold">
                    Avaliação selecionada: {selectedScale.score}/5 - {selectedScale.label}
                  </span>
                </div>
                <p className={`text-sm ${selectedScale.textColor}`}>
                  {selectedScale.description}
                </p>
              </div>
            )}

            {/* Campo de observações */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="w-4 h-4" />
                Observações (opcional)
              </label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Adicione detalhes sobre o processo na sua empresa, desafios encontrados, ou pontos de melhoria..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                Suas observações ajudam a contextualizar a avaliação e gerar relatórios mais precisos.
              </p>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Link
                to={`/matriz-bossa/${slug}`}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </Link>
              
              <button
                onClick={saveEvaluation}
                disabled={score === null || saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {currentEvaluation ? 'Atualizar Avaliação' : 'Salvar Avaliação'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Dicas de avaliação */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">💡 Dicas para uma avaliação precisa</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Seja honesto sobre a situação atual da sua empresa</li>
            <li>• Considere a consistência na execução do processo</li>
            <li>• Pense na documentação e padronização existente</li>
            <li>• Avalie se há métricas e controles implementados</li>
          </ul>
        </div>
      </div>
    </div>
    </Layout>
  )
}