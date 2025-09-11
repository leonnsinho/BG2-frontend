import React, { useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { cn } from '../../utils/cn'

const Layout = ({ children, className }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <Header onSidebarToggle={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <main className={cn("p-4 sm:p-6 lg:p-8", className)}>
          {children}
        </main>
      </div>
    </div>
  )
}

export { Layout }
