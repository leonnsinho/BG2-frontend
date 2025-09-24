import React, { useState, useEffect } from 'react'
import { X, User } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'

const TaskModal = ({ isOpen, onClose, process, journey, onSave }) => {
  const { createTask, getCompanyUsers, loading } = useTasks()
  const [companyUsers, setCompanyUsers] = useState([])
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: ''
  })

  const [errors, setErrors] = useState({})

  // Carregar usuários da empresa quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      loadCompanyUsers()
      // Limpar formulário
      setFormData({
        title: '',
        description: '',
        assigned_to: ''
      })
      setErrors({})
    }
  }, [isOpen])

  const loadCompanyUsers = async () => {
    try {
      console.log('🔄 Carregando usuários da empresa...')
      const users = await getCompanyUsers()
      setCompanyUsers(users)
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validações simples
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Título é obrigatório'
    if (!formData.description.trim()) newErrors.description = 'Descrição é obrigatória'
    if (!formData.assigned_to) newErrors.assigned_to = 'Responsável é obrigatório'
    
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length > 0) return

    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        assigned_to: formData.assigned_to,
        process_id: process.id,
        journey_id: journey?.id || journey, // Usar apenas o UUID
        status: 'pending',
        priority: 3
      }

      console.log('📤 Enviando dados da tarefa:', taskData)
      const savedTask = await createTask(taskData)
      
      onSave?.(savedTask)
      onClose()
    } catch (error) {
      console.error('❌ Erro ao criar tarefa:', error)
      setErrors({ submit: 'Erro ao criar tarefa. Tente novamente.' })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-[#EBA500] text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Nova Tarefa</h2>
              <p className="text-[#EBA500]/80 text-sm mt-1">
                {journey?.nome} → {process?.nome}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#EBA500]/20 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-[#373435] mb-2">
              Título da Tarefa *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full p-3 border rounded-2xl focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] transition-colors ${
                errors.title ? 'border-red-500' : 'border-[#373435]/20'
              }`}
              placeholder="Digite o título da tarefa..."
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-[#373435] mb-2">
              Descrição *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={`w-full p-3 border rounded-2xl focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] transition-colors resize-none ${
                errors.description ? 'border-red-500' : 'border-[#373435]/20'
              }`}
              placeholder="Descreva a tarefa em detalhes..."
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-sm font-medium text-[#373435] mb-2">
              <User className="h-4 w-4 inline mr-1" />
              Responsável * <span className="text-xs text-gray-500">(Usuários da empresa)</span>
            </label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className={`w-full p-3 border rounded-2xl focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] transition-colors ${
                errors.assigned_to ? 'border-red-500' : 'border-[#373435]/20'
              }`}
              disabled={companyUsers.length === 0}
            >
              <option value="">
                {companyUsers.length === 0 ? 'Carregando usuários...' : 'Selecione o responsável'}
              </option>
              {companyUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.email}
                </option>
              ))}
            </select>
            {errors.assigned_to && <p className="text-red-500 text-sm mt-1">{errors.assigned_to}</p>}
            {companyUsers.length === 0 && (
              <p className="text-amber-600 text-xs mt-1">
                Nenhum usuário encontrado na empresa
              </p>
            )}
          </div>

          {/* Erro geral */}
          {errors.submit && (
            <div className="bg-red-50 text-red-600 p-3 rounded-2xl text-sm">
              {errors.submit}
            </div>
          )}

          {/* Botões */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-[#373435]/20 text-[#373435] rounded-2xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[#EBA500] text-white rounded-2xl hover:bg-[#EBA500]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Criando...' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskModal
