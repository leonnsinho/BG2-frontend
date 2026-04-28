import React, { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Loader, TrendingUp } from 'lucide-react'
import { calculateProcessProgress } from '../../services/processMaturityService'

/**
 * Componente de Barra de Progresso de Amadurecimento
 * Exibe visualmente o progresso de conclusão das tarefas de um processo
 */
const ProcessProgressBar = ({ processId, companyId, onProgressUpdate, showDetails = true, refreshTrigger = 0 }) => {
  const [progress, setProgress] = useState({ total: 0, completed: 0, percentage: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (processId && companyId) {
      loadProgress()
    } else {
      // Se não tiver IDs, mostrar estado vazio
      setProgress({ total: 0, completed: 0, percentage: 0 })
      setLoading(false)
    }
  }, [processId, companyId, refreshTrigger]) // 🔥 NOVO: Adicionar refreshTrigger como dependência

  const loadProgress = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await calculateProcessProgress(processId, companyId)
      
      // Garantir que data seja um objeto válido
      const validProgress = {
        total: data?.total || 0,
        completed: data?.completed || 0,
        percentage: data?.percentage || 0
      }
      
      setProgress(validProgress)
      
      // Notificar componente pai sobre mudança de progresso
      if (onProgressUpdate) {
        onProgressUpdate(validProgress)
      }
    } catch (err) {
      console.error('Erro ao carregar progresso:', err)
      setError('Não foi possível carregar o progresso')
      // Definir valores padrão em caso de erro
      setProgress({ total: 0, completed: 0, percentage: 0 })
    } finally {
      setLoading(false)
    }
  }

  // Determinar cor da barra baseado no progresso
  const getProgressColor = () => {
    if (progress.percentage === 100) return 'bg-green-500'
    if (progress.percentage >= 75) return 'bg-blue-500'
    if (progress.percentage >= 50) return 'bg-yellow-500'
    if (progress.percentage >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  // Determinar cor do texto
  const getTextColor = () => {
    if (progress.percentage === 100) return 'text-green-600'
    if (progress.percentage >= 75) return 'text-blue-600'
    if (progress.percentage >= 50) return 'text-yellow-600'
    if (progress.percentage >= 25) return 'text-orange-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader className="h-5 w-5 text-gray-400 animate-spin" />
        <span className="ml-2 text-sm text-gray-500">Calculando progresso...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center text-red-600 text-sm">
        <AlertCircle className="h-4 w-4 mr-2" />
        <span>Erro ao carregar progresso</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header com título e percentual */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-4 w-4 text-[#EBA500]" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Progresso de Amadurecimento
          </span>
        </div>
        <span className={`text-lg font-bold ${getTextColor()}`}>
          {progress.percentage.toFixed(0)}%
        </span>
      </div>

      {/* Barra de progresso visual */}
      <div className="relative w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden shadow-inner">
        <div 
          className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor()}`}
          style={{ width: `${progress.percentage}%` }}
        >
          {/* Efeito de brilho animado quando em 100% */}
          {progress.percentage === 100 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
          )}
        </div>
      </div>

      {/* Detalhes e status */}
      {showDetails && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">
            {progress.completed} de {progress.total} {progress.total === 1 ? 'tarefa concluída' : 'tarefas concluídas'}
          </span>
          
          {progress.percentage === 100 && progress.total > 0 && (
            <span className="flex items-center text-green-600 font-semibold animate-pulse">
              <CheckCircle className="h-4 w-4 mr-1" />
              Pronto para validação!
            </span>
          )}
          
          {progress.total === 0 && (
            <span className="flex items-center text-amber-600 font-medium">
              <AlertCircle className="h-4 w-4 mr-1" />
              Nenhuma tarefa criada
            </span>
          )}
        </div>
      )}

      {/* Mensagem motivacional baseada no progresso */}
      {showDetails && progress.total > 0 && progress.percentage < 100 && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            {progress.percentage >= 75 && '🎯 Quase lá! Continue o ótimo trabalho.'}
            {progress.percentage >= 50 && progress.percentage < 75 && '💪 Metade do caminho! Mantenha o ritmo.'}
            {progress.percentage >= 25 && progress.percentage < 50 && '🚀 Progredindo bem! Continue avançando.'}
            {progress.percentage < 25 && progress.percentage > 0 && '📝 Começando a jornada! Cada tarefa conta.'}
            {progress.percentage === 0 && '🎬 Hora de começar! Conclua as tarefas para amadurecer este processo.'}
          </p>
        </div>
      )}
    </div>
  )
}

export default ProcessProgressBar
