// src/utils/notification.js

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported in this browser')
    return false
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('Service Worker registered successfully:', registration)
    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return false
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    console.log('Notification permission already granted')
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    console.log('Notification permission:', permission)
    return permission === 'granted'
  }

  console.log('Notification permission denied')
  return false
}

export async function sendNotification(title, body, url) {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported')
    // Fallback to browser notification
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon-192.png' })
    }
    return
  }

  const registration = await navigator.serviceWorker.ready
  
  registration.showNotification(title, {
    body: body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: url },
    requireInteraction: true
  })
}

export async function initNotifications() {
  await registerServiceWorker()
  await requestNotificationPermission()
}