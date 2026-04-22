import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabase'
import {
  Clock, X, ArrowLeft, ArrowRight, Save, Phone,
  CreditCard, Users, MapPin, Hash, Upload, Image as ImageIcon,
  Building2, Check, Wallet
} from 'lucide-react'
import toast from '@/lib/toast'

// ─── helpers ─────────────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Informações',  icon: Building2 },
  { label: 'Contato',      icon: Phone },
  { label: 'Endereço',     icon: MapPin },
  { label: 'Fiscal',       icon: Hash },
  { label: 'Representante',icon: Users },
  { label: 'Cobrança',     icon: CreditCard },
]

const EMPTY_FORM = {
  name: '', nome_fantasia: '', cnpj: '', email: '', phone: '',
  website: '', industry: '', size: 'pequena', inscricao_estadual: '',
  inscricao_municipal: '', num_colaboradores: '', regime_tributario: '',
  contribuinte_icms: '', is_partner_client: '',
  representante: { nome: '', cargo: '', email: '', telefone: '', endereco: '', cpf: '' },
  contato_cobranca: { nome: '', cargo: '', email: '', telefone: '' },
  melhor_dia_pagamento: '', forma_pagamento: '',
  address: { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip: '', country: 'Brasil' }
}

function companyToForm(c) {
  if (!c) return EMPTY_FORM
  const rep = c.representante_legal || {}
  const cob = c.contato_cobranca || {}
  const addr = c.address || {}
  return {
    name:               c.name || '',
    nome_fantasia:      c.nome_fantasia || '',
    cnpj:               c.cnpj || '',
    email:              c.email || '',
    phone:              c.phone || '',
    website:            c.website || '',
    industry:           c.industry || '',
    size:               c.size || 'pequena',
    inscricao_estadual: c.inscricao_estadual || '',
    inscricao_municipal:c.inscricao_municipal || '',
    num_colaboradores:  c.num_colaboradores != null ? String(c.num_colaboradores) : '',
    regime_tributario:  c.regime_tributario || '',
    contribuinte_icms:  c.contribuinte_icms || '',
    is_partner_client:  c.is_partner_client === true ? 'sim' : c.is_partner_client === false ? 'nao' : '',
    representante: {
      nome:     rep.nome     || '',
      cargo:    rep.cargo    || '',
      email:    rep.email    || '',
      telefone: rep.telefone || '',
      endereco: rep.endereco || '',
      cpf:      rep.cpf      || '',
    },
    contato_cobranca: {
      nome:     cob.nome     || '',
      cargo:    cob.cargo    || '',
      email:    cob.email    || '',
      telefone: cob.telefone || '',
    },
    melhor_dia_pagamento: c.melhor_dia_pagamento || '',
    forma_pagamento:      c.forma_pagamento      || '',
    address: {
      street:       addr.street       || '',
      number:       addr.number       || '',
      complement:   addr.complement   || '',
      neighborhood: addr.neighborhood || '',
      city:         addr.city         || '',
      state:        addr.state        || '',
      zip:          addr.zip          || '',
      country:      addr.country      || 'Brasil',
    },
  }
}

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

// ─── TrialBanner ─────────────────────────────────────────────────────────────
const TEST_DATA = {
  name: 'Empresa Teste Ltda',
  nome_fantasia: 'Teste Co.',
  cnpj: '12.345.678/0001-99',
  email: 'contato@empresateste.com.br',
  phone: '(11) 91234-5678',
  website: 'https://empresateste.com.br',
  industry: 'Tecnologia',
  size: 'pequena',
  inscricao_estadual: '123.456.789.000',
  inscricao_municipal: '987654321',
  num_colaboradores: '25',
  regime_tributario: 'simples_nacional',
  contribuinte_icms: 'nao_contribuinte',
  is_partner_client: 'nao',
  representante: { nome: 'João da Silva', cargo: 'Diretor', email: 'joao@empresateste.com.br', telefone: '(11) 91234-5678', endereco: 'Rua das Flores, 123, Centro, São Paulo - SP', cpf: '123.456.789-00' },
  contato_cobranca: { nome: 'Maria Souza', cargo: 'Financeiro', email: 'financeiro@empresateste.com.br', telefone: '(11) 98765-4321' },
  melhor_dia_pagamento: '10',
  forma_pagamento: 'pix',
  address: { street: 'Rua das Flores', number: '123', complement: 'Sala 1', neighborhood: 'Centro', city: 'São Paulo', state: 'SP', zip: '01310-100', country: 'Brasil' },
}

export default function TrialBanner({ sidebarCollapsed = false }) {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)          // modal aberto
  const [step, setStep] = useState(0)
  const [isPf, setIsPf] = useState(false)           // tipo do cadastro trial
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [pfData, setPfData] = useState(EMPTY_PF)
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [trialCompanyId, setTrialCompanyId] = useState(null)
  const [daysLeft, setDaysLeft] = useState(null)
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024)

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  // Detectar empresa trial
  const trialEntry = profile?.user_companies?.find(
    uc => uc.is_active && uc.companies?.subscription_status === 'trial'
  )

  useEffect(() => {
    if (!trialEntry) return
    const createdAt = trialEntry.companies?.created_at
    if (createdAt) {
      const elapsed = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
      const days = Math.max(0, Math.ceil(14 - elapsed))
      setDaysLeft(days)
      // Se já expirou, abrir o modal automaticamente passando o id diretamente
      if (days === 0) handleOpen(trialEntry.company_id)
    }
    setTrialCompanyId(trialEntry.company_id)
  }, [trialEntry])

  // Quando abre o modal, buscar dados completos da empresa
  const handleOpen = async (companyId) => {
    const id = companyId || trialCompanyId
    if (!id) return
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      const tipo = data.representante_legal?.tipo
      if (tipo === 'pf') {
        setIsPf(true)
        const addr = data.address || {}
        const cob  = data.contato_cobranca || {}
        setPfData({
          nome:            data.name || '',
          cpf:             data.cnpj || '',
          rg:              data.representante_legal?.rg || '',
          telefone:        data.phone || '',
          email:           data.email || '',
          email_nf:        cob.email || '',
          forma_pagamento: data.forma_pagamento || '',
          address: {
            street:       addr.street       || '',
            number:       addr.number       || '',
            complement:   addr.complement   || '',
            neighborhood: addr.neighborhood || '',
            city:         addr.city         || '',
            state:        addr.state        || '',
            zip:          addr.zip          || '',
          },
        })
      } else {
        setIsPf(false)
        setFormData(companyToForm(data))
        if (data.logo_url) setLogoPreview(data.logo_url)
      }
    } catch (e) {
      toast.error('Erro ao carregar dados da empresa')
      setFormData(EMPTY_FORM)
    }
    setStep(0)
    setOpen(true)
  }

  if (!trialEntry) return null

  // ─── input styles ─────────────────────────────────────────────────────────
  const inp = 'w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]'
  const sel = inp + ' bg-white'

  const handlePfChange = (field, value) => {
    if (field.startsWith('address.')) {
      const sub = field.replace('address.', '')
      setPfData(prev => ({ ...prev, address: { ...prev.address, [sub]: value } }))
    } else {
      setPfData(prev => ({ ...prev, [field]: value }))
    }
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
        if (!pfData.telefone.trim())   { toast.error('Telefone é obrigatório'); return false }
        if (!pfData.email.trim())      { toast.error('E-mail é obrigatório'); return false }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pfData.email)) { toast.error('E-mail inválido'); return false }
        if (!pfData.forma_pagamento)   { toast.error('Forma de pagamento é obrigatória'); return false }
        return true
      default: return true
    }
  }

  const handleSubmitPf = async () => {
    if (!validatePfStep()) return
    setLoading(true)
    try {
      const updateData = {
        name:            pfData.nome.trim(),
        cnpj:            pfData.cpf.trim() || null,
        email:           pfData.email.trim(),
        phone:           pfData.telefone.trim() || null,
        forma_pagamento: pfData.forma_pagamento || null,
        address:         Object.values(pfData.address).some(v => v.trim()) ? pfData.address : null,
        representante_legal: { tipo: 'pf', rg: pfData.rg.trim() || null },
        contato_cobranca: pfData.email_nf.trim() ? { email: pfData.email_nf.trim() } : null,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('companies').update(updateData).eq('id', trialCompanyId)
      if (error) throw error
      toast.success('Cadastro completo! Conta ativada com sucesso.')
      setOpen(false)
      await refreshProfile()
    } catch (err) {
      toast.error(`Erro: ${err.message}`)
    } finally {
      setLoading(false)
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
    if (file.size > 5 * 1024 * 1024) { toast.error('Máximo 5MB'); return }
    setLogoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setLogoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const validateStep = () => {
    switch (step) {
      case 0:
        if (!formData.name.trim()) { toast.error('Razão Social é obrigatória'); return false }
        if (!formData.cnpj.trim()) { toast.error('CNPJ é obrigatório'); return false }
        return true
      case 1:
        if (!formData.email.trim()) { toast.error('E-mail da empresa é obrigatório'); return false }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { toast.error('E-mail inválido'); return false }
        if (!formData.phone.trim()) { toast.error('Telefone é obrigatório'); return false }
        return true
      case 2:
        if (!formData.address.street.trim()) { toast.error('Logradouro é obrigatório'); return false }
        if (!formData.address.city.trim())   { toast.error('Cidade é obrigatória'); return false }
        if (!formData.address.state.trim())  { toast.error('Estado é obrigatório'); return false }
        if (!formData.address.zip.trim())    { toast.error('CEP é obrigatório'); return false }
        return true
      case 3:
        if (!formData.regime_tributario)  { toast.error('Regime tributário é obrigatório'); return false }
        if (!formData.contribuinte_icms)  { toast.error('Contribuinte do ICMS é obrigatório'); return false }
        return true
      case 4:
        if (!formData.representante.nome.trim())     { toast.error('Nome do representante é obrigatório'); return false }
        if (!formData.representante.cpf.trim())      { toast.error('CPF é obrigatório'); return false }
        if (!formData.representante.telefone.trim()) { toast.error('Telefone do representante é obrigatório'); return false }
        if (!formData.representante.email.trim())    { toast.error('E-mail do representante é obrigatório'); return false }
        if (!formData.representante.endereco.trim()) { toast.error('Endereço do representante é obrigatório'); return false }
        return true
      case 5:
        if (!formData.contato_cobranca.nome.trim())    { toast.error('Nome do contato de cobrança é obrigatório'); return false }
        if (!formData.contato_cobranca.cargo.trim())   { toast.error('Cargo é obrigatório'); return false }
        if (!formData.contato_cobranca.email.trim())   { toast.error('E-mail do contato é obrigatório'); return false }
        if (!formData.contato_cobranca.telefone.trim()){ toast.error('Telefone do contato é obrigatório'); return false }
        if (!formData.melhor_dia_pagamento)            { toast.error('Melhor dia para pagamento é obrigatório'); return false }
        if (!formData.forma_pagamento)                 { toast.error('Forma de pagamento é obrigatória'); return false }
        return true
      default: return true
    }
  }

  const nextStep = () => { if (validateStep()) setStep(s => s + 1) }
  const prevStep = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    if (!validateStep()) return
    setLoading(true)
    try {
      let logoUrl = logoPreview && !logoFile ? undefined : null
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const filePath = `${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('company-avatars').upload(filePath, logoFile, { cacheControl: '3600', upsert: false })
        if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`)
        logoUrl = filePath
      }

      const updateData = {
        name:               formData.name.trim(),
        nome_fantasia:      formData.nome_fantasia.trim() || null,
        cnpj:               formData.cnpj.trim() || null,
        email:              formData.email.trim(),
        phone:              formData.phone.trim() || null,
        website:            formData.website.trim() || null,
        industry:           formData.industry.trim() || null,
        size:               formData.size,
        inscricao_estadual: formData.inscricao_estadual.trim() || null,
        inscricao_municipal:formData.inscricao_municipal.trim() || null,
        num_colaboradores:  formData.num_colaboradores ? parseInt(formData.num_colaboradores) || null : null,
        regime_tributario:  formData.regime_tributario || null,
        contribuinte_icms:  formData.contribuinte_icms || null,
        is_partner_client:  formData.is_partner_client === 'sim',
        representante_legal: formData.representante,
        contato_cobranca:   formData.contato_cobranca,
        melhor_dia_pagamento: formData.melhor_dia_pagamento.trim() || null,
        forma_pagamento:    formData.forma_pagamento || null,
        address:            Object.values(formData.address).some(v => v?.trim?.()) ? formData.address : null,
        subscription_status: 'active',
        updated_at:         new Date().toISOString(),
        ...(logoUrl !== undefined && { logo_url: logoUrl }),
      }

      const { error } = await supabase.from('companies').update(updateData).eq('id', trialCompanyId)
      if (error) throw error

      toast.success('Cadastro completo! Conta ativada com sucesso.')
      setOpen(false)
      await refreshProfile()
    } catch (err) {
      console.error(err)
      if (err.message?.includes('cnpj')) toast.error('CNPJ já está em uso por outra empresa')
      else toast.error(`Erro: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fillTestData = () => {
    setFormData(prev => {
      const fill = (curr, test) => {
        if (typeof test === 'object' && test !== null && !Array.isArray(test)) {
          const out = { ...curr }
          for (const k of Object.keys(test)) {
            out[k] = curr[k]?.toString().trim() ? curr[k] : test[k]
          }
          return out
        }
        return curr?.toString().trim() ? curr : test
      }
      return {
        ...prev,
        name:               fill(prev.name, TEST_DATA.name),
        nome_fantasia:      fill(prev.nome_fantasia, TEST_DATA.nome_fantasia),
        cnpj:               fill(prev.cnpj, TEST_DATA.cnpj),
        email:              fill(prev.email, TEST_DATA.email),
        phone:              fill(prev.phone, TEST_DATA.phone),
        website:            fill(prev.website, TEST_DATA.website),
        industry:           fill(prev.industry, TEST_DATA.industry),
        size:               fill(prev.size, TEST_DATA.size),
        inscricao_estadual: fill(prev.inscricao_estadual, TEST_DATA.inscricao_estadual),
        inscricao_municipal:fill(prev.inscricao_municipal, TEST_DATA.inscricao_municipal),
        num_colaboradores:  fill(prev.num_colaboradores, TEST_DATA.num_colaboradores),
        regime_tributario:  fill(prev.regime_tributario, TEST_DATA.regime_tributario),
        contribuinte_icms:  fill(prev.contribuinte_icms, TEST_DATA.contribuinte_icms),
        is_partner_client:  fill(prev.is_partner_client, TEST_DATA.is_partner_client),
        melhor_dia_pagamento: fill(prev.melhor_dia_pagamento, TEST_DATA.melhor_dia_pagamento),
        forma_pagamento:    fill(prev.forma_pagamento, TEST_DATA.forma_pagamento),
        representante:  fill(prev.representante,  TEST_DATA.representante),
        contato_cobranca: fill(prev.contato_cobranca, TEST_DATA.contato_cobranca),
        address:        fill(prev.address, TEST_DATA.address),
      }
    })
    toast.success('Campos vazios preenchidos com dados de teste')
  }

  const urgentColor = daysLeft !== null && daysLeft <= 3

  // ─── Banner ───────────────────────────────────────────────────────────────
  // Todo o conteúdo é portado para document.body para escapar do subtree inert
  // que TrialExpiredGuard aplica ao layout quando o trial expira.
  return createPortal(
    <>
      {/* Fixed floating pill — centered within the content column, stays on scroll */}
      <div
        className="fixed top-4 right-0 z-50 flex justify-center px-4 pointer-events-none transition-all duration-300"
        style={{ left: isDesktop ? (sidebarCollapsed ? '5rem' : '18rem') : '0' }}
      >
        <div className={`pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-2xl text-white text-sm shadow-xl max-w-lg w-full ${
          urgentColor ? 'bg-red-600' : 'bg-[#EBA500]'
        }`}>
          <Clock className="h-4 w-4 shrink-0" />
          <span className="font-medium flex-1 min-w-0 truncate">
            {daysLeft === 0
              ? 'Seu período de teste expirou!'
              : daysLeft === 1
              ? 'Último dia de teste!'
              : `${daysLeft} dias restantes no teste`}
          </span>
          <button
            onClick={() => handleOpen(trialCompanyId)}
            className={`shrink-0 px-3 py-1 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              urgentColor
                ? 'bg-white text-red-600 hover:bg-red-50'
                : 'bg-white text-[#EBA500] hover:bg-amber-50'
            }`}
          >
            Completar cadastro
          </button>

        </div>
      </div>

      {/* ─── Hard block overlay (z-[45]): covers sidebar + entire UI when expired.
           Rendered independently of the modal so deleting the modal via DevTools
           does NOT restore interactivity. Modal sits above this at z-50. ─── */}
      {daysLeft === 0 && (
        <div
          className="fixed inset-0 z-[46] bg-transparent cursor-not-allowed"
          onClick={() => { if (!open) handleOpen(trialCompanyId) }}
          title="Período de teste encerrado — complete o cadastro para continuar"
        />
      )}

      {/* ─── Complete Registration Modal ──────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#EBA500]/10">
                  <Building2 className="h-5 w-5 text-[#EBA500]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Completar Cadastro</h2>
                  <p className="text-xs text-gray-500">Passo {step + 1} de {isPf ? PF_STEPS.length : STEPS.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isPf && (
                <button
                  onClick={fillTestData}
                  title="Preencher campos vazios com dados de teste"
                  className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
                >
                  Preencher teste
                </button>
                )}
                {daysLeft !== 0 && (
                <button onClick={() => setOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              )}
              </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center px-6 py-3 border-b border-gray-100 gap-0 shrink-0">
              {(isPf ? PF_STEPS : STEPS).map((s, i) => {
                const Icon = s.icon
                const done = i < step
                const active = i === step
                const total = isPf ? PF_STEPS.length : STEPS.length
                return (
                  <div key={i} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        done   ? 'bg-[#EBA500] border-[#EBA500] text-white' :
                        active ? 'bg-white border-[#EBA500] text-[#EBA500]' :
                                 'bg-white border-gray-200 text-gray-400'
                      }`}>
                        {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3 h-3" />}
                      </div>
                      <span className={`text-[9px] mt-0.5 font-medium hidden sm:block ${active ? 'text-[#EBA500]' : done ? 'text-gray-500' : 'text-gray-300'}`}>
                        {s.label}
                      </span>
                    </div>
                    {i < total - 1 && (
                      <div className={`flex-1 h-0.5 mb-3 mx-1 transition-all ${i < step ? 'bg-[#EBA500]' : 'bg-gray-200'}`} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Step content */}
            <div className="overflow-y-auto flex-1 px-6 py-5">

              {/* ─── PF STEPS ─── */}
              {isPf && step === 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#EBA500]" /> Dados Pessoais
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Nome Completo *</label>
                      <input type="text" value={pfData.nome} onChange={e => handlePfChange('nome', e.target.value)} placeholder="Seu nome completo" className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">CPF *</label>
                      <input type="text" value={pfData.cpf} onChange={e => handlePfChange('cpf', e.target.value)} placeholder="000.000.000-00" className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">RG</label>
                      <input type="text" value={pfData.rg} onChange={e => handlePfChange('rg', e.target.value)} placeholder="00.000.000-0" className={inp} /></div>
                  </div>
                </div>
              )}

              {isPf && step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#EBA500]" /> Endereço
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 lg:col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Rua / Logradouro *</label>
                      <input type="text" value={pfData.address.street} onChange={e => handlePfChange('address.street', e.target.value)} placeholder="Rua, Avenida..." className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Número</label>
                      <input type="text" value={pfData.address.number} onChange={e => handlePfChange('address.number', e.target.value)} placeholder="123" className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Complemento</label>
                      <input type="text" value={pfData.address.complement} onChange={e => handlePfChange('address.complement', e.target.value)} placeholder="Apto, Bloco..." className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Bairro</label>
                      <input type="text" value={pfData.address.neighborhood} onChange={e => handlePfChange('address.neighborhood', e.target.value)} placeholder="Centro" className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Cidade *</label>
                      <input type="text" value={pfData.address.city} onChange={e => handlePfChange('address.city', e.target.value)} placeholder="São Paulo" className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Estado *</label>
                      <input type="text" value={pfData.address.state} onChange={e => handlePfChange('address.state', e.target.value)} placeholder="SP" className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">CEP *</label>
                      <input type="text" value={pfData.address.zip} onChange={e => handlePfChange('address.zip', e.target.value)} placeholder="00000-000" className={inp} /></div>
                  </div>
                </div>
              )}

              {isPf && step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#EBA500]" /> Contato e Cobrança
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Telefone *</label>
                      <input type="tel" value={pfData.telefone} onChange={e => handlePfChange('telefone', e.target.value)} placeholder="(11) 99999-9999" className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">E-mail *</label>
                      <input type="email" value={pfData.email} onChange={e => handlePfChange('email', e.target.value)} placeholder="seu@email.com" className={inp} /></div>
                    <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">E-mail para receber NF / Boleto</label>
                      <input type="email" value={pfData.email_nf} onChange={e => handlePfChange('email_nf', e.target.value)} placeholder="financeiro@email.com (opcional)" className={inp} /></div>
                    <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Forma de Pagamento *</label>
                      <select value={pfData.forma_pagamento} onChange={e => handlePfChange('forma_pagamento', e.target.value)} className={sel}>
                        <option value="">Selecione...</option>
                        <option value="boleto">Boleto Bancário</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                        <option value="pix">Pix</option>
                        <option value="transferencia">Transferência Bancária</option>
                        <option value="debito_automatico">Débito Automático</option>
                      </select></div>
                  </div>
                </div>
              )}

              {/* ─── PJ STEPS (original) ─── */}

              {/* STEP 0 */}
              {!isPf && step === 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#EBA500]" /> Informações Básicas
                  </h3>
                  {/* Logo */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Logo (Opcional)</label>
                    {!logoPreview ? (
                      <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all">
                        <Upload className="h-5 w-5 text-gray-400 mb-1" />
                        <p className="text-xs text-gray-500">PNG, JPG, WEBP (max 5MB)</p>
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                      </label>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                        <img src={logoPreview} alt="Logo" className="w-12 h-12 object-contain rounded-lg bg-white border border-gray-200" />
                        <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Razão Social *</label>
                      <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Nome Fantasia</label>
                      <input type="text" value={formData.nome_fantasia} onChange={e => handleChange('nome_fantasia', e.target.value)} className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">CNPJ *</label>
                      <input type="text" value={formData.cnpj} onChange={e => handleChange('cnpj', e.target.value)} placeholder="00.000.000/0000-00" className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Porte</label>
                      <select value={formData.size} onChange={e => handleChange('size', e.target.value)} className={sel}>
                        <option value="micro">Microempresa</option>
                        <option value="pequena">Pequena Empresa</option>
                        <option value="media">Média Empresa</option>
                        <option value="grande">Grande Empresa</option>
                      </select></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Segmento</label>
                      <input type="text" value={formData.industry} onChange={e => handleChange('industry', e.target.value)} className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Nº de Colaboradores</label>
                      <input type="number" min="0" value={formData.num_colaboradores} onChange={e => handleChange('num_colaboradores', e.target.value)} className={inp} /></div>
                  </div>
                </div>
              )}

              {/* STEP 1 */}
              {!isPf && step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#EBA500]" /> Informações de Contato
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">E-mail Principal *</label>
                      <input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Telefone (com DDD) *</label>
                      <input type="tel" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} className={inp} /></div>
                    <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
                      <input type="url" value={formData.website} onChange={e => handleChange('website', e.target.value)} className={inp} /></div>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {!isPf && step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#EBA500]" /> Endereço
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">País</label>
                      <input type="text" value={formData.address.country} onChange={e => handleChange('address.country', e.target.value)} className={inp} /></div>
                    <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Logradouro *</label>
                      <input type="text" value={formData.address.street} onChange={e => handleChange('address.street', e.target.value)} className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Número</label>
                      <input type="text" value={formData.address.number} onChange={e => handleChange('address.number', e.target.value)} className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Complemento</label>
                      <input type="text" value={formData.address.complement} onChange={e => handleChange('address.complement', e.target.value)} className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Bairro</label>
                      <input type="text" value={formData.address.neighborhood} onChange={e => handleChange('address.neighborhood', e.target.value)} className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Cidade *</label>
                      <input type="text" value={formData.address.city} onChange={e => handleChange('address.city', e.target.value)} className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Estado *</label>
                      <input type="text" value={formData.address.state} onChange={e => handleChange('address.state', e.target.value)} placeholder="SP" className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">CEP *</label>
                      <input type="text" value={formData.address.zip} onChange={e => handleChange('address.zip', e.target.value)} placeholder="00000-000" className={inp} /></div>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {!isPf && step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Hash className="h-4 w-4 text-[#EBA500]" /> Dados Fiscais
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Inscrição Estadual</label>
                      <input type="text" value={formData.inscricao_estadual} onChange={e => handleChange('inscricao_estadual', e.target.value)} className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Inscrição Municipal</label>
                      <input type="text" value={formData.inscricao_municipal} onChange={e => handleChange('inscricao_municipal', e.target.value)} className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Regime Tributário *</label>
                      <select value={formData.regime_tributario} onChange={e => handleChange('regime_tributario', e.target.value)} className={sel}>
                        <option value="">Selecione...</option>
                        <option value="simples_nacional">Simples Nacional</option>
                        <option value="lucro_real">Lucro Real</option>
                        <option value="lucro_presumido">Lucro Presumido</option>
                      </select></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Contribuinte do ICMS *</label>
                      <select value={formData.contribuinte_icms} onChange={e => handleChange('contribuinte_icms', e.target.value)} className={sel}>
                        <option value="">Selecione...</option>
                        <option value="contribuinte">Contribuinte</option>
                        <option value="contribuinte_isento">Contribuinte Isento</option>
                        <option value="nao_contribuinte">Não Contribuinte</option>
                      </select></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">É cliente Partner?</label>
                      <select value={formData.is_partner_client} onChange={e => handleChange('is_partner_client', e.target.value)} className={sel}>
                        <option value="">Selecione...</option>
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                      </select></div>
                  </div>
                </div>
              )}

              {/* STEP 4 */}
              {!isPf && step === 4 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#EBA500]" /> Representante Legal
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Nome Completo *</label>
                      <input type="text" value={formData.representante.nome} onChange={e => handleChange('representante.nome', e.target.value)} className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">CPF *</label>
                      <input type="text" value={formData.representante.cpf} onChange={e => handleChange('representante.cpf', e.target.value)} placeholder="000.000.000-00" className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
                      <input type="text" value={formData.representante.cargo} onChange={e => handleChange('representante.cargo', e.target.value)} className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Telefone *</label>
                      <input type="tel" value={formData.representante.telefone} onChange={e => handleChange('representante.telefone', e.target.value)} className={inp} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">E-mail *</label>
                      <input type="email" value={formData.representante.email} onChange={e => handleChange('representante.email', e.target.value)} className={inp} /></div>
                    <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Endereço Completo *</label>
                      <input type="text" value={formData.representante.endereco} onChange={e => handleChange('representante.endereco', e.target.value)} placeholder="Rua, nº, bairro, cidade - estado" className={inp} /></div>
                  </div>
                </div>
              )}

              {/* STEP 5 */}
              {!isPf && step === 5 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                      <CreditCard className="h-4 w-4 text-[#EBA500]" /> Contato para NF / Cobrança
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">Nome Completo *</label>
                        <input type="text" value={formData.contato_cobranca.nome} onChange={e => handleChange('contato_cobranca.nome', e.target.value)} className={inp} /></div>
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">Cargo *</label>
                        <input type="text" value={formData.contato_cobranca.cargo} onChange={e => handleChange('contato_cobranca.cargo', e.target.value)} className={inp} /></div>
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">E-mail *</label>
                        <input type="email" value={formData.contato_cobranca.email} onChange={e => handleChange('contato_cobranca.email', e.target.value)} className={inp} /></div>
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">Telefone *</label>
                        <input type="tel" value={formData.contato_cobranca.telefone} onChange={e => handleChange('contato_cobranca.telefone', e.target.value)} className={inp} /></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                      <Wallet className="h-4 w-4 text-[#EBA500]" /> Condições de Pagamento
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">Melhor Dia para Pagamento *</label>
                        <input type="text" value={formData.melhor_dia_pagamento} onChange={e => handleChange('melhor_dia_pagamento', e.target.value)} placeholder="Ex: 10" className={inp} /></div>
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">Forma de Pagamento *</label>
                        <select value={formData.forma_pagamento} onChange={e => handleChange('forma_pagamento', e.target.value)} className={sel}>
                          <option value="">Selecione...</option>
                          <option value="boleto">Boleto Bancário</option>
                          <option value="cartao_credito">Cartão de Crédito</option>
                          <option value="pix">Pix</option>
                          <option value="transferencia">Transferência Bancária</option>
                          <option value="debito_automatico">Débito Automático</option>
                        </select></div>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                    Ao completar o cadastro sua conta será <strong>ativada permanentemente</strong> sem restrições.
                  </div>
                </div>
              )}

            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={step === 0 ? () => { if (daysLeft !== 0) setOpen(false) } : prevStep}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {step === 0 ? 'Fechar' : 'Anterior'}
              </button>

              {isPf ? (
                step < PF_STEPS.length - 1 ? (
                  <button type="button" onClick={() => { if (validatePfStep()) setStep(s => s + 1) }}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors">
                    Próximo <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmitPf} disabled={loading}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Salvando...</> : <><Save className="h-4 w-4" /> Ativar conta</>}
                  </button>
                )
              ) : (
                step < STEPS.length - 1 ? (
                  <button type="button" onClick={nextStep}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors">
                    Próximo <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={loading}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#EBA500] hover:bg-[#d49500] rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Salvando...</> : <><Save className="h-4 w-4" /> Ativar conta</>}
                  </button>
                )
              )}
            </div>

          </div>
        </div>
      )}
    </>,
    document.body
  )
}
