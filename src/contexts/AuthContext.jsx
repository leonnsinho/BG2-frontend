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
  const [profileCache, setProfileCache] = useState({}) // Cache para perfis

  // Buscar perfil do usuário
  const fetchProfile = async (userId, useCache = true) => {
    if (!userId) return null
    
    // Verificar cache primeiro
    if (useCache && profileCache[userId]) {
      return profileCache[userId]
    }
    
    const timeoutMs = 5000 // 5 segundos timeout
    
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        console.warn('Timeout ao buscar perfil, permitindo acesso com funcionalidades limitadas')
        resolve(null) // Resolver com null em vez de rejeitar
      }, timeoutMs)

      try {
        // Primeiro buscar apenas o perfil básico
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        clearTimeout(timeoutId)

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            console.warn('Perfil não encontrado, permitindo acesso com funcionalidades básicas')
            resolve(null)
            return
          }
          
          console.warn('Erro ao buscar perfil:', profileError.message)
          resolve(null)
          return
        }

        // Se conseguiu buscar o perfil básico, tentar buscar dados das empresas separadamente
        try {
          const { data: userCompaniesData, error: companiesError } = await supabase
            .from('user_companies')
            .select(`
              id,
              role,
              is_active,
              permissions,
              companies (
                id,
                name,
                slug
              )
            `)
            .eq('user_id', userId)

          // Mesmo se der erro nas empresas, retornar o perfil básico
          const fullProfile = {
            ...profileData,
            user_companies: companiesError ? [] : userCompaniesData
          }

          // Cache o resultado
          setProfileCache(prev => ({ ...prev, [userId]: fullProfile }))
          resolve(fullProfile)

        } catch (companiesError) {
          console.warn('Erro ao buscar empresas do usuário, usando perfil básico:', companiesError)
          
          // Retornar perfil básico sem dados de empresas
          const basicProfile = {
            ...profileData,
            user_companies: []
          }
          
          setProfileCache(prev => ({ ...prev, [userId]: basicProfile }))
          resolve(basicProfile)
        }

      } catch (error) {
        clearTimeout(timeoutId)
        console.error('Erro inesperado ao buscar perfil:', error)
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
    let mounted = true // Flag para evitar updates em componente desmontado
    
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
          .then((profile) => {
            if (mounted) {
              setProfile(profile)
              setLoading(false)
            }
          })
          .catch((error) => {
            if (mounted) {
              setProfile(null) // Permitir continuar mesmo sem perfil
              setLoading(false)
            }
          })
      } else {
        if (mounted) {
          setLoading(false)
        }
      }
    })

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        const currentUser = session?.user ?? null
        setUser(currentUser)
        
        // Só recarregar o perfil se o usuário mudou realmente
        if (currentUser && currentUser.id !== user?.id) {
          const userProfile = await fetchProfile(currentUser.id)
          if (mounted) {
            setProfile(userProfile)
          }
        } else if (!currentUser) {
          if (mounted) {
            setProfile(null)
          }
        }
        
        if (mounted) {
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // Removido user da dependência para evitar loops

  // Função para recarregar o perfil atual
  const refreshProfile = async () => {
    if (!user?.id) return null
    
    try {
      // Invalidar cache e buscar perfil atualizado
      setProfileCache(prev => {
        const newCache = { ...prev }
        delete newCache[user.id]
        return newCache
      })
      
      const updatedProfile = await fetchProfile(user.id, false) // false = não usar cache
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
