import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/useAuth'
import { supabase } from '../services/supabase'
import toast from 'react-hot-toast'
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
  Trash2
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

const SettingsPage = () => {
  const { user, profile, refreshProfile } = useAuth()
  const permissions = usePermissions()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [avatarSignedUrl, setAvatarSignedUrl] = useState('') // 🔥 NOVO: URL assinada do avatar

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
    { id: 'preferences', name: 'Preferências', icon: Globe }
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
            </div>
          </Card>
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
            </div>
          </div>
        </div>
      </div>
  )
}

export default SettingsPage
