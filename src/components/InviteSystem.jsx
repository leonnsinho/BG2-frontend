import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Loading } from '../components/ui/Loading'
import { 
  UserPlus, 
  Mail, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  Trash2,
  RefreshCw,
  AlertCircle,
  Users
} from 'lucide-react'

export function InviteSystem() {
  const { profile, user } = useAuth()
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'user',
    message: ''
  })
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Carregar empresas do usuário
  useEffect(() => {
    loadCompanies()
    loadInvites()
  }, [])

  const loadCompanies = async () => {
    try {
      let query = supabase.from('companies').select('*')
      
      // Se não for super admin, filtrar apenas empresas do usuário
      if (profile?.role !== 'super_admin') {
        query = query.in('id', 
          profile?.user_companies
            ?.filter(uc => uc.is_active && ['company_admin', 'super_admin'].includes(uc.role))
            ?.map(uc => uc.company_id) || []
        )
      }
      
      const { data, error } = await query.order('name')
      
      if (error) throw error
      
      setCompanies(data || [])
      if (data?.length > 0 && !selectedCompany) {
        setSelectedCompany(data[0].id)
      }
    } catch (err) {
      console.error('Erro ao carregar empresas:', err)
      setError('Erro ao carregar empresas')
    }
  }

  const loadInvites = async () => {
    try {
      setLoading(true)
      
      // Usar a view invite_details para pegar informações completas
      const { data, error } = await supabase
        .from('invite_details')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setInvites(data || [])
    } catch (err) {
      console.error('Erro ao carregar convites:', err)
      setError('Erro ao carregar convites')
    } finally {
      setLoading(false)
    }
  }

  const sendInvite = async (e) => {
    e.preventDefault()
    
    if (!inviteForm.email || !selectedCompany) {
      setError('Email e empresa são obrigatórios')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      // Chamar função do Supabase para criar convite
      const { data, error } = await supabase.rpc('create_invite', {
        p_email: inviteForm.email,
        p_company_id: selectedCompany,
        p_role: inviteForm.role,
        p_message: inviteForm.message || null
      })

      if (error) throw error

      if (data.success) {
        setSuccess(`Convite enviado para ${inviteForm.email}!`)
        setInviteForm({ email: '', role: 'user', message: '' })
        
        // Enviar email de convite (simulado por enquanto)
        await sendInviteEmail(data)
        
        // Recarregar lista
        loadInvites()
      } else {
        setError(data.error || 'Erro ao criar convite')
      }
    } catch (err) {
      console.error('Erro ao enviar convite:', err)
      setError(err.message || 'Erro ao enviar convite')
    } finally {
      setLoading(false)
    }
  }

  const sendInviteEmail = async (inviteData) => {
    // Por enquanto, vamos simular o envio do email
    // Em produção, isso seria feito via Supabase Edge Functions
    console.log('Email de convite enviado:', inviteData)
    
    // Aqui você implementaria o envio real via Supabase Edge Functions
    // ou serviço de email como Resend, SendGrid, etc.
  }

  const cancelInvite = async (inviteId) => {
    if (!confirm('Tem certeza que deseja cancelar este convite?')) return

    try {
      const { error } = await supabase
        .from('invites')
        .update({ 
          status: 'cancelled', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', inviteId)

      if (error) throw error

      setSuccess('Convite cancelado')
      loadInvites()
    } catch (err) {
      console.error('Erro ao cancelar convite:', err)
      setError('Erro ao cancelar convite')
    }
  }

  const resendInvite = async (invite) => {
    try {
      setLoading(true)
      
      // Reenviar email (simular)
      await sendInviteEmail({
        email: invite.email,
        token: invite.token,
        company_id: invite.company_id,
        role: invite.role
      })
      
      setSuccess(`Convite reenviado para ${invite.email}!`)
    } catch (err) {
      setError('Erro ao reenviar convite')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendente'
      case 'accepted':
        return 'Aceito'
      case 'expired':
        return 'Expirado'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
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

  // Verificar se usuário tem permissão para convidar
  const canInvite = profile?.role === 'super_admin' || 
    profile?.user_companies?.some(uc => 
      uc.is_active && ['company_admin', 'super_admin'].includes(uc.role)
    )

  if (!canInvite) {
    return (
      <Card className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
        <p className="text-gray-600">
          Você não tem permissão para convidar usuários.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Formulário de Convite */}
      <Card className="p-6">
        <div className="flex items-center mb-6">
          <UserPlus className="w-5 h-5 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold">Convidar Usuário</h2>
        </div>

        <form onSubmit={sendInvite} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <Input
                type="email"
                placeholder="usuario@email.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">Selecione uma empresa</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Perfil
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={inviteForm.role}
                onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                disabled={loading}
              >
                {profile?.role === 'super_admin' && (
                  <option value="super_admin">Super Administrador</option>
                )}
                {['super_admin', 'consultant'].includes(profile?.role) && (
                  <option value="consultant">Consultor</option>
                )}
                <option value="company_admin">Administrador</option>
                <option value="user">Usuário</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensagem Personalizada (opcional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Adicione uma mensagem personalizada ao convite..."
              value={inviteForm.message}
              onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loading size="sm" className="mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Enviar Convite
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Lista de Convites */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-gray-600 mr-2" />
            <h2 className="text-xl font-semibold">Convites Enviados</h2>
          </div>
          <Button
            variant="outline"
            onClick={loadInvites}
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {loading && invites.length === 0 ? (
          <div className="text-center py-8">
            <Loading size="lg" />
            <p className="mt-2 text-gray-600">Carregando convites...</p>
          </div>
        ) : invites.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum convite enviado ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invites.map(invite => (
              <div
                key={invite.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(invite.status)}
                      <div>
                        <p className="font-medium">{invite.email}</p>
                        <p className="text-sm text-gray-600">
                          {getRoleName(invite.role)} • {invite.company_name}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Status: {getStatusText(invite.status)} • 
                      Enviado em {new Date(invite.created_at).toLocaleDateString('pt-BR')} • 
                      Expira em {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                    </div>
                    {invite.invite_message && (
                      <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <strong>Mensagem:</strong> {invite.invite_message}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {invite.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resendInvite(invite)}
                          disabled={loading}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelInvite(invite.id)}
                          disabled={loading}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
