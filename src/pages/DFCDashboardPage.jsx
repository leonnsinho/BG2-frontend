import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import SuperAdminBanner from '../components/SuperAdminBanner'
import {
  TrendingDown,
  TrendingUp,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  Calendar,
  Building2,
  PieChart,
  BarChart3,
  ChevronRight,
  Filter,
  Download,
  History,
  X,
  Eye,
  Search
} from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart as RechartPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#EBA500', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1']

export default function DFCDashboardPage() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [companies, setCompanies] = useState([]) // Lista de empresas
  const [companyAvatars, setCompanyAvatars] = useState({}) // Avatars das empresas
  
  // Inicializar selectedCompanyId com o valor da URL se existir
  const initialCompanyId = searchParams.get('company') || searchParams.get('companyId') || 'all'
  const [selectedCompanyId, setSelectedCompanyId] = useState(initialCompanyId) // Empresa selecionada (super admin)
  const [initialized, setInitialized] = useState(false) // Flag de inicialização
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false) // Controle do dropdown customizado
  const [companySearch, setCompanySearch] = useState('') // Busca de empresa
  
  // Estados de período
  const [periodoTipo, setPeriodoTipo] = useState('ultimos6meses') // ultimos30dias, ultimos3meses, ultimos6meses, ultimo12meses, personalizado
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [mesesGrafico, setMesesGrafico] = useState(6) // Quantidade de meses para o gráfico de linhas
  
  const [stats, setStats] = useState({
    totalEntradas: 0,
    totalSaidas: 0,
    saldoTotal: 0,
    saldoInicial: 0,
    saldoFinal: 0,
    entradasMes: 0,
    saidasMes: 0,
    saldoMes: 0
  })
  const [monthlyData, setMonthlyData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [entradasData, setEntradasData] = useState([])
  const [saidasData, setSaidasData] = useState([])
  const [categoriasMap, setCategoriasMap] = useState({})
  const [showHistoricoModal, setShowHistoricoModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportYear, setExportYear] = useState(new Date().getFullYear())
  const [exportFormat, setExportFormat] = useState('excel')
  const [historicoRelatorios, setHistoricoRelatorios] = useState([])
  
  // Estados para pagamentos futuros
  const [futurePayments, setFuturePayments] = useState({
    entradas: {
      next30Days: 0,
      next60Days: 0,
      next90Days: 0,
      total: 0,
      count30: 0,
      count60: 0,
      count90: 0,
      countTotal: 0,
      items30: [],
      items60: [],
      items90: [],
      itemsTotal: []
    },
    saidas: {
      next30Days: 0,
      next60Days: 0,
      next90Days: 0,
      total: 0,
      count30: 0,
      count60: 0,
      count90: 0,
      countTotal: 0,
      items30: [],
      items60: [],
      items90: [],
      itemsTotal: []
    }
  })
  const [showFuturePaymentsModal, setShowFuturePaymentsModal] = useState(false)
  const [futurePaymentsPeriod, setFuturePaymentsPeriod] = useState('30') // Padrão: 30 dias
  const [futurePaymentsDetails, setFuturePaymentsDetails] = useState({ type: 'entradas', period: '30', items: [] })

  // Verificar se é super_admin
  const isSuperAdmin = () => profile?.role === 'super_admin'
  
  const isCompanyAdmin = () => {
    return profile?.user_companies?.some(uc => uc.role === 'company_admin' && uc.is_active) || false
  }
  
  const isGestor = () => {
    return profile?.user_companies?.some(uc => uc.role === 'gestor' && uc.is_active) || false
  }
  
  // Obter empresa do company admin
  const getCompanyAdminCompany = () => {
    if (!isCompanyAdmin()) return null
    const adminCompany = profile?.user_companies?.find(uc => uc.role === 'company_admin' && uc.is_active)
    if (!adminCompany) return null
    return { id: adminCompany.company_id, name: adminCompany.companies?.name }
  }

  // Obter empresa do gestor
  const getGestorCompany = () => {
    if (!isGestor()) return null
    const gestorCompany = profile?.user_companies?.find(uc => uc.role === 'gestor' && uc.is_active)
    if (!gestorCompany) return null
    return { id: gestorCompany.company_id, name: gestorCompany.companies?.name }
  }

  // Obter empresa atual (company_admin ou gestor)
  const getCurrentUserCompany = () => {
    return getCompanyAdminCompany() || getGestorCompany()
  }

  // Carregar empresas (apenas para super admin)
  useEffect(() => {
    if (profile && isSuperAdmin()) {
      loadCompanies()
    }
    // Marcar como inicializado quando profile carregar
    if (profile) {
      setInitialized(true)
    }
  }, [profile, searchParams])

  // Sincronizar selectedCompanyId com a URL quando mudar
  useEffect(() => {
    const companyFromUrl = searchParams.get('company') || searchParams.get('companyId')
    if (companyFromUrl && companyFromUrl !== selectedCompanyId) {
      setSelectedCompanyId(companyFromUrl)
    }
  }, [searchParams])

  // Ler período personalizado dos query params (vindo de entradas/saídas)
  useEffect(() => {
    const dataInicioParam = searchParams.get('dataInicio')
    const dataFimParam = searchParams.get('dataFim')
    
    if (dataInicioParam && dataFimParam) {
      setDataInicio(dataInicioParam)
      setDataFim(dataFimParam)
    }
  }, [searchParams])

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, logo_url')
        .order('name')

      if (error) throw error
      setCompanies(data || [])
      
      // Carregar avatars
      if (data) {
        loadCompanyAvatars(data)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar empresas:', error)
    }
  }

  const loadCompanyAvatars = async (companiesList) => {
    console.log('🔍 Carregando avatars para:', companiesList)
    const avatarUrls = {}
    
    for (const company of companiesList) {
      console.log(`Processando empresa ${company.name}, logo_url:`, company.logo_url)
      if (company.logo_url) {
        try {
          const { data, error } = await supabase.storage
            .from('company-avatars')
            .createSignedUrl(company.logo_url, 3600)
          
          if (error) {
            console.error(`❌ Erro ao criar signed URL para ${company.name}:`, error)
            continue
          }
          
          console.log(`✅ URL assinada para ${company.name}:`, data?.signedUrl)
          
          if (data?.signedUrl) {
            avatarUrls[company.id] = data.signedUrl
          }
        } catch (error) {
          console.error(`❌ Erro ao carregar logo de ${company.name}:`, error)
        }
      } else {
        console.log(`⚠️ Empresa ${company.name} não tem logo_url`)
      }
    }
    
    console.log('📦 Avatars carregados:', avatarUrls)
    setCompanyAvatars(avatarUrls)
  }

  // Carregar pagamentos futuros (a receber e a pagar)
  const loadFuturePayments = async () => {
    try {
      const currentCompany = getCurrentUserCompany()
      const companyId = isSuperAdmin() 
        ? (selectedCompanyId === 'all' ? null : selectedCompanyId)
        : currentCompany?.id

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()

      const next30 = new Date(today)
      next30.setDate(next30.getDate() + 30)
      const next30ISO = next30.toISOString()

      const next60 = new Date(today)
      next60.setDate(next60.getDate() + 60)
      const next60ISO = next60.toISOString()

      const next90 = new Date(today)
      next90.setDate(next90.getDate() + 90)
      const next90ISO = next90.toISOString()

      console.log('📅 Carregando pagamentos futuros:', { companyId, today: todayISO, next30: next30ISO, next60: next60ISO, next90: next90ISO })

      // ===== ENTRADAS FUTURAS =====
      
      // Próximos 30 dias
      let entradas30Query = supabase
        .from('dfc_entradas')
        .select('id, descricao, valor, vencimento, parcela_numero, mes, lancamento_pai_id, is_parcelado')
        .or('lancamento_pai_id.not.is.null,is_parcelado.eq.false') // Parcelas OU lançamentos simples
        .gt('vencimento', todayISO)
        .lte('vencimento', next30ISO)
        .order('vencimento', { ascending: true })

      if (companyId) entradas30Query = entradas30Query.eq('company_id', companyId)
      
      const { data: entradas30, error: err1 } = await entradas30Query
      if (err1) console.error('❌ Erro entradas 30 dias:', err1)
      else console.log('✅ Entradas 30 dias encontradas:', entradas30?.length, entradas30)

      // Próximos 60 dias
      let entradas60Query = supabase
        .from('dfc_entradas')
        .select('id, descricao, valor, vencimento, parcela_numero, mes, lancamento_pai_id, is_parcelado')
        .or('lancamento_pai_id.not.is.null,is_parcelado.eq.false')
        .gt('vencimento', todayISO)
        .lte('vencimento', next60ISO)
        .order('vencimento', { ascending: true })

      if (companyId) entradas60Query = entradas60Query.eq('company_id', companyId)
      
      const { data: entradas60, error: err1b } = await entradas60Query
      if (err1b) console.error('❌ Erro entradas 60 dias:', err1b)
      else console.log('✅ Entradas 60 dias encontradas:', entradas60?.length, entradas60)

      // Próximos 90 dias
      let entradas90Query = supabase
        .from('dfc_entradas')
        .select('id, descricao, valor, vencimento, parcela_numero, mes, lancamento_pai_id, is_parcelado')
        .or('lancamento_pai_id.not.is.null,is_parcelado.eq.false')
        .gt('vencimento', todayISO)
        .lte('vencimento', next90ISO)
        .order('vencimento', { ascending: true })

      if (companyId) entradas90Query = entradas90Query.eq('company_id', companyId)
      
      const { data: entradas90, error: err2 } = await entradas90Query
      if (err2) console.error('❌ Erro entradas 90 dias:', err2)
      else console.log('✅ Entradas 90 dias encontradas:', entradas90?.length, entradas90)

      // Total futuro
      let entradasTotalQuery = supabase
        .from('dfc_entradas')
        .select('id, descricao, valor, vencimento, parcela_numero, mes, lancamento_pai_id, is_parcelado')
        .or('lancamento_pai_id.not.is.null,is_parcelado.eq.false')
        .gt('vencimento', todayISO)
        .order('vencimento', { ascending: true })

      if (companyId) entradasTotalQuery = entradasTotalQuery.eq('company_id', companyId)
      
      const { data: entradasTotal, error: err3 } = await entradasTotalQuery
      if (err3) console.error('❌ Erro entradas total:', err3)
      else console.log('✅ Entradas total futuras encontradas:', entradasTotal?.length, entradasTotal)

      // ===== SAÍDAS FUTURAS =====
      
      // Próximos 60 dias
      let saidas60Query = supabase
        .from('dfc_saidas')
        .select('id, descricao, valor, vencimento, parcela_numero, mes, lancamento_pai_id, is_parcelado')
        .or('lancamento_pai_id.not.is.null,is_parcelado.eq.false')
        .gt('vencimento', todayISO)
        .lte('vencimento', next60ISO)
        .order('vencimento', { ascending: true })

      if (companyId) saidas60Query = saidas60Query.eq('company_id', companyId)
      
      const { data: saidas60, error: err4b } = await saidas60Query
      if (err4b) console.error('❌ Erro saídas 60 dias:', err4b)
      else console.log('✅ Saídas 60 dias encontradas:', saidas60?.length, saidas60)

      // Próximos 30 dias
      let saidas30Query = supabase
        .from('dfc_saidas')
        .select('id, descricao, valor, vencimento, parcela_numero, mes, lancamento_pai_id, is_parcelado')
        .or('lancamento_pai_id.not.is.null,is_parcelado.eq.false')
        .gt('vencimento', todayISO)
        .lte('vencimento', next30ISO)
        .order('vencimento', { ascending: true })

      if (companyId) saidas30Query = saidas30Query.eq('company_id', companyId)
      
      const { data: saidas30, error: err4 } = await saidas30Query
      if (err4) console.error('❌ Erro saídas 30 dias:', err4)
      else console.log('✅ Saídas 30 dias encontradas:', saidas30?.length, saidas30)

      // Próximos 90 dias
      let saidas90Query = supabase
        .from('dfc_saidas')
        .select('id, descricao, valor, vencimento, parcela_numero, mes, lancamento_pai_id, is_parcelado')
        .or('lancamento_pai_id.not.is.null,is_parcelado.eq.false')
        .gt('vencimento', todayISO)
        .lte('vencimento', next90ISO)
        .order('vencimento', { ascending: true })

      if (companyId) saidas90Query = saidas90Query.eq('company_id', companyId)
      
      const { data: saidas90, error: err5 } = await saidas90Query
      if (err5) console.error('❌ Erro saídas 90 dias:', err5)
      else console.log('✅ Saídas 90 dias encontradas:', saidas90?.length, saidas90)

      // Total futuro
      let saidasTotalQuery = supabase
        .from('dfc_saidas')
        .select('id, descricao, valor, vencimento, parcela_numero, mes, lancamento_pai_id, is_parcelado')
        .or('lancamento_pai_id.not.is.null,is_parcelado.eq.false')
        .gt('vencimento', todayISO)
        .order('vencimento', { ascending: true })

      if (companyId) saidasTotalQuery = saidasTotalQuery.eq('company_id', companyId)
      
      const { data: saidasTotal, error: err6 } = await saidasTotalQuery
      if (err6) console.error('❌ Erro saídas total:', err6)
      else console.log('✅ Saídas total futuras encontradas:', saidasTotal?.length, saidasTotal)

      // Calcular totais
      const future = {
        entradas: {
          next30Days: entradas30?.reduce((sum, e) => sum + (e.valor || 0), 0) || 0,
          next60Days: entradas60?.reduce((sum, e) => sum + (e.valor || 0), 0) || 0,
          next90Days: entradas90?.reduce((sum, e) => sum + (e.valor || 0), 0) || 0,
          total: entradasTotal?.reduce((sum, e) => sum + (e.valor || 0), 0) || 0,
          count30: entradas30?.length || 0,
          count60: entradas60?.length || 0,
          count90: entradas90?.length || 0,
          countTotal: entradasTotal?.length || 0,
          items30: entradas30 || [],
          items60: entradas60 || [],
          items90: entradas90 || [],
          itemsTotal: entradasTotal || []
        },
        saidas: {
          next30Days: saidas30?.reduce((sum, s) => sum + (s.valor || 0), 0) || 0,
          next60Days: saidas60?.reduce((sum, s) => sum + (s.valor || 0), 0) || 0,
          next90Days: saidas90?.reduce((sum, s) => sum + (s.valor || 0), 0) || 0,
          total: saidasTotal?.reduce((sum, s) => sum + (s.valor || 0), 0) || 0,
          count30: saidas30?.length || 0,
          count60: saidas60?.length || 0,
          count90: saidas90?.length || 0,
          countTotal: saidasTotal?.length || 0,
          items30: saidas30 || [],
          items60: saidas60 || [],
          items90: saidas90 || [],
          itemsTotal: saidasTotal || []
        }
      }

      console.log('💰 Pagamentos futuros calculados:', future)
      setFuturePayments(future)

    } catch (error) {
      console.error('❌ Erro ao carregar pagamentos futuros:', error)
    }
  }

  // Carregar histórico de relatórios do Supabase
  useEffect(() => {
    if (profile) {
      loadHistoricoRelatorios()
    }
  }, [profile, selectedCompanyId])

  const loadHistoricoRelatorios = async () => {
    try {
      const currentCompany = getCurrentUserCompany()
      const companyId = isSuperAdmin() 
        ? (selectedCompanyId === 'all' ? null : selectedCompanyId)
        : currentCompany?.id

      let query = supabase
        .from('dfc_relatorios_historico')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (companyId) {
        query = query.eq('company_id', companyId)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Erro ao carregar histórico:', error)
      } else {
        setHistoricoRelatorios(data || [])
      }
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error)
    }
  }

  // Obter empresa do usuário
  // (Removida - agora usando getCurrentUserCompany() acima que diferencia roles)

  useEffect(() => {
    // Só carregar dados depois de inicializar (ler URL)
    if (profile && initialized) {
      loadDashboardData()
      loadFuturePayments()
    }
  }, [profile, periodoTipo, dataInicio, dataFim, selectedCompanyId, mesesGrafico, initialized])

  // Recarregar dados quando a página fica visível (quando volta de outra página)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && profile) {
        loadDashboardData()
        loadFuturePayments()
      }
    }

    const handleFocus = () => {
      if (profile) {
        loadDashboardData()
        loadFuturePayments()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [profile, periodoTipo, dataInicio, dataFim, selectedCompanyId, mesesGrafico])

  // Função para calcular datas do período
  const getPeriodoDatas = () => {
    // Usar data atual no timezone local (sem hora)
    const hoje = new Date()
    const hojeLimpo = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
    let inicio, fim

    switch (periodoTipo) {
      case 'ultimos30dias':
        fim = new Date(hojeLimpo)
        inicio = new Date(hojeLimpo)
        inicio.setDate(inicio.getDate() - 30)
        break
      case 'ultimos3meses':
        fim = new Date(hojeLimpo)
        inicio = new Date(hojeLimpo)
        inicio.setMonth(inicio.getMonth() - 3)
        break
      case 'ultimos6meses':
        fim = new Date(hojeLimpo)
        inicio = new Date(hojeLimpo)
        inicio.setMonth(inicio.getMonth() - 6)
        break
      case 'ultimo12meses':
        fim = new Date(hojeLimpo)
        inicio = new Date(hojeLimpo)
        inicio.setFullYear(inicio.getFullYear() - 1)
        break
      case 'personalizado':
        if (dataInicio && dataFim) {
          const [yearI, monthI, dayI] = dataInicio.split('-')
          const [yearF, monthF, dayF] = dataFim.split('-')
          inicio = new Date(parseInt(yearI), parseInt(monthI) - 1, parseInt(dayI))
          fim = new Date(parseInt(yearF), parseInt(monthF) - 1, parseInt(dayF))
        } else {
          // Se não tem datas personalizadas, usar últimos 6 meses
          fim = new Date(hojeLimpo)
          inicio = new Date(hojeLimpo)
          inicio.setMonth(inicio.getMonth() - 6)
        }
        break
      default:
        fim = new Date(hojeLimpo)
        inicio = new Date(hojeLimpo)
        inicio.setMonth(inicio.getMonth() - 6)
    }

    // Formatar para YYYY-MM-DD
    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const periodo = {
      inicio: formatDate(inicio),
      fim: formatDate(fim)
    }

    console.log('📅 Período calculado:', periodo, 'Tipo:', periodoTipo)
    
    return periodo
  }

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const currentCompany = getCurrentUserCompany()
      const companyId = isSuperAdmin() 
        ? (selectedCompanyId === 'all' ? null : selectedCompanyId)
        : currentCompany?.id
      const { inicio, fim } = getPeriodoDatas()

      console.log('🔍 DFC Dashboard - Debug:', {
        isSuperAdmin: isSuperAdmin(),
        selectedCompanyId,
        companyId,
        currentCompany: currentCompany?.name,
        periodo: { inicio, fim, tipo: periodoTipo }
      })

      console.log('🔍 FILTROS APLICADOS:')
      console.log('  - Data início:', inicio)
      console.log('  - Data fim:', fim)
      console.log('  - Company ID:', companyId)

      // ====== CALCULAR SALDO INICIAL (antes do período) ======
      let saldoAnteriorQuery = supabase
        .from('dfc_entradas')
        .select('valor')
        .lt('vencimento', inicio)
        .or('is_parcelado.is.false,lancamento_pai_id.not.is.null') // Lançamentos simples OU parcelas filhas

      if (companyId) {
        saldoAnteriorQuery = saldoAnteriorQuery.eq('company_id', companyId)
      }

      const { data: entradasAnteriores } = await saldoAnteriorQuery
      
      let saidasAnteriorQuery = supabase
        .from('dfc_saidas')
        .select('valor')
        .lt('vencimento', inicio)
        .or('is_parcelado.is.false,lancamento_pai_id.not.is.null') // Lançamentos simples OU parcelas filhas

      if (companyId) {
        saidasAnteriorQuery = saidasAnteriorQuery.eq('company_id', companyId)
      }

      const { data: saidasAnteriores } = await saidasAnteriorQuery

      const totalEntradasAnteriores = entradasAnteriores?.reduce((sum, e) => sum + (e.valor || 0), 0) || 0
      const totalSaidasAnteriores = saidasAnteriores?.reduce((sum, s) => sum + (s.valor || 0), 0) || 0
      const saldoInicial = totalEntradasAnteriores - totalSaidasAnteriores

      console.log('💰 Saldo Inicial (antes do período):', {
        entradasAnteriores: totalEntradasAnteriores,
        saidasAnteriores: totalSaidasAnteriores,
        saldoInicial
      })

      // Carregar entradas do período
      let entradasQuery = supabase
        .from('dfc_entradas')
        .select('*')
        .gte('vencimento', inicio)
        .lte('vencimento', fim)
        .or('is_parcelado.is.false,lancamento_pai_id.not.is.null') // Lançamentos simples OU parcelas filhas
        .order('vencimento', { ascending: false })

      if (companyId) {
        entradasQuery = entradasQuery.eq('company_id', companyId)
      }

      const { data: entradas, error: entradasError } = await entradasQuery

      if (entradasError) {
        console.error('❌ Erro ao carregar entradas:', entradasError)
      } else {
        console.log('✅ Entradas carregadas:', entradas?.length)
        if (entradas && entradas.length > 0) {
          console.log('📝 Primeira entrada:', entradas[0])
          console.log('📝 Última entrada:', entradas[entradas.length - 1])
          console.log('📅 Todas as datas de vencimento:', entradas.map(e => e.vencimento).slice(0, 10))
          
          // Verificar se há entradas fora do período
          const foraDoPerido = entradas.filter(e => e.vencimento < inicio || e.vencimento > fim)
          if (foraDoPerido.length > 0) {
            console.warn('⚠️ ATENÇÃO: Encontradas', foraDoPerido.length, 'entradas FORA do período!')
            console.log('Exemplos:', foraDoPerido.slice(0, 3))
          }
        }
      }

      // Carregar saídas do período
      let saidasQuery = supabase
        .from('dfc_saidas')
        .select('*')
        .gte('vencimento', inicio)
        .lte('vencimento', fim)
        .or('is_parcelado.is.false,lancamento_pai_id.not.is.null') // Lançamentos simples OU parcelas filhas
        .order('vencimento', { ascending: false })

      if (companyId) {
        saidasQuery = saidasQuery.eq('company_id', companyId)
      }

      const { data: saidas, error: saidasError } = await saidasQuery

      if (saidasError) {
        console.error('❌ Erro ao carregar saídas:', saidasError)
      } else {
        console.log('✅ Saídas carregadas:', saidas?.length)
        if (saidas && saidas.length > 0) {
          console.log('📝 Primeira saída:', saidas[0])
          console.log('📝 Última saída:', saidas[saidas.length - 1])
          console.log('📅 Todas as datas de vencimento:', saidas.map(s => s.vencimento).slice(0, 10))
          
          // Verificar se há saídas fora do período
          const foraDoPerido = saidas.filter(s => s.vencimento < inicio || s.vencimento > fim)
          if (foraDoPerido.length > 0) {
            console.warn('⚠️ ATENÇÃO: Encontradas', foraDoPerido.length, 'saídas FORA do período!')
            console.log('Exemplos:', foraDoPerido.slice(0, 3))
          }
        }
      }

      // Carregar categorias do plano de contas (sem filtro de company_id - categorias são globais)
      const { data: categorias, error: categoriasError } = await supabase
        .from('dfc_categorias')
        .select('id, nome')

      if (categoriasError) {
        console.error('❌ Erro ao carregar categorias:', categoriasError)
      } else {
        console.log('✅ Categorias carregadas:', categorias?.length, categorias)
      }

      // Criar mapa de ID para nome
      const categoriaMap = {}
      categorias?.forEach(cat => {
        categoriaMap[cat.id] = cat.nome
      })

      console.log('📋 Mapa de categorias:', categoriaMap)
      if (saidas && saidas.length > 0) {
        console.log('🔍 ID da categoria na primeira saída:', saidas[0].categoria)
        console.log('🔍 Nome mapeado:', categoriaMap[saidas[0].categoria])
      }

      // Salvar dados para exportação
      setEntradasData(entradas || [])
      setSaidasData(saidas || [])
      setCategoriasMap(categoriaMap)

      // Calcular estatísticas
      const totalEntradas = entradas?.reduce((sum, e) => sum + (e.valor || 0), 0) || 0
      const totalSaidas = saidas?.reduce((sum, s) => sum + (s.valor || 0), 0) || 0
      const saldoPeriodo = totalEntradas - totalSaidas
      const saldoFinal = saldoInicial + saldoPeriodo

      console.log('💰 Totais calculados:', { 
        totalEntradas, 
        totalSaidas, 
        saldoPeriodo,
        saldoInicial,
        saldoFinal 
      })

      // Estatísticas do mês atual
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      
      console.log('📅 Mês atual:', { currentMonth, currentYear, monthName: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) })

      const entradasMes = entradas?.filter(e => {
        if (!e.vencimento) return false
        const [year, month, day] = e.vencimento.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      }).reduce((sum, e) => sum + (e.valor || 0), 0) || 0

      const saidasMes = saidas?.filter(s => {
        if (!s.vencimento) return false
        const [year, month, day] = s.vencimento.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      }).reduce((sum, s) => sum + (s.valor || 0), 0) || 0

      console.log('📊 Estatísticas do mês:', { entradasMes, saidasMes, saldoMes: entradasMes - saidasMes })

      setStats({
        totalEntradas,
        totalSaidas,
        saldoTotal: saldoPeriodo,
        saldoInicial,
        saldoFinal,
        entradasMes,
        saidasMes,
        saldoMes: entradasMes - saidasMes
      })

      // Dados mensais para gráfico (últimos 6 meses)
      // 🔥 Se não for período personalizado, buscar dados dos últimos 6 meses completos para os gráficos
      let entradasParaGrafico = entradas
      let saidasParaGrafico = saidas
      
      if (periodoTipo !== 'personalizado') {
        // Buscar dados dos últimos meses independente do filtro (baseado em mesesGrafico)
        const hoje = new Date()
        const mesesAtras = new Date(hoje)
        mesesAtras.setMonth(mesesAtras.getMonth() - mesesGrafico)
        
        const inicioGrafico = `${mesesAtras.getFullYear()}-${String(mesesAtras.getMonth() + 1).padStart(2, '0')}-${String(mesesAtras.getDate()).padStart(2, '0')}`
        const fimGrafico = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
        
        let entradasGraficoQuery = supabase
          .from('dfc_entradas')
          .select('valor, vencimento, categoria')
          .gte('vencimento', inicioGrafico)
          .lte('vencimento', fimGrafico)
          .or('is_parcelado.is.false,lancamento_pai_id.not.is.null')
          
        let saidasGraficoQuery = supabase
          .from('dfc_saidas')
          .select('valor, vencimento, categoria')
          .gte('vencimento', inicioGrafico)
          .lte('vencimento', fimGrafico)
          .or('is_parcelado.is.false,lancamento_pai_id.not.is.null')
          
        if (companyId) {
          entradasGraficoQuery = entradasGraficoQuery.eq('company_id', companyId)
          saidasGraficoQuery = saidasGraficoQuery.eq('company_id', companyId)
        }
        
        const { data: entradasGrafico } = await entradasGraficoQuery
        const { data: saidasGrafico } = await saidasGraficoQuery
        
        entradasParaGrafico = entradasGrafico || []
        saidasParaGrafico = saidasGrafico || []
      }

      const monthlyDataMap = {}
      const lastMonths = []
      
      for (let i = mesesGrafico - 1; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        
        lastMonths.push(monthKey)
        monthlyDataMap[monthKey] = {
          mes: monthName,
          entradas: 0,
          saidas: 0,
          saldo: 0
        }
      }

      entradasParaGrafico?.forEach(e => {
        if (!e.vencimento) return
        const [year, month, day] = e.vencimento.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (monthlyDataMap[monthKey]) {
          monthlyDataMap[monthKey].entradas += e.valor || 0
        }
      })

      saidasParaGrafico?.forEach(s => {
        if (!s.vencimento) return
        const [year, month, day] = s.vencimento.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (monthlyDataMap[monthKey]) {
          monthlyDataMap[monthKey].saidas += s.valor || 0
        }
      })

      const monthlyChartData = lastMonths.map(key => {
        const data = monthlyDataMap[key]
        return {
          ...data,
          saldo: data.entradas - data.saidas
        }
      })

      setMonthlyData(monthlyChartData)

      // Dados por categoria para gráfico de pizza
      const categoryValueMap = {}
      
      saidasParaGrafico?.forEach(s => {
        const categoriaId = s.categoria
        const categoriaNome = categoriaId ? (categoriaMap[categoriaId] || 'Categoria Desconhecida') : 'Sem Categoria'
        
        if (!categoryValueMap[categoriaNome]) {
          categoryValueMap[categoriaNome] = 0
        }
        categoryValueMap[categoriaNome] += s.valor || 0
      })

      const categoryChartData = Object.entries(categoryValueMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)

      setCategoryData(categoryChartData)

      // Transações recentes (últimas 10)
      const recentEntradas = entradas?.slice(0, 5).map(e => ({
        ...e,
        tipo: 'entrada',
        categoriaNome: e.categoria ? (categoriaMap[e.categoria] || 'Categoria Desconhecida') : 'Sem Categoria'
      })) || []

      const recentSaidas = saidas?.slice(0, 5).map(s => ({
        ...s,
        tipo: 'saida',
        categoriaNome: s.categoria ? (categoriaMap[s.categoria] || 'Categoria Desconhecida') : 'Sem Categoria'
      })) || []

      const allRecent = [...recentEntradas, ...recentSaidas]
        .sort((a, b) => {
          if (!a.vencimento || !b.vencimento) return 0
          const [yearA, monthA, dayA] = a.vencimento.split('-')
          const [yearB, monthB, dayB] = b.vencimento.split('-')
          const dateA = new Date(parseInt(yearA), parseInt(monthA) - 1, parseInt(dayA))
          const dateB = new Date(parseInt(yearB), parseInt(monthB) - 1, parseInt(dayB))
          return dateB - dateA
        })
        .slice(0, 10)

      setRecentTransactions(allRecent)

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  // Função para exportar relatório
  const exportarRelatorio = async () => {
    const currentCompany = getCurrentUserCompany()
    const { inicio, fim } = getPeriodoDatas()
    
    // Determinar empresa para o relatório
    const companyId = isSuperAdmin() 
      ? (selectedCompanyId === 'all' ? null : selectedCompanyId)
      : currentCompany?.id
    
    const companyName = isSuperAdmin()
      ? (selectedCompanyId === 'all' 
          ? 'Todas as Empresas' 
          : companies.find(c => c.id === selectedCompanyId)?.name || 'Empresa')
      : (currentCompany?.name || 'Empresa')
    
    // Obter avatar da empresa
    const companyAvatar = isSuperAdmin()
      ? (selectedCompanyId === 'all' 
          ? null 
          : companyAvatars[selectedCompanyId])
      : companyAvatars[currentCompany?.id]
    
    // Salvar no Supabase
    try {
      const { data, error } = await supabase
        .from('dfc_relatorios_historico')
        .insert({
          company_id: companyId,
          created_by: profile?.id,
          periodo_tipo: periodoTipo,
          periodo_inicio: inicio,
          periodo_fim: fim,
          total_entradas: stats.totalEntradas,
          total_saidas: stats.totalSaidas,
          saldo_total: stats.saldoTotal,
          quantidade_entradas: entradasData.length,
          quantidade_saidas: saidasData.length,
          empresa_nome: companyName,
          usuario_nome: profile?.full_name || 'Usuário'
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao salvar relatório no histórico:', error)
      } else {
        console.log('✅ Relatório salvo no histórico:', data)
        // Adicionar ao histórico imediatamente
        setHistoricoRelatorios(prev => [data, ...prev])
      }
    } catch (error) {
      console.error('❌ Erro ao salvar relatório:', error)
    }
    
    // Criar conteúdo HTML do relatório
    const relatorioHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório Financeiro - DFC</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      padding: 40px; 
      background: #f8f9fa;
    }
    .container { 
      max-width: 1200px; 
      margin: 0 auto; 
      background: white; 
      padding: 40px;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
    }
    .header { 
      border-bottom: 3px solid #EBA500; 
      padding-bottom: 20px; 
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    h1 { 
      color: #373435; 
      font-size: 28px;
      font-weight: 700;
    }
    .company-info {
      text-align: right;
      color: #666;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .company-avatar {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      object-fit: cover;
      border: 2px solid #EBA500;
    }
    .period { 
      background: #fff8e1; 
      padding: 15px; 
      border-radius: 8px; 
      margin-bottom: 30px;
      border-left: 4px solid #EBA500;
    }
    .stats-grid { 
      display: grid; 
      grid-template-columns: repeat(3, 1fr); 
      gap: 20px; 
      margin-bottom: 30px;
    }
    .stat-card { 
      background: #f8f9fa; 
      padding: 20px; 
      border-radius: 8px;
      border-left: 4px solid #3B82F6;
    }
    .stat-card.entrada { border-left-color: #10B981; }
    .stat-card.saida { border-left-color: #EF4444; }
    .stat-card.saldo { border-left-color: #EBA500; }
    .stat-label { 
      font-size: 12px; 
      color: #666; 
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value { 
      font-size: 24px; 
      font-weight: 700; 
      color: #373435;
    }
    .section { margin-bottom: 40px; }
    .section-title { 
      font-size: 20px; 
      color: #373435; 
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #f0f0f0;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 10px;
    }
    th { 
      background: #373435; 
      color: white; 
      padding: 12px; 
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td { 
      padding: 12px; 
      border-bottom: 1px solid #e0e0e0;
      font-size: 14px;
    }
    tr:hover { background: #f8f9fa; }
    .valor-positivo { color: #10B981; font-weight: 600; }
    .valor-negativo { color: #EF4444; font-weight: 600; }
    .footer { 
      margin-top: 40px; 
      padding-top: 20px; 
      border-top: 2px solid #e0e0e0; 
      text-align: center; 
      color: #666;
      font-size: 12px;
    }
    @media print {
      body { padding: 0; background: white; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>Relatório Financeiro - DFC</h1>
      </div>
      <div class="company-info">
        ${companyAvatar ? `<img src="${companyAvatar}" alt="${companyName}" class="company-avatar" />` : ''}
        <div>
          <strong>${companyName}</strong><br>
          <small>Gerado em: ${new Date().toLocaleString('pt-BR')}</small>
        </div>
      </div>
    </div>

    <div class="period">
      <strong>Período:</strong> ${formatDateBR(inicio)} até ${formatDateBR(fim)}
      ${periodoTipo !== 'personalizado' ? `<br><strong>Filtro:</strong> ${getPeriodoLabel()}` : ''}
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Saldo Inicial</div>
        <div class="stat-value">${formatCurrency(stats.saldoInicial)}</div>
        <small style="color: #666;">Acumulado até ${formatDateBR(inicio)}</small>
      </div>
      <div class="stat-card entrada">
        <div class="stat-label">Total de Entradas</div>
        <div class="stat-value">${formatCurrency(stats.totalEntradas)}</div>
      </div>
      <div class="stat-card saida">
        <div class="stat-label">Total de Saídas</div>
        <div class="stat-value">${formatCurrency(stats.totalSaidas)}</div>
      </div>
      <div class="stat-card saldo">
        <div class="stat-label">Movimentação do Período</div>
        <div class="stat-value">${formatCurrency(stats.saldoTotal)}</div>
      </div>
      <div class="stat-card" style="grid-column: span 2; border-left-color: #EBA500; background: #fff8e1;">
        <div class="stat-label" style="font-size: 14px;">Saldo Final (Acumulado)</div>
        <div class="stat-value" style="font-size: 32px; color: ${stats.saldoFinal >= 0 ? '#10B981' : '#EF4444'};">
          ${formatCurrency(stats.saldoFinal)}
        </div>
        <small style="color: #666;">Saldo inicial + movimentações = saldo final</small>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">📈 Entradas (${entradasData.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Vencimento</th>
            <th>Descrição</th>
            <th>Categoria</th>
            <th style="text-align: right;">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${entradasData.map(e => `
            <tr>
              <td>${formatDateBR(e.vencimento)}</td>
              <td>${e.descricao || '-'}</td>
              <td>${categoriasMap[e.categoria] || 'Sem Categoria'}</td>
              <td style="text-align: right;" class="valor-positivo">${formatCurrency(e.valor)}</td>
            </tr>
          `).join('')}
          ${entradasData.length === 0 ? '<tr><td colspan="4" style="text-align: center; color: #999;">Nenhuma entrada no período</td></tr>' : ''}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2 class="section-title">📉 Saídas (${saidasData.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Vencimento</th>
            <th>Descrição</th>
            <th>Categoria</th>
            <th style="text-align: right;">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${saidasData.map(s => `
            <tr>
              <td>${formatDateBR(s.vencimento)}</td>
              <td>${s.descricao || '-'}</td>
              <td>${categoriasMap[s.categoria] || 'Sem Categoria'}</td>
              <td style="text-align: right;" class="valor-negativo">-${formatCurrency(s.valor)}</td>
            </tr>
          `).join('')}
          ${saidasData.length === 0 ? '<tr><td colspan="4" style="text-align: center; color: #999;">Nenhuma saída no período</td></tr>' : ''}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p><strong>BG2 - Sistema de Gestão Financeira</strong></p>
      <p>Este relatório foi gerado automaticamente pelo sistema</p>
    </div>
  </div>

  <script>
    // Auto-print quando abrir
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
    `

    // Abrir em nova janela para impressão/salvar como PDF
    const novaJanela = window.open('', '_blank')
    novaJanela.document.write(relatorioHTML)
    novaJanela.document.close()
  }

  // Helper: busca e calcula todos os dados do DFC para o ano selecionado
  const buscarDadosDFC = async (year) => {
    const currentCompany = getCurrentUserCompany()
    const companyId = isSuperAdmin()
      ? (selectedCompanyId === 'all' ? null : selectedCompanyId)
      : currentCompany?.id
    const companyName = isSuperAdmin()
      ? (selectedCompanyId === 'all' ? 'Todas as Empresas' : companies.find(c => c.id === selectedCompanyId)?.name || 'Empresa')
      : (currentCompany?.name || 'Empresa')
    const yearStart = `${year}-01-01`
    const todayStr = new Date().toISOString().split('T')[0]
    const yearEnd = `${year}-12-31` < todayStr ? `${year}-12-31` : todayStr

    let entradasQuery = supabase
      .from('dfc_entradas').select('categoria, item_id, valor, mes, vencimento')
      .gte('vencimento', yearStart).lte('vencimento', yearEnd)
      .or('is_parcelado.is.false,lancamento_pai_id.not.is.null')
    if (companyId) entradasQuery = entradasQuery.eq('company_id', companyId)

    let saidasQuery = supabase
      .from('dfc_saidas').select('categoria, item_id, valor, mes, vencimento')
      .gte('vencimento', yearStart).lte('vencimento', yearEnd)
      .or('is_parcelado.is.false,lancamento_pai_id.not.is.null')
    if (companyId) saidasQuery = saidasQuery.eq('company_id', companyId)

    let saldoAntEntradasQ = supabase
      .from('dfc_entradas').select('valor').lt('vencimento', yearStart)
      .or('is_parcelado.is.false,lancamento_pai_id.not.is.null')
    if (companyId) saldoAntEntradasQ = saldoAntEntradasQ.eq('company_id', companyId)

    let saldoAntSaidasQ = supabase
      .from('dfc_saidas').select('valor').lt('vencimento', yearStart)
      .or('is_parcelado.is.false,lancamento_pai_id.not.is.null')
    if (companyId) saldoAntSaidasQ = saldoAntSaidasQ.eq('company_id', companyId)

    const [
      { data: entradas },
      { data: saidas },
      { data: allCategorias },
      { data: allItens },
      { data: antEntradas },
      { data: antSaidas }
    ] = await Promise.all([
      entradasQuery, saidasQuery,
      supabase.from('dfc_categorias').select('id, nome, tipo').order('nome'),
      supabase.from('dfc_itens').select('id, nome').order('nome'),
      saldoAntEntradasQ, saldoAntSaidasQ
    ])

    const saldoInicial =
      (antEntradas?.reduce((s, r) => s + (r.valor || 0), 0) || 0) -
      (antSaidas?.reduce((s, r) => s + (r.valor || 0), 0) || 0)

    const itemMap = {}
    allItens?.forEach(i => { itemMap[i.id] = i })

    const getMes = (row) => {
      const mesStr = row.mes || (row.vencimento ? row.vencimento.substring(0, 7) : null)
      if (!mesStr) return null
      return parseInt(mesStr.substring(5, 7))
    }
    const groupData = (rows) => {
      const groups = {}
      rows?.forEach(row => {
        const catId = row.categoria
        const itemId = row.item_id
        const mes = getMes(row)
        if (!catId || !itemId || !mes) return
        if (!groups[catId]) groups[catId] = {}
        if (!groups[catId][itemId]) groups[catId][itemId] = Array(12).fill(0)
        groups[catId][itemId][mes - 1] += row.valor || 0
      })
      return groups
    }

    const entradasGroups = groupData(entradas)
    const saidasGroups = groupData(saidas)

    const preEntradaTotals = Array(12).fill(0)
    const preSaidaTotals = Array(12).fill(0)
    Object.values(entradasGroups).forEach(items =>
      Object.values(items).forEach(monthArr => monthArr.forEach((v, i) => { preEntradaTotals[i] += v }))
    )
    Object.values(saidasGroups).forEach(items =>
      Object.values(items).forEach(monthArr => monthArr.forEach((v, i) => { preSaidaTotals[i] += v }))
    )
    const saldoInicialMonths = Array(12).fill(0)
    let runningBalance = saldoInicial
    for (let m = 0; m < 12; m++) {
      saldoInicialMonths[m] = runningBalance
      runningBalance += preEntradaTotals[m] - preSaidaTotals[m]
    }

    return {
      companyId,
      companyName,
      saldoInicial,
      saldoInicialMonths,
      entradasGroups,
      saidasGroups,
      entradaCats: (allCategorias || []).filter(c => c.tipo === 'entrada'),
      saidaCats: (allCategorias || []).filter(c => c.tipo === 'saida'),
      itemMap
    }
  }

  // Função para exportar Excel seguindo o modelo DFC
  const exportarExcel = async (year) => {
    const ExcelJS = (await import('exceljs')).default
    const workbook = new ExcelJS.Workbook()
    const ws = workbook.addWorksheet('Fluxo de Caixa (DFC)')

    toast.loading('Gerando planilha Excel...', { id: 'export-excel' })
    try {
      const { companyId, companyName, saldoInicial, saldoInicialMonths, entradasGroups, saidasGroups, entradaCats, saidaCats, itemMap } = await buscarDadosDFC(year)

      // Limita meses exibidos: se for o ano actual, apenas até o mês de hoje
      const today = new Date()
      const lastMonth = year === today.getFullYear() ? today.getMonth() + 1 : 12 // 1-indexed
      const totalCols = lastMonth + 2 // col 1 = descrição, cols 2..lastMonth+1 = meses, lastMonth+2 = TOTAL

      // Meses para cabeçalho
      const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'].slice(0, lastMonth)
      const numFmt = '#,##0.00'

      // --- Definições de estilo ---
      const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })
      const font = (bold, size, argb = 'FF000000') => ({ name: 'Calibri', size, bold, color: { argb } })
      const border = () => ({
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      })

      const styleTitle    = { font: font(true, 18, 'FFFFFFFF'), fill: fill('FF000000'), alignment: { vertical: 'middle', horizontal: 'left' }, border: border() }
      const styleHeader   = { font: font(true, 11), fill: fill('FFFFFFFF'), alignment: { horizontal: 'center', vertical: 'bottom' }, border: border() }
      const styleYellowL  = { font: font(true, 11), fill: fill('FFFFFF00'), alignment: { horizontal: 'left', vertical: 'bottom' }, border: border() }
      const styleYellow   = { font: font(true, 11), fill: fill('FFFFFF00'), alignment: { horizontal: 'right', vertical: 'bottom' }, border: border(), numFmt }
      const styleGrayL    = { font: font(true, 11), fill: fill('FFBFBFBF'), alignment: { horizontal: 'left', vertical: 'bottom' }, border: border() }
      const styleGray     = { font: font(true, 11), fill: fill('FFBFBFBF'), alignment: { horizontal: 'right', vertical: 'bottom' }, border: border(), numFmt }
      const styleGrayCode = { font: font(true, 11), fill: fill('FFBFBFBF'), alignment: { horizontal: 'center', vertical: 'bottom' }, border: border() }
      const styleItemL    = { font: font(false, 11), fill: fill('FFFFFFFF'), alignment: { horizontal: 'left', vertical: 'bottom' }, border: border() }
      const styleItem     = { font: font(false, 11), fill: fill('FFFFFFFF'), alignment: { horizontal: 'right', vertical: 'bottom' }, border: border(), numFmt }

      // Larguras das colunas
      ws.getColumn(1).width = 42
      for (let i = 2; i <= lastMonth + 1; i++) ws.getColumn(i).width = 14
      ws.getColumn(lastMonth + 2).width = 16

      let rowNum = 0

      // Aplica estilo em uma célula
      const applyStyle = (cell, style, value) => {
        cell.value = value
        cell.font = style.font
        cell.fill = style.fill
        cell.alignment = style.alignment
        cell.border = style.border
        if (style.numFmt && typeof value === 'number') cell.numFmt = style.numFmt
      }

      // Soma mensal + total (somente até lastMonth)
      const makeVals = (arr) => {
        const a = (arr || Array(12).fill(0)).slice(0, lastMonth)
        return [...a, a.reduce((s, v) => s + v, 0)]
      }

      // --- LINHA 1: Título ---
      rowNum++
      ws.mergeCells(rowNum, 1, rowNum, totalCols)
      const cutoffLabel = lastMonth < 12 ? ` (até ${today.toLocaleDateString('pt-BR')})` : ''
      applyStyle(ws.getCell(rowNum, 1), styleTitle, `DEMONSTRATIVO DE FLUXO DE CAIXA (DFC) ${year}${cutoffLabel} - ${companyName.toUpperCase()}`)
      ws.getRow(rowNum).height = 50

      // --- LINHA 2: Cabeçalho meses ---
      rowNum++
      ws.getRow(rowNum).height = 20
      ;['', ...MONTHS, 'TOTAL'].forEach((v, i) => applyStyle(ws.getCell(rowNum, i + 1), styleHeader, v || null))

      // --- LINHA 3: SALDO INICIAL (saldo de abertura de cada mês) ---
      rowNum++
      ws.getRow(rowNum).height = 20
      applyStyle(ws.getCell(rowNum, 1), styleYellowL, 'SALDO INICIAL')
      const saldoInicialVals = makeVals(saldoInicialMonths)
      for (let c = 2; c <= totalCols; c++) applyStyle(ws.getCell(rowNum, c), styleYellow, saldoInicialVals[c - 2] !== 0 ? saldoInicialVals[c - 2] : null)

      // Função auxiliar: linha de categoria (gris com prefixo)
      const addCatRow = (prefix, name, monthTotals) => {
        rowNum++
        ws.getRow(rowNum).height = 20
        applyStyle(ws.getCell(rowNum, 1), styleGrayL, `${prefix} ${name.toUpperCase()}`)
        const vals = makeVals(monthTotals)
        for (let c = 2; c <= totalCols; c++) applyStyle(ws.getCell(rowNum, c), styleGray, vals[c - 2])
      }

      // Função auxiliar: linha de código da categoria
      const addCatCodeRow = (code) => {
        rowNum++
        ws.getRow(rowNum).height = 19
        applyStyle(ws.getCell(rowNum, 1), styleGrayCode, code)
        for (let c = 2; c <= totalCols; c++) applyStyle(ws.getCell(rowNum, c), styleGrayCode, null)
      }

      // Função auxiliar: linha de item (branca)
      const addItemRow = (name, monthVals) => {
        rowNum++
        ws.getRow(rowNum).height = 19
        applyStyle(ws.getCell(rowNum, 1), styleItemL, name)
        const vals = makeVals(monthVals)
        for (let c = 2; c <= totalCols; c++) applyStyle(ws.getCell(rowNum, c), styleItem, vals[c - 2])
      }

      // Função auxiliar: linha spacer
      const addSpacer = () => {
        rowNum++
        ws.getRow(rowNum).height = 8
        for (let c = 1; c <= totalCols; c++) {
          const cell = ws.getCell(rowNum, c)
          cell.fill = fill('FFFFFFFF')
        }
      }

      // Função auxiliar: linha de total calculado (amarelo)
      const addTotalRow = (label, monthTotals) => {
        rowNum++
        ws.getRow(rowNum).height = 20
        applyStyle(ws.getCell(rowNum, 1), styleYellowL, label)
        const vals = makeVals(monthTotals)
        for (let c = 2; c <= totalCols; c++) applyStyle(ws.getCell(rowNum, c), styleYellow, vals[c - 2])
      }

      // Função auxiliar: linha de resultado calculado (cinza bold)
      const addResultRow = (label, monthTotals) => {
        rowNum++
        ws.getRow(rowNum).height = 20
        applyStyle(ws.getCell(rowNum, 1), styleGrayL, label)
        const vals = makeVals(monthTotals)
        for (let c = 2; c <= totalCols; c++) applyStyle(ws.getCell(rowNum, c), styleGray, vals[c - 2])
      }

      // ========= SEÇÃO ENTRADAS =========
      const entradaTotals = Array(12).fill(0)

      for (const cat of entradaCats) {
        const catGroups = entradasGroups[cat.id] || {}
        const catMonthTotals = Array(12).fill(0)

        Object.values(catGroups).forEach(monthArr => {
          monthArr.forEach((v, i) => { catMonthTotals[i] += v })
        })
        catMonthTotals.forEach((v, i) => { entradaTotals[i] += v })

        // Pular categorias sem dados nem itens atribuídos (mostrar só as que têm transações)
        const hasData = catMonthTotals.some(v => v > 0)
        if (!hasData && Object.keys(catGroups).length === 0) continue

        addCatRow('(+)', cat.nome, catMonthTotals)
        addCatCodeRow(cat.nome.toUpperCase().replace(/\s/g, '.').substring(0, 12))

        for (const [itemId, monthVals] of Object.entries(catGroups)) {
          const item = itemMap[itemId]
          addItemRow(item ? item.nome : 'Item', monthVals)
        }

        addSpacer()
      }

      addTotalRow('(+) RECEITA OPERACIONAL BRUTA', entradaTotals)
      addSpacer()

      // ========= SEÇÃO SAÍDAS =========
      const saidaTotals = Array(12).fill(0)

      for (const cat of saidaCats) {
        const catGroups = saidasGroups[cat.id] || {}
        const catMonthTotals = Array(12).fill(0)

        Object.values(catGroups).forEach(monthArr => {
          monthArr.forEach((v, i) => { catMonthTotals[i] += v })
        })
        catMonthTotals.forEach((v, i) => { saidaTotals[i] += v })

        const hasData = catMonthTotals.some(v => v > 0)
        if (!hasData && Object.keys(catGroups).length === 0) continue

        addCatRow('(-)', cat.nome, catMonthTotals)
        addCatCodeRow(cat.nome.toUpperCase().replace(/\s/g, '.').substring(0, 12))

        for (const [itemId, monthVals] of Object.entries(catGroups)) {
          const item = itemMap[itemId]
          addItemRow(item ? item.nome : 'Item', monthVals)
        }

        addSpacer()
      }

      // ========= RESULTADOS FINAIS =========
      const lucroMonths = entradaTotals.map((v, i) => v - saidaTotals[i])
      addResultRow('(=) LUCRO LÍQUIDO', lucroMonths)

      // Saldo final cumulativo por mês
      const saldoFinalMonths = []
      let acc = saldoInicial
      for (const v of lucroMonths) {
        acc += v
        saldoFinalMonths.push(acc)
      }
      addResultRow('Saldo final', saldoFinalMonths)

      // ========= Gerar e baixar o arquivo =========
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `DFC-${companyName.replace(/[^a-zA-Z0-9]/g, '_')}-${year}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Planilha exportada com sucesso!', { id: 'export-excel' })

      // Salvar no histórico
      try {
        const { inicio: inicioHist, fim: fimHist } = getPeriodoDatas()
        await supabase.from('dfc_relatorios_historico').insert({
          company_id: companyId,
          created_by: profile?.id,
          periodo_tipo: periodoTipo,
          periodo_inicio: inicioHist,
          periodo_fim: fimHist,
          total_entradas: stats.totalEntradas,
          total_saidas: stats.totalSaidas,
          saldo_total: stats.saldoTotal,
          quantidade_entradas: entradasData.length,
          quantidade_saidas: saidasData.length,
          empresa_nome: companyName,
          usuario_nome: profile?.full_name || 'Usuário'
        })
      } catch (histError) {
        console.error('Erro ao salvar histórico:', histError)
      }

    } catch (error) {
      console.error('Erro ao exportar Excel:', error)
      toast.error('Erro ao gerar planilha. Tente novamente.', { id: 'export-excel' })
    }
  }

  // Função para exportar CSV seguindo o modelo DFC
  const exportarCSV = async (year) => {
    toast.loading('Gerando CSV...', { id: 'export-csv' })
    try {
      const { companyName, saldoInicial, saldoInicialMonths, entradasGroups, saidasGroups, entradaCats, saidaCats, itemMap } = await buscarDadosDFC(year)
      const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
      const fmtN = (v) => typeof v === 'number' ? v.toFixed(2).replace('.', ',') : ''
      const makeVals = (arr) => { const a = arr || Array(12).fill(0); return [...a, a.reduce((s, v) => s + v, 0)] }
      const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`

      const rows = []
      rows.push([`DEMONSTRATIVO DE FLUXO DE CAIXA (DFC) ${year} - ${companyName.toUpperCase()}`])
      rows.push(['', ...MONTHS, 'TOTAL'])
      rows.push(['SALDO INICIAL', ...makeVals(saldoInicialMonths).map(fmtN)])
      rows.push(['CONCILIAÇÃO BANCÁRIA'])
      rows.push(['SALDO DE CONCILIAÇÃO'])

      const entradaTotals = Array(12).fill(0)
      for (const cat of entradaCats) {
        const catGroups = entradasGroups[cat.id] || {}
        const catMonthTotals = Array(12).fill(0)
        Object.values(catGroups).forEach(monthArr => monthArr.forEach((v, i) => { catMonthTotals[i] += v }))
        catMonthTotals.forEach((v, i) => { entradaTotals[i] += v })
        if (!catMonthTotals.some(v => v > 0) && Object.keys(catGroups).length === 0) continue
        rows.push([`(+) ${cat.nome.toUpperCase()}`, ...makeVals(catMonthTotals).map(fmtN)])
        for (const [itemId, monthVals] of Object.entries(catGroups)) {
          const item = itemMap[itemId]
          rows.push([`  ${item ? item.nome : 'Item'}`, ...makeVals(monthVals).map(fmtN)])
        }
        rows.push([])
      }
      rows.push([`(+) RECEITA OPERACIONAL BRUTA`, ...makeVals(entradaTotals).map(fmtN)])
      rows.push([])

      const saidaTotals = Array(12).fill(0)
      for (const cat of saidaCats) {
        const catGroups = saidasGroups[cat.id] || {}
        const catMonthTotals = Array(12).fill(0)
        Object.values(catGroups).forEach(monthArr => monthArr.forEach((v, i) => { catMonthTotals[i] += v }))
        catMonthTotals.forEach((v, i) => { saidaTotals[i] += v })
        if (!catMonthTotals.some(v => v > 0) && Object.keys(catGroups).length === 0) continue
        rows.push([`(-) ${cat.nome.toUpperCase()}`, ...makeVals(catMonthTotals).map(fmtN)])
        for (const [itemId, monthVals] of Object.entries(catGroups)) {
          const item = itemMap[itemId]
          rows.push([`  ${item ? item.nome : 'Item'}`, ...makeVals(monthVals).map(fmtN)])
        }
        rows.push([])
      }

      const lucroMonths = entradaTotals.map((v, i) => v - saidaTotals[i])
      rows.push(['(=) LUCRO LÍQUIDO', ...makeVals(lucroMonths).map(fmtN)])
      rows.push(['% de lucro'])
      const saldoFinalMonths = []
      let acc = saldoInicial
      for (const v of lucroMonths) { acc += v; saldoFinalMonths.push(acc) }
      rows.push(['Saldo final', ...makeVals(saldoFinalMonths).map(fmtN)])

      const csv = rows.map(r => r.map(esc).join(';')).join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `DFC-${companyName.replace(/[^a-zA-Z0-9]/g, '_')}-${year}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('CSV exportado com sucesso!', { id: 'export-csv' })
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      toast.error('Erro ao gerar CSV. Tente novamente.', { id: 'export-csv' })
    }
  }

  // Função para exportar PDF A4 paisagem seguindo o modelo DFC
  const exportarPDF = async (year) => {
    toast.loading('Preparando PDF...', { id: 'export-pdf' })
    try {
      const { companyName, saldoInicial, saldoInicialMonths, entradasGroups, saidasGroups, entradaCats, saidaCats, itemMap } = await buscarDadosDFC(year)
      const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
      const fmtN = (v) => typeof v === 'number' ? v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
      const makeTotal = (arr) => (arr || Array(12).fill(0)).reduce((s, v) => s + v, 0)
      const td = 'border:1px solid #999;padding:2px 4px;font-size:7.5pt;white-space:nowrap;'

      const yellowRow = (label, vals) => {
        const a = vals || Array(12).fill(0)
        return `<tr><td style="${td}background:#FFFF00;font-weight:bold;min-width:160px">${label}</td>${a.map(v => `<td style="${td}background:#FFFF00;font-weight:bold;text-align:right">${fmtN(v)}</td>`).join('')}<td style="${td}background:#FFFF00;font-weight:bold;text-align:right">${fmtN(makeTotal(a))}</td></tr>`
      }
      const grayRow = (label, vals) => {
        const a = vals || Array(12).fill(0)
        return `<tr><td style="${td}background:#BFBFBF;font-weight:bold">${label}</td>${a.map(v => `<td style="${td}background:#BFBFBF;font-weight:bold;text-align:right">${fmtN(v)}</td>`).join('')}<td style="${td}background:#BFBFBF;font-weight:bold;text-align:right">${fmtN(makeTotal(a))}</td></tr>`
      }
      const whiteRow = (label, vals) => {
        const a = vals || Array(12).fill(0)
        return `<tr><td style="${td}padding-left:14px">${label}</td>${a.map(v => `<td style="${td}text-align:right">${fmtN(v)}</td>`).join('')}<td style="${td}text-align:right">${fmtN(makeTotal(a))}</td></tr>`
      }

      let bodyRows = ''
      bodyRows += `<tr><td colspan="15" style="background:#000;color:#fff;font-weight:bold;font-size:11pt;padding:6px 8px;border:1px solid #000">DEMONSTRATIVO DE FLUXO DE CAIXA (DFC) ${year} — ${companyName.toUpperCase()}</td></tr>`
      bodyRows += `<tr><th style="${td}background:#000;color:#fff">Descrição</th>${MONTHS.map(m => `<th style="${td}background:#000;color:#fff;text-align:center">${m}</th>`).join('')}<th style="${td}background:#000;color:#fff;text-align:center">TOTAL</th></tr>`
      bodyRows += yellowRow('SALDO INICIAL', saldoInicialMonths)
      bodyRows += yellowRow('CONCILIAÇÃO BANCÁRIA', null)
      bodyRows += yellowRow('SALDO DE CONCILIAÇÃO', null)

      const entradaTotals = Array(12).fill(0)
      for (const cat of entradaCats) {
        const catGroups = entradasGroups[cat.id] || {}
        const catMonthTotals = Array(12).fill(0)
        Object.values(catGroups).forEach(monthArr => monthArr.forEach((v, i) => { catMonthTotals[i] += v }))
        catMonthTotals.forEach((v, i) => { entradaTotals[i] += v })
        if (!catMonthTotals.some(v => v > 0) && Object.keys(catGroups).length === 0) continue
        bodyRows += grayRow(`(+) ${cat.nome.toUpperCase()}`, catMonthTotals)
        for (const [itemId, monthVals] of Object.entries(catGroups)) {
          const item = itemMap[itemId]
          bodyRows += whiteRow(item ? item.nome : 'Item', monthVals)
        }
      }
      bodyRows += yellowRow('(+) RECEITA OPERACIONAL BRUTA', entradaTotals)

      const saidaTotals = Array(12).fill(0)
      for (const cat of saidaCats) {
        const catGroups = saidasGroups[cat.id] || {}
        const catMonthTotals = Array(12).fill(0)
        Object.values(catGroups).forEach(monthArr => monthArr.forEach((v, i) => { catMonthTotals[i] += v }))
        catMonthTotals.forEach((v, i) => { saidaTotals[i] += v })
        if (!catMonthTotals.some(v => v > 0) && Object.keys(catGroups).length === 0) continue
        bodyRows += grayRow(`(-) ${cat.nome.toUpperCase()}`, catMonthTotals)
        for (const [itemId, monthVals] of Object.entries(catGroups)) {
          const item = itemMap[itemId]
          bodyRows += whiteRow(item ? item.nome : 'Item', monthVals)
        }
      }

      const lucroMonths = entradaTotals.map((v, i) => v - saidaTotals[i])
      bodyRows += grayRow('(=) LUCRO LÍQUIDO', lucroMonths)
      bodyRows += grayRow('% de lucro', null)
      const saldoFinalMonths = []
      let acc = saldoInicial
      for (const v of lucroMonths) { acc += v; saldoFinalMonths.push(acc) }
      bodyRows += grayRow('Saldo final', saldoFinalMonths)

      const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>DFC ${year} - ${companyName}</title>
<style>
  @page { size: A4 landscape; margin: 8mm; }
  body { font-family: Calibri, Arial, sans-serif; margin: 0; }
  table { border-collapse: collapse; width: 100%; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body><table>${bodyRows}</table></body></html>`

      const win = window.open('', '_blank')
      win.document.write(html)
      win.document.close()
      win.focus()
      setTimeout(() => { win.print() }, 600)
      toast.success('PDF pronto para impressão!', { id: 'export-pdf' })
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      toast.error('Erro ao gerar PDF. Tente novamente.', { id: 'export-pdf' })
    }
  }

  // Função auxiliar para formatar data BR
  const formatDateBR = (dateString) => {
    if (!dateString) return '-'
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year}`
  }

  // Função para obter label do período
  const getPeriodoLabel = (tipo) => {
    const tipoUsar = tipo || periodoTipo
    const labels = {
      'ultimos30dias': 'Últimos 30 dias',
      'ultimos3meses': 'Últimos 3 meses',
      'ultimos6meses': 'Últimos 6 meses',
      'ultimo12meses': 'Último ano',
      'personalizado': 'Período Personalizado'
    }
    return labels[tipoUsar] || 'Período Personalizado'
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <SuperAdminBanner />
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-primary-500 rounded-xl sm:rounded-2xl">
              <TrendingDown className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Demonstrativo de Fluxo de Caixa</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 truncate">Visão geral das movimentações financeiras</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Controle de Período */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filtros</h3>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowHistoricoModal(true)}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300 flex-1 sm:flex-none"
                title="Ver histórico de relatórios"
              >
                <History className="h-4 w-4" />
                <span className="font-medium text-sm">Histórico</span>
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-md hover:shadow-lg flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4" />
                <span className="font-medium text-sm">Exportar</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Seletor de Empresa (apenas para Super Admin) */}
            {isSuperAdmin() && (
              <div className="lg:col-span-2 space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Empresa
                </label>
                
                {/* Dropdown Customizado */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white text-left flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {selectedCompanyId === 'all' ? (
                        <>
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span>Todas as Empresas</span>
                        </>
                      ) : (
                        <>
                          {companyAvatars[selectedCompanyId] ? (
                            <img 
                              src={companyAvatars[selectedCompanyId]} 
                              alt="Logo"
                              className="h-6 w-6 rounded object-cover"
                            />
                          ) : (
                            <Building2 className="h-4 w-4 text-gray-400" />
                          )}
                          <span>{companies.find(c => c.id === selectedCompanyId)?.name || 'Empresa'}</span>
                        </>
                      )}
                    </div>
                    <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${showCompanyDropdown ? 'rotate-90' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showCompanyDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                      {/* Busca */}
                      {companies.length > 5 && (
                        <div className="p-2 border-b border-gray-200">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              value={companySearch}
                              onChange={(e) => setCompanySearch(e.target.value)}
                              placeholder="Buscar empresa..."
                              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      )}

                      {/* Lista de empresas */}
                      <div className="overflow-y-auto max-h-48">
                        {/* Opção "Todas as Empresas" */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCompanyId('all')
                            setShowCompanyDropdown(false)
                            setCompanySearch('')
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            selectedCompanyId === 'all' ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span>Todas as Empresas</span>
                          </div>
                        </button>

                        {/* Empresas filtradas */}
                        {companies
                          .filter(company => 
                            company.name.toLowerCase().includes(companySearch.toLowerCase())
                          )
                          .map(company => (
                            <button
                              key={company.id}
                              type="button"
                              onClick={() => {
                                setSelectedCompanyId(company.id)
                                setShowCompanyDropdown(false)
                                setCompanySearch('')
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                selectedCompanyId === company.id ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-900'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {companyAvatars[company.id] ? (
                                  <img 
                                    src={companyAvatars[company.id]} 
                                    alt={company.name}
                                    className="h-6 w-6 rounded object-cover"
                                  />
                                ) : (
                                  <Building2 className="h-4 w-4 text-gray-400" />
                                )}
                                <span className="truncate">{company.name}</span>
                              </div>
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Períodos Pré-definidos */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700">Períodos Rápidos</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPeriodoTipo('ultimos30dias')}
                  className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    periodoTipo === 'ultimos30dias'
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="hidden sm:inline">Últimos </span>30 dias
                </button>
                <button
                  onClick={() => setPeriodoTipo('ultimos3meses')}
                  className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    periodoTipo === 'ultimos3meses'
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="hidden sm:inline">Últimos </span>3 meses
                </button>
                <button
                  onClick={() => setPeriodoTipo('ultimos6meses')}
                  className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    periodoTipo === 'ultimos6meses'
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="hidden sm:inline">Últimos </span>6 meses
                </button>
                <button
                  onClick={() => setPeriodoTipo('ultimo12meses')}
                  className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    periodoTipo === 'ultimo12meses'
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="hidden sm:inline">Último </span>1 ano
                </button>
              </div>
            </div>

            {/* Período Personalizado */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700">Período Personalizado</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-600">Data Início</label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => {
                      setDataInicio(e.target.value)
                      if (e.target.value && dataFim) {
                        setPeriodoTipo('personalizado')
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-600">Data Fim</label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => {
                      setDataFim(e.target.value)
                      if (dataInicio && e.target.value) {
                        setPeriodoTipo('personalizado')
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              {periodoTipo === 'personalizado' && dataInicio && dataFim && (() => {
                const [yearI, monthI, dayI] = dataInicio.split('-')
                const [yearF, monthF, dayF] = dataFim.split('-')
                const dateI = new Date(parseInt(yearI), parseInt(monthI) - 1, parseInt(dayI))
                const dateF = new Date(parseInt(yearF), parseInt(monthF) - 1, parseInt(dayF))
                return (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Período personalizado ativo: {dateI.toLocaleDateString('pt-BR')} até {dateF.toLocaleDateString('pt-BR')}
                  </p>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Cards de Acesso Rápido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {(() => {
            const isAdminCtx = searchParams.get('from') === 'admin' && selectedCompanyId && selectedCompanyId !== 'all'
            const buildSubUrl = (base, extra = {}) => {
              const params = {
                ...extra,
                ...(isAdminCtx ? { companyId: selectedCompanyId, from: 'admin' } : (selectedCompanyId && selectedCompanyId !== 'all' ? { companyId: selectedCompanyId } : {}))
              }
              const qs = new URLSearchParams(params).toString()
              return qs ? `${base}?${qs}` : base
            }
            const handleSubNav = (destPath) => {
              if (isAdminCtx) {
                const existing = sessionStorage.getItem('superAdminContext')
                if (existing) {
                  const ctx = JSON.parse(existing)
                  sessionStorage.setItem('superAdminContext', JSON.stringify({
                    ...ctx,
                    returnUrl: `/dfc?companyId=${selectedCompanyId}&from=admin`
                  }))
                }
              }
            }
            return (
              <>
          <Link
            to={buildSubUrl('/dfc/entradas', dataInicio && dataFim ? { dataInicio, dataFim } : {})}
            onClick={() => handleSubNav('/dfc/entradas')}
            className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border-2 border-green-200 hover:shadow-lg transition-all hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Entradas no Período</p>
                <h3 className="text-xl sm:text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(stats.totalEntradas)}
                </h3>
                <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                  Mês atual: {formatCurrency(stats.entradasMes)}
                </p>
              </div>
              <div className="p-4 bg-green-100 rounded-xl">
                <ArrowUpCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-green-600">
              <span className="text-sm font-semibold">Gerenciar Entradas</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </Link>

          <Link
            to={buildSubUrl('/dfc/saidas', dataInicio && dataFim ? { dataInicio, dataFim } : {})}
            onClick={() => handleSubNav('/dfc/saidas')}
            className="bg-white rounded-2xl p-6 shadow-sm border-2 border-red-200 hover:shadow-lg transition-all hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saídas no Período</p>
                <h3 className="text-2xl font-bold text-red-600 mt-1">
                  {formatCurrency(stats.totalSaidas)}
                </h3>
                <p className="text-xs text-gray-500 mt-2">
                  Mês atual: {formatCurrency(stats.saidasMes)}
                </p>
              </div>
              <div className="p-4 bg-red-100 rounded-xl">
                <ArrowDownCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-red-600">
              <span className="text-sm font-semibold">Gerenciar Saídas</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </Link>

          <Link
            to={buildSubUrl('/dfc/plano-contas')}
            onClick={() => handleSubNav('/dfc/plano-contas')}
            className="bg-white rounded-2xl p-6 shadow-sm border-2 border-blue-200 hover:shadow-lg transition-all hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Plano de Contas</p>
                <h3 className="text-2xl font-bold text-blue-600 mt-1">Gerenciar</h3>
                <p className="text-xs text-gray-500 mt-2">
                  Categorias e subcategorias
                </p>
              </div>
              <div className="p-4 bg-blue-100 rounded-xl">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-blue-600">
              <span className="text-sm font-semibold">Configurar Plano</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </Link>
        </>
        )})()
        }
        </div>

        {/* Pagamentos Futuros - A Receber e A Pagar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* A Receber (Entradas Futuras) */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-lg border-2 border-green-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500 rounded-xl shadow-md">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-900">A Receber</h3>
                  <p className="text-xs text-green-700">Parcelas não recebidas</p>
                </div>
              </div>
              
              {/* Dropdown de Período */}
              <select
                value={futurePaymentsPeriod}
                onChange={(e) => setFuturePaymentsPeriod(e.target.value)}
                className="px-3 py-2 bg-white border-2 border-green-300 rounded-lg text-sm font-semibold text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer hover:bg-green-50 transition-all"
              >
                <option value="30">Próximos 30 dias</option>
                <option value="60">Próximos 60 dias</option>
                <option value="90">Próximos 90 dias</option>
                <option value="total">Total</option>
              </select>
            </div>

            {/* Display único baseado no período selecionado */}
            <button
              onClick={() => {
                const periodMap = {
                  '30': { items: futurePayments.entradas.items30 },
                  '60': { items: futurePayments.entradas.items60 },
                  '90': { items: futurePayments.entradas.items90 },
                  'total': { items: futurePayments.entradas.itemsTotal }
                }
                setFuturePaymentsDetails({ type: 'entradas', period: futurePaymentsPeriod, items: periodMap[futurePaymentsPeriod].items || [] })
                setShowFuturePaymentsModal(true)
              }}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 rounded-xl p-6 transition-all hover:scale-102 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs font-semibold text-white/90 mb-2">
                    {futurePaymentsPeriod === '30' && 'Próximos 30 dias'}
                    {futurePaymentsPeriod === '60' && 'Próximos 60 dias'}
                    {futurePaymentsPeriod === '90' && 'Próximos 90 dias'}
                    {futurePaymentsPeriod === 'total' && 'Total a Receber'}
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {futurePaymentsPeriod === '30' && formatCurrency(futurePayments.entradas.next30Days)}
                    {futurePaymentsPeriod === '60' && formatCurrency(futurePayments.entradas.next60Days)}
                    {futurePaymentsPeriod === '90' && formatCurrency(futurePayments.entradas.next90Days)}
                    {futurePaymentsPeriod === 'total' && formatCurrency(futurePayments.entradas.total)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-white/90 block mb-1">
                    {futurePaymentsPeriod === '30' && futurePayments.entradas.count30}
                    {futurePaymentsPeriod === '60' && futurePayments.entradas.count60}
                    {futurePaymentsPeriod === '90' && futurePayments.entradas.count90}
                    {futurePaymentsPeriod === 'total' && futurePayments.entradas.countTotal}
                    {' '}parcela
                    {((futurePaymentsPeriod === '30' && futurePayments.entradas.count30 !== 1) ||
                      (futurePaymentsPeriod === '60' && futurePayments.entradas.count60 !== 1) ||
                      (futurePaymentsPeriod === '90' && futurePayments.entradas.count90 !== 1) ||
                      (futurePaymentsPeriod === 'total' && futurePayments.entradas.countTotal !== 1)) && 's'}
                  </span>
                  <ChevronRight className="h-6 w-6 text-white" />
                </div>
              </div>
            </button>
          </div>

          {/* A Pagar (Saídas Futuras) */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 shadow-lg border-2 border-red-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-500 rounded-xl shadow-md">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-900">A Pagar</h3>
                  <p className="text-xs text-red-700">Parcelas não pagas</p>
                </div>
              </div>
              
              {/* Dropdown de Período */}
              <select
                value={futurePaymentsPeriod}
                onChange={(e) => setFuturePaymentsPeriod(e.target.value)}
                className="px-3 py-2 bg-white border-2 border-red-300 rounded-lg text-sm font-semibold text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer hover:bg-red-50 transition-all"
              >
                <option value="30">Próximos 30 dias</option>
                <option value="60">Próximos 60 dias</option>
                <option value="90">Próximos 90 dias</option>
                <option value="total">Total</option>
              </select>
            </div>

            {/* Display único baseado no período selecionado */}
            <button
              onClick={() => {
                const periodMap = {
                  '30': { items: futurePayments.saidas.items30 },
                  '60': { items: futurePayments.saidas.items60 },
                  '90': { items: futurePayments.saidas.items90 },
                  'total': { items: futurePayments.saidas.itemsTotal }
                }
                setFuturePaymentsDetails({ type: 'saidas', period: futurePaymentsPeriod, items: periodMap[futurePaymentsPeriod].items || [] })
                setShowFuturePaymentsModal(true)
              }}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 rounded-xl p-6 transition-all hover:scale-102 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs font-semibold text-white/90 mb-2">
                    {futurePaymentsPeriod === '30' && 'Próximos 30 dias'}
                    {futurePaymentsPeriod === '60' && 'Próximos 60 dias'}
                    {futurePaymentsPeriod === '90' && 'Próximos 90 dias'}
                    {futurePaymentsPeriod === 'total' && 'Total a Pagar'}
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {futurePaymentsPeriod === '30' && formatCurrency(futurePayments.saidas.next30Days)}
                    {futurePaymentsPeriod === '60' && formatCurrency(futurePayments.saidas.next60Days)}
                    {futurePaymentsPeriod === '90' && formatCurrency(futurePayments.saidas.next90Days)}
                    {futurePaymentsPeriod === 'total' && formatCurrency(futurePayments.saidas.total)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-white/90 block mb-1">
                    {futurePaymentsPeriod === '30' && futurePayments.saidas.count30}
                    {futurePaymentsPeriod === '60' && futurePayments.saidas.count60}
                    {futurePaymentsPeriod === '90' && futurePayments.saidas.count90}
                    {futurePaymentsPeriod === 'total' && futurePayments.saidas.countTotal}
                    {' '}parcela
                    {((futurePaymentsPeriod === '30' && futurePayments.saidas.count30 !== 1) ||
                      (futurePaymentsPeriod === '60' && futurePayments.saidas.count60 !== 1) ||
                      (futurePaymentsPeriod === '90' && futurePayments.saidas.count90 !== 1) ||
                      (futurePaymentsPeriod === 'total' && futurePayments.saidas.countTotal !== 1)) && 's'}
                  </span>
                  <ChevronRight className="h-6 w-6 text-white" />
                </div>
              </div>
            </button>
          </div>
        </div>


        {/* Resumo Financeiro */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-3">
              <DollarSign className="h-6 w-6" />
              Resumo Financeiro do Período
            </h2>
          </div>

          {/* Grid de valores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
            {/* Saldo Inicial */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Saldo Inicial</p>
                <div className="p-2 bg-blue-200/50 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-blue-700" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-1">{formatCurrency(stats.saldoInicial)}</h3>
              <p className="text-xs text-blue-600">Até {formatDateBR(getPeriodoDatas().inicio)}</p>
            </div>

            {/* Entradas e Saídas */}
            <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100/50">
              <div className="space-y-4">
                {/* Entradas */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Entradas</p>
                    <ArrowUpCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <h4 className="text-xl sm:text-2xl font-bold text-green-700">{formatCurrency(stats.totalEntradas)}</h4>
                </div>

                <div className="border-t border-gray-300"></div>

                {/* Saídas */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Saídas</p>
                    <ArrowDownCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <h4 className="text-xl sm:text-2xl font-bold text-red-700">{formatCurrency(stats.totalSaidas)}</h4>
                </div>

                <div className="border-t border-gray-300"></div>

                {/* Movimentação */}
                <div>
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Movimentação</p>
                  <h4 className={`text-lg sm:text-xl font-bold ${stats.saldoTotal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(stats.saldoTotal)}
                  </h4>
                </div>
              </div>
            </div>

            {/* Saldo Final */}
            <div className={`p-6 ${stats.saldoFinal >= 0 ? 'bg-gradient-to-br from-green-50 to-green-100/50' : 'bg-gradient-to-br from-red-50 to-red-100/50'}`}>
              <div className="flex items-start justify-between mb-2">
                <p className={`text-xs font-semibold uppercase tracking-wide ${stats.saldoFinal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  Saldo Final
                </p>
                <div className={`p-2 rounded-lg ${stats.saldoFinal >= 0 ? 'bg-green-200/50' : 'bg-red-200/50'}`}>
                  <DollarSign className={`h-5 w-5 ${stats.saldoFinal >= 0 ? 'text-green-700' : 'text-red-700'}`} />
                </div>
              </div>
              <h2 className={`text-3xl sm:text-4xl font-bold mb-1 ${stats.saldoFinal >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                {formatCurrency(stats.saldoFinal)}
              </h2>
              <p className={`text-xs mb-3 ${stats.saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Acumulado total
              </p>
              <div className={`text-xs px-3 py-2 rounded-lg ${stats.saldoFinal >= 0 ? 'bg-green-200/50 text-green-800' : 'bg-red-200/50 text-red-800'}`}>
                <strong>Mês atual:</strong> {formatCurrency(stats.saldoMes)}
              </div>
            </div>
          </div>

          {/* Rodapé informativo */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              <strong>Período:</strong> {formatDateBR(getPeriodoDatas().inicio)} até {formatDateBR(getPeriodoDatas().fim)}
              {periodoTipo !== 'personalizado' && ` • ${getPeriodoLabel()}`}
            </p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Gráfico de Linha - Fluxo Mensal */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg sm:rounded-xl">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Fluxo de Caixa Mensal</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Últimos {mesesGrafico} {mesesGrafico === 1 ? 'mês' : 'meses'}</p>
                </div>
              </div>
              <select
                value={mesesGrafico}
                onChange={(e) => setMesesGrafico(Number(e.target.value))}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value={3}>3 meses</option>
                <option value={6}>6 meses</option>
                <option value={12}>12 meses</option>
              </select>
            </div>
            
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="mes" 
                    stroke="#6b7280"
                    style={{ fontSize: '10px' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    style={{ fontSize: '10px' }}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="entradas" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    name="Entradas"
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="saidas" 
                    stroke="#EF4444" 
                    strokeWidth={3}
                    name="Saídas"
                    dot={{ fill: '#EF4444', strokeWidth: 2, r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="saldo" 
                    stroke="#EBA500" 
                    strokeWidth={3}
                    name="Saldo"
                    dot={{ fill: '#EBA500', strokeWidth: 2, r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de Pizza - Saídas por Categoria */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-xl">
                <PieChart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Saídas por Categoria</h3>
                <p className="text-sm text-gray-600">Top 8 categorias</p>
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartPie>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </RechartPie>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Transações Recentes */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg sm:rounded-xl">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Transações Recentes</h3>
              <p className="text-xs sm:text-sm text-gray-600">Últimas 10 movimentações</p>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {recentTransactions.map((transaction, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors gap-2 sm:gap-0"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${
                    transaction.tipo === 'entrada' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.tipo === 'entrada' ? (
                      <ArrowUpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    ) : (
                      <ArrowDownCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base text-gray-900 truncate">{transaction.descricao || 'Sem descrição'}</p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                      <p className="text-xs text-gray-500 truncate">{transaction.categoriaNome || 'Sem categoria'}</p>
                      <span className="text-xs text-gray-400 flex-shrink-0">•</span>
                      <p className="text-xs text-gray-500 flex-shrink-0">
                        {(() => {
                          const [year, month, day] = transaction.vencimento.split('-')
                          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                          return date.toLocaleDateString('pt-BR')
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className={`text-base sm:text-lg font-bold ml-auto sm:ml-0 ${
                  transaction.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.tipo === 'entrada' ? '+' : '-'} {formatCurrency(transaction.valor)}
                </div>
              </div>
            ))}

            {recentTransactions.length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-gray-600">Nenhuma transação registrada</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Histórico de Relatórios */}
      {showHistoricoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-primary-100 rounded-lg">
                  <History className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-bold text-gray-900">Histórico de Relatórios</h2>
                  <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Últimos relatórios gerados</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoricoModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)] sm:max-h-[60vh]">
              {historicoRelatorios.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Nenhum relatório gerado ainda</p>
                  <p className="text-sm text-gray-500 mt-2">Os relatórios exportados aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {historicoRelatorios.map((relatorio) => (
                    <div
                      key={relatorio.id}
                      className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                        <div className="flex-1 w-full">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600" />
                            <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{relatorio.empresa_nome}</h3>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                            <div>
                              <span className="text-gray-600">Período:</span>
                              <p className="font-medium text-gray-900 text-xs sm:text-sm">{getPeriodoLabel(relatorio.periodo_tipo)}</p>
                              <p className="text-[10px] sm:text-xs text-gray-500">
                                {formatDateBR(relatorio.periodo_inicio)} até {formatDateBR(relatorio.periodo_fim)}
                              </p>
                            </div>
                            
                            <div>
                              <span className="text-gray-600">Gerado em:</span>
                              <p className="font-medium text-gray-900 text-xs sm:text-sm">
                                {new Date(relatorio.created_at).toLocaleDateString('pt-BR')}
                              </p>
                              <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                                {new Date(relatorio.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} por {relatorio.usuario_nome}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200">
                            <div className="text-center">
                              <p className="text-[10px] sm:text-xs text-gray-600">Entradas</p>
                              <p className="font-semibold text-xs sm:text-sm text-green-600">{relatorio.quantidade_entradas}</p>
                              <p className="text-[10px] sm:text-xs text-gray-900 truncate">{formatCurrency(relatorio.total_entradas)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] sm:text-xs text-gray-600">Saídas</p>
                              <p className="font-semibold text-xs sm:text-sm text-red-600">{relatorio.quantidade_saidas}</p>
                              <p className="text-[10px] sm:text-xs text-gray-900 truncate">{formatCurrency(relatorio.total_saidas)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] sm:text-xs text-gray-600">Saldo</p>
                              <p className={`font-semibold text-xs sm:text-sm ${
                                relatorio.saldo_total >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(relatorio.saldo_total)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => {
                              // Recriar e reabrir o relatório
                              setDataInicio(relatorio.periodo_inicio)
                              setDataFim(relatorio.periodo_fim)
                              setPeriodoTipo('personalizado')
                              
                              setTimeout(() => {
                                exportarRelatorio()
                              }, 500)
                            }}
                            className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors flex-1 sm:flex-none"
                            title="Reabrir relatório"
                          >
                            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Deseja realmente excluir este relatório do histórico?')) {
                                const { error } = await supabase
                                  .from('dfc_relatorios_historico')
                                  .delete()
                                  .eq('id', relatorio.id)
                                
                                if (!error) {
                                  loadHistoricoRelatorios()
                                }
                              }
                            }}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex-1 sm:flex-none"
                            title="Excluir relatório"
                          >
                            <X className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            {historicoRelatorios.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
                <p className="text-xs text-gray-600">
                  Total de relatórios: {historicoRelatorios.length}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Detalhes dos Pagamentos Futuros */}
      {showFuturePaymentsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header do Modal */}
            <div className={`px-6 py-4 ${futurePaymentsDetails.type === 'entradas' ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-red-600 to-red-700'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {futurePaymentsDetails.type === 'entradas' ? (
                    <TrendingUp className="h-6 w-6 text-white" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-white" />
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {futurePaymentsDetails.type === 'entradas' ? 'A Receber' : 'A Pagar'} - 
                      {futurePaymentsDetails.period === '30' ? ' Próximos 30 dias' : 
                       futurePaymentsDetails.period === '90' ? ' Próximos 90 dias' : 
                       ' Total Futuro'}
                    </h2>
                    <p className="text-sm text-white/80">
                      {futurePaymentsDetails.items.length} parcela{futurePaymentsDetails.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFuturePaymentsModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Lista de Parcelas */}
            <div className="flex-1 overflow-y-auto p-6">
              {futurePaymentsDetails.items.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhuma parcela encontrada para este período</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {futurePaymentsDetails.items.map((item, index) => (
                    <div
                      key={item.id || index}
                      className={`p-4 rounded-xl border-2 ${
                        futurePaymentsDetails.type === 'entradas' 
                          ? 'bg-green-50 border-green-200 hover:border-green-300' 
                          : 'bg-red-50 border-red-200 hover:border-red-300'
                      } transition-all hover:shadow-md`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate mb-1">
                            {item.descricao}
                          </h4>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDateBR(item.data_vencimento || item.vencimento)}</span>
                            </div>
                            {item.parcela_numero && (
                              <span className="px-2 py-0.5 bg-white rounded-md text-xs font-medium">
                                Parcela {item.parcela_numero}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${
                            futurePaymentsDetails.type === 'entradas' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {formatCurrency(item.valor)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            {futurePaymentsDetails.items.length > 0 && (
              <div className={`p-4 border-t ${
                futurePaymentsDetails.type === 'entradas' 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">
                    Total de {futurePaymentsDetails.items.length} parcela{futurePaymentsDetails.items.length !== 1 ? 's' : ''}
                  </p>
                  <p className={`text-2xl font-bold ${
                    futurePaymentsDetails.type === 'entradas' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {formatCurrency(futurePaymentsDetails.items.reduce((sum, item) => sum + (item.valor || 0), 0))}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de exportação */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-1">Exportar DFC</h2>
              <p className="text-sm text-gray-500 mb-5">Escolha o ano e o formato de exportação.</p>

              <label className="block text-sm font-medium text-gray-700 mb-2">Ano</label>
              <div className="flex items-center gap-3 mb-5">
                <button
                  onClick={() => setExportYear(y => y - 1)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-lg transition-colors"
                >
                  ‹
                </button>
                <span className="flex-1 text-center text-2xl font-bold text-gray-900">{exportYear}</span>
                <button
                  onClick={() => setExportYear(y => y + 1)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-lg transition-colors"
                >
                  ›
                </button>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">Formato</label>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {[
                  { id: 'excel', label: 'Excel', icon: '📊', desc: '.xlsx' },
                  { id: 'csv',   label: 'CSV',   icon: '📄', desc: '.csv' },
                  { id: 'pdf',   label: 'PDF A4', icon: '🖨️', desc: 'paisagem' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setExportFormat(f.id)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors text-sm ${
                      exportFormat === f.id
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-400 text-gray-600'
                    }`}
                  >
                    <span className="text-xl">{f.icon}</span>
                    <span className="font-semibold">{f.label}</span>
                    <span className="text-xs text-gray-400">{f.desc}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowExportModal(false)
                    const y = String(exportYear)
                    if (exportFormat === 'excel') exportarExcel(y)
                    else if (exportFormat === 'csv') exportarCSV(y)
                    else if (exportFormat === 'pdf') exportarPDF(y)
                  }}
                  className="flex-1 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
                >
                  Exportar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
