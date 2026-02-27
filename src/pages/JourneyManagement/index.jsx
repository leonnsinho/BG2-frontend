import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import SuperAdminBanner from '../../components/SuperAdminBanner'
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
  const [searchParams] = useSearchParams()
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [journeys, setJourneys] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
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
  }, [profile?.id, searchParams])

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
      
      // Verificar se há parâmetro company na URL
      const companyIdFromUrl = searchParams.get('company') || searchParams.get('companyId')
      
      if (companyIdFromUrl) {
        // Se há company na URL, pré-selecionar essa empresa
        const companyFromUrl = companiesData.find(c => c.id === companyIdFromUrl)
        if (companyFromUrl) {
          setSelectedCompany(companyFromUrl)
          console.log('✅ Empresa da URL pré-selecionada:', companyFromUrl.name)
        } else if (companiesData.length > 0) {
          // Se não encontrou a empresa da URL, selecionar a primeira
          setSelectedCompany(companiesData[0])
          console.log('✅ Primeira empresa pré-selecionada (empresa da URL não encontrada):', companiesData[0].name)
        }
      } else if (companiesData.length > 0 && !selectedCompany) {
        // Se não há company na URL, pré-selecionar a primeira empresa automaticamente
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
      <SuperAdminBanner />
      {/* Header */}
      <div className="bg-white border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6 lg:py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#373435]">Diagnóstico do Negócio</h1>
                <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
                  Gerencie as 5 jornadas de amadurecimento de gestão do seu negócio
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        
        {/* Seleção de Empresa - Dropdown simples */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 p-4 sm:p-6">
            <label htmlFor="company-select" className="text-sm sm:text-base font-semibold text-[#373435] mb-3 flex items-center">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-[#EBA500]" />
              Selecionar Empresa
            </label>
            
            {companies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma empresa encontrada</p>
              </div>
            ) : (
              <select
                id="company-select"
                value={selectedCompany?.id || ''}
                onChange={(e) => {
                  const company = companies.find(c => c.id === e.target.value)
                  setSelectedCompany(company || null)
                }}
                className="block w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] transition-all duration-200 bg-white text-[#373435]"
              >
                <option value="">Selecione uma empresa...</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} {company.cnpj ? `- ${company.cnpj}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Painel das Jornadas */}
        <div>
          <div className="space-y-3">
            {filteredJourneys.map((journey, index) => {
              const Icon = journey.icon
              const isDisabled = !selectedCompany

              return (
                <button
                  key={journey.id}
                  onClick={() => handleJourneyClick(journey)}
                  disabled={isDisabled}
                  className={`group w-full text-left relative overflow-hidden bg-white rounded-2xl border border-gray-200 transition-all duration-300
                    ${isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:shadow-xl hover:-translate-y-0.5 hover:border-transparent cursor-pointer'
                    }`}
                  style={!isDisabled ? {
                    '--hover-color': journey.color
                  } : {}}
                >
                  {/* Left color bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all duration-300 group-hover:w-1.5"
                    style={{ backgroundColor: journey.color }}
                  />

                  {/* Hover background wash */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 rounded-2xl"
                    style={{ backgroundColor: journey.color }}
                  />

                  <div className="relative flex items-center gap-4 sm:gap-5 px-5 sm:px-6 py-4 sm:py-5 pl-6 sm:pl-7">
                    {/* Step number */}
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: journey.color }}
                    >
                      {index + 1}
                    </div>

                    {/* Icon */}
                    <div
                      className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
                      style={{
                        backgroundColor: `${journey.color}18`,
                        border: `1.5px solid ${journey.color}30`
                      }}
                    >
                      <Icon className="h-5 w-5" style={{ color: journey.color }} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-gray-900 transition-colors duration-200">
                          {journey.name}
                        </h3>
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${journey.color}15`, color: journey.color }}
                        >
                          {journey.processCount} processos
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 leading-snug line-clamp-1 group-hover:text-gray-600 transition-colors duration-200">
                        {journey.description}
                      </p>
                      {/* Categories */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {journey.categories.map((cat, i) => (
                          <span
                            key={i}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 group-hover:bg-opacity-80 transition-colors duration-200"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 group-hover:translate-x-1"
                      style={{ color: journey.color }}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Aviso se nenhuma empresa selecionada */}
          {!selectedCompany && (
            <div className="mt-4 p-4 sm:p-5 bg-amber-50 border border-amber-200/70 rounded-2xl">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-[#EBA500] flex-shrink-0" />
                <p className="text-sm text-[#373435] font-medium">
                  Selecione uma empresa para acessar as jornadas de processos.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JourneyManagementOverview