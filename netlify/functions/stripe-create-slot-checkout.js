// Netlify Function: cria Stripe Checkout Session para compra de slots de usuário
// POST /.netlify/functions/stripe-create-slot-checkout
// Body: { companyId: string, quantity: number, userId: string, origin: string }

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ecmgbinyotuxhiniadom.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Price ID do produto "Slot adicional de usuário" (recorrente, usado para obter product_id)
const EXTRA_SLOT_PRICE_ID = process.env.EXTRA_SLOT_PRICE_ID || 'price_1TWJRsFUmTFSWkItAVIMKFkb'

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  if (!STRIPE_SECRET_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Variáveis de ambiente ausentes')
    return { statusCode: 500, body: JSON.stringify({ error: 'Configuração incompleta' }) }
  }

  let companyId, quantity, userId, origin
  try {
    const body = JSON.parse(event.body || '{}')
    companyId = body.companyId
    quantity = parseInt(body.quantity, 10)
    userId = body.userId
    origin = body.origin
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body inválido' }) }
  }

  if (!companyId || !quantity || quantity < 1 || !userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'companyId, userId e quantity (≥1) são obrigatórios' }) }
  }

  // Usar origin do frontend para construir URLs de retorno
  const baseUrl = origin || 'https://bg2-mvp.netlify.app'

  try {
    // 1. Buscar dados da empresa (plano + status)
    const companyRes = await fetch(
      `${SUPABASE_URL}/rest/v1/companies?id=eq.${encodeURIComponent(companyId)}&select=name,subscription_plan,subscription_status`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    )
    if (!companyRes.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao buscar empresa' }) }
    }
    const companies = await companyRes.json()
    const company = companies?.[0]
    if (!company) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Empresa não encontrada' }) }
    }
    if (company.subscription_plan !== 'premium') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Slots adicionais disponíveis apenas para o plano Premium' }) }
    }

    // 2. Obter produto e unit_amount do preço existente, e criar um preço one-time
    const priceRes = await fetch(
      `https://api.stripe.com/v1/prices/${EXTRA_SLOT_PRICE_ID}`,
      { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } }
    )
    const priceData = await priceRes.json()
    if (!priceRes.ok) {
      console.error('Erro ao buscar preço:', priceData)
      return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao buscar preço do Stripe' }) }
    }
    const unitAmount = priceData.unit_amount || 4990
    const productId = priceData.product
    const currency = priceData.currency || 'brl'

    // Criar um preço one-time para o mesmo produto (evita erro "recurring price in payment mode")
    const oneTimePriceRes = await fetch('https://api.stripe.com/v1/prices', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        product: productId,
        unit_amount: String(unitAmount),
        currency: currency,
      }).toString(),
    })
    const oneTimePrice = await oneTimePriceRes.json()
    if (!oneTimePriceRes.ok) {
      console.error('Erro ao criar preço one-time:', oneTimePrice)
      return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao configurar preço' }) }
    }
    const oneTimePriceId = oneTimePrice.id

    // 3. Criar registro pending em user_slot_purchases
    const slotPurchaseRes = await fetch(
      `${SUPABASE_URL}/rest/v1/user_slot_purchases`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          company_id: companyId,
          quantity: quantity,
          unit_price_cents: unitAmount,
          status: 'pending',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      }
    )
    const slotPurchases = await slotPurchaseRes.json()
    const purchaseId = slotPurchases?.[0]?.id
    if (!purchaseId) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao criar registro de compra' }) }
    }

    // 4. Criar Checkout Session no Stripe (modo payment, preço one-time)
    const successUrl = `${baseUrl}/settings?tab=plano&slots=success&purchase=${purchaseId}`
    const cancelUrl = `${baseUrl}/settings?tab=plano&slots=cancelled`

    const params = new URLSearchParams({
      'payment_method_types[0]': 'card',
      'line_items[0][price]': oneTimePriceId,
      'line_items[0][quantity]': String(quantity),
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      'metadata[company_id]': companyId,
      'metadata[user_id]': userId,
      'metadata[purchase_id]': purchaseId,
      'metadata[quantity]': String(quantity),
    })

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const session = await stripeRes.json()
    if (!stripeRes.ok) {
      console.error('Stripe error:', session)
      // Limpar registro pending
      await fetch(`${SUPABASE_URL}/rest/v1/user_slot_purchases?id=eq.${purchaseId}`, {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      })
      return {
        statusCode: stripeRes.status,
        body: JSON.stringify({ error: session.error?.message || 'Erro ao criar sessão Stripe' }),
      }
    }

    // 5. Atualizar registro com session ID
    await fetch(`${SUPABASE_URL}/rest/v1/user_slot_purchases?id=eq.${purchaseId}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stripe_session_id: session.id,
      }),
    })

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: session.url,
        sessionId: session.id,
        purchaseId: purchaseId,
      }),
    }
  } catch (err) {
    console.error('Erro inesperado:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno' }) }
  }
}
