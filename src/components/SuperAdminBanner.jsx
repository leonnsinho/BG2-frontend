import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Shield, ArrowLeft, Building2 } from 'lucide-react'

/**
 * Banner que aparece no topo das páginas quando o Super Admin
 * está visualizando dados de uma empresa específica
 */
export default function SuperAdminBanner() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [context, setContext] = useState(null)
  
  useEffect(() => {
    // Verificar se está vindo do admin
    const fromAdmin = searchParams.get('from') === 'admin'
    const companyId = searchParams.get('companyId')
    
    if (fromAdmin && companyId) {
      // Buscar contexto do sessionStorage
      const savedContext = sessionStorage.getItem('superAdminContext')
      if (savedContext) {
        const parsedContext = JSON.parse(savedContext)
        setContext(parsedContext)
      }
    } else {
      setContext(null)
    }
  }, [searchParams])
  
  const handleReturn = () => {
    if (context?.returnUrl) {
      // Limpar contexto
      sessionStorage.removeItem('superAdminContext')
      navigate(context.returnUrl)
    }
  }
  
  // Não mostrar banner se não há contexto
  if (!context) return null
  
  return (
    <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 border-b-4 border-purple-700/30 shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Ícone de Super Admin */}
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/40 shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            
            {/* Informações */}
            <div className="flex items-center space-x-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-white font-bold text-base">
                    🔐 Modo Super Admin
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="w-3.5 h-3.5 text-white/80" />
                  <p className="text-white/90 text-xs font-medium">
                    {context.companyName}
                  </p>
                </div>
              </div>
              
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white border border-white/40 shadow-sm">
                Visualização de Gestão
              </span>
            </div>
          </div>
          
          {/* Botão de Voltar */}
          <button
            onClick={handleReturn}
            className="flex items-center space-x-2 px-5 py-2 bg-white hover:bg-gray-50 text-purple-600 font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 border border-purple-200 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Gerenciamento</span>
          </button>
        </div>
      </div>
    </div>
  )
}
