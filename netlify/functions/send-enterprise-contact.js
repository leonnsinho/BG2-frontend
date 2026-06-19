// Netlify Function — envia solicitação Enterprise via Resend para contato@bg2plan.com.br

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'BG2 <contato@bg2plan.com.br>'
const TO_EMAIL = 'contato@bg2plan.com.br'

function getEmailTemplate({ empresa, nome, cargo, email, whatsapp }) {
  const date = new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo'
  })

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solicitação Enterprise - BG2</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;padding:20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:40px;text-align:center;">
              <h1 style="color:#EBA500;font-size:32px;margin:0 0 8px 0;letter-spacing:1px;">BG2</h1>
              <p style="color:rgba(255,255,255,0.85);font-size:16px;margin:0;">Nova Solicitação de Plano Enterprise</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;">
              <h2 style="font-size:22px;font-weight:700;color:#373435;margin:0 0 8px 0;">🏢 Solicitação Enterprise</h2>
              <p style="font-size:14px;color:#6c757d;margin:0 0 28px 0;">Recebido em ${date}</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border:2px solid #EBA500;border-radius:16px;overflow:hidden;margin:0 0 28px 0;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="10" cellspacing="0">
                      <tr>
                        <td width="40%" style="color:#6c757d;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e9ecef;">Empresa</td>
                        <td style="color:#373435;font-size:15px;font-weight:700;border-bottom:1px solid #e9ecef;">${empresa}</td>
                      </tr>
                      <tr>
                        <td width="40%" style="color:#6c757d;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e9ecef;">Solicitante</td>
                        <td style="color:#373435;font-size:15px;font-weight:700;border-bottom:1px solid #e9ecef;">${nome}</td>
                      </tr>
                      <tr>
                        <td width="40%" style="color:#6c757d;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e9ecef;">Cargo</td>
                        <td style="color:#373435;font-size:15px;border-bottom:1px solid #e9ecef;">${cargo}</td>
                      </tr>
                      <tr>
                        <td width="40%" style="color:#6c757d;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e9ecef;">Email</td>
                        <td style="border-bottom:1px solid #e9ecef;"><a href="mailto:${email}" style="color:#EBA500;font-size:15px;font-weight:600;text-decoration:none;">${email}</a></td>
                      </tr>
                      <tr>
                        <td width="40%" style="color:#6c757d;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">WhatsApp</td>
                        <td><a href="https://wa.me/${whatsapp.replace(/\D/g, '')}" style="color:#25D366;font-size:15px;font-weight:700;text-decoration:none;">📱 ${whatsapp}</a></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;">
                <p style="margin:0;font-size:14px;color:#92400e;">
                  💡 <strong>Próximo passo:</strong> Entre em contato com <strong>${nome}</strong> via WhatsApp ou email para apresentar a proposta Enterprise personalizada.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#f8f9fa;padding:24px;text-align:center;border-top:3px solid #EBA500;">
              <p style="color:#6c757d;font-size:12px;margin:0;">BG2 Plan · Plataforma de Gestão Estratégica</p>
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
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  if (!RESEND_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'RESEND_API_KEY não configurada' }) }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body inválido' }) }
  }

  const { empresa, nome, cargo, email, whatsapp } = body
  if (!empresa || !nome || !cargo || !email || !whatsapp) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Todos os campos são obrigatórios' }) }
  }

  // Validação básica de email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Email inválido' }) }
  }

  try {
    const html = getEmailTemplate({ empresa, nome, cargo, email, whatsapp })

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: email,
        subject: `🏢 Solicitação Enterprise — ${empresa} (${nome})`,
        html,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      console.error('Resend error:', result)
      return { statusCode: res.status, body: JSON.stringify({ error: result.message || 'Erro ao enviar email' }) }
    }

    console.log('✅ Enterprise contact sent:', result.id)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true }),
    }
  } catch (err) {
    console.error('Erro na function:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno ao enviar email' }) }
  }
}
