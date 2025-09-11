import React, { useState } from 'react'
import { supabase } from '../services/supabase'

export default function CreateTestUsers() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])

  const testUsers = [
    {
      email: 'superadmin@teste.com',
      password: 'super123',
      fullName: 'Super Administrador',
      role: 'super_admin'
    },
    {
      email: 'consultor@teste.com',
      password: 'consultor123',
      fullName: 'Consultor Partimap',
      role: 'consultant'
    },
    {
      email: 'admin@empresa.com',
      password: 'admin123',
      fullName: 'Admin da Empresa',
      role: 'company_admin'
    },
    {
      email: 'usuario@empresa.com',
      password: 'user123',
      fullName: 'Usuário Comum',
      role: 'user'
    }
  ]

  const createUsers = async () => {
    setLoading(true)
    setStatus('🔄 Criando usuários de teste...')
    setResults([])

    const userResults = []

    for (const user of testUsers) {
      try {
        console.log(`🔄 Criando usuário: ${user.email}`)
        
        // Tentar criar usuário via Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: user.email,
          password: user.password,
          options: {
            data: {
              full_name: user.fullName,
              role: user.role
            },
            emailRedirectTo: undefined // Evitar confirmação de email
          }
        })

        if (error) {
          if (error.message.includes('User already registered')) {
            // Usuário já existe, tentar criar perfil se não existir
            await createProfileForExistingUser(user)
            userResults.push({
              email: user.email,
              status: '⚠️ Já existe',
              message: 'Usuário já registrado, perfil verificado'
            })
          } else {
            userResults.push({
              email: user.email,
              status: '❌ Erro',
              message: error.message
            })
          }
        } else {
          // Usuário criado com sucesso, criar perfil
          if (data.user) {
            await createProfile(data.user.id, user)
            userResults.push({
              email: user.email,
              status: '✅ Criado',
              message: `ID: ${data.user?.id}`,
              userId: data.user?.id
            })
          }
        }
        
        // Pequena pausa entre criações
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (err) {
        userResults.push({
          email: user.email,
          status: '❌ Erro',
          message: err.message
        })
      }
    }

    setResults(userResults)
    setStatus('✅ Processo concluído!')
    setLoading(false)
  }

  const createProfile = async (userId, user) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: user.email,
          full_name: user.fullName,
          role: user.role
        })
      
      if (error) {
        console.error('Erro ao criar perfil:', error)
      } else {
        console.log('✅ Perfil criado:', user.email)
      }
    } catch (err) {
      console.error('Erro ao criar perfil:', err)
    }
  }

  const createProfileForExistingUser = async (user) => {
    try {
      // Buscar o usuário no auth para pegar o ID
      const { data: { users }, error } = await supabase.auth.admin.listUsers()
      
      if (error) {
        console.error('Erro ao buscar usuários:', error)
        return
      }
      
      const existingUser = users.find(u => u.email === user.email)
      
      if (existingUser) {
        await createProfile(existingUser.id, user)
      }
    } catch (err) {
      console.error('Erro ao processar usuário existente:', err)
    }
  }

  const testLogin = async (email, password) => {
    try {
      setStatus(`🔄 Testando login: ${email}`)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        alert(`❌ Erro no login: ${error.message}`)
      } else {
        alert(`✅ Login bem-sucedido! Usuário: ${data.user.email}`)
        // Fazer logout para não interferir nos outros testes
        await supabase.auth.signOut()
      }
    } catch (err) {
      alert(`❌ Erro: ${err.message}`)
    }
    setStatus('')
  }

  const checkProfiles = async () => {
    try {
      setStatus('🔍 Verificando perfis...')
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('email', testUsers.map(u => u.email))

      if (error) {
        alert(`❌ Erro ao verificar perfis: ${error.message}`)
      } else {
        console.log('Perfis encontrados:', data)
        alert(`✅ Encontrados ${data.length} perfis na base de dados`)
      }
    } catch (err) {
      alert(`❌ Erro: ${err.message}`)
    }
    setStatus('')
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <h3 className="font-bold text-green-800 mb-2">👥 Criar Usuários de Teste</h3>
      
      <div className="text-sm mb-3">
        <p><strong>Status:</strong> {status}</p>
      </div>

      <div className="flex gap-2 mb-3">
        <button 
          onClick={createUsers}
          disabled={loading}
          className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? '⏳ Criando...' : '🚀 Criar Usuários'}
        </button>
        
        <button 
          onClick={checkProfiles}
          className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          🔍 Verificar Perfis
        </button>
      </div>

      {results.length > 0 && (
        <div className="mb-3">
          <h4 className="font-bold text-sm mb-2">Resultados:</h4>
          <div className="space-y-1">
            {results.map((result, index) => (
              <div key={index} className="text-xs bg-white p-2 rounded border">
                <span className="font-mono">{result.email}</span>
                <span className="ml-2">{result.status}</span>
                <span className="ml-2 text-gray-600">{result.message}</span>
                {result.status === '✅ Criado' && (
                  <button 
                    onClick={() => testLogin(result.email, testUsers.find(u => u.email === result.email)?.password)}
                    className="ml-2 px-2 py-1 bg-blue-400 text-white rounded text-xs hover:bg-blue-500"
                  >
                    🧪 Testar Login
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <details className="text-xs">
        <summary className="cursor-pointer text-gray-600">Ver credenciais de teste</summary>
        <div className="mt-2 bg-gray-100 p-2 rounded">
          {testUsers.map((user, index) => (
            <div key={index} className="font-mono text-xs mb-1">
              <strong>{user.role}:</strong> {user.email} / {user.password}
              <button 
                onClick={() => testLogin(user.email, user.password)}
                className="ml-2 px-1 py-0.5 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
              >
                🧪 Testar
              </button>
            </div>
          ))}
        </div>
      </details>

      <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
        <p className="font-bold text-yellow-800">💡 Instruções:</p>
        <p className="text-yellow-700">
          1. Execute primeiro o script <code>create-test-profiles.sql</code> no Supabase<br/>
          2. Clique em "Criar Usuários" para registrar via Auth API<br/>
          3. Use "Testar Login" para verificar se funcionam
        </p>
      </div>
    </div>
  )
}
