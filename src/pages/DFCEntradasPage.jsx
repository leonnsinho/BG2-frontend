import React, { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import SuperAdminBanner from '../components/SuperAdminBanner'
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  X,
  Save,
  Building2,
  FileText,
  ChevronDown,
  Upload,
  Paperclip,
  File,
  Eye,
  Check,
  ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '../components/ui/ConfirmModal'

function DFCEntradasPage() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const [entradas, setEntradas] = useState([])
  const [companies, setCompanies] = useState([])
  const [companyAvatars, setCompanyAvatars] = useState({})
  const [categorias, setCategorias] = useState([])
  const [itensDB, setItensDB] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  
  // Estados para documentos
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [documentos, setDocumentos] = useState([])
  const [showDocumentosModal, setShowDocumentosModal] = useState(false)
  const [selectedEntradaDocumentos, setSelectedEntradaDocumentos] = useState(null)
  
  // Estados para parcelas
  const [showParcelasModal, setShowParcelasModal] = useState(false)
  const [parcelas, setParcelas] = useState([])
  const [selectedEntradaParcelas, setSelectedEntradaParcelas] = useState(null)
  const [editingParcelaId, setEditingParcelaId] = useState(null)
  const [editingVencimento, setEditingVencimento] = useState('')
  const [editingValor, setEditingValor] = useState('')
  const [editingField, setEditingField] = useState(null) // 'vencimento' ou 'valor'
  
  // Filtros - Inicializar companyFilter com valor da URL se existir
  const initialCompanyFilter = searchParams.get('company') || searchParams.get('companyId') || 'all'
  const [searchTerm, setSearchTerm] = useState('')
  const [companyFilter, setCompanyFilter] = useState(initialCompanyFilter)
  const [categoriaFilter, setCategoriaFilter] = useState('all')
  const [mesFilter, setMesFilter] = useState('all')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [initialized, setInitialized] = useState(false)
  
  // Busca de empresa no formulário
  const [companySearch, setCompanySearch] = useState('')
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)

  // Importação de arquivos
  const [showImportModal, setShowImportModal] = useState(false)
  const [importRows, setImportRows] = useState([])       // linhas parseadas
  const [importErrors, setImportErrors] = useState([])  // erros por linha
  const [importSaving, setImportSaving] = useState(false)
  const [importCompanyId, setImportCompanyId] = useState('')
  const [importItensDB, setImportItensDB] = useState([])

  // Sistema de parcelamento
  const [isParcelado, setIsParcelado] = useState(false)
  const [numeroParcelas, setNumeroParcelas] = useState(1)
  const [parcelasDatas, setParcelasDatas] = useState([])

  // Formulário
  const [formData, setFormData] = useState({
    company_id: '',
    categoria: '',
    item_id: '',
    descricao: '',
    valor: '',
    moeda: 'BRL',
    mes: '',
    vencimento: ''
  })

  // Lista de moedas suportadas
  const moedas = [
    { code: 'BRL', symbol: 'R$', name: 'Real Brasileiro' },
    { code: 'USD', symbol: '$', name: 'Dólar Americano' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'Libra Esterlina' },
    { code: 'JPY', symbol: '¥', name: 'Iene Japonês' },
    { code: 'CAD', symbol: 'C$', name: 'Dólar Canadense' },
    { code: 'AUD', symbol: 'A$', name: 'Dólar Australiano' },
    { code: 'CHF', symbol: 'CHF', name: 'Franco Suíço' },
    { code: 'CNY', symbol: '¥', name: 'Yuan Chinês' }
  ]

  const getMoedaAtual = () => {
    console.log('🔍 FormData.moeda:', formData.moeda)
    console.log('💰 Moedas disponíveis:', moedas.length)
    return moedas.find(m => m.code === formData.moeda) || moedas[0]
  }

  // ─── Parser de importação ───────────────────────────────────────────────────
  const parseOfx = (text) => {
    const rows = []
    const stmtTrnRegex = /<STMTTRN>(.*?)<\/STMTTRN>/gis
    const sgmlTrnRegex = /<STMTTRN>(\n|.)*?(?=<STMTTRN>|<\/BANKTRANLIST>)/gi
    // OFX moderno (XML-like com fechamento de tags)
    let match
    const modernMatches = [...text.matchAll(stmtTrnRegex)]
    if (modernMatches.length > 0) {
      modernMatches.forEach(m => {
        const block = m[1]
        const get = (tag) => { const r = new RegExp(`<${tag}>([^<]*)`, 'i'); const v = block.match(r); return v ? v[1].trim() : '' }
        const dtRaw = get('DTPOSTED') || get('DTUSER')
        const date = dtRaw ? `${dtRaw.substring(0,4)}-${dtRaw.substring(4,6)}-${dtRaw.substring(6,8)}` : ''
        const trnamt = parseFloat(get('TRNAMT').replace(',', '.')) || 0
        if (trnamt <= 0) return // entradas: apenas positivos
        rows.push({ descricao: get('MEMO') || get('NAME') || '', valor: Math.abs(trnamt).toFixed(2), vencimento: date, mes: date ? date.substring(0, 7) : '', categoria: '', item_id: '' })
      })
    } else {
      // SGML OFX legado (sem fechamento de tags)
      const lines = text.split(/\n/)
      let inTrn = false; let cur = {}
      lines.forEach(line => {
        line = line.trim()
        if (line === '<STMTTRN>') { inTrn = true; cur = {} }
        else if (line === '</STMTTRN>') {
          if (inTrn && cur.valor > 0) rows.push(cur)
          inTrn = false; cur = {}
        } else if (inTrn) {
          const m2 = line.match(/^<([^>]+)>(.+)$/)
          if (m2) {
            const [, tag, val] = m2
            if (tag === 'DTPOSTED' || tag === 'DTUSER') { const d = val.trim(); cur.vencimento = `${d.substring(0,4)}-${d.substring(4,6)}-${d.substring(6,8)}`; cur.mes = cur.vencimento.substring(0,7) }
            if (tag === 'TRNAMT') { const v = parseFloat(val.trim().replace(',', '.')); cur.valor = Math.abs(v).toFixed(2); cur._sign = v }
            if (tag === 'MEMO' || tag === 'NAME') cur.descricao = cur.descricao || val.trim()
          }
        }
      })
    }
    return rows
  }

  // Interpreta valor em formato brasileiro (1.499,00) ou americano (1,499.00)
  const parseAmount = (raw) => {
    if (!raw) return 0
    let s = raw.replace(/[^\d.,\-]/g, '').trim()
    if (!s) return 0
    const lastDot = s.lastIndexOf('.')
    const lastComma = s.lastIndexOf(',')
    if (lastDot > -1 && lastComma > -1) {
      if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.')  // BR: 1.499,00
      else s = s.replace(/,/g, '')                                          // US: 1,499.00
    } else if (lastComma > -1) {
      s = s.replace(',', '.')  // somente vírgula: trata como decimal
    }
    return parseFloat(s) || 0
  }

  // Normaliza string: minúsculas + remove acentos + remove aspas
  const norm = (s) => s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/["']/g, '')

  // Parseia data em vários formatos comuns
  const parseDate = (raw) => {
    if (!raw) return ''
    const s = raw.trim()
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) { const [d,mo,y] = s.split('/'); return `${y}-${mo}-${d}` }
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) { const [d,mo,y] = s.split('-'); return `${y}-${mo}-${d}` }
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10)
    if (/^\d{2}\/\d{2}\/\d{2}$/.test(s)) { const [d,mo,y] = s.split('/'); return `20${y}-${mo}-${d}` }
    return ''
  }

  const parseCsv = (text) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) return []
    // Detecta delimitador dominante na primeira linha
    const firstLine = lines[0]
    const delim = (firstLine.split(';').length >= firstLine.split(',').length) ? ';' : ','
    const splitLine = (l) => l.split(delim).map(c => c.trim().replace(/^["']|["']$/g, ''))
    const headers = splitLine(firstLine).map(h => norm(h))
    const idx = (names) => { for (const n of names) { const i = headers.findIndex(h => h === n || h.includes(n)); if (i > -1) return i } return -1 }
    const iDesc = idx(['descricao','historico','description','memo','nome','name','lancamento'])
    const iVal  = idx(['valor','value','amount','debito','credito','vlr'])
    const iDate = idx(['data','date','vencimento','dtposted','data_lancamento','lancamento'])
    const iCat  = idx(['categoria','category','cat'])
    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const cols = splitLine(lines[i])
      if (cols.length < 2) continue
      const valRaw = iVal >= 0 ? cols[iVal] : cols[cols.length - 1]  // fallback: última coluna
      const val = parseAmount(valRaw)
      if (val <= 0) continue
      const dateRaw = iDate >= 0 ? cols[iDate] : ''
      const date = parseDate(dateRaw)
      const descRaw = iDesc >= 0 ? cols[iDesc] : (cols[1] || '')  // fallback: segunda coluna
      rows.push({ descricao: descRaw, valor: Math.abs(val).toFixed(2), vencimento: date, mes: date ? date.substring(0,7) : '', categoria: iCat >= 0 ? cols[iCat] : '', item_id: '' })
    }
    return rows
  }

  const parseXml = (text) => {
    const rows = []
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'text/xml')
      // Tenta tags genéricas: <transaction>, <lancamento>, <entry>, <item>, <STMTTRN>
      const nodes = doc.querySelectorAll('transaction, lancamento, entry, item, STMTTRN, row')
      nodes.forEach(node => {
        const get = (...tags) => { for (const t of tags) { const el = node.querySelector(t); if (el?.textContent) return el.textContent.trim() } return '' }
        const valRaw = get('valor','value','amount','TRNAMT','credito')
        const val = parseFloat(valRaw.replace(',', '.')) || 0
        if (val <= 0) return
        const dateRaw = get('data','date','vencimento','DTPOSTED','dtposted')
        let date = ''
        if (/\d{2}\/\d{2}\/\d{4}/.test(dateRaw)) { const [d,mo,y] = dateRaw.split('/'); date = `${y}-${mo}-${d}` }
        else if (/\d{8}/.test(dateRaw)) { date = `${dateRaw.substring(0,4)}-${dateRaw.substring(4,6)}-${dateRaw.substring(6,8)}` }
        else if (/\d{4}-\d{2}-\d{2}/.test(dateRaw)) { date = dateRaw.substring(0,10) }
        rows.push({ descricao: get('descricao','description','memo','MEMO','NAME','historico'), valor: Math.abs(val).toFixed(2), vencimento: date, mes: date ? date.substring(0,7) : '', categoria: get('categoria','category'), item_id: '' })
      })
    } catch(e) { /* parse error */ }
    return rows
  }

  const handleImportFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    const ext = file.name.split('.').pop().toLowerCase()
    const reader = new FileReader()
    reader.onload = (ev) => {
      const buffer = ev.target.result
      // Tenta UTF-8; se tiver caracteres inválidos (\uFFFD), usa ISO-8859-1
      let text = new TextDecoder('utf-8').decode(buffer)
      if (text.includes('\uFFFD')) text = new TextDecoder('iso-8859-1').decode(buffer)
      let rows = []
      if (ext === 'ofx' || ext === 'ofc') rows = parseOfx(text)
      else if (ext === 'csv') rows = parseCsv(text)
      else if (ext === 'xml') rows = parseXml(text)
      else { toast.error('Formato não suportado. Use CSV, XML ou OFX.'); return }
      if (rows.length === 0) { toast.error('Nenhum registro encontrado no arquivo.'); return }
      // Set default company
      const defaultCompany = getCurrentUserCompany() || (companies[0]?.id || '')
      setImportCompanyId(defaultCompany)
      setImportRows(rows.map(r => ({ ...r, company_id: defaultCompany })))
      setImportErrors([])
      setShowImportModal(true)
    }
    reader.readAsArrayBuffer(file)
  }

  const handleSaveImport = async () => {
    // Validate
    const errs = importRows.map((r, i) => {
      const e = []
      if (!r.company_id) e.push('Empresa obrigatória')
      if (!r.descricao?.trim()) e.push('Descrição obrigatória')
      if (!r.valor || isNaN(parseFloat(r.valor))) e.push('Valor inválido')
      if (!r.vencimento) e.push('Data obrigatória')
      return e
    })
    setImportErrors(errs)
    if (errs.some(e => e.length > 0)) { toast.error('Corrija os erros antes de importar.'); return }
    setImportSaving(true)
    try {
      const records = importRows.map(r => ({
        company_id: r.company_id,
        categoria: r.categoria || null,
        item_id: r.item_id || null,
        descricao: r.descricao.trim(),
        valor: parseFloat(r.valor),
        moeda: 'BRL',
        mes: r.mes ? r.mes + '-01' : r.vencimento,
        vencimento: r.vencimento,
        created_by: profile.id
      }))
      const { error } = await supabase.from('dfc_entradas').insert(records)
      if (error) throw error
      toast.success(`${records.length} entrada(s) importada(s) com sucesso!`)
      setShowImportModal(false)
      setImportRows([])
      fetchEntradas()
    } catch (err) {
      toast.error('Erro ao importar: ' + err.message)
    } finally {
      setImportSaving(false)
    }
  }
  // ─────────────────────────────────────────────────────────────────────────────

  const isSuperAdmin = () => profile?.role === 'super_admin'
  const isCompanyAdmin = () => {
    return profile?.user_companies?.some(uc => uc.role === 'company_admin' && uc.is_active) || false
  }
  const isGestor = () => {
    return profile?.user_companies?.some(uc => uc.role === 'gestor' && uc.is_active) || false
  }
  const isAuthorized = () => isSuperAdmin() || isCompanyAdmin() || isGestor()
  
  // Obter empresa do company admin
  const getCompanyAdminCompany = () => {
    if (!isCompanyAdmin()) return null
    const adminCompany = profile?.user_companies?.find(uc => uc.role === 'company_admin' && uc.is_active)
    return adminCompany?.company_id || null
  }

  // Obter empresa do gestor
  const getGestorCompany = () => {
    if (!isGestor()) return null
    const gestorCompany = profile?.user_companies?.find(uc => uc.role === 'gestor' && uc.is_active)
    return gestorCompany?.company_id || null
  }

  // Obter empresa atual (company_admin ou gestor)
  const getCurrentUserCompany = () => {
    return getCompanyAdminCompany() || getGestorCompany()
  }

  useEffect(() => {
    console.log('Profile:', profile)
    console.log('Is Authorized:', isAuthorized())
    fetchCompanies()
    fetchCategoriasEItens()
    
    // Sincronizar companyFilter com a URL quando mudar
    const companyFromUrl = searchParams.get('company') || searchParams.get('companyId')
    if (companyFromUrl && companyFromUrl !== companyFilter) {
      setCompanyFilter(companyFromUrl)
    } else if (!companyFromUrl) {
      // Se não há company na URL, verificar se é company admin ou gestor e auto-selecionar sua empresa
      const userCompanyId = getCurrentUserCompany()
      if (userCompanyId && companyFilter === 'all') {
        setCompanyFilter(userCompanyId)
      }
    }
    
    // Marcar como inicializado quando profile carregar
    if (profile) {
      setInitialized(true)
    }
  }, [profile, searchParams])

  useEffect(() => {
    // Só buscar se já inicializou e o profile estiver carregado
    if (initialized && profile) {
      fetchEntradas()
    }
  }, [companyFilter, categoriaFilter, initialized, profile])

  // Ler período personalizado dos query params (vindo do DFC Dashboard)
  useEffect(() => {
    const dataInicioParam = searchParams.get('dataInicio')
    const dataFimParam = searchParams.get('dataFim')
    
    if (dataInicioParam && dataFimParam) {
      setDataInicio(dataInicioParam)
      setDataFim(dataFimParam)
    }
  }, [searchParams])

  // Carregar itens quando a empresa for selecionada
  useEffect(() => {
    const loadItensEmpresa = async () => {
      if (!formData.company_id) {
        setItensDB([])
        return
      }

      try {
        // Buscar IDs dos itens associados à empresa selecionada
        const { data: itensEmpresaIds } = await supabase
          .from('dfc_itens_empresas')
          .select('item_id')
          .eq('company_id', formData.company_id)
        
        const idsEmpresa = new Set(itensEmpresaIds?.map(ie => ie.item_id) || [])
        
        // Buscar TODOS os IDs de itens que têm associações (qualquer empresa)
        // Usando RPC function que ignora RLS
        const { data: todosItensAssociados, error: errorRpc } = await supabase
          .rpc('get_itens_com_associacoes')
        
        let idsTodosAssociados = new Set()
        if (!errorRpc && todosItensAssociados) {
          idsTodosAssociados = new Set(todosItensAssociados.map(r => r.item_id))
        } else if (errorRpc) {
          console.error('⚠️ AVISO: Não foi possível buscar IDs de itens com associações:', errorRpc)
          console.log('💡 Execute o SQL: sql/create_rpc_get_itens_com_associacoes.sql no Supabase')
        }
        
        // Buscar todos os itens
        const { data: todosItens } = await supabase
          .from('dfc_itens')
          .select('*')
          .order('nome')
        
        // Filtrar: apenas itens da empresa OU itens que não estão associados a nenhuma empresa (globais)
        const itensFiltrados = todosItens?.filter(item => 
          idsEmpresa.has(item.id) || !idsTodosAssociados.has(item.id)
        ) || []
        
        console.log(`📋 DFC ENTRADAS - Itens carregados: ${itensFiltrados.length} (empresa: ${idsEmpresa.size}, globais: ${itensFiltrados.length - idsEmpresa.size})`)
        
        setItensDB(itensFiltrados)
      } catch (error) {
        console.error('Erro ao carregar itens:', error)
        setItensDB([])
      }
    }

    loadItensEmpresa()
  }, [formData.company_id])

  // Carregar itens para o modal de importação quando a empresa mudar
  useEffect(() => {
    const loadImportItens = async () => {
      if (!importCompanyId) {
        setImportItensDB([])
        return
      }
      try {
        const { data: itensEmpresaIds } = await supabase
          .from('dfc_itens_empresas')
          .select('item_id')
          .eq('company_id', importCompanyId)
        const idsEmpresa = new Set(itensEmpresaIds?.map(ie => ie.item_id) || [])
        const { data: todosItensAssociados } = await supabase.rpc('get_itens_com_associacoes')
        const idsTodosAssociados = new Set(todosItensAssociados?.map(r => r.item_id) || [])
        const { data: todosItens } = await supabase.from('dfc_itens').select('*').order('nome')
        const filtrados = todosItens?.filter(item =>
          idsEmpresa.has(item.id) || !idsTodosAssociados.has(item.id)
        ) || []
        setImportItensDB(filtrados)
      } catch (e) {
        setImportItensDB([])
      }
    }
    loadImportItens()
  }, [importCompanyId])

  // Gerar automaticamente as datas das parcelas quando houver mudanças
  useEffect(() => {
    if (isParcelado && formData.vencimento && numeroParcelas >= 2) {
      const dataVencimentoBase = new Date(formData.vencimento + 'T00:00:00')
      const novasDatas = []
      
      for (let i = 0; i < numeroParcelas; i++) {
        const vencimentoParcela = new Date(dataVencimentoBase)
        vencimentoParcela.setMonth(vencimentoParcela.getMonth() + i)
        novasDatas.push(vencimentoParcela.toISOString().substring(0, 10))
      }
      
      setParcelasDatas(novasDatas)
    } else {
      setParcelasDatas([])
    }
  }, [isParcelado, formData.vencimento, numeroParcelas])

  const fetchCategoriasEItens = async () => {
    try {
      // Buscar categorias de entrada (receitas)
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('dfc_categorias')
        .select('*')
        .eq('tipo', 'entrada')
        .order('nome')

      if (categoriasError) throw categoriasError

      // Buscar todos os itens
      const { data: itensData, error: itensError } = await supabase
        .from('dfc_itens')
        .select('*')
        .order('nome')

      if (itensError) throw itensError

      // Se for company_admin ou gestor, filtrar itens na carga inicial
      let itensFiltrados = itensData || []
      const userCompanyId = getCurrentUserCompany()
      
      if ((isCompanyAdmin() || isGestor()) && !isSuperAdmin() && userCompanyId) {
        // Buscar IDs de itens associados à empresa do usuário
        const { data: itensEmpresaIds } = await supabase
          .from('dfc_itens_empresas')
          .select('item_id')
          .eq('company_id', userCompanyId)
        
        const idsEmpresa = new Set(itensEmpresaIds?.map(ie => ie.item_id) || [])
        
        // Buscar TODOS os IDs de itens com associações (RPC ignora RLS)
        const { data: todosItensAssociados, error: errorRpc } = await supabase
          .rpc('get_itens_com_associacoes')
        
        let idsTodosAssociados = new Set()
        if (!errorRpc && todosItensAssociados) {
          idsTodosAssociados = new Set(todosItensAssociados.map(r => r.item_id))
        }
        
        // Filtrar: itens da empresa OU itens globais (sem associações)
        itensFiltrados = itensData?.filter(item => 
          idsEmpresa.has(item.id) || !idsTodosAssociados.has(item.id)
        ) || []
        
        console.log(`📋 DFC ENTRADAS CARGA INICIAL - Itens filtrados: ${itensFiltrados.length} de ${itensData?.length || 0}`)
      }

      setCategorias(categoriasData || [])
      setItensDB(itensFiltrados)
    } catch (error) {
      console.error('Erro ao buscar categorias e itens:', error)
      toast.error('Erro ao carregar categorias e itens')
    }
  }

  const fetchCompanies = async () => {
    try {
      // Se for gestor ou company admin, buscar apenas sua empresa
      const userCompanyId = getCurrentUserCompany()
      
      let query = supabase
        .from('companies')
        .select('id, name, logo_url')
        .order('name')
      
      // Filtrar por empresa se não for super admin
      if (userCompanyId) {
        query = query.eq('id', userCompanyId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro na query de empresas:', error)
        throw error
      }
      
      console.log('Empresas carregadas:', data)
      setCompanies(data || [])
      
      // Carregar avatars das empresas
      if (data && data.length > 0) {
        loadCompanyAvatars(data)
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
      toast.error('Erro ao carregar empresas')
    }
  }

  const loadCompanyAvatars = async (companiesList) => {
    const avatarUrls = {}
    
    for (const company of companiesList) {
      if (company.logo_url) {
        try {
          // Usar createSignedUrl para garantir acesso mesmo se bucket não for público
          const { data, error } = await supabase.storage
            .from('company-avatars')
            .createSignedUrl(company.logo_url, 3600) // URL válida por 1 hora
          
          if (error) {
            console.error(`Erro ao criar signed URL para ${company.name}:`, error)
            continue
          }
          
          console.log(`Logo URL para ${company.name}:`, data?.signedUrl)
          
          if (data?.signedUrl) {
            avatarUrls[company.id] = data.signedUrl
          }
        } catch (error) {
          console.error(`Erro ao carregar logo de ${company.name}:`, error)
        }
      } else {
        console.log(`Empresa ${company.name} não tem logo_url`)
      }
    }
    
    console.log('Company Avatars carregados:', avatarUrls)
    setCompanyAvatars(avatarUrls)
  }

  const fetchEntradas = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('dfc_entradas')
        .select(`
          *,
          companies (
            id,
            name,
            logo_url
          ),
          dfc_itens (
            id,
            nome
          ),
          dfc_entradas_documentos (count)
        `)
        .is('lancamento_pai_id', null) // Apenas lançamentos principais (não parcelas filhas)
        .order('vencimento', { ascending: false })

      if (companyFilter !== 'all') {
        query = query.eq('company_id', companyFilter)
      }

      if (categoriaFilter !== 'all') {
        query = query.eq('categoria', categoriaFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setEntradas(data || [])
    } catch (error) {
      console.error('Erro ao buscar entradas:', error)
      toast.error('Erro ao carregar entradas')
    } finally {
      setLoading(false)
    }
  }

  const fetchDocumentos = async (entradaId) => {
    try {
      const { data, error } = await supabase
        .from('dfc_entradas_documentos')
        .select('*')
        .eq('entrada_id', entradaId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar documentos:', error)
      return []
    }
  }

  const fetchParcelas = async (entradaId) => {
    try {
      const { data, error } = await supabase
        .from('dfc_entradas')
        .select('*')
        .eq('lancamento_pai_id', entradaId)
        .order('parcela_numero', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar parcelas:', error)
      toast.error('Erro ao carregar parcelas')
      return []
    }
  }

  const openParcelasModal = async (entrada) => {
    if (!entrada.is_parcelado) return
    
    setSelectedEntradaParcelas(entrada)
    const parcelasData = await fetchParcelas(entrada.id)
    setParcelas(parcelasData)
    setShowParcelasModal(true)
  }

  const closeParcelasModal = () => {
    setShowParcelasModal(false)
    setSelectedEntradaParcelas(null)
    setParcelas([])
    setEditingParcelaId(null)
    setEditingVencimento('')
    setEditingValor('')
    setEditingField(null)
  }

  const handleEditParcela = (parcela) => {
    setEditingParcelaId(parcela.id)
    setEditingVencimento(parcela.vencimento)
    setEditingValor(parcela.valor.toString())
  }

  const handleSaveParcela = async (parcelaId) => {
    try {
      const valorNumerico = parseFloat(editingValor)
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        toast.error('Digite um valor válido')
        return
      }

      if (!editingVencimento) {
        toast.error('Selecione uma data de vencimento')
        return
      }

      // Atualizar o valor e vencimento da parcela
      const { error } = await supabase
        .from('dfc_entradas')
        .update({ 
          valor: valorNumerico,
          vencimento: editingVencimento 
        })
        .eq('id', parcelaId)

      if (error) throw error

      // Recarregar parcelas
      const parcelasData = await fetchParcelas(selectedEntradaParcelas.id)
      
      // Calcular novo valor total somando todas as parcelas
      const valorTotal = parcelasData.reduce((sum, p) => sum + parseFloat(p.valor), 0)
      
      // Atualizar o lançamento pai no banco de dados
      const { error: updatePaiError } = await supabase
        .from('dfc_entradas')
        .update({ valor: valorTotal })
        .eq('id', selectedEntradaParcelas.id)
      
      if (updatePaiError) throw updatePaiError
      
      setParcelas(parcelasData)
      setSelectedEntradaParcelas({
        ...selectedEntradaParcelas,
        valor: valorTotal
      })
      
      // Recarregar lista de entradas para atualizar estatísticas
      await fetchEntradas()
      
      toast.success('Parcela atualizada!')
      
      setEditingParcelaId(null)
      setEditingVencimento('')
      setEditingValor('')
      setEditingField(null)
    } catch (error) {
      console.error('Erro ao atualizar parcela:', error)
      toast.error('Erro ao atualizar parcela')
    }
  }

  const handleCancelEdit = () => {
    setEditingParcelaId(null)
    setEditingVencimento('')
    setEditingValor('')
    setEditingField(null)
  }

  const openModal = async (entrada = null) => {
    if (entrada) {
      setEditingId(entrada.id)
      setFormData({
        company_id: entrada.company_id,
        categoria: entrada.categoria,
        item_id: entrada.item_id,
        descricao: entrada.descricao,
        valor: entrada.valor,
        moeda: entrada.moeda || 'BRL',
        mes: entrada.mes.substring(0, 7), // Converter YYYY-MM-DD para YYYY-MM
        vencimento: entrada.vencimento
      })
      // Buscar documentos da entrada
      const docs = await fetchDocumentos(entrada.id)
      setDocumentos(docs)
      
      // Se for lançamento parcelado, buscar as parcelas
      if (entrada.is_parcelado) {
        setIsParcelado(true)
        setNumeroParcelas(entrada.numero_parcelas)
        const parcelasData = await fetchParcelas(entrada.id)
        setParcelas(parcelasData)
      }
    } else {
      setEditingId(null)
      const companyAdminId = getCompanyAdminCompany()
      setFormData({
        company_id: companyAdminId || (companies.length === 1 ? companies[0].id : ''),
        categoria: '',
        item_id: '',
        descricao: '',
        valor: '',
        moeda: 'BRL',
        mes: '',
        vencimento: ''
      })
      setDocumentos([])
      setUploadedFiles([])
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setCompanySearch('')
    setShowCompanyDropdown(false)
    setUploadedFiles([])
    setDocumentos([])
    setIsParcelado(false)
    setNumeroParcelas(1)
    setParcelasDatas([])
    setParcelas([])
    setFormData({
      company_id: '',
      categoria: '',
      item_id: '',
      descricao: '',
      valor: '',
      moeda: 'BRL',
      mes: '',
      vencimento: ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validações
    if (!formData.company_id) {
      toast.error('Selecione uma empresa')
      return
    }
    if (!formData.categoria || !formData.item_id) {
      toast.error('Selecione uma categoria e um item')
      return
    }
    if (!formData.descricao || !formData.valor || !formData.mes || !formData.vencimento) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    if (isParcelado && numeroParcelas < 2) {
      toast.error('Para lançamento parcelado, informe pelo menos 2 parcelas')
      return
    }

    try {
      // EDIÇÃO de lançamento
      if (editingId) {
        const dataToSave = {
          ...formData,
          valor: parseFloat(formData.valor),
          mes: formData.mes + '-01',
          created_by: profile.id
        }

        // Atualizar lançamento pai
        const { error } = await supabase
          .from('dfc_entradas')
          .update(dataToSave)
          .eq('id', editingId)

        if (error) throw error

        // Se for parcelado, atualizar todas as parcelas filhas
        if (isParcelado && parcelas.length > 0) {
          const valorTotal = parseFloat(formData.valor)
          const valorParcela = valorTotal / numeroParcelas
          const dataVencimentoBase = new Date(formData.vencimento + 'T00:00:00')
          const mesBase = new Date(formData.mes + '-01T00:00:00')

          // Atualizar cada parcela
          for (let i = 0; i < parcelas.length; i++) {
            const parcela = parcelas[i]
            const vencimentoParcela = new Date(dataVencimentoBase)
            vencimentoParcela.setMonth(vencimentoParcela.getMonth() + i)
            
            const mesParcela = new Date(mesBase)
            mesParcela.setMonth(mesParcela.getMonth() + i)

            const { error: errorParcela } = await supabase
              .from('dfc_entradas')
              .update({
                categoria: formData.categoria,
                item_id: formData.item_id,
                descricao: `${formData.descricao} - Parcela ${i + 1}/${numeroParcelas}`,
                valor: valorParcela,
                moeda: formData.moeda,
                mes: mesParcela.toISOString().substring(0, 10),
                vencimento: vencimentoParcela.toISOString().substring(0, 10)
              })
              .eq('id', parcela.id)

            if (errorParcela) throw errorParcela
          }
          toast.success('Lançamento parcelado atualizado com sucesso!')
        } else {
          toast.success('Entrada atualizada com sucesso!')
        }

        // Upload de documentos
        if (uploadedFiles.length > 0) {
          await uploadDocumentos(editingId)
        }
      }
      // CRIAÇÃO de lançamento simples
      else if (!isParcelado) {
        const dataToSave = {
          ...formData,
          valor: parseFloat(formData.valor),
          mes: formData.mes + '-01',
          created_by: profile.id
        }

        const { data: newEntrada, error } = await supabase
          .from('dfc_entradas')
          .insert([dataToSave])
          .select()
          .single()

        if (error) throw error
        
        // Upload de documentos
        if (uploadedFiles.length > 0) {
          await uploadDocumentos(newEntrada.id)
        }
        
        toast.success('Entrada registrada com sucesso!')
      }
      // CRIAÇÃO de lançamento parcelado
      else {
        // Lançamento parcelado - criar registro PAI + parcelas FILHAS
        const valorTotal = parseFloat(formData.valor)
        const valorParcela = valorTotal / numeroParcelas
        
        // 1. Criar lançamento PAI
        const lancamentoPai = {
          company_id: formData.company_id,
          categoria: formData.categoria,
          item_id: formData.item_id,
          descricao: formData.descricao,
          valor: valorTotal, // Valor total
          moeda: formData.moeda,
          mes: formData.mes + '-01',
          vencimento: formData.vencimento,
          is_parcelado: true,
          numero_parcelas: numeroParcelas,
          parcela_numero: null, // Pai não tem número de parcela
          lancamento_pai_id: null, // Pai não tem pai
          created_by: profile.id
        }

        const { data: paiCriado, error: errorPai } = await supabase
          .from('dfc_entradas')
          .insert([lancamentoPai])
          .select()
          .single()

        if (errorPai) throw errorPai

        // 2. Criar parcelas FILHAS vinculadas ao pai
        const dataVencimentoBase = new Date(formData.vencimento + 'T00:00:00')
        const mesBase = new Date(formData.mes + '-01T00:00:00')

        const parcelasFilhas = []
        for (let i = 0; i < numeroParcelas; i++) {
          // Usa data customizada se existir, senão calcula automaticamente
          let vencimentoParcela
          if (parcelasDatas[i]) {
            vencimentoParcela = parcelasDatas[i]
          } else {
            const dataAuto = new Date(dataVencimentoBase)
            dataAuto.setMonth(dataAuto.getMonth() + i)
            vencimentoParcela = dataAuto.toISOString().substring(0, 10)
          }
          
          const mesParcela = new Date(mesBase)
          mesParcela.setMonth(mesParcela.getMonth() + i)
          
          parcelasFilhas.push({
            company_id: formData.company_id,
            categoria: formData.categoria,
            item_id: formData.item_id,
            descricao: `${formData.descricao} - Parcela ${i + 1}/${numeroParcelas}`,
            valor: valorParcela,
            moeda: formData.moeda,
            mes: mesParcela.toISOString().substring(0, 10),
            vencimento: vencimentoParcela,
            is_parcelado: false,
            numero_parcelas: 1,
            parcela_numero: i + 1,
            lancamento_pai_id: paiCriado.id, // Vincula ao pai
            created_by: profile.id
          })
        }

        const { error: errorFilhas } = await supabase
          .from('dfc_entradas')
          .insert(parcelasFilhas)

        if (errorFilhas) throw errorFilhas
        toast.success(`Lançamento parcelado criado: ${numeroParcelas}x de ${formatCurrency(valorParcela, formData.moeda)}`)
      }

      closeModal()
      fetchEntradas()
    } catch (error) {
      console.error('Erro ao salvar entrada:', error)
      toast.error('Erro ao salvar entrada: ' + error.message)
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files])
      toast.success(`${files.length} arquivo(s) selecionado(s)`)
    }
  }

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadDocumentos = async (entradaId) => {
    if (uploadedFiles.length === 0) return

    try {
      setUploadingFiles(true)

      for (const file of uploadedFiles) {
        // Gerar nome único para o arquivo
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(7)
        const fileExt = file.name.split('.').pop()
        const fileName = `${timestamp}-${randomStr}.${fileExt}`
        const filePath = `dfc-documentos/${entradaId}/${fileName}`

        // Upload para o Storage
        const { error: uploadError } = await supabase.storage
          .from('dfc-documentos')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Salvar metadados no banco
        const { error: dbError } = await supabase
          .from('dfc_entradas_documentos')
          .insert([{
            entrada_id: entradaId,
            nome_arquivo: fileName,
            nome_original: file.name,
            tipo_arquivo: file.type,
            tamanho: file.size,
            storage_path: filePath,
            created_by: profile.id
          }])

        if (dbError) throw dbError
      }

      toast.success('Documentos enviados com sucesso!')
      setUploadedFiles([])
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      toast.error('Erro ao enviar documentos: ' + error.message)
    } finally {
      setUploadingFiles(false)
    }
  }

  const deleteDocumento = async (documento) => {
    try {
      // Remover do storage
      const { error: storageError } = await supabase.storage
        .from('dfc-documentos')
        .remove([documento.storage_path])

      if (storageError) throw storageError

      // Remover do banco
      const { error: dbError } = await supabase
        .from('dfc_entradas_documentos')
        .delete()
        .eq('id', documento.id)

      if (dbError) throw dbError

      // Atualizar lista de documentos local
      setDocumentos(prev => prev.filter(d => d.id !== documento.id))
      
      // Atualizar contador na lista de entradas
      setEntradas(prev => prev.map(entrada => {
        if (entrada.id === documento.entrada_id) {
          return {
            ...entrada,
            dfc_entradas_documentos: [{
              count: Math.max(0, (entrada.dfc_entradas_documentos?.[0]?.count || 1) - 1)
            }]
          }
        }
        return entrada
      }))
      
      toast.success('Documento excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir documento:', error)
      toast.error('Erro ao excluir documento')
    }
  }

  const downloadDocumento = async (documento) => {
    try {
      const { data, error } = await supabase.storage
        .from('dfc-documentos')
        .download(documento.storage_path)

      if (error) throw error

      // Criar URL e fazer download
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = documento.nome_original
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar documento:', error)
      toast.error('Erro ao baixar documento')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const openDocumentosModal = async (entrada) => {
    setSelectedEntradaDocumentos(entrada)
    const docs = await fetchDocumentos(entrada.id)
    setDocumentos(docs)
    setShowDocumentosModal(true)
  }

  const closeDocumentosModal = () => {
    setShowDocumentosModal(false)
    setSelectedEntradaDocumentos(null)
    setDocumentos([])
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('dfc_entradas')
        .delete()
        .eq('id', deletingId)

      if (error) throw error
      toast.success('Entrada excluída com sucesso!')
      fetchEntradas()
    } catch (error) {
      console.error('Erro ao excluir entrada:', error)
      toast.error('Erro ao excluir entrada')
    } finally {
      setShowDeleteModal(false)
      setDeletingId(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setDeletingId(null)
  }

  const exportToCSV = () => {
    const headers = ['Empresa', 'Categoria', 'Item', 'Descrição', 'Valor', 'Mês', 'Vencimento']
    const rows = filteredEntradas.map(e => {
      const categoria = categorias.find(c => c.id === e.categoria)
      return [
        e.companies?.name || '-',
        categoria?.sigla || e.categoria,
        e.item,
        e.descricao,
        parseFloat(e.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        e.mes.substring(0, 7), // YYYY-MM
        new Date(e.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')
      ]
    })

    const csv = [headers, ...rows].map(row => row.join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `dfc_entradas_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Itens disponíveis baseado na categoria selecionada
  const itensDisponiveis = useMemo(() => {
    if (!formData.categoria) return []
    return itensDB.filter(item => item.categoria_id === formData.categoria)
  }, [formData.categoria, itensDB])

  // Filtrar empresas para busca no formulário
  const filteredCompanies = useMemo(() => {
    console.log('Companies disponíveis:', companies.length)
    console.log('Company Search:', companySearch)
    if (!companySearch) return companies
    const filtered = companies.filter(company => 
      company.name.toLowerCase().includes(companySearch.toLowerCase())
    )
    console.log('Empresas filtradas:', filtered.length)
    return filtered
  }, [companies, companySearch])

  // Obter nome da empresa selecionada
  const selectedCompanyName = useMemo(() => {
    const company = companies.find(c => c.id === formData.company_id)
    return company ? company.name : ''
  }, [companies, formData.company_id])

  // Filtrar entradas
  const filteredEntradas = useMemo(() => {
    return entradas.filter(entrada => {
      const itemNome = entrada.dfc_itens?.nome || ''
      const matchSearch = !searchTerm || 
        entrada.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itemNome.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Filtro por mês de referência (se estiver usando)
      const matchMes = mesFilter === 'all' || mesFilter === '' || 
        entrada.mes.substring(0, 7) === mesFilter
      
      // Filtro por período personalizado (usando data de vencimento)
      // Só aplica se o usuário explicitamente preencheu as datas
      let matchPeriodo = true
      if (dataInicio && dataFim && entrada.vencimento) {
        const dataVencimento = new Date(entrada.vencimento + 'T00:00:00')
        const dataInicioPeriodo = new Date(dataInicio + 'T00:00:00')
        const dataFimPeriodo = new Date(dataFim + 'T00:00:00')
        matchPeriodo = dataVencimento >= dataInicioPeriodo && dataVencimento <= dataFimPeriodo
      }
      
      return matchSearch && matchMes && matchPeriodo
    })
  }, [entradas, searchTerm, mesFilter, dataInicio, dataFim])

  // Calcular totais
  const totais = useMemo(() => {
    const total = filteredEntradas.reduce((sum, e) => sum + parseFloat(e.valor), 0)
    const porCategoria = {}
    
    filteredEntradas.forEach(e => {
      if (!porCategoria[e.categoria]) {
        porCategoria[e.categoria] = 0
      }
      porCategoria[e.categoria] += parseFloat(e.valor)
    })

    return { total, porCategoria }
  }, [filteredEntradas])

  const formatCurrency = (value, currencyCode = 'BRL') => {
    const moeda = moedas.find(m => m.code === currencyCode) || moedas[0]
    const localeMap = {
      'BRL': 'pt-BR',
      'USD': 'en-US',
      'EUR': 'de-DE',
      'GBP': 'en-GB',
      'JPY': 'ja-JP',
      'CAD': 'en-CA',
      'AUD': 'en-AU',
      'CHF': 'de-CH',
      'CNY': 'zh-CN'
    }
    
    const locale = localeMap[currencyCode] || 'pt-BR'
    
    return parseFloat(value).toLocaleString(locale, {
      style: 'currency',
      currency: currencyCode
    })
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  const formatMonth = (date) => {
    if (!date) return '-'
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  if (!isAuthorized()) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Acesso Negado</h2>
          <p className="text-red-700">Apenas Administradores têm acesso ao Demonstrativo de Fluxo de Caixa.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando DFC...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SuperAdminBanner />
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to={(() => {
                const p = new URLSearchParams()
                if (dataInicio && dataFim) { p.set('dataInicio', dataInicio); p.set('dataFim', dataFim) }
                if (searchParams.get('from') === 'admin') {
                  const cid = searchParams.get('companyId') || searchParams.get('company')
                  if (cid) { p.set('companyId', cid); p.set('from', 'admin') }
                }
                const qs = p.toString()
                return qs ? `/dfc?${qs}` : '/dfc'
              })()}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all group"
              title="Voltar ao DFC"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-[#EBA500] transition-colors" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#373435]">
                DFC - Entradas Financeiras
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Demonstrativo de Fluxo de Caixa - Registro de Entradas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all font-medium"
            >
              <Download className="h-4 w-4" />
              <span>Exportar CSV</span>
            </button>

            <label className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all font-medium cursor-pointer">
              <Upload className="h-4 w-4" />
              <span>Importar</span>
              <input type="file" accept=".csv,.xml,.ofx,.ofc" className="hidden" onChange={handleImportFile} />
            </label>

            <button
              onClick={() => openModal()}
              className="flex items-center space-x-2 px-4 py-2 bg-[#EBA500] text-white rounded-2xl hover:bg-[#EBA500]/90 transition-all font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Entrada</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200/50 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Entradas</p>
              <p className="text-2xl font-bold text-[#373435] mt-1">{filteredEntradas.length}</p>
            </div>
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white border border-gray-200/50 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totais.total)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white border border-gray-200/50 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Categorias</p>
              <p className="text-2xl font-bold text-[#373435] mt-1">{Object.keys(totais.porCategoria).length}</p>
            </div>
            <Filter className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6 mb-6">
        <div className="space-y-6">
          {/* Filtros principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] transition-all"
              />
            </div>

            {/* Filtro de Empresa - Apenas para Super Admin */}
            {isSuperAdmin() && (
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] transition-all"
              >
                <option value="all">Todas as empresas</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            )}
            
            {/* Indicação da empresa para Company Admin */}
            {isCompanyAdmin() && companyFilter !== 'all' && (
              <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-700 font-medium">
                {companies.find(c => c.id === companyFilter)?.name || 'Empresa'}
              </div>
            )}

            <select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] transition-all"
            >
              <option value="all">Todas as categorias</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.sigla || cat.nome}</option>
              ))}
            </select>

            <div className="border-2 border-gray-200 rounded-2xl p-2 bg-gray-50/50">
              <div className="flex gap-2">
                <select
                  value={mesFilter === 'all' ? '' : (mesFilter ? mesFilter.split('-')[1] : '')}
                  onChange={(e) => {
                    if (!e.target.value) {
                      setMesFilter('all')
                    } else {
                      const ano = mesFilter && mesFilter !== 'all' ? mesFilter.split('-')[0] : new Date().getFullYear()
                      setMesFilter(`${ano}-${e.target.value}`)
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] bg-white transition-all"
                >
                  <option value="">Mês</option>
                  <option value="01">Janeiro</option>
                  <option value="02">Fevereiro</option>
                  <option value="03">Março</option>
                  <option value="04">Abril</option>
                  <option value="05">Maio</option>
                  <option value="06">Junho</option>
                  <option value="07">Julho</option>
                  <option value="08">Agosto</option>
                  <option value="09">Setembro</option>
                  <option value="10">Outubro</option>
                  <option value="11">Novembro</option>
                  <option value="12">Dezembro</option>
                </select>
                
                <select
                  value={mesFilter === 'all' ? '' : (mesFilter ? mesFilter.split('-')[0] : '')}
                  onChange={(e) => {
                    if (!e.target.value) {
                      setMesFilter('all')
                    } else {
                      const mes = mesFilter && mesFilter !== 'all' ? mesFilter.split('-')[1] : '01'
                      setMesFilter(`${e.target.value}-${mes}`)
                    }
                  }}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] bg-white transition-all"
                >
                  <option value="">Ano</option>
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Filtro de Período Personalizado */}
          <div className="border-t border-gray-200 pt-6">
            <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">Período Personalizado</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-gray-600">Data Início</label>
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-600">Data Fim</label>
                    <input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
                {dataInicio && dataFim && (() => {
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
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200/50 rounded-2xl sm:rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg sm:text-xl font-semibold text-[#373435] flex items-center">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 mr-3 text-green-500" />
            Entradas Registradas ({filteredEntradas.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                  Mês
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#373435] uppercase tracking-wider">
                  Vencimento
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#373435] uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {filteredEntradas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma entrada encontrada</h3>
                    <p className="text-gray-600">
                      {searchTerm || companyFilter !== 'all' || categoriaFilter !== 'all' || mesFilter !== 'all' || (dataInicio && dataFim)
                        ? 'Tente ajustar os filtros de busca ou período'
                        : 'Registre a primeira entrada clicando em "Nova Entrada"'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEntradas.map((entrada) => (
                  <tr key={entrada.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        {companyAvatars[entrada.company_id] ? (
                          <img 
                            src={companyAvatars[entrada.company_id]} 
                            alt={entrada.companies?.name}
                            className="h-6 w-6 rounded object-cover mr-2 flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none'
                            }}
                          />
                        ) : null}
                        {!companyAvatars[entrada.company_id] && (
                          <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                        )}
                        {entrada.companies?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {categorias.find(c => c.id === entrada.categoria)?.nome || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{entrada.dfc_itens?.nome || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{entrada.descricao}</span>
                      {entrada.is_parcelado && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {entrada.numero_parcelas}x de {formatCurrency(entrada.valor / entrada.numero_parcelas, entrada.moeda)}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-green-600">{formatCurrency(entrada.valor, entrada.moeda)}</span>
                        {entrada.is_parcelado && (
                          <span className="text-xs text-gray-500 mt-0.5">Valor total</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                        {formatMonth(entrada.mes)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{formatDate(entrada.vencimento)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {entrada.is_parcelado && (
                          <button
                            onClick={() => openParcelasModal(entrada)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Ver parcelas"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}
                        {entrada.dfc_entradas_documentos?.[0]?.count > 0 && (
                          <button
                            onClick={() => openDocumentosModal(entrada)}
                            className="relative text-blue-600 hover:text-blue-800"
                            title="Ver documentos"
                          >
                            <Paperclip className="h-4 w-4" />
                            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] rounded-full h-3.5 w-3.5 flex items-center justify-center">
                              {entrada.dfc_entradas_documentos[0].count}
                            </span>
                          </button>
                        )}
                        <button
                          onClick={() => openModal(entrada)}
                          className="text-[#EBA500] hover:text-[#EBA500]/80"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entrada.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Formulário */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModal}>
          <div 
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#EBA500] to-[#EBA500]/80 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {editingId ? 'Editar Entrada' : 'Nova Entrada'}
                    </h2>
                    <p className="text-sm text-white/90 mt-1">Preencha os dados da entrada financeira</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white hover:bg-white/20 p-2 rounded-xl transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-4">
                {/* Empresa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empresa *
                  </label>
                  
                  {/* Para Company Admin - Apenas mostrar nome da empresa */}
                  {isCompanyAdmin() ? (
                    <div className="px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 font-medium flex items-center">
                      <Building2 className="h-4 w-4 mr-2" />
                      {companies.find(c => c.id === formData.company_id)?.name || 'Empresa'}
                    </div>
                  ) : (
                    /* Para Super Admin - Seleção com busca */
                    <div className="relative">
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={showCompanyDropdown ? companySearch : selectedCompanyName}
                          onChange={(e) => {
                            setCompanySearch(e.target.value)
                            setShowCompanyDropdown(true)
                          }}
                          onFocus={() => {
                            setCompanySearch('')
                            setShowCompanyDropdown(true)
                          }}
                        placeholder="Buscar empresa..."
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]"
                        required
                      />
                      {formData.company_id && !showCompanyDropdown && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, company_id: '' })
                            setCompanySearch('')
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      {showCompanyDropdown && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowCompanyDropdown(false)
                            setCompanySearch('')
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* Dropdown de empresas */}
                    {showCompanyDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto">
                        {filteredCompanies.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500 text-center">
                            Nenhuma empresa encontrada
                          </div>
                        ) : (
                          filteredCompanies.map(company => (
                            <button
                              key={company.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, company_id: company.id })
                                setShowCompanyDropdown(false)
                                setCompanySearch('')
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                formData.company_id === company.id ? 'bg-[#EBA500]/10 text-[#EBA500] font-medium' : 'text-gray-900'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                {companyAvatars[company.id] ? (
                                  <img 
                                    src={companyAvatars[company.id]} 
                                    alt={company.name}
                                    className="h-6 w-6 rounded object-cover flex-shrink-0"
                                    onError={(e) => {
                                      e.target.style.display = 'none'
                                      console.log(`Erro ao carregar imagem: ${companyAvatars[company.id]}`)
                                    }}
                                  />
                                ) : null}
                                {!companyAvatars[company.id] && (
                                  <Building2 className="h-4 w-4 flex-shrink-0 text-gray-400" />
                                )}
                                <span className="truncate">{company.name}</span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                    </div>
                  )}
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value, item_id: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Item */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item *
                  </label>
                  <select
                    value={formData.item_id}
                    onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]"
                    required
                    disabled={!formData.categoria}
                  >
                    <option value="">Selecione um item</option>
                    {itensDisponiveis.map(item => (
                      <option key={item.id} value={item.id}>{item.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição *
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]"
                    rows="3"
                    placeholder="Descreva a saída..."
                    required
                  />
                </div>

                {/* Valor e Moeda */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor ({getMoedaAtual().symbol}) *
                  </label>
                  <div className="flex gap-2">
                    {/* Seletor de Moeda */}
                    <div className="relative" style={{ width: '140px' }}>
                      <select
                        value={formData.moeda}
                        onChange={(e) => setFormData({ ...formData, moeda: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] bg-white appearance-none cursor-pointer pr-8"
                      >
                        {moedas.map(moeda => (
                          <option key={moeda.code} value={moeda.code}>
                            {moeda.symbol} {moeda.code}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    
                    {/* Campo de Valor */}
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.valor}
                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]"
                        placeholder={`${getMoedaAtual().symbol} 0,00`}
                        required
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Moeda: {getMoedaAtual().name}
                  </p>
                </div>

                {/* Mês e Vencimento */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mês de Referência *
                    </label>
                    <div className="border-2 border-gray-200 rounded-xl p-2 bg-gray-50/50">
                      <div className="flex gap-2">
                        <select
                          value={formData.mes ? formData.mes.split('-')[1] : ''}
                          onChange={(e) => {
                            const ano = formData.mes ? formData.mes.split('-')[0] : new Date().getFullYear()
                            setFormData({ ...formData, mes: `${ano}-${e.target.value}` })
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] bg-white"
                          required
                        >
                          <option value="">Mês</option>
                          <option value="01">Janeiro</option>
                          <option value="02">Fevereiro</option>
                          <option value="03">Março</option>
                          <option value="04">Abril</option>
                          <option value="05">Maio</option>
                          <option value="06">Junho</option>
                          <option value="07">Julho</option>
                          <option value="08">Agosto</option>
                          <option value="09">Setembro</option>
                          <option value="10">Outubro</option>
                          <option value="11">Novembro</option>
                          <option value="12">Dezembro</option>
                        </select>
                        
                        <select
                          value={formData.mes ? formData.mes.split('-')[0] : ''}
                          onChange={(e) => {
                            const mes = formData.mes ? formData.mes.split('-')[1] : '01'
                            setFormData({ ...formData, mes: `${e.target.value}-${mes}` })
                          }}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] bg-white"
                          required
                        >
                          <option value="">Ano</option>
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vencimento *
                    </label>
                    <input
                      type="date"
                      value={formData.vencimento}
                      onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]"
                      required
                    />
                  </div>
                </div>

                {/* Sistema de Parcelamento - Apenas ao criar novo lançamento */}
                {!editingId && (
                  <div className="border border-gray-200 rounded-xl p-4 bg-blue-50/30">
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isParcelado}
                          onChange={(e) => {
                            setIsParcelado(e.target.checked)
                            if (!e.target.checked) {
                              setNumeroParcelas(1)
                            } else {
                              setNumeroParcelas(2)
                            }
                          }}
                          className="w-4 h-4 text-[#EBA500] border-gray-300 rounded focus:ring-[#EBA500]"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          Lançamento Parcelado
                        </span>
                      </label>
                    </div>

                    {isParcelado && (
                      <>
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de Parcelas
                          </label>
                          <input
                            type="number"
                            min="2"
                            max="120"
                            value={numeroParcelas}
                            onChange={(e) => setNumeroParcelas(parseInt(e.target.value) || 2)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]"
                            placeholder="Ex: 10"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Valor por parcela: {formData.valor ? formatCurrency(parseFloat(formData.valor) / numeroParcelas, formData.moeda) : `${getMoedaAtual().symbol} 0,00`}
                          </p>
                        </div>

                        {/* Preview das Parcelas */}
                        {formData.valor && formData.vencimento && formData.mes && numeroParcelas >= 2 && (
                          <div className="bg-white border border-blue-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                            <p className="text-xs font-semibold text-gray-700 mb-2">
                              Preview das {numeroParcelas} parcelas (clique na data para editar):
                            </p>
                            <div className="space-y-1.5">
                              {Array.from({ length: numeroParcelas }, (_, i) => {
                                const mesBase = new Date(formData.mes + '-01T00:00:00')
                                const mesParcela = new Date(mesBase)
                                mesParcela.setMonth(mesParcela.getMonth() + i)
                                const valorParcela = parseFloat(formData.valor) / numeroParcelas
                                const vencimentoParcela = parcelasDatas[i] || formData.vencimento

                                return (
                                  <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                                    <span className="text-gray-900 font-medium">
                                      Parcela {i + 1}/{numeroParcelas}
                                    </span>
                                    <div className="flex items-center space-x-3 text-gray-600">
                                      <span>
                                        {mesParcela.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                                      </span>
                                      <div className="flex items-center space-x-1">
                                        <span className="text-gray-500">Venc:</span>
                                        <input
                                          type="date"
                                          value={vencimentoParcela}
                                          onChange={(e) => {
                                            const novasDatas = [...parcelasDatas]
                                            novasDatas[i] = e.target.value
                                            setParcelasDatas(novasDatas)
                                          }}
                                          className="px-2 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#EBA500] focus:border-[#EBA500]"
                                        />
                                      </div>
                                      <span className="font-semibold text-[#EBA500]">
                                        {formatCurrency(valorParcela, formData.moeda)}
                                      </span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Visualização de Parcelas ao Editar Lançamento Parcelado */}
                {editingId && isParcelado && parcelas.length > 0 && (
                  <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/30">
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-blue-600" />
                        Lançamento Parcelado - {numeroParcelas} parcelas
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Ao salvar, todas as parcelas serão atualizadas automaticamente
                      </p>
                    </div>

                    <div className="bg-white border border-blue-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        Preview das {numeroParcelas} parcelas:
                      </p>
                      <div className="space-y-1.5">
                        {parcelas.slice(0, 12).map((parcela, i) => {
                          const dataVencimentoBase = new Date(formData.vencimento + 'T00:00:00')
                          const mesBase = new Date(formData.mes + '-01T00:00:00')
                          const vencimentoParcela = new Date(dataVencimentoBase)
                          vencimentoParcela.setMonth(vencimentoParcela.getMonth() + i)
                          const mesParcela = new Date(mesBase)
                          mesParcela.setMonth(mesParcela.getMonth() + i)
                          const valorParcela = parseFloat(formData.valor) / numeroParcelas

                          return (
                            <div key={parcela.id} className="flex items-center justify-between text-xs py-1.5 px-2 bg-gray-50 rounded">
                              <span className="text-gray-900 font-medium">
                                Parcela {i + 1}/{numeroParcelas}
                              </span>
                              <div className="flex items-center space-x-3 text-gray-600">
                                <span>
                                  {mesParcela.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                                </span>
                                <span>
                                  Venc: {vencimentoParcela.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                </span>
                                <span className="font-semibold text-blue-600">
                                  {formatCurrency(valorParcela, formData.moeda)}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                        {numeroParcelas > 12 && (
                          <p className="text-xs text-gray-500 text-center pt-1">
                            ... e mais {numeroParcelas - 12} parcelas
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload de Documentos */}
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Documentos (Notas Fiscais, Comprovantes, etc.)
                  </label>
                  
                  {/* Área de Upload */}
                  <div className="mb-4">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#EBA500] hover:bg-[#EBA500]/5 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-semibold text-[#EBA500]">Clique para selecionar</span> ou arraste arquivos
                        </p>
                        <p className="text-xs text-gray-500">PDF, PNG, JPG até 10MB</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileSelect}
                      />
                    </label>
                  </div>

                  {/* Lista de Arquivos Selecionados */}
                  {uploadedFiles.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Arquivos a enviar ({uploadedFiles.length})</p>
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <Paperclip className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="ml-2 p-1 text-red-600 hover:bg-red-100 rounded transition-all flex-shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documentos Existentes (ao editar) */}
                  {documentos.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-2">Documentos anexados ({documentos.length})</p>
                      <div className="space-y-2">
                        {documentos.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <File className="h-4 w-4 text-gray-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 truncate">{doc.nome_original}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(doc.tamanho)}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => downloadDocumento(doc)}
                                className="p-1 text-[#EBA500] hover:bg-[#EBA500]/10 rounded transition-all"
                                title="Baixar"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteDocumento(doc)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded transition-all"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center space-x-2 px-4 py-2 bg-[#EBA500] text-white rounded-xl hover:bg-[#EBA500]/90 transition-all font-medium"
              >
                <Save className="h-4 w-4" />
                <span>{editingId ? 'Atualizar' : 'Salvar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <AlertCircle className="h-6 w-6 mr-2" />
                  Confirmar Exclusão
                </h3>
                <button
                  onClick={cancelDelete}
                  className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium mb-2">
                    Tem certeza que deseja excluir esta entrada?
                  </p>
                  <p className="text-sm text-gray-600">
                    Esta ação não pode ser desfeita. A entrada será removida permanentemente do sistema.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium"
              >
                <Trash2 className="h-4 w-4" />
                <span>Excluir Entrada</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização de Documentos */}
      {showDocumentosModal && selectedEntradaDocumentos && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeDocumentosModal}>
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Paperclip className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Documentos Anexados</h3>
                    <p className="text-sm text-white/90 mt-0.5">
                      {selectedEntradaDocumentos.companies?.name} - {selectedEntradaDocumentos.dfc_itens?.nome}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeDocumentosModal}
                  className="text-white hover:bg-white/20 p-2 rounded-xl transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {documentos.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum documento anexado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documentos.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                          <File className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.nome_original}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-xs text-gray-500">{formatFileSize(doc.tamanho)}</p>
                            <span className="text-gray-300">•</span>
                            <p className="text-xs text-gray-500">
                              {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                        <button
                          onClick={() => downloadDocumento(doc)}
                          className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Baixar documento"
                        >
                          <Download className="h-4 w-4" />
                          <span className="text-sm font-medium">Baixar</span>
                        </button>
                        <button
                          onClick={() => setConfirmDialog({
                            title: 'Excluir documento?',
                            message: 'Esta ação não pode ser desfeita.',
                            onConfirm: () => { setConfirmDialog(null); deleteDocumento(doc) }
                          })}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir documento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <button
                onClick={closeDocumentosModal}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Parcelas */}
      {showParcelasModal && selectedEntradaParcelas && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeParcelasModal}>
          <div 
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Parcelas do Lançamento</h3>
                    <p className="text-sm text-white/90 mt-0.5">
                      {selectedEntradaParcelas.descricao}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeParcelasModal}
                  className="text-white hover:bg-white/20 p-2 rounded-xl transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Valor Total</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedEntradaParcelas.valor, selectedEntradaParcelas.moeda)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Número de Parcelas</p>
                  <p className="text-lg font-bold text-gray-900">{selectedEntradaParcelas.numero_parcelas}x</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Valor por Parcela</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(selectedEntradaParcelas.valor / selectedEntradaParcelas.numero_parcelas, selectedEntradaParcelas.moeda)}
                  </p>
                </div>
              </div>
            </div>

            {/* Body - Lista de Parcelas */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-280px)]">
              {parcelas.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhuma parcela encontrada</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {parcelas.map((parcela, index) => {
                    const hoje = new Date()
                    const vencimento = new Date(parcela.vencimento + 'T00:00:00')
                    const vencida = vencimento < hoje
                    const proximoVencimento = index === 0 || (parcelas[index - 1] && new Date(parcelas[index - 1].vencimento + 'T00:00:00') < hoje && vencimento >= hoje)

                    return (
                      <div 
                        key={parcela.id} 
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                          vencida 
                            ? 'bg-red-50 border-red-200' 
                            : proximoVencimento 
                            ? 'bg-yellow-50 border-yellow-300 shadow-md' 
                            : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className={`flex items-center justify-center w-12 h-12 rounded-xl font-bold text-lg ${
                            vencida 
                              ? 'bg-red-100 text-red-600' 
                              : proximoVencimento 
                              ? 'bg-yellow-100 text-yellow-700' 
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {parcela.parcela_numero}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="text-sm font-semibold text-gray-900">
                                Parcela {parcela.parcela_numero}/{selectedEntradaParcelas.numero_parcelas}
                              </p>
                              {vencida && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  Vencida
                                </span>
                              )}
                              {proximoVencimento && !vencida && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Próximo vencimento
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                <span>Ref: {formatMonth(parcela.mes)}</span>
                              </div>
                              <div className="flex items-center">
                                <DollarSign className="h-3.5 w-3.5 mr-1" />
                                {editingParcelaId === parcela.id ? (
                                  <input
                                    type="date"
                                    value={editingVencimento}
                                    onChange={(e) => setEditingVencimento(e.target.value)}
                                    className="px-2 py-1 border border-blue-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                ) : (
                                  <span>Venc: {formatDate(parcela.vencimento)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex items-center space-x-2">
                          {editingParcelaId === parcela.id ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editingValor}
                              onChange={(e) => setEditingValor(e.target.value)}
                              className="w-32 px-3 py-2 border border-blue-300 rounded-lg text-right font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0.00"
                            />
                          ) : (
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(parcela.valor, parcela.moeda)}</p>
                          )}
                          {editingParcelaId === parcela.id ? (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleSaveParcela(parcela.id)}
                                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                                title="Salvar"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-all"
                                title="Cancelar"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditParcela(parcela)}
                              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                              title="Editar parcela"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <button
                onClick={closeParcelasModal}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ─── Modal de Importação ──────────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Importar Entradas</h2>
                <p className="text-sm text-gray-500">{importRows.length} registro(s) encontrado(s) — revise e confirme</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Empresa padrão */}
            {isSuperAdmin() && (
              <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Empresa:</span>
                <select
                  value={importCompanyId}
                  onChange={e => {
                    const cid = e.target.value
                    setImportCompanyId(cid)
                    setImportRows(prev => prev.map(r => ({ ...r, company_id: cid })))
                  }}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:border-[#EBA500] focus:outline-none"
                >
                  <option value="">Selecione...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            {/* Tabela */}
            <div className="overflow-auto flex-1 px-6 py-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 font-semibold text-gray-700 border-b w-1/3 min-w-[260px]">Descrição</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700 border-b w-32">Valor (R$)</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700 border-b w-36">Vencimento</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700 border-b w-32">Mês</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700 border-b">Categoria</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700 border-b">Item</th>
                    <th className="px-3 py-2 border-b w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {importRows.map((row, i) => (
                    <tr key={i} className={importErrors[i]?.length > 0 ? 'bg-red-50' : 'hover:bg-gray-50'}>
                      <td className="px-3 py-2 border-b border-gray-100">
                        <textarea
                          rows={3}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:border-[#EBA500] focus:outline-none resize-y"
                          value={row.descricao}
                          onChange={e => setImportRows(prev => prev.map((r,j) => j===i ? {...r, descricao: e.target.value} : r))}
                        />
                        {importErrors[i]?.map((er,k) => <p key={k} className="text-xs text-red-500 mt-0.5">{er}</p>)}
                      </td>
                      <td className="px-3 py-2 border-b border-gray-100">
                        <input
                          type="number" step="0.01" min="0"
                          className="w-28 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:border-[#EBA500] focus:outline-none"
                          value={row.valor}
                          onChange={e => setImportRows(prev => prev.map((r,j) => j===i ? {...r, valor: e.target.value} : r))}
                        />
                      </td>
                      <td className="px-3 py-2 border-b border-gray-100">
                        <input
                          type="date"
                          className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:border-[#EBA500] focus:outline-none"
                          value={row.vencimento}
                          onChange={e => setImportRows(prev => prev.map((r,j) => j===i ? {...r, vencimento: e.target.value, mes: e.target.value.substring(0,7)} : r))}
                        />
                      </td>
                      <td className="px-3 py-2 border-b border-gray-100">
                        <input
                          type="month"
                          className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:border-[#EBA500] focus:outline-none"
                          value={row.mes}
                          onChange={e => setImportRows(prev => prev.map((r,j) => j===i ? {...r, mes: e.target.value} : r))}
                        />
                      </td>
                      <td className="px-3 py-2 border-b border-gray-100">
                        <select
                          className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:border-[#EBA500] focus:outline-none bg-white"
                          value={row.categoria}
                          onChange={e => setImportRows(prev => prev.map((r,j) => j===i ? {...r, categoria: e.target.value, item_id: ''} : r))}
                        >
                          <option value="">Sem categoria</option>
                          {categorias.filter(c => c.tipo === 'entrada').map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2 border-b border-gray-100">
                        {row.categoria ? (
                          <select
                            className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:border-[#EBA500] focus:outline-none bg-white min-w-[140px]"
                            value={row.item_id}
                            onChange={e => setImportRows(prev => prev.map((r,j) => j===i ? {...r, item_id: e.target.value} : r))}
                          >
                            <option value="">Sem item</option>
                            {importItensDB.filter(it => it.categoria_id === row.categoria).map(it => <option key={it.id} value={it.id}>{it.nome}</option>)}
                          </select>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Selecione a categoria</span>
                        )}
                      </td>
                      <td className="px-3 py-2 border-b border-gray-100">
                        <button
                          onClick={() => setImportRows(prev => prev.filter((_,j) => j!==i))}
                          className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">Formatos suportados: CSV, XML, OFX/OFC (extrato bancário)</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-5 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveImport}
                  disabled={importSaving || importRows.length === 0}
                  className="px-5 py-2 bg-[#EBA500] text-white rounded-xl text-sm font-medium hover:bg-[#EBA500]/90 transition-all disabled:opacity-50"
                >
                  {importSaving ? 'Importando...' : `Importar ${importRows.length} registro(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {confirmDialog && (
        <ConfirmModal
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel || 'Excluir'}
          variant={confirmDialog.variant || 'danger'}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  )
}

export default DFCEntradasPage
