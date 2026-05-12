// Netlify Function: reduz ou remove slots adicionais de usuário de uma empresa Premium
// POST /.netlify/functions/stripe-remove-extra-slots
// Body: { companyId: string, removeQuantity: number }

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ecmgbinyotuxhiniadom.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const EXTRA_SLOT_PRICE_ID = 'price_1TWJRsFUmTFSWkItAVIMKFkb'

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  if (!STRIPE_SECRET_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Configuração incompleta' }) }
  }

  let companyId, removeQuantity
  try {
    const body = JSON.parse(event.body || '{}')
    companyId = body.companyId
    removeQuantity = parseInt(body.removeQuantity, 10)
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body inválido' }) }
  }

  if (!companyId || !removeQuantity || removeQuantity < 1) {
    return { statusCode: 400, body: JSON.stringify({ error: 'companyId e removeQuantity (≥1) são obrigatórios' }) }
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
    return { statusCode: 400, body: JSON.stringify({ error: 'Apenas empresas com plano Premium podem remover slots extras' }) }
  }
  if (!company.stripe_subscription_id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Empresa sem assinatura Stripe ativa' }) }
  }

  const currentSlots = company.extra_user_slots || 0
  if (removeQuantity > currentSlots) {
    return { statusCode: 400, body: JSON.stringify({ error: `Não é possível remover ${removeQuantity} slots — você tem apenas ${currentSlots}` }) }
  }

  const newTotalSlots = currentSlots - removeQuantity

  // Buscar subscription item de slot extra
  const subRes = await fetch(
    `https://api.stripe.com/v1/subscriptions/${company.stripe_subscription_id}`,
    { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } }
  )
  if (!subRes.ok) {
    const err = await subRes.json()
    return { statusCode: 502, body: JSON.stringify({ error: err.error?.message || 'Erro ao buscar assinatura no Stripe' }) }
  }
  const sub = await subRes.json()
  const slotItem = sub.items?.data?.find(item => item.price?.id === EXTRA_SLOT_PRICE_ID)

  if (!slotItem) {
    // Item não existe no Stripe mas existe no banco — corrigir inconsistência
    await fetch(
      `${SUPABASE_URL}/rest/v1/companies?id=eq.${encodeURIComponent(companyId)}`,
      {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ extra_user_slots: 0 }),
      }
    )
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, extra_user_slots: 0 }) }
  }

  if (newTotalSlots === 0) {
    // Remover o item da assinatura completamente
    const delRes = await fetch(
      `https://api.stripe.com/v1/subscription_items/${slotItem.id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ proration_behavior: 'create_prorations' }).toString(),
      }
    )
    if (!delRes.ok) {
      const err = await delRes.json()
      return { statusCode: 502, body: JSON.stringify({ error: err.error?.message || 'Erro ao remover item no Stripe' }) }
    }
  } else {
    // Reduzir a quantity do item
    const updRes = await fetch(
      `https://api.stripe.com/v1/subscription_items/${slotItem.id}`,
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
    if (!updRes.ok) {
      const err = await updRes.json()
      return { statusCode: 502, body: JSON.stringify({ error: err.error?.message || 'Erro ao atualizar slots no Stripe' }) }
    }
  }

  // Atualizar extra_user_slots no banco
  const patchRes = await fetch(
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
  if (!patchRes.ok) {
    const text = await patchRes.text()
    console.error('Falha ao atualizar extra_user_slots no Supabase:', text)
  }

  console.log(`Empresa ${companyId}: -${removeQuantity} slots → total ${newTotalSlots}`)

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, extra_user_slots: newTotalSlots }),
  }
}
