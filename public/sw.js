// Simple Service Worker - With Push Notification Support
self.addEventListener('install', (event) => {
  console.log('Service Worker installed')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated')
  event.waitUntil(clients.claim())
})

// ============ PUSH NOTIFICATION HANDLER ============
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)
  
  let data = {}
  try {
    data = event.data?.json() || {}
  } catch (e) {
    data = { title: 'Restoran Kita', body: 'New notification' }
  }
  
  const options = {
    body: data.body || 'New notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    sound: '/sound/notification.mp3',
    data: {
      url: data.url || '/'
    },
    requireInteraction: true
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Restoran Kita', options)
  )
})

// ============ NOTIFICATION CLICK HANDLER ============
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  
  event.notification.close()
  
  const urlToOpen = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})