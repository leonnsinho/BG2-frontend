import { Trash2, AlertTriangle } from 'lucide-react'

/**
 * Modal de confirmação reutilizável da plataforma.
 *
 * Props:
 *   title       — título do modal
 *   message     — mensagem descritiva
 *   confirmLabel — texto do botão de confirmação (padrão: "Excluir")
 *   variant      — 'danger' (vermelho, padrão) | 'warning' (amarelo)
 *   onConfirm   — callback ao confirmar
 *   onCancel    — callback ao cancelar
 */
export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Excluir',
  variant = 'danger',
  onConfirm,
  onCancel,
}) {
  const isDanger = variant !== 'warning'

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${
              isDanger ? 'bg-red-50' : 'bg-amber-50'
            }`}
          >
            {isDanger ? (
              <Trash2 className="h-5 w-5 text-red-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">{title}</h3>
            {message && (
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors ${
              isDanger
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
