import React, { useState, useEffect } from 'react'
import { Plus, User, Clock, CheckCircle2, AlertTriangle, Calendar, Edit3, Trash2, Save, X, Target, DollarSign, Users, TrendingUp, Settings, Sparkles, Lock, CheckCircle, XCircle, Loader, Award, RotateCcw, FileSearch, GripVertical, Search, Package, CheckSquare } from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions as useAuthPermissions } from '../../hooks/useAuth'
import { usePriorityProcesses } from '../../hooks/usePriorityProcesses2'
import { useTasks } from '../../hooks/useTasks'
import { supabase } from '../../services/supabase'
import TaskSidebar from './TaskSidebar'
import ProcessProgressBar from '../process/ProcessProgressBar'
import MaturityConfirmationModal from '../process/MaturityConfirmationModal'
import MaturityConfirmModal from '../modals/MaturityConfirmModal'
import SuperAdminBanner from '../SuperAdminBanner'
import DraggableProcessList from './DraggableProcessList'
import toast from 'react-hot-toast'
import { calculateProcessProgress } from '../../services/processMaturityService'
import { useSearchParams } from 'react-router-dom' // 🔥 NOVO: Para ler query params

// Componente de Tarefa Arrastável
const SortableTaskItem = ({ 
  tarefa, 
  processo, 
  editandoTarefa, 
  setEditandoTarefa,
  usuarios,
  setTipoResponsavelEdicao,
  setModalEdicaoAberto,
  setTarefaParaEditar,
  setProcessoParaEdicao,
  setTarefaParaDeletar,
  setProcessoParaDeletar,
  setModalDeleteAberto,
  abrirTaskSidebar,
  salvarEdicaoTarefa,
  cancelarEdicao,
  alterarStatusTarefa,
  getStatusColor,
  formatarData,
  modoSelecao,
  isSelecionada,
  onToggleSelecao,
  children
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarefa.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`group border rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-md transition-all duration-300 overflow-hidden relative ${
        isSelecionada 
          ? 'border-[#EBA500] ring-2 ring-[#EBA500]/30' 
          : 'border-[#373435]/10 hover:border-[#EBA500]/30'
      }`}
    >
      {/* Checkbox de Seleção - Canto superior esquerdo */}
      {modoSelecao && (
        <div className="absolute top-2 left-2 z-20">
          <input
            type="checkbox"
            checked={isSelecionada}
            onChange={onToggleSelecao}
            className="w-4 h-4 text-[#EBA500] border-gray-300 rounded focus:ring-[#EBA500] cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Handle de Arrastar - Posicionado no canto superior direito */}
      {!modoSelecao && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-[#EBA500] transition-colors opacity-0 group-hover:opacity-100 z-10"
          title="Arrastar para reordenar"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      {/* Conteúdo da Tarefa */}
      <div className={`p-2 sm:p-3 min-w-0 overflow-hidden ${modoSelecao ? 'pl-8' : ''}`}>
        {children}
      </div>
    </div>
  )
}

const PlanejamentoEstrategico = () => {
  const { profile } = useAuth()
  const { getAccessibleJourneys } = useAuthPermissions()
  const [searchParams] = useSearchParams() // 🔥 NOVO: Hook para ler URL
  
  // 🔥 NOVO: Estado de controle do limite de processos (DEVE vir ANTES do hook)
  const [limiteProcessos, setLimiteProcessos] = useState(5) // Controle de quantos processos mostrar (5 ou 10)
  const [inputLimite, setInputLimite] = useState('5') // Estado temporário para o input
  
  // 🔥 NOVO: Verificar se há companyId na URL (Super Admin) ou usar do perfil
  const urlCompanyId = searchParams.get('companyId')
  const companyId = urlCompanyId || profile?.user_companies?.[0]?.company_id || null
  
  // 🔥 NOVO: Passar urlCompanyId e limite de processos para os hooks
  const { priorityProcesses, loading: processesLoading, error: processesError, getProcessesByJourney, refetch, debugLogs } = usePriorityProcesses(urlCompanyId, limiteProcessos)
  const { getTasks, getCompanyUsers, createTask, updateTask, deleteTask, updateTaskAssignees, toggleAssigneeCompletion, getTaskAssignees, loading: tasksLoading } = useTasks(urlCompanyId)
  
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
  const [responsaveisEdicaoSelecionados, setResponsaveisEdicaoSelecionados] = useState([]) // 🔥 NOVO: Responsáveis na edição
  const [adicionandoTarefa, setAdicionandoTarefa] = useState({ processoId: null, titulo: '', descricao: '', responsaveis: [], dataLimite: '', status: 'pending' })
  const [tipoResponsavel, setTipoResponsavel] = useState('usuario') // 'usuario' ou 'manual'
  const [responsaveisSelecionados, setResponsaveisSelecionados] = useState([]) // 🔥 NOVO: Array de user IDs
  
  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Só ativa após arrastar 8px para evitar conflito com cliques
      },
    })
  )
  
  // 🔥 NOVO: Estados para Modal de Adicionar Ação
  const [modalTarefaAberto, setModalTarefaAberto] = useState(false)
  const [processoParaTarefa, setProcessoParaTarefa] = useState(null)
  const [responsavelManual, setResponsavelManual] = useState('') // Para responsáveis não cadastrados
  
  // 🔥 NOVO: Estados para Modal de Editar Ação
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false)
  const [tarefaParaEditar, setTarefaParaEditar] = useState(null)
  const [processoParaEdicao, setProcessoParaEdicao] = useState(null)
  
  // 🔥 NOVO: Estados para Modal de Confirmação de Exclusão
  const [modalDeleteAberto, setModalDeleteAberto] = useState(false)
  const [tarefaParaDeletar, setTarefaParaDeletar] = useState(null)
  const [processoParaDeletar, setProcessoParaDeletar] = useState(null)
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
  
  // Estados para importar pack de ações
  const [modalImportarPackAberto, setModalImportarPackAberto] = useState(false)
  const [processoParaImportarPack, setProcessoParaImportarPack] = useState(null)
  const [packsDisponiveis, setPacksDisponiveis] = useState([])
  const [loadingPacks, setLoadingPacks] = useState(false)

  // 🔥 NOVO: Estados para seleção múltipla e exclusão em massa
  const [tarefasSelecionadas, setTarefasSelecionadas] = useState({}) // { processoId: [tarefaId1, tarefaId2] }
  const [modoSelecao, setModoSelecao] = useState(false) // Ativa/desativa modo de seleção
  
  // 🔥 NOVO: Estado para modal de confirmação de amadurecimento
  const [maturityConfirmModalOpen, setMaturityConfirmModalOpen] = useState(false)
  const [processForMaturityConfirm, setProcessForMaturityConfirm] = useState(null)

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
    { id: 4, nome: 'Receita', slug: 'receita', cor: 'bg-orange-500', corTexto: 'text-orange-700' },
    { id: 5, nome: 'Operacional', slug: 'operacional', cor: 'bg-red-500', corTexto: 'text-red-700' }
  ]

  // Função para buscar jornadas reais do banco
  const getJourneyUUIDBySlug = async (slug) => {
    try {
      console.log('🔍 Buscando UUID da jornada:', slug)
      
      // Primeiro tentar buscar pela jornada específica da empresa
      let query = supabase
        .from('journeys')
        .select('id, name, slug')
        .eq('slug', slug)
        .eq('is_active', true)
      
      // Se temos companyId, buscar jornadas da empresa
      if (companyId) {
        query = query.eq('company_id', companyId)
      }
      
      const { data, error } = await query.maybeSingle()

      if (error) {
        console.error('❌ Erro ao buscar jornada:', error)
        return null
      }

      if (!data) {
        console.warn('⚠️ Jornada não encontrada para slug:', slug)
        // Tentar buscar jornada global (sem company_id) como fallback
        const { data: globalData, error: globalError } = await supabase
          .from('journeys')
          .select('id, name, slug')
          .eq('slug', slug)
          .eq('is_active', true)
          .is('company_id', null)
          .maybeSingle()
        
        if (globalError || !globalData) {
          console.error('❌ Jornada global também não encontrada')
          return null
        }
        
        console.log('✅ Jornada global encontrada:', globalData)
        return globalData.id
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
        const todasJornadas = ['estrategica', 'financeira', 'pessoas-cultura', 'receita', 'operacional']
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
        const tarefaFormatada = {
          id: task.id,
          texto: task.description || task.title, // Prioriza descrição, fallback para título
          responsavel: nomeResponsavel, // Nome do usuário ou nome manual
          responsavelId: task.assigned_to, // UUID para edições (pode ser NULL)
          responsavelManual: task.assigned_to_name, // Nome manual (pode ser NULL)
          status: task.status || 'pending', // Manter valores do banco: pending, in_progress, completed, cancelled
          descricao: task.description,
          dataLimite: task.due_date,
          criadoEm: task.created_at,
          created_at: task.created_at, // Adicionar para ordenação
          criadoPor: 'Sistema', // Pode ser melhorado depois
          prioridade: task.priority || 3,
          order: task.order || 0, // Ordem customizada
          assignees: task.assignees || [], // 🔥 PRESERVAR array de responsáveis
          total_assignees: task.total_assignees || 0,
          completed_assignees: task.completed_assignees || 0
        }
        
        // 🔥 DEBUG: Log da data
        if (task.due_date) {
          console.log('📅 Tarefa:', task.title, '| due_date do DB:', task.due_date, '| Tipo:', typeof task.due_date)
        }
        
        tarefasOrganizadas[task.process_id].push(tarefaFormatada)
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
      alert('Erro ao alterar status da ação')
    }
  }

  const iniciarEdicaoTarefa = (tarefa) => {
    console.log('✏️ Iniciando edição da tarefa:', tarefa)
    
    // Determinar se é usuário cadastrado ou nome manual
    if (tarefa.responsavelManual) {
      // É um nome manual
      console.log('👤 Modo: Manual | Responsável:', tarefa.responsavelManual)
      setTipoResponsavelEdicao('manual')
      setEditandoTarefa({
        id: tarefa.id,
        texto: tarefa.texto,
        responsavel: tarefa.responsavelManual,
        dataLimite: tarefa.dataLimite || ''
      })
    } else if (tarefa.responsavelId) {
      // É um usuário cadastrado - usar apenas o ID, não o nome!
      console.log('👤 Modo: Usuário | ID:', tarefa.responsavelId)
      setTipoResponsavelEdicao('usuario')
      setEditandoTarefa({
        id: tarefa.id,
        texto: tarefa.texto,
        responsavel: tarefa.responsavelId, // Sempre usar o ID para usuários cadastrados
        dataLimite: tarefa.dataLimite || ''
      })
    } else {
      // Fallback - sem responsável definido
      console.log('👤 Modo: Usuário | Sem responsável')
      setTipoResponsavelEdicao('usuario')
      setEditandoTarefa({
        id: tarefa.id,
        texto: tarefa.texto,
        responsavel: '',
        dataLimite: tarefa.dataLimite || ''
      })
    }
  }

  const cancelarEdicao = () => {
    setEditandoTarefa({ id: null, texto: '', responsavel: '', dataLimite: '' })
    setTipoResponsavelEdicao('usuario')
  }

  const salvarEdicaoTarefa = async (processoId) => {
    // 🔥 Validar se há pelo menos um responsável
    if (!editandoTarefa.texto.trim() || responsaveisEdicaoSelecionados.length === 0) {
      toast.error('Preencha a descrição e selecione pelo menos um responsável')
      return
    }

    try {
      console.log('💾 Salvando edição da tarefa:', editandoTarefa.id)
      console.log('👥 Responsáveis selecionados:', responsaveisEdicaoSelecionados)
      
      // Atualizar dados básicos da tarefa
      const updateData = {
        title: editandoTarefa.texto,
        description: editandoTarefa.texto,
        due_date: editandoTarefa.dataLimite || null
      }
      
      console.log('📋 Dados da atualização:', updateData)
      
      const resultado = await updateTask(editandoTarefa.id, updateData)
      console.log('✅ Resultado da atualização:', resultado)
      
      // 🔥 NOVO: Atualizar responsáveis
      await updateTaskAssignees(editandoTarefa.id, responsaveisEdicaoSelecionados)
      console.log('✅ Responsáveis atualizados')
      
      // Recarregar tarefas
      await loadTasks()
      
      // 🔥 NOVO: Recarregar progresso após editar ação
      if (processoId) {
        await reloadProcessProgress(processoId)
      }
      
      // NÃO cancelar edição aqui - será feito pelo botão após fechar o modal
      
    } catch (error) {
      console.error('❌ Erro ao salvar edição:', error)
      throw error // Lançar erro para ser capturado pelo botão
    }
  }

  const apagarTarefa = async (processoId, tarefaId) => {
    try {
      console.log('🗑️ Apagando tarefa:', tarefaId)
      
      // Deletar do banco de dados
      await deleteTask(tarefaId)
      
      // Recarregar tarefas para atualizar a interface
      await loadTasks()
      
      // 🔥 NOVO: Recarregar progresso após deletar tarefa
      await reloadProcessProgress(processoId)
      
      toast.success('✅ Ação excluída com sucesso!')
      
    } catch (error) {
      console.error('❌ Erro ao apagar ação:', error)
      toast.error('Erro ao apagar ação')
    }
  }

  // ====== Funções do Sistema de Amadurecimento ======
  // ====== Funções do Sistema de Ordenação Manual ======
  
  // Função para reordenar tarefas com drag and drop
  const handleTaskDragEnd = async (event, processoId) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) {
      return
    }
    
    // Pegar tarefas já ordenadas
    const tarefasOrdenadas = [...(tarefas[processoId] || [])].sort((a, b) => {
      const orderA = a.order !== undefined && a.order !== null ? a.order : 999999
      const orderB = b.order !== undefined && b.order !== null ? b.order : 999999
      
      if (orderA !== 999999 || orderB !== 999999) {
        if (orderA !== orderB) {
          return orderA - orderB
        }
      }
      
      const dateA = new Date(a.created_at || a.criadoEm)
      const dateB = new Date(b.created_at || b.criadoEm)
      return dateA - dateB
    })
    
    const oldIndex = tarefasOrdenadas.findIndex(t => t.id === active.id)
    const newIndex = tarefasOrdenadas.findIndex(t => t.id === over.id)
    
    const newTasks = arrayMove(tarefasOrdenadas, oldIndex, newIndex)
    
    // Atualizar order de cada tarefa no novo array
    const tasksWithNewOrder = newTasks.map((task, index) => ({
      ...task,
      order: index
    }))
    
    // Atualizar UI imediatamente com novo array
    setTarefas({
      ...tarefas,
      [processoId]: tasksWithNewOrder
    })
    
    try {
      // Salvar nova ordem no banco
      for (let i = 0; i < tasksWithNewOrder.length; i++) {
        const { error } = await supabase
          .from('tasks')
          .update({ order: i })
          .eq('id', tasksWithNewOrder[i].id)
        
        if (error) throw error
      }
      
      console.log('✅ Ordem das tarefas salva com sucesso')
      toast.success('✅ Ordem atualizada!')
    } catch (error) {
      console.error('❌ Erro ao salvar ordem das tarefas:', error)
      toast.error('Erro ao salvar ordem')
      // Reverter em caso de erro
      await loadTasks()
    }
  }
  
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
    
    // 🔥 CORRIGIDO: Usar journey_id diretamente do processo ao invés de depender do estado jornadaUUID
    const journeyIdToUse = processo.journey_id || jornadaUUID
    
    console.log('🔍 Validando solicitação de amadurecimento:', {
      processo: processo,
      processId: processo.id,
      companyId: companyId,
      journeyUUID: journeyIdToUse,
      journeyIdFromProcess: processo.journey_id,
      journeyIdFromState: jornadaUUID,
      gestorId: profile?.id,
      progress: progress
    })
    
    // Validar IDs antes de abrir modal
    if (!processo.id) {
      alert('❌ Erro: ID do processo não encontrado')
      return
    }
    
    if (!journeyIdToUse) {
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

    // 🔥 ABRIR MODAL PERSONALIZADO em vez de window.confirm
    setProcessForMaturityConfirm(processo)
    setMaturityConfirmModalOpen(true)
  }

  // 🔥 NOVA FUNÇÃO: Executar confirmação após modal
  const executeMaturityConfirmation = async () => {
    const processo = processForMaturityConfirm
    
    // Fechar modal
    setMaturityConfirmModalOpen(false)
    setProcessForMaturityConfirm(null)

    try {
      // 🔥 BUSCAR journey_id diretamente do processo
      console.log('🔍 Buscando journey_id do processo:', processo.id)
      const { data: processData, error: processError } = await supabase
        .from('processes')
        .select('journey_id')
        .eq('id', processo.id)
        .single()

      if (processError || !processData?.journey_id) {
        console.error('❌ Erro ao buscar journey_id do processo:', processError)
        throw new Error('Não foi possível identificar a jornada deste processo.')
      }

      const journeyUUID = processData.journey_id
      console.log('✅ Journey ID do processo:', journeyUUID)

      console.log('🎯 Company Admin confirmando amadurecimento direto:', {
        processId: processo.id,
        journeyUUID: journeyUUID,
        companyId: companyId
      })

      // Validações
      if (!processo.id || !journeyUUID || !companyId) {
        throw new Error('Dados incompletos para confirmar amadurecimento')
      }

      // Verificar se o progresso está realmente em 100%
      const progressData = await calculateProcessProgress(processo.id, companyId)
      
      if (progressData.percentage !== 100) {
        throw new Error(`Progresso atual: ${progressData.percentage}%. O processo precisa estar 100% completo.`)
      }

      // Atualizar ou criar registro em process_evaluations para marcar has_process = true
      // Primeiro, tentar buscar registro existente
      console.log('🔍 Buscando avaliação existente:', { process_id: processo.id, company_id: companyId })
      
      const { data: existingEval, error: selectError } = await supabase
        .from('process_evaluations')
        .select('id')
        .eq('process_id', processo.id)
        .eq('company_id', companyId)
        .is('diagnosis_id', null)
        .maybeSingle()

      if (selectError) {
        console.error('❌ Erro no SELECT:', selectError)
        throw new Error('Erro ao buscar avaliação: ' + selectError.message)
      }

      console.log('📝 Registro existente:', existingEval)

      let evaluationData, evaluationError

      if (existingEval) {
        // Atualizar registro existente
        console.log('✏️ Atualizando registro existente:', existingEval.id)
        const result = await supabase
          .from('process_evaluations')
          .update({ 
            has_process: true,
            current_score: 5,
            status: 'completed',
            evaluated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingEval.id)
          .select()
        
        evaluationData = result.data
        evaluationError = result.error
      } else {
        // Criar novo registro
        console.log('➕ Criando novo registro')
        const result = await supabase
          .from('process_evaluations')
          .insert({ 
            process_id: processo.id,
            company_id: companyId,
            diagnosis_id: null,
            has_process: true,
            current_score: 5,
            status: 'completed',
            evaluated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
        
        evaluationData = result.data
        evaluationError = result.error
      }

      if (evaluationError) {
        console.error('❌ Erro ao atualizar process_evaluations:', evaluationError)
        throw new Error('Erro ao registrar amadurecimento: ' + evaluationError.message)
      }

      console.log('✅ Process evaluation atualizada:', evaluationData)

      // 🔥 CRIAR SNAPSHOT DA JORNADA APÓS AMADURECER O PROCESSO
      try {
        console.log('�🔥🔥 INICIANDO CRIAÇÃO DE SNAPSHOT 🔥🔥🔥')
        console.log('📊 Dados iniciais:', { companyId, journeyUUID, profileId: profile?.id })
        
        // Buscar todos os processos da jornada
        console.log('1️⃣ Buscando todos os processos da jornada...')
        const { data: allProcesses, error: processesError } = await supabase
          .from('processes')
          .select('id')
          .eq('journey_id', journeyUUID)
          .eq('is_active', true)

        if (processesError) {
          console.error('❌ Erro ao buscar processos:', processesError)
          throw processesError
        }

        console.log('✅ Processos encontrados:', allProcesses)
        const totalProcesses = allProcesses?.length || 0

        // Buscar processos maduros desta jornada para esta empresa
        console.log('2️⃣ Buscando processos maduros...')
        const { data: matureEvals, error: matureError } = await supabase
          .from('process_evaluations')
          .select('process_id')
          .eq('company_id', companyId)
          .eq('has_process', true)
          .in('process_id', allProcesses.map(p => p.id))

        if (matureError) {
          console.error('❌ Erro ao buscar processos maduros:', matureError)
          throw matureError
        }

        console.log('✅ Processos maduros encontrados:', matureEvals)
        const matureProcesses = matureEvals?.length || 0
        const maturityPercentage = totalProcesses > 0 ? (matureProcesses / totalProcesses) * 100 : 0

        // Buscar processos com tarefas em progresso
        console.log('3️⃣ Buscando processos em progresso...')
        const { data: inProgressTasks, error: inProgressError } = await supabase
          .from('tasks')
          .select('process_id')
          .eq('company_id', companyId)
          .eq('journey_id', journeyUUID)
          .in('status', ['pending', 'in_progress'])

        if (inProgressError) {
          console.error('❌ Erro ao buscar tarefas em progresso:', inProgressError)
          throw inProgressError
        }

        console.log('✅ Tarefas em progresso encontradas:', inProgressTasks)
        const inProgressCount = new Set(inProgressTasks?.map(t => t.process_id)).size

        console.log('📊 MÉTRICAS CALCULADAS:', {
          totalProcesses,
          matureProcesses,
          maturityPercentage: maturityPercentage.toFixed(2),
          inProgressCount,
          pendingProcesses: totalProcesses - matureProcesses
        })

        // Inserir snapshot diretamente na tabela
        const today = new Date().toISOString().split('T')[0]
        console.log('4️⃣ Inserindo snapshot na tabela... Data:', today)
        
        const snapshotData = {
          company_id: companyId,
          journey_id: journeyUUID,
          snapshot_date: today,
          snapshot_type: 'weekly',
          total_processes: totalProcesses,
          mature_processes: matureProcesses,
          maturity_percentage: maturityPercentage.toFixed(2),
          in_progress_processes: inProgressCount,
          pending_processes: totalProcesses - matureProcesses,
          created_by: profile?.id
        }
        
        console.log('📝 Dados do snapshot a ser inserido:', snapshotData)
        
        const { data: snapshot, error: snapshotError } = await supabase
          .from('journey_maturity_snapshots')
          .upsert(snapshotData, {
            onConflict: 'company_id,journey_id,snapshot_date,snapshot_type'
          })
          .select()

        if (snapshotError) {
          console.error('❌❌❌ ERRO AO INSERIR SNAPSHOT:', snapshotError)
          console.error('Detalhes do erro:', JSON.stringify(snapshotError, null, 2))
          throw snapshotError
        }

        console.log('✅✅✅ SNAPSHOT CRIADO COM SUCESSO:', snapshot)
        toast.success('📸 Snapshot criado! Dados registrados em Relatórios.')
      } catch (snapshotError) {
        // Não bloquear o fluxo se o snapshot falhar, apenas logar
        console.error('⚠️⚠️⚠️ ERRO AO CRIAR SNAPSHOT (não crítico):', snapshotError)
        console.error('Stack trace:', snapshotError.stack)
        toast.error('⚠️ Snapshot não foi criado. Verifique o console.')
      }

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

  // 🔥 NOVO: Funções para seleção múltipla e exclusão em massa
  const toggleModoSelecao = () => {
    setModoSelecao(!modoSelecao)
    if (modoSelecao) {
      // Limpar seleções ao desativar
      setTarefasSelecionadas({})
    }
  }

  const toggleSelecionarTarefa = (processoId, tarefaId) => {
    setTarefasSelecionadas(prev => {
      const selecionadas = prev[processoId] || []
      const novaSelecao = selecionadas.includes(tarefaId)
        ? selecionadas.filter(id => id !== tarefaId)
        : [...selecionadas, tarefaId]
      
      return {
        ...prev,
        [processoId]: novaSelecao
      }
    })
  }

  const selecionarTodasTarefas = (processoId) => {
    const tarefasDoProcesso = tarefas[processoId] || []
    const todosIds = tarefasDoProcesso.map(t => t.id)
    
    setTarefasSelecionadas(prev => ({
      ...prev,
      [processoId]: todosIds
    }))
  }

  const deselecionarTodasTarefas = (processoId) => {
    setTarefasSelecionadas(prev => ({
      ...prev,
      [processoId]: []
    }))
  }

  const excluirTarefasSelecionadas = async (processoId) => {
    const selecionadas = tarefasSelecionadas[processoId] || []
    
    if (selecionadas.length === 0) {
      toast.error('Nenhuma ação selecionada')
      return
    }

    if (!confirm(`Tem certeza que deseja excluir ${selecionadas.length} ação(ões)?`)) {
      return
    }

    try {
      // Deletar todas as tarefas selecionadas
      for (const tarefaId of selecionadas) {
        await deleteTask(tarefaId)
      }

      // Recarregar tarefas e progresso
      await loadTasks()
      await reloadProcessProgress(processoId)

      // Limpar seleção
      setTarefasSelecionadas(prev => ({
        ...prev,
        [processoId]: []
      }))

      toast.success(`✅ ${selecionadas.length} ação(ões) excluída(s) com sucesso!`)
    } catch (error) {
      console.error('❌ Erro ao excluir ações:', error)
      toast.error('Erro ao excluir ações: ' + error.message)
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
    try {
      console.log('💾 Salvando nova ação')
      
      // 🔥 Validar se há pelo menos um responsável selecionado
      if (responsaveisSelecionados.length === 0) {
        alert('⚠️ Selecione pelo menos um responsável para a tarefa')
        return
      }
      
      // 🔥 CORREÇÃO: Validar se o processo é REAL (UUID) ou MOCK (número)
      const processUUID = adicionandoTarefa.processoId
      
      console.log('🔍 ProcessoId:', processUUID, 'Type:', typeof processUUID)
      
      // 🚨 BLOQUEIO: Se for número (mock), não permitir criação de ação
      if (typeof processUUID === 'number') {
        alert('⚠️ Esta empresa ainda não possui processos criados nesta jornada.\n\nOs processos exibidos são apenas exemplos de demonstração. Para criar ações, primeiro é necessário criar processos reais através do sistema de Gestão de Processos.')
        console.error('❌ Tentativa de criar ação em processo MOCK (ID numérico):', processUUID)
        return
      }
      
      // 🔥 NOVO: Buscar journey_id diretamente do processo no banco
      console.log('🔍 Buscando journey_id do processo:', processUUID)
      const { data: processData, error: processError } = await supabase
        .from('processes')
        .select('journey_id')
        .eq('id', processUUID)
        .single()
      
      if (processError || !processData?.journey_id) {
        console.error('❌ Erro ao buscar journey_id do processo:', processError)
        alert('⚠️ Erro: Não foi possível identificar a jornada deste processo.\n\nEntre em contato com o administrador.')
        return
      }
      
      const journeyUUID = processData.journey_id
      console.log('✅ Journey ID do processo:', journeyUUID)
      
      // 🔥 NOVO: Calcular próximo order para essa tarefa
      const tarefasDoProcesso = tarefas[processUUID] || []
      const maxOrder = tarefasDoProcesso.length > 0 
        ? Math.max(...tarefasDoProcesso.map(t => t.order || 0))
        : -1
      const nextOrder = maxOrder + 1
      
      console.log('📊 Calculando order: tarefas existentes =', tarefasDoProcesso.length, ', maxOrder =', maxOrder, ', nextOrder =', nextOrder)
      
      const taskData = {
        title: adicionandoTarefa.descricao || 'Sem título',
        description: adicionandoTarefa.descricao || '',
        // 🔥 NOVO: Não usar assigned_to, apenas assignedUserIds
        assigned_to: null,
        assigned_to_name: null,
        process_id: processUUID,
        journey_id: journeyUUID,
        status: adicionandoTarefa.status,
        due_date: adicionandoTarefa.dataLimite || null,
        priority: 3,
        order: nextOrder,
        // 🔥 NOVO: Array de responsáveis
        assignedUserIds: responsaveisSelecionados
      }
      
      console.log('📋 Dados da tarefa:', taskData)
      console.log('👥 Responsáveis selecionados:', responsaveisSelecionados)
      
      await createTask(taskData)
      await loadTasks()
      
      // 🔥 NOVO: Recarregar progresso após criar tarefa
      await reloadProcessProgress(adicionandoTarefa.processoId)
      
      // 🔥 NOVO: Fechar modal e limpar estados
      setModalTarefaAberto(false)
      setProcessoParaTarefa(null)
      setResponsaveisSelecionados([]) // Limpar seleção
      cancelarAdicaoTarefa()
      
      toast.success('✅ Ação criada com sucesso!')
      
    } catch (error) {
      console.error('❌ Erro ao salvar nova ação:', error)
      alert('Erro ao salvar ação: ' + (error.message || 'Erro desconhecido'))
    }
  }

  // Funções para gerenciar packs de ações
  const carregarPacksDisponiveis = async (processoId) => {
    try {
      setLoadingPacks(true)
      console.log('📦 Carregando packs para processo:', processoId)

      const { data: packs, error } = await supabase
        .from('process_task_packs')
        .select(`
          pack_id,
          task_packs (
            id,
            name,
            description,
            task_pack_templates (
              id,
              title,
              default_status,
              order_in_pack
            )
          )
        `)
        .eq('process_id', processoId)

      if (error) throw error

      const packsFormatados = packs.map(p => ({
        id: p.task_packs.id,
        name: p.task_packs.name,
        description: p.task_packs.description,
        templates: p.task_packs.task_pack_templates.sort((a, b) => a.order_in_pack - b.order_in_pack)
      }))

      setPacksDisponiveis(packsFormatados)
      console.log('📦 Packs carregados:', packsFormatados.length)
    } catch (error) {
      console.error('❌ Erro ao carregar packs:', error)
      toast.error('Erro ao carregar packs disponíveis')
    } finally {
      setLoadingPacks(false)
    }
  }

  const importarPack = async (pack) => {
    if (!processoParaImportarPack) return

    try {
      console.log('📦 Importando pack:', pack.name)

      // Buscar journey_id diretamente do processo
      const { data: processData, error: processError } = await supabase
        .from('processes')
        .select('journey_id')
        .eq('id', processoParaImportarPack.id)
        .single()

      if (processError || !processData?.journey_id) {
        console.error('❌ Erro ao buscar journey_id do processo:', processError)
        throw new Error('Não foi possível identificar a jornada deste processo.')
      }

      const journeyId = processData.journey_id
      console.log('✅ Journey ID do processo:', journeyId)

      // Calcular próxima ordem para as tarefas
      const tarefasDoProcesso = tarefas[processoParaImportarPack.id] || []
      const maxOrder = tarefasDoProcesso.length > 0 
        ? Math.max(...tarefasDoProcesso.map(t => t.order || 0))
        : -1

      // Criar todas as tarefas do pack
      let ordem = maxOrder + 1
      for (const template of pack.templates) {
        // Truncar título se for muito longo e mover texto completo para descrição
        const tituloCompleto = template.title
        const titulo = tituloCompleto.length > 255 
          ? tituloCompleto.substring(0, 252) + '...'
          : tituloCompleto
        
        const taskData = {
          title: titulo,
          description: tituloCompleto.length > 255 ? tituloCompleto : null,
          process_id: processoParaImportarPack.id,
          company_id: companyId,
          created_by: profile.id,
          assigned_to: null, // Usuário define depois
          journey_id: journeyId,
          status: template.default_status || 'pending',
          due_date: null, // Usuário define depois
          priority: 3,
          order: ordem
        }

        await createTask(taskData)
        ordem++
      }

      // Recarregar tarefas e progresso
      await loadTasks()
      await reloadProcessProgress(processoParaImportarPack.id)

      toast.success(`✅ ${pack.templates.length} ações importadas com sucesso!`)
      setModalImportarPackAberto(false)
      setProcessoParaImportarPack(null)
      setPacksDisponiveis([])
    } catch (error) {
      console.error('❌ Erro ao importar pack:', error)
      toast.error('Erro ao importar pack: ' + error.message)
    }
  }

  const abrirModalImportarPack = async (processo) => {
    setProcessoParaImportarPack(processo)
    setModalImportarPackAberto(true)
    await carregarPacksDisponiveis(processo.id)
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
    if (!dataISO) return ''
    
    // 🔥 FIX: Para datas no formato YYYY-MM-DD (sem hora), não usar new Date()
    // pois causa conversão de timezone
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) {
      const [ano, mes, dia] = dataISO.split('-')
      return `${dia}/${mes}/${ano}`
    }
    
    // Para timestamps completos (created_at, etc), usar Date normal
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
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 mt-6 sm:mt-8">
          <div className="mb-6 sm:mb-8 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#EBA500]/20 rounded-xl mx-auto mb-3 sm:mb-4 animate-pulse"></div>
            <div className="h-5 sm:h-6 bg-gray-200 rounded w-36 sm:w-48 mx-auto mb-2 animate-pulse"></div>
            <div className="h-3 sm:h-4 bg-gray-100 rounded w-24 sm:w-32 mx-auto animate-pulse"></div>
          </div>
          <div className="grid gap-3 sm:gap-4 lg:gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="bg-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 animate-pulse">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gray-200 rounded-xl sm:rounded-2xl mx-auto mb-3 sm:mb-4"></div>
                <div className="h-4 sm:h-5 lg:h-6 bg-gray-200 rounded mx-auto mb-2 sm:mb-3 w-3/4"></div>
                <div className="w-16 sm:w-20 h-1 bg-gray-200 rounded-full mx-auto"></div>
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
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 mt-6 sm:mt-8 text-center">
          <div className="bg-red-50 border border-red-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 max-w-md mx-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg sm:rounded-xl mx-auto mb-3 sm:mb-4 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-red-800 mb-2">Erro ao carregar processos</h3>
            <p className="text-red-600 text-xs sm:text-sm mb-3 sm:mb-4">{processesError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors min-h-[44px] touch-manipulation"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
        {/* Jornadas - cards horizontais distribuídos dinamicamente */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 mt-6 sm:mt-8" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${jornadas.length > 1 ? '180px' : '200px'}, 1fr))` }}>
        {jornadas.map((jornada) => {
          const cores = getJornadaCores(jornada.id)
          const isAtribuida = isJornadaAtribuida(jornada)
          const isSelected = jornadaSelecionada?.id === jornada.id
          
          return (
            <div
              key={jornada.id}
              onClick={() => selecionarJornada(jornada)}
              className={`
                group relative p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 transform touch-manipulation
                ${isAtribuida ? 'cursor-pointer hover:scale-105 hover:shadow-lg active:scale-95' : 'cursor-not-allowed'}
                ${isSelected && isAtribuida
                  ? `${cores.background} text-white border-transparent shadow-lg scale-105` 
                  : `bg-white border-[#373435]/10 ${isAtribuida ? cores.hover : ''} shadow-md ${isAtribuida ? 'hover:shadow-lg' : ''}`
                }
              `}
            >
              {/* Overlay de bloqueio para jornadas não atribuídas */}
              {!isAtribuida && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl z-20 flex items-center justify-center">
                  <div className="bg-white rounded-lg sm:rounded-xl p-1.5 sm:p-2 shadow-md border border-[#373435]/20">
                    <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-[#373435]/60 mx-auto mb-0.5 sm:mb-1" />
                    <div className="text-[#373435]/60 text-[8px] sm:text-[10px] font-medium text-center">
                      Bloqueada
                    </div>
                  </div>
                </div>
              )}

              {/* Background Pattern */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className={`
                  absolute inset-0 opacity-10 transition-all duration-300
                  ${isSelected && isAtribuida
                    ? 'bg-gradient-to-br from-white/20 to-transparent' 
                    : isAtribuida ? 'bg-gradient-to-br from-[#EBA500]/20 to-[#EBA500]/30 group-hover:opacity-20' : ''
                  }
                `}></div>
              </div>

              <div className={`relative flex items-center gap-3 z-10 ${!isAtribuida ? 'opacity-40' : ''}`}>
                {/* Ícone da Jornada */}
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md flex-shrink-0
                  ${isSelected && isAtribuida
                    ? 'bg-white/20 backdrop-blur-sm' 
                    : `${cores.iconBg} ${isAtribuida ? 'group-hover:shadow-lg group-hover:scale-110' : ''}`
                  }
                `}>
                  <div className="transition-colors duration-300 text-white text-lg">
                    {getJornadaIcon(jornada.id)}
                  </div>
                </div>

                {/* Nome da Jornada */}
                <div className="flex-1 min-w-0">
                  <h3 className={`
                    font-bold text-sm leading-tight transition-all duration-300 truncate
                    ${isSelected && isAtribuida
                      ? 'text-white drop-shadow-md' 
                      : `text-[#373435] ${isAtribuida ? `group-hover:${cores.text}` : ''}`
                    }
                  `}>
                    {jornada.nome}
                  </h3>
                  
                  {/* Indicador de Status */}
                  <div className={`
                    mt-1.5 w-12 h-0.5 rounded-full transition-all duration-300
                    ${isSelected && isAtribuida
                      ? 'bg-white/40' 
                      : `${cores.indicator}/30 ${isAtribuida ? `group-hover:${cores.indicator}` : ''}`
                    }
                  `}></div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Processos da jornada selecionada */}
      {jornadaSelecionada && (
        <div className="space-y-6 sm:space-y-8">
          {/* Header da Seção de Processos */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${getJornadaCores(jornadaSelecionada.id).iconBg} shadow-lg flex items-center justify-center flex-shrink-0`}>
                <div className="text-white">
                  {getJornadaIcon(jornadaSelecionada.id)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${getJornadaCores(jornadaSelecionada.id).text} truncate`}>
                  Processos Prioritários
                </h2>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Campo para definir limite de processos */}
              <div className="flex items-center gap-2 bg-white border-2 border-[#EBA500]/30 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 shadow-md">
                <label htmlFor="limite-processos" className="text-xs sm:text-sm font-semibold text-[#373435] whitespace-nowrap">
                  Mostrar top:
                </label>
                <input
                  id="limite-processos"
                  type="number"
                  min="1"
                  max="20"
                  value={inputLimite}
                  onChange={(e) => setInputLimite(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const valor = parseInt(inputLimite) || 5
                      const valorValido = Math.max(1, Math.min(20, valor))
                      setLimiteProcessos(valorValido)
                      setInputLimite(String(valorValido))
                    }
                  }}
                  className="w-14 sm:w-16 px-2 py-1 text-center border border-[#EBA500]/30 focus:border-[#EBA500] focus:ring-2 focus:ring-[#EBA500]/20 rounded-lg text-xs sm:text-sm font-bold text-[#373435] transition-all duration-300"
                  placeholder="5"
                />
                <button
                  onClick={() => {
                    const valor = parseInt(inputLimite) || 5
                    const valorValido = Math.max(1, Math.min(20, valor))
                    setLimiteProcessos(valorValido)
                    setInputLimite(String(valorValido))
                  }}
                  className="p-1.5 hover:bg-[#EBA500]/10 rounded-lg transition-all duration-300"
                  title="Aplicar filtro"
                >
                  <Search className="h-4 w-4 text-[#EBA500]" />
                </button>
              </div>
              
              {/* Botão Reset Ordenação */}
              {processos.some(p => p.strategic_priority_order != null) && (
                <button
                  onClick={handleResetOrder}
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 min-h-[44px] bg-white border-2 border-purple-500/30 hover:border-purple-500 text-purple-600 hover:bg-purple-50 rounded-xl sm:rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg touch-manipulation"
                  title="Resetar para ordenação automática"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="font-semibold text-xs sm:text-sm">Resetar Ordenação</span>
                </button>
              )}
            </div>
          </div>

          {/* Grid dos 5 processos elegante com Drag & Drop */}
          {processos.length > 0 ? (
            <DraggableProcessList
              processos={processos}
              onReorder={handleProcessReorder}
              cores={getJornadaCores(jornadaSelecionada.id)}
              renderProcessCard={(processo, index, totalProcessos) => {
              const coresJornada = getJornadaCores(jornadaSelecionada.id)
              
              return (
                <div className="group bg-white rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-[#373435]/10 hover:border-[#EBA500]/30 overflow-hidden flex flex-col md:flex-row h-fit min-h-[300px]">
                  {/* Header do Processo Elegante */}
                  <div className="relative p-3 sm:p-4 border-b md:border-b-0 md:border-r md:w-1/3 border-[#373435]/10 bg-[#EBA500]/5 flex-shrink-0">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[#EBA500]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <h4 className={`font-bold text-[#373435] text-xs sm:text-sm group-hover:${coresJornada.text} transition-colors duration-300 leading-tight break-words flex-1`}>
                          {processo.nome}
                        </h4>
                      </div>

                      {/* Campo de Meta */}
                      <div className="mb-2 sm:mb-3">
                        {editandoMeta === processo.id ? (
                          <div className="space-y-2">
                            <textarea
                              placeholder="Defina a meta para este processo..."
                              value={metas[processo.id] || ''}
                              onChange={(e) => setMetas(prev => ({ ...prev, [processo.id]: e.target.value }))}
                              className="w-full p-2 border border-[#EBA500]/30 focus:border-[#EBA500] focus:ring-2 focus:ring-[#EBA500]/20 rounded-xl text-xs resize-none bg-white transition-all duration-300 touch-manipulation"
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
                                <span className="font-medium">{metas[processo.id]}</span>
                              </p>
                            ) : (
                              <p className="text-xs text-[#373435]/40 italic">
                                Clique para definir uma meta...
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Botão Adicionar Ação Elegante */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // 🚨 VALIDAÇÃO: Só permitir se processo for REAL (UUID, não número mock)
                            if (typeof processo.id === 'number') {
                              alert('⚠️ Esta empresa ainda não possui processos criados nesta jornada.\n\nOs processos exibidos são apenas exemplos de demonstração. Para criar ações, primeiro é necessário criar processos reais através do sistema de Gestão de Processos.')
                              return
                            }
                            // ✅ processo.id JÁ É UUID na tabela processes
                            console.log('📝 Clicou adicionar ação:', { processo: processo.nome, id: processo.id, idType: typeof processo.id })
                            // 🔥 NOVO: Abrir modal ao invés de inline form
                            setProcessoParaTarefa(processo)
                            setModalTarefaAberto(true)
                            iniciarAdicaoTarefa(processo.id)
                          }}
                          disabled={typeof processo.id === 'number'}
                          className={`flex-1 ${typeof processo.id === 'number' ? 'bg-gray-400 cursor-not-allowed opacity-60' : `${coresJornada.iconBg} hover:opacity-90`} text-white px-3 py-2 rounded-2xl hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 font-semibold text-xs`}
                          title={typeof processo.id === 'number' ? 'Processos de exemplo - crie processos reais para adicionar ações' : 'Adicionar ação ao processo'}
                        >
                          <Plus className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{typeof processo.id === 'number' ? 'Processo Mock' : 'Adicionar Ação'}</span>
                        </button>

                        {/* Botão Importar Pack (se houver packs disponíveis) */}
                        {typeof processo.id !== 'number' && (
                          <button
                            onClick={() => abrirModalImportarPack(processo)}
                            className={`px-3 py-2 ${coresJornada.iconBg} hover:opacity-90 text-white rounded-2xl hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 font-semibold text-xs`}
                            title="Importar pack de ações pré-definidas"
                          >
                            <Package className="h-3 w-3 flex-shrink-0" />
                          </button>
                        )}
                      </div>

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
                <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 overflow-y-auto custom-scrollbar bg-[#EBA500]/5 flex-1 max-h-64 sm:max-h-80 md:w-2/3 md:max-h-[500px]">
                  {/* Controles de Seleção Múltipla */}
                  {tarefas[processo.id]?.length > 0 && (
                    <div className="mb-3 pb-3 border-b border-[#373435]/10">
                      {!modoSelecao ? (
                        <button
                          onClick={() => toggleModoSelecao()}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                        >
                          <CheckSquare className="h-3 w-3" />
                          Selecionar
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-gray-600 font-medium">
                              {tarefasSelecionadas[processo.id]?.length || 0} selecionada(s)
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => selecionarTodasTarefas(processo.id)}
                              className="px-3 py-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all font-medium"
                            >
                              Todas
                            </button>
                            
                            <button
                              onClick={() => deselecionarTodasTarefas(processo.id)}
                              className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all font-medium"
                            >
                              Nenhuma
                            </button>
                            
                            <button
                              onClick={() => toggleModoSelecao()}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-red-500 text-white hover:bg-red-600"
                            >
                              <X className="h-3 w-3" />
                              Cancelar
                            </button>
                            
                            {tarefasSelecionadas[processo.id]?.length > 0 && (
                              <button
                                onClick={() => excluirTarefasSelecionadas(processo.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-all ml-auto"
                              >
                                <Trash2 className="h-3 w-3" />
                                Excluir ({tarefasSelecionadas[processo.id]?.length})
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Formulário de Nova Ação Inline */}
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
                    <div className="border-2 border-dashed border-[#EBA500]/40 rounded-xl p-3 sm:p-4 bg-[#EBA500]/10 backdrop-blur-sm">
                      <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                        <div className="w-2 h-2 bg-[#EBA500] rounded-full"></div>
                        <span className="text-[#373435] font-semibold text-[10px] sm:text-xs">Nova Ação</span>
                      </div>
                      
                      <div className="space-y-2 sm:space-y-3">
                        {/* Descrição */}
                        <textarea
                          placeholder="Descrição da ação..."
                          value={adicionandoTarefa.descricao}
                          onChange={(e) => setAdicionandoTarefa({ ...adicionandoTarefa, descricao: e.target.value })}
                          className="w-full p-2 border border-[#373435]/20 focus:border-[#EBA500] focus:ring-2 focus:ring-[#EBA500]/20 rounded-xl text-[10px] sm:text-xs resize-none bg-white/90 transition-all duration-300 touch-manipulation"
                          rows="3"
                        />
                        
                        <div className="space-y-2">
                          {/* Tipo de Responsável */}
                          <div className="flex flex-col space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs">
                            <label className="flex items-center space-x-2 cursor-pointer min-h-[40px] touch-manipulation">
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
                              className="w-full p-2 border border-[#373435]/20 focus:border-[#EBA500] focus:ring-2 focus:ring-[#EBA500]/20 rounded-xl text-[10px] sm:text-xs bg-white/90 transition-all duration-300 min-h-[44px] touch-manipulation"
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
                              className="w-full p-2 border border-[#373435]/20 focus:border-[#EBA500] focus:ring-2 focus:ring-[#EBA500]/20 rounded-xl text-[10px] sm:text-xs bg-white/90 transition-all duration-300 min-h-[44px] touch-manipulation"
                            />
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {/* Status */}
                          <select
                            value={adicionandoTarefa.status}
                            onChange={(e) => setAdicionandoTarefa({ ...adicionandoTarefa, status: e.target.value })}
                            className="w-full p-2 border border-[#373435]/20 focus:border-[#EBA500] focus:ring-2 focus:ring-[#EBA500]/20 rounded-xl text-[10px] sm:text-xs bg-white/90 transition-all duration-300 min-h-[44px] touch-manipulation"
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
                            className="w-full p-2 border border-[#373435]/20 focus:border-[#EBA500] focus:ring-2 focus:ring-[#EBA500]/20 rounded-xl text-[10px] sm:text-xs bg-white/90 transition-all duration-300 min-h-[44px] touch-manipulation"
                          />
                        </div>
                        
                        {/* Botões */}
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={salvarNovaTarefa}
                            disabled={tasksLoading}
                            className="w-full bg-[#EBA500] hover:bg-[#EBA500]/90 text-white px-3 py-2 rounded-xl text-[10px] sm:text-xs font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-1 disabled:opacity-50 min-h-[44px] touch-manipulation"
                          >
                            <Save className="h-3 w-3" />
                            <span>{tasksLoading ? 'Salvando...' : 'Salvar'}</span>
                          </button>
                          <button
                            onClick={cancelarAdicaoTarefa}
                            className="w-full bg-[#373435]/60 hover:bg-[#373435]/80 text-white px-3 py-2 rounded-xl text-[10px] sm:text-xs font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-1 min-h-[44px] touch-manipulation"
                          >
                            <X className="h-3 w-3" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleTaskDragEnd(event, processo.id)}
                  >
                    <SortableContext
                      items={(tarefas[processo.id] || []).map(t => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {(tarefas[processo.id] || [])
                        .sort((a, b) => {
                          // Primeiro, tentar ordenar por order se ambos tiverem
                          const orderA = a.order !== undefined && a.order !== null ? a.order : 999999
                          const orderB = b.order !== undefined && b.order !== null ? b.order : 999999
                          
                          if (orderA !== 999999 || orderB !== 999999) {
                            // Se pelo menos um tem order, ordenar por order
                            if (orderA !== orderB) {
                              return orderA - orderB
                            }
                          }
                          
                          // Se nenhum tem order ou são iguais, ordenar por data de criação (mais antiga primeiro)
                          const dateA = new Date(a.created_at || a.criadoEm)
                          const dateB = new Date(b.created_at || b.criadoEm)
                          return dateA - dateB
                        })
                        .map((tarefa) => (
                          <SortableTaskItem
                            key={tarefa.id}
                            tarefa={tarefa}
                            processo={processo}
                            editandoTarefa={editandoTarefa}
                            setEditandoTarefa={setEditandoTarefa}
                            usuarios={usuarios}
                            setTipoResponsavelEdicao={setTipoResponsavelEdicao}
                            setModalEdicaoAberto={setModalEdicaoAberto}
                            setTarefaParaEditar={setTarefaParaEditar}
                            setProcessoParaEdicao={setProcessoParaEdicao}
                            setTarefaParaDeletar={setTarefaParaDeletar}
                            setProcessoParaDeletar={setProcessoParaDeletar}
                            setModalDeleteAberto={setModalDeleteAberto}
                            abrirTaskSidebar={abrirTaskSidebar}
                            salvarEdicaoTarefa={salvarEdicaoTarefa}
                            cancelarEdicao={cancelarEdicao}
                            alterarStatusTarefa={alterarStatusTarefa}
                            getStatusColor={getStatusColor}
                            modoSelecao={modoSelecao}
                            isSelecionada={tarefasSelecionadas[processo.id]?.includes(tarefa.id)}
                            onToggleSelecao={() => toggleSelecionarTarefa(processo.id, tarefa.id)}
                            formatarData={formatarData}
                          >
                            <div 
                              className="cursor-pointer"
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
                            <p className="text-xs text-[#373435] font-medium flex-1 leading-relaxed break-words overflow-wrap-anywhere pr-2" style={{wordBreak: 'break-word', overflowWrap: 'anywhere'}}>{tarefa.texto}</p>
                          </div>
                          
                          {/* 🔥 NOVO: Múltiplos Responsáveis com Indicador de Conclusão */}
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-[#EBA500]/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <Users className="h-2 w-2 text-[#373435]" />
                              </div>
                              <span className="text-xs text-[#373435]/80 font-semibold">
                                {tarefa.assignees && tarefa.assignees.length > 0 
                                  ? `${tarefa.assignees.length} ${tarefa.assignees.length === 1 ? 'Responsável' : 'Responsáveis'}`
                                  : 'Responsável'
                                }
                              </span>
                            </div>
                            
                            {/* Lista de Responsáveis */}
                            {tarefa.assignees && tarefa.assignees.length > 0 ? (
                              <div className="ml-6 space-y-1">
                                {tarefa.assignees.map((assignee, idx) => (
                                  <div key={idx} className="flex items-center space-x-2">
                                    {assignee.hasCompleted ? (
                                      <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                    ) : (
                                      <div className="h-3 w-3 border-2 border-gray-300 rounded-full flex-shrink-0"></div>
                                    )}
                                    <span className={`text-xs ${assignee.hasCompleted ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                                      {assignee.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="ml-6">
                                <span className="text-xs text-gray-600">{tarefa.responsavel || 'Sem responsável'}</span>
                              </div>
                            )}
                            
                            {/* Progresso de Conclusão */}
                            {tarefa.assignees && tarefa.assignees.length > 1 && (
                              <div className="ml-6 mt-1">
                                <div className="flex items-center space-x-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                    <div 
                                      className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                                      style={{ 
                                        width: `${(tarefa.assignees.filter(a => a.hasCompleted).length / tarefa.assignees.length) * 100}%` 
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
                                    {tarefa.assignees.filter(a => a.hasCompleted).length}/{tarefa.assignees.length}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Data Limite */}
                          {tarefa.dataLimite && (
                            <div className="flex items-center space-x-2 text-xs text-[#EBA500] font-medium">
                              <Calendar className="h-2 w-2 flex-shrink-0" />
                              <span className="break-words">
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
                              <option value="pending">Pendente</option>
                              <option value="in_progress">Em Andamento</option>
                              <option value="completed">Concluído</option>
                              <option value="cancelled">Cancelado</option>
                            </select>
                          </div>
                          
                          {/* Botões de Ação */}
                          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                console.log('🔍 Abrindo edição para tarefa:', tarefa)
                                setTarefaParaEditar(tarefa)
                                setProcessoParaEdicao(processo)
                                
                                // Usar a função iniciarEdicaoTarefa que já tem a lógica correta
                                iniciarEdicaoTarefa(tarefa)
                                
                                // 🔥 NOVO: Buscar responsáveis atuais da tarefa
                                const assignees = await getTaskAssignees(tarefa.id)
                                const assigneeIds = assignees.map(a => a.userId)
                                setResponsaveisEdicaoSelecionados(assigneeIds)
                                console.log('👥 Responsáveis carregados para edição:', assigneeIds)
                                
                                setModalEdicaoAberto(true)
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-300"
                              title="Editar ação"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setTarefaParaDeletar(tarefa)
                                setProcessoParaDeletar(processo)
                                setModalDeleteAberto(true)
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-300"
                              title="Apagar ação"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                            </div>
                          </SortableTaskItem>
                        ))}
                    </SortableContext>
                  </DndContext>

                  {/* Mensagem quando não há tarefas - Elegante */}
                  {(!tarefas[processo.id] || tarefas[processo.id].length === 0) && (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-[#EBA500]/20 rounded-xl mx-auto mb-3 flex items-center justify-center">
                        <Plus className="h-6 w-6 text-[#373435]/40" />
                      </div>
                      <div className="text-[#373435]/60 text-xs font-medium">
                        Nenhuma ação criada
                      </div>
                      <div className="text-[#373435]/40 text-xs mt-1">
                        Clique em "Adicionar Ação" para começar
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
          journeyId={selectedProcessForMaturity.journey_id || jornadaUUID}
          gestorId={profile?.id}
          onSuccess={handleMaturityApprovalSuccess}
        />
      )}

      {/* Modal de Adicionar Ação */}
      {modalTarefaAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn">
          <div 
            className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#EBA500] to-[#D89500] px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-2xl font-bold text-white flex items-center space-x-2">
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Nova Ação</span>
                </h3>
                {processoParaTarefa && (
                  <p className="text-white/90 text-xs sm:text-sm mt-1 sm:mt-1.5 flex items-center space-x-2">
                    <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">{processoParaTarefa.nome}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setModalTarefaAberto(false)
                  setProcessoParaTarefa(null)
                  cancelarAdicaoTarefa()
                }}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 sm:p-2 transition-all duration-200 flex-shrink-0"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto max-h-[calc(95vh-180px)] sm:max-h-[calc(90vh-180px)]">
              {/* Descrição da Ação */}
              <div className="group">
                <label className="block text-xs sm:text-sm font-semibold text-[#373435] mb-2 flex items-center space-x-2">
                  <Edit3 className="h-3 w-3 sm:h-4 sm:w-4 text-[#EBA500]" />
                  <span>Descrição da Ação *</span>
                </label>
                <textarea
                  value={adicionandoTarefa.descricao}
                  onChange={(e) => setAdicionandoTarefa({ ...adicionandoTarefa, descricao: e.target.value })}
                  placeholder="Descreva a ação..."
                  rows={3}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all resize-none shadow-sm hover:border-gray-300 touch-manipulation"
                />
              </div>

              {/* Tipo de Responsável - REMOVIDO, agora sempre permite múltiplos usuários */}

              {/* Responsáveis (Múltipla Seleção) */}
              <div className="group">
                <label className="block text-xs sm:text-sm font-semibold text-[#373435] mb-2 flex items-center space-x-2">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-[#EBA500]" />
                  <span>Responsáveis * (selecione um ou mais)</span>
                </label>
                <div className="border-2 border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto bg-white">
                  {usuarios.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">Nenhum usuário disponível</p>
                  ) : (
                    <div className="space-y-2">
                      {usuarios.map(usuario => (
                        <label
                          key={usuario.id}
                          className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                            responsaveisSelecionados.includes(usuario.id) ? 'bg-[#EBA500]/5' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={responsaveisSelecionados.includes(usuario.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setResponsaveisSelecionados([...responsaveisSelecionados, usuario.id])
                              } else {
                                setResponsaveisSelecionados(responsaveisSelecionados.filter(id => id !== usuario.id))
                              }
                            }}
                            className="w-4 h-4 text-[#EBA500] border-gray-300 rounded focus:ring-[#EBA500]"
                          />
                          <span className="text-sm text-gray-700">{usuario.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {responsaveisSelecionados.length > 0 && (
                  <p className="text-xs text-[#EBA500] mt-2 flex items-center space-x-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{responsaveisSelecionados.length} {responsaveisSelecionados.length === 1 ? 'responsável selecionado' : 'responsáveis selecionados'}</span>
                  </p>
                )}
              </div>

              {/* Prazo e Status em Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Prazo */}
                <div className="group">
                  <label className="block text-xs sm:text-sm font-semibold text-[#373435] mb-2 flex items-center space-x-2">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-[#EBA500]" />
                    <span>Prazo</span>
                  </label>
                  <input
                    type="date"
                    value={adicionandoTarefa.dataLimite}
                    onChange={(e) => setAdicionandoTarefa({ ...adicionandoTarefa, dataLimite: e.target.value })}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all shadow-sm hover:border-gray-300 min-h-[44px] touch-manipulation"
                  />
                </div>

                {/* Status */}
                <div className="group">
                  <label className="block text-xs sm:text-sm font-semibold text-[#373435] mb-2 flex items-center space-x-2">
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-[#EBA500]" />
                    <span>Status Inicial</span>
                  </label>
                  <select
                    value={adicionandoTarefa.status}
                    onChange={(e) => setAdicionandoTarefa({ ...adicionandoTarefa, status: e.target.value })}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all shadow-sm hover:border-gray-300 min-h-[44px] touch-manipulation"
                  >
                    <option value="pending">Pendente</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="completed">Concluída</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setModalTarefaAberto(false)
                  setProcessoParaTarefa(null)
                  cancelarAdicaoTarefa()
                }}
                className="w-full sm:w-auto px-4 sm:px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold flex items-center justify-center space-x-2 min-h-[44px] touch-manipulation"
              >
                <X className="h-4 w-4" />
                <span className="text-sm sm:text-base">Cancelar</span>
              </button>
              <button
                onClick={salvarNovaTarefa}
                disabled={!adicionandoTarefa.descricao}
                className="w-full sm:w-auto px-5 sm:px-6 py-2.5 bg-gradient-to-r from-[#EBA500] to-[#D89500] text-white rounded-xl hover:from-[#D89500] hover:to-[#C78400] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:shadow-none min-h-[44px] touch-manipulation"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm sm:text-base">Salvar Tarefa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Ação */}
      {modalEdicaoAberto && tarefaParaEditar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn">
          <div 
            className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-2xl font-bold text-white flex items-center space-x-2">
                  <Edit3 className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Editar Ação</span>
                </h3>
                {processoParaEdicao && (
                  <p className="text-white/90 text-xs sm:text-sm mt-1 sm:mt-1.5 flex items-center space-x-2">
                    <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">{processoParaEdicao.nome}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setModalEdicaoAberto(false)
                  setTarefaParaEditar(null)
                  setProcessoParaEdicao(null)
                  cancelarEdicao()
                }}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 sm:p-2 transition-all duration-200 flex-shrink-0"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto max-h-[calc(95vh-180px)] sm:max-h-[calc(90vh-180px)]">
              {/* Descrição da Ação */}
              <div className="group">
                <label className="block text-xs sm:text-sm font-semibold text-[#373435] mb-2 flex items-center space-x-2">
                  <Edit3 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                  <span>Descrição da Ação *</span>
                </label>
                <textarea
                  value={editandoTarefa.texto}
                  onChange={(e) => setEditandoTarefa({ ...editandoTarefa, texto: e.target.value })}
                  placeholder="Descreva a ação..."
                  rows={3}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none shadow-sm hover:border-gray-300 touch-manipulation"
                />
              </div>

              {/* Responsáveis (Múltipla Seleção) */}
              <div className="group">
                <label className="block text-xs sm:text-sm font-semibold text-[#373435] mb-2 flex items-center space-x-2">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                  <span>Responsáveis * (selecione um ou mais)</span>
                </label>
                <div className="border-2 border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto bg-white">
                  {usuarios.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">Nenhum usuário disponível</p>
                  ) : (
                    <div className="space-y-2">
                      {usuarios.map(usuario => (
                        <label
                          key={usuario.id}
                          className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                            responsaveisEdicaoSelecionados.includes(usuario.id) ? 'bg-blue-500/5' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={responsaveisEdicaoSelecionados.includes(usuario.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setResponsaveisEdicaoSelecionados([...responsaveisEdicaoSelecionados, usuario.id])
                              } else {
                                setResponsaveisEdicaoSelecionados(responsaveisEdicaoSelecionados.filter(id => id !== usuario.id))
                              }
                            }}
                            className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{usuario.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {responsaveisEdicaoSelecionados.length > 0 && (
                  <p className="text-xs text-blue-500 mt-2 flex items-center space-x-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{responsaveisEdicaoSelecionados.length} {responsaveisEdicaoSelecionados.length === 1 ? 'responsável selecionado' : 'responsáveis selecionados'}</span>
                  </p>
                )}
              </div>

              {/* Prazo */}
              <div className="group">
                <label className="block text-xs sm:text-sm font-semibold text-[#373435] mb-2 flex items-center space-x-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                  <span>Prazo</span>
                </label>
                <input
                  type="date"
                  value={editandoTarefa.dataLimite}
                  onChange={(e) => setEditandoTarefa({ ...editandoTarefa, dataLimite: e.target.value })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 min-h-[44px] touch-manipulation"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setModalEdicaoAberto(false)
                  setTarefaParaEditar(null)
                  setProcessoParaEdicao(null)
                  cancelarEdicao()
                }}
                className="w-full sm:w-auto px-4 sm:px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold flex items-center justify-center space-x-2 min-h-[44px] touch-manipulation"
              >
                <X className="h-4 w-4" />
                <span className="text-sm sm:text-base">Cancelar</span>
              </button>
              <button
                onClick={async () => {
                  console.log('🔵 Botão Salvar clicado')
                  try {
                    await salvarEdicaoTarefa(processoParaEdicao?.id)
                    // Limpar todos os estados após salvar
                    setModalEdicaoAberto(false)
                    setTarefaParaEditar(null)
                    setProcessoParaEdicao(null)
                    cancelarEdicao() // Limpar estado de edição
                    toast.success('✅ Ação editada com sucesso!')
                  } catch (error) {
                    console.error('❌ Erro ao salvar:', error)
                    toast.error('Erro ao salvar edição')
                  }
                }}
                disabled={!editandoTarefa.texto}
                className="w-full sm:w-auto px-5 sm:px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:shadow-none min-h-[44px] touch-manipulation"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm sm:text-base">Salvar Alterações</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {modalDeleteAberto && tarefaParaDeletar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn">
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-[#373435]">Excluir Ação</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Esta ação não pode ser desfeita</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6">
              <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">
                Tem certeza que deseja excluir a tarefa:
              </p>
              <div className="bg-gray-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-r-lg">
                <p className="font-semibold text-[#373435] text-sm sm:text-base break-words">{tarefaParaDeletar.texto}</p>
                {processoParaDeletar && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                    Processo: {processoParaDeletar.nome}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 rounded-b-2xl">
              <button
                onClick={() => {
                  setModalDeleteAberto(false)
                  setTarefaParaDeletar(null)
                  setProcessoParaDeletar(null)
                }}
                className="w-full sm:w-auto px-4 sm:px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-white transition-all font-semibold min-h-[44px] touch-manipulation text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await apagarTarefa(processoParaDeletar.id, tarefaParaDeletar.id)
                  setModalDeleteAberto(false)
                  setTarefaParaDeletar(null)
                  setProcessoParaDeletar(null)
                }}
                className="w-full sm:w-auto px-5 sm:px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl min-h-[44px] touch-manipulation text-sm sm:text-base"
              >
                <Trash2 className="h-4 w-4" />
                <span>Excluir Ação</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Importar Pack de Ações */}
      {modalImportarPackAberto && processoParaImportarPack && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#373435]">Importar Pack de Ações</h3>
                    <p className="text-sm text-gray-600 mt-1">{processoParaImportarPack.nome}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setModalImportarPackAberto(false)
                    setProcessoParaImportarPack(null)
                    setPacksDisponiveis([])
                  }}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {loadingPacks ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                  <p className="text-gray-600">Carregando packs disponíveis...</p>
                </div>
              ) : packsDisponiveis.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Package className="h-16 w-16 text-gray-300 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Nenhum pack disponível</h4>
                  <p className="text-gray-600 text-center max-w-md">
                    Não há packs de ações associados a este processo. Entre em contato com o Super Admin para criar packs.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Selecione um pack para importar as ações pré-definidas. Você poderá editar responsáveis e prazos depois.
                  </p>
                  
                  {packsDisponiveis.map((pack) => (
                    <div
                      key={pack.id}
                      className="border-2 border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-all cursor-pointer hover:shadow-md"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-[#373435] text-lg mb-1">{pack.name}</h4>
                          {pack.description && (
                            <p className="text-sm text-gray-600">{pack.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => importarPack(pack)}
                          className="ml-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold text-sm flex items-center space-x-2"
                        >
                          <Package className="h-4 w-4" />
                          <span>Importar</span>
                        </button>
                      </div>

                      {/* Preview das ações */}
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase">
                          {pack.templates.length} {pack.templates.length === 1 ? 'ação' : 'ações'}:
                        </p>
                        <div className="space-y-1.5">
                          {pack.templates.map((template, index) => (
                            <div key={template.id} className="flex items-start space-x-2 text-sm">
                              <span className="flex-shrink-0 w-5 h-5 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </span>
                              <p className="text-gray-700 flex-1">{template.title}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🔥 MODAL DE CONFIRMAÇÃO DE AMADURECIMENTO */}
      <MaturityConfirmModal
        isOpen={maturityConfirmModalOpen}
        onClose={() => {
          setMaturityConfirmModalOpen(false)
          setProcessForMaturityConfirm(null)
        }}
        onConfirm={executeMaturityConfirmation}
        processName={processForMaturityConfirm?.nome || processForMaturityConfirm?.name}
        progress={processProgressMap[processForMaturityConfirm?.id]}
      />
    </div>
  )
}

export default PlanejamentoEstrategico