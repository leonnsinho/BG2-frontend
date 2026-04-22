import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  Building2, ArrowLeft, ArrowRight, Save, Phone, Globe,
  CreditCard, Users, MapPin, Hash, Upload, Image as ImageIcon,
  X, Wallet, Check, Zap, ClipboardList, Clock
} from 'lucide-react'
import toast from '@/lib/toast'

const EMPTY_FORM = {
  name: '', nome_fantasia: '', cnpj: '', email: '', phone: '',
  website: '', industry: '', size: 'pequena', inscricao_estadual: '',
  inscricao_municipal: '', num_colaboradores: '', regime_tributario: '',
  contribuinte_icms: '', is_partner_client: '',
  representante: { nome: '', email: '', telefone: '', endereco: '', cpf: '', cargo: '' },
  contato_cobranca: { nome: '', cargo: '', email: '', telefone: '' },
  melhor_dia_pagamento: '', forma_pagamento: '',
  address: { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip: '', country: 'Brasil' }
}

const STEPS = [
  { label: 'Informacoes Basicas', icon: Building2 },
  { label: 'Contato',             icon: Phone },
  { label: 'Endereco',            icon: MapPin },
  { label: 'Dados Fiscais',       icon: Hash },
  { label: 'Representante',       icon: Users },
  { label: 'Cobranca',            icon: CreditCard },
]

const EMPTY_PF = {
  nome: '', cpf: '', rg: '', telefone: '', email: '', email_nf: '',
  forma_pagamento: '',
  address: { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip: '' }
}

const PF_STEPS = [
  { label: 'Dados Pessoais', icon: Users },
  { label: 'Endereço',       icon: MapPin },
  { label: 'Contato',        icon: Phone },
]

export default function UserCreateCompanyPage() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const [mode, setMode] = useState('basico') // 'basico' | 'completo'
  const [pessoa_tipo, setPessoaTipo] = useState('pj') // 'pj' | 'pf'
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isInternational, setIsInternational] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [pfData, setPfData] = useState(EMPTY_PF)

  // Detecta se o usuário já tem uma empresa em trial (para o modo "completar")
  const trialCompany = profile?.user_companies?.find(
    uc => uc.is_active && uc.companies?.subscription_status === 'trial'
  )
  const isCompleting = !!trialCompany  // true = completar cadastro de empresa trial existente

  const fillTestData = () => {
    setFormData({
      name: 'Tech Solutions Ltda',
      nome_fantasia: 'Tech Solutions',
      cnpj: '12.345.678/0001-99',
      email: 'contato@techsolutions.com.br',
      phone: '(11) 98765-4321',
      website: 'https://techsolutions.com.br',
      industry: 'Tecnologia',
      size: 'media',
      inscricao_estadual: '123.456.789.000',
      inscricao_municipal: '98765',
      num_colaboradores: '50',
      regime_tributario: 'lucro_presumido',
      contribuinte_icms: 'contribuinte',
      is_partner_client: 'sim',
      representante: {
        nome: 'Carlos Alberto Silva',
        cpf: '123.456.789-00',
        telefone: '(11) 91234-5678',
        email: 'carlos@techsolutions.com.br',
        endereco: 'Rua das Flores, 100 - Sao Paulo/SP'
      },
      contato_cobranca: {
        nome: 'Maria Souza',
        cargo: 'Financeiro',
        email: 'financeiro@techsolutions.com.br',
        telefone: '(11) 93456-7890'
      },
      melhor_dia_pagamento: '10',
      forma_pagamento: 'boleto',
      address: {
        street: 'Avenida Paulista',
        number: '1000',
        complement: 'Conj. 201',
        neighborhood: 'Bela Vista',
        city: 'Sao Paulo',
        state: 'SP',
        zip: '01310-100',
        country: 'Brasil'
      }
    })
    toast.success('Dados de teste preenchidos!')
  }

  const handlePfChange = (field, value) => {
    if (field.startsWith('address.')) {
      const sub = field.replace('address.', '')
      setPfData(prev => ({ ...prev, address: { ...prev.address, [sub]: value } }))
    } else {
      setPfData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleChange = (field, value) => {
    if (field.startsWith('address.')) {
      const sub = field.replace('address.', '')
      setFormData(prev => ({ ...prev, address: { ...prev.address, [sub]: value } }))
    } else if (field.startsWith('representante.')) {
      const sub = field.replace('representante.', '')
      setFormData(prev => ({ ...prev, representante: { ...prev.representante, [sub]: value } }))
    } else if (field.startsWith('contato_cobranca.')) {
      const sub = field.replace('contato_cobranca.', '')
      setFormData(prev => ({ ...prev, contato_cobranca: { ...prev.contato_cobranca, [sub]: value } }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) { toast.error('Tipo invalido. Use JPG, PNG, GIF ou WEBP'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Maximo 5MB'); return }
    setLogoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setLogoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const validatePfStep = () => {
    switch (step) {
      case 0:
        if (!pfData.nome.trim())  { toast.error('Nome completo é obrigatório'); return false }
        if (!pfData.cpf.trim())   { toast.error('CPF é obrigatório'); return false }
        return true
      case 1:
        if (!pfData.address.street.trim()) { toast.error('Rua é obrigatória'); return false }
        if (!pfData.address.city.trim())   { toast.error('Cidade é obrigatória'); return false }
        if (!pfData.address.state.trim())  { toast.error('Estado é obrigatório'); return false }
        if (!pfData.address.zip.trim())    { toast.error('CEP é obrigatório'); return false }
        return true
      case 2:
        if (!pfData.telefone.trim())      { toast.error('Telefone é obrigatório'); return false }
        if (!pfData.email.trim())         { toast.error('E-mail é obrigatório'); return false }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pfData.email)) { toast.error('E-mail inválido'); return false }
        if (!pfData.forma_pagamento)      { toast.error('Forma de pagamento é obrigatória'); return false }
        return true
      default: return true
    }
  }

  const handleSubmitPfBasico = async () => {
    if (!pfData.nome.trim())     { toast.error('Nome completo é obrigatório'); return }
    if (!pfData.email.trim())    { toast.error('E-mail é obrigatório'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pfData.email)) { toast.error('E-mail inválido'); return }
    if (!pfData.telefone.trim()) { toast.error('Telefone é obrigatório'); return }
    setLoading(true)
    try {
      const companyData = {
        name: pfData.nome.trim(),
        email: pfData.email.trim(),
        phone: pfData.telefone.trim(),
        representante_legal: { tipo: 'pf' },
        created_by: user.id,
        subscription_plan: 'basic',
        subscription_status: 'trial',
        is_active: true,
      }
      const { data: company, error: companyError } = await supabase
        .from('companies').insert([companyData]).select().single()
      if (companyError) throw companyError
      await supabase.from('user_companies').insert([{ user_id: user.id, company_id: company.id, role: 'company_admin', is_active: true }])
      await supabase.from('profiles').update({ role: 'company_admin' }).eq('id', user.id)
      toast.success('Cadastro criado! Você tem 14 dias para completar os dados.')
      await refreshProfile()
      navigate('/dashboard')
    } catch (error) {
      toast.error(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitPfCompleto = async () => {
    if (!validatePfStep()) return
    setLoading(true)
    try {
      const companyData = {
        name: pfData.nome.trim(),
        cnpj: pfData.cpf.trim() || null,
        email: pfData.email.trim(),
        phone: pfData.telefone.trim() || null,
        forma_pagamento: pfData.forma_pagamento || null,
        address: Object.values(pfData.address).some(v => v.trim()) ? pfData.address : null,
        representante_legal: { tipo: 'pf', rg: pfData.rg.trim() || null },
        contato_cobranca: pfData.email_nf.trim() ? { email: pfData.email_nf.trim() } : null,
        created_by: user.id,
        subscription_plan: 'basic',
        subscription_status: 'active',
        is_active: true,
      }
      const { data: company, error: companyError } = await supabase
        .from('companies').insert([companyData]).select().single()
      if (companyError) throw companyError
      await supabase.from('user_companies').insert([{ user_id: user.id, company_id: company.id, role: 'company_admin', is_active: true }])
      await supabase.from('profiles').update({ role: 'company_admin' }).eq('id', user.id)
      toast.success('Cadastro completo criado com sucesso!')
      await refreshProfile()
      navigate('/dashboard')
    } catch (error) {
      toast.error(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const validateStep = () => {
    switch (step) {
      case 0:
        if (!formData.name.trim()) { toast.error('Razao Social e obrigatoria'); return false }
        if (!formData.cnpj.trim()) { toast.error('CNPJ e obrigatorio'); return false }
        if (!isInternational && !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(formData.cnpj)) {
          toast.error('CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX'); return false
        }
        return true
      case 1:
        if (!formData.email.trim()) { toast.error('Email da empresa e obrigatorio'); return false }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { toast.error('Email invalido'); return false }
        if (!formData.phone.trim()) { toast.error('Telefone da empresa e obrigatorio'); return false }
        return true
      case 2:
        if (!formData.address.street.trim()) { toast.error('Logradouro e obrigatorio'); return false }
        if (!formData.address.city.trim())   { toast.error('Cidade e obrigatoria'); return false }
        if (!formData.address.state.trim())  { toast.error('Estado e obrigatorio'); return false }
        if (!formData.address.zip.trim())    { toast.error('CEP e obrigatorio'); return false }
        return true
      case 3:
        if (!formData.regime_tributario)  { toast.error('Regime tributario e obrigatorio'); return false }
        if (!formData.contribuinte_icms)  { toast.error('Contribuinte do ICMS e obrigatorio'); return false }
        return true
      case 4:
        if (!formData.representante.nome.trim())     { toast.error('Nome do representante e obrigatorio'); return false }
        if (!formData.representante.cpf.trim())      { toast.error('CPF do representante e obrigatorio'); return false }
        if (!formData.representante.telefone.trim()) { toast.error('Telefone do representante e obrigatorio'); return false }
        if (!formData.representante.email.trim())    { toast.error('E-mail do representante e obrigatorio'); return false }
        if (!formData.representante.endereco.trim()) { toast.error('Endereco do representante e obrigatorio'); return false }
        return true
      case 5:
        if (!formData.contato_cobranca.nome.trim())    { toast.error('Nome do contato de cobranca e obrigatorio'); return false }
        if (!formData.contato_cobranca.cargo.trim())   { toast.error('Cargo do contato de cobranca e obrigatorio'); return false }
        if (!formData.contato_cobranca.email.trim())   { toast.error('E-mail do contato de cobranca e obrigatorio'); return false }
        if (!formData.contato_cobranca.telefone.trim()){ toast.error('Telefone do contato de cobranca e obrigatorio'); return false }
        if (!formData.melhor_dia_pagamento)            { toast.error('Melhor dia para pagamento e obrigatorio'); return false }
        if (!formData.forma_pagamento)                 { toast.error('Forma de pagamento e obrigatoria'); return false }
        return true
      default:
        return true
    }
  }

  const nextStep = () => { if (validateStep()) setStep(s => s + 1) }
  const prevStep = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    if (!validateStep()) return
    setLoading(true)
    try {
      let logoUrl = null
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const filePath = `${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('company-avatars').upload(filePath, logoFile, { cacheControl: '3600', upsert: false })
        if (uploadError) throw new Error(`Erro no upload do logo: ${uploadError.message}`)
        logoUrl = filePath
      }

      const companyData = {
        name: formData.name.trim(),
        nome_fantasia: formData.nome_fantasia.trim() || null,
        cnpj: formData.cnpj.trim() || null,
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        website: formData.website.trim() || null,
        industry: formData.industry.trim() || null,
        size: formData.size,
        inscricao_estadual: formData.inscricao_estadual.trim() || null,
        inscricao_municipal: formData.inscricao_municipal.trim() || null,
        num_colaboradores: formData.num_colaboradores ? parseInt(formData.num_colaboradores) || null : null,
        regime_tributario: formData.regime_tributario || null,
        contribuinte_icms: formData.contribuinte_icms || null,
        is_partner_client: formData.is_partner_client === 'sim',
        representante_legal: formData.representante,
        contato_cobranca: formData.contato_cobranca,
        melhor_dia_pagamento: formData.melhor_dia_pagamento.trim() || null,
        forma_pagamento: formData.forma_pagamento || null,
        address: Object.values(formData.address).some(v => v.trim()) ? formData.address : null,
        logo_url: logoUrl,
        created_by: user.id,
        subscription_plan: 'basic',
        subscription_status: 'active',
        is_active: true
      }

      const { data: company, error: companyError } = await supabase
        .from('companies').insert([companyData]).select().single()
      if (companyError) {
        if (logoUrl) await supabase.storage.from('company-avatars').remove([logoUrl])
        throw companyError
      }

      const { error: linkError } = await supabase.from('user_companies').insert([{
        user_id: user.id, company_id: company.id, role: 'company_admin', is_active: true
      }])
      if (linkError) throw linkError

      const { error: profileError } = await supabase
        .from('profiles').update({ role: 'company_admin' }).eq('id', user.id)
      if (profileError) throw profileError

      toast.success(`Empresa "${company.name}" criada com sucesso!`)
      await refreshProfile()
      navigate('/dashboard')
    } catch (error) {
      console.error('Erro ao criar empresa:', error)
      if (error.message?.includes('cnpj')) toast.error('CNPJ ja esta em uso por outra empresa')
      else if (error.message?.includes('email')) toast.error('Email ja esta em uso por outra empresa')
      else toast.error(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // --- Cadastro rápido (trial 14 dias) -------------------------------------
  const handleSubmitBasico = async () => {
    if (!formData.name.trim())                    { toast.error('Razão Social é obrigatória'); return }
    if (!formData.representante.nome.trim())      { toast.error('Nome do representante é obrigatório'); return }
    if (!formData.representante.cargo.trim())     { toast.error('Cargo do representante é obrigatório'); return }
    if (!formData.representante.email.trim())     { toast.error('E-mail do representante é obrigatório'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.representante.email)) { toast.error('E-mail do representante inválido'); return }
    if (!formData.representante.telefone.trim())  { toast.error('Telefone do representante é obrigatório'); return }

    setLoading(true)
    try {
      const companyData = {
        name: formData.name.trim(),
        representante_legal: {
          nome:     formData.representante.nome.trim(),
          cargo:    formData.representante.cargo.trim(),
          email:    formData.representante.email.trim(),
          telefone: formData.representante.telefone.trim(),
        },
        created_by: user.id,
        subscription_plan: 'basic',
        subscription_status: 'trial',
        is_active: true,
      }

      const { data: company, error: companyError } = await supabase
        .from('companies').insert([companyData]).select().single()
      if (companyError) throw companyError

      const { error: linkError } = await supabase.from('user_companies').insert([{
        user_id: user.id, company_id: company.id, role: 'company_admin', is_active: true
      }])
      if (linkError) throw linkError

      const { error: profileError } = await supabase
        .from('profiles').update({ role: 'company_admin' }).eq('id', user.id)
      if (profileError) throw profileError

      toast.success('Empresa criada! Você tem 14 dias para completar o cadastro.')
      await refreshProfile()
      navigate('/dashboard')
    } catch (error) {
      console.error('Erro ao criar empresa (básico):', error)
      if (error.message?.includes('cnpj')) toast.error('CNPJ já está em uso')
      else toast.error(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }
  // -------------------------------------------------------------------------

  const inp = 'w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]'
  const sel = inp + ' bg-white'

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">

        {/* Back link */}
        <button onClick={() => navigate('/dashboard')} className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao Dashboard
        </button>

        {/* Page title */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EBA500]/10">
              <Building2 className="h-6 w-6 text-[#EBA500]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {isCompleting ? 'Completar Cadastro da Empresa' : 'Criar Empresa'}
              </h1>
              <p className="text-sm text-gray-500">
                {mode === 'basico'
                  ? 'Preencha o mínimo para começar a usar o sistema'
                  : `Passo ${step + 1} de ${STEPS.length}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fillTestData}
            className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-gray-400 text-gray-500 hover:border-[#EBA500] hover:text-[#EBA500] transition-colors"
          >
            Preencher teste
          </button>
        </div>

        {/* --- Toggle PJ / PF -------------------------------------------- */}
        {!isCompleting && (
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo:</span>
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => { setPessoaTipo('pj'); setStep(0) }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pessoa_tipo === 'pj' ? 'bg-white text-[#EBA500] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Pessoa Jurídica (PJ)
              </button>
              <button
                onClick={() => { setPessoaTipo('pf'); setStep(0) }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pessoa_tipo === 'pf' ? 'bg-white text-[#EBA500] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Pessoa Física (PF)
              </button>
            </div>
          </div>
        )}

        {/* --- Tabs: Básico / Completo ----------------------------------- */}
        {!isCompleting && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setMode('basico'); setStep(0) }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 text-sm font-semibold transition-all ${
                mode === 'basico'
                  ? 'border-[#EBA500] bg-[#EBA500]/5 text-[#EBA500]'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
            >
              <Zap className="h-4 w-4" />
              Cadastro Rápido
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                mode === 'basico' ? 'bg-[#EBA500]/20 text-[#EBA500]' : 'bg-gray-100 text-gray-500'
              }`}>padrão</span>
            </button>
            <button
              onClick={() => { setMode('completo'); setStep(0) }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 text-sm font-semibold transition-all ${
                mode === 'completo'
                  ? 'border-[#EBA500] bg-[#EBA500]/5 text-[#EBA500]'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              Cadastro Completo
            </button>
          </div>
        )}

        {/* --- Modo Básico ------------------------------------------------ */}
        {(mode === 'basico' && !isCompleting && pessoa_tipo === 'pj') && (
          <>
            {/* Banner de trial */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-5 text-sm text-amber-800">
              <Clock className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold mb-0.5">Acesso de 14 dias grátis</p>
                <p className="text-amber-700">Preencha apenas os dados básicos agora e complete o cadastro quando quiser. Após 14 dias, o cadastro completo será exigido para continuar usando o sistema.</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6">

                {/* Informações da Empresa */}
                <div className="space-y-4">
                  <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#EBA500]" /> Informações da Empresa
                  </h2>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Razão Social *</label>
                    <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ex: Empresa ABC Ltda" className={inp} />
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Representante */}
                <div className="space-y-4">
                  <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#EBA500]" /> Representante
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                      <input type="text" value={formData.representante.nome} onChange={e => handleChange('representante.nome', e.target.value)} placeholder="Nome completo" className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cargo *</label>
                      <input type="text" value={formData.representante.cargo !== undefined ? formData.representante.cargo : ''} onChange={e => handleChange('representante.cargo', e.target.value)} placeholder="Ex: Diretor, CEO..." className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Telefone *</label>
                      <input type="tel" value={formData.representante.telefone} onChange={e => handleChange('representante.telefone', e.target.value)} placeholder="(11) 99999-9999" className={inp} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">E-mail *</label>
                      <input type="email" value={formData.representante.email} onChange={e => handleChange('representante.email', e.target.value)} placeholder="representante@empresa.com" className={inp} />
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="px-6 sm:px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmitBasico}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading
                    ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Criando...</>
                    : <><Zap className="h-4 w-4" /> Começar agora</>}
                </button>
              </div>
            </div>
          </>
        )}

        {/* --- Modo Básico PF --------------------------------------------- */}
        {(mode === 'basico' && !isCompleting && pessoa_tipo === 'pf') && (
          <>
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-5 text-sm text-amber-800">
              <Clock className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold mb-0.5">Acesso de 14 dias grátis</p>
                <p className="text-amber-700">Preencha apenas os dados básicos agora e complete o cadastro quando quiser.</p>
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 sm:p-8 space-y-4">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#EBA500]" /> Dados Pessoais
                </h2>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nome Completo *</label>
                  <input type="text" value={pfData.nome} onChange={e => handlePfChange('nome', e.target.value)} placeholder="Seu nome completo" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">E-mail *</label>
                  <input type="email" value={pfData.email} onChange={e => handlePfChange('email', e.target.value)} placeholder="seu@email.com" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Telefone *</label>
                  <input type="tel" value={pfData.telefone} onChange={e => handlePfChange('telefone', e.target.value)} placeholder="(11) 99999-9999" className={inp} />
                </div>
              </div>
              <div className="px-6 sm:px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button type="button" onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Cancelar
                </button>
                <button type="button" onClick={handleSubmitPfBasico} disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Criando...</> : <><Zap className="h-4 w-4" /> Começar agora</>}
                </button>
              </div>
            </div>
          </>
        )}

        {/* --- Modo Completo (wizard) ------------------------------------- */}
        {((mode === 'completo' || isCompleting) && pessoa_tipo === 'pj') && (<>

        {/* Banner: completando cadastro trial */}
        {isCompleting && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-5 text-sm text-amber-800">
            <Clock className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold mb-0.5">Complete seu cadastro</p>
              <p className="text-amber-700">Preencha todos os dados para liberar o acesso completo à plataforma sem restrições.</p>
            </div>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center mb-6 gap-0">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const done = i < step
            const active = i === step
            return (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    done   ? 'bg-[#EBA500] border-[#EBA500] text-white' :
                    active ? 'bg-white border-[#EBA500] text-[#EBA500]' :
                             'bg-white border-gray-200 text-gray-400'
                  }`}>
                    {done ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-[10px] mt-1 font-medium hidden sm:block ${active ? 'text-[#EBA500]' : done ? 'text-gray-600' : 'text-gray-300'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-4 mx-1 transition-all ${i < step ? 'bg-[#EBA500]' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 sm:p-8">

            {/* STEP 0 — Informacoes Basicas + Logo */}
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#EBA500]" /> Informacoes Basicas
                </h2>

                {/* Logo */}
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-2">
                    <ImageIcon className="h-3.5 w-3.5" /> Logo da Empresa (Opcional)
                  </label>
                  {!logoPreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-[#EBA500]/50 transition-all">
                      <Upload className="h-6 w-6 text-gray-400 mb-1" />
                      <p className="text-xs text-gray-500"><span className="font-medium">Clique para upload</span> · PNG, JPG, WEBP (max 5MB)</p>
                      <input type="file" className="hidden" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleLogoChange} />
                    </label>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <img src={logoPreview} alt="Preview" className="w-14 h-14 object-contain rounded-lg bg-white border border-gray-200" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{logoFile?.name}</p>
                        <p className="text-xs text-gray-500">{(logoFile?.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Razao Social *</label>
                    <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ex: Empresa ABC Ltda" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nome Fantasia</label>
                    <input type="text" value={formData.nome_fantasia} onChange={e => handleChange('nome_fantasia', e.target.value)} placeholder="Ex: ABC Solucoes" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{isInternational ? 'Documento Fiscal (Tax ID) *' : 'CNPJ *'}</label>
                    <input type="text" value={formData.cnpj} onChange={e => handleChange('cnpj', e.target.value)} placeholder={isInternational ? 'Ex: 12-3456789' : '00.000.000/0000-00'} className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Porte</label>
                    <select value={formData.size} onChange={e => handleChange('size', e.target.value)} className={sel}>
                      <option value="micro">Microempresa</option>
                      <option value="pequena">Pequena Empresa</option>
                      <option value="media">Media Empresa</option>
                      <option value="grande">Grande Empresa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Segmento</label>
                    <input type="text" value={formData.industry} onChange={e => handleChange('industry', e.target.value)} placeholder="Ex: Tecnologia, Varejo..." className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">No de Colaboradores</label>
                    <input type="number" min="0" value={formData.num_colaboradores} onChange={e => handleChange('num_colaboradores', e.target.value)} placeholder="Ex: 25" className={inp} />
                  </div>
                </div>

                {/* Internacional toggle */}
                <label className="inline-flex items-center cursor-pointer gap-2">
                  <div className="relative">
                    <input type="checkbox" checked={isInternational} onChange={e => {
                      setIsInternational(e.target.checked)
                      if (e.target.checked) { handleChange('cnpj', ''); handleChange('address.zip', ''); handleChange('address.country', '') }
                      else { handleChange('address.country', 'Brasil') }
                    }} className="sr-only peer" />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#EBA500]" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">Empresa internacional</span>
                </label>
              </div>
            )}

            {/* STEP 1 — Contato */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#EBA500]" /> Informacoes de Contato
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email Principal *</label>
                    <input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} placeholder="contato@empresa.com" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Telefone (com DDD) *</label>
                    <input type="tel" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} placeholder={isInternational ? '+1 234 567-8900' : '(11) 99999-9999'} className={inp} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
                    <input type="url" value={formData.website} onChange={e => handleChange('website', e.target.value)} placeholder="https://www.empresa.com.br" className={inp} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 — Endereco */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#EBA500]" /> Endereco
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Pais</label>
                    <input type="text" value={formData.address.country} onChange={e => handleChange('address.country', e.target.value)} placeholder={isInternational ? 'Ex: Portugal' : 'Brasil'} className={inp} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Logradouro *</label>
                    <input type="text" value={formData.address.street} onChange={e => handleChange('address.street', e.target.value)} placeholder="Rua, Avenida..." className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Numero</label>
                    <input type="text" value={formData.address.number} onChange={e => handleChange('address.number', e.target.value)} placeholder="123" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Complemento</label>
                    <input type="text" value={formData.address.complement} onChange={e => handleChange('address.complement', e.target.value)} placeholder="Sala, Apto..." className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bairro</label>
                    <input type="text" value={formData.address.neighborhood} onChange={e => handleChange('address.neighborhood', e.target.value)} placeholder="Centro" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cidade *</label>
                    <input type="text" value={formData.address.city} onChange={e => handleChange('address.city', e.target.value)} placeholder="Sao Paulo" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{isInternational ? 'Estado/Regiao *' : 'Estado *'}</label>
                    <input type="text" value={formData.address.state} onChange={e => handleChange('address.state', e.target.value)} placeholder={isInternational ? 'California' : 'SP'} className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{isInternational ? 'Codigo Postal *' : 'CEP *'}</label>
                    <input type="text" value={formData.address.zip} onChange={e => handleChange('address.zip', e.target.value)} placeholder={isInternational ? '90210' : '00000-000'} className={inp} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 — Dados Fiscais */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-[#EBA500]" /> Dados Fiscais
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Inscricao Estadual</label>
                    <input type="text" value={formData.inscricao_estadual} onChange={e => handleChange('inscricao_estadual', e.target.value)} placeholder="Ex: 123.456.789.000 ou ISENTO" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Inscricao Municipal</label>
                    <input type="text" value={formData.inscricao_municipal} onChange={e => handleChange('inscricao_municipal', e.target.value)} placeholder="Ex: 12345678" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Regime Tributario *</label>
                    <select value={formData.regime_tributario} onChange={e => handleChange('regime_tributario', e.target.value)} className={sel}>
                      <option value="">Selecione...</option>
                      <option value="simples_nacional">Simples Nacional</option>
                      <option value="lucro_real">Lucro Real</option>
                      <option value="lucro_presumido">Lucro Presumido</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Contribuinte do ICMS *</label>
                    <select value={formData.contribuinte_icms} onChange={e => handleChange('contribuinte_icms', e.target.value)} className={sel}>
                      <option value="">Selecione...</option>
                      <option value="contribuinte">Contribuinte</option>
                      <option value="contribuinte_isento">Contribuinte Isento</option>
                      <option value="nao_contribuinte">Nao Contribuinte</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">E cliente Partner?</label>
                    <select value={formData.is_partner_client} onChange={e => handleChange('is_partner_client', e.target.value)} className={sel}>
                      <option value="">Selecione...</option>
                      <option value="sim">Sim</option>
                      <option value="nao">Nao</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4 — Representante Legal */}
            {step === 4 && (
              <div className="space-y-5">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#EBA500]" /> Representante Legal
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nome Completo *</label>
                    <input type="text" value={formData.representante.nome} onChange={e => handleChange('representante.nome', e.target.value)} placeholder="Ex: Joao da Silva" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">CPF *</label>
                    <input type="text" value={formData.representante.cpf} onChange={e => handleChange('representante.cpf', e.target.value)} placeholder="000.000.000-00" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Telefone (com DDD) *</label>
                    <input type="tel" value={formData.representante.telefone} onChange={e => handleChange('representante.telefone', e.target.value)} placeholder="(11) 99999-9999" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">E-mail *</label>
                    <input type="email" value={formData.representante.email} onChange={e => handleChange('representante.email', e.target.value)} placeholder="representante@empresa.com" className={inp} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Endereco Completo *</label>
                    <input type="text" value={formData.representante.endereco} onChange={e => handleChange('representante.endereco', e.target.value)} placeholder="Rua, no, bairro, cidade - estado" className={inp} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5 — Cobranca & Pagamento */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <CreditCard className="h-4 w-4 text-[#EBA500]" /> Contato para NF / Cobranca
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nome Completo *</label>
                      <input type="text" value={formData.contato_cobranca.nome} onChange={e => handleChange('contato_cobranca.nome', e.target.value)} placeholder="Ex: Maria Souza" className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cargo *</label>
                      <input type="text" value={formData.contato_cobranca.cargo} onChange={e => handleChange('contato_cobranca.cargo', e.target.value)} placeholder="Ex: Financeiro" className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">E-mail *</label>
                      <input type="email" value={formData.contato_cobranca.email} onChange={e => handleChange('contato_cobranca.email', e.target.value)} placeholder="financeiro@empresa.com" className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Telefone (com DDD) *</label>
                      <input type="tel" value={formData.contato_cobranca.telefone} onChange={e => handleChange('contato_cobranca.telefone', e.target.value)} placeholder="(11) 99999-9999" className={inp} />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <Wallet className="h-4 w-4 text-[#EBA500]" /> Condicoes de Pagamento
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Melhor Dia para Pagamento *</label>
                      <input type="text" value={formData.melhor_dia_pagamento} onChange={e => handleChange('melhor_dia_pagamento', e.target.value)} placeholder="Ex: 10" className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Forma de Pagamento *</label>
                      <select value={formData.forma_pagamento} onChange={e => handleChange('forma_pagamento', e.target.value)} className={sel}>
                        <option value="">Selecione...</option>
                        <option value="boleto">Boleto Bancario</option>
                        <option value="cartao_credito">Cartao de Credito</option>
                        <option value="pix">Pix</option>
                        <option value="transferencia">Transferencia Bancaria</option>
                        <option value="debito_automatico">Debito Automatico</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  Ao criar a empresa voce sera automaticamente definido como <strong>Administrador</strong> e podera convidar colaboradores.
                </div>
              </div>
            )}

          </div>

          {/* Footer navigation */}
          <div className="px-6 sm:px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={step === 0 ? () => navigate('/dashboard') : prevStep}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {step === 0 ? 'Cancelar' : 'Anterior'}
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors"
              >
                Proximo <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Criando...</>
                ) : (
                  <><Save className="h-4 w-4" /> Criar Empresa</>
                )}
              </button>
            )}
          </div>
        </div>

        </>)} {/* end mode completo PJ */}

        {/* --- Modo Completo PF (wizard 3 passos) ------------------------ */}
        {(mode === 'completo' && !isCompleting && pessoa_tipo === 'pf') && (
          <>
            {/* Step indicator PF */}
            <div className="flex items-center mb-6 gap-0">
              {PF_STEPS.map((s, i) => {
                const Icon = s.icon
                const done = i < step
                const active = i === step
                return (
                  <div key={i} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        done   ? 'bg-[#EBA500] border-[#EBA500] text-white' :
                        active ? 'bg-white border-[#EBA500] text-[#EBA500]' :
                                 'bg-white border-gray-200 text-gray-400'
                      }`}>
                        {done ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-[10px] mt-1 font-medium hidden sm:block ${active ? 'text-[#EBA500]' : done ? 'text-gray-600' : 'text-gray-300'}`}>
                        {s.label}
                      </span>
                    </div>
                    {i < PF_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mb-4 mx-1 transition-all ${i < step ? 'bg-[#EBA500]' : 'bg-gray-200'}`} />
                    )}
                  </div>
                )
              })}
            </div>

            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 sm:p-8">

                {/* PF STEP 0 — Dados Pessoais */}
                {step === 0 && (
                  <div className="space-y-4">
                    <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#EBA500]" /> Dados Pessoais
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nome Completo *</label>
                        <input type="text" value={pfData.nome} onChange={e => handlePfChange('nome', e.target.value)} placeholder="Seu nome completo" className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">CPF *</label>
                        <input type="text" value={pfData.cpf} onChange={e => handlePfChange('cpf', e.target.value)} placeholder="000.000.000-00" className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">RG</label>
                        <input type="text" value={pfData.rg} onChange={e => handlePfChange('rg', e.target.value)} placeholder="00.000.000-0" className={inp} />
                      </div>
                    </div>
                  </div>
                )}

                {/* PF STEP 1 — Endereço */}
                {step === 1 && (
                  <div className="space-y-4">
                    <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#EBA500]" /> Endereço
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Rua / Logradouro *</label>
                        <input type="text" value={pfData.address.street} onChange={e => handlePfChange('address.street', e.target.value)} placeholder="Rua, Avenida..." className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Número</label>
                        <input type="text" value={pfData.address.number} onChange={e => handlePfChange('address.number', e.target.value)} placeholder="123" className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Complemento</label>
                        <input type="text" value={pfData.address.complement} onChange={e => handlePfChange('address.complement', e.target.value)} placeholder="Apto, Bloco..." className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Bairro</label>
                        <input type="text" value={pfData.address.neighborhood} onChange={e => handlePfChange('address.neighborhood', e.target.value)} placeholder="Centro" className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Cidade *</label>
                        <input type="text" value={pfData.address.city} onChange={e => handlePfChange('address.city', e.target.value)} placeholder="São Paulo" className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Estado *</label>
                        <input type="text" value={pfData.address.state} onChange={e => handlePfChange('address.state', e.target.value)} placeholder="SP" className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">CEP *</label>
                        <input type="text" value={pfData.address.zip} onChange={e => handlePfChange('address.zip', e.target.value)} placeholder="00000-000" className={inp} />
                      </div>
                    </div>
                  </div>
                )}

                {/* PF STEP 2 — Contato & Cobrança */}
                {step === 2 && (
                  <div className="space-y-4">
                    <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#EBA500]" /> Contato e Cobrança
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Telefone *</label>
                        <input type="tel" value={pfData.telefone} onChange={e => handlePfChange('telefone', e.target.value)} placeholder="(11) 99999-9999" className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">E-mail *</label>
                        <input type="email" value={pfData.email} onChange={e => handlePfChange('email', e.target.value)} placeholder="seu@email.com" className={inp} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">E-mail para receber NF / Boleto</label>
                        <input type="email" value={pfData.email_nf} onChange={e => handlePfChange('email_nf', e.target.value)} placeholder="financeiro@email.com (deixe em branco para usar o mesmo)" className={inp} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Forma de Pagamento *</label>
                        <select value={pfData.forma_pagamento} onChange={e => handlePfChange('forma_pagamento', e.target.value)} className={sel}>
                          <option value="">Selecione...</option>
                          <option value="boleto">Boleto Bancário</option>
                          <option value="cartao_credito">Cartão de Crédito</option>
                          <option value="pix">Pix</option>
                          <option value="transferencia">Transferência Bancária</option>
                          <option value="debito_automatico">Débito Automático</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Footer PF completo */}
              <div className="px-6 sm:px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button type="button"
                  onClick={step === 0 ? () => navigate('/dashboard') : prevStep}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  {step === 0 ? 'Cancelar' : 'Anterior'}
                </button>
                {step < PF_STEPS.length - 1 ? (
                  <button type="button" onClick={() => { if (validatePfStep()) setStep(s => s + 1) }}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors">
                    Próximo <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmitPfCompleto} disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Criando...</> : <><Save className="h-4 w-4" /> Criar Cadastro</>}
                  </button>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}