import React from 'react'

/**
 * Componente de Métrica com Progress Bar - Estilo Minimalista
 * @param {string} title - Título da métrica
 * @param {number} current - Valor atual
 * @param {number} target - Valor alvo/meta
 * @param {string} color - Cor do tema (primary, success, warning, blue)
 * @param {boolean} loading - Estado de carregamento
 */
export const ProgressMetric = ({ 
  title, 
  current = 0, 
  target = 100, 
  color = 'primary',
  loading = false
}) => {
  // Calcular porcentagem
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0
  
  // Cores por tema - usando apenas a cor da barra
  const colorMap = {
    primary: {
      progress: 'bg-gradient-to-r from-[#EBA500] to-[#EBA500]/80'
    },
    success: {
      progress: 'bg-gradient-to-r from-green-500 to-green-400'
    },
    warning: {
      progress: 'bg-gradient-to-r from-orange-500 to-orange-400'
    },
    blue: {
      progress: 'bg-gradient-to-r from-blue-500 to-blue-400'
    },
    purple: {
      progress: 'bg-gradient-to-r from-purple-500 to-purple-400'
    }
  }
  
  const colors = colorMap[color] || colorMap.primary
  
  return (
    <div className="space-y-3">
      {loading ? (
        <>
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 bg-gray-100 rounded animate-pulse"></div>
        </>
      ) : (
        <>
          {/* Título e porcentagem na mesma linha */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#373435]">{title}</span>
            <span className="text-sm font-semibold text-[#373435]">{Math.round(percentage)}%</span>
          </div>
          
          {/* Progress Bar minimalista */}
          <div className="flex-1 bg-[#373435]/10 rounded-full h-3">
            <div 
              className={`${colors.progress} h-3 rounded-full transition-all duration-500 shadow-sm`}
              style={{ 
                width: `${percentage}%`
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}

// Remover animações CSS não utilizadas no estilo minimalista
