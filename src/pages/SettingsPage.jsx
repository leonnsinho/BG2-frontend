import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/useAuth'
import { supabase } from '../services/supabase'
import { toast } from 'react-hot-toast'
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
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="mt-2 text-gray-600">
          Gerencie suas informações pessoais e preferências da conta.
        </p>
      </div>

      {/* Navegação por abas */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          )
        })}
      </div>

      {/* Conteúdo das abas */}
      <div className="space-y-6">
        {/* Aba Perfil */}
        {activeTab === 'profile' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Informações Pessoais</h3>
              
              {/* Avatar */}
              <div className="flex items-center space-x-6 mb-8">
                <div className="relative">
                  {profileForm.avatar_url ? (
                    <img
                      src={profileForm.avatar_url}
                      alt="Avatar"
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  
                  <label className="absolute bottom-0 right-0 bg-primary-600 rounded-full p-2 text-white cursor-pointer hover:bg-primary-700 transition-colors">
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
                  <h4 className="text-sm font-medium text-gray-900">Foto do Perfil</h4>
                  <p className="text-sm text-gray-600">JPG, GIF ou PNG. Máximo 1MB.</p>
                  {profileForm.avatar_url && (
                    <button
                      onClick={handleRemoveAvatar}
                      className="mt-2 text-sm text-red-600 hover:text-red-700 flex items-center"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo
                    </label>
                    <Input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      O email não pode ser alterado
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <Input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Função
                    </label>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900 capitalize">
                        {profile?.role?.replace('_', ' ') || 'Usuário'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        )}

        {/* Aba Senha */}
        {activeTab === 'password' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Alterar Senha</h3>
              
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nova Senha
                  </label>
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Digite sua nova senha"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nova Senha
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirme sua nova senha"
                    required
                    minLength={6}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    <Key className="h-4 w-4 mr-2" />
                    Alterar Senha
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        )}

        {/* Aba Notificações */}
        {activeTab === 'notifications' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Preferências de Notificação</h3>
              
              <div className="space-y-4">
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Preferências
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Aba Preferências */}
        {activeTab === 'preferences' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Preferências do Sistema</h3>
              
              <div className="space-y-6">
                {/* Tema */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Tema</label>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setPreferences(prev => ({ ...prev, theme: 'light' }))}
                      className={`flex items-center space-x-2 p-3 rounded-lg border ${
                        preferences.theme === 'light' 
                          ? 'border-primary-300 bg-primary-50' 
                          : 'border-gray-300'
                      }`}
                    >
                      <Sun className="h-4 w-4" />
                      <span className="text-sm">Claro</span>
                    </button>
                    <button
                      onClick={() => setPreferences(prev => ({ ...prev, theme: 'dark' }))}
                      className={`flex items-center space-x-2 p-3 rounded-lg border ${
                        preferences.theme === 'dark' 
                          ? 'border-primary-300 bg-primary-50' 
                          : 'border-gray-300'
                      }`}
                    >
                      <Moon className="h-4 w-4" />
                      <span className="text-sm">Escuro</span>
                    </button>
                  </div>
                </div>

                {/* Idioma */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español (España)</option>
                  </select>
                </div>

                {/* Fuso Horário */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fuso Horário</label>
                  <select
                    value={preferences.timezone}
                    onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="America/Sao_Paulo">São Paulo (UTC-3)</option>
                    <option value="America/New_York">Nova York (UTC-5)</option>
                    <option value="Europe/London">Londres (UTC+0)</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Preferências
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default SettingsPage
