import React, { useState, useEffect } from 'react'
import toast from '@/lib/toast'
import confirmDialog from '@/lib/confirm'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Tag, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Search,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Layers
} from 'lucide-react'
import { 
  getAllCategories, 
  createCategory, 
  updateCategory, 
  deactivateCategory 
} from '../../services/categoryService'

export default function CategoriesManagementPage() {
  const { profile } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#EBA500',
    icon: 'Tag',
    order_position: 0
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      loadCategories()
    }
  }, [profile])

  const loadCategories = async () => {
    try {
      setLoading(true)
      
      // Buscar todas as categorias (incluindo inativas)
      const categoriesData = await getAllCategories()
      
      // Para cada categoria, buscar quantidade de processos
      const categoriesWithCount = await Promise.all(
        categoriesData.map(async (cat) => {
          const { count, error } = await supabase
            .from('processes')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', cat.id)
          
          return {
            ...cat,
            processes_count: error ? 0 : count
          }
        })
      )
      
      setCategories(categoriesWithCount)
      console.log('📂 Categorias carregadas:', categoriesWithCount.length)
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
      toast.alert('Erro ao carregar categorias: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.alert('Nome da categoria é obrigatório')
      return
    }

    setSubmitting(true)
    try {
      await createCategory({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        color: formData.color,
        icon: formData.icon,
        order_position: parseInt(formData.order_position) || 0,
        is_active: true
      })

      toast.alert('✅ Categoria criada com sucesso!')
      setShowCreateModal(false)
      resetForm()
      loadCategories()
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      
      if (error.message.includes('duplicate key')) {
        toast.alert('❌ Já existe uma categoria com este nome!')
      } else {
        toast.alert('❌ Erro ao criar categoria: ' + error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.alert('Nome da categoria é obrigatório')
      return
    }

    setSubmitting(true)
    try {
      await updateCategory(selectedCategory.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        color: formData.color,
        icon: formData.icon,
        order_position: parseInt(formData.order_position) || 0
      })

      toast.alert('✅ Categoria atualizada com sucesso!\n\n💡 Todos os processos agora mostram o novo nome automaticamente.')
      setShowEditModal(false)
      setSelectedCategory(null)
      resetForm()
      loadCategories()
    } catch (error) {
      console.error('Erro ao editar categoria:', error)
      
      if (error.message.includes('duplicate key')) {
        toast.alert('❌ Já existe uma categoria com este nome!')
      } else {
        toast.alert('❌ Erro ao editar categoria: ' + error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (category) => {
    const newStatus = !category.is_active
    const action = newStatus ? 'ativar' : 'desativar'
    
    if (!await confirmDialog(`Tem certeza que deseja ${action} a categoria "${category.name}"?${
      !newStatus && category.processes_count > 0 
        ? `\n\n⚠️ Esta categoria está sendo usada por ${category.processes_count} processo(s).`
        : ''
    }`)) {
      return
    }

    try {
      setSubmitting(true)
      
      await updateCategory(category.id, {
        is_active: newStatus
      })

      toast.alert(`✅ Categoria ${newStatus ? 'ativada' : 'desativada'} com sucesso!`)
      loadCategories()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.alert('❌ Erro ao alterar status: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedCategory) return

    if (selectedCategory.processes_count > 0) {
      toast.alert(`❌ Não é possível deletar esta categoria!\n\n` +
            `Ela está sendo usada por ${selectedCategory.processes_count} processo(s).\n\n` +
            `💡 Você pode desativá-la ao invés de deletar.`)
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', selectedCategory.id)

      if (error) throw error

      toast.alert('✅ Categoria deletada com sucesso!')
      setShowDeleteModal(false)
      setSelectedCategory(null)
      loadCategories()
    } catch (error) {
      console.error('Erro ao deletar categoria:', error)
      toast.alert('❌ Erro ao deletar categoria: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleMoveUp = async (category) => {
    const currentIndex = categories.findIndex(c => c.id === category.id)
    if (currentIndex <= 0) return

    const prevCategory = categories[currentIndex - 1]
    
    try {
      setSubmitting(true)
      
      // Trocar positions
      await updateCategory(category.id, { order_position: prevCategory.order_position })
      await updateCategory(prevCategory.id, { order_position: category.order_position })
      
      loadCategories()
    } catch (error) {
      console.error('Erro ao mover categoria:', error)
      toast.alert('❌ Erro ao mover categoria')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMoveDown = async (category) => {
    const currentIndex = categories.findIndex(c => c.id === category.id)
    if (currentIndex >= categories.length - 1) return

    const nextCategory = categories[currentIndex + 1]
    
    try {
      setSubmitting(true)
      
      // Trocar positions
      await updateCategory(category.id, { order_position: nextCategory.order_position })
      await updateCategory(nextCategory.id, { order_position: category.order_position })
      
      loadCategories()
    } catch (error) {
      console.error('Erro ao mover categoria:', error)
      toast.alert('❌ Erro ao mover categoria')
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#EBA500',
      icon: category.icon || 'Tag',
      order_position: category.order_position || 0
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (category) => {
    setSelectedCategory(category)
    setShowDeleteModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#EBA500',
      icon: 'Tag',
      order_position: 0
    })
  }

  // Filtrar categorias
  const filteredCategories = categories.filter(cat => {
    if (!searchTerm) return true
    
    const search = searchTerm.toLowerCase()
    return cat.name?.toLowerCase().includes(search) ||
           cat.description?.toLowerCase().includes(search)
  })

  // Verificar permissão
  if (profile?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#373435] dark:text-white mb-2">Acesso Negado</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Apenas super administradores podem acessar esta página.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#373435] dark:text-white flex items-center gap-2 sm:gap-3">
              <Tag className="h-6 w-6 sm:h-8 sm:w-8 text-[#EBA500]" />
              <span className="truncate">Categorias</span>
            </h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-[#EBA500] text-white rounded-xl hover:bg-[#d49400] transition-colors shadow-md hover:shadow-lg min-h-[44px] touch-manipulation w-full sm:w-auto"
            >
              <Plus className="h-5 w-5" />
              <span>Nova Categoria</span>
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base lg:text-lg">
            Gerencie as categorias de processos do sistema. Alterações são aplicadas automaticamente.
          </p>
        </div>

        {/* Busca */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent text-sm sm:text-base min-h-[44px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Lista de Categorias */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200/50 dark:border-gray-700 rounded-2xl sm:rounded-3xl overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700 dark:to-gray-800">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-[#373435] dark:text-white flex items-center gap-2">
              <Layers className="h-5 w-5 sm:h-6 sm:w-6 text-[#EBA500]" />
              <span className="truncate">Categorias ({filteredCategories.length})</span>
            </h2>
          </div>

          {filteredCategories.length === 0 ? (
            <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-center">
              <Tag className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 font-medium text-sm sm:text-base">
                {searchTerm ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria cadastrada'}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1">
                {searchTerm 
                  ? 'Tente ajustar o termo de busca' 
                  : 'Clique em "Nova Categoria" para começar'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredCategories.map((category, index) => (
                <div
                  key={category.id}
                  className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-[#EBA500]/5 transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Informações da Categoria */}
                    <div className="flex items-start sm:items-center gap-3 sm:gap-6 flex-1 min-w-0">
                      {/* Cor e Ícone */}
                      <div 
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0"
                        style={{ backgroundColor: category.color + '20' }}
                      >
                        <Tag 
                          className="h-6 w-6 sm:h-8 sm:w-8" 
                          style={{ color: category.color }} 
                        />
                      </div>

                      {/* Detalhes */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-[#373435] dark:text-white truncate">
                            {category.name}
                          </h3>
                          
                          {/* Badge de Status */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {category.is_active ? (
                              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <CheckCircle className="h-3 w-3" />
                                Ativa
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                <EyeOff className="h-3 w-3" />
                                Inativa
                              </span>
                            )}

                            {/* Contador de Processos */}
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              {category.processes_count} processo{category.processes_count !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        {category.description && (
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {category.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                          <span>Ordem: {category.order_position}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="truncate">Cor: {category.color}</span>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap sm:flex-nowrap">
                      {/* Mover para cima */}
                      <button
                        onClick={() => handleMoveUp(category)}
                        disabled={index === 0 || submitting}
                        className={`p-2 rounded-lg sm:rounded-xl transition-colors min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 touch-manipulation flex items-center justify-center ${
                          index === 0
                            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
                        }`}
                        title="Mover para cima"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>

                      {/* Mover para baixo */}
                      <button
                        onClick={() => handleMoveDown(category)}
                        disabled={index === filteredCategories.length - 1 || submitting}
                        className={`p-2 rounded-lg sm:rounded-xl transition-colors min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 touch-manipulation flex items-center justify-center ${
                          index === filteredCategories.length - 1
                            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
                        }`}
                        title="Mover para baixo"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>

                      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 hidden sm:block"></div>

                      {/* Editar */}
                      <button
                        onClick={() => openEditModal(category)}
                        disabled={submitting}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg sm:rounded-xl transition-colors min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 touch-manipulation flex items-center justify-center"
                        title="Editar categoria"
                      >
                        <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>

                      {/* Ativar/Desativar */}
                      <button
                        onClick={() => handleToggleActive(category)}
                        disabled={submitting}
                        className={`p-2 rounded-lg sm:rounded-xl transition-colors min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 touch-manipulation flex items-center justify-center ${
                          category.is_active
                            ? 'text-orange-600 hover:bg-orange-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={category.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {category.is_active ? (
                          <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </button>

                      {/* Deletar */}
                      <button
                        onClick={() => openDeleteModal(category)}
                        disabled={submitting}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg sm:rounded-xl transition-colors min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 touch-manipulation flex items-center justify-center"
                        title="Deletar categoria"
                      >
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="mt-4 sm:mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 text-sm sm:text-base">💡 Como funciona</h3>
              <ul className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span><strong>Editar categoria:</strong> Atualiza automaticamente em todos os processos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span><strong>Desativar:</strong> Mantém dados mas oculta dos filtros</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span><strong>Deletar:</strong> Só é possível se nenhum processo estiver usando</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span><strong>Ordem:</strong> Define a ordem de exibição nos dropdowns</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Criar Categoria */}
      {showCreateModal && (
        <CategoryModal
          title="Nova Categoria"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreate}
          onClose={() => {
            setShowCreateModal(false)
            resetForm()
          }}
          submitting={submitting}
        />
      )}

      {/* Modal de Editar Categoria */}
      {showEditModal && (
        <CategoryModal
          title="Editar Categoria"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleEdit}
          onClose={() => {
            setShowEditModal(false)
            setSelectedCategory(null)
            resetForm()
          }}
          submitting={submitting}
          isEdit
        />
      )}

      {/* Modal de Confirmar Exclusão */}
      {showDeleteModal && selectedCategory && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div 
              className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-60" 
              onClick={() => setShowDeleteModal(false)}
            />

            <div className="relative bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all w-full max-w-lg max-h-[90vh] overflow-y-auto my-auto">
              <div className="bg-white dark:bg-gray-800 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                    <Trash2 className="h-7 w-7 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#373435] dark:text-white">
                      Deletar Categoria
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Esta ação não pode ser desfeita
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Você está prestes a deletar a categoria:
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
                    <p className="font-semibold text-[#373435] dark:text-white text-lg">
                      {selectedCategory.name}
                    </p>
                    {selectedCategory.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {selectedCategory.description}
                      </p>
                    )}
                  </div>

                  {selectedCategory.processes_count > 0 ? (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-red-800 font-medium">
                        ❌ Não é possível deletar esta categoria!
                      </p>
                      <p className="text-sm text-red-700 mt-2">
                        Ela está sendo usada por <strong>{selectedCategory.processes_count}</strong> processo(s).
                      </p>
                      <p className="text-sm text-red-700 mt-2">
                        💡 Você pode <strong>desativá-la</strong> ao invés de deletar.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
                      <p className="text-green-800 text-sm">
                        ✅ Esta categoria não está sendo usada por nenhum processo e pode ser deletada com segurança.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={submitting}
                  className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors font-medium min-h-[44px] touch-manipulation"
                >
                  Cancelar
                </button>
                {selectedCategory.processes_count === 0 && (
                  <button
                    onClick={handleDelete}
                    disabled={submitting}
                    className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
                  >
                    {submitting ? 'Deletando...' : 'Deletar Categoria'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente Modal Reutilizável
function CategoryModal({ title, formData, setFormData, onSubmit, onClose, submitting, isEdit = false }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-60" 
          onClick={onClose}
        />

        <div className="relative bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all w-full max-w-2xl max-h-[90vh] overflow-y-auto my-auto">
          <form onSubmit={onSubmit}>
            <div className="bg-white dark:bg-gray-800 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#373435] dark:text-white flex items-center gap-2 sm:gap-3">
                  <Tag className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-[#EBA500]" />
                  <span className="truncate">{title}</span>
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Nome */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome da Categoria *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent text-sm sm:text-base min-h-[44px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ex: Gestão Financeira"
                    required
                    maxLength={100}
                  />
                  <span className="text-xs text-gray-500 mt-1 block">
                    {formData.name.length}/100
                  </span>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Descreva o propósito desta categoria..."
                    rows={3}
                    maxLength={500}
                  />
                  <span className="text-xs text-gray-500 mt-1 block">
                    {formData.description.length}/500
                  </span>
                </div>

                {/* Grid: Cor e Ordem */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Cor */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cor
                    </label>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="w-16 h-12 rounded-xl border border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="#EBA500"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>
                  </div>

                  {/* Ordem */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ordem de Exibição
                    </label>
                    <input
                      type="number"
                      value={formData.order_position}
                      onChange={(e) => setFormData(prev => ({ ...prev, order_position: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min="0"
                    />
                    <span className="text-xs text-gray-500 mt-1 block">
                      Menor número aparece primeiro
                    </span>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preview
                  </label>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: formData.color + '20' }}
                    >
                      <Tag className="h-6 w-6" style={{ color: formData.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formData.name || 'Nome da Categoria'}
                      </p>
                      {formData.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {formData.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {isEdit && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40 rounded-xl p-4">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                      ⚠️ <strong>Atenção:</strong> Ao editar o nome ou outros dados desta categoria, 
                      todos os processos vinculados serão atualizados automaticamente.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors font-medium min-h-[44px] touch-manipulation"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.name.trim()}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-[#EBA500] text-white rounded-xl hover:bg-[#d49400] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
              >
                <Save className="h-4 w-4" />
                <span>{submitting ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Categoria'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
