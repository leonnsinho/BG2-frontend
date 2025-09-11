import React, { useState, useEffect } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { cn } from '../../utils/cn'

const Layout = ({ children, className }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Fechar sidebar ao redimensionar para desktop
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 lg:pl-64">
        {/* Header */}
        <Header onSidebarToggle={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <main className={cn("flex-1 p-4 sm:p-6 lg:p-8", className)}>
          {children}
        </main>
      </div>
    </div>
  )
}

export { Layout }
