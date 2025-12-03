import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  FileText, 
  Building2, 
  User, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Eye,
  Target,
  Edit
} from 'lucide-react'
import { formatDate } from '../utils/dateUtils'

const STATUS_CONFIG = {
  pending: {
    label: 'Pendente',
    color: 'yellow',
    icon: Clock,
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200'
  },
  approved: {
    label: 'Aprovado',
    color: 'green',
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200'
  },
  rejected: {
    label: 'Rejeitado',
    color: 'red',
    icon: XCircle,
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200'
  },
  implemented: {
    label: 'Implementado',
    color: 'blue',
    icon: CheckCircle,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200'
  }
}

export default function ProcessRequestsPage() {
  const { profile } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [reviewData, setReviewData] = useState({
    status: 'approved',
    admin_notes: ''
  })
  const [editData, setEditData] = useState({
    process_name: '',
    process_description: '',
    category: ''
  })
  const [availableCategories, setAvailableCategories] = useState([])
  const [isNewCategory, setIsNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      loadRequests()
    }
  }, [profile])

  const loadRequests = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('process_requests')
        .select(`
          *,
          companies (
            id,
            name
          ),
          profiles!process_requests_requested_by_fkey (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('📋 Solicitações carregadas:', data?.length)
      setRequests(data || [])
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (e) => {
    e.preventDefault()
    setUpdating(true)

    try {
      // 1. Atualizar status da solicitação
      const { error: updateError } = await supabase
        .from('process_requests')
        .update({
          status: reviewData.status,
          admin_notes: reviewData.admin_notes,
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id)

      if (updateError) throw updateError

      // 2. Se aprovado, criar o processo na jornada
      if (reviewData.status === 'approved') {
        console.log('📝 Criando processo na jornada:', selectedRequest.journey_slug)
        
        // Primeiro, buscar o journey_id a partir do journey_slug
        const { data: journeyData, error: journeyError } = await supabase
          .from('journeys')
          .select('id')
          .eq('slug', selectedRequest.journey_slug)
          .single()

        if (journeyError || !journeyData) {
          console.error('Erro ao buscar jornada:', journeyError)
          throw new Error('Solicitação aprovada, mas não foi possível encontrar a jornada: ' + (journeyError?.message || 'Jornada não encontrada'))
        }

        console.log('✅ Jornada encontrada, ID:', journeyData.id)

        // Buscar o próximo order_index disponível
        const { data: lastProcess } = await supabase
          .from('processes')
          .select('order_index')
          .eq('journey_id', journeyData.id)
          .order('order_index', { ascending: false })
          .limit(1)
          .single()

        const nextOrderIndex = (lastProcess?.order_index || 0) + 1

        // Gerar um code único para o processo
        const processCode = selectedRequest.process_name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
          .replace(/^-|-$/g, '') // Remove hífens do início e fim
          .substring(0, 50) // Limita a 50 caracteres

        // Criar o processo usando função RPC para evitar conflitos com triggers
        const { data: processId, error: processError } = await supabase
          .rpc('create_process_from_request', {
            p_journey_id: journeyData.id,
            p_code: processCode,
            p_name: selectedRequest.process_name,
            p_description: selectedRequest.process_description,
            p_category: selectedRequest.category || 'Geral',
            p_order_index: nextOrderIndex
          })

        if (processError) {
          console.error('Erro ao criar processo:', processError)
          throw new Error('Solicitação aprovada, mas houve erro ao criar o processo: ' + processError.message)
        }

        console.log('✅ Processo criado com sucesso na jornada! ID:', processId)
      }

      alert(`Solicitação ${reviewData.status === 'approved' ? 'aprovada e processo criado' : 'rejeitada'} com sucesso!`)
      setShowReviewModal(false)
      setSelectedRequest(null)
      setReviewData({ status: 'approved', admin_notes: '' })
      await loadRequests()
    } catch (error) {
      console.error('Erro ao revisar solicitação:', error)
      alert('Erro ao revisar solicitação: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleOpenEdit = async (request) => {
    setSelectedRequest(request)
    setEditData({
      process_name: request.process_name,
      process_description: request.process_description || '',
      category: request.category || ''
    })
    
    // Resetar estado de nova categoria
    setIsNewCategory(false)
    setNewCategoryName('')
    
    // Carregar categorias da jornada
    await loadCategoriesForJourney(request.journey_slug)
    
    setShowEditModal(true)
  }

  const loadCategoriesForJourney = async (journeySlug) => {
    try {
      // Buscar o journey_id pelo slug
      const { data: journeyData, error: journeyError } = await supabase
        .from('journeys')
        .select('id')
        .eq('slug', journeySlug)
        .single()

      if (journeyError) throw journeyError

      // Buscar todas as categorias únicas dos processos dessa jornada
      const { data, error } = await supabase
        .from('processes')
        .select('category')
        .eq('journey_id', journeyData.id)
        .not('category', 'is', null)
        .order('category')

      if (error) throw error

      // Extrair categorias únicas e ordenadas
      const categories = [...new Set(data?.map(p => p.category).filter(Boolean))].sort()
      setAvailableCategories(categories)

      console.log(`📂 Categorias carregadas para jornada ${journeySlug}:`, categories)

    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
      setAvailableCategories([])
    }
  }

  const handleSaveEdit = async () => {
    if (!editData.process_name.trim()) {
      alert('Nome do processo é obrigatório')
      return
    }

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('process_requests')
        .update({
          process_name: editData.process_name.trim(),
          process_description: editData.process_description.trim(),
          category: editData.category.trim()
        })
        .eq('id', selectedRequest.id)

      if (error) throw error

      // Atualiza a lista local
      setRequests(requests.map(req => 
        req.id === selectedRequest.id 
          ? { ...req, ...editData }
          : req
      ))

      // Atualiza o selectedRequest com os novos dados
      setSelectedRequest({ ...selectedRequest, ...editData })
      
      setShowEditModal(false)
      alert('Processo atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar edição:', error)
      alert('Erro ao salvar edição: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  const filteredRequests = requests.filter(req => {
    if (statusFilter === 'all') return true
    return req.status === statusFilter
  })

  const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.pending

  if (profile?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600">Apenas Super Admins podem acessar esta página.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#373435] mb-2">
            Solicitações de Processos
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Gerencie solicitações de criação de novos processos feitas por administradores de empresas
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200/50 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
              <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg w-fit">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
              <div className="sm:ml-4">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  {requests.filter(r => r.status === 'pending').length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Pendentes</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200/50 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg w-fit">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="sm:ml-4">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  {requests.filter(r => r.status === 'approved').length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Aprovados</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200/50 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
              <div className="p-2 sm:p-3 bg-red-100 rounded-lg w-fit">
                <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div className="sm:ml-4">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  {requests.filter(r => r.status === 'rejected').length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Rejeitados</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200/50 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg w-fit">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="sm:ml-4">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  {requests.length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200/50 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[40px] touch-manipulation ${
                statusFilter === 'all'
                  ? 'bg-[#EBA500] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas ({requests.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[40px] touch-manipulation ${
                statusFilter === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pendentes ({requests.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[40px] touch-manipulation ${
                statusFilter === 'approved'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Aprovados ({requests.filter(r => r.status === 'approved').length})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[40px] touch-manipulation ${
                statusFilter === 'rejected'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rejeitados ({requests.filter(r => r.status === 'rejected').length})
            </button>
          </div>
        </div>

        {/* Lista de Solicitações */}
        <div className="space-y-3 sm:space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200/50 p-8 sm:p-12 text-center">
              <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-600">
                {statusFilter === 'all' 
                  ? 'Nenhuma solicitação encontrada'
                  : `Nenhuma solicitação ${getStatusConfig(statusFilter).label.toLowerCase()}`
                }
              </p>
            </div>
          ) : (
            filteredRequests.map((request) => {
              const statusConfig = getStatusConfig(request.status)
              const StatusIcon = statusConfig.icon

              return (
                <div
                  key={request.id}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200/50 p-4 sm:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                          {request.process_name}
                        </h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} border`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm mb-3 sm:mb-4">
                        <div className="flex items-center text-gray-600 min-w-0">
                          <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{request.companies?.name}</span>
                        </div>
                        <div className="flex items-center text-gray-600 min-w-0">
                          <Target className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="capitalize truncate">{request.journey_slug?.replace('-', ' ')}</span>
                        </div>
                        <div className="flex items-center text-gray-600 min-w-0">
                          <User className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{request.profiles?.full_name || request.profiles?.email}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>{formatDate(request.created_at)}</span>
                        </div>
                      </div>

                      {request.process_description && (
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">
                          {request.process_description.substring(0, 150)}
                          {request.process_description.length > 150 ? '...' : ''}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <button
                        onClick={() => {
                          setSelectedRequest(request)
                          setShowDetailsModal(true)
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors min-h-[40px] min-w-[40px] touch-manipulation flex items-center justify-center"
                        title="Ver detalhes"
                      >
                        <Eye className="h-5 w-5" />
                      </button>

                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(request)}
                            className="px-3 sm:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 min-h-[40px] touch-manipulation"
                            title="Editar processo"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Editar</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedRequest(request)
                              setReviewData({ status: 'approved', admin_notes: '' })
                              setShowReviewModal(true)
                            }}
                            className="px-3 sm:px-4 py-2 bg-[#EBA500] hover:bg-[#EBA500]/90 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[40px] touch-manipulation"
                          >
                            Revisar
                          </button>
                        </>
                      )}>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto my-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedRequest.process_name}
                  </h2>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusConfig(selectedRequest.status).bgColor} ${getStatusConfig(selectedRequest.status).textColor} border ${getStatusConfig(selectedRequest.status).borderColor}`}>
                    {getStatusConfig(selectedRequest.status).label}
                  </span>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Informações Básicas */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <Building2 className="h-4 w-4 mr-2 text-[#EBA500]" />
                    Informações da Solicitação
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Empresa:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedRequest.companies?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Jornada:</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {selectedRequest.journey_slug?.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Categoria:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedRequest.category || 'Não informada'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Solicitado por:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedRequest.profiles?.full_name || selectedRequest.profiles?.email}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Data da Solicitação:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(selectedRequest.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Descrição */}
                {selectedRequest.process_description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-[#EBA500]" />
                      Descrição do Processo
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedRequest.process_description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Justificativa */}
                {selectedRequest.justification && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2 text-[#EBA500]" />
                      Justificativa
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedRequest.justification}
                      </p>
                    </div>
                  </div>
                )}

                {/* Notas do Admin */}
                {selectedRequest.admin_notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />
                      Observações do Administrador
                    </h3>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-sm text-blue-900 whitespace-pre-wrap">
                        {selectedRequest.admin_notes}
                      </p>
                      {selectedRequest.reviewed_at && (
                        <p className="text-xs text-blue-700 mt-2">
                          Revisado em {formatDate(selectedRequest.reviewed_at)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Revisão */}
      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-auto">
            <form onSubmit={handleReview} className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Revisar Solicitação
                  </h2>
                  <p className="text-sm text-gray-600">
                    {selectedRequest.process_name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Decisão */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Decisão *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setReviewData(prev => ({ ...prev, status: 'approved' }))}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        reviewData.status === 'approved'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <CheckCircle className={`h-6 w-6 mx-auto mb-2 ${
                        reviewData.status === 'approved' ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <div className={`text-sm font-medium ${
                        reviewData.status === 'approved' ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        Aprovar
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewData(prev => ({ ...prev, status: 'rejected' }))}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        reviewData.status === 'rejected'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <XCircle className={`h-6 w-6 mx-auto mb-2 ${
                        reviewData.status === 'rejected' ? 'text-red-600' : 'text-gray-400'
                      }`} />
                      <div className={`text-sm font-medium ${
                        reviewData.status === 'rejected' ? 'text-red-700' : 'text-gray-600'
                      }`}>
                        Rejeitar
                      </div>
                    </button>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label htmlFor="admin_notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Observações {reviewData.status === 'rejected' && '(Obrigatório para rejeição)'}
                  </label>
                  <textarea
                    id="admin_notes"
                    value={reviewData.admin_notes}
                    onChange={(e) => setReviewData(prev => ({ ...prev, admin_notes: e.target.value }))}
                    rows={5}
                    maxLength={1000}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent resize-none"
                    placeholder="Adicione observações sobre sua decisão..."
                    required={reviewData.status === 'rejected'}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">
                      {reviewData.status === 'approved' 
                        ? 'Explique por que esta solicitação foi aprovada'
                        : 'Explique o motivo da rejeição para que o solicitante possa entender'}
                    </p>
                    <span className="text-xs text-gray-500">
                      {reviewData.admin_notes.length}/1000
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  disabled={updating}
                  className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 min-h-[44px] touch-manipulation"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updating || (reviewData.status === 'rejected' && !reviewData.admin_notes.trim())}
                  className={`w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-2 rounded-lg font-medium transition-colors disabled:opacity-50 min-h-[44px] touch-manipulation ${
                    reviewData.status === 'approved'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {updating ? 'Processando...' : reviewData.status === 'approved' ? 'Aprovar Solicitação' : 'Rejeitar Solicitação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {showEditModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto my-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#373435]">
                  Editar Processo
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Nome do Processo */}
                <div>
                  <label htmlFor="edit_process_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Processo *
                  </label>
                  <input
                    type="text"
                    id="edit_process_name"
                    value={editData.process_name}
                    onChange={(e) => setEditData(prev => ({ ...prev, process_name: e.target.value }))}
                    maxLength={200}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Análise de Fornecedores"
                    required
                  />
                  <span className="text-xs text-gray-500 mt-1 block">
                    {editData.process_name.length}/200
                  </span>
                </div>

                {/* Descrição */}
                <div>
                  <label htmlFor="edit_process_description" className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    id="edit_process_description"
                    value={editData.process_description}
                    onChange={(e) => setEditData(prev => ({ ...prev, process_description: e.target.value }))}
                    rows={5}
                    maxLength={1000}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Descreva o objetivo e escopo deste processo..."
                  />
                  <span className="text-xs text-gray-500 mt-1 block">
                    {editData.process_description.length}/1000
                  </span>
                </div>

                {/* Categoria */}
                <div>
                  <label htmlFor="edit_category" className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  
                  {!isNewCategory ? (
                    <>
                      <select
                        id="edit_category"
                        value={editData.category}
                        onChange={(e) => {
                          if (e.target.value === '__new__') {
                            setIsNewCategory(true)
                            setNewCategoryName('')
                            setEditData(prev => ({ ...prev, category: '' }))
                          } else {
                            setEditData(prev => ({ ...prev, category: e.target.value }))
                          }
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Selecione uma categoria</option>
                        {availableCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="__new__" className="font-semibold text-blue-600">
                          + Criar nova categoria
                        </option>
                      </select>
                      {availableCategories.length === 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Nenhuma categoria disponível nesta jornada ainda
                        </p>
                      )}
                      {availableCategories.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {availableCategories.length} categoria(s) disponível(is) nesta jornada
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => {
                            setNewCategoryName(e.target.value)
                            setEditData(prev => ({ ...prev, category: e.target.value }))
                          }}
                          maxLength={100}
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Digite o nome da nova categoria"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewCategory(false)
                            setNewCategoryName('')
                            setEditData(prev => ({ ...prev, category: '' }))
                          }}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {newCategoryName.length}/100 caracteres
                      </p>
                    </>
                  )}
                </div>

                {/* Info da Jornada */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Jornada: {selectedRequest.journey_slug}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Este processo será criado nesta jornada após aprovação
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={updating}
                  className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 min-h-[44px] touch-manipulation"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={updating || !editData.process_name.trim()}
                  className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 min-h-[44px] touch-manipulation"
                >
                  {updating ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
