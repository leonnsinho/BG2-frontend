// Netlify Function: compra slots adicionais de usuário para empresas Premium
// POST /.netlify/functions/stripe-buy-extra-slots
// Body: { companyId: string, quantity: number }

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ecmgbinyotuxhiniadom.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Price ID do produto "Slot adicional de usuário" (recorrente mensal)
const EXTRA_SLOT_PRICE_ID = 'price_1TWJRsFUmTFSWkItAVIMKFkb'

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  if (!STRIPE_SECRET_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Variáveis de ambiente ausentes')
    return { statusCode: 500, body: JSON.stringify({ error: 'Configuração incompleta' }) }
  }

  let companyId, quantity
  try {
    const body = JSON.parse(event.body || '{}')
    companyId = body.companyId
    quantity = parseInt(body.quantity, 10)
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body inválido' }) }
  }

  if (!companyId || !quantity || quantity < 1) {
    return { statusCode: 400, body: JSON.stringify({ error: 'companyId e quantity (≥1) são obrigatórios' }) }
  }

  // Buscar dados da empresa
  const companyRes = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?id=eq.${encodeURIComponent(companyId)}&select=stripe_subscription_id,subscription_plan,extra_user_slots`,
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
  if (!company.stripe_subscription_id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Empresa sem assinatura Stripe ativa' }) }
  }

  // Buscar subscription items do Stripe
  const subRes = await fetch(
    `https://api.stripe.com/v1/subscriptions/${company.stripe_subscription_id}`,
    { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } }
  )
  if (!subRes.ok) {
    const err = await subRes.json()
    return { statusCode: 502, body: JSON.stringify({ error: err.error?.message || 'Erro ao buscar assinatura no Stripe' }) }
  }
  const sub = await subRes.json()

  const newTotalSlots = (company.extra_user_slots || 0) + quantity

  // Verificar se já existe item de slot extra na assinatura
  const existingItem = sub.items?.data?.find(item => item.price?.id === EXTRA_SLOT_PRICE_ID)

  if (existingItem) {
    // Atualizar quantity do item existente
    const updateRes = await fetch(
      `https://api.stripe.com/v1/subscription_items/${existingItem.id}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          quantity: String(newTotalSlots),
          proration_behavior: 'create_prorations',
        }).toString(),
      }
    )
    if (!updateRes.ok) {
      const err = await updateRes.json()
      return { statusCode: 502, body: JSON.stringify({ error: err.error?.message || 'Erro ao atualizar slots no Stripe' }) }
    }
  } else {
    // Adicionar novo item à assinatura
    const addRes = await fetch(
      'https://api.stripe.com/v1/subscription_items',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          subscription: company.stripe_subscription_id,
          price: EXTRA_SLOT_PRICE_ID,
          quantity: String(quantity),
          proration_behavior: 'create_prorations',
        }).toString(),
      }
    )
    if (!addRes.ok) {
      const err = await addRes.json()
      return { statusCode: 502, body: JSON.stringify({ error: err.error?.message || 'Erro ao adicionar slots no Stripe' }) }
    }
  }

  // Atualizar extra_user_slots no banco imediatamente (sem esperar webhook)
  const updateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?id=eq.${encodeURIComponent(companyId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ extra_user_slots: newTotalSlots }),
    }
  )
  if (!updateRes.ok) {
    const text = await updateRes.text()
    console.error('Falha ao atualizar extra_user_slots no Supabase:', text)
  }

  console.log(`Empresa ${companyId}: +${quantity} slots → total ${newTotalSlots}`)

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, extra_user_slots: newTotalSlots }),
  }
}
