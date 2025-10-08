import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState(null)

  useEffect(() => {
    // Verificar se o usuário chegou via email de confirmação
    if (user && user.user_metadata) {
      console.log('✅ Usuário confirmado:', user)
      setUserInfo({
        email: user.email,
        company: user.user_metadata.company_name,
        role: user.user_metadata.role,
        needsPassword: user.user_metadata.first_login
      })
    }
  }, [user])

  const handleSetPassword = async (e) => {
    e.preventDefault()
    
    if (!password || password.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres')
      return
    }
    
    if (password !== confirmPassword) {
      toast.error('Senhas não coincidem')
      return
    }

    setLoading(true)
    
    try {
      // Atualizar senha do usuário
      const { error } = await supabase.auth.updateUser({
        password: password,
        data: {
          ...user.user_metadata,
          first_login: false // Marca que já definiu senha
        }
      })

      if (error) {
        console.error('❌ Erro ao definir senha:', error)
        throw error
      }

      toast.success('✅ Senha definida com sucesso!')
      
      // Redirecionar para dashboard
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
      
    } catch (error) {
      console.error('❌ Erro:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Se usuário não está logado ou não tem dados de convite
  if (!user || !userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900">
              Processando convite...
            </h2>
            <p className="text-gray-600 mt-2">
              Se você clicou no link do email, aguarde alguns segundos.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Se usuário já definiu senha, redirecionar
  if (!userInfo.needsPassword) {
    navigate('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Bem-vindo!
          </h2>
          <p className="mt-2 text-gray-600">
            Você foi convidado para se juntar a <strong>{userInfo.company}</strong>
          </p>
        </div>

        {/* Info do convite */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-800">
            <p><strong>Email:</strong> {userInfo.email}</p>
            <p><strong>Empresa:</strong> {userInfo.company}</p>
            <p><strong>Nível:</strong> {userInfo.role}</p>
          </div>
        </div>

        {/* Formulário de senha */}
        <form onSubmit={handleSetPassword} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Defina sua senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirme sua senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Digite a senha novamente"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Definindo senha...' : 'Acessar Sistema'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500">
          <p>Após definir a senha, você será redirecionado para o sistema.</p>
        </div>
      </div>
    </div>
  )
}