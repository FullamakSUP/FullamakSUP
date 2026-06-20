import { useState, useEffect } from 'react'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'
import toast from 'react-hot-toast'
import { supabase } from './lib/supabase'

function CustomerMenu() {
  const { darkMode, toggleDarkMode } = useTheme()
  const { language, setLanguage } = useLanguage()
  const [menu, setMenu] = useState([])
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState([])
  const [tableNumber, setTableNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [restaurantName, setRestaurantName] = useState('Restoran Kita')
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
  const [isMobile, setIsMobile] = useState(false)
  
  const [showSizeModal, setShowSizeModal] = useState(false)
  const [selectedSizeItem, setSelectedSizeItem] = useState(null)
  const [menuOptions, setMenuOptions] = useState([])
  
  const [activePromos, setActivePromos] = useState([])
  const [promoItems, setPromoItems] = useState([])

  // ============================================================
  // TRANSLATIONS
  // ============================================================
  const translations = {
    scan_qr: { en: 'Scan QR to order', ms: 'Scan QR untuk pesan' },
    table_no: { en: 'Table No.', ms: 'No. Meja' },
    enter_table: { en: 'Please enter your table number', ms: 'Sila masukkan nombor meja' },
    promotions: { en: 'Active Promotions!', ms: 'Promosi Giat!' },
    buy: { en: 'Buy', ms: 'Beli' },
    get_free: { en: 'get', ms: 'dapat' },
    free: { en: 'FREE', ms: 'PERCUMA' },
    only: { en: 'Only', ms: 'Hanya' },
    save: { en: 'Save', ms: 'Jimat' },
    promo: { en: 'PROMO', ms: 'PROMOSI' },
    promo_bundle: { en: 'Bundle Deal', ms: 'Tawaran Bundle' },
    promo_set: { en: 'Set Menu', ms: 'Set Menu' },
    promo_bogo: { en: 'Buy 1 Free 1', ms: 'Beli 1 Percuma 1' },
    buy_promo: { en: 'Buy Promo', ms: 'Beli Promo' },
    your_order: { en: 'Your Order', ms: 'Pesanan Anda' },
    empty_cart_msg: { en: 'Your cart is empty', ms: 'Keranjang kosong' },
    back_to_menu: { en: 'Back to Menu', ms: 'Kembali ke Menu' },
    place_order: { en: 'Place Order', ms: 'Hantar Pesanan' },
    table_required: { en: 'Table number required', ms: 'Nombor meja diperlukan' },
    subtotal: { en: 'Subtotal', ms: 'Subtotal' },
    service: { en: 'Service', ms: 'Perkhidmatan' },
    tax: { en: 'Tax', ms: 'Cukai' },
    total: { en: 'Total', ms: 'Jumlah' },
    total_items: { en: 'Total Items', ms: 'Jumlah Item' },
    total_amount: { en: 'Total Amount', ms: 'Jumlah Bayaran' },
    your_name: { en: 'Your name', ms: 'Nama anda' },
    phone_optional: { en: 'Phone (optional)', ms: 'Telefon (optional)' },
    special_notes: { en: 'Special notes...', ms: 'Catatan khas...' },
    confirm_order: { en: 'Confirm Order', ms: 'Sahkan Pesanan' },
    review_order: { en: 'Please review your order before placing', ms: 'Sila semak semula pesanan anda sebelum menghantar' },
    table: { en: 'Table', ms: 'Meja' },
    customer: { en: 'Customer', ms: 'Pelanggan' },
    guest: { en: 'Guest', ms: 'Tetamu' },
    back: { en: 'Back', ms: 'Kembali' },
    close: { en: 'Close', ms: 'Tutup' },
    confirm: { en: 'Confirm', ms: 'Sahkan' },
    order_confirmed: { en: 'Order Confirmed!', ms: 'Pesanan Dikonfirmasi!' },
    order_sent: { en: 'Your order has been sent to the kitchen', ms: 'Pesanan anda telah dihantar ke dapur' },
    order_number: { en: 'Order Number', ms: 'Nombor Pesanan' },
    copy: { en: 'Copy', ms: 'Salin' },
    track_order: { en: 'Track Order', ms: 'Jejak Pesanan' },
    new_order: { en: 'New Order', ms: 'Pesanan Baru' },
    copied: { en: 'Copied!', ms: 'Disalin!' },
    drink_type: { en: 'Select drink type', ms: 'Pilih jenis minuman' },
    hot: { en: 'Hot', ms: 'Panas' },
    cold: { en: 'Cold', ms: 'Sejuk' },
    takeaway: { en: 'Takeaway', ms: 'Bungkus' },
    add_to_cart: { en: 'Add to Cart', ms: 'Tambah ke Keranjang' },
    cancel: { en: 'Cancel', ms: 'Batal' },
    choose_size: { en: 'Choose size / option', ms: 'Pilih saiz / pilihan' },
    select_size: { en: 'Select Size', ms: 'Pilih Saiz' },
    no_menu_category: { en: 'No menu items in this category', ms: 'Tiada menu dalam kategori ini' },
    special_today: { en: 'Special Today', ms: 'Istimewa Hari Ini' },
    add: { en: 'Add', ms: 'Tambah' },
    added: { en: 'Added!', ms: 'Ditambah!' },
    all: { en: 'All', ms: 'Semua' },
    menu_updated: { en: 'Menu updated!', ms: 'Menu dikemaskini!' },
    category_updated: { en: 'Categories updated!', ms: 'Kategori dikemaskini!' },
    promo_updated: { en: 'Promotions updated!', ms: 'Promosi dikemaskini!' },
    live: { en: 'Live', ms: 'Langsung' },
    empty_cart: { en: 'Your cart is empty', ms: 'Keranjang anda kosong' },
    error_submit: { en: 'Error submitting order', ms: 'Ralat menghantar pesanan' },
    please_enter_table: { en: 'Please enter table number', ms: 'Sila masukkan nombor meja' },
    select_size_btn: { en: 'Select Size', ms: 'Pilih Saiz' },
  }

  const translate = (key) => {
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
  // THEME COLORS - CANTIK & JELAS
  // ============================================================
  const bgColor = darkMode ? '#0a0a16' : '#fef3c7'
  const cardBg = darkMode ? 'rgba(20, 20, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  const textColor = darkMode ? '#f1f5f9' : '#1e293b'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const textPrice = '#22c55e'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.4)'
  const inputBg = darkMode ? '#1a1a2e' : '#ffffff'
  const secondaryBg = darkMode ? 'rgba(30, 30, 50, 0.6)' : '#fef3c7'
  const accentColor = '#f59e0b'
  const successColor = '#22c55e'
  const dangerColor = '#ef4444'
  const primaryColor = '#3b82f6'

  const glassEffect = {
    background: cardBg,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${borderColor}`,
    boxShadow: darkMode 
      ? '0 8px 40px rgba(0,0,0,0.5)' 
      : '0 8px 40px rgba(0,0,0,0.06)'
  }

  // ============================================================
  // LOAD DATA + REAL-TIME SUBSCRIPTIONS
  // ============================================================
  useEffect(() => {
    loadAllData()
    loadSettings()
    loadPromotions()
    
    const params = new URLSearchParams(window.location.search)
    const table = params.get('table')
    if (table) setTableNumber(table)

    const menuSubscription = supabase
      .channel('customer-menu-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu' }, () => {
        loadMenu()
        toast.success(translate('menu_updated'), { duration: 1500 })
      })
      .subscribe()

    const categorySubscription = supabase
      .channel('customer-category-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        loadCategories()
        toast.success(translate('category_updated'), { duration: 1500 })
      })
      .subscribe()

    const drinkSubscription = supabase
      .channel('customer-drink-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drink_options' }, () => {
        loadDrinkOptions()
      })
      .subscribe()

    const promoSubscription = supabase
      .channel('customer-promo-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promotions' }, () => {
        loadPromotions()
        toast.success(translate('promo_updated'), { duration: 1500 })
      })
      .subscribe()

    const settingsSubscription = supabase
      .channel('customer-settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        loadSpecialMenu()
        loadRestaurantInfo()
      })
      .subscribe()

    return () => {
      menuSubscription.unsubscribe()
      categorySubscription.unsubscribe()
      drinkSubscription.unsubscribe()
      promoSubscription.unsubscribe()
      settingsSubscription.unsubscribe()
    }
  }, [])

  // ============================================================
  // LOAD FUNCTIONS
  // ============================================================
  async function loadAllData() {
    setLoading(true)
    await loadRestaurantInfo()
    await loadCategories()
    await loadMenu()
    await loadDrinkOptions()
    await loadSpecialMenu()
    setLoading(false)
  }

  async function loadRestaurantInfo() {
    try {
      const { data: nameData } = await supabase.from('settings').select('value').eq('key', 'restaurant_name').single()
      if (nameData) setRestaurantName(nameData.value)
      const { data: logoData } = await supabase.from('settings').select('value').eq('key', 'logo_url').single()
      if (logoData) setRestaurantLogo(logoData.value)
    } catch (err) {
      console.error('Error loading restaurant info:', err)
    }
  }

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
    setCategories(data || [])
  }

  async function loadMenu() {
    const { data } = await supabase
      .from('menu')
      .select('*')
      .order('sort_order', { ascending: true })
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

  async function loadSettings() {
    try {
      const { data } = await supabase.from('settings').select('key, value')
      if (data) {
        const sc = data.find(s => s.key === 'service_charge')
        const tx = data.find(s => s.key === 'tax')
        if (sc) setServiceChargePercent(parseFloat(sc.value) || 0)
        if (tx) setTaxPercent(parseFloat(tx.value) || 0)
      }
    } catch (err) {
      console.error('Error loading settings:', err)
    }
  }

  // ============================================================
  // SPECIAL MENU - SYNC WITH MENU TABLE
  // ============================================================
  async function loadSpecialMenu() {
    try {
      const { data: enabledData } = await supabase.from('settings').select('value').eq('key', 'special_menu_enabled').single()
      if (enabledData) setSpecialMenuEnabled(enabledData.value === 'true')
      
      const { data: titleData } = await supabase.from('settings').select('value').eq('key', 'special_menu_title').single()
      if (titleData) setSpecialMenuTitle(titleData.value)
      
      const { data: itemsData } = await supabase.from('settings').select('value').eq('key', 'special_menu_items').single()
      if (itemsData) {
        let items = []
        try {
          items = JSON.parse(itemsData.value)
        } catch (e) {
          items = []
        }
        
        const syncedItems = []
        for (const item of items) {
          if (item.menu_id) {
            const { data: menuItem } = await supabase
              .from('menu')
              .select('price, image_url, description, has_options')
              .eq('id', item.menu_id)
              .single()
            
            if (menuItem) {
              syncedItems.push({
                ...item,
                price: menuItem.price,
                image_url: menuItem.image_url || item.image_url,
                description: menuItem.description || item.description,
                has_options: menuItem.has_options
              })
            } else {
              syncedItems.push(item)
            }
          } else {
            syncedItems.push(item)
          }
        }
        
        setSpecialMenuItems(syncedItems)
      }
    } catch (err) {
      console.error('Error loading special menu:', err)
    }
  }

  async function loadPromotions() {
    try {
      const { data } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: false })
      
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
            name: `${promo.name}`,
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
            name: `${promo.name}`,
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
            name: `${promo.name}`,
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
    } catch (err) {
      console.error('Error loading promotions:', err)
      setActivePromos([])
      setPromoItems([])
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================
  // ============================================================
  // GET CATEGORIES - SHOW ALL (SAME AS STAFFAPP)
  // ============================================================
  const getCategoriesForMenu = () => {
    // SHOW ALL CATEGORIES - SAME AS STAFFAPP
    return categories
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map(cat => cat.name)
  }

  const getDefaultIcon = (category) => {
    const foundCat = categories.find(c => c.name === category)
    if (foundCat && foundCat.icon) return foundCat.icon
    switch(category) {
      case 'Makanan': return '🍚'
      case 'Minuman': return '🥤'
      default: return '🍽️'
    }
  }

  const getCategoryIcon = (catName) => {
    if (catName === 'All') return '🍽️'
    if (catName === '🔥 Promosi') return '🏷️'
    const foundCat = categories.find(c => c.name === catName)
    if (foundCat && foundCat.icon) return foundCat.icon
    return '🍽️'
  }

  // ============================================================
  // MENU OPTIONS FUNCTIONS
  // ============================================================
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
    setAddingItem(item.id)
    setTimeout(() => setAddingItem(null), 300)
    
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
    setShowCart(true)
    toast.success(`✓ ${cartItem.name} ${translate('added')}`)
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
    setShowCart(true)
    toast.success(`✓ ${item.name} ${translate('added')}`)
  }

  const openDrinkOptions = (drink) => {
    setSelectedDrink(drink)
    const options = drinkOptions[drink.name]
    if (options && options.length > 0) {
      setSelectedOption(options[0].type)
    } else {
      setSelectedOption('Panas')
    }
    setShowDrinkModal(true)
  }
  
  const addDrinkToCart = () => {
    if (!selectedDrink) return
    const options = drinkOptions[selectedDrink.name]
    const selected = options?.find(opt => opt.type === selectedOption)
    if (!selected) return
    setAddingItem(selectedDrink.id)
    setTimeout(() => setAddingItem(null), 300)
    
    let optionLabel = ''
    if (selectedOption === 'Panas') optionLabel = translate('hot')
    else if (selectedOption === 'Sejuk') optionLabel = translate('cold')
    else if (selectedOption === 'Bungkus') optionLabel = translate('takeaway')
    
    setCart([...cart, { 
      id: `${selectedDrink.id}_${selectedOption}_${Date.now()}`,
      name: `${selectedDrink.name} (${optionLabel})`,
      price: selected.price,
      quantity: 1,
      is_free: false,
      is_promo_item: false,
      category: 'Minuman',
      option_type: selectedOption
    }])
    setShowDrinkModal(false)
    setSelectedDrink(null)
    setShowCart(true)
    toast.success(`✓ ${selectedDrink.name} (${optionLabel}) ${translate('added')}`)
  }

  const addToCart = (item) => {
    setClickedItemId(item.id)
    setTimeout(() => setClickedItemId(null), 250)
    
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
    
    const hasDrinkOpts = drinkOptions[item.name] && drinkOptions[item.name].length > 0
    const isDrink = item.category === 'Minuman'
    
    if (hasDrinkOpts || isDrink) {
      openDrinkOptions(item)
    } else {
      addToCartDirect(item)
    }
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
        name: `${promoItem.free_item.name} (${translate('free')})`,
        price: 0,
        quantity: 1,
        is_free: true,
        is_promo_item: true,
        promo_name: promoItem.promo_name,
        original_price: promoItem.free_item.price,
        category: promoItem.free_item.category || 'Makanan'
      }
      setCart([...cart, triggerItem, freeItem])
      toast.success(`${promoItem.trigger_item.name} + ${translate('free')} ${promoItem.free_item.name}!`)
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
        name: `[PROMO] ${promoItem.name}`,
        price: promoItem.price,
        quantity: 1,
        is_free: false,
        is_promo_item: true,
        promo_name: promoItem.promo_name,
        promo_type: promoItem.type,
        bundle_items_count: promoItem.items.length
      }
      
      setCart([...cart, ...bundleItems, promoLineItem])
      toast.success(`${promoItem.name} ${translate('added')}! ${translate('save')} RM ${(promoItem.original_price - promoItem.price).toFixed(2)}`)
    }
    
    setShowCart(true)
  }

  const addSpecialToCart = (item) => {
    setAddingItem(`special_${item.id}`)
    setTimeout(() => setAddingItem(null), 300)
    const existing = cart.find(x => x.id === `special_${item.id}`)
    if (existing) {
      setCart(cart.map(x => x.id === `special_${item.id}` ? { ...x, quantity: x.quantity + 1 } : x))
      toast.success(`✓ ${item.name} (x${existing.quantity + 1})`)
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
      toast.success(`✓ ${item.name} (${translate('special_today')}) ${translate('added')}`)
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

  // ============================================================
  // ORDER FUNCTIONS
  // ============================================================
  const handlePlaceOrder = () => {
    if (cart.length === 0) { toast.error(translate('empty_cart')); return }
    if (!tableNumber) { toast.error(translate('table_required')); return }
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
      option_name: item.option_name || null,
      option_type: item.option_type || null,
      category: item.category || 'Makanan'
    }))
    
    const orderNumber = 'ORD-' + Date.now()
    setSubmittedOrderNumber(orderNumber)
    const total = getGrandTotal()
    const subtotal = getSubtotal()
    const serviceCharge = getServiceCharge()
    const tax = getTax()

    try {
      const { error } = await supabase.from('customer_orders').insert([{
        order_number: orderNumber,
        order_type: 'dine_in',
        table_number: parseInt(tableNumber),
        customer_name: customerName || 'Guest',
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
        toast.error(translate('error_submit') + ': ' + error.message)
      } else {
        setSubmitted(true)
        setCart([])
        setShowCart(false)
        toast.success(`✓ ${translate('order_number')} ${orderNumber} ${translate('order_sent')}`)
      }
    } catch (err) {
      console.error('Exception:', err)
      toast.error(translate('error_submit'))
    }
  }

  // ============================================================
  // CART HELPERS
  // ============================================================
  const getSubtotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const getServiceCharge = () => getSubtotal() * (serviceChargePercent / 100)
  const getTax = () => getSubtotal() * (taxPercent / 100)
  const getGrandTotal = () => getSubtotal() + getServiceCharge() + getTax()
  const getCartItemCount = () => cart.reduce((sum, item) => sum + item.quantity, 0)

  // ============================================================
  // FILTERS - SHOW ALL CATEGORIES (SYNC WITH STAFFAPP)
  // ============================================================
  const allCategories = getCategoriesForMenu()
  
  const categoryNames = ['All']
  allCategories.forEach(cat => categoryNames.push(cat))
  
  if (promoItems.length > 0 && !categoryNames.includes('🔥 Promosi')) {
    categoryNames.unshift('🔥 Promosi')
  }
  
  // ============================================================
  // GET FILTERED MENU - SHOW PARENT + SUB CATEGORIES (FOR ALL CATEGORIES)
  // ============================================================
  const getFilteredMenu = () => {
    if (selectedCategory === '🔥 Promosi') {
      return promoItems
    }
    if (selectedCategory === 'All') {
      return menu
    }
    
    // Check if selected category is a parent category
    const selectedCat = categories.find(c => c.name === selectedCategory)
    const isParentCategory = selectedCat?.parent_id === null
    
    if (isParentCategory) {
      // If parent category, show all items in this parent + its sub-categories
      const subCategoryNames = categories
        .filter(c => c.parent_id === selectedCat.id)
        .map(c => c.name)
      
      return menu.filter(item => 
        item.category === selectedCategory || 
        subCategoryNames.includes(item.category)
      )
    }
    
    // If sub-category, show only items in that sub-category
    return menu.filter(item => item.category === selectedCategory)
  }

  const filteredMenu = getFilteredMenu()
  const menuGridCols = isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))'

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
        <style>{`
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(245,158,11,0.15);
            border-top-color: #f59e0b;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  const cartItemCount = getCartItemCount()

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ minHeight: '100vh', background: bgColor }}>
      
      {/* ===== HERO BANNER ===== */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
        padding: isMobile ? '20px 16px' : '32px 24px',
        textAlign: 'center',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {restaurantLogo ? (
                <img 
                  src={restaurantLogo}
                  alt={restaurantName}
                  style={{ 
                    height: isMobile ? '36px' : '48px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.15)',
                    padding: '6px',
                    backdropFilter: 'blur(4px)'
                  }}
                />
              ) : (
                <span style={{ fontSize: isMobile ? '28px' : '36px' }}>🏪</span>
              )}
              <div>
                <h1 style={{ 
                  margin: 0,
                  fontSize: isMobile ? '14px' : '18px',
                  fontWeight: 'bold'
                }}>
                  {restaurantName}
                </h1>
                <p style={{ 
                  margin: 0,
                  fontSize: isMobile ? '8px' : '11px',
                  opacity: 0.8
                }}>
                  {translate('scan_qr')}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                onClick={toggleDarkMode}
                style={{ 
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  padding: isMobile ? '6px 10px' : '8px 12px',
                  border: 'none',
                  borderRadius: '30px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '11px' : '13px',
                  transition: 'all 0.2s'
                }}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              <button 
                onClick={() => setLanguage(language === 'bm' ? 'en' : 'bm')}
                style={{ 
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  padding: isMobile ? '6px 10px' : '8px 12px',
                  border: 'none',
                  borderRadius: '30px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '11px' : '13px',
                  transition: 'all 0.2s'
                }}
              >
                {language === 'bm' ? '🇺🇸' : '🇲🇾'}
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
            <div style={{ 
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '50px',
              padding: isMobile ? '4px 12px' : '6px 16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid rgba(255,255,255,0.15)'
            }}>
              <span style={{ fontSize: isMobile ? '16px' : '20px' }}>📋</span>
              <input 
                type="number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder={translate('table_no')}
                style={{ 
                  padding: isMobile ? '6px 0' : '10px 0',
                  width: isMobile ? '60px' : '90px',
                  textAlign: 'center',
                  border: 'none',
                  outline: 'none',
                  fontSize: isMobile ? '14px' : '18px',
                  fontWeight: 'bold',
                  background: 'transparent',
                  color: '#ffffff',
                  caretColor: '#ffffff',
                  WebkitTextFillColor: '#ffffff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}
              />
              <span style={{ fontSize: isMobile ? '16px' : '20px' }}>🪑</span>
            </div>
          </div>
          
          {!tableNumber && (
            <p style={{ 
              marginTop: '8px',
              fontSize: isMobile ? '9px' : '11px',
              opacity: 0.9,
              background: 'rgba(0,0,0,0.2)',
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '30px',
              color: 'white'
            }}>
              ⚠️ {translate('enter_table')}
            </p>
          )}
        </div>
      </div>

      {/* ===== REAL-TIME INDICATOR ===== */}
      <div style={{ 
        maxWidth: '1280px',
        margin: '6px auto 0 auto',
        padding: isMobile ? '0 12px' : '0 20px',
        textAlign: 'right',
        fontSize: '9px',
        color: successColor,
        opacity: 0.7
      }}>
        <span>🔄 {translate('live')}</span>
      </div>

      {/* ===== SPECIAL MENU BANNER ===== */}
      {specialMenuEnabled && specialMenuItems.length > 0 && (
        <div style={{ maxWidth: '1280px', margin: '12px auto', padding: isMobile ? '0 12px' : '0 20px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
            borderRadius: '16px',
            padding: isMobile ? '12px 16px' : '16px 20px',
            border: `2px solid ${accentColor}`,
            boxShadow: '0 4px 16px rgba(245,158,11,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: isMobile ? '20px' : '28px' }}>⭐</span>
              <h2 style={{ 
                margin: 0,
                color: '#92400e',
                fontSize: isMobile ? '14px' : '18px',
                fontWeight: 'bold'
              }}>
                {specialMenuTitle}
              </h2>
              <span style={{ 
                background: dangerColor,
                color: 'white',
                padding: '2px 10px',
                borderRadius: '20px',
                fontSize: isMobile ? '8px' : '10px',
                fontWeight: 'bold'
              }}>
                🔥 HOT
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {specialMenuItems.slice(0, isMobile ? 6 : 10).map((item, idx) => {
                const hasSizeOptions = item.has_options === true
                const isAdding = addingItem === `special_${item.id}`
                
                return (
                  <div 
                    key={idx}
                    style={{ 
                      background: 'white',
                      borderRadius: '50px',
                      padding: isMobile ? '4px 10px' : '6px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: hasSizeOptions ? `2px solid ${accentColor}` : 'none',
                      cursor: hasSizeOptions ? 'pointer' : 'default'
                    }}
                  >
                    {item.image_url ? (
                      <img 
                        src={item.image_url}
                        alt={item.name}
                        style={{ 
                          width: isMobile ? '20px' : '28px',
                          height: isMobile ? '20px' : '28px',
                          borderRadius: '6px',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <span>⭐</span>
                    )}
                    <span style={{ 
                      fontWeight: 'bold',
                      fontSize: isMobile ? '11px' : '13px',
                      color: '#1e293b'
                    }}>
                      {item.name}
                    </span>
                    
                    {hasSizeOptions ? (
                      <span style={{ 
                        color: accentColor,
                        fontWeight: 'bold',
                        fontSize: isMobile ? '9px' : '10px',
                        background: '#fef3c7',
                        padding: '2px 8px',
                        borderRadius: '20px'
                      }}>
                        📏 {translate('select_size_btn')}
                      </span>
                    ) : (
                      <span style={{ 
                        color: successColor,
                        fontWeight: 'bold',
                        background: '#dcfce7',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        fontSize: isMobile ? '10px' : '11px'
                      }}>
                        RM {item.price}
                      </span>
                    )}
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        if (hasSizeOptions && item.menu_id) {
                          loadMenuOptions(item.menu_id).then(options => {
                            if (options && options.length > 0) {
                              setSelectedSizeItem({ ...item, id: item.menu_id, price: item.price })
                              setMenuOptions(options)
                              setShowSizeModal(true)
                            }
                          })
                        } else {
                          addSpecialToCart(item)
                        }
                      }}
                      style={{ 
                        background: isAdding ? successColor : (hasSizeOptions ? accentColor : successColor),
                        color: 'white',
                        border: 'none',
                        borderRadius: '30px',
                        padding: isMobile ? '2px 8px' : '4px 12px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: isMobile ? '9px' : '10px'
                      }}
                    >
                      {isAdding ? '✓' : (hasSizeOptions ? '📏' : '+')}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== PROMO BANNER ===== */}
      {activePromos.length > 0 && (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '0 12px' : '0 20px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            borderRadius: '16px',
            padding: isMobile ? '10px 14px' : '16px 20px',
            boxShadow: '0 4px 16px rgba(139,92,246,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: isMobile ? '18px' : '24px' }}>🏷️</span>
              <span style={{ 
                fontWeight: 'bold',
                color: 'white',
                fontSize: isMobile ? '12px' : '14px'
              }}>
                {translate('promotions')}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {activePromos.slice(0, isMobile ? 2 : 3).map(promo => (
                <div key={promo.id} style={{ 
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: '10px',
                  padding: isMobile ? '6px 10px' : '8px 14px'
                }}>
                  <div style={{ 
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: isMobile ? '11px' : '13px'
                  }}>
                    {promo.name}
                  </div>
                  {promo.type === 'bogo' && (
                    <div style={{ 
                      fontSize: isMobile ? '10px' : '11px',
                      color: 'rgba(255,255,255,0.9)',
                      marginTop: '2px'
                    }}>
                      🎁 {translate('buy')} <strong>{promo.trigger_items?.[0]?.name || 'item'}</strong> {translate('get_free')} <strong>{promo.free_items?.[0]?.name || 'item'}</strong> {translate('free')}!
                    </div>
                  )}
                  {promo.type === 'set_menu' && (
                    <div style={{ 
                      fontSize: isMobile ? '10px' : '11px',
                      color: 'rgba(255,255,255,0.9)',
                      marginTop: '2px'
                    }}>
                      🍽️ <strong>{promo.bundle_items?.map(i => i.name).join(' + ')}</strong> — {translate('only')} <strong>RM {promo.bundle_price}</strong>
                    </div>
                  )}
                  {promo.type === 'bundle' && (
                    <div style={{ 
                      fontSize: isMobile ? '10px' : '11px',
                      color: 'rgba(255,255,255,0.9)',
                      marginTop: '2px'
                    }}>
                      📦 <strong>{promo.bundle_items?.map(i => i.name).join(' + ')}</strong> — {translate('only')} <strong>RM {promo.bundle_price}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== CATEGORY FILTERS - SHOW ALL ===== */}
      <div style={{ maxWidth: '1280px', margin: '12px auto', padding: isMobile ? '0 12px' : '0 20px' }}>
        <div style={{ 
          display: 'flex',
          gap: '6px',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          paddingBottom: '8px',
          scrollbarWidth: 'thin'
        }}>
          {categoryNames.map(cat => {
            const icon = getCategoryIcon(cat)
            const isActive = selectedCategory === cat
            
            return (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{ 
                  padding: isMobile ? '6px 12px' : '8px 18px',
                  background: isActive ? `linear-gradient(135deg, ${accentColor}, #d97706)` : (darkMode ? 'rgba(255,255,255,0.05)' : 'white'),
                  color: isActive ? 'white' : textColor,
                  border: isActive ? 'none' : `1px solid ${borderColor}`,
                  borderRadius: '50px',
                  cursor: 'pointer',
                  fontWeight: isActive ? 'bold' : '500',
                  fontSize: isMobile ? '11px' : '13px',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 4px 16px rgba(245,158,11,0.3)' : 'none'
                }}
              >
                {icon} {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* ===== MENU GRID ===== */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '0 12px 20px 12px' : '0 20px 32px 20px' }}>
        {filteredMenu.length === 0 ? (
          <div style={{ 
            textAlign: 'center',
            padding: isMobile ? '40px 20px' : '60px 20px',
            ...glassEffect,
            borderRadius: '20px'
          }}>
            <span style={{ fontSize: isMobile ? '40px' : '56px', opacity: 0.5 }}>🍽️</span>
            <p style={{ color: textMuted, marginTop: '10px', fontSize: isMobile ? '13px' : '14px' }}>
              {translate('no_menu_category')}
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: menuGridCols,
            gap: isMobile ? '12px' : '16px'
          }}>
            {filteredMenu.map(item => {
              const isPromoItem = item.type === 'set_menu' || item.type === 'bundle' || item.type === 'bogo'
              const hasDrinkOptions = !isPromoItem && drinkOptions[item.name] && drinkOptions[item.name].length > 0
              const hasImage = item.image_url && item.image_url.trim() !== ''
              const panasPrice = hasDrinkOptions ? drinkOptions[item.name]?.find(o => o.type === 'Panas')?.price : null
              const sejukPrice = hasDrinkOptions ? drinkOptions[item.name]?.find(o => o.type === 'Sejuk')?.price : null
              const isAdding = addingItem === item.id
              const isClicked = clickedItemId === item.id
              const hasSizeOptions = item.has_options === true
              const hasDescription = item.description && item.description.trim() !== ''
              
              return (
                <div 
                  key={item.id}
                  style={{ 
                    ...glassEffect,
                    borderRadius: isMobile ? '16px' : '20px',
                    overflow: 'hidden',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    transform: isClicked ? 'scale(0.97)' : 'scale(1)',
                    border: isClicked ? `2px solid ${successColor}` : 'none'
                  }}
                  onClick={() => {
                    setClickedItemId(item.id)
                    setTimeout(() => setClickedItemId(null), 250)
                    if (isPromoItem) addPromoToCart(item)
                    else addToCart(item)
                  }}
                  onMouseEnter={e => {
                    if (!isClicked) {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = darkMode 
                        ? '0 12px 40px rgba(0,0,0,0.4)' 
                        : '0 12px 40px rgba(0,0,0,0.12)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isClicked) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  <div style={{ 
                    background: isPromoItem ? '#f3e8ff' : (darkMode ? '#1a1a2e' : '#fef3c7'),
                    padding: isMobile ? '16px' : '20px',
                    textAlign: 'center',
                    position: 'relative'
                  }}>
                    {isPromoItem && (
                      <div style={{ 
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: '#8b5cf6',
                        color: 'white',
                        fontSize: isMobile ? '7px' : '9px',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        fontWeight: 'bold'
                      }}>
                        {translate('promo')}
                      </div>
                    )}
                    {hasSizeOptions && (
                      <div style={{ 
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        background: accentColor,
                        color: 'white',
                        fontSize: isMobile ? '7px' : '9px',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        fontWeight: 'bold'
                      }}>
                        📏
                      </div>
                    )}
                    {hasImage ? (
                      <img 
                        src={item.image_url}
                        alt={item.name}
                        style={{ 
                          width: isMobile ? '60px' : '80px',
                          height: isMobile ? '60px' : '80px',
                          objectFit: 'cover',
                          borderRadius: '12px',
                          margin: '0 auto'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.parentElement.innerHTML = `<span style="font-size:${isMobile ? '32px' : '44px'}">${isPromoItem ? '🏷️' : getDefaultIcon(item.category)}</span>`
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: isMobile ? '32px' : '44px' }}>
                        {isPromoItem ? '🏷️' : getDefaultIcon(item.category)}
                      </span>
                    )}
                  </div>
                  
                  <div style={{ padding: isMobile ? '10px 12px' : '14px 16px', textAlign: 'center' }}>
                    <h3 style={{ 
                      margin: '0 0 4px 0',
                      fontSize: isMobile ? '12px' : '14px',
                      fontWeight: 'bold',
                      color: textColor
                    }}>
                      {item.name}
                    </h3>
                    
                    {hasDescription && (
                      <div style={{ 
                        fontSize: isMobile ? '9px' : '10px',
                        color: textMuted,
                        fontStyle: 'italic',
                        marginBottom: '4px',
                        background: darkMode ? 'rgba(255,255,255,0.05)' : secondaryBg,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: `1px solid ${borderColor}`
                      }}>
                        📝 {item.description}
                      </div>
                    )}
                    
                    {isPromoItem && item.original_price && (
                      <div style={{ marginBottom: '4px' }}>
                        <span style={{ 
                          fontSize: isMobile ? '9px' : '10px',
                          color: '#94a3b8',
                          textDecoration: 'line-through',
                          marginRight: '4px'
                        }}>
                          RM {item.original_price.toFixed(2)}
                        </span>
                        <span style={{ 
                          fontSize: isMobile ? '12px' : '14px',
                          fontWeight: 'bold',
                          color: '#8b5cf6'
                        }}>
                          RM {item.price.toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {hasDrinkOptions ? (
                      <div style={{ 
                        marginBottom: '6px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '4px'
                      }}>
                        {panasPrice && (
                          <span style={{ 
                            color: '#f97316',
                            fontSize: isMobile ? '8px' : '10px',
                            fontWeight: 'bold'
                          }}>
                            🔥 RM {panasPrice?.toFixed(2)}
                          </span>
                        )}
                        {sejukPrice && (
                          <span style={{ 
                            color: '#06b6d4',
                            fontSize: isMobile ? '8px' : '10px',
                            fontWeight: 'bold'
                          }}>
                            🧊 RM {sejukPrice?.toFixed(2)}
                          </span>
                        )}
                      </div>
                    ) : !isPromoItem && !hasSizeOptions && (
                      <div style={{ 
                        fontSize: isMobile ? '14px' : '18px',
                        fontWeight: 'bold',
                        color: successColor,
                        marginBottom: '4px'
                      }}>
                        RM {item.price?.toFixed(2)}
                      </div>
                    )}
                    
                    {hasSizeOptions && (
                      <div style={{ 
                        fontSize: isMobile ? '10px' : '12px',
                        fontWeight: 'bold',
                        color: accentColor,
                        marginBottom: '4px'
                      }}>
                        {translate('select_size_btn')}
                      </div>
                    )}
                    
                    <div style={{ 
                      width: '100%',
                      padding: isMobile ? '6px' : '8px',
                      background: isAdding ? successColor : (isPromoItem ? '#8b5cf6' : accentColor),
                      color: 'white',
                      borderRadius: '40px',
                      fontWeight: 'bold',
                      fontSize: isMobile ? '10px' : '12px',
                      transition: 'all 0.2s'
                    }}>
                      {isAdding ? translate('added') : (isPromoItem ? translate('buy_promo') : (hasSizeOptions ? translate('select_size_btn') : translate('add')))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* MODALS - Same as before but with better colors */}
      {/* ========================================================== */}

      {/* ===== SIZE OPTIONS MODAL ===== */}
      {showSizeModal && selectedSizeItem && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 2000, animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{ 
            background: cardBg,
            borderRadius: '24px',
            padding: isMobile ? '20px' : '28px',
            maxWidth: '380px',
            width: '90%',
            textAlign: 'center',
            ...glassEffect,
            animation: 'popIn 0.3s ease'
          }}>
            <div style={{ fontSize: isMobile ? '36px' : '48px', marginBottom: '8px' }}>🍽️</div>
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
              {translate('choose_size')}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {menuOptions.map(opt => {
                const finalPrice = opt.is_absolute_price 
                  ? opt.price_adjustment
                  : (selectedSizeItem.price + opt.price_adjustment)
                return (
                  <button 
                    key={opt.id}
                    onClick={() => addToCartWithOption(selectedSizeItem, opt)}
                    style={{ 
                      padding: isMobile ? '12px 16px' : '14px 20px',
                      background: `linear-gradient(135deg, ${accentColor}, #d97706)`,
                      color: 'white',
                      border: 'none',
                      borderRadius: '50px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: isMobile ? '14px' : '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s'
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
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              ❌ {translate('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* ===== DRINK OPTIONS MODAL ===== */}
      {showDrinkModal && selectedDrink && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 2000, animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{ 
            background: cardBg,
            borderRadius: '24px',
            padding: isMobile ? '20px' : '28px',
            maxWidth: '380px',
            width: '90%',
            textAlign: 'center',
            ...glassEffect,
            animation: 'popIn 0.3s ease'
          }}>
            <h2 style={{ 
              marginBottom: '6px',
              fontSize: isMobile ? '18px' : '22px',
              fontWeight: 'bold',
              color: textColor
            }}>
              🥤 {selectedDrink.name}
            </h2>
            <p style={{ 
              color: textMuted,
              marginBottom: '20px',
              fontSize: isMobile ? '12px' : '14px'
            }}>
              {translate('drink_type')}
            </p>
            
            <div style={{ 
              display: 'flex',
              gap: '10px',
              marginBottom: '20px',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {drinkOptions[selectedDrink.name]?.some(o => o.type === 'Panas') && (
                <button 
                  onClick={() => setSelectedOption('Panas')}
                  style={{ 
                    flex: 1,
                    minWidth: isMobile ? '70px' : '90px',
                    padding: isMobile ? '12px' : '14px',
                    background: selectedOption === 'Panas' ? 'linear-gradient(135deg, #f97316, #ea580c)' : secondaryBg,
                    color: selectedOption === 'Panas' ? 'white' : textColor,
                    border: selectedOption === 'Panas' ? 'none' : `1px solid ${borderColor}`,
                    borderRadius: '14px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '11px' : '13px',
                    transition: 'all 0.2s'
                  }}
                >
                  🔥 {translate('hot')}
                  <br />
                  <small>RM {drinkOptions[selectedDrink.name]?.find(o => o.type === 'Panas')?.price?.toFixed(2) || '0.00'}</small>
                </button>
              )}
              
              {drinkOptions[selectedDrink.name]?.some(o => o.type === 'Sejuk') && (
                <button 
                  onClick={() => setSelectedOption('Sejuk')}
                  style={{ 
                    flex: 1,
                    minWidth: isMobile ? '70px' : '90px',
                    padding: isMobile ? '12px' : '14px',
                    background: selectedOption === 'Sejuk' ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : secondaryBg,
                    color: selectedOption === 'Sejuk' ? 'white' : textColor,
                    border: selectedOption === 'Sejuk' ? 'none' : `1px solid ${borderColor}`,
                    borderRadius: '14px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '11px' : '13px',
                    transition: 'all 0.2s'
                  }}
                >
                  🧊 {translate('cold')}
                  <br />
                  <small>RM {drinkOptions[selectedDrink.name]?.find(o => o.type === 'Sejuk')?.price?.toFixed(2) || '0.00'}</small>
                </button>
              )}
            </div>
            
            <button 
              onClick={addDrinkToCart}
              style={{ 
                width: '100%',
                padding: isMobile ? '12px' : '14px',
                background: `linear-gradient(135deg, ${successColor}, #16a34a)`,
                color: 'white',
                border: 'none',
                borderRadius: '40px',
                cursor: 'pointer',
                fontWeight: 'bold',
                marginBottom: '10px',
                fontSize: isMobile ? '13px' : '14px',
                transition: 'all 0.2s'
              }}
            >
              {translate('add_to_cart')}
            </button>
            <button 
              onClick={() => setShowDrinkModal(false)}
              style={{ 
                width: '100%',
                padding: isMobile ? '12px' : '14px',
                background: '#64748b',
                color: 'white',
                border: 'none',
                borderRadius: '40px',
                cursor: 'pointer',
                fontSize: isMobile ? '13px' : '14px',
                transition: 'all 0.2s'
              }}
            >
              {translate('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* FLOATING CART BUTTON */}
      {/* ========================================================== */}
      {cartItemCount > 0 && (
        <button 
          onClick={() => setShowCart(true)}
          style={{ 
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            width: isMobile ? '48px' : '60px',
            height: isMobile ? '48px' : '60px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${accentColor}, #d97706)`,
            color: 'white',
            border: 'none',
            fontSize: isMobile ? '20px' : '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(245,158,11,0.4)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          🛒
          <span style={{ 
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: dangerColor,
            color: 'white',
            borderRadius: '50%',
            width: isMobile ? '18px' : '22px',
            height: isMobile ? '18px' : '22px',
            fontSize: isMobile ? '9px' : '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {cartItemCount}
          </span>
        </button>
      )}

      {/* ===== CART DRAWER ===== */}
      {showCart && (
        <div style={{ 
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: isMobile ? '100%' : '400px',
          background: cardBg,
          boxShadow: '-4px 0 40px rgba(0,0,0,0.2)',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.3s ease'
        }}>
          
          <div style={{ 
            padding: isMobile ? '14px 16px' : '18px 20px',
            borderBottom: `1px solid ${borderColor}`,
            background: `linear-gradient(135deg, ${accentColor}, #d97706)`,
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', color: 'white' }}>
                {translate('your_order')} ({cartItemCount})
              </h2>
              <button 
                onClick={() => setShowCart(false)}
                style={{ 
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s'
                }}
              >
                ✕
              </button>
            </div>
          </div>
          
          <div style={{ 
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '14px' : '18px'
          }}>
            {cart.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: textMuted, 
                padding: '40px 20px',
                fontSize: isMobile ? '13px' : '14px'
              }}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🛒</span>
                {translate('empty_cart_msg')}
              </div>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.id} style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                    paddingBottom: '8px',
                    borderBottom: `1px solid ${borderColor}`
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: 'bold',
                        fontSize: isMobile ? '12px' : '13px',
                        color: textColor
                      }}>
                        {item.name}
                        {item.is_free && (
                          <span style={{ 
                            color: successColor,
                            fontSize: '9px',
                            marginLeft: '4px'
                          }}>
                            ({translate('free')})
                          </span>
                        )}
                        {item.is_promo_item && (
                          <span style={{ 
                            color: '#8b5cf6',
                            fontSize: '9px',
                            marginLeft: '4px'
                          }}>
                            (PROMO)
                          </span>
                        )}
                      </div>
                      <div style={{ 
                        fontSize: isMobile ? '9px' : '10px',
                        color: textMuted
                      }}>
                        x{item.quantity}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        fontWeight: 'bold',
                        color: successColor,
                        fontSize: isMobile ? '12px' : '13px'
                      }}>
                        RM {(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        style={{ 
                          background: dangerColor,
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: isMobile ? '20px' : '24px',
                          height: isMobile ? '20px' : '24px',
                          cursor: 'pointer',
                          fontSize: isMobile ? '9px' : '10px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                
                <div style={{ 
                  background: secondaryBg,
                  borderRadius: '14px',
                  padding: isMobile ? '12px' : '14px',
                  marginTop: '10px'
                }}>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                    fontSize: isMobile ? '11px' : '12px',
                    color: textColor
                  }}>
                    <span>{translate('subtotal')}:</span>
                    <span>RM {getSubtotal().toFixed(2)}</span>
                  </div>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                    fontSize: isMobile ? '11px' : '12px',
                    color: textColor
                  }}>
                    <span>{translate('service')} ({serviceChargePercent}%):</span>
                    <span>RM {getServiceCharge().toFixed(2)}</span>
                  </div>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                    fontSize: isMobile ? '11px' : '12px',
                    color: textColor
                  }}>
                    <span>{translate('tax')} ({taxPercent}%):</span>
                    <span>RM {getTax().toFixed(2)}</span>
                  </div>
                  <div style={{ 
                    borderTop: `1px solid ${borderColor}`,
                    marginTop: '6px',
                    paddingTop: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '14px' : '16px',
                    color: textColor
                  }}>
                    <span>{translate('total')}:</span>
                    <span style={{ color: successColor }}>RM {getGrandTotal().toFixed(2)}</span>
                  </div>
                </div>
                
                <input 
                  type="text"
                  placeholder={translate('your_name')}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: isMobile ? '10px 12px' : '12px',
                    marginTop: '10px',
                    marginBottom: '8px',
                    borderRadius: '12px',
                    border: `1px solid ${borderColor}`,
                    outline: 'none',
                    fontSize: isMobile ? '13px' : '14px',
                    color: textColor,
                    background: inputBg,
                    transition: 'all 0.2s'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = accentColor}
                  onBlur={e => e.currentTarget.style.borderColor = borderColor}
                />
                <input 
                  type="tel"
                  placeholder={translate('phone_optional')}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: isMobile ? '10px 12px' : '12px',
                    marginBottom: '8px',
                    borderRadius: '12px',
                    border: `1px solid ${borderColor}`,
                    outline: 'none',
                    fontSize: isMobile ? '13px' : '14px',
                    color: textColor,
                    background: inputBg,
                    transition: 'all 0.2s'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = accentColor}
                  onBlur={e => e.currentTarget.style.borderColor = borderColor}
                />
                <textarea 
                  placeholder={translate('special_notes')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="2"
                  style={{ 
                    width: '100%',
                    padding: isMobile ? '10px 12px' : '12px',
                    marginBottom: '8px',
                    borderRadius: '12px',
                    border: `1px solid ${borderColor}`,
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: isMobile ? '13px' : '14px',
                    color: textColor,
                    background: inputBg,
                    transition: 'all 0.2s'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = accentColor}
                  onBlur={e => e.currentTarget.style.borderColor = borderColor}
                />
              </>
            )}
          </div>
          
          <div style={{ 
            padding: isMobile ? '14px 16px' : '16px 20px',
            borderTop: `1px solid ${borderColor}`,
            background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setShowCart(false)}
                style={{ 
                  flex: 1,
                  padding: isMobile ? '10px' : '12px',
                  background: '#64748b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '40px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: isMobile ? '12px' : '13px',
                  transition: 'all 0.2s'
                }}
              >
                {translate('back_to_menu')}
              </button>
              <button 
                onClick={handlePlaceOrder}
                disabled={!tableNumber || cart.length === 0}
                style={{ 
                  flex: 1,
                  padding: isMobile ? '10px' : '12px',
                  background: (!tableNumber || cart.length === 0) ? '#cbd5e1' : `linear-gradient(135deg, ${accentColor}, #d97706)`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '40px',
                  cursor: (!tableNumber || cart.length === 0) ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '12px' : '13px',
                  fontWeight: 'bold',
                  boxShadow: (!tableNumber || cart.length === 0) ? 'none' : '0 4px 16px rgba(245,158,11,0.3)',
                  transition: 'all 0.2s'
                }}
              >
                {!tableNumber ? `📋 ${translate('table_required')}` : translate('place_order')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CONFIRMATION MODAL ===== */}
      {showConfirmModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 2000, animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{ 
            background: cardBg,
            borderRadius: '28px',
            padding: isMobile ? '20px' : '28px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            ...glassEffect,
            animation: 'popIn 0.3s ease'
          }}>
            <div style={{ 
              width: isMobile ? '48px' : '56px',
              height: isMobile ? '48px' : '56px',
              background: '#fef3c7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}>
              <span style={{ fontSize: isMobile ? '24px' : '28px' }}>📋</span>
            </div>
            <h2 style={{ 
              marginBottom: '6px',
              fontSize: isMobile ? '18px' : '22px',
              fontWeight: 'bold',
              color: textColor
            }}>
              {translate('confirm_order')}
            </h2>
            <p style={{ 
              color: textMuted,
              marginBottom: '16px',
              fontSize: isMobile ? '12px' : '14px'
            }}>
              {translate('review_order')}
            </p>
            
            <div style={{ 
              background: secondaryBg,
              borderRadius: '14px',
              padding: isMobile ? '12px' : '16px',
              marginBottom: '16px',
              textAlign: 'left'
            }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
                fontSize: isMobile ? '12px' : '13px',
                color: textColor
              }}>
                <span style={{ color: textMuted }}>{translate('table')}:</span>
                <span style={{ fontWeight: 'bold' }}>{tableNumber}</span>
              </div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
                fontSize: isMobile ? '12px' : '13px',
                color: textColor
              }}>
                <span style={{ color: textMuted }}>{translate('customer')}:</span>
                <span style={{ fontWeight: 'bold' }}>{customerName || translate('guest')}</span>
              </div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '6px',
                paddingTop: '6px',
                borderTop: `1px solid ${borderColor}`,
                fontSize: isMobile ? '12px' : '13px',
                color: textColor
              }}>
                <span style={{ fontWeight: 'bold' }}>{translate('total_items')}:</span>
                <span style={{ fontWeight: 'bold' }}>{getCartItemCount()}</span>
              </div>
            </div>
            
            <div style={{ 
              background: '#fef3c7',
              borderRadius: '14px',
              padding: isMobile ? '12px' : '16px',
              marginBottom: '20px'
            }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 'bold',
                fontSize: isMobile ? '16px' : '18px',
                color: '#1e293b'
              }}>
                <span>{translate('total_amount')}:</span>
                <span style={{ color: successColor }}>RM {getGrandTotal().toFixed(2)}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => { setShowConfirmModal(false); setShowCart(true) }}
                style={{ 
                  flex: 1,
                  padding: isMobile ? '10px' : '12px',
                  background: '#64748b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '40px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: isMobile ? '12px' : '13px',
                  transition: 'all 0.2s'
                }}
              >
                {translate('back')}
              </button>
              <button 
                onClick={() => setShowConfirmModal(false)}
                style={{ 
                  flex: 1,
                  padding: isMobile ? '10px' : '12px',
                  background: 'transparent',
                  color: '#64748b',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '40px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '12px' : '13px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
              >
                {translate('close')}
              </button>
              <button 
                onClick={submitOrderConfirmed}
                style={{ 
                  flex: 1,
                  padding: isMobile ? '10px' : '12px',
                  background: `linear-gradient(135deg, ${successColor}, #16a34a)`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '40px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: isMobile ? '12px' : '13px',
                  boxShadow: '0 4px 16px rgba(34,197,94,0.3)',
                  transition: 'all 0.2s'
                }}
              >
                {translate('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* STYLES */}
      {/* ========================================================== */}
      <style>
        {`
          @keyframes slideIn { 
            from { transform: translateX(100%); } 
            to { transform: translateX(0); } 
          }
          
          @keyframes fadeIn { 
            from { opacity: 0; } 
            to { opacity: 1; } 
          }
          
          @keyframes popIn { 
            0% { opacity: 0; transform: scale(0.9) translateY(10px); } 
            100% { opacity: 1; transform: scale(1) translateY(0); } 
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
          
          button, input, textarea, select { 
            transition: all 0.2s ease; 
          }
          
          button:hover:not(:disabled) { 
            opacity: 0.88; 
            transform: scale(0.97); 
          }
          
          button:active:not(:disabled) {
            transform: scale(0.93);
          }
          
          input:focus, textarea:focus { 
            outline: none; 
            border-color: ${accentColor};
            box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
          }
          
          /* Table number input - ALWAYS BLACK */
          input[type="number"] {
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
          }
          
          /* Dark mode override for table number */
          .dark-mode input[type="number"] {
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
          }
          
          .card-hover {
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          }
        `}
      </style>
    </div>
  )
}

export default CustomerMenu