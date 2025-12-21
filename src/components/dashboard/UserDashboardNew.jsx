import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import { 
  CheckCircle2, 
  Clock, 
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
  const [companyLogo, setCompanyLogo] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0 })
  const [activeStep, setActiveStep] = useState(0)
  const [avatarUrl, setAvatarUrl] = useState('')

  // Carregar foto de perfil
  useEffect(() => {
    const loadAvatar = async () => {
      if (profile?.avatar_url) {
        try {
          // Criar URL assinada do bucket profile-avatars
          const { data, error } = await supabase.storage
            .from('profile-avatars')
            .createSignedUrl(profile.avatar_url, 3600) // 1 hora

          if (error) {
            console.error('Erro ao carregar avatar:', error)
            return
          }

          if (data?.signedUrl) {
            setAvatarUrl(data.signedUrl)
          }
        } catch (error) {
          console.error('Erro ao processar avatar:', error)
        }
      }
    }

    loadAvatar()
  }, [profile?.avatar_url])

  // Carregar nome da empresa
  useEffect(() => {
    const loadCompanyName = async () => {
      if (profile?.id) {
        try {
          const { data, error } = await supabase
            .from('user_companies')
            .select('companies(name, logo_url)')
            .eq('user_id', profile.id)
            .eq('is_active', true)
            .limit(1)

          if (error) throw error
          if (data && data.length > 0 && data[0].companies) {
            const company = data[0].companies
            console.log('Dados da empresa:', company)
            setCompanyName(company.name)
            
            // Carregar logo se existir
            if (company.logo_url) {
              console.log('Logo URL encontrada:', company.logo_url)
              try {
                const { data: logoData, error: logoError } = await supabase.storage
                  .from('company-avatars')
                  .createSignedUrl(company.logo_url, 3600)

                console.log('Resultado do signed URL:', { logoData, logoError })
                if (!logoError && logoData?.signedUrl) {
                  setCompanyLogo(logoData.signedUrl)
                  console.log('Logo carregada com sucesso:', logoData.signedUrl)
                } else {
                  console.error('Erro ao criar signed URL:', logoError)
                }
              } catch (logoError) {
                console.error('Erro ao carregar logo:', logoError)
              }
            } else {
              console.log('Empresa não possui logo_url configurada')
            }
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
        // Buscar tarefas onde o usuário é assignee
        const { data: taskAssignees, error } = await supabase
          .from('task_assignees')
          .select('task_id, has_completed')
          .eq('user_id', profile.id)

        if (error) throw error

        if (taskAssignees && taskAssignees.length > 0) {
          const taskIds = taskAssignees.map(ta => ta.task_id)
          
          const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('status')
            .in('id', taskIds)

          if (tasksError) throw tasksError

          const statsData = {
            pending: tasks.filter(t => t.status === 'pending').length,
            inProgress: tasks.filter(t => t.status === 'in_progress').length,
            completed: taskAssignees.filter(ta => ta.has_completed).length
          }

          setStats(statsData)
        }
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

  // Função para obter saudação dinâmica
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  // Steps do tutorial interativo
  const tutorialSteps = [
    {
      icon: CheckSquare,
      title: 'Acesse suas Tarefas',
      description: 'Clique em "Minhas Tarefas" no menu lateral para ver todas as atividades atribuídas a você',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100/50',
      borderColor: 'border-blue-200'
    },
    {
      icon: Play,
      title: 'Comece a Trabalhar',
      description: 'Inicie uma tarefa clicando em "Começar Tarefa" para mudar seu status para "Em Progresso"',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100/50',
      borderColor: 'border-purple-200'
    },
    {
      icon: MessageCircle,
      title: 'Colabore com a Equipe',
      description: 'Use o botão "Comentários" para tirar dúvidas ou compartilhar atualizações sobre a tarefa',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'from-pink-50 to-pink-100/50',
      borderColor: 'border-pink-200'
    },
    {
      icon: CheckCircle2,
      title: 'Conclua suas Atividades',
      description: 'Quando terminar, marque como "Concluída" e veja seu progresso aumentar!',
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100/50',
      borderColor: 'border-green-200'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Saudação Dinâmica */}
        <div className="mb-6 sm:mb-10">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex flex-col gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                  {/* Foto de perfil */}
                  {avatarUrl && (
                    <div className="relative flex-shrink-0">
                      <img 
                        src={avatarUrl} 
                        alt={profile?.full_name || 'Usuário'}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-[#EBA500]"
                        onError={(e) => {
                          // Se a imagem não carregar, esconder o elemento
                          e.target.parentElement.style.display = 'none'
                        }}
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#373435] tracking-tight">
                      {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Usuário'}!
                    </h1>
                    {companyName && (
                      <div className="flex items-center gap-2 mt-1 sm:mt-2 text-gray-600">
                        {companyLogo ? (
                          <img 
                            src={companyLogo} 
                            alt={companyName}
                            className="w-4 h-4 sm:w-5 sm:h-5 object-contain rounded"
                            onError={(e) => {
                              // Se falhar, mostrar ícone de prédio
                              e.target.style.display = 'none'
                            }}
                          />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        )}
                        <span className="text-xs sm:text-sm font-medium">{companyName}</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-base sm:text-lg text-gray-600">
                  {stats.pending + stats.inProgress > 0 ? (
                    <>
                      Você tem <span className="font-bold text-[#EBA500]">{stats.pending + stats.inProgress}</span> tarefa{stats.pending + stats.inProgress !== 1 ? 's' : ''} aguardando sua atenção.
                    </>
                  ) : (
                    <span>Tudo em dia! Ótimo trabalho! 🎉</span>
                  )}
                </p>
              </div>
              
              {/* Mini estatísticas - Responsivo */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full">
                <div className="text-center px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl sm:rounded-2xl border-2 border-yellow-200 hover:scale-105 transition-transform duration-300">
                  <div className="text-2xl sm:text-3xl font-bold text-yellow-700">{stats.pending}</div>
                  <div className="text-[10px] sm:text-xs text-yellow-600 font-medium">Pendentes</div>
                </div>
                <div className="text-center px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl sm:rounded-2xl border-2 border-blue-200 hover:scale-105 transition-transform duration-300">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-700">{stats.inProgress}</div>
                  <div className="text-[10px] sm:text-xs text-blue-600 font-medium">Em Progresso</div>
                </div>
                <div className="text-center px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl sm:rounded-2xl border-2 border-green-200 hover:scale-105 transition-transform duration-300">
                  <div className="text-2xl sm:text-3xl font-bold text-green-700">{stats.completed}</div>
                  <div className="text-[10px] sm:text-xs text-green-600 font-medium">Concluídas</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Como Funciona - Tutorial Interativo */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-[#EBA500] to-[#EBA500]/50 rounded-full" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#373435]">
              Como Gerenciar suas Tarefas
            </h2>
          </div>

          {/* Grid de Steps - Responsivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {tutorialSteps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = activeStep === index
              
              return (
                <div
                  key={index}
                  onClick={() => setActiveStep(index)}
                  className={`
                    group cursor-pointer bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 
                    transition-all duration-500 active:scale-95 sm:hover:-translate-y-2
                    ${isActive 
                      ? `${step.borderColor} shadow-2xl sm:scale-105` 
                      : 'border-gray-100 hover:border-gray-300 shadow-sm hover:shadow-xl'
                    }
                  `}
                >
                  {/* Número do Step */}
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className={`
                      w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center 
                      bg-gradient-to-br ${step.bgColor} border-2 ${step.borderColor}
                      ${isActive ? 'scale-110' : 'group-hover:scale-110'}
                      transition-transform duration-300
                    `}>
                      <span className={`text-base sm:text-lg font-bold bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                        {index + 1}
                      </span>
                    </div>
                    <div className={`
                      p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br ${step.bgColor} border-2 ${step.borderColor}
                      ${isActive ? 'scale-110 rotate-12' : 'group-hover:scale-110 group-hover:rotate-6'}
                      transition-all duration-300
                    `}>
                      <StepIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#EBA500' }} />
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <h3 className={`
                    text-base sm:text-lg font-bold mb-1.5 sm:mb-2 transition-colors duration-300
                    ${isActive ? 'text-[#EBA500]' : 'text-[#373435] group-hover:text-[#EBA500]'}
                  `}>
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Indicador de ativo */}
                  {isActive && (
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-[#EBA500] font-semibold">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#EBA500] rounded-full animate-pulse" />
                        Passo Ativo
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Controles de navegação */}
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {tutorialSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={`
                  h-1.5 sm:h-2 rounded-full transition-all duration-300
                  ${activeStep === index 
                    ? 'w-8 sm:w-12 bg-[#EBA500]' 
                    : 'w-1.5 sm:w-2 bg-gray-300 hover:bg-gray-400'
                  }
                `}
              />
            ))}
          </div>
        </div>

        {/* Call to Action - Ir para Tarefas - Responsivo */}
        <div className="bg-gradient-to-br from-[#EBA500] to-[#EBA500]/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-[#EBA500]/20 hover:shadow-3xl transition-all duration-300 group">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
              <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <CheckSquare className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <div className="flex-1 sm:flex-initial">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
                  Pronto para Começar?
                </h3>
                <p className="text-white/90 text-sm sm:text-lg">
                  Acesse a página de tarefas e comece a trabalhar nas suas atividades
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/tarefas')}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-[#EBA500] rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 group/btn active:scale-95"
            >
              Ver Minhas Tarefas
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover/btn:translate-x-2 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Dicas Rápidas - Responsivo */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-blue-100 hover:border-blue-300 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-2 sm:mb-3">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
              <h4 className="font-bold text-sm sm:text-base text-gray-800">Trabalho em Equipe</h4>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              Algumas tarefas podem ter múltiplos responsáveis. Todos devem confirmar a conclusão!
            </p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-green-100 hover:border-green-300 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-2 sm:mb-3">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
              <h4 className="font-bold text-sm sm:text-base text-gray-800">Acompanhe seu Progresso</h4>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              Veja quantas tarefas você completou e quanto ainda falta fazer
            </p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-purple-100 hover:border-purple-300 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-2 sm:mb-3">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 flex-shrink-0" />
              <h4 className="font-bold text-sm sm:text-base text-gray-800">Fique Atento aos Prazos</h4>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              Verifique as datas de vencimento e priorize tarefas mais urgentes
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
