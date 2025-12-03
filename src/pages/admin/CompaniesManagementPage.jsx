import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Building2, 
  Search, 
  Edit, 
  Trash2, 
  Plus,
  Users,
  Calendar,
  Globe,
  Mail,
  Phone,
  Eye,
  BarChart3,
  List,
  Grid3X3,
  Target,
  FileText,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'
import toast from 'react-hot-toast'

const COMPANY_TYPES = {
  'micro': { label: 'Micro Empresa', color: 'green' },
  'pequena': { label: 'Pequena Empresa', color: 'blue' },
  'media': { label: 'Média Empresa', color: 'purple' },
  'grande': { label: 'Grande Empresa', color: 'red' }
}

  const getTypeInfo = (type) => COMPANY_TYPES[type] || { label: type || 'Não definido', color: 'gray' }

  // Componente para Card do Grid
  const CompanyGridCard = ({ company, onView, onEdit, onDelete, onNavigateToPlanejamento, onNavigateToPolicies, logoUrls }) => {
    const typeInfo = getTypeInfo(company.size)
    
    return (
      <div className="bg-white border border-gray-200/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:border-[#EBA500]/30 group">
        {/* Linha de ações - sempre no topo */}
        <div className="flex justify-end gap-1 mb-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onView(company)}
            className="text-blue-600 hover:text-blue-800 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-200 border border-blue-200 min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 touch-manipulation flex items-center justify-center"
            title="Visualizar detalhes"
          >
            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          
          <button
            onClick={() => onEdit(company)}
            className="text-[#EBA500] hover:text-[#EBA500]/80 bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/5 hover:from-[#EBA500]/20 hover:to-[#EBA500]/10 p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-200 border border-[#EBA500]/30 min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 touch-manipulation flex items-center justify-center"
            title="Editar empresa"
          >
            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          
          <button
            onClick={() => onNavigateToPlanejamento(company)}
            className="text-purple-600 hover:text-purple-800 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-200 border border-purple-200 min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 touch-manipulation flex items-center justify-center"
            title="Planejamento Estratégico"
          >
            <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          
          <button
            onClick={() => onNavigateToPolicies(company)}
            className="text-green-600 hover:text-green-800 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-200 border border-green-200 min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 touch-manipulation flex items-center justify-center"
            title="Políticas Operacionais"
          >
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          
          <button
            onClick={() => onDelete(company.id)}
            className="text-red-600 hover:text-red-800 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-200 border border-red-200 min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 touch-manipulation flex items-center justify-center"
            title="Excluir empresa"
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>

        {/* Logo e informações da empresa */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#EBA500]/20 to-[#EBA500]/10 flex items-center justify-center overflow-hidden flex-shrink-0">
            {logoUrls[company.id] ? (
              <img 
                src={logoUrls[company.id]} 
                alt={company.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}
            <Building2 
              className="h-5 w-5 sm:h-6 sm:w-6 text-[#EBA500]" 
              style={{ display: logoUrls[company.id] ? 'none' : 'block' }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-[#373435] group-hover:text-[#EBA500] transition-colors duration-200 truncate">
              {company.name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 flex items-center truncate">
              <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{formatDate(company.created_at)}</span>
            </p>
          </div>
        </div>
        
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-xl sm:rounded-2xl text-xs font-medium bg-gradient-to-r from-${typeInfo.color}-50 to-${typeInfo.color}-100 text-${typeInfo.color}-700 border border-${typeInfo.color}-200`}>
              {typeInfo.label}
            </span>
            {company.industry && (
              <div className="flex items-center text-xs text-gray-500 min-w-0">
                <Globe className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{company.industry}</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2 sm:pt-3 border-t border-gray-100">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-[#373435]">{company.usersCount}</div>
              <div className="text-xs text-gray-500 flex items-center justify-center">
                <Users className="h-3 w-3 mr-1" />
                Usuários
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-[#373435]">{company.evaluationsCount}</div>
              <div className="text-xs text-gray-500 flex items-center justify-center">
                <BarChart3 className="h-3 w-3 mr-1" />
                Avaliações
              </div>
            </div>
          </div>
          
          {company.adminUser && (
            <div className="pt-2 sm:pt-3 border-t border-gray-100">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Administrador:</div>
              <div className="text-xs sm:text-sm font-medium text-[#373435] truncate">
                {company.adminUser.full_name || 'Nome não informado'}
              </div>
              {company.email && (
                <div className="text-xs text-gray-500 flex items-center mt-1 truncate">
                  <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{company.email}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

export default function CompaniesManagementPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [viewMode, setViewMode] = useState('list') // 'list' or 'grid'
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [modalAnimating, setModalAnimating] = useState(false)
  const [logoUrls, setLogoUrls] = useState({})

  // Fechar modal com ESC
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && (isEditModalOpen || isViewModalOpen)) {
        closeAllModals()
      }
    }

    if (isEditModalOpen || isViewModalOpen) {
      document.addEventListener('keydown', handleEscKey)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
      document.body.style.overflow = 'unset'
    }
  }, [isEditModalOpen, isViewModalOpen])

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      setLoading(true)
      
      // Buscar empresas
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })

      if (companiesError) throw companiesError

      // Buscar relações user_companies para contar usuários por empresa
      const { data: userCompaniesData, error: userCompaniesError } = await supabase
        .from('user_companies')
        .select('user_id, company_id, role, is_active')
        .eq('is_active', true)

      if (userCompaniesError) throw userCompaniesError

      // Buscar perfis de usuários para obter informações dos admins
      const userIds = userCompaniesData?.map(uc => uc.user_id) || []
      let profilesData = []
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds)

        if (profilesError) throw profilesError
        profilesData = profiles || []
      }

      // Contar usuários e processos para cada empresa
      const enrichedCompanies = await Promise.all(
        companiesData.map(async (company) => {
          // Filtrar usuários da empresa usando user_companies
          const companyUserRelations = userCompaniesData?.filter(uc => uc.company_id === company.id) || []
          
          // Encontrar admin da empresa
          const adminRelation = companyUserRelations.find(uc => uc.role === 'company_admin')
          let adminUser = null
          if (adminRelation) {
            adminUser = profilesData.find(profile => profile.id === adminRelation.user_id)
          }
          
          // Contar avaliações de processos
          const { count: evaluationsCount } = await supabase
            .from('process_evaluations')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)

          return {
            ...company,
            usersCount: companyUserRelations.length,
            evaluationsCount: evaluationsCount || 0,
            adminUser: adminUser,
            userRelations: companyUserRelations // Para debug se necessário
          }
        })
      )

      setCompanies(enrichedCompanies)

      // Carregar logos das empresas
      const urls = {}
      for (const company of enrichedCompanies) {
        if (company.logo_url) {
          const { data } = await supabase.storage
            .from('company-avatars')
            .createSignedUrl(company.logo_url, 3600) // 1 hora
          
          if (data?.signedUrl) {
            urls[company.id] = data.signedUrl
          }
        }
      }
      setLogoUrls(urls)
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCompany = async (companyId, updates) => {
    try {
      setUpdating(true)
      
      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', companyId)

      if (error) throw error

      await loadCompanies()
      closeAllModals()
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error)
      alert('Erro ao atualizar empresa')
    } finally {
      setUpdating(false)
    }
  }

  const closeAllModals = () => {
    setModalAnimating(false)
    setTimeout(() => {
      setIsEditModalOpen(false)
      setIsViewModalOpen(false)
      setSelectedCompany(null)
    }, 200)
  }

  const openEditModal = (company) => {
    setSelectedCompany(company)
    setIsEditModalOpen(true)
    setTimeout(() => setModalAnimating(true), 10)
  }

  const openViewModal = (company) => {
    setSelectedCompany(company)
    setIsViewModalOpen(true)
    setTimeout(() => setModalAnimating(true), 10)
  }

  // Funções de navegação para Super Admin
  const handleNavigateToPlanejamento = (company) => {
    // Salvar contexto no sessionStorage
    sessionStorage.setItem('superAdminContext', JSON.stringify({
      companyId: company.id,
      companyName: company.name,
      returnUrl: '/admin/companies'
    }))
    
    // Navegar para planejamento estratégico
    navigate(`/planejamento-estrategico?companyId=${company.id}&from=admin`)
  }

  const handleNavigateToPolicies = (company) => {
    // Salvar contexto no sessionStorage
    sessionStorage.setItem('superAdminContext', JSON.stringify({
      companyId: company.id,
      companyName: company.name,
      returnUrl: '/admin/companies'
    }))
    
    // Navegar para políticas operacionais
    navigate(`/operational-policies?companyId=${company.id}&from=admin`)
  }

  const handleDeleteCompany = async (companyId) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.')) {
      return
    }

    try {
      setUpdating(true)
      
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId)

      if (error) throw error

      await loadCompanies()
    } catch (error) {
      console.error('Erro ao excluir empresa:', error)
      alert('Erro ao excluir empresa')
    } finally {
      setUpdating(false)
    }
  }

  // Filtrar empresas
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = !searchTerm || 
      company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = !typeFilter || company.size === typeFilter

    return matchesSearch && matchesType
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#373435] mb-2 sm:mb-3">
            Gestão de Empresas
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            {companies.length} {companies.length === 1 ? 'empresa cadastrada' : 'empresas cadastradas'}
          </p>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#EBA500]/20 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-[#EBA500]/40">
            <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-2 sm:space-y-0">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-[#EBA500]/20 to-[#EBA500]/10 rounded-xl sm:rounded-2xl">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-[#EBA500]" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Empresas</p>
                <p className="text-xl sm:text-2xl font-bold text-[#373435]">{companies.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-emerald-200/50 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-emerald-200">
            <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-2 sm:space-y-0">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-100/80 to-emerald-50 rounded-xl sm:rounded-2xl">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Usuários</p>
                <p className="text-xl sm:text-2xl font-bold text-[#373435]">
                  {companies.reduce((acc, company) => acc + company.usersCount, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-purple-200/50 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-purple-200">
            <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-2 sm:space-y-0">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-100/80 to-purple-50 rounded-xl sm:rounded-2xl">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Avaliações</p>
                <p className="text-xl sm:text-2xl font-bold text-[#373435]">
                  {companies.reduce((acc, company) => acc + company.evaluationsCount, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-blue-200/50 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-blue-200">
            <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-2 sm:space-y-0">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-100/80 to-blue-50 rounded-xl sm:rounded-2xl">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Ativas</p>
                <p className="text-xl sm:text-2xl font-bold text-[#373435]">
                  {companies.filter(c => c.evaluationsCount > 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white shadow-sm border border-gray-200/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                placeholder="Buscar empresas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200 min-h-[44px] sm:min-h-0"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200 min-h-[44px] sm:min-h-0 touch-manipulation"
            >
              <option value="">Todos os tipos</option>
              {Object.entries(COMPANY_TYPES).map(([key, type]) => (
                <option key={key} value={key}>{type.label}</option>
              ))}
            </select>

            <div className="flex flex-col sm:flex-row gap-3 sm:col-span-2 lg:col-span-1">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setTypeFilter('')
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-[#373435] rounded-2xl hover:from-gray-200 hover:to-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300/50 font-medium transition-all duration-200 min-h-[44px] sm:min-h-0 touch-manipulation"
              >
                Limpar Filtros
              </button>

              <button
                onClick={() => window.location.href = '/companies/new'}
                className="px-4 sm:px-6 py-3 bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 text-white rounded-2xl hover:from-[#EBA500]/90 hover:to-[#EBA500]/80 focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center min-h-[44px] sm:min-h-0 touch-manipulation whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span>Nova Empresa</span>
              </button>
            </div>
          </div>
        </div>

        {/* Lista/Grid de Empresas */}
        {filteredCompanies.length === 0 && !loading ? (
          <div className="bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/5 border border-[#EBA500]/30 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center">
            <Building2 className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-[#EBA500] mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-[#373435] mb-2 sm:mb-3">
              Nenhuma empresa encontrada
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              {searchTerm || typeFilter
                ? 'Tente ajustar os filtros de busca.'
                : 'Crie uma nova empresa para começar.'}
            </p>
            {!searchTerm && !typeFilter && (
              <button
                onClick={() => window.location.href = '/companies/new'}
                className="px-6 py-3 bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 text-white rounded-2xl hover:from-[#EBA500]/90 hover:to-[#EBA500]/80 focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 font-medium transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center min-h-[44px] touch-manipulation"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Empresa
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div>
            <div className="bg-white shadow-sm border border-gray-200/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <h2 className="text-lg sm:text-xl font-semibold text-[#373435] flex items-center">
                  <Building2 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-[#EBA500]" />
                  <span className="truncate">Empresas Cadastradas</span>
                </h2>
                <div className="flex bg-gray-100 rounded-2xl p-1 w-full sm:w-auto">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 min-h-[40px] sm:min-h-0 touch-manipulation ${
                      viewMode === 'list'
                        ? 'bg-white text-[#373435] shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <List className="h-4 w-4 mr-2" />
                    Lista
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 min-h-[40px] sm:min-h-0 touch-manipulation ${
                      viewMode === 'grid'
                        ? 'bg-white text-[#373435] shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4 mr-2" />
                    Grid
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredCompanies.map((company) => (
                <CompanyGridCard
                  key={company.id}
                  company={company}
                  onView={openViewModal}
                  onEdit={openEditModal}
                  onDelete={handleDeleteCompany}
                  onNavigateToPlanejamento={handleNavigateToPlanejamento}
                  onNavigateToPolicies={handleNavigateToPolicies}
                  logoUrls={logoUrls}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-sm border border-gray-200/50 rounded-2xl sm:rounded-3xl overflow-hidden">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <h2 className="text-lg sm:text-xl font-semibold text-[#373435] flex items-center">
                  <Building2 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-[#EBA500]" />
                  <span className="truncate">Empresas Cadastradas</span>
                </h2>
                <div className="flex bg-gray-100 rounded-2xl p-1 w-full sm:w-auto">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 min-h-[40px] sm:min-h-0 touch-manipulation ${
                      viewMode === 'list'
                        ? 'bg-white text-[#373435] shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <List className="h-4 w-4 mr-2" />
                    Lista
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 min-h-[40px] sm:min-h-0 touch-manipulation ${
                      viewMode === 'grid'
                        ? 'bg-white text-[#373435] shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4 mr-2" />
                    Grid
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                  <tr>
                    <th className="pl-6 pr-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                      Tipo/Setor
                    </th>
                    <th className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                      Estatísticas
                    </th>
                    <th className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {filteredCompanies.map((company, index) => {
                    const typeInfo = getTypeInfo(company.size)
                    
                    return (
                      <tr key={company.id} className="hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-[#EBA500]/5 transition-all duration-200">
                        <td className="pl-6 pr-4 sm:px-6 lg:px-8 py-4 sm:py-6 whitespace-nowrap">
                          <div className="flex items-center min-w-0">
                            <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12">
                              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-[#EBA500]/20 to-[#EBA500]/10 flex items-center justify-center overflow-hidden">
                                {logoUrls[company.id] ? (
                                  <img 
                                    src={logoUrls[company.id]} 
                                    alt={company.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none'
                                      e.target.nextSibling.style.display = 'flex'
                                    }}
                                  />
                                ) : null}
                                <Building2 
                                  className="h-6 w-6 text-[#EBA500]" 
                                  style={{ display: logoUrls[company.id] ? 'none' : 'block' }}
                                />
                              </div>
                            </div>
                            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                              <div className="text-xs sm:text-sm font-semibold text-[#373435] truncate">
                                {company.name}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500 flex items-center mt-1 truncate">
                                <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{formatDate(company.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 whitespace-nowrap">
                          <div className="space-y-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-2xl text-xs font-medium bg-gradient-to-r from-${typeInfo.color}-50 to-${typeInfo.color}-100 text-${typeInfo.color}-700 border border-${typeInfo.color}-200`}>
                              {typeInfo.label}
                            </span>
                            {company.industry && (
                              <div className="flex items-center text-xs text-gray-500">
                                <Globe className="h-3 w-3 mr-1" />
                                {company.industry}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 whitespace-nowrap">
                          <div className="flex gap-3 sm:gap-4">
                            <div className="text-center">
                              <div className="text-base sm:text-lg font-semibold text-[#373435]">
                                {company.usersCount}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Usuários</span>
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-base sm:text-lg font-semibold text-[#373435]">
                                {company.evaluationsCount}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center">
                                <BarChart3 className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Aval.</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 whitespace-nowrap">
                          {company.adminUser ? (
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-medium text-[#373435] truncate">
                                {company.adminUser.full_name || 'Nome não informado'}
                              </div>
                              {company.email && (
                                <div className="text-xs text-gray-500 flex items-center mt-1 truncate">
                                  <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">{company.email}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              Sem admin
                            </span>
                          )}
                        </td>
                        
                        <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <button
                              onClick={() => openViewModal(company)}
                              className="text-blue-600 hover:text-blue-800 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 p-2 rounded-xl transition-all duration-200 border border-blue-200 min-h-[40px] sm:min-h-0 touch-manipulation"
                              title="Visualizar detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => openEditModal(company)}
                              className="text-[#EBA500] hover:text-[#EBA500]/80 bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/5 hover:from-[#EBA500]/20 hover:to-[#EBA500]/10 p-2 rounded-xl transition-all duration-200 border border-[#EBA500]/30 min-h-[40px] sm:min-h-0 touch-manipulation"
                              title="Editar empresa"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => handleNavigateToPlanejamento(company)}
                              className="text-purple-600 hover:text-purple-800 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 p-2 rounded-xl transition-all duration-200 border border-purple-200 min-h-[40px] sm:min-h-0 touch-manipulation"
                              title="Planejamento Estratégico"
                            >
                              <Target className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => handleNavigateToPolicies(company)}
                              className="text-green-600 hover:text-green-800 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 p-2 rounded-xl transition-all duration-200 border border-green-200 min-h-[40px] sm:min-h-0 touch-manipulation"
                              title="Políticas Operacionais"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteCompany(company.id)}
                              className="text-red-600 hover:text-red-800 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 p-2 rounded-xl transition-all duration-200 border border-red-200 min-h-[40px] sm:min-h-0 touch-manipulation"
                              title="Excluir empresa"
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
          </div>
        )}

        {/* Modal de Visualização */}
        {isViewModalOpen && selectedCompany && (
          <CompanyViewModal
            company={selectedCompany}
            onClose={closeAllModals}
            animating={modalAnimating}
          />
        )}

        {/* Modal de Edição */}
        {isEditModalOpen && selectedCompany && (
          <CompanyEditModal
            company={selectedCompany}
            onClose={closeAllModals}
            onSave={handleUpdateCompany}
            loading={updating}
            animating={modalAnimating}
          />
        )}
      </div>
    </div>
  )
}

// Componente Modal de Visualização
function CompanyViewModal({ company, onClose, animating }) {
  const typeInfo = getTypeInfo(company.size)

  return (
    <div 
      className={`fixed inset-0 bg-gray-900 transition-all duration-200 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 ${
        animating ? 'bg-opacity-60' : 'bg-opacity-0'
      }`}
      onClick={onClose}
    >
      <div 
        className={`relative p-6 sm:p-8 border border-gray-200/50 max-w-2xl w-full my-auto shadow-2xl rounded-2xl sm:rounded-3xl bg-white transition-all duration-200 transform max-h-[90vh] overflow-y-auto ${
          animating 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-[#373435] pr-8">
            Detalhes da Empresa
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-full min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 touch-manipulation flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#373435] mb-1 block">Nome</label>
              <p className="text-sm text-gray-700 bg-gray-50 p-2.5 rounded-xl break-words">{company.name}</p>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-[#373435] mb-1 block">Documento Fiscal</label>
              <p className="text-sm text-gray-700 bg-gray-50 p-2.5 rounded-xl">{company.cnpj || 'Não informado'}</p>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-[#373435] mb-1 block">Tamanho</label>
              <span className={`inline-flex items-center px-2.5 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-${typeInfo.color}-50 to-${typeInfo.color}-100 text-${typeInfo.color}-700 border border-${typeInfo.color}-200`}>
                {typeInfo.label}
              </span>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-[#373435] mb-1 block">Setor</label>
              <p className="text-sm text-gray-700 bg-gray-50 p-2.5 rounded-xl">{company.industry || 'Não informado'}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#373435] mb-1 block">Email</label>
              <p className="text-sm text-gray-700 bg-gray-50 p-2.5 rounded-xl break-all">{company.email || 'Não informado'}</p>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-[#373435] mb-1 block">Telefone</label>
              <p className="text-sm text-gray-700 bg-gray-50 p-2.5 rounded-xl">{company.phone || 'Não informado'}</p>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-[#373435] mb-1 block">Website</label>
              <p className="text-sm text-gray-700 bg-gray-50 p-2.5 rounded-xl break-all">{company.website || 'Não informado'}</p>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-[#373435] mb-1 block">Data de Criação</label>
              <p className="text-sm text-gray-700 bg-gray-50 p-2.5 rounded-xl">{formatDate(company.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center p-2.5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200">
            <Users className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-[#373435]">{company.usersCount}</div>
            <div className="text-xs text-emerald-600 font-medium">Usuários</div>
          </div>
          
          <div className="text-center p-2.5 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl border border-purple-200">
            <BarChart3 className="h-5 w-5 text-purple-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-[#373435]">{company.evaluationsCount}</div>
            <div className="text-xs text-purple-600 font-medium">Avaliações</div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-[#373435] rounded-xl hover:from-gray-200 hover:to-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300/50 font-medium transition-all duration-200 min-h-[44px] sm:min-h-0 touch-manipulation text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

// Componente Modal de Edição
function CompanyEditModal({ company, onClose, onSave, loading, animating }) {
  const [formData, setFormData] = useState({
    name: company.name || '',
    industry: company.industry || '',
    size: company.size || 'pequena',
    email: company.email || '',
    phone: company.phone || '',
    website: company.website || '',
    cnpj: company.cnpj || ''
  })
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [currentLogoUrl, setCurrentLogoUrl] = useState(null)
  const [removeLogo, setRemoveLogo] = useState(false)

  // Carregar logo atual se existir
  useEffect(() => {
    const loadCurrentLogo = async () => {
      if (company.logo_url) {
        const { data } = await supabase.storage
          .from('company-avatars')
          .createSignedUrl(company.logo_url, 3600)
        
        if (data?.signedUrl) {
          setCurrentLogoUrl(data.signedUrl)
        }
      }
    }
    loadCurrentLogo()
  }, [company.logo_url])

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    
    if (!file) return

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Tipo de arquivo inválido. Use JPG, PNG, GIF ou WEBP')
      return
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. O tamanho máximo é 5MB')
      return
    }

    setLogoFile(file)
    setRemoveLogo(false)

    // Criar preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setCurrentLogoUrl(null)
    setRemoveLogo(true)
    toast.success('Logo será removido ao salvar')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    let logoUrl = company.logo_url

    try {
      // 1. Se há um novo logo para upload
      if (logoFile) {
        // Deletar logo antigo se existir
        if (company.logo_url) {
          await supabase.storage
            .from('company-avatars')
            .remove([company.logo_url])
        }

        // Upload do novo logo
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('company-avatars')
          .upload(filePath, logoFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          throw new Error(`Erro ao fazer upload do logo: ${uploadError.message}`)
        }

        logoUrl = filePath
      }
      // 2. Se o usuário marcou para remover o logo
      else if (removeLogo && company.logo_url) {
        await supabase.storage
          .from('company-avatars')
          .remove([company.logo_url])
        
        logoUrl = null
      }

      // 3. Atualizar empresa com novo logo_url
      await onSave(company.id, { ...formData, logo_url: logoUrl })
      
    } catch (error) {
      console.error('Erro ao processar logo:', error)
      toast.error(error.message || 'Erro ao processar logo')
    }
  }

  return (
    <div 
      className={`fixed inset-0 bg-gray-900 transition-all duration-200 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 ${
        animating ? 'bg-opacity-60' : 'bg-opacity-0'
      }`}
      onClick={onClose}
    >
      <div 
        className={`relative p-6 sm:p-8 border border-gray-200/50 max-w-2xl w-full my-auto shadow-2xl rounded-2xl sm:rounded-3xl bg-white transition-all duration-200 transform max-h-[90vh] overflow-y-auto ${
          animating 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-[#373435] pr-8">
              Editar Empresa
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-full min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 touch-manipulation flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Upload de Logo */}
          <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-100">
            <label className="block text-xs sm:text-sm font-semibold text-[#373435] mb-2 sm:mb-3">
              <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
              Logo da Empresa
            </label>
            
            {!logoPreview && !currentLogoUrl ? (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-28 sm:h-32 border-2 border-gray-300 border-dashed rounded-xl sm:rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200 touch-manipulation">
                  <div className="flex flex-col items-center justify-center pt-4 pb-5">
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 mb-2 text-gray-400" />
                    <p className="mb-1 text-xs sm:text-sm text-gray-500 text-center px-2">
                      <span className="font-semibold">Clique para upload</span>
                      <span className="hidden sm:inline"> ou arraste e solte</span>
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF ou WEBP (MAX. 5MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleLogoChange}
                  />
                </label>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl">
                  <img
                    src={logoPreview || currentLogoUrl}
                    alt="Logo da empresa"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-lg bg-white border border-gray-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-[#373435] truncate">
                      {logoFile ? logoFile.name : 'Logo atual'}
                    </p>
                    {logoFile && (
                      <p className="text-xs text-gray-500 mt-1">
                        {(logoFile.size / 1024).toFixed(2)} KB
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 sm:gap-2">
                    <label className="cursor-pointer p-2 text-[#EBA500] hover:bg-[#EBA500]/10 rounded-lg transition-colors duration-200 min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 touch-manipulation flex items-center justify-center">
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleLogoChange}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200 min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 touch-manipulation flex items-center justify-center"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold text-[#373435] mb-2">
                Nome *
              </label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Nome da empresa"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200 text-sm min-h-[44px] sm:min-h-0"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold text-[#373435] mb-2">
                Documento Fiscal
              </label>
              <input
                value={formData.cnpj}
                onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                placeholder="CNPJ, Tax ID, etc."
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200 text-sm min-h-[44px] sm:min-h-0"
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-[#373435] mb-2">
                Tamanho
              </label>
              <select
                value={formData.size}
                onChange={(e) => setFormData({...formData, size: e.target.value})}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200 text-sm min-h-[44px] sm:min-h-0 touch-manipulation"
              >
                {Object.entries(COMPANY_TYPES).map(([key, type]) => (
                  <option key={key} value={key}>{type.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-[#373435] mb-2">
                Setor
              </label>
              <input
                value={formData.industry}
                onChange={(e) => setFormData({...formData, industry: e.target.value})}
                placeholder="Ex: Tecnologia"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200 text-sm min-h-[44px] sm:min-h-0"
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-[#373435] mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="contato@empresa.com"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200 text-sm min-h-[44px] sm:min-h-0"
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-[#373435] mb-2">
                Telefone
              </label>
              <input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="(00) 0000-0000"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200 text-sm min-h-[44px] sm:min-h-0"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold text-[#373435] mb-2">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                placeholder="https://www.empresa.com"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200 text-sm min-h-[44px] sm:min-h-0"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-[#373435] rounded-xl sm:rounded-2xl hover:from-gray-200 hover:to-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300/50 font-medium transition-all duration-200 text-sm min-h-[44px] sm:min-h-0 touch-manipulation"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 sm:px-8 py-2.5 bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 text-white rounded-xl sm:rounded-2xl hover:from-[#EBA500]/90 hover:to-[#EBA500]/80 focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[44px] sm:min-h-0 touch-manipulation"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}