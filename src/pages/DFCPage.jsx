import React, { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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

function DFCPage() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const [saidas, setSaidas] = useState([])
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
  
  // Estados para parcelas
  const [showParcelasModal, setShowParcelasModal] = useState(false)
  const [parcelas, setParcelas] = useState([])
  const [selectedSaidaParcelas, setSelectedSaidaParcelas] = useState(null)
  const [editingParcelaId, setEditingParcelaId] = useState(null)
  const [editingVencimento, setEditingVencimento] = useState('')
  const [editingValor, setEditingValor] = useState('')
  const [editingField, setEditingField] = useState(null) // 'vencimento' ou 'valor'
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [categoriaFilter, setCategoriaFilter] = useState('all')
  const [mesFilter, setMesFilter] = useState('all')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  
  // Busca de empresa no formulário
  const [companySearch, setCompanySearch] = useState('')
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)

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
    mes: '',
    vencimento: ''
  })

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
    
    // Se for company admin ou gestor, auto-selecionar sua empresa
    const userCompanyId = getCurrentUserCompany()
    if (userCompanyId) {
      setCompanyFilter(userCompanyId)
    }
    
    fetchSaidas()
  }, [profile])

  useEffect(() => {
    fetchSaidas()
  }, [companyFilter, categoriaFilter])

  // Ler período personalizado dos query params (vindo do DFC Dashboard)
  useEffect(() => {
    const dataInicioParam = searchParams.get('dataInicio')
    const dataFimParam = searchParams.get('dataFim')
    
    if (dataInicioParam && dataFimParam) {
      setDataInicio(dataInicioParam)
      setDataFim(dataFimParam)
    }
  }, [searchParams])

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
      // Buscar categorias de saída (despesas)
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('dfc_categorias')
        .select('*')
        .eq('tipo', 'saida')
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

  const fetchSaidas = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('dfc_saidas')
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
          dfc_saidas_documentos (count)
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
      setSaidas(data || [])
    } catch (error) {
      console.error('Erro ao buscar saídas:', error)
      toast.error('Erro ao carregar saídas')
    } finally {
      setLoading(false)
    }
  }

  const fetchDocumentos = async (saidaId) => {
    try {
      const { data, error } = await supabase
        .from('dfc_saidas_documentos')
        .select('*')
        .eq('saida_id', saidaId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar documentos:', error)
      return []
    }
  }

  const openModal = async (saida = null) => {
    if (saida) {
      setEditingId(saida.id)
      setFormData({
        company_id: saida.company_id,
        categoria: saida.categoria,
        item_id: saida.item_id,
        descricao: saida.descricao,
        valor: saida.valor,
        mes: saida.mes.substring(0, 7), // Converter YYYY-MM-DD para YYYY-MM
        vencimento: saida.vencimento
      })
      // Buscar documentos da saída
      const docs = await fetchDocumentos(saida.id)
      setDocumentos(docs)
      
      // Se for lançamento parcelado, buscar as parcelas
      if (saida.is_parcelado) {
        setIsParcelado(true)
        setNumeroParcelas(saida.numero_parcelas)
        const parcelasData = await fetchParcelas(saida.id)
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
          .from('dfc_saidas')
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
              .from('dfc_saidas')
              .update({
                categoria: formData.categoria,
                item_id: formData.item_id,
                descricao: `${formData.descricao} - Parcela ${i + 1}/${numeroParcelas}`,
                valor: valorParcela,
                mes: mesParcela.toISOString().substring(0, 10),
                vencimento: vencimentoParcela.toISOString().substring(0, 10)
              })
              .eq('id', parcela.id)

            if (errorParcela) throw errorParcela
          }
          toast.success('Lançamento parcelado atualizado com sucesso!')
        } else {
          toast.success('Saída atualizada com sucesso!')
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

        const { data: newSaida, error } = await supabase
          .from('dfc_saidas')
          .insert([dataToSave])
          .select()
          .single()

        if (error) throw error
        
        // Upload de documentos
        if (uploadedFiles.length > 0) {
          await uploadDocumentos(newSaida.id)
        }
        
        toast.success('Saída registrada com sucesso!')
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
          mes: formData.mes + '-01',
          vencimento: formData.vencimento,
          is_parcelado: true,
          numero_parcelas: numeroParcelas,
          parcela_numero: null, // Pai não tem número de parcela
          lancamento_pai_id: null, // Pai não tem pai
          created_by: profile.id
        }

        const { data: paiCriado, error: errorPai } = await supabase
          .from('dfc_saidas')
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
          .from('dfc_saidas')
          .insert(parcelasFilhas)

        if (errorFilhas) throw errorFilhas
        toast.success(`Lançamento parcelado criado: ${numeroParcelas}x de ${formatCurrency(valorParcela)}`)
      }

      closeModal()
      fetchSaidas()
    } catch (error) {
      console.error('Erro ao salvar saída:', error)
      toast.error('Erro ao salvar saída: ' + error.message)
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

  const fetchParcelas = async (saidaId) => {
    try {
      const { data, error } = await supabase
        .from('dfc_saidas')
        .select('*')
        .eq('lancamento_pai_id', saidaId)
        .order('parcela_numero', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar parcelas:', error)
      toast.error('Erro ao carregar parcelas')
      return []
    }
  }

  const openParcelasModal = async (saida) => {
    if (!saida.is_parcelado) return
    
    setSelectedSaidaParcelas(saida)
    const parcelasData = await fetchParcelas(saida.id)
    setParcelas(parcelasData)
    setShowParcelasModal(true)
  }

  const closeParcelasModal = () => {
    setShowParcelasModal(false)
    setSelectedSaidaParcelas(null)
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
        .from('dfc_saidas')
        .update({ 
          valor: valorNumerico,
          vencimento: editingVencimento 
        })
        .eq('id', parcelaId)

      if (error) throw error

      // Recarregar parcelas
      const parcelasData = await fetchParcelas(selectedSaidaParcelas.id)
      
      // Calcular novo valor total somando todas as parcelas
      const valorTotal = parcelasData.reduce((sum, p) => sum + parseFloat(p.valor), 0)
      
      // Atualizar o lançamento pai no banco de dados
      const { error: updatePaiError } = await supabase
        .from('dfc_saidas')
        .update({ valor: valorTotal })
        .eq('id', selectedSaidaParcelas.id)
      
      if (updatePaiError) throw updatePaiError
      
      setParcelas(parcelasData)
      setSelectedSaidaParcelas({
        ...selectedSaidaParcelas,
        valor: valorTotal
      })
      
      // Recarregar lista de saídas para atualizar estatísticas
      await fetchSaidas()
      
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

  const uploadDocumentos = async (saidaId) => {
    if (uploadedFiles.length === 0) return

    try {
      setUploadingFiles(true)

      for (const file of uploadedFiles) {
        // Gerar nome único para o arquivo
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(7)
        const fileExt = file.name.split('.').pop()
        const fileName = `${timestamp}-${randomStr}.${fileExt}`
        const filePath = `dfc-documentos/${saidaId}/${fileName}`

        // Upload para o Storage
        const { error: uploadError } = await supabase.storage
          .from('dfc-documentos')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Salvar metadados no banco
        const { error: dbError } = await supabase
          .from('dfc_saidas_documentos')
          .insert([{
            saida_id: saidaId,
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
        .from('dfc_saidas_documentos')
        .delete()
        .eq('id', documento.id)

      if (dbError) throw dbError

      // Atualizar lista de documentos local
      setDocumentos(prev => prev.filter(d => d.id !== documento.id))
      
      // Atualizar contador na lista de saídas
      setSaidas(prev => prev.map(saida => {
        if (saida.id === documento.saida_id) {
          return {
            ...saida,
            dfc_saidas_documentos: [{
              count: Math.max(0, (saida.dfc_saidas_documentos?.[0]?.count || 1) - 1)
            }]
          }
        }
        return saida
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

  const openDocumentosModal = async (saida) => {
    setSelectedSaidaDocumentos(saida)
    const docs = await fetchDocumentos(saida.id)
    setDocumentos(docs)
    setShowDocumentosModal(true)
  }

  const closeDocumentosModal = () => {
    setShowDocumentosModal(false)
    setSelectedSaidaDocumentos(null)
    setDocumentos([])
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('dfc_saidas')
        .delete()
        .eq('id', deletingId)

      if (error) throw error
      toast.success('Saída excluída com sucesso!')
      fetchSaidas()
    } catch (error) {
      console.error('Erro ao excluir saída:', error)
      toast.error('Erro ao excluir saída')
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
    const rows = filteredSaidas.map(s => {
      const categoria = categorias.find(c => c.id === s.categoria)
      return [
        s.companies?.name || '-',
        categoria?.sigla || s.categoria,
        s.item,
        s.descricao,
        parseFloat(s.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        s.mes.substring(0, 7), // YYYY-MM
        new Date(s.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')
      ]
    })

    const csv = [headers, ...rows].map(row => row.join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `dfc_saidas_${new Date().toISOString().split('T')[0]}.csv`
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

  // Calcular período baseado no tipo selecionado
  const calcularPeriodo = () => {
    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    // Se o usuário preencheu período personalizado, usar ele
    if (dataInicio && dataFim) {
      return {
        inicio: dataInicio,
        fim: dataFim
      }
    }

    // Caso contrário, usar os últimos 6 meses como padrão
    const hoje = new Date()
    const hojeLimpo = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
    const ultimoDiaMesAtual = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    
    const fim = new Date(ultimoDiaMesAtual)
    const inicio = new Date(hojeLimpo)
    inicio.setMonth(inicio.getMonth() - 6)

    return {
      inicio: formatDate(inicio),
      fim: formatDate(fim)
    }
  }

  // Filtrar saídas
  const filteredSaidas = useMemo(() => {
    const periodo = calcularPeriodo()
    
    return saidas.filter(saida => {
      const itemNome = saida.dfc_itens?.nome || ''
      const matchSearch = !searchTerm || 
        saida.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itemNome.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Filtro por mês (se estiver usando)
      const matchMes = mesFilter === 'all' || mesFilter === '' || 
        saida.mes.substring(0, 7) === mesFilter
      
      // Filtro por período (usando data de vencimento)
      let matchPeriodo = true
      if (saida.vencimento) {
        const dataVencimento = new Date(saida.vencimento + 'T00:00:00')
        const dataInicioPeriodo = new Date(periodo.inicio + 'T00:00:00')
        const dataFimPeriodo = new Date(periodo.fim + 'T00:00:00')
        matchPeriodo = dataVencimento >= dataInicioPeriodo && dataVencimento <= dataFimPeriodo
      }
      
      return matchSearch && matchMes && matchPeriodo
    })
  }, [saidas, searchTerm, mesFilter, dataInicio, dataFim])

  // Calcular totais
  const totais = useMemo(() => {
    const total = filteredSaidas.reduce((sum, s) => sum + parseFloat(s.valor), 0)
    const porCategoria = {}
    
    filteredSaidas.forEach(s => {
      if (!porCategoria[s.categoria]) {
        porCategoria[s.categoria] = 0
      }
      porCategoria[s.categoria] += parseFloat(s.valor)
    })

    return { total, porCategoria }
  }, [filteredSaidas])

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
          <div className="flex items-center gap-3">
            <Link
              to={`/dfc${dataInicio && dataFim ? `?dataInicio=${dataInicio}&dataFim=${dataFim}` : ''}`}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all group"
              title="Voltar ao DFC"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-[#EBA500] transition-colors" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#373435]">
                DFC - Saídas Financeiras
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Demonstrativo de Fluxo de Caixa - Registro de Saídas
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

            <button
              onClick={() => openModal()}
              className="flex items-center space-x-2 px-4 py-2 bg-[#EBA500] text-white rounded-2xl hover:bg-[#EBA500]/90 transition-all font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Saída</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200/50 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Saídas</p>
              <p className="text-2xl font-bold text-[#373435] mt-1">{filteredSaidas.length}</p>
            </div>
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white border border-gray-200/50 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totais.total)}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-400" />
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

            <input
              type="month"
              value={mesFilter === 'all' ? '' : mesFilter}
              onChange={(e) => setMesFilter(e.target.value || 'all')}
              className="px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] transition-all"
              placeholder="Filtrar por mês"
            />
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
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-600">Data Fim</label>
                    <input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
                {dataInicio && dataFim && (() => {
                  const [yearI, monthI, dayI] = dataInicio.split('-')
                  const [yearF, monthF, dayF] = dataFim.split('-')
                  const dateI = new Date(parseInt(yearI), parseInt(monthI) - 1, parseInt(dayI))
                  const dateF = new Date(parseInt(yearF), parseInt(monthF) - 1, parseInt(dayF))
                  return (
                    <p className="text-xs text-red-600 mt-1">
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
            <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 mr-3 text-red-500" />
            Saídas Registradas ({filteredSaidas.length})
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
              {filteredSaidas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <TrendingDown className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma saída encontrada</h3>
                    <p className="text-gray-600">
                      {searchTerm || companyFilter !== 'all' || categoriaFilter !== 'all' || mesFilter !== 'all' || (dataInicio && dataFim)
                        ? 'Tente ajustar os filtros de busca ou período'
                        : 'Registre a primeira saída clicando em "Nova Saída"'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSaidas.map((saida) => (
                  <tr key={saida.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        {companyAvatars[saida.company_id] ? (
                          <img 
                            src={companyAvatars[saida.company_id]} 
                            alt={saida.companies?.name}
                            className="h-6 w-6 rounded object-cover mr-2 flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none'
                            }}
                          />
                        ) : null}
                        {!companyAvatars[saida.company_id] && (
                          <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                        )}
                        {saida.companies?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {categorias.find(c => c.id === saida.categoria)?.nome || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{saida.dfc_itens?.nome || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{saida.descricao}</span>
                      {saida.is_parcelado && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {saida.numero_parcelas}x de {formatCurrency(saida.valor / saida.numero_parcelas)}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-red-600">{formatCurrency(saida.valor)}</span>
                        {saida.is_parcelado && (
                          <span className="text-xs text-gray-500 mt-0.5">Valor total</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                        {formatMonth(saida.mes)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{formatDate(saida.vencimento)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {saida.is_parcelado && (
                          <button
                            onClick={() => openParcelasModal(saida)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Ver parcelas"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}
                        {saida.dfc_saidas_documentos?.[0]?.count > 0 && (
                          <button
                            onClick={() => openDocumentosModal(saida)}
                            className="relative text-blue-600 hover:text-blue-800"
                            title="Ver documentos"
                          >
                            <Paperclip className="h-4 w-4" />
                            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] rounded-full h-3.5 w-3.5 flex items-center justify-center">
                              {saida.dfc_saidas_documentos[0].count}
                            </span>
                          </button>
                        )}
                        <button
                          onClick={() => openModal(saida)}
                          className="text-[#EBA500] hover:text-[#EBA500]/80"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(saida.id)}
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
                    <TrendingDown className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {editingId ? 'Editar Saída' : 'Nova Saída'}
                    </h2>
                    <p className="text-sm text-white/90 mt-1">Preencha os dados da saída financeira</p>
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
                            Valor por parcela: {formData.valor ? formatCurrency(parseFloat(formData.valor) / numeroParcelas) : 'R$ 0,00'}
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
                                        {formatCurrency(valorParcela)}
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
                                  {formatCurrency(valorParcela)}
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
                    Tem certeza que deseja excluir esta saída?
                  </p>
                  <p className="text-sm text-gray-600">
                    Esta ação não pode ser desfeita. A saída será removida permanentemente do sistema.
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
                <span>Excluir Saída</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização de Documentos */}
      {showDocumentosModal && selectedSaidaDocumentos && (
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
                      {selectedSaidaDocumentos.companies?.name} - {selectedSaidaDocumentos.dfc_itens?.nome}
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
      {showParcelasModal && selectedSaidaParcelas && (
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
                      {selectedSaidaParcelas.descricao}
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
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedSaidaParcelas.valor)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Número de Parcelas</p>
                  <p className="text-lg font-bold text-gray-900">{selectedSaidaParcelas.numero_parcelas}x</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Valor por Parcela</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(selectedSaidaParcelas.valor / selectedSaidaParcelas.numero_parcelas)}
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
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {parcela.parcela_numero}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="text-sm font-semibold text-gray-900">
                                Parcela {parcela.parcela_numero}/{selectedSaidaParcelas.numero_parcelas}
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
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(parcela.valor)}</p>
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
    </div>
  )
}

export default DFCPage
