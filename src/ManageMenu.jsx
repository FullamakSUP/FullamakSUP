import { useState, useEffect } from 'react'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'
import Sidebar from './components/Sidebar'
import { supabase } from './lib/supabase'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ============================================================
// SORTABLE MENU ITEM
// ============================================================
function SortableMenuItem({ item, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'default',
    touchAction: 'none',
    position: 'relative',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div 
        {...listeners} 
        style={{ 
          position: 'absolute',
          top: '8px',
          right: '8px',
          cursor: 'grab',
          fontSize: '16px',
          color: '#94a3b8',
          opacity: 0.4,
          padding: '4px',
          zIndex: 10,
          userSelect: 'none'
        }}
        title="Drag to reorder"
      >
        ⠿
      </div>
      {children}
    </div>
  )
}

// ============================================================
// SORTABLE CATEGORY BUTTON
// ============================================================
function SortableCategoryButton({ category, icon, isActive, onClick, children, isMobile, textColor, borderColor }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    touchAction: 'none',
  }

  return (
    <button
      ref={setNodeRef}
      style={{
        ...style,
        padding: isMobile ? '8px 18px' : '10px 24px',
        background: isActive ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
        color: isActive ? 'white' : textColor,
        border: isActive ? 'none' : `1px solid ${borderColor}`,
        borderRadius: '50px',
        cursor: 'pointer',
        fontSize: isMobile ? '12px' : '14px',
        fontWeight: isActive ? 'bold' : '500',
        transition: 'all 0.2s',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {icon} {children}
    </button>
  )
}

// ============================================================
// MAIN COMPONENT
// ============================================================
function ManageMenu() {
  const { darkMode } = useTheme()
  const { language } = useLanguage()
  
  // ===== STATE =====
  const [menu, setMenu] = useState([])
  const [categories, setCategories] = useState([])
  const [drinkOptions, setDrinkOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('regular')
  const [activeCategory, setActiveCategory] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [searchMenuTerm, setSearchMenuTerm] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isCategoryDragging, setIsCategoryDragging] = useState(false)
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [formData, setFormData] = useState({ 
    name: '', 
    price: '', 
    category: '', 
    stock: 0, 
    image_url: '', 
    image_file: null,
    description: ''
  })
  
  const [showDrinkModal, setShowDrinkModal] = useState(false)
  const [newDrinkName, setNewDrinkName] = useState('')
  const [newDrinkPanas, setNewDrinkPanas] = useState('')
  const [newDrinkSejuk, setNewDrinkSejuk] = useState('')
  const [newDrinkBungkus, setNewDrinkBungkus] = useState('')
  const [newDrinkStock, setNewDrinkStock] = useState(100)
  const [drinkPriceEdits, setDrinkPriceEdits] = useState({})

  const [specialMenuEnabled, setSpecialMenuEnabled] = useState(false)
  const [specialMenuTitle, setSpecialMenuTitle] = useState('Istimewa Hari Ini')
  const [specialItems, setSpecialItems] = useState([])
  const [showAddSpecialModal, setShowAddSpecialModal] = useState(false)
  const [showEditSpecialModal, setShowEditSpecialModal] = useState(false)
  const [selectedSpecialItem, setSelectedSpecialItem] = useState(null)
  const [specialFormData, setSpecialFormData] = useState({ 
    name: '', 
    price: '', 
    stock: '', 
    image_url: '', 
    image_file: null,
    description: '' 
  })

  const [promotions, setPromotions] = useState([])
  const [showAddPromoModal, setShowAddPromoModal] = useState(false)
  const [showEditPromoModal, setShowEditPromoModal] = useState(false)
  const [selectedPromo, setSelectedPromo] = useState(null)
  const [availableMenuItems, setAvailableMenuItems] = useState([])
  const [promoFormData, setPromoFormData] = useState({
    name: '',
    type: 'set_menu',
    trigger_item_id: null,
    free_item_id: null,
    selected_bundle_items: [],
    bundle_price: 0,
    start_date: '',
    end_date: '',
    is_active: true,
    image_url: '',
    image_file: null
  })

  const [showOptionsModal, setShowOptionsModal] = useState(false)
  const [selectedMenuForOptions, setSelectedMenuForOptions] = useState(null)
  const [menuOptions, setMenuOptions] = useState([])
  const [optionForm, setOptionForm] = useState({ 
    option_name: '', 
    price_adjustment: '', 
    is_absolute_price: true,
    sort_order: 0
  })
  const [editingOption, setEditingOption] = useState(null)

  const STORAGE_BUCKET = 'restaurant-logos'

  // ===== DND SENSORS =====
  const menuSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const categorySensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // ============================================================
  // TRANSLATIONS
  // ============================================================
  const translations = {
    manage_menu: { en: 'Manage Menu', ms: 'Urus Menu' },
    manage_menu_sub: { en: 'Drag & drop to reorder menu items', ms: 'Seret & lepas untuk susun menu' },
    drag_hint: { en: 'Drag to reorder', ms: 'Seret untuk susun' },
    regular_menu: { en: 'Regular Menu', ms: 'Menu Biasa' },
    special_menu: { en: 'Special Menu', ms: 'Menu Istimewa' },
    promotions: { en: 'Promotions', ms: 'Promosi' },
    add_menu: { en: 'Add Menu', ms: 'Tambah Menu' },
    add_drink: { en: 'Add Drink', ms: 'Tambah Minuman' },
    add_promotion: { en: 'Add Promotion', ms: 'Tambah Promosi' },
    edit_promotion: { en: 'Edit Promotion', ms: 'Edit Promosi' },
    add_special: { en: 'Add Special Item', ms: 'Tambah Item Istimewa' },
    edit_special: { en: 'Edit Special Item', ms: 'Edit Item Istimewa' },
    search_menu: { en: 'Search menu...', ms: 'Cari menu...' },
    all: { en: 'All', ms: 'Semua' },
    no_menu: { en: 'No menu items found', ms: 'Tiada item menu dijumpai' },
    stock: { en: 'Stock', ms: 'Stok' },
    edit: { en: 'Edit', ms: 'Edit' },
    delete: { en: 'Delete', ms: 'Hapus' },
    save: { en: 'Save', ms: 'Simpan' },
    cancel: { en: 'Cancel', ms: 'Batal' },
    add: { en: 'Add', ms: 'Tambah' },
    close: { en: 'Close', ms: 'Tutup' },
    out_of_stock: { en: 'OUT', ms: 'HABIS' },
    low_stock: { en: 'LOW', ms: 'RENDAH' },
    ok: { en: 'OK', ms: 'OK' },
    showing: { en: 'Showing', ms: 'Menunjukkan' },
    of: { en: 'of', ms: 'daripada' },
    items: { en: 'items', ms: 'item' },
    hot: { en: 'Hot', ms: 'Panas' },
    cold: { en: 'Cold', ms: 'Sejuk' },
    takeaway: { en: 'Takeaway', ms: 'Bungkus' },
    activate_special: { en: 'Activate Special Menu', ms: 'Aktifkan Menu Istimewa' },
    activate_special_desc: { en: 'Display special menu on homepage', ms: 'Paparkan menu istimewa di laman utama' },
    special_title: { en: 'Special Menu Title', ms: 'Tajuk Menu Istimewa' },
    special_items: { en: 'Special Items', ms: 'Item Istimewa' },
    no_special_items: { en: 'No special items. Click "Add" to start.', ms: 'Tiada item istimewa. Klik "Tambah" untuk mula.' },
    no_promotions: { en: 'No promotions. Click "Add Promotion" to start.', ms: 'Tiada promosi. Klik "Tambah Promosi" untuk mula.' },
    active: { en: 'ACTIVE', ms: 'AKTIF' },
    inactive: { en: 'INACTIVE', ms: 'TIDAK AKTIF' },
    disable: { en: 'Disable', ms: 'Lumpuhkan' },
    enable: { en: 'Enable', ms: 'Aktifkan' },
    promo_name: { en: 'Promotion Name *', ms: 'Nama Promosi *' },
    promo_type: { en: 'Promotion Type', ms: 'Jenis Promosi' },
    set_menu: { en: 'Set Menu', ms: 'Set Menu' },
    bundle: { en: 'Bundle', ms: 'Bundle' },
    bogo: { en: 'Buy 1 Free 1', ms: 'Beli 1 Percuma 1' },
    trigger_item: { en: 'Purchased Item', ms: 'Item yang Dibeli' },
    free_item: { en: 'Free Item', ms: 'Item Percuma' },
    select_item: { en: '-- Select Item --', ms: '-- Pilih Item --' },
    bundle_items: { en: 'Select Bundle Items', ms: 'Pilih Item dalam Promosi' },
    promo_price: { en: 'Promotion Price (RM)', ms: 'Harga Promosi (RM)' },
    start_date: { en: 'Start Date', ms: 'Tarikh Mula' },
    end_date: { en: 'End Date', ms: 'Tarikh Akhir' },
    promo_image: { en: 'Promotion Image', ms: 'Gambar Promosi' },
    activate_promo: { en: 'Activate Promotion', ms: 'Aktifkan Promosi' },
    no_items_available: { en: 'No items available - add menu items first', ms: 'Tiada item - tambah menu terlebih dahulu' },
    items_available: { en: 'items available. Tap checkbox to select.', ms: 'item tersedia. Ketik kotak untuk pilih.' },
    size_options: { en: 'Size Options', ms: 'Pilihan Saiz' },
    add_size: { en: 'Add New Size', ms: 'Tambah Saiz Baru' },
    edit_size: { en: 'Edit Size', ms: 'Edit Saiz' },
    size_name: { en: 'Name (e.g: Small, Medium, Large)', ms: 'Nama (cth: Kecil, Sederhana, Besar)' },
    size_price: { en: 'Price (RM)', ms: 'Harga (RM)' },
    absolute_price: { en: 'Absolute Price', ms: 'Harga Mutlak' },
    sort_order: { en: 'Sort Order', ms: 'Urutan' },
    size_list: { en: 'Size List', ms: 'Senarai Saiz' },
    no_sizes: { en: 'No size options available.', ms: 'Tiada pilihan saiz.' },
    add_drink_title: { en: 'Add Drink (Hot/Cold/Takeaway)', ms: 'Tambah Minuman (Panas/Sejuk/Bungkus)' },
    drink_name: { en: 'Drink Name', ms: 'Nama Minuman' },
    hot_price: { en: 'Hot Price', ms: 'Harga Panas' },
    cold_price: { en: 'Cold Price', ms: 'Harga Sejuk' },
    takeaway_price: { en: 'Takeaway Price', ms: 'Harga Bungkus' },
    edit_menu: { en: 'Edit Menu', ms: 'Edit Menu' },
    select_category: { en: 'Select Category', ms: 'Pilih Kategori' },
    preview: { en: 'Preview', ms: 'Pratonton' },
    stock_qty: { en: 'Stock Quantity', ms: 'Kuantiti Stok' },
    has_size_options: { en: 'Has size options', ms: 'Ada pilihan saiz' },
    name: { en: 'Name', ms: 'Nama' },
    price: { en: 'Price', ms: 'Harga' },
    description: { en: 'Description', ms: 'Keterangan' },
    image: { en: 'Image', ms: 'Gambar' },
    category: { en: 'Category', ms: 'Kategori' },
    order_updated: { en: 'Menu order updated!', ms: 'Urutan menu dikemaskini!' },
    category_order_updated: { en: 'Category order updated!', ms: 'Urutan kategori dikemaskini!' },
    already_exists: { en: 'already exists!', ms: 'sudah wujud!' },
    confirm_delete: { en: 'Are you sure you want to delete', ms: 'Adakah anda pasti mahu padam' },
    confirm_delete_image: { en: 'Are you sure you want to delete this image?', ms: 'Adakah anda pasti mahu padam gambar ini?' },
    price_updated: { en: 'price updated!', ms: 'harga dikemaskini!' },
    stock_updated_to: { en: 'stock updated to', ms: 'stok dikemaskini kepada' },
    option_added: { en: 'Size option added!', ms: 'Pilihan saiz ditambah!' },
    option_updated: { en: 'Size option updated!', ms: 'Pilihan saiz dikemaskini!' },
    option_deleted: { en: 'Size option deleted!', ms: 'Pilihan saiz dipadam!' },
    menu_added: { en: 'Menu item added!', ms: 'Item menu ditambah!' },
    menu_updated: { en: 'Menu item updated!', ms: 'Item menu dikemaskini!' },
    special_added: { en: 'Special item added!', ms: 'Item istimewa ditambah!' },
    special_updated: { en: 'Special item updated!', ms: 'Item istimewa dikemaskini!' },
    promo_added: { en: 'Promotion added!', ms: 'Promosi ditambah!' },
    promo_updated: { en: 'Promotion updated!', ms: 'Promosi dikemaskini!' },
    promo_disabled: { en: 'Promotion disabled!', ms: 'Promosi dilumpuhkan!' },
    promo_enabled: { en: 'Promotion enabled!', ms: 'Promosi diaktifkan!' },
    deleted: { en: 'deleted!', ms: 'dipadam!' },
    image_deleted: { en: 'Image deleted!', ms: 'Gambar dipadam!' },
    image_delete_fail: { en: 'Failed to delete image!', ms: 'Gagal padam gambar!' },
    upload_fail: { en: 'Upload failed!', ms: 'Muat naik gagal!' },
    upload_success: { en: 'Upload successful', ms: 'Muat naik berjaya' },
    required: { en: 'is required!', ms: 'diperlukan!' },
    and: { en: 'and', ms: 'dan' },
    error: { en: 'Error', ms: 'Ralat' },
    invalid_price: { en: 'Please enter a valid price!', ms: 'Sila masukkan harga yang sah!' },
    drink_added: { en: 'Drink added successfully!', ms: 'Minuman berjaya ditambah!' },
    no_items_found: { en: 'No items found', ms: 'Tiada item dijumpai' },
    price_sync: { en: 'Price will sync with menu item', ms: 'Harga akan diselaraskan dengan item menu' },
  }

  const translate = (key) => {
    if (!translations[key]) return key
    return language === 'en' ? translations[key].en : translations[key].ms
  }

  // ============================================================
  // THEME COLORS
  // ============================================================
  const bgColor = darkMode ? '#0a0a16' : '#f1f5f9'
  const cardBg = darkMode ? 'rgba(20, 20, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  const textColor = darkMode ? '#e8edf5' : '#1e293b'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.4)' : 'rgba(203, 213, 225, 0.5)'
  const secondaryBg = darkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(248, 250, 252, 0.9)'
  const inputBg = darkMode ? '#1a1a2e' : '#ffffff'
  const inputBorder = darkMode ? '#3d3d5c' : '#cbd5e1'
  const inputText = darkMode ? '#e8edf5' : '#1e293b'
  const glassBorder = darkMode ? 'rgba(71, 85, 105, 0.2)' : 'rgba(203, 213, 225, 0.4)'
  
  const glassEffect = {
    background: cardBg,
    backdropFilter: 'blur(12px)',
    border: `1px solid ${glassBorder}`,
    boxShadow: darkMode 
      ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
      : '0 8px 32px rgba(0, 0, 0, 0.06)'
  }

  // ============================================================
  // MODAL STYLES
  // ============================================================
  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.25s ease',
    padding: '16px'
  }

  const modalContentStyle = {
    background: cardBg,
    borderRadius: '24px',
    padding: isMobile ? '20px' : '28px',
    maxWidth: isMobile ? '95%' : '480px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    ...glassEffect,
    animation: 'popIn 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)',
    color: textColor,
  }

  const modalTitleStyle = {
    marginTop: 0,
    marginBottom: '20px',
    color: textColor,
    fontSize: isMobile ? '20px' : '24px',
    fontWeight: 'bold',
    textAlign: 'center'
  }

  const inputStyle = {
    width: '100%',
    padding: isMobile ? '10px 14px' : '12px 16px',
    marginBottom: '12px',
    borderRadius: '12px',
    border: `1px solid ${inputBorder}`,
    background: inputBg,
    color: inputText,
    fontSize: isMobile ? '14px' : '15px',
    transition: 'all 0.2s',
    boxSizing: 'border-box'
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '600',
    color: textColor,
    fontSize: isMobile ? '13px' : '14px',
  }

  const buttonPrimaryStyle = {
    flex: 1,
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    color: 'white',
    padding: isMobile ? '12px' : '14px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: isMobile ? '14px' : '15px',
    transition: 'all 0.2s',
    minWidth: '80px',
  }

  const buttonSecondaryStyle = {
    flex: 1,
    background: darkMode ? '#475569' : '#64748b',
    color: 'white',
    padding: isMobile ? '12px' : '14px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: isMobile ? '14px' : '15px',
    transition: 'all 0.2s',
    minWidth: '80px',
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
  // IMAGE RESIZE
  // ============================================================
  async function resizeAndCompressImage(file, maxWidth = 300, maxHeight = 300, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target.result
        
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          let size = Math.min(img.width, img.height)
          let sx = (img.width - size) / 2
          let sy = (img.height - size) / 2
          
          canvas.width = maxWidth
          canvas.height = maxHeight
          
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, sx, sy, size, size, 0, 0, maxWidth, maxHeight)
          
          const outputFormat = 'image/webp'
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to resize image'))
              return
            }
            
            const fileName = file.name.split('.')[0] + '.webp'
            const resizedFile = new File([blob], fileName, {
              type: outputFormat,
              lastModified: Date.now()
            })
            
            resolve(resizedFile)
          }, outputFormat, quality)
        }
        
        img.onerror = () => {
          reject(new Error('Failed to load image'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
    })
  }

  // ============================================================
  // LOAD DATA
  // ============================================================
  useEffect(() => {
    console.log('🔄 Initializing ManageMenu...')
    loadAllData()
    loadSpecialMenu()
    loadPromotions()
    loadAvailableMenu()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeCategory, searchMenuTerm])

  async function loadAllData() {
    setLoading(true)
    await loadCategories()
    await loadMenu()
    await loadDrinkOptions()
    setLoading(false)
    console.log('✅ All data loaded!')
  }

  async function loadCategories() {
    console.log('🔄 Loading categories...')
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.error('❌ Error loading categories:', error)
      return
    }
    
    console.log('✅ Categories loaded:', data?.length || 0, 'categories')
    setCategories(data || [])
  }

  async function loadMenu() {
    console.log('🔄 Loading menu...')
    const { data, error } = await supabase
      .from('menu')
      .select('*')
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.error('❌ Error loading menu:', error)
      return
    }
    
    console.log('✅ Menu loaded:', data?.length || 0, 'items')
    setMenu(data || [])
  }

  async function loadDrinkOptions() {
    const { data } = await supabase.from('drink_options').select('*')
    setDrinkOptions(data || [])
    const edits = {}
    data?.forEach(opt => { 
      const key = `${opt.drink_name}_${opt.option_type}` 
      edits[key] = opt.price 
    })
    setDrinkPriceEdits(edits)
  }

  async function loadSpecialMenu() {
    try {
      const { data: enabledData } = await supabase.from('settings').select('value').eq('key', 'special_menu_enabled').single()
      if (enabledData) setSpecialMenuEnabled(enabledData.value === 'true')
      
      const { data: titleData } = await supabase.from('settings').select('value').eq('key', 'special_menu_title').single()
      if (titleData) setSpecialMenuTitle(titleData.value)
      
      const { data: itemsData } = await supabase.from('settings').select('value').eq('key', 'special_menu_items').single()
      if (itemsData) { 
        try { 
          const items = JSON.parse(itemsData.value)
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
          setSpecialItems(syncedItems)
        } catch (e) { 
          setSpecialItems([]) 
        } 
      }
    } catch (err) {
      console.error('Error loading special menu:', err)
    }
  }

  async function loadPromotions() {
    const { data } = await supabase.from('promotions').select('*').order('id', { ascending: false })
    setPromotions(data || [])
  }

  async function loadAvailableMenu() {
    try {
      console.log('🔄 Loading available menu items...')
      const { data, error } = await supabase
        .from('menu')
        .select('id, name, price, category, has_options')
        .order('name', { ascending: true })
      
      if (error) {
        console.error('❌ Error loading available menu:', error)
        setAvailableMenuItems([])
        return
      }
      
      console.log('✅ Available menu items loaded:', data?.length || 0, 'items')
      setAvailableMenuItems(data || [])
    } catch (err) {
      console.error('❌ Error in loadAvailableMenu:', err)
      setAvailableMenuItems([])
    }
  }

  // ============================================================
  // CATEGORY HELPERS - SHOW ALL CATEGORIES
  // ============================================================
  const getCategoriesForFilter = () => {
    return categories
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map(cat => cat.name)
  }

  const getCategoryIcon = (catName) => {
    if (catName === 'all') return '🍽️'
    if (catName === 'Minuman') return '🥤'
    const found = categories.find(c => c.name === catName)
    return found?.icon || '📂'
  }

  // ============================================================
  // CATEGORY DRAG & DROP HANDLER
  // ============================================================
  async function handleCategoryDragEnd(event) {
    const { active, over } = event
    
    if (!over || active.id === over.id) {
      setIsCategoryDragging(false)
      return
    }
    
    setIsCategoryDragging(true)
    
    const categoryList = getCategoriesForFilter()
    
    const oldIndex = categoryList.findIndex(cat => cat === active.id)
    const newIndex = categoryList.findIndex(cat => cat === over.id)
    
    if (oldIndex === -1 || newIndex === -1) {
      setIsCategoryDragging(false)
      return
    }
    
    const newOrder = arrayMove(categoryList, oldIndex, newIndex)
    
    const updates = newOrder.map((catName, index) => ({
      name: catName,
      sort_order: index
    }))
    
    const updatedCategories = categories.map(cat => {
      const update = updates.find(u => u.name === cat.name)
      if (update) {
        return { ...cat, sort_order: update.sort_order }
      }
      return cat
    })
    setCategories(updatedCategories)
    
    try {
      for (const update of updates) {
        await supabase
          .from('categories')
          .update({ sort_order: update.sort_order })
          .eq('name', update.name)
      }
      setMessage(translate('category_order_updated'))
      setTimeout(() => setMessage(''), 2000)
      await loadCategories()
    } catch (error) {
      console.error('Error updating category order:', error)
      await loadCategories()
    }
    
    setIsCategoryDragging(false)
  }

  // ============================================================
  // MENU DRAG & DROP HANDLER
  // ============================================================
  async function handleMenuDragEnd(event) {
    const { active, over } = event
    
    if (!over || active.id === over.id) {
      setIsDragging(false)
      return
    }
    
    setIsDragging(true)
    
    const allInCategory = activeCategory === 'all' 
      ? [...menu] 
      : menu.filter(item => item.category === activeCategory)
    
    const oldIndex = allInCategory.findIndex(item => item.id === active.id)
    const newIndex = allInCategory.findIndex(item => item.id === over.id)
    
    if (oldIndex === -1 || newIndex === -1) {
      setIsDragging(false)
      return
    }
    
    const newOrder = arrayMove(allInCategory, oldIndex, newIndex)
    
    const updates = newOrder.map((item, index) => ({
      id: item.id,
      sort_order: index
    }))
    
    const updatedMenu = menu.map(item => {
      const update = updates.find(u => u.id === item.id)
      return update ? { ...item, sort_order: update.sort_order } : item
    })
    setMenu(updatedMenu)
    
    try {
      for (const update of updates) {
        await supabase
          .from('menu')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
      }
      setMessage(translate('order_updated'))
      setTimeout(() => setMessage(''), 2000)
      await loadMenu()
    } catch (error) {
      console.error('Drag error:', error)
      await loadMenu()
    }
    
    setIsDragging(false)
  }

  // ============================================================
  // UPLOAD IMAGE
  // ============================================================
  async function uploadImage(file, type = 'menu') {
    if (!file) return null
    setUploading(true)
    
    try {
      const resizedFile = await resizeAndCompressImage(file, 300, 300, 0.8)
      
      const fileExt = resizedFile.name.split('.').pop()
      const fileName = `${type}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, resizedFile)
      
      if (uploadError) {
        setMessage(`❌ ${translate('upload_fail')}: ${uploadError.message}`)
        setUploading(false)
        return null
      }
      
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName)
      
      const sizeInKB = (resizedFile.size / 1024).toFixed(0)
      setMessage(`✅ ${translate('upload_success')} (${sizeInKB}KB)`)
      setUploading(false)
      return urlData.publicUrl
    } catch (err) {
      setMessage(`❌ ${translate('upload_fail')}: ${err.message}`)
      setUploading(false)
      return null
    }
  }

  async function deleteImageFromStorage(imageUrl) {
    if (!imageUrl) return false
    try {
      const fileName = imageUrl.split('/').pop()
      const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([fileName])
      if (error) return false
      return true
    } catch (err) {
      return false
    }
  }

  // ============================================================
  // DRINK FUNCTIONS
  // ============================================================
  async function addDrinkWithOptions() {
    if (!newDrinkName) { 
      setMessage(`⚠️ ${translate('drink_name')} ${translate('required')}`)
      return 
    }
    const existing = menu.find(m => m.name.toLowerCase() === newDrinkName.toLowerCase())
    if (existing) {
      setMessage(`⚠️ "${newDrinkName}" ${translate('already_exists')}`)
      return
    }
    const { data: menuData, error: menuError } = await supabase
      .from('menu')
      .insert([{ 
        name: newDrinkName, price: 0, category: 'Minuman',
        stock: parseInt(newDrinkStock) || 0, image_url: null, has_options: false,
        description: null,
        sort_order: menu.length
      }])
      .select()
    if (menuError) { 
      setMessage(`❌ ${translate('error')}: ${menuError.message}`)
      return 
    }
    const newMenuId = menuData[0].id
    
    if (newDrinkPanas && parseFloat(newDrinkPanas) > 0) {
      await supabase.from('drink_options').insert([{ 
        menu_id: newMenuId, 
        drink_name: newDrinkName, 
        option_type: 'Panas', 
        price: parseFloat(newDrinkPanas) 
      }])
    }
    
    if (newDrinkSejuk && parseFloat(newDrinkSejuk) > 0) {
      await supabase.from('drink_options').insert([{ 
        menu_id: newMenuId, 
        drink_name: newDrinkName, 
        option_type: 'Sejuk', 
        price: parseFloat(newDrinkSejuk) 
      }])
    }
    
    if (newDrinkBungkus && parseFloat(newDrinkBungkus) > 0) {
      await supabase.from('drink_options').insert([{ 
        menu_id: newMenuId, 
        drink_name: newDrinkName, 
        option_type: 'Bungkus', 
        price: parseFloat(newDrinkBungkus) 
      }])
    }
    
    setMessage(translate('drink_added'))
    setShowDrinkModal(false)
    setNewDrinkName('')
    setNewDrinkPanas('')
    setNewDrinkSejuk('')
    setNewDrinkBungkus('')
    setNewDrinkStock(100)
    loadMenu()
    loadDrinkOptions()
    loadAvailableMenu()
    setTimeout(() => setMessage(''), 2000)
  }

  // ============================================================
  // REGULAR MENU FUNCTIONS
  // ============================================================
  async function addRegularMenuItem() {
    if (!formData.name || !formData.price) { 
      setMessage(`⚠️ ${translate('name')} ${translate('and')} ${translate('price')} ${translate('required')}`)
      return 
    }
    const existing = menu.find(m => m.name.toLowerCase() === formData.name.toLowerCase())
    if (existing) {
      setMessage(`⚠️ "${formData.name}" ${translate('already_exists')}`)
      return
    }
    let imageUrl = formData.image_url
    if (formData.image_file) {
      const uploadedUrl = await uploadImage(formData.image_file, 'menu')
      if (uploadedUrl) imageUrl = uploadedUrl
    }
    
    const categoryName = formData.category || 'Makanan'
    
    const itemsInCategory = menu.filter(item => item.category === categoryName)
    const maxSortOrder = itemsInCategory.length
    
    const { error } = await supabase.from('menu').insert([{ 
      name: formData.name, 
      price: parseFloat(formData.price), 
      category: categoryName,
      stock: parseInt(formData.stock) || 0, 
      image_url: imageUrl || null, 
      has_options: false,
      description: formData.description || null,
      sort_order: maxSortOrder
    }])
    if (error) { 
      setMessage(`❌ ${translate('error')}: ${error.message}`) 
    } else { 
      setMessage(translate('menu_added'))
      setShowAddModal(false)
      setFormData({ name: '', price: '', category: '', stock: 0, image_url: '', image_file: null, description: '' })
      loadMenu()
      loadAvailableMenu() 
    }
    setTimeout(() => setMessage(''), 2000)
  }

  async function updateRegularMenuItem() {
    if (!formData.name || !formData.price) { 
      setMessage(`⚠️ ${translate('name')} ${translate('and')} ${translate('price')} ${translate('required')}`)
      return 
    }
    let imageUrl = formData.image_url
    if (formData.image_file) {
      const uploadedUrl = await uploadImage(formData.image_file, 'menu')
      if (uploadedUrl) imageUrl = uploadedUrl
    }
    
    const categoryName = formData.category || 'Makanan'
    
    const updateData = { 
      name: formData.name, 
      price: parseFloat(formData.price), 
      category: categoryName, 
      stock: parseInt(formData.stock) || 0,
      description: formData.description || null
    }
    if (imageUrl !== undefined) updateData.image_url = imageUrl || null
    
    console.log('🔄 Updating menu item:', selectedItem?.id, updateData)
    
    const { error } = await supabase
      .from('menu')
      .update(updateData)
      .eq('id', selectedItem.id)
    
    if (error) { 
      console.error('❌ Error updating:', error)
      setMessage(`❌ ${translate('error')}: ${error.message}`) 
    } else { 
      console.log('✅ Menu updated successfully')
      setMessage(translate('menu_updated'))
      setShowEditModal(false)
      setSelectedItem(null)
      setFormData({ name: '', price: '', category: '', stock: 0, image_url: '', image_file: null, description: '' })
      loadMenu()
      loadAvailableMenu() 
    }
    setTimeout(() => setMessage(''), 2000)
  }

  // ============================================================
  // DRINK PRICE UPDATE
  // ============================================================
  async function updateDrinkPrice(drinkName, optionType, newPrice) {
    const { error } = await supabase
      .from('drink_options')
      .update({ price: parseFloat(newPrice) })
      .eq('drink_name', drinkName)
      .eq('option_type', optionType)
      
    if (error) { 
      setMessage(`❌ ${translate('error')}: ${error.message}`) 
    } else { 
      await loadDrinkOptions()
      setMessage(`✅ ${drinkName} (${optionType}) ${translate('price_updated')}`) 
    }
    setTimeout(() => setMessage(''), 2000)
  }

  function handleDrinkPriceChange(drinkName, optionType, value) { 
    const key = `${drinkName}_${optionType}` 
    setDrinkPriceEdits(prev => ({ 
      ...prev, 
      [key]: value 
    })) 
  }
  
  function handleDrinkPriceSave(drinkName, optionType) { 
    const key = `${drinkName}_${optionType}` 
    const newPrice = drinkPriceEdits[key] 
    
    if (newPrice !== undefined && newPrice !== '' && !isNaN(newPrice) && parseFloat(newPrice) >= 0) {
      updateDrinkPrice(drinkName, optionType, newPrice) 
    } else {
      setMessage(translate('invalid_price'))
      setTimeout(() => setMessage(''), 2000)
    }
  }

  // ============================================================
  // DELETE FUNCTIONS
  // ============================================================
  async function deleteMenuItem(id, name) {
    if (window.confirm(`${translate('confirm_delete')} "${name}"?`)) {
      await supabase.from('drink_options').delete().eq('drink_name', name)
      await supabase.from('menu_options').delete().eq('menu_id', id)
      const { error } = await supabase.from('menu').delete().eq('id', id)
      if (error) { 
        setMessage(`❌ ${translate('error')}: ${error.message}`) 
      } else { 
        setMessage(`🗑️ "${name}" ${translate('deleted')}`)
        await loadMenu()
        await loadDrinkOptions()
        await loadAvailableMenu() 
      }
      setTimeout(() => setMessage(''), 2000)
    }
  }

  async function deleteImage(imageUrl, itemId) {
    if (!imageUrl) return
    if (!window.confirm(translate('confirm_delete_image'))) return
    const deleted = await deleteImageFromStorage(imageUrl)
    if (deleted) {
      const { error } = await supabase.from('menu').update({ image_url: null }).eq('id', itemId)
      if (error) setMessage(`❌ ${translate('error')}: ${error.message}`)
      else setMessage(translate('image_deleted'))
      await loadMenu()
    } else {
      setMessage(translate('image_delete_fail'))
    }
    setTimeout(() => setMessage(''), 2000)
  }

  // ============================================================
  // SPECIAL MENU FUNCTIONS
  // ============================================================
  async function addSpecialItem() {
    if (!specialFormData.name || !specialFormData.price) { 
      setMessage(`⚠️ ${translate('name')} ${translate('and')} ${translate('price')} ${translate('required')}`)
      return 
    }
    
    let imageUrl = specialFormData.image_url
    if (specialFormData.image_file) {
      const uploadedUrl = await uploadImage(specialFormData.image_file, 'special')
      if (uploadedUrl) imageUrl = uploadedUrl
    }
    
    const { data: existingMenu } = await supabase
      .from('menu')
      .select('id, name, price, image_url')
      .eq('name', specialFormData.name)
      .maybeSingle()
    
    let menuItemId
    
    if (existingMenu) {
      menuItemId = existingMenu.id
      await supabase
        .from('menu')
        .update({ 
          price: parseFloat(specialFormData.price),
          image_url: imageUrl || existingMenu.image_url,
          description: specialFormData.description || existingMenu.description
        })
        .eq('id', menuItemId)
    } else {
      const { data: newMenu, error: menuError } = await supabase
        .from('menu')
        .insert([{ 
          name: specialFormData.name, 
          price: parseFloat(specialFormData.price), 
          category: 'Istimewa',
          stock: parseInt(specialFormData.stock) || 0, 
          image_url: imageUrl || null,
          description: specialFormData.description || '',
          has_options: false,
          sort_order: 0
        }])
        .select()
      
      if (menuError) {
        setMessage(`❌ ${translate('error')}: ${menuError.message}`)
        return
      }
      menuItemId = newMenu[0].id
    }
    
    const newItem = { 
      id: Date.now(), 
      name: specialFormData.name, 
      price: parseFloat(specialFormData.price),
      stock: parseInt(specialFormData.stock) || 0, 
      image_url: imageUrl || null, 
      description: specialFormData.description || '',
      menu_id: menuItemId
    }
    
    const updatedItems = [...specialItems, newItem]
    setSpecialItems(updatedItems)
    
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'special_menu_items', value: JSON.stringify(updatedItems) }, { onConflict: 'key' })
    
    if (error) { 
      setMessage(`❌ ${translate('error')}: ${error.message}`) 
    } else { 
      setMessage(translate('special_added'))
      setShowAddSpecialModal(false)
      setSpecialFormData({ name: '', price: '', stock: '', image_url: '', image_file: null, description: '' })
      loadSpecialMenu()
      loadMenu()
      loadAvailableMenu()
    }
    setTimeout(() => setMessage(''), 2000)
  }

  async function updateSpecialItem() {
    if (!specialFormData.name || !specialFormData.price) { 
      setMessage(`⚠️ ${translate('name')} ${translate('and')} ${translate('price')} ${translate('required')}`)
      return 
    }
    
    let imageUrl = specialFormData.image_url
    if (specialFormData.image_file) {
      const uploadedUrl = await uploadImage(specialFormData.image_file, 'special')
      if (uploadedUrl) imageUrl = uploadedUrl
    }
    
    const updatedItems = specialItems.map(item => 
      item.id === selectedSpecialItem.id 
        ? { 
            ...item, 
            name: specialFormData.name, 
            price: parseFloat(specialFormData.price),
            stock: parseInt(specialFormData.stock) || 0, 
            image_url: imageUrl || item.image_url, 
            description: specialFormData.description || item.description
          } 
        : item
    )
    setSpecialItems(updatedItems)
    
    const specialItem = updatedItems.find(item => item.id === selectedSpecialItem.id)
    if (specialItem && specialItem.menu_id) {
      await supabase
        .from('menu')
        .update({ 
          name: specialItem.name,
          price: specialItem.price,
          image_url: specialItem.image_url,
          description: specialItem.description
        })
        .eq('id', specialItem.menu_id)
    }
    
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'special_menu_items', value: JSON.stringify(updatedItems) }, { onConflict: 'key' })
    
    if (error) { 
      setMessage(`❌ ${translate('error')}: ${error.message}`) 
    } else { 
      setMessage(translate('special_updated'))
      setShowEditSpecialModal(false)
      setSelectedSpecialItem(null)
      setSpecialFormData({ name: '', price: '', stock: '', image_url: '', image_file: null, description: '' })
      loadSpecialMenu()
      loadMenu()
      loadAvailableMenu()
    }
    setTimeout(() => setMessage(''), 2000)
  }

  async function deleteSpecialItem(id, name) {
    if (window.confirm(`${translate('confirm_delete')} "${name}"?`)) {
      const updatedItems = specialItems.filter(item => item.id !== id)
      setSpecialItems(updatedItems)
      const { error } = await supabase.from('settings').upsert({ key: 'special_menu_items', value: JSON.stringify(updatedItems) }, { onConflict: 'key' })
      if (error) { 
        setMessage(`❌ ${translate('error')}: ${error.message}`) 
      } else { 
        setMessage(`🗑️ "${name}" ${translate('deleted')}`)
        loadSpecialMenu() 
      }
      setTimeout(() => setMessage(''), 2000)
    }
  }

  // ============================================================
  // PROMOTIONS FUNCTIONS
  // ============================================================
  async function addPromotion() {
    if (!promoFormData.name) { 
      setMessage(`⚠️ ${translate('promo_name')} ${translate('required')}`)
      return 
    }
    let imageUrl = promoFormData.image_url
    if (promoFormData.image_file) {
      const uploadedUrl = await uploadImage(promoFormData.image_file, 'promo')
      if (uploadedUrl) imageUrl = uploadedUrl
    }
    let promoData = {}
    if (promoFormData.type === 'bogo') {
      const triggerItem = availableMenuItems.find(i => i.id === promoFormData.trigger_item_id)
      const freeItem = availableMenuItems.find(i => i.id === promoFormData.free_item_id)
      promoData = {
        name: promoFormData.name, type: 'bogo',
        trigger_items: [{ id: triggerItem?.id, name: triggerItem?.name, price: triggerItem?.price, category: triggerItem?.category }],
        free_items: [{ id: freeItem?.id, name: freeItem?.name, price: freeItem?.price, category: freeItem?.category }],
        start_date: promoFormData.start_date || null, end_date: promoFormData.end_date || null,
        is_active: promoFormData.is_active, image_url: imageUrl || null
      }
    } else {
      const bundleItems = promoFormData.selected_bundle_items.map(itemId => {
        const item = availableMenuItems.find(i => i.id === itemId)
        return { id: item?.id, name: item?.name, price: item?.price, category: item?.category }
      })
      promoData = {
        name: promoFormData.name, type: promoFormData.type,
        bundle_items: bundleItems, bundle_price: parseFloat(promoFormData.bundle_price) || 0,
        start_date: promoFormData.start_date || null, end_date: promoFormData.end_date || null,
        is_active: promoFormData.is_active, image_url: imageUrl || null
      }
    }
    const { error } = await supabase.from('promotions').insert([promoData])
    if (error) { 
      setMessage(`❌ ${translate('error')}: ${error.message}`) 
    } else { 
      setMessage(translate('promo_added'))
      setShowAddPromoModal(false)
      resetPromoForm()
      loadPromotions() 
    }
    setTimeout(() => setMessage(''), 2000)
  }

  async function updatePromotion() {
    if (!promoFormData.name) { 
      setMessage(`⚠️ ${translate('promo_name')} ${translate('required')}`)
      return 
    }
    let imageUrl = promoFormData.image_url
    if (promoFormData.image_file) {
      const uploadedUrl = await uploadImage(promoFormData.image_file, 'promo')
      if (uploadedUrl) imageUrl = uploadedUrl
    }
    let promoData = {}
    if (promoFormData.type === 'bogo') {
      const triggerItem = availableMenuItems.find(i => i.id === promoFormData.trigger_item_id)
      const freeItem = availableMenuItems.find(i => i.id === promoFormData.free_item_id)
      promoData = {
        name: promoFormData.name, type: 'bogo',
        trigger_items: [{ id: triggerItem?.id, name: triggerItem?.name, price: triggerItem?.price, category: triggerItem?.category }],
        free_items: [{ id: freeItem?.id, name: freeItem?.name, price: freeItem?.price, category: freeItem?.category }],
        start_date: promoFormData.start_date || null, end_date: promoFormData.end_date || null,
        is_active: promoFormData.is_active, image_url: imageUrl || null
      }
    } else {
      const bundleItems = promoFormData.selected_bundle_items.map(itemId => {
        const item = availableMenuItems.find(i => i.id === itemId)
        return { id: item?.id, name: item?.name, price: item?.price, category: item?.category }
      })
      promoData = {
        name: promoFormData.name, type: promoFormData.type,
        bundle_items: bundleItems, bundle_price: parseFloat(promoFormData.bundle_price) || 0,
        start_date: promoFormData.start_date || null, end_date: promoFormData.end_date || null,
        is_active: promoFormData.is_active, image_url: imageUrl || null
      }
    }
    const { error } = await supabase.from('promotions').update(promoData).eq('id', selectedPromo.id)
    if (error) { 
      setMessage(`❌ ${translate('error')}: ${error.message}`) 
    } else { 
      setMessage(translate('promo_updated'))
      setShowEditPromoModal(false)
      setSelectedPromo(null)
      resetPromoForm()
      loadPromotions() 
    }
    setTimeout(() => setMessage(''), 2000)
  }

  async function deletePromotion(id, name) {
    if (window.confirm(`${translate('confirm_delete')} "${name}"?`)) {
      const { error } = await supabase.from('promotions').delete().eq('id', id)
      if (error) { 
        setMessage(`❌ ${translate('error')}: ${error.message}`) 
      } else { 
        setMessage(`🗑️ "${name}" ${translate('deleted')}`)
        loadPromotions() 
      }
      setTimeout(() => setMessage(''), 2000)
    }
  }

  async function togglePromoStatus(id, currentStatus) {
    const { error } = await supabase.from('promotions').update({ is_active: !currentStatus }).eq('id', id)
    if (error) { 
      setMessage(`❌ ${translate('error')}: ${error.message}`) 
    } else { 
      setMessage(currentStatus ? translate('promo_disabled') : translate('promo_enabled'))
      loadPromotions() 
    }
    setTimeout(() => setMessage(''), 2000)
  }

  const resetPromoForm = () => {
    setPromoFormData({
      name: '', type: 'set_menu', trigger_item_id: null, free_item_id: null,
      selected_bundle_items: [], bundle_price: 0, start_date: '', end_date: '',
      is_active: true, image_url: '', image_file: null
    })
  }

  const openEditPromoModal = (promo) => {
    let selectedBundleItems = []
    let triggerItemId = null, freeItemId = null
    if (promo.type === 'bogo') {
      triggerItemId = promo.trigger_items?.[0]?.id || null
      freeItemId = promo.free_items?.[0]?.id || null
    } else if (promo.bundle_items) {
      selectedBundleItems = promo.bundle_items.map(item => {
        const found = availableMenuItems.find(i => i.name === item.name)
        return found ? found.id : null
      }).filter(id => id !== null)
    }
    setSelectedPromo(promo)
    setPromoFormData({
      name: promo.name, type: promo.type, trigger_item_id: triggerItemId, free_item_id: freeItemId,
      selected_bundle_items: selectedBundleItems, bundle_price: promo.bundle_price || 0,
      start_date: promo.start_date || '', end_date: promo.end_date || '',
      is_active: promo.is_active, image_url: promo.image_url || '', image_file: null
    })
    setShowEditPromoModal(true)
  }

  // ============================================================
  // MENU OPTIONS (SIZE)
  // ============================================================
  async function loadMenuOptions(menuId) {
    const { data } = await supabase
      .from('menu_options')
      .select('*')
      .eq('menu_id', menuId)
      .order('sort_order')
    setMenuOptions(data || [])
  }

  async function addMenuOption() {
    if (!optionForm.option_name || !optionForm.price_adjustment) {
      setMessage(`⚠️ ${translate('size_name')} ${translate('and')} ${translate('price')} ${translate('required')}`)
      setTimeout(() => setMessage(''), 2000)
      return
    }

    const { error } = await supabase
      .from('menu_options')
      .insert([{
        menu_id: selectedMenuForOptions.id,
        option_name: optionForm.option_name,
        price_adjustment: parseFloat(optionForm.price_adjustment),
        is_absolute_price: optionForm.is_absolute_price,
        sort_order: parseInt(optionForm.sort_order) || 0,
        available: true
      }])

    if (error) {
      setMessage(`❌ ${translate('error')}: ${error.message}`)
    } else {
      setMessage(translate('option_added'))
      await loadMenuOptions(selectedMenuForOptions.id)
      setOptionForm({ option_name: '', price_adjustment: '', is_absolute_price: true, sort_order: 0 })
      await supabase.from('menu').update({ has_options: true }).eq('id', selectedMenuForOptions.id)
      await loadAvailableMenu()
    }
    setTimeout(() => setMessage(''), 2000)
  }

  async function updateMenuOption() {
    if (!optionForm.option_name || !optionForm.price_adjustment) {
      setMessage(`⚠️ ${translate('size_name')} ${translate('and')} ${translate('price')} ${translate('required')}`)
      setTimeout(() => setMessage(''), 2000)
      return
    }

    const { error } = await supabase
      .from('menu_options')
      .update({
        option_name: optionForm.option_name,
        price_adjustment: parseFloat(optionForm.price_adjustment),
        is_absolute_price: optionForm.is_absolute_price,
        sort_order: parseInt(optionForm.sort_order) || 0
      })
      .eq('id', editingOption.id)

    if (error) {
      setMessage(`❌ ${translate('error')}: ${error.message}`)
    } else {
      setMessage(translate('option_updated'))
      await loadMenuOptions(selectedMenuForOptions.id)
      setEditingOption(null)
      setOptionForm({ option_name: '', price_adjustment: '', is_absolute_price: true, sort_order: 0 })
    }
    setTimeout(() => setMessage(''), 2000)
  }

  async function deleteMenuOption(optionId) {
    if (!window.confirm(translate('confirm_delete'))) return

    const { error } = await supabase
      .from('menu_options')
      .delete()
      .eq('id', optionId)

    if (error) {
      setMessage(`❌ ${translate('error')}: ${error.message}`)
    } else {
      setMessage(translate('option_deleted'))
      await loadMenuOptions(selectedMenuForOptions.id)
      
      const { count } = await supabase
        .from('menu_options')
        .select('*', { count: 'exact', head: true })
        .eq('menu_id', selectedMenuForOptions.id)
      
      if (count === 0) {
        await supabase.from('menu').update({ has_options: false }).eq('id', selectedMenuForOptions.id)
        await loadAvailableMenu()
      }
    }
    setTimeout(() => setMessage(''), 2000)
  }

  const openEditOption = (option) => {
    setEditingOption(option)
    setOptionForm({
      option_name: option.option_name,
      price_adjustment: option.price_adjustment,
      is_absolute_price: option.is_absolute_price,
      sort_order: option.sort_order
    })
  }

  // ============================================================
  // EDIT FUNCTIONS - FIXED
  // ============================================================
  const openEditModal = (item) => { 
    console.log('🔄 Opening edit modal for:', item?.name)
    setSelectedItem(item)
    setFormData({ 
      name: item?.name || '', 
      price: item?.price || '', 
      category: item?.category || '', 
      stock: item?.stock || 0, 
      image_url: item?.image_url || '', 
      image_file: null,
      description: item?.description || ''
    })
    setShowEditModal(true) 
  }
  
  const openEditSpecialModal = (item) => { 
    setSelectedSpecialItem(item)
    setSpecialFormData({ 
      name: item?.name || '', 
      price: item?.price || '', 
      stock: item?.stock || '', 
      image_url: item?.image_url || '', 
      image_file: null, 
      description: item?.description || '' 
    })
    setShowEditSpecialModal(true) 
  }
  
  const getDrinkOptionsForItem = (itemName) => {
    return drinkOptions.filter(opt => opt.drink_name === itemName)
  }

  async function quickEditStock(item) {
    const newStock = prompt(`${translate('stock')} "${item.name}"`, item.stock || 0)
    if (newStock !== null && !isNaN(newStock) && newStock >= 0) {
      const { error } = await supabase.from('menu').update({ stock: parseInt(newStock) }).eq('id', item.id)
      if (error) { 
        setMessage(`❌ ${translate('error')}: ${error.message}`) 
      } else { 
        setMessage(`✅ ${item.name} ${translate('stock_updated_to')} ${newStock}`)
        await loadMenu()
        await loadAvailableMenu() 
      }
      setTimeout(() => setMessage(''), 2000)
    }
  }

  // ============================================================
  // FILTERS & PAGINATION
  // ============================================================
  const categoriesForFilter = getCategoriesForFilter()
  
  const filteredMenu = activeCategory === 'all' 
    ? menu.filter(item => item.name.toLowerCase().includes(searchMenuTerm.toLowerCase()))
    : menu.filter(item => item.category === activeCategory && item.name.toLowerCase().includes(searchMenuTerm.toLowerCase()))
  
  const totalItems = filteredMenu.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredMenu.slice(startIndex, endIndex)

  const getStockColor = (stock) => {
    if (stock <= 0) return '#ef4444'
    if (stock <= 10) return '#f59e0b'
    return '#22c55e'
  }

  const getStockText = (stock) => {
    if (stock <= 0) return translate('out_of_stock')
    if (stock <= 10) return translate('low_stock')
    return translate('ok')
  }

  // ============================================================
  // PAGINATION COMPONENT
  // ============================================================
  const PaginationComponent = () => {
    if (totalPages <= 1) return null
    const pageNumbers = []
    for (let i = 1; i <= Math.min(totalPages, 5); i++) pageNumbers.push(i)
    if (totalPages > 5) pageNumbers.push('...', totalPages)
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: isMobile ? '4px' : '8px', 
        marginTop: '30px', 
        flexWrap: 'wrap' 
      }}>
        <button 
          onClick={() => setCurrentPage(1)} 
          disabled={currentPage === 1} 
          style={{ 
            padding: isMobile ? '6px 12px' : '8px 16px', 
            background: currentPage === 1 ? secondaryBg : '#3b82f6', 
            color: currentPage === 1 ? textMuted : 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer', 
            fontWeight: 'bold', 
            fontSize: isMobile ? '12px' : '14px',
            transition: 'all 0.2s'
          }}
        >
          «
        </button>
        <button 
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
          disabled={currentPage === 1} 
          style={{ 
            padding: isMobile ? '6px 12px' : '8px 16px', 
            background: currentPage === 1 ? secondaryBg : '#3b82f6', 
            color: currentPage === 1 ? textMuted : 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer', 
            fontWeight: 'bold', 
            fontSize: isMobile ? '12px' : '14px',
            transition: 'all 0.2s'
          }}
        >
          ‹
        </button>
        {pageNumbers.map((num, idx) => typeof num === 'number' ? (
          <button 
            key={idx} 
            onClick={() => setCurrentPage(num)} 
            style={{ 
              minWidth: isMobile ? '34px' : '40px', 
              padding: isMobile ? '6px 10px' : '8px 14px', 
              background: currentPage === num ? '#22c55e' : cardBg, 
              color: currentPage === num ? 'white' : textColor, 
              border: `1px solid ${borderColor}`, 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: currentPage === num ? 'bold' : '500', 
              fontSize: isMobile ? '12px' : '14px',
              transition: 'all 0.2s'
            }}
          >
            {num}
          </button>
        ) : (
          <span key={idx} style={{ padding: '8px 8px', color: textMuted }}>...</span>
        ))}
        <button 
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
          disabled={currentPage === totalPages} 
          style={{ 
            padding: isMobile ? '6px 12px' : '8px 16px', 
            background: currentPage === totalPages ? secondaryBg : '#3b82f6', 
            color: currentPage === totalPages ? textMuted : 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', 
            fontWeight: 'bold', 
            fontSize: isMobile ? '12px' : '14px',
            transition: 'all 0.2s'
          }}
        >
          ›
        </button>
        <button 
          onClick={() => setCurrentPage(totalPages)} 
          disabled={currentPage === totalPages} 
          style={{ 
            padding: isMobile ? '6px 12px' : '8px 16px', 
            background: currentPage === totalPages ? secondaryBg : '#3b82f6', 
            color: currentPage === totalPages ? textMuted : 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', 
            fontWeight: 'bold', 
            fontSize: isMobile ? '12px' : '14px',
            transition: 'all 0.2s'
          }}
        >
          »
        </button>
      </div>
    )
  }

  const menuGridCols = isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))'

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <Sidebar>
        <div style={{ 
          padding: '20px', 
          maxWidth: '1280px', 
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
  // RENDER
  // ============================================================
  return (
    <Sidebar>
      <div style={{ 
        padding: isMobile ? '12px' : '24px', 
        maxWidth: '1280px', 
        margin: '0 auto', 
        background: bgColor, 
        minHeight: '100vh' 
      }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ 
            color: textColor, 
            margin: 0, 
            fontSize: isMobile ? '24px' : '30px', 
            fontWeight: 'bold' 
          }}>
            {translate('manage_menu')}
          </h1>
          <p style={{ 
            color: textMuted, 
            marginTop: '4px', 
            fontSize: isMobile ? '13px' : '15px' 
          }}>
            {translate('manage_menu_sub')}
            <span style={{ 
              marginLeft: '8px', 
              background: '#3b82f6', 
              color: 'white', 
              padding: '2px 10px', 
              borderRadius: '12px', 
              fontSize: '10px' 
            }}>
              {translate('drag_hint')}
            </span>
          </p>
        </div>

        {/* TABS */}
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          marginBottom: '24px', 
          background: darkMode ? 'rgba(45, 45, 68, 0.4)' : 'rgba(0,0,0,0.03)', 
          borderRadius: '50px', 
          padding: '4px', 
          flexWrap: 'wrap' 
        }}>
          <button 
            onClick={() => setActiveTab('regular')} 
            style={{ 
              padding: isMobile ? '10px 18px' : '12px 28px', 
              background: activeTab === 'regular' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent', 
              color: activeTab === 'regular' ? 'white' : textColor, 
              border: 'none', 
              borderRadius: '50px', 
              cursor: 'pointer', 
              fontWeight: activeTab === 'regular' ? 'bold' : '500', 
              fontSize: isMobile ? '13px' : '15px',
              transition: 'all 0.2s',
              flex: isMobile ? '1' : 'auto'
            }}
          >
            {translate('regular_menu')}
          </button>
          <button 
            onClick={() => setActiveTab('special')} 
            style={{ 
              padding: isMobile ? '10px 18px' : '12px 28px', 
              background: activeTab === 'special' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent', 
              color: activeTab === 'special' ? 'white' : textColor, 
              border: 'none', 
              borderRadius: '50px', 
              cursor: 'pointer', 
              fontWeight: activeTab === 'special' ? 'bold' : '500', 
              fontSize: isMobile ? '13px' : '15px',
              transition: 'all 0.2s',
              flex: isMobile ? '1' : 'auto'
            }}
          >
            {translate('special_menu')}
          </button>
          <button 
            onClick={() => setActiveTab('promotions')} 
            style={{ 
              padding: isMobile ? '10px 18px' : '12px 28px', 
              background: activeTab === 'promotions' ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'transparent', 
              color: activeTab === 'promotions' ? 'white' : textColor, 
              border: 'none', 
              borderRadius: '50px', 
              cursor: 'pointer', 
              fontWeight: activeTab === 'promotions' ? 'bold' : '500', 
              fontSize: isMobile ? '13px' : '15px',
              transition: 'all 0.2s',
              flex: isMobile ? '1' : 'auto'
            }}
          >
            {translate('promotions')}
          </button>
        </div>

        {/* ========================================================== */}
        {/* REGULAR TAB */}
        {/* ========================================================== */}
        {activeTab === 'regular' && (
          <>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '10px', 
              marginBottom: '20px', 
              flexWrap: 'wrap' 
            }}>
              <button 
                onClick={() => setShowAddModal(true)} 
                style={{ 
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)', 
                  color: 'white', 
                  padding: isMobile ? '10px 18px' : '12px 24px', 
                  border: 'none', 
                  borderRadius: '40px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold', 
                  fontSize: isMobile ? '13px' : '14px', 
                  boxShadow: '0 4px 15px rgba(34,197,94,0.3)',
                  transition: 'all 0.2s'
                }}
              >
                {translate('add_menu')}
              </button>
              <button 
                onClick={() => setShowDrinkModal(true)} 
                style={{ 
                  background: 'linear-gradient(135deg, #06b6d4, #0891b2)', 
                  color: 'white', 
                  padding: isMobile ? '10px 18px' : '12px 24px', 
                  border: 'none', 
                  borderRadius: '40px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold', 
                  fontSize: isMobile ? '13px' : '14px', 
                  boxShadow: '0 4px 15px rgba(6,182,212,0.3)',
                  transition: 'all 0.2s'
                }}
              >
                {translate('add_drink')}
              </button>
            </div>

            {message && (
              <div style={{ 
                background: message.includes('✅') || message.includes('✔') 
                  ? (darkMode ? 'rgba(34,197,94,0.15)' : '#dcfce7') 
                  : (darkMode ? 'rgba(239,68,68,0.15)' : '#fee2e2'), 
                color: message.includes('✅') || message.includes('✔') 
                  ? (darkMode ? '#4ade80' : '#166534') 
                  : (darkMode ? '#f87171' : '#991b1b'), 
                padding: '12px 20px', 
                borderRadius: '40px', 
                marginBottom: '20px', 
                textAlign: 'center', 
                fontSize: isMobile ? '13px' : '14px', 
                border: `1px solid ${message.includes('✅') || message.includes('✔') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                fontWeight: '500'
              }}>
                {message}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                ...glassEffect, 
                borderRadius: '50px', 
                padding: '4px 20px', 
                display: 'flex', 
                alignItems: 'center',
                background: darkMode ? 'rgba(25,25,45,0.6)' : 'rgba(255,255,255,0.8)'
              }}>
                <span style={{ fontSize: isMobile ? '16px' : '20px', marginRight: '12px', color: textMuted }}>🔍</span>
                <input 
                  type="text" 
                  placeholder={translate('search_menu')} 
                  value={searchMenuTerm} 
                  onChange={(e) => setSearchMenuTerm(e.target.value)} 
                  style={{ 
                    width: '100%', 
                    padding: isMobile ? '12px 0' : '14px 0', 
                    border: 'none', 
                    background: 'transparent', 
                    color: textColor, 
                    fontSize: isMobile ? '14px' : '15px', 
                    outline: 'none',
                    fontWeight: '500'
                  }} 
                />
                {searchMenuTerm && (
                  <button 
                    onClick={() => setSearchMenuTerm('')} 
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      color: textMuted, 
                      cursor: 'pointer',
                      fontSize: '18px',
                      padding: '4px',
                      transition: 'all 0.2s'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* CATEGORY FILTERS */}
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              flexWrap: 'wrap', 
              marginBottom: '20px',
              padding: '4px',
              alignItems: 'center'
            }}>
              <button 
                onClick={() => setActiveCategory('all')} 
                style={{ 
                  padding: isMobile ? '8px 18px' : '10px 24px', 
                  background: activeCategory === 'all' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent', 
                  color: activeCategory === 'all' ? 'white' : textColor, 
                  border: activeCategory === 'all' ? 'none' : `1px solid ${borderColor}`, 
                  borderRadius: '50px', 
                  cursor: 'pointer', 
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: activeCategory === 'all' ? 'bold' : '500',
                  transition: 'all 0.2s'
                }}
              >
                🍽️ {translate('all')}
              </button>
              
              <DndContext
                sensors={categorySensors}
                collisionDetection={closestCenter}
                onDragEnd={handleCategoryDragEnd}
              >
                <SortableContext
                  items={categoriesForFilter}
                  strategy={horizontalListSortingStrategy}
                >
                  {categoriesForFilter.map(catName => {
                    const icon = getCategoryIcon(catName)
                    return (
                      <SortableCategoryButton
                        key={catName}
                        category={catName}
                        icon={icon}
                        isActive={activeCategory === catName}
                        onClick={() => setActiveCategory(catName)}
                        isMobile={isMobile}
                        textColor={textColor}
                        borderColor={borderColor}
                      >
                        {catName}
                      </SortableCategoryButton>
                    )
                  })}
                </SortableContext>
              </DndContext>
            </div>

            {filteredMenu.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: isMobile ? '40px 20px' : '80px 20px', 
                ...glassEffect, 
                borderRadius: '28px' 
              }}>
                <span style={{ fontSize: isMobile ? '48px' : '64px', opacity: 0.5 }}>🍽️</span>
                <p style={{ color: textMuted, marginTop: '12px', fontSize: isMobile ? '14px' : '16px' }}>
                  {translate('no_menu')}
                </p>
              </div>
            ) : (
              <>
                <DndContext
                  sensors={menuSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleMenuDragEnd}
                >
                  <SortableContext
                    items={currentItems.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: menuGridCols, 
                      gap: isMobile ? '14px' : '20px' 
                    }}>
                      {currentItems.map(item => {
                        const drinkOpts = getDrinkOptionsForItem(item.name)
                        const hasDrinkOptions = drinkOpts.length > 0
                        const panasPrice = drinkOpts.find(o => o.option_type === 'Panas')?.price
                        const sejukPrice = drinkOpts.find(o => o.option_type === 'Sejuk')?.price
                        const bungkusPrice = drinkOpts.find(o => o.option_type === 'Bungkus')?.price
                        const stockColor = getStockColor(item.stock || 0)
                        const stockStatus = getStockText(item.stock || 0)
                        const hasImage = item.image_url && item.image_url !== null && item.image_url !== ''
                        const hasDescription = item.description && item.description.trim() !== ''
                        
                        return (
                          <SortableMenuItem key={item.id} item={item}>
                            <div 
                              className="card-hover"
                              style={{ 
                                ...glassEffect, 
                                borderRadius: '16px', 
                                padding: isMobile ? '14px' : '20px',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'default',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                position: 'relative'
                              }}
                            >
                              <div style={{ 
                                display: 'flex', 
                                gap: '14px', 
                                alignItems: 'center',
                                flexDirection: isMobile ? 'column' : 'row'
                              }}>
                                <div style={{ flexShrink: 0 }}>
                                  {hasImage ? (
                                    <div style={{ position: 'relative' }}>
                                      <img 
                                        src={item.image_url} 
                                        alt={item.name} 
                                        style={{ 
                                          width: isMobile ? '64px' : '72px', 
                                          height: isMobile ? '64px' : '72px', 
                                          objectFit: 'cover', 
                                          borderRadius: '12px',
                                          border: `1px solid ${borderColor}`
                                        }} 
                                      />
                                      <button 
                                        onClick={() => deleteImage(item.image_url, item.id)} 
                                        style={{ 
                                          position: 'absolute', 
                                          top: '-6px', 
                                          right: '-6px', 
                                          background: '#ef4444', 
                                          color: 'white', 
                                          borderRadius: '50%', 
                                          width: '20px', 
                                          height: '20px', 
                                          fontSize: '10px', 
                                          cursor: 'pointer', 
                                          border: 'none',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          transition: 'all 0.2s'
                                        }}
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <div style={{ 
                                      width: isMobile ? '64px' : '72px', 
                                      height: isMobile ? '64px' : '72px', 
                                      background: secondaryBg, 
                                      borderRadius: '12px', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center', 
                                      fontSize: isMobile ? '30px' : '34px',
                                      border: `1px solid ${borderColor}`
                                    }}>
                                      {item.category === 'Makanan' ? '🍚' : '🥤'}
                                    </div>
                                  )}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ 
                                    fontWeight: 'bold', 
                                    fontSize: isMobile ? '15px' : '17px', 
                                    color: textColor,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}>
                                    {item.name}
                                  </div>
                                  <div style={{ 
                                    color: '#22c55e', 
                                    fontWeight: 'bold', 
                                    fontSize: isMobile ? '15px' : '17px' 
                                  }}>
                                    RM {item.price}
                                  </div>
                                  <div style={{ 
                                    fontSize: isMobile ? '11px' : '12px', 
                                    color: textMuted,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    flexWrap: 'wrap'
                                  }}>
                                    <span>{item.category}</span>
                                    {item.has_options && (
                                      <span style={{ 
                                        background: '#8b5cf6', 
                                        color: 'white', 
                                        padding: '2px 10px', 
                                        borderRadius: '12px', 
                                        fontSize: '9px',
                                        fontWeight: 'bold'
                                      }}>
                                        ⚙️ Size
                                      </span>
                                    )}
                                  </div>
                                  {hasDescription && (
                                    <div style={{ 
                                      fontSize: isMobile ? '11px' : '12px', 
                                      color: textMuted,
                                      marginTop: '4px',
                                      fontStyle: 'italic',
                                      background: secondaryBg,
                                      padding: '4px 10px',
                                      borderRadius: '8px',
                                      border: `1px solid ${borderColor}`
                                    }}>
                                      📝 {item.description}
                                    </div>
                                  )}
                                </div>

                                <div style={{ 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  alignItems: 'center',
                                  gap: '6px',
                                  flexShrink: 0
                                }}>
                                  <div style={{ 
                                    background: stockColor, 
                                    color: 'white', 
                                    padding: '4px 10px', 
                                    borderRadius: '20px', 
                                    fontSize: isMobile ? '10px' : '11px',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    minWidth: '60px'
                                  }}>
                                    {translate('stock')}: {item.stock || 0}
                                    <span style={{ 
                                      background: 'rgba(255,255,255,0.25)', 
                                      padding: '1px 6px', 
                                      borderRadius: '12px', 
                                      marginLeft: '4px',
                                      fontSize: '8px'
                                    }}>
                                      {stockStatus}
                                    </span>
                                  </div>
                                  
                                  <div style={{ 
                                    display: 'flex', 
                                    gap: '4px', 
                                    flexWrap: 'wrap',
                                    justifyContent: 'center'
                                  }}>
                                    <button 
                                      onClick={() => quickEditStock(item)} 
                                      style={{ 
                                        background: '#06b6d4', 
                                        color: 'white', 
                                        padding: '4px 8px', 
                                        border: 'none', 
                                        borderRadius: '16px', 
                                        cursor: 'pointer', 
                                        fontSize: isMobile ? '9px' : '10px',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s'
                                      }}
                                      title={translate('stock')}
                                    >
                                      📦
                                    </button>
                                    <button 
                                      onClick={(e) => { 
                                       e.stopPropagation()
                                        console.log('🖱️ EDIT BUTTON CLICKED - Item:', item.name) 
                                         openEditModal(item)
                                         }} 
                                        style={{  
                                        background: '#f59e0b',   
                                        color: 'white', 
                                        padding: '4px 8px',  
                                        border: 'none',  
                                        borderRadius: '16px', 
                                        cursor: 'pointer', 
                                        fontSize: isMobile ? '9px' : '10px',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s'
                                      }}
                                      title={translate('edit')}
                                    >
                                      ✏️
                                    </button>
                                    <button 
                                      onClick={() => { 
                                        setSelectedMenuForOptions(item); 
                                        loadMenuOptions(item.id); 
                                        setShowOptionsModal(true); 
                                      }} 
                                      style={{ 
                                        background: '#8b5cf6', 
                                        color: 'white', 
                                        padding: '4px 8px', 
                                        border: 'none', 
                                        borderRadius: '16px', 
                                        cursor: 'pointer', 
                                        fontSize: isMobile ? '9px' : '10px',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s'
                                      }}
                                      title={translate('size_options')}
                                    >
                                      ⚙️
                                    </button>
                                    <button 
                                      onClick={() => deleteMenuItem(item.id, item.name)} 
                                      style={{ 
                                        background: '#ef4444', 
                                        color: 'white', 
                                        padding: '4px 8px', 
                                        border: 'none', 
                                        borderRadius: '16px', 
                                        cursor: 'pointer', 
                                        fontSize: isMobile ? '9px' : '10px',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s'
                                      }}
                                      title={translate('delete')}
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {hasDrinkOptions && (
                                <div style={{ 
                                  marginTop: '4px', 
                                  paddingTop: '12px', 
                                  borderTop: `1px solid ${borderColor}`,
                                  display: 'flex',
                                  justifyContent: 'center',
                                  gap: isMobile ? '10px' : '16px',
                                  flexWrap: 'wrap',
                                  background: secondaryBg,
                                  borderRadius: '12px',
                                  padding: '10px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#f97316', fontWeight: 'bold' }}>🔥</span>
                                    <input 
                                      type="number" 
                                      step="0.01" 
                                      value={drinkPriceEdits[`${item.name}_Panas`] !== undefined ? drinkPriceEdits[`${item.name}_Panas`] : (panasPrice || '')} 
                                      onChange={(e) => handleDrinkPriceChange(item.name, 'Panas', e.target.value)} 
                                      style={{ 
                                        width: isMobile ? '55px' : '65px', 
                                        padding: '4px 6px', 
                                        borderRadius: '8px', 
                                        border: `1px solid ${borderColor}`, 
                                        background: inputBg, 
                                        color: inputText, 
                                        fontSize: isMobile ? '11px' : '12px',
                                        textAlign: 'center'
                                      }} 
                                    />
                                    <button 
                                      onClick={() => handleDrinkPriceSave(item.name, 'Panas')} 
                                      style={{ 
                                        background: '#22c55e', 
                                        color: 'white', 
                                        padding: '2px 8px', 
                                        border: 'none', 
                                        borderRadius: '12px', 
                                        cursor: 'pointer', 
                                        fontSize: isMobile ? '9px' : '10px',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s'
                                      }}
                                      title={translate('save')}
                                    >
                                      ✓
                                    </button>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#06b6d4', fontWeight: 'bold' }}>🧊</span>
                                    <input 
                                      type="number" 
                                      step="0.01" 
                                      value={drinkPriceEdits[`${item.name}_Sejuk`] !== undefined ? drinkPriceEdits[`${item.name}_Sejuk`] : (sejukPrice || '')} 
                                      onChange={(e) => handleDrinkPriceChange(item.name, 'Sejuk', e.target.value)} 
                                      style={{ 
                                        width: isMobile ? '55px' : '65px', 
                                        padding: '4px 6px', 
                                        borderRadius: '8px', 
                                        border: `1px solid ${borderColor}`, 
                                        background: inputBg, 
                                        color: inputText, 
                                        fontSize: isMobile ? '11px' : '12px',
                                        textAlign: 'center'
                                      }} 
                                    />
                                    <button 
                                      onClick={() => handleDrinkPriceSave(item.name, 'Sejuk')} 
                                      style={{ 
                                        background: '#22c55e', 
                                        color: 'white', 
                                        padding: '2px 8px', 
                                        border: 'none', 
                                        borderRadius: '12px', 
                                        cursor: 'pointer', 
                                        fontSize: isMobile ? '9px' : '10px',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s'
                                      }}
                                      title={translate('save')}
                                    >
                                      ✓
                                    </button>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#8b5cf6', fontWeight: 'bold' }}>📦</span>
                                    <input 
                                      type="number" 
                                      step="0.01" 
                                      value={drinkPriceEdits[`${item.name}_Bungkus`] !== undefined ? drinkPriceEdits[`${item.name}_Bungkus`] : (bungkusPrice || '')} 
                                      onChange={(e) => handleDrinkPriceChange(item.name, 'Bungkus', e.target.value)} 
                                      style={{ 
                                        width: isMobile ? '55px' : '65px', 
                                        padding: '4px 6px', 
                                        borderRadius: '8px', 
                                        border: `1px solid ${borderColor}`, 
                                        background: inputBg, 
                                        color: inputText, 
                                        fontSize: isMobile ? '11px' : '12px',
                                        textAlign: 'center'
                                      }} 
                                    />
                                    <button 
                                      onClick={() => handleDrinkPriceSave(item.name, 'Bungkus')} 
                                      style={{ 
                                        background: '#22c55e', 
                                        color: 'white', 
                                        padding: '2px 8px', 
                                        border: 'none', 
                                        borderRadius: '12px', 
                                        cursor: 'pointer', 
                                        fontSize: isMobile ? '9px' : '10px',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s'
                                      }}
                                      title={translate('save')}
                                    >
                                      ✓
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </SortableMenuItem>
                        )
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
                
                <PaginationComponent />
                
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: '16px', 
                  fontSize: isMobile ? '12px' : '13px', 
                  color: textMuted 
                }}>
                  {translate('showing')} {startIndex + 1}-{Math.min(endIndex, totalItems)} {translate('of')} {totalItems} {translate('items')}
                </div>
              </>
            )}
          </>
        )}

        {/* ========================================================== */}
        {/* SPECIAL TAB */}
        {/* ========================================================== */}
        {activeTab === 'special' && (
          <div>
            <div style={{ 
              ...glassEffect, 
              borderRadius: '20px', 
              padding: isMobile ? '16px' : '24px', 
              marginBottom: '20px' 
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                flexWrap: 'wrap', 
                gap: '12px' 
              }}>
                <div>
                  <h3 style={{ margin: 0, color: textColor, fontSize: isMobile ? '15px' : '17px' }}>
                    {translate('activate_special')}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: isMobile ? '11px' : '13px', color: textMuted }}>
                    {translate('activate_special_desc')}
                  </p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '52px', height: '26px' }}>
                  <input 
                    type="checkbox" 
                    checked={specialMenuEnabled} 
                    onChange={async (e) => { 
                      setSpecialMenuEnabled(e.target.checked); 
                      await supabase.from('settings').upsert({ key: 'special_menu_enabled', value: e.target.checked.toString() }, { onConflict: 'key' }) 
                    }} 
                    style={{ opacity: 0, width: 0, height: 0 }} 
                  />
                  <span style={{ 
                    position: 'absolute', 
                    cursor: 'pointer', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    backgroundColor: specialMenuEnabled ? '#22c55e' : '#64748b', 
                    transition: '.3s', 
                    borderRadius: '34px' 
                  }}>
                    <span style={{ 
                      position: 'absolute', 
                      height: '20px', 
                      width: '20px', 
                      left: '3px', 
                      bottom: '3px', 
                      backgroundColor: 'white', 
                      transition: '.3s', 
                      borderRadius: '50%', 
                      transform: specialMenuEnabled ? 'translateX(26px)' : 'none' 
                    }} />
                  </span>
                </label>
              </div>
            </div>

            {specialMenuEnabled && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>{translate('special_title')}</label>
                  <input 
                    type="text" 
                    value={specialMenuTitle} 
                    onChange={async (e) => { 
                      setSpecialMenuTitle(e.target.value); 
                      await supabase.from('settings').upsert({ key: 'special_menu_title', value: e.target.value }, { onConflict: 'key' }) 
                    }} 
                    style={inputStyle} 
                  />
                </div>

                <div style={{ ...glassEffect, borderRadius: '20px', padding: isMobile ? '16px' : '24px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '16px', 
                    flexWrap: 'wrap', 
                    gap: '10px' 
                  }}>
                    <h3 style={{ margin: 0, color: textColor, fontSize: isMobile ? '15px' : '17px' }}>
                      {translate('special_items')}
                    </h3>
                    <button 
                      onClick={() => setShowAddSpecialModal(true)} 
                      style={{ 
                        background: '#22c55e', 
                        color: 'white', 
                        padding: isMobile ? '8px 18px' : '10px 24px', 
                        border: 'none', 
                        borderRadius: '30px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold', 
                        fontSize: isMobile ? '13px' : '14px', 
                        boxShadow: '0 4px 15px rgba(34,197,94,0.3)',
                        transition: 'all 0.2s'
                      }}
                    >
                      + {translate('add')}
                    </button>
                  </div>
                  
                  {specialItems.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '30px', color: textMuted, fontSize: isMobile ? '13px' : '14px' }}>
                      {translate('no_special_items')}
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {specialItems.map(item => (
                        <div key={item.id} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '12px', 
                          background: secondaryBg, 
                          borderRadius: '12px', 
                          flexWrap: 'wrap', 
                          gap: '10px' 
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {item.image_url && (
                              <img 
                                src={item.image_url} 
                                alt={item.name} 
                                style={{ 
                                  width: isMobile ? '36px' : '44px', 
                                  height: isMobile ? '36px' : '44px', 
                                  borderRadius: '8px', 
                                  objectFit: 'cover' 
                                }} 
                              />
                            )}
                            <div>
                              <strong style={{ color: textColor, fontSize: isMobile ? '14px' : '15px' }}>{item.name}</strong>
                              <div style={{ fontSize: isMobile ? '12px' : '13px', color: '#22c55e', fontWeight: 'bold' }}>
                                RM {item.price}
                              </div>
                              {item.description && (
                                <div style={{ fontSize: '10px', color: textMuted, fontStyle: 'italic' }}>
                                  📝 {item.description}
                                </div>
                              )}
                              {item.menu_id && (
                                <div style={{ fontSize: '9px', color: '#3b82f6' }}>
                                  🔗 {translate('price_sync')}
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button 
                              onClick={() => openEditSpecialModal(item)} 
                              style={{ 
                                background: '#f59e0b', 
                                color: 'white', 
                                padding: '4px 14px', 
                                border: 'none', 
                                borderRadius: '20px', 
                                cursor: 'pointer', 
                                fontSize: isMobile ? '12px' : '13px',
                                fontWeight: 'bold',
                                transition: 'all 0.2s'
                              }}
                            >
                              ✏️ {translate('edit')}
                            </button>
                            <button 
                              onClick={() => deleteSpecialItem(item.id, item.name)} 
                              style={{ 
                                background: '#ef4444', 
                                color: 'white', 
                                padding: '4px 14px', 
                                border: 'none', 
                                borderRadius: '20px', 
                                cursor: 'pointer', 
                                fontSize: isMobile ? '12px' : '13px',
                                fontWeight: 'bold',
                                transition: 'all 0.2s'
                              }}
                            >
                              🗑️ {translate('delete')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* PROMOTIONS TAB */}
        {/* ========================================================== */}
        {activeTab === 'promotions' && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              marginBottom: '20px' 
            }}>
              <button 
                onClick={() => { resetPromoForm(); setShowAddPromoModal(true) }} 
                style={{ 
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', 
                  color: 'white', 
                  padding: isMobile ? '10px 18px' : '12px 24px', 
                  border: 'none', 
                  borderRadius: '40px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold', 
                  fontSize: isMobile ? '13px' : '14px', 
                  boxShadow: '0 4px 15px rgba(139,92,246,0.3)',
                  transition: 'all 0.2s'
                }}
              >
                + {translate('add_promotion')}
              </button>
            </div>
            
            {promotions.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: isMobile ? '40px 20px' : '80px 20px', 
                ...glassEffect, 
                borderRadius: '28px' 
              }}>
                <span style={{ fontSize: isMobile ? '48px' : '64px', opacity: 0.5 }}>🏷️</span>
                <p style={{ color: textMuted, marginTop: '12px', fontSize: isMobile ? '14px' : '16px' }}>
                  {translate('no_promotions')}
                </p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))', 
                gap: '16px' 
              }}>
                {promotions.map(promo => (
                  <div key={promo.id} style={{ 
                    ...glassEffect, 
                    borderRadius: '20px', 
                    padding: isMobile ? '16px' : '20px', 
                    borderLeft: `4px solid ${promo.is_active ? '#22c55e' : '#ef4444'}` 
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      gap: '12px', 
                      alignItems: 'center', 
                      marginBottom: '12px', 
                      flexWrap: 'wrap' 
                    }}>
                      {promo.image_url ? (
                        <img 
                          src={promo.image_url} 
                          alt={promo.name} 
                          style={{ 
                            width: isMobile ? '44px' : '56px', 
                            height: isMobile ? '44px' : '56px', 
                            borderRadius: '10px', 
                            objectFit: 'cover' 
                          }} 
                        />
                      ) : (
                        <div style={{ 
                          width: isMobile ? '44px' : '56px', 
                          height: isMobile ? '44px' : '56px', 
                          background: secondaryBg, 
                          borderRadius: '10px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: isMobile ? '24px' : '28px' 
                        }}>
                          🏷️
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <h3 style={{ 
                          margin: 0, 
                          fontSize: isMobile ? '15px' : '17px', 
                          fontWeight: 'bold', 
                          color: textColor 
                        }}>
                          {promo.name}
                        </h3>
                        <span style={{ 
                          background: promo.is_active ? '#22c55e' : '#ef4444', 
                          color: 'white', 
                          padding: '2px 10px', 
                          borderRadius: '20px', 
                          fontSize: isMobile ? '10px' : '11px',
                          fontWeight: 'bold'
                        }}>
                          {promo.is_active ? translate('active') : translate('inactive')}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      justifyContent: 'flex-end', 
                      marginTop: '12px', 
                      paddingTop: '12px', 
                      borderTop: `1px solid ${borderColor}`, 
                      flexWrap: 'wrap' 
                    }}>
                      <button 
                        onClick={() => togglePromoStatus(promo.id, promo.is_active)} 
                        style={{ 
                          background: promo.is_active ? '#ef4444' : '#22c55e', 
                          color: 'white', 
                          padding: '6px 14px', 
                          border: 'none', 
                          borderRadius: '20px', 
                          cursor: 'pointer', 
                          fontSize: isMobile ? '11px' : '12px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s'
                        }}
                      >
                        {promo.is_active ? translate('disable') : translate('enable')}
                      </button>
                      <button 
                        onClick={() => openEditPromoModal(promo)} 
                        style={{ 
                          background: '#f59e0b', 
                          color: 'white', 
                          padding: '6px 14px', 
                          border: 'none', 
                          borderRadius: '20px', 
                          cursor: 'pointer', 
                          fontSize: isMobile ? '11px' : '12px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s'
                        }}
                      >
                        ✏️ {translate('edit')}
                      </button>
                      <button 
                        onClick={() => deletePromotion(promo.id, promo.name)} 
                        style={{ 
                          background: '#ef4444', 
                          color: 'white', 
                          padding: '6px 14px', 
                          border: 'none', 
                          borderRadius: '20px', 
                          cursor: 'pointer', 
                          fontSize: isMobile ? '11px' : '12px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s'
                        }}
                      >
                        🗑️ {translate('delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* MODALS */}
        {/* ========================================================== */}
        
        {/* ADD MENU MODAL */}
        {showAddModal && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <h3 style={modalTitleStyle}>{translate('add_menu')}</h3>
              <label style={labelStyle}>{translate('name')} *</label>
              <input
                type="text"
                placeholder={translate('name')}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('price')} *</label>
              <input
                type="number"
                step="0.01"
                placeholder={translate('price')}
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('description')}</label>
              <input
                type="text"
                placeholder={translate('description')}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('stock_qty')}</label>
              <input
                type="number"
                placeholder={translate('stock_qty')}
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('category')}</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                style={inputStyle}
              >
                <option value="">{translate('select_category')}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                ))}
              </select>
              <label style={labelStyle}>{translate('image')}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({...formData, image_file: e.target.files[0]})}
                style={inputStyle}
              />
              {formData.image_file && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: textMuted, fontSize: '12px' }}>{translate('preview')}:</p>
                  <img src={URL.createObjectURL(formData.image_file)} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowAddModal(false)} style={buttonSecondaryStyle}>
                  {translate('cancel')}
                </button>
                <button onClick={addRegularMenuItem} style={buttonPrimaryStyle}>
                  {uploading ? '...' : translate('add')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT MENU MODAL - FIXED */}
        {showEditModal && selectedItem && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <h3 style={modalTitleStyle}>{translate('edit_menu')} - {selectedItem?.name}</h3>
              <label style={labelStyle}>{translate('name')} *</label>
              <input
                type="text"
                placeholder={translate('name')}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('price')} *</label>
              <input
                type="number"
                step="0.01"
                placeholder={translate('price')}
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('description')}</label>
              <input
                type="text"
                placeholder={translate('description')}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('stock_qty')}</label>
              <input
                type="number"
                placeholder={translate('stock_qty')}
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('category')}</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                style={inputStyle}
              >
                <option value="">{translate('select_category')}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                ))}
              </select>
              <label style={labelStyle}>{translate('image')}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({...formData, image_file: e.target.files[0]})}
                style={inputStyle}
              />
              {formData.image_url && !formData.image_file && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: textMuted, fontSize: '12px' }}>{translate('preview')}:</p>
                  <img src={formData.image_url} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                </div>
              )}
              {formData.image_file && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: textMuted, fontSize: '12px' }}>{translate('preview')}:</p>
                  <img src={URL.createObjectURL(formData.image_file)} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setShowEditModal(false); setSelectedItem(null); }} style={buttonSecondaryStyle}>
                  {translate('cancel')}
                </button>
                <button onClick={updateRegularMenuItem} style={buttonPrimaryStyle}>
                  {uploading ? '...' : translate('save')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADD DRINK MODAL */}
        {showDrinkModal && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <h3 style={modalTitleStyle}>{translate('add_drink_title')}</h3>
              <label style={labelStyle}>{translate('drink_name')} *</label>
              <input
                type="text"
                placeholder={translate('drink_name')}
                value={newDrinkName}
                onChange={(e) => setNewDrinkName(e.target.value)}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('hot_price')}</label>
              <input
                type="number"
                step="0.01"
                placeholder={translate('hot_price')}
                value={newDrinkPanas}
                onChange={(e) => setNewDrinkPanas(e.target.value)}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('cold_price')}</label>
              <input
                type="number"
                step="0.01"
                placeholder={translate('cold_price')}
                value={newDrinkSejuk}
                onChange={(e) => setNewDrinkSejuk(e.target.value)}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('takeaway_price')}</label>
              <input
                type="number"
                step="0.01"
                placeholder={translate('takeaway_price')}
                value={newDrinkBungkus}
                onChange={(e) => setNewDrinkBungkus(e.target.value)}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('stock_qty')}</label>
              <input
                type="number"
                placeholder={translate('stock_qty')}
                value={newDrinkStock}
                onChange={(e) => setNewDrinkStock(e.target.value)}
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowDrinkModal(false)} style={buttonSecondaryStyle}>
                  {translate('cancel')}
                </button>
                <button onClick={addDrinkWithOptions} style={buttonPrimaryStyle}>
                  {translate('add')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADD SPECIAL MODAL */}
        {showAddSpecialModal && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <h3 style={modalTitleStyle}>{translate('add_special')}</h3>
              <label style={labelStyle}>{translate('name')} *</label>
              <input
                type="text"
                placeholder={translate('name')}
                value={specialFormData.name}
                onChange={(e) => setSpecialFormData({...specialFormData, name: e.target.value})}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('price')} *</label>
              <input
                type="number"
                step="0.01"
                placeholder={translate('price')}
                value={specialFormData.price}
                onChange={(e) => setSpecialFormData({...specialFormData, price: e.target.value})}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('description')}</label>
              <input
                type="text"
                placeholder={translate('description')}
                value={specialFormData.description}
                onChange={(e) => setSpecialFormData({...specialFormData, description: e.target.value})}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('stock_qty')}</label>
              <input
                type="number"
                placeholder={translate('stock_qty')}
                value={specialFormData.stock}
                onChange={(e) => setSpecialFormData({...specialFormData, stock: e.target.value})}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('image')}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSpecialFormData({...specialFormData, image_file: e.target.files[0]})}
                style={inputStyle}
              />
              {specialFormData.image_file && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: textMuted, fontSize: '12px' }}>{translate('preview')}:</p>
                  <img src={URL.createObjectURL(specialFormData.image_file)} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowAddSpecialModal(false)} style={buttonSecondaryStyle}>
                  {translate('cancel')}
                </button>
                <button onClick={addSpecialItem} style={buttonPrimaryStyle}>
                  {translate('add')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT SPECIAL MODAL */}
        {showEditSpecialModal && selectedSpecialItem && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <h3 style={modalTitleStyle}>{translate('edit_special')}</h3>
              <label style={labelStyle}>{translate('name')} *</label>
              <input
                type="text"
                placeholder={translate('name')}
                value={specialFormData.name}
                onChange={(e) => setSpecialFormData({...specialFormData, name: e.target.value})}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('price')} *</label>
              <input
                type="number"
                step="0.01"
                placeholder={translate('price')}
                value={specialFormData.price}
                onChange={(e) => setSpecialFormData({...specialFormData, price: e.target.value})}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('description')}</label>
              <input
                type="text"
                placeholder={translate('description')}
                value={specialFormData.description}
                onChange={(e) => setSpecialFormData({...specialFormData, description: e.target.value})}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('stock_qty')}</label>
              <input
                type="number"
                placeholder={translate('stock_qty')}
                value={specialFormData.stock}
                onChange={(e) => setSpecialFormData({...specialFormData, stock: e.target.value})}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('image')}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSpecialFormData({...specialFormData, image_file: e.target.files[0]})}
                style={inputStyle}
              />
              {specialFormData.image_url && !specialFormData.image_file && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: textMuted, fontSize: '12px' }}>{translate('preview')}:</p>
                  <img src={specialFormData.image_url} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                </div>
              )}
              {specialFormData.image_file && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: textMuted, fontSize: '12px' }}>{translate('preview')}:</p>
                  <img src={URL.createObjectURL(specialFormData.image_file)} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowEditSpecialModal(false)} style={buttonSecondaryStyle}>
                  {translate('cancel')}
                </button>
                <button onClick={updateSpecialItem} style={buttonPrimaryStyle}>
                  {translate('save')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SIZE OPTIONS MODAL */}
        {showOptionsModal && selectedMenuForOptions && (
          <div style={modalOverlayStyle}>
            <div style={{ ...modalContentStyle, maxWidth: isMobile ? '95%' : '500px' }}>
              <h3 style={modalTitleStyle}>{translate('size_options')} - {selectedMenuForOptions.name}</h3>
              
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ color: textColor, marginBottom: '8px' }}>{translate('add_size')}</h4>
                <label style={labelStyle}>{translate('size_name')} *</label>
                <input
                  type="text"
                  placeholder={translate('size_name')}
                  value={optionForm.option_name}
                  onChange={(e) => setOptionForm({...optionForm, option_name: e.target.value})}
                  style={inputStyle}
                />
                <label style={labelStyle}>{translate('size_price')} *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={translate('size_price')}
                  value={optionForm.price_adjustment}
                  onChange={(e) => setOptionForm({...optionForm, price_adjustment: e.target.value})}
                  style={inputStyle}
                />
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ color: textColor }}>
                    <input
                      type="checkbox"
                      checked={optionForm.is_absolute_price}
                      onChange={(e) => setOptionForm({...optionForm, is_absolute_price: e.target.checked})}
                    />
                    {translate('absolute_price')}
                  </label>
                </div>
                <button onClick={editingOption ? updateMenuOption : addMenuOption} style={buttonPrimaryStyle}>
                  {editingOption ? translate('save') : translate('add')}
                </button>
              </div>

              <div>
                <h4 style={{ color: textColor, marginBottom: '8px' }}>{translate('size_list')}</h4>
                {menuOptions.length === 0 ? (
                  <p style={{ color: textMuted }}>{translate('no_sizes')}</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {menuOptions.map(opt => (
                      <div key={opt.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: secondaryBg,
                        borderRadius: '8px',
                        border: `1px solid ${borderColor}`
                      }}>
                        <span style={{ color: textColor }}>
                          {opt.option_name} - RM {opt.price_adjustment} {opt.is_absolute_price ? '(Absolute)' : '(Adjustment)'}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            onClick={() => openEditOption(opt)} 
                            style={{ background: '#f59e0b', color: 'white', padding: '2px 10px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '11px' }}
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => deleteMenuOption(opt.id)} 
                            style={{ background: '#ef4444', color: 'white', padding: '2px 10px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '11px' }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '16px' }}>
                <button onClick={() => setShowOptionsModal(false)} style={buttonSecondaryStyle}>
                  {translate('close')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADD PROMOTION MODAL */}
        {showAddPromoModal && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <h3 style={modalTitleStyle}>{translate('add_promotion')}</h3>
              <label style={labelStyle}>{translate('promo_name')} *</label>
              <input
                type="text"
                placeholder={translate('promo_name')}
                value={promoFormData.name}
                onChange={(e) => setPromoFormData({...promoFormData, name: e.target.value})}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('promo_type')}</label>
              <select
                value={promoFormData.type}
                onChange={(e) => setPromoFormData({...promoFormData, type: e.target.value})}
                style={inputStyle}
              >
                <option value="set_menu">{translate('set_menu')}</option>
                <option value="bundle">{translate('bundle')}</option>
                <option value="bogo">{translate('bogo')}</option>
              </select>

              {promoFormData.type === 'bogo' && (
                <>
                  <label style={labelStyle}>{translate('trigger_item')}</label>
                  <select
                    value={promoFormData.trigger_item_id || ''}
                    onChange={(e) => setPromoFormData({...promoFormData, trigger_item_id: parseInt(e.target.value)})}
                    style={inputStyle}
                  >
                    <option value="">{translate('select_item')}</option>
                    {availableMenuItems.length === 0 ? (
                      <option value="" disabled>{translate('no_items_available')}</option>
                    ) : (
                      availableMenuItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name} (RM {item.price})</option>
                      ))
                    )}
                  </select>
                  <label style={labelStyle}>{translate('free_item')}</label>
                  <select
                    value={promoFormData.free_item_id || ''}
                    onChange={(e) => setPromoFormData({...promoFormData, free_item_id: parseInt(e.target.value)})}
                    style={inputStyle}
                  >
                    <option value="">{translate('select_item')}</option>
                    {availableMenuItems.length === 0 ? (
                      <option value="" disabled>{translate('no_items_available')}</option>
                    ) : (
                      availableMenuItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name} (RM {item.price})</option>
                      ))
                    )}
                  </select>
                </>
              )}

              {(promoFormData.type === 'set_menu' || promoFormData.type === 'bundle') && (
                <>
                  <div style={{ fontSize: '12px', color: textMuted, marginBottom: '8px' }}>
                    {availableMenuItems.length > 0 
                      ? `📋 ${availableMenuItems.length} ${translate('items_available')}` 
                      : `⚠️ ${translate('no_items_available')}`}
                  </div>
                  <div style={{ 
                    maxHeight: '150px', 
                    overflowY: 'auto', 
                    border: `1px solid ${inputBorder}`, 
                    borderRadius: '12px', 
                    padding: '8px',
                    background: inputBg,
                    marginBottom: '12px'
                  }}>
                    {availableMenuItems.length === 0 ? (
                      <div style={{ color: textMuted, padding: '8px', textAlign: 'center' }}>
                        {translate('no_items_available')}
                      </div>
                    ) : (
                      availableMenuItems.map(item => (
                        <label key={item.id} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: textColor,
                          borderBottom: `1px solid ${borderColor}`,
                        }}>
                          <input
                            type="checkbox"
                            checked={promoFormData.selected_bundle_items.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPromoFormData({
                                  ...promoFormData, 
                                  selected_bundle_items: [...promoFormData.selected_bundle_items, item.id]
                                })
                              } else {
                                setPromoFormData({
                                  ...promoFormData, 
                                  selected_bundle_items: promoFormData.selected_bundle_items.filter(id => id !== item.id)
                                })
                              }
                            }}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '14px' }}>
                            {item.name} <span style={{ color: '#22c55e', fontWeight: 'bold' }}>(RM {item.price})</span>
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  
                  <label style={labelStyle}>{translate('promo_price')}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={translate('promo_price')}
                    value={promoFormData.bundle_price}
                    onChange={(e) => setPromoFormData({...promoFormData, bundle_price: e.target.value})}
                    style={inputStyle}
                  />
                </>
              )}

              <label style={labelStyle}>{translate('start_date')}</label>
              <input
                type="date"
                placeholder={translate('start_date')}
                value={promoFormData.start_date}
                onChange={(e) => setPromoFormData({...promoFormData, start_date: e.target.value})}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('end_date')}</label>
              <input
                type="date"
                placeholder={translate('end_date')}
                value={promoFormData.end_date}
                onChange={(e) => setPromoFormData({...promoFormData, end_date: e.target.value})}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('promo_image')}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPromoFormData({...promoFormData, image_file: e.target.files[0]})}
                style={inputStyle}
              />
              {promoFormData.image_file && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: textMuted, fontSize: '12px' }}>{translate('preview')}:</p>
                  <img src={URL.createObjectURL(promoFormData.image_file)} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowAddPromoModal(false)} style={buttonSecondaryStyle}>
                  {translate('cancel')}
                </button>
                <button onClick={addPromotion} style={buttonPrimaryStyle}>
                  {translate('add')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT PROMOTION MODAL */}
        {showEditPromoModal && selectedPromo && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <h3 style={modalTitleStyle}>{translate('edit_promotion')}</h3>
              <label style={labelStyle}>{translate('promo_name')} *</label>
              <input
                type="text"
                placeholder={translate('promo_name')}
                value={promoFormData.name}
                onChange={(e) => setPromoFormData({...promoFormData, name: e.target.value})}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('promo_type')}</label>
              <select
                value={promoFormData.type}
                onChange={(e) => setPromoFormData({...promoFormData, type: e.target.value})}
                style={inputStyle}
              >
                <option value="set_menu">{translate('set_menu')}</option>
                <option value="bundle">{translate('bundle')}</option>
                <option value="bogo">{translate('bogo')}</option>
              </select>

              {promoFormData.type === 'bogo' && (
                <>
                  <label style={labelStyle}>{translate('trigger_item')}</label>
                  <select
                    value={promoFormData.trigger_item_id || ''}
                    onChange={(e) => setPromoFormData({...promoFormData, trigger_item_id: parseInt(e.target.value)})}
                    style={inputStyle}
                  >
                    <option value="">{translate('select_item')}</option>
                    {availableMenuItems.length === 0 ? (
                      <option value="" disabled>{translate('no_items_available')}</option>
                    ) : (
                      availableMenuItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name} (RM {item.price})</option>
                      ))
                    )}
                  </select>
                  <label style={labelStyle}>{translate('free_item')}</label>
                  <select
                    value={promoFormData.free_item_id || ''}
                    onChange={(e) => setPromoFormData({...promoFormData, free_item_id: parseInt(e.target.value)})}
                    style={inputStyle}
                  >
                    <option value="">{translate('select_item')}</option>
                    {availableMenuItems.length === 0 ? (
                      <option value="" disabled>{translate('no_items_available')}</option>
                    ) : (
                      availableMenuItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name} (RM {item.price})</option>
                      ))
                    )}
                  </select>
                </>
              )}

              {(promoFormData.type === 'set_menu' || promoFormData.type === 'bundle') && (
                <>
                  <div style={{ fontSize: '12px', color: textMuted, marginBottom: '8px' }}>
                    {availableMenuItems.length > 0 
                      ? `📋 ${availableMenuItems.length} ${translate('items_available')}` 
                      : `⚠️ ${translate('no_items_available')}`}
                  </div>
                  <div style={{ 
                    maxHeight: '150px', 
                    overflowY: 'auto', 
                    border: `1px solid ${inputBorder}`, 
                    borderRadius: '12px', 
                    padding: '8px',
                    background: inputBg,
                    marginBottom: '12px'
                  }}>
                    {availableMenuItems.length === 0 ? (
                      <div style={{ color: textMuted, padding: '8px', textAlign: 'center' }}>
                        {translate('no_items_available')}
                      </div>
                    ) : (
                      availableMenuItems.map(item => (
                        <label key={item.id} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: textColor,
                          borderBottom: `1px solid ${borderColor}`,
                        }}>
                          <input
                            type="checkbox"
                            checked={promoFormData.selected_bundle_items.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPromoFormData({
                                  ...promoFormData, 
                                  selected_bundle_items: [...promoFormData.selected_bundle_items, item.id]
                                })
                              } else {
                                setPromoFormData({
                                  ...promoFormData, 
                                  selected_bundle_items: promoFormData.selected_bundle_items.filter(id => id !== item.id)
                                })
                              }
                            }}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '14px' }}>
                            {item.name} <span style={{ color: '#22c55e', fontWeight: 'bold' }}>(RM {item.price})</span>
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  
                  <label style={labelStyle}>{translate('promo_price')}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={translate('promo_price')}
                    value={promoFormData.bundle_price}
                    onChange={(e) => setPromoFormData({...promoFormData, bundle_price: e.target.value})}
                    style={inputStyle}
                  />
                </>
              )}

              <label style={labelStyle}>{translate('start_date')}</label>
              <input
                type="date"
                placeholder={translate('start_date')}
                value={promoFormData.start_date}
                onChange={(e) => setPromoFormData({...promoFormData, start_date: e.target.value})}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('end_date')}</label>
              <input
                type="date"
                placeholder={translate('end_date')}
                value={promoFormData.end_date}
                onChange={(e) => setPromoFormData({...promoFormData, end_date: e.target.value})}
                style={inputStyle}
              />
              <label style={labelStyle}>{translate('promo_image')}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPromoFormData({...promoFormData, image_file: e.target.files[0]})}
                style={inputStyle}
              />
              {promoFormData.image_url && !promoFormData.image_file && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: textMuted, fontSize: '12px' }}>{translate('preview')}:</p>
                  <img src={promoFormData.image_url} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                </div>
              )}
              {promoFormData.image_file && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: textMuted, fontSize: '12px' }}>{translate('preview')}:</p>
                  <img src={URL.createObjectURL(promoFormData.image_file)} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowEditPromoModal(false)} style={buttonSecondaryStyle}>
                  {translate('cancel')}
                </button>
                <button onClick={updatePromotion} style={buttonPrimaryStyle}>
                  {translate('save')}
                </button>
              </div>
            </div>
          </div>
        )}

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
            
            .card-hover {
              transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .card-hover:hover {
              transform: translateY(-3px);
              box-shadow: ${darkMode 
                ? '0 12px 40px rgba(0,0,0,0.5)' 
                : '0 12px 40px rgba(0,0,0,0.1)'};
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
            
            input, select, textarea { 
              transition: border-color 0.2s, box-shadow 0.2s; 
            }
            
            input:focus, select:focus, textarea:focus { 
              outline: none; 
              border-color: #3b82f6;
              box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
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
          `}
        </style>
      </div>
    </Sidebar>
  )
}

export default ManageMenu