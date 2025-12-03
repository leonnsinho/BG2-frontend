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
  TrendingUp
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader className="h-12 w-12 text-[#EBA500] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando solicitações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-green-50 border-b border-gray-200/50 shadow-sm -mx-4 sm:-mx-8 -mt-4 sm:-mt-8 px-4 sm:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0 pr-4 sm:pr-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#373435] mb-1 break-words">
              Aprovações de Amadurecimento
            </h1>
            <p className="mt-2 text-xs sm:text-sm lg:text-base text-gray-600 break-words">
              Valide o amadurecimento dos processos solicitados pelos gestores
            </p>
          </div>

          <div className="text-left sm:text-right flex-shrink-0">
            <div className="text-3xl sm:text-4xl font-bold text-green-600">
              {requests.length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">
              Pendente{requests.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Solicitações */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 p-8 sm:p-12 text-center">
          <CheckCheck className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Nenhuma aprovação pendente
          </h3>
          <p className="text-sm sm:text-base text-gray-600">
            Todas as solicitações de amadurecimento foram processadas
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {requests.map((request) => (
            <div 
              key={request.id}
              className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 overflow-hidden hover:shadow-md transition-all"
            >
              {/* Header do Card */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 sm:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-start gap-2 sm:gap-3 mb-2">
                      <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-xl font-bold text-gray-900 break-words">
                          {request.process_name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {request.journey_name}
                        </p>
                      </div>
                    </div>

                    {request.process_description && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-2 ml-0 sm:ml-14 break-words">
                        {request.process_description}
                      </p>
                    )}
                  </div>

                  <div className="w-full sm:w-auto">
                    <div className="inline-flex items-center px-2.5 sm:px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold border border-yellow-200">
                      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5" />
                      Aguardando
                    </div>
                  </div>
                </div>
              </div>

              {/* Body do Card */}
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
                  {/* Métricas */}
                  <div className="bg-green-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-green-200">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">
                      {request.completion_percentage}%
                    </div>
                    <div className="text-xs text-green-700 font-medium mt-1">
                      {request.completed_tasks}/{request.total_tasks} Tarefas Concluídas
                    </div>
                  </div>

                  {/* Solicitante */}
                  <div className="bg-blue-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-900">Solicitado por</span>
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                      {request.requester_name || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 truncate">
                      {request.requester_email}
                    </div>
                  </div>

                  {/* Data */}
                  <div className="bg-purple-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                      <span className="text-xs font-semibold text-purple-900">Data da Solicitação</span>
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-gray-900">
                      {formatDate(request.requested_at)}
                    </div>
                  </div>
                </div>

                {/* Observações do Gestor */}
                {request.gestor_notes && (
                  <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200 mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">
                        Observações do Gestor
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words">
                      {request.gestor_notes}
                    </p>
                  </div>
                )}

                {/* Empresa */}
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                  <Building2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">Empresa: <span className="font-semibold text-gray-900">{request.company_name}</span></span>
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleRejectClick(request)}
                    disabled={actionLoading === request.id}
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-white border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 font-semibold transition-all disabled:opacity-50 min-h-[44px] touch-manipulation text-sm"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    <span>Rejeitar</span>
                  </button>

                  <button
                    onClick={() => handleApproveClick(request)}
                    disabled={actionLoading === request.id}
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 min-h-[44px] touch-manipulation text-sm"
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
          ))}
        </div>
      )}

      {/* Modal de Aprovação */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl max-h-[95vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Confirmar Amadurecimento</h3>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-700">
                  Você está prestes a aprovar o amadurecimento do processo{' '}
                  <span className="font-bold">{selectedRequest.process_name}</span>.
                </p>
                <p className="text-xs sm:text-sm text-gray-700 mt-2">
                  Isso irá marcar o processo como <span className="font-bold text-green-700">AMADURECIDO</span> no sistema.
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                  Observações (Opcional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Adicione comentários sobre a aprovação..."
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all resize-none text-xs sm:text-sm min-h-[80px] touch-manipulation"
                />
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowApproveModal(false)
                  setSelectedRequest(null)
                }}
                className="px-4 sm:px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-all min-h-[44px] touch-manipulation text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-semibold transition-all shadow-md disabled:opacity-50 min-h-[44px] touch-manipulation text-sm"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl max-h-[95vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Rejeitar Solicitação</h3>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-700">
                  Você está prestes a rejeitar o amadurecimento do processo{' '}
                  <span className="font-bold">{selectedRequest.process_name}</span>.
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                  Motivo da Rejeição <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explique o motivo da rejeição para que o gestor possa corrigir..."
                  rows={4}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all resize-none text-xs sm:text-sm min-h-[100px] touch-manipulation"
                />
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setSelectedRequest(null)
                }}
                className="px-4 sm:px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-all min-h-[44px] touch-manipulation text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 font-semibold transition-all shadow-md disabled:opacity-50 min-h-[44px] touch-manipulation text-sm"
              >
                <XCircle className="h-4 w-4" />
                <span>Confirmar Rejeição</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MaturityApprovalsPage
