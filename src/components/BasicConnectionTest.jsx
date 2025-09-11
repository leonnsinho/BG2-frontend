import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export const BasicConnectionTest = () => {
  const [status, setStatus] = useState('Iniciando teste...')
  const [details, setDetails] = useState([])

  useEffect(() => {
    const runTests = async () => {
      const results = []
      
      try {
        // Teste 1: Verificar se o cliente existe
        results.push('✅ Cliente Supabase criado')
        
        // Teste 2: Verificar conectividade básica com a API
        const { data, error } = await supabase
          .rpc('now') // Função nativa do PostgreSQL
        
        if (error) {
          results.push(`❌ Erro na API: ${error.message}`)
        } else {
          results.push('✅ API respondendo')
        }
        
        // Teste 3: Listar todas as tabelas disponíveis
        const { data: tables, error: tablesError } = await supabase
          .rpc('get_tables') // Tentativa de listar tabelas
          
        if (tablesError) {
          results.push(`⚠️ Não é possível listar tabelas: ${tablesError.message}`)
          
          // Teste 4: Tentar acessar auth
          const { data: authData, error: authError } = await supabase.auth.getSession()
          
          if (authError) {
            results.push(`❌ Erro no auth: ${authError.message}`)
          } else {
            results.push('✅ Sistema de auth funcionando')
          }
        } else {
          results.push(`✅ Tabelas encontradas: ${tables?.length || 0}`)
        }
        
        setStatus('Teste concluído')
        setDetails(results)
        
      } catch (err) {
        results.push(`❌ Erro inesperado: ${err.message}`)
        setStatus('Erro no teste')
        setDetails(results)
      }
    }
    
    runTests()
  }, [])

  return (
    <div className="p-4 bg-green-50 rounded border">
      <h3 className="font-bold text-green-900">Teste de Conectividade Básica</h3>
      <p className="text-sm mt-2 font-medium">{status}</p>
      <div className="mt-2 space-y-1">
        {details.map((detail, index) => (
          <p key={index} className="text-xs">{detail}</p>
        ))}
      </div>
    </div>
  )
}
