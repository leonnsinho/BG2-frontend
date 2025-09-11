import React, { useState } from 'react'
import { supabase } from '../services/supabase'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Loading } from '../components/ui/Loading'
import { Mail, ArrowLeft, Check, AlertCircle } from 'lucide-react'

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email Enviado!
            </h1>
            <p className="text-gray-600">
              Enviamos as instruções de recuperação para:
            </p>
            <p className="font-semibold text-blue-600 mt-2">
              {email}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-800 font-medium mb-1">
                  Próximos passos:
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Verifique sua caixa de entrada</li>
                  <li>• Clique no link do email</li>
                  <li>• Defina sua nova senha</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setEmailSent(false)
                setEmail('')
                setMessage('')
              }}
            >
              Enviar para outro email
            </Button>
            
            <Link to="/login">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao login
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Esqueceu sua senha?
          </h1>
          <p className="text-gray-600">
            Digite seu email e enviaremos as instruções para redefinir sua senha
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={handleChange}
              className={`
                ${messageType === 'error' ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
              `}
              disabled={loading}
              autoComplete="email"
              autoFocus
            />
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading || !email.trim()}
          >
            {loading ? (
              <>
                <Loading size="sm" className="mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Enviar instruções
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link 
            to="/login" 
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center space-x-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao login</span>
          </Link>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">
              Cadastre-se
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
