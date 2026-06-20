import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'
import { supabase } from './lib/supabase'

// Helper functions for Malaysia time (UTC+8)
const formatMalaysiaDate = (date) => {
  return date.toLocaleDateString('en-MY', { 
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const formatMalaysiaTime = (date) => {
  return date.toLocaleTimeString('en-MY', { 
    timeZone: 'Asia/Kuala_Lumpur',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

const formatOrderTime = (utcDateString) => {
  if (!utcDateString) return '-'
  const date = new Date(utcDateString)
  return date.toLocaleTimeString('en-MY', { 
    timeZone: 'Asia/Kuala_Lumpur',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

function CustomerDisplay() {
  const { darkMode, toggleDarkMode } = useTheme()
  const { language, setLanguage } = useLanguage()
  const [menu, setMenu] = useState([])
  const [categories, setCategories] = useState([])
  const [tables, setTables] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [tableOrders, setTableOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [restaurantName, setRestaurantName] = useState('Restoran Kita')
  const [logoUrl, setLogoUrl] = useState('')
  const [showBillingModal, setShowBillingModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [serviceChargePercent, setServiceChargePercent] = useState(6)
  const [taxPercent, setTaxPercent] = useState(6)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [specialMenuEnabled, setSpecialMenuEnabled] = useState(false)
  const [specialMenuTitle, setSpecialMenuTitle] = useState('Istimewa Hari Ini')
  const [specialMenuItems, setSpecialMenuItems] = useState([])
  const [searchMenu, setSearchMenu] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [searchOrder, setSearchOrder] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  
  // ============================================================
  // DISPLAY TOGGLE SETTINGS - NEW
  // ============================================================
  const [displaySettings, setDisplaySettings] = useState({
    showFood: true,
    showDrinks: true,
    showSpecial: true,
    showPromos: true
  })
  
  // Business hours
  const [businessHoursStart, setBusinessHoursStart] = useState('09:00')
  const [businessHoursEnd, setBusinessHoursEnd] = useState('22:00')
  const [isOpen, setIsOpen] = useState(true)
  
  // Current time
  const [currentTime, setCurrentTime] = useState(new Date())

  // ============================================================
  // TRANSLATIONS
  // ============================================================
  const translations = {
    menu_pricing: { en: 'Menu & Pricing', ms: 'Menu & Harga' },
    open: { en: 'OPEN', ms: 'BUKA' },
    closed: { en: 'CLOSED', ms: 'TUTUP' },
    billing: { en: '💳 Billing', ms: '💳 Bil' },
    take_away: { en: 'Take Away', ms: 'Bungkus' },
    all_orders: { en: 'All Orders', ms: 'Semua Pesanan' },
    select_table: { en: 'Select Table', ms: 'Pilih Meja' },
    table_number: { en: 'Table', ms: 'Meja' },
    no_orders: { en: 'No orders', ms: 'Tiada pesanan' },
    subtotal: { en: 'Subtotal', ms: 'Subtotal' },
    service_charge: { en: 'Service Charge', ms: 'Caj Perkhidmatan' },
    tax: { en: 'Tax', ms: 'Cukai' },
    total: { en: 'Total', ms: 'Jumlah' },
    payment_method: { en: 'Payment Method', ms: 'Kaedah Bayaran' },
    cash: { en: 'Cash', ms: 'Tunai' },
    tng: { en: 'TnG', ms: 'TnG' },
    bank: { en: 'Bank', ms: 'Bank' },
    record_payment: { en: 'Record Payment', ms: 'Rekod Bayaran' },
    payment_received: { en: 'Payment received', ms: 'Bayaran diterima' },
    btn_print: { en: 'Print', ms: 'Cetak' },
    btn_pay: { en: 'Pay', ms: 'Bayar' },
    btn_save: { en: 'Save', ms: 'Simpan' },
    cancel: { en: 'Cancel', ms: 'Batal' },
    close: { en: 'Close', ms: 'Tutup' },
    print_all: { en: 'Print All', ms: 'Cetak Semua' },
    find_order: { en: 'Find order...', ms: 'Cari pesanan...' },
    thank_you: { en: 'Thank you for dining with us!', ms: 'Terima kasih kerana makan di sini!' },
    error_updating: { en: 'Error updating order', ms: 'Ralat kemaskini pesanan' },
    all: { en: 'All', ms: 'Semua' },
    special_today: { en: 'Today\'s Special Menu', ms: 'Menu Istimewa Hari Ini' },
    // Display toggle translations
    display_settings: { en: 'Display Settings', ms: 'Tetapan Paparan' },
    show_food: { en: '🍳 Food', ms: '🍳 Makanan' },
    show_drinks: { en: '🥤 Drinks', ms: '🥤 Minuman' },
    show_special: { en: '⭐ Special', ms: '⭐ Istimewa' },
    show_promos: { en: '🏷️ Promotions', ms: '🏷️ Promosi' },
    showing_items: { en: 'Showing', ms: 'Menunjukkan' },
    of_items: { en: 'of', ms: 'daripada' },
    items_count: { en: 'items', ms: 'item' },
    no_items_to_display: { en: 'No items to display. Please adjust display settings.', ms: 'Tiada item untuk dipaparkan. Sila tukar tetapan paparan.' },
  }

  const t2 = (key) => {
    if (!translations[key]) return key
    return language === 'en' ? translations[key].en : translations[key].ms
  }

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
  const bgColor = darkMode ? '#0a0a16' : '#f0f4f8'
  const cardBg = darkMode ? 'rgba(20, 20, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  const textColor = darkMode ? '#e8edf5' : '#1e293b'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.5)'
  const modalBg = darkMode ? 'rgba(20, 20, 40, 0.98)' : 'rgba(255, 255, 255, 0.98)'
  const secondaryBg = darkMode ? 'rgba(30, 30, 50, 0.6)' : 'rgba(248, 250, 252, 0.8)'
  const inputBg = darkMode ? '#1a1a2e' : '#ffffff'
  
  const glassEffect = {
    background: cardBg,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${borderColor}`,
    boxShadow: darkMode 
      ? '0 8px 40px rgba(0,0,0,0.5)' 
      : '0 8px 40px rgba(0,0,0,0.06)'
  }

  // ============================================================
  // CHECK BUSINESS HOURS
  // ============================================================
  const checkBusinessHours = () => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const [startHour, startMinute] = businessHoursStart.split(':').map(Number)
    const [endHour, endMinute] = businessHoursEnd.split(':').map(Number)
    
    const currentTotal = currentHour * 60 + currentMinute
    const startTotal = startHour * 60 + startMinute
    const endTotal = endHour * 60 + endMinute
    
    setIsOpen(currentTotal >= startTotal && currentTotal <= endTotal)
  }

  // ============================================================
  // CLOCK UPDATES
  // ============================================================
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      checkBusinessHours()
    }, 1000)
    return () => clearInterval(timer)
  }, [businessHoursStart, businessHoursEnd])

  // ============================================================
  // LOAD DATA
  // ============================================================
  useEffect(() => {
    loadAllData()
    
    const orderSubscription = supabase
      .channel('customer_orders_display')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'customer_orders' },
        () => {
          if (selectedTable) {
            loadTableOrders(selectedTable)
          }
        }
      )
      .subscribe()
    
    return () => {
      orderSubscription.unsubscribe()
    }
  }, [selectedTable])

  useEffect(() => {
    const interval = setInterval(() => {
      loadMenu()
      loadSpecialMenu()
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  async function loadAllData() {
    setLoading(true)
    await loadRestaurantInfo()
    await loadCategories()
    await loadMenu()
    await loadTables()
    await loadSettings()
    await loadSpecialMenu()
    await loadBusinessHours()
    setLoading(false)
  }

  async function loadRestaurantInfo() {
    const { data: nameData } = await supabase.from('settings').select('value').eq('key', 'restaurant_name').single()
    if (nameData) setRestaurantName(nameData.value)
    const { data: logoData } = await supabase.from('settings').select('value').eq('key', 'logo_url').single()
    if (logoData && logoData.value) setLogoUrl(logoData.value)
  }

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    setCategories(data || [])
  }

  async function loadBusinessHours() {
    const { data: startData } = await supabase.from('settings').select('value').eq('key', 'business_hours_start').single()
    if (startData) setBusinessHoursStart(startData.value)
    
    const { data: endData } = await supabase.from('settings').select('value').eq('key', 'business_hours_end').single()
    if (endData) setBusinessHoursEnd(endData.value)
  }

  async function refreshData() {
    setRefreshing(true)
    await loadAllData()
    if (selectedTable) {
      await loadTableOrders(selectedTable)
    }
    setRefreshing(false)
    toast.success('Data refreshed!')
  }

  async function forceRefreshMenu() {
    setRefreshing(true)
    await loadMenu()
    await loadSpecialMenu()
    setRefreshing(false)
    toast.success('Menu refreshed!')
  }

  async function loadSettings() {
    const { data } = await supabase.from('settings').select('key, value')
    if (data) {
      const sc = data.find(s => s.key === 'service_charge')
      const tx = data.find(s => s.key === 'tax')
      if (sc) setServiceChargePercent(parseFloat(sc.value) || 0)
      if (tx) setTaxPercent(parseFloat(tx.value) || 0)
    }
  }

  async function loadSpecialMenu() {
    const { data: enabledData } = await supabase.from('settings').select('value').eq('key', 'special_menu_enabled').single()
    if (enabledData) setSpecialMenuEnabled(enabledData.value === 'true')
    const { data: titleData } = await supabase.from('settings').select('value').eq('key', 'special_menu_title').single()
    if (titleData) setSpecialMenuTitle(titleData.value)
    const { data: itemsData } = await supabase.from('settings').select('value').eq('key', 'special_menu_items').single()
    if (itemsData) {
      try {
        setSpecialMenuItems(JSON.parse(itemsData.value))
      } catch (e) {
        setSpecialMenuItems([])
      }
    }
  }

  async function loadMenu() {
    try {
      const { data, error } = await supabase.from('menu').select('*').order('category')
      if (!error && data) setMenu(data)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  async function loadTables() {
    const { data } = await supabase.from('tables').select('*').order('table_number')
    if (data && data.length > 0) {
      setTables(data)
    } else {
      const newTables = []
      for (let i = 1; i <= 23; i++) {
        newTables.push({ table_number: i, status: 'available' })
      }
      setTables(newTables)
    }
  }

  async function loadTableOrders(tableNum) {
    let query = supabase.from('customer_orders').select('*').eq('payment_status', 'unpaid').order('created_at', { ascending: false })
    if (tableNum === 'takeaway') {
      query = query.eq('order_type', 'take_away')
    } else if (tableNum === 'all') {
      // No filter
    } else if (tableNum && tableNum !== 'all' && tableNum !== 'takeaway') {
      query = query.eq('table_number', parseInt(tableNum))
    }
    const { data } = await query
    setTableOrders(data || [])
  }

  const selectTable = async (tableNum) => {
    setSelectedTable(tableNum)
    await loadTableOrders(tableNum)
  }

  const showAllOrders = async () => {
    setSelectedTable('all')
    await loadTableOrders('all')
  }

  const showTakeawayOrders = async () => {
    setSelectedTable('takeaway')
    await loadTableOrders('takeaway')
  }

  // ============================================================
  // TOGGLE DISPLAY SETTINGS - NEW
  // ============================================================
  const toggleDisplay = (key) => {
    setDisplaySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // ============================================================
  // GET FILTERED MENU - NEW
  // ============================================================
  const getFilteredDisplayMenu = () => {
    let filtered = [...menu]
    
    // Filter by display settings
    if (!displaySettings.showFood) {
      // Hide all food items (including sub-categories)
      const foodCategories = ['Makanan', 'Mee', 'Bihup SUP', 'Telur', 'Meggie Sup', 'Sup', 'Nasi']
      filtered = filtered.filter(item => !foodCategories.includes(item.category))
    }
    
    if (!displaySettings.showDrinks) {
      // Hide all drink items (including sub-categories)
      const drinkCategories = ['Minuman', 'Teh', 'Kopi', 'Jus', 'Air']
      filtered = filtered.filter(item => !drinkCategories.includes(item.category))
    }
    
    if (!displaySettings.showSpecial) {
      filtered = filtered.filter(item => item.category !== 'Istimewa')
    }
    
    if (!displaySettings.showPromos) {
      filtered = filtered.filter(item => !item.is_promo)
    }
    
    return filtered
  }

  // ============================================================
  // PAYMENT & PRINT FUNCTIONS
  // ============================================================
  async function markAsPaid(order) {
    const subtotal = parseFloat(order.subtotal || order.total || 0)
    const serviceCharge = order.order_type === 'take_away' ? 0 : subtotal * (serviceChargePercent / 100)
    const tax = subtotal * (taxPercent / 100)
    const grandTotal = subtotal + serviceCharge + tax

    const { error } = await supabase.from('customer_orders').update({
      payment_status: 'paid', 
      payment_method: paymentMethod, 
      paid_at: new Date().toISOString(),
      subtotal, 
      service_charge: serviceCharge, 
      tax, 
      grand_total: grandTotal
    }).eq('id', order.id)

    if (error) {
      toast.error(t2('error_updating') + ': ' + error.message)
      return
    }

    if (selectedTable === 'takeaway') {
      await loadTableOrders('takeaway')
    } else if (selectedTable === 'all') {
      await loadTableOrders('all')
    } else {
      await loadTableOrders(selectedTable)
    }
    
    setShowPaymentModal(false)
    setSelectedOrder(null)
    toast.success(`✅ ${t2('payment_received')} RM ${grandTotal.toFixed(2)}!`)
    
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
        const receiptOrder = { 
          ...order, 
          payment_method: paymentMethod, 
          paid_at: new Date().toISOString(), 
          subtotal, 
          service_charge: serviceCharge, 
          tax, 
          grand_total: grandTotal 
        }
        
        setTimeout(() => {
          printReceiptDirect(receiptOrder)
        }, 500)
      }
    } catch (err) {
      console.error('Auto print error:', err)
    }
  }

  // ============================================================
  // PRINT RECEIPT
  // ============================================================
  const printReceiptDirect = (order) => {
    const subtotal = order.subtotal || order.total
    const sc = order.service_charge || (subtotal * (serviceChargePercent / 100))
    const tax = order.tax || (subtotal * (taxPercent / 100))
    const grandTotal = order.grand_total || (subtotal + sc + tax)
    
    const orderDate = new Date(order.created_at)
    const formattedDate = orderDate.toLocaleDateString('en-MY', { 
      timeZone: 'Asia/Kuala_Lumpur',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    const formattedTime = orderDate.toLocaleTimeString('en-MY', { 
      timeZone: 'Asia/Kuala_Lumpur',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
    
    const isDarkMode = darkMode
    
    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Resit - ${restaurantName}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 20px; 
            background: ${isDarkMode ? '#1a1a2e' : '#ffffff'}; 
            color: ${isDarkMode ? '#e2e8f0' : '#1a1a2e'};
          }
          .receipt { 
            max-width: 320px; 
            margin: 0 auto; 
            font-size: 12px;
            background: ${isDarkMode ? '#1a1a2e' : '#ffffff'};
            padding: 16px;
            border-radius: 12px;
          }
          .header { 
            text-align: center; 
            border-bottom: 1px dashed ${isDarkMode ? '#475569' : '#94a3b8'}; 
            padding-bottom: 12px; 
            margin-bottom: 12px; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 20px; 
            color: ${isDarkMode ? '#f1f5f9' : '#0f172a'};
          }
          .header .sub {
            font-size: 11px;
            color: ${isDarkMode ? '#94a3b8' : '#64748b'};
            margin-top: 4px;
          }
          .divider { 
            border-top: 1px dashed ${isDarkMode ? '#475569' : '#94a3b8'}; 
            margin: 10px 0; 
          }
          .items { 
            width: 100%; 
            margin: 10px 0; 
            border-collapse: collapse; 
          }
          .items th, .items td { 
            text-align: left; 
            padding: 4px 0; 
            color: ${isDarkMode ? '#e2e8f0' : '#1a1a2e'};
          }
          .items th:last-child, .items td:last-child { 
            text-align: right; 
          }
          .items th {
            font-size: 11px;
            color: ${isDarkMode ? '#94a3b8' : '#64748b'};
            border-bottom: 1px solid ${isDarkMode ? '#475569' : '#e2e8f0'};
          }
          .total-row {
            font-size: 16px;
            font-weight: bold;
            color: ${isDarkMode ? '#4ade80' : '#22c55e'};
          }
          .footer { 
            text-align: center; 
            margin-top: 16px; 
            border-top: 1px dashed ${isDarkMode ? '#475569' : '#94a3b8'}; 
            padding-top: 12px; 
            font-size: 11px; 
            color: ${isDarkMode ? '#94a3b8' : '#64748b'};
          }
          .footer .stars {
            font-size: 16px;
            letter-spacing: 4px;
            color: #f59e0b;
          }
          .label { color: ${isDarkMode ? '#94a3b8' : '#64748b'}; }
          .amount { font-weight: bold; }
          .amount-green { color: ${isDarkMode ? '#4ade80' : '#22c55e'}; }
          .order-info {
            font-size: 11px;
            color: ${isDarkMode ? '#94a3b8' : '#64748b'};
            margin: 2px 0;
          }
          @media print { 
            body { 
              margin: 0; 
              padding: 0; 
              background: white !important;
              color: black !important;
            }
            .receipt {
              background: white !important;
              color: black !important;
            }
            .header h1 { color: black !important; }
            .header .sub { color: #666 !important; }
            .items th, .items td { color: black !important; }
            .items th { color: #666 !important; border-bottom-color: #ccc !important; }
            .total-row { color: #22c55e !important; }
            .footer { color: #666 !important; border-top-color: #ccc !important; }
            .label { color: #666 !important; }
            .amount-green { color: #22c55e !important; }
            .divider { border-top-color: #ccc !important; }
            .order-info { color: #666 !important; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>${restaurantName}</h1>
            <div class="sub">${t2('thank_you')}</div>
            <div style="margin-top: 6px; font-size: 11px; color: ${isDarkMode ? '#94a3b8' : '#64748b'};">
              ${formattedDate} • ${formattedTime}
            </div>
          </div>
          
          <div class="order-info">🧾 ${order.order_number || `ORD-${order.id}`}</div>
          <div class="order-info">👤 ${order.customer_name || 'Guest'}</div>
          <div class="order-info">${order.order_type === 'take_away' ? '🥡 Take Away' : (order.table_number && order.table_number > 0) ? `Table ${order.table_number}` : '🚶 Walk-in'}</div>
          
          <div class="divider"></div>
          
          <table class="items">
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
            </thead>
            <tbody>
              ${order.items?.map(item => `
                <tr>
                  <td style="text-align:left">${item.name}</td>
                  <td style="text-align:center">${item.quantity}</td>
                  <td style="text-align:right">RM ${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          <div style="display:flex;justify-content:space-between;padding:2px 0;">
            <span class="label">Subtotal</span>
            <span class="amount">RM ${subtotal.toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:2px 0;">
            <span class="label">Service Charge (${serviceChargePercent}%)</span>
            <span class="amount">RM ${sc.toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:2px 0;">
            <span class="label">Tax (${taxPercent}%)</span>
            <span class="amount">RM ${tax.toFixed(2)}</span>
          </div>
          
          <div class="divider"></div>
          
          <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:bold;padding:4px 0;">
            <span>TOTAL</span>
            <span class="amount-green">RM ${grandTotal.toFixed(2)}</span>
          </div>
          
          <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:11px;color:${isDarkMode ? '#94a3b8' : '#64748b'};">
            <span>Payment: ${paymentMethod === 'cash' ? '💵 Cash' : paymentMethod === 'tng' ? '📱 TnG' : '🏦 Bank'}</span>
            <span>${order.payment_status === 'paid' ? '✅ Paid' : '⏳ Unpaid'}</span>
          </div>
          
          <div class="footer">
            <div class="stars">⭐ ⭐ ⭐ ⭐ ⭐</div>
            <div style="margin-top:4px;">${restaurantName}</div>
            <div style="font-size:10px;margin-top:2px;">${formattedTime}</div>
          </div>
        </div>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 500);
            }, 300);
          }
        <\/script>
      </body>
      </html>
    `
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    printWindow.document.write(receiptContent)
    printWindow.document.close()
  }

  const printReceipt = (order) => {
    printReceiptDirect(order)
  }

  const printAllReceipts = () => {
    if (tableOrders.length === 0) { toast.error(t2('no_orders')); return }
    tableOrders.forEach(order => printReceipt(order))
    toast.success(t2('btn_print') + '...')
  }

  // ============================================================
  // HELPERS
  // ============================================================
  const getDefaultIcon = (category) => {
    const foundCat = categories.find(c => c.name === category)
    if (foundCat) return foundCat.icon
    switch(category) {
      case 'Makanan': return '🍚'
      case 'Minuman': return '🥤'
      default: return '🍽️'
    }
  }

  // Get categories for filter - include all categories
  const categoryNames = ['All', ...categories.map(cat => cat.name)]

  // Filter menu for display
  const displayMenu = getFilteredDisplayMenu()
  
  // Filter menu by category and search
  const filteredMenu = displayMenu.filter(item => {
    const matchCategory = selectedCategory === 'All' || item.category === selectedCategory
    const matchSearch = item.name.toLowerCase().includes(searchMenu.toLowerCase())
    return matchCategory && matchSearch
  })

  // Filter orders
  const filteredOrders = tableOrders.filter(order => {
    if (!searchOrder) return true
    return order.customer_name?.toLowerCase().includes(searchOrder.toLowerCase()) ||
           order.order_number?.toLowerCase().includes(searchOrder.toLowerCase())
  })

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        background: bgColor 
      }}>
        <div className="spinner"></div>
      </div>
    )
  }

  // ============================================================
  // RENDER - OPTIMIZED FOR 1080p
  // ============================================================
  return (
    <div style={{ 
      padding: '16px 24px', 
      background: bgColor, 
      minHeight: '100vh',
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* ===== HEADER ===== */}
      <div style={{ 
        ...glassEffect, 
        borderRadius: '20px', 
        padding: '12px 24px', 
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        {/* Left: Clock & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
            padding: '8px 20px', 
            borderRadius: '60px',
            boxShadow: '0 4px 20px rgba(37,99,235,0.4)',
            minWidth: '160px',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: 'white', 
              letterSpacing: '2px', 
              fontFamily: 'monospace' 
            }}>
              {formatMalaysiaTime(currentTime)}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)' }}>
              📅 {formatMalaysiaDate(currentTime)}
            </div>
          </div>
          
          <div style={{ 
            background: isOpen ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            padding: '6px 14px',
            borderRadius: '40px',
            border: `1px solid ${isOpen ? '#22c55e' : '#ef4444'}`
          }}>
            <span style={{ 
              color: isOpen ? '#22c55e' : '#ef4444',
              fontSize: '13px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ 
                width: '8px', 
                height: '8px', 
                background: isOpen ? '#22c55e' : '#ef4444', 
                borderRadius: '50%', 
                display: 'inline-block',
                animation: isOpen ? 'pulse 1.5s infinite' : 'none'
              }}></span>
              {isOpen ? t2('open') : t2('closed')} • {businessHoursStart}-{businessHoursEnd}
            </span>
          </div>
        </div>

        {/* Center: Logo */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '14px',
          flex: 1,
          justifyContent: 'center'
        }}>
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={restaurantName} 
              style={{ 
                height: '70px', 
                width: 'auto', 
                maxWidth: '220px',
                objectFit: 'contain',
                borderRadius: '12px',
                filter: darkMode ? 'brightness(0.95)' : 'none'
              }} 
            />
          ) : (
            <div style={{ 
              width: '70px', 
              height: '70px', 
              background: 'linear-gradient(135deg, #f59e0b, #ea580c)', 
              borderRadius: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '36px',
              boxShadow: '0 4px 20px rgba(245,158,11,0.3)'
            }}>
              🏪
            </div>
          )}
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '26px', 
              fontWeight: 'bold', 
              color: textColor,
              letterSpacing: '0.5px'
            }}>
              {restaurantName}
            </h1>
            <p style={{ 
              margin: 0, 
              fontSize: '12px', 
              color: textMuted,
              textAlign: 'center'
            }}>
              {t2('menu_pricing')}
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button 
            onClick={toggleDarkMode} 
            style={{ 
              background: secondaryBg, 
              border: `1px solid ${borderColor}`, 
              borderRadius: '40px', 
              padding: '8px 12px', 
              cursor: 'pointer', 
              fontSize: '18px',
              transition: 'all 0.2s'
            }}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          
          <button 
            onClick={() => setLanguage(language === 'bm' ? 'en' : 'bm')} 
            style={{ 
              background: secondaryBg, 
              border: `1px solid ${borderColor}`, 
              borderRadius: '40px', 
              padding: '8px 14px', 
              cursor: 'pointer', 
              fontSize: '12px', 
              fontWeight: 'bold',
              color: textColor,
              transition: 'all 0.2s'
            }}
          >
            {language === 'bm' ? '🇺🇸 EN' : '🇲🇾 BM'}
          </button>
          
          <button 
            onClick={forceRefreshMenu} 
            disabled={refreshing} 
            style={{ 
              background: '#22c55e', 
              color: 'white', 
              border: 'none', 
              borderRadius: '40px', 
              padding: '8px 14px', 
              cursor: 'pointer',
              transition: 'all 0.2s',
              opacity: refreshing ? 0.6 : 1,
              fontSize: '16px'
            }}
            title="Refresh Menu"
          >
            🔄
          </button>
        </div>
      </div>

      {/* ============================================================
      SPECIAL MENU BANNER
      ============================================================ */}
      {specialMenuEnabled && specialMenuItems.length > 0 && displaySettings.showSpecial && (
        <div style={{ 
          background: 'linear-gradient(135deg, #fef3c7, #fde68a, #fcd34d)',
          borderRadius: '24px', 
          padding: isMobile ? '20px 16px' : '28px 32px', 
          marginBottom: '20px',
          boxShadow: '0 8px 32px rgba(245, 158, 11, 0.25)',
          border: '2px solid #f59e0b',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }} />
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                fontSize: isMobile ? '36px' : '48px',
                animation: 'pulse 2s ease-in-out infinite'
              }}>
                ⭐
              </div>
              <div>
                <div style={{ 
                  fontSize: isMobile ? '20px' : '28px', 
                  fontWeight: 'bold', 
                  color: '#92400e',
                  textShadow: '0 2px 4px rgba(245,158,11,0.2)'
                }}>
                  {specialMenuTitle}
                </div>
                <div style={{ 
                  fontSize: isMobile ? '11px' : '13px', 
                  color: '#78350f',
                  opacity: 0.8
                }}>
                  🌟 {t2('special_today')}
                </div>
              </div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              padding: '6px 20px',
              borderRadius: '30px',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}>
              🔥 {language === 'bm' ? 'ISTIMEWA' : 'SPECIAL'}
            </div>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile 
              ? 'repeat(2, 1fr)' 
              : 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: isMobile ? '12px' : '16px',
            position: 'relative',
            zIndex: 1
          }}>
            {specialMenuItems.slice(0, isMobile ? 6 : 8).map((item, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: '16px', 
                  padding: isMobile ? '12px 14px' : '16px 20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(255,255,255,0.9)',
                  transition: 'all 0.3s ease',
                  cursor: 'default'
                }}
              >
                <div style={{ flexShrink: 0 }}>
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.name} 
                      style={{ 
                        width: isMobile ? '48px' : '60px', 
                        height: isMobile ? '48px' : '60px', 
                        borderRadius: '12px', 
                        objectFit: 'cover',
                        border: '2px solid #f59e0b'
                      }} 
                    />
                  ) : (
                    <div style={{ 
                      width: isMobile ? '48px' : '60px', 
                      height: isMobile ? '48px' : '60px', 
                      background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: isMobile ? '24px' : '30px',
                      border: '2px solid #f59e0b'
                    }}>
                      ⭐
                    </div>
                  )}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: isMobile ? '13px' : '15px', 
                    color: '#1e293b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.name}
                  </div>
                  {item.description && (
                    <div style={{ 
                      fontSize: isMobile ? '9px' : '11px', 
                      color: '#64748b', 
                      fontStyle: 'italic',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      📝 {item.description}
                    </div>
                  )}
                </div>
                
                <div style={{ 
                  flexShrink: 0,
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: 'white',
                  padding: isMobile ? '4px 12px' : '6px 16px',
                  borderRadius: '30px',
                  fontWeight: 'bold',
                  fontSize: isMobile ? '13px' : '16px',
                  boxShadow: '0 2px 8px rgba(34,197,94,0.3)'
                }}>
                  RM {item.price}
                </div>
              </div>
            ))}
          </div>
          
          {specialMenuItems.length > (isMobile ? 6 : 8) && (
            <div style={{ 
              textAlign: 'center', 
              marginTop: '12px',
              color: '#78350f',
              fontSize: isMobile ? '11px' : '13px',
              opacity: 0.7,
              position: 'relative',
              zIndex: 1
            }}>
              + {specialMenuItems.length - (isMobile ? 6 : 8)} {language === 'bm' ? 'lagi item istimewa' : 'more special items'} 🎉
            </div>
          )}
        </div>
      )}

      {/* ============================================================
      DISPLAY TOGGLE CONTROLS - NEW
      ============================================================ */}
      <div style={{ 
        ...glassEffect, 
        borderRadius: '16px', 
        padding: isMobile ? '10px 14px' : '12px 20px', 
        marginBottom: '16px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <span style={{ 
          color: textColor, 
          fontWeight: 'bold', 
          fontSize: isMobile ? '12px' : '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          ⚙️ {t2('display_settings')}
        </span>
        
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? '8px' : '16px', 
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            color: textColor,
            fontSize: isMobile ? '11px' : '13px'
          }}>
            <input
              type="checkbox"
              checked={displaySettings.showFood}
              onChange={() => toggleDisplay('showFood')}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            {t2('show_food')}
          </label>
          
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            color: textColor,
            fontSize: isMobile ? '11px' : '13px'
          }}>
            <input
              type="checkbox"
              checked={displaySettings.showDrinks}
              onChange={() => toggleDisplay('showDrinks')}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            {t2('show_drinks')}
          </label>
          
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            color: textColor,
            fontSize: isMobile ? '11px' : '13px'
          }}>
            <input
              type="checkbox"
              checked={displaySettings.showSpecial}
              onChange={() => toggleDisplay('showSpecial')}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            {t2('show_special')}
          </label>
          
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            color: textColor,
            fontSize: isMobile ? '11px' : '13px'
          }}>
            <input
              type="checkbox"
              checked={displaySettings.showPromos}
              onChange={() => toggleDisplay('showPromos')}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            {t2('show_promos')}
          </label>
          
          <span style={{
            fontSize: isMobile ? '10px' : '12px',
            color: textMuted,
            padding: '4px 12px',
            background: secondaryBg,
            borderRadius: '20px'
          }}>
            {t2('showing_items')} {filteredMenu.length} {t2('of_items')} {displayMenu.length} {t2('items_count')}
          </span>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* Category Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          overflowX: 'auto', 
          paddingBottom: '10px',
          marginBottom: '12px',
          scrollbarWidth: 'thin',
          flexShrink: 0
        }}>
          {categoryNames.map(cat => (
            <button 
              key={cat} 
              onClick={() => setSelectedCategory(cat)} 
              style={{ 
                padding: '8px 20px', 
                background: selectedCategory === cat ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : 'transparent', 
                color: selectedCategory === cat ? 'white' : textColor, 
                border: selectedCategory === cat ? 'none' : `1px solid ${borderColor}`, 
                borderRadius: '40px', 
                cursor: 'pointer', 
                fontWeight: selectedCategory === cat ? 'bold' : '500', 
                fontSize: '13px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
            >
              {cat === 'All' ? `🍽️ ${t2('all')}` : `${getDefaultIcon(cat)} ${cat}`}
            </button>
          ))}
        </div>

        {/* Menu Grid - Scrollable */}
        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          paddingRight: '4px'
        }}>
          {filteredMenu.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: isMobile ? '40px 20px' : '80px 20px', 
              ...glassEffect, 
              borderRadius: '24px' 
            }}>
              <span style={{ fontSize: isMobile ? '48px' : '64px', opacity: 0.5 }}>📭</span>
              <p style={{ color: textMuted, marginTop: '12px', fontSize: isMobile ? '14px' : '16px' }}>
                {t2('no_items_to_display')}
              </p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
              gap: '14px'
            }}>
              {filteredMenu.map(item => {
                const hasImage = item.image_url && item.image_url.trim() !== ''
                return (
                  <div 
                    key={item.id} 
                    style={{ 
                      background: cardBg,
                      borderRadius: '16px',
                      padding: '14px',
                      textAlign: 'center',
                      border: `1px solid ${borderColor}`,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      cursor: 'default'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = darkMode 
                        ? '0 8px 32px rgba(0,0,0,0.4)' 
                        : '0 8px 32px rgba(0,0,0,0.1)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    {hasImage ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        style={{ 
                          width: '70px', 
                          height: '70px', 
                          objectFit: 'cover', 
                          borderRadius: '14px', 
                          margin: '0 auto 10px auto',
                          display: 'block'
                        }}
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    ) : (
                      <div style={{ fontSize: '40px', marginBottom: '6px' }}>{getDefaultIcon(item.category)}</div>
                    )}
                    <div style={{ 
                      fontWeight: 'bold', 
                      fontSize: '14px', 
                      color: textColor, 
                      marginBottom: '6px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.name}
                    </div>
                    <div style={{ 
                      color: darkMode ? '#4ade80' : '#22c55e', 
                      fontWeight: 'bold', 
                      fontSize: '18px',
                      background: secondaryBg,
                      display: 'inline-block',
                      padding: '2px 14px',
                      borderRadius: '30px'
                    }}>
                      RM {item.price}
                    </div>
                    {item.description && (
                      <div style={{ 
                        fontSize: '10px', 
                        color: textMuted, 
                        fontStyle: 'italic',
                        marginTop: '6px',
                        background: secondaryBg,
                        padding: '3px 8px',
                        borderRadius: '6px'
                      }}>
                        📝 {item.description}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== BILLING BUTTON ===== */}
      <button 
        onClick={() => setShowBillingModal(true)} 
        style={{ 
          position: 'fixed', 
          bottom: '24px', 
          right: '24px', 
          width: '64px', 
          height: '64px', 
          borderRadius: '32px', 
          background: 'linear-gradient(135deg, #f59e0b, #ea580c)', 
          color: 'white', 
          border: 'none', 
          fontSize: '28px', 
          cursor: 'pointer', 
          boxShadow: '0 8px 30px rgba(245,158,11,0.5)', 
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        💰
      </button>

      {/* ===== BILLING MODAL ===== */}
      {showBillingModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', 
          display: 'flex', justifyContent: 'center', alignItems: 'center', 
          zIndex: 2000, animation: 'fadeIn 0.25s ease' 
        }}>
          <div style={{ 
            background: modalBg, borderRadius: '28px', padding: '24px', 
            maxWidth: '900px', width: '92%', maxHeight: '85vh', 
            overflowY: 'auto', 
            ...glassEffect, animation: 'popIn 0.3s ease' 
          }}>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px' 
            }}>
              <h2 style={{ 
                fontSize: '22px', 
                color: textColor, 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                💰 {t2('billing')}
              </h2>
              <button 
                onClick={() => { setShowBillingModal(false); setSelectedTable(null); }} 
                style={{ 
                  background: '#ef4444', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '40px', 
                  padding: '8px 20px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.96)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {t2('close')}
              </button>
            </div>

            {/* Order Type Filters */}
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              marginBottom: '20px', 
              flexWrap: 'wrap' 
            }}>
              <button 
                onClick={showTakeawayOrders} 
                style={{ 
                  padding: '8px 20px', 
                  background: selectedTable === 'takeaway' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : secondaryBg, 
                  color: selectedTable === 'takeaway' ? 'white' : textColor, 
                  border: `1px solid ${borderColor}`, 
                  borderRadius: '40px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
              >
                🥡 {t2('take_away')}
              </button>
              <button 
                onClick={showAllOrders} 
                style={{ 
                  padding: '8px 20px', 
                  background: selectedTable === 'all' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : secondaryBg, 
                  color: selectedTable === 'all' ? 'white' : textColor, 
                  border: `1px solid ${borderColor}`, 
                  borderRadius: '40px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
              >
                📋 {t2('all_orders')}
              </button>
            </div>

            {/* Table Selection Grid */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '10px', 
                color: textMuted, 
                fontSize: '13px' 
              }}>
                {t2('select_table')}:
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', 
                gap: '8px' 
              }}>
                {tables.slice(0, 23).map(table => (
                  <button 
                    key={table.table_number} 
                    onClick={() => selectTable(table.table_number)} 
                    style={{ 
                      padding: '10px 0', 
                      background: selectedTable === table.table_number ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : secondaryBg, 
                      color: selectedTable === table.table_number ? 'white' : textColor, 
                      border: `1px solid ${borderColor}`, 
                      borderRadius: '10px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold',
                      transition: 'all 0.2s'
                    }}
                  >
                    {table.table_number}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            {selectedTable && (
              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '14px', 
                  paddingBottom: '10px', 
                  borderBottom: `2px solid ${borderColor}` 
                }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    margin: 0, 
                    color: textColor, 
                    fontWeight: 'bold' 
                  }}>
                    {selectedTable === 'takeaway' ? `🥡 ${t2('take_away')}` : 
                     selectedTable === 'all' ? `🧾 ${t2('all_orders')}` : 
                     `🧾 ${t2('table_number')} ${selectedTable}`}
                  </h3>
                  {tableOrders.length > 0 && (
                    <button 
                      onClick={printAllReceipts} 
                      style={{ 
                        background: '#0ea5e9', 
                        color: 'white', 
                        padding: '6px 16px', 
                        border: 'none', 
                        borderRadius: '30px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold', 
                        fontSize: '11px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.96)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      🖨️ {t2('print_all')}
                    </button>
                  )}
                </div>

                {/* Search Orders */}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <span style={{ 
                    position: 'absolute', 
                    left: '14px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    fontSize: '13px', 
                    color: textMuted 
                  }}>
                    🔍
                  </span>
                  <input 
                    type="text" 
                    placeholder={t2('find_order')} 
                    value={searchOrder} 
                    onChange={(e) => setSearchOrder(e.target.value)} 
                    style={{ 
                      width: '100%', 
                      padding: '10px 16px 10px 40px', 
                      borderRadius: '40px', 
                      border: `1px solid ${borderColor}`, 
                      background: inputBg, 
                      color: textColor, 
                      outline: 'none', 
                      fontSize: '13px' 
                    }} 
                  />
                </div>

                {/* Orders */}
                {filteredOrders.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px 20px', 
                    ...glassEffect, 
                    borderRadius: '20px' 
                  }}>
                    <span style={{ fontSize: '40px', opacity: 0.5 }}>📋</span>
                    <p style={{ color: textMuted, marginTop: '8px' }}>{t2('no_orders')}</p>
                  </div>
                ) : (
                  filteredOrders.map(order => {
                    const subtotal = order.subtotal || order.total
                    const sc = order.service_charge || (subtotal * (serviceChargePercent / 100))
                    const tax = order.tax || (subtotal * (taxPercent / 100))
                    const grandTotal = order.grand_total || (subtotal + sc + tax)
                    return (
                      <div key={order.id} style={{ 
                        ...glassEffect, 
                        borderRadius: '18px', 
                        marginBottom: '14px', 
                        overflow: 'hidden' 
                      }}>
                        <div style={{ 
                          padding: '12px 18px', 
                          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
                          color: 'white', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          flexWrap: 'wrap', 
                          gap: '6px' 
                        }}>
                          <div>
                            <span style={{ fontSize: '18px', marginRight: '6px' }}>
                              {order.order_type === 'take_away' ? '🥡' : '🍽️'}
                            </span>
                            <strong>{order.customer_name || 'Guest'}</strong>
                            <span style={{ fontSize: '12px', opacity: 0.85, marginLeft: '6px' }}>
                              - {order.order_type === 'take_away' ? t2('take_away') : `${t2('table_number')} ${order.table_number}`}
                            </span>
                          </div>
                          <div style={{ fontSize: '10px', opacity: 0.85 }}>
                            🕐 {formatOrderTime(order.created_at)}
                          </div>
                        </div>
                        <div style={{ padding: '12px 18px' }}>
                          {order.items?.map((item, idx) => (
                            <div key={idx} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              padding: '6px 0', 
                              borderBottom: idx !== order.items.length - 1 ? `1px solid ${borderColor}` : 'none' 
                            }}>
                              <span style={{ color: textColor, fontSize: '13px' }}>
                                {item.name} x{item.quantity}
                              </span>
                              <span style={{ 
                                color: darkMode ? '#4ade80' : '#22c55e', 
                                fontWeight: 'bold', 
                                fontSize: '13px' 
                              }}>
                                RM {(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div style={{ 
                          padding: '10px 18px', 
                          background: secondaryBg, 
                          borderTop: `1px solid ${borderColor}`, 
                          borderBottom: `1px solid ${borderColor}` 
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontSize: '12px', 
                            marginBottom: '2px' 
                          }}>
                            <span>{t2('subtotal')}:</span>
                            <span>RM {subtotal.toFixed(2)}</span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontSize: '12px', 
                            marginBottom: '2px' 
                          }}>
                            <span>{t2('service_charge')} ({serviceChargePercent}%):</span>
                            <span>RM {sc.toFixed(2)}</span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontSize: '12px', 
                            marginBottom: '2px' 
                          }}>
                            <span>{t2('tax')} ({taxPercent}%):</span>
                            <span>RM {tax.toFixed(2)}</span>
                          </div>
                          <div style={{ 
                            borderTop: `1px solid ${borderColor}`, 
                            marginTop: '6px', 
                            paddingTop: '6px', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontWeight: 'bold', 
                            fontSize: '16px' 
                          }}>
                            <span>{t2('total')}:</span>
                            <span style={{ color: '#22c55e' }}>RM {grandTotal.toFixed(2)}</span>
                          </div>
                        </div>
                        <div style={{ 
                          padding: '10px 18px', 
                          display: 'flex', 
                          gap: '10px', 
                          justifyContent: 'flex-end' 
                        }}>
                          <button 
                            onClick={() => printReceipt(order)} 
                            style={{ 
                              background: '#0ea5e9', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '30px', 
                              padding: '6px 20px', 
                              cursor: 'pointer', 
                              fontWeight: 'bold', 
                              fontSize: '12px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.96)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            🖨️ {t2('btn_print')}
                          </button>
                          <button 
                            onClick={() => { setSelectedOrder(order); setShowPaymentModal(true) }} 
                            style={{ 
                              background: '#22c55e', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '30px', 
                              padding: '6px 24px', 
                              cursor: 'pointer', 
                              fontWeight: 'bold', 
                              fontSize: '12px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.96)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            💰 {t2('btn_pay')}
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== PAYMENT MODAL ===== */}
      {showPaymentModal && selectedOrder && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', 
          display: 'flex', justifyContent: 'center', alignItems: 'center', 
          zIndex: 3000, animation: 'fadeIn 0.25s ease' 
        }}>
          <div style={{ 
            background: modalBg, borderRadius: '28px', padding: '28px', 
            maxWidth: '380px', width: '90%', ...glassEffect, animation: 'popIn 0.3s ease' 
          }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ 
                width: '56px', height: '56px', 
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
                borderRadius: '28px', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', 
                margin: '0 auto 10px auto' 
              }}>
                <span style={{ fontSize: '26px' }}>💰</span>
              </div>
              <h2 style={{ 
                fontSize: '20px', 
                color: textColor, 
                fontWeight: 'bold' 
              }}>
                {t2('record_payment')}
              </h2>
            </div>
            
            {(() => {
              const subtotal = selectedOrder.subtotal || selectedOrder.total
              const sc = selectedOrder.service_charge || (subtotal * (serviceChargePercent / 100))
              const tax = selectedOrder.tax || (subtotal * (taxPercent / 100))
              const grandTotal = selectedOrder.grand_total || (subtotal + sc + tax)
              return (
                <>
                  <div style={{ 
                    background: secondaryBg, 
                    padding: '16px', 
                    borderRadius: '16px', 
                    margin: '12px 0' 
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: '6px', 
                      fontSize: '12px' 
                    }}>
                      <span>{t2('subtotal')}:</span>
                      <span>RM {subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: '6px', 
                      fontSize: '12px' 
                    }}>
                      <span>{t2('service_charge')} ({serviceChargePercent}%):</span>
                      <span>RM {sc.toFixed(2)}</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: '6px', 
                      fontSize: '12px' 
                    }}>
                      <span>{t2('tax')} ({taxPercent}%):</span>
                      <span>RM {tax.toFixed(2)}</span>
                    </div>
                    <div style={{ 
                      borderTop: `1px solid ${borderColor}`, 
                      marginTop: '10px', 
                      paddingTop: '10px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontWeight: 'bold', 
                      fontSize: '18px' 
                    }}>
                      <span>{t2('total')}:</span>
                      <span style={{ color: '#22c55e' }}>RM {grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: 'bold', 
                      color: textColor, 
                      fontSize: '12px' 
                    }}>
                      {t2('payment_method')}:
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {['cash', 'tng', 'bank'].map(method => (
                        <button 
                          key={method} 
                          onClick={() => setPaymentMethod(method)} 
                          style={{ 
                            flex: 1, 
                            padding: '10px', 
                            background: paymentMethod === method ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : secondaryBg, 
                            color: paymentMethod === method ? 'white' : textColor, 
                            border: `1px solid ${borderColor}`, 
                            borderRadius: '14px', 
                            cursor: 'pointer', 
                            fontWeight: 'bold', 
                            fontSize: '12px',
                            transition: 'all 0.2s'
                          }}
                        >
                          {method === 'cash' ? '💵 ' + t2('cash') : 
                           method === 'tng' ? '📱 ' + t2('tng') : 
                           '🏦 ' + t2('bank')}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )
            })()}
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => markAsPaid(selectedOrder)} 
                style={{ 
                  flex: 1, 
                  background: '#22c55e', 
                  color: 'white', 
                  padding: '12px', 
                  border: 'none', 
                  borderRadius: '50px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.96)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                ✅ {t2('btn_save')}
              </button>
              <button 
                onClick={() => { setShowPaymentModal(false); setSelectedOrder(null) }} 
                style={{ 
                  flex: 1, 
                  background: '#ef4444', 
                  color: 'white', 
                  padding: '12px', 
                  border: 'none', 
                  borderRadius: '50px', 
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.96)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                ❌ {t2('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ===== STYLES ===== */}
      <style>
        {`
          .spinner { 
            width: 48px; 
            height: 48px; 
            border: 4px solid rgba(59,130,246,0.15); 
            border-top-color: #3b82f6; 
            border-radius: 50%; 
            animation: spin 1s linear infinite; 
            margin: 0 auto; 
          }
          
          @keyframes spin { 
            to { transform: rotate(360deg); } 
          }
          
          @keyframes fadeIn { 
            from { opacity: 0; } 
            to { opacity: 1; } 
          }
          
          @keyframes popIn { 
            0% { opacity: 0; transform: scale(0.95) translateY(10px); } 
            100% { opacity: 1; transform: scale(1) translateY(0); } 
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
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
          
          button, input { 
            transition: all 0.2s ease; 
          }
          
          input:focus { 
            outline: none; 
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
          }
        `}
      </style>
    </div>
  )
}

export default CustomerDisplay