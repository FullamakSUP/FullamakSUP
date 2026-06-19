import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'
import toast from 'react-hot-toast'

const supabaseUrl = 'https://thtumfwamkkchuousgio.supabase.co'
const supabaseKey = 'sb_publishable_Gom-p3BXr5F7gAuVoTvp8g_SWL1-5IE'

const supabase = createClient(supabaseUrl, supabaseKey)

function CustomerMenu() {
  const { darkMode, toggleDarkMode } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState([])
  const [tableNumber, setTableNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [restaurantName, setRestaurantName] = useState('KedaiPOS')
  const [restaurantLogo, setRestaurantLogo] = useState('')
  const [drinkOptions, setDrinkOptions] = useState({})
  const [showDrinkModal, setShowDrinkModal] = useState(false)
  const [selectedDrink, setSelectedDrink] = useState(null)
  const [selectedOption, setSelectedOption] = useState('Panas')
  const [specialMenuEnabled, setSpecialMenuEnabled] = useState(false)
  const [specialMenuTitle, setSpecialMenuTitle] = useState('Istimewa Hari Ini')
  const [specialMenuItems, setSpecialMenuItems] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [addingItem, setAddingItem] = useState(null)
  const [clickedItemId, setClickedItemId] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [serviceChargePercent, setServiceChargePercent] = useState(6)
  const [taxPercent, setTaxPercent] = useState(6)
  
  // Promotions
  const [activePromos, setActivePromos] = useState([])
  const [promoItems, setPromoItems] = useState([])

  // Dark mode colors
  const bgColor = darkMode ? '#0f0f1a' : '#fefce8'
  const cardBg = darkMode ? 'rgba(30, 30, 46, 0.95)' : 'rgba(255, 255, 255, 0.98)'
  const textColor = darkMode ? '#f1f5f9' : '#1e293b'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.4)'
  const inputBg = darkMode ? '#1e1e2e' : '#ffffff'
  const secondaryBg = darkMode ? 'rgba(30, 30, 46, 0.8)' : '#fef3c7'

  useEffect(() => {
    loadAllData()
    const params = new URLSearchParams(window.location.search)
    const table = params.get('table')
    if (table) setTableNumber(table)
    loadSettings()
    loadPromotions()
  }, [])

  async function loadSettings() {
    const { data } = await supabase.from('settings').select('key, value')
    if (data) {
      const sc = data.find(s => s.key === 'service_charge')
      const tx = data.find(s => s.key === 'tax')
      if (sc) setServiceChargePercent(parseFloat(sc.value) || 0)
      if (tx) setTaxPercent(parseFloat(tx.value) || 0)
    }
  }

  async function loadPromotions() {
    const { data } = await supabase.from('promotions').select('*').eq('is_active', true)
    const today = new Date().toISOString().split('T')[0]
    const active = (data || []).filter(promo => {
      if (promo.start_date && promo.start_date > today) return false
      if (promo.end_date && promo.end_date < today) return false
      return true
    })
    setActivePromos(active)
    
    const items = []
    active.forEach(promo => {
      if (promo.type === 'set_menu' && promo.bundle_items && promo.bundle_price > 0) {
        items.push({
          id: `promo_set_${promo.id}`,
          name: `🍽️ ${promo.name}`,
          price: promo.bundle_price,
          original_price: promo.bundle_items.reduce((sum, i) => sum + (i.price || 0), 0),
          items: promo.bundle_items,
          type: 'set_menu',
          promo_id: promo.id,
          promo_name: promo.name,
          image_url: promo.image_url
        })
      }
      if (promo.type === 'bundle' && promo.bundle_items && promo.bundle_price > 0) {
        items.push({
          id: `promo_bundle_${promo.id}`,
          name: `📦 ${promo.name}`,
          price: promo.bundle_price,
          original_price: promo.bundle_items.reduce((sum, i) => sum + (i.price || 0), 0),
          items: promo.bundle_items,
          type: 'bundle',
          promo_id: promo.id,
          promo_name: promo.name,
          image_url: promo.image_url
        })
      }
      if (promo.type === 'bogo' && promo.trigger_items && promo.free_items) {
        items.push({
          id: `promo_bogo_${promo.id}`,
          name: `🎁 ${promo.name}`,
          price: promo.trigger_items[0]?.price || 0,
          original_price: promo.trigger_items[0]?.price || 0,
          trigger_item: promo.trigger_items[0],
          free_item: promo.free_items[0],
          type: 'bogo',
          promo_id: promo.id,
          promo_name: promo.name,
          image_url: promo.image_url
        })
      }
    })
    setPromoItems(items)
  }

  async function loadAllData() {
    setLoading(true)
    await loadRestaurantInfo()
    await loadMenu()
    await loadDrinkOptions()
    await loadSpecialMenu()
    setLoading(false)
  }

  async function loadRestaurantInfo() {
    const { data: nameData } = await supabase.from('settings').select('value').eq('key', 'restaurant_name').single()
    if (nameData) setRestaurantName(nameData.value)
    const { data: logoData } = await supabase.from('settings').select('value').eq('key', 'logo_url').single()
    if (logoData) setRestaurantLogo(logoData.value)
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

  async function loadSpecialMenu() {
    const { data: enabledData } = await supabase.from('settings').select('value').eq('key', 'special_menu_enabled').single()
    if (enabledData) setSpecialMenuEnabled(enabledData.value === 'true')
    const { data: titleData } = await supabase.from('settings').select('value').eq('key', 'special_menu_title').single()
    if (titleData) setSpecialMenuTitle(titleData.value)
    const { data: itemsData } = await supabase.from('settings').select('value').eq('key', 'special_menu_items').single()
    if (itemsData) {
      try { setSpecialMenuItems(JSON.parse(itemsData.value)) } catch (e) { setSpecialMenuItems([]) }
    }
  }

  const getSubtotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const getServiceCharge = () => getSubtotal() * (serviceChargePercent / 100)
  const getTax = () => getSubtotal() * (taxPercent / 100)
  const getGrandTotal = () => getSubtotal() + getServiceCharge() + getTax()
  const getCartItemCount = () => cart.reduce((sum, item) => sum + item.quantity, 0)

  const openDrinkOptions = (drink) => {
    setSelectedDrink(drink)
    setSelectedOption('Panas')
    setShowDrinkModal(true)
  }
  
  const addDrinkToCart = () => {
    if (!selectedDrink) return
    const options = drinkOptions[selectedDrink.name]
    const selected = options?.find(opt => opt.type === selectedOption)
    if (!selected) return
    setAddingItem(selectedDrink.id)
    setTimeout(() => setAddingItem(null), 300)
    setCart([...cart, { 
      id: `${selectedDrink.id}_${selectedOption}_${Date.now()}`, 
      name: `${selectedDrink.name} (${selectedOption === 'Panas' ? '☕ ' + t('hot') : '🧊 ' + t('cold')})`, 
      price: selected.price, 
      quantity: 1,
      is_free: false,
      is_promo_item: false,
      category: 'Minuman'
    }])
    setShowDrinkModal(false)
    setSelectedDrink(null)
    setShowCart(true)
  }

  const addToCart = (item) => {
    setAddingItem(item.id)
    setTimeout(() => setAddingItem(null), 300)
    
    const hasDrinkOpts = drinkOptions[item.name] && drinkOptions[item.name].length > 0
    const isDrink = item.category === 'Minuman'
    
    if (hasDrinkOpts || isDrink) {
      openDrinkOptions(item)
    } else {
      const existing = cart.find(x => x.id === item.id)
      if (existing) {
        setCart(cart.map(x => x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x))
      } else {
        setCart([...cart, { 
          ...item, 
          quantity: 1,
          is_free: false,
          is_promo_item: false,
          category: item.category || 'Makanan'
        }])
      }
    }
    setShowCart(true)
  }

  const addPromoToCart = (promoItem) => {
    setAddingItem(promoItem.id)
    setTimeout(() => setAddingItem(null), 300)
    
    if (promoItem.type === 'bogo') {
      const triggerItem = { 
        id: `trigger_${promoItem.promo_id}_${Date.now()}`,
        name: promoItem.trigger_item.name,
        price: promoItem.trigger_item.price,
        quantity: 1,
        is_free: false,
        is_promo_item: false,
        original_price: promoItem.trigger_item.price,
        category: promoItem.trigger_item.category || 'Makanan'
      }
      const freeItem = { 
        id: `free_${promoItem.promo_id}_${Date.now()}`,
        name: `${promoItem.free_item.name} (${t('free')})`,
        price: 0,
        quantity: 1,
        is_free: true,
        is_promo_item: true,
        promo_name: promoItem.promo_name,
        original_price: promoItem.free_item.price,
        category: promoItem.free_item.category || 'Makanan'
      }
      setCart([...cart, triggerItem, freeItem])
      toast.success(`🎁 ${promoItem.trigger_item.name} + ${t('free')} ${promoItem.free_item.name}!`)
    }
    
    if (promoItem.type === 'set_menu' || promoItem.type === 'bundle') {
      const bundleItems = promoItem.items.map((item, idx) => ({
        id: `bundle_${promoItem.promo_id}_${idx}_${Date.now()}`,
        name: item.name,
        price: 0,
        quantity: 1,
        original_price: item.price,
        is_free: false,
        is_promo_item: true,
        promo_name: promoItem.promo_name,
        promo_type: promoItem.type,
        category: item.category || 'Makanan'
      }))
      
      const promoLineItem = {
        id: `promo_line_${promoItem.promo_id}_${Date.now()}`,
        name: `[${t('promo_badge')}] ${promoItem.name}`,
        price: promoItem.price,
        quantity: 1,
        is_free: false,
        is_promo_item: true,
        promo_name: promoItem.promo_name,
        promo_type: promoItem.type,
        bundle_items_count: promoItem.items.length
      }
      
      setCart([...cart, ...bundleItems, promoLineItem])
      toast.success(`${promoItem.name} ${t('added')}! ${t('save')} RM ${(promoItem.original_price - promoItem.price).toFixed(2)}`)
    }
    
    setShowCart(true)
  }

  const addSpecialToCart = (item) => {
    setAddingItem(`special_${item.id}`)
    setTimeout(() => setAddingItem(null), 300)
    const existing = cart.find(x => x.id === `special_${item.id}`)
    if (existing) {
      setCart(cart.map(x => x.id === `special_${item.id}` ? { ...x, quantity: x.quantity + 1 } : x))
    } else {
      setCart([...cart, { 
        id: `special_${item.id}`, 
        name: item.name, 
        price: item.price, 
        quantity: 1, 
        is_special: true,
        is_free: false,
        is_promo_item: false,
        category: item.category || 'Makanan'
      }])
    }
    setShowCart(true)
  }

  const removeFromCart = (id) => {
    const existing = cart.find(x => x.id === id)
    if (existing.quantity === 1) {
      setCart(cart.filter(x => x.id !== id))
    } else {
      setCart(cart.map(x => x.id === id ? { ...x, quantity: x.quantity - 1 } : x))
    }
  }

  const handlePlaceOrder = () => {
    if (cart.length === 0) { toast.error(t('empty_cart')); return }
    if (!tableNumber) { toast.error(t('table_required')); return }
    setShowConfirmModal(true)
  }

  const submitOrderConfirmed = async () => {
    setShowConfirmModal(false)
    
    const items = cart.map(item => ({ 
      id: item.id, 
      name: item.name, 
      price: item.price, 
      quantity: item.quantity,
      is_free: item.is_free || false,
      is_promo_item: item.is_promo_item || false,
      promo_name: item.promo_name || null,
      original_price: item.original_price || null,
      category: item.category || (item.name.includes('Teh') || item.name.includes('Kopi') || item.name.includes('Air') ? 'Minuman' : 'Makanan')
    }))
    
    const orderNumber = 'ORD-' + Date.now()
    setSubmittedOrderNumber(orderNumber)
    const total = getGrandTotal()
    const subtotal = getSubtotal()
    const serviceCharge = getServiceCharge()
    const tax = getTax()

    const { error } = await supabase.from('customer_orders').insert([{
      order_number: orderNumber, 
      order_type: 'dine_in', 
      table_number: parseInt(tableNumber),
      customer_name: customerName || t('guest'), 
      customer_phone: customerPhone || null,
      items: items, 
      subtotal: subtotal, 
      service_charge: serviceCharge, 
      tax: tax, 
      total: total,
      notes: notes, 
      status: 'pending', 
      payment_status: 'unpaid'
    }])

    if (error) {
      console.error('Submit error:', error)
      toast.error(t('error') + ': ' + error.message)
    } else {
      setSubmitted(true)
      setCart([])
      setShowCart(false)
    }
  }

  // Build categories
  const baseCategories = ['All', ...new Set(menu.map(item => item.category).filter(Boolean))]
  const categories = [...baseCategories]
  if (promoItems.length > 0 && !categories.includes('🔥 Promosi')) {
    categories.unshift('🔥 Promosi')
  }
  
  const getFilteredMenu = () => {
    if (selectedCategory === '🔥 Promosi') {
      return promoItems
    }
    if (selectedCategory === 'All') {
      return menu
    }
    return menu.filter(item => item.category === selectedCategory)
  }
  
  const filteredMenu = getFilteredMenu()

  const getDefaultIcon = (category) => {
    switch(category) {
      case 'Makanan': return '🍚'
      case 'Minuman': return '🥤'
      case 'SUP': return '🍜'
      default: return '🍽️'
    }
  }

  const getCategoryIcon = (cat) => {
    if (cat === 'Makanan') return '🍚'
    if (cat === 'Minuman') return '🥤'
    if (cat === 'SUP') return '🍜'
    if (cat === '🔥 Promosi') return '🏷️'
    return '🍽️'
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: bgColor }}>
        <div className="spinner"></div>
        <style>{`.spinner{width:48px;height:48px;border:4px solid rgba(59,130,246,0.2);border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (submitted) {
    const total = getGrandTotal()
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: bgColor, padding: '20px' }}>
        <div style={{ background: cardBg, borderRadius: '32px', padding: '32px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          <div style={{ width: '80px', height: '80px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}><span style={{ fontSize: '48px' }}>✅</span></div>
          <h1 style={{ color: '#16a34a', fontSize: '24px', marginBottom: '8px', fontWeight: 'bold' }}>{t('order_confirmed')}</h1>
          <p style={{ color: textMuted, marginBottom: '20px' }}>{t('order_sent_to_kitchen')}</p>
          <div style={{ background: secondaryBg, borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
            <p style={{ color: textMuted, fontSize: '12px', marginBottom: '4px' }}>{t('order_number_label')}</p>
            <div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px', color: textColor, fontFamily: 'monospace' }}>{submittedOrderNumber}</div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '16px' }}>
            <button onClick={() => { navigator.clipboard.writeText(submittedOrderNumber); toast.success(t('copy') + '!') }} style={{ background: '#3b82f6', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '40px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>📋 {t('copy')}</button>
            <button onClick={() => window.open(`/track?order=${submittedOrderNumber}`, '_blank')} style={{ background: '#22c55e', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '40px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>🔍 {t('track_order')}</button>
          </div>
          <button onClick={() => window.location.reload()} style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white', padding: '14px', border: 'none', borderRadius: '40px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', width: '100%' }}>{t('new_order')} →</button>
        </div>
      </div>
    )
  }

  const cartItemCount = getCartItemCount()

  return (
    <div style={{ minHeight: '100vh', background: bgColor }}>
      
      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', padding: '40px 24px', textAlign: 'center', color: 'white' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {restaurantLogo ? <img src={restaurantLogo} alt={restaurantName} style={{ height: '50px', borderRadius: '12px' }} /> : <span style={{ fontSize: '40px' }}>🏪</span>}
              <div><h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{restaurantName}</h1><p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>{t('scan_qr')}</p></div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={toggleDarkMode} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '30px', cursor: 'pointer' }}>{darkMode ? '☀️' : '🌙'}</button>
              <button onClick={() => setLanguage(language === 'bm' ? 'en' : 'bm')} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '30px', cursor: 'pointer' }}>{language === 'bm' ? '🇺🇸' : '🇲🇾'}</button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <div style={{ background: 'white', borderRadius: '60px', padding: '4px 20px', display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>📋</span>
              <input type="number" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder={t('enter_table')} style={{ padding: '12px 0', width: '120px', textAlign: 'center', border: 'none', outline: 'none', fontSize: '18px', fontWeight: 'bold', background: 'transparent' }} />
              <span style={{ fontSize: '24px' }}>🪑</span>
            </div>
          </div>
          {!tableNumber && <p style={{ marginTop: '12px', fontSize: '12px', opacity: 0.9 }}>⚠️ {t('please_enter_table')}</p>}
        </div>
      </div>

      {/* Promo Banner */}
      {activePromos.length > 0 && (
        <div style={{ maxWidth: '1280px', margin: '-20px auto 0 auto', padding: '0 20px' }}>
          <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', borderRadius: '24px', padding: '20px', boxShadow: '0 8px 20px rgba(139,92,246,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '28px' }}>🏷️</span>
              <span style={{ fontWeight: 'bold', color: 'white', fontSize: '16px' }}>🔥 {t('active_promotions')}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activePromos.map(promo => (
                <div key={promo.id} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '16px', padding: '12px 16px' }}>
                  <div style={{ fontWeight: 'bold', color: 'white', fontSize: '14px' }}>{promo.name}</div>
                  {promo.type === 'bogo' && (
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginTop: '4px' }}>
                      🎁 {t('buy')} <strong>{promo.trigger_items?.[0]?.name || 'item'}</strong> 
                      {t('get')} <strong>{promo.free_items?.[0]?.name || 'item'}</strong> {t('free')}!
                    </div>
                  )}
                  {promo.type === 'set_menu' && (
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginTop: '4px' }}>
                      🍽️ <strong>{promo.bundle_items?.map(i => i.name).join(' + ')}</strong><br />
                      {t('only')} <strong>RM {promo.bundle_price}</strong>! 
                      ({t('save')} RM {(promo.bundle_items?.reduce((s, i) => s + (i.price || 0), 0) - (promo.bundle_price || 0)).toFixed(2)})
                    </div>
                  )}
                  {promo.type === 'bundle' && (
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginTop: '4px' }}>
                      📦 <strong>{promo.bundle_items?.map(i => i.name).join(' + ')}</strong><br />
                      {t('only')} <strong>RM {promo.bundle_price}</strong>! 
                      ({t('save')} RM {(promo.bundle_items?.reduce((s, i) => s + (i.price || 0), 0) - (promo.bundle_price || 0)).toFixed(2)})
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Special Menu Section */}
      {specialMenuEnabled && specialMenuItems.length > 0 && (
        <div style={{ maxWidth: '1280px', margin: '24px auto', padding: '0 20px' }}>
          <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderRadius: '24px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><span style={{ fontSize: '28px' }}>⭐</span><h2 style={{ margin: 0, color: '#92400e', fontSize: '18px', fontWeight: 'bold' }}>{specialMenuTitle}</h2></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {specialMenuItems.map((item, idx) => (
                <div key={idx} style={{ background: 'white', borderRadius: '50px', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: '32px', height: '32px', borderRadius: '8px' }} /> : <span>⭐</span>}
                  <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                  <span style={{ color: '#16a34a', fontWeight: 'bold' }}>RM {item.price}</span>
                  <button onClick={() => addSpecialToCart(item)} style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: '30px', padding: '4px 16px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Filters */}
      <div style={{ maxWidth: '1280px', margin: '24px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: '10px 20px', background: selectedCategory === cat ? '#f59e0b' : 'white', color: selectedCategory === cat ? 'white' : '#1e293b', border: selectedCategory === cat ? 'none' : `1px solid ${borderColor}`, borderRadius: '50px', cursor: 'pointer', fontWeight: selectedCategory === cat ? 'bold' : '500', fontSize: '14px', transition: 'all 0.2s', boxShadow: selectedCategory === cat ? '0 4px 12px rgba(245,158,11,0.4)' : 'none' }}>
              {cat === '🔥 Promosi' ? `🏷️ ${cat}` : `${getCategoryIcon(cat)} ${cat}`}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px 40px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '20px' }}>
          {filteredMenu.map(item => {
            const isPromoItem = item.type === 'set_menu' || item.type === 'bundle' || item.type === 'bogo'
            const hasDrinkOptions = !isPromoItem && drinkOptions[item.name] && drinkOptions[item.name].length > 0
            const hasImage = item.image_url && item.image_url.trim() !== ''
            const panasPrice = hasDrinkOptions ? drinkOptions[item.name]?.find(o => o.type === 'Panas')?.price : null
            const sejukPrice = hasDrinkOptions ? drinkOptions[item.name]?.find(o => o.type === 'Sejuk')?.price : null
            const isAdding = addingItem === item.id
            const isClicked = clickedItemId === item.id
            
            return (
              <div 
                key={item.id} 
                style={{ 
                  background: isClicked ? '#dcfce7' : (isPromoItem ? '#f3e8ff' : 'white'),
                  borderRadius: '24px', 
                  overflow: 'hidden', 
                  boxShadow: isPromoItem ? '0 4px 16px rgba(139,92,246,0.3)' : '0 4px 12px rgba(0,0,0,0.08)', 
                  transition: 'all 0.2s ease',
                  cursor: 'pointer', 
                  border: isClicked ? '2px solid #22c55e' : (isPromoItem ? '2px solid #8b5cf6' : 'none'),
                  transform: isClicked ? 'scale(0.98)' : 'scale(1)'
                }} 
                onMouseEnter={e => { 
                  if (!isClicked) {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 20px 30px rgba(0,0,0,0.15)'
                  }
                }}
                onMouseLeave={e => { 
                  if (!isClicked) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = isPromoItem ? '0 4px 16px rgba(139,92,246,0.3)' : '0 4px 12px rgba(0,0,0,0.08)'
                  }
                }}
                onClick={() => {
                  setClickedItemId(item.id)
                  setTimeout(() => setClickedItemId(null), 200)
                  if (isPromoItem) {
                    addPromoToCart(item)
                  } else {
                    addToCart(item)
                  }
                }}
              >
                <div style={{ background: isPromoItem ? '#f3e8ff' : '#fef3c7', padding: '20px', textAlign: 'center', position: 'relative' }}>
                  {isPromoItem && <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#8b5cf6', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 'bold' }}>{t('promo_badge')}</div>}
                  {hasImage ? <img src={item.image_url} alt={item.name} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '16px', margin: '0 auto' }} /> : <span style={{ fontSize: '56px' }}>{isPromoItem ? '🏷️' : getDefaultIcon(item.category)}</span>}
                </div>
                <div style={{ padding: '16px', textAlign: 'center' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{item.name}</h3>
                  {isPromoItem && item.original_price && (
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'line-through', marginRight: '8px' }}>RM {item.original_price}</span>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#8b5cf6' }}>RM {item.price}</span>
                    </div>
                  )}
                  {hasDrinkOptions ? (
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ color: '#f97316', fontSize: '13px', marginRight: '8px' }}>🔥 RM {panasPrice}</span>
                      <span style={{ color: '#06b6d4', fontSize: '13px' }}>🧊 RM {sejukPrice}</span>
                    </div>
                  ) : !isPromoItem && (
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#22c55e', marginBottom: '8px' }}>RM {item.price}</div>
                  )}
                  <div style={{ 
                    width: '100%', 
                    padding: '10px', 
                    background: isAdding ? '#22c55e' : (isPromoItem ? '#8b5cf6' : '#f59e0b'), 
                    color: 'white', 
                    borderRadius: '40px', 
                    fontWeight: 'bold', 
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}>
                    {isAdding ? `✓ ${t('added')}!` : (isPromoItem ? `+ ${t('buy_promo')}` : `+ ${t('add')}`)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <button onClick={() => setShowCart(true)} style={{ position: 'fixed', bottom: '24px', right: '24px', width: '64px', height: '64px', borderRadius: '32px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white', border: 'none', fontSize: '28px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(245,158,11,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          🛒
          <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '22px', height: '22px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{cartItemCount}</span>
        </button>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '400px', background: 'white', boxShadow: '-4px 0 20px rgba(0,0,0,0.15)', zIndex: 1001, display: 'flex', flexDirection: 'column', animation: 'slideIn 0.3s ease' }}>
          
          <div style={{ padding: '20px', borderBottom: `1px solid #e2e8f0`, background: '#f59e0b', color: 'white' }}>
            <h2 style={{ margin: 0, fontSize: '20px' }}>🛒 {t('your_order')} ({cartItemCount})</h2>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {cart.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>{t('cart_empty')}</p>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: `1px solid #e2e8f0` }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{item.name} {item.is_free && <span style={{ color: '#22c55e', fontSize: '11px' }}>({t('free')})</span>}{item.is_promo_item && <span style={{ color: '#8b5cf6', fontSize: '11px' }}>(PROMO)</span>}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>x{item.quantity}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: 'bold', color: '#22c55e' }}>RM {(item.price * item.quantity).toFixed(2)}</span>
                      <button onClick={() => removeFromCart(item.id)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '20px', padding: '4px 10px', cursor: 'pointer', fontSize: '11px' }}>✕</button>
                    </div>
                  </div>
                ))}
                <div style={{ background: '#fef3c7', borderRadius: '16px', padding: '16px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>{t('subtotal')}:</span>
                    <span>RM {getSubtotal().toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>{t('service')} ({serviceChargePercent}%):</span>
                    <span>RM {getServiceCharge().toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>{t('tax_label')} ({taxPercent}%):</span>
                    <span>RM {getTax().toFixed(2)}</span>
                  </div>
                  <div style={{ borderTop: `1px solid #fde68a`, marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px' }}>
                    <span>{t('total_label')}:</span>
                    <span style={{ color: '#22c55e' }}>RM {getGrandTotal().toFixed(2)}</span>
                  </div>
                </div>
                <input 
                  type="text" 
                  placeholder={t('your_name')} 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)} 
                  style={{ width: '100%', padding: '12px', marginTop: '16px', marginBottom: '12px', borderRadius: '12px', border: `1px solid #cbd5e1`, outline: 'none' }} 
                />
                <input 
                  type="tel" 
                  placeholder={t('phone_optional')} 
                  value={customerPhone} 
                  onChange={(e) => setCustomerPhone(e.target.value)} 
                  style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '12px', border: `1px solid #cbd5e1`, outline: 'none' }} 
                />
                <textarea 
                  placeholder={t('special_notes')} 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  rows="2" 
                  style={{ width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '12px', border: `1px solid #cbd5e1`, outline: 'none', fontFamily: 'inherit' }} 
                />
              </>
            )}
          </div>
          
          <div style={{ padding: '20px', borderTop: `1px solid #e2e8f0` }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowCart(false)} 
                style={{ 
                  flex: 1,
                  padding: '14px', 
                  background: '#64748b', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '40px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                ⬅️ {t('back_to_menu')}
              </button>
              <button 
                onClick={handlePlaceOrder} 
                disabled={!tableNumber || cart.length === 0}
                style={{ 
                  flex: 1,
                  padding: '14px', 
                  background: (!tableNumber || cart.length === 0) ? '#cbd5e1' : 'linear-gradient(135deg, #f59e0b, #ea580c)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '40px', 
                  cursor: (!tableNumber || cart.length === 0) ? 'not-allowed' : 'pointer', 
                  fontSize: '14px', 
                  fontWeight: 'bold'
                }}
              >
                {!tableNumber ? t('please_enter_table_first') : t('place_order')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drink Options Modal */}
      {showDrinkModal && selectedDrink && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ background: 'white', borderRadius: '28px', padding: '28px', maxWidth: '360px', width: '90%', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '8px' }}>🥤 {selectedDrink.name}</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>{t('select_temperature')}</p>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <button 
                onClick={() => setSelectedOption('Panas')} 
                style={{ 
                  flex: 1, 
                  padding: '16px', 
                  background: selectedOption === 'Panas' ? '#f97316' : '#f1f5f9', 
                  color: selectedOption === 'Panas' ? 'white' : '#333', 
                  border: 'none', 
                  borderRadius: '16px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold' 
                }}
              >
                🔥 {t('hot')}<br />
                <small>RM {drinkOptions[selectedDrink.name]?.find(o => o.type === 'Panas')?.price || '0.00'}</small>
              </button>
              
              <button 
                onClick={() => setSelectedOption('Sejuk')} 
                style={{ 
                  flex: 1, 
                  padding: '16px', 
                  background: selectedOption === 'Sejuk' ? '#06b6d4' : '#f1f5f9', 
                  color: selectedOption === 'Sejuk' ? 'white' : '#333', 
                  border: 'none', 
                  borderRadius: '16px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold' 
                }}
              >
                🧊 {t('cold')}<br />
                <small>RM {drinkOptions[selectedDrink.name]?.find(o => o.type === 'Sejuk')?.price || '0.00'}</small>
              </button>
            </div>
            
            <button 
              onClick={addDrinkToCart} 
              style={{ 
                width: '100%', 
                padding: '14px', 
                background: '#22c55e', 
                color: 'white', 
                border: 'none', 
                borderRadius: '40px', 
                cursor: 'pointer', 
                fontWeight: 'bold', 
                marginBottom: '12px' 
              }}
            >
              + {t('add_to_cart_btn')}
            </button>
            
            <button 
              onClick={() => setShowDrinkModal(false)} 
              style={{ 
                width: '100%', 
                padding: '14px', 
                background: '#64748b', 
                color: 'white', 
                border: 'none', 
                borderRadius: '40px', 
                cursor: 'pointer' 
              }}
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ background: 'white', borderRadius: '28px', padding: '28px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            <div style={{ width: '60px', height: '60px', background: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <span style={{ fontSize: '32px' }}>📋</span>
            </div>
            
            <h2 style={{ marginBottom: '8px', fontSize: '22px', fontWeight: 'bold' }}>{t('confirm_order_title')}</h2>
            <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>{t('confirm_order_desc')}</p>
            
            <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px', marginBottom: '20px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>{t('table_label')}</span>
                <span style={{ fontWeight: 'bold' }}>{tableNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>{t('customer_label')}</span>
                <span style={{ fontWeight: 'bold' }}>{customerName || t('guest')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: 'bold' }}>{t('total_items_label')}</span>
                <span style={{ fontWeight: 'bold' }}>{getCartItemCount()}</span>
              </div>
            </div>
            
            <div style={{ background: '#fef3c7', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px' }}>
                <span>{t('total_payment_label')}</span>
                <span style={{ color: '#22c55e' }}>RM {getGrandTotal().toFixed(2)}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => {
                  setShowConfirmModal(false)
                  setShowCart(true)
                }} 
                style={{ 
                  flex: 1,
                  padding: '14px', 
                  background: '#64748b', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '40px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                ⬅️ {t('back_btn')}
              </button>
              
              <button 
                onClick={() => setShowConfirmModal(false)} 
                style={{ 
                  flex: 1,
                  padding: '14px', 
                  background: 'transparent', 
                  color: '#64748b', 
                  border: `1px solid #64748b`, 
                  borderRadius: '40px', 
                  cursor: 'pointer', 
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                ❌ {t('close_btn')}
              </button>
              
              <button 
                onClick={submitOrderConfirmed} 
                style={{ 
                  flex: 1,
                  padding: '14px', 
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '40px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                ✅ {t('confirm_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: ${darkMode ? '#2a2a3e' : '#e2e8f0'}; border-radius: 10px; }
          ::-webkit-scrollbar-thumb { background: ${darkMode ? '#555' : '#94a3b8'}; border-radius: 10px; }
        `}
      </style>
    </div>
  )
}

export default CustomerMenu