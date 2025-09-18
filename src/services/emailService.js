import { Resend } from 'resend'

// Configuração com variáveis de ambiente
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || 'TEST_MODE'
const FROM_EMAIL = import.meta.env.VITE_FROM_EMAIL || 'BG2 <convites@bg2.com>'
const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173'

// Inicializar Resend
let resend = null
try {
  if (RESEND_API_KEY && RESEND_API_KEY !== 'TEST_MODE' && RESEND_API_KEY.startsWith('re_')) {
    resend = new Resend(RESEND_API_KEY)
    console.log('✅ Resend configurado com API key real')
  } else {
    console.log('🧪 Resend em modo de teste - usando dados fictícios')
  }
} catch (error) {
  console.warn('⚠️ Erro ao inicializar Resend:', error.message)
}

// Template de email de convite
const getInviteEmailTemplate = (data) => {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Convite para BG2 - ${data.company_name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; color: #333; background-color: #f8fafc;
        }
        .container {
            max-width: 600px; margin: 0 auto; background-color: #ffffff;
            border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            padding: 40px 30px; text-align: center;
        }
        .logo { color: #ffffff; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .header-subtitle { color: #e0e7ff; font-size: 16px; }
        .invite-badge {
            background-color: rgba(255, 255, 255, 0.2); color: #ffffff;
            padding: 8px 16px; border-radius: 20px; font-size: 14px;
            font-weight: 600; margin-top: 15px; display: inline-block;
        }
        .content { padding: 40px 30px; }
        .title {
            font-size: 24px; font-weight: 600; color: #1e293b;
            margin-bottom: 16px; text-align: center;
        }
        .message {
            font-size: 16px; color: #64748b; margin-bottom: 30px; text-align: center;
        }
        .invite-info {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border: 1px solid #e2e8f0; padding: 25px; border-radius: 12px; margin: 25px 0;
        }
        .invite-row {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 12px; font-size: 14px;
        }
        .invite-label { color: #64748b; font-weight: 500; }
        .invite-value { color: #1e293b; font-weight: 600; }
        .company-badge, .role-badge {
            color: white; padding: 4px 12px; border-radius: 16px;
            font-size: 12px; font-weight: 600;
        }
        .company-badge { background-color: #6366f1; }
        .role-badge { background-color: #059669; }
        .button-container { text-align: center; margin: 30px 0; }
        .invite-button {
            display: inline-block; padding: 16px 32px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: #ffffff !important; text-decoration: none; border-radius: 8px;
            font-weight: 600; font-size: 16px; transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(99, 102, 241, 0.25);
        }
        .invite-button:hover {
            transform: translateY(-2px); box-shadow: 0 6px 12px rgba(99, 102, 241, 0.35);
        }
        .expiry-info {
            background-color: #fef3c7; border-left: 4px solid #f59e0b;
            padding: 16px; margin: 30px 0; border-radius: 4px;
        }
        .expiry-title { font-weight: 600; color: #92400e; margin-bottom: 8px; }
        .expiry-text { color: #92400e; font-size: 14px; }
        .personal-message {
            background-color: #f0f9ff; border-left: 4px solid #0ea5e9;
            padding: 20px; margin: 25px 0; border-radius: 4px;
        }
        .personal-title { font-weight: 600; color: #0c4a6e; margin-bottom: 8px; }
        .personal-text { color: #0c4a6e; font-style: italic; }
        .footer {
            background-color: #f1f5f9; padding: 30px; text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer-text { color: #64748b; font-size: 14px; line-height: 1.5; }
        .footer-link { color: #6366f1; text-decoration: none; }
        @media (max-width: 600px) {
            .container { margin: 0; border-radius: 0; }
            .content, .header, .footer { padding: 20px; }
            .invite-row { flex-direction: column; align-items: flex-start; }
            .invite-label { margin-bottom: 4px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">⚡ BG2</div>
            <div class="header-subtitle">Plataforma de Gestão Empresarial</div>
            <div class="invite-badge">✉️ Convite Especial</div>
        </div>
        
        <div class="content">
            <h1 class="title">Você foi convidado! 🎉</h1>
            <p class="message">
                <strong>${data.invited_by_name}</strong> convidou você para se juntar à plataforma BG2 
                e fazer parte da equipe <strong>${data.company_name}</strong>.
            </p>
            
            <div class="invite-info">
                <div class="invite-row">
                    <span class="invite-label">🏢 Empresa:</span>
                    <span class="company-badge">${data.company_name}</span>
                </div>
                <div class="invite-row">
                    <span class="invite-label">👤 Função:</span>
                    <span class="role-badge">${data.role_name}</span>
                </div>
                <div class="invite-row">
                    <span class="invite-label">📧 Email:</span>
                    <span class="invite-value">${data.email}</span>
                </div>
                <div class="invite-row">
                    <span class="invite-label">🗓️ Convidado em:</span>
                    <span class="invite-value">${data.invite_date}</span>
                </div>
            </div>
            
            ${data.invite_message ? `
            <div class="personal-message">
                <div class="personal-title">💬 Mensagem pessoal:</div>
                <div class="personal-text">"${data.invite_message}"</div>
            </div>
            ` : ''}
            
            <div class="button-container">
                <a href="${data.invite_url}" class="invite-button">
                    🚀 Aceitar Convite
                </a>
            </div>
            
            <div class="expiry-info">
                <div class="expiry-title">⏰ Importante</div>
                <div class="expiry-text">
                    • Este convite expira em 7 dias (${data.expiry_date})<br>
                    • Você precisa aceitar o convite para acessar a plataforma<br>
                    • Se já tem conta, será adicionado automaticamente à empresa
                </div>
            </div>
            
            <p class="message" style="font-size: 14px; margin-top: 20px;">
                Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                <span style="word-break: break-all; color: #6366f1;">${data.invite_url}</span>
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                Este convite foi enviado por <strong>${data.invited_by_name}</strong> (${data.invited_by_email}) 
                para se juntar à <strong>${data.company_name}</strong>.<br><br>
                Precisa de ajuda? Entre em contato: 
                <a href="mailto:suporte@bg2.com" class="footer-link">suporte@bg2.com</a><br>
                <br>
                <strong>BG2</strong> - Transformando dados em decisões
            </p>
        </div>
    </div>
</body>
</html>
  `
}

// Função para obter nome da função
const getRoleDisplayName = (role) => {
  const roles = {
    'super_admin': 'Super Administrador',
    'consultant': 'Consultor',
    'company_admin': 'Administrador da Empresa',
    'user': 'Usuário'
  }
  return roles[role] || 'Usuário'
}

// Função principal para enviar email de convite
export const sendInviteEmail = async (inviteData) => {
  try {
    console.log('📧 Preparando envio de email de convite...')
    
    // Preparar dados do template
    const templateData = {
      email: inviteData.email,
      company_name: inviteData.company_name || 'Empresa',
      role_name: getRoleDisplayName(inviteData.role),
      invite_message: inviteData.message,
      invite_url: `${APP_URL}/accept-invite?token=${inviteData.token}`,
      invited_by_name: inviteData.invited_by_name || 'Administrador',
      invited_by_email: inviteData.invited_by_email || 'admin@bg2.com',
      invite_date: new Date().toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long', 
        year: 'numeric'
      }),
      expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }
    
    // Gerar template HTML
    const htmlContent = getInviteEmailTemplate(templateData)
    
    // Se estivermos em modo de teste (sem API key real)
    if (!resend || RESEND_API_KEY === 'TEST_MODE') {
      console.log('🧪 MODO DE TESTE - Email de convite:')
      console.log('📧 Para:', inviteData.email)
      console.log('🏢 Empresa:', templateData.company_name)
      console.log('👤 Função:', templateData.role_name)
      console.log('🔗 URL:', templateData.invite_url)
      console.log('💬 Mensagem:', templateData.invite_message || 'Nenhuma')
      
      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Salvar template em arquivo para visualização (opcional)
      if (typeof window !== 'undefined' && window.showSaveFilePicker) {
        try {
          const blob = new Blob([htmlContent], { type: 'text/html' })
          // Em produção, você pode remover esta parte
          console.log('📁 Template HTML gerado e pronto para envio')
        } catch (e) {
          // Ignorar erro se API não suportada
        }
      }
      
      return {
        success: true,
        message: 'Email enviado com sucesso (modo de teste)',
        data: {
          id: `test_${Date.now()}`,
          to: inviteData.email,
          template: 'invite'
        }
      }
    }
    
    // Enviar email real via Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [inviteData.email],
      subject: `Você foi convidado para o BG2! 🎉`,
      html: htmlContent,
      text: `
        Olá!
        
        ${templateData.invited_by_name} convidou você para se juntar à plataforma BG2 
        e fazer parte da equipe ${templateData.company_name}.
        
        Sua função será: ${templateData.role_name}
        
        ${templateData.invite_message ? `Mensagem: "${templateData.invite_message}"` : ''}
        
        Para aceitar o convite, acesse: ${templateData.invite_url}
        
        Este convite expira em 7 dias (${templateData.expiry_date}).
        
        Atenciosamente,
        Equipe BG2
      `.trim()
    })
    
    if (error) {
      throw new Error(`Erro do Resend: ${error.message}`)
    }
    
    console.log('✅ Email enviado com sucesso:', data.id)
    
    return {
      success: true,
      message: 'Email enviado com sucesso',
      data
    }
    
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error)
    
    return {
      success: false,
      message: error.message || 'Erro ao enviar email',
      error
    }
  }
}

// Função para testar configuração
export const testEmailConfiguration = async () => {
  console.log('🧪 Testando configuração de email...')
  
  const testData = {
    email: 'teste@exemplo.com',
    company_name: 'Empresa de Teste',
    role: 'user',
    message: 'Este é um convite de teste!',
    token: 'test_token_123',
    invited_by_name: 'João Silva',
    invited_by_email: 'joao@empresa.com'
  }
  
  const result = await sendInviteEmail(testData)
  
  if (result.success) {
    console.log('✅ Configuração de email OK')
  } else {
    console.log('❌ Problemas na configuração:', result.message)
  }
  
  return result
}

// Exportar configurações para debug
export const getEmailConfig = () => {
  return {
    service: 'Resend',
    apiKey: RESEND_API_KEY === 'TEST_MODE' ? 'MODO DE TESTE' : 'CONFIGURADO',
    fromEmail: FROM_EMAIL,
    configured: resend !== null || RESEND_API_KEY === 'TEST_MODE'
  }
}
