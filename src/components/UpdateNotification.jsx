import { useState, useEffect, useRef } from 'react'
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

    // Função para verificar versão do Service Worker
    const checkVersion = async () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel()
        messageChannel.port1.onmessage = (event) => {
          if (event.data && (event.data.type === 'VERSION_RESPONSE' || event.data.type === 'VERSION')) {
            const swVersion = event.data.version

            if (!savedVersion || savedVersion !== swVersion) {
              setNewVersion(swVersion)
              setShowUpdate(true)
            }
          }
        }

        navigator.serviceWorker.controller.postMessage(
          { type: 'CHECK_UPDATE' },
          [messageChannel.port2]
        )
      }
    }

    // Listener para mensagens do Service Worker
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'NEW_VERSION') {
        const incomingVersion = event.data.version

        if (!savedVersion || savedVersion !== incomingVersion) {
          setNewVersion(incomingVersion)
          setShowUpdate(true)
        }
      }
    }

    // Listener para quando detecta novo SW instalado
    const handleUpdateFound = async () => {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration && registration.waiting) {
        setShowUpdate(true)
      }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage)

      // Verificar versão ao montar componente
      navigator.serviceWorker.ready.then(registration => {
        checkVersion()

        // Listener para updatefound
        registration.addEventListener('updatefound', handleUpdateFound)

        // Forçar update do Service Worker
        registration.update().catch(() => {
          // Silently ignore update errors
        })
      })

      // Verificar mais frequentemente - a cada 1 minuto
      const intervalTime = 60 * 1000 // 1 minuto

      checkIntervalRef.current = setInterval(() => {
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
        checkVersion()
      }

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

      // Detectar quando Service Worker está waiting
      navigator.serviceWorker.ready.then(registration => {
        if (registration.waiting) {
          checkVersion()
        }

        // Listener para mudanças no registration
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
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
    }
  }, [])

  const handleUpdate = async () => {
    setIsReloading(true)

    try {
      // Salvar nova versão
      if (newVersion) {
        localStorage.setItem('app-version', newVersion)
      }

      // Enviar mensagem para Service Worker pular waiting
      const registration = await navigator.serviceWorker.getRegistration()

      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })

        // Aguardar o SW assumir controle
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload(true)
        }, { once: true })
      } else {
        // Forçar reload mesmo sem SW waiting
        // Limpar todos os caches antes de recarregar
        if ('caches' in window) {
          const cacheNames = await caches.keys()
          await Promise.all(cacheNames.map(name => caches.delete(name)))
        }

        window.location.reload(true)
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      // Fallback: reload forçado de qualquer forma
      window.location.reload(true)
    }
  }

  const handleDismiss = () => {
    setShowUpdate(false)

    // Lembrar depois (mostrar novamente em 30 minutos)
    setTimeout(() => {
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
