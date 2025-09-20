import React, { useState, useEffect } from 'react'
import { Plus, User, Clock, CheckCircle2, AlertTriangle, Calendar, Edit3, Trash2, Save, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const PlanejamentoEstrategico = () => {
  const { profile } = useAuth()
  const [jornadas, setJornadas] = useState([])
  const [jornadaSelecionada, setJornadaSelecionada] = useState(null)
  const [processos, setProcessos] = useState([])
  const [tarefas, setTarefas] = useState({})
  const [novaTask, setNovaTask] = useState({ processo: null, texto: '', responsavel: '', visible: false })
  const [editandoTarefa, setEditandoTarefa] = useState({ id: null, texto: '', responsavel: '' })

  // Mock das 5 jornadas
  const jornadasMock = [
    { id: 1, nome: 'Estratégica', cor: 'bg-blue-500', corTexto: 'text-blue-700' },
    { id: 2, nome: 'Financeira', cor: 'bg-green-500', corTexto: 'text-green-700' },
    { id: 3, nome: 'Pessoas & Cultura', cor: 'bg-purple-500', corTexto: 'text-purple-700' },
    { id: 4, nome: 'Vendas & Marketing', cor: 'bg-orange-500', corTexto: 'text-orange-700' },
    { id: 5, nome: 'Operacional', cor: 'bg-red-500', corTexto: 'text-red-700' }
  ]

  // Mock dos processos prioritários por jornada
  const processosMock = {
    1: [ // Estratégica
      { id: 11, nome: 'Análise SWOT', prioridade: 1 },
      { id: 12, nome: 'Planejamento 2025', prioridade: 2 },
      { id: 13, nome: 'Definição KPIs', prioridade: 3 },
      { id: 14, nome: 'Budget Review', prioridade: 4 },
      { id: 15, nome: 'Market Research', prioridade: 5 }
    ],
    2: [ // Financeira
      { id: 21, nome: 'Fluxo de Caixa', prioridade: 1 },
      { id: 22, nome: 'Auditoria Q4', prioridade: 2 },
      { id: 23, nome: 'Cost Center Review', prioridade: 3 },
      { id: 24, nome: 'Tax Planning', prioridade: 4 },
      { id: 25, nome: 'Investment Analysis', prioridade: 5 }
    ],
    3: [ // Pessoas & Cultura
      { id: 31, nome: 'Recrutamento Dev', prioridade: 1 },
      { id: 32, nome: 'Treinamento Equipe', prioridade: 2 },
      { id: 33, nome: 'Performance Review', prioridade: 3 },
      { id: 34, nome: 'Engagement Survey', prioridade: 4 },
      { id: 35, nome: 'Benefits Review', prioridade: 5 }
    ],
    4: [ // Vendas & Marketing
      { id: 41, nome: 'Campanha Q1', prioridade: 1 },
      { id: 42, nome: 'Lead Generation', prioridade: 2 },
      { id: 43, nome: 'CRM Update', prioridade: 3 },
      { id: 44, nome: 'Sales Training', prioridade: 4 },
      { id: 45, nome: 'Market Expansion', prioridade: 5 }
    ],
    5: [ // Operacional
      { id: 51, nome: 'Process Optimization', prioridade: 1 },
      { id: 52, nome: 'System Upgrade', prioridade: 2 },
      { id: 53, nome: 'Quality Assurance', prioridade: 3 },
      { id: 54, nome: 'Supply Chain Review', prioridade: 4 },
      { id: 55, nome: 'Capacity Planning', prioridade: 5 }
    ]
  }

  // Usuários mock para responsáveis
  const usuariosMock = [
    'Ana Silva', 'João Santos', 'Maria Oliveira', 'Pedro Costa', 
    'Laura Ferreira', 'Carlos Lima', 'Sofia Ribeiro', 'Miguel Torres'
  ]

  useEffect(() => {
    setJornadas(jornadasMock)
    // Carregar tarefas do localStorage se existirem
    const tarefasSalvas = localStorage.getItem('tarefas_planejamento')
    if (tarefasSalvas) {
      setTarefas(JSON.parse(tarefasSalvas))
    }
  }, [])

  const selecionarJornada = (jornada) => {
    setJornadaSelecionada(jornada)
    setProcessos(processosMock[jornada.id] || [])
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
      case 'em_andamento': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'concluido': return 'bg-green-100 text-green-800 border-green-300'
      case 'atrasado': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
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

  return (
    <div className="space-y-6">
      {/* Jornadas - 5 quadrados horizontais */}
      <div className="grid grid-cols-5 gap-4">
        {jornadas.map((jornada) => (
          <div
            key={jornada.id}
            onClick={() => selecionarJornada(jornada)}
            className={`
              p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:shadow-lg
              ${jornadaSelecionada?.id === jornada.id 
                ? `${jornada.cor} text-white border-transparent shadow-lg` 
                : 'bg-white border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="text-center">
              <h3 className={`font-bold text-lg ${
                jornadaSelecionada?.id === jornada.id ? 'text-white' : jornada.corTexto
              }`}>
                {jornada.nome}
              </h3>
              <div className={`text-sm mt-2 ${
                jornadaSelecionada?.id === jornada.id ? 'text-white/90' : 'text-gray-500'
              }`}>
                {processosMock[jornada.id]?.length || 0} processos
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Processos da jornada selecionada */}
      {jornadaSelecionada && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded ${jornadaSelecionada.cor}`}></div>
            <h2 className="text-xl font-semibold text-gray-900">
              Processos Prioritários - {jornadaSelecionada.nome}
            </h2>
          </div>

          {/* Grid dos 5 processos */}
          <div className="grid grid-cols-5 gap-4">
            {processos.map((processo) => (
              <div key={processo.id} className="bg-white rounded-lg shadow-sm border">
                {/* Header do Processo */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 text-sm">{processo.nome}</h4>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      #{processo.prioridade}
                    </span>
                  </div>
                  
                  {/* Botão Adicionar Tarefa */}
                  <button
                    onClick={() => setNovaTask({ 
                      ...novaTask, 
                      processo: processo.id, 
                      visible: novaTask.processo === processo.id ? !novaTask.visible : true 
                    })}
                    className="mt-3 w-full bg-[#EBA500] text-white px-3 py-2 rounded-lg hover:bg-[#d4940a] transition-colors flex items-center justify-center space-x-2 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adicionar Tarefa</span>
                  </button>
                </div>

                {/* Formulário de Nova Tarefa */}
                {novaTask.visible && novaTask.processo === processo.id && (
                  <div className="p-4 bg-gray-50 border-b">
                    <div className="space-y-3">
                      <textarea
                        value={novaTask.texto}
                        onChange={(e) => setNovaTask({ ...novaTask, texto: e.target.value })}
                        placeholder="Descreva a tarefa..."
                        className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                        rows="2"
                      />
                      <select
                        value={novaTask.responsavel}
                        onChange={(e) => setNovaTask({ ...novaTask, responsavel: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Selecionar responsável</option>
                        {usuariosMock.map(usuario => (
                          <option key={usuario} value={usuario}>{usuario}</option>
                        ))}
                      </select>
                      <div className="flex space-x-2">
                        <button
                          onClick={adicionarTarefa}
                          className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                        >
                          Criar
                        </button>
                        <button
                          onClick={() => setNovaTask({ processo: null, texto: '', responsavel: '', visible: false })}
                          className="flex-1 bg-gray-400 text-white px-3 py-2 rounded text-sm hover:bg-gray-500"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de Tarefas */}
                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                  {(tarefas[processo.id] || []).map((tarefa) => (
                    <div key={tarefa.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      {editandoTarefa.id === tarefa.id ? (
                        /* Modo de Edição */
                        <div className="space-y-3">
                          <textarea
                            value={editandoTarefa.texto}
                            onChange={(e) => setEditandoTarefa({ ...editandoTarefa, texto: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                            rows="2"
                          />
                          <select
                            value={editandoTarefa.responsavel}
                            onChange={(e) => setEditandoTarefa({ ...editandoTarefa, responsavel: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Selecionar responsável</option>
                            {usuariosMock.map(usuario => (
                              <option key={usuario} value={usuario}>{usuario}</option>
                            ))}
                          </select>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => salvarEdicaoTarefa(processo.id)}
                              className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 flex items-center justify-center space-x-1"
                            >
                              <Save className="h-3 w-3" />
                              <span>Salvar</span>
                            </button>
                            <button
                              onClick={cancelarEdicao}
                              className="flex-1 bg-gray-400 text-white px-3 py-2 rounded text-sm hover:bg-gray-500 flex items-center justify-center space-x-1"
                            >
                              <X className="h-3 w-3" />
                              <span>Cancelar</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Modo de Visualização */
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <p className="text-sm text-gray-900 flex-1">{tarefa.texto}</p>
                            <div className="flex items-center space-x-1 ml-2">
                              <button
                                onClick={() => iniciarEdicaoTarefa(tarefa)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                title="Editar tarefa"
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => apagarTarefa(processo.id, tarefa.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                title="Apagar tarefa"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <User className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-600">{tarefa.responsavel}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500">
                              {formatarData(tarefa.criadoEm)} por {tarefa.criadoPor}
                              {tarefa.editadoEm && (
                                <span className="ml-2 text-blue-500">
                                  • Editado: {formatarData(tarefa.editadoEm)} por {tarefa.editadoPor}
                                </span>
                              )}
                            </span>
                          </div>
                          
                          {/* Status da Tarefa */}
                          <div className="flex items-center justify-between">
                            <select
                              value={tarefa.status}
                              onChange={(e) => alterarStatusTarefa(processo.id, tarefa.id, e.target.value)}
                              className={`text-xs px-2 py-1 rounded border ${getStatusColor(tarefa.status)}`}
                            >
                              <option value="em_andamento">Em Andamento</option>
                              <option value="concluido">Concluído</option>
                              <option value="atrasado">Atrasado</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Mensagem quando não há tarefas */}
                  {(!tarefas[processo.id] || tarefas[processo.id].length === 0) && (
                    <div className="text-center text-gray-500 text-sm py-4">
                      Nenhuma tarefa criada
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem inicial */}
      {!jornadaSelecionada && (
        <div className="text-center text-gray-500 py-12">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Selecione uma Jornada</h3>
          <p>Clique em uma das jornadas acima para visualizar e gerenciar os processos prioritários</p>
        </div>
      )}
    </div>
  )
}

export { PlanejamentoEstrategico }