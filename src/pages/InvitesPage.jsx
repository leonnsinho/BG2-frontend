import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { sendInviteEmail as sendInviteEmailService, getEmailConfig, testEmailConfiguration } from '../services/emailService'
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
  Users,
  Settings,
  Send,
  TestTube
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function InvitesPage() {
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
  const [emailConfig, setEmailConfig] = useState(null)
  const [showTestModal, setShowTestModal] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testingEmail, setTestingEmail] = useState(false)

  // Carregar configuração de email
  useEffect(() => {
    const config = getEmailConfig()
    setEmailConfig(config)
  }, [])

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
      toast.error('Erro ao carregar empresas')
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
      toast.error('Erro ao carregar convites')
    } finally {
      setLoading(false)
    }
  }

  const sendInvite = async (e) => {
    e.preventDefault()
    
    if (!inviteForm.email || !selectedCompany) {
      toast.error('Email e empresa são obrigatórios')
      return
    }

    try {
      setLoading(true)

      // Chamar função do Supabase para criar convite
      const { data, error } = await supabase.rpc('create_invite', {
        p_email: inviteForm.email,
        p_company_id: selectedCompany,
        p_role: inviteForm.role,
        p_message: inviteForm.message || null
      })

      if (error) throw error

      if (data.success) {
        toast.success(`Convite criado para ${inviteForm.email}!`)
        
        // Enviar email de convite
        try {
          await sendInviteEmailService(data)
          toast.success('📧 Email enviado com sucesso!')
        } catch (emailError) {
          console.error('Erro ao enviar email:', emailError)
          toast.error(`⚠️ Convite criado, mas email não foi enviado: ${emailError.message}`)
        }
        
        // Limpar formulário e recarregar lista
        setInviteForm({ email: '', role: 'user', message: '' })
        loadInvites()
      } else {
        toast.error(data.error || 'Erro ao criar convite')
      }
    } catch (err) {
      console.error('Erro ao enviar convite:', err)
      toast.error(err.message || 'Erro ao enviar convite')
    } finally {
      setLoading(false)
    }
  }

  const sendInviteEmail = async (inviteData) => {
    try {
      // Buscar informações adicionais necessárias
      const company = companies.find(c => c.id === inviteData.company_id)
      
      // Preparar dados para o serviço Supabase Auth nativo
      const emailData = {
        to: inviteData.email,
        inviterName: profile?.full_name || 'Administrador',
        companyName: company?.name || 'Empresa',
        role: inviteData.role,
        metadata: {
          company_id: inviteData.company_id,
          invite_message: inviteData.message,
          token: inviteData.token,
          invited_by_email: profile?.email || user?.email
        }
      }
      
      // Enviar convite usando Supabase Auth (envia email automaticamente)
      const result = await sendInviteEmailService(emailData)
      
      if (result.success) {
        return result
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('❌ Erro ao enviar email de convite:', error)
      throw error
    }
  }

  const testEmailSending = async () => {
    if (!testEmail) {
      toast.error('Digite um email para teste')
      return
    }

    try {
      setTestingEmail(true)
      toast.loading('Enviando email de teste...', { id: 'test-email' })
      
      const result = await testEmailConfiguration(testEmail)
      
      if (result.success) {
        toast.success('Email de teste enviado com sucesso! Verifique a caixa de entrada.', { id: 'test-email' })
        setShowTestModal(false)
        setTestEmail('')
      } else {
        toast.error(`Erro ao enviar: ${result.message}`, { id: 'test-email' })
      }
    } catch (error) {
      toast.error('Erro ao testar envio de email', { id: 'test-email' })
    } finally {
      setTestingEmail(false)
    }
  }

  const cancelInvite = async (inviteId) => {
    if (!confirm('Tem certeza que deseja cancelar este convite?')) return

    try {
      setLoading(true)
      
      console.log('🗑️ Cancelando convite:', inviteId)
      
      // Primeiro tenta UPDATE para 'cancelled'
      const { data: updateData, error: updateError } = await supabase
        .from('invites')
        .update({ status: 'cancelled' })
        .eq('id', inviteId)
        .select()

      if (updateError) {
        console.error('❌ Erro ao atualizar status:', updateError)
        
        // Se falhar por constraint, tenta DELETE direto
        console.log('🔄 Tentando DELETE direto...')
        const { data: deleteData, error: deleteError } = await supabase
          .from('invites')
          .delete()
          .eq('id', inviteId)
          .select()
        
        if (deleteError) {
          console.error('❌ Erro ao deletar:', deleteError)
          throw deleteError
        }
        
        if (!deleteData || deleteData.length === 0) {
          throw new Error('Não foi possível deletar o convite. Verifique suas permissões.')
        }
        
        console.log('✅ Convite deletado (após falha no UPDATE):', deleteData)
      } else {
        if (!updateData || updateData.length === 0) {
          throw new Error('Não foi possível cancelar o convite. Verifique suas permissões.')
        }
        console.log('✅ Convite cancelado (UPDATE):', updateData)
      }
      
      toast.success('✅ Convite cancelado com sucesso!')
      
      // Recarregar lista de convites
      await loadInvites()
      
    } catch (err) {
      console.error('❌ Erro ao cancelar convite:', err)
      
      // Mensagens de erro mais específicas
      let errorMessage = 'Erro ao cancelar convite'
      
      if (err.message?.includes('permission') || err.message?.includes('permissões')) {
        errorMessage = 'Você não tem permissão para cancelar este convite'
      } else if (err.message?.includes('not found')) {
        errorMessage = 'Convite não encontrado'
      } else if (err.message?.includes('policy')) {
        errorMessage = 'Acesso negado pela política de segurança. Entre em contato com o administrador.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      toast.error(`❌ ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const resendInvite = async (invite) => {
    try {
      setLoading(true)
      
      // Reenviar convite via Supabase Auth
      const company = companies.find(c => c.id === invite.company_id)
      const emailData = {
        to: invite.email,
        inviterName: profile?.full_name || 'Administrador',
        companyName: company?.name || invite.company_name,
        role: invite.role,
        metadata: {
          company_id: invite.company_id,
          invite_message: invite.invite_message,
          token: invite.token,
          invited_by_email: profile?.email || user?.email,
          is_resend: true,
          resent_at: new Date().toISOString()
        }
      }
      
      const result = await sendInviteEmailService(emailData)
      
      if (result.success) {
        toast.success(`Convite reenviado para ${invite.email}!`)
      } else {
        toast.error(`Erro ao reenviar: ${result.message}`)
      }
    } catch (err) {
      toast.error('Erro ao reenviar convite')
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = async () => {
    const cancelledInvites = invites.filter(inv => 
      inv.status === 'cancelled' || inv.status === 'expired' || inv.status === 'accepted'
    )
    
    if (cancelledInvites.length === 0) {
      toast.error('Não há convites finalizados para limpar')
      return
    }
    
    if (!confirm(`Deseja limpar ${cancelledInvites.length} convite(s) do histórico? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      setLoading(true)
      
      const ids = cancelledInvites.map(inv => inv.id)
      console.log('🗑️ Limpando histórico de', ids.length, 'convites:', ids)
      
      // Tentar deletar um por um para identificar quais falharam
      let successCount = 0
      let failCount = 0
      
      for (const id of ids) {
        const { data, error } = await supabase
          .from('invites')
          .delete()
          .eq('id', id)
          .select()

        if (error) {
          console.error(`❌ Erro ao deletar convite ${id}:`, error)
          failCount++
        } else if (data && data.length > 0) {
          console.log(`✅ Convite ${id} deletado`)
          successCount++
        } else {
          console.warn(`⚠️ Convite ${id} não pôde ser deletado (sem permissão ou não existe)`)
          failCount++
        }
      }

      console.log(`📊 Resultado: ${successCount} deletados, ${failCount} falhas`)
      
      if (successCount > 0) {
        toast.success(`✅ ${successCount} convite(s) removido(s) do histórico!`)
      }
      
      if (failCount > 0) {
        toast.error(`⚠️ ${failCount} convite(s) não puderam ser removidos. Verifique suas permissões.`)
      }
      
      await loadInvites()
      
    } catch (err) {
      console.error('❌ Erro ao limpar histórico:', err)
      toast.error(`❌ Erro ao limpar histórico: ${err.message}`)
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#373435] mb-2">Acesso Negado</h3>
              <p className="text-gray-600">
                Você não tem permissão para convidar usuários.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-[#EBA500]/20 to-[#EBA500]/10">
                <UserPlus className="w-6 h-6 text-[#EBA500]" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-[#373435] mb-3">Convites</h1>
                <p className="text-gray-600 text-lg">
                  Convide novos usuários para sua empresa
                </p>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 bg-white shadow-sm border border-gray-200/50 rounded-3xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold text-[#373435]">{invites.length}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-white shadow-sm border border-gray-200/50 rounded-3xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-xl font-bold text-[#373435]">
                    {invites.filter(inv => inv.status === 'pending').length}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-white shadow-sm border border-gray-200/50 rounded-3xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Aceitos</p>
                  <p className="text-xl font-bold text-[#373435]">
                    {invites.filter(inv => inv.status === 'accepted').length}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-white shadow-sm border border-gray-200/50 rounded-3xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expirados</p>
                  <p className="text-xl font-bold text-[#373435]">
                    {invites.filter(inv => inv.status === 'expired').length}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Status do Email Service */}
          {emailConfig && (
            <Card className="p-4 bg-gradient-to-r from-blue-50/80 to-blue-100/50 border border-blue-200/50 rounded-3xl mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">
                      {emailConfig.configured ? '✅ Email Configurado' : '❌ Email Não Configurado'}
                    </p>
                    <p className="text-sm text-blue-700">
                      {emailConfig.service} • {emailConfig.fromEmail} • Domínio: {emailConfig.domain}
                    </p>
                  </div>
                </div>
                {emailConfig.configured && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTestModal(true)}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Testar Email
                  </Button>
                )}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Formulário de Convite */}
            <Card className="p-6 bg-white shadow-sm border border-gray-200/50 rounded-3xl xl:col-span-1">
              <div className="flex items-center mb-6">
                <Send className="w-5 h-5 text-[#EBA500] mr-2" />
                <h2 className="text-xl font-semibold text-[#373435]">Novo Convite</h2>
              </div>

              <form onSubmit={sendInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email *
                  </label>
                  <Input
                    type="email"
                    placeholder="usuario@email.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                    disabled={loading}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    Empresa *
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200"
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

                <div>
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    Perfil
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200"
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

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 hover:from-[#EBA500]/90 hover:to-[#EBA500]/80 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Convite
                    </>
                  )}
                </Button>
              </form>
            </Card>

            {/* Lista de Convites */}
            <Card className="p-6 bg-white shadow-sm border border-gray-200/50 rounded-3xl xl:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-[#EBA500] mr-2" />
                  <h2 className="text-xl font-semibold text-[#373435]">Convites Enviados</h2>
                  {invites.length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-[#EBA500]/10 text-[#EBA500] text-xs font-medium rounded-full">
                      {invites.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={clearHistory}
                    disabled={loading || !invites.some(inv => ['cancelled', 'expired', 'accepted'].includes(inv.status))}
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Limpar convites cancelados, expirados e aceitos"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar Histórico
                  </Button>
                  <Button
                    variant="outline"
                    onClick={loadInvites}
                    disabled={loading}
                    size="sm"
                    className="border-[#EBA500]/30 text-[#EBA500] hover:bg-[#EBA500]/10"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </div>

              {loading && invites.length === 0 ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EBA500] mx-auto mb-2"></div>
                  <p className="text-gray-600">Carregando convites...</p>
                </div>
              ) : invites.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum convite enviado ainda</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {invites.map(invite => (
                    <div
                      key={invite.id}
                      className="border border-gray-200/50 rounded-2xl p-4 hover:shadow-sm transition-all duration-200 hover:border-[#EBA500]/20"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getStatusIcon(invite.status)}
                            <div>
                              <p className="font-medium text-[#373435]">{invite.email}</p>
                              <p className="text-sm text-gray-600">
                                {getRoleName(invite.role)} • {invite.company_name}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              invite.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              invite.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              invite.status === 'expired' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {getStatusText(invite.status)}
                            </span>
                            <span className="ml-2">
                              Enviado em {new Date(invite.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          {invite.invite_message && (
                            <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-xl">
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
                                className="border-green-200 text-green-700 hover:bg-green-50"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => cancelInvite(invite.id)}
                                disabled={loading}
                                className="border-red-200 text-red-700 hover:bg-red-50"
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
        </div>

        {/* Modal de Teste de Email */}
        {showTestModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-white p-6 rounded-3xl max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                    <TestTube className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#373435]">Testar Envio de Email</h3>
                </div>
                <button
                  onClick={() => setShowTestModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Digite seu email para receber um convite de teste e verificar se o sistema 
                de envio está funcionando corretamente.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Seu Email
                  </label>
                  <Input
                    type="email"
                    placeholder="seu-email@exemplo.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    disabled={testingEmail}
                    className="w-full"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3">
                  <p className="text-xs text-yellow-800">
                    ⚠️ <strong>Atenção:</strong> Um email de teste será enviado para o endereço fornecido. 
                    Verifique sua caixa de entrada e spam.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowTestModal(false)
                      setTestEmail('')
                    }}
                    disabled={testingEmail}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={testEmailSending}
                    disabled={testingEmail || !testEmail}
                    className="flex-1 bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 hover:from-[#EBA500]/90 hover:to-[#EBA500]/80 text-white"
                  >
                    {testingEmail ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Teste
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
  )
}