import React, { useState } from 'react'
import { supabase } from '../services/supabase'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Loading } from '../components/ui/Loading'
import { Mail, ArrowLeft, Check, AlertCircle, ArrowRight, Shield } from 'lucide-react'
import ParticlesBackground from '../components/ui/ParticlesBackground'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success' | 'error'
  const [emailSent, setEmailSent] = useState(false)

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setMessage('Por favor, digite seu email')
      setMessageType('error')
      return
    }

    if (!validateEmail(email)) {
      setMessage('Por favor, digite um email válido')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        throw error
      }

      setEmailSent(true)
      setMessage('Email de recuperação enviado com sucesso! Verifique sua caixa de entrada.')
      setMessageType('success')

    } catch (err) {
      console.error('Erro ao enviar email de recuperação:', err)
      setMessage(err.message || 'Erro ao enviar email de recuperação. Tente novamente.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setEmail(e.target.value)
    if (message) {
      setMessage('')
      setMessageType('')
    }
  }

  if (emailSent) {
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
                Email
                <br />
                <span className="opacity-90">Enviado!</span>
              </h1>
              <p className="text-xl font-light leading-relaxed mb-8" style={{color: '#373435', opacity: 0.8}}>
                Verificamos que você é você! Agora é só seguir as instruções 
                que enviamos para seu email.
              </p>
              <div className="flex items-center space-x-6" style={{color: '#373435', opacity: 0.7}}>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#373435'}}></div>
                  <span className="font-medium">Link Seguro</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#373435'}}></div>
                  <span className="font-medium">Acesso Rápido</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Painel Direito - Confirmação */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-md space-y-8">
            
            {/* Logo Mobile */}
            <div className="lg:hidden text-center mb-8">
              <img 
                src="/LOGO 1.png" 
                alt="BG2 Logo" 
                className="h-16 w-auto mx-auto mb-4 object-contain"
              />
            </div>

            {/* Icon Success */}
            <div className="text-center">
              <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-success-600" />
              </div>
              <h2 className="text-3xl font-black text-neutral-900 mb-2">
                Email Enviado!
              </h2>
              <p className="text-neutral-600 font-light mb-4">
                Enviamos as instruções de recuperação para:
              </p>
              <p className="text-primary-600 font-bold text-lg mb-8">
                {email}
              </p>
            </div>

            {/* Instruções */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-4">
                <Mail className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-primary-900 mb-3">
                    Próximos passos:
                  </p>
                  <ul className="text-sm text-primary-800 space-y-2">
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary-600 rounded-full"></div>
                      <span>Verifique sua caixa de entrada (e spam)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary-600 rounded-full"></div>
                      <span>Clique no link de recuperação</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary-600 rounded-full"></div>
                      <span>Defina sua nova senha</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-4">
              <button
                onClick={() => {
                  setEmailSent(false)
                  setEmail('')
                  setMessage('')
                }}
                className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold py-4 
                         px-6 rounded-lg transition-all duration-200 flex items-center justify-center
                         hover:shadow-md transform hover:-translate-y-0.5
                         active:transform active:translate-y-0"
              >
                Enviar para outro email
              </button>
              
              <Link to="/login">
                <button className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 
                               px-6 rounded-lg transition-all duration-200 flex items-center justify-center
                               shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
                               active:transform active:translate-y-0 active:shadow-lg">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Voltar ao login
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
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
              Recupere seu
              <br />
              <span className="opacity-90">Acesso</span>
            </h1>
            <p className="text-xl font-light leading-relaxed mb-8" style={{color: '#373435', opacity: 0.8}}>
              Esqueceu sua senha? Sem problema! Vamos ajudar você 
              a recuperar o acesso à sua conta de forma rápida e segura.
            </p>
            <div className="flex items-center space-x-6" style={{color: '#373435', opacity: 0.7}}>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#373435'}}></div>
                <span className="font-medium">Processo Simples</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#373435'}}></div>
                <span className="font-medium">100% Seguro</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Painel Direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          
          {/* Logo Mobile */}
          <div className="lg:hidden text-center mb-8">
            <img 
              src="/LOGO 1.png" 
              alt="BG2 Logo" 
              className="h-16 w-auto mx-auto mb-4 object-contain"
            />
          </div>

          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-black text-neutral-900 mb-2">
              Esqueceu sua senha?
            </h2>
            <p className="text-neutral-600 font-light">
              Digite seu email e enviaremos as instruções para redefinir sua senha
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
                  type="email"
                  required
                  value={email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                  className="w-full pl-12 pr-4 py-4 border border-neutral-200 rounded-lg 
                           bg-white text-neutral-900 placeholder:text-neutral-400
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent
                           disabled:bg-neutral-50 disabled:cursor-not-allowed
                           transition-all duration-200 font-medium"
                />
              </div>
            </div>

            {/* Mensagem */}
            {message && (
              <div className={`
                p-4 rounded-lg border flex items-center space-x-3
                ${messageType === 'success' 
                  ? 'bg-success-50 border-success-200 text-success-800' 
                  : 'bg-danger-50 border-danger-200 text-danger-800'
                }
              `}>
                {messageType === 'success' ? (
                  <Check className="w-5 h-5 text-success-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0" />
                )}
                <p className="text-sm font-medium">{message}</p>
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 
                       px-6 rounded-lg transition-all duration-200 flex items-center justify-center
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-500
                       shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
                       active:transform active:translate-y-0 active:shadow-lg"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Enviando...
                </div>
              ) : (
                <div className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Enviar instruções
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="space-y-4 pt-6 border-t border-neutral-100">
            <div className="text-center">
              <Link 
                to="/login" 
                className="text-primary-600 hover:text-primary-700 font-bold 
                         transition-colors duration-200 inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar ao login
              </Link>
            </div>

            <div className="text-center">
              <p className="text-neutral-600 text-sm">
                Não tem uma conta?{' '}
                <Link to="/register" className="text-primary-600 hover:text-primary-700 font-bold transition-colors duration-200">
                  Cadastre-se
                </Link>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
