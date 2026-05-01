// Netlify Function: retorna detalhes da assinatura de uma empresa (inclui data de renovação)
// Chamada via: GET /.netlify/functions/stripe-get-subscription?companyId=xxx

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ecmgbinyotuxhiniadom.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Supabase não configurado' }) }
  }

  const companyId = event.queryStringParameters?.companyId
  if (!companyId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'companyId é obrigatório' }) }
  }

  try {
    // Buscar dados completos da empresa
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/companies?id=eq.${companyId}&select=stripe_subscription_id,subscription_plan,subscription_status,subscription_renewal_date,subscription_ends_at`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    )
    const rows = await res.json()
    const company = rows?.[0]

    if (!company) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Empresa não encontrada' }) }
    }

    // Se já temos a data no banco, retorna direto sem chamar Stripe
    const existingDate = company.subscription_renewal_date || company.subscription_ends_at
    if (existingDate) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: company.subscription_plan,
          status: company.subscription_status,
          currentPeriodEnd: Math.floor(new Date(existingDate).getTime() / 1000),
        }),
      }
    }

    // Sem data no banco — buscar da Stripe e salvar (lazy-update)
    let currentPeriodEnd = null

    if (company.stripe_subscription_id && STRIPE_SECRET_KEY) {
      const subRes = await fetch(
        `https://api.stripe.com/v1/subscriptions/${company.stripe_subscription_id}`,
        { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } }
      )

      if (subRes.ok) {
        const sub = await subRes.json()
        currentPeriodEnd = sub.current_period_end ?? null

        if (currentPeriodEnd) {
          const isoDate = new Date(currentPeriodEnd * 1000).toISOString()
          // Salvar no banco para não precisar consultar Stripe novamente
          await fetch(
            `${SUPABASE_URL}/rest/v1/companies?id=eq.${companyId}`,
            {
              method: 'PATCH',
              headers: {
                apikey: SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                Prefer: 'return=minimal',
              },
              body: JSON.stringify({
                subscription_renewal_date: isoDate,
                subscription_ends_at: isoDate,
              }),
            }
          )
          console.log(`Lazy-update renewal date para empresa ${companyId}: ${isoDate}`)
        }
      } else {
        const errText = await subRes.text()
        console.error(`Stripe API error ${subRes.status} para subscription ${company.stripe_subscription_id}: ${errText}`)
      }
    } else {
      if (!STRIPE_SECRET_KEY) console.error('STRIPE_SECRET_KEY não configurado')
      if (!company.stripe_subscription_id) console.warn(`Empresa ${companyId} não tem stripe_subscription_id`)
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: company.subscription_plan,
        status: company.subscription_status,
        currentPeriodEnd,
      }),
    }
  } catch (err) {
    console.error('Erro inesperado:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno' }) }
  }
}
