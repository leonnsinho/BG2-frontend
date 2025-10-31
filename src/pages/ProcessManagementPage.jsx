import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { useProcessEvaluations } from '../components/ProcessPersonalization'
import { useAuth } from '../contexts/AuthContext'

export default function ProcessManagementPage() {
  const { profile } = useAuth()
  
  // Para teste, usar um UUID válido se não encontrar no perfil
  // TODO: Remover isso depois que a autenticação estiver corrigida
  const companyId = profile?.user_companies?.[0]?.companies?.id || '00000000-0000-0000-0000-000000000001'
  
  console.log('🏢 ProcessManagementPage - Company ID:', companyId)
  console.log('👤 ProcessManagementPage - Profile:', profile)
  
  const { evaluations, loading, reload } = useProcessEvaluations(companyId)
  const [selectedJourney, setSelectedJourney] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState('priority')

  // Filtros e ordenação
  const filteredEvaluations = useMemo(() => {
    let filtered = evaluations.filter(evaluation => {
      // Filtro por jornada
      if (selectedJourney !== 'all' && evaluation.processes?.journeys?.slug !== selectedJourney) {
        return false
      }

      // Filtro por status
      if (selectedStatus === 'has_process' && !evaluation.has_process) {
        return false
      }
      if (selectedStatus === 'missing_process' && evaluation.has_process !== false) {
        return false
      }
      if (selectedStatus === 'high_priority' && (!evaluation.priority_score || evaluation.priority_score < 4.0)) {
        return false
      }

      return true
    })

    // Ordenação
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return (b.priority_score || 0) - (a.priority_score || 0)
        case 'importance':
          return (b.business_importance || 0) - (a.business_importance || 0)
        case 'urgency':
          return (b.implementation_urgency || 0) - (a.implementation_urgency || 0)
        case 'name':
          return (a.processes?.name || '').localeCompare(b.processes?.name || '')
        default:
          return 0
      }
    })
  }, [evaluations, selectedJourney, selectedStatus, sortBy])

  // Estatísticas
  const stats = useMemo(() => {
    const total = evaluations.length
    const hasProcess = evaluations.filter(e => e.has_process === true).length
    const missingProcess = evaluations.filter(e => e.has_process === false).length
    const highPriority = evaluations.filter(e => e.priority_score >= 4.0).length
    const avgPriority = evaluations.reduce((sum, e) => sum + (e.priority_score || 0), 0) / total

    return {
      total,
      hasProcess,
      missingProcess,
      highPriority,
      avgPriority: avgPriority || 0
    }
  }, [evaluations])

  const getPriorityBadge = (score) => {
    if (!score) return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">N/A</span>
    if (score >= 4.0) return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Alta</span>
    if (score >= 3.0) return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Média</span>
    if (score >= 2.0) return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Baixa</span>
    return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">Muito Baixa</span>
  }

  const getStatusBadge = (hasProcess) => {
    if (hasProcess === true) return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Implementado</span>
    if (hasProcess === false) return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Não Implementado</span>
    return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">Não Avaliado</span>
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-2xl w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-3xl"></div>
          </div>
        </div>
      </Layout>
    )
  }

  // Se não conseguir identificar a empresa, mostrar mensagem informativa
  if (!companyId || companyId === '00000000-0000-0000-0000-000000000001') {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#EBA500] to-[#373435] bg-clip-text text-transparent">
              Gestão de Processos Personalizados
            </h1>
            <p className="text-[#373435]/70 text-lg">
              Gerencie e priorize os processos da sua empresa
            </p>
          </div>

          <div className="bg-gradient-to-r from-[#EBA500]/5 to-[#EBA500]/10 border-2 border-[#EBA500]/20 rounded-3xl p-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-[#EBA500] to-[#EBA500]/80 rounded-2xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-6">
                <h3 className="text-xl font-bold text-[#373435]">
                  Configuração de Empresa Necessária
                </h3>
                <div className="mt-4 text-[#373435]/80">
                  <p className="mb-4 text-lg">
                    Para acessar a gestão de processos, é necessário que seu usuário esteja associado a uma empresa.
                  </p>
                  <div className="mb-4">
                    <strong className="text-[#373435]">Informações de Debug:</strong>
                  </div>
                  <ul className="list-disc list-inside space-y-2 text-sm bg-[#373435]/5 rounded-2xl p-4">
                    <li>Company ID: {companyId}</li>
                    <li>Profile: {profile ? 'Carregado' : 'Não carregado'}</li>
                    <li>User Companies: {profile?.user_companies ? `${profile.user_companies.length} encontradas` : 'Nenhuma encontrada'}</li>
                  </ul>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 hover:from-[#EBA500]/90 hover:to-[#EBA500] text-white px-6 py-3 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Tentar Novamente
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mostrar processos para teste mesmo sem company */}
          {companyId === '00000000-0000-0000-0000-000000000001' && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <svg className="flex-shrink-0 h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Modo de Teste Ativado
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Carregando processos em modo de demonstração. Configure a empresa para funcionalidade completa.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 space-y-8">
        {/* Cabeçalho */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200/50 p-8">
          <h1 className="text-3xl font-bold text-[#373435] mb-3">
            Gestão de Processos Personalizados
          </h1>
          <p className="text-gray-600 text-lg">
            Gerencie e priorize os processos da sua empresa
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="text-2xl font-bold text-[#EBA500]">{stats.total}</div>
            <div className="text-sm text-gray-600 font-medium">Total de Processos</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="text-2xl font-bold text-emerald-600">{stats.hasProcess}</div>
            <div className="text-sm text-gray-600 font-medium">Implementados</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="text-2xl font-bold text-red-500">{stats.missingProcess}</div>
            <div className="text-sm text-gray-600 font-medium">Não Implementados</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="text-2xl font-bold text-amber-600">{stats.highPriority}</div>
            <div className="text-sm text-gray-600 font-medium">Alta Prioridade</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-8 rounded-3xl border border-gray-200/50 shadow-sm">
          <h3 className="text-lg font-semibold text-[#373435] mb-6">Filtros e Ordenação</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#373435] mb-3">
                Jornada
              </label>
              <select
                value={selectedJourney}
                onChange={(e) => setSelectedJourney(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] transition-all duration-200 bg-white"
              >
                <option value="all">Todas as Jornadas</option>
                <option value="estrategica">Estratégica</option>
                <option value="financeira">Financeira</option>
                <option value="pessoas-cultura">Pessoas e Cultura</option>
                <option value="receita-crm">Receita</option>
                <option value="operacional">Operacional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#373435] mb-3">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] transition-all duration-200 bg-white"
              >
                <option value="all">Todos</option>
                <option value="has_process">Implementados</option>
                <option value="missing_process">Não Implementados</option>
                <option value="high_priority">Alta Prioridade</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#373435] mb-3">
                Ordenar por
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] transition-all duration-200 bg-white"
              >
                <option value="priority">Prioridade</option>
                <option value="importance">Importância</option>
                <option value="urgency">Urgência</option>
                <option value="name">Nome</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={reload}
                className="w-full bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 hover:from-[#EBA500]/90 hover:to-[#EBA500]/80 text-white px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Processos */}
        <div className="bg-white rounded-3xl border border-gray-200/50 shadow-sm">
          <div className="px-8 py-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-[#373435]">
              Processos ({filteredEvaluations.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                    Processo
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                    Jornada
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                    Prioridade
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                    Importância
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                    Urgência
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                    Facilidade
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {filteredEvaluations.map((evaluation) => (
                  <tr key={evaluation.id} className="hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-[#EBA500]/5 transition-all duration-200">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-[#373435]">
                          {evaluation.processes?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {evaluation.processes?.code}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className="text-sm text-gray-700 font-medium">
                        {evaluation.processes?.journeys?.name}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      {getStatusBadge(evaluation.has_process)}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getPriorityBadge(evaluation.priority_score)}
                        {evaluation.priority_score && (
                          <span className="text-sm text-gray-600 font-medium">
                            {evaluation.priority_score}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-700 font-medium">
                      {evaluation.business_importance || '-'}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-700 font-medium">
                      {evaluation.implementation_urgency || '-'}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-700 font-medium">
                      {evaluation.implementation_ease || '-'}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/process/${evaluation.process_id}/personalize`}
                        className="text-[#EBA500] hover:text-[#EBA500]/80 bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/5 hover:from-[#EBA500]/20 hover:to-[#EBA500]/10 px-4 py-2 rounded-2xl font-medium transition-all duration-200 border border-[#EBA500]/30 hover:shadow-md"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredEvaluations.length === 0 && (
            <div className="text-center py-20">
              <div className="bg-gradient-to-r from-[#EBA500]/5 to-[#EBA500]/10 rounded-3xl p-12 inline-block">
                <div className="w-16 h-16 bg-gradient-to-r from-[#EBA500] to-[#EBA500]/80 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-[#373435] text-xl font-semibold">
                  {evaluations.length === 0 
                    ? 'Nenhuma avaliação de processo encontrada' 
                    : 'Nenhum processo encontrado com os filtros aplicados'
                  }
                </div>
                <div className="text-[#373435]/60 mt-2">
                  {evaluations.length === 0 
                    ? 'Comece criando sua primeira avaliação de processo' 
                    : 'Tente ajustar os filtros para ver mais resultados'
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}