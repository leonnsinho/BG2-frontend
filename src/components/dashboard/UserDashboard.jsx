import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import { Card } from '../ui/Card'
import TaskSidebar from '../planejamento/TaskSidebar'
import { 
  Target, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Sparkles,
  MessageCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

// Ícones das jornadas
const journeyIcons = {
  'estrategica': '🎯',
  'financeira': '💰',
  'pessoas-cultura': '👥',
  'receita-crm': '📊',
  'operacional': '⚙️'
}

const journeyColors = {
  'estrategica': 'from-purple-500 to-purple-600',
  'financeira': 'from-green-500 to-green-600',
  'pessoas-cultura': 'from-pink-500 to-pink-600',
  'receita-crm': 'from-blue-500 to-blue-600',
  'operacional': 'from-orange-500 to-orange-600'
}

export const UserDashboard = () => {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [journeys, setJourneys] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedJourney, setSelectedJourney] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [isCommentsSidebarOpen, setIsCommentsSidebarOpen] = useState(false)

  // Função para obter saudação dinâmica
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  // Carregar tarefas atribuídas ao usuário
  useEffect(() => {
    const loadUserTasks = async () => {
      try {
        setLoading(true)

        // Buscar tarefas atribuídas ao usuário
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select(`
            *,
            journey:journeys(id, name, slug),
            process:processes(name)
          `)
          .eq('assigned_to', profile.id)
          .order('created_at', { ascending: false })

        if (tasksError) throw tasksError

        setTasks(tasksData || [])

        // Agrupar tarefas por jornada
        const journeysMap = {}
        tasksData?.forEach(task => {
          if (task.journey) {
            const slug = task.journey.slug
            if (!journeysMap[slug]) {
              journeysMap[slug] = {
                ...task.journey,
                tasks: [],
                pendingCount: 0,
                completedCount: 0
              }
            }
            journeysMap[slug].tasks.push(task)
            if (task.status === 'completed') {
              journeysMap[slug].completedCount++
            } else {
              journeysMap[slug].pendingCount++
            }
          }
        })

        setJourneys(Object.values(journeysMap))

      } catch (error) {
        console.error('Erro ao carregar tarefas:', error)
      } finally {
        setLoading(false)
      }
    }

    if (profile?.id) {
      loadUserTasks()
    }
  }, [profile?.id])

  // Estatísticas gerais
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  }

  // Tarefas filtradas por jornada selecionada
  const filteredTasks = selectedJourney
    ? tasks.filter(t => t.journey?.slug === selectedJourney)
    : []

  // Função para alterar status da tarefa
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)

      if (error) throw error

      // Atualizar estado local
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ))

      toast.success('Status atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
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

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Pendente', color: 'bg-gray-100 text-gray-700', icon: Clock },
      in_progress: { label: 'Em Progresso', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
      completed: { label: 'Concluída', color: 'bg-green-100 text-green-700', icon: CheckCircle2 }
    }
    return badges[status] || badges.pending
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Saudação Dinâmica */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-8 h-8 text-primary-500" />
            <h1 className="text-4xl font-bold text-[#373435]">
              {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Usuário'}!
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Você tem <span className="font-semibold text-primary-500">{stats.pending + stats.inProgress}</span> tarefa{stats.pending + stats.inProgress !== 1 ? 's' : ''} atribuída{stats.pending + stats.inProgress !== 1 ? 's' : ''} aguardando sua atenção.
          </p>
        </div>

        {/* Cards de Jornadas */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#373435] mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-primary-500" />
            Minhas Jornadas
          </h2>

          {journeys.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Nenhuma tarefa atribuída
              </h3>
              <p className="text-gray-500">
                Você ainda não possui tarefas atribuídas. Entre em contato com seu gestor.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {journeys.map((journey) => (
                <Card
                  key={journey.slug}
                  className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden relative"
                  onClick={() => setSelectedJourney(selectedJourney === journey.slug ? null : journey.slug)}
                >
                  {/* Gradiente de fundo */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${journeyColors[journey.slug] || 'from-gray-500 to-gray-600'} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  <div className="relative p-6">
                    {/* Header do Card */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{journeyIcons[journey.slug] || '📋'}</div>
                        <div>
                          <h3 className="text-lg font-bold text-[#373435] group-hover:text-primary-500 transition-colors">
                            {journey.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {journey.tasks.length} tarefa{journey.tasks.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-all duration-300 ${selectedJourney === journey.slug ? 'rotate-90' : ''}`} />
                    </div>

                    {/* Estatísticas */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <div className="text-2xl font-bold text-yellow-600">{journey.pendingCount}</div>
                        <div className="text-xs text-yellow-700 font-medium">Pendentes</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <div className="text-2xl font-bold text-green-600">{journey.completedCount}</div>
                        <div className="text-xs text-green-700 font-medium">Concluídas</div>
                      </div>
                    </div>

                    {/* Indicador de seleção */}
                    {selectedJourney === journey.slug && (
                      <div className="mt-4 text-sm text-primary-500 font-medium flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                        Ver tarefas abaixo
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Lista de Tarefas da Jornada Selecionada */}
        {selectedJourney && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <h3 className="text-xl font-bold text-[#373435] mb-4 flex items-center gap-2">
              <span className="text-2xl">{journeyIcons[selectedJourney]}</span>
              Tarefas - {journeys.find(j => j.slug === selectedJourney)?.name}
            </h3>
            
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const statusBadge = getStatusBadge(task.status)
                const StatusIcon = statusBadge.icon
                
                return (
                  <Card key={task.id} className="p-5 hover:shadow-lg transition-all duration-200">
                    <div className="flex flex-col gap-4">
                      {/* Header da Tarefa */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h4 className="text-lg font-semibold text-[#373435]">
                              {task.title}
                            </h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusBadge.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusBadge.label}
                            </span>
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-gray-600 mb-3">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {task.process && (
                              <span className="flex items-center gap-1">
                                <Target className="w-4 h-4" />
                                {task.process.name}
                              </span>
                            )}
                            {task.due_date && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {new Date(task.due_date).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Ações da Tarefa */}
                      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
                        {/* Seletor de Status */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">Status:</span>
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                          >
                            <option value="pending">Pendente</option>
                            <option value="in_progress">Em Progresso</option>
                            <option value="completed">Concluída</option>
                          </select>
                        </div>

                        {/* Botão de Comentários */}
                        <button
                          onClick={() => openCommentsSidebar(task)}
                          className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Comentários
                        </button>
                      </div>
                    </div>
                  </Card>
                )
              })}

              {filteredTasks.length === 0 && (
                <Card className="p-8 text-center">
                  <p className="text-gray-500">Nenhuma tarefa encontrada nesta jornada.</p>
                </Card>
              )}
            </div>
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
