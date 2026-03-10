// Netlify Function: update-user-email
// Atualiza o email de um usuário no Supabase Auth + tabela profiles
// Requer env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const { createClient } = require('@supabase/supabase-js')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const { userId, newEmail, requestingUserToken } = JSON.parse(event.body || '{}')

    if (!userId || !newEmail || !requestingUserToken) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'userId, newEmail e requestingUserToken são obrigatórios' }),
      }
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Configuração do servidor incompleta' }),
      }
    }

    // Cliente admin (service role)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // --- Verificar se quem solicita é super_admin ---
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(requestingUserToken)
    if (authError || !requestingUser) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Token inválido' }),
      }
    }

    const { data: requestingProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', requestingUser.id)
      .single()

    if (requestingProfile?.role !== 'super_admin') {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Apenas super_admin pode alterar emails' }),
      }
    }

    // --- Atualizar email no Supabase Auth ---
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email: newEmail,
      email_confirm: true, // confirma sem precisar de verificação
    })

    if (authUpdateError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Erro ao atualizar Auth: ' + authUpdateError.message }),
      }
    }

    // --- Atualizar tabela profiles ---
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ email: newEmail, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (profileError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Auth atualizado, mas erro ao atualizar profiles: ' + profileError.message }),
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, message: 'Email atualizado com sucesso' }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Erro interno: ' + err.message }),
    }
  }
}
