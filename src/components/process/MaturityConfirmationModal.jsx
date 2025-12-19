import React, { useState } from 'react'
import { X, CheckCircle, AlertTriangle, Loader, Send } from 'lucide-react'
import { requestMaturityApproval } from '../../services/processMaturityService'

/**
 * Modal de Confirmação de Amadurecimento (Gestor)
 * Permite ao gestor solicitar a validação final do amadurecimento do processo
 */
const MaturityConfirmationModal = ({ 
  isOpen, 
  onClose, 
  process, 
  companyId, 
  journeyId,
  gestorId,
  onSuccess 
}) => {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleConfirm = async () => {
    try {
      setLoading(true)
      setError(null)

      // Log detalhado dos parâmetros recebidos
      console.log('📋 Parâmetros recebidos no modal:', {
        'process.id': process?.id,
        'process.id type': typeof process?.id,
        companyId,
        'companyId type': typeof companyId,
        journeyId,
        'journeyId type': typeof journeyId,
        gestorId,
        'gestorId type': typeof gestorId,
        notes
      })

      // Validar dados antes de enviar
      if (!process?.id || !companyId || !journeyId || !gestorId) {
        const missing = []
        if (!process?.id) missing.push('ID do processo')
        if (!companyId) missing.push('ID da empresa')
        if (!journeyId) missing.push('UUID da jornada')
        if (!gestorId) missing.push('ID do gestor')
        
        throw new Error(`Dados incompletos: ${missing.join(', ')}`)
      }

      console.log('📝 Solicitando aprovação de amadurecimento:', {
        processId: process.id,
        companyId,
        journeyId,
        gestorId,
        notes
      })

      await requestMaturityApproval(
        process.id,
        companyId,
        journeyId,
        gestorId,
        notes
      )

      console.log('✅ Solicitação enviada com sucesso!')

      // Disparar evento para atualizar o badge no sidebar
      window.dispatchEvent(new CustomEvent('maturity-approval-changed'))

      // Notificar sucesso
      if (onSuccess) {
        onSuccess()
      }

      // Fechar modal após sucesso
      setTimeout(() => {
        onClose()
      }, 500)
    } catch (err) {
      console.error('❌ Erro ao solicitar aprovação:', err)
      setError(err.message || 'Erro desconhecido ao enviar solicitação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[95vh] overflow-y-auto shadow-2xl transform transition-all animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 p-3 sm:p-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center space-x-2 pr-8">
            <CheckCircle className="h-5 w-5 text-white flex-shrink-0" />
            <h3 className="text-base sm:text-lg font-bold text-white">
              Solicitar Validação
            </h3>
          </div>
        </div>

        {/* Body */}
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Processo */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 break-words">{process.nome || process.name}</p>
                {process.total_tasks && (
                  <p className="text-xs text-gray-600 mt-1">
                    {process.total_tasks} {process.total_tasks === 1 ? 'tarefa concluída' : 'tarefas concluídas'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Confirme que todas as tarefas foram concluídas. O admin fará a validação final.
            </p>
          </div>

          {/* Campo de Observações */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Observações (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Comentários sobre a execução..."
              rows={3}
              maxLength={500}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all resize-none text-sm"
            />
            <div className="text-xs text-gray-500 mt-1">
              {notes.length}/500
            </div>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-3 sm:p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-lg hover:from-green-600 hover:to-green-700 font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Enviar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Styles para animações */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default MaturityConfirmationModal
