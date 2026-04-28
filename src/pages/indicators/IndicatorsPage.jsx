import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  Plus, Settings, List, Grid, MoreVertical, 
  TrendingUp, TrendingDown, Minus, ChevronDown, DollarSign,
  Calendar, ChevronLeft, ChevronRight
} from 'lucide-react'
import toast from '@/lib/toast'
import SuperAdminBanner from '../../components/SuperAdminBanner'

// Extrai o número puro de qualquer valor salvo (remove R$, %, etc.)
function rawNumber(v) {
  if (v === null || v === undefined || v === '') return ''
  const n = parseFloat(String(v).replace(/[^0-9.,\-]/g, '').replace(',', '.'))
  return isNaN(n) ? '' : String(n)
}

// Formata um valor para exibição com base no tipo do indicador
function formatValue(v, type) {
  const raw = rawNumber(v)
  if (raw === '') return null
  const n = parseFloat(raw)
  if (isNaN(n)) return String(v)
  if (type === 'Percentual') return `${n}%`
  if (type === 'Monetário' || type === 'Financeiro')
    return `R$\u00a0${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
  if (type === 'Dias') return `${n} dias`
  return String(n)
}

export default function IndicatorsPage() {
  const { profile } = useAuth()
  const { isSuperAdmin } = usePermissions()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [indicators, setIndicators] = useState([])
  const [companyIndicators, setCompanyIndicators] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [activeTab, setActiveTab] = useState('Operacional')
  const [companies, setCompanies] = useState([])
  const [editingCell, setEditingCell] = useState(null)
  const [users, setUsers] = useState([])
  const [responsibleFilter, setResponsibleFilter] = useState('all')

  const journeys = ['Estratégia', 'Financeira', 'Receita', 'Pessoas & Cultura', 'Operacional']
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  useEffect(() => {
    loadCompanies()
  }, [searchParams])

  useEffect(() => {
    if (selectedCompany) {
      loadData()
      loadUsers()
      setResponsibleFilter('all')
    }
  }, [selectedCompany, selectedYear])

  const loadUsers = async () => {
    try {
      const { data: companyUsers, error: cuError } = await supabase
        .from('user_companies')
        .select('user_id')
        .eq('company_id', selectedCompany)
        .eq('is_active', true)
      if (cuError) throw cuError
      const userIds = companyUsers.map(cu => cu.user_id)
      if (userIds.length === 0) { setUsers([]); return }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)
        .order('full_name')
      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Erro ao carregar usuários:', err)
    }
  }

  const loadCompanies = async () => {
    try {
      let companyList = []

      if (isSuperAdmin()) {
        // Super admin vê todas as empresas
        const { data, error } = await supabase
          .from('companies')
          .select('id, name')
          .eq('is_active', true)
          .order('name')

        if (error) throw error
        companyList = data || []
      } else {
        // Usuário normal vê apenas empresas vinculadas
        const { data, error } = await supabase
          .from('user_companies')
          .select(`
            company_id,
            companies (
              id,
              name
            )
          `)
          .eq('user_id', profile.id)
          .eq('is_active', true)

        if (error) throw error
        companyList = data.map(uc => uc.companies).filter(Boolean)
      }

      setCompanies(companyList)
      
      // Verificar se há um parâmetro company ou companyId na URL
      const companyFromUrl = searchParams.get('company') || searchParams.get('companyId')
      
      if (companyFromUrl && companyList.some(c => c.id === companyFromUrl)) {
        // Se há um company/companyId na URL e existe na lista, usar ele
        setSelectedCompany(companyFromUrl)
      } else if (companyList.length > 0 && !selectedCompany) {
        // Caso contrário, selecionar a primeira empresa
        setSelectedCompany(companyList[0].id)
      } else if (companyList.length === 0) {
        setLoading(false)
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
      toast.error('Erro ao carregar empresas')
      setLoading(false)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)

      // Carregar indicadores da empresa selecionada
      const { data: indicatorsData, error: indicatorsError } = await supabase
        .from('management_indicators')
        .select('*')
        .eq('company_id', selectedCompany)
        .eq('is_active', true)
        .order('name')

      if (indicatorsError) throw indicatorsError

      // Carregar dados mensais da empresa
      const { data: companyData, error: companyError } = await supabase
        .from('company_indicators')
        .select('*')
        .eq('company_id', selectedCompany)
        .eq('year', selectedYear)

      if (companyError) throw companyError

      setIndicators(indicatorsData || [])
      setCompanyIndicators(companyData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar indicadores')
    } finally {
      setLoading(false)
    }
  }

  const getCompanyIndicatorData = (indicatorId) => {
    return companyIndicators.find(ci => ci.indicator_id === indicatorId)
  }

  const handleCellClick = (indicatorId, month) => {
    setEditingCell({ indicatorId, month })
  }

  const handleCellChange = async (indicatorId, month, value) => {
    try {
      // Salvar apenas o número puro (sem símbolos)
      const cleanValue = rawNumber(value?.trim())
      
      const existingData = getCompanyIndicatorData(indicatorId)

      if (existingData) {
        // Atualizar
        const { error } = await supabase
          .from('company_indicators')
          .update({ [month]: cleanValue })
          .eq('id', existingData.id)

        if (error) throw error
      } else {
        // Criar novo
        const { error } = await supabase
          .from('company_indicators')
          .insert({
            company_id: selectedCompany,
            indicator_id: indicatorId,
            year: selectedYear,
            [month]: cleanValue
          })

        if (error) throw error
      }

      toast.success('Valor atualizado')
      await loadData() // Aguardar o carregamento dos dados
    } catch (error) {
      console.error('Erro ao salvar valor:', error)
      toast.error('Erro ao salvar valor')
    } finally {
      setEditingCell(null)
    }
  }

  const getStatusColor = (indicator, companyData, month) => {
    if (!companyData) return null
    
    const value = companyData[month]
    const meta = indicator.meta

    // Se não houver valor ou meta válidos, retornar null
    if (!value || value === '' || !meta || meta === '') return null

    // Lógica de comparação
    try {
      // Extrair apenas números, pontos decimais e sinais negativos
      const valueStr = String(value).trim()
      const metaStr = String(meta).trim()
      
      // Remover símbolos comuns de moeda, porcentagem, etc
      const numValue = parseFloat(valueStr.replace(/[^0-9.-]/g, ''))
      const numMeta = parseFloat(metaStr.replace(/[^0-9.-]/g, ''))

      // Validar se conseguimos extrair números válidos
      if (isNaN(numValue) || isNaN(numMeta) || numMeta === 0) return null

      // Calcular porcentagem de atingimento da meta
      const percentage = (numValue / numMeta) * 100

      // Retornar cores baseadas na porcentagem e polaridade
      const isNegative = indicator.polarity === 'negative'
      if (!isNegative) {
        if (percentage >= 100) return 'bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-300'
        if (percentage >= 80)  return 'bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300'
        return 'bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300'
      } else {
        // Negativo: meta é teto — abaixo da meta é bom
        if (percentage <= 100) return 'bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-300'
        if (percentage <= 120) return 'bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300'
        return 'bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300'
      }
    } catch (error) {
      console.error('Erro ao calcular status:', error)
      return null
    }
  }

  const filteredIndicators = indicators.filter(ind => {
    if (ind.journey !== activeTab) return false
    if (responsibleFilter !== 'all' && responsibleFilter !== 'unassigned') {
      return ind.responsible_user_id === responsibleFilter
    }
    if (responsibleFilter === 'unassigned') return !ind.responsible_user_id
    return true
  })

  // Estatísticas
  const stats = {
    total: indicators.length,
    active: indicators.filter(ind => ind.is_active).length,
    byJourney: journeys.reduce((acc, journey) => {
      acc[journey] = indicators.filter(ind => ind.journey === journey).length
      return acc
    }, {})
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <SuperAdminBanner />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Indicadores de Gestão
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Controle mensal por jornada e acompanhe metas
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/indicators/manage?action=add')}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all font-medium shadow-md hover:shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">Adicionar Indicador</span>
                <span className="sm:hidden">Adicionar</span>
              </button>
              <button
                onClick={() => navigate('/indicators/manage')}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                <Settings className="h-5 w-5" />
                <span className="hidden sm:inline">Gerenciar</span>
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione uma empresa</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por responsável */}
            {users.length > 0 && (
              <select
                value={responsibleFilter}
                onChange={(e) => setResponsibleFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os responsáveis</option>
                <option value="unassigned">Sem responsável</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </select>
            )}

            <div className="relative flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <button
                onClick={() => setSelectedYear(selectedYear - 1)}
                className="p-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="Ano anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-2 px-3">
                <Calendar className="h-5 w-5 text-yellow-500" />
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => {
                    const year = parseInt(e.target.value)
                    if (!isNaN(year) && year >= 1900 && year <= 2100) {
                      setSelectedYear(year)
                    }
                  }}
                  min="1900"
                  max="2100"
                  className="w-20 py-1 text-center font-semibold text-gray-900 dark:text-white dark:bg-transparent focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded text-sm sm:text-base"
                  placeholder="Ano"
                />
              </div>
              
              <button
                onClick={() => setSelectedYear(selectedYear + 1)}
                className="p-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="Próximo ano"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
            {journeys.map((journey) => {
              const count = indicators.filter(ind => ind.journey === journey).length
              const journeyColors = {
                'Estratégia': 'border-blue-600 text-blue-600 bg-blue-50/50',
                'Financeira': 'border-green-600 text-green-600 bg-green-50/50',
                'Receita': 'border-yellow-600 text-yellow-600 bg-yellow-50/50',
                'Pessoas & Cultura': 'border-purple-600 text-purple-600 bg-purple-50/50',
                'Operacional': 'border-red-600 text-red-600 bg-red-50/50'
              }
              
              return (
                <button
                  key={journey}
                  onClick={() => setActiveTab(journey)}
                  className={`px-6 py-4 font-medium whitespace-nowrap transition-all border-b-2 flex-shrink-0 ${
                    activeTab === journey
                      ? journeyColors[journey]
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {journey}
                  <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === journey
                      ? 'bg-white dark:bg-gray-700 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Tabela */}
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Carregando indicadores...</p>
            </div>
          ) : !selectedCompany ? (
            <div className="p-12 text-center">
              <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2 text-lg font-medium">Selecione uma empresa</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">Escolha uma empresa acima para visualizar os indicadores</p>
            </div>
          ) : filteredIndicators.length === 0 ? (
            <div className="p-12 text-center">
              <TrendingDown className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4 text-lg font-medium">Nenhum indicador ativo nesta jornada</p>
              <button
                onClick={() => navigate('/indicators/manage')}
                className="px-6 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all font-medium shadow-md hover:shadow-lg"
              >
                Criar primeiro indicador
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider sticky left-0 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700/80 z-10 shadow-sm">
                      Indicador
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Meta
                    </th>
                    {monthNames.map((month) => (
                      <th key={month} className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">
                        {month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredIndicators.map((indicator) => {
                    const companyData = getCompanyIndicatorData(indicator.id)
                    
                    return (
                      <tr key={indicator.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-white dark:hover:from-gray-700/50 dark:hover:to-gray-700/30 transition-all">
                        <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-800 z-10 shadow-sm">
                          <div className="font-semibold text-gray-900 dark:text-white">{indicator.name}</div>
                          {indicator.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{indicator.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            {indicator.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800">
                            {formatValue(indicator.meta, indicator.type) || indicator.meta}
                          </span>
                        </td>
                        {months.map((month, index) => {
                          const bgColor = getStatusColor(indicator, companyData, month)
                          
                          return (
                            <td key={month} className="px-4 py-4 text-center">
                              {editingCell?.indicatorId === indicator.id && editingCell?.month === month ? (
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  defaultValue={rawNumber(companyData?.[month] || '')}
                                  onBlur={(e) => handleCellChange(indicator.id, month, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleCellChange(indicator.id, month, e.target.value)
                                    }
                                    if (e.key === 'Escape') {
                                      setEditingCell(null)
                                    }
                                  }}
                                  autoFocus
                                  className="w-full px-3 py-2 text-sm border-2 border-yellow-500 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-center shadow-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                />
                              ) : (
                                <div
                                  onClick={() => handleCellClick(indicator.id, month)}
                                  className={`text-sm font-medium cursor-pointer px-3 py-2 rounded-lg min-h-[36px] flex items-center justify-center transition-all ${
                                    bgColor 
                                      ? `${bgColor} hover:opacity-80` 
                                      : 'text-gray-900 dark:text-gray-100 border border-transparent hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:border-yellow-200 dark:hover:border-yellow-700'
                                  }`}
                                >
                                  {formatValue(companyData?.[month], indicator.type) || '-'}
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
