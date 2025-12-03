import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLogin } from '../hooks/useAuth'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Loading } from '../components/ui/Loading'
import { Eye, EyeOff, ArrowRight, Mail, Lock } from 'lucide-react'
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
  const { login, loading, error, clearError } = useLogin()
  const { user } = useAuth()

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
              Bem-vindo de volta
            </h2>
            <p className="text-neutral-600 font-light">
              Entre na sua conta para continuar
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Campo Email */}
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
                  required
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

            {/* Link para registro */}
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
          </form>

        </div>
      </div>
    </div>
  )
}
