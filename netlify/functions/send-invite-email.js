// Netlify Function para enviar emails de convite via Resend
// Chamada via: /.netlify/functions/send-invite-email

const RESEND_API_KEY = process.env.RESEND_API_KEY
if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY não configurada nas variáveis de ambiente do Netlify')
}
const FROM_EMAIL = 'BG2 <contato@bg2plan.com.br>'
const APP_URL = process.env.APP_URL || 'https://bg2plan.com.br'

function getEmailTemplate(data) {
  const roleNames = {
    super_admin: 'Super Administrador',
    consultant: 'Consultor',
    company_admin: 'Administrador da Empresa',
    user: 'Usuário',
  }

  const roleName = data.role_name || roleNames[data.role] || 'Usuário'
  const inviteDate = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  const inviteUrl = data.invite_url || `${APP_URL}/accept-invite?token=${data.token}`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite BG2</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;padding:20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:linear-gradient(135deg,#EBA500 0%,#D89500 100%);padding:40px;text-align:center;">
              <h1 style="color:#ffffff;font-size:32px;margin:0 0 8px 0;letter-spacing:1px;">BG2</h1>
              <p style="color:rgba(255,255,255,0.95);font-size:16px;margin:0;">Plataforma de Gestão Estratégica</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;">
              <h2 style="font-size:26px;font-weight:700;color:#373435;margin:0 0 16px 0;text-align:center;">Você foi convidado! 🎉</h2>
              <p style="font-size:16px;color:#6c757d;text-align:center;line-height:1.7;margin:0 0 30px 0;">
                <strong>${data.invited_by_name}</strong> te convidou para fazer parte da equipe <strong>${data.company_name}</strong>.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border:2px solid #EBA500;border-radius:16px;padding:28px;margin:28px 0;">
                <tr><td>
                  <table width="100%" cellpadding="8" cellspacing="0">
                    <tr>
                      <td style="color:#6c757d;font-weight:600;font-size:15px;">🏢 Empresa</td>
                      <td align="right"><span style="background:#EBA500;color:white;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:700;">${data.company_name}</span></td>
                    </tr>
                    <tr>
                      <td style="color:#6c757d;font-weight:600;font-size:15px;">👤 Função</td>
                      <td align="right"><span style="background:#059669;color:white;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:700;">${roleName}</span></td>
                    </tr>
                    <tr>
                      <td style="color:#6c757d;font-weight:600;font-size:15px;">📧 Email</td>
                      <td align="right" style="color:#373435;font-weight:700;">${data.email}</td>
                    </tr>
                    <tr>
                      <td style="color:#6c757d;font-weight:600;font-size:15px;">📅 Data</td>
                      <td align="right" style="color:#373435;font-weight:700;">${inviteDate}</td>
                    </tr>
                  </table>
                </td></tr>
              </table>

              ${data.message ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border-left:4px solid #0ea5e9;border-radius:8px;padding:24px;margin:28px 0;">
                <tr><td>
                  <p style="font-weight:700;color:#0c4a6e;margin:0 0 12px 0;">💬 Mensagem</p>
                  <p style="color:#0c4a6e;font-style:italic;line-height:1.7;margin:0;">"${data.message}"</p>
                </td></tr>
              </table>
              ` : ''}

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:35px 0;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="display:inline-block;padding:18px 40px;background:#EBA500;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;font-size:17px;text-transform:uppercase;">
                      🚀 ACEITAR CONVITE
                    </a>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff3cd;border-left:4px solid #f59e0b;border-radius:8px;padding:20px;margin:30px 0;">
                <tr><td>
                  <p style="font-weight:700;color:#92400e;margin:0 0 10px 0;">⏰ Informações Importantes</p>
                  <p style="color:#92400e;font-size:14px;line-height:1.8;margin:0;">
                    • Este convite é válido até <strong>${expiryDate}</strong> (7 dias)<br>
                    • Se já possui uma conta, será vinculado automaticamente
                  </p>
                </td></tr>
              </table>

              <p style="text-align:center;font-size:13px;color:#6c757d;margin:25px 0 0 0;">Se o botão não funcionar, copie e cole:</p>
              <p style="background:#f8f9fa;border:1px dashed #dee2e6;padding:12px;border-radius:8px;text-align:center;word-break:break-all;font-size:13px;color:#EBA500;font-family:monospace;margin:10px 0 0 0;">${inviteUrl}</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8f9fa;padding:30px;text-align:center;border-top:3px solid #EBA500;">
              <p style="color:#6c757d;font-size:13px;line-height:1.8;margin:0;">
                Enviado por <strong>${data.invited_by_name}</strong> (${data.invited_by_email})
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

exports.handler = async (event) => {
  // Só aceita POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  if (!RESEND_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Serviço de email não configurado. Configure RESEND_API_KEY nas variáveis de ambiente do Netlify.' }) }
  }

  try {
    const data = JSON.parse(event.body || '{}')

    if (!data.email || !data.company_name || !data.token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'email, company_name e token são obrigatórios' })
      }
    }

    console.log('📧 Enviando convite para:', data.email)

    const html = getEmailTemplate(data)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [data.email],
        subject: `🎉 Você foi convidado para o BG2 - ${data.company_name}`,
        html,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      console.error('Resend error:', result)
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: result.message || 'Erro ao enviar email' })
      }
    }

    console.log('✅ Email enviado:', result.id)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, id: result.id })
    }
  } catch (err) {
    console.error('Erro na function:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    }
  }
}
