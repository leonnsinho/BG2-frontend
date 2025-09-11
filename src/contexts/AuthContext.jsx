import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Buscar perfil do usuário
  const fetchProfile = async (userId) => {
    const timeoutMs = 5000 // 5 segundos timeout
    
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        resolve(null) // Resolver com null em vez de rejeitar
      }, timeoutMs)

      try {
        // Primeiro tentar buscar apenas o perfil básico (sem JOIN)
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        clearTimeout(timeoutId)

        if (error) {
          // Se não encontrou o perfil, retornar null mas não travar
          if (error.code === 'PGRST116') {
            resolve(null)
            return
          }
          
          resolve(null) // Resolver com null em vez de rejeitar
          return
        }

        resolve(data)
      } catch (error) {
        clearTimeout(timeoutId)
        resolve(null) // Resolver com null em vez de rejeitar
      }
    })
  }

  // Login com email e senha
  const signIn = async (email, password) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Buscar perfil após login bem-sucedido
      if (data.user) {
        const userProfile = await fetchProfile(data.user.id)
        setProfile(userProfile)
      }

      return { user: data.user, error: null }
    } catch (error) {
      setError(error.message)
      return { user: null, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Cadastro de novo usuário
  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name || '',
            phone: userData.phone || '',
          }
        }
      })

      if (error) throw error

      return { user: data.user, error: null }
    } catch (error) {
      setError(error.message)
      return { user: null, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Logout
  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setProfile(null)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Resetar senha
  const resetPassword = async (email) => {
    try {
      setError(null)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      return { error: null }
    } catch (error) {
      setError(error.message)
      return { error: error.message }
    }
  }

  // Atualizar perfil
  const updateProfile = async (updates) => {
    try {
      setError(null)
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      
      setProfile(data)
      return { data, error: null }
    } catch (error) {
      setError(error.message)
      return { data: null, error: error.message }
    }
  }

  // Verificar se usuário tem permissão
  const hasPermission = (permission) => {
    if (!profile) return false
    
    // Super admin tem todas as permissões
    if (profile.role === 'super_admin') return true
    
    // Verificar permissões específicas
    return profile.user_companies?.some(uc => 
      uc.is_active && uc.permissions?.includes(permission)
    )
  }

  // Verificar se usuário tem role específica
  const hasRole = (roles) => {
    if (!profile) return false
    
    const roleArray = Array.isArray(roles) ? roles : [roles]
    
    // Verificar role global
    if (roleArray.includes(profile.role)) return true
    
    // Verificar roles nas empresas
    return profile.user_companies?.some(uc => 
      uc.is_active && roleArray.includes(uc.role)
    )
  }

  // Obter empresa ativa do usuário
  const getActiveCompany = () => {
    if (!profile?.user_companies) return null
    
    return profile.user_companies.find(uc => uc.is_active)?.companies
  }

  // Efeito para monitorar mudanças de autenticação
  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
          .then((profile) => {
            setProfile(profile)
            setLoading(false)
          })
          .catch((error) => {
            setProfile(null) // Permitir continuar mesmo sem perfil
            setLoading(false)
          })
      } else {
        setLoading(false)
      }
    })

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const userProfile = await fetchProfile(session.user.id)
          setProfile(userProfile)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Função para recarregar o perfil atual
  const refreshProfile = async () => {
    if (!user?.id) return null
    
    try {
      const updatedProfile = await fetchProfile(user.id)
      setProfile(updatedProfile)
      return updatedProfile
    } catch (error) {
      console.error('Erro ao recarregar perfil:', error)
      return null
    }
  }

  const value = {
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    hasPermission,
    hasRole,
    getActiveCompany,
    fetchProfile,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
