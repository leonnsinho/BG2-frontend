import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

// Componente principal de Loading
export function Loading({ 
  size = 'md', 
  text = '', 
  className = '',
  variant = 'spinner'
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  if (variant === 'spinner') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <div className="flex items-center space-x-2">
          <Loader2 className={cn('animate-spin text-primary-600', sizeClasses[size])} />
          {text && (
            <span className="text-sm text-gray-600">{text}</span>
          )}
        </div>
      </div>
    )
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center justify-center space-x-1', className)}>
        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        {text && (
          <span className="ml-2 text-sm text-gray-600">{text}</span>
        )}
      </div>
    )
  }

  return null
}

// Skeleton para loading
export function Skeleton({ className = '', children, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 rounded',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Componentes específicos existentes (mantidos para compatibilidade)
const Spinner = ({ className, size = "default" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-6 h-6", 
    lg: "w-8 h-8"
  }

  return (
    <Loader2 
      className={cn("animate-spin", sizeClasses[size], className)} 
    />
  )
}

const LoadingSpinner = ({ text = "Carregando...", className }) => (
  <div className={cn("flex items-center justify-center space-x-2", className)}>
    <Spinner />
    <span className="text-sm text-gray-600">{text}</span>
  </div>
)

const LoadingButton = ({ children, isLoading, ...props }) => (
  <button disabled={isLoading} {...props}>
    {isLoading ? (
      <div className="flex items-center space-x-2">
        <Spinner size="sm" />
        <span>Carregando...</span>
      </div>
    ) : children}
  </button>
)

const LoadingCard = ({ className }) => (
  <div className={cn("card animate-pulse", className)}>
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="h-20 bg-gray-200 rounded"></div>
  </div>
)

const LoadingTable = ({ rows = 5, columns = 4, className }) => (
  <div className={cn("bg-white rounded-lg border", className)}>
    <div className="animate-pulse">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded flex-1"></div>
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-b last:border-b-0 px-6 py-4">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-gray-200 rounded flex-1"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Novos skeletons específicos
export function CardSkeleton() {
  return (
    <div className="card">
      <div className="space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card p-6">
          <div className="flex items-center">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="ml-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Stats */}
      <StatsSkeleton />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CardSkeleton />
        </div>
        <div className="lg:col-span-2">
          <CardSkeleton />
        </div>
      </div>
    </div>
  )
}

export { 
  Spinner, 
  LoadingSpinner, 
  LoadingButton, 
  LoadingCard, 
  LoadingTable 
}
