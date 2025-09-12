import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProviderOptimized({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cache do perfil para evitar refetch desnecessário
  const [profileCache, setProfileCache] = useState(new Map())

  // Buscar perfil otimizado com cache e timeout reduzido
  const fetchProfile = useCallback(async (userId) => {
    // Verificar cache primeiro
    if (profileCache.has(userId)) {
      return profileCache.get(userId)
    }

    const timeoutMs = 3000 // Reduzido de 5s para 3s
    
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        console.warn('⏱️ Timeout ao buscar perfil, usando dados básicos')
        resolve(null)
      }, timeoutMs)

      try {
        // Busca otimizada - apenas dados essenciais primeiro
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            role,
            created_at,
            updated_at
          `)
          .eq('id', userId)
          .single()

        clearTimeout(timeoutId)

        if (error) {
          if (error.code === 'PGRST116') {
            // Perfil não encontrado, mas não é erro crítico
            console.log('📝 Perfil não encontrado, criando perfil básico')
            resolve(null)
            return
          }
          
          console.warn('⚠️ Erro ao buscar perfil:', error.message)
          resolve(null)
          return
        }

        // Cachear resultado
        setProfileCache(prev => new Map(prev).set(userId, data))
        resolve(data)
      } catch (error) {
        clearTimeout(timeoutId)
        console.warn('❌ Erro ao buscar perfil:', error.message)
        resolve(null)
      }
    })
  }, [profileCache])

  // Buscar dados de empresas em segundo plano (não bloquear dashboard)
  const fetchUserCompanies = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_companies')
        .select(`
          *,
          companies (
            id,
            name,
            cnpj,
            email
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)

      if (!error && data) {
        // Atualizar perfil com dados de empresas
        setProfile(prev => prev ? { ...prev, user_companies: data } : null)
      }
    } catch (error) {
      console.warn('⚠️ Erro ao buscar empresas (não crítico):', error.message)
    }
  }, [])

  // Inicialização otimizada
  useEffect(() => {
    let isMounted = true

    // Verificar sessão existente primeiro
    const initializeAuth = async () => {
      try {
        // 1. Verificar sessão atual (mais rápido)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (!isMounted) return

        if (sessionError) {
          console.warn('⚠️ Erro na sessão:', sessionError.message)
          setLoading(false)
          return
        }

        if (session?.user) {
          console.log('✅ Sessão ativa encontrada')
          setUser(session.user)
          
          // 2. Buscar perfil básico (rápido)
          const userProfile = await fetchProfile(session.user.id)
          
          if (!isMounted) return
          
          if (userProfile) {
            setProfile(userProfile)
          } else {
            // Criar perfil básico se não existir
            setProfile({
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || session.user.email,
              role: 'user'
            })
          }

          // 3. Buscar dados de empresas em background (não bloquear)
          setTimeout(() => {
            fetchUserCompanies(session.user.id)
          }, 100)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('❌ Erro na inicialização:', error.message)
        setError(error.message)
        setLoading(false)
      }
    }

    initializeAuth()

    // Listener para mudanças de auth (otimizado)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      console.log('🔄 Auth state changed:', event)

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        setError(null)
        
        // Buscar perfil de forma não bloqueante
        const userProfile = await fetchProfile(session.user.id)
        if (isMounted) {
          setProfile(userProfile || {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.email,
            role: 'user'
          })
          
          // Buscar empresas em background
          setTimeout(() => {
            fetchUserCompanies(session.user.id)
          }, 100)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setError(null)
        setProfileCache(new Map()) // Limpar cache
      }
      
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile, fetchUserCompanies])

  // Funções de autenticação otimizadas
  const signIn = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return { success: false, error: error.message }
      }

      // O listener vai tratar o resto
      return { success: true, data }
    } catch (error) {
      const errorMessage = error.message
      setError(errorMessage)
      setLoading(false)
      return { success: false, error: errorMessage }
    }
  }, [])

  const signUp = useCallback(async (email, password, metadata = {}) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      const errorMessage = error.message
      setError(errorMessage)
      setLoading(false)
      return { success: false, error: errorMessage }
    }
  }, [])

  const signOut = useCallback(async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      setError(error.message)
      setLoading(false)
      return { success: false, error: error.message }
    }

    return { success: true }
  }, [])

  // Verificações otimizadas de permissão
  const hasRole = useCallback((roles) => {
    if (!profile) return false
    
    if (typeof roles === 'string') {
      return profile.role === roles
    }
    
    if (Array.isArray(roles)) {
      return roles.includes(profile.role)
    }
    
    return false
  }, [profile])

  const hasPermission = useCallback((permission) => {
    if (!profile) return false
    
    // Super admin tem todas as permissões
    if (profile.role === 'super_admin') return true
    
    // Verificações básicas baseadas no role
    const rolePermissions = {
      consultant: ['manage_users', 'manage_companies', 'view_reports'],
      company_admin: ['manage_users', 'invite_users', 'view_reports'],
      user: ['view_users', 'create_projects']
    }
    
    return rolePermissions[profile.role]?.includes(permission) || false
  }, [profile])

  const getActiveCompany = useCallback(() => {
    if (!profile?.user_companies) return null
    
    // Retornar primeira empresa ativa (simplificado para performance)
    const activeCompany = profile.user_companies.find(uc => uc.is_active)
    return activeCompany?.companies || null
  }, [profile])

  // Valor do contexto
  const contextValue = {
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    hasRole,
    hasPermission,
    getActiveCompany
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
