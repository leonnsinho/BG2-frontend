import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Loading } from '../components/ui/Loading'
import { Eye, EyeOff, Shield, Check, AlertCircle, ArrowLeft, Lock, ArrowRight } from 'lucide-react'
import ParticlesBackground from '../components/ui/ParticlesBackground'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [isValidToken, setIsValidToken] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)

  // Verificar se o token é válido ao carregar a página
  useEffect(() => {
    const checkResetToken = async () => {
      try {
        // Verifica se há parâmetros de reset na URL
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const type = searchParams.get('type')

        if (type === 'recovery' && accessToken && refreshToken) {
          // Set the session with the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) {
            throw error
          }

          if (data.user) {
            setIsValidToken(true)
          } else {
            throw new Error('Token inválido')
          }
        } else {
          // Verifica se há uma sessão válida para reset
          const { data: { user }, error } = await supabase.auth.getUser()
          
          if (error || !user) {
            throw new Error('Token de recuperação inválido ou expirado')
          }
          
          setIsValidToken(true)
        }
      } catch (err) {
        console.error('Erro ao verificar token:', err)
        setMessage('Link de recuperação inválido ou expirado. Solicite uma nova recuperação de senha.')
        setMessageType('error')
        setIsValidToken(false)
      } finally {
        setCheckingToken(false)
      }
    }

    checkResetToken()
  }, [searchParams])

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'A senha deve ter pelo menos 6 caracteres'
    }
    return null
  }

  const validateForm = () => {
    const { password, confirmPassword } = formData

    if (!password.trim()) {
      setMessage('Por favor, digite sua nova senha')
      setMessageType('error')
      return false
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setMessage(passwordError)
      setMessageType('error')
      return false
    }

    if (!confirmPassword.trim()) {
      setMessage('Por favor, confirme sua nova senha')
      setMessageType('error')
      return false
    }

    if (password !== confirmPassword) {
      setMessage('As senhas não coincidem')
      setMessageType('error')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      })

      if (error) {
        throw error
      }

      setMessage('Senha redefinida com sucesso!')
      setMessageType('success')

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Senha redefinida com sucesso! Faça login com sua nova senha.',
            type: 'success'
          }
        })
      }, 2000)

    } catch (err) {
      console.error('Erro ao redefinir senha:', err)
      setMessage(err.message || 'Erro ao redefinir senha. Tente novamente.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (message) {
      setMessage('')
      setMessageType('')
    }
  }

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', color: 'bg-neutral-200' }
    
    let strength = 0
    if (password.length >= 6) strength += 1
    if (password.length >= 8) strength += 1
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1
    if (/\d/.test(password)) strength += 1
    if (/[!@#$%^&*]/.test(password)) strength += 1

    const strengthLabels = {
      0: { text: 'Muito fraca', color: 'bg-danger-500' },
      1: { text: 'Fraca', color: 'bg-danger-400' },
      2: { text: 'Regular', color: 'bg-warning-500' },
      3: { text: 'Boa', color: 'bg-primary-500' },
      4: { text: 'Forte', color: 'bg-success-500' },
      5: { text: 'Muito forte', color: 'bg-success-600' }
    }

    return { 
      strength, 
      text: strengthLabels[strength].text,
      color: strengthLabels[strength].color
    }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  if (checkingToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-neutral-900 mb-2">
              Verificando link...
            </h2>
            <p className="text-neutral-600 font-light">
              Aguarde enquanto verificamos seu link de recuperação
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center space-y-8">
          <div className="w-20 h-20 bg-danger-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-danger-600" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-neutral-900 mb-4">
              Link Inválido
            </h2>
            <p className="text-neutral-600 font-light mb-8">
              {message || 'Este link de recuperação é inválido ou expirou.'}
            </p>
            <button
              onClick={() => navigate('/forgot-password')}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 
                       px-6 rounded-lg transition-all duration-200 flex items-center justify-center
                       shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Solicitar nova recuperação
            </button>
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
              Nova
              <br />
              <span className="opacity-90">Senha</span>
            </h1>
            <p className="text-xl font-light leading-relaxed mb-8" style={{color: '#373435', opacity: 0.8}}>
              Quase pronto! Agora você pode definir uma nova senha 
              segura para proteger sua conta.
            </p>
            <div className="flex items-center space-x-6" style={{color: '#373435', opacity: 0.7}}>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#373435'}}></div>
                <span className="font-medium">Criptografia Forte</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#373435'}}></div>
                <span className="font-medium">Dados Protegidos</span>
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
              Redefinir Senha
            </h2>
            <p className="text-neutral-600 font-light">
              Digite sua nova senha abaixo
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Campo Nova Senha */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-neutral-900 block">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Digite sua nova senha"
                  disabled={loading}
                  autoComplete="new-password"
                  autoFocus
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
              
              {/* Indicador de força da senha */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-neutral-600 font-medium min-w-fit">
                      {passwordStrength.text}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Campo Confirmar Senha */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-900 block">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirme sua nova senha"
                  disabled={loading}
                  autoComplete="new-password"
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
              disabled={loading || !formData.password.trim() || !formData.confirmPassword.trim()}
              className="w-full bg-success-600 hover:bg-success-700 text-white font-bold py-4 
                       px-6 rounded-lg transition-all duration-200 flex items-center justify-center
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-success-600
                       shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
                       active:transform active:translate-y-0 active:shadow-lg"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Redefinindo...
                </div>
              ) : messageType === 'success' ? (
                <div className="flex items-center">
                  <Check className="w-5 h-5 mr-2" />
                  Senha redefinida!
                </div>
              ) : (
                <div className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Redefinir senha
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              )}
            </button>
          </form>

          {/* Link */}
          <div className="text-center pt-6 border-t border-neutral-100">
            <button 
              onClick={() => navigate('/login')}
              className="text-primary-600 hover:text-primary-700 font-bold 
                       transition-colors duration-200 inline-flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar ao login
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
