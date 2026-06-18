// ============================================================
// NOTIFICATION UTILITY - Fullamak SUP POS System
// ============================================================

/**
 * Check if notifications are supported in this browser
 */
export function isNotificationSupported() {
  return 'Notification' in window
}

/**
 * Check if Service Worker and Push Manager are supported
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

// ============================================================
// SERVICE WORKER REGISTRATION
// ============================================================

/**
 * Register the service worker for push notifications
 * @returns {Promise<ServiceWorkerRegistration|boolean>}
 */
export async function registerServiceWorker() {
  if (!isPushSupported()) {
    console.warn('⚠️ Push notifications not supported in this browser')
    return false
  }

  try {
    // Check if service worker is already registered
    const existingRegistration = await navigator.serviceWorker.getRegistration()
    if (existingRegistration) {
      console.log('✅ Service Worker already registered:', existingRegistration)
      return existingRegistration
    }

    // Register new service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })
    
    console.log('✅ Service Worker registered successfully:', registration)
    
    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        console.log('🔄 New Service Worker found, updating...')
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('✅ New Service Worker installed, ready for updates')
          }
        })
      }
    })
    
    return registration
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error)
    return false
  }
}

// ============================================================
// NOTIFICATION PERMISSION
// ============================================================

/**
 * Request notification permission from the user
 * @param {boolean} showPrompt - Show a prompt if permission not granted
 * @returns {Promise<boolean>}
 */
export async function requestNotificationPermission(showPrompt = true) {
  if (!isNotificationSupported()) {
    console.warn('⚠️ Notifications not supported in this browser')
    return false
  }

  // Check current permission state
  const currentPermission = Notification.permission
  
  if (currentPermission === 'granted') {
    console.log('✅ Notification permission already granted')
    return true
  }

  if (currentPermission === 'denied') {
    console.warn('❌ Notification permission denied by user')
    return false
  }

  // Permission is 'default' - ask for permission
  if (showPrompt) {
    console.log('📢 Requesting notification permission...')
    try {
      const permission = await Notification.requestPermission()
      console.log(`📢 Notification permission: ${permission}`)
      
      if (permission === 'granted') {
        // Send a test notification to confirm
        try {
          new Notification('🔔 Notifications Enabled', {
            body: 'You will now receive order notifications',
            icon: '/icon-192.png',
            silent: true
          })
        } catch (e) {
          // Ignore test notification errors
        }
        return true
      }
      
      return false
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error)
      return false
    }
  }

  return false
}

// ============================================================
// SEND NOTIFICATION
// ============================================================

/**
 * Send a notification to the user
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {string} url - URL to open when notification is clicked
 * @param {Object} options - Additional notification options
 * @returns {Promise<boolean>}
 */
export async function sendNotification(title, body, url, options = {}) {
  if (!title || !body) {
    console.warn('⚠️ Notification title and body are required')
    return false
  }

  // Default notification options
  const defaultOptions = {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    silent: false,
    tag: `notification-${Date.now()}`,
    data: { url: url || '/' }
  }

  const notificationOptions = { ...defaultOptions, ...options }

  try {
    // Try using Service Worker first
    if (isPushSupported()) {
      const registration = await navigator.serviceWorker.ready
      if (registration) {
        await registration.showNotification(title, {
          ...notificationOptions,
          body: body,
          data: { 
            ...notificationOptions.data,
            url: url || '/',
            timestamp: Date.now()
          }
        })
        console.log(`✅ Notification sent via Service Worker: "${title}"`)
        return true
      }
    }

    // Fallback to browser notification
    if (isNotificationSupported() && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        ...notificationOptions,
        body: body
      })
      
      // Handle click event
      notification.onclick = (event) => {
        event.preventDefault()
        notification.close()
        if (url) {
          window.open(url, '_blank')
        }
        if (notificationOptions.data?.onClick) {
          notificationOptions.data.onClick()
        }
      }
      
      console.log(`✅ Notification sent via browser: "${title}"`)
      return true
    }

    console.warn('⚠️ Unable to send notification - no supported method')
    return false
    
  } catch (error) {
    console.error('❌ Error sending notification:', error)
    return false
  }
}

// ============================================================
// INITIALIZE NOTIFICATIONS
// ============================================================

/**
 * Initialize notifications - register service worker and request permission
 * @param {Object} options - Initialization options
 * @param {boolean} options.requestPermission - Whether to request permission
 * @param {boolean} options.autoRegister - Whether to auto-register service worker
 * @returns {Promise<{success: boolean, registration: ServiceWorkerRegistration|null, permission: boolean}>}
 */
export async function initNotifications(options = {}) {
  const { 
    requestPermission = true, 
    autoRegister = true 
  } = options

  console.log('🔔 Initializing notifications...')

  let registration = null
  let permission = false

  // Register service worker
  if (autoRegister && isPushSupported()) {
    registration = await registerServiceWorker()
  }

  // Request permission
  if (requestPermission && isNotificationSupported()) {
    permission = await requestNotificationPermission()
  }

  // Log result
  const status = {
    success: registration !== false || permission === true,
    registration: registration || null,
    permission: permission,
    supported: {
      notifications: isNotificationSupported(),
      push: isPushSupported()
    }
  }

  console.log(`🔔 Notifications initialized: ${status.success ? '✅' : '❌'}`, {
    permission: status.permission ? 'granted' : 'denied',
    serviceWorker: status.registration ? 'registered' : 'not registered'
  })

  return status
}

// ============================================================
// CHECK NOTIFICATION STATUS
// ============================================================

/**
 * Get current notification status
 * @returns {Object}
 */
export function getNotificationStatus() {
  const status = {
    supported: isNotificationSupported(),
    pushSupported: isPushSupported(),
    permission: isNotificationSupported() ? Notification.permission : 'unsupported',
    serviceWorker: 'serviceWorker' in navigator ? !!navigator.serviceWorker.controller : false
  }
  
  console.log('📊 Notification status:', status)
  return status
}

// ============================================================
// UNREGISTER SERVICE WORKER
// ============================================================

/**
 * Unregister the service worker
 * @returns {Promise<boolean>}
 */
export async function unregisterServiceWorker() {
  if (!isPushSupported()) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      const unregistered = await registration.unregister()
      if (unregistered) {
        console.log('✅ Service Worker unregistered successfully')
      } else {
        console.warn('⚠️ Failed to unregister Service Worker')
      }
      return unregistered
    }
    console.log('ℹ️ No Service Worker to unregister')
    return true
  } catch (error) {
    console.error('❌ Error unregistering Service Worker:', error)
    return false
  }
}

// ============================================================
// TEST NOTIFICATION
// ============================================================

/**
 * Send a test notification to verify setup
 * @param {string} url - URL to open on click
 * @returns {Promise<boolean>}
 */
export async function sendTestNotification(url = '/') {
  const title = '🔔 Test Notification'
  const body = 'Your notification system is working correctly!'
  return sendNotification(title, body, url, {
    vibrate: [100, 50, 100],
    requireInteraction: false,
    silent: false
  })
}

// ============================================================
// SHOW ORDER NOTIFICATION
// ============================================================

/**
 * Send an order notification
 * @param {Object} order - Order data
 * @param {string} type - Notification type (new, ready, completed)
 */
export async function sendOrderNotification(order, type = 'new') {
  const orderNumber = order.order_number || `ORD-${order.id}`
  const customerName = order.customer_name || 'Guest'
  const itemCount = order.items?.length || 0
  
  const notifications = {
    new: {
      title: '🆕 New Order!',
      body: `Order ${orderNumber} - ${customerName} (${itemCount} items)`,
      url: '/staff'
    },
    ready: {
      title: '✅ Order Ready!',
      body: `Order ${orderNumber} - ${customerName} is ready for pickup`,
      url: '/staff'
    },
    completed: {
      title: '📦 Order Completed',
      body: `Order ${orderNumber} - ${customerName} has been completed`,
      url: '/kitchen'
    }
  }

  const notification = notifications[type] || notifications.new
  return sendNotification(notification.title, notification.body, notification.url)
}