import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Loader, 
  FileText,
  Building2,
  User,
  Calendar,
  MessageSquare,
  CheckCheck,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Search,
  SlidersHorizontal
} from 'lucide-react'
import {
  getPendingMaturityRequests,
  adminApproveMaturity,
  rejectMaturityRequest
} from '../services/processMaturityService'

const MaturityApprovalsPage = () => {
  const { profile } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Verificar se é Company Admin
  const isCompanyAdmin = () => {
    return profile?.role === 'company_admin' || 
           profile?.user_companies?.some(uc => uc.is_active && uc.role === 'company_admin')
  }

  // Obter empresa do company_admin
  const getCurrentUserCompany = () => {
    if (!profile?.user_companies) return null
    return profile.user_companies.find(uc => uc.is_active)?.companies
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const currentCompany = getCurrentUserCompany()
      const companyId = profile?.role === 'super_admin' ? null : currentCompany?.id
      
      const data = await getPendingMaturityRequests(companyId)
      setRequests(data)
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveClick = (request) => {
    setSelectedRequest(request)
    setAdminNotes('')
    setShowApproveModal(true)
  }

  const handleRejectClick = (request) => {
    setSelectedRequest(request)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const handleApprove = async () => {
    if (!selectedRequest) return

    try {
      setActionLoading(selectedRequest.id)
      await adminApproveMaturity(selectedRequest.id, profile.id, adminNotes)
      
      setShowApproveModal(false)
      setSelectedRequest(null)
      setAdminNotes('')
      
      // Recarregar lista
      await loadRequests()
      
      // Disparar evento para atualizar o badge no sidebar
      window.dispatchEvent(new CustomEvent('maturity-approval-changed'))
      
      alert('✅ Processo amadurecido com sucesso!')
    } catch (error) {
      console.error('Erro ao aprovar:', error)
      alert('❌ Erro ao aprovar: ' + error.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      alert('Por favor, informe o motivo da rejeição')
      return
    }

    try {
      setActionLoading(selectedRequest.id)
      await rejectMaturityRequest(selectedRequest.id, profile.id, rejectionReason)
      
      setShowRejectModal(false)
      setSelectedRequest(null)
      setRejectionReason('')
      
      // Recarregar lista
      await loadRequests()
      
      // Disparar evento para atualizar o badge no sidebar
      window.dispatchEvent(new CustomEvent('maturity-approval-changed'))
      
      alert('Solicitação rejeitada')
    } catch (error) {
      console.error('Erro ao rejeitar:', error)
      alert('❌ Erro ao rejeitar: ' + error.message)
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    
    // Converter UTC para horário local do Brasil (UTC-3)
    const date = new Date(dateString)
    
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando solicitações...</p>
        </div>
      </div>
    )
  }

  const filteredRequests = requests.filter(r => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      r.process_name?.toLowerCase().includes(q) ||
      r.journey_name?.toLowerCase().includes(q) ||
      r.company_name?.toLowerCase().includes(q) ||
      r.requester_name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            Aprovações de Amadurecimento
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Valide o amadurecimento dos processos solicitados pelos gestores
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border-2 transition-all ${
            requests.length > 0
              ? 'bg-amber-50 border-[#EBA500] shadow-amber-100'
              : 'bg-white border-gray-100'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className={`text-xs sm:text-sm font-semibold mb-1 truncate ${requests.length > 0 ? 'text-amber-700' : 'text-gray-500'}`}>
                  Pendentes
                </p>
                <p className={`text-xl sm:text-2xl font-bold ${requests.length > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                  {requests.length}
                </p>
              </div>
              <div className={`p-1.5 rounded-lg flex-shrink-0 ${requests.length > 0 ? 'bg-amber-200' : 'bg-gray-100'}`}>
                <Clock className={`h-5 w-5 sm:h-6 sm:w-6 ${requests.length > 0 ? 'text-[#EBA500]' : 'text-gray-400'}`} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 mb-1 truncate">Empresas</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-700">
                  {new Set(requests.map(r => r.company_id)).size}
                </p>
              </div>
              <div className="p-1.5 rounded-lg bg-gray-100 flex-shrink-0">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-green-100 col-span-2 sm:col-span-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 mb-1 truncate">Média de Conclusão</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {requests.length > 0
                    ? Math.round(requests.reduce((acc, r) => acc + (r.completion_percentage || 0), 0) / requests.length)
                    : 0}%
                </p>
              </div>
              <div className="p-1.5 rounded-lg bg-green-100 flex-shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">Filtros</h3>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por processo, jornada, empresa ou solicitante..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 min-h-[44px] text-sm sm:text-base rounded-xl border border-gray-200 focus:outline-none focus:border-[#EBA500] transition-colors"
            />
          </div>
        </div>

        {/* Lista de Solicitações */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
            <CheckCheck className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhuma aprovação pendente'}
            </h3>
            <p className="text-sm sm:text-base text-gray-500">
              {searchQuery
                ? 'Tente ajustar os termos da busca'
                : 'Todas as solicitações de amadurecimento foram processadas'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-xl sm:rounded-2xl shadow-sm border-2 border-gray-100 overflow-hidden hover:shadow-md hover:border-amber-200 transition-all"
              >
                {/* Accent bar */}
                <div className="h-1 w-full bg-gradient-to-r from-[#EBA500] to-amber-400" />

                <div className="p-4 sm:p-5 lg:p-6">
                  {/* Card Top: process name + status badge */}
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl flex-shrink-0">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-[#EBA500]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 break-words">
                          {request.process_name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{request.journey_name}</p>
                        {request.process_description && (
                          <p className="text-xs text-gray-500 mt-1 break-words line-clamp-2">
                            {request.process_description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
                        <Clock className="h-3 w-3" />
                        Aguardando
                      </span>
                    </div>
                  </div>

                  {/* Metrics row */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                      <div className="text-xl sm:text-2xl font-bold text-green-600">
                        {request.completion_percentage}%
                      </div>
                      <div className="text-xs text-green-700 font-medium mt-0.5">
                        {request.completed_tasks}/{request.total_tasks} Tarefas
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 col-span-2 sm:col-span-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500">Solicitado por</span>
                      </div>
                      <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                        {request.requester_name || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400 truncate">{request.requester_email}</div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 col-span-3 sm:col-span-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500">Data da Solicitação</span>
                      </div>
                      <div className="text-xs sm:text-sm font-semibold text-gray-900">
                        {formatDate(request.requested_at)}
                      </div>
                    </div>
                  </div>

                  {/* Observações do Gestor */}
                  {request.gestor_notes && (
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mb-4">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <MessageSquare className="h-3 w-3 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-700">Observações do Gestor</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed break-words">
                        {request.gestor_notes}
                      </p>
                    </div>
                  )}

                  {/* Empresa + Ações */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500">
                      <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">
                        <span className="font-semibold text-gray-700">{request.company_name}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleRejectClick(request)}
                        disabled={actionLoading === request.id}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-300 font-semibold transition-all disabled:opacity-50 text-sm min-h-[44px]"
                      >
                        <ThumbsDown className="h-4 w-4" />
                        <span>Rejeitar</span>
                      </button>

                      <button
                        onClick={() => handleApproveClick(request)}
                        disabled={actionLoading === request.id}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#EBA500] to-amber-500 text-white rounded-xl hover:from-amber-600 hover:to-amber-600 font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 text-sm min-h-[44px]"
                      >
                        {actionLoading === request.id ? (
                          <>
                            <Loader className="h-4 w-4 animate-spin" />
                            <span>Processando...</span>
                          </>
                        ) : (
                          <>
                            <ThumbsUp className="h-4 w-4" />
                            <span className="hidden sm:inline">Aprovar Amadurecimento</span>
                            <span className="sm:hidden">Aprovar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Aprovação */}
        {showApproveModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[95vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Confirmar Amadurecimento</h3>
                <p className="text-sm text-gray-500 mt-0.5">Revise antes de confirmar</p>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-gray-700">
                    Você está prestes a aprovar o amadurecimento do processo{' '}
                    <span className="font-bold text-gray-900">{selectedRequest.process_name}</span>.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    Isso irá marcar o processo como{' '}
                    <span className="font-bold text-green-700">AMADURECIDO</span> no sistema.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Observações <span className="text-gray-400 font-normal">(Opcional)</span>
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Adicione comentários sobre a aprovação..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#EBA500] focus:ring-2 focus:ring-amber-500/20 transition-all resize-none text-sm"
                  />
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => { setShowApproveModal(false); setSelectedRequest(null) }}
                  className="px-5 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-all text-sm min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#EBA500] to-amber-500 text-white rounded-xl hover:from-amber-600 hover:to-amber-600 font-semibold transition-all shadow-sm disabled:opacity-50 text-sm min-h-[44px]"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Confirmar Aprovação</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Rejeição */}
        {showRejectModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[95vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Rejeitar Solicitação</h3>
                <p className="text-sm text-gray-500 mt-0.5">O gestor será notificado com o motivo</p>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-gray-700">
                    Você está prestes a rejeitar o amadurecimento do processo{' '}
                    <span className="font-bold text-gray-900">{selectedRequest.process_name}</span>.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Motivo da Rejeição <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explique o motivo da rejeição para que o gestor possa corrigir..."
                    rows={4}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/20 transition-all resize-none text-sm"
                  />
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => { setShowRejectModal(false); setSelectedRequest(null) }}
                  className="px-5 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-all text-sm min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 font-semibold transition-all shadow-sm disabled:opacity-50 text-sm min-h-[44px]"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Confirmar Rejeição</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default MaturityApprovalsPage
