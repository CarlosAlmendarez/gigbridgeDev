// Service worker de GigBridge.
//
// Fase 1 (hoy): solo existe para que la app sea instalable y para recibir
// push (port de GigBridge/gigbridge/public/sw.js). NO cachea nada todavía:
// la caché offline del day sheet (día actual y siguiente, solo lectura)
// es Fase 3 del plan y se agrega aquí con su propia estrategia.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
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
