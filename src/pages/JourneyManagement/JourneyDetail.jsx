import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import ProcessManagementModal from '../../components/processes/ProcessManagementModal'
import RequestProcessModal from '../../components/processes/RequestProcessModal'
import { getActiveCategories, createCategoriesMap } from '../../services/categoryService'
import { 
  Target, 
  Building2, 
  Users, 
  ChevronLeft,
  Search,
  Edit,
  Eye,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  TrendingUp,
  DollarSign,
  ArrowLeft,
  Home,
  Plus,
  Trash2,
  MoreVertical,
  EyeOff,
  FileText
} from 'lucide-react'

const JourneyDetail = () => {
  const { journeySlug } = useParams()
  const [searchParams] = useSearchParams()
  const companyId = searchParams.get('company')
  const navigate = useNavigate()
  const { profile } = useAuth()
  
  const [journey, setJourney] = useState(null)
  const [company, setCompany] = useState(null)
  const [processes, setProcesses] = useState([])
  const [categories, setCategories] = useState({}) // Mapa de categorias
  const [availableCategories, setAvailableCategories] = useState([]) // Array para dropdowns
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [usageFilter, setUsageFilter] = useState('all')
  const [selectedProcess, setSelectedProcess] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showProcessModal, setShowProcessModal] = useState(false)
  const [processToEdit, setProcessToEdit] = useState(null)
  const [showDropdownMenu, setShowDropdownMenu] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = useState(null)
  const [showToggleConfirm, setShowToggleConfirm] = useState(null)
  const [showRequestProcessModal, setShowRequestProcessModal] = useState(false)

  // Mapear dados das jornadas com cores BG2
  const journeysData = {
    'estrategica': {
      name: 'Jornada Estratégica',
      description: 'Planejamento estratégico, visão, missão, valores e direcionamento organizacional',
      icon: Target,
      color: '#EBA500',
      bgColor: 'bg-[#EBA500]',
      textColor: 'text-[#EBA500]',
      bgLight: 'bg-[#EBA500]/10',
      bgHover: 'hover:bg-[#EBA500]/20',
      categories: ['Visão e Propósito', 'Análise e Diagnóstico', 'Planejamento Estratégico', 'Execução e Monitoramento']
    },
    'financeira': {
      name: 'Jornada Financeira',
      description: 'Gestão financeira completa, fluxo de caixa, DRE, indicadores e planejamento orçamentário',
      icon: DollarSign,
      color: '#373435',
      bgColor: 'bg-[#373435]',
      textColor: 'text-[#373435]',
      bgLight: 'bg-[#373435]/10',
      bgHover: 'hover:bg-[#373435]/20',
      categories: ['Planejamento Financeiro', 'Controle Financeiro', 'Análise e Relatórios', 'Gestão de Riscos']
    },
    'pessoas-cultura': {
      name: 'Jornada Pessoas e Cultura',
      description: 'Gestão de pessoas, cultura organizacional, desenvolvimento e performance',
      icon: Users,
      color: '#EBA500',
      bgColor: 'bg-[#EBA500]',
      textColor: 'text-[#EBA500]',
      bgLight: 'bg-[#EBA500]/10',
      bgHover: 'hover:bg-[#EBA500]/20',
      categories: ['Recrutamento e Seleção', 'Desenvolvimento', 'Performance', 'Cultura Organizacional']
    },
    'receita-crm': {
      name: 'Jornada Receita/CRM',
      description: 'Gestão comercial, vendas, relacionamento com clientes e geração de receita',
      icon: TrendingUp,
      color: '#373435',
      bgColor: 'bg-[#373435]',
      textColor: 'text-[#373435]',
      bgLight: 'bg-[#373435]/10',
      bgHover: 'hover:bg-[#373435]/20',
      categories: ['Prospecção', 'Vendas', 'Relacionamento', 'Pós-Venda']
    },
    'operacional': {
      name: 'Jornada Operacional',
      description: 'Processos operacionais, qualidade, automações e excelência operacional',
      icon: Settings,
      color: '#EBA500',
      bgColor: 'bg-[#EBA500]',
      textColor: 'text-[#EBA500]',
      bgLight: 'bg-[#EBA500]/10',
      bgHover: 'hover:bg-[#EBA500]/20',
      categories: ['Processos', 'Qualidade', 'Produtividade', 'Automação']
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Limpar avaliações ao mudar de jornada
        setEvaluations([])
        
        // Obter dados da jornada
        const journeyData = journeysData[journeySlug]
        if (!journeyData) {
          console.error('Jornada não encontrada:', journeySlug)
          return
        }
        setJourney(journeyData)

        // Carregar categorias primeiro
        const categoriesData = await getActiveCategories()
        const categoriesMap = createCategoriesMap(categoriesData)
        setCategories(categoriesMap)
        setAvailableCategories(categoriesData)
        console.log('📂 Categorias carregadas:', categoriesData.length)

        // Carregar empresa se especificada
        if (companyId) {
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', companyId)
            .single()

          if (companyError) throw companyError
          setCompany(companyData)
        }

        // Carregar jornada do banco para obter o ID
        const { data: journeyDbData, error: journeyError } = await supabase
          .from('journeys')
          .select('id')
          .eq('slug', journeySlug)
          .single()

        if (journeyError) {
          console.warn('Jornada não encontrada no banco:', journeyError)
          return
        }

        // Carregar processos da jornada usando a view com dados da categoria
        const { data: processesData, error: processesError } = await supabase
          .from('processes_with_category')
          .select('*')
          .eq('journey_id', journeyDbData.id)
          .order('order_index')

        if (processesError) throw processesError
        setProcesses(processesData || [])

        // Carregar avaliações se uma empresa está selecionada
        if (companyId && processesData?.length > 0) {
          try {
            // Pegar IDs dos processos desta jornada
            const processIds = processesData.map(p => p.id)
            
            // Carregar APENAS avaliações dos processos desta jornada específica
            const { data: evaluationsData, error: evaluationsError } = await supabase
              .from('process_evaluations')
              .select(`
                id,
                process_id,
                company_id,
                business_importance,
                implementation_urgency,
                implementation_ease,
                priority_score,
                has_process,
                observations,
                status,
                evaluated_at,
                created_at,
                updated_at
              `)
              .eq('company_id', companyId)
              .in('process_id', processIds) // FILTRO CRÍTICO: só processos desta jornada

            if (evaluationsError) {
              console.warn('Erro ao carregar avaliações:', evaluationsError)
              setProcesses(processesData || [])
            } else {
              setEvaluations(evaluationsData || [])
              
              console.log(`✅ Jornada ${journeySlug}: ${evaluationsData?.length || 0} avaliações carregadas para ${processesData.length} processos`)
              
              // Enriquecer os processos com dados de avaliação
              const enrichedProcesses = processesData?.map(process => {
                const evaluation = evaluationsData?.find(evalData => evalData.process_id === process.id)
                
                return {
                  ...process,
                  // Usar os nomes corretos dos campos
                  business_importance: evaluation?.business_importance || null,
                  implementation_urgency: evaluation?.implementation_urgency || null,
                  implementation_ease: evaluation?.implementation_ease || null,
                  priority_score: evaluation?.priority_score || null,
                  evaluation_id: evaluation?.id || null,
                  evaluation_data: evaluation
                }
              }) || []
              
              setProcesses(enrichedProcesses)
            }
          } catch (error) {
            console.error('Erro ao processar avaliações:', error)
            setProcesses(processesData || [])
          }
        } else {
          setProcesses(processesData || [])
        }

      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [journeySlug, companyId])

  // Fechar menu dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdownMenu && !event.target.closest('[data-dropdown]')) {
        setShowDropdownMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdownMenu])

  // Obter status de avaliação para um processo
  const getProcessEvaluation = (processId) => {
    return evaluations.find(evaluation => evaluation.process_id === processId)
  }

  // Função para recarregar processos
  const reloadProcesses = async () => {
    try {
      const { data: journeyDbData, error: journeyError } = await supabase
        .from('journeys')
        .select('id')
        .eq('slug', journeySlug)
        .single()

      if (journeyError) return

      const { data: processesData, error: processesError } = await supabase
        .from('processes')
        .select('*')
        .eq('journey_id', journeyDbData.id)
        .order('order_index')

      if (!processesError) {
        setProcesses(processesData || [])
      }
    } catch (error) {
      console.error('Erro ao recarregar processos:', error)
    }
  }

  // Abrir modal para adicionar processo
  const handleAddProcess = () => {
    setProcessToEdit(null)
    setShowProcessModal(true)
  }

  // Abrir modal para editar processo
  const handleEditProcess = (process) => {
    setProcessToEdit(process)
    setShowProcessModal(true)
  }

  // Callback quando processo é salvo
  const handleProcessSaved = (savedProcess, action) => {
    if (action === 'created') {
      setProcesses(prev => [...prev, savedProcess])
    } else if (action === 'updated') {
      setProcesses(prev => prev.map(p => p.id === savedProcess.id ? savedProcess : p))
    }
    setShowProcessModal(false)
    setProcessToEdit(null)
  }

  // Verificar se o usuário é company admin
  const isCompanyAdmin = () => {
    if (!profile || !companyId) return false
    
    // Verificar se tem role de company_admin na tabela user_companies
    return profile.user_companies?.some(uc => 
      uc.company_id === companyId && 
      uc.role === 'company_admin' && 
      uc.is_active === true
    )
  }

  // Enviar solicitação de novo processo
  const handleRequestProcess = async (requestData) => {
    try {
      const { data, error } = await supabase
        .from('process_requests')
        .insert([{
          company_id: companyId,
          journey_slug: journeySlug,
          requested_by: profile.id,
          process_name: requestData.process_name,
          process_description: requestData.process_description,
          category: requestData.category,
          justification: requestData.justification,
          status: 'pending'
        }])
        .select()
        .single()

      if (error) throw error

      console.log('✅ Solicitação enviada:', data)
      alert('Solicitação enviada com sucesso! O Super Admin será notificado.')
      setShowRequestProcessModal(false)
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error)
      throw error
    }
  }

  // Confirmar exclusão de processo
  const handleDeleteProcess = async (processId) => {
    if (!showDeleteConfirm) return

    try {
      const { error } = await supabase
        .from('processes')
        .update({ is_active: false })
        .eq('id', processId)

      if (error) throw error

      // Remover da lista local
      setProcesses(prev => prev.filter(p => p.id !== processId))
      setShowDeleteConfirm(null)
      
      alert('Processo desativado com sucesso!')
    } catch (error) {
      console.error('Erro ao desativar processo:', error)
      alert('Erro ao desativar processo: ' + error.message)
    }
  }

  // Apagar processo permanentemente
  const handlePermanentDeleteProcess = async (processId) => {
    if (!showPermanentDeleteConfirm) return

    try {
      // Usar RPC para deletar processo com todas as dependências
      const { data, error: rpcError } = await supabase.rpc('delete_process_permanent', {
        p_process_id: processId
      })

      if (rpcError) {
        throw new Error(`Erro ao executar função de deleção: ${rpcError.message}`)
      }

      // Verificar se a função retornou sucesso
      if (data && !data.success) {
        throw new Error(data.error || 'Erro desconhecido ao deletar processo')
      }

      // Remover da lista local
      setProcesses(prev => prev.filter(p => p.id !== processId))
      setShowPermanentDeleteConfirm(null)
      
      // Mostrar mensagem de sucesso com detalhes
      const deletedInfo = data 
        ? `\n- ${data.evaluations_deleted} avaliações deletadas\n- ${data.history_deleted} registros de histórico deletados`
        : ''
      
      alert(`Processo apagado permanentemente com sucesso!${deletedInfo}`)
    } catch (error) {
      console.error('Erro ao apagar processo:', error)
      alert('Erro ao apagar processo: ' + error.message)
    }
  }

  // Alternar status do processo (ativar/desativar)
  const handleToggleProcessStatus = async () => {
    if (!showToggleConfirm) return

    try {
      const newStatus = !showToggleConfirm.is_active
      
      const { error } = await supabase
        .from('processes')
        .update({ 
          is_active: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', showToggleConfirm.id)

      if (error) throw error

      // Atualizar na lista local
      setProcesses(prev => prev.map(p => 
        p.id === showToggleConfirm.id 
          ? { ...p, is_active: newStatus }
          : p
      ))
      
      setShowToggleConfirm(null)
      
      alert(`Processo ${newStatus ? 'ativado' : 'desativado'} com sucesso!`)
    } catch (error) {
      console.error('Erro ao alterar status do processo:', error)
      alert('Erro ao alterar status do processo: ' + error.message)
    }
  }

  // Filtrar processos
  const filteredProcesses = processes.filter(process => {
    const matchesSearch = process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         process.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         process.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || process.category_id === selectedCategory // MUDOU: category → category_id
    
    const evaluation = getProcessEvaluation(process.id)
    const hasProcess = evaluation?.has_process ?? true
    const matchesUsage = usageFilter === 'all' || 
                        (usageFilter === 'utilized' && hasProcess) ||
                        (usageFilter === 'not-utilized' && !hasProcess)
    
    return matchesSearch && matchesCategory && matchesUsage
  })

  // Função para obter label da importância para o negócio
  const getBusinessImportanceLabel = (score) => {
    if (score === 5) return 'Muito importante'
    if (score === 4) return 'Importante'
    if (score === 3) return 'Pouco importante'
    if (score === 2) return 'Irrelevante'
    if (score === 1) return 'Irrelevante'
    return 'Não avaliado'
  }

  // Função para obter label da urgência para implementação
  const getImplementationUrgencyLabel = (score) => {
    if (score === 5) return 'Urgentíssimo'
    if (score === 4) return 'Muito urgente'
    if (score === 3) return 'Urgente'
    if (score === 2) return 'Pouco urgente'
    if (score === 1) return 'Sem urgência'
    return 'Não avaliado'
  }

  // Função para obter label da facilidade de implementação
  const getImplementationEaseLabel = (score) => {
    if (score === 5) return 'Sem esforço'
    if (score === 4) return 'Pouco esforço'
    if (score === 3) return 'Esforço mediano'
    if (score === 2) return 'Muito esforço'
    if (score === 1) return 'Difícil implementação'
    return 'Não avaliado'
  }

  // Função para mostrar detalhes do processo
  const showProcessDetails = (process) => {
    setSelectedProcess(process)
    setShowDetailsModal(true)
  }

  // Função para calcular nota de priorização (usar o campo já calculado ou calcular)
  const calculatePriorityScore = (process) => {
    const evaluation = process.evaluation_data || {}
    
    // Se o processo não é usado pela empresa, não há priorização
    if (evaluation.has_process === false) {
      return 0
    }
    
    // Se já existe o priority_score calculado, usar ele
    if (evaluation.priority_score) {
      return evaluation.priority_score
    }
    
    // Se não, calcular baseado nos campos disponíveis
    if (evaluation.business_importance && evaluation.implementation_urgency && evaluation.implementation_ease) {
      return Math.round(((evaluation.business_importance * 3 + evaluation.implementation_urgency * 2 + evaluation.implementation_ease * 1) / 6) * 100) / 100
    }
    
    return 0
  }

  // Função para obter cor da priorização
  const getPriorityColor = (score) => {
    if (score >= 4.5) return 'bg-red-100 text-red-800 border-red-200'
    if (score >= 3.5) return 'bg-orange-100 text-orange-800 border-orange-200'
    if (score >= 2.5) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (score >= 1.5) return 'bg-blue-100 text-blue-800 border-blue-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  // Função para obter label da priorização
  const getPriorityLabel = (score) => {
    if (score >= 4.5) return 'Crítica'
    if (score >= 3.5) return 'Alta'
    if (score >= 2.5) return 'Média'
    if (score >= 1.5) return 'Baixa'
    return 'Indefinida'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500] mx-auto"></div>
          <p className="mt-4 text-[#373435]">Carregando processos...</p>
        </div>
      </div>
    )
  }

  if (!journey) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-[#373435]">Jornada não encontrada</h1>
          <p className="mt-2 text-gray-600">A jornada "{journeySlug}" não foi encontrada.</p>
          <button
            onClick={() => navigate('/journey-management')}
            className="mt-4 text-[#EBA500] hover:text-[#EBA500]/80 font-medium"
          >
            Voltar ao gerenciamento
          </button>
        </div>
      </div>
    )
  }

  const Icon = journey.icon

  // Modal de detalhes do processo
  const ProcessDetailsModal = () => {
    if (!selectedProcess) return null

    const priorityScore = calculatePriorityScore(selectedProcess)
    const evaluation = selectedProcess.evaluation_data || {}

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-2xl text-sm font-medium bg-gradient-to-r from-[#373435]/10 to-[#373435]/20 text-[#373435] border border-[#373435]/20">
                    {journey.name.replace('Jornada ', '')}/{selectedProcess.name}
                  </span>
                  {selectedProcess.category_name && (
                    <span className="inline-flex items-center px-3 py-1 rounded-2xl text-sm font-medium bg-gradient-to-r from-[#EBA500]/20 to-[#EBA500]/30 text-[#EBA500] border border-[#EBA500]/30">
                      {selectedProcess.category_name}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-[#373435]">{selectedProcess.description || selectedProcess.name}</h3>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-all duration-200"
              >
                ✕
              </button>
            </div>

            {/* Descrição */}
            {selectedProcess.description && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-[#373435] mb-3">Descrição</h4>
                <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl">
                  {selectedProcess.description}
                </p>
              </div>
            )}

            {/* Métricas de Priorização */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-[#373435]">Análise de Priorização</h4>
                {selectedProcess.evaluation_id && (
                  <div className="flex items-center space-x-2 text-sm bg-green-100 text-green-800 px-3 py-1 rounded-2xl border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Processo Avaliado</span>
                  </div>
                )}
              </div>
              
              {evaluation.has_process === true ? (
                <div className="bg-green-50 p-6 rounded-2xl border border-green-200 text-center">
                  <div className="text-green-500 text-2xl mb-3">✅</div>
                  <h5 className="font-semibold text-green-800 mb-2">Processo Amadurecido</h5>
                  <p className="text-sm text-green-700">
                    A empresa já possui este processo amadurecido, não entra no cálculo de prioridade.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Importância para o Negócio */}
                    <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-indigo-800">Importância para o Negócio</h5>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div
                              key={star}
                              className={`w-4 h-4 rounded-full ${
                                star <= (evaluation.business_importance || 0)
                                  ? 'bg-indigo-500'
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-indigo-700">
                        {evaluation.business_importance ? 
                          `${evaluation.business_importance}/5 - ${getBusinessImportanceLabel(evaluation.business_importance)}` : 
                          'Ainda não avaliado'
                        }
                      </p>
                    </div>

                {/* Urgência para Implementação */}
                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-orange-800">Urgência para Implementação</h5>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div
                          key={star}
                          className={`w-4 h-4 rounded-full ${
                            star <= (evaluation.implementation_urgency || 0)
                              ? 'bg-orange-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-orange-700">
                    {evaluation.implementation_urgency ? 
                      `${evaluation.implementation_urgency}/5 - ${getImplementationUrgencyLabel(evaluation.implementation_urgency)}` : 
                      'Ainda não avaliado'
                    }
                  </p>
                </div>

                {/* Facilidade para Implementar */}
                <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-green-800">Facilidade para Implementar</h5>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div
                          key={star}
                          className={`w-4 h-4 rounded-full ${
                            star <= (evaluation.implementation_ease || 0)
                              ? 'bg-green-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-green-700">
                    {evaluation.implementation_ease ? 
                      `${evaluation.implementation_ease}/5 - ${getImplementationEaseLabel(evaluation.implementation_ease)}` : 
                      'Ainda não avaliado'
                    }
                  </p>
                </div>

                {/* Nota de Priorização */}
                <div className={`p-6 rounded-2xl border ${priorityScore > 0 ? getPriorityColor(priorityScore) : 'bg-gray-50 border-gray-200'}`}>
                  <div className="text-center">
                    <h5 className="font-semibold mb-2">Nota de Priorização</h5>
                    <div className="text-3xl font-bold mb-1">
                      {priorityScore > 0 ? priorityScore.toFixed(1) : 'N/A'}
                    </div>
                    <p className="text-sm font-medium">
                      {priorityScore > 0 ? getPriorityLabel(priorityScore) : 'Necessária avaliação completa'}
                    </p>
                    {priorityScore === 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Avalie importância, urgência e facilidade para calcular
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Observações */}
              {evaluation.observations && (
                <div className="mt-6 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <h5 className="font-semibold text-gray-800 mb-2">Observações</h5>
                  <p className="text-sm text-gray-600">{evaluation.observations}</p>
                </div>
              )}
                </>
              )}

              {/* Se não há avaliação */}
              {!selectedProcess.evaluation_id && (
                <div className="mt-6 bg-yellow-50 p-6 rounded-2xl border border-yellow-100 text-center">
                  <h5 className="font-semibold text-yellow-800 mb-2">Processo Não Avaliado</h5>
                  <p className="text-sm text-yellow-700">
                    Este processo ainda não foi avaliado para esta empresa.
                  </p>
                </div>
              )}
            </div>

            {/* Informações Adicionais */}
            <div className="pt-6 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Peso do Processo:</span>
                  <span className="ml-2 font-medium text-[#373435]">{selectedProcess.weight || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Ordem:</span>
                  <span className="ml-2 font-medium text-[#373435]">{selectedProcess.order_index || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 text-[#373435] bg-gray-100 hover:bg-gray-200 rounded-2xl font-medium transition-all duration-200"
              >
                Fechar
              </button>
              {company && (
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    navigate(`/journey-management/${journeySlug}/${selectedProcess.id}/evaluate?company=${companyId}`)
                  }}
                  className="flex items-center space-x-2 px-6 py-2 bg-[#EBA500] hover:bg-[#EBA500]/90 text-white rounded-2xl font-medium transition-all duration-200"
                >
                  <Edit className="h-4 w-4" />
                  <span>{selectedProcess.evaluation_id ? 'Editar Avaliação' : 'Avaliar Processo'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/journey-management')}
                  className="flex items-center space-x-2 px-4 py-2 text-[#373435] bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-[#EBA500]/30 transition-all duration-200 shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm font-medium">Voltar</span>
                </button>
                
                <div className={`p-4 rounded-2xl ${journey.bgColor} shadow-sm`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold text-[#373435]">{journey.name}</h1>
                  <p className="mt-2 text-base text-gray-600">{journey.description}</p>
                </div>
              </div>
              
              {company && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 bg-[#EBA500]/10 px-3 py-2 rounded-2xl">
                    <Building2 className="h-4 w-4 text-[#EBA500]" />
                    <span className="text-[#373435] font-medium">Empresa: {company.name}</span>
                  </div>
                  
                  <button
                    onClick={() => navigate(`/journey-management/${journeySlug}`)}
                    className="text-sm text-red-500 hover:text-red-600 font-medium"
                  >
                    Remover filtro
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros e Busca */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200/50 p-8 mb-8">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar processos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] sm:text-sm transition-all duration-200"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full pl-4 pr-10 py-3 text-base border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] sm:text-sm rounded-2xl transition-all duration-200"
              >
                <option value="all">Todas as categorias</option>
                {availableCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <select
                value={usageFilter}
                onChange={(e) => setUsageFilter(e.target.value)}
                className="block w-full pl-4 pr-10 py-3 text-base border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] sm:text-sm rounded-2xl transition-all duration-200"
              >
                <option value="all">Todos os processos</option>
                <option value="utilized">Utilizados</option>
                <option value="not-utilized">Em processo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        {company && evaluations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <EyeOff className="h-8 w-8 text-gray-500" />
                </div>
                <div className="ml-4">
                  <div className="text-lg font-medium text-[#373435]">
                    {processes.filter(p => !p.is_active).length}
                  </div>
                  <div className="text-sm text-gray-500">Desativados</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <div className="text-lg font-medium text-[#373435]">
                    {evaluations.filter(e => e.has_process === true).length}
                  </div>
                  <div className="text-sm text-gray-500">Amadurecidos</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-8 w-8 text-orange-400" />
                </div>
                <div className="ml-4">
                  <div className="text-lg font-medium text-[#373435]">
                    {evaluations.filter(e => e.has_process === false).length}
                  </div>
                  <div className="text-sm text-gray-500">Em Processo</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-4">
                  <div className="text-lg font-medium text-[#373435]">
                    {processes.length - evaluations.length}
                  </div>
                  <div className="text-sm text-gray-500">Não Avaliados</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Progresso de Amadurecimento */}
        {company && processes.filter(p => p.is_active).length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#373435]">Progresso de Amadurecimento</h4>
                  <p className="text-xs text-gray-500">Processos amadurecidos nesta jornada</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {processes.filter(p => p.is_active).length > 0 
                    ? ((evaluations.filter(e => e.has_process === true).length / processes.filter(p => p.is_active).length) * 100).toFixed(2)
                    : '0.00'
                  }%
                </div>
                <div className="text-xs text-gray-500">
                  {evaluations.filter(e => e.has_process === true).length} de {processes.filter(p => p.is_active).length} processos
                </div>
              </div>
            </div>
            
            {/* Barra de Progresso */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${processes.filter(p => p.is_active).length > 0 
                    ? ((evaluations.filter(e => e.has_process === true).length / processes.filter(p => p.is_active).length) * 100).toFixed(2)
                    : 0
                  }%` 
                }}
              ></div>
            </div>
            
            {/* Detalhamento */}
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>0%</span>
              <span className="text-blue-600 font-medium">
                {processes.filter(p => p.is_active).length > 0 
                  ? `${((evaluations.filter(e => e.has_process === true).length / processes.filter(p => p.is_active).length) * 100).toFixed(2)}% amadurecido`
                  : 'Nenhum processo ativo'
                }
              </span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Lista de Processos */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200/50">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#373435]">
              Processos ({filteredProcesses.length} de {processes.length})
            </h3>
            
            <div className="flex items-center space-x-3">
              {/* Botão Adicionar Processo - Apenas para Super Admin */}
              {profile?.role === 'super_admin' && (
                <button
                  onClick={handleAddProcess}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#EBA500] hover:bg-[#EBA500]/90 text-white text-sm font-medium rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md"
                  title="Adicionar novo processo"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar Processo</span>
                </button>
              )}

              {/* Botão Solicitar Processo - Apenas para Company Admin */}
              {isCompanyAdmin() && profile?.role !== 'super_admin' && (
                <button
                  onClick={() => setShowRequestProcessModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md"
                  title="Solicitar criação de novo processo"
                >
                  <FileText className="h-4 w-4" />
                  <span>Solicitar Processo</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {filteredProcesses.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Nenhum processo encontrado.</p>
              </div>
            ) : (
              filteredProcesses.map((process) => {
                const evaluation = getProcessEvaluation(process.id)
                
                return (
                  <div key={process.id} className={`p-6 transition-all duration-200 ${
                    process.is_active 
                      ? 'hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-[#EBA500]/5' 
                      : 'bg-gray-50/30 opacity-60'
                  }`}>
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        {/* Badges no topo */}
                        <div className="flex items-center gap-2 mb-3">
                          {process.category_name && (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                              process.is_active
                                ? 'bg-gradient-to-r from-[#EBA500]/20 to-[#EBA500]/30 text-[#EBA500] border-[#EBA500]/30'
                                : 'bg-gray-200 text-gray-500 border-gray-300'
                            }`}>
                              {process.category_name}
                            </span>
                          )}
                          
                          {!process.is_active && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600 border border-red-200">
                              Desativado
                            </span>
                          )}
                        </div>
                        
                        {/* Título do Processo (name) em destaque */}
                        <h4 className={`text-2xl font-bold mb-2 ${
                          process.is_active ? 'text-[#373435]' : 'text-gray-500'
                        }`}>
                          {process.name}
                        </h4>
                        
                        {/* Descrição menor */}
                        {process.description && (
                          <p className={`text-sm leading-relaxed ${
                            process.is_active ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            {process.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 ml-6">
                        {evaluation ? (
                          <div className="text-right">
                            {evaluation.has_process === true ? (
                              <div className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300">
                                <span className="mr-2">🏆</span>
                                Processo Amadurecido
                              </div>
                            ) : (
                              <div className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                                <span className="mr-2">✅</span>
                                Processo Avaliado
                              </div>
                            )}
                          </div>
                        ) : company ? (
                          <div className="text-right">
                            <div className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              <span className="mr-2">⏳</span>
                              Não Avaliado
                            </div>
                          </div>
                        ) : null}
                        
                        <div className="flex space-x-2">
                          {/* Botão de Ativar para processos inativos */}
                          {!process.is_active && (
                            <button
                              onClick={() => setShowToggleConfirm(process)}
                              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Ativar processo"
                            >
                              <Eye className="h-4 w-4" />
                              <span>Ativar</span>
                            </button>
                          )}
                          
                          {/* Botões de Admin - Menu dropdown apenas para processos ativos */}
                          {process.is_active && (
                            <div className="relative">
                              <button
                                onClick={() => setShowDropdownMenu(showDropdownMenu === process.id ? null : process.id)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Mais opções"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                              
                              {/* Menu dropdown */}
                              {showDropdownMenu === process.id && (
                                <div 
                                  data-dropdown
                                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                                >
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        handleEditProcess(process)
                                        setShowDropdownMenu(null)
                                      }}
                                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                                    >
                                      <Edit className="h-4 w-4" />
                                      <span>Editar Processo</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setShowDropdownMenu(null)
                                        setShowToggleConfirm(process)
                                      }}
                                      className="flex items-center space-x-2 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 w-full text-left"
                                    >
                                      <EyeOff className="h-4 w-4" />
                                      <span>Desativar Processo</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setShowDropdownMenu(null)
                                        setShowPermanentDeleteConfirm(process)
                                      }}
                                      className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left border-t border-gray-100"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span>Apagar Permanentemente</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {process.is_active && (
                            <button
                              onClick={() => showProcessDetails(process)}
                              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#373435] text-sm font-medium rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                              <span>Ver Detalhes</span>
                            </button>
                          )}
                          
                          {company && process.is_active && (
                            <button
                              onClick={() => navigate(`/journey-management/${journeySlug}/${process.id}/evaluate?company=${companyId}`)}
                              className="flex items-center space-x-2 px-4 py-2 bg-[#EBA500] hover:bg-[#EBA500]/90 text-white text-sm font-medium rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Avaliar processo"
                            >
                              <Edit className="h-4 w-4" />
                              <span>Avaliar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {showDetailsModal && <ProcessDetailsModal />}
      
      {/* Modal de Adicionar/Editar Processo */}
      {showProcessModal && (
        <ProcessManagementModal
          isOpen={showProcessModal}
          onClose={() => {
            setShowProcessModal(false)
            setProcessToEdit(null)
          }}
          journey={{ ...journey, id: processes[0]?.journey_id, slug: journeySlug }}
          company={company}
          processToEdit={processToEdit}
          onProcessSaved={handleProcessSaved}
          existingProcesses={processes}
        />
      )}

      {/* Modal de Solicitar Processo */}
      {showRequestProcessModal && (
        <RequestProcessModal
          isOpen={showRequestProcessModal}
          onClose={() => setShowRequestProcessModal(false)}
          journey={journey}
          company={company}
          onRequestSubmitted={handleRequestProcess}
        />
      )}
      
      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirmar Remoção</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              Tem certeza que deseja remover este processo? Esta ação não pode ser desfeita.
            </p>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteProcess(showDeleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Deleção Permanente */}
      {showPermanentDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">⚠️ Apagar Permanentemente</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-900 font-medium mb-2">
                Esta ação irá remover permanentemente o processo "{showPermanentDeleteConfirm.name}" do banco de dados.
              </p>
              <p className="text-sm text-red-600 font-medium">
                ⚠️ ATENÇÃO: Esta ação NÃO PODE ser desfeita!
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Todas as avaliações associadas a este processo também serão removidas.
              </p>
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowPermanentDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handlePermanentDeleteProcess(showPermanentDeleteConfirm.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-lg"
              >
                Sim, Apagar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Ativar/Desativar */}
      {showToggleConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-2 rounded-lg ${
                showToggleConfirm.is_active ? 'bg-orange-100' : 'bg-green-100'
              }`}>
                {showToggleConfirm.is_active ? (
                  <EyeOff className="h-5 w-5 text-orange-600" />
                ) : (
                  <Eye className="h-5 w-5 text-green-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {showToggleConfirm.is_active ? 'Desativar Processo' : 'Ativar Processo'}
              </h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              {showToggleConfirm.is_active 
                ? `Tem certeza que deseja desativar o processo "${showToggleConfirm.name}"? Ele ficará visível mas não poderá ser avaliado.`
                : `Tem certeza que deseja ativar o processo "${showToggleConfirm.name}"? Ele voltará a ficar disponível para avaliação.`
              }
            </p>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowToggleConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleToggleProcessStatus}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  showToggleConfirm.is_active
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {showToggleConfirm.is_active ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default JourneyDetail