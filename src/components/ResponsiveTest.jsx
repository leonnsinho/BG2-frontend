import React, { useState, useEffect } from 'react'
import { Monitor, Tablet, Smartphone } from 'lucide-react'

export function ResponsiveTest() {
  const [screenSize, setScreenSize] = useState('')
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateScreenInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setDimensions({ width, height })
      
      if (width >= 1024) {
        setScreenSize('desktop')
      } else if (width >= 768) {
        setScreenSize('tablet')
      } else {
        setScreenSize('mobile')
      }
    }

    updateScreenInfo()
    window.addEventListener('resize', updateScreenInfo)
    return () => window.removeEventListener('resize', updateScreenInfo)
  }, [])

  const getIcon = () => {
    switch (screenSize) {
      case 'desktop': return <Monitor className="w-5 h-5" />
      case 'tablet': return <Tablet className="w-5 h-5" />
      case 'mobile': return <Smartphone className="w-5 h-5" />
      default: return <Monitor className="w-5 h-5" />
    }
  }

  const getColor = () => {
    switch (screenSize) {
      case 'desktop': return 'text-blue-600 bg-blue-50'
      case 'tablet': return 'text-green-600 bg-green-50'
      case 'mobile': return 'text-purple-600 bg-purple-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className={`fixed bottom-4 right-4 p-3 rounded-lg shadow-lg border z-50 ${getColor()}`}>
      <div className="flex items-center space-x-2">
        {getIcon()}
        <div className="text-sm font-medium">
          <div className="capitalize">{screenSize}</div>
          <div className="text-xs opacity-75">
            {dimensions.width} × {dimensions.height}
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente para testar breakpoints
export function ResponsiveBreakpoints() {
  return (
    <div className="fixed bottom-20 right-4 p-4 bg-white rounded-lg shadow-lg border z-50">
      <h3 className="font-semibold text-sm mb-3">Breakpoints Test</h3>
      <div className="space-y-2 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded sm:bg-green-500"></div>
          <span>SM (640px+)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded md:bg-green-500"></div>
          <span>MD (768px+)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded lg:bg-green-500"></div>
          <span>LG (1024px+)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded xl:bg-green-500"></div>
          <span>XL (1280px+)</span>
        </div>
      </div>
    </div>
  )
}
