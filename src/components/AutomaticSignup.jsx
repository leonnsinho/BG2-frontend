import React, { useState } from 'react'
import { supabase } from '../services/supabase'

export default function AutomaticSignup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'user'
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success' | 'error'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // 1. Registrar usuário no Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role
          }
        }
      })

      if (error) {
        throw error
      }

      if (data.user) {
        // 2. O trigger deve criar o perfil automaticamente
        // Vamos aguardar um pouco e verificar
        setTimeout(async () => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', formData.email)
              .single()

            if (profile) {
              setMessage(`✅ Usuário criado com sucesso! Perfil: ${profile.full_name} (${profile.role})`)
              setMessageType('success')
              
              // Limpar formulário
              setFormData({
                email: '',
                password: '',
                fullName: '',
                role: 'user'
              })
            } else {
              setMessage('⚠️ Usuário criado, mas perfil não foi encontrado. Verifique o trigger.')
              setMessageType('error')
            }
          } catch (err) {
            setMessage(`⚠️ Usuário criado, mas erro ao verificar perfil: ${err.message}`)
            setMessageType('error')
          }
        }, 1000)
      }

    } catch (err) {
      setMessage(`❌ Erro ao criar usuário: ${err.message}`)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const testQuickSignup = async () => {
    const testData = {
      email: 'teste' + Date.now() + '@exemplo.com',
      password: 'teste123',
      fullName: 'Usuário Teste',
      role: 'user'
    }

    setFormData(testData)
    
    // Aguardar um pouco e submeter automaticamente
    setTimeout(() => {
      document.getElementById('signup-form').requestSubmit()
    }, 100)
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <h3 className="font-bold text-green-800 mb-2">🚀 Signup Automático</h3>
      
      <form id="signup-form" onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email:
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Senha:
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome Completo:
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Perfil:
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="user">Usuário</option>
            <option value="company_admin">Admin da Empresa</option>
            <option value="consultant">Consultor</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? '⏳ Criando...' : '🚀 Criar Conta'}
          </button>

          <button
            type="button"
            onClick={testQuickSignup}
            className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            🧪 Teste Rápido
          </button>
        </div>
      </form>

      {message && (
        <div className={`mt-3 p-2 rounded text-sm ${
          messageType === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-300' 
            : 'bg-red-100 text-red-800 border border-red-300'
        }`}>
          {message}
        </div>
      )}

      <div className="mt-3 p-2 bg-blue-100 border border-blue-300 rounded text-xs">
        <p className="font-bold text-blue-800">💡 Como funciona:</p>
        <p className="text-blue-700">
          1. Usuário preenche formulário de registro<br/>
          2. Sistema cria conta no Supabase Auth automaticamente<br/>
          3. Trigger cria perfil na tabela profiles automaticamente<br/>
          4. Usuário pode fazer login imediatamente
        </p>
      </div>
    </div>
  )
}
