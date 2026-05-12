// Netlify Function: retorna o preço unitário do slot adicional de usuário
// GET /.netlify/functions/stripe-slot-price

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const EXTRA_SLOT_PRICE_ID = 'price_1TWJRsFUmTFSWkItAVIMKFkb'

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  if (!STRIPE_SECRET_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Configuração incompleta' }) }
  }

  const res = await fetch(`https://api.stripe.com/v1/prices/${EXTRA_SLOT_PRICE_ID}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  })

  if (!res.ok) {
    const err = await res.json()
    return { statusCode: 502, body: JSON.stringify({ error: err.error?.message || 'Erro ao buscar preço' }) }
  }

  const price = await res.json()

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      unit_amount: price.unit_amount,       // em centavos
      currency: price.currency,             // 'brl'
      recurring: price.recurring?.interval, // 'month'
    }),
  }
}
