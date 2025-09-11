import { createClient } from '@supabase/supabase-js'

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ecmgbinyotuxhiniadom.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbWdiaW55b3R1eGhpbmlhZG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NTA1NzksImV4cCI6MjA3MzEyNjU3OX0.rN5erJupCKJpJ8cdVy-ECF69kZfao6O_QHOd_DriTxM'

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
