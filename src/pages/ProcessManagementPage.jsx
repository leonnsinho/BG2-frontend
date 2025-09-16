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
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
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
            <h1 className="text-2xl font-bold text-gray-900">
              Gestão de Processos Personalizados
            </h1>
            <p className="text-gray-600">
              Gerencie e priorize os processos da sua empresa
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6">
            <div className="flex">
              <svg className="flex-shrink-0 h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Configuração de Empresa Necessária
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p className="mb-2">
                    Para acessar a gestão de processos, é necessário que seu usuário esteja associado a uma empresa.
                  </p>
                  <div className="mb-2">
                    <strong>Informações de Debug:</strong>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Company ID: {companyId}</li>
                    <li>Profile: {profile ? 'Carregado' : 'Não carregado'}</li>
                    <li>User Companies: {profile?.user_companies ? `${profile.user_companies.length} encontradas` : 'Nenhuma encontrada'}</li>
                  </ul>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium"
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
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestão de Processos Personalizados
          </h1>
          <p className="text-gray-600">
            Gerencie e priorize os processos da sua empresa
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total de Processos</div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{stats.hasProcess}</div>
            <div className="text-sm text-gray-600">Implementados</div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-2xl font-bold text-red-600">{stats.missingProcess}</div>
            <div className="text-sm text-gray-600">Não Implementados</div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-2xl font-bold text-yellow-600">{stats.highPriority}</div>
            <div className="text-sm text-gray-600">Alta Prioridade</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jornada
              </label>
              <select
                value={selectedJourney}
                onChange={(e) => setSelectedJourney(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">Todas as Jornadas</option>
                <option value="estrategica">Estratégica</option>
                <option value="financeira">Financeira</option>
                <option value="pessoas-cultura">Pessoas e Cultura</option>
                <option value="receita-crm">Receita/CRM</option>
                <option value="operacional">Operacional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">Todos</option>
                <option value="has_process">Implementados</option>
                <option value="missing_process">Não Implementados</option>
                <option value="high_priority">Alta Prioridade</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordenar por
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Processos */}
        <div className="bg-white rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jornada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Importância
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Urgência
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facilidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvaluations.map((evaluation) => (
                  <tr key={evaluation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {evaluation.processes?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {evaluation.processes?.code}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {evaluation.processes?.journeys?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(evaluation.has_process)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getPriorityBadge(evaluation.priority_score)}
                        {evaluation.priority_score && (
                          <span className="text-sm text-gray-600">
                            {evaluation.priority_score}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {evaluation.business_importance || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {evaluation.implementation_urgency || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {evaluation.implementation_ease || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/process/${evaluation.process_id}/personalize`}
                        className="text-blue-600 hover:text-blue-900"
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
            <div className="text-center py-12">
              <div className="text-gray-500">
                {evaluations.length === 0 
                  ? 'Nenhuma avaliação de processo encontrada' 
                  : 'Nenhum processo encontrado com os filtros aplicados'
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}