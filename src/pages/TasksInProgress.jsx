import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Layout } from '../components/layout/Layout'
import { Sidebar } from '../components/layout/Sidebar'
import { 
  CheckSquare, 
  Clock, 
  User, 
  Calendar,
  Filter,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader,
  FileText,
  Building2,
  MapPin,
  Edit3,
  Save,
  X
} from 'lucide-react'

const TasksInProgress = () => {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('') // Mudado para texto
  const [journeyFilter, setJourneyFilter] = useState('all')
  const [editingTask, setEditingTask] = useState(null)
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    status: '',
    due_date: '',
    assigned_to: ''
  })

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)

      // Usar a view tasks_with_details que já traz todos os dados relacionados
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks_with_details')
        .select('*')
        .order('created_at', { ascending: false })

      if (tasksError) {
        console.error('Erro ao buscar tarefas:', tasksError)
        throw tasksError
      }

      console.log('📋 Tarefas carregadas com detalhes:', tasksData)

      // Mapear os dados para o formato esperado pelo componente
      const formattedTasks = tasksData?.map(task => ({
        ...task,
        company: task.company_name ? { id: task.company_id, name: task.company_name } : null,
        journey: task.journey_name ? { id: task.journey_id, name: task.journey_name } : null,
        assigned_to_user: task.assigned_to_name ? {
          id: task.assigned_to,
          name: task.assigned_to_name,
          email: task.assigned_to_email
        } : null,
        created_by_user: task.created_by_name ? {
          id: task.created_by,
          name: task.created_by_name,
          email: task.created_by_email
        } : null
      })) || []

      console.log('✅ Tarefas formatadas:', formattedTasks)

      setTasks(formattedTasks)
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  // Funções de edição
  const openEditModal = (task) => {
    setEditingTask(task)
    setEditFormData({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'pending',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      assigned_to: task.assigned_to || ''
    })
  }

  const closeEditModal = () => {
    setEditingTask(null)
    setEditFormData({
      title: '',
      description: '',
      status: '',
      due_date: '',
      assigned_to: ''
    })
  }

  const saveTaskEdit = async () => {
    if (!editingTask) return

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: editFormData.title,
          description: editFormData.description,
          status: editFormData.status,
          due_date: editFormData.due_date || null,
          assigned_to: editFormData.assigned_to || null
        })
        .eq('id', editingTask.id)

      if (error) throw error

      // Recarregar tarefas
      await loadTasks()
      closeEditModal()
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error)
      alert('Erro ao salvar tarefa')
    }
  }

  const deleteTask = async (taskId) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      await loadTasks()
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error)
      alert('Erro ao excluir tarefa')
    }
  }

  // Buscar usuários disponíveis para atribuição
  const [availableUsers, setAvailableUsers] = useState([])
  
  useEffect(() => {
    const loadUsers = async () => {
      try {
        // Primeiro tentar buscar da view tasks_with_details para pegar usuários únicos
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks_with_details')
          .select('assigned_to, assigned_to_name, assigned_to_email, created_by, created_by_name, created_by_email')

        if (tasksError) {
          console.error('Erro ao carregar usuários:', tasksError)
          return
        }

        // Criar lista única de usuários
        const usersMap = new Map()
        
        tasksData?.forEach(task => {
          if (task.assigned_to && task.assigned_to_name) {
            usersMap.set(task.assigned_to, {
              id: task.assigned_to,
              name: task.assigned_to_name,
              email: task.assigned_to_email
            })
          }
          if (task.created_by && task.created_by_name) {
            usersMap.set(task.created_by, {
              id: task.created_by,
              name: task.created_by_name,
              email: task.created_by_email
            })
          }
        })

        // Filtrar o usuário logado da lista
        const users = Array.from(usersMap.values())
          .filter(user => user.id !== profile?.id)
          .sort((a, b) => a.name.localeCompare(b.name))
        
        console.log('👥 Usuários disponíveis:', users)
        setAvailableUsers(users)
      } catch (error) {
        console.error('Erro ao carregar usuários:', error)
      }
    }
    
    loadUsers()
  }, [])

  // Filtrar tarefas
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesUser = !userFilter || task.assigned_to_user?.name?.toLowerCase().includes(userFilter.toLowerCase())
    const matchesJourney = journeyFilter === 'all' || task.journey_id === journeyFilter

    return matchesSearch && matchesStatus && matchesUser && matchesJourney
  })

  // Obter lista única de jornadas para os filtros
  const uniqueJourneys = [...new Map(
    tasks
      .filter(t => t.journey)
      .map(t => [t.journey_id, t.journey])
  ).values()]

  // Estatísticas
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    cancelled: tasks.filter(t => t.status === 'cancelled').length
  }

  // Função para obter cor do status
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  // Função para obter ícone do status
  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      in_progress: Loader,
      completed: CheckCircle,
      cancelled: XCircle
    }
    const Icon = icons[status] || AlertCircle
    return <Icon className="h-4 w-4" />
  }

  // Função para obter texto do status
  const getStatusText = (status) => {
    const texts = {
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      completed: 'Concluída',
      cancelled: 'Cancelada'
    }
    return texts[status] || status
  }

  // Função para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return 'Não definido'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
  }

  if (loading) {
    return (
      <Layout sidebar={<Sidebar />}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader className="h-12 w-12 text-[#EBA500] animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando tarefas...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout sidebar={<Sidebar />}>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white border-b border-gray-200/50 shadow-sm -mx-8 -mt-8 px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#373435]">Tarefas em Andamento</h1>
              <p className="mt-2 text-base text-gray-600">
                Gerencie e acompanhe todas as tarefas do sistema
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500 bg-[#EBA500]/10 px-3 py-2 rounded-2xl">
                <CheckSquare className="h-4 w-4 text-[#EBA500]" />
                <span className="text-[#373435] font-medium">{stats.total} Tarefas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-[#EBA500]/20 to-[#EBA500]/30 rounded-xl">
                  <CheckSquare className="h-6 w-6 text-[#EBA500]" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-[#373435]">{stats.total}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-[#373435]">{stats.pending}</div>
                <div className="text-sm text-gray-500">Pendentes</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                  <Loader className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-[#373435]">{stats.in_progress}</div>
                <div className="text-sm text-gray-500">Em Progresso</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-[#373435]">{stats.completed}</div>
                <div className="text-sm text-gray-500">Concluídas</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-[#373435]">{stats.cancelled}</div>
                <div className="text-sm text-gray-500">Canceladas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6 mb-6">
          {/* Header dos Filtros com botão Limpar */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#373435] flex items-center">
              <Filter className="h-4 w-4 mr-2 text-[#EBA500]" />
              Filtros
            </h3>
            {(searchTerm || statusFilter !== 'all' || userFilter || journeyFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setUserFilter('')
                  setJourneyFilter('all')
                }}
                className="text-xs text-[#EBA500] hover:text-[#EBA500]/80 font-medium flex items-center space-x-1 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Limpar filtros</span>
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500]"
              />
            </div>

            {/* Filtro de Status */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] appearance-none bg-white"
              >
                <option value="all">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="in_progress">Em Andamento</option>
                <option value="completed">Concluída</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>

            {/* Filtro de Usuário (campo de texto) */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Filtrar por usuário..."
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500]"
              />
            </div>

            {/* Filtro de Jornada */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={journeyFilter}
                onChange={(e) => setJourneyFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] appearance-none bg-white"
              >
                <option value="all">Todas as jornadas</option>
                {uniqueJourneys.map(journey => (
                  <option key={journey.id} value={journey.id}>
                    {journey.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Grid de Tarefas */}
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-12 text-center">
            <CheckSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma tarefa encontrada</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || userFilter || journeyFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Não há tarefas cadastradas no momento'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6 hover:shadow-lg hover:border-[#EBA500]/30 transition-all duration-200 cursor-pointer group"
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#373435] mb-2 line-clamp-2 group-hover:text-[#EBA500] transition-colors">
                      {task.title}
                    </h3>
                    {task.company && (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Building2 className="h-4 w-4 mr-1.5 text-[#EBA500]" />
                        <span className="font-medium">{task.company.name}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Botões de Ação */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditModal(task)
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200"
                      title="Editar tarefa"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTask(task.id)
                      }}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200"
                      title="Excluir tarefa"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Jornada - Etiqueta */}
                {task.journey && (
                  <div className="mb-3">
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/20 border border-[#EBA500]/30 rounded-full">
                      <MapPin className="h-3.5 w-3.5 text-[#EBA500]" />
                      <span className="text-xs font-semibold text-[#373435]">{task.journey.name}</span>
                    </div>
                  </div>
                )}

                {/* Descrição */}
                {task.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                    {task.description}
                  </p>
                )}

                {/* Status */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(task.status)}`}>
                    {getStatusIcon(task.status)}
                    <span>{getStatusText(task.status)}</span>
                  </span>
                </div>

                {/* Responsável */}
                {task.assigned_to_user && (
                  <div className="mb-3 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl px-3 py-2.5 border border-gray-200/50">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[#EBA500]/20 to-[#EBA500]/30 ring-2 ring-white mr-2.5">
                        <User className="h-4 w-4 text-[#EBA500]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 font-medium">Responsável</div>
                        <div className="text-sm text-[#373435] font-semibold truncate">{task.assigned_to_user.name}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Datas */}
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>Prazo: {formatDate(task.due_date)}</span>
                    </div>
                    {task.completed_at && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        <span>{formatDate(task.completed_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer com contador de comentários */}
                {task.comments_count > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                      <FileText className="h-3 w-3 mr-1" />
                      <span>{task.comments_count} comentário(s)</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#373435]">Editar Tarefa</h2>
                <button
                  onClick={closeEditModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Corpo do Modal */}
            <div className="p-6 space-y-6">
              {/* Título */}
              <div>
                <label className="block text-sm font-semibold text-[#373435] mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] transition-all"
                  placeholder="Digite o título da tarefa"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-semibold text-[#373435] mb-2">
                  Descrição
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] transition-all resize-none"
                  rows="4"
                  placeholder="Digite a descrição da tarefa"
                />
              </div>

              {/* Grid com Status e Responsável */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-[#373435] mb-2">
                    Status *
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] transition-all bg-white"
                  >
                    <option value="pending">Pendente</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="completed">Concluída</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>

                {/* Responsável */}
                <div>
                  <label className="block text-sm font-semibold text-[#373435] mb-2">
                    Responsável
                  </label>
                  <select
                    value={editFormData.assigned_to}
                    onChange={(e) => setEditFormData({ ...editFormData, assigned_to: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] transition-all bg-white"
                  >
                    <option value="">Selecionar responsável</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data Limite */}
              <div>
                <label className="block text-sm font-semibold text-[#373435] mb-2">
                  Data Limite
                </label>
                <input
                  type="date"
                  value={editFormData.due_date}
                  onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] transition-all"
                />
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-3xl flex items-center justify-end space-x-3">
              <button
                onClick={closeEditModal}
                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={saveTaskEdit}
                disabled={!editFormData.title}
                className="px-6 py-3 bg-[#EBA500] text-white rounded-xl hover:bg-[#EBA500]/90 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save className="h-5 w-5" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default TasksInProgress
