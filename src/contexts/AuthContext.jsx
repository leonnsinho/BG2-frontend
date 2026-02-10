import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../services/supabase'
import { updateUserActivity } from './updateUserActivity'

const AuthContext = createContext({})

// Cache global de perfis para evitar recarregamentos desnecessários
const globalProfileCache = new Map()
const CACHE_TIMEOUT = 60000 // 60 segundos (mais longo para evitar reloads)
const CRITICAL_CACHE_TIMEOUT = 120000 // 2 minutos para perfis críticos

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
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState(null)
  const pendingFetches = useRef({}) // Controle de chamadas simultâneas

  // Buscar perfil do usuário com carregamento otimizado
  const fetchProfile = async (userId, useCache = true) => {
    if (!userId) return null
    
    // Evitar múltiplas chamadas simultâneas para o mesmo usuário
    if (pendingFetches.current[userId]) {
      try {
        return await pendingFetches.current[userId]
      } catch (error) {
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
        return cachedData.data
      }
    }
    
    // Criar promise e armazenar para evitar chamadas duplicadas
    const fetchPromise = (async () => {
      try {
        // Buscar perfil básico com timeout
        const profilePromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        
        // Timeout reduzido: 3 segundos (RLS otimizado!)
        const profileResult = await Promise.race([
          profilePromise,
          new Promise((_, reject) =>
            setTimeout(() => {
              reject(new Error('Profile timeout'))
            }, 3000)
          )
        ])

        // Verificar erro
        if (profileResult?.error) {
          if (profileResult.error.code === 'PGRST116') {
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

        // Carregar empresas em background (não bloqueia)
        setTimeout(async () => {
          try {
            const { data: userCompaniesData, error: ucError } = await supabase
              .from('user_companies')
              .select('id, role, is_active, permissions, company_id')
              .eq('user_id', userId)
              .eq('is_active', true)

            if (ucError) {
              return
            }

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
            
            setProfile(fullProfile)

          } catch (error) {
            // Silently ignore background loading errors
          }
        }, 100) // Carrega empresas após 100ms

        return basicProfile

      } catch (error) {
        const errorMsg = error.message || 'Erro desconhecido'

        // Verificar se é erro de rede/conexão
        const isNetworkError = errorMsg.includes('Failed to fetch') ||
                              errorMsg.includes('NetworkError') ||
                              errorMsg.includes('timeout') ||
                              error.message === 'Profile timeout'

        // SEMPRE tentar usar o perfil do cache primeiro
        const existingCache = globalProfileCache.get(cacheKey)
        if (existingCache && existingCache.data) {
          // Se foi erro de rede/timeout, tentar recarregar em background com retry
          if (isNetworkError) {
            let retryCount = 0
            const maxRetries = 3

            const retryFetch = async () => {
              retryCount++

              try {
                const { data: retryData, error: retryError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', userId)
                  .single()

                if (retryError) throw retryError

                if (retryData) {
                  // IMPORTANTE: Preservar user_companies do cache existente
                  // O retry só busca dados da tabela 'profiles', não busca empresas
                  const cachedProfile = globalProfileCache.get(cacheKey)?.data
                  const updatedProfile = {
                    ...retryData,
                    user_companies: cachedProfile?.user_companies || []
                  }

                  globalProfileCache.set(cacheKey, {
                    data: updatedProfile,
                    timestamp: Date.now()
                  })
                  setProfile(updatedProfile)

                  // Carregar empresas em background também (caso não tenha no cache)
                  if (!cachedProfile?.user_companies?.length) {
                    try {
                      const { data: userCompaniesData } = await supabase
                        .from('user_companies')
                        .select('id, role, is_active, permissions, company_id')
                        .eq('user_id', userId)
                        .eq('is_active', true)

                      if (userCompaniesData?.length > 0) {
                        const companyIds = userCompaniesData.map(uc => uc.company_id)
                        const { data: companiesData } = await supabase
                          .from('companies')
                          .select('id, name')
                          .in('id', companyIds)

                        if (companiesData) {
                          const enrichedUserCompanies = userCompaniesData.map(uc => ({
                            ...uc,
                            companies: companiesData.find(c => c.id === uc.company_id) ||
                                      { id: uc.company_id, name: 'Empresa Desconhecida' }
                          }))

                          const fullProfile = {
                            ...retryData,
                            user_companies: enrichedUserCompanies
                          }

                          globalProfileCache.set(cacheKey, {
                            data: fullProfile,
                            timestamp: Date.now()
                          })
                          setProfile(fullProfile)
                        }
                      }
                    } catch {
                      // Silently ignore company loading errors
                    }
                  }
                }
              } catch (retryError) {
                // Tentar novamente se não excedeu o limite
                if (retryCount < maxRetries) {
                  const delay = retryCount * 2000 // 2s, 4s, 6s
                  setTimeout(retryFetch, delay)
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
              // Salvar no cache
              globalProfileCache.set(cacheKey, {
                data: profileByEmail,
                timestamp: Date.now()
              })
              return profileByEmail
            }
          } catch (emailError) {
            // Silently ignore email fallback errors
          }
        }

        // Último recurso: retornar null e deixar a UI decidir
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

  // Função para traduzir erros de autenticação
  const translateAuthError = (errorMessage) => {
    const translations = {
      'Invalid login credentials': 'Email ou senha incorretos',
      'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada e confirme seu email antes de fazer login.',
      'User not found': 'Usuário não encontrado',
      'Invalid email': 'Email inválido',
      'User already registered': 'Este email já está registrado',
      'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
    }
    
    return translations[errorMessage] || errorMessage
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

      if (error) {
        const translatedError = translateAuthError(error.message)
        throw new Error(translatedError)
      }

      // Buscar perfil após login bem-sucedido
      if (data.user) {
        // Atualizar dados de atividade (login tracking) - usando função externa
        updateUserActivity(supabase, data.user.id)

        const userProfile = await fetchProfile(data.user.id)
        setProfile(userProfile)
      }

      return { user: data.user, error: null }
    } catch (error) {
      const errorMsg = error.message
      setError(errorMsg)
      return { user: null, error: errorMsg }
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
      setIsLoggingOut(true)
      setLoading(true)

      // Tentar logout no Supabase, mas não falhar se der erro
      await supabase.auth.signOut()
      // Continua com limpeza local independente do resultado

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
        // Silently ignore localStorage errors
      }

      // Aguardar 2 segundos para mostrar a tela de logout
      await new Promise(resolve => setTimeout(resolve, 2000))

    } catch (error) {
      console.error('Erro crítico no logout:', error)
      // Mesmo com erro crítico, limpar estado local
      setUser(null)
      setProfile(null)
      setError(null)
      globalProfileCache.clear()
      pendingFetches.current = {}
    } finally {
      setLoading(false)
      setIsLoggingOut(false)
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

  // Salvar usuário no localStorage para "Contas Salvas" no login
  useEffect(() => {
    if (user && profile) {
      try {
        const savedUsers = JSON.parse(localStorage.getItem('saved_users') || '[]')
        const savedPasswords = JSON.parse(localStorage.getItem('saved_passwords') || '{}')
        
        // Encontra dados existentes para preservar campos extras (como senha salva no Login)
        const existingUser = savedUsers.find(u => u.id === user.id) || {}
        
        // Tenta recuperar senha do backup se não tiver no objeto
        let encryptedPassword = existingUser.encrypted_password
        if (!encryptedPassword && user.email) {
          encryptedPassword = savedPasswords[user.email.trim().toLowerCase()]
        }

        // Remove a entrada existente para este usuário (para atualizar e mover pro topo)
        const otherUsers = savedUsers.filter(u => u.id !== user.id)
        
        // Cria objeto do usuário mantendo dados antigos e garantindo a senha
        const userData = {
          ...existingUser,
          id: user.id,
          email: user.email,
          full_name: profile.full_name || user.email,
          avatar_url: profile.avatar_url,
          last_login: new Date().toISOString(),
          encrypted_password: encryptedPassword || existingUser.encrypted_password // Reforça a persistência
        }
        
        // Adiciona ao topo e mantém apenas os últimos 5
        const newSavedUsers = [userData, ...otherUsers].slice(0, 5)
        
        localStorage.setItem('saved_users', JSON.stringify(newSavedUsers))
      } catch (error) {
        console.error('Erro ao salvar usuário no histórico:', error)
      }
    }
  }, [user, profile])

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
          setProfile(cachedProfile.data)
          setLoading(false)

          // Atualizar em background APENAS se cache estiver velho (>2min)
          const cacheAge = Date.now() - cachedProfile.timestamp
          if (cacheAge > 120000) {
            fetchProfile(currentUser.id, false).catch(() => {
              // Silently ignore cache update errors
            })
          }
        } else {
          // Verificar se já tem um carregamento em andamento
          if (isFirstLoadInProgress) {
            setLoading(false)
            return
          }

          isFirstLoadInProgress = true

          // Buscar perfil de forma não-bloqueante
          fetchProfile(currentUser.id)
            .then((profile) => {
              if (mounted) {
                setProfile(profile)
              }
            })
            .catch(() => {
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
        if (mounted) {
          setLoading(false)
        }
      }
    })

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        // Ignorar primeira chamada de inicialização (sempre dá timeout)
        if (isInitializingAuth && event === 'INITIAL_SESSION') {
          isInitializingAuth = false
          return
        }

        const currentUser = session?.user ?? null

        // Ignorar eventos de renovação de token que não mudam o usuário
        if (event === 'TOKEN_REFRESHED' && currentUser?.id === user?.id) {
          return
        }

        // Evitar recarregamentos desnecessários para SIGNED_IN repetidos
        if (currentUser?.id === user?.id && event === 'SIGNED_IN') {
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
            // Aguardar o fetch pendente
            try {
              const userProfile = await pendingFetches.current[currentUser.id]
              if (mounted && userProfile) {
                setProfile(userProfile)
              }
            } catch (error) {
              // Silently ignore pending fetch errors
            }
            isFirstLoadInProgress = false
          }

          // Registrar login quando usuário faz sign in
          if (event === 'SIGNED_IN' && currentUser) {
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
      console.error('Erro ao recarregar perfil:', error)
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
    isLoggingOut,
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
