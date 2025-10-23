import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  FileText, 
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  XCircle,
  CheckCircle,
  Target,
  Building2,
  Layers,
  ArrowUpDown,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { formatDate } from '../utils/dateUtils'

export default function AllProcessesPage() {
  const { profile } = useAuth()
  const [processes, setProcesses] = useState([])
  const [journeys, setJourneys] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedJourney, setSelectedJourney] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name') // name, journey, category, created_at
  const [sortOrder, setSortOrder] = useState('asc')
  const [selectedProcess, setSelectedProcess] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    category: '',
    order_index: 0,
    weight: 0,
    is_active: true
  })
  const [availableCategories, setAvailableCategories] = useState([])
  const [deleting, setDeleting] = useState(false)
  const [updating, setUpdating] = useState(false)
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 50

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      loadData()
    }
  }, [profile])

  const loadData = async () => {
    setLoading(true)
    try {
      // Carregar jornadas
      const { data: journeysData, error: journeysError } = await supabase
        .from('journeys')
        .select('id, name, slug, color')
        .eq('is_active', true)
        .order('order_index')

      if (journeysError) throw journeysError

      // Criar mapa de jornadas para lookup rápido
      const journeysMap = {}
      journeysData.forEach(j => {
        journeysMap[j.id] = j
      })
      setJourneys(journeysMap)

      // Carregar todos os processos
      const { data: processesData, error: processesError } = await supabase
        .from('processes')
        .select('*')
        .order('name')

      if (processesError) throw processesError

      setProcesses(processesData || [])
      console.log('📋 Processos carregados:', processesData?.length)

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      alert('Erro ao carregar dados: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedProcess) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('processes')
        .delete()
        .eq('id', selectedProcess.id)

      if (error) throw error

      alert('Processo deletado com sucesso!')
      setShowDeleteModal(false)
      setSelectedProcess(null)
      loadData() // Recarregar lista
    } catch (error) {
      console.error('Erro ao deletar processo:', error)
      alert('Erro ao deletar processo: ' + error.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleOpenEdit = async (process) => {
    setSelectedProcess(process)
    setEditData({
      name: process.name || '',
      description: process.description || '',
      category: process.category || '',
      order_index: process.order_index || 0,
      weight: process.weight || 0,
      is_active: process.is_active !== false
    })

    // Carregar categorias da jornada do processo
    await loadCategoriesForProcess(process.journey_id)

    setShowEditModal(true)
  }

  const loadCategoriesForProcess = async (journeyId) => {
    try {
      // Buscar todas as categorias únicas dos processos dessa jornada
      const { data, error } = await supabase
        .from('processes')
        .select('category')
        .eq('journey_id', journeyId)
        .not('category', 'is', null)
        .order('category')

      if (error) throw error

      // Extrair categorias únicas e ordenadas
      const categories = [...new Set(data?.map(p => p.category).filter(Boolean))].sort()
      setAvailableCategories(categories)

      console.log(`📂 Categorias carregadas para edição:`, categories)

    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
      setAvailableCategories([])
    }
  }

  const handleSaveEdit = async () => {
    if (!editData.name.trim()) {
      alert('Nome do processo é obrigatório')
      return
    }

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('processes')
        .update({
          name: editData.name.trim(),
          description: editData.description.trim(),
          category: editData.category.trim(),
          order_index: parseInt(editData.order_index) || 0,
          weight: parseFloat(editData.weight) || 0,
          is_active: editData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProcess.id)

      if (error) throw error

      alert('Processo atualizado com sucesso!')
      setShowEditModal(false)
      setSelectedProcess(null)
      loadData() // Recarregar lista
    } catch (error) {
      console.error('Erro ao salvar edição:', error)
      alert('Erro ao salvar edição: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  // Filtrar e ordenar processos
  const filteredProcesses = processes
    .filter(p => {
      // Filtro de busca
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchName = p.name?.toLowerCase().includes(search)
        const matchCode = p.code?.toLowerCase().includes(search)
        const matchDescription = p.description?.toLowerCase().includes(search)
        const matchCategory = p.category?.toLowerCase().includes(search)
        if (!matchName && !matchCode && !matchDescription && !matchCategory) {
          return false
        }
      }

      // Filtro de jornada
      if (selectedJourney !== 'all' && p.journey_id !== selectedJourney) {
        return false
      }

      // Filtro de categoria
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      let compareA, compareB

      switch (sortBy) {
        case 'name':
          compareA = a.name?.toLowerCase() || ''
          compareB = b.name?.toLowerCase() || ''
          break
        case 'journey':
          compareA = journeys[a.journey_id]?.name?.toLowerCase() || ''
          compareB = journeys[b.journey_id]?.name?.toLowerCase() || ''
          break
        case 'category':
          compareA = a.category?.toLowerCase() || ''
          compareB = b.category?.toLowerCase() || ''
          break
        case 'created_at':
          compareA = new Date(a.created_at || 0)
          compareB = new Date(b.created_at || 0)
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return compareA > compareB ? 1 : -1
      } else {
        return compareA < compareB ? 1 : -1
      }
    })

  // Extrair categorias únicas para o filtro
  const allCategories = [...new Set(processes.map(p => p.category).filter(Boolean))].sort()

  // Calcular paginação
  const totalPages = Math.ceil(filteredProcesses.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProcesses = filteredProcesses.slice(startIndex, endIndex)

  // Resetar para página 1 quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedJourney, selectedCategory, sortBy, sortOrder])

  // Gerar array de números de página para exibir
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 7 // Mostrar no máximo 7 botões de página
    
    if (totalPages <= maxPagesToShow) {
      // Se tem poucas páginas, mostra todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Lógica para muitas páginas
      if (currentPage <= 4) {
        // Início: 1 2 3 4 5 ... last
        for (let i = 1; i <= 5; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        // Fim: 1 ... last-4 last-3 last-2 last-1 last
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
      } else {
        // Meio: 1 ... current-1 current current+1 ... last
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  if (profile?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600">Apenas Super Admins podem acessar esta página.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#373435] mb-2">
            Gerenciar Processos
          </h1>
          <p className="text-gray-600">
            Visualize e gerencie todos os processos cadastrados no sistema
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Processos</p>
                <p className="text-3xl font-bold text-[#373435]">{processes.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Jornadas</p>
                <p className="text-3xl font-bold text-[#373435]">{Object.keys(journeys).length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Categorias</p>
                <p className="text-3xl font-bold text-[#373435]">{allCategories.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Layers className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Filtrados</p>
                <p className="text-3xl font-bold text-[#373435]">{filteredProcesses.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Filter className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, código, descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent"
              />
            </div>

            {/* Filtro de Jornada */}
            <div>
              <select
                value={selectedJourney}
                onChange={(e) => setSelectedJourney(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent"
              >
                <option value="all">Todas as Jornadas</option>
                {Object.values(journeys).map(j => (
                  <option key={j.id} value={j.id}>{j.name}</option>
                ))}
              </select>
            </div>

            {/* Filtro de Categoria */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent"
              >
                <option value="all">Todas as Categorias</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de Processos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th 
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Nome
                      {sortBy === 'name' && (
                        <ArrowUpDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Código
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('journey')}
                  >
                    <div className="flex items-center gap-2">
                      Jornada
                      {sortBy === 'journey' && (
                        <ArrowUpDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('category')}
                  >
                    <div className="flex items-center gap-2">
                      Categoria
                      {sortBy === 'category' && (
                        <ArrowUpDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedProcesses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">Nenhum processo encontrado</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {searchTerm || selectedJourney !== 'all' || selectedCategory !== 'all'
                          ? 'Tente ajustar os filtros'
                          : 'Não há processos cadastrados no sistema'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedProcesses.map(process => {
                    const journey = journeys[process.journey_id]
                    return (
                      <tr key={process.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{process.name}</p>
                              {process.description && (
                                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                                  {process.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono text-gray-600">
                            {process.code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {journey && (
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: journey.color }}
                              />
                              <span className="text-sm text-gray-700">{journey.name}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {process.category && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              {process.category}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {process.is_active ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle className="h-3 w-3" />
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              <XCircle className="h-3 w-3" />
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedProcess(process)
                                setShowDetailsModal(true)
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver detalhes"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(process)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProcess(process)
                                setShowDeleteModal(true)
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Deletar"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {filteredProcesses.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                {/* Info de registros */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>
                    Mostrando <span className="font-medium text-gray-900">{startIndex + 1}</span> até{' '}
                    <span className="font-medium text-gray-900">
                      {Math.min(endIndex, filteredProcesses.length)}
                    </span>{' '}
                    de <span className="font-medium text-gray-900">{filteredProcesses.length}</span> processos
                  </span>
                </div>

                {/* Navegação de páginas */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    {/* Botão Anterior */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Página anterior"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    {/* Números de página */}
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((pageNum, index) => {
                        if (pageNum === '...') {
                          return (
                            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                              ...
                            </span>
                          )
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`min-w-[40px] px-3 py-2 rounded-lg font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'bg-[#EBA500] text-white shadow-sm'
                                : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>

                    {/* Botão Próxima */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Próxima página"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    {/* Ir para página específica */}
                    <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-300">
                      <span className="text-sm text-gray-600">Ir para:</span>
                      <input
                        type="number"
                        min="1"
                        max={totalPages}
                        value={currentPage}
                        onChange={(e) => {
                          const page = parseInt(e.target.value)
                          if (page >= 1 && page <= totalPages) {
                            setCurrentPage(page)
                          }
                        }}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent"
                      />
                      <span className="text-sm text-gray-600">de {totalPages}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedProcess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#373435]">
                  Detalhes do Processo
                </h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Processo
                  </label>
                  <p className="text-lg font-semibold text-gray-900">{selectedProcess.name}</p>
                </div>

                {/* Grid de Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código
                    </label>
                    <p className="font-mono text-gray-900">{selectedProcess.code}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria
                    </label>
                    <p className="text-gray-900">{selectedProcess.category || '-'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ordem
                    </label>
                    <p className="text-gray-900">{selectedProcess.order_index}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Peso
                    </label>
                    <p className="text-gray-900">{selectedProcess.weight || '-'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <p className="text-gray-900">
                      {selectedProcess.is_active ? '✅ Ativo' : '❌ Inativo'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Versão
                    </label>
                    <p className="text-gray-900">{selectedProcess.version || '1'}</p>
                  </div>
                </div>

                {/* Jornada */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jornada
                  </label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: journeys[selectedProcess.journey_id]?.color }}
                    />
                    <p className="text-gray-900">
                      {journeys[selectedProcess.journey_id]?.name || 'Não identificada'}
                    </p>
                  </div>
                </div>

                {/* Descrição */}
                {selectedProcess.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedProcess.description}</p>
                  </div>
                )}

                {/* Descrição Detalhada */}
                {selectedProcess.detailed_description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição Detalhada
                    </label>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedProcess.detailed_description}</p>
                  </div>
                )}

                {/* Datas */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Criado em
                    </label>
                    <p className="text-sm text-gray-600">{formatDate(selectedProcess.created_at)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Atualizado em
                    </label>
                    <p className="text-sm text-gray-600">{formatDate(selectedProcess.updated_at)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && selectedProcess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>

            <h2 className="text-2xl font-bold text-[#373435] text-center mb-2">
              Deletar Processo?
            </h2>
            
            <p className="text-gray-600 text-center mb-6">
              Tem certeza que deseja deletar o processo <strong>{selectedProcess.name}</strong>?
              Esta ação não pode ser desfeita.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedProcess(null)
                }}
                disabled={deleting}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deletando...' : 'Sim, Deletar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {showEditModal && selectedProcess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#373435]">
                  Editar Processo
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Nome do Processo */}
                <div>
                  <label htmlFor="edit_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Processo *
                  </label>
                  <input
                    type="text"
                    id="edit_name"
                    value={editData.name}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    maxLength={200}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex: Análise de Fornecedores"
                    required
                  />
                  <span className="text-xs text-gray-500 mt-1 block">
                    {editData.name.length}/200
                  </span>
                </div>

                {/* Descrição */}
                <div>
                  <label htmlFor="edit_description" className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    id="edit_description"
                    value={editData.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    maxLength={1000}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Descreva o objetivo e escopo deste processo..."
                  />
                  <span className="text-xs text-gray-500 mt-1 block">
                    {editData.description.length}/1000
                  </span>
                </div>

                {/* Grid com Categoria, Ordem e Peso */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Categoria */}
                  <div>
                    <label htmlFor="edit_category" className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria
                    </label>
                    <select
                      id="edit_category"
                      value={editData.category}
                      onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Selecione...</option>
                      {availableCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ordem */}
                  <div>
                    <label htmlFor="edit_order" className="block text-sm font-medium text-gray-700 mb-2">
                      Ordem
                    </label>
                    <input
                      type="number"
                      id="edit_order"
                      value={editData.order_index}
                      onChange={(e) => setEditData(prev => ({ ...prev, order_index: e.target.value }))}
                      min="0"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  {/* Peso */}
                  <div>
                    <label htmlFor="edit_weight" className="block text-sm font-medium text-gray-700 mb-2">
                      Peso
                    </label>
                    <input
                      type="number"
                      id="edit_weight"
                      value={editData.weight}
                      onChange={(e) => setEditData(prev => ({ ...prev, weight: e.target.value }))}
                      min="0"
                      step="0.1"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Status Ativo */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editData.is_active}
                      onChange={(e) => setEditData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Processo Ativo
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-8">
                    Processos inativos não aparecem para os usuários
                  </p>
                </div>

                {/* Info da Jornada */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Jornada: {journeys[selectedProcess.journey_id]?.name}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Código: {selectedProcess.code}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={updating}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={updating || !editData.name.trim()}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {updating ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
