import React, { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

/**
 * Componente que detecta atualizações da aplicação e notifica o usuário
 * Funciona com Service Worker para garantir que sempre usem a versão mais recente
 */
export default function UpdateNotifier() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [isReloading, setIsReloading] = useState(false)

  useEffect(() => {
    // Verificar se Service Worker está disponível
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker não suportado neste navegador')
      return
    }

    let registration = null

    // Registrar Service Worker
    const registerSW = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js')
        console.log('✅ Service Worker registrado:', registration)

        // Verificar se há atualização ao registrar
        await registration.update()
        
        // Listener para quando o SW está instalando/esperando
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          console.log('🆕 Nova versão detectada (updatefound)')
          
          newWorker.addEventListener('statechange', () => {
            console.log('🔄 SW State:', newWorker.state)
            
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nova versão disponível
              console.log('✨ Nova versão instalada e pronta!')
              setShowUpdate(true)
            }
          })
        })

      } catch (error) {
        console.error('❌ Erro ao registrar Service Worker:', error)
      }
    }

    // Listener para mensagens do Service Worker
    const handleSWMessage = (event) => {
      console.log('📨 Mensagem do SW:', event.data)
      
      if (event.data && event.data.type === 'NEW_VERSION') {
        console.log('🆕 Nova versão disponível:', event.data.version)
        setShowUpdate(true)
      }
    }

    // Verificar atualizações periodicamente (a cada 5 minutos)
    const checkForUpdates = async () => {
      try {
        if (registration) {
          console.log('🔍 Verificando atualizações...')
          await registration.update()
        }
      } catch (error) {
        console.error('❌ Erro ao verificar atualizações:', error)
      }
    }

    // Verificar ao dar foco na aba
    const handleVisibilityChange = () => {
      if (!document.hidden && registration) {
        console.log('👀 Aba ganhou foco, verificando atualizações...')
        checkForUpdates()
      }
    }

    // Setup
    registerSW()
    navigator.serviceWorker.addEventListener('message', handleSWMessage)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Verificar atualizações periodicamente
    const updateInterval = setInterval(checkForUpdates, 5 * 60 * 1000) // 5 minutos

    // Cleanup
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSWMessage)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(updateInterval)
    }
  }, [])

  const handleUpdate = async () => {
    setIsReloading(true)
    
    try {
      // Pedir para o Service Worker pular waiting
      const registration = await navigator.serviceWorker.getRegistration()
      
      if (registration && registration.waiting) {
        console.log('⏭️ Enviando SKIP_WAITING para o SW')
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        
        // Aguardar o SW assumir controle
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('🔄 Controller mudou, recarregando página...')
          window.location.reload()
        })
      } else {
        // Forçar reload mesmo sem SW waiting
        console.log('🔄 Recarregando página...')
        window.location.reload(true)
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar:', error)
      // Fallback: reload forçado
      window.location.reload(true)
    }
  }

  if (!showUpdate) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] animate-slideUp">
      <div className="bg-gradient-to-r from-[#EBA500] to-[#d99500] text-white rounded-2xl shadow-2xl p-4 max-w-sm border-2 border-white/20 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-base mb-1">
              Nova Versão Disponível! 🎉
            </h4>
            <p className="text-sm text-white/90 mb-3">
              Atualize agora para ter acesso às últimas melhorias e correções.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                disabled={isReloading}
                className="flex-1 bg-white text-[#EBA500] hover:bg-gray-100 font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReloading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Atualizando...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span className="text-sm">Atualizar Agora</span>
                  </>
                )}
              </button>
              
              {!isReloading && (
                <button
                  onClick={() => setShowUpdate(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                  title="Fechar (atualizar depois)"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
