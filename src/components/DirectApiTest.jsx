import React, { useState, useEffect } from 'react'

export const DirectApiTest = () => {
  const [status, setStatus] = useState('Testando conexão direta...')
  const [error, setError] = useState(null)

  useEffect(() => {
    const testDirectConnection = async () => {
      try {
        const url = 'https://ecmgbinyotuxhiniadom.supabase.co'
        const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbWdiaW55b3R1eGhpbmlhZG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NTA1NzksImV4cCI6MjA3MzEyNjU3OX0.rN5erJupCKJpJ8cdVy-ECF69kZfao6O_QHOd_DriTxM'
        
        // Teste com fetch direto para a API REST
        const response = await fetch(`${url}/rest/v1/`, {
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          setStatus('✅ API REST acessível diretamente')
          
          // Agora tenta acessar profiles
          const profilesResponse = await fetch(`${url}/rest/v1/profiles`, {
            headers: {
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (profilesResponse.ok) {
            setStatus('✅ Tabela profiles acessível!')
          } else {
            const errorText = await profilesResponse.text()
            setStatus('⚠️ API ok, mas problema com tabela profiles')
            setError(errorText)
          }
          
        } else {
          setStatus('❌ Não conseguiu acessar a API')
          setError(`Status: ${response.status}`)
        }
        
      } catch (err) {
        setStatus('❌ Erro de rede')
        setError(err.message)
      }
    }
    
    testDirectConnection()
  }, [])

  return (
    <div className="p-4 bg-purple-50 rounded border">
      <h3 className="font-bold text-purple-900">Teste Direto da API</h3>
      <p className="text-sm mt-2">{status}</p>
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}
