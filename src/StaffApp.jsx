import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'  // <-- Guna dari sini
import ReceiptModal from './ReceiptModal'
import toast from 'react-hot-toast'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'
import Sidebar from './components/Sidebar'

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
  const [dbCategories, setDbCategories] = useState([]) // <-- Categories from database
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
  // LOAD CATEGORIES FROM DATABASE
  // ============================================================
  async function loadCategoriesFromDB() {
    console.log('🔄 Loading categories from database...')
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.error('❌ Error loading categories:', error)
      return
    }
    
    if (data) {
      console.log('✅ Categories loaded:', data.map(c => c.name))
      setDbCategories(data)
    }
  }

  // ============================================================
  // GET CATEGORY ICON
  // ============================================================
  const getCategoryIcon = (catName) => {
    if (catName === 'Semua') return '🍽️'
    if (catName === 'Minuman') return '🥤'
    const found = dbCategories.find(c => c.name === catName)
    return found?.icon || '📂'
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
    // Load all data
    loadMenu()
    loadDrinkOptions()
    loadCustomerOrders()
    loadUnpaidOrders()
    loadSettings()
    loadCategoriesFromDB() // <-- LOAD CATEGORIES FROM DB

    // Subscriptions
    const menuSubscription = supabase
      .channel('menu_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu' }, () => loadMenu())
      .subscribe()
      
    const drinkSubscription = supabase
      .channel('drink_options_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drink_options' }, () => loadDrinkOptions())
      .subscribe()
      
    const categorySubscription = supabase
      .channel('category_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => loadCategoriesFromDB())
      .subscribe()

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

  useEffect(() => {
    setHistoryPage(1)
  }, [orderHistory.length])

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
    await loadCategoriesFromDB();
    toast.success('🔄 Data telah direfresh!') 
  }

  // ============================================================
  // GET CATEGORIES - FIXED: USE DATABASE CATEGORIES
  // ============================================================
  // Build categories list: 'Semua' + all categories from database
  const categoryNames = ['Semua', ...dbCategories.map(cat => cat.name)]
  
  // Filter menu by selected category
  const filteredMenu = selectedCategory === 'Semua' 
    ? menu 
    : menu.filter(item => item.category === selectedCategory)

  // ============================================================
  // HELPERS
  // ============================================================
  const getDefaultIcon = (category) => {
    if (category === 'Minuman') return '🥤'
    const found = dbCategories.find(c => c.name === category)
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
    const found = dbCategories.find(c => c.name === cat)
    return found?.icon || '📂'
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
  // RENDER - CATEGORY FILTERS
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
        
        {/* ... (all the same until category filters) ... */}

        {/* ========================================================== */}
        {/* CATEGORY FILTERS - FIXED: SHOW ALL FROM DATABASE */}
        {/* ========================================================== */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          flexWrap: 'wrap', 
          marginBottom: '24px',
          padding: '4px'
        }}>
          {categoryNames.map(cat => (
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

        {/* ... (rest of the render code) ... */}
        
      </div>
    </Sidebar>
  )
}

export default StaffApp