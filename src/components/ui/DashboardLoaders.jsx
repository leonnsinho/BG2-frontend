import React, { memo, useEffect, useState } from 'react'
import { LoadingSpinner, SkeletonCard } from './FeedbackComponents'
import { Card } from './Card'

// Loading otimizado para o dashboard
export const DashboardSkeleton = memo(() => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-5 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-9 bg-gray-200 rounded w-24"></div>
          <div className="h-9 bg-gray-200 rounded w-28"></div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SkeletonCard />
        </div>
        <div className="lg:col-span-2">
          <SkeletonCard />
        </div>
      </div>

      {/* Progress skeleton */}
      <Card className="p-6">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-3"></div>
              <div className="h-5 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-40 mx-auto"></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
})

DashboardSkeleton.displayName = 'DashboardSkeleton'

// Loading inteligente que mostra progresso
export const SmartLoader = memo(({ 
  text = "Carregando dashboard...", 
  showProgress = true,
  timeout = 3000 
}) => {
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('auth')

  useEffect(() => {
    const stages = [
      { name: 'auth', text: 'Autenticando usuário...', duration: 800 },
      { name: 'profile', text: 'Carregando perfil...', duration: 600 },
      { name: 'permissions', text: 'Verificando permissões...', duration: 400 },
      { name: 'dashboard', text: 'Preparando dashboard...', duration: 400 }
    ]

    let currentStage = 0
    let currentProgress = 0

    const updateProgress = () => {
      if (currentStage < stages.length) {
        const stageInfo = stages[currentStage]
        setStage(stageInfo.name)
        setProgress(currentProgress)

        setTimeout(() => {
          currentProgress += 100 / stages.length
          currentStage++
          if (currentStage <= stages.length) {
            updateProgress()
          }
        }, stageInfo.duration)
      }
    }

    const timer = setTimeout(updateProgress, 100)
    return () => clearTimeout(timer)
  }, [])

  const getStageText = () => {
    const stageTexts = {
      auth: 'Autenticando usuário...',
      profile: 'Carregando perfil...',
      permissions: 'Verificando permissões...',
      dashboard: 'Preparando dashboard...'
    }
    return stageTexts[stage] || text
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
      <LoadingSpinner size="lg" color="blue" />
      <div className="text-center">
        <p className="text-lg font-medium text-gray-900 mb-2">
          {getStageText()}
        </p>
        {showProgress && (
          <div className="w-64 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        )}
        <p className="text-sm text-gray-500 mt-2">
          {Math.min(Math.round(progress), 100)}% concluído
        </p>
      </div>
    </div>
  )
})

SmartLoader.displayName = 'SmartLoader'

// Loading com timeout e fallback
export const DashboardLoader = memo(({ 
  onTimeout,
  timeout = 5000 
}) => {
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(true)
      onTimeout?.()
    }, timeout)

    return () => clearTimeout(timer)
  }, [timeout, onTimeout])

  if (showFallback) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ops! Está demorando mais que o esperado...
          </h3>
          <p className="text-gray-600 mb-4">
            Verifique sua conexão ou tente recarregar a página.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    )
  }

  return <SmartLoader />
})

DashboardLoader.displayName = 'DashboardLoader'
