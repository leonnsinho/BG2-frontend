import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Loading } from '../components/ui/Loading'
import { 
  CheckCircle, 
  AlertCircle, 
  Building2, 
  UserCheck, 
  Clock,
  ArrowRight,
  LogIn
} from 'lucide-react'

const AcceptInvitePage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [invite, setInvite] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const token = searchParams.get('token')

  useEffect(() => {
    if (token) {
      loadInviteDetails()
    } else {
      setError('Token de convite não fornecido')
      setLoading(false)
    }
  }, [token])

  const loadInviteDetails = async () => {
    try {
      setLoading(true)
      
      // Buscar detalhes do convite
      const { data, error } = await supabase
        .from('invite_details')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          setError('Convite não encontrado, expirado ou já foi usado')
        } else {
          throw error
        }
        return
      }
      
      // Verificar se convite está válido
      const expiresAt = new Date(data.expires_at)
      const now = new Date()
      
      if (expiresAt <= now) {
        setError('Este convite expirou')
        return
      }
      
      setInvite(data)
    } catch (err) {
      console.error('Erro ao carregar convite:', err)
      setError('Erro ao carregar detalhes do convite')
    } finally {
      setLoading(false)
    }
  }

  const acceptInvite = async () => {
    if (!user) {
      // Redirecionar para login se não estiver autenticado
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)
      return
    }

    if (user.email !== invite.email) {
      setError('Este convite é para outro endereço de email. Faça login com o email correto.')
      return
    }

    try {
      setAccepting(true)
      setError('')

      // Chamar função do Supabase para aceitar convite
      const { data, error } = await supabase.rpc('accept_invite', {
        p_token: token
      })

      if (error) throw error

      if (data.success) {
        setSuccess(true)
        
        // Aguardar um pouco e redirecionar para dashboard
        setTimeout(() => {
          navigate('/dashboard', {
            state: {
              message: `Bem-vindo à ${invite.company_name}! Convite aceito com sucesso.`,
              type: 'success'
            }
          })
        }, 2000)
      } else {
        setError(data.error || 'Erro ao aceitar convite')
      }
    } catch (err) {
      console.error('Erro ao aceitar convite:', err)
      setError(err.message || 'Erro ao aceitar convite')
    } finally {
      setAccepting(false)
    }
  }

  const getRoleName = (role) => {
    switch (role) {
      case 'super_admin':
        return 'Super Administrador'
      case 'consultant':
        return 'Consultor'
      case 'company_admin':
        return 'Administrador'
      case 'user':
        return 'Usuário'
      default:
        return role
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <Loading size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Verificando convite...</p>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Convite Inválido
          </h1>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Ir para Login
          </Button>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Convite Aceito!
          </h1>
          <p className="text-gray-600 mb-6">
            Bem-vindo à <strong>{invite.company_name}</strong>! 
            Você agora é um <strong>{getRoleName(invite.role)}</strong>.
          </p>
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Loading size="sm" className="mr-2" />
            Redirecionando para o dashboard...
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Convite para se Juntar
          </h1>
          <p className="text-gray-600">
            Você foi convidado para se juntar a uma equipe
          </p>
        </div>

        {/* Detalhes do Convite */}
        <div className="space-y-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Building2 className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">{invite.company_name}</p>
                <p className="text-sm text-blue-700">Empresa</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mb-3">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">{getRoleName(invite.role)}</p>
                <p className="text-sm text-blue-700">Sua função</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">
                  {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-sm text-blue-700">Expira em</p>
              </div>
            </div>
          </div>

          {invite.invited_by_name && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>Convidado por:</strong> {invite.invited_by_name}
              </p>
              {invite.invited_by_email && (
                <p className="text-sm text-gray-500">
                  {invite.invited_by_email}
                </p>
              )}
            </div>
          )}

          {invite.invite_message && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>Mensagem:</strong>
              </p>
              <p className="text-sm text-gray-700 mt-1">
                "{invite.invite_message}"
              </p>
            </div>
          )}
        </div>

        {/* Verificação de Login */}
        {!user ? (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Faça login primeiro:</strong> Para aceitar este convite, 
                você precisa fazer login com o email <strong>{invite.email}</strong>
              </p>
            </div>
            
            <Button
              onClick={() => navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Fazer Login
            </Button>
          </div>
        ) : user.email !== invite.email ? (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Email incorreto:</strong> Este convite é para <strong>{invite.email}</strong>, 
                mas você está logado como <strong>{user.email}</strong>.
              </p>
            </div>
            
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="w-full"
            >
              Fazer login com email correto
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button
              onClick={acceptInvite}
              disabled={accepting}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {accepting ? (
                <>
                  <Loading size="sm" className="mr-2" />
                  Aceitando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aceitar Convite
                </>
              )}
            </Button>

            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default AcceptInvitePage
