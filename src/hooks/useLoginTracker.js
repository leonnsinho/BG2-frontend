import { useEffect } from 'react'
import { supabase } from '../services/supabase'

/**
 * Hook para registrar automaticamente o login do usuário
 * Deve ser usado no componente raiz após autenticação
 */
export const useLoginTracker = (user) => {
  useEffect(() => {
    const registerLogin = async () => {
      if (!user?.id) return

      try {
        // Obter informações do navegador
        const userAgent = navigator.userAgent
        
        // Tentar obter IP (funciona apenas em alguns casos)
        let ipAddress = null
        try {
          const response = await fetch('https://api.ipify.org?format=json')
          const data = await response.json()
          ipAddress = data.ip
        } catch (error) {
          console.log('Não foi possível obter IP:', error)
        }

        // Registrar o login no banco de dados
        const { error } = await supabase.rpc('register_user_login', {
          p_user_id: user.id,
          p_ip_address: ipAddress,
          p_user_agent: userAgent
        })

        if (error) {
          console.error('Erro ao registrar login:', error)
        } else {
          console.log('✅ Login registrado com sucesso')
        }
      } catch (error) {
        console.error('Erro no registro de login:', error)
      }
    }

    registerLogin()
  }, [user?.id])
}

/**
 * Hook para obter o último login de um usuário
 */
export const useLastLogin = (userId) => {
  const [lastLogin, setLastLogin] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  useEffect(() => {
    const fetchLastLogin = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.rpc('get_last_login', {
          p_user_id: userId
        })

        if (error) throw error
        setLastLogin(data)
      } catch (error) {
        console.error('Erro ao buscar último login:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLastLogin()
  }, [userId])

  return { lastLogin, loading }
}

/**
 * Hook para obter histórico de logins (7 dias)
 */
export const useLoginHistory = (userId) => {
  const [history, setHistory] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.rpc('get_user_login_history', {
          p_user_id: userId
        })

        if (error) throw error
        setHistory(data || [])
      } catch (error) {
        console.error('Erro ao buscar histórico de logins:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [userId])

  return { history, loading }
}
