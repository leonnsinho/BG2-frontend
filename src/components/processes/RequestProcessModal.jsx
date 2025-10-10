import React, { useState } from 'react'
import { X, FileText, MessageSquare, AlertCircle } from 'lucide-react'

export default function RequestProcessModal({ 
  isOpen, 
  onClose, 
  journey, 
  company,
  onRequestSubmitted 
}) {
  const [formData, setFormData] = useState({
    process_name: '',
    process_description: '',
    category: '',
    justification: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const categories = journey?.categories || []

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await onRequestSubmitted(formData)
      
      // Resetar form e fechar
      setFormData({
        process_name: '',
        process_description: '',
        category: '',
        justification: ''
      })
      onClose()
    } catch (err) {
      console.error('Erro ao enviar solicitação:', err)
      setError(err.message || 'Erro ao enviar solicitação')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-bold text-[#373435]">
              Solicitar Novo Processo
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {journey?.name} • {company?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Info Box */}
        <div className="px-6 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Como funciona?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Preencha os detalhes do processo que você precisa</li>
                <li>A solicitação será enviada para análise do Super Admin</li>
                <li>Você será notificado sobre a decisão</li>
                <li>Se aprovado, o processo será criado na jornada</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* Nome do Processo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Processo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.process_name}
              onChange={(e) => setFormData({ ...formData, process_name: e.target.value })}
              placeholder="Ex: Análise de Indicadores Financeiros"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500]"
              required
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.process_name.length}/100 caracteres
            </p>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500]"
              required
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição do Processo
            </label>
            <textarea
              value={formData.process_description}
              onChange={(e) => setFormData({ ...formData, process_description: e.target.value })}
              placeholder="Descreva brevemente o que este processo envolve..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500]"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.process_description.length}/500 caracteres
            </p>
          </div>

          {/* Justificativa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Justificativa <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.justification}
              onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
              placeholder="Explique por que sua empresa precisa deste processo e como ele agregaria valor..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500]"
              required
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.justification.length}/1000 caracteres
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium">Erro ao enviar solicitação</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.process_name || !formData.category || !formData.justification}
              className="px-6 py-2 bg-[#EBA500] hover:bg-[#EBA500]/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>{submitting ? 'Enviando...' : 'Enviar Solicitação'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
