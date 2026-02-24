import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../contexts/AuthContext'
import {
  Building2,
  Target,
  FileText,
  TrendingUp,
  TrendingDown,
  Grid3x3,
  BarChart3,
  Users,
  ArrowRight,
  Wallet,
  ListChecks,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  Mail,
  Phone,
  Globe,
  Briefcase,
  Calendar,
  MapPin,
  Hash,
  Upload,
  Image as ImageIcon,
  Save,
  Plus,
  ChevronUp,
  Check,
  CreditCard
} from 'lucide-react'
import toast from 'react-hot-toast'

const COMPANY_TYPES = {
  'micro': { label: 'Micro Empresa', color: 'green' },
  'pequena': { label: 'Pequena Empresa', color: 'blue' },
  'media': { label: 'Média Empresa', color: 'purple' },
  'grande': { label: 'Grande Empresa', color: 'red' }
}

const CompanyDashboardPage = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isSuperAdmin } = usePermissions()
  const { user } = useAuth()
  
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [logoUrls, setLogoUrls] = useState({})
  const [permissionChecked, setPermissionChecked] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [companyStats, setCompanyStats] = useState({ usersCount: 0, evaluationsCount: 0 })

  // Estados do formulário de criação inline
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createIsInternational, setCreateIsInternational] = useState(false)
  const [createLogoFile, setCreateLogoFile] = useState(null)
  const [createLogoPreview, setCreateLogoPreview] = useState(null)
  const [createFormData, setCreateFormData] = useState({
    name: '',
    nome_fantasia: '',
    cnpj: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    size: 'pequena',
    inscricao_estadual: '',
    inscricao_municipal: '',
    num_colaboradores: '',
    regime_tributario: '',
    contribuinte_icms: '',
    is_partner_client: '',
    representante: { nome: '', email: '', telefone: '', endereco: '', cpf: '' },
    contato_cobranca: { nome: '', cargo: '', email: '', telefone: '' },
    melhor_dia_pagamento: '',
    forma_pagamento: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zip: '',
      country: 'Brasil'
    }
  })

  // Verificar permissão apenas uma vez
  useEffect(() => {
    if (!isSuperAdmin()) {
      navigate('/dashboard')
    } else {
      setPermissionChecked(true)
    }
  }, [])

  // Buscar empresas após verificação de permissão
  useEffect(() => {
    if (permissionChecked) {
      fetchCompanies()
    }
  }, [permissionChecked])

  // Tentar recuperar empresa selecionada da URL
  useEffect(() => {
    const companyId = searchParams.get('company') || searchParams.get('companyId')
    if (companyId && companies.length > 0) {
      const company = companies.find(c => c.id === companyId)
      if (company && company.id !== selectedCompany?.id) {
        setSelectedCompany(company)
      }
    }
  }, [searchParams, companies])

  const handleCreateInputChange = (field, value) => {
    if (field.startsWith('address.')) {
      const addressField = field.replace('address.', '')
      setCreateFormData(prev => ({ ...prev, address: { ...prev.address, [addressField]: value } }))
    } else if (field.startsWith('representante.')) {
      const subField = field.replace('representante.', '')
      setCreateFormData(prev => ({ ...prev, representante: { ...prev.representante, [subField]: value } }))
    } else if (field.startsWith('contato_cobranca.')) {
      const subField = field.replace('contato_cobranca.', '')
      setCreateFormData(prev => ({ ...prev, contato_cobranca: { ...prev.contato_cobranca, [subField]: value } }))
    } else {
      setCreateFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleCreateLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) { toast.error('Tipo inválido. Use JPG, PNG, GIF ou WEBP'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Máximo 5MB'); return }
    setCreateLogoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setCreateLogoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleRemoveCreateLogo = () => {
    setCreateLogoFile(null)
    setCreateLogoPreview(null)
  }

  const clearCreateForm = () => {
    setCreateFormData({
      name: '', nome_fantasia: '', cnpj: '', email: '', phone: '', website: '', industry: '', size: 'pequena',
      inscricao_estadual: '', inscricao_municipal: '', num_colaboradores: '', regime_tributario: '',
      contribuinte_icms: '', is_partner_client: '',
      representante: { nome: '', email: '', telefone: '', endereco: '', cpf: '' },
      contato_cobranca: { nome: '', cargo: '', email: '', telefone: '' },
      melhor_dia_pagamento: '', forma_pagamento: '',
      address: { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip: '', country: 'Brasil' }
    })
    setCreateLogoFile(null)
    setCreateLogoPreview(null)
    setCreateIsInternational(false)
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!createFormData.name.trim()) { toast.error('Razão Social é obrigatória'); return }
    if (!createFormData.cnpj.trim()) { toast.error('CNPJ é obrigatório'); return }
    if (!createIsInternational && !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(createFormData.cnpj)) {
      toast.error('CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX'); return
    }
    if (!createFormData.address.street.trim()) { toast.error('Endereço é obrigatório'); return }
    if (!createFormData.address.city.trim()) { toast.error('Cidade é obrigatória'); return }
    if (!createFormData.address.state.trim()) { toast.error('Estado é obrigatório'); return }
    if (!createFormData.address.zip.trim()) { toast.error('CEP é obrigatório'); return }
    if (!createFormData.phone.trim()) { toast.error('Telefone da empresa é obrigatório'); return }
    if (!createFormData.regime_tributario) { toast.error('Regime tributário é obrigatório'); return }
    if (!createFormData.contribuinte_icms) { toast.error('Contribuinte do ICMS é obrigatório'); return }
    if (!createFormData.melhor_dia_pagamento) { toast.error('Melhor dia para pagamento é obrigatório'); return }
    if (!createFormData.forma_pagamento) { toast.error('Forma de pagamento é obrigatória'); return }
    if (!createFormData.representante.nome.trim()) { toast.error('Nome do representante legal é obrigatório'); return }
    if (!createFormData.representante.email.trim()) { toast.error('E-mail do representante legal é obrigatório'); return }
    if (!createFormData.representante.telefone.trim()) { toast.error('Telefone do representante legal é obrigatório'); return }
    if (!createFormData.representante.endereco.trim()) { toast.error('Endereço do representante legal é obrigatório'); return }
    if (!createFormData.representante.cpf.trim()) { toast.error('CPF do representante legal é obrigatório'); return }
    if (!createFormData.contato_cobranca.nome.trim()) { toast.error('Nome do contato de cobrança é obrigatório'); return }
    if (!createFormData.contato_cobranca.cargo.trim()) { toast.error('Cargo do contato de cobrança é obrigatório'); return }
    if (!createFormData.contato_cobranca.email.trim()) { toast.error('E-mail do contato de cobrança é obrigatório'); return }
    if (!createFormData.contato_cobranca.telefone.trim()) { toast.error('Telefone do contato de cobrança é obrigatório'); return }
    if (!createFormData.email.trim()) { toast.error('Email da empresa é obrigatório'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createFormData.email)) { toast.error('Email inválido'); return }

    setCreateLoading(true)
    try {
      let logoUrl = null
      if (createLogoFile) {
        const fileExt = createLogoFile.name.split('.').pop()
        const filePath = `${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('company-avatars').upload(filePath, createLogoFile, { cacheControl: '3600', upsert: false })
        if (uploadError) throw new Error(`Erro no upload do logo: ${uploadError.message}`)
        logoUrl = filePath
      }

      const companyData = {
        name: createFormData.name.trim(),
        nome_fantasia: createFormData.nome_fantasia.trim() || null,
        cnpj: createFormData.cnpj.trim() || null,
        email: createFormData.email.trim(),
        phone: createFormData.phone.trim() || null,
        website: createFormData.website.trim() || null,
        industry: createFormData.industry.trim() || null,
        size: createFormData.size,
        inscricao_estadual: createFormData.inscricao_estadual.trim() || null,
        inscricao_municipal: createFormData.inscricao_municipal.trim() || null,
        num_colaboradores: createFormData.num_colaboradores ? parseInt(createFormData.num_colaboradores) || null : null,
        regime_tributario: createFormData.regime_tributario || null,
        contribuinte_icms: createFormData.contribuinte_icms || null,
        is_partner_client: createFormData.is_partner_client === 'sim',
        representante_legal: createFormData.representante,
        contato_cobranca: createFormData.contato_cobranca,
        melhor_dia_pagamento: createFormData.melhor_dia_pagamento.trim() || null,
        forma_pagamento: createFormData.forma_pagamento || null,
        address: Object.values(createFormData.address).some(v => v.trim()) ? createFormData.address : null,
        logo_url: logoUrl,
        created_by: user?.id,
        subscription_plan: 'basic',
        subscription_status: 'active',
        is_active: true
      }

      const { data, error } = await supabase.from('companies').insert([companyData]).select().single()
      if (error) {
        if (logoUrl) await supabase.storage.from('company-avatars').remove([logoUrl])
        throw error
      }

      toast.success(`✅ Empresa "${data.name}" criada com sucesso!`)
      clearCreateForm()
      setShowCreateForm(false)
      await fetchCompanies()
      setSelectedCompany(data)
    } catch (error) {
      if (error.message?.includes('cnpj')) toast.error('CNPJ já está em uso')
      else if (error.message?.includes('email')) toast.error('Email já está em uso')
      else toast.error(`Erro: ${error.message}`)
    } finally {
      setCreateLoading(false)
    }
  }

  // Buscar estatísticas quando empresa é selecionada
  useEffect(() => {
    if (selectedCompany) {
      fetchCompanyStats(selectedCompany.id)
    }
  }, [selectedCompany])

  const fetchCompanyStats = async (companyId) => {
    try {
      // Contar usuários ativos da empresa
      const { count: usersCount, error: usersError } = await supabase
        .from('user_companies')
        .select('user_id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_active', true)

      if (usersError) throw usersError

      // Contar avaliações de processos da empresa
      const { count: evaluationsCount, error: evaluationsError } = await supabase
        .from('process_evaluations')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)

      if (evaluationsError) throw evaluationsError

      setCompanyStats({
        usersCount: usersCount || 0,
        evaluationsCount: evaluationsCount || 0
      })
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      setCompanyStats({ usersCount: 0, evaluationsCount: 0 })
    }
  }

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name')

      if (error) throw error
      setCompanies(data || [])
      
      // Carregar logos
      if (data && data.length > 0) {
        const urls = {}
        for (const company of data) {
          if (company.logo_url) {
            try {
              const { data: signedUrlData } = await supabase.storage
                .from('company-avatars')
                .createSignedUrl(company.logo_url, 3600) // 1 hora
              
              if (signedUrlData?.signedUrl) {
                urls[company.id] = signedUrlData.signedUrl
              }
            } catch (err) {
              console.error(`Erro ao carregar logo da empresa ${company.id}:`, err)
            }
          }
        }
        setLogoUrls(urls)
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
      toast.error('Erro ao carregar empresas')
    } finally {
      setLoading(false)
    }
  }

  const handleCompanySelect = (company) => {
    setSelectedCompany(company)
    setSearchParams({ company: company.id })
  }

  const handleViewDetails = () => {
    setShowDetailsModal(true)
  }

  const handleEdit = () => {
    setShowEditModal(true)
  }

  const handleDelete = async () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', selectedCompany.id)

      if (error) throw error

      toast.success('Empresa excluída com sucesso')
      setShowDeleteModal(false)
      setSelectedCompany(null)
      fetchCompanies()
    } catch (error) {
      console.error('Erro ao excluir empresa:', error)
      toast.error('Erro ao excluir empresa')
    }
  }

  const handleUpdateCompany = async (companyId, updatedData) => {
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('companies')
        .update(updatedData)
        .eq('id', companyId)

      if (error) throw error

      toast.success('Empresa atualizada com sucesso!')
      setShowEditModal(false)
      
      // Atualizar a empresa selecionada
      setSelectedCompany({ ...selectedCompany, ...updatedData })
      
      // Recarregar lista de empresas
      await fetchCompanies()
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error)
      toast.error('Erro ao atualizar empresa')
      throw error
    } finally {
      setUpdating(false)
    }
  }

  const navigateToModule = (path, companyId) => {
    const company = companies.find(c => c.id === companyId)
    
    // Lógica especial para Planejamento Estratégico, Políticas, Indicadores, Avaliação de Desempenho, DFC, Journey Management e Admin Users
    if (path === '/planejamento-estrategico' || 
        path === '/operational-policies' || 
        path === '/indicators' || 
        path === '/performance-evaluation' ||
        path === '/dfc' ||
        path === '/journey-management/overview' ||
        path === '/business-model' ||
        path === '/admin/users') {
      sessionStorage.setItem('superAdminContext', JSON.stringify({
        companyId: company.id,
        companyName: company.name,
        returnUrl: '/admin/company-dashboard'
      }))
      navigate(`${path}?companyId=${companyId}&from=admin`)
    } else {
      // Para outros módulos, usar query param normal
      navigate(`${path}?company=${companyId}`)
    }
  }

  const modules = [
    {
      category: 'Gestão Estratégica',
      color: 'purple',
      items: [
        {
          name: 'Planejamento Estratégico',
          description: 'Gerencie objetivos, metas e indicadores estratégicos',
          icon: Target,
          path: '/planejamento-estrategico',
          color: 'purple'
        },
        {
          name: 'Políticas Operacionais',
          description: 'Configure políticas e processos de gestão',
          icon: FileText,
          path: '/operational-policies',
          color: 'green'
        }
      ]
    },
    {
      category: 'Indicadores e Performance',
      color: 'blue',
      items: [
        {
          name: 'Indicadores de Gestão',
          description: 'Monitore KPIs e indicadores de performance',
          icon: TrendingUp,
          path: '/indicators',
          color: 'yellow'
        },
        {
          name: 'Avaliação de Desempenho',
          description: 'Avalie o amadurecimento e desempenho organizacional',
          icon: Grid3x3,
          path: '/performance-evaluation',
          color: 'blue'
        }
      ]
    },
    {
      category: 'Gestão Financeira',
      color: 'green',
      items: [
        {
          name: 'DFC - Dashboard',
          description: 'Visão geral do fluxo de caixa',
          icon: BarChart3,
          path: '/dfc',
          color: 'indigo'
        }
      ]
    },
    {
      category: 'Jornadas e Processos',
      color: 'orange',
      items: [
        {
          name: 'Diagnóstico de Gestão',
          description: 'Gerencie jornadas e processos da empresa',
          icon: Target,
          path: '/journey-management/overview',
          color: 'orange'
        },
        {
          name: 'Modelo de Negócio',
          description: 'Canvas do modelo de negócio da empresa',
          icon: Briefcase,
          path: '/business-model',
          color: 'purple'
        }
      ]
    },
    {
      category: 'Administração',
      color: 'gray',
      items: [
        {
          name: 'Usuários da Empresa',
          description: 'Gerencie usuários e permissões',
          icon: Users,
          path: '/admin/users',
          color: 'gray'
        }
      ]
    }
  ]

  const getColorClasses = (color) => {
    const colors = {
      purple: {
        bg: 'from-purple-500 to-purple-600',
        hover: 'hover:from-purple-600 hover:to-purple-700',
        border: 'border-purple-200',
        text: 'text-purple-600',
        lightBg: 'bg-purple-50'
      },
      green: {
        bg: 'from-green-500 to-green-600',
        hover: 'hover:from-green-600 hover:to-green-700',
        border: 'border-green-200',
        text: 'text-green-600',
        lightBg: 'bg-green-50'
      },
      blue: {
        bg: 'from-blue-500 to-blue-600',
        hover: 'hover:from-blue-600 hover:to-blue-700',
        border: 'border-blue-200',
        text: 'text-blue-600',
        lightBg: 'bg-blue-50'
      },
      yellow: {
        bg: 'from-[#EBA500] to-yellow-600',
        hover: 'hover:from-yellow-600 hover:to-yellow-700',
        border: 'border-yellow-200',
        text: 'text-[#EBA500]',
        lightBg: 'bg-yellow-50'
      },
      indigo: {
        bg: 'from-indigo-500 to-indigo-600',
        hover: 'hover:from-indigo-600 hover:to-indigo-700',
        border: 'border-indigo-200',
        text: 'text-indigo-600',
        lightBg: 'bg-indigo-50'
      },
      red: {
        bg: 'from-red-500 to-red-600',
        hover: 'hover:from-red-600 hover:to-red-700',
        border: 'border-red-200',
        text: 'text-red-600',
        lightBg: 'bg-red-50'
      },
      orange: {
        bg: 'from-orange-500 to-orange-600',
        hover: 'hover:from-orange-600 hover:to-orange-700',
        border: 'border-orange-200',
        text: 'text-orange-600',
        lightBg: 'bg-orange-50'
      },
      slate: {
        bg: 'from-slate-500 to-slate-600',
        hover: 'hover:from-slate-600 hover:to-slate-700',
        border: 'border-slate-200',
        text: 'text-slate-600',
        lightBg: 'bg-slate-50'
      },
      gray: {
        bg: 'from-gray-500 to-gray-600',
        hover: 'hover:from-gray-600 hover:to-gray-700',
        border: 'border-gray-200',
        text: 'text-gray-600',
        lightBg: 'bg-gray-50'
      }
    }
    return colors[color] || colors.gray
  }

  if (!permissionChecked || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500]"></div>
      </div>
    )
  }

  // Criar lista plana de todos os módulos
  const allModules = modules.flatMap(category => 
    category.items.map(item => ({
      ...item,
      categoryColor: category.color
    }))
  )

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Módulos - Mostrado acima quando empresa selecionada */}
        {selectedCompany && (
          <div className="mb-8 bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#EBA500]" />
                Módulos de {selectedCompany.name}
              </h2>
              
              <div className="flex items-center gap-4">
                {/* Estatísticas */}
                <div className="flex gap-3 pr-3 border-r border-gray-200">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-[#373435]">
                      {companyStats.usersCount}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center justify-center">
                      <Users className="h-3 w-3 mr-1" />
                      Usuários
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-[#373435]">
                      {companyStats.evaluationsCount}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center justify-center">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Aval.
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-2">
                  <button
                    onClick={handleViewDetails}
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    title="Ver Detalhes"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleEdit}
                    className="p-2 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors"
                    title="Editar Empresa"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    title="Excluir Empresa"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-4">
              {allModules.map((module, idx) => {
                const Icon = module.icon
                const colors = getColorClasses(module.color)
                
                return (
                  <button
                    key={idx}
                    onClick={() => navigateToModule(module.path, selectedCompany.id)}
                    className="group bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 hover:border-[#EBA500] hover:shadow-lg transition-all duration-200 flex flex-col items-center gap-3"
                  >
                    <div className={`p-3 rounded-lg ${colors.lightBg} group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className={`h-6 w-6 ${colors.text}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 text-center leading-tight">
                      {module.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Seletor de Empresa */}
        <div className="mb-8 bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Selecione a Empresa
          </label>
          
          {/* Barra de Busca */}
          <div className="mb-4 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar empresa por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EBA500] focus:border-transparent transition-all"
            />
          </div>

          {/* Lista de Empresas */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {companies
              .filter(company => 
                company.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((company) => (
              <button
                key={company.id}
                onClick={() => handleCompanySelect(company)}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left
                  ${selectedCompany?.id === company.id
                    ? 'border-[#EBA500] bg-gradient-to-r from-[#EBA500]/10 to-yellow-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
                  }
                `}
              >
                {/* Logo */}
                <div className={`
                  h-16 w-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden
                  ${selectedCompany?.id === company.id
                    ? 'bg-gradient-to-br from-[#EBA500] to-yellow-600'
                    : 'bg-gradient-to-br from-gray-100 to-gray-200'
                  }
                `}>
                  {logoUrls[company.id] ? (
                    <img 
                      src={logoUrls[company.id]} 
                      alt={company.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className={`h-8 w-8 ${selectedCompany?.id === company.id ? 'text-white' : 'text-gray-500'}`} />
                  )}
                </div>

                {/* Informações */}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-lg ${selectedCompany?.id === company.id ? 'text-gray-900' : 'text-gray-700'}`}>
                    {company.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {company.size ? `${company.size.charAt(0).toUpperCase() + company.size.slice(1)} Empresa` : 'Empresa'}
                    {company.cnpj && ` • CNPJ: ${company.cnpj}`}
                  </p>
                </div>

                {/* Checkmark */}
                {selectedCompany?.id === company.id && (
                  <div className="flex-shrink-0">
                    <div className="bg-[#EBA500] rounded-full p-2">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}
            
            {/* Mensagem quando não há resultados */}
            {companies.filter(company => 
              company.name.toLowerCase().includes(searchTerm.toLowerCase())
            ).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Nenhuma empresa encontrada</p>
                <p className="text-sm mt-1">Tente buscar com outro termo</p>
              </div>
            )}
          </div>
        </div>

        {/* Botão + Formulário de Criação de Empresa */}
        <div className="mb-8">
          <button
            onClick={() => { setShowCreateForm(v => !v); if (showCreateForm) clearCreateForm() }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 hover:border-[#EBA500] hover:text-[#EBA500] transition-all duration-200 text-sm font-medium"
          >
            {showCreateForm ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showCreateForm ? 'Ocultar formulário' : 'Criar Nova Empresa'}
          </button>

          {showCreateForm && (
            <div className="mt-4 bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Header do form */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#EBA500]/10">
                    <Building2 className="h-5 w-5 text-[#EBA500]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Nova Empresa</h3>
                    <p className="text-sm text-gray-500">Cadastre uma nova empresa no sistema</p>
                  </div>
                </div>
                {/* Toggle Internacional */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createIsInternational}
                    onChange={(e) => {
                      setCreateIsInternational(e.target.checked)
                      if (e.target.checked) {
                        handleCreateInputChange('cnpj', '')
                        handleCreateInputChange('address.zip', '')
                        handleCreateInputChange('address.country', '')
                      } else {
                        handleCreateInputChange('address.country', 'Brasil')
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EBA500]"></div>
                  <span className="ms-2 text-xs font-medium text-gray-700">🌍 Internacional</span>
                </label>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-6">

                {/* Upload de Logo */}
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
                    <ImageIcon className="h-4 w-4" /> Logo da Empresa (Opcional)
                  </label>
                  {!createLogoPreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-[#EBA500]/50 transition-all">
                      <Upload className="h-7 w-7 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500"><span className="font-medium">Clique para upload</span> · PNG, JPG, GIF, WEBP (max 5MB)</p>
                      <input type="file" className="hidden" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleCreateLogoChange} />
                    </label>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <img src={createLogoPreview} alt="Preview" className="w-16 h-16 object-contain rounded-lg bg-white border border-gray-200" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{createLogoFile?.name}</p>
                        <p className="text-xs text-gray-500">{(createLogoFile?.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button type="button" onClick={handleRemoveCreateLogo} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Informações Básicas */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#EBA500]" /> Informações Básicas
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Razão Social *</label>
                      <input type="text" value={createFormData.name} onChange={e => handleCreateInputChange('name', e.target.value)} placeholder="Ex: Empresa ABC Ltda" required className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nome Fantasia</label>
                      <input type="text" value={createFormData.nome_fantasia} onChange={e => handleCreateInputChange('nome_fantasia', e.target.value)} placeholder="Ex: ABC Soluções" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{createIsInternational ? 'Documento Fiscal (Tax ID)' : 'CNPJ *'}</label>
                      <input type="text" value={createFormData.cnpj} onChange={e => handleCreateInputChange('cnpj', e.target.value)} placeholder={createIsInternational ? 'Ex: 12-3456789' : '00.000.000/0000-00'} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Porte</label>
                      <select value={createFormData.size} onChange={e => handleCreateInputChange('size', e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] bg-white">
                        <option value="micro">Microempresa</option>
                        <option value="pequena">Pequena Empresa</option>
                        <option value="media">Média Empresa</option>
                        <option value="grande">Grande Empresa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Segmento</label>
                      <input type="text" value={createFormData.industry} onChange={e => handleCreateInputChange('industry', e.target.value)} placeholder="Ex: Tecnologia, Varejo, Serviços..." className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nº de Colaboradores</label>
                      <input type="number" min="0" value={createFormData.num_colaboradores} onChange={e => handleCreateInputChange('num_colaboradores', e.target.value)} placeholder="Ex: 25" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                  </div>
                </div>

                {/* Contato */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#EBA500]" /> Informações de Contato
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email Principal *</label>
                      <input type="email" value={createFormData.email} onChange={e => handleCreateInputChange('email', e.target.value)} placeholder="contato@empresa.com" required className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Telefone da Empresa (com DDD) *</label>
                      <input type="tel" value={createFormData.phone} onChange={e => handleCreateInputChange('phone', e.target.value)} placeholder={createIsInternational ? '+1 234 567-8900' : '(11) 99999-9999'} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
                      <input type="url" value={createFormData.website} onChange={e => handleCreateInputChange('website', e.target.value)} placeholder="https://www.empresa.com.br" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#EBA500]" /> Endereço *
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">País</label>
                      <input type="text" value={createFormData.address.country} onChange={e => handleCreateInputChange('address.country', e.target.value)} placeholder={createIsInternational ? 'Ex: Portugal' : 'Brasil'} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Logradouro</label>
                      <input type="text" value={createFormData.address.street} onChange={e => handleCreateInputChange('address.street', e.target.value)} placeholder="Rua, Avenida..." className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Número</label>
                      <input type="text" value={createFormData.address.number} onChange={e => handleCreateInputChange('address.number', e.target.value)} placeholder="123" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Complemento</label>
                      <input type="text" value={createFormData.address.complement} onChange={e => handleCreateInputChange('address.complement', e.target.value)} placeholder="Sala, Apto..." className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Bairro</label>
                      <input type="text" value={createFormData.address.neighborhood} onChange={e => handleCreateInputChange('address.neighborhood', e.target.value)} placeholder="Centro" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cidade</label>
                      <input type="text" value={createFormData.address.city} onChange={e => handleCreateInputChange('address.city', e.target.value)} placeholder="São Paulo" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{createIsInternational ? 'Estado/Região' : 'Estado'}</label>
                      <input type="text" value={createFormData.address.state} onChange={e => handleCreateInputChange('address.state', e.target.value)} placeholder={createIsInternational ? 'California' : 'SP'} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{createIsInternational ? 'Código Postal / ZIP' : 'CEP'}</label>
                      <input type="text" value={createFormData.address.zip} onChange={e => handleCreateInputChange('address.zip', e.target.value)} placeholder={createIsInternational ? '90210' : '00000-000'} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                  </div>
                </div>

                {/* Dados Fiscais */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Hash className="h-4 w-4 text-[#EBA500]" /> Dados Fiscais
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Inscrição Estadual *</label>
                      <input type="text" value={createFormData.inscricao_estadual} onChange={e => handleCreateInputChange('inscricao_estadual', e.target.value)} placeholder="Ex: 123.456.789.000 ou ISENTO" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Inscrição Municipal *</label>
                      <input type="text" value={createFormData.inscricao_municipal} onChange={e => handleCreateInputChange('inscricao_municipal', e.target.value)} placeholder="Ex: 12345678" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Regime Tributário *</label>
                      <select value={createFormData.regime_tributario} onChange={e => handleCreateInputChange('regime_tributario', e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] bg-white">
                        <option value="">Selecione...</option>
                        <option value="simples_nacional">Simples Nacional</option>
                        <option value="lucro_real">Lucro Real</option>
                        <option value="lucro_presumido">Lucro Presumido</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Contribuinte do ICMS *</label>
                      <select value={createFormData.contribuinte_icms} onChange={e => handleCreateInputChange('contribuinte_icms', e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] bg-white">
                        <option value="">Selecione...</option>
                        <option value="contribuinte">Contribuinte</option>
                        <option value="contribuinte_isento">Contribuinte Isento</option>
                        <option value="nao_contribuinte">Não Contribuinte</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">É cliente Partner?</label>
                      <select value={createFormData.is_partner_client} onChange={e => handleCreateInputChange('is_partner_client', e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] bg-white">
                        <option value="">Selecione...</option>
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Representante Legal */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#EBA500]" /> Representante Legal
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nome Completo *</label>
                      <input type="text" value={createFormData.representante.nome} onChange={e => handleCreateInputChange('representante.nome', e.target.value)} placeholder="Ex: João da Silva" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">CPF *</label>
                      <input type="text" value={createFormData.representante.cpf} onChange={e => handleCreateInputChange('representante.cpf', e.target.value)} placeholder="000.000.000-00" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Telefone (com DDD) *</label>
                      <input type="tel" value={createFormData.representante.telefone} onChange={e => handleCreateInputChange('representante.telefone', e.target.value)} placeholder="(11) 99999-9999" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">E-mail *</label>
                      <input type="email" value={createFormData.representante.email} onChange={e => handleCreateInputChange('representante.email', e.target.value)} placeholder="representante@empresa.com" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Endereço Completo *</label>
                      <input type="text" value={createFormData.representante.endereco} onChange={e => handleCreateInputChange('representante.endereco', e.target.value)} placeholder="Rua, nº, bairro, cidade – estado" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                  </div>
                </div>

                {/* Contato para NF / Cobrança */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#EBA500]" /> Contato para NF / Cobrança
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nome Completo *</label>
                      <input type="text" value={createFormData.contato_cobranca.nome} onChange={e => handleCreateInputChange('contato_cobranca.nome', e.target.value)} placeholder="Ex: Maria Souza" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cargo *</label>
                      <input type="text" value={createFormData.contato_cobranca.cargo} onChange={e => handleCreateInputChange('contato_cobranca.cargo', e.target.value)} placeholder="Ex: Financeiro" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">E-mail *</label>
                      <input type="email" value={createFormData.contato_cobranca.email} onChange={e => handleCreateInputChange('contato_cobranca.email', e.target.value)} placeholder="financeiro@empresa.com" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Telefone (com DDD) *</label>
                      <input type="tel" value={createFormData.contato_cobranca.telefone} onChange={e => handleCreateInputChange('contato_cobranca.telefone', e.target.value)} placeholder="(11) 99999-9999" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                  </div>
                </div>

                {/* Condições de Pagamento */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-[#EBA500]" /> Condições de Pagamento
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Melhor Dia para Pagamento *</label>
                      <input type="text" value={createFormData.melhor_dia_pagamento} onChange={e => handleCreateInputChange('melhor_dia_pagamento', e.target.value)} placeholder="Ex: dia 10" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Forma de Pagamento *</label>
                      <input type="text" value={createFormData.forma_pagamento} onChange={e => handleCreateInputChange('forma_pagamento', e.target.value)} placeholder="Ex: Boleto, Cartão de Crédito" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]" />
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => { setShowCreateForm(false); clearCreateForm() }}
                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors disabled:opacity-60"
                  >
                    {createLoading ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Criando...</>
                    ) : (
                      <><Save className="h-4 w-4" /> Criar Empresa</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal de Detalhes */}
        {showDetailsModal && selectedCompany && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[75vh] shadow-2xl flex flex-col overflow-hidden">
              {/* Header com Gradiente */}
              <div className="relative bg-gradient-to-br from-[#EBA500] via-yellow-500 to-yellow-600 p-6 rounded-t-3xl flex-shrink-0">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-xl transition-all duration-200 group"
                >
                  <X className="h-6 w-6 text-white group-hover:rotate-90 transition-transform duration-200" />
                </button>
                
                <div className="flex items-center gap-4">
                  {/* Logo */}
                  <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-lg ring-2 ring-white/30">
                    {logoUrls[selectedCompany.id] ? (
                      <img
                        src={logoUrls[selectedCompany.id]}
                        alt={selectedCompany.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-7 w-7 text-white" />
                    )}
                  </div>
                  
                  {/* Nome e Badge */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">{selectedCompany.name}</h3>
                    {selectedCompany.size && (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium text-sm">
                        <Briefcase className="h-4 w-4" />
                        {selectedCompany.size.charAt(0).toUpperCase() + selectedCompany.size.slice(1)} Empresa
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Conteúdo com Scroll */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-custom">
                {/* Informações Básicas */}
                <div>
                  <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#EBA500]" />
                    Informações Básicas
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedCompany.cnpj && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Hash className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">CNPJ</label>
                          <p className="text-gray-900 font-semibold mt-1">{selectedCompany.cnpj}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedCompany.industry && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Briefcase className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Setor</label>
                          <p className="text-gray-900 font-semibold mt-1">{selectedCompany.industry}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedCompany.created_at && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cadastro</label>
                          <p className="text-gray-900 font-semibold mt-1">
                            {new Date(selectedCompany.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contato */}
                {(selectedCompany.email || selectedCompany.phone || selectedCompany.website) && (
                  <div>
                    <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Phone className="h-5 w-5 text-[#EBA500]" />
                      Informações de Contato
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedCompany.email && (
                        <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-all">
                          <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                            <Mail className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Email</label>
                            <p className="text-gray-900 font-semibold mt-1 break-all">{selectedCompany.email}</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedCompany.phone && (
                        <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:shadow-md transition-all">
                          <div className="p-2 bg-green-500 rounded-lg shadow-sm">
                            <Phone className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <label className="text-xs font-semibold text-green-700 uppercase tracking-wide">Telefone</label>
                            <p className="text-gray-900 font-semibold mt-1">{selectedCompany.phone}</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedCompany.website && (
                        <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:shadow-md transition-all">
                          <div className="p-2 bg-purple-500 rounded-lg shadow-sm">
                            <Globe className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <label className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Website</label>
                            <a 
                              href={selectedCompany.website.startsWith('http') ? selectedCompany.website : `https://${selectedCompany.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 font-semibold mt-1 hover:underline break-all block"
                            >
                              {selectedCompany.website}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Endereço (se houver) */}
                {selectedCompany.address && (
                  <div>
                    <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-[#EBA500]" />
                      Localização
                    </h4>
                    <div className="p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-500 rounded-lg shadow-sm">
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          {(selectedCompany.address.street || selectedCompany.address.number) && (
                            <p className="text-gray-900 font-semibold">
                              {[selectedCompany.address.street, selectedCompany.address.number]
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                          )}
                          {selectedCompany.address.complement && (
                            <p className="text-gray-700 text-sm mt-1">{selectedCompany.address.complement}</p>
                          )}
                          {selectedCompany.address.neighborhood && (
                            <p className="text-gray-700 text-sm mt-1">{selectedCompany.address.neighborhood}</p>
                          )}
                          <p className="text-gray-700 mt-1">
                            {[
                              selectedCompany.address.city, 
                              selectedCompany.address.state, 
                              selectedCompany.address.zip,
                              selectedCompany.address.country
                            ]
                              .filter(Boolean)
                              .join(' - ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Dados Fiscais */}
                {(selectedCompany.nome_fantasia || selectedCompany.inscricao_estadual || selectedCompany.inscricao_municipal || selectedCompany.num_colaboradores || selectedCompany.regime_tributario || selectedCompany.contribuinte_icms || selectedCompany.is_partner_client != null) && (
                  <div>
                    <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Hash className="h-5 w-5 text-[#EBA500]" /> Dados Fiscais
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedCompany.nome_fantasia && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-indigo-100 rounded-lg"><Building2 className="h-4 w-4 text-indigo-600" /></div>
                          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome Fantasia</label><p className="text-gray-900 font-semibold mt-1">{selectedCompany.nome_fantasia}</p></div>
                        </div>
                      )}
                      {selectedCompany.num_colaboradores && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-blue-100 rounded-lg"><Users className="h-4 w-4 text-blue-600" /></div>
                          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nº Colaboradores</label><p className="text-gray-900 font-semibold mt-1">{selectedCompany.num_colaboradores}</p></div>
                        </div>
                      )}
                      {selectedCompany.inscricao_estadual && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-yellow-100 rounded-lg"><Hash className="h-4 w-4 text-yellow-600" /></div>
                          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Inscrição Estadual</label><p className="text-gray-900 font-semibold mt-1">{selectedCompany.inscricao_estadual}</p></div>
                        </div>
                      )}
                      {selectedCompany.inscricao_municipal && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-yellow-100 rounded-lg"><Hash className="h-4 w-4 text-yellow-600" /></div>
                          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Inscrição Municipal</label><p className="text-gray-900 font-semibold mt-1">{selectedCompany.inscricao_municipal}</p></div>
                        </div>
                      )}
                      {selectedCompany.regime_tributario && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-green-100 rounded-lg"><Briefcase className="h-4 w-4 text-green-600" /></div>
                          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Regime Tributário</label>
                            <p className="text-gray-900 font-semibold mt-1">{{ simples_nacional: 'Simples Nacional', lucro_real: 'Lucro Real', lucro_presumido: 'Lucro Presumido' }[selectedCompany.regime_tributario] || selectedCompany.regime_tributario}</p>
                          </div>
                        </div>
                      )}
                      {selectedCompany.contribuinte_icms && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-orange-100 rounded-lg"><Hash className="h-4 w-4 text-orange-600" /></div>
                          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contribuinte ICMS</label>
                            <p className="text-gray-900 font-semibold mt-1">{{ contribuinte: 'Contribuinte', contribuinte_isento: 'Contribuinte Isento', nao_contribuinte: 'Não Contribuinte' }[selectedCompany.contribuinte_icms] || selectedCompany.contribuinte_icms}</p>
                          </div>
                        </div>
                      )}
                      {selectedCompany.is_partner_client != null && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-purple-100 rounded-lg"><Check className="h-4 w-4 text-purple-600" /></div>
                          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente Partner</label><p className="text-gray-900 font-semibold mt-1">{selectedCompany.is_partner_client ? 'Sim' : 'Não'}</p></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Representante Legal */}
                {selectedCompany.representante_legal?.nome && (
                  <div>
                    <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#EBA500]" /> Representante Legal
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedCompany.representante_legal.nome && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl md:col-span-2">
                          <div className="p-2 bg-blue-100 rounded-lg"><Users className="h-4 w-4 text-blue-600" /></div>
                          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</label><p className="text-gray-900 font-semibold mt-1">{selectedCompany.representante_legal.nome}</p></div>
                        </div>
                      )}
                      {selectedCompany.representante_legal.cpf && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-gray-100 rounded-lg"><Hash className="h-4 w-4 text-gray-600" /></div>
                          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">CPF</label><p className="text-gray-900 font-semibold mt-1">{selectedCompany.representante_legal.cpf}</p></div>
                        </div>
                      )}
                      {selectedCompany.representante_legal.telefone && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-green-100 rounded-lg"><Phone className="h-4 w-4 text-green-600" /></div>
                          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Telefone</label><p className="text-gray-900 font-semibold mt-1">{selectedCompany.representante_legal.telefone}</p></div>
                        </div>
                      )}
                      {selectedCompany.representante_legal.email && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-blue-100 rounded-lg"><Mail className="h-4 w-4 text-blue-600" /></div>
                          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">E-mail</label><p className="text-gray-900 font-semibold mt-1 break-all">{selectedCompany.representante_legal.email}</p></div>
                        </div>
                      )}
                      {selectedCompany.representante_legal.endereco && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl md:col-span-2">
                          <div className="p-2 bg-orange-100 rounded-lg"><MapPin className="h-4 w-4 text-orange-600" /></div>
                          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Endereço</label><p className="text-gray-900 font-semibold mt-1">{selectedCompany.representante_legal.endereco}</p></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contato NF / Cobrança */}
                {selectedCompany.contato_cobranca?.nome && (
                  <div>
                    <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-[#EBA500]" /> Contato para NF / Cobrança
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedCompany.contato_cobranca.nome && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-blue-100 rounded-lg"><Users className="h-4 w-4 text-blue-600" /></div>
                          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</label><p className="text-gray-900 font-semibold mt-1">{selectedCompany.contato_cobranca.nome}</p></div>
                        </div>
                      )}
                      {selectedCompany.contato_cobranca.cargo && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-purple-100 rounded-lg"><Briefcase className="h-4 w-4 text-purple-600" /></div>
                          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cargo</label><p className="text-gray-900 font-semibold mt-1">{selectedCompany.contato_cobranca.cargo}</p></div>
                        </div>
                      )}
                      {selectedCompany.contato_cobranca.email && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-blue-100 rounded-lg"><Mail className="h-4 w-4 text-blue-600" /></div>
                          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">E-mail</label><p className="text-gray-900 font-semibold mt-1 break-all">{selectedCompany.contato_cobranca.email}</p></div>
                        </div>
                      )}
                      {selectedCompany.contato_cobranca.telefone && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-green-100 rounded-lg"><Phone className="h-4 w-4 text-green-600" /></div>
                          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Telefone</label><p className="text-gray-900 font-semibold mt-1">{selectedCompany.contato_cobranca.telefone}</p></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Condições de Pagamento */}
                {(selectedCompany.melhor_dia_pagamento || selectedCompany.forma_pagamento) && (
                  <div>
                    <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-[#EBA500]" /> Condições de Pagamento
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedCompany.melhor_dia_pagamento && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-green-100 rounded-lg"><Calendar className="h-4 w-4 text-green-600" /></div>
                          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Melhor Dia</label><p className="text-gray-900 font-semibold mt-1">{selectedCompany.melhor_dia_pagamento}</p></div>
                        </div>
                      )}
                      {selectedCompany.forma_pagamento && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-indigo-100 rounded-lg"><CreditCard className="h-4 w-4 text-indigo-600" /></div>
                          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Forma de Pagamento</label><p className="text-gray-900 font-semibold mt-1">{selectedCompany.forma_pagamento}</p></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex justify-end gap-3 flex-shrink-0 border-t border-gray-100 pt-4 bg-gray-50 rounded-b-3xl">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setShowEditModal(true)
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#EBA500] to-yellow-600 text-white rounded-xl hover:shadow-lg transition-all font-medium flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Editar Empresa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição */}
        {showEditModal && selectedCompany && (
          <CompanyEditModal
            company={selectedCompany}
            onClose={() => setShowEditModal(false)}
            onSave={handleUpdateCompany}
            loading={updating}
          />
        )}

        {/* Modal de Confirmação de Exclusão */}
        {showDeleteModal && selectedCompany && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-red-100 rounded-full">
                    <Trash2 className="h-8 w-8 text-red-600" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                  Excluir Empresa
                </h3>
                <p className="text-gray-600 text-center mb-6">
                  Tem certeza que deseja excluir <strong>{selectedCompany.name}</strong>? 
                  Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente Modal de Edição
function CompanyEditModal({ company, onClose, onSave, loading }) {
  const [formData, setFormData] = useState({
    name: company.name || '',
    nome_fantasia: company.nome_fantasia || '',
    industry: company.industry || '',
    size: company.size || 'pequena',
    email: company.email || '',
    phone: company.phone || '',
    website: company.website || '',
    cnpj: company.cnpj || '',
    inscricao_estadual: company.inscricao_estadual || '',
    inscricao_municipal: company.inscricao_municipal || '',
    num_colaboradores: company.num_colaboradores || '',
    regime_tributario: company.regime_tributario || '',
    contribuinte_icms: company.contribuinte_icms || '',
    is_partner_client: company.is_partner_client === true ? 'sim' : company.is_partner_client === false ? 'nao' : '',
    representante: company.representante_legal || { nome: '', email: '', telefone: '', endereco: '', cpf: '' },
    contato_cobranca_data: company.contato_cobranca || { nome: '', cargo: '', email: '', telefone: '' },
    melhor_dia_pagamento: company.melhor_dia_pagamento || '',
    forma_pagamento: company.forma_pagamento || '',
    address: company.address || { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip: '', country: 'Brasil' }
  })
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [currentLogoUrl, setCurrentLogoUrl] = useState(null)
  const [removeLogo, setRemoveLogo] = useState(false)

  // Carregar logo atual se existir
  useEffect(() => {
    const loadCurrentLogo = async () => {
      if (company.logo_url) {
        const { data } = await supabase.storage
          .from('company-avatars')
          .createSignedUrl(company.logo_url, 3600)
        
        if (data?.signedUrl) {
          setCurrentLogoUrl(data.signedUrl)
        }
      }
    }
    loadCurrentLogo()
  }, [company.logo_url])

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    
    if (!file) return

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Tipo de arquivo inválido. Use JPG, PNG, GIF ou WEBP')
      return
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. O tamanho máximo é 5MB')
      return
    }

    setLogoFile(file)
    setRemoveLogo(false)

    // Criar preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setCurrentLogoUrl(null)
    setRemoveLogo(true)
    toast.success('Logo será removido ao salvar')
  }

  const handleInputChange = (field, value) => {
    if (field.startsWith('address.')) {
      const sub = field.replace('address.', '')
      setFormData(prev => ({ ...prev, address: { ...prev.address, [sub]: value } }))
    } else if (field.startsWith('representante.')) {
      const sub = field.replace('representante.', '')
      setFormData(prev => ({ ...prev, representante: { ...prev.representante, [sub]: value } }))
    } else if (field.startsWith('contato_cobranca_data.')) {
      const sub = field.replace('contato_cobranca_data.', '')
      setFormData(prev => ({ ...prev, contato_cobranca_data: { ...prev.contato_cobranca_data, [sub]: value } }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    let logoUrl = company.logo_url

    try {
      // 1. Se há um novo logo para upload
      if (logoFile) {
        // Deletar logo antigo se existir
        if (company.logo_url) {
          await supabase.storage
            .from('company-avatars')
            .remove([company.logo_url])
        }

        // Upload do novo logo
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('company-avatars')
          .upload(filePath, logoFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          throw new Error(`Erro ao fazer upload do logo: ${uploadError.message}`)
        }

        logoUrl = filePath
      }
      // 2. Se o usuário marcou para remover o logo
      else if (removeLogo && company.logo_url) {
        await supabase.storage
          .from('company-avatars')
          .remove([company.logo_url])
        
        logoUrl = null
      }

      // 3. Atualizar empresa com novo logo_url
      const { representante, contato_cobranca_data, is_partner_client, num_colaboradores, ...rest } = formData
      await onSave(company.id, {
        ...rest,
        logo_url: logoUrl,
        is_partner_client: is_partner_client === 'sim' ? true : is_partner_client === 'nao' ? false : null,
        num_colaboradores: num_colaboradores !== '' ? parseInt(num_colaboradores) || null : null,
        representante_legal: representante,
        contato_cobranca: contato_cobranca_data,
      })
      
    } catch (error) {
      console.error('Erro ao processar logo:', error)
      toast.error(error.message || 'Erro ao processar logo')
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com Gradiente */}
        <div className="relative bg-gradient-to-br from-[#EBA500] via-yellow-500 to-yellow-600 p-6 rounded-t-3xl flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-xl transition-all duration-200 group"
          >
            <X className="h-6 w-6 text-white group-hover:rotate-90 transition-transform duration-200" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <Edit className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Editar Empresa</h3>
              <p className="text-white/80 text-sm mt-1">{company.name}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Conteúdo com Scroll */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-custom">

          {/* Upload de Logo */}
          <div>
            <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-[#EBA500]" />
              Logo da Empresa
            </h4>
            
            {!logoPreview && !currentLogoUrl ? (
              <div className="flex items-center justify-center w-full">
                <label className="relative group flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 hover:from-[#EBA500]/5 hover:to-yellow-50 hover:border-[#EBA500]/50 transition-all duration-200">
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="p-4 bg-gradient-to-br from-[#EBA500]/10 to-yellow-100/50 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-200">
                      <Upload className="w-8 h-8 text-[#EBA500]" />
                    </div>
                    <p className="mb-2 text-sm text-gray-600 text-center font-medium">
                      <span className="text-[#EBA500] font-bold">Clique para fazer upload</span>
                      <span className="block text-xs text-gray-500 mt-1">ou arraste e solte aqui</span>
                    </p>
                    <p className="text-xs text-gray-500 bg-white/50 px-3 py-1 rounded-full">
                      PNG, JPG, GIF ou WEBP (MAX. 5MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleLogoChange}
                  />
                </label>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-[#EBA500]/5 to-yellow-50 border-2 border-[#EBA500]/30 rounded-2xl">
                  <div className="relative">
                    <img
                      src={logoPreview || currentLogoUrl}
                      alt="Logo da empresa"
                      className="w-24 h-24 object-contain rounded-xl bg-white border-2 border-white shadow-lg flex-shrink-0"
                    />
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate mb-1">
                      {logoFile ? logoFile.name : 'Logo atual'}
                    </p>
                    {logoFile && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        {(logoFile.size / 1024).toFixed(2)} KB
                      </p>
                    )}
                    {!logoFile && (
                      <p className="text-xs text-gray-500">Imagem carregada</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <label className="cursor-pointer p-2.5 bg-gradient-to-br from-[#EBA500] to-yellow-600 text-white hover:shadow-lg rounded-xl transition-all duration-200 group">
                      <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleLogoChange}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 text-white hover:shadow-lg rounded-xl transition-all duration-200 group"
                    >
                      <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Informações Básicas */}
          <div>
            <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#EBA500]" />
              Informações Básicas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Razão Social *
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Digite o nome da empresa"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] transition-all bg-white hover:border-gray-300"
                />
              </div>
              
              <div className="col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Hash className="w-4 h-4 text-purple-600" />
                  Documento Fiscal
                </label>
                <input
                  value={formData.cnpj}
                  onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                  placeholder="CNPJ, Tax ID, NIF, etc."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] transition-all bg-white hover:border-gray-300"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Briefcase className="w-4 h-4 text-green-600" />
                  Porte da Empresa
                </label>
                <select
                  value={formData.size}
                  onChange={(e) => setFormData({...formData, size: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] transition-all bg-white hover:border-gray-300 cursor-pointer"
                >
                  {Object.entries(COMPANY_TYPES).map(([key, type]) => (
                    <option key={key} value={key}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Briefcase className="w-4 h-4 text-orange-600" />
                  Segmento
                </label>
                <input
                  value={formData.industry}
                  onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  placeholder="Ex: Tecnologia, Varejo, Saúde"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] transition-all bg-white hover:border-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Informações de Contato */}
          <div>
            <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Phone className="h-5 w-5 text-[#EBA500]" />
              Informações de Contato
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Email Corporativo
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="contato@empresa.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] transition-all bg-white hover:border-gray-300"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  Telefone da Empresa (com DDD) *
                </label>
                <input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] transition-all bg-white hover:border-gray-300"
                />
              </div>
              
              <div className="col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Globe className="w-4 h-4 text-purple-600" />
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="https://www.empresa.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] transition-all bg-white hover:border-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div>
            <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#EBA500]" /> Endereço *
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-3 md:col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">País</label>
                <input value={formData.address.country} onChange={e => handleInputChange('address.country', e.target.value)} placeholder="Brasil" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
              <div className="col-span-3 md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Logradouro *</label>
                <input value={formData.address.street} onChange={e => handleInputChange('address.street', e.target.value)} placeholder="Rua, Avenida..." className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Número *</label>
                <input value={formData.address.number} onChange={e => handleInputChange('address.number', e.target.value)} placeholder="123" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Complemento</label>
                <input value={formData.address.complement} onChange={e => handleInputChange('address.complement', e.target.value)} placeholder="Sala, Apto..." className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bairro</label>
                <input value={formData.address.neighborhood} onChange={e => handleInputChange('address.neighborhood', e.target.value)} placeholder="Centro" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cidade *</label>
                <input value={formData.address.city} onChange={e => handleInputChange('address.city', e.target.value)} placeholder="São Paulo" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Estado *</label>
                <input value={formData.address.state} onChange={e => handleInputChange('address.state', e.target.value)} placeholder="SP" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">CEP *</label>
                <input value={formData.address.zip} onChange={e => handleInputChange('address.zip', e.target.value)} placeholder="00000-000" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
            </div>
          </div>

          {/* Dados Fiscais */}
          <div>
            <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Hash className="h-5 w-5 text-[#EBA500]" /> Dados Fiscais
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome Fantasia</label>
                <input value={formData.nome_fantasia} onChange={e => handleInputChange('nome_fantasia', e.target.value)} placeholder="Ex: ABC Soluções" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nº de Colaboradores</label>
                <input type="number" min="0" value={formData.num_colaboradores} onChange={e => handleInputChange('num_colaboradores', e.target.value)} placeholder="Ex: 25" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Inscrição Estadual</label>
                <input value={formData.inscricao_estadual} onChange={e => handleInputChange('inscricao_estadual', e.target.value)} placeholder="Ex: 123.456.789.000 ou ISENTO" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Inscrição Municipal</label>
                <input value={formData.inscricao_municipal} onChange={e => handleInputChange('inscricao_municipal', e.target.value)} placeholder="Ex: 12345678" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Regime Tributário *</label>
                <select value={formData.regime_tributario} onChange={e => handleInputChange('regime_tributario', e.target.value)} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white">
                  <option value="">Selecione...</option>
                  <option value="simples_nacional">Simples Nacional</option>
                  <option value="lucro_real">Lucro Real</option>
                  <option value="lucro_presumido">Lucro Presumido</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contribuinte do ICMS *</label>
                <select value={formData.contribuinte_icms} onChange={e => handleInputChange('contribuinte_icms', e.target.value)} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white">
                  <option value="">Selecione...</option>
                  <option value="contribuinte">Contribuinte</option>
                  <option value="contribuinte_isento">Contribuinte Isento</option>
                  <option value="nao_contribuinte">Não Contribuinte</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">É cliente Partner?</label>
                <select value={formData.is_partner_client} onChange={e => handleInputChange('is_partner_client', e.target.value)} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white">
                  <option value="">Selecione...</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>
            </div>
          </div>

          {/* Representante Legal */}
          <div>
            <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#EBA500]" /> Representante Legal
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome Completo *</label>
                <input value={formData.representante.nome} onChange={e => handleInputChange('representante.nome', e.target.value)} placeholder="Ex: João da Silva" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">CPF *</label>
                <input value={formData.representante.cpf} onChange={e => handleInputChange('representante.cpf', e.target.value)} placeholder="000.000.000-00" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Telefone (com DDD) *</label>
                <input value={formData.representante.telefone} onChange={e => handleInputChange('representante.telefone', e.target.value)} placeholder="(11) 99999-9999" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">E-mail *</label>
                <input type="email" value={formData.representante.email} onChange={e => handleInputChange('representante.email', e.target.value)} placeholder="representante@empresa.com" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Endereço Completo *</label>
                <input value={formData.representante.endereco} onChange={e => handleInputChange('representante.endereco', e.target.value)} placeholder="Rua, nº, bairro, cidade – estado" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
            </div>
          </div>

          {/* Contato para NF / Cobrança */}
          <div>
            <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#EBA500]" /> Contato para NF / Cobrança
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome Completo *</label>
                <input value={formData.contato_cobranca_data.nome} onChange={e => handleInputChange('contato_cobranca_data.nome', e.target.value)} placeholder="Ex: Maria Souza" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cargo *</label>
                <input value={formData.contato_cobranca_data.cargo} onChange={e => handleInputChange('contato_cobranca_data.cargo', e.target.value)} placeholder="Ex: Financeiro" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">E-mail *</label>
                <input type="email" value={formData.contato_cobranca_data.email} onChange={e => handleInputChange('contato_cobranca_data.email', e.target.value)} placeholder="financeiro@empresa.com" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Telefone (com DDD) *</label>
                <input type="tel" value={formData.contato_cobranca_data.telefone} onChange={e => handleInputChange('contato_cobranca_data.telefone', e.target.value)} placeholder="(11) 99999-9999" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
            </div>
          </div>

          {/* Condições de Pagamento */}
          <div>
            <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-[#EBA500]" /> Condições de Pagamento
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Melhor Dia para Pagamento *</label>
                <input value={formData.melhor_dia_pagamento} onChange={e => handleInputChange('melhor_dia_pagamento', e.target.value)} placeholder="Ex: dia 10" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Forma de Pagamento *</label>
                <input value={formData.forma_pagamento} onChange={e => handleInputChange('forma_pagamento', e.target.value)} placeholder="Ex: Boleto, Cartão de Crédito" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-[#EBA500] bg-white" />
              </div>
            </div>
          </div>
          </div>
          
          {/* Footer com botões */}
          <div className="px-6 pb-6 flex justify-end gap-3 flex-shrink-0 border-t border-gray-100 pt-4 bg-gray-50 rounded-b-3xl">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 bg-gradient-to-r from-[#EBA500] to-yellow-600 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CompanyDashboardPage
