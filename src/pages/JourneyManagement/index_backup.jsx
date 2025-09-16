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

  // Carregar empresas do sistema
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true)
        
        console.log('👤 Usuário atual:', profile?.email, 'Role:', profile?.role)
        
        // Super admin pode ver todas as empresas
        const { data, error } = await supabase
          .from('companies')
          .select(`
            id,
            name,
            cnpj,
            subscription_status,
            is_active,
            created_at
          `)
          .order('name')

        if (error) {
          console.error('❌ Erro na consulta de empresas:', error)
          throw error
        }

        console.log('📊 Empresas carregadas:', data?.length || 0)
        if (data && data.length > 0) {
          console.log('🏢 Primeira empresa:', data[0])
        } else {
          console.log('⚠️ Nenhuma empresa encontrada na tabela companies')
        }
        setCompanies(data || [])
      } catch (error) {
        console.error('Erro ao carregar empresas:', error)
      } finally {
        setLoading(false)
      }
    }

    if (profile) {
      fetchCompanies()
    }
  }, [profile])

  // Filtrar empresas com base no termo de busca
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCompanySelect = (company) => {
    setSelectedCompany(company)
  }

  const handleJourneyClick = (journey) => {
    if (selectedCompany) {
      navigate(`/journey-management/${journey.slug}?company=${selectedCompany.id}`)
    } else {
      navigate(`/journey-management/${journey.slug}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4" />
                  <span>
                    {selectedCompany 
                      ? `Empresa: ${selectedCompany.name}` 
                      : 'Nenhuma empresa selecionada'
                    }
                  </span>
                </div>
                
                {selectedCompany && (
                  <button
                    onClick={() => setSelectedCompany(null)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Limpar seleção
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Painel de Seleção de Empresa */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Selecionar Empresa
                </h2>
                
                {/* Campo de busca */}
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                {/* Lista de empresas */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredCompanies.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {loading ? (
                        'Carregando empresas...'
                      ) : companies.length === 0 ? (
                        <>
                          Nenhuma empresa encontrada no sistema.
                          <br />
                          <small className="text-xs mt-2 block">
                            Verifique se existem empresas cadastradas na tabela 'companies'.
                          </small>
                        </>
                      ) : (
                        'Nenhuma empresa corresponde à busca'
                      )}
                    </p>
                  ) : (
                    filteredCompanies.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => handleCompanySelect(company)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedCompany?.id === company.id
                            ? 'bg-primary-50 border-primary-200 text-primary-900'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{company.name}</p>
                            <p className="text-sm opacity-75">{company.cnpj || 'CNPJ não informado'}</p>
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
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Painel das Jornadas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Jornadas da Metodologia Bossa Focus
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {journeysData.map((journey) => {
                    const Icon = journey.icon
                    
                    return (
                      <button
                        key={journey.id}
                        onClick={() => handleJourneyClick(journey)}
                        className={`group relative overflow-hidden text-left p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${journey.bgLight} border-gray-200 hover:border-transparent transform hover:-translate-y-1`}
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