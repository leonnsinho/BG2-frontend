import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Sparkles,
  Building2,
  CheckSquare,
  Users,
  MessageCircle,
  ArrowRight,
  Play,
  BarChart3
} from 'lucide-react'

export const UserDashboard = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0 })
  const [activeStep, setActiveStep] = useState(0)

  // Log para debug do profile
  useEffect(() => {
    console.log('👤 Profile carregado no UserDashboard:', {
      id: profile?.id,
      email: profile?.email,
      role: profile?.role,
      user_companies: profile?.user_companies,
      user_companies_length: profile?.user_companies?.length
    })
  }, [profile])

  // Função para obter saudação dinâmica
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  // Carregar nome da empresa do usuário através de user_companies
  useEffect(() => {
    const loadCompanyName = async () => {
      if (profile?.id) {
        try {
          const { data, error } = await supabase
            .from('user_companies')
            .select('companies(name)')
            .eq('user_id', profile.id)
            .eq('is_active', true)
            .limit(1)

          if (error) throw error
          if (data && data.length > 0 && data[0].companies) {
            setCompanyName(data[0].companies.name)
          }
        } catch (error) {
          console.error('Erro ao carregar empresa:', error)
        }
      }
    }

    loadCompanyName()
  }, [profile?.id])

  // Carregar estatísticas de tarefas
  useEffect(() => {
    const loadTaskStats = async () => {
      if (!profile?.id) return

      try {
        // Buscar estatísticas das tarefas do usuário
        const { data: tasks, error } = await supabase
          .from('tasks')
          .select('status')
          .eq('assigned_to', profile.id)

        if (error) throw error

        const statsData = {
          pending: tasks.filter(t => t.status === 'pending').length,
          inProgress: tasks.filter(t => t.status === 'in_progress').length,
          completed: tasks.filter(t => t.status === 'completed').length
        }

        setStats(statsData)
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTaskStats()
  }, [profile?.id])

  // Animação automática dos steps
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4)
    }, 4000)
    return () => clearInterval(interval)
  }, [])
            console.error('❌ Erro ao carregar empresa:', error)
            return
          }
          
          console.log('✅ Dados da empresa:', data)
          
          if (data && data.length > 0) {
            setCompanyName(data[0]?.companies?.name || '')
          } else {
            console.log('⚠️ Nenhuma empresa ativa encontrada')
          }
        } catch (error) {
          console.error('❌ Erro completo ao carregar empresa:', error)
        }
      }
    }

    loadCompanyName()
  }, [profile?.id])

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Saudação Dinâmica Melhorada */}
        <div className="mb-10">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <Sparkles className="w-10 h-10 text-[#EBA500]" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#EBA500] rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-[#373435] tracking-tight">
                      {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Usuário'}!
                    </h1>
                    {companyName && (
                      <div className="flex items-center gap-2 mt-2 text-gray-600">
                        <Building2 className="w-4 h-4" />
                        <span className="text-sm font-medium">{companyName}</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-lg text-gray-600 ml-13">
                  Você tem <span className="font-bold text-[#EBA500]">{stats.pending + stats.inProgress}</span> tarefa{stats.pending + stats.inProgress !== 1 ? 's' : ''} {stats.pending + stats.inProgress !== 1 ? 'aguardando' : 'aguardando'} sua atenção.
                </p>
              </div>
              
              {/* Mini estatísticas */}
              <div className="hidden lg:flex items-center gap-4">
                <div className="text-center px-4 py-3 bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-2xl border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
                  <div className="text-xs text-yellow-600 font-medium">Pendentes</div>
                </div>
                <div className="text-center px-4 py-3 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700">{stats.inProgress}</div>
                  <div className="text-xs text-blue-600 font-medium">Em Progresso</div>
                </div>
                <div className="text-center px-4 py-3 bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl border border-green-200">
                  <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
                  <div className="text-xs text-green-600 font-medium">Concluídas</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Jornadas */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#373435] mb-6 flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-[#EBA500] to-[#EBA500]/50 rounded-full" />
            Minhas Jornadas
          </h2>

          {journeys.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
              <div className="text-gray-300 mb-6">
                <Target className="w-20 h-20 mx-auto opacity-50" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-3">
                Nenhuma tarefa atribuída
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Você ainda não possui tarefas atribuídas. Entre em contato com seu gestor para receber suas primeiras atividades.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {journeys.map((journey) => {
                const JourneyIcon = journeyIcons[journey.slug] || Target
                const borderColor = journeyBorderColors[journey.slug] || 'border-gray-200 hover:border-gray-400'
                const iconColor = journeyIconColors[journey.slug] || 'text-gray-600'
                const bgColor = journeyColors[journey.slug] || 'from-gray-500/10 to-gray-600/10'
                
                return (
                  <div
                    key={journey.slug}
                    className={`group cursor-pointer bg-white rounded-3xl border-2 ${borderColor} transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden relative`}
                    onClick={() => setSelectedJourney(selectedJourney === journey.slug ? null : journey.slug)}
                  >
                    {/* Gradiente de fundo sutil */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    
                    <div className="relative p-6">
                      {/* Header do Card */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-3 rounded-2xl bg-gradient-to-br ${bgColor} border-2 ${borderColor} group-hover:scale-110 transition-transform duration-300`}>
                            <JourneyIcon className={`w-7 h-7 ${iconColor}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-[#373435] group-hover:text-[#EBA500] transition-colors duration-300 mb-1">
                              {journey.name}
                            </h3>
                            <p className="text-sm text-gray-500 font-medium">
                              {journey.tasks.length} tarefa{journey.tasks.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-gray-400 group-hover:text-[#EBA500] transition-all duration-300 ${selectedJourney === journey.slug ? 'rotate-90' : ''}`} />
                      </div>

                      {/* Estatísticas */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-2xl p-4 border border-yellow-200 hover:border-yellow-300 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            <div className="text-2xl font-bold text-yellow-700">{journey.pendingCount}</div>
                          </div>
                          <div className="text-xs text-yellow-700 font-semibold">Pendentes</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-4 border border-green-200 hover:border-green-300 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <div className="text-2xl font-bold text-green-700">{journey.completedCount}</div>
                          </div>
                          <div className="text-xs text-green-700 font-semibold">Concluídas</div>
                        </div>
                      </div>

                      {/* Indicador de seleção */}
                      {selectedJourney === journey.slug && (
                        <div className="mt-5 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-sm text-[#EBA500] font-semibold">
                            <div className="w-2 h-2 bg-[#EBA500] rounded-full animate-pulse" />
                            Ver tarefas abaixo
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Lista de Tarefas da Jornada Selecionada */}
        {selectedJourney && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-1 h-10 bg-gradient-to-b from-[#EBA500] to-[#EBA500]/50 rounded-full" />
              <div className="flex items-center gap-3">
                {(() => {
                  const JourneyIcon = journeyIcons[selectedJourney] || Target
                  const iconColor = journeyIconColors[selectedJourney] || 'text-gray-600'
                  return (
                    <>
                      <div className={`p-2 rounded-xl ${journeyColors[selectedJourney]} border-2 ${journeyBorderColors[selectedJourney]}`}>
                        <JourneyIcon className={`w-6 h-6 ${iconColor}`} />
                      </div>
                      <h3 className="text-2xl font-bold text-[#373435]">
                        Tarefas - {journeys.find(j => j.slug === selectedJourney)?.name}
                      </h3>
                    </>
                  )
                })()}
              </div>
            </div>
            
            <div className="space-y-4">
              {filteredTasks.map((task) => {
                const statusBadge = getStatusBadge(task.status)
                const StatusIcon = statusBadge.icon
                
                return (
                  <div 
                    key={task.id} 
                    className="bg-white rounded-3xl p-6 border-2 border-gray-100 hover:border-[#EBA500]/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="flex flex-col gap-4">
                      {/* Header da Tarefa */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <h4 className="text-lg font-bold text-[#373435]">
                              {task.title}
                            </h4>
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${statusBadge.color} border-2 ${task.status === 'completed' ? 'border-green-200' : task.status === 'in_progress' ? 'border-blue-200' : 'border-gray-200'}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {statusBadge.label}
                            </span>
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center gap-5 text-sm text-gray-500">
                            {task.process && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-200">
                                <Target className="w-4 h-4 text-gray-600" />
                                <span className="font-medium">{task.process.name}</span>
                              </div>
                            )}
                            {task.due_date && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-xl border border-orange-200">
                                <Clock className="w-4 h-4 text-orange-600" />
                                <span className="font-medium text-orange-700">
                                  {new Date(task.due_date).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'short'
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Ações da Tarefa */}
                      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                        {/* Seletor de Status */}
                        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2 border border-gray-200">
                          <span className="text-sm font-semibold text-gray-700">Status:</span>
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            className="text-sm font-medium border-0 bg-transparent focus:outline-none focus:ring-0 text-gray-700 cursor-pointer"
                          >
                            <option value="pending">Pendente</option>
                            <option value="in_progress">Em Progresso</option>
                            <option value="completed">Concluída</option>
                          </select>
                        </div>

                        {/* Botão de Comentários */}
                        <button
                          onClick={() => openCommentsSidebar(task)}
                          className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-sm font-semibold"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Comentários
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {filteredTasks.length === 0 && (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-gray-100">
                  <div className="text-gray-300 mb-4">
                    <AlertCircle className="w-16 h-16 mx-auto opacity-50" />
                  </div>
                  <p className="text-gray-600 font-medium">Nenhuma tarefa encontrada nesta jornada.</p>
                </div>
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
