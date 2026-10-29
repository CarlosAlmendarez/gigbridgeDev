// Service worker de GigBridge.
//
// - Instalable + push (port de GigBridge/gigbridge/public/sw.js).
// - Sin conexión (Fase 3, versión mínima): las páginas de la gira (/tour/*)
//   van "network-first": con red se sirven frescas y se guardan; sin red se
//   sirve la última copia guardada. components/tour/TourOffline.tsx precarga
//   las secciones de la fecha abierta y de la siguiente para que estén
//   disponibles aunque no se hayan visitado. Los archivos de /_next/static
//   son inmutables (llevan hash) y van "cache-first".
//
// Las copias tienen datos del usuario: la página de login borra
// PAGES_CACHE al montarse (cerrar sesión siempre termina ahí), para que
// otra persona en el mismo teléfono no vea la gira de la anterior.

const PAGES_CACHE = 'gb-pages-v1'
const STATIC_CACHE = 'gb-static-v1'
const KNOWN = [PAGES_CACHE, STATIC_CACHE]

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('gb-') && !KNOWN.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

function isTourPage(request, url) {
  if (!url.pathname.startsWith('/tour/')) return false
  // Navegación del navegador o la precarga de TourOffline (Accept: text/html).
  // Las peticiones RSC de Next (header RSC) no se guardan: sin red, Next cae
  // a una navegación completa y esa sí sale de aquí.
  if (request.headers.get('RSC')) return false
  return request.mode === 'navigate' || (request.headers.get('Accept') || '').includes('text/html')
}

async function networkFirst(request) {
  const cache = await caches.open(PAGES_CACHE)
  try {
    const response = await fetch(request)
    // Solo copias buenas de la página pedida: una redirección (sesión
    // vencida → login) o un error no deben pisar la última buena.
    if (response.ok && !response.redirected) {
      await cache.put(new URL(request.url).pathname, response.clone())
    }
    return response
  } catch (err) {
    const cached = await cache.match(new URL(request.url).pathname)
    if (cached) return cached
    throw err
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) await cache.put(request, response.clone())
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request))
  } else if (isTourPage(request, url)) {
    event.respondWith(networkFirst(request))
  }
})

self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon/192',
      badge: '/icon/192',
      data: { url: data.url || '/' },
      tag: data.tag || 'gigbridge-notification',
      renotify: true,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
