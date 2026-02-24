import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import SuperAdminBanner from '../components/SuperAdminBanner'
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  BookOpen,
  AlertCircle,
  X,
  Save,
  Tag,
  List,
  ChevronDown,
  Building2,
  ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'

// Estilos de animação para modais
const modalStyles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`

function PlanoContasPage() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const [categorias, setCategorias] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [showDeleteCategoriaModal, setShowDeleteCategoriaModal] = useState(false)
  const [deletingItem, setDeletingItem] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [editingCategoria, setEditingCategoria] = useState(null)
  const [deletingCategoria, setDeletingCategoria] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState('all')
  
  // Inicializar companyFilter com valor da URL se existir
  const initialCompanyFilter = searchParams.get('company') || searchParams.get('companyId') || 'all'
  const [companyFilter, setCompanyFilter] = useState(initialCompanyFilter)
  
  const [collapsedCategories, setCollapsedCategories] = useState({})
  const [companySearchTerm, setCompanySearchTerm] = useState('') // Busca no modal
  const [multipleMode, setMultipleMode] = useState(false) // Modo de criação múltipla
  const [multipleNames, setMultipleNames] = useState('') // Nomes múltiplos (um por linha)

  // Formulário de item
  const [formData, setFormData] = useState({
    company_ids: [], // Array de IDs de empresas
    categoria_id: '',
    nome: '',
    descricao: ''
  })

  // Formulário de categoria
  const [categoriaFormData, setCategoriaFormData] = useState({
    nome: '',
    tipo: 'saida',
    descricao: ''
  })

  const isSuperAdmin = () => profile?.role === 'super_admin'
  
  const isCompanyAdmin = () => {
    return profile?.user_companies?.some(uc => uc.role === 'company_admin' && uc.is_active) || false
  }
  
  const isGestor = () => {
    return profile?.user_companies?.some(uc => uc.role === 'gestor' && uc.is_active) || false
  }
  
  const isAuthorized = () => isSuperAdmin() || isCompanyAdmin() || isGestor()
  
  const getCompanyAdminCompany = () => {
    if (!isCompanyAdmin()) return null
    const adminCompany = profile?.user_companies?.find(
      uc => uc.role === 'company_admin' && uc.is_active
    )
    return adminCompany?.company_id || null
  }

  const getGestorCompany = () => {
    if (!isGestor()) return null
    const gestorCompany = profile?.user_companies?.find(
      uc => uc.role === 'gestor' && uc.is_active
    )
    return gestorCompany?.company_id || null
  }

  const getCurrentUserCompany = () => {
    return getCompanyAdminCompany() || getGestorCompany()
  }

  // Verificar se o item pode ser editado/deletado pelo usuário
  const canEditItem = (item) => {
    // Super admin pode editar tudo
    if (isSuperAdmin()) return true
    
    // Company admin e gestor só podem editar itens associados à sua empresa OU globais
    if (isCompanyAdmin() || isGestor()) {
      const userCompanyId = getCurrentUserCompany()
      // Verifica se o item está associado à empresa do usuário OU se é global (sem empresas)
      return item.empresas?.some(empresa => empresa.id === userCompanyId) || 
             item.empresas?.length === 0 || 
             false
    }
    
    return false
  }

  const toggleCategory = (categoriaId) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoriaId]: !prev[categoriaId]
    }))
  }

  useEffect(() => {
    if (isAuthorized()) {
      fetchCompanies()
      fetchCategorias()
      
      // Sincronizar companyFilter com a URL quando mudar
      const companyFromUrl = searchParams.get('company') || searchParams.get('companyId')
      
      if (companyFromUrl && companyFromUrl !== 'all' && companyFromUrl !== companyFilter) {
        // Se há company na URL e é diferente do atual, usar ele
        setCompanyFilter(companyFromUrl)
      } else if (!companyFromUrl && (isCompanyAdmin() || isGestor())) {
        // Se não há company na URL, auto-selecionar empresa para company_admin e gestor
        const companyId = getCurrentUserCompany()
        if (companyId && companyFilter === 'all') {
          setCompanyFilter(companyId)
        }
      }
    }
  }, [profile, searchParams])

  useEffect(() => {
    if (isAuthorized() && companies.length > 0) {
      fetchCategorias()
    }
  }, [companyFilter])

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
      toast.error('Erro ao carregar empresas')
    }
  }

  const fetchCategorias = async () => {
    try {
      setLoading(true)
      
      // Buscar categorias
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('dfc_categorias')
        .select('*')
        .order('nome')

      if (categoriasError) throw categoriasError

      // Buscar itens
      const { data: itensData, error: itensError } = await supabase
        .from('dfc_itens')
        .select('*')
        .order('nome')

      if (itensError) throw itensError

      console.log('🔍 DEBUG ROLE - Role do usuário:', profile?.role)
      console.log('🔍 DEBUG ROLE - É super admin?', isSuperAdmin())
      console.log('🔍 DEBUG ROLE - É company admin?', isCompanyAdmin())

      // Buscar associações conforme permissões do usuário
      const { data: empresasData, error: empresasError } = await supabase
        .from('dfc_itens_empresas')
        .select('item_id, company_id, companies(id, name)')

      if (empresasError) {
        console.error('❌ ERRO ao buscar associações:', empresasError)
        throw empresasError
      }

      // Para company_admin, precisamos identificar quais itens são REALMENTE globais
      // (não têm nenhuma associação em dfc_itens_empresas)
      let idsItensComAssociacoes = []
      if (isCompanyAdmin() && !isSuperAdmin()) {
        // Usar RPC function que ignora RLS para obter TODOS os IDs de itens com associações
        const { data: todosIdsComAssociacao, error: errorIds } = await supabase
          .rpc('get_itens_com_associacoes')
        
        if (!errorIds && todosIdsComAssociacao) {
          idsItensComAssociacoes = todosIdsComAssociacao.map(r => r.item_id)
          console.log('🔑 DEBUG IDS - Total de itens com associações (qualquer empresa):', idsItensComAssociacoes.length)
        } else if (errorIds) {
          console.error('⚠️ AVISO: Não foi possível buscar IDs de itens com associações:', errorIds)
          console.log('💡 Execute o SQL: sql/create_rpc_get_itens_com_associacoes.sql no Supabase')
        }
      }

      console.log('📊 DEBUG ASSOCIAÇÕES - Total de itens:', itensData?.length)
      console.log('📊 DEBUG ASSOCIAÇÕES - Total de associações retornadas:', empresasData?.length)
      console.log('📊 DEBUG ASSOCIAÇÕES - Dados:', empresasData)

      // Agrupar empresas por item
      const empresasPorItem = {}
      empresasData?.forEach(rel => {
        if (!empresasPorItem[rel.item_id]) {
          empresasPorItem[rel.item_id] = []
        }
        empresasPorItem[rel.item_id].push(rel.companies)
      })

      console.log('🔗 DEBUG AGRUPAMENTO - Empresas agrupadas por item:', empresasPorItem)
      console.log('🔗 DEBUG AGRUPAMENTO - Total de itens com empresas:', Object.keys(empresasPorItem).length)

      // Combinar itens com suas empresas
      let itensComEmpresas = itensData.map(item => ({
        ...item,
        empresas: empresasPorItem[item.id] || []
      }))

      console.log('🏷️ DEBUG ITENS - Exemplo de itens com empresas:', itensComEmpresas.slice(0, 3))
      console.log('🏷️ DEBUG ITENS - Itens com empresa.length > 0:', itensComEmpresas.filter(i => i.empresas.length > 0).length)
      console.log('🏷️ DEBUG ITENS - Itens globais (sem empresa):', itensComEmpresas.filter(i => i.empresas.length === 0).length)

      // FILTRO CRÍTICO: Para company_admin, mostrar APENAS itens da sua empresa + itens globais
      if (isCompanyAdmin() && !isSuperAdmin() && idsItensComAssociacoes.length > 0) {
        const itensAntes = itensComEmpresas.length
        itensComEmpresas = itensComEmpresas.filter(item => {
          // Mostrar se:
          // 1. Item tem associação visível (da empresa do usuário) OU
          // 2. Item é realmente global (não tem nenhuma associação)
          const temAssociacaoVisivel = item.empresas.length > 0
          const eRealmenteGlobal = !idsItensComAssociacoes.includes(item.id)
          return temAssociacaoVisivel || eRealmenteGlobal
        })
        const itensDepois = itensComEmpresas.length
        const itensOcultados = itensAntes - itensDepois
        console.log(`🔒 FILTRO COMPANY_ADMIN - Ocultados ${itensOcultados} itens de outras empresas (${itensAntes} → ${itensDepois})`)
      }

      // Filtrar itens se há filtro de empresa (mas sempre incluir itens globais)
      const itensFiltrados = companyFilter !== 'all'
        ? itensComEmpresas.filter(item => 
            item.empresas.some(emp => emp.id === companyFilter) || // Itens da empresa específica
            item.empresas.length === 0  // OU itens globais (sem nenhuma empresa associada)
          )
        : itensComEmpresas

      // Organizar itens por categoria
      const categoriasComItens = (categoriasData || []).map(cat => ({
        ...cat,
        itens: itensFiltrados.filter(item => item.categoria_id === cat.id)
      }))

      setCategorias(categoriasComItens)
      
      // Inicializar todas categorias como fechadas
      const initialCollapsed = {}
      categoriasComItens.forEach(cat => {
        initialCollapsed[cat.id] = true
      })
      setCollapsedCategories(initialCollapsed)
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      toast.error('Erro ao carregar plano de contas')
    } finally {
      setLoading(false)
    }
  }

  const openModal = async (item = null, categoriaId = null) => {
    if (item) {
      setEditingItem(item)
      
      // Buscar empresas associadas ao item
      const { data: empresasAssociadas } = await supabase
        .from('dfc_itens_empresas')
        .select('company_id')
        .eq('item_id', item.id)

      setFormData({
        company_ids: empresasAssociadas?.map(e => e.company_id) || [],
        categoria_id: item.categoria_id,
        nome: item.nome,
        descricao: item.descricao || ''
      })
    } else {
      setEditingItem(null)
      const userCompanyId = getCurrentUserCompany()
      const companyIds = userCompanyId ? [userCompanyId] : (companyFilter !== 'all' ? [companyFilter] : [])
      
      setFormData({
        company_ids: companyIds,
        categoria_id: categoriaId || '',
        nome: '',
        descricao: ''
      })
    }
    setShowModal(true)
  }

  const associarItensGlobaisEmMassa = async () => {
    if (companyFilter === 'all') {
      toast.error('Selecione uma empresa específica no filtro')
      return
    }

    try {
      // Buscar itens globais (sem associação com nenhuma empresa)
      const { data: todasAssociacoes } = await supabase
        .from('dfc_itens_empresas')
        .select('item_id')
      
      const idsComAssociacao = new Set(todasAssociacoes?.map(a => a.item_id) || [])
      
      // Filtrar itens que não têm associação
      const { data: todosItens } = await supabase
        .from('dfc_itens')
        .select('id, nome')
      
      const itensGlobais = todosItens?.filter(item => !idsComAssociacao.has(item.id)) || []
      
      if (itensGlobais.length === 0) {
        toast.success('Não há itens globais para associar!')
        return
      }

      const confirmar = window.confirm(
        `Deseja associar ${itensGlobais.length} itens globais à empresa selecionada?\n\n` +
        `Isso criará vínculos para todos os itens que não estão associados a nenhuma empresa.`
      )

      if (!confirmar) return

      // Criar associações em massa
      const associacoes = itensGlobais.map(item => ({
        item_id: item.id,
        company_id: companyFilter,
        created_by: profile.id
      }))

      const { error } = await supabase
        .from('dfc_itens_empresas')
        .insert(associacoes)

      if (error) throw error

      toast.success(`${itensGlobais.length} itens associados com sucesso!`)
      fetchCategorias()
    } catch (error) {
      console.error('Erro ao associar itens:', error)
      toast.error('Erro ao associar itens: ' + error.message)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setCompanySearchTerm('') // Limpar busca
    setMultipleMode(false) // Resetar modo múltiplo
    setMultipleNames('') // Limpar nomes múltiplos
    setFormData({
      company_ids: [],
      categoria_id: '',
      nome: '',
      descricao: ''
    })
  }

  const openCategoriaModal = (categoria = null) => {
    if (categoria) {
      setEditingCategoria(categoria)
      setCategoriaFormData({
        nome: categoria.nome,
        tipo: categoria.tipo || 'saida',
        descricao: categoria.descricao || ''
      })
    } else {
      setEditingCategoria(null)
      setCategoriaFormData({
        nome: '',
        tipo: 'saida',
        descricao: ''
      })
    }
    setShowCategoriaModal(true)
  }

  const closeCategoriaModal = () => {
    setShowCategoriaModal(false)
    setEditingCategoria(null)
    setCategoriaFormData({
      nome: '',
      tipo: 'saida',
      descricao: ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    console.log('🚀 SUBMIT - Iniciando criação/edição de item')
    console.log('🚀 SUBMIT - company_ids:', formData.company_ids)
    console.log('🚀 SUBMIT - Total empresas selecionadas:', formData.company_ids.length)

    if (!formData.categoria_id) {
      toast.error('Selecione uma categoria')
      return
    }

    // Validação para modo múltiplo
    if (multipleMode) {
      const names = multipleNames.split('\n').filter(n => n.trim())
      if (names.length === 0) {
        toast.error('Digite ao menos um nome de item')
        return
      }
    } else {
      // Validação para modo único
      if (!formData.nome) {
        toast.error('Preencha o nome do item')
        return
      }
    }

    try {
      // Modo múltiplo - criar vários itens
      if (multipleMode) {
        const names = multipleNames.split('\n').filter(n => n.trim())
        
        const itemsToCreate = names.map(name => ({
          categoria_id: formData.categoria_id,
          nome: name.trim(),
          descricao: formData.descricao?.trim() || null,
          created_by: profile.id
        }))

        // Criar todos os itens
        const { data: createdItems, error: itemsError } = await supabase
          .from('dfc_itens')
          .insert(itemsToCreate)
          .select()

        if (itemsError) throw itemsError

        console.log('✅ MÚLTIPLO - Itens criados:', createdItems.length)
        console.log('✅ MÚLTIPLO - Empresas para associar:', formData.company_ids)

        // Criar associações se houver empresas selecionadas
        if (formData.company_ids.length > 0) {
          const allAssociations = []
          createdItems.forEach(item => {
            formData.company_ids.forEach(companyId => {
              allAssociations.push({
                item_id: item.id,
                company_id: companyId,
                created_by: profile.id
              })
            })
          })

          console.log('💾 MÚLTIPLO - Associações a inserir:', allAssociations.length)

          const { error: associacoesError } = await supabase
            .from('dfc_itens_empresas')
            .insert(allAssociations)

          if (associacoesError) {
            console.error('❌ MÚLTIPLO - Erro ao inserir associações:', associacoesError)
            throw associacoesError
          }
          
          console.log('✅ MÚLTIPLO - Associações inseridas com sucesso!')
        } else {
          console.log('⚠️ MÚLTIPLO - Nenhuma empresa selecionada, itens serão GLOBAIS')
        }

        toast.success(`${createdItems.length} itens criados com sucesso!`)
      } else {
        // Modo único - criar/editar um item
        const dataToSave = {
          categoria_id: formData.categoria_id,
          nome: formData.nome.trim(),
          descricao: formData.descricao?.trim() || null,
          created_by: profile.id
        }

        let itemId

        if (editingItem) {
          // Atualizar item
          const { error } = await supabase
            .from('dfc_itens')
            .update(dataToSave)
            .eq('id', editingItem.id)

          if (error) throw error
          itemId = editingItem.id

          // Remover associações antigas
          await supabase
            .from('dfc_itens_empresas')
            .delete()
            .eq('item_id', itemId)
        } else {
          // Criar novo item
          const { data: newItem, error } = await supabase
            .from('dfc_itens')
            .insert([dataToSave])
            .select()
            .single()

          if (error) throw error
          itemId = newItem.id
          console.log('✅ ÚNICO - Item criado com ID:', itemId)
        }

        console.log('💾 ÚNICO - Empresas para associar:', formData.company_ids)

        // Inserir novas associações item-empresa (apenas se houver empresas selecionadas)
        if (formData.company_ids.length > 0) {
          const associacoes = formData.company_ids.map(companyId => ({
            item_id: itemId,
            company_id: companyId,
            created_by: profile.id
          }))

          console.log('💾 ÚNICO - Associações a inserir:', associacoes)

          const { error: associacoesError } = await supabase
            .from('dfc_itens_empresas')
            .insert(associacoes)

          if (associacoesError) {
            console.error('❌ ÚNICO - Erro ao inserir associações:', associacoesError)
            throw associacoesError
          }
          
          console.log('✅ ÚNICO - Associações inseridas com sucesso!')
        } else {
          console.log('⚠️ ÚNICO - Nenhuma empresa selecionada, item será GLOBAL')
        }

        toast.success(editingItem ? 'Item atualizado com sucesso!' : 'Item criado com sucesso!')
      }

      closeModal()
      fetchCategorias()
    } catch (error) {
      console.error('Erro ao salvar item:', error)
      toast.error('Erro ao salvar item: ' + error.message)
    }
  }

  const handleCategoriaSubmit = async (e) => {
    e.preventDefault()

    if (!categoriaFormData.nome) {
      toast.error('Preencha o nome da categoria')
      return
    }
    
    try {
      const dataToSave = {
        nome: categoriaFormData.nome.trim(),
        tipo: categoriaFormData.tipo,
        descricao: categoriaFormData.descricao?.trim() || null,
        created_by: profile.id
      }

      if (editingCategoria) {
        // Atualizar
        const { error } = await supabase
          .from('dfc_categorias')
          .update(dataToSave)
          .eq('id', editingCategoria.id)

        if (error) throw error
        toast.success('Categoria atualizada com sucesso!')
      } else {
        // Criar
        const { error } = await supabase
          .from('dfc_categorias')
          .insert([dataToSave])

        if (error) throw error
        toast.success('Categoria criada com sucesso!')
      }

      closeCategoriaModal()
      fetchCategorias()
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      toast.error('Erro ao salvar categoria: ' + error.message)
    }
  }

  const handleDelete = (item) => {
    setDeletingItem(item)
    setShowDeleteModal(true)
  }

  const handleDeleteCategoria = (categoria) => {
    setDeletingCategoria(categoria)
    setShowDeleteCategoriaModal(true)
  }

  const confirmDelete = async () => {
    try {
      // Primeiro, deletar todas as entradas e saídas relacionadas
      const { error: entradasError } = await supabase
        .from('dfc_entradas')
        .delete()
        .eq('item_id', deletingItem.id)

      if (entradasError) throw entradasError

      const { error: saidasError } = await supabase
        .from('dfc_saidas')
        .delete()
        .eq('item_id', deletingItem.id)

      if (saidasError) throw saidasError

      // Depois, deletar as associações item-empresa
      const { error: associacoesError } = await supabase
        .from('dfc_itens_empresas')
        .delete()
        .eq('item_id', deletingItem.id)

      if (associacoesError) throw associacoesError

      // Por fim, deletar o item
      const { error } = await supabase
        .from('dfc_itens')
        .delete()
        .eq('id', deletingItem.id)

      if (error) throw error
      toast.success('Item excluído com sucesso!')
      fetchCategorias()
    } catch (error) {
      console.error('Erro ao excluir item:', error)
      toast.error('Erro ao excluir item: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setShowDeleteModal(false)
      setDeletingItem(null)
    }
  }

  const confirmDeleteCategoria = async () => {
    try {
      const { error } = await supabase
        .from('dfc_categorias')
        .delete()
        .eq('id', deletingCategoria.id)

      if (error) throw error
      toast.success('Categoria excluída com sucesso!')
      fetchCategorias()
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
      toast.error('Erro ao excluir categoria: ' + error.message)
    } finally {
      setShowDeleteCategoriaModal(false)
      setDeletingCategoria(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setDeletingItem(null)
  }

  const cancelDeleteCategoria = () => {
    setShowDeleteCategoriaModal(false)
    setDeletingCategoria(null)
  }

  // Filtrar categorias
  const filteredCategorias = categorias.filter(cat => {
    if (categoriaFilter !== 'all' && cat.id !== categoriaFilter) return false
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const nomeMatch = cat.nome.toLowerCase().includes(searchLower)
      const itemMatch = cat.itens.some(item => 
        item.nome.toLowerCase().includes(searchLower)
      )
      return nomeMatch || itemMatch
    }
    
    return true
  })

  if (!isAuthorized()) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Apenas Administradores podem acessar esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{modalStyles}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SuperAdminBanner />
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                to={(() => {
                  if (searchParams.get('from') === 'admin') {
                    const cid = searchParams.get('companyId') || searchParams.get('company')
                    if (cid) return `/dfc?companyId=${cid}&from=admin`
                  }
                  return '/dfc'
                })()}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all group"
                title="Voltar ao DFC"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-[#EBA500] transition-colors" />
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#373435]">
                  Plano de Contas
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Gerenciar categorias e itens do DFC
                </p>
              </div>
            </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {isSuperAdmin() && (
              <>
                <button
                  onClick={() => openCategoriaModal()}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-[#373435] text-white rounded-2xl hover:bg-[#373435]/90 transition-all font-medium"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nova Categoria</span>
                </button>
                <button
                  onClick={() => openModal()}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-[#EBA500] text-white rounded-2xl hover:bg-[#EBA500]/90 transition-all font-medium"
                >
                  <Plus className="h-4 w-4" />
                  <span>Novo Item</span>
                </button>
                {companyFilter !== 'all' && (
                  <button
                    onClick={associarItensGlobaisEmMassa}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-medium text-sm"
                    title="Associar todos os itens globais à empresa selecionada"
                  >
                    <Building2 className="h-4 w-4" />
                    <span>Associar Globais</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por categoria ou item..."
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
            <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-700 font-medium flex items-center">
              <Building2 className="h-4 w-4 mr-2" />
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
              <option key={cat.id} value={cat.id}>{cat.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200/50 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Categorias</p>
              <p className="text-2xl font-bold text-[#373435] mt-1">{categorias.length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white border border-gray-200/50 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Itens</p>
              <p className="text-2xl font-bold text-[#373435] mt-1">
                {categorias.reduce((total, cat) => total + cat.itens.length, 0)}
              </p>
            </div>
            <List className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Lista de Categorias e Itens */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white border border-gray-200/50 rounded-2xl p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500] mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        ) : filteredCategorias.length === 0 ? (
          <div className="bg-white border border-gray-200/50 rounded-2xl p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma categoria encontrada</h3>
            <p className="text-gray-600">
              {searchTerm || categoriaFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Adicione a primeira categoria'}
            </p>
          </div>
        ) : (
          filteredCategorias.map(categoria => (
            <div key={categoria.id} className="bg-white border border-gray-200/50 rounded-2xl overflow-hidden">
              {/* Header da Categoria */}
              <div className="bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/5 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleCategory(categoria.id)}
                    className="flex items-center space-x-3 flex-1 text-left hover:opacity-80 transition-opacity"
                  >
                    <div className="p-2 bg-[#EBA500]/20 rounded-xl">
                      <Tag className="h-5 w-5 text-[#EBA500]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#373435]">
                        {categoria.nome}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">{categoria.itens.length} {categoria.itens.length === 1 ? 'item' : 'itens'}</p>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${
                      collapsedCategories[categoria.id] ? 'rotate-0' : 'rotate-180'
                    }`} />
                  </button>
                  
                  {/* Botões de ação */}
                  <div className="flex items-center space-x-2 ml-3">
                    {isSuperAdmin() && (
                      <>
                        <button
                          onClick={() => openCategoriaModal(categoria)}
                          className="p-1.5 text-gray-600 hover:bg-gray-200/50 rounded-lg transition-colors"
                          title="Editar categoria"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategoria(categoria)}
                          className="p-1.5 text-red-600 hover:bg-red-100/50 rounded-lg transition-colors"
                          title="Excluir categoria"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    
                    {/* Botão Adicionar Item para todos os perfis autorizados */}
                    <button
                      onClick={() => openModal(null, categoria.id)}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-[#EBA500] text-white rounded-xl hover:bg-[#EBA500]/90 transition-all text-sm font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Adicionar Item</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de Itens */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                collapsedCategories[categoria.id] ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
              }`}>
                <div className="p-4">
                  {categoria.itens.length === 0 ? (
                    <div className="text-center py-6">
                      <List className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Nenhum item cadastrado nesta categoria</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                      {categoria.itens.map(item => (
                        <div
                          key={item.id}
                          className="group border border-gray-200 rounded-lg p-2.5 hover:border-[#EBA500]/30 hover:shadow-sm transition-all bg-white"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">{item.nome}</h4>
                              {item.empresas && item.empresas.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.empresas.map((empresa, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-block px-1.5 py-0.5 text-xs bg-blue-50 text-blue-600 rounded border border-blue-200"
                                    >
                                      {empresa.name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  <span className="inline-block px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded border border-gray-300">
                                    🌐 Global (Todas as empresas)
                                  </span>
                                </div>
                              )}
                              {item.descricao && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.descricao}</p>
                              )}
                            </div>
                            {canEditItem(item) && (
                              <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button
                                  onClick={() => openModal(item)}
                                  className="p-1 text-[#EBA500] hover:bg-[#EBA500]/10 rounded transition-all"
                                  title="Editar item"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                                  title="Excluir item"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Formulário */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-200" 
          onClick={closeModal}
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'slideUp 0.3s ease-out' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#EBA500] to-[#EBA500]/80 px-6 py-5 flex-shrink-0 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Tag className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {editingItem ? 'Editar Item' : 'Novo Item'}
                    </h2>
                    <p className="text-sm text-white/90 mt-1">Preencha os dados do item</p>
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

            {/* Formulário com Scroll */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Empresas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empresas 
                    {isSuperAdmin() && (
                      <span className="ml-2 text-xs font-normal">
                        {formData.company_ids.length > 0 ? (
                          <span className="text-blue-600 font-semibold">
                            ✓ {formData.company_ids.length} empresa(s) selecionada(s)
                          </span>
                        ) : (
                          <span className="text-amber-600 font-semibold">
                            ⚠️ Nenhuma empresa (item será global)
                          </span>
                        )}
                      </span>
                    )}
                  </label>
                  
                  {/* Para Company Admin e Gestor - Apenas mostrar sua empresa */}
                  {(isCompanyAdmin() || isGestor()) ? (
                    <div className="px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 font-medium flex items-center">
                      <Building2 className="h-4 w-4 mr-2" />
                      {companies.find(c => c.id === getCurrentUserCompany())?.name || 'Empresa'}
                    </div>
                  ) : (
                    /* Para Super Admin - Seleção múltipla */
                    <>
                      {/* Barra de Busca */}
                      {companies.length > 3 && (
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={companySearchTerm}
                        onChange={(e) => setCompanySearchTerm(e.target.value)}
                        placeholder="Buscar empresa..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]"
                      />
                      {companySearchTerm && (
                        <button
                          type="button"
                          onClick={() => setCompanySearchTerm('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <X className="h-3.5 w-3.5 text-gray-400" />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="border border-gray-300 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1 bg-gray-50">
                    {companies.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-2">Nenhuma empresa disponível</p>
                    ) : (
                      (() => {
                        const filteredCompanies = companies.filter(company =>
                          company.name.toLowerCase().includes(companySearchTerm.toLowerCase())
                        )
                        
                        if (filteredCompanies.length === 0) {
                          return (
                            <p className="text-sm text-gray-500 text-center py-2">
                              Nenhuma empresa encontrada
                            </p>
                          )
                        }
                        
                        return filteredCompanies.map(company => (
                          <label
                            key={company.id}
                            className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.company_ids.includes(company.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    company_ids: [...formData.company_ids, company.id]
                                  })
                                } else {
                                  setFormData({
                                    ...formData,
                                    company_ids: formData.company_ids.filter(id => id !== company.id)
                                  })
                                }
                              }}
                              className="h-4 w-4 text-[#EBA500] border-gray-300 rounded focus:ring-[#EBA500]"
                            />
                            <span className="text-sm text-gray-700">{company.name}</span>
                          </label>
                        ))
                      })()
                    )}
                  </div>
                    </>
                  )}
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    value={formData.categoria_id}
                    onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Modo de criação (apenas ao criar novo, não ao editar) */}
                {!editingItem && (
                  <div className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!multipleMode}
                        onChange={() => setMultipleMode(false)}
                        className="h-4 w-4 text-[#EBA500] border-gray-300 focus:ring-[#EBA500]"
                      />
                      <span className="text-sm font-medium text-gray-700">Criar item único</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={multipleMode}
                        onChange={() => setMultipleMode(true)}
                        className="h-4 w-4 text-[#EBA500] border-gray-300 focus:ring-[#EBA500]"
                      />
                      <span className="text-sm font-medium text-gray-700">Criar múltiplos itens</span>
                    </label>
                  </div>
                )}

                {/* Modo único - Nome e Descrição */}
                {!multipleMode ? (
                  <>
                    {/* Nome */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome do Item *
                      </label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]"
                        placeholder="Ex: Simples Nacional, Aluguel, etc."
                        required
                      />
                    </div>

                    {/* Descrição */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrição (Opcional)
                      </label>
                      <textarea
                        value={formData.descricao}
                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] resize-none"
                        rows="3"
                        placeholder="Descrição adicional do item..."
                      />
                    </div>
                  </>
                ) : (
                  /* Modo múltiplo - Lista de nomes */
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomes dos Itens * <span className="text-xs text-gray-500">(Um por linha)</span>
                    </label>
                    <textarea
                      value={multipleNames}
                      onChange={(e) => setMultipleNames(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] resize-none font-mono text-sm"
                      placeholder="Salários&#10;Encargos Sociais&#10;Comissões&#10;Férias&#10;13º Salário"
                      rows={8}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {multipleNames.split('\n').filter(n => n.trim()).length} itens para criar
                    </p>
                  </div>
                )}
              </div>

              {/* Alerta de Status da Associação - Para Super Admin */}
              {isSuperAdmin() && (
                <div className={`px-4 py-3 rounded-xl border-2 ${
                  formData.company_ids.length > 0 
                    ? 'bg-blue-50 border-blue-300 text-blue-800' 
                    : 'bg-amber-50 border-amber-300 text-amber-800'
                }`}>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      {formData.company_ids.length > 0 ? (
                        <>
                          <p className="font-semibold text-sm">Item será associado a {formData.company_ids.length} empresa(s)</p>
                          <p className="text-xs mt-1">
                            Visível apenas para: {companies.filter(c => formData.company_ids.includes(c.id)).map(c => c.name).join(', ')}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-sm">⚠️ Item será GLOBAL (sem empresa)</p>
                          <p className="text-xs mt-1">
                            Visível para TODAS as empresas. Selecione empresas acima para restringir o acesso.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer - Agora dentro do form */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end space-x-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-4 py-2 bg-[#EBA500] text-white rounded-xl hover:bg-[#EBA500]/90 transition-all font-medium shadow-lg hover:shadow-xl"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingItem ? 'Atualizar' : 'Salvar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all overflow-hidden" style={{ animation: 'slideUp 0.3s ease-out' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 rounded-t-3xl">
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
                    Tem certeza que deseja excluir o item "{deletingItem?.nome}"?
                  </p>
                  <p className="text-sm text-gray-600">
                    Esta ação não pode ser desfeita. O item será removido permanentemente do plano de contas.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-3xl flex justify-end space-x-3">
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
                <span>Excluir Item</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Categoria (Criar/Editar) */}
      {showCategoriaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl transform transition-all overflow-hidden" style={{ animation: 'slideUp 0.3s ease-out' }}>
            {/* Header */}
            <div className="bg-gradient-to-br from-[#EBA500] via-[#EBA500] to-[#d69500] px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <Tag className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
                    </h3>
                    <p className="text-white/80 text-sm mt-0.5">
                      {editingCategoria ? 'Atualize as informações da categoria' : 'Preencha os dados da nova categoria'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeCategoriaModal}
                  className="text-white hover:bg-white/20 rounded-xl p-2 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCategoriaSubmit} className="p-8">
              <div className="space-y-6">
                {/* Nome */}
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    Nome da Categoria
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={categoriaFormData.nome}
                      onChange={(e) => setCategoriaFormData({ ...categoriaFormData, nome: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] transition-all text-gray-900 font-medium"
                      placeholder="Ex: Despesas Comerciais"
                      required
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">Nome completo que será exibido no sistema</p>
                </div>

                {/* Tipo */}
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    Tipo de Categoria
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={categoriaFormData.tipo}
                      onChange={(e) => setCategoriaFormData({ ...categoriaFormData, tipo: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] transition-all text-gray-900 font-medium appearance-none bg-white"
                      required
                    >
                      <option value="saida">Saída (Despesas)</option>
                      <option value="entrada">Entrada (Receitas)</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">Define se a categoria é para entradas (receitas) ou saídas (despesas)</p>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descrição
                    <span className="text-gray-400 ml-1 font-normal">(Opcional)</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={categoriaFormData.descricao}
                      onChange={(e) => setCategoriaFormData({ ...categoriaFormData, descricao: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] transition-all text-gray-900 resize-none"
                      rows="4"
                      placeholder="Adicione detalhes sobre esta categoria..."
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">Informações adicionais para identificar melhor a categoria</p>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="border-t-2 border-gray-100 px-8 py-5 bg-gradient-to-b from-gray-50 to-white rounded-b-3xl flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeCategoriaModal}
                className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleCategoriaSubmit}
                className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-[#EBA500] to-[#d69500] text-white rounded-xl hover:from-[#d69500] hover:to-[#c78900] transition-all font-semibold shadow-lg shadow-[#EBA500]/30"
              >
                <Save className="h-4 w-4" />
                <span>{editingCategoria ? 'Atualizar Categoria' : 'Salvar Categoria'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Categoria */}
      {showDeleteCategoriaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all overflow-hidden" style={{ animation: 'slideUp 0.3s ease-out' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <AlertCircle className="h-6 w-6 mr-2" />
                  Confirmar Exclusão
                </h3>
                <button
                  onClick={cancelDeleteCategoria}
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
                    Tem certeza que deseja excluir a categoria "{deletingCategoria?.nome}"?
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    Esta ação não pode ser desfeita. A categoria e TODOS os seus itens serão removidos permanentemente.
                  </p>
                  {deletingCategoria?.itens?.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800 font-medium flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Esta categoria possui {deletingCategoria.itens.length} {deletingCategoria.itens.length === 1 ? 'item' : 'itens'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-3xl flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelDeleteCategoria}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteCategoria}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium"
              >
                <Trash2 className="h-4 w-4" />
                <span>Excluir Categoria</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}

export default PlanoContasPage
