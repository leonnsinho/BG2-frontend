// Service Worker para PWA
const CACHE_NAME = 'bg2-v8' // Incrementar para forçar atualização
const APP_VERSION = '4.0.1.0' // Incrementar quando houver updates - IMPORTANTE: Mudar isso dispara atualização!
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.png'
]

// Lista de recursos que NUNCA devem ser cacheados (sempre buscar do servidor)
const NEVER_CACHE = [
  '/sw.js',
  '/index.html'
]

// Armazenar versão no cache para comparação
const VERSION_KEY = 'app-version-cache'

// Notificar clientes sobre nova versão disponível
function notifyClients(message) {
  self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
    console.log(`📢 Notificando ${clients.length} clientes`, message)
    clients.forEach(client => {
      client.postMessage(message)
    })
  })
}

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalando versão:', APP_VERSION)
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto')
        // Armazenar versão no cache
        return cache.put(VERSION_KEY, new Response(APP_VERSION))
          .then(() => cache.addAll(urlsToCache))
      })
      .then(() => {
        console.log('⏭️ Pulando waiting...')
        return self.skipWaiting()
      })
  )
})

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker ativado versão:', APP_VERSION)
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deletando cache antigo:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('👑 Assumindo controle de todos os clientes')
        return self.clients.claim()
      })
      .then(() => {
        console.log('📣 Notificando clientes sobre nova versão:', APP_VERSION)
        notifyClients({
          type: 'NEW_VERSION',
          version: APP_VERSION,
          timestamp: Date.now(),
          source: 'activate'
        })
      })
  )
})

// Listener para mensagens dos clientes
self.addEventListener('message', (event) => {
  console.log('📨 Mensagem recebida:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏭️ Cliente pediu skip waiting')
    self.skipWaiting()
  }
  
  // Responder com versão atual quando solicitado
  if (event.data && event.data.type === 'GET_VERSION') {
    console.log('❓ Cliente perguntou versão, respondendo:', APP_VERSION)
    event.ports[0].postMessage({
      type: 'VERSION_RESPONSE',
      version: APP_VERSION,
      cacheName: CACHE_NAME
    })
  }
  
  // Verificar se há atualização disponível
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    console.log('🔍 Cliente pediu verificação de atualização')
    event.ports[0].postMessage({
      type: 'VERSION_RESPONSE',
      version: APP_VERSION,
      cacheName: CACHE_NAME
    })
  }
})

// Hosts que nunca devem ser interceptados (APIs externas)
const PASSTHROUGH_HOSTS = [
  'supabase.co',
  'supabase.in',
  'amazonaws.com',
  'googleapis.com',
  'resend.com',
]

// Interceptar requisições - Estratégia Network First com fallback para cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Ignora requisições que não são HTTP/HTTPS (extensões do Chrome, etc)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return
  }

  // Nunca interceptar chamadas de API externas (Supabase, AWS, etc.)
  // Deixar o browser tratar diretamente para evitar erros de Response
  if (PASSTHROUGH_HOSTS.some(host => url.hostname.includes(host))) {
    return
  }

  // Sempre buscar do servidor para recursos críticos
  if (NEVER_CACHE.some(path => url.pathname.endsWith(path))) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request).then(r => r || new Response('', { status: 503 })))
    )
    return
  }

  // Estratégia: Network First (tenta rede primeiro, fallback para cache)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Verifica se a resposta é válida para cachear (somente same-origin)
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clone da resposta para cachear
        const responseToCache = response.clone()

        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache)
          })

        return response
      })
      .catch(async () => {
        // Se falhar na rede, tenta cache
        // IMPORTANTE: caches.match pode retornar undefined — nunca passar undefined para respondWith
        const cached = await caches.match(event.request)
        if (cached) return cached

        // Para navegação SPA, retornar index.html do cache como fallback
        if (event.request.mode === 'navigate') {
          const indexCache = await caches.match('/index.html')
          if (indexCache) return indexCache
        }

        // Fallback final: resposta de erro válida
        return new Response('Network error - content unavailable offline', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        })
      })
  )
})
