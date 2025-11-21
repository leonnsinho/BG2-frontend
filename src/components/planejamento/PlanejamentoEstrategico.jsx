import React, { useState, useEffect } from 'react'
import { Plus, User, Clock, CheckCircle2, AlertTriangle, Calendar, Edit3, Trash2, Save, X, Target, DollarSign, Users, TrendingUp, Settings, Sparkles, Lock, CheckCircle, XCircle, Loader, Award, RotateCcw, FileSearch } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions as useAuthPermissions } from '../../hooks/useAuth'
import { usePriorityProcesses } from '../../hooks/usePriorityProcesses2'
import { useTasks } from '../../hooks/useTasks'
import { supabase } from '../../services/supabase'
import TaskSidebar from './TaskSidebar'
import ProcessProgressBar from '../process/ProcessProgressBar'
import MaturityConfirmationModal from '../process/MaturityConfirmationModal'
import SuperAdminBanner from '../SuperAdminBanner'
import DraggableProcessList from './DraggableProcessList'
import toast from 'react-hot-toast'
import { calculateProcessProgress } from '../../services/processMaturityService'
import { useSearchParams } from 'react-router-dom' // 🔥 NOVO: Para ler query params

const PlanejamentoEstrategico = () => {
  const { profile } = useAuth()
  const { getAccessibleJourneys } = useAuthPermissions()
  const [searchParams] = useSearchParams() // 🔥 NOVO: Hook para ler URL
  
  // 🔥 NOVO: Verificar se há companyId na URL (Super Admin) ou usar do perfil
  const urlCompanyId = searchParams.get('companyId')
  const companyId = urlCompanyId || profile?.user_companies?.[0]?.company_id || null
  
  // 🔥 NOVO: Passar urlCompanyId para os hooks (tem prioridade sobre profile)
  const { priorityProcesses, loading: processesLoading, error: processesError, getProcessesByJourney, refetch, debugLogs } = usePriorityProcesses(urlCompanyId)
  const { getTasks, getCompanyUsers, createTask, updateTask, deleteTask, loading: tasksLoading } = useTasks(urlCompanyId)
  
  // Debug: log do companyId
  useEffect(() => {
    console.log('🏢 Company ID extraído:', companyId)
    console.log('🔗 URL Company ID:', urlCompanyId)
    console.log('👤 Profile Company ID:', profile?.user_companies?.[0]?.company_id)
    console.log('👤 Profile completo:', profile)
  }, [companyId, urlCompanyId, profile?.id])
  
  const [jornadas, setJornadas] = useState([])
  const [jornadaSelecionada, setJornadaSelecionada] = useState(null)
  const [jornadaUUID, setJornadaUUID] = useState(null) // 🔥 NOVO: UUID real da jornada do banco
  const [processos, setProcessos] = useState([])
  const [tarefas, setTarefas] = useState({})
  const [usuarios, setUsuarios] = useState([]) // Para mapear UUID -> nome
  const [editandoTarefa, setEditandoTarefa] = useState({ id: null, texto: '', responsavel: '', dataLimite: '' })
  const [tipoResponsavelEdicao, setTipoResponsavelEdicao] = useState('usuario') // Para edição: 'usuario' ou 'manual'
  const [adicionandoTarefa, setAdicionandoTarefa] = useState({ processoId: null, titulo: '', descricao: '', responsavel: '', dataLimite: '', status: 'pending' })
  const [tipoResponsavel, setTipoResponsavel] = useState('usuario') // 'usuario' ou 'manual'
  const [responsavelManual, setResponsavelManual] = useState('') // Para responsáveis não cadastrados
  const [sidebarTask, setSidebarTask] = useState({ isOpen: false, task: null })
  const [jornadasAtribuidas, setJornadasAtribuidas] = useState([])
  const [loading, setLoading] = useState(true)
  const [editandoMeta, setEditandoMeta] = useState(null) // ID do processo cuja meta está sendo editada
  const [metas, setMetas] = useState({}) // Armazena metas por processo: { processoId: "texto da meta" }
  
  // Estados do sistema de amadurecimento
  const [processProgressMap, setProcessProgressMap] = useState({}) // Map de processo.id -> { total, completed, percentage }
  const [maturityModalOpen, setMaturityModalOpen] = useState(false)
  const [selectedProcessForMaturity, setSelectedProcessForMaturity] = useState(null)
  const [progressRefreshTrigger, setProgressRefreshTrigger] = useState(0) // 🔥 NOVO: Trigger para forçar refresh

  // Adicionar CSS customizado para scrollbar
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(235, 165, 0, 0.1);
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(to bottom, #EBA500, rgba(235, 165, 0, 0.8));
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(to bottom, rgba(235, 165, 0, 0.8), #EBA500);
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Mock das 5 jornadas com slugs corretos - mapeando para IDs do banco
  const jornadasMock = [
    { id: 1, nome: 'Estratégica', slug: 'estrategica', cor: 'bg-blue-500', corTexto: 'text-blue-700' },
    { id: 2, nome: 'Financeira', slug: 'financeira', cor: 'bg-green-500', corTexto: 'text-green-700' },
    { id: 3, nome: 'Pessoas & Cultura', slug: 'pessoas-cultura', cor: 'bg-purple-500', corTexto: 'text-purple-700' },
    { id: 4, nome: 'Receita', slug: 'receita-crm', cor: 'bg-orange-500', corTexto: 'text-orange-700' },
    { id: 5, nome: 'Operacional', slug: 'operacional', cor: 'bg-red-500', corTexto: 'text-red-700' }
  ]

  // Função para buscar jornadas reais do banco
  const getJourneyUUIDBySlug = async (slug) => {
    try {
      console.log('🔍 Buscando UUID da jornada:', slug)
      
      const { data, error } = await supabase
        .from('journeys')
        .select('id, name, slug')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('❌ Erro ao buscar jornada:', error)
        return null
      }

      console.log('✅ Jornada encontrada:', data)
      return data.id // Retornar apenas o UUID
    } catch (error) {
      console.error('❌ Erro ao buscar jornada:', error)
      return null
    }
  }

  // Debug do estado dos processos
  useEffect(() => {
    if (processesError) {
      console.error('❌ Erro ao carregar processos:', processesError)
    }
    
    if (!processesLoading && priorityProcesses) {
      const totalProcesses = Object.values(priorityProcesses).reduce((acc, processes) => acc + processes.length, 0)
      console.log(`✅ Processos prioritários carregados: ${totalProcesses} no total`)
      
      Object.entries(priorityProcesses).forEach(([journeyId, processes]) => {
        if (processes.length > 0) {
          console.log(`📋 Jornada ${journeyId}: ${processes.length} processos (${processes.map(p => p.nome).join(', ')})`)
        }
      })
    }
    
    if (processesLoading) {
      console.log('🔍 Carregando processos prioritários da base de dados...')
    }
  }, [processesLoading, priorityProcesses, processesError])

  useEffect(() => {
  const loadData = async () => {
      console.log('🚀 Carregando jornadas para:', profile?.email)
      console.log('👤 Role Global:', profile?.role)
      console.log('🏢 User Companies:', profile?.user_companies)
      setLoading(true)
      setJornadas(jornadasMock)
      
      // Aguardar até que getAccessibleJourneys esteja disponível
      if (!getAccessibleJourneys) {
        console.warn('⏳ getAccessibleJourneys ainda não disponível')
        setLoading(false)
        return
      }
      
      // Verificar se é Company Admin (pode estar em user_companies)
      const isCompanyAdmin = profile?.role === 'company_admin' || 
                            profile?.user_companies?.some(uc => uc.is_active && uc.role === 'company_admin')
      
      // Se for Super Admin ou Company Admin, dar acesso a todas as jornadas
      if (profile?.role === 'super_admin' || isCompanyAdmin) {
        console.log(`👑 ${profile?.role === 'super_admin' ? 'Super Admin' : 'Company Admin'} - liberando todas as jornadas`)
        const todasJornadas = ['estrategica', 'financeira', 'pessoas-cultura', 'receita-crm', 'operacional']
        setJornadasAtribuidas(todasJornadas)
        console.log(`✅ Todas as jornadas liberadas: ${todasJornadas.join(', ')}`)
        setLoading(false)
        return
      }
      
      // Buscar jornadas atribuídas ao usuário (apenas para gestores)
      try {
        const assignedJourneySlugs = await getAccessibleJourneys()
        console.log('✅ Jornadas atribuídas:', assignedJourneySlugs)
        console.log(`✅ Jornadas atribuídas ao usuário: ${assignedJourneySlugs?.join(', ') || 'nenhuma'}`)
        setJornadasAtribuidas(assignedJourneySlugs || [])
        
      } catch (error) {
        console.error('❌ Erro ao buscar jornadas:', error)
        console.error(`❌ Erro ao buscar jornadas: ${error.message}`)
        setJornadasAtribuidas([])
      }

      // Carregar tarefas do localStorage se existirem
      const tarefasSalvas = localStorage.getItem('tarefas_planejamento')
      if (tarefasSalvas) {
        setTarefas(JSON.parse(tarefasSalvas))
      }
      
      setLoading(false)
    }

    if (profile?.email) {
      loadData()
    }
  }, [profile?.role, profile?.user_companies]) // Adicionar user_companies como dependência

  // Função para carregar tarefas do banco de dados
  const loadTasks = async () => {
    try {
      console.log('🔄 Carregando tarefas...')
      
      const tasks = await getTasks()
      console.log('📦 Tarefas retornadas:', tasks?.length || 0)
      
      // Carregar usuários da empresa para mapear UUIDs para nomes
      const users = await getCompanyUsers()
      setUsuarios(users)
      
      // Organizar tarefas por processo_id
      const tarefasOrganizadas = {}
      
      tasks.forEach(task => {
        
        if (!tarefasOrganizadas[task.process_id]) {
          tarefasOrganizadas[task.process_id] = []
        }
        
        // Determinar nome do responsável
        let nomeResponsavel
        if (task.assigned_to_name) {
          // Se tem assigned_to_name, é um responsável manual
          nomeResponsavel = task.assigned_to_name
          console.log('✅ Responsável manual encontrado:', nomeResponsavel)
        } else if (task.assigned_to) {
          // Se tem assigned_to, buscar o nome do usuário
          const usuario = users.find(u => u.id === task.assigned_to)
          nomeResponsavel = usuario ? usuario.name : 'Usuário não encontrado'
        } else {
          nomeResponsavel = 'Sem responsável'
        }
        
        // Adaptar formato da tarefa para o que o componente espera
        tarefasOrganizadas[task.process_id].push({
          id: task.id,
          texto: task.title,
          responsavel: nomeResponsavel, // Nome do usuário ou nome manual
          responsavelId: task.assigned_to, // UUID para edições (pode ser NULL)
          responsavelManual: task.assigned_to_name, // Nome manual (pode ser NULL)
          status: task.status || 'pending', // Manter valores do banco: pending, in_progress, completed, cancelled
          descricao: task.description,
          dataLimite: task.due_date,
          criadoEm: task.created_at,
          criadoPor: 'Sistema', // Pode ser melhorado depois
          prioridade: task.priority || 3
        })
      })
      
      console.log('✅ Tarefas organizadas por processo:', Object.keys(tarefasOrganizadas).length, 'processos com tarefas')
      setTarefas(tarefasOrganizadas)
      
    } catch (error) {
      console.error('❌ Erro ao carregar tarefas:', error)
    }
  }

  // Carregar tarefas quando uma jornada for selecionada
  useEffect(() => {
    if (jornadaSelecionada) {
      loadTasks()
    }
  }, [jornadaSelecionada])

  // Debug das jornadas quando o estado mudar
  useEffect(() => {
    if (jornadasAtribuidas.length > 0) {
      jornadasMock.forEach(jornada => {
        const isIncluded = jornadasAtribuidas.includes(jornada.slug)
        console.log(`🎯 ${jornada.nome} (${jornada.slug}): ${isIncluded ? '✅ LIBERADA' : '❌ BLOQUEADA'}`)
      })
    }
  }, [jornadasAtribuidas])

  // 🔥 NOVO: Atualizar processos automaticamente quando priorityProcesses mudar
  useEffect(() => {
    if (jornadaSelecionada && priorityProcesses) {
      const processosAtualizados = getProcessesByJourney(jornadaSelecionada.id)
      if (processosAtualizados && processosAtualizados.length > 0) {
        console.log('🔄 Atualizando processos automaticamente:', processosAtualizados.length)
        console.log('📋 IDs dos processos exibidos:', processosAtualizados.map(p => ({ id: p.id, nome: p.nome })))
        setProcessos(processosAtualizados)
      }
    }
  }, [priorityProcesses, jornadaSelecionada])

  const selecionarJornada = async (jornada) => {
    // Só permite selecionar se a jornada estiver atribuída
    if (!isJornadaAtribuida(jornada)) {
      console.warn(`🚫 Jornada ${jornada.slug} não atribuída, bloqueando seleção`)
      return
    }
    
    console.log(`✅ Selecionando jornada ${jornada.nome} (ID: ${jornada.id})`)
    setJornadaSelecionada(jornada)
    
    // 🔥 NOVO: Buscar UUID real da jornada
    const uuid = await getJourneyUUIDBySlug(jornada.slug)
    if (uuid) {
      console.log(`✅ UUID da jornada obtido: ${uuid}`)
      setJornadaUUID(uuid)
    } else {
      console.error('❌ Não foi possível obter UUID da jornada')
      setJornadaUUID(null)
    }
    
    // Buscar processos reais da jornada
    const processosReais = getProcessesByJourney(jornada.id)
    console.log(`🔍 Processos reais encontrados: ${processosReais?.length || 0}`)
    
    if (processosReais && processosReais.length > 0) {
      setProcessos(processosReais)
      console.log(`✅ Usando ${processosReais.length} processos REAIS da base de dados`)
      processosReais.forEach((processo, index) => {
        console.log(`  ${index + 1}. ${processo.nome} (Score: ${processo.priority_score})`)
      })
    } else {
      // Se não houver processos reais, não mostrar nada
      console.log('⚠️ Nenhum processo prioritário encontrado para esta jornada')
      setProcessos([])
    }
  }

  const isJornadaAtribuida = (jornada) => {
    const result = jornadasAtribuidas.includes(jornada.slug)
    return result
  }

  // Debug apenas uma vez quando necessário
  if (process.env.NODE_ENV === 'development') {
    // Log apenas quando há mudanças significativas
  }

  const alterarStatusTarefa = async (processoId, tarefaId, novoStatus) => {
    try {
      console.log('🔄 Alterando status da tarefa:', tarefaId, 'para:', novoStatus)
      
      // Atualizar no banco de dados
      await updateTask(tarefaId, { status: novoStatus })
      
      // Recarregar tarefas para atualizar a interface
      await loadTasks()
      
      // 🔥 NOVO: Recarregar progresso do processo para atualizar a barra
      await reloadProcessProgress(processoId)
      
    } catch (error) {
      console.error('❌ Erro ao alterar status:', error)
      alert('Erro ao alterar status da tarefa')
    }
  }

  const iniciarEdicaoTarefa = (tarefa) => {
    // Determinar se é usuário cadastrado ou nome manual
    if (tarefa.responsavelManual) {
      // É um nome manual
      setTipoResponsavelEdicao('manual')
      setEditandoTarefa({
        id: tarefa.id,
        texto: tarefa.texto,
        responsavel: tarefa.responsavelManual,
        dataLimite: tarefa.dataLimite || ''
      })
    } else {
      // É um usuário cadastrado
      setTipoResponsavelEdicao('usuario')
      setEditandoTarefa({
        id: tarefa.id,
        texto: tarefa.texto,
        responsavel: tarefa.responsavelId || tarefa.responsavel,
        dataLimite: tarefa.dataLimite || ''
      })
    }
  }

  const cancelarEdicao = () => {
    setEditandoTarefa({ id: null, texto: '', responsavel: '', dataLimite: '' })
    setTipoResponsavelEdicao('usuario')
  }

  const salvarEdicaoTarefa = async (processoId) => {
    if (!editandoTarefa.texto.trim() || !editandoTarefa.responsavel) return

    try {
      console.log('💾 Salvando edição da tarefa:', editandoTarefa.id)
      
      // Atualizar no banco de dados com lógica condicional
      const updateData = {
        title: editandoTarefa.texto,
        assigned_to: tipoResponsavelEdicao === 'manual' ? null : editandoTarefa.responsavel,
        assigned_to_name: tipoResponsavelEdicao === 'manual' ? editandoTarefa.responsavel : null,
        due_date: editandoTarefa.dataLimite || null
      }
      
      console.log('📋 Dados da atualização:', updateData)
      
      await updateTask(editandoTarefa.id, updateData)
      
      // Recarregar tarefas e cancelar edição
      await loadTasks()
      
      // 🔥 NOVO: Recarregar progresso após editar tarefa
      await reloadProcessProgress(processoId)
      
      cancelarEdicao()
      
    } catch (error) {
      console.error('❌ Erro ao salvar edição:', error)
      alert('Erro ao salvar edição da tarefa')
    }
  }

  const apagarTarefa = async (processoId, tarefaId) => {
    if (!confirm('Tem certeza que deseja apagar esta tarefa?')) return

    try {
      console.log('🗑️ Apagando tarefa:', tarefaId)
      
      // Deletar do banco de dados
      await deleteTask(tarefaId)
      
      // Recarregar tarefas para atualizar a interface
      await loadTasks()
      
      // 🔥 NOVO: Recarregar progresso após deletar tarefa
      await reloadProcessProgress(processoId)
      
    } catch (error) {
      console.error('❌ Erro ao apagar tarefa:', error)
      alert('Erro ao apagar tarefa')
    }
  }

  // ====== Funções do Sistema de Amadurecimento ======
  // ====== Funções do Sistema de Ordenação Manual ======
  
  const handleProcessReorder = async (newProcessos) => {
    console.log('🔄 Reordenando processos:', newProcessos.map((p, i) => `${i + 1}. ${p.nome}`))
    
    // Atualizar UI imediatamente (optimistic update)
    setProcessos(newProcessos)
    
    try {
      // Salvar nova ordem no banco de dados
      const updates = newProcessos.map((processo, index) => ({
        process_id: processo.id,
        company_id: companyId,
        strategic_priority_order: index + 1 // 1, 2, 3, 4, 5
      }))
      
      console.log('💾 Salvando ordem no banco:', updates)
      
      // Atualizar todos os process_evaluations de uma vez
      for (const update of updates) {
        const { error } = await supabase
          .from('process_evaluations')
          .update({ strategic_priority_order: update.strategic_priority_order })
          .eq('process_id', update.process_id)
          .eq('company_id', update.company_id)
        
        if (error) {
          console.error('❌ Erro ao salvar ordem:', error)
          throw error
        }
      }
      
      console.log('✅ Ordem salva com sucesso!')
      toast.success('✅ Ordem dos processos atualizada!', {
        icon: '📌',
        duration: 2000
      })
      
      // Recarregar processos para confirmar mudança
      if (refetch) {
        refetch()
      }
      
    } catch (error) {
      console.error('❌ Erro ao salvar reordenação:', error)
      toast.error('Erro ao salvar ordem dos processos')
      
      // Reverter UI em caso de erro
      if (jornadaSelecionada) {
        const processosOriginais = getProcessesByJourney(jornadaSelecionada.id)
        setProcessos(processosOriginais)
      }
    }
  }
  
  const handleResetOrder = async () => {
    const confirmacao = window.confirm(
      '🔄 Resetar Ordenação Manual?\n\n' +
      'Isso irá remover a ordenação customizada e voltar para a ordenação automática por priority_score.\n\n' +
      'Deseja continuar?'
    )
    
    if (!confirmacao) return
    
    try {
      console.log('🔄 Resetando ordem manual para jornada:', jornadaSelecionada?.nome)
      
      // Chamar função helper do banco que reseta a ordem
      const { error } = await supabase.rpc('reset_strategic_priority_order', {
        p_company_id: companyId
      })
      
      if (error) {
        console.error('❌ Erro ao resetar ordem:', error)
        throw error
      }
      
      console.log('✅ Ordem resetada com sucesso!')
      toast.success('✅ Ordenação resetada! Usando prioridade automática.', {
        icon: '🔄',
        duration: 3000
      })
      
      // Recarregar processos
      if (refetch) {
        refetch()
      }
      
    } catch (error) {
      console.error('❌ Erro ao resetar ordenação:', error)
      toast.error('Erro ao resetar ordenação')
    }
  }
  
  // ====== Funções do Sistema de Amadurecimento ======
  
  const handleProgressUpdate = (processId, progressData) => {
    console.log(`📊 Progresso atualizado para processo ${processId}:`, progressData)
    setProcessProgressMap(prev => ({
      ...prev,
      [processId]: progressData
    }))
  }

  const handleRequestMaturityApproval = (processo) => {
    const progress = processProgressMap[processo.id]
    
    console.log('🔍 Validando solicitação de amadurecimento:', {
      processo: processo,
      processId: processo.id,
      companyId: companyId,
      journeyUUID: jornadaUUID,
      gestorId: profile?.id,
      progress: progress
    })
    
    // Validar IDs antes de abrir modal
    if (!processo.id) {
      alert('❌ Erro: ID do processo não encontrado')
      return
    }
    
    if (!jornadaUUID) {
      alert('❌ Erro: UUID da jornada não disponível. Tente selecionar a jornada novamente.')
      return
    }
    
    if (!companyId) {
      alert('❌ Erro: ID da empresa não encontrado')
      return
    }
    
    if (progress?.percentage === 100) {
      setSelectedProcessForMaturity(processo)
      setMaturityModalOpen(true)
    } else {
      alert('O processo precisa estar 100% completo para solicitar validação.')
    }
  }

  const handleMaturityApprovalSuccess = () => {
    alert('✅ Solicitação enviada com sucesso! O admin receberá uma notificação.')
    setMaturityModalOpen(false)
    setSelectedProcessForMaturity(null)
    // Recarregar processos para atualizar status
    if (jornadaSelecionada) {
      carregarProcessos(jornadaSelecionada.id)
    }
  }

  // Verificar se usuário é Company Admin
  const isCompanyAdmin = () => {
    return profile?.role === 'company_admin' || 
           profile?.user_companies?.some(uc => uc.is_active && uc.role === 'company_admin')
  }

  // Função para Company Admin confirmar amadurecimento direto (sem passar por solicitação)
  const handleDirectMaturityConfirmation = async (processo) => {
    const progress = processProgressMap[processo.id]

    if (progress?.percentage !== 100) {
      alert('❌ O processo precisa estar 100% completo para confirmar amadurecimento.')
      return
    }

    const confirmacao = window.confirm(
      `🎯 Confirmar Amadurecimento do Processo?\n\n` +
      `Processo: ${processo.nome || processo.name}\n` +
      `Progresso: 100% completo\n\n` +
      `Esta ação irá:\n` +
      `✅ Marcar o processo como AMADURECIDO\n` +
      `✅ Remover da lista de Processos Prioritários\n` +
      `✅ Registrar em Journey Management/Overview\n\n` +
      `Deseja confirmar?`
    )

    if (!confirmacao) return

    try {
      console.log('🎯 Company Admin confirmando amadurecimento direto:', {
        processId: processo.id,
        journeyUUID: jornadaUUID,
        companyId: companyId
      })

      // Validações
      if (!processo.id || !jornadaUUID || !companyId) {
        throw new Error('Dados incompletos para confirmar amadurecimento')
      }

      // Verificar se o progresso está realmente em 100%
      const progressData = await calculateProcessProgress(processo.id, companyId)
      
      if (progressData.percentage !== 100) {
        throw new Error(`Progresso atual: ${progressData.percentage}%. O processo precisa estar 100% completo.`)
      }

      // Atualizar process_evaluations para marcar has_process = true
      const { data: evaluationData, error: evaluationError } = await supabase
        .from('process_evaluations')
        .update({ 
          has_process: true,
          updated_at: new Date().toISOString()
        })
        .eq('process_id', processo.id)
        .eq('company_id', companyId)
        .select()

      if (evaluationError) {
        console.error('❌ Erro ao atualizar process_evaluations:', evaluationError)
        throw new Error('Erro ao registrar amadurecimento: ' + evaluationError.message)
      }

      console.log('✅ Process evaluation atualizada:', evaluationData)

      // 🔥 ATUALIZAR EM TEMPO REAL
      console.log('🔄 Atualizando lista de processos...')
      
      // 1. Remover o processo da lista local imediatamente (feedback visual instantâneo)
      setProcessos(prevProcessos => 
        prevProcessos.filter(p => p.id !== processo.id)
      )

      // 2. Disparar evento para atualizar badges/notificações
      window.dispatchEvent(new CustomEvent('maturity-approval-changed'))

      // 3. Forçar reload completo do hook (useEffect vai atualizar automaticamente)
      if (refetch) {
        refetch()
      }

      alert('✅ Processo amadurecido com sucesso!\n\nO processo foi marcado como amadurecido e removido da lista de processos prioritários.')

    } catch (error) {
      console.error('❌ Erro ao confirmar amadurecimento:', error)
      alert('❌ Erro ao confirmar amadurecimento: ' + error.message)
    }
  }

  // Função para recarregar progresso de um processo específico
  const reloadProcessProgress = async (processId) => {
    if (!processId || !companyId) {
      console.warn('⚠️ ProcessId ou CompanyId não disponível para reload')
      return
    }

    try {
      console.log('🔄 Recarregando progresso do processo:', processId)
      
      // Incrementar o trigger para forçar refresh do componente
      setProgressRefreshTrigger(prev => prev + 1)
      
      const { calculateProcessProgress } = await import('../../services/processMaturityService')
      const progressData = await calculateProcessProgress(processId, companyId)
      
      console.log('✅ Progresso recarregado:', progressData)
      
      // Atualizar o mapa de progresso
      setProcessProgressMap(prev => ({
        ...prev,
        [processId]: progressData
      }))
    } catch (error) {
      console.error('❌ Erro ao recarregar progresso:', error)
    }
  }

  // Funções para adicionar tarefa inline
  const iniciarAdicaoTarefa = (processoId) => {
    console.log('🎯 Iniciando adição de tarefa para processo:', processoId)
    setAdicionandoTarefa({
      processoId,
      titulo: '',
      descricao: '',
      responsavel: '',
      dataLimite: '',
      status: 'pending'
    })
  }

  const cancelarAdicaoTarefa = () => {
    setAdicionandoTarefa({
      processoId: null,
      titulo: '',
      descricao: '',
      responsavel: '',
      dataLimite: '',
      status: 'pending'
    })
    setTipoResponsavel('usuario')
    setResponsavelManual('')
  }

  const salvarNovaTarefa = async () => {
    // Validar campos obrigatórios
    const responsavelFinal = tipoResponsavel === 'manual' ? responsavelManual : adicionandoTarefa.responsavel
    
    if (!adicionandoTarefa.titulo.trim() || !adicionandoTarefa.descricao.trim() || !responsavelFinal) {
      alert('Por favor, preencha todos os campos obrigatórios')
      return
    }

    try {
      console.log('💾 Salvando nova tarefa')
      
      // Buscar UUID da jornada
      const journeyUUID = await getJourneyUUIDBySlug(jornadaSelecionada.slug)
      
      // 🔥 CORREÇÃO: Validar se o processo é REAL (UUID) ou MOCK (número)
      const processUUID = adicionandoTarefa.processoId
      
      console.log('🔍 ProcessoId:', processUUID, 'Type:', typeof processUUID)
      
      // 🚨 BLOQUEIO: Se for número (mock), não permitir criação de tarefa
      if (typeof processUUID === 'number') {
        alert('⚠️ Esta empresa ainda não possui processos criados nesta jornada.\n\nOs processos exibidos são apenas exemplos de demonstração. Para criar tarefas, primeiro é necessário criar processos reais através do sistema de Gestão de Processos.')
        console.error('❌ Tentativa de criar tarefa em processo MOCK (ID numérico):', processUUID)
        return
      }
      
      const taskData = {
        title: adicionandoTarefa.titulo,
        description: adicionandoTarefa.descricao,
        // Se for manual, assigned_to fica NULL e usamos assigned_to_name
        assigned_to: tipoResponsavel === 'manual' ? null : responsavelFinal,
        assigned_to_name: tipoResponsavel === 'manual' ? responsavelFinal : null,
        process_id: processUUID,
        journey_id: journeyUUID,
        status: adicionandoTarefa.status,
        due_date: adicionandoTarefa.dataLimite || null,
        priority: 3
      }
      
      console.log('📋 Dados da tarefa:', taskData)
      
      await createTask(taskData)
      await loadTasks()
      
      // 🔥 NOVO: Recarregar progresso após criar tarefa
      await reloadProcessProgress(adicionandoTarefa.processoId)
      
      cancelarAdicaoTarefa()
      
    } catch (error) {
      console.error('❌ Erro ao salvar nova tarefa:', error)
      alert('Erro ao salvar tarefa: ' + (error.message || 'Erro desconhecido'))
    }
  }

  // Funções para controlar o sidebar de tarefa
  const abrirTaskSidebar = (tarefa) => {
    // 🔥 FIX: Garantir que responsavel e dataLimite estejam mapeados corretamente
    const tarefaFormatada = {
      ...tarefa,
      // Se já tem responsavel e dataLimite no formato esperado, usa eles
      // Senão, pega do fullTask ou dos campos originais
      responsavel: tarefa.responsavel || tarefa.assigned_to_name || 
                   (tarefa.assigned_to ? 'Carregando...' : 'Não atribuído'),
      dataLimite: tarefa.dataLimite || tarefa.due_date
    }
    
    setSidebarTask({
      isOpen: true,
      task: tarefaFormatada
    })
  }

  const fecharTaskSidebar = () => {
    setSidebarTask({
      isOpen: false,
      task: null
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_progress':
      case 'em_andamento': 
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'completed':
      case 'concluido': 
        return 'bg-green-100 text-green-800 border-green-300'
      case 'cancelled':
      case 'atrasado': 
        return 'bg-red-100 text-red-800 border-red-300'
      case 'pending':
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
      case 'pendente':
        return <Clock className="h-3.5 w-3.5" />
      case 'in_progress':
      case 'em_andamento':
        return <Loader className="h-3.5 w-3.5" />
      case 'completed':
      case 'concluido':
        return <CheckCircle className="h-3.5 w-3.5" />
      case 'cancelled':
      case 'atrasado':
        return <XCircle className="h-3.5 w-3.5" />
      default:
        return <AlertTriangle className="h-3.5 w-3.5" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'in_progress':
      case 'em_andamento': 
        return 'Em Andamento'
      case 'completed':
      case 'concluido': 
        return 'Concluído'
      case 'cancelled':
      case 'atrasado': 
        return 'Cancelado'
      case 'pending':
      case 'pendente':
        return 'Pendente'
      default: return 'Indefinido'
    }
  }

  // Funções para gerenciar metas
  const carregarMetas = async () => {
    if (!companyId) return

    try {
      const { data, error } = await supabase
        .from('process_goals')
        .select('process_id, goal_text')
        .eq('company_id', companyId)

      if (error) throw error

      const metasObj = {}
      data?.forEach(item => {
        metasObj[item.process_id] = item.goal_text
      })
      
      setMetas(metasObj)
    } catch (error) {
      console.error('❌ Erro ao carregar metas:', error)
    }
  }

  const salvarMeta = async (processoId, metaTexto) => {
    if (!companyId || !processoId) return

    try {
      const { error } = await supabase
        .from('process_goals')
        .upsert({
          process_id: processoId,
          company_id: companyId,
          goal_text: metaTexto,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'process_id,company_id'
        })

      if (error) throw error

      setMetas(prev => ({ ...prev, [processoId]: metaTexto }))
      setEditandoMeta(null)
      toast.success('Meta salva com sucesso!', { icon: '🎯' })
    } catch (error) {
      console.error('❌ Erro ao salvar meta:', error)
      toast.error('Erro ao salvar meta')
    }
  }

  const apagarMeta = async (processoId) => {
    if (!companyId || !processoId) return

    const confirmacao = window.confirm('Tem certeza que deseja apagar esta meta?')
    if (!confirmacao) return

    try {
      const { error } = await supabase
        .from('process_goals')
        .delete()
        .eq('process_id', processoId)
        .eq('company_id', companyId)

      if (error) throw error

      setMetas(prev => {
        const updated = { ...prev }
        delete updated[processoId]
        return updated
      })
      setEditandoMeta(null)
      toast.success('Meta apagada com sucesso!', { icon: '🗑️' })
    } catch (error) {
      console.error('❌ Erro ao apagar meta:', error)
      toast.error('Erro ao apagar meta')
    }
  }

  // Carregar metas quando selecionar jornada
  useEffect(() => {
    if (jornadaSelecionada && companyId) {
      carregarMetas()
    }
  }, [jornadaSelecionada, companyId])

  const formatarData = (dataISO) => {
    const data = new Date(dataISO)
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getJornadaIcon = (jornadaId) => {
    switch (jornadaId) {
      case 1: return <Target className="h-6 w-6" />
      case 2: return <DollarSign className="h-6 w-6" />
      case 3: return <Users className="h-6 w-6" />
      case 4: return <TrendingUp className="h-6 w-6" />
      case 5: return <Settings className="h-6 w-6" />
      default: return <Target className="h-6 w-6" />
    }
  }

  const getJornadaCores = (jornadaId) => {
    switch (jornadaId) {
      case 1: // Estratégica - Azul
        return {
          background: 'bg-blue-500',
          hover: 'hover:border-blue-500/50',
          text: 'text-blue-500',
          iconBg: 'bg-blue-500',
          indicator: 'bg-blue-500'
        }
      case 2: // Financeira - Verde
        return {
          background: 'bg-green-500',
          hover: 'hover:border-green-500/50',
          text: 'text-green-500',
          iconBg: 'bg-green-500',
          indicator: 'bg-green-500'
        }
      case 3: // Pessoas & Cultura - Roxo
        return {
          background: 'bg-purple-500',
          hover: 'hover:border-purple-500/50',
          text: 'text-purple-500',
          iconBg: 'bg-purple-500',
          indicator: 'bg-purple-500'
        }
      case 4: // Vendas & Marketing - Laranja
        return {
          background: 'bg-orange-500',
          hover: 'hover:border-orange-500/50',
          text: 'text-orange-500',
          iconBg: 'bg-orange-500',
          indicator: 'bg-orange-500'
        }
      case 5: // Operacional - Vermelho
        return {
          background: 'bg-red-500',
          hover: 'hover:border-red-500/50',
          text: 'text-red-500',
          iconBg: 'bg-red-500',
          indicator: 'bg-red-500'
        }
      default:
        return {
          background: 'bg-[#EBA500]',
          hover: 'hover:border-[#EBA500]/50',
          text: 'text-[#EBA500]',
          iconBg: 'bg-[#EBA500]',
          indicator: 'bg-[#EBA500]'
        }
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Banner Super Admin */}
      <SuperAdminBanner />
      
      {(loading || processesLoading) ? (
        <div className="px-8 py-12 mt-8">
          <div className="mb-8 text-center">
            <div className="w-12 h-12 bg-[#EBA500]/20 rounded-xl mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-32 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="bg-gray-100 rounded-3xl p-8 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mx-auto mb-3 w-3/4"></div>
                <div className="w-20 h-1 bg-gray-200 rounded-full mx-auto"></div>
              </div>
            ))}
          </div>
          {processesLoading && (
            <div className="text-center mt-8">
              <div className="text-[#373435]/60 text-sm">
                🔍 Carregando processos prioritários da base de dados...
              </div>
            </div>
          )}
        </div>
      ) : processesError ? (
        <div className="px-8 py-12 mt-8 text-center">
          <div className="bg-red-50 border border-red-200 rounded-3xl p-8 max-w-md mx-auto">
            <div className="w-12 h-12 bg-red-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-red-800 mb-2">Erro ao carregar processos</h3>
            <p className="text-red-600 text-sm mb-4">{processesError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      ) : (
        <div className="px-8 py-8 space-y-8">
        {/* Jornadas - 5 quadrados horizontais elegantes */}
        <div className="grid grid-cols-5 gap-6 mt-8">
        {jornadas.map((jornada) => {
          const cores = getJornadaCores(jornada.id)
          const isAtribuida = isJornadaAtribuida(jornada)
          const isSelected = jornadaSelecionada?.id === jornada.id
          
          return (
            <div
              key={jornada.id}
              onClick={() => selecionarJornada(jornada)}
              className={`
                group relative p-8 rounded-3xl border-2 transition-all duration-500 transform
                ${isAtribuida ? 'cursor-pointer hover:scale-105 hover:shadow-2xl' : 'cursor-not-allowed'}
                ${isSelected && isAtribuida
                  ? `${cores.background} text-white border-transparent shadow-2xl scale-105` 
                  : `bg-white border-[#373435]/10 ${isAtribuida ? cores.hover : ''} shadow-lg ${isAtribuida ? 'hover:shadow-xl' : ''}`
                }
                before:absolute before:inset-0 before:rounded-3xl before:transition-opacity before:duration-500
                ${isSelected && isAtribuida
                  ? 'before:bg-gradient-to-br before:from-white/10 before:to-transparent' 
                  : isAtribuida ? 'before:bg-gradient-to-br before:from-[#EBA500]/5 before:to-[#EBA500]/10 before:opacity-0 hover:before:opacity-100' : ''
                }
              `}
            >
              {/* Overlay de bloqueio para jornadas não atribuídas */}
              {!isAtribuida && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-3xl z-20 flex items-center justify-center">
                  <div className="bg-white rounded-2xl p-4 shadow-lg border border-[#373435]/20">
                    <Lock className="h-6 w-6 text-[#373435]/60 mx-auto mb-2" />
                    <div className="text-[#373435]/60 text-xs font-medium text-center">
                      Não atribuída
                    </div>
                  </div>
                </div>
              )}

              {/* Background Pattern */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden">
                <div className={`
                  absolute inset-0 opacity-10 transition-all duration-500
                  ${isSelected && isAtribuida
                    ? 'bg-gradient-to-br from-white/20 to-transparent' 
                    : isAtribuida ? 'bg-gradient-to-br from-[#EBA500]/20 to-[#EBA500]/30 group-hover:opacity-20' : ''
                  }
                `}></div>
              </div>

              <div className={`relative text-center z-10 ${!isAtribuida ? 'opacity-40' : ''}`}>
                {/* Ícone da Jornada */}
                <div className={`
                  w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg
                  ${isSelected && isAtribuida
                    ? 'bg-white/20 backdrop-blur-sm' 
                    : `${cores.iconBg} ${isAtribuida ? 'group-hover:shadow-xl group-hover:scale-110' : ''}`
                  }
                `}>
                  <div className={`
                    transition-colors duration-500 text-white
                  `}>
                    {getJornadaIcon(jornada.id)}
                  </div>
                </div>

                <h3 className={`
                  font-bold text-xl mb-3 transition-all duration-500
                  ${isSelected && isAtribuida
                    ? 'text-white drop-shadow-lg' 
                    : `text-[#373435] ${isAtribuida ? `group-hover:${cores.text}` : ''}`
                  }
                `}>
                  {jornada.nome}
                </h3>

                {/* Indicador de Status */}
                <div className={`
                  mt-4 w-20 h-1 mx-auto rounded-full transition-all duration-500
                  ${isSelected && isAtribuida
                    ? 'bg-white/40' 
                    : `${cores.indicator}/30 ${isAtribuida ? `group-hover:${cores.indicator}` : ''}`
                  }
                `}></div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Processos da jornada selecionada */}
      {jornadaSelecionada && (
        <div className="space-y-8">
          {/* Header da Seção de Processos */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className={`w-12 h-12 rounded-2xl ${getJornadaCores(jornadaSelecionada.id).iconBg} shadow-lg flex items-center justify-center`}>
                <div className="text-white">
                  {getJornadaIcon(jornadaSelecionada.id)}
                </div>
              </div>
              <div>
                <h2 className={`text-3xl font-bold ${getJornadaCores(jornadaSelecionada.id).text}`}>
                  Processos Prioritários
                </h2>
                <p className="text-[#373435]/70 text-lg font-medium">
                  {jornadaSelecionada.nome} - {processos.length} processos ativos
                </p>
              </div>
            </div>
            
            {/* Botão Reset Ordenação */}
            {processos.some(p => p.strategic_priority_order != null) && (
              <button
                onClick={handleResetOrder}
                className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-purple-500/30 hover:border-purple-500 text-purple-600 hover:bg-purple-50 rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg"
                title="Resetar para ordenação automática"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="font-semibold text-sm">Resetar Ordenação</span>
              </button>
            )}
          </div>

          {/* Grid dos 5 processos elegante com Drag & Drop */}
          {processos.length > 0 ? (
            <DraggableProcessList
              processos={processos}
              onReorder={handleProcessReorder}
              cores={getJornadaCores(jornadaSelecionada.id)}
              renderProcessCard={(processo, index) => {
              const coresJornada = getJornadaCores(jornadaSelecionada.id)
              return (
                <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-[#373435]/10 hover:border-[#EBA500]/30 overflow-hidden flex flex-col h-fit min-h-[500px]">
                  {/* Header do Processo Elegante */}
                  <div className="relative p-4 border-b border-[#373435]/10 bg-[#EBA500]/5 flex-shrink-0">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[#EBA500]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <div className={`w-8 h-8 ${coresJornada.iconBg} rounded-xl flex items-center justify-center shadow-md flex-shrink-0`}>
                            <span className="text-white font-bold text-xs">#{processo.prioridade}</span>
                          </div>
                          <h4 className={`font-bold text-[#373435] text-sm group-hover:${coresJornada.text} transition-colors duration-300 leading-tight break-words flex-1`}>
                            {processo.nome}
                          </h4>
                        </div>
                      </div>

                      {/* Campo de Meta */}
                      <div className="mb-3">
                        {editandoMeta === processo.id ? (
                          <div className="space-y-2">
                            <textarea
                              placeholder="Defina a meta para este processo..."
                              value={metas[processo.id] || ''}
                              onChange={(e) => setMetas(prev => ({ ...prev, [processo.id]: e.target.value }))}
                              className="w-full p-2 border border-[#EBA500]/30 focus:border-[#EBA500] focus:ring-2 focus:ring-[#EBA500]/20 rounded-xl text-xs resize-none bg-white transition-all duration-300"
                              rows="2"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => salvarMeta(processo.id, metas[processo.id] || '')}
                                className="flex-1 bg-[#EBA500] hover:bg-[#EBA500]/90 text-white px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1"
                              >
                                <Save className="h-3 w-3" />
                                Salvar
                              </button>
                              {metas[processo.id] && (
                                <button
                                  onClick={() => apagarMeta(processo.id)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1"
                                  title="Apagar meta"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setEditandoMeta(null)
                                  carregarMetas() // Recarregar para reverter mudanças
                                }}
                                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1"
                              >
                                <X className="h-3 w-3" />
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => setEditandoMeta(processo.id)}
                            className="cursor-pointer p-2 bg-[#EBA500]/5 hover:bg-[#EBA500]/10 border border-dashed border-[#EBA500]/30 hover:border-[#EBA500]/50 rounded-xl transition-all duration-300 min-h-[40px] flex items-center"
                          >
                            {metas[processo.id] ? (
                              <p className="text-xs text-[#373435] leading-relaxed">
                                🎯 <span className="font-medium">{metas[processo.id]}</span>
                              </p>
                            ) : (
                              <p className="text-xs text-[#373435]/40 italic">
                                Clique para definir uma meta...
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Botão Adicionar Tarefa Elegante */}
                      <button
                        onClick={() => {
                          // 🚨 VALIDAÇÃO: Só permitir se processo for REAL (UUID, não número mock)
                          if (typeof processo.id === 'number') {
                            alert('⚠️ Esta empresa ainda não possui processos criados nesta jornada.\n\nOs processos exibidos são apenas exemplos de demonstração. Para criar tarefas, primeiro é necessário criar processos reais através do sistema de Gestão de Processos.')
                            return
                          }
                          // ✅ processo.id JÁ É UUID na tabela processes
                          console.log('📝 Clicou adicionar tarefa:', { processo: processo.nome, id: processo.id, idType: typeof processo.id })
                          iniciarAdicaoTarefa(processo.id)
                        }}
                        disabled={typeof processo.id === 'number'}
                        className={`w-full ${typeof processo.id === 'number' ? 'bg-gray-400 cursor-not-allowed opacity-60' : `${coresJornada.iconBg} hover:opacity-90`} text-white px-3 py-2 rounded-2xl hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 font-semibold text-xs group-hover:scale-[1.02]`}
                        title={typeof processo.id === 'number' ? 'Processos de exemplo - crie processos reais para adicionar tarefas' : 'Adicionar tarefa ao processo'}
                      >
                        <Plus className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{typeof processo.id === 'number' ? 'Processo Mock' : 'Adicionar Tarefa'}</span>
                      </button>

                      {/* Barra de Progresso de Amadurecimento */}
                      <div className="mt-3">
                        <ProcessProgressBar 
                          processId={processo.id}
                          companyId={companyId}
                          onProgressUpdate={(progress) => handleProgressUpdate(processo.id, progress)}
                          showDetails={false}
                          refreshTrigger={progressRefreshTrigger}
                        />
                      </div>

                      {/* Botões de Ação baseados no papel do usuário (apenas quando 100%) */}
                      {processProgressMap[processo.id]?.percentage === 100 && (
                        <>
                          {/* Company Admin: Botão de Confirmar Amadurecimento Direto */}
                          {isCompanyAdmin() ? (
                            <button
                              onClick={() => handleDirectMaturityConfirmation(processo)}
                              className="w-full mt-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white px-3 py-2 rounded-2xl hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 font-semibold text-xs"
                            >
                              <Award className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">Confirmar Amadurecimento</span>
                            </button>
                          ) : (
                            /* Gestor: Botão de Solicitar Validação */
                            <button
                              onClick={() => handleRequestMaturityApproval(processo)}
                              className="w-full mt-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-2xl hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 font-semibold text-xs"
                            >
                              <CheckCircle className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">Solicitar Validação</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                {/* Lista de Tarefas Elegante */}
                <div className="p-4 space-y-3 max-h-80 overflow-y-auto custom-scrollbar bg-[#EBA500]/5 flex-1">
                  {/* Formulário de Nova Tarefa Inline */}
                  {(() => {
                    // ✅ processo.id JÁ É UUID
                    const shouldShow = adicionandoTarefa.processoId === processo.id
                    if (adicionandoTarefa.processoId) {
                      console.log('🔍 Verificando modal:', {
                        processoNome: processo.nome,
                        processoID: processo.id,
                        processoIDType: typeof processo.id,
                        adicionandoProcessoId: adicionandoTarefa.processoId,
                        adicionandoProcessoIdType: typeof adicionandoTarefa.processoId,
                        shouldShow
                      })
                    }
                    return shouldShow
                  })() && (
                    <div className="border-2 border-dashed border-[#EBA500]/40 rounded-xl p-4 bg-[#EBA500]/10 backdrop-blur-sm">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-2 h-2 bg-[#EBA500] rounded-full"></div>
                        <span className="text-[#373435] font-semibold text-xs">Nova Tarefa</span>
                      </div>
                      
                      <div className="space-y-3">
                        {/* Título */}
                        <input
                          type="text"
                          placeholder="Título da tarefa..."
                          value={adicionandoTarefa.titulo}
                          onChange={(e) => setAdicionandoTarefa({ ...adicionandoTarefa, titulo: e.target.value })}
                          className="w-full p-2 border border-[#373435]/20 focus:border-[#EBA500] focus:ring-2 focus:ring-[#EBA500]/20 rounded-xl text-xs bg-white/90 transition-all duration-300"
                        />
                        
                        {/* Descrição */}
                        <textarea
                          placeholder="Descrição da tarefa..."
                          value={adicionandoTarefa.descricao}
                          onChange={(e) => setAdicionandoTarefa({ ...adicionandoTarefa, descricao: e.target.value })}
                          className="w-full p-2 border border-[#373435]/20 focus:border-[#EBA500] focus:ring-2 focus:ring-[#EBA500]/20 rounded-xl text-xs resize-none bg-white/90 transition-all duration-300"
                          rows="2"
                        />
                        
                        <div className="space-y-2">
                          {/* Tipo de Responsável */}
                          <div className="flex items-center space-x-4 text-xs">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="tipoResponsavel"
                                value="usuario"
                                checked={tipoResponsavel === 'usuario'}
                                onChange={(e) => {
                                  setTipoResponsavel(e.target.value)
                                  setResponsavelManual('')
                                }}
                                className="text-[#EBA500] focus:ring-[#EBA500]"
                              />
                              <span className="text-[#373435]">Selecionar usuário</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="tipoResponsavel"
                                value="manual"
                                checked={tipoResponsavel === 'manual'}
                                onChange={(e) => {
                                  setTipoResponsavel(e.target.value)
                                  setAdicionandoTarefa({ ...adicionandoTarefa, responsavel: '' })
                                }}
                                className="text-[#EBA500] focus:ring-[#EBA500]"
                              />
                              <span className="text-[#373435]">Digitar nome</span>
                            </label>
                          </div>
                          
                          {/* Campo de Responsável */}
                          {tipoResponsavel === 'usuario' ? (
                            <select
                              value={adicionandoTarefa.responsavel}
                              onChange={(e) => setAdicionandoTarefa({ ...adicionandoTarefa, responsavel: e.target.value })}
                              className="w-full p-2 border border-[#373435]/20 focus:border-[#EBA500] focus:ring-2 focus:ring-[#EBA500]/20 rounded-xl text-xs bg-white/90 transition-all duration-300"
                            >
                              <option value="">Selecionar responsável</option>
                              {usuarios.map(usuario => (
                                <option key={usuario.id} value={usuario.id}>
                                  {usuario.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              placeholder="Digite o nome do responsável"
                              value={responsavelManual}
                              onChange={(e) => setResponsavelManual(e.target.value)}
                              className="w-full p-2 border border-[#373435]/20 focus:border-[#EBA500] focus:ring-2 focus:ring-[#EBA500]/20 rounded-xl text-xs bg-white/90 transition-all duration-300"
                            />
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {/* Status */}
                          <select
                            value={adicionandoTarefa.status}
                            onChange={(e) => setAdicionandoTarefa({ ...adicionandoTarefa, status: e.target.value })}
                            className="w-full p-2 border border-[#373435]/20 focus:border-[#EBA500] focus:ring-2 focus:ring-[#EBA500]/20 rounded-xl text-xs bg-white/90 transition-all duration-300"
                          >
                            <option value="pending">Pendente</option>
                            <option value="in_progress">Em Andamento</option>
                            <option value="completed">Concluída</option>
                          </select>
                          
                          {/* Data Limite */}
                          <input
                            type="date"
                            placeholder="Data limite (opcional)"
                            value={adicionandoTarefa.dataLimite}
                            onChange={(e) => setAdicionandoTarefa({ ...adicionandoTarefa, dataLimite: e.target.value })}
                            className="w-full p-2 border border-[#373435]/20 focus:border-[#EBA500] focus:ring-2 focus:ring-[#EBA500]/20 rounded-xl text-xs bg-white/90 transition-all duration-300"
                          />
                        </div>
                        
                        {/* Botões */}
                        <div className="flex space-x-2">
                          <button
                            onClick={salvarNovaTarefa}
                            disabled={tasksLoading}
                            className="flex-1 bg-[#EBA500] hover:bg-[#EBA500]/90 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-1 disabled:opacity-50"
                          >
                            <Save className="h-3 w-3" />
                            <span>{tasksLoading ? 'Salvando...' : 'Salvar'}</span>
                          </button>
                          <button
                            onClick={cancelarAdicaoTarefa}
                            className="flex-1 bg-[#373435]/60 hover:bg-[#373435]/80 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-1"
                          >
                            <X className="h-3 w-3" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {(tarefas[processo.id] || []).map((tarefa) => (
                    <div 
                      key={tarefa.id} 
                      className="group border border-[#373435]/10 hover:border-[#EBA500]/30 rounded-xl p-3 bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-md transition-all duration-300 cursor-pointer"
                      onClick={() => editandoTarefa.id !== tarefa.id && abrirTaskSidebar(tarefa)}
                    >
                      {editandoTarefa.id === tarefa.id ? (
                        /* Modo de Edição Elegante */
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-[#373435] font-semibold text-xs">Editando Tarefa</span>
                          </div>
                          
                          <textarea
                            value={editandoTarefa.texto}
                            onChange={(e) => setEditandoTarefa({ ...editandoTarefa, texto: e.target.value })}
                            className="w-full p-2 border border-[#373435]/20 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-xs resize-none bg-white/90 transition-all duration-300"
                            rows="2"
                          />
                          
                          <div className="space-y-2">
                            {/* Tipo de Responsável */}
                            <div className="flex items-center space-x-4 text-xs">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="tipoResponsavelEdicao"
                                  value="usuario"
                                  checked={tipoResponsavelEdicao === 'usuario'}
                                  onChange={(e) => {
                                    setTipoResponsavelEdicao(e.target.value)
                                    setEditandoTarefa({ ...editandoTarefa, responsavel: '' })
                                  }}
                                  className="text-blue-500 focus:ring-blue-500"
                                />
                                <span className="text-[#373435]">Selecionar usuário</span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="tipoResponsavelEdicao"
                                  value="manual"
                                  checked={tipoResponsavelEdicao === 'manual'}
                                  onChange={(e) => {
                                    setTipoResponsavelEdicao(e.target.value)
                                    setEditandoTarefa({ ...editandoTarefa, responsavel: '' })
                                  }}
                                  className="text-blue-500 focus:ring-blue-500"
                                />
                                <span className="text-[#373435]">Digitar nome</span>
                              </label>
                            </div>
                            
                            {/* Campo de Responsável */}
                            {tipoResponsavelEdicao === 'usuario' ? (
                              <select
                                value={editandoTarefa.responsavel}
                                onChange={(e) => setEditandoTarefa({ ...editandoTarefa, responsavel: e.target.value })}
                                className="w-full p-2 border border-[#373435]/20 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-xs bg-white/90 transition-all duration-300"
                              >
                                <option value="">Selecionar responsável</option>
                                {usuarios.map(usuario => (
                                  <option key={usuario.id} value={usuario.id}>
                                    {usuario.name} - {usuario.email}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                placeholder="Digite o nome do responsável"
                                value={editandoTarefa.responsavel}
                                onChange={(e) => setEditandoTarefa({ ...editandoTarefa, responsavel: e.target.value })}
                                className="w-full p-2 border border-[#373435]/20 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-xs bg-white/90 transition-all duration-300"
                              />
                            )}
                          </div>
                          
                          {/* Data Limite */}
                          <div>
                            <label className="block text-xs text-[#373435] font-medium mb-1">
                              Data Limite (opcional)
                            </label>
                            <input
                              type="date"
                              value={editandoTarefa.dataLimite}
                              onChange={(e) => setEditandoTarefa({ ...editandoTarefa, dataLimite: e.target.value })}
                              className="w-full p-2 border border-[#373435]/20 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-xs bg-white/90 transition-all duration-300"
                            />
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => salvarEdicaoTarefa(processo.id)}
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-1"
                            >
                              <Save className="h-3 w-3" />
                              <span>Salvar</span>
                            </button>
                            <button
                              onClick={cancelarEdicao}
                              className="flex-1 bg-[#373435]/60 hover:bg-[#373435]/80 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-1"
                            >
                              <X className="h-3 w-3" />
                              <span>Cancelar</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Modo de Visualização Elegante */
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <p className="text-xs text-[#373435] font-medium flex-1 leading-relaxed break-words pr-2">{tarefa.texto}</p>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-300 flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  iniciarEdicaoTarefa(tarefa)
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-110"
                                title="Editar tarefa"
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  apagarTarefa(processo.id, tarefa.id)
                                }}
                                className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110"
                                title="Apagar tarefa"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-[#EBA500]/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="h-2 w-2 text-[#373435]" />
                            </div>
                            <span className="text-xs text-[#373435]/80 font-medium truncate">{tarefa.responsavel}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-xs text-[#373435]/60">
                            <Clock className="h-2 w-2 flex-shrink-0" />
                            <span className="truncate">
                              Criado em {formatarData(tarefa.criadoEm)} por {tarefa.criadoPor}
                              {tarefa.editadoEm && (
                                <span className="ml-1 text-blue-500 font-medium">
                                  • Editado
                                </span>
                              )}
                            </span>
                          </div>
                          
                          {/* Data Limite */}
                          {tarefa.dataLimite && (
                            <div className="flex items-center space-x-2 text-xs text-[#EBA500] font-medium">
                              <Calendar className="h-2 w-2 flex-shrink-0" />
                              <span className="truncate">
                                Prazo: {formatarData(tarefa.dataLimite)}
                              </span>
                            </div>
                          )}
                          
                          {/* Status da Tarefa - Badge com Ícone (igual Tarefas em Andamento) */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <select
                              value={tarefa.status}
                              onChange={(e) => {
                                e.stopPropagation()
                                alterarStatusTarefa(processo.id, tarefa.id, e.target.value)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer appearance-none ${getStatusColor(tarefa.status)} hover:shadow-md focus:ring-2 focus:ring-[#EBA500]/20 transition-all duration-300`}
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                                backgroundPosition: 'right 0.5rem center',
                                backgroundRepeat: 'no-repeat',
                                backgroundSize: '1.25em 1.25em',
                                paddingRight: '2rem'
                              }}
                            >
                              <option value="pending">⏱️ Pendente</option>
                              <option value="in_progress">⏳ Em Andamento</option>
                              <option value="completed">✅ Concluído</option>
                              <option value="cancelled">❌ Cancelado</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Mensagem quando não há tarefas - Elegante */}
                  {(!tarefas[processo.id] || tarefas[processo.id].length === 0) && (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-[#EBA500]/20 rounded-xl mx-auto mb-3 flex items-center justify-center">
                        <Plus className="h-6 w-6 text-[#373435]/40" />
                      </div>
                      <div className="text-[#373435]/60 text-xs font-medium">
                        Nenhuma tarefa criada
                      </div>
                      <div className="text-[#373435]/40 text-xs mt-1">
                        Clique em "Adicionar Tarefa" para começar
                      </div>
                    </div>
                  )}
                </div>
              </div>
                )
              }}
            />
          ) : (
            /* Mensagem quando não há processos */
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="bg-gradient-to-br from-[#EBA500]/5 to-[#EBA500]/10 rounded-3xl p-12 max-w-md w-full text-center shadow-lg border border-[#EBA500]/20">
                <div className={`w-20 h-20 ${getJornadaCores(jornadaSelecionada.id).iconBg} rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl`}>
                  <FileSearch className="h-10 w-10 text-white" />
                </div>
                <h3 className={`text-2xl font-bold mb-3 ${getJornadaCores(jornadaSelecionada.id).text}`}>
                  Nenhum Processo Avaliado
                </h3>
                <p className="text-[#373435]/70 text-base leading-relaxed">
                  Esta jornada ainda não possui processos prioritários avaliados. Para adicionar processos, acesse a área de Gestão de Processos e realize avaliações.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mensagem inicial elegante */}
      {!jornadaSelecionada && (
        <div className="text-center py-20">
          <div className="bg-gradient-to-r from-[#EBA500]/5 to-[#EBA500]/10 rounded-3xl p-12 inline-block">
            <div className="w-24 h-24 bg-[#EBA500] rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl">
              <Calendar className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-[#373435] mb-4">Selecione uma Jornada</h3>
            <p className="text-[#373435]/70 text-lg max-w-md mx-auto">
              Clique em uma das jornadas acima para visualizar e gerenciar os processos prioritários com elegância
            </p>
          </div>
        </div>
      )}
        </div>
      )}

      {/* Task Sidebar */}
      <TaskSidebar
        isOpen={sidebarTask.isOpen}
        onClose={fecharTaskSidebar}
        task={sidebarTask.task}
        users={usuarios}
        onTaskUpdate={(processId) => {
          loadTasks()
          reloadProcessProgress(processId)
        }}
      />

      {/* Modal de Confirmação de Amadurecimento */}
      {selectedProcessForMaturity && (
        <MaturityConfirmationModal
          isOpen={maturityModalOpen}
          onClose={() => {
            setMaturityModalOpen(false)
            setSelectedProcessForMaturity(null)
          }}
          process={selectedProcessForMaturity}
          companyId={companyId}
          journeyId={jornadaUUID}
          gestorId={profile?.id}
          onSuccess={handleMaturityApprovalSuccess}
        />
      )}
    </div>
  )
}

export default PlanejamentoEstrategico