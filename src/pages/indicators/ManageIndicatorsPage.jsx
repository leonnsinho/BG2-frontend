import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { 
  Plus, Search, Edit2, Trash2, Copy, List, Grid,
  MoreVertical, Filter, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Target, ChevronDown, User, Zap, Building2, ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'
import IndicatorModal from '../../components/indicators/IndicatorModal'

export default function ManageIndicatorsPage() {
  const { profile } = useAuth()
  const permissions = usePermissions()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [indicators, setIndicators] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [journeyFilter, setJourneyFilter] = useState('Todas')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [responsibleFilter, setResponsibleFilter] = useState('Todos')
  const [companyFilter, setCompanyFilter] = useState('Todas')
  const [viewMode, setViewMode] = useState('list') // 'list' ou 'grid'
  const [showModal, setShowModal] = useState(false)
  const [editingIndicator, setEditingIndicator] = useState(null)
  const [users, setUsers] = useState([])
  const [avatarUrls, setAvatarUrls] = useState({})
  const [companies, setCompanies] = useState([])

  const journeys = ['Todas', 'Estratégia', 'Financeira', 'Receita', 'Pessoas & Cultura', 'Operacional']
  const statuses = ['Todos', 'Ativo', 'Inativo']

  useEffect(() => {
    loadIndicators()
    loadUsers()
    
    // Carregar empresas se for super admin
    if (permissions.isSuperAdmin()) {
      loadCompanies()
    }
    
    // Abrir modal automaticamente se vier com ?action=add
    if (searchParams.get('action') === 'add') {
      setShowModal(true)
      setSearchParams({}) // Limpar o parâmetro
    }
  }, [])

  // Recarregar indicadores e usuários quando o filtro de empresa mudar
  useEffect(() => {
    if (permissions.isSuperAdmin()) {
      loadIndicators()
      loadUsers()
    }
  }, [companyFilter])

  // Carregar avatars dos usuários
  useEffect(() => {
    const loadAvatars = async () => {
      const urls = {}
      for (const user of users) {
        if (user.avatar_url) {
          const { data } = await supabase.storage
            .from('profile-avatars')
            .createSignedUrl(user.avatar_url, 3600)
          if (data?.signedUrl) {
            urls[user.id] = data.signedUrl
          }
        }
      }
      setAvatarUrls(urls)
    }
    
    if (users.length > 0) {
      loadAvatars()
    }
  }, [users])

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
      toast.error('Erro ao carregar empresas')
    }
  }

  const loadIndicators = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('management_indicators')
        .select(`
          *,
          companies (
            id,
            name
          )
        `)

      // Se for super admin
      if (permissions.isSuperAdmin()) {
        // Filtrar por empresa se selecionada
        if (companyFilter !== 'Todas') {
          query = query.eq('company_id', companyFilter)
        }
        // Caso contrário, carrega de todas as empresas (sem filtro)
      } else {
        // Company admin ou outros - carregar apenas da empresa do usuário
        const { data: userCompanies, error: ucError } = await supabase
          .from('user_companies')
          .select('company_id')
          .eq('user_id', profile.id)
          .eq('is_active', true)
          .limit(1)
          .single()

        if (ucError) throw ucError
        query = query.eq('company_id', userCompanies.company_id)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setIndicators(data || [])
    } catch (error) {
      console.error('Erro ao carregar indicadores:', error)
      toast.error('Erro ao carregar indicadores')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      if (permissions.isSuperAdmin()) {
        // Super admin vê usuários de acordo com o filtro de empresa
        if (companyFilter !== 'Todas') {
          // Carregar apenas usuários da empresa filtrada
          const { data: companyUsers, error: cuError } = await supabase
            .from('user_companies')
            .select('user_id')
            .eq('company_id', companyFilter)
            .eq('is_active', true)

          if (cuError) throw cuError

          const userIds = companyUsers.map(cu => cu.user_id)

          if (userIds.length > 0) {
            const { data, error } = await supabase
              .from('profiles')
              .select('id, email, full_name, avatar_url')
              .in('id', userIds)
              .order('full_name')

            if (error) throw error
            setUsers(data || [])
          } else {
            setUsers([])
          }
        } else {
          // Sem filtro de empresa: carregar todos os usuários
          const { data, error } = await supabase
            .from('profiles')
            .select('id, email, full_name, avatar_url')
            .order('full_name')

          if (error) throw error
          setUsers(data || [])
        }
      } else {
        // Usuário normal: buscar company_id do usuário
        const { data: userCompanies, error: ucError } = await supabase
          .from('user_companies')
          .select('company_id')
          .eq('user_id', profile.id)
          .eq('is_active', true)
          .limit(1)
          .single()

        if (ucError) throw ucError

        // Buscar apenas usuários da mesma empresa
        const { data: companyUsers, error: cuError } = await supabase
          .from('user_companies')
          .select('user_id')
          .eq('company_id', userCompanies.company_id)
          .eq('is_active', true)

        if (cuError) throw cuError

        const userIds = companyUsers.map(cu => cu.user_id)

        // Carregar perfis dos usuários da empresa
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url')
          .in('id', userIds)
          .order('full_name')

        if (error) throw error
        setUsers(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este indicador?')) return

    try {
      const { error } = await supabase
        .from('management_indicators')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      toast.success('Indicador excluído com sucesso')
      loadIndicators()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir indicador')
    }
  }

  const handleDuplicate = async (indicator) => {
    try {
      const { id, created_at, updated_at, ...indicatorData } = indicator
      
      const { error } = await supabase
        .from('management_indicators')
        .insert({
          ...indicatorData,
          name: `${indicatorData.name} (Cópia)`
        })

      if (error) throw error
      
      toast.success('Indicador duplicado com sucesso')
      loadIndicators()
    } catch (error) {
      console.error('Erro ao duplicar:', error)
      toast.error('Erro ao duplicar indicador')
    }
  }

  const handleToggleActive = async (indicator) => {
    try {
      const { error } = await supabase
        .from('management_indicators')
        .update({ is_active: !indicator.is_active })
        .eq('id', indicator.id)

      if (error) throw error
      
      toast.success(indicator.is_active ? 'Indicador desativado' : 'Indicador ativado')
      loadIndicators()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const getTimeAgo = (date) => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now - then
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    const diffWeeks = Math.floor(diffMs / 604800000)

    if (diffMins < 60) return diffMins <= 1 ? 'Agora' : `${diffMins} minutos atrás`
    if (diffHours < 24) return diffHours === 1 ? '1 hora atrás' : `${diffHours} horas atrás`
    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) return `${diffDays} dias atrás`
    if (diffWeeks === 1) return '1 semana atrás'
    if (diffWeeks < 4) return `${diffWeeks} semanas atrás`
    return then.toLocaleDateString()
  }

  const getResponsibleName = (responsibleUserId) => {
    if (!responsibleUserId) return 'Não atribuído'
    const user = users.find(u => u.id === responsibleUserId)
    if (!user) return 'Não atribuído'
    return user.full_name || user.email
  }

  const getResponsibleInitials = (responsibleUserId) => {
    if (!responsibleUserId) return '?'
    const user = users.find(u => u.id === responsibleUserId)
    if (!user) return '?'
    const name = user.full_name || user.email
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  // Filtrar indicadores
  const filteredIndicators = indicators.filter(indicator => {
    const matchesSearch = indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         indicator.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesJourney = journeyFilter === 'Todas' || indicator.journey === journeyFilter
    const matchesStatus = statusFilter === 'Todos' || 
                         (statusFilter === 'Ativo' && indicator.is_active) ||
                         (statusFilter === 'Inativo' && !indicator.is_active)
    const matchesResponsible = responsibleFilter === 'Todos' || 
                              indicator.responsible_user_id === responsibleFilter

    return matchesSearch && matchesJourney && matchesStatus && matchesResponsible
  })

  // Estatísticas
  const stats = {
    total: indicators.length,
    active: indicators.filter(ind => ind.is_active).length,
    inactive: indicators.filter(ind => !ind.is_active).length,
    byJourney: journeys.slice(1).reduce((acc, journey) => {
      acc[journey] = indicators.filter(ind => ind.journey === journey).length
      return acc
    }, {})
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <button
                onClick={() => navigate('/indicators')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors group"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Voltar para Indicadores</span>
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Gerenciar Indicadores
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Crie e gerencie seus indicadores de gestão
              </p>
            </div>

            <button
              onClick={() => {
                setEditingIndicator(null)
                setShowModal(true)
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all font-medium shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Adicionar Indicador</span>
              <span className="sm:hidden">Adicionar</span>
            </button>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-6">
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${permissions.isSuperAdmin() ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
            {/* Barra de Busca */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <Search className="h-4 w-4 text-yellow-500" />
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-yellow-400" />
                <input
                  type="text"
                  placeholder="Nome ou tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 hover:border-gray-300 transition-all bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Filtro Jornada */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <Target className="h-4 w-4 text-purple-500" />
                Jornada
              </label>
              <div className="relative">
                <select
                  value={journeyFilter}
                  onChange={(e) => setJourneyFilter(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-gray-300 transition-all bg-gradient-to-r from-purple-50 to-white focus:from-white focus:to-white appearance-none cursor-pointer font-medium text-gray-700"
                >
                  {journeys.map(journey => (
                    <option key={journey} value={journey}>{journey}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400 pointer-events-none" />
              </div>
            </div>

            {/* Filtro Status */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <Zap className="h-4 w-4 text-blue-500" />
                Status
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all bg-gradient-to-r from-blue-50 to-white focus:from-white focus:to-white appearance-none cursor-pointer font-medium text-gray-700"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400 pointer-events-none" />
              </div>
            </div>

            {/* Filtro Responsável */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <User className="h-4 w-4 text-green-500" />
                Responsável
              </label>
              <div className="relative">
                <select
                  value={responsibleFilter}
                  onChange={(e) => setResponsibleFilter(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-gray-300 transition-all bg-gradient-to-r from-green-50 to-white focus:from-white focus:to-white appearance-none cursor-pointer font-medium text-gray-700"
                >
                  <option value="Todos">Todos responsáveis</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Filtro Empresa - Só aparece para Super Admin */}
            {permissions.isSuperAdmin() && (
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  <Building2 className="h-4 w-4 text-yellow-500" />
                  Empresa
                </label>
                <div className="relative">
                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 hover:border-gray-300 transition-all bg-yellow-50 focus:bg-white appearance-none cursor-pointer font-medium text-gray-700"
                  >
                    <option value="Todas">Todas as empresas</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-yellow-400 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controles da Tabela */}
        <div className="flex items-center justify-end mb-4">
          <p className="text-sm text-gray-600 font-medium">
            Mostrando <span className="text-yellow-600 font-bold">{filteredIndicators.length}</span> indicador{filteredIndicators.length !== 1 ? 'es' : ''}
          </p>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mb-4"></div>
              <p className="text-gray-500">Carregando indicadores...</p>
            </div>
          ) : filteredIndicators.length === 0 ? (
            <div className="p-12 text-center">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4 text-lg font-medium">Nenhum indicador encontrado</p>
              <button
                onClick={() => {
                  setEditingIndicator(null)
                  setShowModal(true)
                }}
                className="px-6 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all font-medium shadow-md hover:shadow-lg"
              >
                Criar primeiro indicador
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Indicador
                    </th>
                    {permissions.isSuperAdmin() && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Empresa
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Jornada
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Responsável
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Ativo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Última Atualização
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredIndicators.map((indicator) => {
                    const journeyColors = {
                      'Estratégia': 'bg-purple-100 text-purple-800 border-purple-200',
                      'Financeira': 'bg-blue-100 text-blue-800 border-blue-200',
                      'Receita': 'bg-yellow-100 text-yellow-800 border-yellow-200',
                      'Pessoas & Cultura': 'bg-pink-100 text-pink-800 border-pink-200',
                      'Operacional': 'bg-green-100 text-green-800 border-green-200'
                    }
                    
                    return (
                    <tr key={indicator.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{indicator.name}</div>
                        {indicator.description && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">{indicator.description}</div>
                        )}
                      </td>
                      {permissions.isSuperAdmin() && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">
                              {indicator.companies?.name || 'N/A'}
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${journeyColors[indicator.journey] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                          {indicator.journey}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-800">
                          {indicator.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-semibold shadow-sm overflow-hidden">
                            {avatarUrls[indicator.responsible_user_id] ? (
                              <img 
                                src={avatarUrls[indicator.responsible_user_id]} 
                                alt={getResponsibleName(indicator.responsible_user_id)}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <span 
                              className="text-xs font-semibold"
                              style={{ display: avatarUrls[indicator.responsible_user_id] ? 'none' : 'flex' }}
                            >
                              {getResponsibleInitials(indicator.responsible_user_id)}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {getResponsibleName(indicator.responsible_user_id)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleToggleActive(indicator)}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all shadow-sm ${
                            indicator.is_active ? 'bg-green-500' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              indicator.is_active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{getTimeAgo(indicator.updated_at)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingIndicator(indicator)
                              setShowModal(true)
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:shadow-sm"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(indicator)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all hover:shadow-sm"
                            title="Duplicar"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(indicator.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:shadow-sm"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginação */}
        {filteredIndicators.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {filteredIndicators.length} indicador{filteredIndicators.length !== 1 ? 'es' : ''}
            </p>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50" disabled>
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium">1</span>
              <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50" disabled>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <IndicatorModal
          indicator={editingIndicator}
          onClose={() => {
            setShowModal(false)
            setEditingIndicator(null)
          }}
          onSave={() => {
            setShowModal(false)
            setEditingIndicator(null)
            loadIndicators()
          }}
        />
      )}
    </div>
  )
}
