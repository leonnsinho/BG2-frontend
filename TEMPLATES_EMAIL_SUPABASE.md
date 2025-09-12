# 📧 TEMPLATES DE EMAIL PARA SUPABASE
## Configuração Completa de Email Templates

### 📋 RESUMO DOS TEMPLATES

Este documento contém todos os templates de email necessários para configurar no Supabase Dashboard em **Authentication > Email Templates**.

**Templates incluídos:**
1. 🔐 **Password Recovery** - Recuperação de senha
2. ✅ **Email Confirmation** - Confirmação de email/cadastro  
3. 🎉 **Welcome Email** - Boas-vindas (opcional)
4. 🔄 **Email Change Confirmation** - Mudança de email
5. 🔐 **Magic Link** - Login sem senha (opcional)
6. 📩 **Invite Email** - Convite para sistema (CUSTOM)

---

## 🛠️ COMO CONFIGURAR NO SUPABASE

### **Passo a Passo:**
1. Acesse: https://supabase.com/dashboard
2. Vá para seu projeto: `ecmgbinyotuxhiniadom`
3. Clique em **Authentication** no menu lateral
4. Clique em **Email Templates**
5. Selecione cada template e cole o código HTML correspondente
6. Configure as variáveis de redirect URL
7. Salve cada template

---

## 1. 🔐 RECUPERAÇÃO DE SENHA (Password Recovery)

### **Configurações:**
- **Subject:** `Redefinir sua senha - Partimap`
- **Redirect URL:** `{{ .SiteURL }}/reset-password`

### **Template HTML:**
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinir Senha - Partimap</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            color: #ffffff;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .header-subtitle {
            color: #e0e7ff;
            font-size: 16px;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .title {
            font-size: 24px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 16px;
            text-align: center;
        }
        
        .message {
            font-size: 16px;
            color: #64748b;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        
        .reset-button {
            display: inline-block;
            padding: 14px 28px;
            background-color: #dc2626;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.3s ease;
        }
        
        .reset-button:hover {
            background-color: #b91c1c;
        }
        
        .security-info {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 30px 0;
            border-radius: 4px;
        }
        
        .security-title {
            font-weight: 600;
            color: #92400e;
            margin-bottom: 8px;
        }
        
        .security-text {
            color: #92400e;
            font-size: 14px;
        }
        
        .footer {
            background-color: #f1f5f9;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-text {
            color: #64748b;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .footer-link {
            color: #2563eb;
            text-decoration: none;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            
            .header, .content, .footer {
                padding: 20px;
            }
            
            .title {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🗺️ Partimap</div>
            <div class="header-subtitle">Mapeamento Participativo Inteligente</div>
        </div>
        
        <div class="content">
            <h1 class="title">Redefinir sua senha</h1>
            <p class="message">
                Você solicitou a redefinição de sua senha. Clique no botão abaixo para criar uma nova senha segura.
            </p>
            
            <div class="button-container">
                <a href="{{ .ConfirmationURL }}" class="reset-button">
                    🔐 Redefinir Senha
                </a>
            </div>
            
            <div class="security-info">
                <div class="security-title">⚠️ Informações de Segurança</div>
                <div class="security-text">
                    • Este link expira em 1 hora<br>
                    • Se você não solicitou esta redefinição, ignore este email<br>
                    • Nunca compartilhe este link com outras pessoas
                </div>
            </div>
            
            <p class="message" style="font-size: 14px; margin-top: 20px;">
                Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                <span style="word-break: break-all; color: #2563eb;">{{ .ConfirmationURL }}</span>
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                Este email foi enviado pelo sistema Partimap.<br>
                Se você tem dúvidas, entre em contato conosco em 
                <a href="mailto:suporte@partimap.com" class="footer-link">suporte@partimap.com</a>
            </p>
        </div>
    </div>
</body>
</html>
```

---

## 2. ✅ CONFIRMAÇÃO DE EMAIL (Email Confirmation)

### **Configurações:**
- **Subject:** `Confirme seu email - Bem-vindo ao Partimap! 🎉`
- **Redirect URL:** `{{ .SiteURL }}/login?message=email-confirmed`

### **Template HTML:**
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirme seu Email - Partimap</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            color: #ffffff;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .header-subtitle {
            color: #d1fae5;
            font-size: 16px;
        }
        
        .welcome-badge {
            background-color: rgba(255, 255, 255, 0.2);
            color: #ffffff;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 15px;
            display: inline-block;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .title {
            font-size: 24px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 16px;
            text-align: center;
        }
        
        .message {
            font-size: 16px;
            color: #64748b;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        
        .confirm-button {
            display: inline-block;
            padding: 14px 28px;
            background-color: #059669;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.3s ease;
        }
        
        .confirm-button:hover {
            background-color: #047857;
        }
        
        .features {
            background-color: #f8fafc;
            padding: 25px;
            border-radius: 8px;
            margin: 30px 0;
        }
        
        .features-title {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 16px;
            text-align: center;
        }
        
        .feature-item {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            font-size: 14px;
            color: #475569;
        }
        
        .feature-icon {
            margin-right: 10px;
            font-size: 16px;
        }
        
        .footer {
            background-color: #f1f5f9;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-text {
            color: #64748b;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .footer-link {
            color: #059669;
            text-decoration: none;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            
            .header, .content, .footer {
                padding: 20px;
            }
            
            .title {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🗺️ Partimap</div>
            <div class="header-subtitle">Mapeamento Participativo Inteligente</div>
            <div class="welcome-badge">🎉 Bem-vindo!</div>
        </div>
        
        <div class="content">
            <h1 class="title">Confirme seu email</h1>
            <p class="message">
                Olá! Obrigado por se cadastrar no Partimap. Para completar seu cadastro e começar a usar nossa plataforma, confirme seu endereço de email.
            </p>
            
            <div class="button-container">
                <a href="{{ .ConfirmationURL }}" class="confirm-button">
                    ✅ Confirmar Email
                </a>
            </div>
            
            <div class="features">
                <div class="features-title">🚀 O que você pode fazer no Partimap:</div>
                <div class="feature-item">
                    <span class="feature-icon">🗺️</span>
                    Criar mapas participativos interativos
                </div>
                <div class="feature-item">
                    <span class="feature-icon">👥</span>
                    Engajar sua comunidade em decisões
                </div>
                <div class="feature-item">
                    <span class="feature-icon">📊</span>
                    Analisar dados geoespaciais em tempo real
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🎯</span>
                    Tomar decisões baseadas em dados
                </div>
            </div>
            
            <p class="message" style="font-size: 14px; margin-top: 20px;">
                Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                <span style="word-break: break-all; color: #059669;">{{ .ConfirmationURL }}</span>
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                Precisa de ajuda? Estamos aqui para você!<br>
                Entre em contato: <a href="mailto:suporte@partimap.com" class="footer-link">suporte@partimap.com</a><br>
                Ou acesse nossa documentação: <a href="#" class="footer-link">docs.partimap.com</a>
            </p>
        </div>
    </div>
</body>
</html>
```

---

## 3. 🔄 MUDANÇA DE EMAIL (Email Change Confirmation)

### **Configurações:**
- **Subject:** `Confirme sua nova alteração de email - Partimap`
- **Redirect URL:** `{{ .SiteURL }}/login?message=email-changed`

### **Template HTML:**
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmar Mudança de Email - Partimap</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            color: #ffffff;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .header-subtitle {
            color: #e9d5ff;
            font-size: 16px;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .title {
            font-size: 24px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 16px;
            text-align: center;
        }
        
        .message {
            font-size: 16px;
            color: #64748b;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .email-info {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .email-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            font-size: 14px;
        }
        
        .email-label {
            color: #64748b;
            font-weight: 500;
        }
        
        .email-value {
            color: #1e293b;
            font-weight: 600;
        }
        
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        
        .confirm-button {
            display: inline-block;
            padding: 14px 28px;
            background-color: #7c3aed;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.3s ease;
        }
        
        .confirm-button:hover {
            background-color: #6d28d9;
        }
        
        .security-info {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 30px 0;
            border-radius: 4px;
        }
        
        .security-title {
            font-weight: 600;
            color: #92400e;
            margin-bottom: 8px;
        }
        
        .security-text {
            color: #92400e;
            font-size: 14px;
        }
        
        .footer {
            background-color: #f1f5f9;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-text {
            color: #64748b;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .footer-link {
            color: #7c3aed;
            text-decoration: none;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            
            .header, .content, .footer {
                padding: 20px;
            }
            
            .title {
                font-size: 20px;
            }
            
            .email-row {
                flex-direction: column;
                align-items: flex-start;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🗺️ Partimap</div>
            <div class="header-subtitle">Mapeamento Participativo Inteligente</div>
        </div>
        
        <div class="content">
            <h1 class="title">Confirme sua nova alteração de email</h1>
            <p class="message">
                Você solicitou a alteração do endereço de email da sua conta. Para confirmar esta mudança, clique no botão abaixo.
            </p>
            
            <div class="email-info">
                <div class="email-row">
                    <span class="email-label">📧 Email atual:</span>
                    <span class="email-value">{{ .Email }}</span>
                </div>
                <div class="email-row">
                    <span class="email-label">📧 Novo email:</span>
                    <span class="email-value">{{ .NewEmail }}</span>
                </div>
            </div>
            
            <div class="button-container">
                <a href="{{ .ConfirmationURL }}" class="confirm-button">
                    🔄 Confirmar Alteração
                </a>
            </div>
            
            <div class="security-info">
                <div class="security-title">🛡️ Informações de Segurança</div>
                <div class="security-text">
                    • Este link expira em 24 horas<br>
                    • Se você não solicitou esta alteração, entre em contato conosco imediatamente<br>
                    • Após a confirmação, use o novo email para fazer login
                </div>
            </div>
            
            <p class="message" style="font-size: 14px; margin-top: 20px;">
                Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                <span style="word-break: break-all; color: #7c3aed;">{{ .ConfirmationURL }}</span>
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                Precisa de ajuda com sua conta?<br>
                Entre em contato: <a href="mailto:suporte@partimap.com" class="footer-link">suporte@partimap.com</a>
            </p>
        </div>
    </div>
</body>
</html>
```

---

## 4. 🔐 MAGIC LINK (Login sem senha) - OPCIONAL

### **Configurações:**
- **Subject:** `Seu link de acesso ao Partimap 🔑`
- **Redirect URL:** `{{ .SiteURL }}/dashboard`

### **Template HTML:**
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Link de Acesso - Partimap</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            color: #ffffff;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .header-subtitle {
            color: #fed7aa;
            font-size: 16px;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .title {
            font-size: 24px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 16px;
            text-align: center;
        }
        
        .message {
            font-size: 16px;
            color: #64748b;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        
        .magic-button {
            display: inline-block;
            padding: 14px 28px;
            background-color: #ea580c;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.3s ease;
        }
        
        .magic-button:hover {
            background-color: #dc2626;
        }
        
        .security-info {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 30px 0;
            border-radius: 4px;
        }
        
        .security-title {
            font-weight: 600;
            color: #92400e;
            margin-bottom: 8px;
        }
        
        .security-text {
            color: #92400e;
            font-size: 14px;
        }
        
        .footer {
            background-color: #f1f5f9;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-text {
            color: #64748b;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .footer-link {
            color: #ea580c;
            text-decoration: none;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            
            .header, .content, .footer {
                padding: 20px;
            }
            
            .title {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🗺️ Partimap</div>
            <div class="header-subtitle">Mapeamento Participativo Inteligente</div>
        </div>
        
        <div class="content">
            <h1 class="title">🔑 Seu link de acesso</h1>
            <p class="message">
                Clique no botão abaixo para fazer login instantaneamente na sua conta Partimap. Sem necessidade de senha!
            </p>
            
            <div class="button-container">
                <a href="{{ .ConfirmationURL }}" class="magic-button">
                    ✨ Acessar Partimap
                </a>
            </div>
            
            <div class="security-info">
                <div class="security-title">🔒 Informações de Segurança</div>
                <div class="security-text">
                    • Este link funciona apenas uma vez<br>
                    • Expira em 5 minutos por segurança<br>
                    • Se você não solicitou este acesso, ignore este email
                </div>
            </div>
            
            <p class="message" style="font-size: 14px; margin-top: 20px;">
                Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                <span style="word-break: break-all; color: #ea580c;">{{ .ConfirmationURL }}</span>
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                Este link foi gerado para o email: {{ .Email }}<br>
                Precisa de ajuda? <a href="mailto:suporte@partimap.com" class="footer-link">suporte@partimap.com</a>
            </p>
        </div>
    </div>
</body>
</html>
```

---

## 📩 CONVITE PARA SISTEMA (Invite Email) - CUSTOM

### **Uso:**
Este template é usado para enviar convites de usuários através do sistema de convites implementado no Marco 2 Day 7.

### **Configurações:**
- **Subject:** `Você foi convidado para o Partimap! 🎉`
- **Trigger:** Função `create_invite()` do sistema
- **Integration:** Usar com serviço de email externo (SendGrid/Resend)

### **Template HTML:**
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Convite para Partimap - {{company_name}}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            color: #ffffff;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .header-subtitle {
            color: #e0e7ff;
            font-size: 16px;
        }
        
        .invite-badge {
            background-color: rgba(255, 255, 255, 0.2);
            color: #ffffff;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 15px;
            display: inline-block;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .title {
            font-size: 24px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 16px;
            text-align: center;
        }
        
        .message {
            font-size: 16px;
            color: #64748b;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .invite-info {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border: 1px solid #e2e8f0;
            padding: 25px;
            border-radius: 12px;
            margin: 25px 0;
        }
        
        .invite-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            font-size: 14px;
        }
        
        .invite-label {
            color: #64748b;
            font-weight: 500;
        }
        
        .invite-value {
            color: #1e293b;
            font-weight: 600;
        }
        
        .company-badge {
            background-color: #6366f1;
            color: white;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .role-badge {
            background-color: #059669;
            color: white;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        
        .invite-button {
            display: inline-block;
            padding: 16px 32px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(99, 102, 241, 0.25);
        }
        
        .invite-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(99, 102, 241, 0.35);
        }
        
        .features {
            background-color: #f8fafc;
            padding: 25px;
            border-radius: 8px;
            margin: 30px 0;
        }
        
        .features-title {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 16px;
            text-align: center;
        }
        
        .feature-item {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            font-size: 14px;
            color: #475569;
        }
        
        .feature-icon {
            margin-right: 10px;
            font-size: 16px;
        }
        
        .expiry-info {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 30px 0;
            border-radius: 4px;
        }
        
        .expiry-title {
            font-weight: 600;
            color: #92400e;
            margin-bottom: 8px;
        }
        
        .expiry-text {
            color: #92400e;
            font-size: 14px;
        }
        
        .personal-message {
            background-color: #f0f9ff;
            border-left: 4px solid #0ea5e9;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        
        .personal-title {
            font-weight: 600;
            color: #0c4a6e;
            margin-bottom: 8px;
        }
        
        .personal-text {
            color: #0c4a6e;
            font-style: italic;
        }
        
        .footer {
            background-color: #f1f5f9;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-text {
            color: #64748b;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .footer-link {
            color: #6366f1;
            text-decoration: none;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            
            .header, .content, .footer {
                padding: 20px;
            }
            
            .title {
                font-size: 20px;
            }
            
            .invite-row {
                flex-direction: column;
                align-items: flex-start;
                gap: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🗺️ Partimap</div>
            <div class="header-subtitle">Mapeamento Participativo Inteligente</div>
            <div class="invite-badge">🎉 Você foi convidado!</div>
        </div>
        
        <div class="content">
            <h1 class="title">Bem-vindo ao Partimap!</h1>
            <p class="message">
                <strong>{{invited_by_name}}</strong> convidou você para se juntar à plataforma Partimap e fazer parte da equipe <strong>{{company_name}}</strong>.
            </p>
            
            <div class="invite-info">
                <div class="invite-row">
                    <span class="invite-label">🏢 Empresa:</span>
                    <span class="company-badge">{{company_name}}</span>
                </div>
                <div class="invite-row">
                    <span class="invite-label">👤 Função:</span>
                    <span class="role-badge">{{role_name}}</span>
                </div>
                <div class="invite-row">
                    <span class="invite-label">📧 Email:</span>
                    <span class="invite-value">{{invite_email}}</span>
                </div>
                <div class="invite-row">
                    <span class="invite-label">🗓️ Convidado em:</span>
                    <span class="invite-value">{{invite_date}}</span>
                </div>
            </div>
            
            {{#if invite_message}}
            <div class="personal-message">
                <div class="personal-title">💬 Mensagem pessoal:</div>
                <div class="personal-text">"{{invite_message}}"</div>
            </div>
            {{/if}}
            
            <div class="button-container">
                <a href="{{invite_url}}" class="invite-button">
                    🚀 Aceitar Convite
                </a>
            </div>
            
            <div class="features">
                <div class="features-title">🌟 O que você pode fazer no Partimap:</div>
                <div class="feature-item">
                    <span class="feature-icon">🗺️</span>
                    Criar mapas participativos interativos
                </div>
                <div class="feature-item">
                    <span class="feature-icon">👥</span>
                    Colaborar com sua equipe em tempo real
                </div>
                <div class="feature-item">
                    <span class="feature-icon">📊</span>
                    Analisar dados e gerar relatórios
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🎯</span>
                    Gerenciar projetos e clientes
                </div>
            </div>
            
            <div class="expiry-info">
                <div class="expiry-title">⏰ Importante</div>
                <div class="expiry-text">
                    • Este convite expira em 7 dias ({{expiry_date}})<br>
                    • Você precisa aceitar o convite para acessar a plataforma<br>
                    • Se já tem conta, será adicionado automaticamente à empresa
                </div>
            </div>
            
            <p class="message" style="font-size: 14px; margin-top: 20px;">
                Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                <span style="word-break: break-all; color: #6366f1;">{{invite_url}}</span>
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                Este convite foi enviado por <strong>{{invited_by_name}}</strong> ({{invited_by_email}}) para se juntar à <strong>{{company_name}}</strong>.<br><br>
                Precisa de ajuda? Entre em contato: <a href="mailto:suporte@partimap.com" class="footer-link">suporte@partimap.com</a><br>
                Ou acesse nossa documentação: <a href="https://docs.partimap.com" class="footer-link">docs.partimap.com</a>
            </p>
        </div>
    </div>
</body>
</html>
```

### **Variáveis do Template de Convite:**
```javascript
// Variáveis que devem ser substituídas ao enviar o email:
{
  "company_name": "Nome da Empresa",
  "role_name": "Administrator | Consultor | Usuário",
  "invite_email": "email@convidado.com",
  "invite_date": "15 de Setembro, 2024",
  "invite_message": "Mensagem personalizada (opcional)",
  "invite_url": "https://app.partimap.com/accept-invite?token=abc123",
  "invited_by_name": "João Silva",
  "invited_by_email": "joao@empresa.com",
  "expiry_date": "22 de Setembro, 2024"
}
```

### **Integração com Sistema de Convites:**
```javascript
// Exemplo de uso no InviteSystem.jsx
const sendInviteEmail = async (inviteData) => {
  const emailTemplate = {
    to: inviteData.email,
    subject: `Você foi convidado para o Partimap! 🎉`,
    html: renderTemplate('invite', {
      company_name: inviteData.company.name,
      role_name: getRoleDisplayName(inviteData.role),
      invite_email: inviteData.email,
      invite_date: formatDate(new Date()),
      invite_message: inviteData.message,
      invite_url: `${window.location.origin}/accept-invite?token=${inviteData.token}`,
      invited_by_name: inviteData.invitedBy.full_name,
      invited_by_email: inviteData.invitedBy.email,
      expiry_date: formatDate(inviteData.expires_at)
    })
  }
  
  // Enviar via serviço de email (SendGrid, Resend, etc.)
  await sendEmail(emailTemplate)
}
```

### **Roles Display Names:**
```javascript
const getRoleDisplayName = (role) => {
  const roles = {
    'super_admin': 'Super Administrador',
    'consultant': 'Consultor',
    'company_admin': 'Administrador da Empresa',
    'user': 'Usuário'
  }
  return roles[role] || 'Usuário'
}
```

---

## 5. 📧 CONFIGURAÇÕES GERAIS NO SUPABASE

### **Settings Recomendadas:**

#### **Email Rate Limits:**
- Rate limit: 30 emails por hora por IP
- Rate limit per email: 6 emails por hora

#### **SMTP Configuration (Produção):**
```
Host: smtp.gmail.com (ou seu provedor)
Port: 587
Username: noreply@partimap.com
Password: [App Password]
Sender Name: Partimap
Sender Email: noreply@partimap.com
```

#### **Site URL Configuration:**
```
Site URL: https://app.partimap.com (sua URL de produção)
Additional redirect URLs:
- http://localhost:5174 (desenvolvimento)
- https://app.partimap.com/reset-password
- https://app.partimap.com/login
```

---

## 6. 🧪 TESTE DOS TEMPLATES

### **Como testar cada template:**

#### **1. Password Recovery:**
```javascript
// No console do navegador ou componente React
await supabase.auth.resetPasswordForEmail('seu@email.com')
```

#### **2. Email Confirmation:**
```javascript
// Ao fazer signup
await supabase.auth.signUp({
  email: 'teste@email.com',
  password: 'password123'
})
```

#### **3. Email Change:**
```javascript
// Quando logado
await supabase.auth.updateUser({
  email: 'novoemail@email.com'
})
```

#### **4. Magic Link:**
```javascript
// Login sem senha
await supabase.auth.signInWithOtp({
  email: 'user@email.com'
})
```

#### **5. Invite Email (Custom):**
```javascript
// Não é template nativo do Supabase
// Deve ser integrado com serviço de email externo
// Usar após criar convite com create_invite()

const inviteData = {
  email: 'user@example.com',
  company_name: 'Empresa XYZ',
  role: 'user',
  token: 'generated_token'
}

await sendInviteEmail(inviteData)
```

---

## 📝 VARIÁVEIS DISPONÍVEIS

### **Variáveis do Supabase que você pode usar nos templates:**

```
{{ .Email }}          - Email do usuário
{{ .NewEmail }}       - Novo email (para mudança)
{{ .ConfirmationURL }} - URL de confirmação
{{ .SiteURL }}        - URL base do site
{{ .Token }}          - Token de verificação
```

---

## 🎯 PRÓXIMOS PASSOS

### **Após configurar os templates:**

1. **✅ Testar cada template individualmente**
2. **✅ Configurar SMTP personalizado para produção**  
3. **✅ Ajustar rate limits conforme necessário**
4. **✅ Personalizar URLs de redirect**
5. **✅ Validar responsividade dos emails**

---

---

## 🔗 INTEGRAÇÃO COM SISTEMA DE CONVITES

### **Serviços de Email Recomendados:**

#### **1. Resend (Recomendado)**
```javascript
import { Resend } from 'resend'

const resend = new Resend('re_xxxxxxxxxxxx')

const sendInviteEmail = async (inviteData) => {
  const { data, error } = await resend.emails.send({
    from: 'Partimap <convites@partimap.com>',
    to: [inviteData.email],
    subject: 'Você foi convidado para o Partimap! 🎉',
    html: renderInviteTemplate(inviteData),
  })
  
  if (error) {
    throw new Error(`Erro ao enviar convite: ${error.message}`)
  }
  
  return data
}
```

#### **2. SendGrid**
```javascript
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendInviteEmail = async (inviteData) => {
  const msg = {
    to: inviteData.email,
    from: 'convites@partimap.com',
    subject: 'Você foi convidado para o Partimap! 🎉',
    html: renderInviteTemplate(inviteData),
  }
  
  await sgMail.send(msg)
}
```

### **Implementação no Sistema:**

#### **1. Modificar função create_invite no Supabase:**
```sql
-- Adicionar na função create_invite após inserir convite
-- Chamar função de envio de email via webhook ou API

CREATE OR REPLACE FUNCTION create_invite(
    p_email TEXT,
    p_company_id UUID,
    p_role TEXT,
    p_message TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    invite_id UUID;
    invite_token TEXT;
    result JSON;
BEGIN
    -- ... código existente ...
    
    -- Após inserir convite com sucesso
    INSERT INTO public.invites (...) 
    VALUES (...) 
    RETURNING id INTO invite_id;
    
    -- Trigger para envio de email (via webhook)
    PERFORM pg_notify('invite_created', json_build_object(
        'invite_id', invite_id,
        'email', p_email,
        'company_id', p_company_id,
        'role', p_role,
        'token', invite_token,
        'message', p_message
    )::text);
    
    -- Retornar resultado
    RETURN json_build_object(
        'success', true,
        'invite_id', invite_id,
        'token', invite_token
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### **2. Webhook Handler (Next.js API Route):**
```javascript
// pages/api/webhooks/invite-created.js
import { sendInviteEmail } from '../../../lib/email'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { invite_id, email, company_id, role, token, message } = req.body
    
    // Buscar dados adicionais necessários
    const company = await getCompany(company_id)
    const invitedBy = await getInvitedByUser(req.user.id)
    
    // Preparar dados do email
    const emailData = {
      email,
      company_name: company.name,
      role_name: getRoleDisplayName(role),
      invite_message: message,
      invite_url: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${token}`,
      invited_by_name: invitedBy.full_name,
      invited_by_email: invitedBy.email,
      invite_date: new Date().toLocaleDateString('pt-BR'),
      expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
    }
    
    // Enviar email
    await sendInviteEmail(emailData)
    
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Erro ao enviar convite:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
```

#### **3. Template Renderer:**
```javascript
// lib/email-templates.js
export const renderInviteTemplate = (data) => {
  // Template HTML do convite (usar o template HTML acima)
  let template = `<!-- Template HTML completo -->`
  
  // Substituir variáveis
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    template = template.replace(regex, data[key] || '')
  })
  
  // Tratar condicionais (como {{#if invite_message}})
  template = template.replace(/{{#if invite_message}}([\s\S]*?){{\/if}}/g, 
    data.invite_message ? '$1' : '')
  
  return template
}
```

#### **4. Integração no Frontend:**
```javascript
// InviteSystem.jsx - Modificar função sendInvite
const sendInvite = async (formData) => {
  try {
    // Criar convite no banco (isso já trigga o webhook)
    const { data, error } = await supabase.rpc('create_invite', {
      p_email: formData.email,
      p_company_id: formData.companyId,
      p_role: formData.role,
      p_message: formData.message
    })
    
    if (error) throw error
    
    // Email será enviado automaticamente via webhook
    toast.success('Convite enviado com sucesso!')
    
    // Recarregar lista
    await loadInvites()
  } catch (error) {
    toast.error('Erro ao enviar convite: ' + error.message)
  }
}
```

---

## 📞 SUPORTE

**Se precisar de ajuda:**
- Documentação: https://supabase.com/docs/guides/auth/auth-email-templates  
- Testes: Use o Auth Debug no dashboard do Supabase

---

**🎉 Com esses templates, você terá um sistema de email profissional completo para o Partimap!**
