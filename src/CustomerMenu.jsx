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
  // THEME COLORS - FONT JELAS UNTUK KEDUA-DUA MODE
  // ============================================================
  const bgColor = darkMode ? '#0a0a16' : '#fefce8'
  const cardBg = darkMode ? 'rgba(20, 20, 40, 0.95)' : 'rgba(255, 255, 255, 0.98)'
  
  // FONT COLORS - JELAS UNTUK KEDUA-DUA MODE
  const textColor = darkMode ? '#ffffff' : '#1e293b'
  const textMuted = darkMode ? '#cbd5e1' : '#64748b'
  const textLight = darkMode ? '#f8fafc' : '#0f172a'
  const textInput = darkMode ? '#ffffff' : '#1e293b'
  const textPrice = '#22c55e'
  
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.4)' : 'rgba(203, 213, 225, 0.4)'
  const inputBg = darkMode ? '#1a1a2e' : '#ffffff'
  const secondaryBg = darkMode ? 'rgba(30, 30, 50, 0.6)' : '#fef3c7'

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
  // GET CATEGORIES - SYNC WITH STAFFAPP + MANAGE MENU
  // ============================================================
  const getCategoriesForMenu = () => {
    // Get ALL categories from database (same as StaffApp)
    const allCats = categories
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map(cat => cat.name)
    
    // Sub-categories to hide (drink sub-categories)
    const hideCategories = ['Teh', 'Kopi', 'Jus', 'Air']
    
    // Filter out hidden sub-categories
    const filtered = allCats.filter(cat => !hideCategories.includes(cat))
    
    // Force 'Minuman' to appear (sync with Manage Menu)
    if (!filtered.includes('Minuman')) {
      filtered.push('Minuman')
    }
    
    return filtered
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
    if (catName === 'Minuman') return '🥤'
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
  // FILTERS - SYNC WITH STAFFAPP + MANAGE MENU
  // ============================================================
  const displayCategories = getCategoriesForMenu()
  
  // Build category names: 'All' + display categories
  const categoryNames = ['All']
  displayCategories.forEach(cat => categoryNames.push(cat))
  
  // Add Promo category if there are promotions
  if (promoItems.length > 0 && !categoryNames.includes('🔥 Promosi')) {
    categoryNames.unshift('🔥 Promosi')
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

  // ============================================================
  // GLASS EFFECT
  // ============================================================
  const glassEffect = {
    background: cardBg,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${borderColor}`,
    boxShadow: darkMode 
      ? '0 8px 40px rgba(0,0,0,0.5)'
      : '0 8px 40px rgba(0,0,0,0.06)'
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
        padding: isMobile ? '24px 16px' : '40px 24px',
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
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {restaurantLogo ? (
                <img 
                  src={restaurantLogo}
                  alt={restaurantName}
                  style={{ 
                    height: isMobile ? '36px' : '50px',
                    borderRadius: '10px',
                    background: 'white',
                    padding: '4px'
                  }}
                />
              ) : (
                <span style={{ fontSize: isMobile ? '32px' : '40px' }}>🏪</span>
              )}
              <div>
                <h1 style={{ 
                  margin: 0,
                  fontSize: isMobile ? '16px' : '20px',
                  fontWeight: 'bold'
                }}>
                  {restaurantName}
                </h1>
                <p style={{ 
                  margin: 0,
                  fontSize: isMobile ? '9px' : '12px',
                  opacity: 0.9
                }}>
                  {translate('scan_qr')}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={toggleDarkMode}
                style={{ 
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  padding: isMobile ? '6px 10px' : '8px 12px',
                  border: 'none',
                  borderRadius: '30px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: isMobile ? '12px' : '14px'
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
                  transition: 'all 0.2s',
                  fontSize: isMobile ? '12px' : '14px'
                }}
              >
                {language === 'bm' ? '🇺🇸 EN' : '🇲🇾 BM'}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
            <div style={{ 
              background: 'white',
              borderRadius: '50px',
              padding: isMobile ? '2px 16px' : '4px 20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <span style={{ fontSize: isMobile ? '18px' : '24px' }}>📋</span>
              <input 
                type="number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder={translate('table_no')}
                style={{ 
                  padding: isMobile ? '8px 0' : '12px 0',
                  width: isMobile ? '80px' : '120px',
                  textAlign: 'center',
                  border: 'none',
                  outline: 'none',
                  fontSize: isMobile ? '14px' : '18px',
                  fontWeight: 'bold',
                  background: 'transparent',
                  color: '#000000',
                  caretColor: '#000000',
                  WebkitTextFillColor: '#000000',
                }}
              />
              <span style={{ fontSize: isMobile ? '18px' : '24px' }}>🪑</span>
            </div>
          </div>
          {!tableNumber && (
            <p style={{ 
              marginTop: '10px',
              fontSize: isMobile ? '10px' : '12px',
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
        margin: '8px auto 0 auto',
        padding: isMobile ? '0 12px' : '0 20px',
        textAlign: 'right',
        fontSize: '10px',
        color: '#22c55e'
      }}>
        <span>🔄 {translate('live')}</span>
      </div>

      {/* ===== SPECIAL MENU BANNER ===== */}
      {specialMenuEnabled && specialMenuItems.length > 0 && (
        <div style={{ maxWidth: '1280px', margin: '16px auto', padding: isMobile ? '0 12px' : '0 20px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
            borderRadius: '20px',
            padding: isMobile ? '12px 16px' : '20px',
            border: '2px solid #f59e0b',
            boxShadow: '0 4px 16px rgba(245,158,11,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: isMobile ? '24px' : '32px' }}>⭐</span>
              <h2 style={{ 
                margin: 0,
                color: '#92400e',
                fontSize: isMobile ? '16px' : '20px',
                fontWeight: 'bold'
              }}>
                {specialMenuTitle}
              </h2>
              <span style={{ 
                background: '#ef4444',
                color: 'white',
                padding: '2px 10px',
                borderRadius: '20px',
                fontSize: isMobile ? '9px' : '11px',
                fontWeight: 'bold'
              }}>
                🔥 HOT
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {specialMenuItems.slice(0, isMobile ? 6 : 10).map((item, idx) => {
                const hasSizeOptions = item.has_options === true
                const isAdding = addingItem === `special_${item.id}`
                
                return (
                  <div 
                    key={idx}
                    style={{ 
                      background: 'white',
                      borderRadius: '50px',
                      padding: isMobile ? '4px 12px' : '8px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s',
                      cursor: hasSizeOptions ? 'pointer' : 'default',
                      border: hasSizeOptions ? '2px solid #f59e0b' : 'none'
                    }}
                    onClick={() => {
                      if (hasSizeOptions && item.menu_id) {
                        loadMenuOptions(item.menu_id).then(options => {
                          if (options && options.length > 0) {
                            setSelectedSizeItem({ ...item, id: item.menu_id, price: item.price })
                            setMenuOptions(options)
                            setShowSizeModal(true)
                          }
                        })
                      }
                    }}
                  >
                    {item.image_url ? (
                      <img 
                        src={item.image_url}
                        alt={item.name}
                        style={{ 
                          width: isMobile ? '24px' : '32px',
                          height: isMobile ? '24px' : '32px',
                          borderRadius: '6px',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <span>⭐</span>
                    )}
                    <span style={{ 
                      fontWeight: 'bold',
                      fontSize: isMobile ? '12px' : '14px',
                      color: '#1e293b'
                    }}>
                      {item.name}
                    </span>
                    
                    {hasSizeOptions ? (
                      <span style={{ 
                        color: '#f59e0b',
                        fontWeight: 'bold',
                        fontSize: isMobile ? '10px' : '12px',
                        background: '#fef3c7',
                        padding: '2px 8px',
                        borderRadius: '20px'
                      }}>
                        📏 {translate('select_size_btn')}
                      </span>
                    ) : (
                      <span style={{ 
                        color: '#16a34a',
                        fontWeight: 'bold',
                        background: '#dcfce7',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        fontSize: isMobile ? '11px' : '13px'
                      }}>
                        RM {item.price}
                      </span>
                    )}
                    
                    {item.description && (
                      <div style={{ 
                        fontSize: isMobile ? '8px' : '9px',
                        color: '#64748b',
                        fontStyle: 'italic',
                        marginLeft: '4px'
                      }}>
                        📝 {item.description}
                      </div>
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
                        background: isAdding ? '#22c55e' : (hasSizeOptions ? '#f59e0b' : '#22c55e'),
                        color: 'white',
                        border: 'none',
                        borderRadius: '30px',
                        padding: isMobile ? '2px 10px' : '4px 16px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: isMobile ? '10px' : '12px',
                        minWidth: '28px'
                      }}
                    >
                      {isAdding ? '✓' : (hasSizeOptions ? '📏' : '+')}
                    </button>
                  </div>
                )
              })}
            </div>
            
            {specialMenuItems.length > (isMobile ? 6 : 10) && (
              <div style={{ 
                textAlign: 'center',
                marginTop: '10px',
                color: '#78350f',
                fontSize: isMobile ? '11px' : '13px',
                opacity: 0.7
              }}>
                + {specialMenuItems.length - (isMobile ? 6 : 10)} {language === 'bm' ? 'lagi item istimewa' : 'more special items'} 🎉
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== PROMO BANNER ===== */}
      {activePromos.length > 0 && (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '0 12px' : '0 20px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            borderRadius: '20px',
            padding: isMobile ? '12px 16px' : '20px',
            boxShadow: '0 4px 12px rgba(139,92,246,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: isMobile ? '20px' : '28px' }}>🏷️</span>
              <span style={{ 
                fontWeight: 'bold',
                color: 'white',
                fontSize: isMobile ? '13px' : '16px'
              }}>
                {translate('promotions')}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {activePromos.slice(0, isMobile ? 2 : 3).map(promo => (
                <div key={promo.id} style={{ 
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  padding: isMobile ? '8px 12px' : '12px 16px'
                }}>
                  <div style={{ 
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: isMobile ? '12px' : '14px'
                  }}>
                    {promo.name}
                  </div>
                  {promo.type === 'bogo' && (
                    <div style={{ 
                      fontSize: isMobile ? '11px' : '13px',
                      color: 'rgba(255,255,255,0.9)',
                      marginTop: '2px'
                    }}>
                      🎁 {translate('buy')} <strong>{promo.trigger_items?.[0]?.name || 'item'}</strong> {translate('get_free')} <strong>{promo.free_items?.[0]?.name || 'item'}</strong> {translate('free')}!
                    </div>
                  )}
                  {promo.type === 'set_menu' && (
                    <div style={{ 
                      fontSize: isMobile ? '11px' : '13px',
                      color: 'rgba(255,255,255,0.9)',
                      marginTop: '2px'
                    }}>
                      🍽️ <strong>{promo.bundle_items?.map(i => i.name).join(' + ')}</strong><br />
                      {translate('only')} <strong>RM {promo.bundle_price}</strong>! ({translate('save')} RM {(promo.bundle_items?.reduce((s, i) => s + (i.price || 0), 0) - (promo.bundle_price || 0)).toFixed(2)})
                    </div>
                  )}
                  {promo.type === 'bundle' && (
                    <div style={{ 
                      fontSize: isMobile ? '11px' : '13px',
                      color: 'rgba(255,255,255,0.9)',
                      marginTop: '2px'
                    }}>
                      📦 <strong>{promo.bundle_items?.map(i => i.name).join(' + ')}</strong><br />
                      {translate('only')} <strong>RM {promo.bundle_price}</strong>! ({translate('save')} RM {(promo.bundle_items?.reduce((s, i) => s + (i.price || 0), 0) - (promo.bundle_price || 0)).toFixed(2)})
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== CATEGORY FILTERS - SYNC WITH STAFFAPP ===== */}
      <div style={{ maxWidth: '1280px', margin: '16px auto', padding: isMobile ? '0 12px' : '0 20px' }}>
        <div style={{ 
          display: 'flex',
          gap: '8px',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          paddingBottom: '8px',
          scrollbarWidth: 'thin'
        }}>
          {categoryNames.map(cat => {
            let icon = getCategoryIcon(cat)
            
            return (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{ 
                  padding: isMobile ? '6px 14px' : '10px 20px',
                  background: selectedCategory === cat ? '#f59e0b' : (darkMode ? '#1a1a2e' : 'white'),
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
                {cat === 'All' ? `${icon} ${translate('all')}` : 
                 cat === '🔥 Promosi' ? `${icon} ${cat}` : 
                 `${icon} ${cat}`}
              </button>
            )
          })}
        </div>
      </div>

      {/* ===== MENU GRID ===== */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '0 12px 24px 12px' : '0 20px 40px 20px' }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: menuGridCols,
          gap: isMobile ? '12px' : '20px'
        }}>
          {filteredMenu.map(item => {
            const isPromoItem = item.type === 'set_menu' || item.type === 'bundle' || item.type === 'bogo'
            const hasDrinkOptions = !isPromoItem && drinkOptions[item.name] && drinkOptions[item.name].length > 0
            const hasImage = item.image_url && item.image_url.trim() !== ''
            const panasPrice = hasDrinkOptions ? drinkOptions[item.name]?.find(o => o.type === 'Panas')?.price : null
            const sejukPrice = hasDrinkOptions ? drinkOptions[item.name]?.find(o => o.type === 'Sejuk')?.price : null
            const bungkusPrice = hasDrinkOptions ? drinkOptions[item.name]?.find(o => o.type === 'Bungkus')?.price : null
            const isAdding = addingItem === item.id
            const isClicked = clickedItemId === item.id
            const hasSizeOptions = item.has_options === true
            const hasDescription = item.description && item.description.trim() !== ''
            
            return (
              <div 
                key={item.id}
                style={{ 
                  background: isClicked ? '#dcfce7' : (isPromoItem ? '#f3e8ff' : (darkMode ? '#1a1a2e' : 'white')),
                  borderRadius: isMobile ? '18px' : '24px',
                  overflow: 'hidden',
                  boxShadow: isClicked 
                    ? '0 4px 12px rgba(34,197,94,0.3)'
                    : (isPromoItem ? '0 2px 8px rgba(139,92,246,0.2)' : '0 2px 8px rgba(0,0,0,0.08)'),
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  border: isClicked ? '1px solid #22c55e' : 'none',
                  transform: isClicked ? 'scale(0.98)' : 'scale(1)'
                }}
                onClick={() => {
                  setClickedItemId(item.id)
                  setTimeout(() => setClickedItemId(null), 250)
                  if (isPromoItem) {
                    addPromoToCart(item)
                  } else {
                    addToCart(item)
                  }
                }}
              >
                {/* Image / Icon */}
                <div style={{ 
                  background: isPromoItem ? '#f3e8ff' : (darkMode ? '#2a2a3e' : '#fef3c7'),
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
                      fontSize: isMobile ? '8px' : '10px',
                      padding: '2px 6px',
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
                      background: '#f59e0b',
                      color: 'white',
                      fontSize: isMobile ? '8px' : '10px',
                      padding: '2px 6px',
                      borderRadius: '20px',
                      fontWeight: 'bold'
                    }}>
                      {translate('select_size_btn')}
                    </div>
                  )}
                  {hasImage ? (
                    <img 
                      src={item.image_url}
                      alt={item.name}
                      style={{ 
                        width: isMobile ? '70px' : '100px',
                        height: isMobile ? '70px' : '100px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        margin: '0 auto'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentElement.innerHTML = `<span style="font-size:${isMobile ? '40px' : '56px'}">${isPromoItem ? '🏷️' : getDefaultIcon(item.category)}</span>`
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: isMobile ? '40px' : '56px' }}>
                      {isPromoItem ? '🏷️' : getDefaultIcon(item.category)}
                    </span>
                  )}
                </div>
                
                {/* Info */}
                <div style={{ padding: isMobile ? '12px' : '16px', textAlign: 'center' }}>
                  <h3 style={{ 
                    margin: '0 0 6px 0',
                    fontSize: isMobile ? '13px' : '15px',
                    fontWeight: 'bold',
                    color: textColor
                  }}>
                    {item.name}
                  </h3>
                  
                  {hasDescription && (
                    <div style={{ 
                      fontSize: isMobile ? '10px' : '12px',
                      color: textMuted,
                      fontStyle: 'italic',
                      marginBottom: '6px',
                      background: darkMode ? 'rgba(30,30,50,0.6)' : secondaryBg,
                      padding: '4px 8px',
                      borderRadius: '8px',
                      border: `1px solid ${borderColor}`
                    }}>
                      📝 {item.description}
                    </div>
                  )}
                  
                  {isPromoItem && item.original_price && (
                    <div style={{ marginBottom: '6px' }}>
                      <span style={{ 
                        fontSize: isMobile ? '10px' : '12px',
                        color: '#94a3b8',
                        textDecoration: 'line-through',
                        marginRight: '6px'
                      }}>
                        RM {item.original_price.toFixed(2)}
                      </span>
                      <span style={{ 
                        fontSize: isMobile ? '13px' : '16px',
                        fontWeight: 'bold',
                        color: '#8b5cf6'
                      }}>
                        RM {item.price.toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {hasDrinkOptions ? (
                    <div style={{ 
                      marginBottom: '8px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      gap: '4px'
                    }}>
                      {panasPrice && (
                        <span style={{ 
                          color: '#f97316',
                          fontSize: isMobile ? '9px' : '11px',
                          marginRight: '4px',
                          fontWeight: 'bold'
                        }}>
                          🔥 RM {panasPrice?.toFixed(2)}
                        </span>
                      )}
                      {sejukPrice && (
                        <span style={{ 
                          color: '#06b6d4',
                          fontSize: isMobile ? '9px' : '11px',
                          marginRight: '4px',
                          fontWeight: 'bold'
                        }}>
                          🧊 RM {sejukPrice?.toFixed(2)}
                        </span>
                      )}
                      {bungkusPrice && (
                        <span style={{ 
                          color: '#8b5cf6',
                          fontSize: isMobile ? '9px' : '11px',
                          fontWeight: 'bold'
                        }}>
                          📦 RM {bungkusPrice?.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ) : !isPromoItem && !hasSizeOptions && (
                    <div style={{ 
                      fontSize: isMobile ? '16px' : '20px',
                      fontWeight: 'bold',
                      color: textPrice,
                      marginBottom: '6px'
                    }}>
                      RM {item.price?.toFixed(2)}
                    </div>
                  )}
                  
                  {hasSizeOptions && (
                    <div style={{ 
                      fontSize: isMobile ? '11px' : '14px',
                      fontWeight: 'bold',
                      color: '#f59e0b',
                      marginBottom: '6px'
                    }}>
                      {translate('select_size_btn')}
                    </div>
                  )}
                  
                  <div style={{ 
                    width: '100%',
                    padding: isMobile ? '6px' : '10px',
                    background: isAdding ? '#22c55e' : (isPromoItem ? '#8b5cf6' : '#f59e0b'),
                    color: 'white',
                    borderRadius: '40px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    fontSize: isMobile ? '11px' : '13px'
                  }}>
                    {isAdding ? translate('added') : (isPromoItem ? translate('buy_promo') : (hasSizeOptions ? translate('select_size_btn') : translate('add')))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {filteredMenu.length === 0 && (
          <div style={{ 
            textAlign: 'center',
            padding: isMobile ? '40px 20px' : '80px 20px',
            ...glassEffect,
            borderRadius: '20px'
          }}>
            <span style={{ fontSize: isMobile ? '48px' : '64px', opacity: 0.5 }}>🍽️</span>
            <p style={{ 
              color: textMuted,
              marginTop: '12px',
              fontSize: isMobile ? '13px' : '14px'
            }}>
              {translate('no_menu_category')}
            </p>
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* MODALS - Same as before */}
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
            background: 'white',
            borderRadius: '24px',
            padding: isMobile ? '20px' : '28px',
            maxWidth: '380px',
            width: '90%',
            textAlign: 'center',
            animation: 'popIn 0.3s ease'
          }}>
            <div style={{ fontSize: isMobile ? '36px' : '48px', marginBottom: '8px' }}>🍽️</div>
            <h2 style={{ 
              marginBottom: '6px',
              fontSize: isMobile ? '18px' : '22px',
              fontWeight: 'bold',
              color: '#1e293b'
            }}>
              {selectedSizeItem.name}
            </h2>
            <p style={{ 
              color: '#64748b',
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
                    <span style={{ color: 'white' }}>{opt.option_name}</span>
                    <span style={{ color: 'white' }}>RM {finalPrice.toFixed(2)}</span>
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
            background: 'white',
            borderRadius: '24px',
            padding: isMobile ? '20px' : '28px',
            maxWidth: '380px',
            width: '90%',
            textAlign: 'center',
            animation: 'popIn 0.3s ease'
          }}>
            <h2 style={{ 
              marginBottom: '6px',
              fontSize: isMobile ? '18px' : '22px',
              fontWeight: 'bold',
              color: '#1e293b'
            }}>
              🥤 {selectedDrink.name}
            </h2>
            <p style={{ 
              color: '#64748b',
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
                    minWidth: isMobile ? '80px' : '100px',
                    padding: isMobile ? '12px' : '16px',
                    background: selectedOption === 'Panas' ? '#f97316' : '#f1f5f9',
                    color: selectedOption === 'Panas' ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '12px' : '14px',
                    transition: 'all 0.2s'
                  }}
                >
                  🔥 {translate('hot')}<br />
                  <small>RM {drinkOptions[selectedDrink.name]?.find(o => o.type === 'Panas')?.price?.toFixed(2) || '0.00'}</small>
                </button>
              )}
              
              {drinkOptions[selectedDrink.name]?.some(o => o.type === 'Sejuk') && (
                <button 
                  onClick={() => setSelectedOption('Sejuk')}
                  style={{ 
                    flex: 1,
                    minWidth: isMobile ? '80px' : '100px',
                    padding: isMobile ? '12px' : '16px',
                    background: selectedOption === 'Sejuk' ? '#06b6d4' : '#f1f5f9',
                    color: selectedOption === 'Sejuk' ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '12px' : '14px',
                    transition: 'all 0.2s'
                  }}
                >
                  🧊 {translate('cold')}<br />
                  <small>RM {drinkOptions[selectedDrink.name]?.find(o => o.type === 'Sejuk')?.price?.toFixed(2) || '0.00'}</small>
                </button>
              )}
              
              {drinkOptions[selectedDrink.name]?.some(o => o.type === 'Bungkus') && (
                <button 
                  onClick={() => setSelectedOption('Bungkus')}
                  style={{ 
                    flex: 1,
                    minWidth: isMobile ? '80px' : '100px',
                    padding: isMobile ? '12px' : '16px',
                    background: selectedOption === 'Bungkus' ? '#8b5cf6' : '#f1f5f9',
                    color: selectedOption === 'Bungkus' ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '12px' : '14px',
                    transition: 'all 0.2s'
                  }}
                >
                  📦 {translate('takeaway')}<br />
                  <small>RM {drinkOptions[selectedDrink.name]?.find(o => o.type === 'Bungkus')?.price?.toFixed(2) || '0.00'}</small>
                </button>
              )}
            </div>
            
            <button 
              onClick={addDrinkToCart}
              style={{ 
                width: '100%',
                padding: isMobile ? '12px' : '14px',
                background: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '40px',
                cursor: 'pointer',
                fontWeight: 'bold',
                marginBottom: '10px',
                fontSize: isMobile ? '13px' : '14px'
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
                fontSize: isMobile ? '13px' : '14px'
              }}
            >
              {translate('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* ===== FLOATING CART BUTTON ===== */}
      {cartItemCount > 0 && (
        <button 
          onClick={() => setShowCart(true)}
          style={{ 
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            width: isMobile ? '50px' : '64px',
            height: isMobile ? '50px' : '64px',
            borderRadius: '25px',
            background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
            color: 'white',
            border: 'none',
            fontSize: isMobile ? '22px' : '28px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(245,158,11,0.4)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          🛒
          <span style={{ 
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '10px',
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
          maxWidth: isMobile ? '100%' : '420px',
          background: 'white',
          boxShadow: '-2px 0 16px rgba(0,0,0,0.15)',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.3s ease'
        }}>
          
          <div style={{ 
            padding: isMobile ? '14px 16px' : '20px',
            borderBottom: `1px solid #e2e8f0`,
            background: '#f59e0b',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? '16px' : '20px', color: 'white' }}>
                {translate('your_order')} ({cartItemCount})
              </h2>
              <button 
                onClick={() => setShowCart(false)}
                style={{ 
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '30px',
                  width: '28px',
                  height: '28px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ✕
              </button>
            </div>
          </div>
          
          <div style={{ 
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '16px' : '20px'
          }}>
            {cart.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                {translate('empty_cart_msg')}
              </p>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.id} style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    paddingBottom: '8px',
                    borderBottom: `1px solid #e2e8f0`
                  }}>
                    <div style={{ flex: 2 }}>
                      <div style={{ 
                        fontWeight: 'bold',
                        fontSize: isMobile ? '13px' : '14px',
                        color: '#1e293b'
                      }}>
                        {item.name} 
                        {item.is_free && (
                          <span style={{ 
                            color: '#22c55e',
                            fontSize: '10px',
                            marginLeft: '4px'
                          }}>
                            ({translate('free')})
                          </span>
                        )}
                        {item.is_promo_item && (
                          <span style={{ 
                            color: '#8b5cf6',
                            fontSize: '10px',
                            marginLeft: '4px'
                          }}>
                            (PROMO)
                          </span>
                        )}
                        {item.option_type === 'Bungkus' && (
                          <span style={{ 
                            color: '#8b5cf6',
                            fontSize: '10px',
                            marginLeft: '4px'
                          }}>
                            📦
                          </span>
                        )}
                      </div>
                      <div style={{ 
                        fontSize: isMobile ? '10px' : '12px',
                        color: '#94a3b8'
                      }}>
                        x{item.quantity}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ 
                        fontWeight: 'bold',
                        color: '#22c55e',
                        fontSize: isMobile ? '13px' : '14px'
                      }}>
                        RM {(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        style={{ 
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '20px',
                          padding: '2px 8px',
                          cursor: 'pointer',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                
                <div style={{ 
                  background: '#fef3c7',
                  borderRadius: '14px',
                  padding: isMobile ? '12px' : '16px',
                  marginTop: '12px'
                }}>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    fontSize: isMobile ? '12px' : '13px',
                    color: '#1e293b'
                  }}>
                    <span>{translate('subtotal')}:</span>
                    <span>RM {getSubtotal().toFixed(2)}</span>
                  </div>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    fontSize: isMobile ? '12px' : '13px',
                    color: '#1e293b'
                  }}>
                    <span>{translate('service')} ({serviceChargePercent}%):</span>
                    <span>RM {getServiceCharge().toFixed(2)}</span>
                  </div>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    fontSize: isMobile ? '12px' : '13px',
                    color: '#1e293b'
                  }}>
                    <span>{translate('tax')} ({taxPercent}%):</span>
                    <span>RM {getTax().toFixed(2)}</span>
                  </div>
                  <div style={{ 
                    borderTop: `1px solid #fde68a`,
                    marginTop: '6px',
                    paddingTop: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '16px' : '18px',
                    color: '#1e293b'
                  }}>
                    <span>{translate('total')}:</span>
                    <span style={{ color: '#22c55e' }}>RM {getGrandTotal().toFixed(2)}</span>
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
                    marginTop: '12px',
                    marginBottom: '10px',
                    borderRadius: '12px',
                    border: `1px solid #cbd5e1`,
                    outline: 'none',
                    fontSize: isMobile ? '13px' : '14px',
                    color: '#1e293b',
                    background: 'white'
                  }}
                />
                <input 
                  type="tel"
                  placeholder={translate('phone_optional')}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: isMobile ? '10px 12px' : '12px',
                    marginBottom: '10px',
                    borderRadius: '12px',
                    border: `1px solid #cbd5e1`,
                    outline: 'none',
                    fontSize: isMobile ? '13px' : '14px',
                    color: '#1e293b',
                    background: 'white'
                  }}
                />
                <textarea 
                  placeholder={translate('special_notes')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="2"
                  style={{ 
                    width: '100%',
                    padding: isMobile ? '10px 12px' : '12px',
                    marginBottom: '12px',
                    borderRadius: '12px',
                    border: `1px solid #cbd5e1`,
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: isMobile ? '13px' : '14px',
                    color: '#1e293b',
                    background: 'white'
                  }}
                />
              </>
            )}
          </div>
          
          <div style={{ 
            padding: isMobile ? '14px 16px' : '20px',
            borderTop: `1px solid #e2e8f0`
          }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setShowCart(false)}
                style={{ 
                  flex: 1,
                  padding: isMobile ? '10px' : '14px',
                  background: '#64748b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '40px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: isMobile ? '12px' : '14px'
                }}
              >
                {translate('back_to_menu')}
              </button>
              <button 
                onClick={handlePlaceOrder}
                disabled={!tableNumber || cart.length === 0}
                style={{ 
                  flex: 1,
                  padding: isMobile ? '10px' : '14px',
                  background: (!tableNumber || cart.length === 0) ? '#cbd5e1' : 'linear-gradient(135deg, #f59e0b, #ea580c)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '40px',
                  cursor: (!tableNumber || cart.length === 0) ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: 'bold'
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
            background: 'white',
            borderRadius: '28px',
            padding: isMobile ? '20px' : '28px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            animation: 'popIn 0.3s ease'
          }}>
            <div style={{ 
              width: isMobile ? '48px' : '60px',
              height: isMobile ? '48px' : '60px',
              background: '#fef3c7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}>
              <span style={{ fontSize: isMobile ? '26px' : '32px' }}>📋</span>
            </div>
            <h2 style={{ 
              marginBottom: '6px',
              fontSize: isMobile ? '18px' : '22px',
              fontWeight: 'bold',
              color: '#1e293b'
            }}>
              {translate('confirm_order')}
            </h2>
            <p style={{ 
              color: '#64748b',
              marginBottom: '16px',
              fontSize: isMobile ? '12px' : '14px'
            }}>
              {translate('review_order')}
            </p>
            <div style={{ 
              background: '#f8fafc',
              borderRadius: '14px',
              padding: isMobile ? '12px' : '16px',
              marginBottom: '16px',
              textAlign: 'left'
            }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                fontSize: isMobile ? '12px' : '13px',
                color: '#1e293b'
              }}>
                <span style={{ color: '#64748b' }}>{translate('table')}:</span>
                <span style={{ fontWeight: 'bold' }}>{tableNumber}</span>
              </div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                fontSize: isMobile ? '12px' : '13px',
                color: '#1e293b'
              }}>
                <span style={{ color: '#64748b' }}>{translate('customer')}:</span>
                <span style={{ fontWeight: 'bold' }}>{customerName || translate('guest')}</span>
              </div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '6px',
                paddingTop: '6px',
                borderTop: '1px solid #e2e8f0',
                fontSize: isMobile ? '12px' : '13px',
                color: '#1e293b'
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
                <span style={{ color: '#22c55e' }}>RM {getGrandTotal().toFixed(2)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => { setShowConfirmModal(false); setShowCart(true) }}
                style={{ 
                  flex: 1,
                  padding: isMobile ? '10px' : '14px',
                  background: '#64748b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '40px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: isMobile ? '12px' : '14px'
                }}
              >
                {translate('back')}
              </button>
              <button 
                onClick={() => setShowConfirmModal(false)}
                style={{ 
                  flex: 1,
                  padding: isMobile ? '10px' : '14px',
                  background: 'transparent',
                  color: '#64748b',
                  border: `1px solid #64748b`,
                  borderRadius: '40px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: 'bold'
                }}
              >
                {translate('close')}
              </button>
              <button 
                onClick={submitOrderConfirmed}
                style={{ 
                  flex: 1,
                  padding: isMobile ? '10px' : '14px',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '40px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: isMobile ? '12px' : '14px'
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
            border-color: #f59e0b;
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
        `}
      </style>
    </div>
  )
}

export default CustomerMenu