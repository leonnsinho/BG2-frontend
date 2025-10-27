import React from 'react'

/**
 * Badge de Notificação com animação de pulse
 * Exibe contador de itens pendentes
 */
const NotificationBadge = ({ count, pulse = true, size = 'sm' }) => {
  if (!count || count === 0) return null

  const sizeClasses = {
    xs: 'min-w-[16px] h-4 text-[9px] px-1',
    sm: 'min-w-[20px] h-5 text-[10px] px-1.5',
    md: 'min-w-[24px] h-6 text-xs px-2',
    lg: 'min-w-[28px] h-7 text-sm px-2.5'
  }

  return (
    <span 
      className={`
        ${sizeClasses[size]}
        inline-flex items-center justify-center
        rounded-full
        bg-red-500 text-white
        font-bold
        shadow-lg
        ${pulse ? 'animate-pulse' : ''}
        transition-all duration-300
      `}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

export default NotificationBadge
