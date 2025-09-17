import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { Loading } from '../../components/ui/Loading'
import { 
  Building2, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Plus,
  Users,
  Calendar,
  Globe,
  Mail,
  Phone,
  MapPin,
  Eye,
  UserPlus,
  BarChart3
} from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'

const COMPANY_TYPES = {
  'micro': { label: 'Micro Empresa', color: 'green' },
  'pequena': { label: 'Pequena Empresa', color: 'blue' },
  'media': { label: 'Média Empresa', color: 'purple' },
  'grande': { label: 'Grande Empresa', color: 'red' }
}

export default function CompaniesManagementPage() {
  const { user } = useAuth()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [updating, setUpdating] = useState(false)

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

      // Buscar perfis de usuários
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, role, company_id')

      if (profilesError) throw profilesError

      // Contar usuários e processos para cada empresa
      const enrichedCompanies = await Promise.all(
        companiesData.map(async (company) => {
          // Filtrar usuários da empresa
          const companyProfiles = profilesData?.filter(profile => profile.company_id === company.id) || []
          
          // Contar avaliações de processos
          const { count: evaluationsCount } = await supabase
            .from('process_evaluations')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)

          return {
            ...company,
            usersCount: companyProfiles.length,
            evaluationsCount: evaluationsCount || 0,
            adminUser: companyProfiles.find(user => user.role === 'company_admin'),
            profiles: companyProfiles // Manter para compatibilidade
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
      setIsEditModalOpen(false)
      setSelectedCompany(null)
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error)
      alert('Erro ao atualizar empresa')
    } finally {
      setUpdating(false)
    }
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

  const getTypeInfo = (type) => COMPANY_TYPES[type] || { label: type || 'Não definido', color: 'gray' }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loading />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gerenciamento de Empresas
              </h1>
              <p className="text-gray-600">
                {companies.length} empresas cadastradas no sistema
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => window.location.href = '/companies/new'}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Empresa</span>
          </Button>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Empresas</p>
                <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Usuários</p>
                <p className="text-2xl font-bold text-gray-900">
                  {companies.reduce((acc, company) => acc + company.usersCount, 0)}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Avaliações</p>
                <p className="text-2xl font-bold text-gray-900">
                  {companies.reduce((acc, company) => acc + company.evaluationsCount, 0)}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Empresas Ativas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {companies.filter(c => c.evaluationsCount > 0).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar empresas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os tipos</option>
              {Object.entries(COMPANY_TYPES).map(([key, type]) => (
                <option key={key} value={key}>{type.label}</option>
              ))}
            </select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setTypeFilter('')
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </Card>

        {/* Lista de Empresas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => {
            const typeInfo = getTypeInfo(company.size)

            return (
              <Card key={company.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {company.name}
                      </h3>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${typeInfo.color}-100 text-${typeInfo.color}-800`}>
                        {typeInfo.label}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="space-y-2">
                    {company.industry && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Globe className="h-3 w-3 mr-2" />
                        {company.industry}
                      </div>
                    )}
                    
                    {company.email && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="h-3 w-3 mr-2" />
                        {company.email}
                      </div>
                    )}
                    
                    {company.phone && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="h-3 w-3 mr-2" />
                        {company.phone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {company.usersCount}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center justify-center">
                      <Users className="h-3 w-3 mr-1" />
                      Usuários
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {company.evaluationsCount}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center justify-center">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Avaliações
                    </div>
                  </div>
                </div>

                {/* Informações do Admin */}
                {company.adminUser && (
                  <div className="py-2 border-t border-gray-200">
                    <div className="text-xs text-gray-500">Administrador:</div>
                    <div className="text-sm font-medium text-gray-900">
                      {company.adminUser.full_name || 'Nome não informado'}
                    </div>
                  </div>
                )}

                {/* Data de Criação */}
                <div className="py-2 border-t border-gray-200">
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    Criada em {formatDate(company.created_at)}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCompany(company)
                      setIsViewModalOpen(true)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCompany(company)
                      setIsEditModalOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCompany(company.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>

        {filteredCompanies.length === 0 && (
          <Card className="p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhuma empresa encontrada
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || typeFilter
                ? 'Tente ajustar os filtros de busca.'
                : 'Crie uma nova empresa para começar.'}
            </p>
            {!searchTerm && !typeFilter && (
              <div className="mt-6">
                <Button onClick={() => window.location.href = '/companies/new'}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Empresa
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Modal de Visualização */}
        {isViewModalOpen && selectedCompany && (
          <CompanyViewModal
            company={selectedCompany}
            onClose={() => setIsViewModalOpen(false)}
          />
        )}

        {/* Modal de Edição */}
        {isEditModalOpen && selectedCompany && (
          <CompanyEditModal
            company={selectedCompany}
            onClose={() => {
              setIsEditModalOpen(false)
              setSelectedCompany(null)
            }}
            onSave={handleUpdateCompany}
            loading={updating}
          />
        )}
      </div>
    </Layout>
  )
}

// Componente Modal de Visualização
function CompanyViewModal({ company, onClose }) {
  const typeInfo = getTypeInfo(company.size)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Detalhes da Empresa
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nome</label>
                  <p className="text-sm text-gray-900">{company.name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">CNPJ</label>
                  <p className="text-sm text-gray-900">{company.cnpj || 'Não informado'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Tamanho</label>
                  <p className="text-sm text-gray-900">{typeInfo.label}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Setor</label>
                  <p className="text-sm text-gray-900">{company.industry || 'Não informado'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{company.email || 'Não informado'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Telefone</label>
                  <p className="text-sm text-gray-900">{company.phone || 'Não informado'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Website</label>
                  <p className="text-sm text-gray-900">{company.website || 'Não informado'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Data de Criação</label>
                  <p className="text-sm text-gray-900">{formatDate(company.created_at)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Usuários Cadastrados</label>
                  <p className="text-sm text-gray-900">{company.usersCount}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button onClick={onClose} variant="outline">
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente Modal de Edição
function CompanyEditModal({ company, onClose, onSave, loading }) {
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Editar Empresa
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome *
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nome da empresa"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CNPJ
                  </label>
                  <Input
                    value={formData.cnpj}
                    onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamanho
                  </label>
                  <select
                    value={formData.size}
                    onChange={(e) => setFormData({...formData, size: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(COMPANY_TYPES).map(([key, type]) => (
                      <option key={key} value={key}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Setor
                  </label>
                  <Input
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    placeholder="Ex: Tecnologia, Saúde, Educação"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="contato@empresa.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="(00) 0000-0000"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <Input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    placeholder="https://www.empresa.com"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:ml-3 sm:w-auto"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="mt-3 w-full sm:mt-0 sm:w-auto"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}