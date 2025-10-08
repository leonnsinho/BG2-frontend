# 📧 Guia Rápido - Sistema de Convites com Resend

## ✅ Integração Completa e Funcional

O sistema de convites agora envia **emails reais** usando o serviço Resend.

---

## 🚀 Como Usar

### 1️⃣ Acessar a Tela de Convites

Navegue para: **`/invites`**

### 2️⃣ Verificar Status do Email

No topo da página, você verá um card azul:

```
✅ Email Configurado
Resend • no-reply@bg2bossa.com.br • Domínio: bg2bossa.com.br
[Botão: Testar Email]
```

### 3️⃣ Testar o Sistema (Recomendado)

Antes de enviar convites reais:

1. Clique no botão **"Testar Email"**
2. Digite seu email pessoal
3. Clique em **"Enviar Teste"**
4. Aguarde alguns segundos
5. Verifique sua caixa de entrada (e spam)

✅ **Email de teste recebido?** Sistema funcionando!
❌ **Não recebeu?** Verifique o console do navegador para erros.

### 4️⃣ Enviar Convites Reais

1. **Preencha o formulário**:
   - Email do usuário
   - Empresa (dropdown)
   - Perfil (user, company_admin, etc)
   - Mensagem (opcional)

2. **Clique em "Enviar Convite"**

3. **Aguarde as confirmações**:
   ```
   ✅ Convite enviado para usuario@email.com!
   ✅ Email enviado com sucesso!
   ```

4. **O destinatário receberá**:
   - Email profissional com layout BG2
   - Botão para aceitar o convite
   - Link alternativo (caso botão não funcione)
   - Informações da empresa e função
   - Data de expiração (7 dias)

---

## 📊 Monitoramento

### Na Interface

A página mostra estatísticas em tempo real:
- **Total** de convites
- **Pendentes** (aguardando aceite)
- **Aceitos** (já vinculados)
- **Expirados** (mais de 7 dias)

### Dashboard Resend

Acesse [resend.com/emails](https://resend.com/emails) para ver:
- Emails enviados
- Taxa de entrega
- Aberturas e cliques
- Erros e bounces

---

## 🎨 Personalização do Email

O template atual inclui:
- ✅ Cores da marca BG2 (#EBA500)
- ✅ Logo e branding
- ✅ Design responsivo (desktop + mobile)
- ✅ Informações completas do convite
- ✅ Mensagem personalizada (opcional)
- ✅ Rodapé com contato de suporte

---

## 🐛 Problemas Comuns

### Email não chegou

1. **Verifique spam/lixo eletrônico**
2. **Aguarde 2-3 minutos** (pode haver delay)
3. **Confirme o email digitado** está correto
4. **Console do navegador** (F12) mostra erros?

### Email caiu no spam

✅ **Normal na primeira vez!**
- Domínio já está verificado
- SPF/DKIM configurados
- Peça para o destinatário marcar como "não spam"

### Botão "Testar Email" não aparece

- Recarregue a página (Ctrl+R ou Cmd+R)
- Verifique se as variáveis de ambiente estão corretas
- Veja o console para erros de configuração

---

## 📝 Variáveis de Ambiente

Arquivo: `.env`

```env
# Resend Email Service
VITE_RESEND_API_KEY=re_Gq4BvqGq_AiiLjKBnxcuX4P5nuTMzjzRC
VITE_FROM_EMAIL=BG2 Partimap <no-reply@bg2bossa.com.br>
```

⚠️ **Importante**: Após alterar o `.env`, reinicie o servidor:
```bash
npm run dev
```

---

## 🎯 Fluxo Completo

```
1. Admin clica "Enviar Convite" → 
2. Sistema cria convite no banco → 
3. Email é enviado via Resend → 
4. Usuário recebe email → 
5. Usuário clica no link → 
6. Página de aceite (/accept-invite?token=xxx) → 
7. Usuário aceita → 
8. Sistema vincula à empresa → 
9. Status muda para "Aceito" ✅
```

---

## 📞 Suporte

**Dúvidas sobre o sistema?**
- Verifique: `RESEND_INTEGRATION.md`
- Console do navegador (F12)
- Logs do Resend Dashboard

**Email não funciona?**
1. Teste com seu próprio email primeiro
2. Verifique variáveis de ambiente
3. Reinicie o servidor de desenvolvimento

---

## ✨ Melhorias Futuras

- [ ] Template de boas-vindas após aceite
- [ ] Notificações de tarefas por email
- [ ] Relatórios mensais automáticos
- [ ] Webhook para tracking de aberturas
- [ ] Dashboard de analytics de convites

---

**Última atualização**: 07/10/2025
**Status**: ✅ Produção - Sistema Completo e Funcional
