import React, { useState, useEffect } from 'react'
import { Plus, User, Clock, CheckCircle2, AlertTriangle, Calendar, Edit3, Trash2, Save, X, Target, DollarSign, Users, TrendingUp, Settings, Sparkles, Lock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions as useAuthPermissions } from '../../hooks/useAuth'
import { usePriorityProcesses } from '../../hooks/usePriorityProcesses2'

const PlanejamentoEstrategico = () => {
  const { profile } = useAuth()
  const { getAccessibleJourneys } = useAuthPermissions()
  const { priorityProcesses, loading: processesLoading, error: processesError, getProcessesByJourney, debugLogs } = usePriorityProcesses()
  
  const [jornadas, setJornadas] = useState([])
  const [jornadaSelecionada, setJornadaSelecionada] = useState(null)
  const [processos, setProcessos] = useState([])
  const [tarefas, setTarefas] = useState({})
  const [novaTask, setNovaTask] = useState({ processo: null, texto: '', responsavel: '', visible: false })
  const [editandoTarefa, setEditandoTarefa] = useState({ id: null, texto: '', responsavel: '' })
  const [jornadasAtribuidas, setJornadasAtribuidas] = useState([])
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState([])

  // Função para adicionar logs de debug específicos
  const addDebugLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo(prev => [...prev.slice(-10), { // Manter apenas os últimos 10 logs
      id: Date.now(),
      timestamp,
      message,
      type
    }])
  }

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
    { id: 4, nome: 'Receita & CRM', slug: 'receita-crm', cor: 'bg-orange-500', corTexto: 'text-orange-700' },
    { id: 5, nome: 'Operacional', slug: 'operacional', cor: 'bg-red-500', corTexto: 'text-red-700' }
  ]

  // Debug do estado dos processos
  useEffect(() => {
    if (processesError) {
      addDebugLog(`❌ Erro ao carregar processos: ${processesError}`, 'error')
    }
    
    if (!processesLoading && priorityProcesses) {
      const totalProcesses = Object.values(priorityProcesses).reduce((acc, processes) => acc + processes.length, 0)
      addDebugLog(`✅ Processos prioritários carregados: ${totalProcesses} no total`, 'success')
      
      Object.entries(priorityProcesses).forEach(([journeyId, processes]) => {
        if (processes.length > 0) {
          addDebugLog(`📋 Jornada ${journeyId}: ${processes.length} processos (${processes.map(p => p.nome).join(', ')})`, 'info')
        }
      })
    }
    
    if (processesLoading) {
      addDebugLog('🔍 Carregando processos prioritários da base de dados...', 'info')
    }
  }, [processesLoading, priorityProcesses, processesError])

  // Usuários mock para responsáveis
  const usuariosMock = [
    'Ana Silva', 'João Santos', 'Maria Oliveira', 'Pedro Costa', 
    'Laura Ferreira', 'Carlos Lima', 'Sofia Ribeiro', 'Miguel Torres'
  ]

  useEffect(() => {
  const loadData = async () => {
      console.log('🚀 Carregando jornadas para:', profile?.email)
      setLoading(true)
      setJornadas(jornadasMock)
      
      // Aguardar até que getAccessibleJourneys esteja disponível
      if (!getAccessibleJourneys) {
        console.warn('⏳ getAccessibleJourneys ainda não disponível')
        setLoading(false)
        return
      }
      
      // Se for Super Admin, dar acesso a todas as jornadas
      if (profile?.role === 'super_admin') {
        console.log('👑 Super Admin - liberando todas as jornadas')
        const todasJornadas = ['estrategica', 'financeira', 'pessoas-cultura', 'receita-crm', 'operacional']
        setJornadasAtribuidas(todasJornadas)
        addDebugLog(`👑 Super Admin - todas as jornadas liberadas: ${todasJornadas.join(', ')}`)
        setLoading(false)
        return
      }
      
      // Buscar jornadas atribuídas ao usuário
      try {
        const assignedJourneySlugs = await getAccessibleJourneys()
        console.log('✅ Jornadas atribuídas:', assignedJourneySlugs)
        addDebugLog(`✅ Jornadas atribuídas ao usuário: ${assignedJourneySlugs?.join(', ') || 'nenhuma'}`)
        setJornadasAtribuidas(assignedJourneySlugs || [])
        
      } catch (error) {
        console.error('❌ Erro ao buscar jornadas:', error)
        addDebugLog(`❌ Erro ao buscar jornadas: ${error.message}`)
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
  }, [profile?.role]) // Apenas profile.role como dependência para evitar loops

  // Debug das jornadas quando o estado mudar
  useEffect(() => {
    if (jornadasAtribuidas.length > 0) {
      jornadasMock.forEach(jornada => {
        const isIncluded = jornadasAtribuidas.includes(jornada.slug)
        addDebugLog(`🎯 ${jornada.nome} (${jornada.slug}): ${isIncluded ? '✅ LIBERADA' : '❌ BLOQUEADA'}`)
      })
    }
  }, [jornadasAtribuidas])

  const selecionarJornada = (jornada) => {
    // Só permite selecionar se a jornada estiver atribuída
    if (!isJornadaAtribuida(jornada)) {
      addDebugLog(`🚫 Jornada ${jornada.slug} não atribuída, bloqueando seleção`, 'warning')
      return
    }
    
    addDebugLog(`✅ Selecionando jornada ${jornada.nome} (ID: ${jornada.id})`, 'success')
    setJornadaSelecionada(jornada)
    
    // Buscar processos reais da jornada
    const processosReais = getProcessesByJourney(jornada.id)
    addDebugLog(`� Processos reais encontrados: ${processosReais?.length || 0}`, 'info')
    
    if (processosReais && processosReais.length > 0) {
      setProcessos(processosReais)
      addDebugLog(`✅ Usando ${processosReais.length} processos REAIS da base de dados`, 'success')
      processosReais.forEach((processo, index) => {
        addDebugLog(`  ${index + 1}. ${processo.nome} (Score: ${processo.priority_score})`, 'info')
      })
    } else {
      // Fallback para dados mock se não houver processos reais
      addDebugLog('⚠️ Nenhum processo real encontrado, usando dados MOCK', 'warning')
      const processosMock = {
        1: [
          { id: 11, nome: 'Análise SWOT', prioridade: 1 },
          { id: 12, nome: 'Planejamento 2025', prioridade: 2 },
          { id: 13, nome: 'Definição KPIs', prioridade: 3 },
          { id: 14, nome: 'Budget Review', prioridade: 4 },
          { id: 15, nome: 'Market Research', prioridade: 5 }
        ],
        2: [
          { id: 21, nome: 'Fluxo de Caixa', prioridade: 1 },
          { id: 22, nome: 'Auditoria Q4', prioridade: 2 },
          { id: 23, nome: 'Cost Center Review', prioridade: 3 },
          { id: 24, nome: 'Tax Planning', prioridade: 4 },
          { id: 25, nome: 'Investment Analysis', prioridade: 5 }
        ],
        3: [
          { id: 31, nome: 'Recrutamento Dev', prioridade: 1 },
          { id: 32, nome: 'Treinamento Equipe', prioridade: 2 },
          { id: 33, nome: 'Performance Review', prioridade: 3 },
          { id: 34, nome: 'Engagement Survey', prioridade: 4 },
          { id: 35, nome: 'Benefits Review', prioridade: 5 }
        ],
        4: [
          { id: 41, nome: 'Campanha Q1', prioridade: 1 },
          { id: 42, nome: 'Lead Generation', prioridade: 2 },
          { id: 43, nome: 'CRM Update', prioridade: 3 },
          { id: 44, nome: 'Sales Training', prioridade: 4 },
          { id: 45, nome: 'Market Expansion', prioridade: 5 }
        ],
        5: [
          { id: 51, nome: 'Process Optimization', prioridade: 1 },
          { id: 52, nome: 'System Upgrade', prioridade: 2 },
          { id: 53, nome: 'Quality Assurance', prioridade: 3 },
          { id: 54, nome: 'Supply Chain Review', prioridade: 4 },
          { id: 55, nome: 'Capacity Planning', prioridade: 5 }
        ]
      }
      setProcessos(processosMock[jornada.id] || [])
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

  const adicionarTarefa = () => {
    if (!novaTask.texto.trim() || !novaTask.responsavel || !novaTask.processo) return

    const novaTarefa = {
      id: Date.now(),
      texto: novaTask.texto,
      responsavel: novaTask.responsavel,
      status: 'em_andamento',
      criadoEm: new Date().toISOString(),
      criadoPor: profile?.full_name || 'Gestor'
    }

    const novasTarefas = {
      ...tarefas,
      [novaTask.processo]: [...(tarefas[novaTask.processo] || []), novaTarefa]
    }

    setTarefas(novasTarefas)
    localStorage.setItem('tarefas_planejamento', JSON.stringify(novasTarefas))
    
    setNovaTask({ processo: null, texto: '', responsavel: '', visible: false })
  }

  const alterarStatusTarefa = (processoId, tarefaId, novoStatus) => {
    const novasTarefas = {
      ...tarefas,
      [processoId]: tarefas[processoId].map(tarefa =>
        tarefa.id === tarefaId ? { ...tarefa, status: novoStatus } : tarefa
      )
    }
    setTarefas(novasTarefas)
    localStorage.setItem('tarefas_planejamento', JSON.stringify(novasTarefas))
  }

  const iniciarEdicaoTarefa = (tarefa) => {
    setEditandoTarefa({
      id: tarefa.id,
      texto: tarefa.texto,
      responsavel: tarefa.responsavel
    })
  }

  const cancelarEdicao = () => {
    setEditandoTarefa({ id: null, texto: '', responsavel: '' })
  }

  const salvarEdicaoTarefa = (processoId) => {
    if (!editandoTarefa.texto.trim() || !editandoTarefa.responsavel) return

    const novasTarefas = {
      ...tarefas,
      [processoId]: tarefas[processoId].map(tarefa =>
        tarefa.id === editandoTarefa.id 
          ? { 
              ...tarefa, 
              texto: editandoTarefa.texto,
              responsavel: editandoTarefa.responsavel,
              editadoEm: new Date().toISOString(),
              editadoPor: profile?.full_name || 'Gestor'
            } 
          : tarefa
      )
    }
    setTarefas(novasTarefas)
    localStorage.setItem('tarefas_planejamento', JSON.stringify(novasTarefas))
    cancelarEdicao()
  }

  const apagarTarefa = (processoId, tarefaId) => {
    if (!confirm('Tem certeza que deseja apagar esta tarefa?')) return

    const novasTarefas = {
      ...tarefas,
      [processoId]: tarefas[processoId].filter(tarefa => tarefa.id !== tarefaId)
    }
    setTarefas(novasTarefas)
    localStorage.setItem('tarefas_planejamento', JSON.stringify(novasTarefas))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'em_andamento': return 'bg-[#EBA500]/20 text-[#EBA500] border-[#EBA500]/40'
      case 'concluido': return 'bg-green-100 text-green-700 border-green-300'
      case 'atrasado': return 'bg-red-100 text-red-700 border-red-300'
      default: return 'bg-[#373435]/10 text-[#373435] border-[#373435]/30'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'em_andamento': return 'Em Andamento'
      case 'concluido': return 'Concluído'
      case 'atrasado': return 'Atrasado'
      default: return 'Indefinido'
    }
  }

  const formatarData = (dataISO) => {
    const data = new Date(dataISO)
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
      {(loading || processesLoading) ? (
        <div className="px-8 py-12">
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
        <div className="px-8 py-12 text-center">
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
        <div className="px-8 space-y-8">
        {/* Jornadas - 5 quadrados horizontais elegantes */}
        <div className="grid grid-cols-5 gap-6">
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

      {/* Card de Debug - Processos Prioritários */}
      {(debugInfo.length > 0 || debugLogs.length > 0) && (
        <div className="bg-white rounded-3xl shadow-lg border border-[#373435]/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#373435] flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#EBA500] rounded-xl flex items-center justify-center">
                <span className="text-white text-sm">🔍</span>
              </div>
              <span>Debug - Processos Prioritários</span>
            </h3>
            <button 
              onClick={() => setDebugInfo([])}
              className="text-[#373435]/60 hover:text-[#373435] px-3 py-1 rounded-lg hover:bg-[#373435]/10 transition-colors text-sm"
            >
              Limpar
            </button>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {/* Logs do Hook */}
            {debugLogs.map((log, index) => (
              <div key={`hook-${index}`} className="flex items-start space-x-3 p-3 rounded-xl text-sm bg-purple-50 border border-purple-200">
                <span className="font-mono text-xs flex-shrink-0 text-purple-600">{log.timestamp}</span>
                <span className="flex-1 text-purple-800">[HOOK] {log.message}</span>
              </div>
            ))}
            
            {/* Logs do Componente */}
            {debugInfo.map((log) => (
              <div 
                key={log.id} 
                className={`flex items-start space-x-3 p-3 rounded-xl text-sm ${
                  log.type === 'error' ? 'bg-red-50 border border-red-200' :
                  log.type === 'success' ? 'bg-green-50 border border-green-200' :
                  log.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-blue-50 border border-blue-200'
                }`}
              >
                <span className={`font-mono text-xs flex-shrink-0 ${
                  log.type === 'error' ? 'text-red-600' :
                  log.type === 'success' ? 'text-green-600' :
                  log.type === 'warning' ? 'text-yellow-600' :
                  'text-blue-600'
                }`}>
                  {log.timestamp}
                </span>
                <span className={`flex-1 ${
                  log.type === 'error' ? 'text-red-800' :
                  log.type === 'success' ? 'text-green-800' :
                  log.type === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  [COMP] {log.message}
                </span>
              </div>
            ))}
            
            {debugInfo.length === 0 && debugLogs.length === 0 && (
              <div className="text-center py-4 text-[#373435]/60">
                Nenhum log de debug disponível
              </div>
            )}
          </div>
        </div>
      )}

      {/* Processos da jornada selecionada */}
      {jornadaSelecionada && (
        <div className="space-y-8">
          {/* Header da Seção de Processos */}
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

          {/* Grid dos 5 processos elegante */}
          <div className="grid grid-cols-5 gap-6">
            {processos.map((processo) => {
              const coresJornada = getJornadaCores(jornadaSelecionada.id)
              return (
                <div key={processo.id} className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-[#373435]/10 hover:border-[#EBA500]/30 overflow-hidden flex flex-col h-fit min-h-[500px]">
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

                      <div className="flex items-center justify-between text-xs text-[#373435]/60 mb-3">
                        <span className="font-medium">
                          {(tarefas[processo.id] || []).length} tarefas
                        </span>
                        <span className={`px-2 py-1 bg-gray-100 text-[#373435] rounded-full font-medium text-xs whitespace-nowrap`}>
                          Prioridade {processo.prioridade}
                        </span>
                      </div>
                      
                      {/* Botão Adicionar Tarefa Elegante */}
                      <button
                        onClick={() => setNovaTask({ 
                          ...novaTask, 
                          processo: processo.id, 
                          visible: novaTask.processo === processo.id ? !novaTask.visible : true 
                        })}
                        className={`w-full ${coresJornada.iconBg} hover:opacity-90 text-white px-3 py-2 rounded-2xl hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 font-semibold text-xs group-hover:scale-[1.02]`}
                      >
                        <Plus className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">Adicionar Tarefa</span>
                      </button>
                    </div>
                  </div>

                {/* Formulário de Nova Tarefa Elegante */}
                {novaTask.visible && novaTask.processo === processo.id && (
                  <div className="relative bg-[#EBA500]/5 border-b border-[#373435]/10 flex-shrink-0">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-white/50"></div>
                    
                    <div className="relative z-10 p-4 space-y-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-[#EBA500] rounded-full"></div>
                        <span className="text-[#373435] font-semibold text-xs">Nova Tarefa</span>
                      </div>
                      
                      <textarea
                        value={novaTask.texto}
                        onChange={(e) => setNovaTask({ ...novaTask, texto: e.target.value })}
                        placeholder="Descreva a tarefa..."
                        className="w-full p-3 border-2 border-[#373435]/10 focus:border-[#EBA500] focus:ring-2 focus:ring-[#EBA500]/20 rounded-xl text-xs resize-none bg-white/90 backdrop-blur-sm transition-all duration-300 placeholder-[#373435]/40"
                        rows="2"
                      />
                      
                      <select
                        value={novaTask.responsavel}
                        onChange={(e) => setNovaTask({ ...novaTask, responsavel: e.target.value })}
                        className="w-full p-3 border-2 border-[#373435]/10 focus:border-[#EBA500] focus:ring-2 focus:ring-[#EBA500]/20 rounded-xl text-xs bg-white/90 backdrop-blur-sm transition-all duration-300"
                      >
                        <option value="">Selecionar responsável</option>
                        {usuariosMock.map(usuario => (
                          <option key={usuario} value={usuario}>{usuario}</option>
                        ))}
                      </select>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={adicionarTarefa}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-1"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span className="truncate">Criar</span>
                        </button>
                        <button
                          onClick={() => setNovaTask({ processo: null, texto: '', responsavel: '', visible: false })}
                          className="flex-1 bg-[#373435]/60 hover:bg-[#373435]/80 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-1"
                        >
                          <X className="h-3 w-3" />
                          <span className="truncate">Cancelar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de Tarefas Elegante */}
                <div className="p-4 space-y-3 max-h-80 overflow-y-auto custom-scrollbar bg-[#EBA500]/5 flex-1">
                  {(tarefas[processo.id] || []).map((tarefa) => (
                    <div key={tarefa.id} className="group border border-[#373435]/10 hover:border-[#EBA500]/30 rounded-xl p-3 bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-md transition-all duration-300">
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
                          <select
                            value={editandoTarefa.responsavel}
                            onChange={(e) => setEditandoTarefa({ ...editandoTarefa, responsavel: e.target.value })}
                            className="w-full p-2 border border-[#373435]/20 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-xs bg-white/90 transition-all duration-300"
                          >
                            <option value="">Selecionar responsável</option>
                            {usuariosMock.map(usuario => (
                              <option key={usuario} value={usuario}>{usuario}</option>
                            ))}
                          </select>
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
                                onClick={() => iniciarEdicaoTarefa(tarefa)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-110"
                                title="Editar tarefa"
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => apagarTarefa(processo.id, tarefa.id)}
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
                              {formatarData(tarefa.criadoEm)} por {tarefa.criadoPor}
                              {tarefa.editadoEm && (
                                <span className="ml-1 text-blue-500 font-medium">
                                  • Editado
                                </span>
                              )}
                            </span>
                          </div>
                          
                          {/* Status da Tarefa Elegante */}
                          <div className="flex items-center justify-between">
                            <select
                              value={tarefa.status}
                              onChange={(e) => alterarStatusTarefa(processo.id, tarefa.id, e.target.value)}
                              className={`text-xs px-2 py-1 rounded-lg border font-semibold transition-all duration-300 ${getStatusColor(tarefa.status)} hover:shadow-md focus:ring-2 focus:ring-[#EBA500]/20`}
                            >
                              <option value="em_andamento">⏳ Em Andamento</option>
                              <option value="concluido">✅ Concluído</option>
                              <option value="atrasado">⚠️ Atrasado</option>
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
          })}
          </div>
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
    </div>
  )
}

export default PlanejamentoEstrategico