import { createClient } from '@supabase/supabase-js'

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias. Configure o arquivo .env.')
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
