// Service Worker para PWA
const CACHE_NAME = 'bg2-v5' // Incrementar para forçar atualização
const APP_VERSION = '2.3.7' // Incrementar quando houver updates - IMPORTANTE: Mudar isso dispara atualização!
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.png'
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

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retorna a resposta do cache
        if (response) {
          return response
        }

        // Clone da requisição
        const fetchRequest = event.request.clone()

        return fetch(fetchRequest).then((response) => {
          // Verifica se a resposta é válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Clone da resposta
          const responseToCache = response.clone()

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache)
            })

          return response
        })
      })
  )
})
