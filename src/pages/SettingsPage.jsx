import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/useAuth'
import { Layout } from '../components/layout/Layout'
import { supabase } from '../services/supabase'
import toast from 'react-hot-toast'
import { 
  User, 
  Mail, 
  Building2, 
  Shield, 
  Key, 
  Bell, 
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

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    marketingEmails: false
  })

  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo'
  })

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

    try {
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

    setIsLoading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfileForm(prev => ({ ...prev, avatar_url: publicUrl }))
      await refreshProfile()
      toast.success('Avatar atualizado com sucesso!')
    } catch (error) {
      toast.error('Erro ao fazer upload do avatar: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Remover avatar
  const handleRemoveAvatar = async () => {
    setIsLoading(true)

    try {
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
      toast.success('Avatar removido com sucesso!')
    } catch (error) {
      toast.error('Erro ao remover avatar: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Tabs de navegação
  const tabs = [
    { id: 'profile', name: 'Perfil', icon: User },
    { id: 'password', name: 'Senha', icon: Key },
    { id: 'notifications', name: 'Notificações', icon: Bell },
    { id: 'preferences', name: 'Preferências', icon: Globe }
  ]

  if (permissions.isLoading) {
    return <Loading />
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-[#EBA500]/20 to-[#EBA500]/10">
                <User className="w-6 h-6 text-[#EBA500]" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-[#373435] mb-3">Configurações</h1>
                <p className="text-gray-600 text-lg">
                  Gerencie suas informações pessoais e preferências da conta
                </p>
              </div>
            </div>
          </div>

          {/* Navegação por abas */}
          <div className="flex flex-wrap gap-2 bg-white/80 backdrop-blur-sm p-2 rounded-3xl shadow-sm border border-gray-200/50 mb-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
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

          {/* Conteúdo das abas com animação */}
          <div className="relative min-h-[600px]">
            <div className={`transition-all duration-500 ease-in-out transform ${
              activeTab ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
        {/* Aba Perfil */}
        {activeTab === 'profile' && (
          <Card className="p-6 bg-white shadow-sm border border-gray-200/50 rounded-3xl transform transition-all duration-500 ease-in-out">
            <div className="animate-fadeIn">
              <h3 className="text-xl font-semibold text-[#373435] mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-[#EBA500]" />
                Informações Pessoais
              </h3>
              
              {/* Avatar */}
              <div className="flex items-center space-x-6 mb-8">
                <div className="relative group">
                  {profileForm.avatar_url ? (
                    <img
                      src={profileForm.avatar_url}
                      alt="Avatar"
                      className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#EBA500]/20 to-[#EBA500]/10 flex items-center justify-center border-4 border-white shadow-lg">
                      <User className="h-12 w-12 text-[#EBA500]" />
                    </div>
                  )}
                  
                  <label className="absolute bottom-0 right-0 bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 rounded-full p-2 text-white cursor-pointer hover:shadow-lg transform hover:scale-110 active:scale-95 transition-all duration-200">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={isLoading}
                    />
                  </label>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-[#373435]">Foto do Perfil</h4>
                  <p className="text-sm text-gray-600">JPG, GIF ou PNG. Máximo 1MB.</p>
                  {profileForm.avatar_url && (
                    <button
                      onClick={handleRemoveAvatar}
                      className="mt-2 text-sm text-red-600 hover:text-red-700 flex items-center hover:underline transition-all duration-200"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className="bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 hover:from-[#EBA500]/90 hover:to-[#EBA500]/80 text-white transform hover:scale-105 active:scale-95 transition-all duration-200"
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
          <Card className="p-6 bg-white shadow-sm border border-gray-200/50 rounded-3xl transform transition-all duration-500 ease-in-out">
            <div className="animate-fadeIn">
              <h3 className="text-xl font-semibold text-[#373435] mb-6 flex items-center gap-2">
                <Key className="w-5 h-5 text-[#EBA500]" />
                Alterar Senha
              </h3>
              
              <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                <div className="relative">
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    Nova Senha
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

                <div>
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    Confirmar Nova Senha
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirme sua nova senha"
                    required
                    minLength={6}
                    className="w-full"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 hover:from-[#EBA500]/90 hover:to-[#EBA500]/80 text-white transform hover:scale-105 active:scale-95 transition-all duration-200"
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

        {/* Aba Notificações */}
        {activeTab === 'notifications' && (
          <Card className="p-6 bg-white shadow-sm border border-gray-200/50 rounded-3xl transform transition-all duration-500 ease-in-out">
            <div className="animate-fadeIn">
              <h3 className="text-xl font-semibold text-[#373435] mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#EBA500]" />
                Preferências de Notificação
              </h3>
              
              <div className="space-y-6">
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50/50 transition-all duration-200">
                    <div>
                      <h4 className="text-sm font-medium text-[#373435]">
                        {key === 'emailNotifications' && 'Notificações por Email'}
                        {key === 'pushNotifications' && 'Notificações Push'}
                        {key === 'weeklyReports' && 'Relatórios Semanais'}
                        {key === 'marketingEmails' && 'Emails de Marketing'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {key === 'emailNotifications' && 'Receber notificações importantes por email'}
                        {key === 'pushNotifications' && 'Receber notificações no navegador'}
                        {key === 'weeklyReports' && 'Receber resumo semanal das atividades'}
                        {key === 'marketingEmails' && 'Receber novidades e promoções'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={value}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          [key]: e.target.checked
                        }))}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#EBA500]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EBA500] hover:shadow-lg transition-all duration-200"></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <Button className="bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 hover:from-[#EBA500]/90 hover:to-[#EBA500]/80 text-white transform hover:scale-105 active:scale-95 transition-all duration-200">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Preferências
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Aba Preferências */}
        {activeTab === 'preferences' && (
          <Card className="p-6 bg-white shadow-sm border border-gray-200/50 rounded-3xl transform transition-all duration-500 ease-in-out">
            <div className="animate-fadeIn">
              <h3 className="text-xl font-semibold text-[#373435] mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#EBA500]" />
                Preferências do Sistema
              </h3>
              
              <div className="space-y-8">
                {/* Tema */}
                <div>
                  <label className="block text-sm font-medium text-[#373435] mb-4">Tema</label>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setPreferences(prev => ({ ...prev, theme: 'light' }))}
                      className={`flex items-center space-x-3 p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-md transform hover:scale-105 active:scale-95 ${
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
                      className={`flex items-center space-x-3 p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-md transform hover:scale-105 active:scale-95 ${
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

              <div className="mt-8 flex justify-end">
                <Button className="bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 hover:from-[#EBA500]/90 hover:to-[#EBA500]/80 text-white transform hover:scale-105 active:scale-95 transition-all duration-200">
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
    </Layout>
  )
}

export default SettingsPage
