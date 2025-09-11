import React, { useState } from 'react'
import { supabase } from '../services/supabase'

export function DirectSupabaseTest() {
  const [result, setResult] = useState('Clique em "Testar" para verificar conexão')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setResult('Testando conexão...')

    try {
      console.log('🧪 Testando conexão direta com Supabase...')
      
      // 1. Testar conexão básica mais simples
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)

      if (testError) {
        setResult(`❌ Erro RLS/Conexão: ${testError.message}\n\nCódigo: ${testError.code}\n\nDetalhes: ${testError.details}\n\n⚠️ EXECUTE O SCRIPT emergency-fix-rls.sql NO SUPABASE!`)
        return
      }

      // 2. Testar busca específica do usuário
      const userId = '5e6690c4-1809-4d27-bfbf-e35eb16d770b'
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          setResult(`⚠️ Perfil não encontrado para ${userId}\n\n📋 Execute emergency-fix-rls.sql para criar o perfil`)
        } else {
          setResult(`❌ Erro ao buscar perfil: ${profileError.message}\n\nCódigo: ${profileError.code}`)
        }
        return
      }

      setResult(`✅ SUCESSO! Perfil encontrado:\n\nNome: ${profileData.full_name}\nEmail: ${profileData.email}\nRole: ${profileData.role}\nID: ${profileData.id}`)

    } catch (error) {
      setResult(`❌ Erro catch: ${error.message}\n\n🚨 Problema de rede ou RLS`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-md">
      <h3 className="font-bold text-sm mb-2">Teste Direto Supabase</h3>
      
      <button
        onClick={testConnection}
        disabled={loading}
        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testando...' : 'Testar Conexão'}
      </button>
      
      <div className="mt-2 text-xs bg-gray-50 p-2 rounded max-h-32 overflow-auto">
        <pre>{result}</pre>
      </div>
    </div>
  )
}
