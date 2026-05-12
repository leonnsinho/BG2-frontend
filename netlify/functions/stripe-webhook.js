// Netlify Function: recebe eventos do Stripe via webhook
// Chamada via: POST /.netlify/functions/stripe-webhook
// Configurar no Stripe: Developers → Webhooks → Add endpoint
// URL: https://bg2-mvp.netlify.app/.netlify/functions/stripe-webhook

const crypto = require('crypto')

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ecmgbinyotuxhiniadom.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Price ID do add-on de slot adicional de usuário
const EXTRA_SLOT_PRICE_ID = 'price_1TWJRsFUmTFSWkItAVIMKFkb'

// Mapeamento Price ID → subscription_plan da tabela companies
const PRICE_TO_PLAN = {
  'price_1TReTdFUmTFSWkItrIiOcTop': 'individual',   // Individual mensal
  'price_1TReTrFUmTFSWkIttUUvGSHw': 'profissional', // Profissional mensal
  'price_1TReVGFUmTFSWkItKrsCp0eO': 'profissional', // Profissional anual
  'price_1TReU1FUmTFSWkItEZcxgY4B': 'premium',      // Premium mensal
  'price_1TReUxFUmTFSWkItssYPU7sq': 'premium',      // Premium anual
}

// Verifica a assinatura do webhook Stripe (HMAC-SHA256)
function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) return false

  const parts = signatureHeader.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=')
    if (key === 't') acc.timestamp = value
    if (key === 'v1') acc.signatures.push(value)
    return acc
  }, { timestamp: null, signatures: [] })

  if (!parts.timestamp || parts.signatures.length === 0) return false

  // Verificar que o timestamp não é muito antigo (tolerância de 5 minutos)
  const tolerance = 300
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parseInt(parts.timestamp, 10)) > tolerance) return false

  const payload = `${parts.timestamp}.${rawBody}`
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex')

  return parts.signatures.some(sig =>
    crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sig, 'hex'))
  )
}

// Atualiza a empresa no Supabase via REST API
async function updateCompany(companyId, updates) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?id=eq.${companyId}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(updates),
    }
  )
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Supabase update falhou: ${response.status} ${text}`)
  }
}

// Busca empresa pelo stripe_customer_id
async function findCompanyByCustomerId(customerId) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?stripe_customer_id=eq.${customerId}&select=id`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  )
  if (!response.ok) return null
  const rows = await response.json()
  return rows?.[0]?.id || null
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  if (!STRIPE_WEBHOOK_SECRET || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Variáveis de ambiente ausentes: STRIPE_WEBHOOK_SECRET ou SUPABASE_SERVICE_ROLE_KEY')
    return { statusCode: 500, body: 'Configuração incompleta' }
  }

  const rawBody = event.body
  const signature = event.headers['stripe-signature']

  if (!verifyStripeSignature(rawBody, signature, STRIPE_WEBHOOK_SECRET)) {
    console.error('Assinatura Stripe inválida')
    return { statusCode: 400, body: 'Assinatura inválida' }
  }

  let stripeEvent
  try {
    stripeEvent = JSON.parse(rawBody)
  } catch {
    return { statusCode: 400, body: 'JSON inválido' }
  }

  const { type, data } = stripeEvent
  const obj = data.object
  console.log(`Evento Stripe recebido: ${type}`)

  try {
    switch (type) {
      case 'checkout.session.completed': {
        // Pagamento confirmado — ativar assinatura
        const companyId = obj.metadata?.company_id
        if (!companyId) {
          console.error('company_id não encontrado nos metadados da session')
          break
        }

        // Determinar plano pelo item da assinatura
        let plan = 'basic'
        let renewalDate = null
        if (obj.subscription) {
          // Buscar detalhes da subscription para obter o price_id e current_period_end
          const subResponse = await fetch(
            `https://api.stripe.com/v1/subscriptions/${obj.subscription}`,
            { headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` } }
          )
          if (subResponse.ok) {
            const sub = await subResponse.json()
            const priceId = sub.items?.data?.[0]?.price?.id
            plan = PRICE_TO_PLAN[priceId] || 'individual'
            renewalDate = sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null
            console.log(`Subscription ${obj.subscription}: priceId=${priceId}, plan=${plan}, renewalDate=${renewalDate}`)
          } else {
            const errText = await subResponse.text()
            console.error(`Stripe API error ao buscar subscription ${obj.subscription}: ${subResponse.status} ${errText}`)
          }
        } else {
          console.warn('checkout.session.completed sem obj.subscription')
        }

        await updateCompany(companyId, {
          stripe_customer_id: obj.customer,
          stripe_subscription_id: obj.subscription,
          subscription_plan: plan,
          subscription_status: 'active',
          ...(renewalDate ? { subscription_renewal_date: renewalDate, subscription_ends_at: renewalDate } : {}),
        })
        console.log(`Empresa ${companyId} ativada com plano ${plan}`)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        // Assinatura atualizada (mudança de plano, renovação, slots extras, etc.)
        const customerId = obj.customer
        const companyId = await findCompanyByCustomerId(customerId)
        if (!companyId) {
          console.error(`Empresa não encontrada para customer ${customerId}`)
          break
        }

        // Determinar plano pelo primeiro item que não seja slot extra
        const planItem = obj.items?.data?.find(item => item.price?.id !== EXTRA_SLOT_PRICE_ID)
        const priceId = planItem?.price?.id
        const plan = PRICE_TO_PLAN[priceId] || 'individual'
        const status = obj.status === 'active' ? 'active' : 'inactive'
        const renewalDate = obj.current_period_end
          ? new Date(obj.current_period_end * 1000).toISOString()
          : null

        // Sincronizar extra_user_slots a partir do item de slot extra
        const slotItem = obj.items?.data?.find(item => item.price?.id === EXTRA_SLOT_PRICE_ID)
        const extraUserSlots = slotItem ? (slotItem.quantity || 0) : 0

        await updateCompany(companyId, {
          subscription_plan: plan,
          subscription_status: status,
          stripe_subscription_id: obj.id,
          extra_user_slots: extraUserSlots,
          ...(renewalDate ? { subscription_renewal_date: renewalDate, subscription_ends_at: renewalDate } : {}),
        })
        console.log(`Empresa ${companyId} atualizada: plano=${plan}, status=${status}, extra_user_slots=${extraUserSlots}`)
        break
      }

      case 'customer.subscription.deleted': {
        // Assinatura cancelada
        const customerId = obj.customer
        const companyId = await findCompanyByCustomerId(customerId)
        if (!companyId) {
          console.error(`Empresa não encontrada para customer ${customerId}`)
          break
        }

        await updateCompany(companyId, {
          subscription_plan: 'individual',
          subscription_status: 'inactive',
          stripe_subscription_id: null,
        })
        console.log(`Empresa ${companyId} cancelada — revertida para basic/inactive`)
        break
      }

      case 'invoice.payment_failed': {
        // Pagamento falhou
        const customerId = obj.customer
        const companyId = await findCompanyByCustomerId(customerId)
        if (!companyId) break

        await updateCompany(companyId, {
          subscription_status: 'suspended',
        })
        console.log(`Empresa ${companyId} suspensa por falha no pagamento`)
        break
      }

      default:
        console.log(`Evento não tratado: ${type}`)
    }
  } catch (err) {
    console.error(`Erro ao processar evento ${type}:`, err)
    return { statusCode: 500, body: 'Erro interno' }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) }
}
