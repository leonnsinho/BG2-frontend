import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export const SimpleSupabaseTest = () => {
  const [status, setStatus] = useState('Testando...')
  const [error, setError] = useState(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🔍 Testando conexão simples...')
        
        // Teste mais simples - apenas verificar se o client foi criado
        if (!supabase) {
          setStatus('❌ Cliente Supabase não criado')
          return
        }
        
        // Testar com uma query simples
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .limit(1)
        
        if (error) {
          console.log('Erro encontrado:', error)
          if (error.message.includes('relation "public.profiles" does not exist')) {
            setStatus('⚠️ Conectado mas tabelas não existem')
            setError('Execute o script setup.sql no Supabase')
          } else {
            setStatus('❌ Erro de conexão')
            setError(error.message)
          }
        } else {
          setStatus('✅ Conectado e tabelas encontradas!')
          console.log('Dados encontrados:', data)
        }
        
      } catch (err) {
        console.error('Erro no teste:', err)
        setStatus('❌ Erro inesperado')
        setError(err.message)
      }
    }
    
    testConnection()
  }, [])

  return (
    <div className="p-4 bg-blue-50 rounded border">
      <h3 className="font-bold text-blue-900">Teste Simples Supabase</h3>
      <p className="text-sm mt-2">{status}</p>
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}
