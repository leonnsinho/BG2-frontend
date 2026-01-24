import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLogin } from '../hooks/useAuth'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Loading } from '../components/ui/Loading'
import { Eye, EyeOff, ArrowRight, Mail, Lock, User, Plus, Trash2, X, Zap } from 'lucide-react'
import ParticlesBackground from '../components/ui/ParticlesBackground'

export function LoginPage() {
  const location = useLocation()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [savedUsers, setSavedUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [viewMode, setViewMode] = useState('form') // 'form', 'list', 'password'
  const [hasSavedPasswords, setHasSavedPasswords] = useState({}) // Mapa de emails que tem senha salva
  const { login, loading, error, clearError } = useLogin()
  const { user } = useAuth()

  // Helper para codificar/decodificar UTF-8 em Base64
  const utf8_to_b64 = (str) => {
    try {
      return window.btoa(unescape(encodeURIComponent(str)));
    } catch (e) { console.error('Encode error', e); return null; }
  }

  const b64_to_utf8 = (str) => {
    try {
      return decodeURIComponent(escape(window.atob(str)));
    } catch (e) { console.error('Decode error', e); return null; }
  }

  // Carregar usuários salvos e verificar senhas
  useEffect(() => {
    try {
      const users = JSON.parse(localStorage.getItem('saved_users') || '[]')
      const passwords = JSON.parse(localStorage.getItem('saved_passwords') || '{}')
      
      // Cria mapa de quem tem senha salva (verifica tanto no objeto quanto no mapa legado)
      const passwordMap = {}
      users.forEach(u => {
        const emailKey = u.email?.trim().toLowerCase()
        if (u.encrypted_password || (emailKey && passwords[emailKey])) {
          passwordMap[u.id] = true
        }
      })
      setHasSavedPasswords(passwordMap)

      if (users.length > 0) {
        setSavedUsers(users)
        setViewMode('list')
      }
    } catch (e) {
      console.error('Erro ao carregar usuários salvos', e)
    }
  }, [])

  const handleSelectUser = async (user) => {
    setSelectedUser(user)
    clearError()

    try {
      // Estratégia 1: Senha no objeto do usuário (Prioridade)
      let encryptedPassword = user.encrypted_password

      // Estratégia 2: Senha no mapa de senhas (Backup)
      if (!encryptedPassword) {
        const savedPasswords = JSON.parse(localStorage.getItem('saved_passwords') || '{}')
        const emailKey = user.email?.trim().toLowerCase()
        encryptedPassword = savedPasswords[emailKey]
      }

      if (encryptedPassword) {
        // Auto login se tiver senha salva
        try {
          // Decodifica a senha com suporte a UTF-8
          const password = b64_to_utf8(encryptedPassword)
          if (!password) throw new Error('Falha na decodificação da senha')
          
          // Tenta fazer login direto
          const result = await login(user.email, password)
          
          if (result.success) {
            window.location.href = '/dashboard'
            return
          }
        } catch (err) {
          console.error("Erro no auto-login: Senha inválida ou erro de conexão", err)
        }
      } else {
        console.warn("Nenhuma senha salva encontrada para este usuário")
      }
    } catch (e) {
      console.error("Erro ao verificar senhas salvas", e)
    }

    // Se saiu do bloco try (não retornou), pede a senha
    setFormData(prev => ({ ...prev, email: user.email, password: '' }))
    setViewMode('password')
  }

  const handleRemoveUser = (e, userId) => {
    e.stopPropagation()
    const userToRemove = savedUsers.find(u => u.id === userId)
    
    // Remove usuário da lista visual
    const newUsers = savedUsers.filter(u => u.id !== userId)
    setSavedUsers(newUsers)
    localStorage.setItem('saved_users', JSON.stringify(newUsers))
    
    // Atualiza mapa de senhas visuais
    const newHasSavedPasswords = { ...hasSavedPasswords }
    delete newHasSavedPasswords[userId]
    setHasSavedPasswords(newHasSavedPasswords)
    
    // Remove senha salva associada
    if (userToRemove && userToRemove.email) {
      try {
        const savedPasswords = JSON.parse(localStorage.getItem('saved_passwords') || '{}')
        const emailKey = userToRemove.email.trim().toLowerCase()
        delete savedPasswords[emailKey]
        localStorage.setItem('saved_passwords', JSON.stringify(savedPasswords))
      } catch (e) {
        console.error('Erro ao limpar senha', e)
      }
    }
    
    if (newUsers.length === 0) {
      setViewMode('form')
    }
  }

  const handleSwitchAccount = () => {
    setSelectedUser(null)
    setFormData({ email: '', password: '' })
    setViewMode('list')
    clearError()
  }

  const handleUseOtherAccount = () => {
    setSelectedUser(null)
    setFormData({ email: '', password: '' })
    setViewMode('form')
    clearError()
  }

  // Mostrar mensagem de sucesso ou info vinda da navegação (ex: reset de senha, registro)
  useEffect(() => {
    if (location.state?.message) {
      if (location.state?.type === 'success') {
        setSuccessMessage(location.state.message)
      } else if (location.state?.type === 'info') {
        setInfoMessage(location.state.message)
      }
      // Limpar o state para não mostrar novamente
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      window.location.href = '/dashboard'
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()

    const result = await login(formData.email, formData.password)
    
    if (result.success) {
      // Salvar credenciais para login rápido
      try {
        const passwordEncoded = utf8_to_b64(formData.password)
        if (passwordEncoded) {
           const userEmail = result.user?.email || formData.email
           
           // 1. Salvar no mapa global de senhas (Legacy/Backup)
           const savedPasswords = JSON.parse(localStorage.getItem('saved_passwords') || '{}')
           const emailKey = userEmail?.trim().toLowerCase()
           if (emailKey) {
             savedPasswords[emailKey] = passwordEncoded
             localStorage.setItem('saved_passwords', JSON.stringify(savedPasswords))
           }

           // 2. Salvar diretamente no objeto do usuário em saved_users
           // Isso garante que o AuthContext (que roda em paralelo) preserve este campo
           const savedUsers = JSON.parse(localStorage.getItem('saved_users') || '[]')
           let userEntry = savedUsers.find(u => u.id === result.user.id)
           
           if (userEntry) {
             userEntry.encrypted_password = passwordEncoded
             userEntry.last_login = new Date().toISOString()
           } else {
             // Se o AuthContext ainda não criou a entrada (pode acontecer), criamos uma temporária
             userEntry = {
               id: result.user.id,
               email: userEmail,
               encrypted_password: passwordEncoded,
               created_at_login: true // Flag para debug
             }
             savedUsers.unshift(userEntry)
           }
           
           // Atualiza o array no storage (AuthContext vai processar e limpar/mergear depois)
           // Remover duplicatas por ID só pra garantir
           const uniqueUsers = savedUsers.filter((u, index, self) => 
            index === self.findIndex((t) => t.id === u.id)
           )
           
           localStorage.setItem('saved_users', JSON.stringify(uniqueUsers))
        }
      } catch (e) {
        console.error('Erro ao salvar credenciais para auto-login', e)
      }

      window.location.href = '/dashboard'
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Painel Esquerdo - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 relative overflow-hidden">
        {/* Partículas animadas */}
        <ParticlesBackground />
        
        {/* Decoração geométrica */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-40 right-32 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/8 rounded-full blur-lg"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-16 py-24">
          <div className="max-w-lg">
            <img 
              src="/LOGO 1.png" 
              alt="BG2 Logo" 
              className="h-20 w-auto mb-8 drop-shadow-sm object-contain"
            />
            <h1 className="text-5xl font-black leading-tight mb-6" style={{color: '#373435'}}>
              Transforme sua
              <br />
              <span className="opacity-90">Gestão</span>
            </h1>
            <p className="text-xl font-light leading-relaxed mb-8" style={{color: '#373435', opacity: 0.8}}>
              A plataforma de inteligência empresarial que revoluciona 
              a forma como você gerencia processos e toma decisões estratégicas.
            </p>
            <div className="flex items-center space-x-6" style={{color: '#373435', opacity: 0.7}}>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#373435'}}></div>
                <span className="font-medium">Gestão Inteligente</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#373435'}}></div>
                <span className="font-medium">Resultados Reais</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Painel Direito - Formulário de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          
          {/* Logo Mobile */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/LOGO 2.png"
              alt="BG2 Logo"
              className="h-16 w-auto mx-auto mb-4 object-contain"
            />
          </div>

          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-black text-neutral-900 mb-2">
              {viewMode === 'password' ? `Olá, ${selectedUser?.full_name?.split(' ')[0]}` : 'Bem-vindo de volta'}
            </h2>
            <p className="text-neutral-600 font-light">
              {viewMode === 'list' 
                ? 'Selecione uma conta para entrar' 
                : viewMode === 'password'
                  ? 'Confirme sua senha para continuar'
                  : 'Entre na sua conta para continuar'
              }
            </p>
          </div>

          {/* Lista de Contas Salvas */}
          {viewMode === 'list' && (
            <div className={`space-y-4 ${loading ? 'opacity-70 pointer-events-none' : ''}`}>
              <div className="space-y-3">
                {savedUsers.map((savedUser) => (
                  <div 
                    key={savedUser.id}
                    onClick={() => handleSelectUser(savedUser)}
                    className="group relative flex items-center p-4 bg-white border border-neutral-200 rounded-xl cursor-pointer hover:border-primary-500 hover:shadow-md transition-all duration-200"
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 mr-4">
                      {savedUser.avatar_url ? (
                        <img 
                          src={savedUser.avatar_url} 
                          alt={savedUser.full_name} 
                          className="w-12 h-12 rounded-full object-cover border-2 border-neutral-100"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
                          {savedUser.full_name?.charAt(0).toUpperCase() || savedUser.email?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-neutral-900 truncate">
                          {savedUser.full_name}
                        </p>
                        {/* Indicador Visual de Login Rápido */}
                        {(savedUser.encrypted_password || hasSavedPasswords[savedUser.id]) && (
                           <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wide">
                             <Zap className="w-3 h-3 mr-1 fill-current" />
                             Entrada Rápida
                           </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500 truncate">
                        {savedUser.email}
                      </p>
                      {(savedUser.encrypted_password || hasSavedPasswords[savedUser.id]) ? null : (
                         <p className="text-xs text-orange-500 mt-1">
                           Faça login com senha uma vez para ativar acesso rápido
                         </p>
                      )}
                    </div>

                    {/* Loading or Arrow */}
                    {loading && selectedUser?.id === savedUser.id ? (
                      <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin ml-2"></div>
                    ) : (
                      <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:text-primary-500 transition-colors ml-2" />
                    )}

                    {/* Remove button */}
                    <button
                      onClick={(e) => handleRemoveUser(e, savedUser.id)}
                      className="absolute -top-2 -right-2 p-1 bg-white rounded-full border border-neutral-200 text-neutral-400 hover:text-red-500 hover:border-red-200 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200"
                      title="Remover conta"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleUseOtherAccount}
                className="w-full flex items-center justify-center p-4 border border-dashed border-neutral-300 rounded-xl text-neutral-600 hover:text-primary-600 hover:border-primary-500 hover:bg-neutral-50 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center mr-3 group-hover:bg-primary-50 text-neutral-500 group-hover:text-primary-500">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="font-medium">Entrar com outra conta</span>
              </button>
            </div>
          )}

          {/* Formulário */}
          {(viewMode === 'form' || viewMode === 'password') && (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Usuário Selecionado (apenas modo password) */}
              {viewMode === 'password' && selectedUser && (
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="flex items-center min-w-0">
                    {selectedUser.avatar_url ? (
                      <img 
                        src={selectedUser.avatar_url} 
                        alt={selectedUser.full_name} 
                        className="w-10 h-10 rounded-full object-cover mr-3 border border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold mr-3">
                        {selectedUser.full_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate">
                        {selectedUser.email}
                      </p>
                      <button 
                        type="button"
                        onClick={handleSwitchAccount}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Não é você? Trocar conta
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Campo Email (apenas modo form) */}
              {viewMode === 'form' && (
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-neutral-900 block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required={viewMode === 'form'}
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-4 border border-neutral-200 rounded-lg 
                              bg-white text-neutral-900 placeholder:text-neutral-400
                              focus:ring-2 focus:ring-primary-500 focus:border-transparent
                              disabled:bg-neutral-50 disabled:cursor-not-allowed
                              transition-all duration-200 font-medium"
                    />
                  </div>
                </div>
              )}

            {/* Campo Senha */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-neutral-900 block">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoFocus={viewMode === 'password'}
                  disabled={loading}
                  className="w-full pl-12 pr-12 py-4 border border-neutral-200 rounded-lg 
                           bg-white text-neutral-900 placeholder:text-neutral-400
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent
                           disabled:bg-neutral-50 disabled:cursor-not-allowed
                           transition-all duration-200 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 
                           text-neutral-400 hover:text-neutral-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Mensagem de Sucesso */}
            {successMessage && (
              <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                <p className="text-sm text-success-700 font-medium">{successMessage}</p>
              </div>
            )}

            {/* Mensagem de Informação */}
            {infoMessage && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 font-medium">{infoMessage}</p>
              </div>
            )}

            {/* Erro */}
            {error && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                <p className="text-sm text-danger-700 font-medium">{error}</p>
              </div>
            )}

            {/* Lembrar senha */}
            <div className="flex items-center justify-between">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium 
                         transition-colors duration-200"
              >
                Esqueceu sua senha?
              </Link>
            </div>

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 
                       px-6 rounded-lg transition-all duration-200 flex items-center justify-center
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-500
                       shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
                       active:transform active:translate-y-0 active:shadow-lg"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Entrando...
                </div>
              ) : (
                <div className="flex items-center">
                  Entrar
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              )}
            </button>

            {/* Link para registro (apenas modo form) */}
            {viewMode === 'form' && (
              <div className="text-center pt-6 border-t border-neutral-100">
                <p className="text-neutral-600 text-sm">
                  Ainda não tem uma conta?{' '}
                  <Link
                    to="/register"
                    className="text-primary-600 hover:text-primary-700 font-bold 
                            transition-colors duration-200"
                  >
                    Criar conta gratuita
                  </Link>
                </p>
              </div>
            )}

            {/* Voltar para lista (apenas modo password e se houver saved users) */}
             {viewMode === 'password' && savedUsers.length > 0 && (
              <div className="text-center pt-4">
                <button
                  type="button" 
                  onClick={handleSwitchAccount}
                  className="text-sm text-neutral-500 hover:text-neutral-800 font-medium transition-colors"
                >
                  ← Escolher outra conta
                </button>
              </div>
            )}
            
            {/* Voltar para lista (apenas modo form e se houver saved users) */}
            {viewMode === 'form' && savedUsers.length > 0 && (
             <div className="text-center pt-4">
               <button
                 type="button" 
                 onClick={handleSwitchAccount}
                 className="text-sm text-neutral-500 hover:text-neutral-800 font-medium transition-colors"
               >
                 ← Voltar para contas salvas
               </button>
             </div>
           )}

          </form>
          )}

        </div>
      </div>
    </div>
  )
}
