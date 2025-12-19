import React, { useState, useEffect, useRef } from 'react'
import { RefreshCw, X } from 'lucide-react'

const UpdateNotification = () => {
  const [showUpdate, setShowUpdate] = useState(false)
  const [newVersion, setNewVersion] = useState(null)
  const [currentVersion, setCurrentVersion] = useState(null)
  const [isReloading, setIsReloading] = useState(false)
  const checkIntervalRef = useRef(null)

  useEffect(() => {
    // Versão atual salva
    const savedVersion = localStorage.getItem('app-version')
    setCurrentVersion(savedVersion)
    
    console.log('🚀 UpdateNotification montado')
    console.log('📦 Versão salva no localStorage:', savedVersion)
    
    // Verificar se está rodando como PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true
    console.log('📱 Rodando como PWA?', isPWA)
    
    // Função para verificar versão do Service Worker
    const checkVersion = async () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        console.log('🔍 Verificando versão do Service Worker...')
        
        const messageChannel = new MessageChannel()
        messageChannel.port1.onmessage = (event) => {
          console.log('📬 Resposta do SW recebida:', event.data)
          if (event.data && (event.data.type === 'VERSION_RESPONSE' || event.data.type === 'VERSION')) {
            const swVersion = event.data.version
            console.log('📡 Versão recebida do SW:', swVersion)
            console.log('📦 Versão salva:', savedVersion)
            
            if (!savedVersion || savedVersion !== swVersion) {
              console.log('🆕 Versão diferente detectada! Mostrando banner...')
              setNewVersion(swVersion)
              setShowUpdate(true)
            } else {
              console.log('✅ Versão atual está atualizada')
            }
          }
        }
        
        navigator.serviceWorker.controller.postMessage(
          { type: 'CHECK_UPDATE' },
          [messageChannel.port2]
        )
      } else {
        console.log('⚠️ Nenhum Service Worker controller ativo')
      }
    }
    
    // Listener para mensagens do Service Worker
    const handleMessage = (event) => {
      console.log('📨 Mensagem recebida do SW:', event.data)
      
      if (event.data && event.data.type === 'NEW_VERSION') {
        const incomingVersion = event.data.version
        
        console.log('🔔 Nova versão detectada via mensagem:', incomingVersion)
        console.log('📦 Versão salva:', savedVersion)
        
        if (!savedVersion || savedVersion !== incomingVersion) {
          console.log('✅ Mostrando banner de atualização')
          setNewVersion(incomingVersion)
          setShowUpdate(true)
        }
      }
    }

    // Listener para quando detecta novo SW instalado
    const handleUpdateFound = async () => {
      console.log('🆕 Update found no registration!')
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration && registration.waiting) {
        console.log('⏳ Novo SW waiting - mostrando notificação')
        setShowUpdate(true)
      }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage)
      
      // Verificar versão ao montar componente
      navigator.serviceWorker.ready.then(registration => {
        console.log('✅ Service Worker pronto')
        checkVersion()
        
        // Listener para updatefound
        registration.addEventListener('updatefound', handleUpdateFound)
        
        // Forçar update do Service Worker
        registration.update().then(() => {
          console.log('🔄 Service Worker update disparado')
        }).catch(err => {
          console.error('❌ Erro ao atualizar SW:', err)
        })
      })
      
      // Verificar mais frequentemente - a cada 1 minuto
      const intervalTime = 60 * 1000 // 1 minuto
      console.log(`⏰ Configurando verificação automática a cada ${intervalTime/1000}s`)
      
      checkIntervalRef.current = setInterval(() => {
        console.log('⏰ Verificação automática disparada')
        checkVersion()
        
        // Também forçar update do SW registration
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            registration.update()
          }
        })
      }, intervalTime)

      // Detectar novo Service Worker instalado
      const handleControllerChange = () => {
        console.log('🔄 Controller mudou! Novo Service Worker assumiu controle')
        checkVersion()
      }
      
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
      
      // Detectar quando Service Worker está waiting
      navigator.serviceWorker.ready.then(registration => {
        if (registration.waiting) {
          console.log('⏳ Service Worker waiting detectado')
          checkVersion()
        }
        
        // Listener para mudanças no registration
        registration.addEventListener('updatefound', () => {
          console.log('🆕 Atualização encontrada!')
          const newWorker = registration.installing
          
          newWorker.addEventListener('statechange', () => {
            console.log('🔄 SW state:', newWorker.state)
            if (newWorker.state === 'installed') {
              console.log('✅ Novo SW instalado')
              checkVersion()
            }
          })
        })
      })

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage)
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current)
        }
      }
    } else {
      console.log('❌ Service Worker não suportado neste navegador')
    }
  }, [])

  const handleUpdate = async () => {
    console.log('🔄 Iniciando atualização...')
    setIsReloading(true)
    
    try {
      // Salvar nova versão
      if (newVersion) {
        localStorage.setItem('app-version', newVersion)
        console.log('💾 Versão salva:', newVersion)
      }
      
      // Enviar mensagem para Service Worker pular waiting
      const registration = await navigator.serviceWorker.getRegistration()
      
      if (registration && registration.waiting) {
        console.log('⏭️ Enviando SKIP_WAITING para o SW')
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        
        // Aguardar o SW assumir controle
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('🔄 Controller mudou, recarregando página...')
          window.location.reload(true)
        }, { once: true })
      } else {
        // Forçar reload mesmo sem SW waiting
        console.log('🔄 Recarregando página (hard refresh)...')
        
        // Limpar todos os caches antes de recarregar
        if ('caches' in window) {
          const cacheNames = await caches.keys()
          await Promise.all(cacheNames.map(name => caches.delete(name)))
          console.log('🗑️ Todos os caches limpos')
        }
        
        window.location.reload(true)
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar:', error)
      // Fallback: reload forçado de qualquer forma
      window.location.reload(true)
    }
  }

  const handleDismiss = () => {
    console.log('⏰ Adiando atualização por 30 minutos')
    setShowUpdate(false)
    
    // Lembrar depois (mostrar novamente em 30 minutos)
    setTimeout(() => {
      console.log('🔔 Mostrando banner novamente')
      setShowUpdate(true)
    }, 30 * 60 * 1000)
  }

  if (!showUpdate) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-in max-w-sm">
      <div className="bg-gradient-to-r from-[#EBA500] to-[#d99500] text-white rounded-2xl shadow-2xl p-4 border-2 border-white/20">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 animate-spin-slow" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold mb-1">
              Nova Versão Disponível!
            </h3>
            <p className="text-xs text-white/90 mb-2">
              Uma nova versão do sistema está disponível. Atualize para obter as últimas melhorias e correções.
            </p>
            {newVersion && (
              <p className="text-xs text-white/70 mb-3 font-mono">
                v{newVersion} {currentVersion && `(atual: v${currentVersion})`}
              </p>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                disabled={isReloading}
                className="flex-1 bg-white text-[#EBA500] hover:bg-white/90 disabled:bg-white/60 disabled:cursor-not-allowed px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                <RefreshCw className={`h-3 w-3 ${isReloading ? 'animate-spin' : ''}`} />
                {isReloading ? 'Atualizando...' : 'Atualizar Agora'}
              </button>
              <button
                onClick={handleDismiss}
                disabled={isReloading}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed rounded-xl transition-all duration-200"
                title="Lembrar depois"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UpdateNotification
