import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export const FinalTest = () => {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const runFinalTest = async () => {
      const testResults = []
      
      try {
        // Teste 1: Verificar variáveis de ambiente
        const envUrl = import.meta.env.VITE_SUPABASE_URL
        const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        
        testResults.push({
          step: 'Variáveis ENV',
          status: envUrl && envKey ? 'success' : 'error',
          message: envUrl && envKey ? `URL: ${envUrl?.slice(0, 30)}...` : 'Variáveis não carregadas'
        })

        // Teste 2: Verificar cliente Supabase
        testResults.push({
          step: 'Cliente Supabase',
          status: supabase ? 'success' : 'error',
          message: supabase ? 'Cliente criado com sucesso' : 'Falha ao criar cliente'
        })

        // Teste 3: Testar autenticação (mais básico)
        const { data: session, error: sessionError } = await supabase.auth.getSession()
        testResults.push({
          step: 'Auth Service',
          status: sessionError ? 'error' : 'success',
          message: sessionError ? `Erro: ${sessionError.message}` : 'Serviço de auth funcionando'
        })

        // Teste 4: Testar API REST básica (sem tabelas específicas)
        try {
          const response = await fetch(`${envUrl || 'https://ecmgbinyotuxhiniadom.supabase.co'}/rest/v1/`, {
            headers: {
              'apikey': envKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbWdiaW55b3R1eGhpbmlhZG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NTA1NzksImV4cCI6MjA3MzEyNjU3OX0.rN5erJupCKJpJ8cdVy-ECF69kZfao6O_QHOd_DriTxM',
              'Authorization': `Bearer ${envKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbWdiaW55b3R1eGhpbmlhZG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NTA1NzksImV4cCI6MjA3MzEyNjU3OX0.rN5erJupCKJpJ8cdVy-ECF69kZfao6O_QHOd_DriTxM'}`
            }
          })
          
          testResults.push({
            step: 'API REST',
            status: response.ok ? 'success' : 'warning',
            message: response.ok ? `API acessível (${response.status})` : `Status: ${response.status}`
          })
        } catch (apiError) {
          testResults.push({
            step: 'API REST',
            status: 'error',
            message: `Erro de rede: ${apiError.message}`
          })
        }

        // Teste 5: Tentar acessar profiles apenas se API estiver ok
        if (testResults[testResults.length - 1].status !== 'error') {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('count')
              .limit(1)
              
            if (error) {
              testResults.push({
                step: 'Tabela Profiles',
                status: error.code === 'PGRST116' ? 'warning' : 'error',
                message: error.code === 'PGRST116' ? 'Tabela não existe - execute SQL' : error.message
              })
            } else {
              testResults.push({
                step: 'Tabela Profiles',
                status: 'success',
                message: 'Tabela acessível e funcionando!'
              })
            }
          } catch (tableError) {
            testResults.push({
              step: 'Tabela Profiles',
              status: 'error',
              message: `Erro inesperado: ${tableError.message}`
            })
          }
        }

        setResults(testResults)
        setLoading(false)

      } catch (globalError) {
        testResults.push({
          step: 'Erro Global',
          status: 'error',
          message: globalError.message
        })
        setResults(testResults)
        setLoading(false)
      }
    }

    runFinalTest()
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      default: return '🔄'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-700 bg-green-50'
      case 'warning': return 'text-yellow-700 bg-yellow-50'
      case 'error': return 'text-red-700 bg-red-50'
      default: return 'text-gray-700 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 rounded border">
        <h3 className="font-bold text-blue-900">🔍 Executando Teste Final...</h3>
        <p className="text-sm mt-2">Verificando todas as conexões...</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-gray-50 rounded border">
      <h3 className="font-bold text-gray-900 mb-3">🧪 Resultado do Teste Final</h3>
      <div className="space-y-2">
        {results.map((result, index) => (
          <div key={index} className={`p-2 rounded text-sm ${getStatusColor(result.status)}`}>
            <div className="font-medium">
              {getStatusIcon(result.status)} {result.step}
            </div>
            <div className="text-xs mt-1">{result.message}</div>
          </div>
        ))}
      </div>
      
      {results.some(r => r.status === 'warning') && (
        <div className="mt-3 p-3 bg-yellow-100 rounded text-sm text-yellow-800">
          <strong>⚠️ Próximo passo:</strong><br/>
          1. Execute o arquivo <code>simple-setup.sql</code> no SQL Editor do Supabase<br/>
          2. Isso criará apenas a estrutura da tabela (sem dados)<br/>
          3. Depois teste a conexão novamente
        </div>
      )}
      
      {results.every(r => r.status === 'success') && (
        <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-800">
          <strong>🎉 Sucesso!</strong> Todas as conexões estão funcionando!
        </div>
      )}
    </div>
  )
}
