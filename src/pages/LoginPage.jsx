import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLogin } from '../hooks/useAuth'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Loading } from '../components/ui/Loading'
import { Eye, EyeOff, Zap } from 'lucide-react'

export function LoginPage() {
  const location = useLocation()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const { login, loading, error, clearError } = useLogin()
  const { user } = useAuth()

  // Mostrar mensagem de sucesso vinda da navegação (ex: reset de senha)
  useEffect(() => {
    if (location.state?.message && location.state?.type === 'success') {
      setSuccessMessage(location.state.message)
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo e Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Bem-vindo ao BG2
          </h2>
          <p className="mt-2 text-gray-600">
            Faça login para acessar sua conta
          </p>
        </div>

        {/* Formulário */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                disabled={loading}
              />
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="label">
                Senha
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Mensagem de Sucesso */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}

            {/* Erro */}
            {error && (
              <div className="bg-danger-50 border border-danger-200 rounded-md p-3">
                <p className="text-sm text-danger-700">{error}</p>
              </div>
            )}

            {/* Botão de Login */}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <Loading size="sm" className="mr-2" />
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </Button>

            {/* Links */}
            <div className="flex items-center justify-between text-sm">
              <Link
                to="/forgot-password"
                className="text-primary-600 hover:text-primary-700 transition-colors"
              >
                Esqueceu a senha?
              </Link>
              <Link
                to="/register"
                className="text-primary-600 hover:text-primary-700 transition-colors"
              >
                Criar conta
              </Link>
            </div>
          </form>
        </Card>

      </div>
    </div>
  )
}
