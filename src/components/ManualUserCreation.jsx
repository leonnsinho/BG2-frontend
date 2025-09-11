import React, { useState } from 'react'
import { supabase } from '../services/supabase'

export default function ManualUserCreation() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(false)

  const testUsers = [
    { email: 'superadmin@teste.com', password: 'super123', role: 'super_admin', name: 'Super Administrador' },
    { email: 'consultor@teste.com', password: 'consultor123', role: 'consultant', name: 'Consultor Partimap' },
    { email: 'admin@empresa.com', password: 'admin123', role: 'company_admin', name: 'Admin da Empresa' },
    { email: 'usuario@empresa.com', password: 'user123', role: 'user', name: 'Usuário Comum' }
  ]

  const checkProfiles = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('email', testUsers.map(u => u.email))

      if (error) {
        console.error('Erro ao buscar perfis:', error)
        alert(`❌ Erro: ${error.message}`)
      } else {
        setProfiles(data || [])
        console.log('Perfis encontrados:', data)
      }
    } catch (err) {
      console.error('Erro:', err)
      alert(`❌ Erro: ${err.message}`)
    }
    setLoading(false)
  }

  const testLogin = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        alert(`❌ Login falhou: ${error.message}`)
      } else {
        alert(`✅ Login bem-sucedido! Usuário: ${data.user.email}`)
        await supabase.auth.signOut()
      }
    } catch (err) {
      alert(`❌ Erro: ${err.message}`)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('📋 Copiado para clipboard!')
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
      <h3 className="font-bold text-orange-800 mb-2">👨‍💼 Criação Manual de Usuários</h3>
      
      <div className="text-sm mb-3">
        <p className="text-orange-700">
          Due a problemas de RLS, use a criação manual no Supabase Dashboard.
        </p>
      </div>

      <div className="flex gap-2 mb-3">
        <button 
          onClick={checkProfiles}
          disabled={loading}
          className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '⏳ Verificando...' : '🔍 Verificar Perfis'}
        </button>
      </div>

      {profiles.length > 0 && (
        <div className="mb-3">
          <h4 className="font-bold text-sm mb-2">Perfis Encontrados ({profiles.length}):</h4>
          <div className="space-y-1">
            {profiles.map((profile, index) => (
              <div key={index} className="text-xs bg-white p-2 rounded border flex justify-between items-center">
                <span>
                  <strong>{profile.email}</strong> - {profile.full_name} ({profile.role})
                </span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => copyToClipboard(profile.id)}
                    className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                  >
                    📋 ID
                  </button>
                  <button 
                    onClick={() => {
                      const user = testUsers.find(u => u.email === profile.email)
                      if (user) testLogin(user.email, user.password)
                    }}
                    className="px-2 py-1 bg-green-400 text-white rounded text-xs hover:bg-green-500"
                  >
                    🧪 Testar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-yellow-100 border border-yellow-300 rounded p-3 text-xs">
        <h4 className="font-bold text-yellow-800 mb-2">📋 INSTRUÇÕES MANUAL:</h4>
        
        <div className="mb-2">
          <p className="font-bold">1. Execute primeiro o script SQL:</p>
          <code className="bg-gray-200 px-1 rounded">disable-rls-create-profiles.sql</code>
        </div>

        <div className="mb-2">
          <p className="font-bold">2. Vá para Supabase Dashboard → Authentication → Users</p>
        </div>

        <div className="mb-2">
          <p className="font-bold">3. Para cada usuário, clique "Add user" e configure:</p>
          <ul className="ml-4 mt-1">
            <li>• <strong>Email:</strong> [usar da lista abaixo]</li>
            <li>• <strong>Password:</strong> [usar da lista abaixo]</li>
            <li>• <strong>Auto Confirm User:</strong> ✅ YES</li>
            <li>• <strong>User UUID:</strong> [copiar do perfil correspondente]</li>
          </ul>
        </div>

        <div className="mb-2">
          <p className="font-bold">4. Credenciais para criar:</p>
          {testUsers.map((user, index) => (
            <div key={index} className="ml-4 font-mono text-xs flex justify-between items-center bg-white p-1 rounded mb-1">
              <span>{user.email} | {user.password}</span>
              <button 
                onClick={() => copyToClipboard(`${user.email} | ${user.password}`)}
                className="px-1 py-0.5 bg-gray-300 rounded hover:bg-gray-400"
              >
                📋
              </button>
            </div>
          ))}
        </div>

        <p className="font-bold text-green-700">
          ✅ Após criar todos, use "Verificar Perfis" e "Testar" para confirmar!
        </p>
      </div>
    </div>
  )
}
