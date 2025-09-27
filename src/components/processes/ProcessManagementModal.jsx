import React, { useState, useEffect } from 'react'
import { X, Plus, Save, AlertCircle } from 'lucide-react'
import { supabase } from '../../services/supabase'

const ProcessManagementModal = ({ 
  isOpen, 
  onClose, 
  journey, 
  company,
  processToEdit = null, 
  onProcessSaved,
  existingProcesses = [] 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: ''
  })
  
  const [availableCategories, setAvailableCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Carregar categorias existentes da jornada
  useEffect(() => {
    if (isOpen && journey?.id) {
      loadExistingCategories()
    }
  }, [isOpen, journey?.id])

  // Preencher formulário ao editar
  useEffect(() => {
    if (processToEdit) {
      setFormData({
        name: processToEdit.name || '',
        description: processToEdit.description || '',
        category: processToEdit.category || ''
      })
    } else {
      // Reset form for new process
      setFormData({
        name: '',
        description: '',
        category: ''
      })
    }
  }, [processToEdit])

  const loadExistingCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('processes')
        .select('category')
        .eq('journey_id', journey.id)
        .not('category', 'is', null)
        .order('category')

      if (error) throw error

      // Extrair categorias únicas
      const categories = [...new Set(data?.map(p => p.category).filter(Boolean))]
      setAvailableCategories(categories)

    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const generateProcessCode = (processName, journeySlug) => {
    // Pegar as primeiras 3 letras da jornada
    let prefix = ''
    switch (journeySlug) {
      case 'estrategica':
        prefix = 'EST'
        break
      case 'financeira':
        prefix = 'FIN'
        break
      case 'pessoas-cultura':
        prefix = 'PES'
        break
      case 'receita-crm':
        prefix = 'REC'
        break
      case 'operacional':
        prefix = 'OPE'
        break
      default:
        prefix = 'PRC'
    }

    // Encontrar o próximo número disponível
    const existingCodes = existingProcesses
      .map(p => p.code)
      .filter(code => code.startsWith(prefix))
      .map(code => {
        const num = code.replace(prefix, '')
        return parseInt(num) || 0
      })

    const maxNumber = existingCodes.length > 0 ? Math.max(...existingCodes) : 0
    const nextNumber = (maxNumber + 1).toString().padStart(3, '0')

    return `${prefix}${nextNumber}`
  }

  const calculateOrderIndex = () => {
    // Se editando, manter o order_index atual
    if (processToEdit?.order_index) {
      return processToEdit.order_index
    }

    // Para novo processo, pegar o próximo order_index
    const maxOrderIndex = existingProcesses.reduce((max, p) => 
      Math.max(max, p.order_index || 0), 0
    )
    
    return maxOrderIndex + 1
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória'
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Categoria é obrigatória'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setLoading(true)

    try {
      if (processToEdit) {
        // Editando processo existente
        const { data, error } = await supabase
          .from('processes')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim(),
            category: formData.category.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', processToEdit.id)
          .select('*')
          .single()

        if (error) throw error

        console.log('✅ Processo atualizado:', data)
        onProcessSaved?.(data, 'updated')

      } else {
        // Criando novo processo
        const processCode = generateProcessCode(formData.name, journey.slug)
        const orderIndex = calculateOrderIndex()

        const newProcess = {
          journey_id: journey.id,
          code: processCode,
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category.trim(),
          order_index: orderIndex,
          weight: 1.00, // Peso fixo em 1.0
          is_active: true,
          version: 1
        }

        const { data, error } = await supabase
          .from('processes')
          .insert([newProcess])
          .select('*')
          .single()

        if (error) throw error

        console.log('✅ Processo criado:', data)
        onProcessSaved?.(data, 'created')
      }

      onClose()

    } catch (error) {
      console.error('❌ Erro ao salvar processo:', error)
      alert('Erro ao salvar processo: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo ao digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div 
          className="fixed inset-0 transition-opacity bg-black bg-opacity-50"
          onClick={onClose}
        />
        
        <div className="relative inline-block w-full max-w-2xl p-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {processToEdit ? 'Editar Processo' : 'Adicionar Processo'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {journey?.name} • {company?.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Processo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ex: Planejamento estratégico anual"
                className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva brevemente o processo..."
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none ${
                  errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              {availableCategories.length > 0 ? (
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                    errors.category ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <option value="">Selecione ou digite uma categoria</option>
                  {availableCategories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  placeholder="Ex: Fundamentos Estratégicos"
                  className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                    errors.category ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
              )}
              {errors.category && (
                <p className="mt-1 text-xs text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.category}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>
                {loading ? 'Salvando...' : processToEdit ? 'Salvar Alterações' : 'Criar Processo'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProcessManagementModal