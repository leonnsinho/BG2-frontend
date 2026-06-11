import { useState, useEffect } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { APP_VERSION as BUNDLE_VERSION } from '../version'

const UpdateNotification = () => {
  const [showUpdate, setShowUpdate] = useState(false)
  const [isReloading, setIsReloading] = useState(false)

  useEffect(() => {
    // Só mostra banner se a versão salva for diferente da versão atual do bundle
    const savedVersion = localStorage.getItem('app-version')

    if (savedVersion && savedVersion !== BUNDLE_VERSION) {
      // Usuário está em versão antiga → mostrar banner
      setShowUpdate(true)
    }

    // Salva versão atual ao carregar (para visitantes novos)
    if (!savedVersion || savedVersion !== BUNDLE_VERSION) {
      // Não salva ainda — deixa o botão "Atualizar" fazer isso
    }
  }, [])

  const handleUpdate = async () => {
    setIsReloading(true)

    try {
      // Salvar versão atual do bundle no localStorage
      localStorage.setItem('app-version', BUNDLE_VERSION)

      // Limpar todos os caches para garantir fresh load
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
      }

      // Recarregar a página
      window.location.reload(true)
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      window.location.reload(true)
    }
  }

  const handleDismiss = () => {
    setShowUpdate(false)
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
            <p className="text-xs text-white/70 mb-3 font-mono">
              v{BUNDLE_VERSION}
            </p>

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
