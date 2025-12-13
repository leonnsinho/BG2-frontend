import React from 'react'
import * as LucideIcons from 'lucide-react'

export function renderIcon(iconValue, className = 'h-6 w-6') {
  if (!iconValue) return null
  
  // Se começa com "icon:", é um ícone SVG do Lucide
  if (iconValue.startsWith('icon:')) {
    const iconName = iconValue.replace('icon:', '')
    const IconComponent = LucideIcons[iconName]
    
    if (IconComponent) {
      return <IconComponent className={className} />
    }
    return null
  }
  
  // Caso contrário, é um emoji
  return <span className="text-2xl">{iconValue}</span>
}
