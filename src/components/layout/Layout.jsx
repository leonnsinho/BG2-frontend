import React, { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Button } from '../ui/Button'
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
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Botão flutuante para abrir sidebar no mobile */}
      <Button
        variant="secondary"
        size="icon"
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-primary-500 hover:bg-primary-600 text-background shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Main Content */}
      <div className="flex flex-col lg:ml-72">
        {/* Page Content */}
        <main className={cn(
          "flex-1 p-4 sm:p-6 lg:p-8 lg:pt-6",
          className
        )}>
          {children}
        </main>
      </div>
    </div>
  )
}

export { Layout }
