import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Loading } from '../components/ui/Loading'
import { Eye, EyeOff, ArrowRight, Mail, Lock, User, Building, ArrowLeft, CheckCircle, LogOut } from 'lucide-react'
import ParticlesBackground from '../components/ui/ParticlesBackground'

export function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, logout } = useAuth()
  
  console.log('🚀 RegisterPage montado')
  console.log('🔗 URL completa:', window.location.href)
  console.log('📋 SearchParams:', Object.fromEntries(searchParams.entries()))
  console.log('👤 Usuário logado:', user)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [inviteToken, setInviteToken] = useState(null)
  const [inviteCompany, setInviteCompany] = useState(null)
  const [loadingInvite, setLoadingInvite] = useState(false)

  // Detectar token de convite na URL
  useEffect(() => {
    console.log('🎯 useEffect de detecção de token executado')
    const token = searchParams.get('invite')
    console.log('🎫 Token obtido dos searchParams:', token)
    
    if (token) {
      console.log('✅ Token encontrado, iniciando validação...')
      validateInviteToken(token)
    } else {
      console.log('⚠️ Nenhum token encontrado na URL')
    }
  }, [searchParams])

  // Debug: monitorar mudanças no formData
  useEffect(() => {
    console.log('🔄 FormData atual:', formData)
  }, [formData])

  // Debug: monitorar mudanças no inviteCompany
  useEffect(() => {
    if (inviteCompany) {
      console.log('🏢 Empresa do convite:', inviteCompany)
    }
  }, [inviteCompany])

  const validateInviteToken = async (token) => {
    setLoadingInvite(true)
    try {
      console.log('🔍 Validando token de convite:', token)
      
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('invite_token', token)
        .single()

      if (error || !data) {
        console.error('❌ Token inválido:', error)
        setError('Link de convite inválido ou expirado')
        return
      }

      console.log('✅ Empresa encontrada:', data)
      
      setInviteToken(token)
      setInviteCompany(data)
      setFormData(prev => {
        const newData = { ...prev, companyName: data.name }
        console.log('📝 FormData atualizado:', newData)
        return newData
      })
    } catch (err) {
      console.error('❌ Erro ao validar token:', err)
      setError('Erro ao validar link de convite')
    } finally {
      setLoadingInvite(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const validateForm = () => {
    // Se tem convite, companyName não é obrigatório (já preenchido)
    if (!formData.email || !formData.password || !formData.fullName) {
      setError('Todos os campos obrigatórios devem ser preenchidos')
      return false
    }

    // Se não tem convite, companyName é obrigatório
    if (!inviteToken && !formData.companyName) {
      setError('Nome da empresa é obrigatório')
      return false
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Registrar usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'user', // Sempre user, seja via convite ou autoregistro
            company_name: formData.companyName,
            invite_token: inviteToken || null // Passar o token de convite para o trigger processar
          }
        }
      })

      if (error) {
        throw error
      }

      if (data.user) {
        // O trigger handle_new_user agora cuida da associação automaticamente
        if (inviteToken && inviteCompany) {
          setSuccess(`✅ Conta criada com sucesso! Você foi adicionado à empresa ${inviteCompany.name}.`)
        } else {
          setSuccess('✅ Conta criada! Verifique seu email para confirmar e ativar sua conta.')
        }
        
        // Aguardar 3 segundos e redirecionar para login
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              email: formData.email,
              message: 'Verifique seu email e clique no link de confirmação antes de fazer login.',
              type: 'info'
            }
          })
        }, 3000)
      }

    } catch (err) {
      console.error('Erro no registro:', err)
      
      if (err.message.includes('User already registered')) {
        setError('Este email já está registrado. Tente fazer login ou use outro email.')
      } else if (err.message.includes('Invalid email')) {
        setError('Email inválido. Verifique o formato do email.')
      } else {
        setError(`Erro ao criar conta: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
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
              Comece sua
              <br />
              <span className="opacity-90">Jornada</span>
            </h1>
            <p className="text-xl font-light leading-relaxed mb-8" style={{color: '#373435', opacity: 0.8}}>
              Crie sua conta e descubra como nossa plataforma pode 
              transformar a gestão da sua empresa com insights inteligentes.
            </p>
            <div className="flex items-center space-x-6" style={{color: '#373435', opacity: 0.7}}>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#373435'}}></div>
                <span className="font-medium">Setup Rápido</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#373435'}}></div>
                <span className="font-medium">Gratuito para Começar</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Painel Direito - Formulário de Cadastro */}
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
              Criar sua conta
            </h2>
            <p className="text-neutral-600 font-light">
              Preencha os dados para começar
            </p>
          </div>

          {/* Banner de Usuário Logado */}
          {user && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <LogOut className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-900 mb-1">
                    Você já está logado
                  </p>
                  <p className="text-xs text-orange-700 mb-2">
                    Para criar uma nova conta, você precisa fazer logout primeiro.
                  </p>
                  <button
                    onClick={() => logout()}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-800 underline"
                  >
                    Fazer Logout Agora
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Banner de Convite */}
          {inviteCompany && !user && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Você foi convidado para {inviteCompany.name}
                  </p>
                  <p className="text-xs text-blue-700">
                    Ao criar sua conta, você será automaticamente adicionado a esta empresa.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Campo Nome Completo */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium text-neutral-900 block">
                Nome Completo *
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Seu nome completo"
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-4 border border-neutral-200 rounded-lg 
                           bg-white text-neutral-900 placeholder:text-neutral-400
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent
                           disabled:bg-neutral-50 disabled:cursor-not-allowed
                           transition-all duration-200 font-medium"
                />
              </div>
            </div>

            {/* Campo Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-neutral-900 block">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
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

            {/* Campo Empresa */}
            <div className="space-y-2">
              <label htmlFor="companyName" className="text-sm font-medium text-neutral-900 block">
                Nome da Empresa *
              </label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="companyName"
                  type="text"
                  required={!inviteToken}
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder={inviteToken ? "Definido pelo convite" : "Nome da sua empresa"}
                  disabled={loading || !!inviteToken}
                  readOnly={!!inviteToken}
                  className={`w-full pl-12 pr-4 py-4 border border-neutral-200 rounded-lg 
                           bg-white text-neutral-900 placeholder:text-neutral-400
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent
                           disabled:bg-neutral-50 disabled:cursor-not-allowed
                           transition-all duration-200 font-medium ${
                             inviteToken ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold' : ''
                           }`}
                />
                {inviteToken && (
                  <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-600" />
                )}
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-neutral-900 block">
                Senha *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
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

            {/* Campo Confirmar Senha */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-900 block">
                Confirmar Senha *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Digite a senha novamente"
                  disabled={loading}
                  className="w-full pl-12 pr-12 py-4 border border-neutral-200 rounded-lg 
                           bg-white text-neutral-900 placeholder:text-neutral-400
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent
                           disabled:bg-neutral-50 disabled:cursor-not-allowed
                           transition-all duration-200 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 
                           text-neutral-400 hover:text-neutral-600 transition-colors"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Mensagem de Sucesso */}
            {success && (
              <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                <p className="text-sm text-success-700 font-medium">{success}</p>
              </div>
            )}

            {/* Erro */}
            {error && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                <p className="text-sm text-danger-700 font-medium">{error}</p>
              </div>
            )}

            {/* Botão de Cadastro */}
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
                  Criando conta...
                </div>
              ) : (
                <div className="flex items-center">
                  Criar Conta Gratuita
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              )}
            </button>

            {/* Link para login */}
            <div className="text-center pt-6 border-t border-neutral-100">
              <p className="text-neutral-600 text-sm">
                Já possui uma conta?{' '}
                <Link
                  to="/login"
                  className="text-primary-600 hover:text-primary-700 font-bold 
                           transition-colors duration-200 inline-flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Fazer login
                </Link>
              </p>
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}
