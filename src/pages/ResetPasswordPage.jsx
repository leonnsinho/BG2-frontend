import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Loading } from '../components/ui/Loading'
import { Eye, EyeOff, Shield, Check, AlertCircle, ArrowLeft } from 'lucide-react'

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
    if (!password) return { strength: 0, text: '' }
    
    let strength = 0
    if (password.length >= 6) strength += 1
    if (password.length >= 8) strength += 1
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1
    if (/\d/.test(password)) strength += 1
    if (/[!@#$%^&*]/.test(password)) strength += 1

    const strengthLabels = {
      0: { text: 'Muito fraca', color: 'bg-red-500' },
      1: { text: 'Fraca', color: 'bg-red-400' },
      2: { text: 'Regular', color: 'bg-yellow-500' },
      3: { text: 'Boa', color: 'bg-blue-500' },
      4: { text: 'Forte', color: 'bg-green-500' },
      5: { text: 'Muito forte', color: 'bg-green-600' }
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <Loading size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Verificando link de recuperação...</p>
        </Card>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Link Inválido
          </h1>
          <p className="text-gray-600 mb-6">
            {message || 'Este link de recuperação é inválido ou expirou.'}
          </p>
          <Button
            onClick={() => navigate('/forgot-password')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Solicitar nova recuperação
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Redefinir Senha
          </h1>
          <p className="text-gray-600">
            Digite sua nova senha abaixo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Nova Senha
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua nova senha"
                value={formData.password}
                onChange={handleChange}
                className={`pr-12 ${
                  messageType === 'error' ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                }`}
                disabled={loading}
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Indicador de força da senha */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 font-medium min-w-fit">
                    {passwordStrength.text}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirme sua nova senha"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`pr-12 ${
                  messageType === 'error' ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                }`}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {message && (
            <div className={`
              p-4 rounded-lg border flex items-center space-x-3
              ${messageType === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
              }
            `}>
              {messageType === 'success' ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <p className="text-sm font-medium">{message}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            disabled={loading || !formData.password.trim() || !formData.confirmPassword.trim()}
          >
            {loading ? (
              <>
                <Loading size="sm" className="mr-2" />
                Redefinindo...
              </>
            ) : messageType === 'success' ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Senha redefinida!
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Redefinir senha
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => navigate('/login')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center space-x-1 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao login</span>
          </button>
        </div>
      </Card>
    </div>
  )
}
