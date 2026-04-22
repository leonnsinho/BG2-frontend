import React, { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { _registerConfirmOpen } from '@/lib/confirm'

/**
 * Monte este componente uma vez em App.jsx para habilitar confirmDialog() em
 * qualquer parte da aplicação.
 *
 * <ConfirmDialogMount />
 */
export default function ConfirmDialogMount() {
  const [state, setState] = useState(null)

  useEffect(() => {
    _registerConfirmOpen((opts) => setState(opts))
    return () => _registerConfirmOpen(null)
  }, [])

  if (!state) return null

  const { message, resolve, title, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false } = state

  const handleConfirm = () => {
    setState(null)
    resolve(true)
  }

  const handleCancel = () => {
    setState(null)
    resolve(false)
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onMouseDown={handleCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                danger ? 'bg-red-100' : 'bg-yellow-100'
              }`}
            >
              <AlertTriangle
                className={`h-5 w-5 ${danger ? 'text-red-600' : 'text-yellow-600'}`}
              />
            </div>
            <h3 className="text-base font-bold text-gray-900">
              {title || (danger ? 'Confirmar exclusão' : 'Confirmar ação')}
            </h3>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-2xl flex-shrink-0 border-t border-gray-100">
          <button
            onClick={handleCancel}
            className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-white transition-all font-semibold text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all ${
              danger
                ? 'bg-red-500 hover:bg-red-600 active:bg-red-700'
                : 'bg-[#EBA500] hover:bg-[#D49700] active:bg-[#BC8600]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
