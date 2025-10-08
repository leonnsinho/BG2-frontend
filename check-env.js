// Script para verificar variáveis de ambiente
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔍 Verificando configuração de ambiente...\n')

// Ler arquivo .env
const envPath = path.join(__dirname, '.env')
console.log('📁 Caminho do .env:', envPath)

if (fs.existsSync(envPath)) {
  console.log('✅ Arquivo .env encontrado\n')
  
  const envContent = fs.readFileSync(envPath, 'utf-8')
  const lines = envContent.split('\n')
  
  console.log('📋 Variáveis encontradas no .env:\n')
  
  lines.forEach(line => {
    line = line.trim()
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=')
      const value = valueParts.join('=')
      
      if (key.includes('RESEND') || key.includes('EMAIL')) {
        if (key.includes('API_KEY')) {
          console.log(`   ${key}: ${value.substring(0, 10)}...***`)
        } else {
          console.log(`   ${key}: ${value}`)
        }
      }
    }
  })
  
  console.log('\n⚠️  IMPORTANTE:')
  console.log('   Para que o Vite carregue estas variáveis, você precisa:')
  console.log('   1. Parar o servidor (Ctrl+C)')
  console.log('   2. Executar: npm run dev')
  console.log('   3. Recarregar a página no navegador')
  
} else {
  console.log('❌ Arquivo .env não encontrado!')
  console.log('   Crie o arquivo .env na raiz do projeto')
}

console.log('\n✨ Verificação concluída!')
