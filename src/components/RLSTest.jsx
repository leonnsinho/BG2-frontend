import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export default function RLSTest() {
  const [status, setStatus] = useState('🔄 Testando...')
  const [error, setError] = useState(null)
  const [details, setDetails] = useState({})

  const testRLS = async () => {
    try {
      setStatus('🔄 Testando RLS da tabela profiles...')
      setError(null)

      // Teste 1: Verificar se consegue fazer SELECT
      console.log('🔍 Teste 1: SELECT na tabela profiles')
      const { data: selectData, error: selectError } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true })

      if (selectError) {
        throw new Error(`SELECT Error: ${selectError.message}`)
      }

      // Teste 2: Verificar políticas
      console.log('🔍 Teste 2: Verificando políticas RLS')
      const { data: policiesData, error: policiesError } = await supabase
        .rpc('get_table_policies', { table_name: 'profiles' })
        .single()

      console.log('Políticas:', policiesData)

      // Teste 3: Verificar se RLS está habilitado
      console.log('🔍 Teste 3: Verificando status RLS')
      const { data: rlsData, error: rlsError } = await supabase
        .rpc('check_rls_status', { table_name: 'profiles' })
        .single()

      setDetails({
        canSelect: !selectError,
        policies: policiesData || 'Não foi possível verificar',
        rlsEnabled: rlsData || 'Não foi possível verificar',
        selectError: selectError?.message,
        policiesError: policiesError?.message,
        rlsError: rlsError?.message
      })

      setStatus('✅ Teste de RLS concluído')
      
    } catch (err) {
      console.error('Erro no teste RLS:', err)
      setError(err.message)
      setStatus('❌ Erro no teste RLS')
    }
  }

  const testSimpleQuery = async () => {
    try {
      setStatus('🔄 Testando query simples...')
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)

      if (error) {
        if (error.message.includes('infinite recursion')) {
          setError('❌ RECURSÃO INFINITA DETECTADA! Execute o script fix-rls-recursion.sql')
        } else {
          setError(`Query Error: ${error.message}`)
        }
        setStatus('❌ Query falhou')
      } else {
        setStatus('✅ Query funcionou!')
        setDetails(prev => ({ ...prev, queryResult: data }))
      }
    } catch (err) {
      setError(err.message)
      setStatus('❌ Erro na query')
    }
  }

  useEffect(() => {
    testSimpleQuery()
  }, [])

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="font-bold text-yellow-800 mb-2">🔒 Teste RLS (Row Level Security)</h3>
      
      <div className="text-sm mb-2">
        <p><strong>Status:</strong> {status}</p>
        {error && (
          <p className="text-red-600 mt-1"><strong>Erro:</strong> {error}</p>
        )}
      </div>

      <div className="flex gap-2 mb-2">
        <button 
          onClick={testSimpleQuery}
          className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          Testar Query
        </button>
        <button 
          onClick={testRLS}
          className="px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
        >
          Testar RLS
        </button>
      </div>

      {Object.keys(details).length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-600">Ver detalhes</summary>
          <pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto">
            {JSON.stringify(details, null, 2)}
          </pre>
        </details>
      )}

      {error && error.includes('infinite recursion') && (
        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-sm">
          <p className="font-bold text-red-800">🚨 AÇÃO NECESSÁRIA:</p>
          <p className="text-red-700">
            Execute o arquivo <code>fix-rls-recursion.sql</code> no SQL Editor do Supabase
          </p>
        </div>
      )}
    </div>
  )
}
