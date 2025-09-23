import React, { useState, useEffect } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { usePermissions } from '../../hooks/usePermissions'
import { cn } from '../../utils/cn'

const Layout = ({ children, className }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const permissions = usePermissions()

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

  // Verificar se deve mostrar header (não mostrar para gestores e super admin)
  const shouldShowHeader = !permissions.isGestor() && !permissions.isSuperAdmin()

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content */}
      <div className="flex flex-col lg:ml-72">
        {/* Header - só mostra se não for gestor */}
        {shouldShowHeader && (
          <Header onSidebarToggle={() => setSidebarOpen(true)} />
        )}

        {/* Page Content */}
        <main className={cn(
          "flex-1 p-4 sm:p-6 lg:p-8",
          !shouldShowHeader && "lg:pt-6", // Se não tem header, ajustar padding top
          className
        )}>
          {children}
        </main>
      </div>
    </div>
  )
}

export { Layout }
