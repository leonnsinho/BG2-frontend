import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import { 
  Target, 
  Building2, 
  Users, 
  ChevronRight,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Settings,
  BarChart3
} from 'lucide-react'

const JourneyManagementOverview = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [journeys, setJourneys] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [companySearchTerm, setCompanySearchTerm] = useState('')

  // Dados das 5 jornadas da metodologia Bossa Focus
  const journeysData = [
    {
      id: 'estrategica',
      name: 'Jornada Estratégica',
      slug: 'estrategica',
      description: 'Planejamento estratégico, visão, missão, valores e direcionamento organizacional',
      icon: Target,
      color: '#3B82F6',
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgLight: 'bg-blue-50',
      processCount: 30,
      categories: ['Visão e Propósito', 'Análise e Diagnóstico', 'Planejamento Estratégico', 'Execução e Monitoramento']
    },
    {
      id: 'financeira',
      name: 'Jornada Financeira',
      slug: 'financeira',
      description: 'Gestão financeira completa, fluxo de caixa, DRE, indicadores e planejamento orçamentário',
      icon: DollarSign,
      color: '#10B981',
      bgColor: 'bg-green-500',
      textColor: 'text-green-700',
      bgLight: 'bg-green-50',
      processCount: 32,
      categories: ['Planejamento Financeiro', 'Controle Financeiro', 'Análise e Relatórios', 'Gestão de Riscos']
    },
    {
      id: 'pessoas-cultura',
      name: 'Jornada Pessoas e Cultura',
      slug: 'pessoas-cultura',
      description: 'Gestão de pessoas, cultura organizacional, desenvolvimento e performance',
      icon: Users,
      color: '#F59E0B',
      bgColor: 'bg-amber-500',
      textColor: 'text-amber-700',
      bgLight: 'bg-amber-50',
      processCount: 28,
      categories: ['Recrutamento e Seleção', 'Desenvolvimento', 'Performance', 'Cultura Organizacional']
    },
    {
      id: 'receita-crm',
      name: 'Jornada Receita/CRM',
      slug: 'receita-crm',
      description: 'Gestão comercial, vendas, relacionamento com clientes e geração de receita',
      icon: TrendingUp,
      color: '#EF4444',
      bgColor: 'bg-red-500',
      textColor: 'text-red-700',
      bgLight: 'bg-red-50',
      processCount: 28,
      categories: ['Prospecção', 'Vendas', 'Relacionamento', 'Pós-Venda']
    },
    {
      id: 'operacional',
      name: 'Jornada Operacional',
      slug: 'operacional',
      description: 'Processos operacionais, qualidade, automações e excelência operacional',
      icon: Settings,
      color: '#8B5CF6',
      bgColor: 'bg-purple-500',
      textColor: 'text-purple-700',
      bgLight: 'bg-purple-50',
      processCount: 25,
      categories: ['Processos', 'Qualidade', 'Produtividade', 'Automação']
    }
  ]

  useEffect(() => {
    fetchCompanies()
  }, [])

  async function fetchCompanies() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJourneyClick = (journey) => {
    if (!selectedCompany) {
      alert('Por favor, selecione uma empresa primeiro.')
      return
    }

    navigate(`/journey-management/${journey.slug}?company=${selectedCompany.id}`)
  }

  const filteredJourneys = journeysData.filter(journey =>
    journey.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    journey.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
    (company.cnpj && company.cnpj.toLowerCase().includes(companySearchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Jornadas</h1>
                <p className="mt-2 text-base text-gray-600">
                  Gerencie as 5 jornadas da metodologia Bossa Focus para transformar sua empresa
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                  <Target className="h-4 w-4" />
                  <span>Metodologia Bossa Focus</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Seleção de Empresa */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-gray-600" />
                  Selecionar Empresa
                </h2>
                
                {/* Barra de busca para empresas */}
                {companies.length > 0 && (
                  <div className="mb-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar por razão social ou CNPJ..."
                        value={companySearchTerm}
                        onChange={(e) => setCompanySearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    {/* Contador de resultados */}
                    {companySearchTerm && (
                      <div className="mt-2 text-xs text-gray-500">
                        {filteredCompanies.length === 1 
                          ? `1 empresa encontrada` 
                          : `${filteredCompanies.length} empresas encontradas`
                        }
                      </div>
                    )}
                  </div>
                )}
                
                {companies.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Nenhuma empresa encontrada</p>
                  </div>
                ) : filteredCompanies.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>Nenhuma empresa encontrada para "{companySearchTerm}"</p>
                    <button
                      onClick={() => setCompanySearchTerm('')}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Limpar filtro
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCompanies.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => setSelectedCompany(company)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                          selectedCompany?.id === company.id
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{company.name}</p>
                            <p className="text-sm text-gray-500">{company.cnpj || 'CNPJ não informado'}</p>
                          </div>
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            company.is_active && company.subscription_status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {company.is_active && company.subscription_status === 'active' ? 'Ativa' : 'Inativa'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {selectedCompany && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Building2 className="h-4 w-4" />
                        <span>Selecionada: {selectedCompany.name}</span>
                      </div>
                      
                      <button
                        onClick={() => setSelectedCompany(null)}
                        className="text-sm text-red-600 hover:text-red-800 transition-colors"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Painel das Jornadas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Jornadas da Metodologia Bossa Focus
                  </h2>
                  
                  {/* Search */}
                  <div className="relative w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar jornadas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredJourneys.map((journey) => {
                    const Icon = journey.icon
                    
                    return (
                      <button
                        key={journey.id}
                        onClick={() => handleJourneyClick(journey)}
                        disabled={!selectedCompany}
                        className={`group relative overflow-hidden text-left p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${journey.bgLight} border-gray-200 hover:border-transparent transform hover:-translate-y-1 ${
                          !selectedCompany ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        style={{
                          '--journey-color': journey.color,
                          '--journey-bg': journey.bgColor.replace('bg-', '')
                        }}
                      >
                        {/* Hover overlay */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ 
                            background: `linear-gradient(135deg, ${journey.color}e6 0%, ${journey.color}cc 100%)` 
                          }}
                        />
                        
                        {/* Content */}
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-lg ${journey.bgColor} group-hover:bg-white group-hover:bg-opacity-20 transition-all duration-300 group-hover:scale-110`}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-all duration-300 group-hover:translate-x-1" />
                          </div>
                          
                          <h3 className={`text-lg font-semibold mb-3 ${journey.textColor} group-hover:text-white transition-colors duration-300`}>
                            {journey.name}
                          </h3>
                          
                          <p className="text-sm text-gray-600 group-hover:text-white group-hover:text-opacity-90 mb-4 transition-colors duration-300 line-clamp-2">
                            {journey.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500 group-hover:text-white group-hover:text-opacity-80 transition-colors duration-300">
                              {journey.processCount} processos
                            </span>
                            
                            <div className="flex -space-x-1">
                              {journey.categories.slice(0, 3).map((category, index) => (
                                <div
                                  key={index}
                                  className="w-2.5 h-2.5 bg-gray-300 group-hover:bg-white group-hover:bg-opacity-60 rounded-full transition-all duration-300"
                                  style={{
                                    transitionDelay: `${index * 50}ms`
                                  }}
                                />
                              ))}
                              {journey.categories.length > 3 && (
                                <div className="w-2.5 h-2.5 bg-gray-200 group-hover:bg-white group-hover:bg-opacity-40 rounded-full transition-all duration-300" />
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Subtle decoration */}
                        <div 
                          className="absolute -bottom-2 -right-2 w-20 h-20 rounded-full opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                          style={{ backgroundColor: journey.color }}
                        />
                      </button>
                    )
                  })}
                </div>
                
                {/* Aviso se nenhuma empresa selecionada */}
                {!selectedCompany && (
                  <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Building2 className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-amber-800">
                          Selecione uma empresa para acessar as jornadas de processos.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Estatísticas gerais */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">5</div>
                      <div className="text-sm text-gray-500">Jornadas</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">143</div>
                      <div className="text-sm text-gray-500">Processos</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{companies.length}</div>
                      <div className="text-sm text-gray-500">Empresas</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JourneyManagementOverview