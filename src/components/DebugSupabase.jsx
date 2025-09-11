import React, { useEffect, useRef } from 'react'

export const DebugSupabase = () => {
  const hasRun = useRef(false)
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  useEffect(() => {
    // Executar apenas uma vez
    if (hasRun.current) return
    hasRun.current = true
    
    console.log('Debug from component:')
    console.log('URL:', url)
    console.log('Key:', key ? 'EXISTS' : 'MISSING')
    console.log('All env:', import.meta.env)
  }, [url, key])
  
  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="font-bold">Debug Variables:</h3>
      <p><strong>URL:</strong> {url || 'UNDEFINED'}</p>
      <p><strong>Key:</strong> {key ? 'EXISTS' : 'MISSING'}</p>
      <p><strong>Mode:</strong> {import.meta.env.MODE}</p>
      <p><strong>Dev:</strong> {import.meta.env.DEV ? 'true' : 'false'}</p>
    </div>
  )
}
