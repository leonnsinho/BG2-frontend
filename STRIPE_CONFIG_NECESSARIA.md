# Dados necessários do Stripe

## 1. Chaves da conta

| Item | Onde encontrar | Formato |
|---|---|---|
| Publishable Key | Dashboard → Developers → API Keys | `pk_live_...` |
| Secret Key | Dashboard → Developers → API Keys | `sk_live_...` |
| Webhook Secret | Dashboard → Developers → Webhooks → (criar webhook) | `whsec_...` |

> Para criar o webhook: Developers → Webhooks → Add endpoint
> URL do endpoint: `https://bg2-mvp.netlify.app/.netlify/functions/stripe-webhook`
> Eventos a escutar:
> - `checkout.session.completed`
> - `customer.subscription.updated`
> - `customer.subscription.deleted`
> - `invoice.payment_failed`

---

## 2. Price IDs

Cada preço tem um ID no formato `price_XXXXXXXXXXXXXXXXXX`.
Encontrar em: Dashboard → Products → (clique no produto) → (clique no preço)

| Plano | Modalidade | Price ID |
|---|---|---|
| Individual | Mensal R$ 99 | price_... |
| Profissional | Mensal R$ 790 | price_... |
| Profissional | Anual R$ 7.900 | price_... |
| Premium | Mensal R$ 1.390 | price_... |
| Premium | Anual R$ 13.900 | price_... |

---

## 3. Decisões rápidas (responder sim/não)

- [x] Usar **Stripe Customer Portal** — sim, implementar acesso pela plataforma depois
- [x] Ambiente de **teste** agora, produção depois — sim, usar chaves `pk_test_` / `sk_test_`
- [ ] Redirecionamentos pós-pagamento — a definir depois
