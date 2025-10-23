import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../services/supabase'
import { updateUserActivity } from './updateUserActivity'

console.log('%%%%%%%%%%% AUTHCONTEXT CARREGADO - VERSAO 15/10/2025 - 10:00 %%%%%%%%%%%')

const AuthContext = createContext({})

// Cache global de perfis para evitar recarregamentos desnecessários
const globalProfileCache = new Map()
const CACHE_TIMEOUT = 60000 // 60 segundos (mais longo para evitar reloads)
const CRITICAL_CACHE_TIMEOUT = 120000 // 2 minutos para perfis críticos
const MAX_RETRY_ATTEMPTS = 0 // SEM retry - falha rápido e usa cache

// Flag para coordenar primeiro carregamento (evita race condition)
let isFirstLoadInProgress = false
let isInitializingAuth = true // Flag para ignorar primeira chamada de inicialização

// Função para verificar se é um perfil crítico (gestor, admin, etc.)
const isCriticalProfile = (profileData) => {
  if (!profileData) return false
  return profileData.role === 'gestor' || 
         profileData.role === 'admin' || 
         profileData.role === 'super_admin' ||
         (profileData.user_companies && profileData.user_companies.some(uc => 
           uc.role === 'gestor' || uc.role === 'admin'
         ))
}

// Limpeza automática do cache com TTL diferenciado
const cleanupCache = () => {
  const now = Date.now()
  for (const [key, value] of globalProfileCache.entries()) {
    const timeout = isCriticalProfile(value.data) ? CRITICAL_CACHE_TIMEOUT : CACHE_TIMEOUT
    if (now - value.timestamp > timeout) {
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

  // Sistema de retry para operações críticas
  const retryOperation = async (operation, maxAttempts = MAX_RETRY_ATTEMPTS, delay = 500) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        console.warn(`⚠️ Tentativa ${attempt}/${maxAttempts} falhou:`, error.message)
        
        if (attempt === maxAttempts) {
          throw error
        }
        
        // Delay reduzido: 500ms apenas
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // Buscar perfil do usuário com carregamento otimizado e retry
  const fetchProfile = async (userId, useCache = true) => {
    if (!userId) return null
    
    // Evitar múltiplas chamadas simultâneas para o mesmo usuário
    if (pendingFetches.current[userId]) {
      console.log('⏳ [PERF] Fetch já em andamento, reutilizando promise existente...')
      try {
        return await pendingFetches.current[userId]
      } catch (error) {
        console.warn('⚠️ [PERF] Promise existente falhou, tentando novamente:', error.message)
        // Se a promise existente falhou, limpar e tentar novamente
        delete pendingFetches.current[userId]
        // Não fazer return aqui, continuar para nova tentativa
      }
    }
    
    // Verificar cache global primeiro com TTL diferenciado
    const cacheKey = `profile_${userId}`
    const cachedData = globalProfileCache.get(cacheKey)
    
    if (useCache && cachedData) {
      const timeout = isCriticalProfile(cachedData.data) ? CRITICAL_CACHE_TIMEOUT : CACHE_TIMEOUT
      if (Date.now() - cachedData.timestamp < timeout) {
        console.log('💾 Usando perfil do cache (válido por mais', Math.round((timeout - (Date.now() - cachedData.timestamp)) / 1000), 'segundos)')
        return cachedData.data
      } else {
        console.log('⏰ Cache expirado, recarregando perfil...')
      }
    }
    
    // Criar promise e armazenar para evitar chamadas duplicadas
    const fetchPromise = (async () => {
      const startTime = Date.now()
      const caller = new Error().stack.split('\n')[3]?.trim() || 'unknown'
      try {
        console.log('⏳ [PERF] Iniciando carregamento de perfil...', userId)
        console.log('🔍 [PERF] Chamado por:', caller.substring(0, 100))
        
        // Buscar perfil básico com timeout mais generoso
        const queryStartTime = Date.now()
        const profilePromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        
        console.log('📤 [PERF] Query enviada, aguardando resposta...')
        
        // Timeout reduzido: 3 segundos (RLS otimizado!)
        const profileResult = await Promise.race([
          profilePromise,
          new Promise((_, reject) => 
            setTimeout(() => {
              const elapsed = Date.now() - queryStartTime
              console.error(`❌ [PERF] TIMEOUT após ${elapsed}ms - Query profiles demorou demais!`)
              reject(new Error('Profile timeout'))
            }, 3000)
          )
        ])
        
        const queryTime = Date.now() - queryStartTime
        console.log(`✅ [PERF] Perfil básico carregado em ${queryTime}ms`)

        // Verificar erro
        if (profileResult?.error) {
          if (profileResult.error.code === 'PGRST116') {
            console.warn('⚠️ Perfil não encontrado, criando perfil básico')
            const basicProfile = {
              id: userId,
              email: user?.email || 'usuário@sistema.com',
              full_name: null,
              role: 'user',
              user_companies: []
            }
            return basicProfile
          }
          
          throw profileResult.error
        }

        const profileData = profileResult.data
        
        console.log(`📊 [PERF] Total até perfil básico: ${Date.now() - startTime}ms`)

        // Retornar perfil básico IMEDIATAMENTE para não travar a UI
        const basicProfile = {
          ...profileData,
          user_companies: [] // Será preenchido em background
        }

        // Cache global temporário
        globalProfileCache.set(cacheKey, {
          data: basicProfile,
          timestamp: Date.now()
        })
        
        console.log('🚀 [PERF] Retornando perfil básico, carregando empresas em background...')

        // Carregar empresas em background (não bloqueia)
        setTimeout(async () => {
          try {
            const companiesStartTime = Date.now()
            console.log('🏢 [PERF] Iniciando carregamento de empresas...')
            
            const { data: userCompaniesData, error: ucError } = await supabase
              .from('user_companies')
              .select('id, role, is_active, permissions, company_id')
              .eq('user_id', userId)
              .eq('is_active', true)
            
            console.log(`📤 [PERF] user_companies carregado em ${Date.now() - companiesStartTime}ms`)
            
            if (ucError) {
              console.warn('⚠️ Erro ao buscar user_companies:', ucError.message)
              return
            }

            let enrichedUserCompanies = []
            
            if (userCompaniesData?.length > 0) {
              const companyIds = userCompaniesData.map(uc => uc.company_id)
              
              const companiesQueryStart = Date.now()
              const { data: companiesData, error: compError } = await supabase
                .from('companies')
                .select('id, name')
                .in('id', companyIds)
              
              console.log(`📤 [PERF] companies carregado em ${Date.now() - companiesQueryStart}ms`)
              
              if (compError) {
                console.warn('⚠️ Erro ao buscar companies:', compError.message)
              }
              
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

            const totalTime = Date.now() - companiesStartTime
            console.log(`🏢 [PERF] Empresas carregadas em ${totalTime}ms - Total geral: ${Date.now() - startTime}ms`)
            
            globalProfileCache.set(cacheKey, {
              data: fullProfile,
              timestamp: Date.now()
            })
            
            setProfile(fullProfile)

          } catch (error) {
            console.warn('⚠️ Erro ao carregar empresas em background:', error.message)
          }
        }, 100) // Carrega empresas após 100ms

        return basicProfile

      } catch (error) {
        const errorMsg = error.message || 'Erro desconhecido'
        console.warn('⚠️ [PERF] Erro ao buscar perfil:', errorMsg)
        
        // Verificar se é erro de rede/conexão
        const isNetworkError = errorMsg.includes('Failed to fetch') || 
                              errorMsg.includes('NetworkError') ||
                              errorMsg.includes('timeout') ||
                              error.message === 'Profile timeout'
        
        if (isNetworkError) {
          console.error('🌐 [PERF] ERRO DE REDE DETECTADO - Problema de conexão com Supabase')
        }
        
        // SEMPRE tentar usar o perfil do cache primeiro
        const existingCache = globalProfileCache.get(cacheKey)
        if (existingCache && existingCache.data) {
          console.log('✅ Usando perfil do cache devido a erro:', existingCache.data?.email)
          
          // Se foi erro de rede/timeout, tentar recarregar em background com retry
          if (isNetworkError) {
            console.log('🔄 Erro de rede detectado, tentando recarregar com retry...')
            
            let retryCount = 0
            const maxRetries = 3
            
            const retryFetch = async () => {
              retryCount++
              console.log(`🔄 Tentativa ${retryCount}/${maxRetries} de recarregar perfil...`)
              
              try {
                const { data: retryData, error: retryError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', userId)
                  .single()
                
                if (retryError) throw retryError
                
                if (retryData) {
                  console.log('✅ Perfil recarregado com sucesso em background!')
                  globalProfileCache.set(cacheKey, {
                    data: retryData,
                    timestamp: Date.now()
                  })
                  setProfile(retryData)
                }
              } catch (retryError) {
                console.warn(`⚠️ Tentativa ${retryCount} falhou:`, retryError.message)
                
                // Tentar novamente se não excedeu o limite
                if (retryCount < maxRetries) {
                  const delay = retryCount * 2000 // 2s, 4s, 6s
                  console.log(`⏳ Aguardando ${delay/1000}s antes da próxima tentativa...`)
                  setTimeout(retryFetch, delay)
                } else {
                  console.error('❌ Todas as tentativas de retry falharam. Usando cache.')
                }
              }
            }
            
            // Começar retry após 2 segundos
            setTimeout(retryFetch, 2000)
          }
          
          // Retornar cache sem tentar recarregar (evita loops)
          return existingCache.data
        }
        
        // Se não tem cache, tentar buscar pelo email (último recurso)
        const userEmail = user?.email
        
        if (userEmail) {
          try {
            console.log('🔍 Tentando buscar perfil pelo email como fallback:', userEmail)
            const { data: profileByEmail } = await supabase
              .from('profiles')
              .select(`
                id,
                email,
                full_name,
                role,
                user_companies (
                  id,
                  company_id,
                  is_active,
                  role,
                  companies (
                    id,
                    name
                  )
                )
              `)
              .eq('email', userEmail)
              .maybeSingle() // Usa maybeSingle para não dar erro se não encontrar
            
            if (profileByEmail) {
              console.log('✅ Perfil encontrado pelo email')
              // Salvar no cache
              globalProfileCache.set(cacheKey, {
                data: profileByEmail,
                timestamp: Date.now()
              })
              return profileByEmail
            }
          } catch (emailError) {
            console.warn('⚠️ Erro ao buscar por email:', emailError.message)
          }
        }
        
        // Último recurso: retornar null e deixar a UI decidir
        console.warn('❌ Não foi possível carregar perfil, retornando null')
        return null
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
    console.log('@@@@@@@@@ SIGNIN CHAMADO - VERSAO NOVA @@@@@@@@@')
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      console.log('@@@@@@@@@ LOGIN BEM SUCEDIDO, user.id:', data.user?.id)

      // Buscar perfil após login bem-sucedido
      if (data.user) {
        console.log('>>> ANTES DE CHAMAR updateUserActivity, userId:', data.user.id)
        // Atualizar dados de atividade (login tracking) - usando função externa
        updateUserActivity(supabase, data.user.id)
        console.log('>>> DEPOIS DE CHAMAR updateUserActivity')
        
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
    if (!profile) {
      return false
    }
    
    const roleArray = Array.isArray(roles) ? roles : [roles]
    
    // Super admin tem todas as permissões de role
    if (profile.role === 'super_admin') {
      return true
    }
    
    // Verificar role global
    if (roleArray.includes(profile.role)) {
      return true
    }
    
    // Verificar roles nas empresas
    const companyRoleMatch = profile.user_companies?.some(uc => {
      return uc.is_active && roleArray.includes(uc.role)
    })
    
    return companyRoleMatch || false
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

  // Monitoramento limpo de cache (sem logs excessivos)
  useEffect(() => {
    const interval = setInterval(() => {
      // Limpar entradas antigas do cache
      for (const [key, value] of globalProfileCache.entries()) {
        if (Date.now() - value.timestamp > 60000) { // 1 minuto
          globalProfileCache.delete(key)
        }
      }
    }, 30000) // A cada 30 segundos
    
    return () => clearInterval(interval)
  }, [])

  // Efeito para monitorar mudanças de autenticação  
  useEffect(() => {
    let mounted = true
    
    // Verificar sessão atual de forma otimizada
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      if (currentUser) {
        // Verificar cache primeiro para loading instantâneo
        const cacheKey = `profile_${currentUser.id}`
        const cachedProfile = globalProfileCache.get(cacheKey)
        
        if (cachedProfile?.data) {
          console.log('⚡ [PERF] Perfil carregado do cache instantaneamente')
          setProfile(cachedProfile.data)
          setLoading(false)
          
          // Atualizar em background APENAS se cache estiver velho (>2min)
          const cacheAge = Date.now() - cachedProfile.timestamp
          if (cacheAge > 120000) {
            console.log('🔄 [PERF] Cache antigo (>2min), atualizando em background...')
            fetchProfile(currentUser.id, false).catch(err => 
              console.warn('⚠️ Erro ao atualizar cache:', err.message)
            )
          } else {
            console.log(`✅ [PERF] Cache recente (${Math.round(cacheAge/1000)}s), sem necessidade de atualizar`)
          }
        } else {
          // Verificar se já tem um carregamento em andamento
          if (isFirstLoadInProgress) {
            console.log('⏭️ [PERF] Primeiro carregamento já em andamento, aguardando...')
            setLoading(false)
            return
          }
          
          console.log('📥 [PERF] Cache vazio, buscando perfil pela primeira vez...')
          isFirstLoadInProgress = true
          
          // Buscar perfil de forma não-bloqueante
          fetchProfile(currentUser.id)
            .then((profile) => {
              if (mounted) {
                setProfile(profile)
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
                isFirstLoadInProgress = false
              }
            })
        }
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
        
        console.log('🔐 [PERF] Auth event:', event)
        
        // Ignorar primeira chamada de inicialização (sempre dá timeout)
        if (isInitializingAuth && event === 'INITIAL_SESSION') {
          console.log('⏭️ [PERF] Ignorando callback de inicialização...')
          isInitializingAuth = false
          return
        }
        
        const currentUser = session?.user ?? null
        
        // Ignorar eventos de renovação de token que não mudam o usuário
        if (event === 'TOKEN_REFRESHED' && currentUser?.id === user?.id) {
          console.log('🔄 Token renovado, mantendo perfil atual')
          return
        }
        
        // Evitar recarregamentos desnecessários para SIGNED_IN repetidos
        if (currentUser?.id === user?.id && event === 'SIGNED_IN') {
          console.log('✅ Usuário já está logado, ignorando SIGNED_IN duplicado')
          return
        }
        
        // Marcar inicialização como concluída
        isInitializingAuth = false
        
        // Atualizar usuário apenas se mudou
        if (currentUser?.id !== user?.id) {
          setUser(currentUser)
        }
        
        // Só recarregar o perfil se o usuário mudou realmente OU se não temos perfil
        if (currentUser && (currentUser.id !== user?.id || !profile)) {
          isFirstLoadInProgress = true
          
          // Evitar chamar fetchProfile se já está sendo chamado
          if (!pendingFetches.current[currentUser.id]) {
            const userProfile = await fetchProfile(currentUser.id)
            if (mounted && userProfile) {
              setProfile(userProfile)
            }
            isFirstLoadInProgress = false
          } else {
            console.log('⏳ Fetch de perfil já em andamento, aguardando...')
            // Aguardar o fetch pendente
            try {
              const userProfile = await pendingFetches.current[currentUser.id]
              if (mounted && userProfile) {
                setProfile(userProfile)
              }
            } catch (error) {
              console.warn('⚠️ Erro ao aguardar fetch pendente:', error.message)
            }
            isFirstLoadInProgress = false
          }
          
          // Registrar login quando usuário faz sign in
          if (event === 'SIGNED_IN' && currentUser) {
            console.log('✅ SIGNED_IN event - registrando login para userId:', currentUser.id)
            updateUserActivity(supabase, currentUser.id)
          }
        } else if (!currentUser) {
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
      // Resetar flag quando componente desmontar
      isInitializingAuth = true
      isFirstLoadInProgress = false
    }
  }, []) // Removido user da dependência para evitar loops

  // Função para recarregar o perfil atual
  const refreshProfile = async () => {
    if (!user?.id) return null
    
    try {
      // Limpar cache global antes de buscar novamente
      const cacheKey = `profile_${user.id}`
      globalProfileCache.delete(cacheKey)
      
      // Buscar perfil atualizado forçando bypass do cache
      const updatedProfile = await fetchProfile(user.id, false)
      
      if (updatedProfile && updatedProfile.email !== 'carregando@sistema.com') {
        setProfile(updatedProfile)
        return updatedProfile
      }
      return null
    } catch (error) {
      console.error('❌ Erro ao recarregar perfil:', error)
      return null
    }
  }

  // Sistema preventivo contra degradação de perfil (DESABILITADO - causando loops)
  // COMENTADO: Este sistema estava causando re-renders infinitos e lentidão
  // A degradação temporária durante carregamento é aceitável
  
  // const profileRecoveryAttempts = useRef(0)
  // const lastRecoveryTime = useRef(0)

  // Sistema de cache preventivo (DESABILITADO - causando queries excessivas)
  // COMENTADO: Renovação a cada 3s estava causando muitas queries desnecessárias
  // O cache atual de 30s é suficiente
  
  // React.useEffect(() => {
  //   if (!user?.id || !profile) return
  //   const preventiveRefresh = setInterval(() => {
  //     fetchProfile(user.id, false)
  //   }, 30000)
  //   return () => clearInterval(preventiveRefresh)
  // }, [user, profile])

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
