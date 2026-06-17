import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'
import Sidebar from './components/Sidebar'
import { supabase } from './lib/supabase'
import { sendNotification } from './utils/notification'

function KitchenApp() {
  const { darkMode } = useTheme()
  const { language, t } = useLanguage()
  const [foodOrders, setFoodOrders] = useState([])
  const [drinkOrders, setDrinkOrders] = useState([])
  const [preparingOrders, setPreparingOrders] = useState([])
  const [readyOrders, setReadyOrders] = useState([])
  const [completedOrders, setCompletedOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [restaurantName, setRestaurantName] = useState('Restoran Kita')
  const [activeTab, setActiveTab] = useState('food')
  const [kitchenEnabled, setKitchenEnabled] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [orderTypeFilter, setOrderTypeFilter] = useState('all')
  const [audio] = useState(typeof Audio !== 'undefined' ? new Audio('/sound/notification.mp3') : null)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Dark mode colors
  const bgColor = darkMode ? '#0f0f1a' : '#f8fafc'
  const cardBg = darkMode ? 'rgba(30, 30, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  const textColor = darkMode ? '#f1f5f9' : '#1e293b'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.6)'
  const priceColor = darkMode ? '#4ade80' : '#22c55e'
  const borderLeftFood = '#ef4444'
  const borderLeftDrink = '#06b6d4'
  
  const glassEffect = {
    background: cardBg,
    backdropFilter: 'blur(12px)',
    border: `1px solid ${borderColor}`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s ease'
  }

  // ============ TRANSLATIONS - LENGKAP BM/EN ============
  const getText = (key) => {
    const texts = {
      // Header
      kitchen_title: { bm: '🍳 Dapur Digital', en: '🍳 Digital Kitchen' },
      kitchen_subtitle: { bm: 'Urus pesanan makanan & minuman', en: 'Manage food & drink orders' },
      
      // Buttons
      sound: { bm: 'Bunyi', en: 'Sound' },
      refresh: { bm: 'Muat Semula', en: 'Refresh' },
      refresh_data: { bm: '🔄 Muat Semula Data', en: '🔄 Refresh Data' },
      
      // Search & Filter
      search_orders: { bm: '🔍 Cari pesanan...', en: '🔍 Search orders...' },
      all_orders: { bm: '🍽️ Semua', en: '🍽️ All' },
      dine_in: { bm: '🏠 Dine-in', en: '🏠 Dine-in' },
      take_away: { bm: '🥡 Bungkus', en: '🥡 Take Away' },
      
      // Alerts
      new_orders: { bm: 'Pesanan Baru', en: 'New Orders' },
      process_immediately: { bm: 'Proses segera!', en: 'Process immediately!' },
      
      // Tabs
      food_kitchen: { bm: '🍳 Makanan', en: '🍳 Food' },
      drink_kitchen: { bm: '🥤 Minuman', en: '🥤 Drinks' },
      preparing_orders: { bm: '🔪 Sedang Masak', en: '🔪 Cooking' },
      ready_orders: { bm: '✅ Sedia', en: '✅ Ready' },
      completed_orders: { bm: '📜 Selesai', en: '📜 Done' },
      
      // Empty states
      no_food_orders: { bm: 'Tiada pesanan makanan', en: 'No food orders' },
      no_drink_orders: { bm: 'Tiada pesanan minuman', en: 'No drink orders' },
      no_preparing_orders: { bm: 'Tiada pesanan sedang dimasak', en: 'No orders cooking' },
      no_ready_orders: { bm: 'Tiada pesanan sedia', en: 'No ready orders' },
      no_completed_orders: { bm: 'Tiada pesanan selesai', en: 'No completed orders' },
      
      // Status actions
      start_cooking: { bm: '🔪 Mula Masak', en: '🔪 Start Cooking' },
      finish_cooking: { bm: '✅ Selesai Masak', en: '✅ Finish Cooking' },
      complete: { bm: '✅ Selesai', en: '✅ Complete' },
      cancelled: { bm: '❌ Dibatalkan', en: '❌ Cancelled' },
      
      // Messages
      error_updating: { bm: 'Ralat semasa kemaskini', en: 'Error updating' },
      no_orders_to_complete: { bm: 'Tiada pesanan untuk diselesaikan', en: 'No orders to complete' },
      orders_completed: { bm: 'pesanan selesai', en: 'orders completed' },
      complete_all: { bm: '✅ Selesaikan Semua', en: '✅ Complete All' },
      confirm_complete_all: { bm: 'Sahkan selesaikan semua pesanan?', en: 'Confirm complete all orders?' },
      
      // Labels
      waiting: { bm: 'Menunggu', en: 'Waiting' },
      total: { bm: 'Jumlah', en: 'Total' },
      note: { bm: 'Nota', en: 'Note' },
      cancel: { bm: '❌ Batal', en: '❌ Cancel' },
      table: { bm: 'Meja', en: 'Table' },
      just_now: { bm: 'Baru sahaja', en: 'Just now' },
      
      // Disabled state
      kitchen_disabled: { bm: 'Dapur Digital Dimatikan', en: 'Digital Kitchen Disabled' },
      kitchen_disabled_desc: { bm: 'Sila aktifkan dapur digital di halaman Tetapan', en: 'Please enable digital kitchen in Settings page' },
      go_to_settings: { bm: '⚙️ Pergi ke Tetapan', en: '⚙️ Go to Settings' },
      
      // Push notification
      new_order_alert: { bm: '🍳 Pesanan Baru!', en: '🍳 New Order!' },
      order_ready_alert: { bm: '✅ Pesanan Sedia!', en: '✅ Order Ready!' },
      order_ready_desc: { bm: 'Pesanan sedia untuk diambil', en: 'Order is ready for pickup' }
    }
    return texts[key]?.[language] || texts[key]?.en || key
  }

  useEffect(() => {
    if (audio) audio.load()
    loadKitchenSetting()
  }, [audio])

  async function loadKitchenSetting() {
    try {
      const { data } = await supabase.from('settings').select('value').eq('key', 'kitchen_enabled').single()
      if (data) setKitchenEnabled(data.value === 'true')
    } catch (err) {
      console.error('Error loading kitchen setting:', err)
      setKitchenEnabled(true)
    }
  }

  useEffect(() => {
    if (!kitchenEnabled) return
    
    loadRestaurantName()
    loadOrders()
    
    const enableSoundOnClick = () => {
      setSoundEnabled(true)
      document.removeEventListener('click', enableSoundOnClick)
    }
    document.addEventListener('click', enableSoundOnClick)
    
    const subscription = supabase
      .channel('kitchen_orders')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'customer_orders' },
        (payload) => {
          if (payload.new.status === 'pending') {
            // Check for drink items
            const hasDrinkItems = payload.new.items?.some(item => 
              item.category === 'Minuman' || 
              item.name?.toLowerCase().includes('teh') ||
              item.name?.toLowerCase().includes('kopi') ||
              item.name?.toLowerCase().includes('jus') ||
              item.name?.toLowerCase().includes('air') ||
              item.name?.toLowerCase().includes('milo') ||
              item.name?.toLowerCase().includes('sirap') ||
              item.name?.toLowerCase().includes('coke') ||
              item.name?.toLowerCase().includes('soda')
            )
            
            // Check for food items
            const hasFoodItems = payload.new.items?.some(item => 
              item.category !== 'Minuman' && 
              !item.name?.toLowerCase().includes('teh') &&
              !item.name?.toLowerCase().includes('kopi') &&
              !item.name?.toLowerCase().includes('jus') &&
              !item.name?.toLowerCase().includes('air') &&
              !item.name?.toLowerCase().includes('milo') &&
              !item.name?.toLowerCase().includes('sirap') &&
              !item.name?.toLowerCase().includes('coke') &&
              !item.name?.toLowerCase().includes('soda')
            )
            
            // Add to food orders if has food items
            if (hasFoodItems) {
              setFoodOrders(prev => [payload.new, ...prev])
            }
            
            // Add to drink orders if has drink items
            if (hasDrinkItems) {
              setDrinkOrders(prev => [payload.new, ...prev])
            }
            
            if (soundEnabled && audio) {
              audio.currentTime = 0
              audio.play().catch(e => console.log('Audio play failed:', e))
            }
            
            const orderType = payload.new.order_type === 'take_away' 
              ? getText('take_away') 
              : `${getText('table')} ${payload.new.table_number || '?'}`
            
            const itemTypes = []
            if (hasFoodItems) itemTypes.push(getText('food_kitchen'))
            if (hasDrinkItems) itemTypes.push(getText('drink_kitchen'))
            
            sendNotification(
              getText('new_order_alert'),
              `${orderType} - ${itemTypes.join(' & ')} (${payload.new.items?.length} item)`,
              '/kitchen'
            )
            
            toast.custom((t) => (
              <div style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', padding: isMobile ? '10px 16px' : '12px 24px', borderRadius: '50px', fontWeight: 'bold', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontSize: isMobile ? '12px' : '14px' }}>
                🍳 {getText('new_orders')}! - {payload.new.order_type === 'take_away' ? getText('take_away') : `${getText('table')} ${payload.new.table_number || ''}`}
                {hasFoodItems && ' 🍽️'}
                {hasDrinkItems && ' 🥤'}
              </div>
            ), { duration: 3000 })
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'customer_orders' },
        (payload) => {
          if (payload.new.status === 'ready' && payload.old.status !== 'ready') {
            loadOrders()
            sendNotification(
              getText('order_ready_alert'),
              `${getText('order_ready_desc')}: ${payload.new.order_number}`,
              '/staff'
            )
          } else {
            loadOrders()
          }
        }
      )
      .subscribe()
    
    const interval = setInterval(() => loadOrders(), 5000)
    
    return () => {
      subscription.unsubscribe()
      clearInterval(interval)
      document.removeEventListener('click', enableSoundOnClick)
    }
  }, [soundEnabled, audio, kitchenEnabled])

  async function loadRestaurantName() {
    try {
      const { data } = await supabase.from('settings').select('value').eq('key', 'restaurant_name').single()
      if (data) setRestaurantName(data.value)
    } catch (err) {
      console.error('Error loading restaurant name:', err)
    }
  }

  async function loadOrders() {
    try {
      const { data: pending } = await supabase
        .from('customer_orders')
        .select('*')
        .in('status', ['pending', 'preparing', 'ready'])
        .order('created_at', { ascending: false })
      
      const { data: completed } = await supabase
        .from('customer_orders')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(20)
      
      const food = []
      const drinks = []
      const preparing = []
      const ready = []
      
      pending?.forEach(order => {
        const hasDrinkItems = order.items?.some(item => 
          item.category === 'Minuman' || 
          item.name?.toLowerCase().includes('teh') ||
          item.name?.toLowerCase().includes('kopi') ||
          item.name?.toLowerCase().includes('jus') ||
          item.name?.toLowerCase().includes('air') ||
          item.name?.toLowerCase().includes('milo') ||
          item.name?.toLowerCase().includes('sirap') ||
          item.name?.toLowerCase().includes('coke') ||
          item.name?.toLowerCase().includes('soda')
        )
        
        const hasFoodItems = order.items?.some(item => 
          item.category !== 'Minuman' && 
          !item.name?.toLowerCase().includes('teh') &&
          !item.name?.toLowerCase().includes('kopi') &&
          !item.name?.toLowerCase().includes('jus') &&
          !item.name?.toLowerCase().includes('air') &&
          !item.name?.toLowerCase().includes('milo') &&
          !item.name?.toLowerCase().includes('sirap') &&
          !item.name?.toLowerCase().includes('coke') &&
          !item.name?.toLowerCase().includes('soda')
        )
        
        if (order.status === 'preparing') {
          preparing.push(order)
        } else if (order.status === 'ready') {
          ready.push(order)
        } else if (order.status === 'pending') {
          if (hasFoodItems) food.push(order)
          if (hasDrinkItems) drinks.push(order)
        }
      })
      
      setFoodOrders(food)
      setDrinkOrders(drinks)
      setPreparingOrders(preparing)
      setReadyOrders(ready)
      setCompletedOrders(completed || [])
    } catch (err) {
      console.error('Error loading orders:', err)
    } finally {
      setLoading(false)
    }
  }

  async function updateOrderStatus(orderId, status) {
    try {
      const { error } = await supabase
        .from('customer_orders')
        .update({ status: status })
        .eq('id', orderId)
      
      if (error) throw error
      
      await loadOrders()
      
      if (status === 'preparing') {
        toast.success(`🔪 ${getText('start_cooking')}`)
      } else if (status === 'ready') {
        toast.success(`✅ ${getText('finish_cooking')}`)
        if (soundEnabled && audio) {
          audio.currentTime = 0
          audio.play().catch(e => console.log('Audio play failed:', e))
        }
      } else if (status === 'completed') {
        toast.success(`✅ ${getText('complete')}`)
      } else if (status === 'cancelled') {
        toast.error(`❌ ${getText('cancelled')}`)
      }
    } catch (err) {
      console.error('Error updating order:', err)
      toast.error(getText('error_updating'))
    }
  }

  async function bulkComplete(tab) {
    let ordersToComplete = []
    if (tab === 'ready') ordersToComplete = readyOrders
    else if (tab === 'preparing') ordersToComplete = preparingOrders
    
    if (ordersToComplete.length === 0) {
      toast.error(getText('no_orders_to_complete'))
      return
    }
    
    if (window.confirm(getText('confirm_complete_all'))) {
      for (const order of ordersToComplete) {
        const newStatus = tab === 'ready' ? 'completed' : 'ready'
        await supabase
          .from('customer_orders')
          .update({ status: newStatus })
          .eq('id', order.id)
      }
      await loadOrders()
      toast.success(`✅ ${ordersToComplete.length} ${getText('orders_completed')}`)
    }
  }

  const getOrderTypeIcon = (order) => {
    if (order.order_type === 'take_away') return `🥡 ${getText('take_away')}`
    if (order.table_number) return `🍽️ ${getText('table')} ${order.table_number}`
    return `🍽️ ${getText('dine_in')}`
  }

  const getWaitingTime = (createdAt) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffMinutes = Math.floor((now - created) / 60000)
    if (diffMinutes < 1) return getText('just_now')
    if (diffMinutes < 60) return `${diffMinutes} min`
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    if (minutes === 0) return `${hours}j`
    return `${hours}j ${minutes}m`
  }

  const getWaitingColor = (createdAt) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffMinutes = Math.floor((now - created) / 60000)
    if (diffMinutes > 15) return '#ef4444'
    if (diffMinutes > 8) return '#f59e0b'
    return '#22c55e'
  }

  const getWaitingBg = (createdAt) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffMinutes = Math.floor((now - created) / 60000)
    if (diffMinutes > 15) return 'rgba(239, 68, 68, 0.1)'
    if (diffMinutes > 8) return 'rgba(245, 158, 11, 0.1)'
    return 'rgba(34, 197, 94, 0.1)'
  }

  const filterOrders = (orders) => {
    let filtered = orders
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items?.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    if (orderTypeFilter !== 'all') {
      filtered = filtered.filter(order => order.order_type === orderTypeFilter)
    }
    return filtered
  }

  const renderOrderCard = (order, showAcceptButton = true, acceptStatus = 'preparing') => {
    const hasDrinkItems = order.items?.some(item => 
      item.category === 'Minuman' || 
      item.name?.toLowerCase().includes('teh') ||
      item.name?.toLowerCase().includes('kopi') ||
      item.name?.toLowerCase().includes('jus') ||
      item.name?.toLowerCase().includes('air') ||
      item.name?.toLowerCase().includes('milo')
    )
    const cardBorderColor = hasDrinkItems ? borderLeftDrink : borderLeftFood
    const waitingColor = getWaitingColor(order.created_at)
    const waitingBg = getWaitingBg(order.created_at)
    
    return (
      <div 
        key={order.id} 
        style={{ 
          ...glassEffect, 
          borderRadius: isMobile ? '20px' : '24px', 
          padding: isMobile ? '16px' : '20px', 
          borderLeft: `4px solid ${cardBorderColor}`,
          marginBottom: isMobile ? '12px' : '16px',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '10px' : '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ 
              background: hasDrinkItems ? 'rgba(6, 182, 212, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
              padding: isMobile ? '4px 10px' : '6px 12px', 
              borderRadius: '40px',
              fontSize: isMobile ? '10px' : '12px',
              fontWeight: 'bold',
              color: hasDrinkItems ? '#06b6d4' : '#ef4444'
            }}>
              {getOrderTypeIcon(order)} {hasDrinkItems && '🥤'}
            </span>
            <span style={{ 
              background: waitingBg,
              padding: isMobile ? '3px 8px' : '4px 10px',
              borderRadius: '40px',
              fontSize: isMobile ? '10px' : '11px',
              fontWeight: 'bold',
              color: waitingColor
            }}>
              ⏱️ {getText('waiting')}: {getWaitingTime(order.created_at)}
            </span>
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '11px', color: textMuted }}>
            📅 {new Date(order.created_at).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        
        {/* Customer Info */}
        <div style={{ marginBottom: isMobile ? '10px' : '12px' }}>
          <h4 style={{ margin: 0, color: textColor, fontSize: isMobile ? '15px' : '16px', fontWeight: 'bold' }}>
            👤 {order.customer_name || 'Guest'}
          </h4>
          {order.order_number && (
            <p style={{ fontSize: isMobile ? '10px' : '11px', color: textMuted, margin: '2px 0 0 0' }}>
              #{order.order_number}
            </p>
          )}
        </div>
        
        {/* Order Items */}
        <div style={{ margin: '12px 0', borderTop: `1px solid ${borderColor}`, paddingTop: '10px' }}>
          {order.items?.map((item, idx) => {
            const isDrinkItem = item.category === 'Minuman' || 
              item.name?.toLowerCase().includes('teh') ||
              item.name?.toLowerCase().includes('kopi') ||
              item.name?.toLowerCase().includes('jus') ||
              item.name?.toLowerCase().includes('air') ||
              item.name?.toLowerCase().includes('milo')
            
            return (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: textColor }}>
                <span style={{ fontSize: isMobile ? '12px' : '13px' }}>
                  {isDrinkItem && '🥤 '}
                  {item.quantity}x {item.name}
                  {item.option_type && (
                    <span style={{ fontSize: isMobile ? '9px' : '10px', color: textMuted, display: 'block' }}>
                      {item.option_type === 'Panas' ? '🔥 Panas' : item.option_type === 'Sejuk' ? '🧊 Sejuk' : item.option_type}
                    </span>
                  )}
                </span>
                <span style={{ color: priceColor, fontWeight: 'bold', fontSize: isMobile ? '12px' : '13px' }}>
                  RM {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            )
          })}
        </div>
        
        {/* Notes */}
        {order.special_request && (
          <div style={{ 
            background: 'rgba(245, 158, 11, 0.1)', 
            padding: isMobile ? '8px 12px' : '10px 14px', 
            borderRadius: '14px', 
            marginBottom: '12px', 
            fontSize: isMobile ? '11px' : '12px', 
            color: '#f59e0b',
            borderLeft: '3px solid #f59e0b'
          }}>
            📝 {getText('note')}: {order.special_request}
          </div>
        )}
        
        {/* Total */}
        <div style={{ 
          textAlign: 'right', 
          marginBottom: showAcceptButton ? '12px' : '0',
          paddingTop: '8px',
          borderTop: `1px solid ${borderColor}`
        }}>
          <span style={{ fontWeight: 'bold', fontSize: isMobile ? '14px' : '15px', color: textColor }}>
            {getText('total')}: RM {order.total?.toFixed(2) || '0.00'}
          </span>
        </div>
        
        {/* Action Buttons */}
        {showAcceptButton && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button 
              onClick={() => updateOrderStatus(order.id, acceptStatus)} 
              style={{ 
                flex: 1, 
                background: acceptStatus === 'preparing' 
                  ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
                  : 'linear-gradient(135deg, #3b82f6, #2563eb)', 
                color: 'white', 
                padding: isMobile ? '10px' : '12px', 
                border: 'none', 
                borderRadius: '50px', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                fontSize: isMobile ? '12px' : '13px'
              }}
            >
              {acceptStatus === 'preparing' ? '🔪 ' + getText('start_cooking') : '✅ ' + getText('finish_cooking')}
            </button>
            <button 
              onClick={() => updateOrderStatus(order.id, 'cancelled')} 
              style={{ 
                flex: 1, 
                background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
                color: 'white', 
                padding: isMobile ? '10px' : '12px', 
                border: 'none', 
                borderRadius: '50px', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                fontSize: isMobile ? '12px' : '13px'
              }}
            >
              ❌ {getText('cancel')}
            </button>
          </div>
        )}
      </div>
    )
  }

  if (!kitchenEnabled) {
    return (
      <Sidebar>
        <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: bgColor, padding: isMobile ? '16px' : '20px' }}>
          <div style={{ ...glassEffect, borderRadius: '28px', padding: isMobile ? '32px' : '48px', maxWidth: '500px', width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: isMobile ? '56px' : '72px', marginBottom: '20px' }}>🍳</div>
            <h2 style={{ color: '#ef4444', marginBottom: '10px', fontWeight: 'bold', fontSize: isMobile ? '20px' : '24px' }}>{getText('kitchen_disabled')}</h2>
            <p style={{ color: textMuted, marginBottom: '24px', fontSize: isMobile ? '12px' : '14px' }}>{getText('kitchen_disabled_desc')}</p>
            <button onClick={() => window.location.href = '/manage-settings'} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', padding: isMobile ? '12px 24px' : '14px 32px', border: 'none', borderRadius: '50px', cursor: 'pointer', fontSize: isMobile ? '13px' : '15px', fontWeight: 'bold' }}>⚙️ {getText('go_to_settings')}</button>
          </div>
        </div>
      </Sidebar>
    )
  }

  if (loading) {
    return (
      <Sidebar>
        <div style={{ padding: isMobile ? '12px' : '20px', maxWidth: '1400px', margin: '0 auto', background: bgColor, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="spinner"></div>
        </div>
      </Sidebar>
    )
  }

  const totalNew = foodOrders.length + drinkOrders.length

  return (
    <Sidebar>
      <div style={{ padding: isMobile ? '12px' : '24px', maxWidth: '1400px', margin: '0 auto', background: bgColor, minHeight: '100vh' }}>
        
        {/* Header */}
        <div style={{ 
          ...glassEffect, 
          borderRadius: '28px', 
          padding: isMobile ? '16px 20px' : '24px 32px', 
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: isMobile ? '36px' : '48px' }}>🍳</div>
              <div>
                <h1 style={{ color: textColor, margin: 0, fontSize: isMobile ? '20px' : '28px', fontWeight: 'bold' }}>{getText('kitchen_title')}</h1>
                <p style={{ color: textMuted, marginTop: '2px', fontSize: isMobile ? '11px' : '13px' }}>
                  {restaurantName} • {getText('kitchen_subtitle')}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button 
                onClick={() => { if (audio) { audio.currentTime = 0; audio.play().catch(e => console.log('Test sound failed:', e)) } }} 
                style={{ 
                  background: soundEnabled ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #6c757d, #5a6268)', 
                  color: 'white', 
                  padding: isMobile ? '6px 12px' : '10px 20px', 
                  border: 'none', 
                  borderRadius: '40px', 
                  cursor: 'pointer', 
                  fontSize: isMobile ? '11px' : '13px', 
                  fontWeight: 'bold'
                }}
              >
                🔔 {getText('sound')}: {soundEnabled ? 'ON' : 'OFF'}
              </button>
              <button 
                onClick={() => loadOrders()} 
                style={{ 
                  background: 'linear-gradient(135deg, #06b6d4, #0891b2)', 
                  color: 'white', 
                  padding: isMobile ? '6px 12px' : '10px 20px', 
                  border: 'none', 
                  borderRadius: '40px', 
                  cursor: 'pointer', 
                  fontSize: isMobile ? '11px' : '13px', 
                  fontWeight: 'bold'
                }}
              >
                🔄 {getText('refresh')}
              </button>
            </div>
          </div>
        </div>
        
        {/* Search & Filter */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ ...glassEffect, borderRadius: '60px', padding: isMobile ? '4px 16px' : '4px 20px', flex: 1, display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: isMobile ? '14px' : '18px', marginRight: '10px', color: textMuted }}>🔍</span>
            <input 
              type="text" 
              placeholder={getText('search_orders')} 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ width: '100%', padding: isMobile ? '10px 0' : '14px 0', border: 'none', background: 'transparent', color: textColor, fontSize: isMobile ? '13px' : '14px', outline: 'none' }} 
            />
          </div>
          <select 
            value={orderTypeFilter}
            onChange={(e) => setOrderTypeFilter(e.target.value)}
            style={{
              ...glassEffect,
              padding: isMobile ? '8px 16px' : '12px 20px',
              borderRadius: '60px',
              border: 'none',
              background: cardBg,
              color: textColor,
              fontSize: isMobile ? '12px' : '13px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="all">🍽️ {getText('all_orders')}</option>
            <option value="dine_in">🏠 {getText('dine_in')}</option>
            <option value="take_away">🥡 {getText('take_away')}</option>
          </select>
        </div>
        
        {/* New Orders Alert */}
        {totalNew > 0 && (
          <div style={{ 
            background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
            color: 'white', 
            padding: isMobile ? '12px 16px' : '16px 24px', 
            borderRadius: '24px', 
            marginBottom: '20px', 
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: isMobile ? '13px' : '15px'
          }}>
            🔔 {totalNew} {getText('new_orders')}! - {getText('process_immediately')}
          </div>
        )}
        
        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          marginBottom: '20px', 
          background: darkMode ? 'rgba(30, 30, 45, 0.5)' : 'rgba(0,0,0,0.03)', 
          borderRadius: '50px', 
          padding: '6px',
          overflowX: 'auto',
          flexWrap: 'nowrap'
        }}>
          {[
            { id: 'food', label: getText('food_kitchen'), icon: '🍳', color: '#ef4444', count: foodOrders.length },
            { id: 'drink', label: getText('drink_kitchen'), icon: '🥤', color: '#06b6d4', count: drinkOrders.length },
            { id: 'preparing', label: getText('preparing_orders'), icon: '🔪', color: '#f59e0b', count: preparingOrders.length },
            { id: 'ready', label: getText('ready_orders'), icon: '✅', color: '#22c55e', count: readyOrders.length },
            { id: 'completed', label: getText('completed_orders'), icon: '📜', color: '#6c757d', count: completedOrders.length }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)} 
              style={{ 
                flex: 1,
                padding: isMobile ? '8px 12px' : '12px 16px', 
                background: activeTab === tab.id ? `linear-gradient(135deg, ${tab.color}, ${tab.color}cc)` : 'transparent', 
                color: activeTab === tab.id ? 'white' : textColor, 
                border: 'none', 
                borderRadius: '50px', 
                cursor: 'pointer', 
                fontWeight: activeTab === tab.id ? 'bold' : '500', 
                fontSize: isMobile ? '12px' : '13px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span style={{ 
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : tab.color, 
                  color: 'white', 
                  borderRadius: '30px', 
                  padding: '2px 6px', 
                  fontSize: isMobile ? '9px' : '11px', 
                  fontWeight: 'bold' 
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        
        {/* Food Orders Tab */}
        {activeTab === 'food' && (
          <div>
            {filterOrders(foodOrders).length === 0 ? (
              <div style={{ textAlign: 'center', padding: isMobile ? '40px 20px' : '80px 20px', ...glassEffect, borderRadius: '24px' }}>
                <span style={{ fontSize: isMobile ? '48px' : '72px', opacity: 0.5 }}>🍳</span>
                <h3 style={{ color: textColor, marginTop: '12px', fontSize: isMobile ? '16px' : '18px' }}>{getText('no_food_orders')}</h3>
              </div>
            ) : (
              filterOrders(foodOrders).map(order => renderOrderCard(order, true, 'preparing'))
            )}
          </div>
        )}
        
        {/* Drink Orders Tab */}
        {activeTab === 'drink' && (
          <div>
            {filterOrders(drinkOrders).length === 0 ? (
              <div style={{ textAlign: 'center', padding: isMobile ? '40px 20px' : '80px 20px', ...glassEffect, borderRadius: '24px' }}>
                <span style={{ fontSize: isMobile ? '48px' : '72px', opacity: 0.5 }}>🥤</span>
                <h3 style={{ color: textColor, marginTop: '12px', fontSize: isMobile ? '16px' : '18px' }}>{getText('no_drink_orders')}</h3>
              </div>
            ) : (
              filterOrders(drinkOrders).map(order => renderOrderCard(order, true, 'preparing'))
            )}
          </div>
        )}
        
        {/* Preparing Tab */}
        {activeTab === 'preparing' && (
          <div>
            {filterOrders(preparingOrders).length === 0 ? (
              <div style={{ textAlign: 'center', padding: isMobile ? '40px 20px' : '80px 20px', ...glassEffect, borderRadius: '24px' }}>
                <span style={{ fontSize: isMobile ? '48px' : '72px', opacity: 0.5 }}>🔪</span>
                <h3 style={{ color: textColor, marginTop: '12px', fontSize: isMobile ? '16px' : '18px' }}>{getText('no_preparing_orders')}</h3>
              </div>
            ) : (
              <>
                {preparingOrders.length > 1 && (
                  <button 
                    onClick={() => bulkComplete('preparing')} 
                    style={{ 
                      marginBottom: '16px', 
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)', 
                      color: 'white', 
                      padding: isMobile ? '8px 16px' : '12px 28px', 
                      border: 'none', 
                      borderRadius: '40px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold',
                      fontSize: isMobile ? '12px' : '14px',
                      width: '100%'
                    }}
                  >
                    ✅ {getText('complete_all')} ({preparingOrders.length})
                  </button>
                )}
                {filterOrders(preparingOrders).map(order => renderOrderCard(order, true, 'ready'))}
              </>
            )}
          </div>
        )}
        
        {/* Ready Tab */}
        {activeTab === 'ready' && (
          <div>
            {filterOrders(readyOrders).length === 0 ? (
              <div style={{ textAlign: 'center', padding: isMobile ? '40px 20px' : '80px 20px', ...glassEffect, borderRadius: '24px' }}>
                <span style={{ fontSize: isMobile ? '48px' : '72px', opacity: 0.5 }}>✅</span>
                <h3 style={{ color: textColor, marginTop: '12px', fontSize: isMobile ? '16px' : '18px' }}>{getText('no_ready_orders')}</h3>
              </div>
            ) : (
              <>
                {readyOrders.length > 1 && (
                  <button 
                    onClick={() => bulkComplete('ready')} 
                    style={{ 
                      marginBottom: '16px', 
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)', 
                      color: 'white', 
                      padding: isMobile ? '8px 16px' : '12px 28px', 
                      border: 'none', 
                      borderRadius: '40px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold',
                      fontSize: isMobile ? '12px' : '14px',
                      width: '100%'
                    }}
                  >
                    ✅ {getText('complete_all')} ({readyOrders.length})
                  </button>
                )}
                {filterOrders(readyOrders).map(order => renderOrderCard(order, true, 'completed'))}
              </>
            )}
          </div>
        )}
        
        {/* Completed Tab */}
        {activeTab === 'completed' && (
          <div>
            {filterOrders(completedOrders).length === 0 ? (
              <div style={{ textAlign: 'center', padding: isMobile ? '40px 20px' : '80px 20px', ...glassEffect, borderRadius: '24px' }}>
                <span style={{ fontSize: isMobile ? '48px' : '72px', opacity: 0.5 }}>📜</span>
                <h3 style={{ color: textColor, marginTop: '12px', fontSize: isMobile ? '16px' : '18px' }}>{getText('no_completed_orders')}</h3>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filterOrders(completedOrders).map(order => (
                  <div key={order.id} style={{ ...glassEffect, borderRadius: '16px', padding: isMobile ? '12px 16px' : '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: textColor, fontSize: isMobile ? '13px' : '14px' }}>{getOrderTypeIcon(order)} - {order.customer_name || 'Guest'}</div>
                      <div style={{ fontSize: isMobile ? '10px' : '12px', color: textMuted, marginTop: '2px' }}>{order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: priceColor, fontSize: isMobile ? '14px' : '16px' }}>RM {order.total?.toFixed(2) || '0.00'}</div>
                      <div style={{ fontSize: isMobile ? '9px' : '10px', color: textMuted }}>{new Date(order.created_at).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <style>
          {`
            .spinner { width: 40px; height: 40px; border: 3px solid rgba(59,130,246,0.2); border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
            @keyframes spin { to { transform: rotate(360deg); } }
            ::-webkit-scrollbar { width: 6px; height: 6px; }
            ::-webkit-scrollbar-track { background: ${darkMode ? '#2a2a3e' : '#e2e8f0'}; border-radius: 10px; }
            ::-webkit-scrollbar-thumb { background: ${darkMode ? '#555' : '#94a3b8'}; border-radius: 10px; }
          `}
        </style>
      </div>
    </Sidebar>
  )
}

export default KitchenApp