// Netlify Edge Function — Proxy para Supabase API
// Chamada via: /.netlify/functions/supabase-proxy?path=%2Frest%2Fv1%2F...
//
// Usado como fallback quando a rede do usuário bloqueia acesso direto a *.supabase.co
// (VPN, firewall corporativo, ISP com problema de rota, etc.)

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;

// Headers CORS comuns
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, apikey, x-client-info, Prefer, Accept, x-refresh-token',
  'Access-Control-Max-Age': '86400',
};

// Headers que devem ser repassados do cliente para o Supabase
const FORWARD_HEADERS = [
  'authorization',
  'apikey',
  'x-client-info',
  'prefer',
  'accept',
  'content-type',
];

exports.handler = async (event) => {
  // ─── CORS Preflight ───────────────────────────────────────────
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
    };
  }

  // ─── Validar parâmetros ───────────────────────────────────────
  const targetPath = event.queryStringParameters?.path;

  if (!targetPath) {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Parâmetro "path" obrigatório. Ex: ?path=/rest/v1/profiles' }),
    };
  }

  if (!SUPABASE_URL) {
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'VITE_SUPABASE_URL não configurada no ambiente da função.' }),
    };
  }

  // ─── Bloquear path traversal ──────────────────────────────────
  if (targetPath.includes('..') || targetPath.includes('//')) {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Path inválido.' }),
    };
  }

  // ─── Construir URL de destino ─────────────────────────────────
  const targetUrl = `${SUPABASE_URL}${targetPath}`;

  // ─── Filtrar headers a repassar ────────────────────────────────
  const forwardedHeaders = {};
  for (const [key, value] of Object.entries(event.headers)) {
    if (FORWARD_HEADERS.includes(key.toLowerCase())) {
      forwardedHeaders[key] = value;
    }
  }

  // ─── Encaminhar requisição para o Supabase ─────────────────────
  try {
    const fetchOptions = {
      method: event.httpMethod,
      headers: forwardedHeaders,
    };

    // Só inclui body para métodos que suportam
    if (event.body && !['GET', 'HEAD'].includes(event.httpMethod)) {
      fetchOptions.body = event.body;
    }

    const response = await fetch(targetUrl, fetchOptions);

    // ─── Construir resposta ──────────────────────────────────────
    const responseBody = await response.text();

    // Coletar headers relevantes da resposta do Supabase
    const responseHeaders = { ...CORS_HEADERS };
    const passThroughHeaders = [
      'content-type',
      'content-range',
      'content-location',
      'location',
      'etag',
      'x-refresh-token',
    ];
    response.headers.forEach((value, key) => {
      if (passThroughHeaders.includes(key.toLowerCase())) {
        responseHeaders[key] = value;
      }
    });

    return {
      statusCode: response.status,
      headers: responseHeaders,
      body: responseBody,
    };
  } catch (error) {
    console.error('[supabase-proxy] Erro ao encaminhar:', error.message);
    return {
      statusCode: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Erro de gateway — não foi possível alcançar o Supabase.',
        message: error.message,
      }),
    };
  }
};
