import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Search,
  ListChecks,
  ChevronDown,
  ChevronRight,
  GripVertical
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function TaskPacksManagementPage() {
  const { profile } = useAuth()
  const [packs, setPacks] = useState([])
  const [processes, setProcesses] = useState([])
  const [journeys, setJourneys] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedPack, setSelectedPack] = useState(null)
  const [expandedPacks, setExpandedPacks] = useState(new Set())
  const [processSearchTerm, setProcessSearchTerm] = useState('')
  const [selectedJourney, setSelectedJourney] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tasks: [],
    associated_processes: []
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      loadData()
    }
  }, [profile])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadPacks(), loadProcesses(), loadJourneys()])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const loadPacks = async () => {
    try {
      const { data: packsData, error: packsError } = await supabase
        .from('task_packs')
        .select(`
          *,
          task_pack_templates (
            id,
            title,
            description,
            default_days_to_complete,
            default_status,
            order_in_pack
          ),
          process_task_packs (
            process_id,
            processes (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (packsError) throw packsError

      setPacks(packsData || [])
      console.log('📦 Packs carregados:', packsData?.length)
    } catch (error) {
      console.error('Erro ao carregar packs:', error)
      throw error
    }
  }

  const loadProcesses = async () => {
    try {
      const { data: processesData, error: processesError } = await supabase
        .from('processes')
        .select(`
          id,
          name,
          journey_id,
          journeys (name)
        `)
        .order('name')

      if (processesError) throw processesError

      setProcesses(processesData || [])
    } catch (error) {
      console.error('Erro ao carregar processos:', error)
      throw error
    }
  }

  const loadJourneys = async () => {
    try {
      const { data: journeysData, error: journeysError } = await supabase
        .from('journeys')
        .select('id, name')
        .order('name')

      if (journeysError) throw journeysError

      setJourneys(journeysData || [])
    } catch (error) {
      console.error('Erro ao carregar jornadas:', error)
      throw error
    }
  }

  const handleCreatePack = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Nome do pack é obrigatório')
      return
    }

    if (formData.tasks.length === 0) {
      toast.error('Adicione pelo menos uma ação ao pack')
      return
    }

    setSubmitting(true)
    try {
      // 1. Criar o pack
      const { data: newPack, error: packError } = await supabase
        .from('task_packs')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          created_by: profile.id
        })
        .select()
        .single()

      if (packError) throw packError

      // 2. Criar as tarefas do pack
      const tasksToInsert = formData.tasks.map((task, index) => ({
        pack_id: newPack.id,
        title: task.title,
        description: null,
        default_days_to_complete: null,
        default_status: task.default_status || 'pending',
        order_in_pack: index
      }))

      const { error: tasksError } = await supabase
        .from('task_pack_templates')
        .insert(tasksToInsert)

      if (tasksError) throw tasksError

      // 3. Associar aos processos selecionados
      if (formData.associated_processes.length > 0) {
        const associationsToInsert = formData.associated_processes.map(processId => ({
          pack_id: newPack.id,
          process_id: processId
        }))

        const { error: associationsError } = await supabase
          .from('process_task_packs')
          .insert(associationsToInsert)

        if (associationsError) throw associationsError
      }

      toast.success('Pack criado com sucesso!')
      setShowCreateModal(false)
      resetForm()
      loadPacks()
    } catch (error) {
      console.error('Erro ao criar pack:', error)
      toast.error('Erro ao criar pack: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdatePack = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Nome do pack é obrigatório')
      return
    }

    setSubmitting(true)
    try {
      // 1. Atualizar o pack
      const { error: packError } = await supabase
        .from('task_packs')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null
        })
        .eq('id', selectedPack.id)

      if (packError) throw packError

      // 2. Deletar tarefas antigas e criar novas
      const { error: deleteTasksError } = await supabase
        .from('task_pack_templates')
        .delete()
        .eq('pack_id', selectedPack.id)

      if (deleteTasksError) throw deleteTasksError

      const tasksToInsert = formData.tasks.map((task, index) => ({
        pack_id: selectedPack.id,
        title: task.title,
        description: null,
        default_days_to_complete: null,
        default_status: task.default_status || 'pending',
        order_in_pack: index
      }))

      const { error: tasksError } = await supabase
        .from('task_pack_templates')
        .insert(tasksToInsert)

      if (tasksError) throw tasksError

      // 3. Atualizar associações com processos
      const { error: deleteAssocError } = await supabase
        .from('process_task_packs')
        .delete()
        .eq('pack_id', selectedPack.id)

      if (deleteAssocError) throw deleteAssocError

      if (formData.associated_processes.length > 0) {
        const associationsToInsert = formData.associated_processes.map(processId => ({
          pack_id: selectedPack.id,
          process_id: processId
        }))

        const { error: associationsError } = await supabase
          .from('process_task_packs')
          .insert(associationsToInsert)

        if (associationsError) throw associationsError
      }

      toast.success('Pack atualizado com sucesso!')
      setShowEditModal(false)
      setSelectedPack(null)
      resetForm()
      loadPacks()
    } catch (error) {
      console.error('Erro ao atualizar pack:', error)
      toast.error('Erro ao atualizar pack: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePack = async () => {
    if (!selectedPack) return

    setSubmitting(true)
    try {
      // O delete cascade vai cuidar das tarefas e associações
      const { error } = await supabase
        .from('task_packs')
        .delete()
        .eq('id', selectedPack.id)

      if (error) throw error

      toast.success('Pack deletado com sucesso!')
      setShowDeleteModal(false)
      setSelectedPack(null)
      loadPacks()
    } catch (error) {
      console.error('Erro ao deletar pack:', error)
      toast.error('Erro ao deletar pack: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      tasks: [],
      associated_processes: []
    })
  }

  const openEditModal = (pack) => {
    setSelectedPack(pack)
    setFormData({
      name: pack.name,
      description: pack.description || '',
      tasks: pack.task_pack_templates.sort((a, b) => a.order_in_pack - b.order_in_pack),
      associated_processes: pack.process_task_packs.map(p => p.process_id)
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (pack) => {
    setSelectedPack(pack)
    setShowDeleteModal(true)
  }

  const addTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          title: '',
          default_status: 'pending'
        }
      ]
    }))
  }

  const removeTask = (index) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }))
  }

  const updateTask = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }))
  }

  const toggleExpanded = (packId) => {
    setExpandedPacks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(packId)) {
        newSet.delete(packId)
      } else {
        newSet.add(packId)
      }
      return newSet
    })
  }

  const filteredPacks = packs.filter(pack =>
    pack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pack.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (profile?.role !== 'super_admin') {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Acesso Negado</h3>
            <p className="text-red-700 text-sm mt-1">
              Apenas Super Administradores podem acessar esta página.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#EBA500] to-[#d99500] rounded-2xl flex items-center justify-center shadow-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#373435]">Packs de Ações</h1>
              <p className="text-gray-600">Gerencie templates de ações para processos</p>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar packs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent"
              />
            </div>

            {/* Create Button */}
            <button
              onClick={() => {
                resetForm()
                setShowCreateModal(true)
              }}
              className="flex items-center space-x-2 bg-gradient-to-r from-[#EBA500] to-[#d99500] text-white px-6 py-2.5 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
            >
              <Plus className="h-5 w-5" />
              <span>Novo Pack</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500]"></div>
          </div>
        )}

        {/* Packs List */}
        {!loading && (
          <div className="space-y-4">
            {filteredPacks.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'Nenhum pack encontrado' : 'Nenhum pack criado'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm 
                    ? 'Tente ajustar os filtros de busca' 
                    : 'Comece criando seu primeiro pack de ações'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => {
                      resetForm()
                      setShowCreateModal(true)
                    }}
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#EBA500] to-[#d99500] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Criar Primeiro Pack</span>
                  </button>
                )}
              </div>
            ) : (
              filteredPacks.map(pack => {
                const isExpanded = expandedPacks.has(pack.id)
                const tasksCount = pack.task_pack_templates?.length || 0
                const processesCount = pack.process_task_packs?.length || 0

                return (
                  <div key={pack.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                    {/* Pack Header */}
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <button
                              onClick={() => toggleExpanded(pack.id)}
                              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-gray-600" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-gray-600" />
                              )}
                            </button>
                            <h3 className="text-xl font-bold text-[#373435]">{pack.name}</h3>
                          </div>
                          {pack.description && (
                            <p className="text-gray-600 ml-9 mb-3">{pack.description}</p>
                          )}
                          <div className="flex items-center space-x-4 ml-9">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <ListChecks className="h-4 w-4" />
                              <span>{tasksCount} ação{tasksCount !== 1 ? 'ões' : ''}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Package className="h-4 w-4" />
                              <span>{processesCount} processo{processesCount !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(pack)}
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                            title="Editar pack"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(pack)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                            title="Deletar pack"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 p-6 space-y-6">
                        {/* Tasks */}
                        {tasksCount > 0 && (
                          <div>
                            <h4 className="font-semibold text-[#373435] mb-3 flex items-center space-x-2">
                              <ListChecks className="h-5 w-5" />
                              <span>Ações do Pack</span>
                            </h4>
                            <div className="space-y-2">
                              {pack.task_pack_templates
                                .sort((a, b) => a.order_in_pack - b.order_in_pack)
                                .map((task, index) => (
                                  <div key={task.id} className="bg-white rounded-lg p-4 border border-gray-200">
                                    <div className="flex items-start space-x-3">
                                      <span className="flex-shrink-0 w-6 h-6 bg-[#EBA500] text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-[#373435] whitespace-pre-wrap">{task.title}</p>
                                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                          <span>Status: {task.default_status === 'pending' ? 'Pendente' : 'Em Andamento'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Associated Processes */}
                        {processesCount > 0 && (
                          <div>
                            <h4 className="font-semibold text-[#373435] mb-3 flex items-center space-x-2">
                              <Package className="h-5 w-5" />
                              <span>Processos Associados</span>
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {pack.process_task_packs.map(assoc => (
                                <span
                                  key={assoc.process_id}
                                  className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium"
                                >
                                  {assoc.processes.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <PackFormModal
            title="Criar Novo Pack de Ações"
            formData={formData}
            setFormData={setFormData}
            processes={processes}
            onSubmit={handleCreatePack}
            onClose={() => {
              setShowCreateModal(false)
              resetForm()
            }}
            submitting={submitting}
            addTask={addTask}
            removeTask={removeTask}
            updateTask={updateTask}
          />
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <PackFormModal
            title="Editar Pack de Ações"
            formData={formData}
            setFormData={setFormData}
            processes={processes}
            onSubmit={handleUpdatePack}
            onClose={() => {
              setShowEditModal(false)
              setSelectedPack(null)
              resetForm()
            }}
            submitting={submitting}
            addTask={addTask}
            removeTask={removeTask}
            updateTask={updateTask}
          />
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedPack && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#373435]">Deletar Pack</h3>
                  <p className="text-gray-600 mt-1">
                    Tem certeza que deseja deletar o pack "{selectedPack.name}"?
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    Esta ação não pode ser desfeita. Todas as tarefas e associações serão removidas.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedPack(null)
                  }}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeletePack}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deletando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Deletar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Component for Create/Edit Modal
function PackFormModal({ 
  title, 
  formData, 
  setFormData, 
  processes, 
  onSubmit, 
  onClose, 
  submitting,
  addTask,
  removeTask,
  updateTask
}) {
  const [processSearchTerm, setProcessSearchTerm] = useState('')
  const [selectedJourney, setSelectedJourney] = useState('')

  // Extrair jornadas únicas dos processos
  const journeys = [...new Map(
    processes
      .filter(p => p.journeys)
      .map(p => [p.journey_id, { id: p.journey_id, name: p.journeys.name }])
  ).values()]

  // Filtrar processos
  const filteredProcesses = processes.filter(process => {
    const matchesSearch = process.name.toLowerCase().includes(processSearchTerm.toLowerCase())
    const matchesJourney = !selectedJourney || process.journey_id === selectedJourney
    return matchesSearch && matchesJourney
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8">
        <form onSubmit={onSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-[#373435]">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Pack Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#373435] mb-2">
                  Nome do Pack *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent"
                  placeholder="Ex: Onboarding de Cliente"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#373435] mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent resize-none"
                  rows="3"
                  placeholder="Descreva o objetivo deste pack de ações..."
                />
              </div>
            </div>

            {/* Tasks */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-semibold text-[#373435] flex items-center space-x-2">
                  <ListChecks className="h-5 w-5" />
                  <span>Ações do Pack *</span>
                </label>
                <button
                  type="button"
                  onClick={addTask}
                  className="flex items-center space-x-2 text-sm bg-[#EBA500] text-white px-3 py-1.5 rounded-lg hover:bg-[#d99500] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar Ação</span>
                </button>
              </div>

              {formData.tasks.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <ListChecks className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Nenhuma ação adicionada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.tasks.map((task, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-[#EBA500] text-white rounded-full flex items-center justify-center text-xs font-bold mt-2">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <textarea
                            value={task.title}
                            onChange={(e) => updateTask(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent resize-none"
                            rows="3"
                            placeholder="Descrição da ação..."
                            required
                          />
                          <div className="mt-3">
                            <label className="block text-xs text-gray-600 mb-1">Status Inicial</label>
                            <select
                              value={task.default_status}
                              onChange={(e) => updateTask(index, 'default_status', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent"
                            >
                              <option value="pending">Pendente</option>
                              <option value="in_progress">Em Andamento</option>
                            </select>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTask(index)}
                          className="flex-shrink-0 p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors mt-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Associated Processes */}
            <div>
              <label className="block text-sm font-semibold text-[#373435] mb-3 flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Associar a Processos</span>
              </label>

              {/* Search and Filter Bar */}
              <div className="mb-3 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar processo por nome..."
                    value={processSearchTerm}
                    onChange={(e) => setProcessSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent text-sm"
                  />
                </div>
                <select
                  value={selectedJourney}
                  onChange={(e) => setSelectedJourney(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent text-sm"
                >
                  <option value="">Todas as Jornadas</option>
                  {journeys.map(journey => (
                    <option key={journey.id} value={journey.id}>
                      {journey.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto">
                {processes.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-4">Nenhum processo disponível</p>
                ) : filteredProcesses.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-4">Nenhum processo encontrado</p>
                ) : (
                  <div className="space-y-2">
                    {filteredProcesses.map(process => (
                      <label key={process.id} className="flex items-center justify-between p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={formData.associated_processes.includes(process.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  associated_processes: [...prev.associated_processes, process.id]
                                }))
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  associated_processes: prev.associated_processes.filter(id => id !== process.id)
                                }))
                              }
                            }}
                            className="w-4 h-4 text-[#EBA500] border-gray-300 rounded focus:ring-[#EBA500] flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-[#373435] block truncate">{process.name}</span>
                            {process.journeys && (
                              <span className="text-xs text-gray-500">{process.journeys.name}</span>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || formData.tasks.length === 0}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#EBA500] to-[#d99500] text-white rounded-xl hover:shadow-lg transition-all duration-300 font-semibold disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Salvar Pack</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
