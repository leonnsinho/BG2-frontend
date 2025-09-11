import { supabase } from '../services/supabase.js'

// Função para testar a conexão com Supabase
export const testSupabaseConnection = async () => {
  try {
    console.log('🔍 Testando conexão com Supabase...')
    
    // Testar conexão básica
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro de conexão:', error.message)
      return {
        success: false,
        error: error.message,
        needsSetup: error.code === 'PGRST116' // Tabela não existe
      }
    }
    
    console.log('✅ Conexão com Supabase estabelecida!')
    return {
      success: true,
      tablesExist: true
    }
    
  } catch (err) {
    console.error('❌ Erro inesperado:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

// Função para verificar se as tabelas estão criadas
export const checkDatabaseSetup = async () => {
  try {
    console.log('🔍 Verificando setup das tabelas...')
    
    const tables = ['profiles', 'companies', 'user_companies']
    const results = {}
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1)
        
        results[table] = {
          exists: !error,
          error: error?.message
        }
        
        if (!error) {
          console.log(`✅ Tabela '${table}' encontrada`)
        } else {
          console.log(`❌ Tabela '${table}' não encontrada:`, error.message)
        }
        
      } catch (err) {
        results[table] = {
          exists: false,
          error: err.message
        }
        console.log(`❌ Erro ao verificar tabela '${table}':`, err.message)
      }
    }
    
    return results
    
  } catch (err) {
    console.error('❌ Erro ao verificar database setup:', err)
    return { error: err.message }
  }
}

// Função para criar um usuário de teste
export const createTestUser = async (email, password, fullName) => {
  try {
    console.log('👤 Criando usuário de teste...')
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })
    
    if (error) {
      console.error('❌ Erro ao criar usuário:', error.message)
      return { success: false, error: error.message }
    }
    
    console.log('✅ Usuário criado com sucesso!')
    return { success: true, user: data.user }
    
  } catch (err) {
    console.error('❌ Erro inesperado ao criar usuário:', err)
    return { success: false, error: err.message }
  }
}

// Função para fazer login de teste
export const testLogin = async (email, password) => {
  try {
    console.log('🔐 Testando login...')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('❌ Erro no login:', error.message)
      return { success: false, error: error.message }
    }
    
    console.log('✅ Login realizado com sucesso!')
    return { success: true, session: data.session }
    
  } catch (err) {
    console.error('❌ Erro inesperado no login:', err)
    return { success: false, error: err.message }
  }
}

// Função principal para testar tudo
export const runFullTest = async () => {
  console.log('🚀 Iniciando teste completo do Supabase...')
  
  // 1. Testar conexão
  const connectionTest = await testSupabaseConnection()
  if (!connectionTest.success) {
    if (connectionTest.needsSetup) {
      console.log('⚠️ As tabelas precisam ser criadas. Execute o script setup.sql no Supabase.')
    }
    return connectionTest
  }
  
  // 2. Verificar tabelas
  const dbSetup = await checkDatabaseSetup()
  
  // 3. Verificar se há usuários para testar login
  const { data: currentUser } = await supabase.auth.getUser()
  
  return {
    connection: connectionTest,
    database: dbSetup,
    currentUser: currentUser?.user || null
  }
}
