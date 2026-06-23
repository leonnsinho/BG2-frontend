import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'module'
import path from 'path'

const require = createRequire(import.meta.url)

// Funções Netlify disponíveis (nome → caminho do arquivo)
const NETLIFY_FUNCTIONS = {
  'send-invite-email': './netlify/functions/send-invite-email.js',
  'supabase-proxy': './netlify/functions/supabase-proxy.js',
}

// Plugin que serve Netlify Functions localmente em dev (npm run dev)
function netlifyFunctionsDevPlugin() {
  return {
    name: 'netlify-functions-dev',
    configureServer(server) {
      // Registrar middleware para cada função
      for (const [name, modulePath] of Object.entries(NETLIFY_FUNCTIONS)) {
        server.middlewares.use(`/.netlify/functions/${name}`, (req, res) => {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', async () => {
            try {
              // Limpa o cache para pegar mudanças no arquivo
              delete require.cache[require.resolve(modulePath)]
              const { handler } = require(modulePath)

              // Montar query string a partir da URL (necessário para supabase-proxy)
              const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
              const queryStringParameters = {}
              url.searchParams.forEach((value, key) => { queryStringParameters[key] = value })

              const event = {
                httpMethod: req.method,
                body,
                headers: req.headers,
                queryStringParameters,
              }
              const result = await handler(event, {})

              // Determinar Content-Type da resposta
              const contentType =
                result.headers?.['Content-Type'] ||
                result.headers?.['content-type'] ||
                'application/json'

              // Headers da resposta
              const responseHeaders = { 'Content-Type': contentType }
              if (result.headers) {
                for (const [key, value] of Object.entries(result.headers)) {
                  if (key.toLowerCase() !== 'content-type') {
                    responseHeaders[key] = value
                  }
                }
              }

              res.writeHead(result.statusCode, responseHeaders)
              res.end(result.body)
            } catch (err) {
              console.error(`[netlify-functions-dev] Erro em ${name}:`, err)
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: err.message }))
            }
          })
        })
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), netlifyFunctionsDevPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
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
