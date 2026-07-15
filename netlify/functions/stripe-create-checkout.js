// Netlify Function: cria uma Stripe Checkout Session
// Chamada via: POST /.netlify/functions/stripe-create-checkout
// Body JSON: { priceId, companyId, userId, origin }

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  if (!STRIPE_SECRET_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Stripe não configurado' }) }
  }

  let priceId, companyId, userId, origin
  try {
    const body = JSON.parse(event.body || '{}')
    priceId = body.priceId
    companyId = body.companyId
    userId = body.userId
    origin = body.origin
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body inválido' }) }
  }

  if (!priceId || !companyId || !userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'priceId, companyId e userId são obrigatórios' }) }
  }

  const baseUrl = origin || 'https://bg2plan.com.br'

  try {
    const params = new URLSearchParams({
      'payment_method_types[0]': 'card',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      mode: 'subscription',
      'success_url': `${baseUrl}/dashboard?payment=success`,
      'cancel_url': `${baseUrl}/planos?payment=cancelled`,
      'metadata[company_id]': companyId,
      'metadata[user_id]': userId,
      'subscription_data[metadata][company_id]': companyId,
      allow_promotion_codes: 'true',
    })

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Stripe error:', data)
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || 'Erro ao criar sessão' }),
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: data.url, sessionId: data.id }),
    }
  } catch (err) {
    console.error('Erro inesperado:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno' }) }
  }
}
