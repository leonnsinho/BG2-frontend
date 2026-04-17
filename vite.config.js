import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

// Plugin que serve a Netlify Function localmente em dev (npm run dev)
function netlifyFunctionsDevPlugin() {
  return {
    name: 'netlify-functions-dev',
    configureServer(server) {
      server.middlewares.use('/.netlify/functions/send-invite-email', (req, res) => {
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            // Limpa o cache para pegar mudanças no arquivo
            delete require.cache[require.resolve('./netlify/functions/send-invite-email.js')]
            const { handler } = require('./netlify/functions/send-invite-email.js')
            const event = { httpMethod: req.method, body, headers: req.headers }
            const result = await handler(event, {})
            res.writeHead(result.statusCode, { 'Content-Type': 'application/json' })
            res.end(result.body)
          } catch (err) {
            console.error('[netlify-functions-dev]', err)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), netlifyFunctionsDevPlugin()],
  envDir: './',
  envPrefix: 'VITE_',
  build: {
    // Otimizações de build
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          router: ['react-router-dom'],
          ui: ['lucide-react']
        }
      }
    }
  },
  server: {
    // Configurações do servidor de desenvolvimento
    port: 5173,
    open: true
  },
  preview: {
    port: 4173
  }
})
