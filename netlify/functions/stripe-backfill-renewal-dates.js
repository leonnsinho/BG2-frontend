// Netlify Function: backfill de datas de renovação para assinaturas ativas
// Acesse: POST /.netlify/functions/stripe-backfill-renewal-dates
// Requer header: x-admin-key: <ADMIN_BACKFILL_KEY>

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ecmgbinyotuxhiniadom.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ADMIN_BACKFILL_KEY = process.env.ADMIN_BACKFILL_KEY || 'bg2-backfill-2026'

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  // Proteção simples por chave
  const adminKey = event.headers['x-admin-key']
  if (adminKey !== ADMIN_BACKFILL_KEY) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Não autorizado' }) }
  }

  if (!STRIPE_SECRET_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Variáveis de ambiente ausentes' }) }
  }

  try {
    // Buscar todas as empresas com stripe_subscription_id preenchido
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/companies?stripe_subscription_id=not.is.null&select=id,stripe_subscription_id`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    )
    const companies = await res.json()

    if (!Array.isArray(companies) || companies.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Nenhuma empresa com assinatura Stripe encontrada', updated: 0 }),
      }
    }

    let updated = 0
    let failed = 0
    const errors = []

    for (const company of companies) {
      try {
        const subRes = await fetch(
          `https://api.stripe.com/v1/subscriptions/${company.stripe_subscription_id}`,
          { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } }
        )

        if (!subRes.ok) {
          failed++
          errors.push({ company: company.id, error: `Stripe ${subRes.status}` })
          continue
        }

        const sub = await subRes.json()
        const renewalDate = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null

        if (!renewalDate) {
          failed++
          errors.push({ company: company.id, error: 'current_period_end ausente' })
          continue
        }

        const patchRes = await fetch(
          `${SUPABASE_URL}/rest/v1/companies?id=eq.${company.id}`,
          {
            method: 'PATCH',
            headers: {
              apikey: SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({
              subscription_renewal_date: renewalDate,
              subscription_ends_at: renewalDate,
            }),
          }
        )

        if (patchRes.ok) {
          updated++
          console.log(`Empresa ${company.id}: renewal=${renewalDate}`)
        } else {
          failed++
          errors.push({ company: company.id, error: `Supabase PATCH ${patchRes.status}` })
        }
      } catch (err) {
        failed++
        errors.push({ company: company.id, error: err.message })
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updated, failed, total: companies.length, errors }),
    }
  } catch (err) {
    console.error('Erro no backfill:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno', detail: err.message }) }
  }
}
