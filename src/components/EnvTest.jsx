import { useEffect, useRef } from 'react'

export default function EnvTest() {
  const hasRun = useRef(false)
  
  useEffect(() => {
    // Executar apenas uma vez
    if (hasRun.current) return
    hasRun.current = true
    
    console.log('🔍 Teste de Variáveis de Ambiente:')
    console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
    console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING')
    console.log('Todas as env:', import.meta.env)
    
    // Teste direto das variáveis
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!url) {
      console.error('❌ VITE_SUPABASE_URL está undefined')
    } else if (url.includes('your-project-id')) {
      console.error('❌ VITE_SUPABASE_URL ainda tem placeholder')
    } else {
      console.log('✅ VITE_SUPABASE_URL carregada corretamente:', url)
    }
    
    if (!key) {
      console.error('❌ VITE_SUPABASE_ANON_KEY está undefined')
    } else {
      console.log('✅ VITE_SUPABASE_ANON_KEY carregada corretamente')
    }
  }, [])

  return (
    <div className="bg-blue-50 p-4 rounded-lg mb-4">
      <h3 className="font-bold text-blue-800 mb-2">🔍 Teste de Variáveis de Ambiente</h3>
      <div className="text-sm">
        <p><strong>URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'UNDEFINED'}</p>
        <p><strong>Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING'}</p>
        <p><strong>Mode:</strong> {import.meta.env.MODE}</p>
        <p><strong>DEV:</strong> {import.meta.env.DEV ? 'true' : 'false'}</p>
      </div>
    </div>
  )
}
