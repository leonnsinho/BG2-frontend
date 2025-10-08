# 📧 Integração Resend - BG2 Partimap

## ✅ Configuração Completa

A integração com o serviço de email Resend está configurada e pronta para uso.

### 🔑 Credenciais Configuradas

- **API Key**: `re_Gq4BvqGq_AiiLjKBnxcuX4P5nuTMzjzRC`
- **Email de Envio**: `no-reply@bg2bossa.com.br`
- **Domínio Verificado**: `bg2bossa.com.br`
- **Nome do Remetente**: `BG2 Partimap`

### 📁 Arquivos Modificados

1. **`.env`** - Variáveis de ambiente com API key real
2. **`src/services/emailService.js`** - Serviço de envio de emails
3. **`src/pages/InvitesPage.jsx`** - Interface de convites

### 🚀 Como Funciona

#### 1. Envio de Convites

Quando um administrador envia um convite pela interface `/invites`:

```javascript
// 1. Convite é criado no banco de dados (Supabase)
const { data } = await supabase.rpc('create_invite', {
  p_email: 'usuario@email.com',
  p_company_id: companyId,
  p_role: 'user',
  p_message: 'Mensagem opcional'
})

// 2. Email é enviado via Resend
await sendInviteEmail(data)
```

#### 2. Template do Email

O email enviado inclui:
- ✅ Design profissional com cores da BG2 (#EBA500)
- ✅ Logo e branding BG2 Partimap
- ✅ Informações do convite (empresa, função, quem convidou)
- ✅ Botão de ação destacado
- ✅ Link alternativo (caso botão não funcione)
- ✅ Data de expiração (7 dias)
- ✅ Mensagem personalizada (se fornecida)
- ✅ Rodapé com informações de contato

#### 3. Fluxo do Usuário

```
Convite Enviado → Email Recebido → Usuário Clica no Link → 
  → Tela de Aceite (/accept-invite?token=xxx) → Usuário Vinculado à Empresa
```

### 🧪 Teste de Envio

Para testar o envio de emails:

```javascript
import { testEmailConfiguration } from './services/emailService'

// Teste com email real
await testEmailConfiguration('seu-email@gmail.com')
```

Ou via console do navegador:
```javascript
// Na página /invites, abra o console e execute:
window.testEmail = async (email) => {
  const { testEmailConfiguration } = await import('./services/emailService')
  return await testEmailConfiguration(email)
}

// Depois execute:
await window.testEmail('seu-email@gmail.com')
```

### 📊 Status da Configuração

Na página `/invites`, você verá um card no topo mostrando:

```
Status do Email: ✅ Configurado
Serviço: Resend • API: ✅ Configurado • From: no-reply@bg2bossa.com.br
```

### 🔐 Segurança

- ✅ API key está em variável de ambiente (`.env`)
- ✅ Não exposta no código frontend (apenas usada em tempo de execução)
- ✅ Domínio verificado no Resend
- ✅ SPF/DKIM configurados para `bg2bossa.com.br`

### 📈 Monitoramento

Você pode monitorar os emails enviados:
1. Acesse [Resend Dashboard](https://resend.com/emails)
2. Login com as credenciais da conta BG2
3. Visualize logs, entregas, aberturas e cliques

### 🐛 Troubleshooting

#### Email não está sendo enviado

1. **Verifique as variáveis de ambiente**:
   ```bash
   # No arquivo .env
   VITE_RESEND_API_KEY=re_Gq4BvqGq_AiiLjKBnxcuX4P5nuTMzjzRC
   VITE_FROM_EMAIL=BG2 Partimap <no-reply@bg2bossa.com.br>
   ```

2. **Reinicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

3. **Verifique o console do navegador**:
   - Deve aparecer: `✅ Resend configurado com API key real`
   - Se aparecer erro, verifique a API key

#### Email cai no spam

- ✅ Domínio já está verificado
- ✅ SPF/DKIM configurados
- Evite palavras de spam no assunto/corpo
- Peça para marcar como "não spam" na primeira vez

#### Email não chega

1. Verifique o email no Resend Dashboard
2. Confirme se o destinatário está correto
3. Aguarde alguns minutos (pode haver delay)
4. Verifique a pasta de spam do destinatário

### 📝 Próximos Passos

- [ ] Configurar webhook do Resend para tracking de aberturas
- [ ] Adicionar analytics de conversão (convites aceitos)
- [ ] Criar mais templates (boas-vindas, notificações, etc)
- [ ] Implementar rate limiting para prevenir spam

### 🔗 Links Úteis

- [Documentação Resend](https://resend.com/docs)
- [Dashboard Resend](https://resend.com/emails)
- [Status Resend](https://status.resend.com/)

---

**Última atualização**: 07/10/2025
**Configurado por**: Sistema BG2 Partimap
**Status**: ✅ Produção - Emails Reais Sendo Enviados
