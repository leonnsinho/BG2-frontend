import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/useAuth'
import { supabase } from '../services/supabase'
import toast from '@/lib/toast'
import { 
  User, 
  Mail, 
  Building2, 
  Shield, 
  Key, 
  Moon, 
  Sun, 
  Globe,
  Save,
  Eye,
  EyeOff,
  Camera,
  Trash2,
  Phone,
  MapPin,
  Hash,
  CreditCard,
  Users,
  Upload,
  Image as ImageIcon,
  X,
  Wallet
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Loading } from '../components/ui/Loading'

// Adicionar estilos para animações
const styles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out forwards;
  }
`

// Injetar estilos no DOM
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.type = 'text/css'
  styleSheet.innerText = styles
  document.head.appendChild(styleSheet)
}

const EMPTY_COMPANY_PJ = {
  name: '', nome_fantasia: '', cnpj: '', email: '', phone: '',
  website: '', industry: '', size: 'pequena', inscricao_estadual: '',
  inscricao_municipal: '', num_colaboradores: '', regime_tributario: '',
  contribuinte_icms: '', is_partner_client: 'nao',
  melhor_dia_pagamento: '', forma_pagamento: '',
  representante: { nome: '', cargo: '', email: '', telefone: '', endereco: '', cpf: '' },
  contato_cobranca: { nome: '', cargo: '', email: '', telefone: '' },
  address: { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip: '', country: '' },
}

const EMPTY_COMPANY_PF = {
  nome: '', cpf: '', rg: '', telefone: '', email: '', email_nf: '',
  forma_pagamento: '',
  address: { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip: '' },
}

const SettingsPage = () => {
  const { user, profile, refreshProfile } = useAuth()
  const permissions = usePermissions()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [avatarSignedUrl, setAvatarSignedUrl] = useState('') // 🔥 NOVO: URL assinada do avatar

  // Exclusão de conta
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Estados para os formulários
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    avatar_url: profile?.avatar_url || ''
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo'
  })

  // ─── Empresa ─────────────────────────────────────────────────────────────
  const adminUc = profile?.user_companies?.find(uc => uc.is_active && uc.role === 'company_admin')
  const isCompanyAdmin = !!adminUc
  const adminCompanyId = adminUc?.company_id

  const [companyLoading, setCompanyLoading] = useState(false)
  const [companyLoaded, setCompanyLoaded] = useState(false)
  const [isPfCompany, setIsPfCompany] = useState(false)
  const [companyForm, setCompanyForm] = useState(EMPTY_COMPANY_PJ)
  const [pfCompanyForm, setPfCompanyForm] = useState(EMPTY_COMPANY_PF)
  const [companyLogoFile, setCompanyLogoFile] = useState(null)
  const [companyLogoPreview, setCompanyLogoPreview] = useState(null)

  // Carregar dados da empresa ao abrir a aba
  React.useEffect(() => {
    if (activeTab === 'empresa' && !companyLoaded && adminCompanyId) {
      loadCompanyData()
    }
  }, [activeTab, adminCompanyId])

  const loadCompanyData = async () => {
    if (!adminCompanyId) return
    setCompanyLoading(true)
    try {
      const { data, error } = await supabase.from('companies').select('*').eq('id', adminCompanyId).single()
      if (error) throw error
      const isPf = data.representante_legal?.tipo === 'pf'
      setIsPfCompany(isPf)
      if (isPf) {
        const addr = data.address || {}
        const cob  = data.contato_cobranca || {}
        setPfCompanyForm({
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
        const rep  = data.representante_legal || {}
        const cob  = data.contato_cobranca    || {}
        const addr = data.address             || {}
        setCompanyForm({
          name:               data.name               || '',
          nome_fantasia:      data.nome_fantasia       || '',
          cnpj:               data.cnpj               || '',
          email:              data.email              || '',
          phone:              data.phone              || '',
          website:            data.website            || '',
          industry:           data.industry           || '',
          size:               data.size               || 'pequena',
          inscricao_estadual: data.inscricao_estadual || '',
          inscricao_municipal:data.inscricao_municipal|| '',
          num_colaboradores:  data.num_colaboradores != null ? String(data.num_colaboradores) : '',
          regime_tributario:  data.regime_tributario  || '',
          contribuinte_icms:  data.contribuinte_icms  || '',
          is_partner_client:  data.is_partner_client ? 'sim' : 'nao',
          melhor_dia_pagamento: data.melhor_dia_pagamento || '',
          forma_pagamento:    data.forma_pagamento    || '',
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
          address: {
            street:       addr.street       || '',
            number:       addr.number       || '',
            complement:   addr.complement   || '',
            neighborhood: addr.neighborhood || '',
            city:         addr.city         || '',
            state:        addr.state        || '',
            zip:          addr.zip          || '',
            country:      addr.country      || '',
          },
        })
        if (data.logo_url) setCompanyLogoPreview(data.logo_url)
      }
      setCompanyLoaded(true)
    } catch (e) {
      toast.error('Erro ao carregar dados da empresa')
    } finally {
      setCompanyLoading(false)
    }
  }

  const handleCompanyChange = (field, value) => {
    const parts = field.split('.')
    if (parts.length === 2) {
      setCompanyForm(prev => ({ ...prev, [parts[0]]: { ...prev[parts[0]], [parts[1]]: value } }))
    } else {
      setCompanyForm(prev => ({ ...prev, [field]: value }))
    }
  }

  const handlePfCompanyChange = (field, value) => {
    if (field.startsWith('address.')) {
      const sub = field.replace('address.', '')
      setPfCompanyForm(prev => ({ ...prev, address: { ...prev.address, [sub]: value } }))
    } else {
      setPfCompanyForm(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleCompanyLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Máximo 5MB'); return }
    setCompanyLogoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setCompanyLogoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleCompanySave = async () => {
    if (!adminCompanyId) return
    setCompanyLoading(true)
    try {
      let updateData
      if (isPfCompany) {
        updateData = {
          name:               pfCompanyForm.nome.trim(),
          cnpj:               pfCompanyForm.cpf.trim()  || null,
          email:              pfCompanyForm.email.trim(),
          phone:              pfCompanyForm.telefone.trim() || null,
          forma_pagamento:    pfCompanyForm.forma_pagamento || null,
          address:            Object.values(pfCompanyForm.address).some(v => v.trim()) ? pfCompanyForm.address : null,
          representante_legal:{ tipo: 'pf', rg: pfCompanyForm.rg.trim() || null },
          contato_cobranca:   pfCompanyForm.email_nf.trim() ? { email: pfCompanyForm.email_nf.trim() } : null,
          updated_at:         new Date().toISOString(),
        }
      } else {
        let logoUrl = companyLogoPreview && !companyLogoFile ? undefined : null
        if (companyLogoFile) {
          const fileExt = companyLogoFile.name.split('.').pop()
          const filePath = `${Date.now()}.${fileExt}`
          const { error: uploadError } = await supabase.storage
            .from('company-avatars').upload(filePath, companyLogoFile, { cacheControl: '3600', upsert: false })
          if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`)
          logoUrl = filePath
        }
        updateData = {
          name:               companyForm.name.trim(),
          nome_fantasia:      companyForm.nome_fantasia.trim() || null,
          cnpj:               companyForm.cnpj.trim() || null,
          email:              companyForm.email.trim(),
          phone:              companyForm.phone.trim() || null,
          website:            companyForm.website.trim() || null,
          industry:           companyForm.industry.trim() || null,
          size:               companyForm.size,
          inscricao_estadual: companyForm.inscricao_estadual.trim() || null,
          inscricao_municipal:companyForm.inscricao_municipal.trim() || null,
          num_colaboradores:  companyForm.num_colaboradores ? parseInt(companyForm.num_colaboradores) || null : null,
          regime_tributario:  companyForm.regime_tributario || null,
          contribuinte_icms:  companyForm.contribuinte_icms || null,
          is_partner_client:  companyForm.is_partner_client === 'sim',
          representante_legal:{ ...companyForm.representante },
          contato_cobranca:   { ...companyForm.contato_cobranca },
          melhor_dia_pagamento: companyForm.melhor_dia_pagamento.trim() || null,
          forma_pagamento:    companyForm.forma_pagamento || null,
          address:            Object.values(companyForm.address).some(v => v?.trim?.()) ? companyForm.address : null,
          updated_at:         new Date().toISOString(),
          ...(logoUrl !== undefined && { logo_url: logoUrl }),
        }
      }
      const { error } = await supabase.from('companies').update(updateData).eq('id', adminCompanyId)
      if (error) throw error
      toast.success('Dados da empresa atualizados com sucesso!')
      setCompanyLogoFile(null)
    } catch (err) {
      console.error(err)
      if (err.message?.includes('cnpj')) toast.error('CNPJ já está em uso por outra empresa')
      else toast.error(`Erro: ${err.message}`)
    } finally {
      setCompanyLoading(false)
    }
  }

  // 🔥 NOVO: Gerar URL assinada para exibir avatar
  const getAvatarSignedUrl = async (avatarPath) => {
    if (!avatarPath) {
      setAvatarSignedUrl('')
      return
    }

    try {
      const { data, error } = await supabase.storage
        .from('profile-avatars')
        .createSignedUrl(avatarPath, 3600) // 1 hora de validade

      if (error) throw error
      setAvatarSignedUrl(data.signedUrl)
    } catch (error) {
      console.error('Erro ao gerar URL do avatar:', error)
      setAvatarSignedUrl('')
    }
  }

  // 🔥 NOVO: Atualizar URL assinada quando avatar mudar
  React.useEffect(() => {
    if (profile?.avatar_url) {
      getAvatarSignedUrl(profile.avatar_url)
    } else {
      setAvatarSignedUrl('')
    }
  }, [profile?.avatar_url])

  // Atualizar perfil
  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      await refreshProfile()
      toast.success('Perfil atualizado com sucesso!')
    } catch (error) {
      toast.error('Erro ao atualizar perfil: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Alterar senha
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Validações
    if (!passwordForm.currentPassword) {
      toast.error('Digite sua senha atual para confirmar')
      setIsLoading(false)
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('As senhas não conferem')
      setIsLoading(false)
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres')
      setIsLoading(false)
      return
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error('A nova senha deve ser diferente da senha atual')
      setIsLoading(false)
      return
    }

    try {
      // Primeiro, verificar a senha atual fazendo um re-login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordForm.currentPassword
      })

      if (signInError) {
        toast.error('Senha atual incorreta')
        setIsLoading(false)
        return
      }

      // Se a senha atual estiver correta, atualizar para a nova senha
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (error) throw error

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })

      toast.success('Senha alterada com sucesso!')
    } catch (error) {
      toast.error('Erro ao alterar senha: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Excluir conta
  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao excluir conta')
      toast.success('Conta excluída com sucesso.')
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (err) {
      toast.error('Erro ao excluir conta: ' + err.message)
    } finally {
      setDeleteLoading(false)
      setShowDeleteModal(false)
    }
  }

  // Upload de avatar
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG, GIF ou WebP')
      return
    }

    // Validar tamanho (5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB em bytes
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo: 5MB')
      return
    }

    setIsLoading(true)

    try {
      // Deletar avatar antigo se existir
      if (profileForm.avatar_url) {
        const oldPath = profileForm.avatar_url
        await supabase.storage
          .from('profile-avatars')
          .remove([oldPath])
      }

      // Nome do arquivo: user_id/avatar.ext
      const fileExt = file.name.split('.').pop()
      const fileName = `avatar.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload do novo avatar
      const { error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(filePath, file, {
          upsert: true, // Substitui se já existir
          contentType: file.type
        })

      if (uploadError) throw uploadError

      // Atualizar perfil com o path do avatar (não URL pública, pois bucket é privado)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: filePath, // Salvar apenas o path
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfileForm(prev => ({ ...prev, avatar_url: filePath }))
      await refreshProfile()
      toast.success('Foto de perfil atualizada com sucesso!')
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      toast.error('Erro ao fazer upload da foto: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Remover avatar
  const handleRemoveAvatar = async () => {
    if (!profileForm.avatar_url) {
      toast.error('Nenhuma foto para remover')
      return
    }

    setIsLoading(true)

    try {
      // Deletar arquivo do storage
      const { error: deleteError } = await supabase.storage
        .from('profile-avatars')
        .remove([profileForm.avatar_url])

      if (deleteError) {
        console.warn('Erro ao deletar arquivo:', deleteError)
        // Continuar mesmo se falhar (arquivo pode não existir)
      }

      // Atualizar perfil
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setProfileForm(prev => ({ ...prev, avatar_url: '' }))
      await refreshProfile()
      toast.success('Foto de perfil removida com sucesso!')
    } catch (error) {
      console.error('Erro ao remover:', error)
      toast.error('Erro ao remover foto: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Tabs de navegação
  const tabs = [
    { id: 'profile', name: 'Perfil', icon: User },
    { id: 'password', name: 'Senha', icon: Key },
    { id: 'preferences', name: 'Preferências', icon: Globe },
    ...(isCompanyAdmin ? [{ id: 'empresa', name: 'Empresa', icon: Building2 }] : [])
  ]

  if (permissions.isLoading) {
    return <Loading />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-[#EBA500]/20 to-[#EBA500]/10">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-[#EBA500]" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#373435] mb-1 sm:mb-3 break-words">Configurações</h1>
                <p className="text-gray-600 text-sm sm:text-base lg:text-lg break-words">
                  Gerencie suas informações pessoais e preferências da conta
                </p>
              </div>
            </div>
          </div>

          {/* Navegação por abas */}
          <div className="overflow-x-auto mb-6 sm:mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-2 bg-white/80 backdrop-blur-sm p-2 rounded-3xl shadow-sm border border-gray-200/50 min-w-max sm:min-w-0">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 sm:px-6 py-3 rounded-2xl text-xs sm:text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 whitespace-nowrap touch-manipulation min-h-[44px] ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 text-white shadow-lg shadow-[#EBA500]/25'
                        : 'text-[#373435] hover:bg-gradient-to-r hover:from-[#EBA500]/10 hover:to-[#EBA500]/5 hover:text-[#EBA500]'
                    }`}
                  >
                    <Icon className={`h-4 w-4 mr-2 transition-all duration-300 ${
                      activeTab === tab.id ? 'text-white' : 'text-gray-500'
                    }`} />
                    {tab.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Conteúdo das abas com animação */}
          <div className="relative min-h-[600px]">
            <div className={`transition-all duration-500 ease-in-out transform ${
              activeTab ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
        {/* Aba Perfil */}
        {activeTab === 'profile' && (
          <Card className="p-4 sm:p-6 bg-white shadow-sm border border-gray-200/50 rounded-2xl sm:rounded-3xl transform transition-all duration-500 ease-in-out">
            <div className="animate-fadeIn">
              <h3 className="text-lg sm:text-xl font-semibold text-[#373435] mb-4 sm:mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-[#EBA500]" />
                Informações Pessoais
              </h3>
              
              {/* Avatar */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="relative group">
                  {avatarSignedUrl ? (
                    <img
                      src={avatarSignedUrl}
                      alt="Foto de perfil"
                      className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border-4 border-white shadow-lg ring-2 ring-[#EBA500]/20"
                      onError={(e) => {
                        // Fallback se a imagem não carregar
                        e.target.style.display = 'none'
                        e.target.nextElementSibling.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  {!avatarSignedUrl && (
                    <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-[#EBA500] to-[#d99500] flex items-center justify-center border-4 border-white shadow-lg text-white font-bold text-2xl sm:text-3xl">
                      {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : <User className="h-10 w-10 sm:h-12 sm:w-12" />}
                    </div>
                  )}
                  
                  <label className="absolute bottom-0 right-0 bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 rounded-full p-2 text-white cursor-pointer hover:shadow-lg transform hover:scale-110 active:scale-95 transition-all duration-200 ring-2 ring-white touch-manipulation">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleAvatarUpload}
                      disabled={isLoading}
                    />
                  </label>
                </div>
                
                <div className="text-center sm:text-left">
                  <h4 className="text-sm font-medium text-[#373435]">Foto do Perfil</h4>
                  <p className="text-xs sm:text-sm text-gray-600">JPG, PNG, GIF ou WebP. Máximo 5MB.</p>
                  {avatarSignedUrl && (
                    <button
                      onClick={handleRemoveAvatar}
                      className="mt-2 text-xs sm:text-sm text-red-600 hover:text-red-700 inline-flex items-center hover:underline transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover foto
                    </button>
                  )}
                </div>
              </div>

              {/* Formulário do Perfil */}
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#373435] mb-2">
                      Nome Completo
                    </label>
                    <Input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Seu nome completo"
                      required
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#373435] mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-gray-50/50 w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      O email não pode ser alterado
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#373435] mb-2">
                      Telefone
                    </label>
                    <Input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#373435] mb-2">
                      Função
                    </label>
                    <div className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/5 rounded-2xl border border-[#EBA500]/20">
                      <Shield className="h-4 w-4 text-[#EBA500]" />
                      <span className="text-sm text-[#373435] capitalize font-medium">
                        {profile?.role?.replace('_', ' ') || 'Usuário'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full sm:w-auto bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 hover:from-[#EBA500]/90 hover:to-[#EBA500]/80 text-white transform hover:scale-105 active:scale-95 transition-all duration-200 min-h-[44px] touch-manipulation"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Zona de Perigo */}
              <div className="mt-10 pt-6 border-t border-red-100">
                <h3 className="text-base font-semibold text-red-600 mb-1 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Zona de Perigo
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Excluir sua conta remove permanentemente todos os seus dados. Esta ação não pode ser desfeita.
                </p>
                <button
                  onClick={() => { setDeleteConfirmText(''); setShowDeleteModal(true) }}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
                >
                  Excluir minha conta
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Modal de confirmação de exclusão de conta */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setShowDeleteModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Excluir conta</h3>
                  <p className="text-xs text-gray-500">Esta ação é permanente e irreversível</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Todos os seus dados serão apagados: perfil, configurações e histórico. Para confirmar, digite <strong>EXCLUIR</strong> abaixo.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="Digite EXCLUIR para confirmar"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'EXCLUIR' || deleteLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Excluindo...</> : <><Trash2 className="h-4 w-4" />Excluir conta</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Aba Senha */}
        {activeTab === 'password' && (
          <Card className="p-4 sm:p-6 bg-white shadow-sm border border-gray-200/50 rounded-2xl sm:rounded-3xl transform transition-all duration-500 ease-in-out">
            <div className="animate-fadeIn">
              <h3 className="text-lg sm:text-xl font-semibold text-[#373435] mb-4 sm:mb-6 flex items-center gap-2">
                <Key className="w-5 h-5 text-[#EBA500]" />
                Alterar Senha
              </h3>
              
              <form onSubmit={handlePasswordChange} className="space-y-4 sm:space-y-6 max-w-md">
                <div className="relative">
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    Senha Atual *
                  </label>
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Digite sua senha atual"
                    required
                    className="w-full pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-10 text-gray-400 hover:text-[#EBA500] transition-colors duration-200"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    Nova Senha *
                  </label>
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Digite sua nova senha"
                    required
                    minLength={6}
                    className="w-full pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-10 text-gray-400 hover:text-[#EBA500] transition-colors duration-200"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    Confirmar Nova Senha *
                  </label>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirme sua nova senha"
                    required
                    minLength={6}
                    className="w-full pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-10 text-gray-400 hover:text-[#EBA500] transition-colors duration-200"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Indicador de força da senha */}
                {passwordForm.newPassword && (
                  <div className="space-y-2">
                    <div className="text-sm text-[#373435] font-medium">Força da senha:</div>
                    <div className="flex space-x-1">
                      <div className={`h-2 w-1/4 rounded-full ${passwordForm.newPassword.length >= 6 ? 'bg-red-400' : 'bg-gray-200'}`}></div>
                      <div className={`h-2 w-1/4 rounded-full ${passwordForm.newPassword.length >= 8 && /[A-Z]/.test(passwordForm.newPassword) ? 'bg-yellow-400' : 'bg-gray-200'}`}></div>
                      <div className={`h-2 w-1/4 rounded-full ${passwordForm.newPassword.length >= 8 && /[A-Z]/.test(passwordForm.newPassword) && /[0-9]/.test(passwordForm.newPassword) ? 'bg-[#EBA500]' : 'bg-gray-200'}`}></div>
                      <div className={`h-2 w-1/4 rounded-full ${passwordForm.newPassword.length >= 10 && /[A-Z]/.test(passwordForm.newPassword) && /[0-9]/.test(passwordForm.newPassword) && /[!@#$%^&*]/.test(passwordForm.newPassword) ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                    </div>
                    <div className="text-xs text-gray-600">
                      {passwordForm.newPassword.length < 6 && 'Muito fraca - Mínimo 6 caracteres'}
                      {passwordForm.newPassword.length >= 6 && passwordForm.newPassword.length < 8 && 'Fraca - Adicione mais caracteres'}
                      {passwordForm.newPassword.length >= 8 && !/[A-Z]/.test(passwordForm.newPassword) && 'Média - Adicione letras maiúsculas'}
                      {passwordForm.newPassword.length >= 8 && /[A-Z]/.test(passwordForm.newPassword) && !/[0-9]/.test(passwordForm.newPassword) && 'Boa - Adicione números'}
                      {passwordForm.newPassword.length >= 8 && /[A-Z]/.test(passwordForm.newPassword) && /[0-9]/.test(passwordForm.newPassword) && !/[!@#$%^&*]/.test(passwordForm.newPassword) && 'Boa - Adicione símbolos para ficar forte'}
                      {passwordForm.newPassword.length >= 10 && /[A-Z]/.test(passwordForm.newPassword) && /[0-9]/.test(passwordForm.newPassword) && /[!@#$%^&*]/.test(passwordForm.newPassword) && 'Muito forte'}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full sm:w-auto bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 hover:from-[#EBA500]/90 hover:to-[#EBA500]/80 text-white transform hover:scale-105 active:scale-95 transition-all duration-200 min-h-[44px] touch-manipulation"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Alterando...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        Alterar Senha
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        )}

        {/* Aba Preferências */}
        {activeTab === 'preferences' && (
          <Card className="p-4 sm:p-6 bg-white shadow-sm border border-gray-200/50 rounded-2xl sm:rounded-3xl transform transition-all duration-500 ease-in-out">
            <div className="animate-fadeIn">
              <h3 className="text-lg sm:text-xl font-semibold text-[#373435] mb-4 sm:mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#EBA500]" />
                Preferências do Sistema
              </h3>
              
              <div className="space-y-6 sm:space-y-8">
                {/* Tema */}
                <div>
                  <label className="block text-sm font-medium text-[#373435] mb-3 sm:mb-4">Tema</label>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button
                      onClick={() => setPreferences(prev => ({ ...prev, theme: 'light' }))}
                      className={`flex items-center justify-center sm:justify-start space-x-3 p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-md transform hover:scale-105 active:scale-95 touch-manipulation min-h-[44px] ${
                        preferences.theme === 'light' 
                          ? 'border-[#EBA500] bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/5 shadow-lg' 
                          : 'border-gray-200 hover:border-[#EBA500]/30'
                      }`}
                    >
                      <Sun className={`h-5 w-5 ${preferences.theme === 'light' ? 'text-[#EBA500]' : 'text-gray-500'}`} />
                      <span className="text-sm font-medium">Claro</span>
                    </button>
                    <button
                      onClick={() => setPreferences(prev => ({ ...prev, theme: 'dark' }))}
                      className={`flex items-center justify-center sm:justify-start space-x-3 p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-md transform hover:scale-105 active:scale-95 touch-manipulation min-h-[44px] ${
                        preferences.theme === 'dark' 
                          ? 'border-[#EBA500] bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/5 shadow-lg' 
                          : 'border-gray-200 hover:border-[#EBA500]/30'
                      }`}
                    >
                      <Moon className={`h-5 w-5 ${preferences.theme === 'dark' ? 'text-[#EBA500]' : 'text-gray-500'}`} />
                      <span className="text-sm font-medium">Escuro</span>
                    </button>
                  </div>
                </div>

                {/* Idioma */}
                <div>
                  <label className="block text-sm font-medium text-[#373435] mb-2">Idioma</label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español (España)</option>
                  </select>
                </div>

                {/* Fuso Horário */}
                <div>
                  <label className="block text-sm font-medium text-[#373435] mb-2">Fuso Horário</label>
                  <select
                    value={preferences.timezone}
                    onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200"
                  >
                    <option value="America/Sao_Paulo">São Paulo (UTC-3)</option>
                    <option value="America/New_York">Nova York (UTC-5)</option>
                    <option value="Europe/London">Londres (UTC+0)</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 flex justify-end">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 hover:from-[#EBA500]/90 hover:to-[#EBA500]/80 text-white transform hover:scale-105 active:scale-95 transition-all duration-200 min-h-[44px] touch-manipulation">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Preferências
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Aba Empresa */}
        {activeTab === 'empresa' && (
          <Card className="p-4 sm:p-6 bg-white shadow-sm border border-gray-200/50 rounded-2xl sm:rounded-3xl">
            <div className="animate-fadeIn">
              <h3 className="text-lg sm:text-xl font-semibold text-[#373435] mb-6 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#EBA500]" />
                {isPfCompany ? 'Dados Pessoais (Pessoa Física)' : 'Dados da Empresa'}
              </h3>

              {companyLoading && !companyLoaded ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EBA500]" /></div>
              ) : isPfCompany ? (
                /* ─── FORMULÁRIO PF ─── */
                <div className="space-y-8">

                  {/* Dados Pessoais */}
                  <section>
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                      <Users className="h-4 w-4 text-[#EBA500]" /> Dados Pessoais
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium text-[#373435] mb-2">Nome Completo *</label>
                        <Input value={pfCompanyForm.nome} onChange={e => handlePfCompanyChange('nome', e.target.value)} placeholder="Seu nome completo" className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">CPF *</label>
                        <Input value={pfCompanyForm.cpf} onChange={e => handlePfCompanyChange('cpf', e.target.value)} placeholder="000.000.000-00" className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">RG</label>
                        <Input value={pfCompanyForm.rg} onChange={e => handlePfCompanyChange('rg', e.target.value)} placeholder="00.000.000-0" className="w-full" />
                      </div>
                    </div>
                  </section>

                  {/* Endereço PF */}
                  <section>
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                      <MapPin className="h-4 w-4 text-[#EBA500]" /> Endereço
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-[#373435] mb-2">Rua / Logradouro *</label>
                        <Input value={pfCompanyForm.address.street} onChange={e => handlePfCompanyChange('address.street', e.target.value)} placeholder="Rua, Avenida..." className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Número</label>
                        <Input value={pfCompanyForm.address.number} onChange={e => handlePfCompanyChange('address.number', e.target.value)} placeholder="123" className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Complemento</label>
                        <Input value={pfCompanyForm.address.complement} onChange={e => handlePfCompanyChange('address.complement', e.target.value)} placeholder="Apto, Bloco..." className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Bairro</label>
                        <Input value={pfCompanyForm.address.neighborhood} onChange={e => handlePfCompanyChange('address.neighborhood', e.target.value)} placeholder="Centro" className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Cidade *</label>
                        <Input value={pfCompanyForm.address.city} onChange={e => handlePfCompanyChange('address.city', e.target.value)} placeholder="São Paulo" className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Estado *</label>
                        <Input value={pfCompanyForm.address.state} onChange={e => handlePfCompanyChange('address.state', e.target.value)} placeholder="SP" className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">CEP *</label>
                        <Input value={pfCompanyForm.address.zip} onChange={e => handlePfCompanyChange('address.zip', e.target.value)} placeholder="00000-000" className="w-full" />
                      </div>
                    </div>
                  </section>

                  {/* Contato / Cobrança PF */}
                  <section>
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                      <Phone className="h-4 w-4 text-[#EBA500]" /> Contato e Cobrança
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Telefone *</label>
                        <Input type="tel" value={pfCompanyForm.telefone} onChange={e => handlePfCompanyChange('telefone', e.target.value)} placeholder="(11) 99999-9999" className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">E-mail *</label>
                        <Input type="email" value={pfCompanyForm.email} onChange={e => handlePfCompanyChange('email', e.target.value)} placeholder="seu@email.com" className="w-full" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-[#373435] mb-2">E-mail para NF / Boleto</label>
                        <Input type="email" value={pfCompanyForm.email_nf} onChange={e => handlePfCompanyChange('email_nf', e.target.value)} placeholder="financeiro@email.com (opcional)" className="w-full" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-[#373435] mb-2">Forma de Pagamento *</label>
                        <select value={pfCompanyForm.forma_pagamento} onChange={e => handlePfCompanyChange('forma_pagamento', e.target.value)}
                          className="block w-full px-4 py-3 border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200">
                          <option value="">Selecione...</option>
                          <option value="boleto">Boleto Bancário</option>
                          <option value="cartao_credito">Cartão de Crédito</option>
                          <option value="pix">Pix</option>
                          <option value="transferencia">Transferência Bancária</option>
                          <option value="debito_automatico">Débito Automático</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  <div className="flex justify-end pt-2">
                    <Button onClick={handleCompanySave} disabled={companyLoading}
                      className="w-full sm:w-auto bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 hover:from-[#EBA500]/90 hover:to-[#EBA500]/80 text-white min-h-[44px]">
                      {companyLoading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Salvando...</> : <><Save className="h-4 w-4 mr-2" />Salvar Alterações</>}
                    </Button>
                  </div>
                </div>

              ) : (
                /* ─── FORMULÁRIO PJ ─── */
                <div className="space-y-8">

                  {/* Identificação */}
                  <section>
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                      <Building2 className="h-4 w-4 text-[#EBA500]" /> Identificação
                    </h4>
                    {/* Logo */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[#373435] mb-2">Logo da Empresa</label>
                      {!companyLogoPreview ? (
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all">
                          <Upload className="h-6 w-6 text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500">PNG, JPG, WEBP (máx. 5MB)</p>
                          <input type="file" className="hidden" accept="image/*" onChange={handleCompanyLogoChange} />
                        </label>
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                          <img src={companyLogoPreview} alt="Logo" className="w-14 h-14 object-contain rounded-lg bg-white border border-gray-200" />
                          <button type="button" onClick={() => { setCompanyLogoFile(null); setCompanyLogoPreview(null) }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Razão Social *</label>
                        <Input value={companyForm.name} onChange={e => handleCompanyChange('name', e.target.value)} className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Nome Fantasia</label>
                        <Input value={companyForm.nome_fantasia} onChange={e => handleCompanyChange('nome_fantasia', e.target.value)} className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">CNPJ *</label>
                        <Input value={companyForm.cnpj} onChange={e => handleCompanyChange('cnpj', e.target.value)} placeholder="00.000.000/0001-00" className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Segmento / Setor</label>
                        <Input value={companyForm.industry} onChange={e => handleCompanyChange('industry', e.target.value)} placeholder="Tecnologia, Saúde..." className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Porte</label>
                        <select value={companyForm.size} onChange={e => handleCompanyChange('size', e.target.value)}
                          className="block w-full px-4 py-3 border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200">
                          <option value="micro">Microempresa (ME)</option>
                          <option value="pequena">Pequena Empresa (EPP)</option>
                          <option value="media">Média Empresa</option>
                          <option value="grande">Grande Empresa</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Nº de Colaboradores</label>
                        <Input type="number" min="0" value={companyForm.num_colaboradores} onChange={e => handleCompanyChange('num_colaboradores', e.target.value)} className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Website</label>
                        <Input value={companyForm.website} onChange={e => handleCompanyChange('website', e.target.value)} placeholder="https://..." className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Cliente parceiro?</label>
                        <select value={companyForm.is_partner_client} onChange={e => handleCompanyChange('is_partner_client', e.target.value)}
                          className="block w-full px-4 py-3 border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200">
                          <option value="nao">Não</option>
                          <option value="sim">Sim</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* Contato PJ */}
                  <section>
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                      <Phone className="h-4 w-4 text-[#EBA500]" /> Contato
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">E-mail Principal *</label>
                        <Input type="email" value={companyForm.email} onChange={e => handleCompanyChange('email', e.target.value)} className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Telefone *</label>
                        <Input type="tel" value={companyForm.phone} onChange={e => handleCompanyChange('phone', e.target.value)} placeholder="(11) 99999-9999" className="w-full" />
                      </div>
                    </div>
                  </section>

                  {/* Endereço PJ */}
                  <section>
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                      <MapPin className="h-4 w-4 text-[#EBA500]" /> Endereço
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-[#373435] mb-2">Rua / Logradouro *</label>
                        <Input value={companyForm.address.street} onChange={e => handleCompanyChange('address.street', e.target.value)} placeholder="Rua, Avenida..." className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Número</label>
                        <Input value={companyForm.address.number} onChange={e => handleCompanyChange('address.number', e.target.value)} placeholder="123" className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Complemento</label>
                        <Input value={companyForm.address.complement} onChange={e => handleCompanyChange('address.complement', e.target.value)} placeholder="Apto, Bloco..." className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Bairro</label>
                        <Input value={companyForm.address.neighborhood} onChange={e => handleCompanyChange('address.neighborhood', e.target.value)} placeholder="Centro" className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Cidade *</label>
                        <Input value={companyForm.address.city} onChange={e => handleCompanyChange('address.city', e.target.value)} placeholder="São Paulo" className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Estado *</label>
                        <Input value={companyForm.address.state} onChange={e => handleCompanyChange('address.state', e.target.value)} placeholder="SP" className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">CEP *</label>
                        <Input value={companyForm.address.zip} onChange={e => handleCompanyChange('address.zip', e.target.value)} placeholder="00000-000" className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">País</label>
                        <Input value={companyForm.address.country} onChange={e => handleCompanyChange('address.country', e.target.value)} placeholder="Brasil" className="w-full" />
                      </div>
                    </div>
                  </section>

                  {/* Dados Fiscais */}
                  <section>
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                      <Hash className="h-4 w-4 text-[#EBA500]" /> Dados Fiscais
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Inscrição Estadual</label>
                        <Input value={companyForm.inscricao_estadual} onChange={e => handleCompanyChange('inscricao_estadual', e.target.value)} className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Inscrição Municipal</label>
                        <Input value={companyForm.inscricao_municipal} onChange={e => handleCompanyChange('inscricao_municipal', e.target.value)} className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Regime Tributário *</label>
                        <select value={companyForm.regime_tributario} onChange={e => handleCompanyChange('regime_tributario', e.target.value)}
                          className="block w-full px-4 py-3 border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200">
                          <option value="">Selecione...</option>
                          <option value="simples_nacional">Simples Nacional</option>
                          <option value="lucro_presumido">Lucro Presumido</option>
                          <option value="lucro_real">Lucro Real</option>
                          <option value="mei">MEI</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Contribuinte do ICMS *</label>
                        <select value={companyForm.contribuinte_icms} onChange={e => handleCompanyChange('contribuinte_icms', e.target.value)}
                          className="block w-full px-4 py-3 border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200">
                          <option value="">Selecione...</option>
                          <option value="contribuinte">Contribuinte</option>
                          <option value="nao_contribuinte">Não Contribuinte</option>
                          <option value="isento">Isento</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* Representante Legal */}
                  <section>
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                      <Users className="h-4 w-4 text-[#EBA500]" /> Representante Legal
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-[#373435] mb-2">Nome Completo *</label>
                        <Input value={companyForm.representante.nome} onChange={e => handleCompanyChange('representante.nome', e.target.value)} className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">CPF *</label>
                        <Input value={companyForm.representante.cpf} onChange={e => handleCompanyChange('representante.cpf', e.target.value)} placeholder="000.000.000-00" className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Cargo</label>
                        <Input value={companyForm.representante.cargo} onChange={e => handleCompanyChange('representante.cargo', e.target.value)} className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Telefone *</label>
                        <Input type="tel" value={companyForm.representante.telefone} onChange={e => handleCompanyChange('representante.telefone', e.target.value)} className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">E-mail *</label>
                        <Input type="email" value={companyForm.representante.email} onChange={e => handleCompanyChange('representante.email', e.target.value)} className="w-full" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-[#373435] mb-2">Endereço Completo *</label>
                        <Input value={companyForm.representante.endereco} onChange={e => handleCompanyChange('representante.endereco', e.target.value)} placeholder="Rua, nº, bairro, cidade - estado" className="w-full" />
                      </div>
                    </div>
                  </section>

                  {/* Cobrança */}
                  <section>
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                      <CreditCard className="h-4 w-4 text-[#EBA500]" /> Contato para NF / Cobrança
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Nome Completo *</label>
                        <Input value={companyForm.contato_cobranca.nome} onChange={e => handleCompanyChange('contato_cobranca.nome', e.target.value)} className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Cargo *</label>
                        <Input value={companyForm.contato_cobranca.cargo} onChange={e => handleCompanyChange('contato_cobranca.cargo', e.target.value)} className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">E-mail *</label>
                        <Input type="email" value={companyForm.contato_cobranca.email} onChange={e => handleCompanyChange('contato_cobranca.email', e.target.value)} className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Telefone *</label>
                        <Input type="tel" value={companyForm.contato_cobranca.telefone} onChange={e => handleCompanyChange('contato_cobranca.telefone', e.target.value)} className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Melhor dia para pagamento *</label>
                        <Input type="number" min="1" max="28" value={companyForm.melhor_dia_pagamento} onChange={e => handleCompanyChange('melhor_dia_pagamento', e.target.value)} placeholder="10" className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#373435] mb-2">Forma de Pagamento *</label>
                        <select value={companyForm.forma_pagamento} onChange={e => handleCompanyChange('forma_pagamento', e.target.value)}
                          className="block w-full px-4 py-3 border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200">
                          <option value="">Selecione...</option>
                          <option value="boleto">Boleto Bancário</option>
                          <option value="cartao_credito">Cartão de Crédito</option>
                          <option value="pix">Pix</option>
                          <option value="transferencia">Transferência Bancária</option>
                          <option value="debito_automatico">Débito Automático</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  <div className="flex justify-end pt-2">
                    <Button onClick={handleCompanySave} disabled={companyLoading}
                      className="w-full sm:w-auto bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 hover:from-[#EBA500]/90 hover:to-[#EBA500]/80 text-white min-h-[44px]">
                      {companyLoading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Salvando...</> : <><Save className="h-4 w-4 mr-2" />Salvar Alterações</>}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

            </div>
          </div>
        </div>
      </div>
  )
}

export default SettingsPage
