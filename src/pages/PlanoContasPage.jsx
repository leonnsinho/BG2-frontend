import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  BookOpen,
  AlertCircle,
  X,
  Save,
  Tag,
  List,
  ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'

function PlanoContasPage() {
  const { profile } = useAuth()
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [showDeleteCategoriaModal, setShowDeleteCategoriaModal] = useState(false)
  const [deletingItem, setDeletingItem] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [editingCategoria, setEditingCategoria] = useState(null)
  const [deletingCategoria, setDeletingCategoria] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState('all')
  const [collapsedCategories, setCollapsedCategories] = useState({})

  // Formulário de item
  const [formData, setFormData] = useState({
    categoria_id: '',
    nome: '',
    descricao: ''
  })

  // Formulário de categoria
  const [categoriaFormData, setCategoriaFormData] = useState({
    nome: '',
    descricao: ''
  })

  const isSuperAdmin = () => profile?.role === 'super_admin'

  const toggleCategory = (categoriaId) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoriaId]: !prev[categoriaId]
    }))
  }

  useEffect(() => {
    if (isSuperAdmin()) {
      fetchCategorias()
    }
  }, [profile])

  const fetchCategorias = async () => {
    try {
      setLoading(true)
      
      // Buscar categorias
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('dfc_categorias')
        .select('*')
        .order('nome')

      if (categoriasError) throw categoriasError

      // Buscar itens de cada categoria
      const { data: itensData, error: itensError } = await supabase
        .from('dfc_itens')
        .select('*')
        .order('nome')

      if (itensError) throw itensError

      // Organizar itens por categoria
      const categoriasComItens = (categoriasData || []).map(cat => ({
        ...cat,
        itens: (itensData || []).filter(item => item.categoria_id === cat.id)
      }))

      setCategorias(categoriasComItens)
      
      // Inicializar todas categorias como fechadas
      const initialCollapsed = {}
      categoriasComItens.forEach(cat => {
        initialCollapsed[cat.id] = true
      })
      setCollapsedCategories(initialCollapsed)
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      toast.error('Erro ao carregar plano de contas')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (item = null, categoriaId = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        categoria_id: item.categoria_id,
        nome: item.nome,
        descricao: item.descricao || ''
      })
    } else {
      setEditingItem(null)
      setFormData({
        categoria_id: categoriaId || '',
        nome: '',
        descricao: ''
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setFormData({
      categoria_id: '',
      nome: '',
      descricao: ''
    })
  }

  const openCategoriaModal = (categoria = null) => {
    if (categoria) {
      setEditingCategoria(categoria)
      setCategoriaFormData({
        nome: categoria.nome,
        descricao: categoria.descricao || ''
      })
    } else {
      setEditingCategoria(null)
      setCategoriaFormData({
        nome: '',
        descricao: ''
      })
    }
    setShowCategoriaModal(true)
  }

  const closeCategoriaModal = () => {
    setShowCategoriaModal(false)
    setEditingCategoria(null)
    setCategoriaFormData({
      nome: '',
      descricao: ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.categoria_id || !formData.nome) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const dataToSave = {
        categoria_id: formData.categoria_id,
        nome: formData.nome.trim(),
        descricao: formData.descricao?.trim() || null,
        created_by: profile.id
      }

      if (editingItem) {
        // Atualizar
        const { error } = await supabase
          .from('dfc_itens')
          .update(dataToSave)
          .eq('id', editingItem.id)

        if (error) throw error
        toast.success('Item atualizado com sucesso!')
      } else {
        // Criar
        const { error } = await supabase
          .from('dfc_itens')
          .insert([dataToSave])

        if (error) throw error
        toast.success('Item criado com sucesso!')
      }

      closeModal()
      fetchCategorias()
    } catch (error) {
      console.error('Erro ao salvar item:', error)
      toast.error('Erro ao salvar item: ' + error.message)
    }
  }

  const handleCategoriaSubmit = async (e) => {
    e.preventDefault()

    if (!categoriaFormData.nome) {
      toast.error('Preencha o nome da categoria')
      return
    }
    
    try {
      const dataToSave = {
        nome: categoriaFormData.nome.trim(),
        descricao: categoriaFormData.descricao?.trim() || null,
        created_by: profile.id
      }

      if (editingCategoria) {
        // Atualizar
        const { error } = await supabase
          .from('dfc_categorias')
          .update(dataToSave)
          .eq('id', editingCategoria.id)

        if (error) throw error
        toast.success('Categoria atualizada com sucesso!')
      } else {
        // Criar
        const { error } = await supabase
          .from('dfc_categorias')
          .insert([dataToSave])

        if (error) throw error
        toast.success('Categoria criada com sucesso!')
      }

      closeCategoriaModal()
      fetchCategorias()
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      toast.error('Erro ao salvar categoria: ' + error.message)
    }
  }

  const handleDelete = (item) => {
    setDeletingItem(item)
    setShowDeleteModal(true)
  }

  const handleDeleteCategoria = (categoria) => {
    setDeletingCategoria(categoria)
    setShowDeleteCategoriaModal(true)
  }

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('dfc_itens')
        .delete()
        .eq('id', deletingItem.id)

      if (error) throw error
      toast.success('Item excluído com sucesso!')
      fetchCategorias()
    } catch (error) {
      console.error('Erro ao excluir item:', error)
      toast.error('Erro ao excluir item')
    } finally {
      setShowDeleteModal(false)
      setDeletingItem(null)
    }
  }

  const confirmDeleteCategoria = async () => {
    try {
      const { error } = await supabase
        .from('dfc_categorias')
        .delete()
        .eq('id', deletingCategoria.id)

      if (error) throw error
      toast.success('Categoria excluída com sucesso!')
      fetchCategorias()
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
      toast.error('Erro ao excluir categoria: ' + error.message)
    } finally {
      setShowDeleteCategoriaModal(false)
      setDeletingCategoria(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setDeletingItem(null)
  }

  const cancelDeleteCategoria = () => {
    setShowDeleteCategoriaModal(false)
    setDeletingCategoria(null)
  }

  // Filtrar categorias
  const filteredCategorias = categorias.filter(cat => {
    if (categoriaFilter !== 'all' && cat.id !== categoriaFilter) return false
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const nomeMatch = cat.nome.toLowerCase().includes(searchLower)
      const itemMatch = cat.itens.some(item => 
        item.nome.toLowerCase().includes(searchLower)
      )
      return nomeMatch || itemMatch
    }
    
    return true
  })

  if (!isSuperAdmin()) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Apenas Super Admins podem acessar esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#373435]">
              Plano de Contas
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Gerenciar categorias e itens do DFC
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => openCategoriaModal()}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-[#373435] text-white rounded-2xl hover:bg-[#373435]/90 transition-all font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Categoria</span>
            </button>
            <button
              onClick={() => openModal()}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-[#EBA500] text-white rounded-2xl hover:bg-[#EBA500]/90 transition-all font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Item</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por categoria ou item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] transition-all"
            />
          </div>

          <select
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] transition-all"
          >
            <option value="all">Todas as categorias</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200/50 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Categorias</p>
              <p className="text-2xl font-bold text-[#373435] mt-1">{categorias.length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white border border-gray-200/50 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Itens</p>
              <p className="text-2xl font-bold text-[#373435] mt-1">
                {categorias.reduce((total, cat) => total + cat.itens.length, 0)}
              </p>
            </div>
            <List className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Lista de Categorias e Itens */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white border border-gray-200/50 rounded-2xl p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500] mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        ) : filteredCategorias.length === 0 ? (
          <div className="bg-white border border-gray-200/50 rounded-2xl p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma categoria encontrada</h3>
            <p className="text-gray-600">
              {searchTerm || categoriaFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Adicione a primeira categoria'}
            </p>
          </div>
        ) : (
          filteredCategorias.map(categoria => (
            <div key={categoria.id} className="bg-white border border-gray-200/50 rounded-2xl overflow-hidden">
              {/* Header da Categoria */}
              <div className="bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/5 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleCategory(categoria.id)}
                    className="flex items-center space-x-3 flex-1 text-left hover:opacity-80 transition-opacity"
                  >
                    <div className="p-2 bg-[#EBA500]/20 rounded-xl">
                      <Tag className="h-5 w-5 text-[#EBA500]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#373435]">
                        {categoria.nome}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">{categoria.itens.length} {categoria.itens.length === 1 ? 'item' : 'itens'}</p>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${
                      collapsedCategories[categoria.id] ? 'rotate-0' : 'rotate-180'
                    }`} />
                  </button>
                  <div className="flex items-center space-x-2 ml-3">
                    <button
                      onClick={() => openCategoriaModal(categoria)}
                      className="p-1.5 text-gray-600 hover:bg-gray-200/50 rounded-lg transition-colors"
                      title="Editar categoria"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategoria(categoria)}
                      className="p-1.5 text-red-600 hover:bg-red-100/50 rounded-lg transition-colors"
                      title="Excluir categoria"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openModal(null, categoria.id)}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-[#EBA500] text-white rounded-xl hover:bg-[#EBA500]/90 transition-all text-sm font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Adicionar Item</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de Itens */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                collapsedCategories[categoria.id] ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
              }`}>
                <div className="p-4">
                  {categoria.itens.length === 0 ? (
                    <div className="text-center py-6">
                      <List className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Nenhum item cadastrado nesta categoria</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                      {categoria.itens.map(item => (
                        <div
                          key={item.id}
                          className="group border border-gray-200 rounded-lg p-2.5 hover:border-[#EBA500]/30 hover:shadow-sm transition-all bg-white"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">{item.nome}</h4>
                              {item.descricao && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.descricao}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button
                                onClick={() => openModal(item)}
                                className="p-1 text-[#EBA500] hover:bg-[#EBA500]/10 rounded transition-all"
                                title="Editar item"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                                title="Excluir item"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Formulário */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModal}>
          <div 
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#EBA500] to-[#EBA500]/80 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Tag className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {editingItem ? 'Editar Item' : 'Novo Item'}
                    </h2>
                    <p className="text-sm text-white/90 mt-1">Preencha os dados do item</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white hover:bg-white/20 p-2 rounded-xl transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                <select
                  value={formData.categoria_id}
                  onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Item *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]"
                  placeholder="Ex: Simples Nacional, Aluguel, etc."
                  required
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (Opcional)
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]"
                  rows="3"
                  placeholder="Descrição adicional do item..."
                />
              </div>
            </form>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center space-x-2 px-4 py-2 bg-[#EBA500] text-white rounded-xl hover:bg-[#EBA500]/90 transition-all font-medium"
              >
                <Save className="h-4 w-4" />
                <span>{editingItem ? 'Atualizar' : 'Salvar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <AlertCircle className="h-6 w-6 mr-2" />
                  Confirmar Exclusão
                </h3>
                <button
                  onClick={cancelDelete}
                  className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium mb-2">
                    Tem certeza que deseja excluir o item "{deletingItem?.nome}"?
                  </p>
                  <p className="text-sm text-gray-600">
                    Esta ação não pode ser desfeita. O item será removido permanentemente do plano de contas.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium"
              >
                <Trash2 className="h-4 w-4" />
                <span>Excluir Item</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Categoria (Criar/Editar) */}
      {showCategoriaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl transform transition-all">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#EBA500] via-[#EBA500] to-[#d69500] px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <Tag className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
                    </h3>
                    <p className="text-white/80 text-sm mt-0.5">
                      {editingCategoria ? 'Atualize as informações da categoria' : 'Preencha os dados da nova categoria'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeCategoriaModal}
                  className="text-white hover:bg-white/20 rounded-xl p-2 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCategoriaSubmit} className="p-8">
              <div className="space-y-6">
                {/* Nome */}
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    Nome da Categoria
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={categoriaFormData.nome}
                      onChange={(e) => setCategoriaFormData({ ...categoriaFormData, nome: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] transition-all text-gray-900 font-medium"
                      placeholder="Ex: Despesas Comerciais"
                      required
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">Nome completo que será exibido no sistema</p>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descrição
                    <span className="text-gray-400 ml-1 font-normal">(Opcional)</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={categoriaFormData.descricao}
                      onChange={(e) => setCategoriaFormData({ ...categoriaFormData, descricao: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] transition-all text-gray-900 resize-none"
                      rows="4"
                      placeholder="Adicione detalhes sobre esta categoria..."
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">Informações adicionais para identificar melhor a categoria</p>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="border-t-2 border-gray-100 px-8 py-5 bg-gradient-to-b from-gray-50 to-white rounded-b-3xl flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeCategoriaModal}
                className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleCategoriaSubmit}
                className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-[#EBA500] to-[#d69500] text-white rounded-xl hover:from-[#d69500] hover:to-[#c78900] transition-all font-semibold shadow-lg shadow-[#EBA500]/30"
              >
                <Save className="h-4 w-4" />
                <span>{editingCategoria ? 'Atualizar Categoria' : 'Salvar Categoria'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Categoria */}
      {showDeleteCategoriaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <AlertCircle className="h-6 w-6 mr-2" />
                  Confirmar Exclusão
                </h3>
                <button
                  onClick={cancelDeleteCategoria}
                  className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium mb-2">
                    Tem certeza que deseja excluir a categoria "{deletingCategoria?.nome}"?
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    Esta ação não pode ser desfeita. A categoria e TODOS os seus itens serão removidos permanentemente.
                  </p>
                  {deletingCategoria?.itens?.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800 font-medium flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Esta categoria possui {deletingCategoria.itens.length} {deletingCategoria.itens.length === 1 ? 'item' : 'itens'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelDeleteCategoria}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteCategoria}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium"
              >
                <Trash2 className="h-4 w-4" />
                <span>Excluir Categoria</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlanoContasPage
