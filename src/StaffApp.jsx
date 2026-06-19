import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import ReceiptModal from './ReceiptModal'
import toast from 'react-hot-toast'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'
import Sidebar from './components/Sidebar'

const supabaseUrl = 'https://thtumfwamkkchuousgio.supabase.co'
const supabaseKey = 'sb_publishable_d88qlLkxoSu0Ffzp2hcUUw_cTbExB_P'

const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function for Malaysia time
const formatMalaysiaTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kuala_Lumpur',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

function StaffApp() {
  const { darkMode } = useTheme()
  const { language, t } = useLanguage()
  const [menu, setMenu] = useState([])
  const [allCategories, setAllCategories] = useState([]) // <-- NEW: Load from database
  const [drinkOptions, setDrinkOptions] = useState({})
  const [cart, setCart] = useState([])
  const [customerOrders, setCustomerOrders] = useState([])
  const [unpaidOrders, setUnpaidOrders] = useState([])
  const [orderHistory, setOrderHistory] = useState([])
  const [activeTab, setActiveTab] = useState('pos')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [showReceipt, setShowReceipt] = useState(false)
  const [currentReceiptOrder, setCurrentReceiptOrder] = useState(null)
  const [showHistoryReceipt, setShowHistoryReceipt] = useState(false)
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [serviceChargePercent, setServiceChargePercent] = useState(6)
  const [taxPercent, setTaxPercent] = useState(6)
  const [kitchenEnabled, setKitchenEnabled] = useState(true)
  const [autoCompleteEnabled, setAutoCompleteEnabled] = useState(true)
  const [autoCompleteMinutes, setAutoCompleteMinutes] = useState(5)
  
  const [showDrinkModal, setShowDrinkModal] = useState(false)
  const [selectedDrinkItem, setSelectedDrinkItem] = useState(null)
  const [selectedDrinkOption, setSelectedDrinkOption] = useState('Panas')
  
  const [orderType, setOrderType] = useState('dine_in')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [addingItemId, setAddingItemId] = useState(null)
  
  const [audio, setAudio] = useState(null)
  
  // Pagination for history
  const [historyPage, setHistoryPage] = useState(1)
  const historyItemsPerPage = 10

  // Modern theme colors
  const bgColor = darkMode ? '#0f0f1a' : '#f1f5f9'
  const cardBg = darkMode ? 'rgba(30, 30, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  const textColor = darkMode ? '#f1f5f9' : '#0f172a'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.6)'
  const inputBg = darkMode ? '#1e1e2e' : '#ffffff'
  const inputBorder = darkMode ? '#334155' : '#cbd5e1'
  const secondaryBg = darkMode ? 'rgba(30, 30, 46, 0.8)' : 'rgba(248, 250, 252, 0.9)'
  
  const glassEffect = {
    background: cardBg,
    backdropFilter: 'blur(10px)',
    border: `1px solid ${borderColor}`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
  }

  // ============================================================
  // LOAD CATEGORIES FROM DATABASE - FIXED
  // ============================================================
  async function loadAllCategories() {
    const { data } = await supabase
      .from('categories')
      .select('name, icon, sort_order')
      .order('sort_order', { ascending: true })
    
    if (data) {
      console.log('📂 Categories loaded from DB:', data.map(c => c.name))
      setAllCategories(data.map(cat => cat.name))
    }
  }

  // ============================================================
  // GET CATEGORY ICON - FIXED
  // ============================================================
  const getCategoryIcon = (catName) => {
    if (catName === 'Semua') return '🍽️'
    if (catName === 'Minuman') return '🥤'
    // Try to find in categories
    const found = categoriesData.find(c => c.name === catName)
    return found?.icon || '🍽️'
  }

  // Store full category data for icons
  const [categoriesData, setCategoriesData] = useState([])

  async function loadCategoriesData() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
    if (data) {
      setCategoriesData(data)
      setAllCategories(data.map(cat => cat.name))
    }
  }

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    if (typeof Audio !== 'undefined') {
      const sound = new Audio('/sound/notification.mp3')
      sound.load()
      setAudio(sound)
    }
  }, [])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    loadMenu()
    loadDrinkOptions()
    loadCustomerOrders()
    loadUnpaidOrders()
    loadSettings()
    loadCategoriesData() // <-- LOAD CATEGORIES FROM DB

    const menuSubscription = supabase.channel('menu_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'menu' }, () => loadMenu()).subscribe()
    const drinkSubscription = supabase.channel('drink_options_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'drink_options' }, () => loadDrinkOptions()).subscribe()
    const categorySubscription = supabase.channel('category_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => loadCategoriesData()).subscribe()

    const enableSoundOnClick = () => {
      setSoundEnabled(true)
      document.removeEventListener('click', enableSoundOnClick)
    }
    document.addEventListener('click', enableSoundOnClick)

    const orderSubscription = supabase
      .channel('customer_orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'customer_orders' }, (payload) => {
        if (payload.new.status === 'pending') {
          setCustomerOrders(prev => [payload.new, ...prev])
          if (soundEnabled && audio) {
            audio.currentTime = 0
            audio.play().catch(e => console.log('Audio play failed:', e))
          }
          document.title = '🔔 Pesanan Baru! - KedaiPOS'
          setTimeout(() => { document.title = 'KedaiPOS - Staf' }, 5000)
          toast.success(`${t('new_order')} ${payload.new.order_type === 'take_away' ? t('take_away') : `${t('table')} ${payload.new.table_number}`}!`)
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'customer_orders' }, (payload) => {
        if (payload.new.status === 'ready' && payload.old.status !== 'ready') {
          loadUnpaidOrders()
          if (soundEnabled && audio) {
            audio.currentTime = 0
            audio.play().catch(e => console.log('Audio play failed:', e))
          }
          toast.success('✅ Pesanan sedia! Sila rekod bayaran.', { duration: 4000 })
        }
        if (payload.old.status === 'pending' && payload.new.status !== 'pending') {
          loadCustomerOrders()
          loadUnpaidOrders()
        }
        if (payload.new.payment_status === 'paid' && payload.old.payment_status !== 'paid') {
          loadUnpaidOrders()
          loadOrderHistory()
        }
      })
      .subscribe()

    return () => {
      menuSubscription.unsubscribe()
      drinkSubscription.unsubscribe()
      categorySubscription.unsubscribe()
      orderSubscription.unsubscribe()
      document.removeEventListener('click', enableSoundOnClick)
    }
  }, [soundEnabled, audio])

  // ============================================================
  // REMINDER EVERY 5 SECONDS
  // ============================================================
  useEffect(() => {
    let interval
    if (customerOrders.length > 0 && activeTab !== 'orders') {
      if (soundEnabled && audio) {
        audio.currentTime = 0
        audio.play().catch(e => console.log('Reminder sound failed:', e))
      }
      toast(`🔔 ${customerOrders.length} ${t('new_orders')}! Klik tab "🆕 ${t('new_order')}" untuk proses.`, { duration: 3000, icon: '🔔' })
      interval = setInterval(() => {
        if (customerOrders.length > 0 && activeTab !== 'orders') {
          if (soundEnabled && audio) {
            audio.currentTime = 0
            audio.play().catch(e => console.log('Reminder sound failed:', e))
          }
          toast(`🔔 Masih ada ${customerOrders.length} ${t('new_orders')}! Sila proses.`, { duration: 3000, icon: '🔔' })
        }
      }, 5000)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [customerOrders.length, activeTab, soundEnabled, audio, t])

  useEffect(() => {
    let interval
    if (activeTab === 'unpaid') interval = setInterval(() => loadUnpaidOrders(), 5000)
    return () => { if (interval) clearInterval(interval) }
  }, [activeTab])

  // Reset history page when order history changes
  useEffect(() => {
    setHistoryPage(1)
  }, [orderHistory.length])

  // Auto complete orders when kitchen is disabled
  useEffect(() => {
    if (kitchenEnabled) return
    if (!autoCompleteEnabled) return
    
    const checkAndAutoComplete = async () => {
      const { data: pendingAndPreparing } = await supabase
        .from('customer_orders')
        .select('*')
        .in('status', ['pending', 'preparing'])
        .eq('payment_status', 'unpaid')
      
      if (!pendingAndPreparing || pendingAndPreparing.length === 0) return
      
      const now = new Date()
      
      for (const order of pendingAndPreparing) {
        const orderTime = new Date(order.created_at)
        const diffMinutes = Math.floor((now - orderTime) / 60000)
        
        if (diffMinutes >= autoCompleteMinutes) {
          await supabase
            .from('customer_orders')
            .update({ status: 'ready' })
            .eq('id', order.id)
          
          toast.success(`✅ Order ${order.order_number} auto completed!`)
          loadUnpaidOrders()
          loadCustomerOrders()
        }
      }
    }
    
    const interval = setInterval(checkAndAutoComplete, 60000)
    checkAndAutoComplete()
    
    return () => clearInterval(interval)
  }, [kitchenEnabled, autoCompleteEnabled, autoCompleteMinutes])

  // ============================================================
  // DATA LOADING FUNCTIONS
  // ============================================================
  async function loadSettings() {
    const { data } = await supabase.from('settings').select('key, value')
    if (data) {
      const sc = data.find(s => s.key === 'service_charge')
      const tx = data.find(s => s.key === 'tax')
      const kitchen = data.find(s => s.key === 'kitchen_enabled')
      const autoComplete = data.find(s => s.key === 'auto_complete_enabled')
      const autoCompleteMin = data.find(s => s.key === 'auto_complete_minutes')
      
      if (sc) setServiceChargePercent(parseFloat(sc.value) || 0)
      if (tx) setTaxPercent(parseFloat(tx.value) || 0)
      if (kitchen) setKitchenEnabled(kitchen.value === 'true')
      if (autoComplete) setAutoCompleteEnabled(autoComplete.value === 'true')
      if (autoCompleteMin) setAutoCompleteMinutes(parseInt(autoCompleteMin.value) || 5)
    }
  }

  async function loadMenu() {
    const { data } = await supabase.from('menu').select('*')
    setMenu(data || [])
  }

  async function loadDrinkOptions() {
    const { data } = await supabase.from('drink_options').select('*')
    const optionsMap = {}
    data?.forEach(opt => {
      if (!optionsMap[opt.drink_name]) optionsMap[opt.drink_name] = []
      optionsMap[opt.drink_name].push({ type: opt.option_type, price: opt.price })
    })
    setDrinkOptions(optionsMap)
  }

  async function loadCustomerOrders() {
    const { data } = await supabase.from('customer_orders').select('*').eq('status', 'pending').order('created_at', { ascending: false })
    setCustomerOrders(data || [])
  }

  async function loadUnpaidOrders() {
    const { data: unpaid } = await supabase.from('customer_orders').select('*').eq('payment_status', 'unpaid').in('status', ['pending', 'ready', 'preparing']).order('created_at', { ascending: false })
    setUnpaidOrders(unpaid || [])
  }

  async function loadOrderHistory() {
    const { data: paidOrders } = await supabase.from('customer_orders').select('*').eq('payment_status', 'paid').order('created_at', { ascending: false }).limit(200)
    setOrderHistory(paidOrders || [])
  }

  // ============================================================
  // ORDER MANAGEMENT
  // ============================================================
  async function updateOrderStatus(orderId, status) {
    const table = 'customer_orders'
    if (status === 'accepted') {
      if (kitchenEnabled) {
        await supabase.from(table).update({ status: 'preparing', payment_status: 'unpaid' }).eq('id', orderId)
        setCustomerOrders(prev => prev.filter(order => order.id !== orderId))
        toast.success('✅ ' + t('start_cooking'))
        await loadUnpaidOrders()
        await loadCustomerOrders()
      } else {
        await supabase.from(table).update({ status: 'ready', payment_status: 'unpaid' }).eq('id', orderId)
        setCustomerOrders(prev => prev.filter(order => order.id !== orderId))
        toast.success('✅ Pesanan diterima! Sedia untuk bayar.')
        await loadUnpaidOrders()
        await loadCustomerOrders()
      }
    } else if (status === 'cancelled') {
      await supabase.from(table).update({ status: 'cancelled', payment_status: 'cancelled' }).eq('id', orderId)
      setCustomerOrders(prev => prev.filter(order => order.id !== orderId))
      toast.error('❌ ' + t('cancelled'))
      await loadCustomerOrders()
    }
  }

  async function markAsPaid(order) {
    const subtotal = parseFloat(order.subtotal || order.total || 0)
    const serviceCharge = order.order_type === 'take_away' ? 0 : subtotal * (serviceChargePercent / 100)
    const tax = subtotal * (taxPercent / 100)
    const grandTotal = subtotal + serviceCharge + tax
    
    await supabase.from('customer_orders').update({ 
      payment_status: 'paid', 
      payment_method: paymentMethod, 
      paid_at: new Date().toISOString(), 
      subtotal, 
      service_charge: serviceCharge, 
      tax, 
      grand_total: grandTotal 
    }).eq('id', order.id)
    
    await loadUnpaidOrders()
    await loadOrderHistory()
    setShowPaymentModal(false)
    setCurrentReceiptOrder({ 
      ...order, 
      payment_method: paymentMethod, 
      paid_at: new Date().toISOString(), 
      subtotal, 
      service_charge: serviceCharge, 
      tax, 
      grand_total: grandTotal 
    })
    setShowReceipt(true)
    setSelectedOrder(null)
    toast.success(`✅ ${t('payment_received')} RM ${grandTotal.toFixed(2)}!`)
  }

  function openPaymentModal(order) { 
    setSelectedOrder(order); 
    setShowPaymentModal(true) 
  }
  
  function reprintReceipt(order) { 
    setSelectedHistoryOrder(order); 
    setShowHistoryReceipt(true) 
  }
  
  function getSubtotal() { 
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) 
  }
  
  function getServiceCharge() { 
    return orderType === 'take_away' ? 0 : getSubtotal() * (serviceChargePercent / 100) 
  }
  
  function getTax() { 
    return getSubtotal() * (taxPercent / 100) 
  }
  
  function getGrandTotal() { 
    return getSubtotal() + getServiceCharge() + getTax() 
  }

  // ============================================================
  // CART FUNCTIONS
  // ============================================================
  const openDrinkOptionsForItem = (item) => { 
    setSelectedDrinkItem(item); 
    setSelectedDrinkOption('Panas'); 
    setShowDrinkModal(true) 
  }
  
  const addDrinkToCart = () => {
    if (!selectedDrinkItem) return
    const options = drinkOptions[selectedDrinkItem.name]
    const selected = options?.find(opt => opt.type === selectedDrinkOption)
    if (!selected) return
    
    setAddingItemId(`${selectedDrinkItem.id}_${selectedDrinkOption}`)
    setTimeout(() => setAddingItemId(null), 300)
    
    const optionLabel = selectedDrinkOption === 'Panas' ? '☕ Panas' : '🧊 Sejuk'
    
    setCart([...cart, { 
      id: `${selectedDrinkItem.id}_${selectedDrinkOption}`, 
      name: `${selectedDrinkItem.name} (${optionLabel})`, 
      price: selected.price, 
      quantity: 1,
      category: 'Minuman',
      option_type: selectedDrinkOption
    }])
    setShowDrinkModal(false)
    setSelectedDrinkItem(null)
    toast.success(`✓ ${selectedDrinkItem.name} (${optionLabel}) ditambah!`)
  }

  function addToCart(item) {
    setAddingItemId(item.id)
    setTimeout(() => setAddingItemId(null), 300)
    
    const hasDrinkOptions = drinkOptions[item.name] && drinkOptions[item.name].length > 0
    const isDrink = item.category === 'Minuman'
    
    if (hasDrinkOptions || isDrink) {
      openDrinkOptionsForItem(item)
    } else {
      const existing = cart.find(x => x.id === item.id && !x.option_type)
      if (existing) {
        setCart(cart.map(x => x.id === item.id && !x.option_type ? { ...x, quantity: x.quantity + 1 } : x))
      } else {
        setCart([...cart, { 
          ...item, 
          quantity: 1,
          category: item.category || 'Makanan' 
        }])
      }
      toast.success(`✓ ${item.name} ditambah!`)
    }
  }

  function removeFromCart(id) {
    const existing = cart.find(x => x.id === id)
    if (existing.quantity === 1) {
      setCart(cart.filter(x => x.id !== id))
    } else {
      setCart(cart.map(x => x.id === id ? { ...x, quantity: x.quantity - 1 } : x))
    }
  }

  async function saveOrder() {
    if (cart.length === 0) { 
      toast.error(t('empty_cart')); 
      return 
    }
    if (orderType === 'dine_in' && !tableNumber) { 
      toast.error('Sila masukkan nombor meja untuk Dine In!'); 
      return 
    }
    const orderNumber = 'ORD-' + Date.now()
    const items = cart.map(item => ({ 
      id: item.id, 
      name: item.name, 
      price: item.price, 
      quantity: item.quantity, 
      category: item.category,
      option_type: item.option_type || null
    }))
    const subtotal = getSubtotal()
    const serviceCharge = getServiceCharge()
    const tax = getTax()
    const grandTotal = getGrandTotal()
    const orderData = { 
      order_number: orderNumber, 
      items, 
      subtotal, 
      service_charge: serviceCharge, 
      tax, 
      total: grandTotal, 
      payment_status: 'unpaid', 
      status: 'pending' 
    }
    if (orderType === 'take_away') { 
      orderData.order_type = 'take_away'; 
      orderData.customer_name = customerName || 'Take Away'; 
      orderData.customer_phone = customerPhone || ''; 
      orderData.table_number = 0 
    }
    else if (orderType === 'dine_in' && tableNumber) { 
      orderData.order_type = 'dine_in'; 
      orderData.customer_name = customerName || 'Walk-in'; 
      orderData.table_number = parseInt(tableNumber) 
    }
    const { error } = await supabase.from('customer_orders').insert([orderData])
    if (error) {
      toast.error('Ralat: ' + error.message)
    } else {
      toast.success(`Pesanan ${orderNumber} dihantar ke dapur!`)
      setCart([])
      setCustomerName('')
      setCustomerPhone('')
      setTableNumber('')
      loadCustomerOrders()
    }
  }

  async function manualRefresh() { 
    await loadMenu(); 
    await loadDrinkOptions(); 
    await loadCustomerOrders(); 
    await loadUnpaidOrders(); 
    await loadSettings();
    await loadCategoriesData();
    toast.success('🔄 Data telah direfresh!') 
  }

  // ============================================================
  // GET CATEGORIES - FIXED: USE DATABASE CATEGORIES
  // ============================================================
  // Build categories list: 'Semua' + all categories from database
  const categories = ['Semua', ...allCategories]
  
  // Filter menu by selected category
  const filteredMenu = selectedCategory === 'Semua' 
    ? menu 
    : menu.filter(item => item.category === selectedCategory)

  // ============================================================
  // HELPERS
  // ============================================================
  const getDefaultIcon = (category) => {
    if (category === 'Minuman') return '🥤'
    const found = categoriesData.find(c => c.name === category)
    if (found && found.icon) return found.icon
    switch(category) {
      case 'Makanan': return '🍚'
      case 'SUP': return '🍜'
      default: return '🍽️'
    }
  }

  const getCategoryIconForFilter = (cat) => {
    if (cat === 'Semua') return '🍽️'
    if (cat === 'Minuman') return '🥤'
    const found = categoriesData.find(c => c.name === cat)
    return found?.icon || '🍽️'
  }

  const renderOrderItems = (items) => {
    if (!items) return null
    return items.map((item, idx) => {
      const optionLabel = item.option_type === 'Panas' ? '🔥' : item.option_type === 'Sejuk' ? '🧊' : ''
      return (
        <div key={idx} style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '8px 0', 
          borderBottom: idx !== items.length - 1 ? `1px solid ${borderColor}` : 'none' 
        }}>
          <span style={{ color: textColor, flex: 2, fontSize: isMobile ? '12px' : '14px' }}>
            {item.name} {optionLabel && <span style={{ fontSize: '12px' }}>{optionLabel}</span>}
          </span>
          <span style={{ color: textMuted, textAlign: 'center', flex: 1, fontSize: isMobile ? '11px' : '13px' }}>x{item.quantity}</span>
          <span style={{ color: '#22c55e', fontWeight: 'bold', textAlign: 'right', flex: 1, fontSize: isMobile ? '12px' : '14px' }}>RM {(item.price * item.quantity).toFixed(2)}</span>
        </div>
      )
    })
  }

  const renderUnpaidItems = (items) => {
    if (!items) return null
    return items.map((item, idx) => {
      const optionLabel = item.option_type === 'Panas' ? '🔥' : item.option_type === 'Sejuk' ? '🧊' : ''
      return (
        <div key={idx} style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          padding: '8px 0', 
          borderBottom: idx !== items.length - 1 ? `1px solid ${borderColor}` : 'none' 
        }}>
          <span style={{ color: textColor, fontSize: isMobile ? '12px' : '14px' }}>
            {item.name} {optionLabel && <span style={{ fontSize: '12px' }}>{optionLabel}</span>}
            <span style={{ color: textMuted, marginLeft: '4px' }}>x{item.quantity}</span>
          </span>
          <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: isMobile ? '12px' : '14px' }}>RM {(item.price * item.quantity).toFixed(2)}</span>
        </div>
      )
    })
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <Sidebar>
      <div style={{ 
        padding: isMobile ? '12px' : '24px', 
        maxWidth: '1400px', 
        margin: '0 auto', 
        background: bgColor, 
        minHeight: '100vh' 
      }}>
        
        {/* TOP BAR */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px', 
          flexWrap: 'wrap', 
          gap: '12px' 
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ 
              background: kitchenEnabled ? '#22c55e' : '#ef4444', 
              color: 'white', 
              padding: '6px 16px', 
              borderRadius: '40px', 
              fontSize: isMobile ? '10px' : '12px', 
              fontWeight: 'bold', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              🍳 {t('kitchen')}: {kitchenEnabled ? 'ON' : 'OFF'}
            </div>
            {!kitchenEnabled && autoCompleteEnabled && (
              <div style={{ 
                background: '#3b82f6', 
                color: 'white', 
                padding: '6px 16px', 
                borderRadius: '40px', 
                fontSize: isMobile ? '10px' : '12px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                ⏱️ Auto Complete: {autoCompleteMinutes} min
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={manualRefresh} 
              style={{ 
                background: 'linear-gradient(135deg, #06b6d4, #0891b2)', 
                color: 'white', 
                padding: isMobile ? '6px 14px' : '8px 20px', 
                border: 'none', 
                borderRadius: '40px', 
                cursor: 'pointer', 
                fontSize: isMobile ? '11px' : '13px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🔄 <span style={{ display: isMobile ? 'none' : 'inline' }}>{t('refresh')}</span>
            </button>
            <button 
              onClick={() => { 
                if (audio) { 
                  audio.currentTime = 0; 
                  audio.play().catch(e => console.log('Test sound failed:', e)) 
                } 
              }} 
              style={{ 
                background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
                color: textColor, 
                padding: isMobile ? '6px 14px' : '8px 20px', 
                border: `1px solid ${borderColor}`, 
                borderRadius: '40px', 
                cursor: 'pointer', 
                fontSize: isMobile ? '11px' : '13px', 
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🔊 <span style={{ display: isMobile ? 'none' : 'inline' }}>{t('sound')} Test</span>
            </button>
          </div>
        </div>

        {/* SETTINGS BAR */}
        <div style={{ 
          ...glassEffect, 
          borderRadius: '24px', 
          padding: isMobile ? '10px 16px' : '12px 20px', 
          marginBottom: '24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '8px', 
          fontSize: isMobile ? '11px' : '13px' 
        }}>
          <span style={{ color: textColor }}>
            ⚙️ {t('service_charge')}: {serviceChargePercent}% {orderType === 'take_away' && `(${t('take_away')} - Tiada)`}
          </span>
          <span style={{ color: textColor }}>
            🏷️ {t('tax')}: {taxPercent}%
          </span>
          <span style={{ color: textColor, fontWeight: 'bold' }}>
            💰 {t('unpaid')}: {unpaidOrders.length}
          </span>
        </div>

        {/* ORDER TYPE SELECTION */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '24px', 
          background: cardBg, 
          borderRadius: '60px', 
          padding: '4px', 
          ...glassEffect 
        }}>
          <button 
            onClick={() => { 
              setOrderType('dine_in'); 
              setCustomerName(''); 
              setCustomerPhone(''); 
              setTableNumber(''); 
            }} 
            style={{ 
              flex: 1, 
              padding: isMobile ? '10px 16px' : '12px 20px', 
              background: orderType === 'dine_in' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent', 
              color: orderType === 'dine_in' ? 'white' : textColor, 
              border: 'none', 
              borderRadius: '50px', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              fontSize: isMobile ? '12px' : '14px' 
            }}
          >
            🍽️ {t('dine_in')}
          </button>
          <button 
            onClick={() => { 
              setOrderType('take_away'); 
              setCustomerName(''); 
              setCustomerPhone(''); 
              setTableNumber(''); 
            }} 
            style={{ 
              flex: 1, 
              padding: isMobile ? '10px 16px' : '12px 20px', 
              background: orderType === 'take_away' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'transparent', 
              color: orderType === 'take_away' ? 'white' : textColor, 
              border: 'none', 
              borderRadius: '50px', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              fontSize: isMobile ? '12px' : '14px' 
            }}
          >
            🥡 {t('take_away')}
          </button>
        </div>

        {/* ORDER DETAILS INPUT */}
        <div style={{ 
          ...glassEffect, 
          borderRadius: '24px', 
          padding: isMobile ? '14px' : '20px', 
          marginBottom: '24px', 
          display: 'flex', 
          gap: '12px', 
          flexWrap: 'wrap' 
        }}>
          {orderType === 'dine_in' && (
            <>
              <input 
                type="number" 
                placeholder={t('table_number')} 
                value={tableNumber} 
                onChange={(e) => setTableNumber(e.target.value)} 
                style={{ 
                  padding: isMobile ? '10px 14px' : '14px 16px', 
                  borderRadius: '16px', 
                  border: `1px solid ${inputBorder}`, 
                  background: inputBg, 
                  color: textColor, 
                  flex: 1, 
                  minWidth: '120px', 
                  outline: 'none', 
                  fontSize: isMobile ? '13px' : '14px' 
                }} 
              />
              <input 
                type="text" 
                placeholder={t('customer_name')} 
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)} 
                style={{ 
                  padding: isMobile ? '10px 14px' : '14px 16px', 
                  borderRadius: '16px', 
                  border: `1px solid ${inputBorder}`, 
                  background: inputBg, 
                  color: textColor, 
                  flex: 2, 
                  outline: 'none', 
                  fontSize: isMobile ? '13px' : '14px' 
                }} 
              />
            </>
          )}
          {orderType === 'take_away' && (
            <>
              <input 
                type="text" 
                placeholder={t('customer_name')} 
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)} 
                style={{ 
                  padding: isMobile ? '10px 14px' : '14px 16px', 
                  borderRadius: '16px', 
                  border: `1px solid ${inputBorder}`, 
                  background: inputBg, 
                  color: textColor, 
                  flex: 1, 
                  outline: 'none', 
                  fontSize: isMobile ? '13px' : '14px' 
                }} 
              />
              <input 
                type="tel" 
                placeholder={t('customer_phone')} 
                value={customerPhone} 
                onChange={(e) => setCustomerPhone(e.target.value)} 
                style={{ 
                  padding: isMobile ? '10px 14px' : '14px 16px', 
                  borderRadius: '16px', 
                  border: `1px solid ${inputBorder}`, 
                  background: inputBg, 
                  color: textColor, 
                  flex: 1, 
                  outline: 'none', 
                  fontSize: isMobile ? '13px' : '14px' 
                }} 
              />
            </>
          )}
        </div>

        {/* TABS */}
        <div style={{ 
          display: 'flex', 
          gap: '4px', 
          marginBottom: '28px', 
          background: darkMode ? 'rgba(30, 30, 46, 0.5)' : 'rgba(0,0,0,0.03)', 
          borderRadius: '60px', 
          padding: '4px', 
          overflowX: 'auto', 
          flexWrap: 'nowrap' 
        }}>
          {[
            { id: 'pos', icon: '🧾', label: t('pos') },
            { id: 'orders', icon: '🆕', label: t('new_order'), badge: customerOrders.length },
            { id: 'unpaid', icon: '💰', label: t('unpaid'), badge: unpaidOrders.length },
            { id: 'history', icon: '📜', label: language === 'bm' ? 'Sejarah' : 'History', badge: 0 }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => { 
                setActiveTab(tab.id); 
                if (tab.id === 'orders') loadCustomerOrders(); 
                if (tab.id === 'unpaid') loadUnpaidOrders(); 
                if (tab.id === 'history') loadOrderHistory(); 
              }} 
              style={{ 
                flex: 1, 
                padding: isMobile ? '10px 12px' : '12px 20px', 
                background: activeTab === tab.id ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent', 
                color: activeTab === tab.id ? 'white' : textColor, 
                border: 'none', 
                borderRadius: '50px', 
                cursor: 'pointer', 
                fontWeight: activeTab === tab.id ? 'bold' : '500', 
                fontSize: isMobile ? '12px' : '14px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '6px',
                whiteSpace: 'nowrap',
                minWidth: isMobile ? 'auto' : '80px'
              }}
            >
              <span style={{ fontSize: isMobile ? '14px' : '16px' }}>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span style={{ 
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : '#ef4444', 
                  color: 'white', 
                  borderRadius: '20px', 
                  padding: '1px 8px', 
                  fontSize: '10px', 
                  fontWeight: 'bold',
                  minWidth: '20px',
                  textAlign: 'center'
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* NEW ORDERS ALERT */}
        {customerOrders.length > 0 && activeTab !== 'orders' && (
          <div 
            onClick={() => setActiveTab('orders')} 
            style={{ 
              background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
              color: 'white', 
              padding: isMobile ? '14px 20px' : '16px 24px', 
              borderRadius: '28px', 
              marginBottom: '24px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(239,68,68,0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: isMobile ? '24px' : '28px' }}>🔔</span>
              <div>
                <strong style={{ fontSize: isMobile ? '14px' : '16px' }}>
                  {customerOrders.length} {t('new_orders')}!
                </strong>
                <br />
                <small style={{ fontSize: isMobile ? '10px' : '11px', opacity: 0.9 }}>
                  Klik untuk lihat dan proses
                </small>
              </div>
            </div>
            <div style={{ 
              background: 'white', 
              color: '#dc2626', 
              padding: '4px 14px', 
              borderRadius: '40px', 
              fontWeight: 'bold', 
              fontSize: isMobile ? '16px' : '18px' 
            }}>
              {customerOrders.length}
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* POS TAB - WITH FIXED CATEGORIES FROM DATABASE */}
        {/* ========================================================== */}
        {activeTab === 'pos' && (
          <>
            <h1 style={{ 
              color: textColor, 
              fontSize: isMobile ? '20px' : '26px', 
              marginBottom: '20px', 
              fontWeight: 'bold' 
            }}>
              🧾 KedaiPOS - {t('staff')} {orderType === 'take_away' ? `(${t('take_away')})` : `(${t('dine_in')})`}
            </h1>
            
            {/* CATEGORY FILTERS - FIXED: SHOW ALL FROM DATABASE */}
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              flexWrap: 'wrap', 
              marginBottom: '24px',
              padding: '4px'
            }}>
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)} 
                  style={{ 
                    padding: isMobile ? '8px 18px' : '10px 24px', 
                    background: selectedCategory === cat ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent', 
                    color: selectedCategory === cat ? 'white' : textColor, 
                    border: selectedCategory === cat ? 'none' : `1px solid ${borderColor}`, 
                    borderRadius: '50px', 
                    cursor: 'pointer', 
                    fontWeight: selectedCategory === cat ? 'bold' : '500', 
                    fontSize: isMobile ? '12px' : '14px',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat === 'Semua' ? '🍽️ Semua' : `${getCategoryIconForFilter(cat)} ${cat}`}
                </button>
              ))}
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '24px', 
              flexWrap: 'wrap', 
              flexDirection: isMobile ? 'column' : 'row' 
            }}>
              {/* MENU GRID */}
              <div style={{ flex: 2 }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(170px, 1fr))', 
                  gap: isMobile ? '12px' : '20px' 
                }}>
                  {filteredMenu.map(item => {
                    const hasDrinkOptions = drinkOptions[item.name] && drinkOptions[item.name].length > 0
                    const hasImage = item.image_url && item.image_url !== null && item.image_url.trim() !== ''
                    const panasPrice = hasDrinkOptions ? drinkOptions[item.name]?.find(o => o.type === 'Panas')?.price : null
                    const sejukPrice = hasDrinkOptions ? drinkOptions[item.name]?.find(o => o.type === 'Sejuk')?.price : null
                    const isAdding = addingItemId === item.id
                    const hasDescription = item.description && item.description.trim() !== ''
                    
                    return (
                      <div 
                        key={item.id} 
                        style={{ 
                          ...glassEffect, 
                          borderRadius: '24px', 
                          padding: isMobile ? '14px' : '18px', 
                          textAlign: 'center', 
                          cursor: 'pointer', 
                          transition: 'transform 0.25s, box-shadow 0.25s' 
                        }}
                        onMouseEnter={e => { 
                          e.currentTarget.style.transform = 'translateY(-4px)'; 
                          e.currentTarget.style.boxShadow = darkMode 
                            ? '0 20px 32px rgba(0,0,0,0.4)' 
                            : '0 20px 32px rgba(0,0,0,0.12)' 
                        }}
                        onMouseLeave={e => { 
                          e.currentTarget.style.transform = 'translateY(0)'; 
                          e.currentTarget.style.boxShadow = 'none' 
                        }}
                      >
                        {hasImage ? (
                          <img 
                            src={item.image_url} 
                            alt={item.name} 
                            style={{ 
                              width: isMobile ? '70px' : '90px', 
                              height: isMobile ? '70px' : '90px', 
                              objectFit: 'cover', 
                              borderRadius: '18px', 
                              margin: '0 auto 12px auto', 
                              display: 'block',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }} 
                          />
                        ) : (
                          <div style={{ 
                            width: isMobile ? '60px' : '70px', 
                            height: isMobile ? '60px' : '70px', 
                            background: secondaryBg, 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            margin: '0 auto 12px auto', 
                            fontSize: isMobile ? '30px' : '36px',
                            border: `1px solid ${borderColor}`
                          }}>
                            {getDefaultIcon(item.category)}
                          </div>
                        )}
                        <h3 style={{ 
                          fontSize: isMobile ? '13px' : '15px', 
                          margin: '8px 0', 
                          color: textColor, 
                          fontWeight: 'bold' 
                        }}>
                          {item.name}
                        </h3>
                        
                        {hasDescription && (
                          <div style={{ 
                            fontSize: isMobile ? '9px' : '11px', 
                            color: textMuted, 
                            fontStyle: 'italic',
                            marginBottom: '6px',
                            background: secondaryBg,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: `1px solid ${borderColor}`
                          }}>
                            📝 {item.description}
                          </div>
                        )}
                        
                        {hasDrinkOptions ? (
                          <div style={{ 
                            fontSize: isMobile ? '10px' : '12px', 
                            marginBottom: '12px', 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            justifyContent: 'center', 
                            gap: '6px' 
                          }}>
                            {panasPrice && <span style={{ color: '#f97316' }}>🔥 RM {panasPrice}</span>}
                            {sejukPrice && <span style={{ color: '#06b6d4' }}>🧊 RM {sejukPrice}</span>}
                          </div>
                        ) : (
                          <p style={{ 
                            color: darkMode ? '#4ade80' : '#22c55e', 
                            fontSize: isMobile ? '16px' : '18px', 
                            fontWeight: 'bold', 
                            margin: '8px 0' 
                          }}>
                            RM {item.price}
                          </p>
                        )}
                        
                        <button 
                          onClick={() => addToCart(item)} 
                          style={{ 
                            background: isAdding ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #3b82f6, #2563eb)', 
                            color: 'white', 
                            padding: isMobile ? '8px 0' : '10px 0', 
                            border: 'none', 
                            borderRadius: '60px', 
                            cursor: 'pointer', 
                            width: '100%', 
                            fontSize: isMobile ? '11px' : '13px', 
                            fontWeight: 'bold',
                            transition: 'all 0.2s'
                          }}
                        >
                          {isAdding ? '✓ Ditambah!' : `+ ${t('add')}`}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* CART SECTION */}
              <div style={{ 
                flex: 1, 
                ...glassEffect, 
                borderRadius: '28px', 
                padding: isMobile ? '16px' : '20px', 
                position: isMobile ? 'relative' : 'sticky', 
                top: '20px', 
                alignSelf: 'flex-start', 
                maxHeight: isMobile ? 'auto' : 'calc(100vh - 40px)', 
                overflowY: 'auto' 
              }}>
                <h2 style={{ 
                  color: textColor, 
                  fontSize: isMobile ? '18px' : '20px', 
                  marginBottom: '20px', 
                  fontWeight: 'bold' 
                }}>
                  🛒 {t('cart')} ({cart.reduce((s, i) => s + i.quantity, 0)})
                </h2>
                
                {cart.length === 0 ? (
                  <p style={{ 
                    color: textMuted, 
                    textAlign: 'center', 
                    padding: '40px 20px', 
                    fontSize: isMobile ? '13px' : '14px' 
                  }}>
                    {t('empty_cart')}
                  </p>
                ) : (
                  <>
                    <div style={{ marginBottom: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                      {cart.map(item => {
                        const optionLabel = item.option_type === 'Panas' ? '🔥' : item.option_type === 'Sejuk' ? '🧊' : ''
                        return (
                          <div key={item.id} style={{ 
                            borderBottom: `1px solid ${borderColor}`, 
                            marginBottom: '12px', 
                            paddingBottom: '10px' 
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ 
                                  color: textColor, 
                                  fontWeight: '500', 
                                  fontSize: isMobile ? '12px' : '14px' 
                                }}>
                                  {item.name} {optionLabel}
                                </span>
                                <div style={{ 
                                  fontSize: isMobile ? '10px' : '12px', 
                                  color: textMuted 
                                }}>
                                  x{item.quantity}
                                </div>
                              </div>
                              <span style={{ 
                                color: darkMode ? '#4ade80' : '#22c55e', 
                                fontWeight: 'bold', 
                                fontSize: isMobile ? '12px' : '14px' 
                              }}>
                                RM {(item.price * item.quantity).toFixed(2)}
                              </span>
                              <button 
                                onClick={() => removeFromCart(item.id)} 
                                style={{ 
                                  background: '#ef4444', 
                                  color: 'white', 
                                  border: 'none', 
                                  borderRadius: '30px', 
                                  padding: '4px 12px', 
                                  cursor: 'pointer', 
                                  fontSize: isMobile ? '10px' : '12px', 
                                  fontWeight: 'bold' 
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    <hr style={{ borderColor: borderColor, margin: '16px 0' }} />
                    
                    <div style={{ fontSize: isMobile ? '12px' : '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: textColor }}>{t('subtotal')}:</span>
                        <span style={{ color: textColor }}>RM {getSubtotal().toFixed(2)}</span>
                      </div>
                      {orderType !== 'take_away' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: textColor }}>{t('service_charge')} ({serviceChargePercent}%):</span>
                          <span style={{ color: textColor }}>RM {getServiceCharge().toFixed(2)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: textColor }}>{t('tax')} ({taxPercent}%):</span>
                        <span style={{ color: textColor }}>RM {getTax().toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <hr style={{ borderColor: borderColor, margin: '16px 0' }} />
                    
                    <h3 style={{ 
                      textAlign: 'right', 
                      color: darkMode ? '#4ade80' : '#22c55e', 
                      fontSize: isMobile ? '18px' : '22px', 
                      marginBottom: '20px', 
                      fontWeight: 'bold' 
                    }}>
                      {t('total')}: RM {getGrandTotal().toFixed(2)}
                    </h3>
                    
                    <button 
                      onClick={saveOrder} 
                      style={{ 
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
                        color: 'white', 
                        padding: isMobile ? '12px' : '14px', 
                        width: '100%', 
                        border: 'none', 
                        borderRadius: '60px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold', 
                        fontSize: isMobile ? '13px' : '15px' 
                      }}
                    >
                      💾 {t('place_order')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* ========================================================== */}
        {/* ORDERS TAB */}
        {/* ========================================================== */}
        {activeTab === 'orders' && (
          <div>
            <h2 style={{ 
              color: textColor, 
              marginBottom: '24px', 
              fontSize: isMobile ? '18px' : '20px', 
              fontWeight: 'bold', 
              borderLeft: '4px solid #ef4444', 
              paddingLeft: '14px' 
            }}>
              🆕 {t('new_order')}
            </h2>
            {customerOrders.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: isMobile ? '40px 20px' : '80px 20px', 
                ...glassEffect, 
                borderRadius: '28px' 
              }}>
                <span style={{ fontSize: isMobile ? '48px' : '64px', opacity: 0.5 }}>🍽️</span>
                <p style={{ color: textMuted, marginTop: '16px', fontSize: isMobile ? '14px' : '16px' }}>
                  {t('no_data')}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {customerOrders.map(order => (
                  <div key={order.id} style={{ 
                    ...glassEffect, 
                    borderRadius: '28px', 
                    padding: isMobile ? '16px' : '24px', 
                    borderLeft: `4px solid #ef4444` 
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginBottom: '16px', 
                      flexWrap: 'wrap', 
                      gap: '12px' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: isMobile ? '24px' : '28px' }}>
                          {order.order_type === 'take_away' ? '🥡' : '🍽️'}
                        </span>
                        <h3 style={{ 
                          margin: 0, 
                          fontSize: isMobile ? '14px' : '16px', 
                          color: textColor, 
                          fontWeight: 'bold' 
                        }}>
                          {order.order_type === 'take_away' ? t('take_away') : `${t('table')} ${order.table_number}`}
                        </h3>
                        <span style={{ 
                          background: '#ef4444', 
                          color: 'white', 
                          padding: '4px 12px', 
                          borderRadius: '40px', 
                          fontSize: isMobile ? '9px' : '10px', 
                          fontWeight: 'bold' 
                        }}>
                          {t('pending')}
                        </span>
                      </div>
                      <div style={{ fontSize: isMobile ? '10px' : '12px', color: textMuted }}>
                        🕐 {formatMalaysiaTime(order.created_at)}
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <span style={{ fontWeight: 'bold', color: textColor, fontSize: isMobile ? '12px' : '14px' }}>
                        {t('customer_name')}:
                      </span>
                      <span style={{ color: textColor, marginLeft: '8px', fontSize: isMobile ? '12px' : '14px' }}>
                        {order.customer_name || 'Walk-in'}
                      </span>
                      {order.customer_phone && (
                        <span style={{ marginLeft: '12px', fontSize: isMobile ? '11px' : '12px', color: textMuted }}>
                          📞 {order.customer_phone}
                        </span>
                      )}
                    </div>
                    
                    <div style={{ 
                      background: secondaryBg, 
                      borderRadius: '20px', 
                      padding: isMobile ? '12px' : '16px', 
                      margin: '16px 0' 
                    }}>
                      {renderOrderItems(order.items)}
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginTop: '16px', 
                      paddingTop: '16px', 
                      borderTop: `1px solid ${borderColor}`, 
                      flexWrap: 'wrap', 
                      gap: '12px' 
                    }}>
                      <div>
                        <span style={{ fontSize: isMobile ? '12px' : '14px', color: textMuted }}>
                          {t('total')}:
                        </span>
                        <span style={{ 
                          fontSize: isMobile ? '20px' : '22px', 
                          fontWeight: 'bold', 
                          color: '#22c55e', 
                          marginLeft: '8px' 
                        }}>
                          RM {order.total || order.subtotal || '0.00'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'accepted')} 
                          style={{ 
                            background: kitchenEnabled ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #06b6d4, #0891b2)', 
                            color: 'white', 
                            padding: isMobile ? '8px 18px' : '10px 24px', 
                            border: 'none', 
                            borderRadius: '40px', 
                            cursor: 'pointer', 
                            fontWeight: 'bold', 
                            fontSize: isMobile ? '11px' : '13px' 
                          }}
                        >
                          {kitchenEnabled ? `✅ ${t('accept')} & ${t('start_cooking')}` : `✅ ${t('accept')} (${t('ready')})`}
                        </button>
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'cancelled')} 
                          style={{ 
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
                            color: 'white', 
                            padding: isMobile ? '8px 18px' : '10px 24px', 
                            border: 'none', 
                            borderRadius: '40px', 
                            cursor: 'pointer', 
                            fontWeight: 'bold', 
                            fontSize: isMobile ? '11px' : '13px' 
                          }}
                        >
                          ❌ {t('cancel')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* UNPAID TAB */}
        {/* ========================================================== */}
        {activeTab === 'unpaid' && (
          <div>
            <h2 style={{ 
              color: textColor, 
              marginBottom: '24px', 
              fontSize: isMobile ? '18px' : '20px', 
              fontWeight: 'bold', 
              borderLeft: '4px solid #eab308', 
              paddingLeft: '14px' 
            }}>
              💰 {t('unpaid')}
            </h2>
            {unpaidOrders.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: isMobile ? '40px 20px' : '80px 20px', 
                ...glassEffect, 
                borderRadius: '28px' 
              }}>
                <span style={{ fontSize: isMobile ? '48px' : '64px', opacity: 0.5 }}>✅</span>
                <p style={{ color: textMuted, marginTop: '16px', fontSize: isMobile ? '14px' : '16px' }}>
                  {t('no_data')}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {unpaidOrders.map(order => {
                  const subtotal = order.subtotal || order.total || 0
                  const sc = order.service_charge || (subtotal * (serviceChargePercent / 100))
                  const tax = order.tax || (subtotal * (taxPercent / 100))
                  const grandTotal = order.grand_total || (subtotal + sc + tax)
                  return (
                    <div key={order.id} style={{ 
                      ...glassEffect, 
                      borderRadius: '28px', 
                      padding: isMobile ? '16px' : '24px', 
                      borderLeft: `4px solid #eab308` 
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '16px', 
                        flexWrap: 'wrap', 
                        gap: '12px' 
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: isMobile ? '20px' : '24px' }}>
                            {order.order_type === 'take_away' ? '🥡' : '🍽️'}
                          </span>
                          <span style={{ 
                            fontWeight: 'bold', 
                            color: textColor, 
                            fontSize: isMobile ? '12px' : '14px' 
                          }}>
                            {order.order_number || `ORD-${order.id}`}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ color: textColor, fontSize: isMobile ? '12px' : '14px' }}>
                            {order.order_type === 'take_away' ? t('take_away') : `${t('table')} ${order.table_number}`}
                          </span>
                          <span style={{ 
                            background: order.status === 'ready' ? '#22c55e' : 
                                      order.status === 'preparing' ? '#eab308' : '#6c757d', 
                            color: order.status === 'preparing' ? '#333' : 'white', 
                            padding: '2px 12px', 
                            borderRadius: '40px', 
                            fontSize: isMobile ? '9px' : '10px', 
                            fontWeight: 'bold' 
                          }}>
                            {order.status === 'ready' ? t('ready') : 
                             order.status === 'preparing' ? t('preparing') : t('pending')}
                          </span>
                        </div>
                      </div>
                      
                      <p>
                        <strong style={{ color: textColor, fontSize: isMobile ? '12px' : '14px' }}>
                          {order.customer_name || 'Walk-in'}
                        </strong>
                      </p>
                      
                      <div style={{ 
                        background: secondaryBg, 
                        borderRadius: '20px', 
                        padding: isMobile ? '12px' : '16px', 
                        margin: '16px 0' 
                      }}>
                        {renderUnpaidItems(order.items)}
                      </div>
                      
                      <div style={{ 
                        background: secondaryBg, 
                        padding: '16px', 
                        borderRadius: '20px', 
                        marginTop: '16px' 
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          fontSize: isMobile ? '11px' : '13px', 
                          marginBottom: '6px' 
                        }}>
                          <span>{t('subtotal')}:</span>
                          <span>RM {subtotal.toFixed(2)}</span>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          fontSize: isMobile ? '11px' : '13px', 
                          marginBottom: '6px' 
                        }}>
                          <span>{t('service_charge')} ({serviceChargePercent}%):</span>
                          <span>RM {sc.toFixed(2)}</span>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          fontSize: isMobile ? '11px' : '13px', 
                          marginBottom: '6px' 
                        }}>
                          <span>{t('tax')} ({taxPercent}%):</span>
                          <span>RM {tax.toFixed(2)}</span>
                        </div>
                        <div style={{ 
                          borderTop: `1px solid ${borderColor}`, 
                          marginTop: '10px', 
                          paddingTop: '10px', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          fontWeight: 'bold', 
                          fontSize: isMobile ? '16px' : '18px' 
                        }}>
                          <span>{t('total')}:</span>
                          <span style={{ color: '#22c55e' }}>RM {grandTotal.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => openPaymentModal(order)} 
                        style={{ 
                          background: 'linear-gradient(135deg, #22c55e, #16a34a)', 
                          color: 'white', 
                          padding: isMobile ? '10px' : '12px', 
                          border: 'none', 
                          borderRadius: '40px', 
                          cursor: 'pointer', 
                          fontWeight: 'bold', 
                          marginTop: '16px', 
                          width: '100%', 
                          fontSize: isMobile ? '13px' : '14px' 
                        }}
                      >
                        💰 {t('record_payment')}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* HISTORY TAB */}
        {/* ========================================================== */}
        {activeTab === 'history' && (
          <div>
            <h2 style={{ 
              color: textColor, 
              marginBottom: '24px', 
              fontSize: isMobile ? '18px' : '20px', 
              fontWeight: 'bold', 
              borderLeft: '4px solid #6c757d', 
              paddingLeft: '14px' 
            }}>
              📜 {language === 'bm' ? 'Sejarah Pesanan' : 'Order History'}
            </h2>
            {orderHistory.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: isMobile ? '40px 20px' : '80px 20px', 
                ...glassEffect, 
                borderRadius: '28px' 
              }}>
                <span style={{ fontSize: isMobile ? '48px' : '64px', opacity: 0.5 }}>📜</span>
                <p style={{ color: textMuted, marginTop: '16px', fontSize: isMobile ? '14px' : '16px' }}>
                  {t('no_data')}
                </p>
              </div>
            ) : (
              <>
                <div style={{ 
                  overflowX: 'auto', 
                  ...glassEffect, 
                  borderRadius: '24px', 
                  padding: '4px' 
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '600px' : 'auto' }}>
                    <thead>
                      <tr style={{ background: darkMode ? 'rgba(30,30,46,0.8)' : '#f1f5f9' }}>
                        <th style={{ padding: '14px', textAlign: 'left', color: textColor, fontSize: isMobile ? '10px' : '13px' }}>
                          {t('id')}
                        </th>
                        <th style={{ padding: '14px', textAlign: 'left', color: textColor, fontSize: isMobile ? '10px' : '13px' }}>
                          {t('customer_name')}
                        </th>
                        <th style={{ padding: '14px', textAlign: 'left', color: textColor, fontSize: isMobile ? '10px' : '13px' }}>
                          {t('order_type')}
                        </th>
                        <th style={{ padding: '14px', textAlign: 'left', color: textColor, fontSize: isMobile ? '10px' : '13px' }}>
                          {t('total')}
                        </th>
                        <th style={{ padding: '14px', textAlign: 'left', color: textColor, fontSize: isMobile ? '10px' : '13px' }}>
                          {t('payment_method')}
                        </th>
                        <th style={{ padding: '14px', textAlign: 'left', color: textColor, fontSize: isMobile ? '10px' : '13px' }}>
                          {t('date')}
                        </th>
                        <th style={{ padding: '14px', textAlign: 'left', color: textColor, fontSize: isMobile ? '10px' : '13px' }}>
                          {language === 'bm' ? 'Tindakan' : 'Action'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderHistory.slice((historyPage - 1) * historyItemsPerPage, historyPage * historyItemsPerPage).map(order => (
                        <tr key={order.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                          <td style={{ padding: '12px', color: textColor, fontSize: isMobile ? '10px' : '13px' }}>
                            {order.order_number || `ORD-${order.id}`}
                          </td>
                          <td style={{ padding: '12px', color: textColor, fontSize: isMobile ? '10px' : '13px' }}>
                            {order.customer_name || 'Walk-in'}
                          </td>
                          <td style={{ padding: '12px', color: textColor, fontSize: isMobile ? '10px' : '13px' }}>
                            {order.order_type === 'take_away' ? '🥡 Take Away' : `🍽️ ${t('table')} ${order.table_number}`}
                          </td>
                          <td style={{ padding: '12px', color: '#22c55e', fontWeight: 'bold', fontSize: isMobile ? '10px' : '13px' }}>
                            RM {order.grand_total || order.total || '0.00'}
                          </td>
                          <td style={{ padding: '12px', color: textColor, fontSize: isMobile ? '10px' : '13px' }}>
                            {order.payment_method === 'cash' ? '💵 Tunai' : 
                             order.payment_method === 'tng' ? '📱 TnG' : 
                             order.payment_method === 'bank' ? '🏦 Bank' : '—'}
                          </td>
                          <td style={{ padding: '12px', color: textColor, fontSize: isMobile ? '10px' : '13px' }}>
                            {formatMalaysiaTime(order.created_at)}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <button 
                              onClick={() => reprintReceipt(order)} 
                              style={{ 
                                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
                                color: 'white', 
                                padding: '6px 16px', 
                                border: 'none', 
                                borderRadius: '40px', 
                                cursor: 'pointer', 
                                fontSize: isMobile ? '10px' : '12px', 
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              🧾 {t('btn_receipt')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {Math.ceil(orderHistory.length / historyItemsPerPage) > 1 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    gap: '6px', 
                    marginTop: '24px', 
                    flexWrap: 'wrap' 
                  }}>
                    <button 
                      onClick={() => setHistoryPage(1)} 
                      disabled={historyPage === 1} 
                      style={{ 
                        padding: isMobile ? '6px 12px' : '8px 14px', 
                        background: historyPage === 1 ? secondaryBg : '#2563eb', 
                        color: historyPage === 1 ? textMuted : 'white', 
                        border: 'none', 
                        borderRadius: '40px', 
                        cursor: historyPage === 1 ? 'not-allowed' : 'pointer', 
                        fontSize: isMobile ? '10px' : '12px', 
                        fontWeight: 'bold' 
                      }}
                    >
                      « {t('first')}
                    </button>
                    <button 
                      onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))} 
                      disabled={historyPage === 1} 
                      style={{ 
                        padding: isMobile ? '6px 12px' : '8px 14px', 
                        background: historyPage === 1 ? secondaryBg : '#2563eb', 
                        color: historyPage === 1 ? textMuted : 'white', 
                        border: 'none', 
                        borderRadius: '40px', 
                        cursor: historyPage === 1 ? 'not-allowed' : 'pointer', 
                        fontSize: isMobile ? '10px' : '12px', 
                        fontWeight: 'bold' 
                      }}
                    >
                      ‹ {t('prev')}
                    </button>
                    <span style={{ 
                      padding: isMobile ? '6px 14px' : '8px 16px', 
                      background: cardBg, 
                      borderRadius: '40px', 
                      color: textColor, 
                      fontSize: isMobile ? '12px' : '13px', 
                      border: `1px solid ${borderColor}` 
                    }}>
                      {historyPage} / {Math.ceil(orderHistory.length / historyItemsPerPage)}
                    </span>
                    <button 
                      onClick={() => setHistoryPage(prev => Math.min(Math.ceil(orderHistory.length / historyItemsPerPage), prev + 1))} 
                      disabled={historyPage === Math.ceil(orderHistory.length / historyItemsPerPage)} 
                      style={{ 
                        padding: isMobile ? '6px 12px' : '8px 14px', 
                        background: historyPage === Math.ceil(orderHistory.length / historyItemsPerPage) ? secondaryBg : '#2563eb', 
                        color: historyPage === Math.ceil(orderHistory.length / historyItemsPerPage) ? textMuted : 'white', 
                        border: 'none', 
                        borderRadius: '40px', 
                        cursor: historyPage === Math.ceil(orderHistory.length / historyItemsPerPage) ? 'not-allowed' : 'pointer', 
                        fontSize: isMobile ? '10px' : '12px', 
                        fontWeight: 'bold' 
                      }}
                    >
                      {t('next')} ›
                    </button>
                    <button 
                      onClick={() => setHistoryPage(Math.ceil(orderHistory.length / historyItemsPerPage))} 
                      disabled={historyPage === Math.ceil(orderHistory.length / historyItemsPerPage)} 
                      style={{ 
                        padding: isMobile ? '6px 12px' : '8px 14px', 
                        background: historyPage === Math.ceil(orderHistory.length / historyItemsPerPage) ? secondaryBg : '#2563eb', 
                        color: historyPage === Math.ceil(orderHistory.length / historyItemsPerPage) ? textMuted : 'white', 
                        border: 'none', 
                        borderRadius: '40px', 
                        cursor: historyPage === Math.ceil(orderHistory.length / historyItemsPerPage) ? 'not-allowed' : 'pointer', 
                        fontSize: isMobile ? '10px' : '12px', 
                        fontWeight: 'bold' 
                      }}
                    >
                      {t('last')} »
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* DRINK OPTIONS MODAL */}
        {/* ========================================================== */}
        {showDrinkModal && selectedDrinkItem && (
          <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0,0,0,0.85)', 
            backdropFilter: 'blur(8px)', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            zIndex: 2000,
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ 
              background: cardBg, 
              borderRadius: '32px', 
              padding: isMobile ? '24px' : '32px', 
              maxWidth: '380px', 
              width: '90%', 
              textAlign: 'center', 
              ...glassEffect,
              animation: 'popIn 0.3s ease'
            }}>
              <h2 style={{ 
                marginBottom: '8px', 
                color: textColor, 
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: 'bold'
              }}>
                🥤 {selectedDrinkItem.name}
              </h2>
              <p style={{ color: textMuted, marginBottom: '28px', fontSize: isMobile ? '13px' : '14px' }}>
                Pilih suhu minuman
              </p>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
                {drinkOptions[selectedDrinkItem.name]?.some(o => o.type === 'Panas') && (
                  <button 
                    onClick={() => setSelectedDrinkOption('Panas')} 
                    style={{ 
                      flex: 1, 
                      padding: isMobile ? '14px' : '18px', 
                      background: selectedDrinkOption === 'Panas' ? 'linear-gradient(135deg, #f97316, #ea580c)' : secondaryBg, 
                      color: selectedDrinkOption === 'Panas' ? 'white' : textColor, 
                      border: selectedDrinkOption === 'Panas' ? 'none' : `1px solid ${borderColor}`, 
                      borderRadius: '20px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold',
                      transition: 'all 0.2s',
                      fontSize: isMobile ? '13px' : '14px'
                    }}
                  >
                    🔥 {t('hot')}
                    <br />
                    <small>RM {drinkOptions[selectedDrinkItem.name]?.find(o => o.type === 'Panas')?.price}</small>
                  </button>
                )}
                
                {drinkOptions[selectedDrinkItem.name]?.some(o => o.type === 'Sejuk') && (
                  <button 
                    onClick={() => setSelectedDrinkOption('Sejuk')} 
                    style={{ 
                      flex: 1, 
                      padding: isMobile ? '14px' : '18px', 
                      background: selectedDrinkOption === 'Sejuk' ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : secondaryBg, 
                      color: selectedDrinkOption === 'Sejuk' ? 'white' : textColor, 
                      border: selectedDrinkOption === 'Sejuk' ? 'none' : `1px solid ${borderColor}`, 
                      borderRadius: '20px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold',
                      transition: 'all 0.2s',
                      fontSize: isMobile ? '13px' : '14px'
                    }}
                  >
                    🧊 {t('cold')}
                    <br />
                    <small>RM {drinkOptions[selectedDrinkItem.name]?.find(o => o.type === 'Sejuk')?.price}</small>
                  </button>
                )}
              </div>
              
              <button 
                onClick={addDrinkToCart} 
                style={{ 
                  width: '100%', 
                  padding: isMobile ? '14px' : '16px', 
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '60px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold', 
                  marginBottom: '12px',
                  fontSize: isMobile ? '14px' : '15px'
                }}
              >
                ➕ {t('add_to_cart')}
              </button>
              
              <button 
                onClick={() => setShowDrinkModal(false)} 
                style={{ 
                  width: '100%', 
                  padding: isMobile ? '14px' : '16px', 
                  background: darkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0', 
                  color: textColor, 
                  border: 'none', 
                  borderRadius: '60px', 
                  cursor: 'pointer',
                  fontSize: isMobile ? '14px' : '15px'
                }}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* PAYMENT MODAL */}
        {/* ========================================================== */}
        {showPaymentModal && selectedOrder && (
          <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0,0,0,0.85)', 
            backdropFilter: 'blur(8px)', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            zIndex: 2000,
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ 
              background: cardBg, 
              padding: isMobile ? '20px' : '28px', 
              borderRadius: '32px', 
              maxWidth: '420px', 
              width: '90%', 
              ...glassEffect,
              animation: 'popIn 0.3s ease'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ 
                  width: isMobile ? '48px' : '56px', 
                  height: isMobile ? '48px' : '56px', 
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 12px auto' 
                }}>
                  <span style={{ fontSize: isMobile ? '24px' : '28px' }}>💰</span>
                </div>
                <h2 style={{ 
                  margin: 0, 
                  color: textColor, 
                  fontSize: isMobile ? '18px' : '22px', 
                  fontWeight: 'bold' 
                }}>
                  {t('record_payment')}
                </h2>
                <p style={{ color: textMuted, fontSize: isMobile ? '12px' : '13px', marginTop: '4px' }}>
                  {language === 'bm' ? 'Sila pilih kaedah bayaran' : 'Please select payment method'}
                </p>
              </div>

              <div style={{ 
                background: secondaryBg, 
                padding: isMobile ? '12px' : '16px', 
                borderRadius: '20px', 
                marginBottom: '20px' 
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '8px',
                  fontSize: isMobile ? '12px' : '13px'
                }}>
                  <span style={{ color: textMuted }}>No. Pesanan:</span>
                  <span style={{ color: textColor, fontWeight: 'bold' }}>
                    {selectedOrder.order_number || `ORD-${selectedOrder.id}`}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '8px',
                  fontSize: isMobile ? '12px' : '13px'
                }}>
                  <span style={{ color: textMuted }}>{t('table_number')}:</span>
                  <span style={{ color: textColor, fontWeight: 'bold' }}>
                    {selectedOrder.table_number || 'Take Away'}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: isMobile ? '12px' : '13px'
                }}>
                  <span style={{ color: textMuted }}>{t('customer_name')}:</span>
                  <span style={{ color: textColor, fontWeight: 'bold' }}>
                    {selectedOrder.customer_name || 'Walk-in'}
                  </span>
                </div>
              </div>

              <div style={{ 
                background: secondaryBg, 
                padding: isMobile ? '12px' : '16px', 
                borderRadius: '20px', 
                marginBottom: '20px' 
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '12px', 
                  color: textColor, 
                  fontSize: isMobile ? '12px' : '14px' 
                }}>
                  🛒 {language === 'bm' ? 'Ringkasan Pesanan' : 'Order Summary'}
                </div>
                {selectedOrder.items?.slice(0, 3).map((item, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: isMobile ? '11px' : '13px', 
                    marginBottom: '6px' 
                  }}>
                    <span style={{ color: textColor }}>{item.name} x{item.quantity}</span>
                    <span style={{ color: '#22c55e' }}>RM {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                {selectedOrder.items?.length > 3 && (
                  <div style={{ fontSize: isMobile ? '10px' : '12px', color: textMuted, textAlign: 'center', marginTop: '8px' }}>
                    + {selectedOrder.items.length - 3} {t('items')} lain
                  </div>
                )}
              </div>

              {(() => {
                const subtotal = selectedOrder.subtotal || selectedOrder.total || 0
                const sc = selectedOrder.service_charge || (subtotal * (serviceChargePercent / 100))
                const tax = selectedOrder.tax || (subtotal * (taxPercent / 100))
                const grandTotal = selectedOrder.grand_total || (subtotal + sc + tax)
                return (
                  <div style={{ 
                    background: secondaryBg, 
                    padding: isMobile ? '12px' : '16px', 
                    borderRadius: '20px', 
                    marginBottom: '20px' 
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: '6px',
                      fontSize: isMobile ? '11px' : '13px'
                    }}>
                      <span>{t('subtotal')}:</span>
                      <span>RM {subtotal.toFixed(2)}</span>
                    </div>
                    {selectedOrder.order_type !== 'take_away' && (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '6px',
                        fontSize: isMobile ? '11px' : '13px'
                      }}>
                        <span>{t('service_charge')} ({serviceChargePercent}%):</span>
                        <span>RM {sc.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: '6px',
                      fontSize: isMobile ? '11px' : '13px'
                    }}>
                      <span>{t('tax')} ({taxPercent}%):</span>
                      <span>RM {tax.toFixed(2)}</span>
                    </div>
                    <div style={{ 
                      borderTop: `1px solid ${borderColor}`, 
                      marginTop: '10px', 
                      paddingTop: '10px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontWeight: 'bold', 
                      fontSize: isMobile ? '16px' : '18px' 
                    }}>
                      <span>{t('total')}:</span>
                      <span style={{ color: '#22c55e' }}>RM {grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )
              })()}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px', 
                  fontWeight: 'bold', 
                  color: textColor, 
                  fontSize: isMobile ? '12px' : '14px' 
                }}>
                  💳 {t('payment_method')}
                </label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => setPaymentMethod('cash')} 
                    style={{ 
                      flex: 1, 
                      padding: isMobile ? '10px' : '12px', 
                      background: paymentMethod === 'cash' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : secondaryBg, 
                      color: paymentMethod === 'cash' ? 'white' : textColor, 
                      border: paymentMethod === 'cash' ? 'none' : `1px solid ${borderColor}`, 
                      borderRadius: '16px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold', 
                      fontSize: isMobile ? '12px' : '14px',
                      transition: 'all 0.2s'
                    }}
                  >
                    💵 {t('cash')}
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('tng')} 
                    style={{ 
                      flex: 1, 
                      padding: isMobile ? '10px' : '12px', 
                      background: paymentMethod === 'tng' ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : secondaryBg, 
                      color: paymentMethod === 'tng' ? 'white' : textColor, 
                      border: paymentMethod === 'tng' ? 'none' : `1px solid ${borderColor}`, 
                      borderRadius: '16px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold', 
                      fontSize: isMobile ? '12px' : '14px',
                      transition: 'all 0.2s'
                    }}
                  >
                    📱 {t('tng')}
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('bank')} 
                    style={{ 
                      flex: 1, 
                      padding: isMobile ? '10px' : '12px', 
                      background: paymentMethod === 'bank' ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : secondaryBg, 
                      color: paymentMethod === 'bank' ? 'white' : textColor, 
                      border: paymentMethod === 'bank' ? 'none' : `1px solid ${borderColor}`, 
                      borderRadius: '16px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold', 
                      fontSize: isMobile ? '12px' : '14px',
                      transition: 'all 0.2s'
                    }}
                  >
                    🏦 {t('bank')}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => markAsPaid(selectedOrder)} 
                  style={{ 
                    flex: 1, 
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)', 
                    color: 'white', 
                    padding: isMobile ? '12px' : '14px', 
                    border: 'none', 
                    borderRadius: '60px', 
                    cursor: 'pointer', 
                    fontWeight: 'bold', 
                    fontSize: isMobile ? '13px' : '15px' 
                  }}
                >
                  ✅ {t('save')}
                </button>
                <button 
                  onClick={() => { setShowPaymentModal(false); setSelectedOrder(null); }} 
                  style={{ 
                    flex: 1, 
                    background: darkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0', 
                    color: textColor, 
                    padding: isMobile ? '12px' : '14px', 
                    border: 'none', 
                    borderRadius: '60px', 
                    cursor: 'pointer', 
                    fontWeight: 'bold', 
                    fontSize: isMobile ? '13px' : '15px' 
                  }}
                >
                  ❌ {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* RECEIPT MODALS */}
        {/* ========================================================== */}
        {showReceipt && currentReceiptOrder && (
          <ReceiptModal 
            order={currentReceiptOrder} 
            onClose={() => { 
              setShowReceipt(false); 
              setCurrentReceiptOrder(null); 
            }} 
          />
        )}
        {showHistoryReceipt && selectedHistoryOrder && (
          <ReceiptModal 
            order={selectedHistoryOrder} 
            onClose={() => { 
              setShowHistoryReceipt(false); 
              setSelectedHistoryOrder(null); 
            }} 
          />
        )}
        
        {/* ========================================================== */}
        {/* CSS STYLES */}
        {/* ========================================================== */}
        <style>
          {`
            @keyframes fadeIn { 
              from { opacity: 0; } 
              to { opacity: 1; } 
            }
            @keyframes popIn { 
              0% { opacity: 0; transform: scale(0.9); } 
              100% { opacity: 1; transform: scale(1); } 
            }
            ::-webkit-scrollbar { 
              width: 6px; 
              height: 6px;
            }
            ::-webkit-scrollbar-track { 
              background: ${darkMode ? '#1a1a2e' : '#e2e8f0'}; 
              borderRadius: 10px; 
            }
            ::-webkit-scrollbar-thumb { 
              background: ${darkMode ? '#3d3d5c' : '#94a3b8'}; 
              borderRadius: 10px; 
            }
            button { 
              transition: all 0.2s; 
            }
            button:hover:not(:disabled) { 
              opacity: 0.88; 
              transform: scale(0.97); 
            }
            button:active:not(:disabled) {
              transform: scale(0.93);
            }
            button:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
            input:focus, select:focus, textarea:focus { 
              outline: none; 
              border-color: #3b82f6;
              box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
            }
          `}
        </style>
      </div>
    </Sidebar>
  )
}

export default StaffApp