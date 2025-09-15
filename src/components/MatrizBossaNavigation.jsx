import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useUserContext } from '../contexts/UserContext'
import MatrizBossaDashboard from './MatrizBossaDashboard'
import { 
  Target, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Settings,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { Link } from 'react-router-dom'

// Mapeamento de ícones por slug da jornada
const JOURNEY_ICONS = {
  'estrategica': Target,
  'financeira': TrendingUp,
  'pessoas-cultura': Users,
  'receita-crm': DollarSign,
  'operacional': Settings
}

export default function MatrizBossaNavigation() {
  const [journeys, setJourneys] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { activeCompany } = useUserContext()

  useEffect(() => {
    console.log('🚀 MatrizBossaNavigation montado, iniciando busca...')
    fetchJourneys()
  }, [])

  async function fetchJourneys() {
    try {
      console.log('🔍 Iniciando busca por jornadas da Matriz Bossa...')
      setLoading(true)
      
      const { data: journeysData, error: journeysError } = await supabase
        .from('journeys')
        .select(`
          *,
          processes:processes(count)
        `)
        .eq('is_active', true)
        .order('order_index')

      console.log('📊 Journeys data encontrada:', journeysData)
      console.log('📊 Journeys error:', journeysError)
      console.log('📊 Quantidade de jornadas:', journeysData?.length || 0)

      if (journeysError) throw journeysError

      // Se não encontrou jornadas ativas, vamos ver todas as jornadas para debug
      if (!journeysData || journeysData.length === 0) {
        console.log('⚠️ Nenhuma jornada ativa encontrada, verificando todas as jornadas...')
        
        const { data: allJourneys, error: allError } = await supabase
          .from('journeys')
          .select('id, name, slug, is_active, order_index')
          .order('order_index')
          
        console.log('📋 Todas as jornadas no banco:', allJourneys)
        console.log('📋 Erro ao buscar todas:', allError)
        
        if (allJourneys && allJourneys.length > 0) {
          console.log('💡 Encontradas jornadas inativas. Ativando temporariamente...')
          // Temporariamente, vamos buscar sem filtro de is_active
          const { data: journeysDataFallback, error: journeysErrorFallback } = await supabase
            .from('journeys')
            .select(`
              *,
              processes:processes(count)
            `)
            .order('order_index')
            
          console.log('📊 Jornadas (fallback):', journeysDataFallback)
          
          if (journeysDataFallback && journeysDataFallback.length > 0) {
            // Processar dados para incluir contagem
            const processedJourneys = journeysDataFallback.map(journey => ({
              ...journey,
              processCount: journey.processes?.length || 0
            }))

            setJourneys(processedJourneys)
            return
          }
        }
      }

      // Processar dados para incluir contagem
      const processedJourneys = journeysData.map(journey => ({
        ...journey,
        processCount: journey.processes?.length || 0
      }))

      setJourneys(processedJourneys)
    } catch (error) {
      console.error('Erro ao carregar jornadas:', error)
      setError('Erro ao carregar jornadas. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-600">Carregando Matriz Bossa...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ Erro ao carregar</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchJourneys}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Matriz Bossa Digitalizada
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Avalie a maturidade do seu negócio através de <strong>5 jornadas fundamentais</strong> e 
          <strong> 143 processos essenciais</strong> da metodologia Bossa Focus.
        </p>
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
          <p className="text-blue-800 text-sm">
            <strong>💡 Como funciona:</strong> Clique em uma jornada para avaliar seus processos com notas de 0 a 5. 
            O sistema calculará automaticamente sua maturidade organizacional.
          </p>
        </div>
      </div>

      {/* Dashboard da empresa atual */}
      {activeCompany && (
        <div className="mb-12">
          <MatrizBossaDashboard />
        </div>
      )}

      {/* Grid de Jornadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {journeys.map((journey) => {
          const IconComponent = JOURNEY_ICONS[journey.slug] || Target
          
          return (
            <Link
              key={journey.id}
              to={`/matriz-bossa/${journey.slug}`}
              onClick={() => {
                console.log(`🚀 Navegando para jornada: ${journey.slug}`)
                console.log(`🚀 URL destino: /matriz-bossa/${journey.slug}`)
                console.log(`🚀 Journey data:`, journey)
              }}
              className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-gray-300"
            >
              {/* Background color strip */}
              <div 
                className="h-2 w-full"
                style={{ backgroundColor: journey.color }}
              />
              
              {/* Card content */}
              <div className="p-6">
                {/* Header com ícone */}
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="flex items-center justify-center w-12 h-12 rounded-lg"
                    style={{ 
                      backgroundColor: `${journey.color}20`,
                      color: journey.color 
                    }}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>

                {/* Título */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {journey.name}
                </h3>

                {/* Descrição */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {journey.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                    <span>{journey.processCount} processos</span>
                  </div>
                  
                  <div className="text-blue-600 font-medium group-hover:text-blue-700">
                    Avaliar →
                  </div>
                </div>
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </Link>
          )
        })}
      </div>

      {/* Stats resumo */}
      {journeys.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Metodologia Bossa Focus
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {journeys.length}
              </div>
              <div className="text-gray-600">Jornadas de Negócio</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {journeys.reduce((total, journey) => total + journey.processCount, 0)}
              </div>
              <div className="text-gray-600">Processos Fundamentais</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                0-5
              </div>
              <div className="text-gray-600">Escala de Maturidade</div>
            </div>
          </div>
          
          <p className="text-gray-600 mt-6 max-w-2xl mx-auto">
            Cada processo pode ser avaliado de 0 (inexistente) a 5 (otimizado e automatizado). 
            O sistema calcula automaticamente sua maturidade organizacional e gera recomendações personalizadas.
          </p>
        </div>
      )}

      {/* Estado vazio */}
      {journeys.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma jornada encontrada
          </h3>
          <p className="text-gray-600">
            As jornadas da Matriz Bossa ainda não foram configuradas.
          </p>
        </div>
      )}
    </div>
  )
}