// Service Worker para PWA
const CACHE_NAME = 'bg2-v6' // Incrementar para forçar atualização
const APP_VERSION = '3.0.25' // Incrementar quando houver updates - IMPORTANTE: Mudar isso dispara atualização!
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

// Interceptar requisições - Estratégia Network First com fallback para cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Ignora requisições que não são HTTP/HTTPS (extensões do Chrome, etc)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return
  }
  
  // Sempre buscar do servidor para recursos críticos
  if (NEVER_CACHE.some(path => url.pathname.endsWith(path))) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    )
    return
  }

  // Estratégia: Network First (tenta rede primeiro, fallback para cache)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Verifica se a resposta é válida
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Ignora URLs que não são HTTP/HTTPS (como chrome-extension://)
        const requestUrl = new URL(event.request.url)
        if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') {
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
      .catch(() => {
        // Se falhar na rede, tenta cache
        return caches.match(event.request)
      })
  )
})
