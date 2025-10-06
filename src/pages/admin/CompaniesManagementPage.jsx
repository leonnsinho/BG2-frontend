import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Layout } from '../../components/layout/Layout'
import { Sidebar } from '../../components/layout/Sidebar'
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
  ArrowLeft,
  List,
  Grid3X3
} from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'

const COMPANY_TYPES = {
  'micro': { label: 'Micro Empresa', color: 'green' },
  'pequena': { label: 'Pequena Empresa', color: 'blue' },
  'media': { label: 'Média Empresa', color: 'purple' },
  'grande': { label: 'Grande Empresa', color: 'red' }
}

  const getTypeInfo = (type) => COMPANY_TYPES[type] || { label: type || 'Não definido', color: 'gray' }

  // Componente para Card do Grid
  const CompanyGridCard = ({ company, onView, onEdit, onDelete }) => {
    const typeInfo = getTypeInfo(company.size)
    
    return (
      <div className="bg-white border border-gray-200/50 rounded-3xl p-6 hover:shadow-lg transition-all duration-200 hover:border-[#EBA500]/30 group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#EBA500]/20 to-[#EBA500]/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-[#EBA500]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#373435] group-hover:text-[#EBA500] transition-colors duration-200">
                {company.name}
              </h3>
              <p className="text-sm text-gray-500 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(company.created_at)}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => onView(company)}
              className="text-blue-600 hover:text-blue-800 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 p-2 rounded-xl transition-all duration-200 border border-blue-200"
              title="Visualizar detalhes"
            >
              <Eye className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => onEdit(company)}
              className="text-[#EBA500] hover:text-[#EBA500]/80 bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/5 hover:from-[#EBA500]/20 hover:to-[#EBA500]/10 p-2 rounded-xl transition-all duration-200 border border-[#EBA500]/30"
              title="Editar empresa"
            >
              <Edit className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => onDelete(company.id)}
              className="text-red-600 hover:text-red-800 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 p-2 rounded-xl transition-all duration-200 border border-red-200"
              title="Excluir empresa"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
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
          
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
            <div className="text-center">
              <div className="text-xl font-bold text-[#373435]">{company.usersCount}</div>
              <div className="text-xs text-gray-500 flex items-center justify-center">
                <Users className="h-3 w-3 mr-1" />
                Usuários
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-[#373435]">{company.evaluationsCount}</div>
              <div className="text-xs text-gray-500 flex items-center justify-center">
                <BarChart3 className="h-3 w-3 mr-1" />
                Avaliações
              </div>
            </div>
          </div>
          
          {company.adminUser && (
            <div className="pt-3 border-t border-gray-100">
              <div className="text-sm text-gray-600 mb-1">Administrador:</div>
              <div className="text-sm font-medium text-[#373435]">
                {company.adminUser.full_name || 'Nome não informado'}
              </div>
              {company.email && (
                <div className="text-xs text-gray-500 flex items-center mt-1">
                  <Mail className="h-3 w-3 mr-1" />
                  {company.email}
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
    <Layout sidebar={<Sidebar />}>
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#373435] mb-3">
              Gerenciamento de Empresas
            </h1>
            <p className="text-gray-600 text-lg">
              {companies.length} empresas cadastradas no sistema
            </p>
          </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-[#EBA500]/20 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-[#EBA500]/40">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-[#EBA500]/20 to-[#EBA500]/10 rounded-2xl">
                <Building2 className="h-6 w-6 text-[#EBA500]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Empresas</p>
                <p className="text-2xl font-bold text-[#373435]">{companies.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-emerald-200/50 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-emerald-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-emerald-100/80 to-emerald-50 rounded-2xl">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usuários</p>
                <p className="text-2xl font-bold text-[#373435]">
                  {companies.reduce((acc, company) => acc + company.usersCount, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-purple-200/50 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-purple-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-purple-100/80 to-purple-50 rounded-2xl">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Avaliações</p>
                <p className="text-2xl font-bold text-[#373435]">
                  {companies.reduce((acc, company) => acc + company.evaluationsCount, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-blue-200/50 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-blue-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-100/80 to-blue-50 rounded-2xl">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Empresas Ativas</p>
                <p className="text-2xl font-bold text-[#373435]">
                  {companies.filter(c => c.evaluationsCount > 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white shadow-sm border border-gray-200/50 rounded-3xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                placeholder="Buscar empresas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200"
            >
              <option value="">Todos os tipos</option>
              {Object.entries(COMPANY_TYPES).map(([key, type]) => (
                <option key={key} value={key}>{type.label}</option>
              ))}
            </select>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setTypeFilter('')
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-[#373435] rounded-2xl hover:from-gray-200 hover:to-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300/50 font-medium transition-all duration-200"
              >
                Limpar Filtros
              </button>

              <button
                onClick={() => window.location.href = '/companies/new'}
                className="px-6 py-3 bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 text-white rounded-2xl hover:from-[#EBA500]/90 hover:to-[#EBA500]/80 focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Empresa
              </button>
            </div>
          </div>
        </div>

        {/* Lista/Grid de Empresas */}
        {filteredCompanies.length === 0 && !loading ? (
          <div className="bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/5 border border-[#EBA500]/30 rounded-3xl p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-[#EBA500] mb-4" />
            <h3 className="text-lg font-semibold text-[#373435] mb-3">
              Nenhuma empresa encontrada
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || typeFilter
                ? 'Tente ajustar os filtros de busca.'
                : 'Crie uma nova empresa para começar.'}
            </p>
            {!searchTerm && !typeFilter && (
              <button
                onClick={() => window.location.href = '/companies/new'}
                className="px-6 py-3 bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 text-white rounded-2xl hover:from-[#EBA500]/90 hover:to-[#EBA500]/80 focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 font-medium transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Empresa
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div>
            <div className="bg-white shadow-sm border border-gray-200/50 rounded-3xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#373435] flex items-center">
                  <Building2 className="h-6 w-6 mr-3 text-[#EBA500]" />
                  Empresas Cadastradas
                </h2>
                <div className="flex bg-gray-100 rounded-2xl p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center px-3 py-2 rounded-xl transition-all duration-200 ${
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
                    className={`flex items-center px-3 py-2 rounded-xl transition-all duration-200 ${
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCompanies.map((company) => (
                <CompanyGridCard
                  key={company.id}
                  company={company}
                  onView={openViewModal}
                  onEdit={openEditModal}
                  onDelete={handleDeleteCompany}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-sm border border-gray-200/50 rounded-3xl overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#373435] flex items-center">
                  <Building2 className="h-6 w-6 mr-3 text-[#EBA500]" />
                  Empresas Cadastradas
                </h2>
                <div className="flex bg-gray-100 rounded-2xl p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center px-3 py-2 rounded-xl transition-all duration-200 ${
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
                    className={`flex items-center px-3 py-2 rounded-xl transition-all duration-200 ${
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                      Tipo/Setor
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                      Estatísticas
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                      Administrador
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {filteredCompanies.map((company, index) => {
                    const typeInfo = getTypeInfo(company.size)
                    
                    return (
                      <tr key={company.id} className="hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-[#EBA500]/5 transition-all duration-200">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#EBA500]/20 to-[#EBA500]/10 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-[#EBA500]" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-[#373435]">
                                {company.name}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(company.created_at)}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-8 py-6 whitespace-nowrap">
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
                        
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex space-x-4">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-[#373435]">
                                {company.usersCount}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                Usuários
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-[#373435]">
                                {company.evaluationsCount}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center">
                                <BarChart3 className="h-3 w-3 mr-1" />
                                Avaliações
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-8 py-6 whitespace-nowrap">
                          {company.adminUser ? (
                            <div>
                              <div className="text-sm font-medium text-[#373435]">
                                {company.adminUser.full_name || 'Nome não informado'}
                              </div>
                              {company.email && (
                                <div className="text-xs text-gray-500 flex items-center mt-1">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {company.email}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              Sem administrador
                            </span>
                          )}
                        </td>
                        
                        <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openViewModal(company)}
                              className="text-blue-600 hover:text-blue-800 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 p-2 rounded-xl transition-all duration-200 border border-blue-200"
                              title="Visualizar detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => openEditModal(company)}
                              className="text-[#EBA500] hover:text-[#EBA500]/80 bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/5 hover:from-[#EBA500]/20 hover:to-[#EBA500]/10 p-2 rounded-xl transition-all duration-200 border border-[#EBA500]/30"
                              title="Editar empresa"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteCompany(company.id)}
                              className="text-red-600 hover:text-red-800 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 p-2 rounded-xl transition-all duration-200 border border-red-200"
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
      className={`fixed inset-0 bg-gray-900 transition-all duration-200 overflow-y-auto h-full w-full z-50 flex items-center justify-center ${
        animating ? 'bg-opacity-60' : 'bg-opacity-0'
      }`}
      onClick={onClose}
    >
      <div 
        className={`relative p-8 border border-gray-200/50 max-w-2xl w-full mx-4 shadow-2xl rounded-3xl bg-white transition-all duration-200 transform ${
          animating 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-[#373435]">
            Detalhes da Empresa
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-[#373435] mb-2 block">Nome</label>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-2xl">{company.name}</p>
            </div>
            
            <div>
              <label className="text-sm font-semibold text-[#373435] mb-2 block">CNPJ</label>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-2xl">{company.cnpj || 'Não informado'}</p>
            </div>
            
            <div>
              <label className="text-sm font-semibold text-[#373435] mb-2 block">Tamanho</label>
              <span className={`inline-flex items-center px-3 py-2 rounded-2xl text-sm font-medium bg-gradient-to-r from-${typeInfo.color}-50 to-${typeInfo.color}-100 text-${typeInfo.color}-700 border border-${typeInfo.color}-200`}>
                {typeInfo.label}
              </span>
            </div>
            
            <div>
              <label className="text-sm font-semibold text-[#373435] mb-2 block">Setor</label>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-2xl">{company.industry || 'Não informado'}</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-[#373435] mb-2 block">Email</label>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-2xl break-all">{company.email || 'Não informado'}</p>
            </div>
            
            <div>
              <label className="text-sm font-semibold text-[#373435] mb-2 block">Telefone</label>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-2xl">{company.phone || 'Não informado'}</p>
            </div>
            
            <div>
              <label className="text-sm font-semibold text-[#373435] mb-2 block">Website</label>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-2xl break-all">{company.website || 'Não informado'}</p>
            </div>
            
            <div>
              <label className="text-sm font-semibold text-[#373435] mb-2 block">Data de Criação</label>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-2xl">{formatDate(company.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-6 mt-8 pt-8 border-t border-gray-100">
          <div className="text-center p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-2xl border border-emerald-200">
            <Users className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-[#373435]">{company.usersCount}</div>
            <div className="text-sm text-emerald-600 font-medium">Usuários Cadastrados</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-2xl border border-purple-200">
            <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-[#373435]">{company.evaluationsCount}</div>
            <div className="text-sm text-purple-600 font-medium">Avaliações Realizadas</div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-[#373435] rounded-2xl hover:from-gray-200 hover:to-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300/50 font-medium transition-all duration-200"
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

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(company.id, formData)
  }

  return (
    <div 
      className={`fixed inset-0 bg-gray-900 transition-all duration-200 overflow-y-auto h-full w-full z-50 flex items-center justify-center ${
        animating ? 'bg-opacity-60' : 'bg-opacity-0'
      }`}
      onClick={onClose}
    >
      <div 
        className={`relative p-8 border border-gray-200/50 max-w-2xl w-full mx-4 shadow-2xl rounded-3xl bg-white transition-all duration-200 transform ${
          animating 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-[#373435]">
              Editar Empresa
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#373435] mb-3">
                Nome *
              </label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Nome da empresa"
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-[#373435] mb-3">
                CNPJ
              </label>
              <input
                value={formData.cnpj}
                onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                placeholder="00.000.000/0000-00"
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-[#373435] mb-3">
                Tamanho
              </label>
              <select
                value={formData.size}
                onChange={(e) => setFormData({...formData, size: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200"
              >
                {Object.entries(COMPANY_TYPES).map(([key, type]) => (
                  <option key={key} value={key}>{type.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-[#373435] mb-3">
                Setor
              </label>
              <input
                value={formData.industry}
                onChange={(e) => setFormData({...formData, industry: e.target.value})}
                placeholder="Ex: Tecnologia, Saúde, Educação"
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-[#373435] mb-3">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="contato@empresa.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-[#373435] mb-3">
                Telefone
              </label>
              <input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="(00) 0000-0000"
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-semibold text-[#373435] mb-3">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({...formData, website: e.target.value})}
              placeholder="https://www.empresa.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200"
            />
          </div>
          
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-[#373435] rounded-2xl hover:from-gray-200 hover:to-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300/50 font-medium transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 text-white rounded-2xl hover:from-[#EBA500]/90 hover:to-[#EBA500]/80 focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}