import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext({})

// Cache global de perfis para evitar recarregamentos desnecessários
const globalProfileCache = new Map()
const CACHE_TIMEOUT = 5 * 60 * 1000 // 5 minutos

// Limpeza automática do cache
const cleanupCache = () => {
  const now = Date.now()
  for (const [key, value] of globalProfileCache.entries()) {
    if (now - value.timestamp > CACHE_TIMEOUT) {
      globalProfileCache.delete(key)
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
  const pendingFetches = useRef({}) // Controle de chamadas simultâneas

  // Buscar perfil do usuário com carregamento otimizado
  const fetchProfile = async (userId, useCache = true) => {
    if (!userId) return null
    
    // Evitar múltiplas chamadas simultâneas para o mesmo usuário
    if (pendingFetches.current[userId]) {
      console.log('⏳ Aguardando fetch em andamento para:', userId)
      return pendingFetches.current[userId]
    }
    
    // Verificar cache global primeiro
    const cacheKey = `profile_${userId}`
    const cachedData = globalProfileCache.get(cacheKey)
    
    if (useCache && cachedData && (Date.now() - cachedData.timestamp < CACHE_TIMEOUT)) {
      console.log('📋 Perfil carregado do cache global:', cachedData.data?.email)
      return cachedData.data
    }
    
    console.log('🔄 Buscando perfil do usuário:', userId)
    
    // Criar promise e armazenar para evitar chamadas duplicadas
    const fetchPromise = (async () => {
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

            // Atualizar cache global com dados completos
            const fullProfile = {
              ...profileData,
              user_companies: enrichedUserCompanies
            }

            globalProfileCache.set(cacheKey, {
              data: fullProfile,
              timestamp: Date.now()
            })
            
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

        // Cache global temporário
        globalProfileCache.set(cacheKey, {
          data: basicProfile,
          timestamp: Date.now()
        })
        
        return basicProfile

      } catch (error) {
        console.warn('⚠️ Erro ao buscar perfil, usando fallback:', error.message)
        // Sempre tentar usar o perfil do cache global para preservar role e dados corretos
        const existingCache = globalProfileCache.get(cacheKey)
        if (existingCache && existingCache.data) {
          console.log('📋 Usando perfil do cache global devido a timeout:', existingCache.data?.email, existingCache.data?.role)
          return existingCache.data
        }
        // Só criar perfil mínimo se não houver nada no cache
        console.warn('⚠️ Criando perfil fallback temporário (sem cache)')
        return {
          id: userId,
          email: 'carregando@sistema.com',
          full_name: null,
          role: 'user', // Será atualizado quando conseguir carregar
          user_companies: []
        }
      } finally {
        // Remover da lista de fetches pendentes
        delete pendingFetches.current[userId]
      }
    })()

    // Armazenar promise para evitar chamadas duplicadas
    pendingFetches.current[userId] = fetchPromise
    
    return fetchPromise
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
      
      // Tentar logout no Supabase, mas não falhar se der erro
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.warn('⚠️ Erro no logout do Supabase (ignorando):', error.message)
        // Não throw do erro - continua com limpeza local
      }
      
      // Limpar estado local independente do resultado do servidor
      setUser(null)
      setProfile(null)
      setError(null)
      
      // Limpar cache global de perfis
      globalProfileCache.clear()
      
      // Limpar pending fetches
      pendingFetches.current = {}
      
      // Limpar localStorage se necessário
      try {
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('partimap_tasks') // Limpar tarefas do planejamento
      } catch (localError) {
        console.warn('⚠️ Erro ao limpar localStorage:', localError)
      }
      
      console.log('✅ Logout realizado com sucesso')
      
    } catch (error) {
      console.error('❌ Erro crítico no logout:', error)
      // Mesmo com erro crítico, limpar estado local
      setUser(null)
      setProfile(null)
      setError(null)
      globalProfileCache.clear()
      pendingFetches.current = {}
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

  // Verificar se usuário não está vinculado a nenhuma empresa
  const isUnlinkedUser = () => {
    if (!profile) return false
    
    // Super admins nunca são considerados não vinculados
    if (profile.role === 'super_admin') {
      return false
    }
    
    // Consultores também não são considerados não vinculados (acesso global)
    if (profile.role === 'consultant') {
      return false
    }
    
    // Se não tem user_companies ou está vazio, é não vinculado
    if (!profile.user_companies || profile.user_companies.length === 0) {
      return true
    }
    
    // Se não tem nenhuma empresa ativa, é não vinculado
    const hasActiveCompany = profile.user_companies.some(uc => uc.is_active)
    return !hasActiveCompany
  }

  // Debug: monitorar cache e fetches pendentes
  useEffect(() => {
    const interval = setInterval(() => {
      const cacheSize = globalProfileCache.size
      const pendingSize = Object.keys(pendingFetches.current).length
      
      if (cacheSize > 0 || pendingSize > 0) {
        console.log('📊 Status Auth - Cache Global:', cacheSize, 'Pending:', pendingSize)
        
        // Debug detalhado do cache
        if (cacheSize > 0) {
          for (const [key, value] of globalProfileCache.entries()) {
            console.log(`🔍 Cache ${key}:`, value.data?.email, value.data?.role)
          }
        }
      }
    }, 10000) // A cada 10 segundos
    
    return () => clearInterval(interval)
  }, [])

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
        
        // Evitar recarregamentos desnecessários
        if (currentUser?.id === user?.id && event === 'SIGNED_IN') {
          console.log('🔄 Mesmo usuário, ignorando recarregamento:', currentUser.email)
          return
        }
        
        setUser(currentUser)
        
        // Só recarregar o perfil se o usuário mudou realmente
        if (currentUser && currentUser.id !== user?.id) {
          console.log('🆕 Novo usuário, carregando perfil:', currentUser.email)
          
          // Evitar chamar fetchProfile se já está sendo chamado
          if (!pendingFetches.current[currentUser.id]) {
            const userProfile = await fetchProfile(currentUser.id)
            if (mounted) {
              setProfile(userProfile)
            }
          }
        } else if (!currentUser) {
          console.log('👋 Usuário fez logout')
          if (mounted) {
            setProfile(null)
            globalProfileCache.clear() // Limpar cache no logout
            pendingFetches.current = {} // Limpar fetches pendentes
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
    isUnlinkedUser,
    fetchProfile,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
