import { supabase } from './supabase'

/**
 * Envia email de convite via edge function send-invite-email (Resend).
 * Requer que o convite já tenha sido criado no banco (token gerado).
 */
export async function sendInviteEmail({ to, inviterName, inviterEmail, companyName, role, token, message }) {
  if (!token) throw new Error('Token do convite é obrigatório')

  console.log('📧 Enviando convite via Resend para:', to)

  const { data, error } = await supabase.functions.invoke('send-invite-email', {
    body: {
      email: to,
      company_name: companyName || 'BG2 Partimap',
      role: role || 'user',
      token,
      invited_by_name: inviterName || 'Administrador',
      invited_by_email: inviterEmail || '',
      message: message || null,
    }
  })

  if (error) throw error
  if (data && !data.success) throw new Error(data.error || 'Erro ao enviar email')

  console.log('✅ Email enviado via Resend')
  return { success: true, message: 'Email enviado!' }
}

export function getEmailConfig() { return { configured: true } }

export async function testEmailConfiguration(testEmail) {
  return await sendInviteEmail({ to: testEmail, inviterName: 'Teste', companyName: 'BG2', role: 'user', token: 'test-token' })
}

