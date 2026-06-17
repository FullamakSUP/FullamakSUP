import { useState, useEffect } from 'react'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'
import toast from 'react-hot-toast'
import { supabase } from './lib/supabase'

function TrackOrder() {
  const { darkMode, toggleDarkMode } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [orderNumber, setOrderNumber] = useState('')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [restaurantName, setRestaurantName] = useState('Restoran Kita')
  const [logoUrl, setLogoUrl] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  
  // Settings for auto complete display
  const [kitchenEnabled, setKitchenEnabled] = useState(true)
  const [autoCompleteEnabled, setAutoCompleteEnabled] = useState(false)
  const [autoCompleteMinutes, setAutoCompleteMinutes] = useState(5)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Modern theme colors
  const bgColor = darkMode ? '#0f0f1a' : '#f1f5f9'
  const cardBg = darkMode ? 'rgba(30, 30, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  const textColor = darkMode ? '#f1f5f9' : '#0f172a'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.6)'
  const inputBg = darkMode ? '#1e1e2e' : '#ffffff'
  const secondaryBg = darkMode ? 'rgba(30, 30, 46, 0.8)' : 'rgba(248, 250, 252, 0.9)'

  const glassEffect = {
    background: cardBg,
    backdropFilter: 'blur(12px)',
    border: `1px solid ${borderColor}`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
  }

  // Helper translations
  const getText = (key) => {
    const translations = {
      track_title: { bm: 'Jejak Pesanan Anda', en: 'Track Your Order' },
      track_subtitle: { bm: 'Masukkan nombor pesanan untuk semak status', en: 'Enter your order number to check status' },
      enter_order: { bm: 'Masukkan nombor pesanan', en: 'Enter order number' },
      searching: { bm: 'Mencari...', en: 'Searching...' },
      track: { bm: 'Jejak', en: 'Track' },
      order_not_found: { bm: 'Pesanan tidak dijumpai', en: 'Order not found' },
      check_order: { bm: 'Sila semak nombor pesanan anda', en: 'Please check your order number' },
      order_type: { bm: 'Jenis Pesanan', en: 'Order Type' },
      customer: { bm: 'Pelanggan', en: 'Customer' },
      order_items: { bm: 'Item Pesanan', en: 'Order Items' },
      total: { bm: 'Jumlah', en: 'Total' },
      estimated_time: { bm: 'Anggaran Masa Siap', en: 'Estimated Ready Time' },
      almost_ready: { bm: 'Hampir siap!', en: 'Almost ready!' },
      refresh_status: { bm: 'Muat Semula Status', en: 'Refresh Status' },
      auto_refresh: { bm: 'Muat semula automatik', en: 'Auto-refresh status' },
      order: { bm: 'Pesanan', en: 'Order' },
      at: { bm: 'pada', en: 'at' },
      table: { bm: 'Meja', en: 'Table' },
      take_away: { bm: 'Bungkus', en: 'Take Away' },
      dine_in: { bm: 'Makan di sini', en: 'Dine In' },
      guest: { bm: 'Tetamu', en: 'Guest' },
      note: { bm: 'Nota', en: 'Note' },
      auto_complete_info: { bm: 'Pesanan akan siap secara automatik dalam ~', en: 'Order will be auto completed in ~' },
      minutes: { bm: 'minit', en: 'minutes' },
      cancelled: { bm: 'Dibatalkan', en: 'Cancelled' }
    }
    return translations[key]?.[language] || translations[key]?.en || key
  }

  // Get order number from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const orderParam = urlParams.get('order')
    if (orderParam) {
      setOrderNumber(orderParam)
      loadOrder(orderParam)
    }
    loadRestaurantInfo()
    loadSettings()
  }, [])

  // Auto refresh every 10 seconds
  useEffect(() => {
    let interval
    if (autoRefresh && order && order.payment_status !== 'paid' && order.status !== 'completed' && order.status !== 'cancelled') {
      interval = setInterval(() => {
        if (orderNumber) {
          loadOrder(orderNumber, true)
        }
      }, 10000)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [autoRefresh, order, orderNumber])

  async function loadRestaurantInfo() {
    try {
      const { data: nameData } = await supabase.from('settings').select('value').eq('key', 'restaurant_name').single()
      if (nameData) setRestaurantName(nameData.value)
      
      const { data: logoData } = await supabase.from('settings').select('value').eq('key', 'logo_url').single()
      if (logoData && logoData.value) setLogoUrl(logoData.value)
    } catch (err) {
      console.error('Error loading restaurant info:', err)
    }
  }

  async function loadSettings() {
    try {
      const { data } = await supabase.from('settings').select('key, value')
      if (data) {
        const kitchen = data.find(s => s.key === 'kitchen_enabled')
        const autoComplete = data.find(s => s.key === 'auto_complete_enabled')
        const autoCompleteMin = data.find(s => s.key === 'auto_complete_minutes')
        
        if (kitchen) setKitchenEnabled(kitchen.value === 'true')
        if (autoComplete) setAutoCompleteEnabled(autoComplete.value === 'true')
        if (autoCompleteMin) setAutoCompleteMinutes(parseInt(autoCompleteMin.value) || 5)
      }
    } catch (err) {
      console.error('Error loading settings:', err)
    }
  }

  async function loadOrder(orderNum, isAutoRefresh = false) {
    if (!orderNum) return
    
    setLoading(true)
    if (!isAutoRefresh) setError('')
    
    try {
      const { data, error } = await supabase
        .from('customer_orders')
        .select('*')
        .eq('order_number', orderNum)
        .single()

      if (error || !data) {
        setError(getText('order_not_found') + '. ' + getText('check_order'))
        setOrder(null)
        if (!isAutoRefresh) {
          toast.error(getText('order_not_found'))
        }
      } else {
        setOrder(data)
        if (!isAutoRefresh && data) {
          toast.success(getText('order') + ' found!')
        }
      }
    } catch (err) {
      console.error('Error loading order:', err)
      setError('Error loading order. Please try again.')
    }
    setLoading(false)
    setSearchPerformed(true)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!orderNumber.trim()) {
      setError('Please enter an order number')
      return
    }
    loadOrder(orderNumber)
  }

  const getStatusInfo = (status) => {
    switch(status) {
      case 'pending':
        return { 
          label: language === 'bm' ? 'Menunggu' : 'Pending', 
          color: '#eab308', 
          icon: '⏳', 
          step: 1, 
          description: language === 'bm' 
            ? 'Pesanan anda telah diterima dan menunggu pengesahan dari dapur.' 
            : 'Your order has been received and waiting for confirmation.' 
        }
      case 'preparing':
        return { 
          label: language === 'bm' ? 'Sedang Disiapkan' : 'Preparing', 
          color: '#f97316', 
          icon: '🔪', 
          step: 2, 
          description: language === 'bm' 
            ? 'Pesanan anda sedang disediakan di dapur.' 
            : 'Your order is being prepared in the kitchen.' 
        }
      case 'ready':
        return { 
          label: language === 'bm' ? 'Sedia' : 'Ready', 
          color: '#22c55e', 
          icon: '✅', 
          step: 3, 
          description: language === 'bm' 
            ? 'Pesanan anda sedia! Sila datang ke kaunter.' 
            : 'Your order is ready! Please proceed to counter.' 
        }
      case 'completed':
        return { 
          label: language === 'bm' ? 'Selesai' : 'Completed', 
          color: '#3b82f6', 
          icon: '📦', 
          step: 4, 
          description: language === 'bm' 
            ? 'Pesanan selesai. Terima kasih!' 
            : 'Order completed. Thank you!' 
        }
      case 'cancelled':
        return { 
          label: language === 'bm' ? 'Dibatalkan' : 'Cancelled', 
          color: '#ef4444', 
          icon: '❌', 
          step: 0, 
          description: language === 'bm' 
            ? 'Pesanan ini telah dibatalkan.' 
            : 'This order has been cancelled.' 
        }
      default:
        return { 
          label: language === 'bm' ? 'Tidak Diketahui' : 'Unknown', 
          color: '#6c757d', 
          icon: '❓', 
          step: 0, 
          description: language === 'bm' 
            ? 'Status tidak diketahui.' 
            : 'Status unknown.' 
        }
    }
  }

  const getEstimatedTime = (createdAt, status) => {
    if (status === 'ready' || status === 'completed') return getText('almost_ready')
    if (status === 'cancelled') return getText('cancelled')
    if (status === 'pending' && !kitchenEnabled && autoCompleteEnabled) {
      return `~${autoCompleteMinutes} ${getText('minutes')}`
    }
    
    const created = new Date(createdAt)
    const now = new Date()
    const elapsed = Math.floor((now - created) / 60000)
    const estimated = 15 - elapsed
    if (estimated <= 0) return getText('almost_ready')
    return `~${estimated} ${getText('minutes')}`
  }

  const getOrderTypeText = () => {
    if (!order) return ''
    if (order.order_type === 'take_away') return `🥡 ${getText('take_away')}`
    if (order.table_number && order.table_number > 0) return `🍽️ ${getText('table')} ${order.table_number}`
    return '🍽️ ' + getText('dine_in')
  }

  // Format time with Malaysia timezone (UTC+8)
  const formatTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleTimeString(language === 'bm' ? 'ms-MY' : 'en-US', { 
      timeZone: 'Asia/Kuala_Lumpur',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString(language === 'bm' ? 'ms-MY' : 'en-US', { 
      timeZone: 'Asia/Kuala_Lumpur',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const StepBar = ({ currentStep }) => {
    const steps = [
      { step: 1, label: language === 'bm' ? 'Diterima' : 'Received', icon: '📋' },
      { step: 2, label: language === 'bm' ? 'Disiapkan' : 'Preparing', icon: '🔪' },
      { step: 3, label: language === 'bm' ? 'Sedia' : 'Ready', icon: '✅' },
      { step: 4, label: language === 'bm' ? 'Selesai' : 'Completed', icon: '📦' }
    ]

    return (
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', position: 'relative' }}>
          {steps.map((step) => (
            <div key={step.step} style={{ textAlign: 'center', flex: 1, position: 'relative', zIndex: 2 }}>
              <div style={{
                width: isMobile ? '40px' : '48px',
                height: isMobile ? '40px' : '48px',
                margin: '0 auto 6px auto',
                background: currentStep >= step.step ? '#22c55e' : '#e2e8f0',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '18px' : '24px',
                transition: 'all 0.3s'
              }}>
                {step.icon}
              </div>
              <div style={{ fontSize: isMobile ? '9px' : '11px', color: currentStep >= step.step ? '#22c55e' : textMuted, fontWeight: currentStep >= step.step ? 'bold' : 'normal' }}>
                {step.label}
              </div>
            </div>
          ))}
        </div>
        <div style={{ position: 'relative', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '-24px' }}>
          <div style={{
            width: `${((currentStep - 1) / 3) * 100}%`,
            height: '4px',
            background: '#22c55e',
            borderRadius: '2px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    )
  }

  // Function to navigate back to menu
  const goToMenu = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const tableFromUrl = urlParams.get('table')
    const tableNumber = order?.table_number || tableFromUrl || '1'
    window.location.href = `/menu?table=${tableNumber}`
  }

  return (
    <div style={{ minHeight: '100vh', background: bgColor, padding: isMobile ? '16px' : '24px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {logoUrl ? (
              <img src={logoUrl} alt={restaurantName} style={{ height: isMobile ? '32px' : '40px', width: 'auto', borderRadius: '8px' }} />
            ) : (
              <span style={{ fontSize: isMobile ? '28px' : '32px' }}>🏪</span>
            )}
            <h1 style={{ margin: 0, color: textColor, fontSize: isMobile ? '16px' : '20px', fontWeight: 'bold' }}>{restaurantName}</h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={toggleDarkMode} style={{ background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', border: `1px solid ${borderColor}`, borderRadius: '30px', padding: isMobile ? '6px 10px' : '6px 12px', cursor: 'pointer', fontSize: isMobile ? '12px' : '14px' }}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={() => setLanguage(language === 'bm' ? 'en' : 'bm')} style={{ background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', border: `1px solid ${borderColor}`, borderRadius: '30px', padding: isMobile ? '6px 10px' : '6px 12px', cursor: 'pointer', fontSize: isMobile ? '12px' : '14px' }}>
              {language === 'bm' ? '🇺🇸' : '🇲🇾'}
            </button>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: textColor, fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold', marginBottom: '6px' }}>🔍 {getText('track_title')}</h2>
          <p style={{ color: textMuted, fontSize: isMobile ? '12px' : '14px' }}>{getText('track_subtitle')}</p>
        </div>

        {/* Search Form */}
        <div style={{ ...glassEffect, borderRadius: '24px', padding: isMobile ? '16px' : '24px', marginBottom: '20px' }}>
          <form onSubmit={handleSearch}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder={getText('enter_order') + ' (e.g., ORD-1234567890)'}
                style={{
                  flex: 2,
                  padding: isMobile ? '12px 16px' : '14px 16px',
                  borderRadius: '50px',
                  border: `1px solid ${borderColor}`,
                  background: inputBg,
                  color: textColor,
                  fontSize: isMobile ? '14px' : '14px',
                  outline: 'none',
                  width: '100%'
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: isMobile ? '12px 16px' : '14px 24px',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  opacity: loading ? 0.7 : 1,
                  fontSize: isMobile ? '14px' : '14px'
                }}
              >
                {loading ? '⏳ ' + getText('searching') : '🔍 ' + getText('track')}
              </button>
            </div>
          </form>

          {error && (
            <div style={{ marginTop: '14px', padding: '10px', background: '#fee2e2', color: '#991b1b', borderRadius: '12px', textAlign: 'center', fontSize: isMobile ? '12px' : '13px' }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Auto Refresh Toggle */}
        {order && order.status !== 'completed' && order.status !== 'cancelled' && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
              <span style={{ fontSize: isMobile ? '11px' : '12px', color: textMuted }}>🔄 {getText('auto_refresh')}</span>
            </label>
          </div>
        )}

        {/* Order Details */}
        {order && searchPerformed && !error && (
          <div style={{ ...glassEffect, borderRadius: '24px', padding: isMobile ? '16px' : '24px' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                display: 'inline-block',
                background: getStatusInfo(order.status).color,
                color: 'white',
                padding: isMobile ? '6px 16px' : '8px 20px',
                borderRadius: '40px',
                fontSize: isMobile ? '12px' : '14px',
                fontWeight: 'bold',
                marginBottom: '10px'
              }}>
                {getStatusInfo(order.status).icon} {getStatusInfo(order.status).label}
              </div>
              <h3 style={{ margin: 0, color: textColor, fontSize: isMobile ? '16px' : '18px', fontWeight: 'bold' }}>
                {getText('order')} #{order.order_number}
              </h3>
              <p style={{ color: textMuted, fontSize: isMobile ? '10px' : '12px', marginTop: '4px' }}>
                {formatDate(order.created_at)} {getText('at')} {formatTime(order.created_at)}
              </p>
            </div>

            {/* Auto Complete Info */}
            {order.status === 'pending' && !kitchenEnabled && autoCompleteEnabled && (
              <div style={{ background: '#e0f2fe', borderRadius: '12px', padding: '10px', marginBottom: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#0369a1' }}>
                  ⏱️ {getText('auto_complete_info')} {autoCompleteMinutes} {getText('minutes')}
                </span>
              </div>
            )}

            {order.status !== 'cancelled' && <StepBar currentStep={getStatusInfo(order.status).step} />}

            {order.status !== 'cancelled' && (
              <div style={{ background: secondaryBg, borderRadius: '14px', padding: isMobile ? '12px' : '16px', textAlign: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: isMobile ? '12px' : '14px', color: textMuted }}>🕐 {getText('estimated_time')}</span>
                <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 'bold', color: '#22c55e', marginTop: '4px' }}>
                  {getEstimatedTime(order.created_at, order.status)}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${borderColor}`, fontSize: isMobile ? '13px' : '14px' }}>
                <span style={{ color: textMuted }}>{getText('order_type')}:</span>
                <span style={{ color: textColor, fontWeight: 'bold' }}>{getOrderTypeText()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${borderColor}`, fontSize: isMobile ? '13px' : '14px' }}>
                <span style={{ color: textMuted }}>{getText('customer')}:</span>
                <span style={{ color: textColor, fontWeight: 'bold' }}>{order.customer_name || getText('guest')}</span>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ color: textColor, fontSize: isMobile ? '13px' : '14px', fontWeight: 'bold', marginBottom: '10px' }}>🛒 {getText('order_items')}</h4>
              <div style={{ background: secondaryBg, borderRadius: '14px', padding: '10px' }}>
                {order.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: idx !== order.items.length - 1 ? `1px solid ${borderColor}` : 'none', fontSize: isMobile ? '12px' : '13px' }}>
                    <span style={{ color: textColor }}>{item.name} x{item.quantity}</span>
                    <span style={{ color: '#22c55e', fontWeight: 'bold' }}>RM {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: secondaryBg, borderRadius: '14px', padding: isMobile ? '12px' : '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: isMobile ? '14px' : '16px' }}>
                <span style={{ color: textColor }}>{getText('total')}:</span>
                <span style={{ color: '#22c55e' }}>RM {(order.total || order.grand_total || 0).toFixed(2)}</span>
              </div>
            </div>

            {order.notes && (
              <div style={{ background: '#fef3c7', borderRadius: '12px', padding: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: isMobile ? '10px' : '11px', color: '#92400e' }}>📝 {getText('note')}: {order.notes}</span>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <p style={{ fontSize: isMobile ? '11px' : '12px', color: textMuted }}>{getStatusInfo(order.status).description}</p>
            </div>

            {/* Buttons Group - Refresh & Order Again */}
            <div style={{ textAlign: 'center', marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
              <button
                onClick={() => loadOrder(orderNumber)}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  color: 'white',
                  padding: isMobile ? '10px 20px' : '10px 24px',
                  border: 'none',
                  borderRadius: '40px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: isMobile ? '12px' : '13px',
                  flex: 1
                }}
              >
                🔄 {getText('refresh_status')}
              </button>
              
              {/* ORDER AGAIN BUTTON */}
              <button
                onClick={goToMenu}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                  color: 'white',
                  padding: isMobile ? '10px 20px' : '10px 24px',
                  border: 'none',
                  borderRadius: '40px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: isMobile ? '12px' : '13px',
                  flex: 1
                }}
              >
                🍽️ {language === 'bm' ? 'Pesan Lagi →' : 'Order Again →'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>
        {`
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(59,130,246,0.2);
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: ${darkMode ? '#2a2a3e' : '#e2e8f0'}; border-radius: 10px; }
          ::-webkit-scrollbar-thumb { background: ${darkMode ? '#555' : '#94a3b8'}; border-radius: 10px; }
        `}
      </style>
    </div>
  )
}

export default TrackOrder