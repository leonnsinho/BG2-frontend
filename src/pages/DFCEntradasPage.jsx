import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
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
  Eye
} from 'lucide-react'
import toast from 'react-hot-toast'

function DFCEntradasPage() {
  const { profile } = useAuth()
  const [entradas, setEntradas] = useState([])
  const [companies, setCompanies] = useState([])
  const [companyAvatars, setCompanyAvatars] = useState({})
  const [categorias, setCategorias] = useState([])
  const [itensDB, setItensDB] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  
  // Estados para documentos
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [documentos, setDocumentos] = useState([])
  const [showDocumentosModal, setShowDocumentosModal] = useState(false)
  const [selectedSaidaDocumentos, setSelectedSaidaDocumentos] = useState(null)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [categoriaFilter, setCategoriaFilter] = useState('all')
  const [mesFilter, setMesFilter] = useState('all')
  
  // Busca de empresa no formulário
  const [companySearch, setCompanySearch] = useState('')
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)

  // Formulário
  const [formData, setFormData] = useState({
    company_id: '',
    categoria: '',
    item_id: '',
    descricao: '',
    valor: '',
    mes: '',
    vencimento: ''
  })

  const isSuperAdmin = () => profile?.role === 'super_admin'
  const isCompanyAdmin = () => {
    return profile?.user_companies?.some(uc => uc.role === 'company_admin' && uc.is_active) || false
  }
  const isAuthorized = () => isSuperAdmin() || isCompanyAdmin()
  
  // Obter empresa do company admin
  const getCompanyAdminCompany = () => {
    if (!isCompanyAdmin()) return null
    const adminCompany = profile?.user_companies?.find(uc => uc.role === 'company_admin' && uc.is_active)
    return adminCompany?.company_id || null
  }

  useEffect(() => {
    console.log('Profile:', profile)
    console.log('Is Authorized:', isAuthorized())
    fetchCompanies()
    fetchCategoriasEItens()
    
    // Se for company admin, auto-selecionar sua empresa
    if (isCompanyAdmin()) {
      const companyId = getCompanyAdminCompany()
      if (companyId) {
        setCompanyFilter(companyId)
      }
    }
    
    fetchEntradas()
  }, [profile])

  useEffect(() => {
    fetchEntradas()
  }, [companyFilter, categoriaFilter])

  const fetchCategoriasEItens = async () => {
    try {
      // Buscar categorias de entrada (receitas)
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('dfc_categorias')
        .select('*')
        .eq('tipo', 'entrada')
        .order('nome')

      if (categoriasError) throw categoriasError

      // Buscar itens
      const { data: itensData, error: itensError } = await supabase
        .from('dfc_itens')
        .select('*')
        .order('nome')

      if (itensError) throw itensError

      setCategorias(categoriasData || [])
      setItensDB(itensData || [])
    } catch (error) {
      console.error('Erro ao buscar categorias e itens:', error)
      toast.error('Erro ao carregar categorias e itens')
    }
  }

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, logo_url')
        .order('name')

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

  const openModal = async (entrada = null) => {
    if (entrada) {
      setEditingId(entrada.id)
      setFormData({
        company_id: entrada.company_id,
        categoria: entrada.categoria,
        item_id: entrada.item_id,
        descricao: entrada.descricao,
        valor: entrada.valor,
        mes: entrada.mes.substring(0, 7), // Converter YYYY-MM-DD para YYYY-MM
        vencimento: entrada.vencimento
      })
      // Buscar documentos da entrada
      const docs = await fetchDocumentos(entrada.id)
      setDocumentos(docs)
    } else {
      setEditingId(null)
      const companyAdminId = getCompanyAdminCompany()
      setFormData({
        company_id: companyAdminId || (companies.length === 1 ? companies[0].id : ''),
        categoria: '',
        item_id: '',
        descricao: '',
        valor: '',
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
    setFormData({
      company_id: '',
      categoria: '',
      item_id: '',
      descricao: '',
      valor: '',
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

    try {
      const dataToSave = {
        ...formData,
        valor: parseFloat(formData.valor),
        mes: formData.mes + '-01', // Converter YYYY-MM para YYYY-MM-01
        created_by: profile.id
      }

      let entradaId = editingId

      if (editingId) {
        // Atualizar
        const { error } = await supabase
          .from('dfc_entradas')
          .update(dataToSave)
          .eq('id', editingId)

        if (error) throw error
        toast.success('Entrada atualizada com sucesso!')
      } else {
        // Criar
        const { data: newEntrada, error } = await supabase
          .from('dfc_entradas')
          .insert([dataToSave])
          .select()
          .single()

        if (error) throw error
        entradaId = newEntrada.id
        toast.success('Entrada registrada com sucesso!')
      }

      // Upload de documentos
      if (uploadedFiles.length > 0 && entradaId) {
        await uploadDocumentos(entradaId)
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
      
      // Filtro por mês
      const matchMes = mesFilter === 'all' || mesFilter === '' || 
        entrada.mes.substring(0, 7) === mesFilter
      
      return matchSearch && matchMes
    })
  }, [entradas, searchTerm, mesFilter])

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

  const formatCurrency = (value) => {
    return parseFloat(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
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
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#373435]">
              DFC - Entradas Financeiras
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Demonstrativo de Fluxo de Caixa - Registro de Entradas
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all font-medium"
            >
              <Download className="h-4 w-4" />
              <span>Exportar CSV</span>
            </button>

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

          <input
            type="month"
            value={mesFilter === 'all' ? '' : mesFilter}
            onChange={(e) => setMesFilter(e.target.value || 'all')}
            className="px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] transition-all"
            placeholder="Filtrar por mês"
          />
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
                      {searchTerm || companyFilter !== 'all' || categoriaFilter !== 'all' || mesFilter !== 'all'
                        ? 'Tente ajustar os filtros de busca'
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600">{formatCurrency(entrada.valor)}</span>
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

                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor (R$) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]"
                      placeholder="0,00"
                      required
                    />
                  </div>
                </div>

                {/* Mês e Vencimento */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mês de Referência *
                    </label>
                    <input
                      type="month"
                      value={formData.mes}
                      onChange={(e) => setFormData({ ...formData, mes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]"
                      required
                    />
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
                        {isSuperAdmin() && (
                          <button
                            onClick={() => {
                              if (window.confirm('Deseja realmente excluir este documento?')) {
                                deleteDocumento(doc)
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Excluir documento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
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
    </div>
  )
}

export default DFCEntradasPage
