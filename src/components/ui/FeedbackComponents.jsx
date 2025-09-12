import React from 'react'
import { Loader2, CheckCircle, AlertCircle, Info, X } from 'lucide-react'

// Componente de loading avançado
export function LoadingSpinner({ 
  size = 'md', 
  color = 'blue', 
  text = null, 
  overlay = false,
  className = '' 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    gray: 'text-gray-600',
    white: 'text-white'
  }

  const spinner = (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 
        className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}
      />
      {text && (
        <span className={`ml-2 text-sm ${colorClasses[color]}`}>
          {text}
        </span>
      )}
    </div>
  )

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-xl">
          {spinner}
        </div>
      </div>
    )
  }

  return spinner
}

// Skeleton loader para listas
export function SkeletonLoader({ count = 3, height = 'h-4', className = '' }) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`bg-gray-200 rounded ${height} w-full`}></div>
      ))}
    </div>
  )
}

// Skeleton para cards
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`animate-pulse bg-white rounded-lg border p-6 ${className}`}>
      <div className="flex items-center space-x-4">
        <div className="rounded-full bg-gray-200 h-12 w-12"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  )
}

// Estados vazios
export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action = null,
  className = ''
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && (
        <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {action}
    </div>
  )
}

// Componente de notificação toast
export function Toast({ 
  type = 'info', 
  title, 
  message, 
  onClose,
  autoClose = true,
  duration = 5000,
  className = ''
}) {
  const [isVisible, setIsVisible] = React.useState(true)

  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(), 300)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [autoClose, duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose?.(), 300)
  }

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      titleColor: 'text-green-800',
      messageColor: 'text-green-700'
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      titleColor: 'text-red-800',
      messageColor: 'text-red-700'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-800',
      messageColor: 'text-yellow-700'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-800',
      messageColor: 'text-blue-700'
    }
  }

  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <div
      className={`
        fixed top-4 right-4 max-w-sm w-full transform transition-all duration-300 z-50
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${className}
      `}
    >
      <div className={`
        rounded-lg border shadow-lg p-4
        ${config.bgColor} ${config.borderColor}
      `}>
        <div className="flex items-start">
          <Icon className={`w-5 h-5 mt-0.5 ${config.iconColor}`} />
          <div className="ml-3 flex-1">
            {title && (
              <h4 className={`text-sm font-semibold ${config.titleColor}`}>
                {title}
              </h4>
            )}
            <p className={`text-sm ${config.messageColor} ${title ? 'mt-1' : ''}`}>
              {message}
            </p>
          </div>
          <button
            onClick={handleClose}
            className={`ml-4 ${config.iconColor} hover:opacity-70 transition-opacity`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Container para múltiplos toasts
export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  )
}

// Progress bar
export function ProgressBar({ 
  value, 
  max = 100, 
  color = 'blue',
  size = 'md',
  showLabel = false,
  className = ''
}) {
  const percentage = Math.min((value / max) * 100, 100)

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600'
  }

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progresso</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Componente de erro com retry
export function ErrorState({
  title = 'Algo deu errado',
  message = 'Ocorreu um erro inesperado. Tente novamente.',
  onRetry,
  showRetry = true,
  className = ''
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">
        {message}
      </p>
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Tentar Novamente
        </button>
      )}
    </div>
  )
}

// Tooltip simples
export function Tooltip({ children, content, position = 'top' }) {
  const [isVisible, setIsVisible] = React.useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`
          absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded
          whitespace-nowrap ${positionClasses[position]}
        `}>
          {content}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45" />
        </div>
      )}
    </div>
  )
}

// Status badge
export function StatusBadge({ 
  status, 
  variant = 'default',
  size = 'md',
  className = ''
}) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base'
  }

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800'
  }

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full
      ${sizeClasses[size]} ${variantClasses[variant]} ${className}
    `}>
      {status}
    </span>
  )
}
