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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl transform transition-all animate-slideUp">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Solicitar Validação de Amadurecimento
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Processo pronto para aprovação final
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Informações do Processo */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Processo
            </h4>
            <p className="text-gray-700 font-medium">{process.nome || process.name}</p>
            {process.description && (
              <p className="text-sm text-gray-600 mt-1">{process.description}</p>
            )}
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600">100%</div>
              <div className="text-xs text-green-700 font-medium mt-1">
                Tarefas Concluídas
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {process.total_tasks || 0}
              </div>
              <div className="text-xs text-blue-700 font-medium mt-1">
                Total de Tarefas
              </div>
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-semibold text-amber-900 mb-1">
                Confirme que todas as tarefas foram executadas
              </h5>
              <p className="text-xs text-amber-700 leading-relaxed">
                Ao enviar esta solicitação, você confirma que todas as {process.total_tasks || 0} tarefas 
                foram realmente concluídas e implementadas. O Company Admin fará a validação final.
              </p>
            </div>
          </div>

          {/* Campo de Observações (Opcional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Observações (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione comentários sobre a execução das tarefas, desafios encontrados ou resultados obtidos..."
              rows={4}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] transition-all resize-none text-sm"
            />
            <div className="text-xs text-gray-500 mt-1">
              {notes.length}/500 caracteres
            </div>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-semibold text-red-900 mb-1">Erro ao enviar solicitação</h5>
                <p className="text-xs text-red-700">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-3xl">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Enviar para Aprovação</span>
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
