import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext({})

// Cache de perfis para evitar recarregamentos desnecessários
const profileCache = new Map()
const CACHE_TIMEOUT = 5 * 60 * 1000 // 5 minutos

// Limpeza automática do cache
const cleanupCache = () => {
  const now = Date.now()
  for (const [key, value] of profileCache.entries()) {
    if (now - value.timestamp > CACHE_TIMEOUT) {
      profileCache.delete(key)
    }
  }
}

// Limpeza periódica do cache
setInterval(cleanupCache, CACHE_TIMEOUT)

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

  // Buscar perfil do usuário com carregamento otimizado
  const fetchProfile = async (userId, useCache = true) => {
    if (!userId) return null
    
    // Verificar cache primeiro
    if (useCache && profileCache[userId]) {
      console.log('📋 Perfil carregado do cache')
      return profileCache[userId]
    }
    
    console.log('🔄 Buscando perfil do usuário:', userId)
    
    try {
      // Primeiro: buscar apenas perfil básico com timeout curto
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      // Timeout de apenas 3 segundos para perfil básico
      const profileResult = await Promise.race([
        profilePromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile timeout')), 3000)
        )
      ])

      if (profileResult.error) {
        if (profileResult.error.code === 'PGRST116') {
          console.warn('⚠️ Perfil não encontrado, criando perfil básico')
          // Retornar perfil básico com dados do auth.users
          const basicProfile = {
            id: userId,
            email: 'usuário@sistema.com', // Será substituído depois
            full_name: null,
            role: 'user',
            user_companies: []
          }
          return basicProfile
        }
        
        throw profileResult.error
      }

      const profileData = profileResult.data
      console.log('✅ Perfil básico carregado:', profileData.email)

      // Segundo: buscar empresas em background (não bloqueia UI)
      setTimeout(async () => {
        try {
          const { data: userCompaniesData } = await supabase
            .from('user_companies')
            .select('id, role, is_active, permissions, company_id')
            .eq('user_id', userId)
            .eq('is_active', true)

          let enrichedUserCompanies = []
          
          if (userCompaniesData?.length > 0) {
            const companyIds = userCompaniesData.map(uc => uc.company_id)
            
            const { data: companiesData } = await supabase
              .from('companies')
              .select('id, name')
              .in('id', companyIds)
            
            if (companiesData) {
              enrichedUserCompanies = userCompaniesData.map(uc => ({
                ...uc,
                companies: companiesData.find(c => c.id === uc.company_id) || 
                          { id: uc.company_id, name: 'Empresa Desconhecida' }
              }))
            }
          }

          // Atualizar cache com dados completos
          const fullProfile = {
            ...profileData,
            user_companies: enrichedUserCompanies
          }

          setProfileCache(prev => ({ ...prev, [userId]: fullProfile }))
          setProfile(fullProfile) // Atualizar estado
          console.log('🏢 Dados de empresas carregados em background')

        } catch (error) {
          console.warn('⚠️ Erro ao carregar empresas em background:', error.message)
        }
      }, 100) // Carrega empresas após 100ms

      // Retornar perfil básico imediatamente
      const basicProfile = {
        ...profileData,
        user_companies: [] // Será preenchido em background
      }

      // Cache temporário
      setProfileCache(prev => ({ ...prev, [userId]: basicProfile }))
      
      return basicProfile

    } catch (error) {
      console.warn('⚠️ Erro ao buscar perfil, usando fallback:', error.message)
      
      // Fallback: perfil mínimo que permite funcionamento
      return {
        id: userId,
        email: 'carregando@sistema.com',
        full_name: null,
        role: 'user',
        user_companies: []
      }
    }
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
    let mounted = true
    
    console.log('🚀 Inicializando autenticação')
    
    // Verificar sessão atual de forma otimizada
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      if (currentUser) {
        console.log('👤 Usuário encontrado:', currentUser.email)
        
        // Buscar perfil de forma não-bloqueante
        fetchProfile(currentUser.id)
          .then((profile) => {
            if (mounted) {
              setProfile(profile)
              console.log('✅ Perfil carregado para:', profile?.email || currentUser.email)
            }
          })
          .catch((error) => {
            console.warn('⚠️ Erro ao carregar perfil:', error.message)
            if (mounted) {
              setProfile(null)
            }
          })
          .finally(() => {
            if (mounted) {
              setLoading(false)
            }
          })
      } else {
        console.log('❌ Nenhum usuário autenticado')
        if (mounted) {
          setLoading(false)
        }
      }
    })

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        console.log('🔄 Mudança de auth:', event)
        
        const currentUser = session?.user ?? null
        setUser(currentUser)
        
        // Só recarregar o perfil se o usuário mudou realmente
        if (currentUser && currentUser.id !== user?.id) {
          console.log('🆕 Novo usuário, carregando perfil:', currentUser.email)
          const userProfile = await fetchProfile(currentUser.id)
          if (mounted) {
            setProfile(userProfile)
          }
        } else if (!currentUser) {
          console.log('👋 Usuário fez logout')
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
