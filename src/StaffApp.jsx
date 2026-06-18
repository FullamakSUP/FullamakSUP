import { useState, useEffect } from 'react'
import ReceiptModal from './ReceiptModal'
import toast from 'react-hot-toast'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'
import Sidebar from './components/Sidebar'
import { supabase } from './lib/supabase'
import { sendNotification } from './utils/notification'

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
  const { language } = useLanguage()
  const [menu, setMenu] = useState([])
  const [categories, setCategories] = useState([])
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
  
  // Size/Options Modal State
  const [showSizeModal, setShowSizeModal] = useState(false)
  const [selectedSizeItem, setSelectedSizeItem] = useState(null)
  const [menuOptions, setMenuOptions] = useState([])
  
  const [orderType, setOrderType] = useState('dine_in')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [addingItemId, setAddingItemId] = useState(null)
  
  const [audio, setAudio] = useState(null)
  
  // Pagination for history
  const [historyPage, setHistoryPage] = useState(1)
  const historyItemsPerPage = 10

  // ========== TRANSLATIONS - TANPA EMOJI ==========
  const translations = {
    // General
    new_order: { en: 'New Order', ms: 'Pesanan Baru' },
    take_away: { en: 'Take Away', ms: 'Bungkus' },
    table: { en: 'Table', ms: 'Meja' },
    empty_cart: { en: 'Cart is empty', ms: 'Keranjang kosong' },
    cancelled: { en: 'Cancelled', ms: 'Dibatalkan' },
    payment_received: { en: 'Payment received', ms: 'Bayaran diterima' },
    record_payment: { en: 'Record Payment', ms: 'Rekod Bayaran' },
    
    // Tabs - TANPA EMOJI (emoji ada dalam icon)
    tab_pos: { en: 'POS', ms: 'POS' },
    tab_new: { en: 'Baru', ms: 'Baru' },
    tab_unpaid: { en: 'Belum Bayar', ms: 'Belum Bayar' },
    tab_history: { en: 'Sejarah', ms: 'Sejarah' },
    
    // Order Types
    dine_in: { en: 'Dine In', ms: 'Makan di Sini' },
    takeaway: { en: 'Take Away', ms: 'Bungkus' },
    
    // Labels
    table_no: { en: 'Table', ms: 'Meja' },
    name: { en: 'Name', ms: 'Nama' },
    phone: { en: 'Phone', ms: 'Telefon' },
    customer: { en: 'Customer', ms: 'Pelanggan' },
    total: { en: 'Total', ms: 'Jumlah' },
    subtotal: { en: 'Subtotal', ms: 'Subtotal' },
    service: { en: 'Service Charge', ms: 'Caj Perkhidmatan' },
    tax: { en: 'Tax', ms: 'Cukai' },
    method: { en: 'Method', ms: 'Kaedah' },
    time: { en: 'Time', ms: 'Masa' },
    action: { en: 'Action', ms: 'Tindakan' },
    id: { en: 'ID', ms: 'ID' },
    type: { en: 'Type', ms: 'Jenis' },
    
    // Status
    pending: { en: 'Pending', ms: 'Tertunda' },
    preparing: { en: 'Preparing', ms: 'Sedang Siap' },
    ready: { en: 'Ready', ms: 'Sedia' },
    paid: { en: 'Paid', ms: 'Dibayar' },
    unpaid: { en: 'Unpaid', ms: 'Belum Bayar' },
    
    // Buttons
    accept_cook: { en: 'Accept & Cook', ms: 'Terima & Masak' },
    accept_ready: { en: 'Accept (Ready)', ms: 'Terima (Sedia)' },
    cancel: { en: 'Cancel', ms: 'Batal' },
    save: { en: 'Save', ms: 'Simpan' },
    close: { en: 'Close', ms: 'Tutup' },
    add: { en: 'Add', ms: 'Tambah' },
    added: { en: 'Added!', ms: 'Ditambah!' },
    place_order: { en: 'Place Order', ms: 'Hantar Pesanan' },
    record_payment_btn: { en: 'Record Payment', ms: 'Rekod Bayaran' },
    select_size: { en: 'Select Size', ms: 'Pilih Saiz' },
    
    // Drink Options
    drink_type: { en: 'Select drink type', ms: 'Pilih jenis minuman' },
    hot: { en: 'Hot', ms: 'Panas' },
    cold: { en: 'Cold', ms: 'Sejuk' },
    takeaway_drink: { en: 'Takeaway', ms: 'Bungkus' },
    add_to_cart: { en: 'Add to Cart', ms: 'Tambah ke Keranjang' },
    
    // Messages
    start_cooking: { en: 'Started cooking!', ms: 'Mula memasak!' },
    order_accepted: { en: 'Order accepted! Ready for payment.', ms: 'Pesanan diterima! Sedia untuk bayar.' },
    new_orders_alert: { en: 'Click to process', ms: 'Klik untuk proses' },
    no_new_orders: { en: 'No new orders', ms: 'Tiada pesanan baru' },
    no_unpaid: { en: 'No unpaid orders', ms: 'Tiada pesanan belum bayar' },
    no_history: { en: 'No history', ms: 'Tiada sejarah' },
    
    // Payment Methods
    cash: { en: 'Cash', ms: 'Tunai' },
    tng: { en: 'TnG', ms: 'TnG' },
    bank: { en: 'Bank', ms: 'Bank' },
    
    // Size Modal
    choose_size: { en: 'Choose size / option', ms: 'Pilih saiz / pilihan' },
    
    // Staff
    no_orders: { en: 'No orders', ms: 'Tiada pesanan' },
    guest: { en: 'Guest', ms: 'Tetamu' },
    all: { en: 'All', ms: 'Semua' },
    walk_in: { en: 'Walk-in', ms: 'Berjalan Masuk' },
    no_table: { en: 'No table', ms: 'Tiada meja' },
    processing: { en: 'Processing...', ms: 'Memproses...' },
    refresh: { en: 'Refresh', ms: 'Muat Semula' },
    test_sound: { en: 'Test Sound', ms: 'Uji Bunyi' },
    
    // Cart
    cart: { en: 'Cart', ms: 'Keranjang' },
    grand_total: { en: 'Grand Total', ms: 'Jumlah Keseluruhan' },
    
    // Description
    description: { en: 'Description', ms: 'Keterangan' },
    
    // Pagination
    first: { en: 'First', ms: 'Pertama' },
    prev: { en: 'Prev', ms: 'Sebelum' },
    next: { en: 'Next', ms: 'Seterusnya' },
    last: { en: 'Last', ms: 'Terakhir' },
    
    // Settings
    kitchen_on: { en: 'Kitchen ON', ms: 'Dapur ON' },
    kitchen_off: { en: 'Kitchen OFF', ms: 'Dapur OFF' },
    auto_complete: { en: 'Auto Complete', ms: 'Auto Siap' },
    min: { en: 'min', ms: 'min' },
    
    // Order
    accepted: { en: 'Accepted', ms: 'Diterima' },
    
    // Receipt
    receipt: { en: 'Receipt', ms: 'Resit' },
    print: { en: 'Print', ms: 'Cetak' },
    reprint: { en: 'Reprint', ms: 'Cetak Semula' },
    
    // Validation
    please_enter_table: { en: 'Please enter table number', ms: 'Sila masukkan nombor meja' },
    order_sent: { en: 'Order sent to kitchen!', ms: 'Pesanan dihantar ke dapur!' },
    error: { en: 'Error', ms: 'Ralat' },
    data_refreshed: { en: 'Data refreshed!', ms: 'Data telah direfresh!' },
  }

  const t = (key) => {
    if (!translations[key]) return key
    return language === 'en' ? translations[key].en : translations[key].ms
  }

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
  const inputBorder = darkMode ? '#334155' : '#cbd5e1'
  const secondaryBg = darkMode ? 'rgba(30, 30, 46, 0.8)' : 'rgba(248, 250, 252, 0.9)'
  
  const glassEffect = {
    background: cardBg,
    backdropFilter: 'blur(10px)',
    border: `1px solid ${borderColor}`,
    boxShadow: darkMode 
      ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
      : '0 8px 32px rgba(0, 0, 0, 0.08)'
  }

  // Get drink option label with translations
  const getDrinkOptionLabel = (optionType) => {
    if (optionType === 'Panas') return `☕ ${t('hot')}`
    if (optionType === 'Sejuk') return `🧊 ${t('cold')}`
    if (optionType === 'Bungkus') return `📦 ${t('takeaway_drink')}`
    return optionType
  }

  const getDrinkOptionEmoji = (optionType) => {
    if (optionType === 'Panas') return '🔥'
    if (optionType === 'Sejuk') return '🧊'
    if (optionType === 'Bungkus') return '📦'
    return ''
  }

  // ========== LOAD CATEGORIES FUNCTION ==========
  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
    console.log('📂 Categories loaded (StaffApp):', data)
    setCategories(data || [])
  }

  // Get sub categories for POS filter - EXCLUDE MINUMAN SUB CATEGORIES
  const getSubCategoriesForMenu = () => {
    const minumanMain = categories.find(c => c.name === 'Minuman' && c.parent_id === null)
    
    return categories.filter(cat => {
      if (cat.parent_id === null) return false
      if (minumanMain && cat.parent_id === minumanMain.id) return false
      return true
    })
  }

  useEffect(() => {
    if (typeof Audio !== 'undefined') {
      const sound = new Audio('/sound/notification.mp3')
      sound.load()
      setAudio(sound)
    }
  }, [])

  useEffect(() => {
    loadMenu()
    loadDrinkOptions()
    loadCustomerOrders()
    loadUnpaidOrders()
    loadSettings()
    loadCategories()

    const menuSubscription = supabase.channel('menu_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'menu' }, () => loadMenu()).subscribe()
    const drinkSubscription = supabase.channel('drink_options_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'drink_options' }, () => loadDrinkOptions()).subscribe()

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
          
          const orderTypeLabel = payload.new.order_type === 'take_away' ? t('takeaway') : `${t('table')} ${payload.new.table_number}`
          toast.success(`${t('new_order')} ${orderTypeLabel}!`)
          
          sendNotification(
            '🆕 New Order Received!',
            `${orderTypeLabel} - ${payload.new.customer_name || t('guest')} (${payload.new.items?.length} items)`,
            '/staff'
          )
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'customer_orders' }, (payload) => {
        if (payload.new.status === 'ready' && payload.old.status !== 'ready') {
          loadUnpaidOrders()
          if (soundEnabled && audio) {
            audio.currentTime = 0
            audio.play().catch(e => console.log('Audio play failed:', e))
          }
          toast.success('✅ Order ready! Please record payment.', { duration: 4000 })
          
          sendNotification(
            '✅ Order Ready!',
            `Order ${payload.new.order_number} is ready for pickup - ${payload.new.customer_name || t('guest')}`,
            '/staff'
          )
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
      orderSubscription.unsubscribe()
      document.removeEventListener('click', enableSoundOnClick)
    }
  }, [soundEnabled, audio])

  // ===== REMINDER NOTIFICATION EVERY 5 SECONDS =====
  useEffect(() => {
    let interval
    let reminderCount = 0
    
    if (customerOrders.length > 0 && activeTab !== 'orders') {
      // Play sound immediately when there are new orders
      if (soundEnabled && audio) {
        audio.currentTime = 0
        audio.play().catch(e => console.log('Reminder sound failed:', e))
      }
      
      // Show initial toast
      toast(
        `🔔 ${customerOrders.length} ${t('new_order')}! ${t('new_orders_alert')}`,
        { 
          duration: 3000, 
          icon: '🔔',
          style: {
            background: '#ef4444',
            color: 'white',
            fontWeight: 'bold'
          }
        }
      )
      
      // Send push notification for reminder
      sendNotification(
        `🔔 ${customerOrders.length} New Orders Waiting!`,
        `Please process ${customerOrders.length} pending orders`,
        '/staff'
      )
      
      // Set interval for reminders every 5 seconds
      interval = setInterval(() => {
        reminderCount++
        
        // Only send reminder if still have pending orders and not on orders tab
        if (customerOrders.length > 0 && activeTab !== 'orders') {
          // Play sound
          if (soundEnabled && audio) {
            audio.currentTime = 0
            audio.play().catch(e => console.log('Reminder sound failed:', e))
          }
          
          // Show toast with reminder count
          toast(
            `🔔 Still ${customerOrders.length} ${t('new_order')}! Please process. (${reminderCount})`,
            { 
              duration: 3000, 
              icon: '🔔',
              style: {
                background: '#ef4444',
                color: 'white',
                fontWeight: 'bold'
              }
            }
          )
          
          // Send push notification every 5 seconds
          sendNotification(
            `🔔 ${customerOrders.length} Orders Waiting!`,
            `Please process pending orders (reminder ${reminderCount})`,
            '/staff'
          )
          
          // Update document title with count
          document.title = `🔔 ${customerOrders.length} New Orders! - KedaiPOS`
        } else {
          // Reset reminder count when no pending orders or on orders tab
          reminderCount = 0
          document.title = 'KedaiPOS - Staf'
        }
      }, 5000) // Every 5 seconds
    }
    
    return () => { 
      if (interval) clearInterval(interval) 
      // Reset title on unmount
      document.title = 'KedaiPOS - Staf'
    }
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

  // Menu Options Functions
  async function loadMenuOptions(menuId) {
    const { data } = await supabase
      .from('menu_options')
      .select('*')
      .eq('menu_id', menuId)
      .eq('available', true)
      .order('sort_order')
    return data || []
  }

  async function addToCartWithOption(item, option) {
    setAddingItemId(item.id)
    setTimeout(() => setAddingItemId(null), 300)
    
    const finalPrice = option.is_absolute_price 
      ? option.price_adjustment 
      : item.price + option.price_adjustment
    
    const cartItem = {
      id: `${item.id}_${option.id}_${Date.now()}`,
      name: `${item.name} (${option.option_name})`,
      price: finalPrice,
      quantity: 1,
      option_name: option.option_name,
      option_id: option.id,
      category: item.category || 'Makanan'
    }
    
    setCart([...cart, cartItem])
    setShowSizeModal(false)
    setSelectedSizeItem(null)
    toast.success(`✓ ${cartItem.name} ${t('added')}`)
  }

  function addToCartDirect(item) {
    const existing = cart.find(x => x.id === item.id && !x.option_id)
    if (existing) {
      setCart(cart.map(x => x.id === item.id && !x.option_id ? { ...x, quantity: x.quantity + 1 } : x))
    } else {
      setCart([...cart, { 
        ...item, 
        quantity: 1,
        is_free: false,
        is_promo_item: false,
        category: item.category || 'Makanan'
      }])
    }
    toast.success(`✓ ${item.name} ${t('added')}`)
  }

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
        toast.success('✅ ' + t('order_accepted'))
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
    
    const receiptOrder = { ...order, payment_method: paymentMethod, paid_at: new Date().toISOString(), subtotal, service_charge: serviceCharge, tax, grand_total: grandTotal }
    setCurrentReceiptOrder(receiptOrder)
    setShowReceipt(true)
    setSelectedOrder(null)
    toast.success(`✅ ${t('payment_received')} RM ${grandTotal.toFixed(2)}!`)
    
    // Auto print after payment
    try {
      const { data: autoPrintData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'auto_print')
        .single()
      
      const { data: printerTypeData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'printer_type')
        .single()
      
      if (autoPrintData?.value === 'true' && printerTypeData?.value !== 'none') {
        setTimeout(() => {
          const printButton = document.querySelector('#receipt-print-btn')
          if (printButton) {
            printButton.click()
          } else {
            window.print()
          }
        }, 1000)
      }
    } catch (err) {
      console.error('Auto print error:', err)
    }
  }

  function openPaymentModal(order) { setSelectedOrder(order); setShowPaymentModal(true) }
  function reprintReceipt(order) { setSelectedHistoryOrder(order); setShowHistoryReceipt(true) }
  function getSubtotal() { return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) }
  function getServiceCharge() { return orderType === 'take_away' ? 0 : getSubtotal() * (serviceChargePercent / 100) }
  function getTax() { return getSubtotal() * (taxPercent / 100) }
  function getGrandTotal() { return getSubtotal() + getServiceCharge() + getTax() }

  const openDrinkOptionsForItem = (item) => { 
    setSelectedDrinkItem(item)
    const options = drinkOptions[item.name]
    if (options && options.length > 0) {
      setSelectedDrinkOption(options[0].type)
    } else {
      setSelectedDrinkOption('Panas')
    }
    setShowDrinkModal(true) 
  }
  
  const addDrinkToCart = () => {
    if (!selectedDrinkItem) return
    const options = drinkOptions[selectedDrinkItem.name]
    const selected = options?.find(opt => opt.type === selectedDrinkOption)
    if (!selected) return
    
    setAddingItemId(`${selectedDrinkItem.id}_${selectedDrinkOption}`)
    setTimeout(() => setAddingItemId(null), 300)
    
    const optionLabel = getDrinkOptionLabel(selectedDrinkOption)
    
    setCart([...cart, { 
      id: `${selectedDrinkItem.id}_${selectedDrinkOption}_${Date.now()}`, 
      name: `${selectedDrinkItem.name} (${optionLabel})`, 
      price: selected.price, 
      quantity: 1,
      category: 'Minuman',
      option_type: selectedDrinkOption
    }])
    setShowDrinkModal(false)
    setSelectedDrinkItem(null)
    toast.success(`✓ ${selectedDrinkItem.name} (${optionLabel}) ${t('added')}`)
  }

  function addToCart(item) {
    setAddingItemId(item.id)
    setTimeout(() => setAddingItemId(null), 300)
    
    if (item.has_options) {
      loadMenuOptions(item.id).then(options => {
        if (options && options.length > 0) {
          setSelectedSizeItem(item)
          setMenuOptions(options)
          setShowSizeModal(true)
        } else {
          addToCartDirect(item)
        }
      })
      return
    }
    
    const hasDrinkOptions = drinkOptions[item.name] && drinkOptions[item.name].length > 0
    const isDrink = item.category === 'Minuman'
    
    if (hasDrinkOptions || isDrink) {
      openDrinkOptionsForItem(item)
    } else {
      addToCartDirect(item)
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
    if (cart.length === 0) { toast.error(t('empty_cart')); return }
    if (orderType === 'dine_in' && !tableNumber) { toast.error(t('please_enter_table')); return }
    const orderNumber = 'ORD-' + Date.now()
    const items = cart.map(item => ({ 
      id: item.id, 
      name: item.name, 
      price: item.price, 
      quantity: item.quantity, 
      category: item.category, 
      option_name: item.option_name || null,
      option_type: item.option_type || null
    }))
    const subtotal = getSubtotal()
    const serviceCharge = getServiceCharge()
    const tax = getTax()
    const grandTotal = getGrandTotal()
    const orderData = { order_number: orderNumber, items, subtotal, service_charge: serviceCharge, tax, total: grandTotal, payment_status: 'unpaid', status: 'pending' }
    if (orderType === 'take_away') { orderData.order_type = 'take_away'; orderData.customer_name = customerName || 'Take Away'; orderData.customer_phone = customerPhone || ''; orderData.table_number = 0 }
    else if (orderType === 'dine_in' && tableNumber) { orderData.order_type = 'dine_in'; orderData.customer_name = customerName || t('walk_in'); orderData.table_number = parseInt(tableNumber) }
    const { error } = await supabase.from('customer_orders').insert([orderData])
    if (error) toast.error(`${t('error')}: ${error.message}`)
    else { toast.success(`${t('order_sent')}`); setCart([]); setCustomerName(''); setCustomerPhone(''); setTableNumber(''); loadCustomerOrders() }
  }

  async function manualRefresh() { 
    await loadMenu(); 
    await loadDrinkOptions(); 
    await loadCustomerOrders(); 
    await loadUnpaidOrders(); 
    await loadSettings();
    await loadCategories();
    toast.success(`🔄 ${t('data_refreshed')}`) 
  }

  // ========== SUB CATEGORIES FOR POS FILTER ==========
  const subCategoriesForMenu = getSubCategoriesForMenu()
  const categoryNames = ['Semua', ...subCategoriesForMenu.map(cat => cat.name)]

  const filteredMenu = selectedCategory === 'Semua' 
    ? menu 
    : menu.filter(item => item.category === selectedCategory)

  const getDefaultIcon = (category) => {
    const found = categories.find(c => c.name === category)
    if (found && found.icon) return found.icon
    switch(category) {
      case 'Makanan': return '🍚'
      case 'Minuman': return '🥤'
      default: return '🍽️'
    }
  }

  const getCategoryIconForFilter = (catName) => {
    if (catName === 'Semua') return '🍽️'
    const found = subCategoriesForMenu.find(c => c.name === catName)
    if (found && found.icon) return found.icon
    return '🍽️'
  }

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return t('pending')
      case 'preparing': return t('preparing')
      case 'ready': return t('ready')
      case 'paid': return t('paid')
      default: return status
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#ef4444'
      case 'preparing': return '#f59e0b'
      case 'ready': return '#22c55e'
      case 'paid': return '#22c55e'
      default: return '#64748b'
    }
  }

  const renderOrderItems = (items) => {
    if (!items) return null
    return items.map((item, idx) => {
      const optionEmoji = item.option_type ? getDrinkOptionEmoji(item.option_type) : ''
      return (
        <div key={idx} style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '8px 0', 
          borderBottom: idx !== items.length - 1 ? `1px solid ${borderColor}` : 'none' 
        }}>
          <span style={{ color: textColor, flex: 2, fontSize: isMobile ? '12px' : '14px' }}>
            {item.name}
            {item.option_type && (
              <span style={{ 
                background: item.option_type === 'Bungkus' ? '#8b5cf6' : 
                           item.option_type === 'Panas' ? '#f97316' : '#06b6d4',
                color: 'white',
                padding: '1px 8px',
                borderRadius: '20px',
                fontSize: '9px',
                marginLeft: '6px',
                fontWeight: 'bold'
              }}>
                {optionEmoji} {item.option_type === 'Bungkus' ? t('takeaway_drink') : 
                               item.option_type === 'Panas' ? t('hot') : t('cold')}
              </span>
            )}
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
      const optionEmoji = item.option_type ? getDrinkOptionEmoji(item.option_type) : ''
      return (
        <div key={idx} style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          padding: '8px 0', 
          borderBottom: idx !== items.length - 1 ? `1px solid ${borderColor}` : 'none' 
        }}>
          <span style={{ color: textColor, fontSize: isMobile ? '12px' : '14px' }}>
            {item.name}
            {item.option_type && (
              <span style={{ 
                background: item.option_type === 'Bungkus' ? '#8b5cf6' : 
                           item.option_type === 'Panas' ? '#f97316' : '#06b6d4',
                color: 'white',
                padding: '1px 8px',
                borderRadius: '20px',
                fontSize: '9px',
                marginLeft: '6px',
                fontWeight: 'bold'
              }}>
                {optionEmoji} {item.option_type === 'Bungkus' ? t('takeaway_drink') : 
                               item.option_type === 'Panas' ? t('hot') : t('cold')}
              </span>
            )}
            <span style={{ color: textMuted, marginLeft: '4px' }}>x{item.quantity}</span>
          </span>
          <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: isMobile ? '12px' : '14px' }}>RM {(item.price * item.quantity).toFixed(2)}</span>
        </div>
      )
    })
  }

  const getOrderGrandTotal = (order) => {
    if (order.grand_total) return order.grand_total
    const subtotal = order.subtotal || order.total || 0
    const sc = order.service_charge || (subtotal * (serviceChargePercent / 100))
    const tax = order.tax || (subtotal * (taxPercent / 100))
    return subtotal + sc + tax
  }

  const getPaymentMethodDisplay = (method) => {
    if (!method) return '—'
    if (method === 'cash') return t('cash')
    if (method === 'tng') return t('tng')
    if (method === 'bank') return t('bank')
    return method
  }

  // POS Tab - Menu grid responsive
  const menuGridCols = isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(170px, 1fr))'

  return (
    <Sidebar>
      <div style={{ padding: isMobile ? '12px' : '24px', maxWidth: '1400px', margin: '0 auto', background: bgColor, minHeight: '100vh' }}>
        
        {/* Top Bar - Responsive */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ 
              background: kitchenEnabled ? '#22c55e' : '#ef4444', 
              color: 'white', 
              padding: '4px 14px', 
              borderRadius: '30px', 
              fontSize: isMobile ? '10px' : '12px', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              🍳 {kitchenEnabled ? t('kitchen_on') : t('kitchen_off')}
            </div>
            {!kitchenEnabled && autoCompleteEnabled && (
              <div style={{ 
                background: '#3b82f6', 
                color: 'white', 
                padding: '4px 14px', 
                borderRadius: '30px', 
                fontSize: isMobile ? '10px' : '12px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                ⏱️ {t('auto_complete')}: {autoCompleteMinutes}{t('min')}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={manualRefresh} 
              style={{ 
                background: 'linear-gradient(135deg, #06b6d4, #0891b2)', 
                color: 'white', 
                padding: isMobile ? '6px 14px' : '8px 20px', 
                border: 'none', 
                borderRadius: '30px', 
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
              onClick={() => { if (audio) { audio.currentTime = 0; audio.play().catch(e => console.log('Test sound failed:', e)) } }} 
              style={{ 
                background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
                color: textColor, 
                padding: isMobile ? '6px 14px' : '8px 20px', 
                border: `1px solid ${borderColor}`, 
                borderRadius: '30px', 
                cursor: 'pointer', 
                fontSize: isMobile ? '11px' : '13px', 
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🔊 <span style={{ display: isMobile ? 'none' : 'inline' }}>{t('test_sound')}</span>
            </button>
          </div>
        </div>

        {/* Settings Bar - Responsive */}
        <div style={{ 
          ...glassEffect, 
          borderRadius: '20px', 
          padding: isMobile ? '10px 16px' : '12px 24px', 
          marginBottom: '16px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '10px', 
          fontSize: isMobile ? '11px' : '13px' 
        }}>
          <span style={{ color: textColor }}>⚙️ {t('service')}: {serviceChargePercent}% {orderType === 'take_away' && '(Tiada)'}</span>
          <span style={{ color: textColor }}>🏷️ {t('tax')}: {taxPercent}%</span>
          <span style={{ color: textColor, fontWeight: 'bold' }}>💰 {t('unpaid')}: {unpaidOrders.length}</span>
        </div>

        {/* Order Type Selection - Responsive */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '16px', 
          background: cardBg, 
          borderRadius: '50px', 
          padding: '4px', 
          ...glassEffect 
        }}>
          <button 
            onClick={() => { setOrderType('dine_in'); setCustomerName(''); setCustomerPhone(''); setTableNumber(''); }} 
            style={{ 
              flex: 1, 
              padding: isMobile ? '8px 12px' : '12px 20px', 
              background: orderType === 'dine_in' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent', 
              color: orderType === 'dine_in' ? 'white' : textColor, 
              border: 'none', 
              borderRadius: '50px', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              fontSize: isMobile ? '12px' : '14px' 
            }}
          >
            {t('dine_in')}
          </button>
          <button 
            onClick={() => { setOrderType('take_away'); setCustomerName(''); setCustomerPhone(''); setTableNumber(''); }} 
            style={{ 
              flex: 1, 
              padding: isMobile ? '8px 12px' : '12px 20px', 
              background: orderType === 'take_away' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'transparent', 
              color: orderType === 'take_away' ? 'white' : textColor, 
              border: 'none', 
              borderRadius: '50px', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              fontSize: isMobile ? '12px' : '14px' 
            }}
          >
            {t('takeaway')}
          </button>
        </div>

        {/* Order Details Input - Responsive */}
        <div style={{ 
          ...glassEffect, 
          borderRadius: '20px', 
          padding: isMobile ? '12px' : '20px', 
          marginBottom: '16px', 
          display: 'flex', 
          gap: '10px', 
          flexWrap: 'wrap' 
        }}>
          {orderType === 'dine_in' && (
            <>
              <input 
                type="number" 
                placeholder={t('table_no')} 
                value={tableNumber} 
                onChange={(e) => setTableNumber(e.target.value)} 
                style={{ 
                  padding: isMobile ? '10px 12px' : '14px 16px', 
                  borderRadius: '14px', 
                  border: `1px solid ${inputBorder}`, 
                  background: inputBg, 
                  color: textColor, 
                  flex: 1, 
                  minWidth: '100px', 
                  fontSize: isMobile ? '13px' : '14px' 
                }} 
              />
              <input 
                type="text" 
                placeholder={t('name')} 
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)} 
                style={{ 
                  padding: isMobile ? '10px 12px' : '14px 16px', 
                  borderRadius: '14px', 
                  border: `1px solid ${inputBorder}`, 
                  background: inputBg, 
                  color: textColor, 
                  flex: 2, 
                  fontSize: isMobile ? '13px' : '14px' 
                }} 
              />
            </>
          )}
          {orderType === 'take_away' && (
            <>
              <input 
                type="text" 
                placeholder={t('name')} 
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)} 
                style={{ 
                  padding: isMobile ? '10px 12px' : '14px 16px', 
                  borderRadius: '14px', 
                  border: `1px solid ${inputBorder}`, 
                  background: inputBg, 
                  color: textColor, 
                  flex: 1, 
                  fontSize: isMobile ? '13px' : '14px' 
                }} 
              />
              <input 
                type="tel" 
                placeholder={t('phone')} 
                value={customerPhone} 
                onChange={(e) => setCustomerPhone(e.target.value)} 
                style={{ 
                  padding: isMobile ? '10px 12px' : '14px 16px', 
                  borderRadius: '14px', 
                  border: `1px solid ${inputBorder}`, 
                  background: inputBg, 
                  color: textColor, 
                  flex: 1, 
                  fontSize: isMobile ? '13px' : '14px' 
                }} 
              />
            </>
          )}
        </div>

        {/* Tabs - CLEAN, NO DOUBLE ICONS */}
        <div style={{ 
          display: 'flex', 
          gap: '4px', 
          marginBottom: '16px', 
          background: darkMode ? 'rgba(30, 30, 46, 0.5)' : 'rgba(0,0,0,0.03)', 
          borderRadius: '50px', 
          padding: '4px', 
          overflowX: 'auto', 
          flexWrap: 'nowrap' 
        }}>
          {[
            { id: 'pos', icon: '🧾', label: 'POS' },
            { id: 'orders', icon: '🆕', label: 'Baru', badge: customerOrders.length },
            { id: 'unpaid', icon: '💰', label: 'Belum Bayar', badge: unpaidOrders.length },
            { id: 'history', icon: '📜', label: 'Sejarah', badge: 0 }
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
                padding: isMobile ? '8px 12px' : '12px 24px', 
                background: activeTab === tab.id ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent', 
                color: activeTab === tab.id ? 'white' : textColor, 
                border: 'none', 
                borderRadius: '50px', 
                cursor: 'pointer', 
                fontWeight: activeTab === tab.id ? 'bold' : '500', 
                fontSize: isMobile ? '11px' : '14px', 
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

        {/* New Orders Alert Banner */}
        {customerOrders.length > 0 && activeTab !== 'orders' && (
          <div 
            onClick={() => setActiveTab('orders')} 
            style={{ 
              background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
              color: 'white', 
              padding: isMobile ? '12px 16px' : '16px 24px', 
              borderRadius: '20px', 
              marginBottom: '16px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              cursor: 'pointer' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: isMobile ? '20px' : '28px' }}>🔔</span>
              <div>
                <strong style={{ fontSize: isMobile ? '13px' : '16px' }}>{customerOrders.length} {t('new_order')}</strong>
                <br />
                <small style={{ fontSize: isMobile ? '9px' : '11px', opacity: 0.9 }}>{t('new_orders_alert')}</small>
              </div>
            </div>
            <div style={{ 
              background: 'white', 
              color: '#dc2626', 
              padding: '2px 12px', 
              borderRadius: '30px', 
              fontWeight: 'bold', 
              fontSize: isMobile ? '14px' : '18px' 
            }}>
              {customerOrders.length}
            </div>
          </div>
        )}

        {/* POS TAB - Responsive */}
        {activeTab === 'pos' && (
          <>
            <h1 style={{ color: textColor, fontSize: isMobile ? '18px' : '26px', marginBottom: '16px', fontWeight: 'bold' }}>
              🧾 POS {orderType === 'take_away' ? `(${t('takeaway')})` : `(${t('dine_in')})`}
            </h1>
            
            {/* Category Filters - ONLY SUB CATEGORIES (EXCLUDE MINUMAN) */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {categoryNames.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)} 
                  style={{ 
                    padding: isMobile ? '6px 14px' : '10px 24px', 
                    background: selectedCategory === cat ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent', 
                    color: selectedCategory === cat ? 'white' : textColor, 
                    border: `1px solid ${borderColor}`, 
                    borderRadius: '50px', 
                    cursor: 'pointer', 
                    fontWeight: selectedCategory === cat ? 'bold' : '500', 
                    fontSize: isMobile ? '11px' : '14px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat === 'Semua' ? `🍽️ ${t('all')}` : `${getCategoryIconForFilter(cat)} ${cat}`}
                </button>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
              {/* Menu Grid - WITH DESCRIPTION */}
              <div style={{ flex: 2 }}>
                <div style={{ display: 'grid', gridTemplateColumns: menuGridCols, gap: isMobile ? '12px' : '20px' }}>
                  {filteredMenu.map(item => {
                    const hasDrinkOptions = drinkOptions[item.name] && drinkOptions[item.name].length > 0
                    const hasImage = item.image_url && item.image_url.trim() !== ''
                    const panasPrice = hasDrinkOptions ? drinkOptions[item.name]?.find(o => o.type === 'Panas')?.price : null
                    const sejukPrice = hasDrinkOptions ? drinkOptions[item.name]?.find(o => o.type === 'Sejuk')?.price : null
                    const bungkusPrice = hasDrinkOptions ? drinkOptions[item.name]?.find(o => o.type === 'Bungkus')?.price : null
                    const isAdding = addingItemId === item.id
                    const hasSizeOptions = item.has_options === true
                    const hasDescription = item.description && item.description.trim() !== ''
                    
                    return (
                      <div key={item.id} style={{ 
                        ...glassEffect, 
                        borderRadius: '20px', 
                        padding: isMobile ? '12px' : '18px', 
                        textAlign: 'center', 
                        cursor: 'pointer', 
                        transition: 'transform 0.2s'
                      }}>
                        {hasImage ? (
                          <img src={item.image_url} alt={item.name} style={{ 
                            width: isMobile ? '60px' : '90px', 
                            height: isMobile ? '60px' : '90px', 
                            objectFit: 'cover', 
                            borderRadius: '14px', 
                            margin: '0 auto 10px auto', 
                            display: 'block' 
                          }} />
                        ) : (
                          <div style={{ 
                            width: isMobile ? '50px' : '70px', 
                            height: isMobile ? '50px' : '70px', 
                            background: secondaryBg, 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            margin: '0 auto 10px auto', 
                            fontSize: isMobile ? '28px' : '36px' 
                          }}>
                            {getDefaultIcon(item.category)}
                          </div>
                        )}
                        <h3 style={{ 
                          fontSize: isMobile ? '13px' : '15px', 
                          margin: '6px 0', 
                          color: textColor, 
                          fontWeight: 'bold' 
                        }}>
                          {item.name}
                        </h3>
                        
                        {/* 👇 DESCRIPTION DISPLAY */}
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
                            fontSize: isMobile ? '9px' : '11px', 
                            marginBottom: '10px', 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            justifyContent: 'center', 
                            gap: '4px' 
                          }}>
                            {panasPrice && <span style={{ color: '#f97316' }}>🔥 RM {panasPrice}</span>}
                            {sejukPrice && <span style={{ color: '#06b6d4' }}>🧊 RM {sejukPrice}</span>}
                            {bungkusPrice && <span style={{ color: '#8b5cf6' }}>📦 RM {bungkusPrice}</span>}
                          </div>
                        ) : (
                          <p style={{ 
                            color: darkMode ? '#4ade80' : '#22c55e', 
                            fontSize: isMobile ? '16px' : '18px', 
                            fontWeight: 'bold', 
                            margin: '6px 0' 
                          }}>
                            RM {item.price}
                          </p>
                        )}
                        {hasSizeOptions && (
                          <div style={{ 
                            fontSize: isMobile ? '9px' : '11px', 
                            color: '#8b5cf6', 
                            marginBottom: '6px', 
                            fontWeight: 'bold' 
                          }}>
                            {t('select_size')}
                          </div>
                        )}
                        <button 
                          onClick={() => addToCart(item)} 
                          style={{ 
                            background: isAdding ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #3b82f6, #2563eb)', 
                            color: 'white', 
                            padding: isMobile ? '8px 0' : '10px 0', 
                            border: 'none', 
                            borderRadius: '50px', 
                            cursor: 'pointer', 
                            width: '100%', 
                            fontSize: isMobile ? '11px' : '13px', 
                            fontWeight: 'bold' 
                          }}
                        >
                          {isAdding ? `✓ ${t('added')}` : `+ ${t('add')}`}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* Cart Section - Responsive sticky */}
              <div style={{ 
                flex: 1, 
                ...glassEffect, 
                borderRadius: '20px', 
                padding: isMobile ? '12px' : '20px', 
                position: isMobile ? 'relative' : 'sticky', 
                top: '20px', 
                alignSelf: 'flex-start', 
                maxHeight: isMobile ? 'auto' : 'calc(100vh - 40px)', 
                overflowY: 'auto' 
              }}>
                <h2 style={{ 
                  color: textColor, 
                  fontSize: isMobile ? '16px' : '20px', 
                  marginBottom: '12px', 
                  fontWeight: 'bold' 
                }}>
                  🛒 {t('cart')} ({cart.reduce((s, i) => s + i.quantity, 0)})
                </h2>
                {cart.length === 0 ? (
                  <p style={{ 
                    color: textMuted, 
                    textAlign: 'center', 
                    padding: '30px 10px', 
                    fontSize: isMobile ? '12px' : '14px' 
                  }}>
                    {t('empty_cart')}
                  </p>
                ) : (
                  <>
                    <div style={{ marginBottom: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                      {cart.map(item => {
                        const optionEmoji = item.option_type ? getDrinkOptionEmoji(item.option_type) : ''
                        return (
                          <div key={item.id} style={{ 
                            borderBottom: `1px solid ${borderColor}`, 
                            marginBottom: '8px', 
                            paddingBottom: '6px' 
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ 
                                  color: textColor, 
                                  fontWeight: '500', 
                                  fontSize: isMobile ? '12px' : '14px' 
                                }}>
                                  {item.name}
                                  {item.option_type && (
                                    <span style={{ 
                                      background: item.option_type === 'Bungkus' ? '#8b5cf6' : 
                                                 item.option_type === 'Panas' ? '#f97316' : '#06b6d4',
                                      color: 'white',
                                      padding: '1px 6px',
                                      borderRadius: '12px',
                                      fontSize: '8px',
                                      marginLeft: '4px'
                                    }}>
                                      {optionEmoji}
                                    </span>
                                  )}
                                </span>
                                <div style={{ fontSize: isMobile ? '10px' : '12px', color: textMuted }}>x{item.quantity}</div>
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
                                  padding: '2px 10px', 
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
                    <hr style={{ borderColor: borderColor, margin: '10px 0' }} />
                    <div style={{ fontSize: isMobile ? '12px' : '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span>{t('subtotal')}:</span>
                        <span>RM {getSubtotal().toFixed(2)}</span>
                      </div>
                      {orderType !== 'take_away' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span>{t('service')} ({serviceChargePercent}%):</span>
                          <span>RM {getServiceCharge().toFixed(2)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span>{t('tax')} ({taxPercent}%):</span>
                        <span>RM {getTax().toFixed(2)}</span>
                      </div>
                    </div>
                    <hr style={{ borderColor: borderColor, margin: '10px 0' }} />
                    <h3 style={{ 
                      textAlign: 'right', 
                      color: darkMode ? '#4ade80' : '#22c55e', 
                      fontSize: isMobile ? '18px' : '22px', 
                      marginBottom: '12px', 
                      fontWeight: 'bold' 
                    }}>
                      {t('grand_total')}: RM {getGrandTotal().toFixed(2)}
                    </h3>
                    <button 
                      onClick={saveOrder} 
                      style={{ 
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
                        color: 'white', 
                        padding: isMobile ? '10px' : '14px', 
                        width: '100%', 
                        border: 'none', 
                        borderRadius: '50px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold', 
                        fontSize: isMobile ? '13px' : '15px' 
                      }}
                    >
                      {t('place_order')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* ORDERS TAB - Responsive */}
        {activeTab === 'orders' && (
          <div>
            <h2 style={{ 
              color: textColor, 
              marginBottom: '16px', 
              fontSize: isMobile ? '16px' : '20px', 
              fontWeight: 'bold', 
              borderLeft: '4px solid #ef4444', 
              paddingLeft: '12px' 
            }}>
              🆕 {t('tab_new')}
            </h2>
            {customerOrders.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px', 
                ...glassEffect, 
                borderRadius: '20px' 
              }}>
                <span style={{ fontSize: '48px', opacity: 0.5 }}>🍽️</span>
                <p style={{ color: textMuted, marginTop: '12px' }}>{t('no_new_orders')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {customerOrders.map(order => (
                  <div key={order.id} style={{ 
                    ...glassEffect, 
                    borderRadius: '20px', 
                    padding: isMobile ? '16px' : '24px', 
                    borderLeft: `4px solid #ef4444` 
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginBottom: '12px', 
                      flexWrap: 'wrap', 
                      gap: '8px' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: isMobile ? '20px' : '28px' }}>
                          {order.order_type === 'take_away' ? '🥡' : '🍽️'}
                        </span>
                        <h3 style={{ 
                          margin: 0, 
                          fontSize: isMobile ? '14px' : '16px', 
                          color: textColor, 
                          fontWeight: 'bold' 
                        }}>
                          {order.order_type === 'take_away' ? t('takeaway') : `${t('table')} ${order.table_number}`}
                        </h3>
                        <span style={{ 
                          background: '#ef4444', 
                          color: 'white', 
                          padding: '2px 8px', 
                          borderRadius: '30px', 
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
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontWeight: 'bold', color: textColor, fontSize: isMobile ? '12px' : '14px' }}>
                        {t('customer')}:
                      </span> 
                      <span style={{ color: textColor, fontSize: isMobile ? '12px' : '14px' }}>
                        {order.customer_name || t('guest')}
                      </span>
                    </div>
                    <div style={{ 
                      background: secondaryBg, 
                      borderRadius: '16px', 
                      padding: '12px', 
                      margin: '12px 0' 
                    }}>
                      {renderOrderItems(order.items)}
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginTop: '12px', 
                      paddingTop: '12px', 
                      borderTop: `1px solid ${borderColor}`, 
                      flexWrap: 'wrap', 
                      gap: '10px' 
                    }}>
                      <div>
                        <span style={{ fontSize: isMobile ? '12px' : '14px', color: textMuted }}>
                          {t('total')}:
                        </span>
                        <span style={{ 
                          fontSize: isMobile ? '18px' : '22px', 
                          fontWeight: 'bold', 
                          color: '#22c55e', 
                          marginLeft: '6px' 
                        }}>
                          RM {order.total?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'accepted')} 
                          style={{ 
                            background: kitchenEnabled ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #06b6d4, #0891b2)', 
                            color: 'white', 
                            padding: isMobile ? '8px 16px' : '10px 24px', 
                            border: 'none', 
                            borderRadius: '40px', 
                            cursor: 'pointer', 
                            fontWeight: 'bold', 
                            fontSize: isMobile ? '11px' : '13px' 
                          }}
                        >
                          {kitchenEnabled ? t('accept_cook') : t('accept_ready')}
                        </button>
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'cancelled')} 
                          style={{ 
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
                            color: 'white', 
                            padding: isMobile ? '8px 16px' : '10px 24px', 
                            border: 'none', 
                            borderRadius: '40px', 
                            cursor: 'pointer', 
                            fontWeight: 'bold', 
                            fontSize: isMobile ? '11px' : '13px' 
                          }}
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* UNPAID TAB - Responsive */}
        {activeTab === 'unpaid' && (
          <div>
            <h2 style={{ 
              color: textColor, 
              marginBottom: '16px', 
              fontSize: isMobile ? '16px' : '20px', 
              fontWeight: 'bold', 
              borderLeft: '4px solid #eab308', 
              paddingLeft: '12px' 
            }}>
              💰 {t('tab_unpaid')}
            </h2>
            {unpaidOrders.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px', 
                ...glassEffect, 
                borderRadius: '20px' 
              }}>
                <span style={{ fontSize: '48px', opacity: 0.5 }}>✅</span>
                <p style={{ color: textMuted, marginTop: '12px' }}>{t('no_unpaid')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {unpaidOrders.map(order => {
                  const grandTotal = getOrderGrandTotal(order)
                  return (
                    <div key={order.id} style={{ 
                      ...glassEffect, 
                      borderRadius: '20px', 
                      padding: isMobile ? '16px' : '24px', 
                      borderLeft: `4px solid #eab308` 
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '12px', 
                        flexWrap: 'wrap', 
                        gap: '8px' 
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ color: textColor, fontSize: isMobile ? '12px' : '14px' }}>
                            {order.order_type === 'take_away' ? t('takeaway') : `${t('table')} ${order.table_number}`}
                          </span>
                          <span style={{ 
                            background: getStatusColor(order.status), 
                            color: order.status === 'preparing' ? '#333' : 'white', 
                            padding: '2px 10px', 
                            borderRadius: '30px', 
                            fontSize: isMobile ? '9px' : '10px', 
                            fontWeight: 'bold' 
                          }}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                      </div>
                      <p>
                        <strong style={{ color: textColor, fontSize: isMobile ? '12px' : '14px' }}>
                          {order.customer_name || t('guest')}
                        </strong>
                      </p>
                      <div style={{ 
                        background: secondaryBg, 
                        borderRadius: '16px', 
                        padding: '12px', 
                        margin: '12px 0' 
                      }}>
                        {renderUnpaidItems(order.items)}
                      </div>
                      <div style={{ 
                        background: secondaryBg, 
                        padding: '12px', 
                        borderRadius: '16px', 
                        marginTop: '12px' 
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          fontSize: isMobile ? '11px' : '13px', 
                          marginBottom: '4px' 
                        }}>
                          <span>{t('subtotal')}:</span>
                          <span>RM {order.subtotal?.toFixed(2) || order.total?.toFixed(2) || '0.00'}</span>
                        </div>
                        {order.order_type !== 'take_away' && (
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontSize: isMobile ? '11px' : '13px', 
                            marginBottom: '4px' 
                          }}>
                            <span>{t('service')} ({serviceChargePercent}%):</span>
                            <span>RM {order.service_charge?.toFixed(2) || '0.00'}</span>
                          </div>
                        )}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          fontSize: isMobile ? '11px' : '13px', 
                          marginBottom: '4px' 
                        }}>
                          <span>{t('tax')} ({taxPercent}%):</span>
                          <span>RM {order.tax?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div style={{ 
                          borderTop: `1px solid ${borderColor}`, 
                          marginTop: '8px', 
                          paddingTop: '8px', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          fontWeight: 'bold', 
                          fontSize: isMobile ? '14px' : '18px' 
                        }}>
                          <span>{t('grand_total')}:</span>
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
                          marginTop: '12px', 
                          width: '100%', 
                          fontSize: isMobile ? '13px' : '14px' 
                        }}
                      >
                        {t('record_payment_btn')}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB - Responsive */}
        {activeTab === 'history' && (
          <div>
            <h2 style={{ 
              color: textColor, 
              marginBottom: '16px', 
              fontSize: isMobile ? '16px' : '20px', 
              fontWeight: 'bold', 
              borderLeft: '4px solid #6c757d', 
              paddingLeft: '12px' 
            }}>
              📜 {t('tab_history')}
            </h2>
            {orderHistory.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px', 
                ...glassEffect, 
                borderRadius: '20px' 
              }}>
                <span style={{ fontSize: '48px', opacity: 0.5 }}>📜</span>
                <p style={{ color: textMuted, marginTop: '12px' }}>{t('no_history')}</p>
              </div>
            ) : (
              <>
                <div style={{ 
                  overflowX: 'auto', 
                  ...glassEffect, 
                  borderRadius: '20px', 
                  padding: '4px' 
                }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse', 
                    minWidth: isMobile ? '600px' : 'auto' 
                  }}>
                    <thead>
                      <tr style={{ 
                        background: darkMode ? 'rgba(30,30,46,0.8)' : '#f1f5f9' 
                      }}>
                        <th style={{ 
                          padding: '10px', 
                          textAlign: 'left', 
                          color: textColor, 
                          fontSize: isMobile ? '10px' : '13px' 
                        }}>
                          {t('id')}
                        </th>
                        <th style={{ 
                          padding: '10px', 
                          textAlign: 'left', 
                          color: textColor, 
                          fontSize: isMobile ? '10px' : '13px' 
                        }}>
                          {t('customer')}
                        </th>
                        <th style={{ 
                          padding: '10px', 
                          textAlign: 'left', 
                          color: textColor, 
                          fontSize: isMobile ? '10px' : '13px' 
                        }}>
                          {t('type')}
                        </th>
                        <th style={{ 
                          padding: '10px', 
                          textAlign: 'left', 
                          color: textColor, 
                          fontSize: isMobile ? '10px' : '13px' 
                        }}>
                          {t('total')}
                        </th>
                        <th style={{ 
                          padding: '10px', 
                          textAlign: 'left', 
                          color: textColor, 
                          fontSize: isMobile ? '10px' : '13px' 
                        }}>
                          {t('method')}
                        </th>
                        <th style={{ 
                          padding: '10px', 
                          textAlign: 'left', 
                          color: textColor, 
                          fontSize: isMobile ? '10px' : '13px' 
                        }}>
                          {t('time')}
                        </th>
                        <th style={{ 
                          padding: '10px', 
                          textAlign: 'left', 
                          color: textColor, 
                          fontSize: isMobile ? '10px' : '13px' 
                        }}>
                          {t('action')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderHistory.slice((historyPage - 1) * historyItemsPerPage, historyPage * historyItemsPerPage).map(order => (
                        <tr key={order.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                          <td style={{ 
                            padding: '8px', 
                            color: textColor, 
                            fontSize: isMobile ? '10px' : '13px' 
                          }}>
                            {order.order_number || `ORD-${order.id}`}
                          </td>
                          <td style={{ 
                            padding: '8px', 
                            color: textColor, 
                            fontSize: isMobile ? '10px' : '13px' 
                          }}>
                            {order.customer_name || t('guest')}
                          </td>
                          <td style={{ 
                            padding: '8px', 
                            color: textColor, 
                            fontSize: isMobile ? '10px' : '13px' 
                          }}>
                            {order.order_type === 'take_away' ? `🥡 ${t('takeaway')}` : `🍽️ ${t('table')} ${order.table_number}`}
                          </td>
                          <td style={{ 
                            padding: '8px', 
                            color: '#22c55e', 
                            fontWeight: 'bold', 
                            fontSize: isMobile ? '10px' : '13px' 
                          }}>
                            RM {getOrderGrandTotal(order).toFixed(2)}
                          </td>
                          <td style={{ 
                            padding: '8px', 
                            color: textColor, 
                            fontSize: isMobile ? '10px' : '13px' 
                          }}>
                            {getPaymentMethodDisplay(order.payment_method)}
                          </td>
                          <td style={{ 
                            padding: '8px', 
                            color: textColor, 
                            fontSize: isMobile ? '10px' : '13px' 
                          }}>
                            {formatMalaysiaTime(order.created_at)}
                          </td>
                          <td style={{ padding: '8px' }}>
                            <button 
                              onClick={() => reprintReceipt(order)} 
                              style={{ 
                                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
                                color: 'white', 
                                padding: '4px 14px', 
                                border: 'none', 
                                borderRadius: '30px', 
                                cursor: 'pointer', 
                                fontSize: isMobile ? '10px' : '12px', 
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              🧾 {t('reprint')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination - Responsive */}
                {Math.ceil(orderHistory.length / historyItemsPerPage) > 1 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    gap: '6px', 
                    marginTop: '16px', 
                    flexWrap: 'wrap' 
                  }}>
                    <button 
                      onClick={() => setHistoryPage(1)} 
                      disabled={historyPage === 1} 
                      style={{ 
                        padding: isMobile ? '4px 10px' : '8px 14px', 
                        background: historyPage === 1 ? secondaryBg : '#2563eb', 
                        color: historyPage === 1 ? textMuted : 'white', 
                        border: 'none', 
                        borderRadius: '30px', 
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
                        padding: isMobile ? '4px 10px' : '8px 14px', 
                        background: historyPage === 1 ? secondaryBg : '#2563eb', 
                        color: historyPage === 1 ? textMuted : 'white', 
                        border: 'none', 
                        borderRadius: '30px', 
                        cursor: historyPage === 1 ? 'not-allowed' : 'pointer', 
                        fontSize: isMobile ? '10px' : '12px', 
                        fontWeight: 'bold' 
                      }}
                    >
                      ‹ {t('prev')}
                    </button>
                    <span style={{ 
                      padding: isMobile ? '4px 10px' : '8px 16px', 
                      background: cardBg, 
                      borderRadius: '30px', 
                      color: textColor, 
                      fontSize: isMobile ? '11px' : '13px', 
                      border: `1px solid ${borderColor}` 
                    }}>
                      {historyPage} / {Math.ceil(orderHistory.length / historyItemsPerPage)}
                    </span>
                    <button 
                      onClick={() => setHistoryPage(prev => Math.min(Math.ceil(orderHistory.length / historyItemsPerPage), prev + 1))} 
                      disabled={historyPage === Math.ceil(orderHistory.length / historyItemsPerPage)} 
                      style={{ 
                        padding: isMobile ? '4px 10px' : '8px 14px', 
                        background: historyPage === Math.ceil(orderHistory.length / historyItemsPerPage) ? secondaryBg : '#2563eb', 
                        color: historyPage === Math.ceil(orderHistory.length / historyItemsPerPage) ? textMuted : 'white', 
                        border: 'none', 
                        borderRadius: '30px', 
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
                        padding: isMobile ? '4px 10px' : '8px 14px', 
                        background: historyPage === Math.ceil(orderHistory.length / historyItemsPerPage) ? secondaryBg : '#2563eb', 
                        color: historyPage === Math.ceil(orderHistory.length / historyItemsPerPage) ? textMuted : 'white', 
                        border: 'none', 
                        borderRadius: '30px', 
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

        {/* Size Options Modal - Responsive */}
        {showSizeModal && selectedSizeItem && (
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
              borderRadius: '24px', 
              padding: isMobile ? '20px' : '28px', 
              maxWidth: '380px', 
              width: '90%', 
              textAlign: 'center', 
              animation: 'popIn 0.3s ease',
              ...glassEffect
            }}>
              <h2 style={{ 
                marginBottom: '6px', 
                fontSize: isMobile ? '18px' : '22px', 
                fontWeight: 'bold',
                color: textColor 
              }}>
                {selectedSizeItem.name}
              </h2>
              <p style={{ 
                color: textMuted, 
                marginBottom: '20px', 
                fontSize: isMobile ? '12px' : '14px' 
              }}>
                {t('choose_size')}
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {menuOptions.map(opt => {
                  const finalPrice = opt.is_absolute_price ? opt.price_adjustment : (selectedSizeItem.price + opt.price_adjustment)
                  return (
                    <button 
                      key={opt.id} 
                      onClick={() => addToCartWithOption(selectedSizeItem, opt)} 
                      style={{ 
                        padding: isMobile ? '12px 16px' : '14px 20px',
                        background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: isMobile ? '14px' : '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{opt.option_name}</span>
                      <span>RM {finalPrice.toFixed(2)}</span>
                    </button>
                  )
                })}
              </div>
              
              <button 
                onClick={() => setShowSizeModal(false)} 
                style={{ 
                  width: '100%', 
                  padding: isMobile ? '12px' : '14px', 
                  background: '#64748b', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '50px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold' 
                }}
              >
                ❌ {t('close')}
              </button>
            </div>
          </div>
        )}

        {/* Drink Options Modal - UPDATED with Bungkus */}
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
              borderRadius: '24px', 
              padding: isMobile ? '20px' : '28px', 
              maxWidth: '380px', 
              width: '90%', 
              textAlign: 'center', 
              animation: 'popIn 0.3s ease',
              ...glassEffect
            }}>
              <h2 style={{ 
                marginBottom: '6px', 
                fontSize: isMobile ? '18px' : '22px', 
                fontWeight: 'bold',
                color: textColor 
              }}>
                🥤 {selectedDrinkItem.name}
              </h2>
              <p style={{ 
                color: textMuted, 
                marginBottom: '20px', 
                fontSize: isMobile ? '12px' : '14px' 
              }}>
                {t('drink_type')}
              </p>
              
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                marginBottom: '20px', 
                flexWrap: 'wrap', 
                justifyContent: 'center' 
              }}>
                {/* Panas */}
                {drinkOptions[selectedDrinkItem.name]?.some(o => o.type === 'Panas') && (
                  <button 
                    onClick={() => setSelectedDrinkOption('Panas')} 
                    style={{ 
                      flex: 1, 
                      minWidth: isMobile ? '80px' : '100px',
                      padding: isMobile ? '12px' : '16px', 
                      background: selectedDrinkOption === 'Panas' ? 'linear-gradient(135deg, #f97316, #ea580c)' : secondaryBg, 
                      color: selectedDrinkOption === 'Panas' ? 'white' : textColor, 
                      border: selectedDrinkOption === 'Panas' ? 'none' : `1px solid ${borderColor}`, 
                      borderRadius: '14px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold', 
                      fontSize: isMobile ? '12px' : '14px',
                      transition: 'all 0.2s'
                    }}
                  >
                    🔥 {t('hot')}<br />
                    <small>RM {drinkOptions[selectedDrinkItem.name]?.find(o => o.type === 'Panas')?.price?.toFixed(2) || '0.00'}</small>
                  </button>
                )}
                
                {/* Sejuk */}
                {drinkOptions[selectedDrinkItem.name]?.some(o => o.type === 'Sejuk') && (
                  <button 
                    onClick={() => setSelectedDrinkOption('Sejuk')} 
                    style={{ 
                      flex: 1, 
                      minWidth: isMobile ? '80px' : '100px',
                      padding: isMobile ? '12px' : '16px', 
                      background: selectedDrinkOption === 'Sejuk' ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : secondaryBg, 
                      color: selectedDrinkOption === 'Sejuk' ? 'white' : textColor, 
                      border: selectedDrinkOption === 'Sejuk' ? 'none' : `1px solid ${borderColor}`, 
                      borderRadius: '14px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold', 
                      fontSize: isMobile ? '12px' : '14px',
                      transition: 'all 0.2s'
                    }}
                  >
                    🧊 {t('cold')}<br />
                    <small>RM {drinkOptions[selectedDrinkItem.name]?.find(o => o.type === 'Sejuk')?.price?.toFixed(2) || '0.00'}</small>
                  </button>
                )}
                
                {/* Bungkus / Takeaway */}
                {drinkOptions[selectedDrinkItem.name]?.some(o => o.type === 'Bungkus') && (
                  <button 
                    onClick={() => setSelectedDrinkOption('Bungkus')} 
                    style={{ 
                      flex: 1, 
                      minWidth: isMobile ? '80px' : '100px',
                      padding: isMobile ? '12px' : '16px', 
                      background: selectedDrinkOption === 'Bungkus' ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : secondaryBg, 
                      color: selectedDrinkOption === 'Bungkus' ? 'white' : textColor, 
                      border: selectedDrinkOption === 'Bungkus' ? 'none' : `1px solid ${borderColor}`, 
                      borderRadius: '14px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold', 
                      fontSize: isMobile ? '12px' : '14px',
                      transition: 'all 0.2s'
                    }}
                  >
                    📦 {t('takeaway_drink')}<br />
                    <small>RM {drinkOptions[selectedDrinkItem.name]?.find(o => o.type === 'Bungkus')?.price?.toFixed(2) || '0.00'}</small>
                  </button>
                )}
              </div>
              
              <button 
                onClick={addDrinkToCart} 
                style={{ 
                  width: '100%', 
                  padding: isMobile ? '12px' : '14px', 
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '50px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold', 
                  marginBottom: '10px',
                  fontSize: isMobile ? '13px' : '14px'
                }}
              >
                {t('add_to_cart')}
              </button>
              <button 
                onClick={() => setShowDrinkModal(false)} 
                style={{ 
                  width: '100%', 
                  padding: isMobile ? '12px' : '14px', 
                  background: '#64748b', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '50px', 
                  cursor: 'pointer',
                  fontSize: isMobile ? '13px' : '14px'
                }}
              >
                {t('close')}
              </button>
            </div>
          </div>
        )}

        {/* Payment Modal - Responsive */}
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
              borderRadius: '24px', 
              maxWidth: '420px', 
              width: '90%', 
              ...glassEffect, 
              animation: 'popIn 0.3s ease' 
            }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ 
                  width: isMobile ? '48px' : '56px', 
                  height: isMobile ? '48px' : '56px', 
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 10px auto' 
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
              </div>
              <div style={{ 
                background: secondaryBg, 
                padding: '12px', 
                borderRadius: '16px', 
                marginBottom: '16px' 
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '6px', 
                  fontSize: isMobile ? '11px' : '13px' 
                }}>
                  <span>{t('id')}:</span>
                  <span style={{ fontWeight: 'bold' }}>{selectedOrder.order_number || `ORD-${selectedOrder.id}`}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '6px', 
                  fontSize: isMobile ? '11px' : '13px' 
                }}>
                  <span>{t('table_no')}:</span>
                  <span style={{ fontWeight: 'bold' }}>{selectedOrder.table_number || t('no_table')}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: isMobile ? '11px' : '13px' 
                }}>
                  <span>{t('customer')}:</span>
                  <span style={{ fontWeight: 'bold' }}>{selectedOrder.customer_name || t('guest')}</span>
                </div>
              </div>
              {(() => {
                const subtotal = selectedOrder.subtotal || selectedOrder.total || 0
                const sc = selectedOrder.order_type === 'take_away' ? 0 : (selectedOrder.service_charge || (subtotal * (serviceChargePercent / 100)))
                const tax = selectedOrder.tax || (subtotal * (taxPercent / 100))
                const grandTotal = selectedOrder.grand_total || (subtotal + sc + tax)
                return (
                  <div style={{ 
                    background: secondaryBg, 
                    padding: '12px', 
                    borderRadius: '16px', 
                    marginBottom: '16px' 
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
                        <span>{t('service')} ({serviceChargePercent}%):</span>
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
                      marginTop: '8px', 
                      paddingTop: '8px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontWeight: 'bold', 
                      fontSize: isMobile ? '16px' : '18px' 
                    }}>
                      <span>{t('grand_total')}:</span>
                      <span style={{ color: '#22c55e' }}>RM {grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )
              })()}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold', 
                  color: textColor, 
                  fontSize: isMobile ? '12px' : '14px' 
                }}>
                  {t('method')}:
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {['cash', 'tng', 'bank'].map(method => (
                    <button 
                      key={method} 
                      onClick={() => setPaymentMethod(method)} 
                      style={{ 
                        flex: 1, 
                        padding: isMobile ? '10px' : '12px', 
                        background: paymentMethod === method ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : secondaryBg, 
                        color: paymentMethod === method ? 'white' : textColor, 
                        border: paymentMethod === method ? 'none' : `1px solid ${borderColor}`, 
                        borderRadius: '14px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold', 
                        fontSize: isMobile ? '12px' : '14px',
                        transition: 'all 0.2s'
                      }}
                    >
                      {method === 'cash' ? t('cash') : method === 'tng' ? t('tng') : t('bank')}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => markAsPaid(selectedOrder)} 
                  style={{ 
                    flex: 1, 
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)', 
                    color: 'white', 
                    padding: isMobile ? '12px' : '14px', 
                    border: 'none', 
                    borderRadius: '50px', 
                    cursor: 'pointer', 
                    fontWeight: 'bold', 
                    fontSize: isMobile ? '13px' : '14px' 
                  }}
                >
                  ✅ {t('save')}
                </button>
                <button 
                  onClick={() => { setShowPaymentModal(false); setSelectedOrder(null); }} 
                  style={{ 
                    flex: 1, 
                    background: '#64748b', 
                    color: 'white', 
                    padding: isMobile ? '12px' : '14px', 
                    border: 'none', 
                    borderRadius: '50px', 
                    cursor: 'pointer', 
                    fontSize: isMobile ? '13px' : '14px' 
                  }}
                >
                  ❌ {t('close')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceipt && currentReceiptOrder && (
          <ReceiptModal 
            order={currentReceiptOrder} 
            onClose={() => { setShowReceipt(false); setCurrentReceiptOrder(null); }} 
          />
        )}
        {showHistoryReceipt && selectedHistoryOrder && (
          <ReceiptModal 
            order={selectedHistoryOrder} 
            onClose={() => { setShowHistoryReceipt(false); setSelectedHistoryOrder(null); }} 
          />
        )}
        
        <style>
          {`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes popIn { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: ${darkMode ? '#2a2a3e' : '#e2e8f0'}; border-radius: 10px; }
            ::-webkit-scrollbar-thumb { background: ${darkMode ? '#555' : '#94a3b8'}; border-radius: 10px; }
            button { transition: all 0.2s; }
            button:hover:not(:disabled) { opacity: 0.85; transform: scale(0.98); }
            button:disabled { opacity: 0.5; cursor: not-allowed; }
            input:focus, select:focus, textarea:focus { outline: none; border-color: #3b82f6; }
          `}
        </style>
      </div>
    </Sidebar>
  )
}

export default StaffApp