import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { UserCheck, Mail, Lock, User, CheckCircle } from 'lucide-react'

export default function CompleteSignupPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    // Verificar se usuário está autenticado e precisa completar cadastro
    if (user) {
      console.log('✅ Usuário autenticado:', user)
      setUserEmail(user.email)
      
      // Se já completou o cadastro, redirecionar
      if (!user.user_metadata?.needs_completion) {
        toast.success('Cadastro já completo!')
        navigate('/dashboard')
      }
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validações
    if (!fullName || fullName.trim().length < 3) {
      toast.error('Nome deve ter pelo menos 3 caracteres')
      return
    }
    
    if (!password || password.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres')
      return
    }
    
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    setLoading(true)
    
    try {
      console.log('🚀 Completando cadastro:', { email: userEmail, fullName })
      
      // Atualizar dados do usuário no Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: password,
        data: {
          ...user.user_metadata,
          role: 'user', // Garantir que tem role padrão
          needs_completion: false, // Marca como completo
          completed_at: new Date().toISOString()
        }
      })

      if (authError) {
        console.error('❌ Erro ao atualizar auth:', authError)
        throw authError
      }

      // Criar ou atualizar perfil no profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName.trim(),
          email: userEmail,
          role: 'user',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError)
        throw profileError
      }

      console.log('✅ Cadastro completo!')
      
      toast.success('✅ Cadastro completado com sucesso! Redirecionando...')
      
      // Aguardar um pouco para mostrar a mensagem
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
      
    } catch (error) {
      console.error('❌ Erro:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Se usuário não está autenticado
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500] mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900">
              Processando...
            </h2>
            <p className="text-gray-600 mt-2">
              Se você clicou no link do email, aguarde alguns segundos.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Caso demore muito, <a href="/login" className="text-[#EBA500] hover:underline">clique aqui para fazer login</a>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#EBA500] rounded-full mb-4">
            <UserCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#373435]">
            Complete seu Cadastro
          </h1>
          <p className="text-gray-600 mt-2">
            Você está quase lá! Preencha seus dados para começar.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Email (readonly) */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Mail className="h-4 w-4" />
              <span className="font-medium">Seu Email:</span>
            </div>
            <p className="text-gray-900 font-medium ml-6">{userEmail}</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome Completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome Completo
                </div>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Digite seu nome completo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent"
                required
                minLength={3}
                disabled={loading}
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Senha
                </div>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Confirmar Senha
                </div>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#EBA500] text-white py-3 px-4 rounded-lg hover:bg-[#d49400] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Finalizando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Finalizar Cadastro
                </>
              )}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Informação:</strong> Após finalizar, você terá acesso ao sistema com perfil de <strong>Usuário</strong>. Um administrador pode alterar seu nível de acesso posteriormente.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Precisa de ajuda? Entre em contato com o administrador.
        </p>
      </div>
    </div>
  )
}