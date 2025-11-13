import React from 'react'
import { LogOut, ArrowRight } from 'lucide-react'

export default function LogoutScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        {/* Ícone animado */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full opacity-20 animate-ping"></div>
          </div>
          <div className="relative flex items-center justify-center w-24 h-24 mx-auto bg-gradient-to-br from-gray-600 to-gray-700 rounded-full shadow-xl">
            <LogOut className="h-12 w-12 text-white" />
          </div>
        </div>

        {/* Texto */}
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Até logo! 👋
        </h2>
        <p className="text-gray-600 text-lg mb-8">
          Volte pronto para mais conquistas
        </p>

        {/* Mensagem adicional */}
        <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
          <span>Redirecionando para o login</span>
          <ArrowRight className="h-4 w-4 animate-pulse" />
        </div>

        {/* Barra de progresso animada */}
        <div className="mt-8 w-64 mx-auto">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-gray-500 to-gray-600 rounded-full animate-loading-bar"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
