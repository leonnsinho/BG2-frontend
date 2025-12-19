import React from 'react'
import { CheckCircle, X, Sparkles, TrendingUp, Award } from 'lucide-react'

const MaturityConfirmModal = ({ isOpen, onClose, onConfirm, processName, progress }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp max-h-[95vh] overflow-y-auto">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-br from-[#EBA500] to-[#d89500] p-4 sm:p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-20">
            <Sparkles className="w-24 h-24 sm:w-32 sm:h-32" />
          </div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div></div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-1">
              Confirmar Amadurecimento
            </h2>
            <p className="text-white/90 text-xs sm:text-sm">
              Marcar processo como concluído
            </p>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-4 sm:p-6">
          {/* Nome do Processo */}
          <div className="mb-4 sm:mb-6">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              Processo
            </label>
            <p className="text-base sm:text-lg font-semibold text-[#373435] bg-gray-50 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-gray-200 break-words">
              {processName}
            </p>
          </div>

          {/* Status de Progresso */}
          <div className="mb-4 sm:mb-6 bg-gradient-to-br from-green-50 to-emerald-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-green-200">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
              <span className="font-semibold text-green-800 text-sm sm:text-base">
                Progresso: {progress?.percentage || 100}%
              </span>
            </div>
            <div className="w-full bg-white rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress?.percentage || 100}%` }}
              />
            </div>
          </div>

          {/* O que vai acontecer */}
          <div className="mb-4 sm:mb-6">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3 block">
              Esta ação irá:
            </label>
            <div className="space-y-2">
              <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600" />
                </div>
                <span>Marcar o processo como <strong className="text-green-700">AMADURECIDO</strong></span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600" />
                </div>
                <span>Remover da lista de Processos Prioritários</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600" />
                </div>
                <span>Atualizar % de amadurecimento da jornada</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600" />
                </div>
                <span>Registrar em Journey Management/Overview</span>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg sm:rounded-xl transition-all duration-200 border border-gray-300 text-sm sm:text-base order-2 sm:order-1"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#EBA500] to-[#d89500] hover:from-[#d89500] hover:to-[#c78500] text-white font-bold rounded-lg sm:rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-2"
            >
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MaturityConfirmModal
