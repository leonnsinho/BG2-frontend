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
  TrendingUp,
  DollarSign,
  Settings,
  BarChart3,
  Home
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
  const [logoUrls, setLogoUrls] = useState({})

  // Dados das 5 jornadas da metodologia Bossa Focus com cores BG2
  const journeysData = [
    {
      id: 'estrategica',
      name: 'Jornada Estratégica',
      slug: 'estrategica',
      description: 'Planejamento estratégico, visão, missão, valores e direcionamento organizacional',
      icon: Target,
      color: '#EBA500',
      bgColor: 'bg-[#EBA500]',
      textColor: 'text-[#EBA500]',
      bgLight: 'bg-[#EBA500]/10',
      bgHover: 'hover:bg-[#EBA500]/20',
      processCount: 30,
      categories: ['Visão e Propósito', 'Análise e Diagnóstico', 'Planejamento Estratégico', 'Execução e Monitoramento']
    },
    {
      id: 'financeira',
      name: 'Jornada Financeira',
      slug: 'financeira',
      description: 'Gestão financeira completa, fluxo de caixa, DRE, indicadores e planejamento orçamentário',
      icon: DollarSign,
      color: '#373435',
      bgColor: 'bg-[#373435]',
      textColor: 'text-[#373435]',
      bgLight: 'bg-[#373435]/10',
      bgHover: 'hover:bg-[#373435]/20',
      processCount: 32,
      categories: ['Planejamento Financeiro', 'Controle Financeiro', 'Análise e Relatórios', 'Gestão de Riscos']
    },
    {
      id: 'pessoas-cultura',
      name: 'Jornada Pessoas e Cultura',
      slug: 'pessoas-cultura',
      description: 'Gestão de pessoas, cultura organizacional, desenvolvimento e performance',
      icon: Users,
      color: '#EBA500',
      bgColor: 'bg-[#EBA500]',
      textColor: 'text-[#EBA500]',
      bgLight: 'bg-[#EBA500]/10',
      bgHover: 'hover:bg-[#EBA500]/20',
      processCount: 28,
      categories: ['Recrutamento e Seleção', 'Desenvolvimento', 'Performance', 'Cultura Organizacional']
    },
    {
      id: 'receita-crm',
      name: 'Jornada Receita',
      slug: 'receita-crm',
      description: 'Gestão comercial, vendas, relacionamento com clientes e geração de receita',
      icon: TrendingUp,
      color: '#373435',
      bgColor: 'bg-[#373435]',
      textColor: 'text-[#373435]',
      bgLight: 'bg-[#373435]/10',
      bgHover: 'hover:bg-[#373435]/20',
      processCount: 28,
      categories: ['Prospecção', 'Vendas', 'Relacionamento', 'Pós-Venda']
    },
    {
      id: 'operacional',
      name: 'Jornada Operacional',
      slug: 'operacional',
      description: 'Processos operacionais, qualidade, automações e excelência operacional',
      icon: Settings,
      color: '#EBA500',
      bgColor: 'bg-[#EBA500]',
      textColor: 'text-[#EBA500]',
      bgLight: 'bg-[#EBA500]/10',
      bgHover: 'hover:bg-[#EBA500]/20',
      processCount: 25,
      categories: ['Processos', 'Qualidade', 'Produtividade', 'Automação']
    }
  ]

  useEffect(() => {
    if (profile?.id) {
      fetchCompanies()
    }
  }, [profile?.id])

  async function fetchCompanies() {
    try {
      setLoading(true)
      
      let companiesData = []
      
      // Super Admin pode ver todas as empresas
      if (profile?.role === 'super_admin') {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('name')

        if (error) throw error
        companiesData = data || []
        setCompanies(companiesData)
      } 
      // Company Admin só pode ver as empresas onde tem vínculo ativo
      else {
        // Buscar as empresas do usuário através da tabela user_companies
        const { data: userCompaniesData, error: userCompaniesError } = await supabase
          .from('user_companies')
          .select(`
            company_id,
            companies (
              id,
              name,
              cnpj,
              is_active,
              subscription_status,
              logo_url
            )
          `)
          .eq('user_id', profile?.id)
          .eq('is_active', true) // Apenas vínculos ativos

        if (userCompaniesError) throw userCompaniesError
        
        // Extrair as empresas dos dados retornados
        companiesData = userCompaniesData?.map(uc => uc.companies).filter(Boolean) || []
        setCompanies(companiesData)
      }

      // Carregar logos das empresas
      const urls = {}
      for (const company of companiesData) {
        console.log('🏢 Empresa:', company.name, 'logo_url:', company.logo_url)
        if (company.logo_url) {
          const { data, error } = await supabase.storage
            .from('company-avatars')
            .createSignedUrl(company.logo_url, 3600) // 1 hora
          
          if (error) {
            console.error('❌ Erro ao gerar signed URL para', company.name, error)
          }
          
          if (data?.signedUrl) {
            console.log('✅ Signed URL gerada para', company.name, ':', data.signedUrl)
            urls[company.id] = data.signedUrl
          }
        }
      }
      console.log('📦 logoUrls finais:', urls)
      setLogoUrls(urls)
      
      // Pré-selecionar a primeira empresa automaticamente
      if (companiesData.length > 0 && !selectedCompany) {
        setSelectedCompany(companiesData[0])
        console.log('✅ Primeira empresa pré-selecionada:', companiesData[0].name)
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
      setCompanies([])
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500] mx-auto"></div>
          <p className="mt-4 text-[#373435]">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#373435]">Diagnóstico do Negócio</h1>
                <p className="mt-2 text-base text-gray-600">
                  Gerencie as 5 jornadas de amadurecimento de gestão do seu negócio
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Seleção de Empresa - Horizontal no topo */}
        <div className="mb-8">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200/50">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[#373435] flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-[#EBA500]" />
                  Selecionar Empresa
                </h2>
                
                {/* Indicador do tipo de acesso */}
                {profile?.role === 'super_admin' ? (
                  <div className="inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-medium bg-[#EBA500]/10 text-[#EBA500] border border-[#EBA500]/20">
                    <span>Super Admin - Todas as empresas</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-medium bg-[#373435]/10 text-[#373435] border border-[#373435]/20">
                    <span>Admin - Suas empresas</span>
                  </div>
                )}
              </div>
              
              {companies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma empresa encontrada</p>
                </div>
              ) : (
                <>
                  {/* Barra de busca para empresas */}
                  {companies.length > 3 && (
                    <div className="mb-6">
                      <div className="relative max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Buscar por razão social ou CNPJ..."
                          value={companySearchTerm}
                          onChange={(e) => setCompanySearchTerm(e.target.value)}
                          className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] transition-all duration-200"
                        />
                      </div>
                      
                      {/* Contador de resultados */}
                      {companySearchTerm && (
                        <div className="mt-3 text-xs text-gray-500 pl-2">
                          {filteredCompanies.length === 1 
                            ? `1 empresa encontrada` 
                            : `${filteredCompanies.length} empresas encontradas`
                          }
                        </div>
                      )}
                    </div>
                  )}
                  
                  {filteredCompanies.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                      <p>Nenhuma empresa encontrada para "{companySearchTerm}"</p>
                      <button
                        onClick={() => setCompanySearchTerm('')}
                        className="mt-3 text-sm text-[#EBA500] hover:text-[#EBA500]/80 font-medium"
                      >
                        Limpar filtro
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredCompanies.map((company) => (
                        <button
                          key={company.id}
                          onClick={() => setSelectedCompany(company)}
                          className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 hover:shadow-md ${
                            selectedCompany?.id === company.id
                              ? 'border-[#EBA500] bg-[#EBA500]/5 ring-2 ring-[#EBA500]/20'
                              : 'border-gray-200 hover:border-[#EBA500]/30 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            {/* Logo da Empresa */}
                            <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-[#EBA500]/20 to-[#EBA500]/10 flex items-center justify-center overflow-hidden">
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
                            
                            <div className={`inline-flex items-center px-3 py-1 rounded-2xl text-xs font-medium ${
                              company.is_active && company.subscription_status === 'active'
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                            }`}>
                              {company.is_active && company.subscription_status === 'active' ? 'Ativa' : 'Inativa'}
                            </div>
                          </div>
                          
                          {/* Dados da Empresa */}
                          <div>
                            <p className="font-medium text-[#373435] mb-1">{company.name}</p>
                            <p className="text-sm text-gray-500">{company.cnpj || 'CNPJ não informado'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {selectedCompany && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Building2 className="h-4 w-4 text-[#EBA500]" />
                          <span className="text-[#373435] font-medium">Selecionada: {selectedCompany.name}</span>
                        </div>
                        
                        <button
                          onClick={() => setSelectedCompany(null)}
                          className="text-sm text-red-500 hover:text-red-600 transition-colors font-medium"
                        >
                          Limpar
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Painel das Jornadas */}
        <div>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200/50">
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredJourneys.map((journey) => {
                    const Icon = journey.icon
                    
                    return (
                      <button
                        key={journey.id}
                        onClick={() => handleJourneyClick(journey)}
                        disabled={!selectedCompany}
                        className={`group relative overflow-hidden text-left p-8 rounded-3xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${journey.bgLight} border-gray-200/50 hover:border-[#EBA500]/30 transform hover:-translate-y-1 ${
                          !selectedCompany ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {/* Hover overlay */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"
                          style={{ 
                            background: `linear-gradient(135deg, ${journey.color}e6 0%, ${journey.color}cc 100%)` 
                          }}
                        />
                        
                        {/* Content */}
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-6">
                            <div className={`p-4 rounded-2xl ${journey.bgColor} group-hover:bg-white group-hover:bg-opacity-20 transition-all duration-300 group-hover:scale-110 shadow-sm`}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <ChevronRight className={`h-5 w-5 transition-all duration-300 group-hover:translate-x-1 ${journey.textColor} group-hover:text-white`} />
                          </div>
                          
                          <h3 className={`text-lg font-semibold mb-3 transition-colors duration-300 ${journey.textColor} group-hover:text-white`}>
                            {journey.name}
                          </h3>
                          
                          <p className="text-sm text-gray-600 group-hover:text-white group-hover:text-opacity-90 mb-6 transition-colors duration-300 line-clamp-2">
                            {journey.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium transition-colors duration-300 ${journey.textColor} group-hover:text-white group-hover:text-opacity-80`}>
                              {journey.processCount} processos
                            </span>
                            
                            <div className="flex -space-x-1">
                              {journey.categories.slice(0, 3).map((category, index) => (
                                <div
                                  key={index}
                                  className={`w-3 h-3 rounded-full transition-all duration-300 border-2 border-white ${journey.bgColor} group-hover:bg-white group-hover:bg-opacity-60`}
                                  style={{
                                    transitionDelay: `${index * 50}ms`
                                  }}
                                />
                              ))}
                              {journey.categories.length > 3 && (
                                <div className="w-3 h-3 bg-gray-300 group-hover:bg-white group-hover:bg-opacity-40 rounded-full transition-all duration-300 border-2 border-white" />
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Subtle decoration */}
                        <div 
                          className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                          style={{ backgroundColor: journey.color }}
                        />
                      </button>
                    )
                  })}
                </div>
                
                {/* Aviso se nenhuma empresa selecionada */}
                {!selectedCompany && (
                  <div className="mt-8 p-6 bg-amber-50/50 border border-amber-200/50 rounded-2xl">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Building2 className="h-5 w-5 text-[#EBA500]" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-[#373435] font-medium">
                          Selecione uma empresa para acessar as jornadas de processos.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  )
}

export default JourneyManagementOverview