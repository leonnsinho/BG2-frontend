import { createClient } from '@supabase/supabase-js'

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
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
