import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'
import Sidebar from './components/Sidebar'
import { supabase } from './lib/supabase'
import { sendNotification } from './utils/notification'

function KitchenApp() {
  const { darkMode } = useTheme()
  const { language } = useLanguage()
  
  // ============================================================
  // COMPLETE TRANSLATIONS
  // ============================================================
  const translations = {
    // Header
    kitchen_title: { en: 'Digital Kitchen', ms: 'Dapur Digital' },
    kitchen_subtitle: { en: 'Manage food & drink orders', ms: 'Urus pesanan makanan & minuman' },
    
    // Buttons
    sound_on: { en: 'Sound: ON', ms: 'Bunyi: ON' },
    sound_off: { en: 'Sound: OFF', ms: 'Bunyi: OFF' },
    refresh: { en: 'Refresh', ms: 'Muat Semula' },
    refresh_data: { en: 'Refresh Data', ms: 'Muat Semula Data' },
    complete_all: { en: 'Complete All', ms: 'Selesaikan Semua' },
    go_to_settings: { en: 'Go to Settings', ms: 'Pergi ke Tetapan' },
    
    // Search & Filter
    search_orders: { en: 'Search orders...', ms: 'Cari pesanan...' },
    all_orders: { en: 'All', ms: 'Semua' },
    dine_in: { en: 'Dine-in', ms: 'Dine-in' },
    take_away: { en: 'Take Away', ms: 'Bungkus' },
    
    // Alerts
    new_orders: { en: 'New Orders', ms: 'Pesanan Baru' },
    process_immediately: { en: 'Process immediately!', ms: 'Proses segera!' },
    new_order_alert: { en: 'New Order!', ms: 'Pesanan Baru!' },
    order_ready_alert: { en: 'Order Ready!', ms: 'Pesanan Sedia!' },
    order_ready_desc: { en: 'Order is ready for pickup', ms: 'Pesanan sedia untuk diambil' },
    
    // Tabs
    food_kitchen: { en: '🍳 Food', ms: '🍳 Makanan' },
    drink_kitchen: { en: '🥤 Drinks', ms: '🥤 Minuman' },
    preparing_orders: { en: '🔪 Cooking', ms: '🔪 Sedang Masak' },
    ready_orders: { en: '✅ Ready', ms: '✅ Sedia' },
    completed_orders: { en: '📜 Done', ms: '📜 Selesai' },
    
    // Empty states
    no_food_orders: { en: 'No food orders waiting', ms: 'Tiada pesanan makanan menunggu' },
    no_drink_orders: { en: 'No drink orders waiting', ms: 'Tiada pesanan minuman menunggu' },
    no_preparing_orders: { en: 'No orders cooking', ms: 'Tiada pesanan sedang dimasak' },
    no_ready_orders: { en: 'No ready orders', ms: 'Tiada pesanan sedia' },
    no_completed_orders: { en: 'No completed orders', ms: 'Tiada pesanan selesai' },
    
    // Status actions
    start_cooking: { en: 'Start Cooking', ms: 'Mula Masak' },
    finish_cooking: { en: 'Finish Cooking', ms: 'Selesai Masak' },
    complete: { en: 'Complete', ms: 'Selesai' },
    cancelled: { en: 'Cancelled', ms: 'Dibatalkan' },
    
    // Messages
    error_updating: { en: 'Error updating order!', ms: 'Ralat kemaskini pesanan!' },
    no_orders_to_complete: { en: 'No orders to complete', ms: 'Tiada pesanan untuk diselesaikan' },
    orders_completed: { en: 'orders completed!', ms: 'pesanan selesai!' },
    confirm_complete_all: { en: 'Complete all orders?', ms: 'Selesaikan semua pesanan?' },
    cooking_started: { en: 'Cooking started!', ms: 'Mula memasak!' },
    cooking_finished: { en: 'Cooking finished!', ms: 'Selesai memasak!' },
    order_completed: { en: 'Order completed!', ms: 'Pesanan selesai!' },
    order_cancelled: { en: 'Order cancelled!', ms: 'Pesanan dibatalkan!' },
    
    // Labels
    waiting: { en: 'Waiting', ms: 'Menunggu' },
    total: { en: 'Total', ms: 'Jumlah' },
    note: { en: 'Note', ms: 'Nota' },
    cancel: { en: 'Cancel', ms: 'Batal' },
    table: { en: 'Table', ms: 'Meja' },
    just_now: { en: 'Just now', ms: 'Baru sahaja' },
    guest: { en: 'Guest', ms: 'Tetamu' },
    item: { en: 'item', ms: 'item' },
    items: { en: 'items', ms: 'item' },
    
    // Disabled state
    kitchen_disabled: { en: 'Digital Kitchen Disabled', ms: 'Dapur Digital Dimatikan' },
    kitchen_disabled_desc: { en: 'Please enable digital kitchen in Settings page', ms: 'Sila aktifkan dapur digital di halaman Tetapan' },
    
    // Time
    minutes_short: { en: 'min', ms: 'min' },
    hours_short: { en: 'h', ms: 'j' },
  }

  const t = (key) => {
    if (!translations[key]) return key
    return language === 'en' ? translations[key].en : translations[key].ms
  }

  // ============================================================
  // STATE
  // ============================================================
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

  // ============================================================
  // CHECK MOBILE
  // ============================================================
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // ============================================================
  // THEME COLORS
  // ============================================================
  const bgColor = darkMode ? '#0a0a16' : '#f8fafc'
  const cardBg = darkMode ? 'rgba(20, 20, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  const textColor = darkMode ? '#e8edf5' : '#1e293b'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.5)'
  const priceColor = darkMode ? '#4ade80' : '#22c55e'
  const borderLeftFood = '#ef4444'
  const borderLeftDrink = '#06b6d4'
  const secondaryBg = darkMode ? 'rgba(30, 30, 50, 0.6)' : 'rgba(248, 250, 252, 0.8)'
  
  const glassEffect = {
    background: cardBg,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${borderColor}`,
    boxShadow: darkMode 
      ? '0 8px 40px rgba(0,0,0,0.5)' 
      : '0 8px 40px rgba(0,0,0,0.06)',
    transition: 'all 0.3s ease'
  }

  // ============================================================
  // EFFECTS
  // ============================================================
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
              item.name?.toLowerCase().includes('soda') ||
              item.name?.toLowerCase().includes('limau') ||
              item.name?.toLowerCase().includes('mangga') ||
              item.name?.toLowerCase().includes('oren')
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
              !item.name?.toLowerCase().includes('soda') &&
              !item.name?.toLowerCase().includes('limau') &&
              !item.name?.toLowerCase().includes('mangga') &&
              !item.name?.toLowerCase().includes('oren')
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
              ? t('take_away') 
              : `${t('table')} ${payload.new.table_number || '?'}`
            
            const itemTypes = []
            if (hasFoodItems) itemTypes.push('🍳')
            if (hasDrinkItems) itemTypes.push('🥤')
            
            sendNotification(
              t('new_order_alert'),
              `${orderType} ${itemTypes.join(' ')} (${payload.new.items?.length} items)`,
              '/kitchen'
            )
            
            toast.custom((toastObj) => (
              <div style={{ 
                background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
                color: 'white', 
                padding: isMobile ? '10px 16px' : '12px 24px', 
                borderRadius: '50px', 
                fontWeight: 'bold', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)', 
                fontSize: isMobile ? '12px' : '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>🔔</span>
                <span>{t('new_orders')}! {orderType}</span>
                {hasFoodItems && <span>🍳</span>}
                {hasDrinkItems && <span>🥤</span>}
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
              t('order_ready_alert'),
              `${t('order_ready_desc')}: ${payload.new.order_number}`,
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

  // ============================================================
  // LOAD FUNCTIONS
  // ============================================================
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
        // Check if order has drink items
        const hasDrinkItems = order.items?.some(item => 
          item.category === 'Minuman' || 
          item.name?.toLowerCase().includes('teh') ||
          item.name?.toLowerCase().includes('kopi') ||
          item.name?.toLowerCase().includes('jus') ||
          item.name?.toLowerCase().includes('air') ||
          item.name?.toLowerCase().includes('milo') ||
          item.name?.toLowerCase().includes('sirap') ||
          item.name?.toLowerCase().includes('coke') ||
          item.name?.toLowerCase().includes('soda') ||
          item.name?.toLowerCase().includes('limau') ||
          item.name?.toLowerCase().includes('mangga') ||
          item.name?.toLowerCase().includes('oren')
        )
        
        // Check if order has food items
        const hasFoodItems = order.items?.some(item => 
          item.category !== 'Minuman' && 
          !item.name?.toLowerCase().includes('teh') &&
          !item.name?.toLowerCase().includes('kopi') &&
          !item.name?.toLowerCase().includes('jus') &&
          !item.name?.toLowerCase().includes('air') &&
          !item.name?.toLowerCase().includes('milo') &&
          !item.name?.toLowerCase().includes('sirap') &&
          !item.name?.toLowerCase().includes('coke') &&
          !item.name?.toLowerCase().includes('soda') &&
          !item.name?.toLowerCase().includes('limau') &&
          !item.name?.toLowerCase().includes('mangga') &&
          !item.name?.toLowerCase().includes('oren')
        )
        
        if (order.status === 'preparing') {
          preparing.push(order)
        } else if (order.status === 'ready') {
          ready.push(order)
        } else if (order.status === 'pending') {
          // Only add to food if it has food items (and not just drinks)
          if (hasFoodItems) {
            food.push({
              ...order,
              _hasDrinkItems: hasDrinkItems,
              _hasFoodItems: hasFoodItems,
              _itemTypes: {
                food: hasFoodItems,
                drink: hasDrinkItems
              }
            })
          }
          // Only add to drinks if it has drink items
          if (hasDrinkItems) {
            drinks.push({
              ...order,
              _hasDrinkItems: hasDrinkItems,
              _hasFoodItems: hasFoodItems,
              _itemTypes: {
                food: hasFoodItems,
                drink: hasDrinkItems
              }
            })
          }
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

  // ============================================================
  // ORDER ACTIONS
  // ============================================================
  async function updateOrderStatus(orderId, status) {
    try {
      const { error } = await supabase
        .from('customer_orders')
        .update({ status: status })
        .eq('id', orderId)
      
      if (error) throw error
      
      await loadOrders()
      
      if (status === 'preparing') {
        toast.success(t('cooking_started'))
      } else if (status === 'ready') {
        toast.success(t('cooking_finished'))
        if (soundEnabled && audio) {
          audio.currentTime = 0
          audio.play().catch(e => console.log('Audio play failed:', e))
        }
      } else if (status === 'completed') {
        toast.success(t('order_completed'))
      } else if (status === 'cancelled') {
        toast.error(t('order_cancelled'))
      }
    } catch (err) {
      console.error('Error updating order:', err)
      toast.error(t('error_updating'))
    }
  }

  async function bulkComplete(tab) {
    let ordersToComplete = []
    if (tab === 'ready') ordersToComplete = readyOrders
    else if (tab === 'preparing') ordersToComplete = preparingOrders
    
    if (ordersToComplete.length === 0) {
      toast.error(t('no_orders_to_complete'))
      return
    }
    
    if (window.confirm(t('confirm_complete_all'))) {
      for (const order of ordersToComplete) {
        const newStatus = tab === 'ready' ? 'completed' : 'ready'
        await supabase
          .from('customer_orders')
          .update({ status: newStatus })
          .eq('id', order.id)
      }
      await loadOrders()
      toast.success(`✅ ${ordersToComplete.length} ${t('orders_completed')}`)
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================
  const getOrderTypeIcon = (order) => {
    if (order.order_type === 'take_away') return `🥡 ${t('take_away')}`
    if (order.table_number) return `🍽️ ${t('table')} ${order.table_number}`
    return `🍽️ ${t('dine_in')}`
  }

  const getWaitingTime = (createdAt) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffMinutes = Math.floor((now - created) / 60000)
    if (diffMinutes < 1) return t('just_now')
    if (diffMinutes < 60) return `${diffMinutes} ${t('minutes_short')}`
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    if (minutes === 0) return `${hours}${t('hours_short')}`
    return `${hours}${t('hours_short')} ${minutes}m`
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
    if (diffMinutes > 15) return 'rgba(239, 68, 68, 0.12)'
    if (diffMinutes > 8) return 'rgba(245, 158, 11, 0.12)'
    return 'rgba(34, 197, 94, 0.12)'
  }

  const isDrinkItem = (item) => {
    return item.category === 'Minuman' || 
      item.name?.toLowerCase().includes('teh') ||
      item.name?.toLowerCase().includes('kopi') ||
      item.name?.toLowerCase().includes('jus') ||
      item.name?.toLowerCase().includes('air') ||
      item.name?.toLowerCase().includes('milo') ||
      item.name?.toLowerCase().includes('sirap') ||
      item.name?.toLowerCase().includes('coke') ||
      item.name?.toLowerCase().includes('soda') ||
      item.name?.toLowerCase().includes('limau') ||
      item.name?.toLowerCase().includes('mangga') ||
      item.name?.toLowerCase().includes('oren')
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

  // ============================================================
  // RENDER ORDER CARD
  // ============================================================
  const renderOrderCard = (order, showAcceptButton = true, acceptStatus = 'preparing') => {
    const hasDrinkItems = order.items?.some(item => isDrinkItem(item))
    const hasFoodItems = order.items?.some(item => !isDrinkItem(item))
    const cardBorderColor = hasDrinkItems && !hasFoodItems ? borderLeftDrink : borderLeftFood
    const waitingColor = getWaitingColor(order.created_at)
    const waitingBg = getWaitingBg(order.created_at)
    
    // Show both badges if order has both food and drink
    const showFoodBadge = hasFoodItems
    const showDrinkBadge = hasDrinkItems
    
    return (
      <div 
        key={order.id} 
        style={{ 
          ...glassEffect, 
          borderRadius: isMobile ? '20px' : '24px', 
          padding: isMobile ? '16px' : '20px', 
          borderLeft: `5px solid ${cardBorderColor}`,
          marginBottom: isMobile ? '12px' : '16px',
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'default'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = darkMode 
            ? '0 12px 40px rgba(0,0,0,0.5)' 
            : '0 12px 40px rgba(0,0,0,0.1)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = darkMode 
            ? '0 8px 32px rgba(0,0,0,0.4)' 
            : '0 8px 32px rgba(0,0,0,0.06)'
        }}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: isMobile ? '10px' : '12px', 
          flexWrap: 'wrap', 
          gap: '8px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ 
              background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', 
              padding: isMobile ? '4px 12px' : '6px 14px', 
              borderRadius: '40px',
              fontSize: isMobile ? '10px' : '12px',
              fontWeight: 'bold',
              color: textColor
            }}>
              {getOrderTypeIcon(order)}
            </span>
            
            {/* Food Badge */}
            {showFoodBadge && (
              <span style={{ 
                background: 'rgba(239, 68, 68, 0.15)', 
                color: '#ef4444',
                padding: isMobile ? '2px 10px' : '4px 12px', 
                borderRadius: '40px',
                fontSize: isMobile ? '9px' : '11px',
                fontWeight: 'bold'
              }}>
                🍳 {t('food_kitchen')}
              </span>
            )}
            
            {/* Drink Badge */}
            {showDrinkBadge && (
              <span style={{ 
                background: 'rgba(6, 182, 212, 0.15)', 
                color: '#06b6d4',
                padding: isMobile ? '2px 10px' : '4px 12px', 
                borderRadius: '40px',
                fontSize: isMobile ? '9px' : '11px',
                fontWeight: 'bold'
              }}>
                🥤 {t('drink_kitchen')}
              </span>
            )}
            
            <span style={{ 
              background: waitingBg,
              padding: isMobile ? '3px 10px' : '4px 12px',
              borderRadius: '40px',
              fontSize: isMobile ? '10px' : '11px',
              fontWeight: 'bold',
              color: waitingColor
            }}>
              ⏱️ {t('waiting')}: {getWaitingTime(order.created_at)}
            </span>
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '11px', color: textMuted }}>
            🕐 {new Date(order.created_at).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        
        {/* Customer Info */}
        <div style={{ marginBottom: isMobile ? '10px' : '12px' }}>
          <h4 style={{ 
            margin: 0, 
            color: textColor, 
            fontSize: isMobile ? '15px' : '17px', 
            fontWeight: 'bold' 
          }}>
            👤 {order.customer_name || t('guest')}
          </h4>
          {order.order_number && (
            <p style={{ 
              fontSize: isMobile ? '10px' : '12px', 
              color: textMuted, 
              margin: '2px 0 0 0' 
            }}>
              #{order.order_number}
            </p>
          )}
        </div>
        
        {/* Order Items with Category Labels */}
        <div style={{ 
          margin: '12px 0', 
          borderTop: `1px solid ${borderColor}`, 
          paddingTop: '10px' 
        }}>
          {order.items?.map((item, idx) => {
            const isDrink = isDrinkItem(item)
            
            return (
              <div key={idx} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '6px 0', 
                color: textColor,
                borderBottom: idx !== order.items.length - 1 ? `1px solid ${borderColor}` : 'none',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {isDrink ? (
                    <span style={{ fontSize: '10px', color: '#06b6d4' }}>🥤</span>
                  ) : (
                    <span style={{ fontSize: '10px', color: '#ef4444' }}>🍳</span>
                  )}
                  <span style={{ fontSize: isMobile ? '12px' : '13px' }}>
                    {item.quantity}x {item.name}
                  </span>
                  {item.option_type && (
                    <span style={{ 
                      fontSize: isMobile ? '8px' : '9px', 
                      color: textMuted,
                      background: secondaryBg,
                      padding: '1px 6px',
                      borderRadius: '12px'
                    }}>
                      {item.option_type === 'Panas' ? '🔥' : 
                       item.option_type === 'Sejuk' ? '🧊' : 
                       item.option_type === 'Bungkus' ? '📦' : ''}
                      {item.option_type}
                    </span>
                  )}
                  {isDrink && (
                    <span style={{ 
                      fontSize: '8px', 
                      color: '#06b6d4',
                      background: 'rgba(6,182,212,0.1)',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontWeight: 'bold'
                    }}>
                      Minuman
                    </span>
                  )}
                  {!isDrink && (
                    <span style={{ 
                      fontSize: '8px', 
                      color: '#ef4444',
                      background: 'rgba(239,68,68,0.1)',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontWeight: 'bold'
                    }}>
                      Makanan
                    </span>
                  )}
                </div>
                <span style={{ 
                  color: priceColor, 
                  fontWeight: 'bold', 
                  fontSize: isMobile ? '12px' : '13px' 
                }}>
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
            borderLeft: `3px solid #f59e0b`
          }}>
            📝 {t('note')}: {order.special_request}
          </div>
        )}
        
        {/* Total */}
        <div style={{ 
          textAlign: 'right', 
          marginBottom: showAcceptButton ? '12px' : '0',
          paddingTop: '8px',
          borderTop: `1px solid ${borderColor}`
        }}>
          <span style={{ 
            fontWeight: 'bold', 
            fontSize: isMobile ? '14px' : '16px', 
            color: textColor 
          }}>
            {t('total')}: <span style={{ color: priceColor }}>RM {order.total?.toFixed(2) || '0.00'}</span>
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
                fontSize: isMobile ? '12px' : '13px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {acceptStatus === 'preparing' ? '🔪 ' + t('start_cooking') : '✅ ' + t('finish_cooking')}
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
                fontSize: isMobile ? '12px' : '13px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              ❌ {t('cancel')}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ============================================================
  // KITCHEN DISABLED STATE
  // ============================================================
  if (!kitchenEnabled) {
    return (
      <Sidebar>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          background: bgColor, 
          padding: isMobile ? '16px' : '20px' 
        }}>
          <div style={{ 
            ...glassEffect, 
            borderRadius: '28px', 
            padding: isMobile ? '32px' : '48px', 
            maxWidth: '500px', 
            width: '90%', 
            textAlign: 'center' 
          }}>
            <div style={{ fontSize: isMobile ? '56px' : '72px', marginBottom: '20px' }}>🍳</div>
            <h2 style={{ 
              color: '#ef4444', 
              marginBottom: '10px', 
              fontWeight: 'bold', 
              fontSize: isMobile ? '20px' : '24px' 
            }}>
              {t('kitchen_disabled')}
            </h2>
            <p style={{ 
              color: textMuted, 
              marginBottom: '24px', 
              fontSize: isMobile ? '12px' : '14px' 
            }}>
              {t('kitchen_disabled_desc')}
            </p>
            <button 
              onClick={() => window.location.href = '/manage-settings'} 
              style={{ 
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
                color: 'white', 
                padding: isMobile ? '12px 24px' : '14px 32px', 
                border: 'none', 
                borderRadius: '50px', 
                cursor: 'pointer', 
                fontSize: isMobile ? '13px' : '15px', 
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {t('go_to_settings')}
            </button>
          </div>
        </div>
      </Sidebar>
    )
  }

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <Sidebar>
        <div style={{ 
          padding: isMobile ? '12px' : '20px', 
          maxWidth: '1400px', 
          margin: '0 auto', 
          background: bgColor, 
          minHeight: '100vh', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <div className="spinner"></div>
        </div>
      </Sidebar>
    )
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  const totalNew = foodOrders.length + drinkOrders.length

  const tabs = [
    { id: 'food', label: t('food_kitchen'), icon: '🍳', color: '#ef4444', count: foodOrders.length },
    { id: 'drink', label: t('drink_kitchen'), icon: '🥤', color: '#06b6d4', count: drinkOrders.length },
    { id: 'preparing', label: t('preparing_orders'), icon: '🔪', color: '#f59e0b', count: preparingOrders.length },
    { id: 'ready', label: t('ready_orders'), icon: '✅', color: '#22c55e', count: readyOrders.length },
    { id: 'completed', label: t('completed_orders'), icon: '📜', color: '#6c757d', count: completedOrders.length }
  ]

  return (
    <Sidebar>
      <div style={{ 
        padding: isMobile ? '12px' : '24px', 
        maxWidth: '1400px', 
        margin: '0 auto', 
        background: bgColor, 
        minHeight: '100vh' 
      }}>
        
        {/* ===== HEADER ===== */}
        <div style={{ 
          ...glassEffect, 
          borderRadius: '28px', 
          padding: isMobile ? '16px 20px' : '24px 32px', 
          marginBottom: '20px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '12px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: isMobile ? '36px' : '48px' }}>🍳</div>
              <div>
                <h1 style={{ 
                  color: textColor, 
                  margin: 0, 
                  fontSize: isMobile ? '20px' : '28px', 
                  fontWeight: 'bold' 
                }}>
                  {t('kitchen_title')}
                </h1>
                <p style={{ 
                  color: textMuted, 
                  marginTop: '2px', 
                  fontSize: isMobile ? '11px' : '13px' 
                }}>
                  {restaurantName} • {t('kitchen_subtitle')}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => { 
                  if (audio) { 
                    audio.currentTime = 0; 
                    audio.play().catch(e => console.log('Test sound failed:', e)) 
                  } 
                }} 
                style={{ 
                  background: soundEnabled 
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
                    : 'linear-gradient(135deg, #6c757d, #5a6268)', 
                  color: 'white', 
                  padding: isMobile ? '6px 14px' : '10px 20px', 
                  border: 'none', 
                  borderRadius: '40px', 
                  cursor: 'pointer', 
                  fontSize: isMobile ? '11px' : '13px', 
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.97)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {soundEnabled ? t('sound_on') : t('sound_off')}
              </button>
              <button 
                onClick={() => loadOrders()} 
                style={{ 
                  background: 'linear-gradient(135deg, #06b6d4, #0891b2)', 
                  color: 'white', 
                  padding: isMobile ? '6px 14px' : '10px 20px', 
                  border: 'none', 
                  borderRadius: '40px', 
                  cursor: 'pointer', 
                  fontSize: isMobile ? '11px' : '13px', 
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.97)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {isMobile ? '🔄' : t('refresh')}
              </button>
            </div>
          </div>
        </div>
        
        {/* ===== SEARCH & FILTER ===== */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '20px', 
          flexWrap: 'wrap' 
        }}>
          <div style={{ 
            ...glassEffect, 
            borderRadius: '60px', 
            padding: isMobile ? '4px 16px' : '4px 20px', 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center',
            minWidth: isMobile ? '150px' : '200px'
          }}>
            <span style={{ fontSize: isMobile ? '14px' : '18px', marginRight: '10px', color: textMuted }}>🔍</span>
            <input 
              type="text" 
              placeholder={t('search_orders')} 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ 
                width: '100%', 
                padding: isMobile ? '10px 0' : '14px 0', 
                border: 'none', 
                background: 'transparent', 
                color: textColor, 
                fontSize: isMobile ? '13px' : '14px', 
                outline: 'none' 
              }} 
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: textMuted, 
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            )}
          </div>
          <select 
            value={orderTypeFilter}
            onChange={(e) => setOrderTypeFilter(e.target.value)}
            style={{
              ...glassEffect,
              padding: isMobile ? '8px 16px' : '12px 24px',
              borderRadius: '60px',
              border: 'none',
              background: cardBg,
              color: textColor,
              fontSize: isMobile ? '12px' : '13px',
              cursor: 'pointer',
              outline: 'none',
              minWidth: isMobile ? '100px' : '140px'
            }}
          >
            <option value="all">🍽️ {t('all_orders')}</option>
            <option value="dine_in">🏠 {t('dine_in')}</option>
            <option value="take_away">🥡 {t('take_away')}</option>
          </select>
        </div>
        
        {/* ===== NEW ORDERS ALERT ===== */}
        {totalNew > 0 && (
          <div style={{ 
            background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
            color: 'white', 
            padding: isMobile ? '12px 16px' : '16px 24px', 
            borderRadius: '24px', 
            marginBottom: '20px', 
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: isMobile ? '13px' : '15px',
            boxShadow: '0 8px 24px rgba(239,68,68,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <span>🔔</span>
            <span>{totalNew} {t('new_orders')}! - {t('process_immediately')}</span>
            <span style={{ 
              display: 'flex', 
              gap: '8px', 
              fontSize: isMobile ? '11px' : '13px' 
            }}>
              {foodOrders.length > 0 && (
                <span style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  padding: '2px 10px', 
                  borderRadius: '20px' 
                }}>
                  🍳 {foodOrders.length}
                </span>
              )}
              {drinkOrders.length > 0 && (
                <span style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  padding: '2px 10px', 
                  borderRadius: '20px' 
                }}>
                  🥤 {drinkOrders.length}
                </span>
              )}
            </span>
          </div>
        )}
        
        {/* ===== TABS ===== */}
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
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)} 
              style={{ 
                flex: 1,
                minWidth: isMobile ? '60px' : 'auto',
                padding: isMobile ? '8px 12px' : '12px 20px', 
                background: activeTab === tab.id 
                  ? `linear-gradient(135deg, ${tab.color}, ${tab.color}dd)` 
                  : 'transparent', 
                color: activeTab === tab.id ? 'white' : textColor, 
                border: 'none', 
                borderRadius: '50px', 
                cursor: 'pointer', 
                fontWeight: activeTab === tab.id ? 'bold' : '500', 
                fontSize: isMobile ? '11px' : '13px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              <span>{tab.icon}</span>
              <span style={{ display: isMobile ? 'none' : 'inline' }}>{tab.label}</span>
              {tab.count > 0 && (
                <span style={{ 
                  background: activeTab === tab.id 
                    ? 'rgba(255,255,255,0.25)' 
                    : tab.color, 
                  color: 'white', 
                  borderRadius: '30px', 
                  padding: '2px 8px', 
                  fontSize: isMobile ? '8px' : '10px', 
                  fontWeight: 'bold',
                  minWidth: '18px',
                  textAlign: 'center'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        
        {/* ===== TAB CONTENT ===== */}
        {activeTab === 'food' && (
          <div>
            {filterOrders(foodOrders).length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: isMobile ? '40px 20px' : '80px 20px', 
                ...glassEffect, 
                borderRadius: '24px' 
              }}>
                <span style={{ fontSize: isMobile ? '48px' : '72px', opacity: 0.5 }}>🍳</span>
                <h3 style={{ color: textColor, marginTop: '12px', fontSize: isMobile ? '16px' : '18px' }}>
                  {t('no_food_orders')}
                </h3>
              </div>
            ) : (
              filterOrders(foodOrders).map(order => renderOrderCard(order, true, 'preparing'))
            )}
          </div>
        )}
        
        {activeTab === 'drink' && (
          <div>
            {filterOrders(drinkOrders).length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: isMobile ? '40px 20px' : '80px 20px', 
                ...glassEffect, 
                borderRadius: '24px' 
              }}>
                <span style={{ fontSize: isMobile ? '48px' : '72px', opacity: 0.5 }}>🥤</span>
                <h3 style={{ color: textColor, marginTop: '12px', fontSize: isMobile ? '16px' : '18px' }}>
                  {t('no_drink_orders')}
                </h3>
              </div>
            ) : (
              filterOrders(drinkOrders).map(order => renderOrderCard(order, true, 'preparing'))
            )}
          </div>
        )}
        
        {activeTab === 'preparing' && (
          <div>
            {filterOrders(preparingOrders).length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: isMobile ? '40px 20px' : '80px 20px', 
                ...glassEffect, 
                borderRadius: '24px' 
              }}>
                <span style={{ fontSize: isMobile ? '48px' : '72px', opacity: 0.5 }}>🔪</span>
                <h3 style={{ color: textColor, marginTop: '12px', fontSize: isMobile ? '16px' : '18px' }}>
                  {t('no_preparing_orders')}
                </h3>
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
                      padding: isMobile ? '10px' : '14px', 
                      border: 'none', 
                      borderRadius: '40px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold',
                      fontSize: isMobile ? '13px' : '15px',
                      width: '100%',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    ✅ {t('complete_all')} ({preparingOrders.length})
                  </button>
                )}
                {filterOrders(preparingOrders).map(order => renderOrderCard(order, true, 'ready'))}
              </>
            )}
          </div>
        )}
        
        {activeTab === 'ready' && (
          <div>
            {filterOrders(readyOrders).length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: isMobile ? '40px 20px' : '80px 20px', 
                ...glassEffect, 
                borderRadius: '24px' 
              }}>
                <span style={{ fontSize: isMobile ? '48px' : '72px', opacity: 0.5 }}>✅</span>
                <h3 style={{ color: textColor, marginTop: '12px', fontSize: isMobile ? '16px' : '18px' }}>
                  {t('no_ready_orders')}
                </h3>
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
                      padding: isMobile ? '10px' : '14px', 
                      border: 'none', 
                      borderRadius: '40px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold',
                      fontSize: isMobile ? '13px' : '15px',
                      width: '100%',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    ✅ {t('complete_all')} ({readyOrders.length})
                  </button>
                )}
                {filterOrders(readyOrders).map(order => renderOrderCard(order, true, 'completed'))}
              </>
            )}
          </div>
        )}
        
        {activeTab === 'completed' && (
          <div>
            {filterOrders(completedOrders).length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: isMobile ? '40px 20px' : '80px 20px', 
                ...glassEffect, 
                borderRadius: '24px' 
              }}>
                <span style={{ fontSize: isMobile ? '48px' : '72px', opacity: 0.5 }}>📜</span>
                <h3 style={{ color: textColor, marginTop: '12px', fontSize: isMobile ? '16px' : '18px' }}>
                  {t('no_completed_orders')}
                </h3>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filterOrders(completedOrders).map(order => (
                  <div key={order.id} style={{ 
                    ...glassEffect, 
                    borderRadius: '16px', 
                    padding: isMobile ? '12px 16px' : '16px 20px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexWrap: 'wrap', 
                    gap: '10px' 
                  }}>
                    <div>
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: textColor, 
                        fontSize: isMobile ? '13px' : '14px' 
                      }}>
                        {getOrderTypeIcon(order)} - {order.customer_name || t('guest')}
                      </div>
                      <div style={{ 
                        fontSize: isMobile ? '10px' : '12px', 
                        color: textMuted, 
                        marginTop: '2px' 
                      }}>
                        {order.items?.map((i, idx) => {
                          const isDrink = isDrinkItem(i)
                          return `${i.quantity}x ${i.name}${isDrink ? ' 🥤' : ' 🍳'}`
                        }).join(', ')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: priceColor, 
                        fontSize: isMobile ? '14px' : '16px' 
                      }}>
                        RM {order.total?.toFixed(2) || '0.00'}
                      </div>
                      <div style={{ 
                        fontSize: isMobile ? '9px' : '10px', 
                        color: textMuted 
                      }}>
                        {new Date(order.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* ===== STYLES ===== */}
        <style>
          {`
            .spinner { 
              width: 40px; 
              height: 40px; 
              border: 3px solid rgba(59,130,246,0.15); 
              border-top-color: #3b82f6; 
              border-radius: 50%; 
              animation: spin 1s linear infinite; 
              margin: 0 auto; 
            }
            
            @keyframes spin { 
              to { transform: rotate(360deg); } 
            }
            
            ::-webkit-scrollbar { 
              width: 6px; 
              height: 6px; 
            }
            
            ::-webkit-scrollbar-track { 
              background: ${darkMode ? '#1a1a2e' : '#e2e8f0'}; 
              border-radius: 10px; 
            }
            
            ::-webkit-scrollbar-thumb { 
              background: ${darkMode ? '#3d3d5c' : '#94a3b8'}; 
              border-radius: 10px; 
            }
            
            input, select { 
              transition: all 0.2s ease; 
            }
            
            input:focus, select:focus { 
              outline: none; 
              border-color: #3b82f6;
              box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
            }
            
            button { 
              transition: all 0.2s ease; 
            }
            
            button:hover:not(:disabled) { 
              opacity: 0.9; 
            }
            
            button:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          `}
        </style>
      </div>
    </Sidebar>
  )
}

export default KitchenApp