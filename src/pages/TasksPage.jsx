import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTasks } from '../hooks/useTasks'
import { Navigate } from 'react-router-dom'
import TaskSidebar from '../components/planejamento/TaskSidebar'
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar,
  User,
  Filter,
  Search,
  ChevronDown,
  FileText,
  Target,
  Edit,
  Trash2,
  MessageSquare,
  Paperclip,
  X,
  List,
  UserCircle,
  MapPin,
  Grid3x3,
  ShieldAlert
} from 'lucide-react'
import { formatDate } from '../utils/dateUtils'

export default function TasksPage() {
  const { profile } = useAuth()
  const { getTasks, getCompanyUsers, updateTask, deleteTask, toggleAssigneeCompletion, loading } = useTasks()
  
  // 🔒 Bloquear acesso para Super Admin
  if (profile?.role === 'super_admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="inline-flex p-4 bg-red-100 rounded-full mb-4">
            <ShieldAlert className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-600 mb-6">
            Super Admins não têm acesso à tela de tarefas. Esta funcionalidade é exclusiva para usuários da empresa.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gradient-to-r from-[#EBA500] to-[#d99500] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }
  
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [filteredTasks, setFilteredTasks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, pending, in_progress, completed
  const [priorityFilter, setPriorityFilter] = useState('all') // all, 1, 2, 3, 4, 5
  const [viewMode, setViewMode] = useState('list') // list ou grid
  const [selectedTask, setSelectedTask] = useState(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [isCommentsSidebarOpen, setIsCommentsSidebarOpen] = useState(false)

  useEffect(() => {
    // ⏳ Aguardar até que o profile tenha company_id ou user_companies carregado
    if (profile?.company_id || (profile?.user_companies && profile.user_companies.length > 0)) {
      loadData()
    }
  }, [profile?.company_id, profile?.user_companies])

  useEffect(() => {
    applyFilters()
  }, [tasks, searchQuery, statusFilter, priorityFilter])

  const loadData = async () => {
    try {
      const [tasksData, usersData] = await Promise.all([
        getTasks(),
        getCompanyUsers()
      ])
      
      // 🔥 ATUALIZADO: Filtrar tarefas onde o usuário é responsável (assigned_to OU em assignees)
      const myTasks = (tasksData || []).filter(task => {
        // Verificar assigned_to (legado/compatibilidade)
        if (task.assigned_to === profile?.id) {
          return true
        }
        
        // Verificar se está na lista de assignees (múltiplos responsáveis)
        if (task.assignees && task.assignees.length > 0) {
          const isAssigned = task.assignees.some(assignee => assignee.userId === profile?.id)
          
          // 🔥 DEBUG: Verificar status do assignee atual
          if (isAssigned) {
            const myAssignee = task.assignees.find(a => a.userId === profile?.id)
            console.log(`📋 Tarefa ${task.id} - Meu status:`, myAssignee?.hasCompleted ? 'CONCLUÍDO' : 'PENDENTE')
            console.log(`   Todos assignees:`, task.assignees.map(a => ({ name: a.name, completed: a.hasCompleted })))
          }
          
          return isAssigned
        }
        
        return false
      })
      
      console.log('📋 Total de tarefas:', tasksData?.length || 0)
      console.log('✅ Minhas tarefas:', myTasks.length)
      
      setTasks(myTasks)
      setUsers(usersData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const applyFilters = () => {
    let filtered = [...tasks]

    // Filtro de busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(task => 
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      )
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter)
    }

    // Filtro de prioridade
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === parseInt(priorityFilter))
    }

    setFilteredTasks(filtered)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200'
      case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'pending': return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Concluída'
      case 'in_progress': return 'Em Andamento'
      case 'pending': return 'Pendente'
      case 'cancelled': return 'Cancelada'
      default: return status
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckCircle2
      case 'in_progress': return Clock
      case 'pending': return AlertCircle
      default: return FileText
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return 'text-red-600 bg-red-50'
      case 2: return 'text-orange-600 bg-orange-50'
      case 3: return 'text-yellow-600 bg-yellow-50'
      case 4: return 'text-blue-600 bg-blue-50'
      case 5: return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1: return 'Crítica'
      case 2: return 'Alta'
      case 3: return 'Média'
      case 4: return 'Baixa'
      case 5: return 'Muito Baixa'
      default: return 'Não definida'
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      // 🔥 ATUALIZADO: Para tarefas com múltiplos responsáveis, atualizar status individual
      const task = tasks.find(t => t.id === taskId)
      
      if (task && task.assignees && task.assignees.length > 0) {
        // Tarefa com múltiplos responsáveis - atualizar apenas conclusão do usuário atual
        const hasCompleted = newStatus === 'completed'
        await toggleAssigneeCompletion(taskId, profile?.id, hasCompleted)
        console.log(`✅ Status individual atualizado para ${newStatus} pelo usuário ${profile?.id}`)
      } else {
        // Tarefa antiga (compatibilidade) - atualizar status geral
        await updateTask(taskId, { status: newStatus })
        console.log(`✅ Status geral atualizado para ${newStatus}`)
      }
      
      await loadData()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status da tarefa')
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Tem certeza que deseja deletar esta tarefa?')) return
    
    try {
      await deleteTask(taskId)
      await loadData()
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error)
      alert('Erro ao deletar tarefa')
    }
  }

  // Função para abrir sidebar de comentários
  const openCommentsSidebar = (task) => {
    // Adaptar estrutura da tarefa para o TaskSidebar
    const adaptedTask = {
      ...task,
      texto: task.title, // TaskSidebar usa 'texto' ao invés de 'title'
      descricao: task.description
    }
    setSelectedTask(adaptedTask)
    setIsCommentsSidebarOpen(true)
  }

  const isOverdue = (dueDate) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  // Estatísticas
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.status !== 'completed' && isOverdue(t.due_date)).length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Minhas Ações</h1>
          <p className="text-sm sm:text-base text-gray-600">Gerencie suas ações e acompanhe o progresso</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* 1. Atrasadas - destaque máximo */}
          <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border-2 transition-all ${
            stats.overdue > 0
              ? 'bg-red-50 border-red-400 shadow-red-100'
              : 'bg-white border-gray-100'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className={`text-xs sm:text-sm font-semibold mb-1 truncate ${stats.overdue > 0 ? 'text-red-700' : 'text-gray-500'}`}>Atrasadas</p>
                <p className={`text-xl sm:text-2xl font-bold ${stats.overdue > 0 ? 'text-red-700' : 'text-gray-400'}`}>{stats.overdue}</p>
              </div>
              <div className={`p-1.5 rounded-lg flex-shrink-0 ${stats.overdue > 0 ? 'bg-red-200' : 'bg-gray-100'}`}>
                <AlertCircle className={`h-5 w-5 sm:h-6 sm:w-6 ${stats.overdue > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              </div>
            </div>
          </div>

          {/* 2. Pendentes */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 mb-1 truncate">Pendentes</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-700">{stats.pending}</p>
              </div>
              <div className="p-1.5 rounded-lg bg-gray-100 flex-shrink-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              </div>
            </div>
          </div>

          {/* 3. Em Andamento */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-blue-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 mb-1 truncate">Em Andamento</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <div className="p-1.5 rounded-lg bg-blue-100 flex-shrink-0">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
            </div>
          </div>

          {/* 4. Concluídas */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-green-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 mb-1 truncate">Concluídas</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="p-1.5 rounded-lg bg-green-100 flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
            </div>
          </div>

          {/* 5. Total */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 mb-1 truncate">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-1.5 rounded-lg bg-gray-100 flex-shrink-0">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 lg:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filtros</h3>
            
            {/* Toggle View Mode */}
            <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 sm:flex-none px-2 sm:px-3 py-1.5 rounded-md transition-all flex items-center justify-center gap-1 sm:gap-2 min-h-[40px] touch-manipulation ${
                  viewMode === 'list' 
                    ? 'bg-white text-[#EBA500] shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="h-4 w-4" />
                <span className="text-xs sm:text-sm font-medium">Lista</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 sm:flex-none px-2 sm:px-3 py-1.5 rounded-md transition-all flex items-center justify-center gap-1 sm:gap-2 min-h-[40px] touch-manipulation ${
                  viewMode === 'grid' 
                    ? 'bg-white text-[#EBA500] shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3x3 className="h-4 w-4" />
                <span className="text-xs sm:text-sm font-medium">Grade</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Busca */}
            <div className="relative sm:col-span-2 md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar tarefas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 min-h-[44px] text-sm sm:text-base rounded-xl border border-gray-200 focus:outline-none focus:border-[#EBA500] transition-colors touch-manipulation"
              />
            </div>

            {/* Filtro de Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 sm:px-4 py-2.5 sm:py-3 min-h-[44px] text-sm sm:text-base rounded-xl border border-gray-200 focus:outline-none focus:border-[#EBA500] transition-colors bg-white touch-manipulation"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="in_progress">Em Andamento</option>
              <option value="completed">Concluída</option>
              <option value="cancelled">Cancelada</option>
            </select>

            {/* Filtro de Prioridade */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 sm:px-4 py-2.5 sm:py-3 min-h-[44px] text-sm sm:text-base rounded-xl border border-gray-200 focus:outline-none focus:border-[#EBA500] transition-colors bg-white touch-manipulation"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="1">Crítica</option>
              <option value="2">Alta</option>
              <option value="3">Média</option>
              <option value="4">Baixa</option>
              <option value="5">Muito Baixa</option>
            </select>
          </div>
        </div>

        {/* Lista de Tarefas */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500] mx-auto"></div>
            <p className="text-gray-600 mt-4">Carregando tarefas...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 lg:p-12 text-center">
            <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <p className="text-gray-600 text-base sm:text-lg">Nenhuma tarefa encontrada</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-2">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Tente ajustar os filtros'
                : 'Você não tem tarefas atribuídas no momento'}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          // VISUALIZAÇÃO EM LISTA
          <div className="space-y-3 sm:space-y-4">
            {filteredTasks.map(task => {
              const StatusIcon = getStatusIcon(task.status)
              const overdue = isOverdue(task.due_date)

              return (
                <div
                  key={task.id}
                  className={`rounded-xl sm:rounded-2xl shadow-sm border-2 transition-all hover:shadow-md ${
                    overdue && task.status !== 'completed'
                      ? 'bg-red-50 border-red-300'
                      : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="p-4 sm:p-5 lg:p-6">
                    <div className="flex flex-col lg:flex-row items-start justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words flex-1 min-w-0">{task.title}</h3>
                          {overdue && task.status !== 'completed' && (
                            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 bg-red-100 text-red-600 text-[10px] sm:text-xs font-bold rounded-lg border-2 border-red-300 animate-pulse flex-shrink-0">
                              <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              EM ATRASO
                            </div>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 break-words">{task.description}</p>
                        )}
                        
                        {/* Informações adicionais */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                          {task.creator?.name && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                              <UserCircle className="h-3.5 w-3.5" />
                              <span className="text-xs font-medium">Criado por: {task.creator.name}</span>
                            </div>
                          )}
                          {task.journey?.name && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
                              <MapPin className="h-3.5 w-3.5" />
                              <span className="text-xs font-medium">{task.journey.name}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Status */}
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${getStatusColor(task.status)}`}>
                            <StatusIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">{getStatusLabel(task.status)}</span>
                          </div>

                          {/* Prioridade */}
                          <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getPriorityColor(task.priority)}`}>
                            {getPriorityLabel(task.priority)}
                          </div>

                          {/* Data Limite */}
                          {task.due_date && (
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                              overdue && task.status !== 'completed' 
                                ? 'bg-red-100 text-red-700 border-2 border-red-300 font-semibold' 
                                : 'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}>
                              <Calendar className="h-4 w-4" />
                              <span className="text-sm">{formatDate(task.due_date)}</span>
                              {overdue && task.status !== 'completed' && (
                                <AlertCircle className="h-3.5 w-3.5" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto lg:ml-4">
                        {/* Botão primário: Concluir / Começar */}
                        {(() => {
                          let myStatus = task.status
                          if (task.assignees && task.assignees.length > 0) {
                            const myAssignee = task.assignees.find(a => a.userId === profile?.id)
                            if (myAssignee) {
                              myStatus = myAssignee.hasCompleted ? 'completed' : 'in_progress'
                            }
                          }
                          if (myStatus === 'pending') {
                            return (
                              <button
                                onClick={() => handleStatusChange(task.id, 'in_progress')}
                                className="flex-1 sm:flex-none px-4 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md touch-manipulation"
                              >
                                <Clock className="h-4 w-4" />
                                <span className="text-sm">Começar</span>
                              </button>
                            )
                          } else if (myStatus === 'in_progress') {
                            return (
                              <button
                                onClick={() => handleStatusChange(task.id, 'completed')}
                                className="flex-1 sm:flex-none px-4 py-2 min-h-[44px] bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md touch-manipulation"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-sm">Concluir</span>
                              </button>
                            )
                          } else {
                            return (
                              <div className="flex-1 sm:flex-none px-4 py-2 min-h-[44px] bg-green-50 text-green-700 border border-green-200 rounded-lg font-semibold flex items-center justify-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-sm">Concluída</span>
                              </div>
                            )
                          }
                        })()}

                        {/* Botão secundário: Comentários (outline) */}
                        <button
                          onClick={() => openCommentsSidebar(task)}
                          className="flex-1 sm:flex-none px-3 sm:px-4 py-2 min-h-[44px] border border-[#EBA500] text-[#EBA500] hover:bg-[#EBA500]/10 active:scale-95 rounded-lg font-medium transition-all flex items-center justify-center gap-2 touch-manipulation"
                          title="Ver comentários"
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-sm">Comentários</span>
                        </button>

                        {/* Lixeira: ícone ghost */}
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2.5 min-h-[44px] min-w-[44px] text-gray-400 hover:text-red-600 hover:bg-red-50 active:scale-95 rounded-lg transition-all flex items-center justify-center touch-manipulation"
                          title="Excluir ação"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          // VISUALIZAÇÃO EM GRID
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {filteredTasks.map(task => {
              const StatusIcon = getStatusIcon(task.status)
              const overdue = isOverdue(task.due_date)

              return (
                <div
                  key={task.id}
                  className={`rounded-2xl shadow-sm border-2 transition-all hover:shadow-lg hover:scale-[1.02] ${
                    overdue && task.status !== 'completed'
                      ? 'bg-red-50 border-red-300'
                      : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="p-5">
                    {/* Header do Card */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2.5 rounded-xl ${getStatusColor(task.status).replace('border', 'border-2')}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      
                      {overdue && task.status !== 'completed' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-lg border-2 border-red-300 animate-pulse">
                          <AlertCircle className="h-3.5 w-3.5" />
                          EM ATRASO
                        </div>
                      )}
                    </div>

                    {/* Título */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                      {task.title}
                    </h3>

                    {/* Descrição */}
                    {task.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3 min-h-[3.75rem]">
                        {task.description}
                      </p>
                    )}

                    {/* Informações adicionais */}
                    <div className="space-y-1.5 mb-3">
                      {task.creator?.name && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                          <UserCircle className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="text-xs font-medium truncate">Criado por: {task.creator.name}</span>
                        </div>
                      )}
                      {task.journey?.name && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="text-xs font-medium truncate">{task.journey.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="space-y-2 mb-4">
                      {/* Status */}
                      <div className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border ${getStatusColor(task.status)}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="text-sm font-semibold">{getStatusLabel(task.status)}</span>
                      </div>

                      {/* Prioridade */}
                      <div className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-bold ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </div>

                      {/* Data Limite */}
                      {task.due_date && (
                        <div className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg ${
                          overdue && task.status !== 'completed'
                            ? 'bg-red-100 text-red-700 border-2 border-red-300 font-bold animate-pulse' 
                            : 'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}>
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm font-medium">{formatDate(task.due_date)}</span>
                          {overdue && task.status !== 'completed' && (
                            <AlertCircle className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                      {/* Primário: Concluir / Começar */}
                      {task.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(task.id, 'in_progress')}
                          className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                        >
                          <Clock className="h-4 w-4" />
                          Começar
                        </button>
                      )}
                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => handleStatusChange(task.id, 'completed')}
                          className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Concluir
                        </button>
                      )}
                      {task.status === 'completed' && (
                        <div className="w-full px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-lg font-semibold flex items-center justify-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Concluída
                        </div>
                      )}

                      {/* Secundário: Comentários (outline) */}
                      <button
                        onClick={() => openCommentsSidebar(task)}
                        className="w-full px-4 py-2.5 border border-[#EBA500] text-[#EBA500] hover:bg-[#EBA500]/10 active:scale-95 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Comentários
                      </button>

                      {/* Lixeira: ghost pequeno */}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="w-full py-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 active:scale-95 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-medium"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sidebar de Comentários */}
      <TaskSidebar
        task={selectedTask}
        isOpen={isCommentsSidebarOpen}
        onClose={() => {
          setIsCommentsSidebarOpen(false)
          setSelectedTask(null)
        }}
      />
    </div>
  )
}
