// Netlify Function: cria uma Stripe Customer Portal Session
// Chamada via: POST /.netlify/functions/stripe-create-portal
// Body JSON: { companyId }

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const APP_URL = process.env.APP_URL || 'https://bg2-mvp.netlify.app'
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ecmgbinyotuxhiniadom.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  if (!STRIPE_SECRET_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Stripe não configurado' }) }
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Supabase não configurado' }) }
  }

  let companyId
  try {
    const body = JSON.parse(event.body || '{}')
    companyId = body.companyId
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body inválido' }) }
  }

  if (!companyId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'companyId é obrigatório' }) }
  }

  try {
    // Buscar stripe_customer_id da empresa
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/companies?id=eq.${companyId}&select=stripe_customer_id`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    )
    const rows = await res.json()
    const customerId = rows?.[0]?.stripe_customer_id

    if (!customerId) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Nenhuma assinatura Stripe encontrada para esta empresa' }),
      }
    }

    // Criar Customer Portal Session
    const params = new URLSearchParams({
      customer: customerId,
      return_url: `${APP_URL}/settings?tab=plano`,
    })

    const portalRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const portalData = await portalRes.json()

    if (!portalRes.ok) {
      console.error('Stripe portal error:', portalData)
      return {
        statusCode: portalRes.status,
        body: JSON.stringify({ error: portalData.error?.message || 'Erro ao criar portal' }),
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: portalData.url }),
    }
  } catch (err) {
    console.error('Erro inesperado:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno' }) }
  }
}
