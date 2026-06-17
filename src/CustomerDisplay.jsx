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
  const { language, setLanguage, t } = useLanguage()
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
  
  // Business hours
  const [businessHoursStart, setBusinessHoursStart] = useState('09:00')
  const [businessHoursEnd, setBusinessHoursEnd] = useState('22:00')
  const [isOpen, setIsOpen] = useState(true)
  
  // Current time
  const [currentTime, setCurrentTime] = useState(new Date())

  // Modern theme colors
  const bgColor = darkMode ? '#0f0f1a' : '#f8fafc'
  const cardBg = darkMode ? 'rgba(30, 30, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  const textColor = darkMode ? '#f1f5f9' : '#0f172a'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.6)'
  const modalBg = darkMode ? 'rgba(30, 30, 46, 0.98)' : 'rgba(255, 255, 255, 0.98)'
  const secondaryBg = darkMode ? 'rgba(30, 30, 46, 0.8)' : 'rgba(248, 250, 252, 0.9)'
  const inputBg = darkMode ? '#1e1e2e' : '#ffffff'
  
  const glassEffect = {
    background: cardBg,
    backdropFilter: 'blur(12px)',
    border: `1px solid ${borderColor}`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
  }

  // Check business hours
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

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      checkBusinessHours()
    }, 1000)
    return () => clearInterval(timer)
  }, [businessHoursStart, businessHoursEnd])

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
      toast.error(t('error_updating') + ': ' + error.message)
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
    toast.success(`✅ ${t('payment_received')} RM ${grandTotal.toFixed(2)}!`)
    
    // === AUTO PRINT AFTER PAYMENT ===
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
    
    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Resit - ${restaurantName}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; background: white; }
          .receipt { max-width: 300px; margin: 0 auto; font-size: 12px; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .header h1 { margin: 0; font-size: 18px; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .items { width: 100%; margin: 10px 0; border-collapse: collapse; }
          .items th, .items td { text-align: left; padding: 3px 0; }
          .items th:last-child, .items td:last-child { text-align: right; }
          .footer { text-align: center; margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; font-size: 10px; }
          @media print { body { margin: 0; padding: 0; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>${restaurantName}</h1>
            <p>Order No: ${order.order_number || `ORD-${order.id}`}</p>
            <p>${order.customer_name || 'Guest'}</p>
            <p>${order.order_type === 'take_away' ? '🥡 Take Away' : (order.table_number && order.table_number > 0) ? `Table ${order.table_number}` : '🚶 Walk-in'}</p>
            <p>${formattedDate}</p>
            <p>🕐 ${formattedTime}</p>
          </div>
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
          <div>Subtotal: RM ${subtotal.toFixed(2)}</div>
          <div>Service Charge (${serviceChargePercent}%): RM ${sc.toFixed(2)}</div>
          <div>Tax (${taxPercent}%): RM ${tax.toFixed(2)}</div>
          <div class="divider"></div>
          <div><strong>TOTAL: RM ${grandTotal.toFixed(2)}</strong></div>
          <div class="footer">
            <p>${t('thank_you')}</p>
            <p>⭐ ⭐ ⭐ ⭐ ⭐</p>
            <p style="font-size: 10px; margin-top: 5px;">${restaurantName}</p>
          </div>
        </div>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 500);
            }, 500);
          }
        <\/script>
      </body>
      </html>
    `
    const printWindow = window.open('', '_blank')
    printWindow.document.write(receiptContent)
    printWindow.document.close()
  }

  const printReceipt = (order) => {
    printReceiptDirect(order)
  }

  const printAllReceipts = () => {
    if (tableOrders.length === 0) { toast.error(t('no_orders')); return }
    tableOrders.forEach(order => printReceipt(order))
    toast.success(t('btn_print') + '...')
  }

  const getDefaultIcon = (category) => {
    const foundCat = categories.find(c => c.name === category)
    if (foundCat) return foundCat.icon
    switch(category) {
      case 'Makanan': return '🍚'
      case 'Minuman': return '🥤'
      default: return '🍽️'
    }
  }

  // Filter categories - exclude drinks
  const categoryNames = ['All', ...categories.filter(cat => cat.name !== 'Minuman').map(cat => cat.name)]

  // Filter menu - exclude drinks
  const filteredMenu = menu.filter(item => {
    if (item.category === 'Minuman') return false
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: bgColor }}>
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', background: bgColor, minHeight: '100vh' }}>
      
      {/* HEADER */}
      <div style={{ 
        ...glassEffect, 
        borderRadius: '24px', 
        padding: '16px 24px', 
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {logoUrl ? (
            <img src={logoUrl} alt={restaurantName} style={{ width: '60px', height: '60px', borderRadius: '16px', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🏪</div>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: textColor }}>{restaurantName}</h1>
            <p style={{ margin: 0, fontSize: '12px', color: textMuted }}>Menu & Pricing</p>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
            padding: '8px 24px', 
            borderRadius: '60px',
            boxShadow: '0 4px 15px rgba(37,99,235,0.3)'
          }}>
            <div style={{ fontSize: '42px', fontWeight: 'bold', color: 'white', letterSpacing: '2px', fontFamily: 'monospace' }}>
              {formatMalaysiaTime(currentTime)}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>
              📅 {formatMalaysiaDate(currentTime)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            background: isOpen ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            padding: '8px 16px',
            borderRadius: '40px',
            border: `1px solid ${isOpen ? '#22c55e' : '#ef4444'}`
          }}>
            <span style={{ 
              color: isOpen ? '#22c55e' : '#ef4444',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ width: '10px', height: '10px', background: isOpen ? '#22c55e' : '#ef4444', borderRadius: '50%', display: 'inline-block' }}></span>
              {isOpen ? 'OPEN' : 'CLOSED'} • {businessHoursStart}-{businessHoursEnd}
            </span>
          </div>
          
          <button onClick={toggleDarkMode} style={{ background: secondaryBg, border: `1px solid ${borderColor}`, borderRadius: '40px', padding: '8px 14px', cursor: 'pointer', fontSize: '18px' }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          
          <button onClick={() => setLanguage(language === 'bm' ? 'en' : 'bm')} style={{ background: secondaryBg, border: `1px solid ${borderColor}`, borderRadius: '40px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
            {language === 'bm' ? '🇺🇸 EN' : '🇲🇾 BM'}
          </button>
          
          <button onClick={forceRefreshMenu} disabled={refreshing} style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: '40px', padding: '8px 14px', cursor: 'pointer' }}>
            🔄
          </button>
        </div>
      </div>

      {/* SPECIAL MENU Banner */}
      {specialMenuEnabled && specialMenuItems.length > 0 && (
        <div style={{ 
          background: 'linear-gradient(135deg, #fef9c3, #fde047)', 
          borderRadius: '20px', 
          padding: '16px 20px', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>⭐</span>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#854d0e' }}>{specialMenuTitle}</div>
              <div style={{ fontSize: '12px', color: '#713f12' }}>Menu Istimewa Hari Ini</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {specialMenuItems.slice(0, 6).map((item, idx) => (
              <div key={idx} style={{ background: 'white', borderRadius: '40px', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: '28px', height: '28px', borderRadius: '8px' }} /> : <span>⭐</span>}
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.name}</span>
                <span style={{ color: '#16a34a', fontWeight: 'bold', background: '#dcfce7', padding: '2px 10px', borderRadius: '20px', fontSize: '13px' }}>RM {item.price}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORY TABS */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        overflowX: 'auto', 
        paddingBottom: '12px',
        marginBottom: '20px',
        scrollbarWidth: 'thin'
      }}>
        {categoryNames.map(cat => (
          <button 
            key={cat} 
            onClick={() => setSelectedCategory(cat)} 
            style={{ 
              padding: '10px 24px', 
              background: selectedCategory === cat ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : 'transparent', 
              color: selectedCategory === cat ? 'white' : textColor, 
              border: selectedCategory === cat ? 'none' : `1px solid ${borderColor}`, 
              borderRadius: '40px', 
              cursor: 'pointer', 
              fontWeight: selectedCategory === cat ? 'bold' : '500', 
              fontSize: '14px',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {cat === 'All' ? `🍽️ Semua` : `${getDefaultIcon(cat)} ${cat}`}
          </button>
        ))}
      </div>

      {/* MENU GRID */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
        gap: '16px',
        marginBottom: '20px'
      }}>
        {filteredMenu.map(item => {
          const hasImage = item.image_url && item.image_url.trim() !== ''
          return (
            <div 
              key={item.id} 
              style={{ 
                background: cardBg,
                borderRadius: '20px',
                padding: '16px',
                textAlign: 'center',
                border: `1px solid ${borderColor}`,
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              {hasImage ? (
                <img 
                  src={item.image_url} 
                  alt={item.name} 
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    objectFit: 'cover', 
                    borderRadius: '16px', 
                    margin: '0 auto 12px auto',
                    display: 'block'
                  }}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ) : (
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>{getDefaultIcon(item.category)}</div>
              )}
              <div style={{ fontWeight: 'bold', fontSize: '15px', color: textColor, marginBottom: '8px' }}>{item.name}</div>
              <div style={{ 
                color: darkMode ? '#4ade80' : '#22c55e', 
                fontWeight: 'bold', 
                fontSize: '22px',
                background: secondaryBg,
                display: 'inline-block',
                padding: '4px 16px',
                borderRadius: '30px'
              }}>
                RM {item.price}
              </div>
            </div>
          )
        })}
      </div>

      {/* Billing Button */}
      <button 
        onClick={() => setShowBillingModal(true)} 
        style={{ 
          position: 'fixed', 
          bottom: '24px', 
          right: '24px', 
          width: '70px', 
          height: '70px', 
          borderRadius: '35px', 
          background: 'linear-gradient(135deg, #f59e0b, #ea580c)', 
          color: 'white', 
          border: 'none', 
          fontSize: '32px', 
          cursor: 'pointer', 
          boxShadow: '0 8px 24px rgba(245,158,11,0.5)', 
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        💰
      </button>

      {/* Billing Modal */}
      {showBillingModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', 
          display: 'flex', justifyContent: 'center', alignItems: 'center', 
          zIndex: 2000, animation: 'fadeIn 0.2s ease' 
        }}>
          <div style={{ 
            background: modalBg, borderRadius: '32px', padding: '28px', 
            maxWidth: '900px', width: '90%', maxHeight: '85vh', overflowY: 'auto', 
            ...glassEffect, animation: 'popIn 0.3s ease' 
          }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', color: textColor, fontWeight: 'bold' }}>💰 {t('billing')}</h2>
              <button 
                onClick={() => { setShowBillingModal(false); setSelectedTable(null); }} 
                style={{ 
                  background: '#ef4444', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '40px', 
                  padding: '10px 24px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold'
                }}
              >
                {t('close')}
              </button>
            </div>

            {/* Order Type Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <button 
                onClick={showTakeawayOrders} 
                style={{ 
                  padding: '10px 24px', 
                  background: selectedTable === 'takeaway' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : secondaryBg, 
                  color: selectedTable === 'takeaway' ? 'white' : textColor, 
                  border: `1px solid ${borderColor}`, 
                  borderRadius: '40px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold'
                }}
              >
                🥡 {t('take_away')}
              </button>
              <button 
                onClick={showAllOrders} 
                style={{ 
                  padding: '10px 24px', 
                  background: selectedTable === 'all' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : secondaryBg, 
                  color: selectedTable === 'all' ? 'white' : textColor, 
                  border: `1px solid ${borderColor}`, 
                  borderRadius: '40px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold'
                }}
              >
                📋 {t('all_orders')}
              </button>
            </div>

            {/* Table Selection Grid */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '12px', color: textMuted, fontSize: '14px' }}>{t('select_table')}:</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '10px' }}>
                {tables.slice(0, 23).map(table => (
                  <button 
                    key={table.table_number} 
                    onClick={() => selectTable(table.table_number)} 
                    style={{ 
                      padding: '12px 0', 
                      background: selectedTable === table.table_number ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : secondaryBg, 
                      color: selectedTable === table.table_number ? 'white' : textColor, 
                      border: `1px solid ${borderColor}`, 
                      borderRadius: '12px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold'
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: `2px solid ${borderColor}` }}>
                  <h3 style={{ fontSize: '18px', margin: 0, color: textColor, fontWeight: 'bold' }}>
                    {selectedTable === 'takeaway' ? `🥡 ${t('take_away')}` : selectedTable === 'all' ? `🧾 ${t('all_orders')}` : `🧾 ${t('table_number')} ${selectedTable}`}
                  </h3>
                  {tableOrders.length > 0 && (
                    <button 
                      onClick={printAllReceipts} 
                      style={{ 
                        background: '#0ea5e9', 
                        color: 'white', 
                        padding: '8px 20px', 
                        border: 'none', 
                        borderRadius: '30px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold', 
                        fontSize: '12px'
                      }}
                    >
                      🖨️ {t('print_all')}
                    </button>
                  )}
                </div>

                {/* Search Orders */}
                <div style={{ position: 'relative', marginBottom: '20px' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: textMuted }}>🔍</span>
                  <input 
                    type="text" 
                    placeholder={t('find_order')} 
                    value={searchOrder} 
                    onChange={(e) => setSearchOrder(e.target.value)} 
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px 12px 44px', 
                      borderRadius: '40px', 
                      border: `1px solid ${borderColor}`, 
                      background: inputBg, 
                      color: textColor, 
                      outline: 'none', 
                      fontSize: '14px' 
                    }} 
                  />
                </div>

                {/* Orders */}
                {filteredOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', ...glassEffect, borderRadius: '20px' }}>
                    <span style={{ fontSize: '48px', opacity: 0.5 }}>📋</span>
                    <p style={{ color: textMuted, marginTop: '12px' }}>{t('no_orders')}</p>
                  </div>
                ) : (
                  filteredOrders.map(order => {
                    const subtotal = order.subtotal || order.total
                    const sc = order.service_charge || (subtotal * (serviceChargePercent / 100))
                    const tax = order.tax || (subtotal * (taxPercent / 100))
                    const grandTotal = order.grand_total || (subtotal + sc + tax)
                    return (
                      <div key={order.id} style={{ ...glassEffect, borderRadius: '20px', marginBottom: '16px', overflow: 'hidden' }}>
                        <div style={{ 
                          padding: '16px 20px', 
                          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
                          color: 'white', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          flexWrap: 'wrap', 
                          gap: '8px' 
                        }}>
                          <div>
                            <span style={{ fontSize: '20px', marginRight: '8px' }}>{order.order_type === 'take_away' ? '🥡' : '🍽️'}</span>
                            <strong>{order.customer_name || 'Guest'}</strong> - {order.order_type === 'take_away' ? t('take_away') : `${t('table_number')} ${order.table_number}`}
                          </div>
                          <div style={{ fontSize: '11px', opacity: 0.9 }}>🕐 {formatOrderTime(order.created_at)}</div>
                        </div>
                        <div style={{ padding: '16px 20px' }}>
                          {order.items?.map((item, idx) => (
                            <div key={idx} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              padding: '8px 0', 
                              borderBottom: idx !== order.items.length - 1 ? `1px solid ${borderColor}` : 'none' 
                            }}>
                              <span style={{ color: textColor, fontSize: '14px' }}>{item.name} x{item.quantity}</span>
                              <span style={{ color: darkMode ? '#4ade80' : '#22c55e', fontWeight: 'bold', fontSize: '14px' }}>RM {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ padding: '12px 20px', background: secondaryBg, borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}><span>{t('subtotal')}:</span><span>RM {subtotal.toFixed(2)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}><span>{t('service_charge')} ({serviceChargePercent}%):</span><span>RM {sc.toFixed(2)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}><span>{t('tax')} ({taxPercent}%):</span><span>RM {tax.toFixed(2)}</span></div>
                          <div style={{ borderTop: `1px solid ${borderColor}`, marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px' }}>
                            <span>{t('total')}:</span><span style={{ color: '#22c55e' }}>RM {grandTotal.toFixed(2)}</span>
                          </div>
                        </div>
                        <div style={{ padding: '12px 20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => printReceipt(order)} 
                            style={{ 
                              background: '#0ea5e9', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '30px', 
                              padding: '8px 24px', 
                              cursor: 'pointer', 
                              fontWeight: 'bold', 
                              fontSize: '13px'
                            }}
                          >
                            🖨️ {t('btn_print')}
                          </button>
                          <button 
                            onClick={() => { setSelectedOrder(order); setShowPaymentModal(true) }} 
                            style={{ 
                              background: '#22c55e', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '30px', 
                              padding: '8px 28px', 
                              cursor: 'pointer', 
                              fontWeight: 'bold', 
                              fontSize: '13px'
                            }}
                          >
                            💰 {t('btn_pay')}
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

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', 
          display: 'flex', justifyContent: 'center', alignItems: 'center', 
          zIndex: 3000, animation: 'fadeIn 0.2s ease' 
        }}>
          <div style={{ 
            background: modalBg, borderRadius: '32px', padding: '32px', 
            maxWidth: '400px', width: '90%', ...glassEffect, animation: 'popIn 0.3s ease' 
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ 
                width: '60px', height: '60px', 
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
                borderRadius: '30px', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', 
                margin: '0 auto 12px auto' 
              }}>
                <span style={{ fontSize: '28px' }}>💰</span>
              </div>
              <h2 style={{ fontSize: '22px', color: textColor, fontWeight: 'bold' }}>{t('record_payment')}</h2>
            </div>
            
            {(() => {
              const subtotal = selectedOrder.subtotal || selectedOrder.total
              const sc = selectedOrder.service_charge || (subtotal * (serviceChargePercent / 100))
              const tax = selectedOrder.tax || (subtotal * (taxPercent / 100))
              const grandTotal = selectedOrder.grand_total || (subtotal + sc + tax)
              return (
                <>
                  <div style={{ background: secondaryBg, padding: '20px', borderRadius: '20px', margin: '16px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                      <span>{t('subtotal')}:</span><span>RM {subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                      <span>{t('service_charge')} ({serviceChargePercent}%):</span><span>RM {sc.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                      <span>{t('tax')} ({taxPercent}%):</span><span>RM {tax.toFixed(2)}</span>
                    </div>
                    <div style={{ borderTop: `1px solid ${borderColor}`, marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '20px' }}>
                      <span>{t('total')}:</span><span style={{ color: '#22c55e' }}>RM {grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: textColor, fontSize: '13px' }}>{t('payment_method')}:</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {['cash', 'tng', 'bank'].map(method => (
                        <button 
                          key={method} 
                          onClick={() => setPaymentMethod(method)} 
                          style={{ 
                            flex: 1, 
                            padding: '12px', 
                            background: paymentMethod === method ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : secondaryBg, 
                            color: paymentMethod === method ? 'white' : textColor, 
                            border: `1px solid ${borderColor}`, 
                            borderRadius: '16px', 
                            cursor: 'pointer', 
                            fontWeight: 'bold', 
                            fontSize: '13px'
                          }}
                        >
                          {method === 'cash' ? '💵 ' + t('cash') : method === 'tng' ? '📱 ' + t('tng') : '🏦 ' + t('bank')}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )
            })()}
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => markAsPaid(selectedOrder)} 
                style={{ 
                  flex: 1, 
                  background: '#22c55e', 
                  color: 'white', 
                  padding: '14px', 
                  border: 'none', 
                  borderRadius: '60px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold'
                }}
              >
                ✅ {t('btn_save')}
              </button>
              <button 
                onClick={() => { setShowPaymentModal(false); setSelectedOrder(null) }} 
                style={{ 
                  flex: 1, 
                  background: '#ef4444', 
                  color: 'white', 
                  padding: '14px', 
                  border: 'none', 
                  borderRadius: '60px', 
                  cursor: 'pointer'
                }}
              >
                ❌ {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>
        {`
          .spinner { width: 48px; height: 48px; border: 4px solid rgba(59,130,246,0.2); border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes popIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: ${darkMode ? '#2a2a3e' : '#e2e8f0'}; border-radius: 10px; }
          ::-webkit-scrollbar-thumb { background: ${darkMode ? '#555' : '#94a3b8'}; border-radius: 10px; }
        `}
      </style>
    </div>
  )
}

export default CustomerDisplay