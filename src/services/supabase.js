import { createClient } from '@supabase/supabase-js'

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias. Configure o arquivo .env.')
}

// ─── Proxy de Rede (Fallback para VPN/Firewall/ISP bloqueado) ───
// Quando a rede do usuário bloqueia *.supabase.co, as chamadas são
// roteadas automaticamente via Netlify Edge Function.

const PROXY_BASE = '/.netlify/functions/supabase-proxy'

/**
 * Estado global de conectividade com o Supabase.
 *  - 'unknown'  : ainda não testado
 *  - 'direct'   : conexão direta funcionando
 *  - 'proxy'    : usando proxy (rede bloqueada)
 *  - 'offline'  : sem conexão de nenhuma forma
 */
let _connectivityState = 'unknown'
const _connectivityListeners = new Set()

export function getConnectivityState() {
  return _connectivityState
}

export function onConnectivityChange(callback) {
  _connectivityListeners.add(callback)
  return () => _connectivityListeners.delete(callback)
}

function setConnectivityState(state) {
  if (_connectivityState !== state) {
    _connectivityState = state
    _connectivityListeners.forEach(cb => {
      try { cb(state) } catch { /* noop */ }
    })
  }
}

/**
 * Fetch customizado com fallback automático para o proxy Netlify.
 *
 * Fluxo:
 *  1. Tenta chamada direta para supabaseUrl
 *  2. Se falhar com erro de rede → retry via /.netlify/functions/supabase-proxy
 *  3. Se ambos falharem → erro propagado
 *
 * Compatível com a interface `fetch` esperada pelo Supabase JS client v2.
 */
async function customFetch(input, init) {
  // Primeira tentativa: conexão direta
  try {
    const response = await fetch(input, init)
    setConnectivityState('direct')
    return response
  } catch (directError) {
    // Só faz fallback para erros de rede (DNS, conexão recusada, timeout)
    const isNetworkError =
      directError.message?.includes('Failed to fetch') ||
      directError.message?.includes('NetworkError') ||
      directError.message?.includes('Network request failed') ||
      directError.name === 'TypeError'

    if (!isNetworkError) throw directError

    // ─── Fallback via proxy ─────────────────────────────────────
    try {
      // Extrai o path relativo da URL original
      let path
      if (typeof input === 'string') {
        path = new URL(input).pathname + new URL(input).search
      } else if (input instanceof Request) {
        path = new URL(input.url).pathname + new URL(input.url).search
      } else {
        throw directError
      }

      const proxyUrl = `${PROXY_BASE}?path=${encodeURIComponent(path)}`

      // Repassa headers relevantes
      const proxyHeaders = {}
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => { proxyHeaders[key] = value })
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([key, value]) => { proxyHeaders[key] = value })
        } else {
          Object.assign(proxyHeaders, init.headers)
        }
      }

      const proxyResponse = await fetch(proxyUrl, {
        method: init?.method || 'GET',
        headers: proxyHeaders,
        body: init?.body,
      })

      setConnectivityState('proxy')
      return proxyResponse
    } catch (proxyError) {
      setConnectivityState('offline')
      throw directError // Propaga o erro original
    }
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    },
    timeout: 30000,
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: (tries) => Math.min(tries * 5000, 60000) // backoff: 5s, 10s, ..., max 60s
  },
  global: {
    fetch: customFetch
  }
})

// Tipos de usuário do sistema
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  CONSULTANT: 'consultant', 
  COMPANY_ADMIN: 'company_admin',
  USER: 'user'
}

// Configurações de RLS (Row Level Security)
export const RLS_POLICIES = {
  COMPANY_ISOLATION: 'company_isolation',
  USER_PERMISSIONS: 'user_permissions',
  ROLE_BASED_ACCESS: 'role_based_access'
}
