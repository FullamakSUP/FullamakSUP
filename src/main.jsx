import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'
import { initNotifications } from './utils/notification'

// ============================================================
// COMPLETE TRANSLATIONS
// ============================================================
const translations = {
  // Toast messages
  success: { en: 'Success!', ms: 'Berjaya!' },
  error: { en: 'Error!', ms: 'Ralat!' },
  loading: { en: 'Loading...', ms: 'Memuatkan...' },
  notification_enabled: { en: '🔔 Notifications enabled!', ms: '🔔 Notifikasi diaktifkan!' },
  notification_disabled: { en: '🔕 Notifications disabled', ms: '🔕 Notifikasi dimatikan' },
  notification_permission: { en: 'Please allow notifications for order alerts', ms: 'Sila benarkan notifikasi untuk makluman pesanan' },
  app_ready: { en: '🚀 App is ready!', ms: '🚀 App sedia!' },
}

const t = (key, lang = 'en') => {
  if (!translations[key]) return key
  return translations[key][lang] || translations[key].en || key
}

// ============================================================
// GET LANGUAGE FROM STORAGE
// ============================================================
const getStoredLanguage = () => {
  try {
    return localStorage.getItem('language') || 'en'
  } catch {
    return 'en'
  }
}

// ============================================================
// INITIALIZE NOTIFICATIONS WITH BETTER HANDLING
// ============================================================
const initNotificationsWithLogging = async () => {
  try {
    console.log('🔔 Initializing push notifications...')
    
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn('⚠️ This browser does not support desktop notifications')
      return
    }

    // Check notification permission
    if (Notification.permission === 'granted') {
      console.log('✅ Notification permission already granted')
      const lang = getStoredLanguage()
      console.log(`🔔 ${t('notification_enabled', lang)}`)
    } else if (Notification.permission === 'denied') {
      console.warn('⚠️ Notification permission denied by user')
      const lang = getStoredLanguage()
      console.log(`🔕 ${t('notification_disabled', lang)}`)
    } else {
      // Request permission
      console.log('📢 Requesting notification permission...')
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted!')
        const lang = getStoredLanguage()
        console.log(`🔔 ${t('notification_enabled', lang)}`)
        
        // Send test notification
        try {
          new Notification('🔔 KedaiPOS', {
            body: t('notification_permission', lang),
            icon: '/logo192.png',
            silent: true
          })
        } catch (e) {
          console.warn('⚠️ Could not send test notification:', e)
        }
      } else {
        console.warn('⚠️ Notification permission denied')
        const lang = getStoredLanguage()
        console.log(`🔕 ${t('notification_disabled', lang)}`)
      }
    }
  } catch (error) {
    console.error('❌ Error initializing notifications:', error)
  }
}

// ============================================================
// SERVICE WORKER REGISTRATION (for PWA)
// ============================================================
const registerServiceWorker = async () => {
  try {
    if ('serviceWorker' in navigator) {
      console.log('📦 Registering service worker...')
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      console.log('✅ Service Worker registered successfully!', registration)
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          console.log('🔄 New Service Worker found!')
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New content available, please refresh!')
              // Could show a toast notification here
            }
          })
        }
      })
      
      return registration
    } else {
      console.warn('⚠️ Service Workers not supported in this browser')
      return null
    }
  } catch (error) {
    console.error('❌ Error registering service worker:', error)
    return null
  }
}

// ============================================================
// CUSTOM TOASTER WITH DARK/LIGHT MODE SUPPORT
// ============================================================
const CustomToaster = () => {
  // Get theme from localStorage for initial render
  const getTheme = () => {
    try {
      return localStorage.getItem('theme') || 'light'
    } catch {
      return 'light'
    }
  }
  
  const theme = getTheme()
  const isDark = theme === 'dark'
  
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName="toaster-container"
      containerStyle={{
        top: 20,
        right: 20,
      }}
      toastOptions={{
        duration: 3500,
        style: {
          background: isDark ? '#1a1a2e' : '#ffffff',
          color: isDark ? '#e8edf5' : '#0f172a',
          borderRadius: '16px',
          padding: '14px 20px',
          boxShadow: isDark 
            ? '0 8px 32px rgba(0,0,0,0.5)' 
            : '0 8px 32px rgba(0,0,0,0.08)',
          border: isDark ? '1px solid rgba(71,85,105,0.3)' : '1px solid rgba(203,213,225,0.4)',
          fontSize: '14px',
          fontWeight: '500',
          maxWidth: '400px',
          backdropFilter: 'blur(12px)',
        },
        success: {
          duration: 3500,
          iconTheme: {
            primary: '#22c55e',
            secondary: isDark ? '#1a1a2e' : '#ffffff',
          },
          style: {
            borderLeft: '4px solid #22c55e',
          },
        },
        error: {
          duration: 4500,
          iconTheme: {
            primary: '#ef4444',
            secondary: isDark ? '#1a1a2e' : '#ffffff',
          },
          style: {
            borderLeft: '4px solid #ef4444',
          },
        },
        loading: {
          duration: Infinity,
          iconTheme: {
            primary: '#3b82f6',
            secondary: isDark ? '#1a1a2e' : '#ffffff',
          },
        },
        blank: {
          style: {
            background: isDark ? '#1a1a2e' : '#ffffff',
            color: isDark ? '#e8edf5' : '#0f172a',
          },
        },
      }}
    />
  )
}

// ============================================================
// MAIN RENDER
// ============================================================
console.log('🚀 Starting KedaiPOS...')

// Initialize notifications
initNotificationsWithLogging()

// Register service worker for PWA
if (import.meta.env.PROD) {
  registerServiceWorker()
}

// Log app version
const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0'
console.log(`📦 KedaiPOS v${appVersion}`)

// Log environment
console.log(`🌍 Environment: ${import.meta.env.MODE}`)

// Get root element
const rootElement = document.getElementById('root')

if (!rootElement) {
  console.error('❌ Root element not found!')
  throw new Error('Root element not found')
}

// Render app
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <CustomToaster />
          <App />
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)

// ============================================================
// HANDLE UNCAUGHT ERRORS
// ============================================================
window.addEventListener('error', (event) => {
  console.error('❌ Uncaught error:', event.error || event.message)
  
  // Optional: Send to error tracking service
  // reportError(event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason)
  
  // Optional: Send to error tracking service
  // reportError(event.reason)
})

// ============================================================
// HANDLE OFFLINE/ONLINE STATUS
// ============================================================
window.addEventListener('online', () => {
  console.log('🌐 App is online')
  const lang = getStoredLanguage()
  toast.success(t('app_ready', lang))
})

window.addEventListener('offline', () => {
  console.warn('⚠️ App is offline')
  const lang = getStoredLanguage()
  toast.error('📡 ' + (lang === 'ms' ? 'Tiada sambungan internet!' : 'No internet connection!'))
})

console.log('✅ KedaiPOS initialized successfully!')

// ============================================================
// EXPORT FOR TESTING
// ============================================================
export { initNotificationsWithLogging, registerServiceWorker }