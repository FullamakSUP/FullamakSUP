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
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ============================================================
// SORTABLE CATEGORY ITEM
// ============================================================
function SortableCategoryItem({ category, onEdit, onDelete, isSub = false, darkMode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  }

  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.35)' : 'rgba(203, 213, 225, 0.5)'
  const textColor = darkMode ? '#e8edf5' : '#1e293b'
  const textMuted = darkMode ? '#9aa8b9' : '#64748b'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="sortable-item"
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: isSub ? '10px 14px' : '14px 18px',
        background: darkMode ? 'rgba(35,35,60,0.6)' : 'rgba(248,250,252,0.8)',
        border: `1px solid ${borderColor}`,
        borderRadius: '12px',
        marginLeft: isSub ? '32px' : '0',
        borderLeft: isSub ? `3px solid #8b5cf6` : 'none',
        transition: 'all 0.2s',
        cursor: 'grab'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px', color: '#94a3b8', cursor: 'grab' }}>⠿</span>
          <span style={{ fontSize: '24px' }}>{category.icon || '📂'}</span>
          <span style={{ fontWeight: 'bold', fontSize: '15px', color: textColor }}>
            {category.name}
          </span>
          {isSub && (
            <span style={{
              fontSize: '9px',
              background: '#8b5cf6',
              color: 'white',
              padding: '1px 8px',
              borderRadius: '10px',
              fontWeight: 'bold'
            }}>
              Sub
            </span>
          )}
          {!isSub && (
            <span style={{
              fontSize: '10px',
              background: '#3b82f6',
              color: 'white',
              padding: '1px 8px',
              borderRadius: '10px',
              fontWeight: 'bold'
            }}>
              Main
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            onClick={() => onEdit(category)} 
            style={{
              background: '#f59e0b',
              color: 'white',
              padding: '4px 12px',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            ✏️
          </button>
          <button 
            onClick={() => onDelete(category.id, category.name)} 
            style={{
              background: '#ef4444',
              color: 'white',
              padding: '4px 12px',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// MAIN COMPONENT
// ============================================================
function ManageCategories() {
  const { darkMode } = useTheme()
  const { language } = useLanguage()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [formData, setFormData] = useState({ name: '', icon: '📁', parent_id: null })
  const [expandedCategories, setExpandedCategories] = useState({})

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // ============================================================
  // COMPLETE TRANSLATIONS
  // ============================================================
  const translations = {
    // Header
    manage_categories: { en: '📂 Manage Categories', ms: '📂 Urus Kategori' },
    manage_categories_sub: { en: 'Drag & drop to reorder categories', ms: 'Seret & lepas untuk susun kategori' },
    drag_hint: { en: '⠿ Drag to reorder', ms: '⠿ Seret untuk susun' },
    
    // Labels
    main_categories: { en: '📁 Main Categories', ms: '📁 Kategori Utama' },
    sub_categories: { en: '📂 Sub Categories', ms: '📂 Sub Kategori' },
    main: { en: 'Main Category', ms: 'Kategori Utama' },
    sub: { en: 'Sub Category', ms: 'Sub Kategori' },
    
    // Buttons
    add_category: { en: '➕ Add Main Category', ms: '➕ Tambah Kategori Utama' },
    add_sub_category: { en: '➕ Add Sub Category', ms: '➕ Tambah Sub Kategori' },
    edit_category: { en: '✏️ Edit Category', ms: '✏️ Edit Kategori' },
    name: { en: 'Name', ms: 'Nama' },
    icon: { en: 'Icon', ms: 'Ikon' },
    parent_category: { en: 'Parent Category', ms: 'Kategori Induk' },
    delete: { en: 'Delete', ms: 'Hapus' },
    edit: { en: 'Edit', ms: 'Edit' },
    save: { en: 'Save', ms: 'Simpan' },
    cancel: { en: 'Cancel', ms: 'Batal' },
    add: { en: 'Add', ms: 'Tambah' },
    close: { en: 'Close', ms: 'Tutup' },
    
    // Empty states
    no_categories: { en: 'No categories yet. Click "Add Main Category" to start.', ms: 'Tiada kategori. Klik "Tambah Kategori Utama" untuk mula.' },
    no_sub_categories: { en: 'No sub categories. Click "Add Sub Category" to start.', ms: 'Tiada sub kategori. Klik "Tambah Sub Kategori" untuk mula.' },
    
    // Messages
    cannot_delete_with_sub: { en: '⚠️ Cannot delete category with sub categories. Delete sub categories first.', ms: '⚠️ Tidak boleh hapus kategori yang ada sub kategori. Hapus sub kategori dahulu.' },
    confirm_delete: { en: 'Delete this category?', ms: 'Hapus kategori ini?' },
    required: { en: 'required', ms: 'diperlukan' },
    category_added: { en: '✅ Category added successfully!', ms: '✅ Kategori berjaya ditambah!' },
    category_updated: { en: '✅ Category updated successfully!', ms: '✅ Kategori berjaya dikemaskini!' },
    category_deleted: { en: '✅ Category deleted successfully!', ms: '✅ Kategori berjaya dihapus!' },
    order_updated: { en: '✅ Category order updated!', ms: '✅ Urutan kategori dikemaskini!' },
    select_parent: { en: '-- Select Parent Category --', ms: '-- Pilih Kategori Induk --' },
    sub_count: { en: 'sub categories', ms: 'sub kategori' },
    error: { en: 'Error', ms: 'Ralat' },
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
  // THEME COLORS
  // ============================================================
  const bgColor = darkMode ? '#0a0a14' : '#f1f5f9'
  const cardBg = darkMode ? 'rgba(22, 22, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  const textColor = darkMode ? '#e8edf5' : '#1e293b'
  const textMuted = darkMode ? '#9aa8b9' : '#64748b'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.35)' : 'rgba(203, 213, 225, 0.5)'
  const secondaryBg = darkMode ? 'rgba(35, 35, 60, 0.8)' : 'rgba(248, 250, 252, 0.9)'
  const inputBg = darkMode ? '#1a1a2e' : '#ffffff'
  const inputBorder = darkMode ? '#3d3d5c' : '#cbd5e1'
  const inputText = darkMode ? '#e8edf5' : '#1e293b'
  
  const glassEffect = {
    background: cardBg,
    backdropFilter: 'blur(12px)',
    border: `1px solid ${borderColor}`,
    boxShadow: darkMode 
      ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
      : '0 8px 32px rgba(0, 0, 0, 0.06)'
  }

  // ============================================================
  // MODAL STYLES
  // ============================================================
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
    fontWeight: 'bold',
    marginBottom: '6px',
    fontSize: isMobile ? '13px' : '14px',
    color: textColor
  }

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
    maxWidth: isMobile ? '95%' : '460px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    ...glassEffect,
    animation: 'popIn 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)'
  }

  const modalTitleStyle = {
    marginTop: 0,
    marginBottom: '20px',
    color: textColor,
    fontSize: isMobile ? '20px' : '24px',
    fontWeight: 'bold',
    textAlign: 'center'
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
    transition: 'all 0.2s'
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
    transition: 'all 0.2s'
  }

  // ============================================================
  // LOAD CATEGORIES
  // ============================================================
  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    setLoading(true)
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
    setCategories(data || [])
    setLoading(false)
  }

  // ============================================================
  // HELPERS
  // ============================================================
  const mainCategories = categories.filter(cat => cat.parent_id === null)
  
  const getSubCategories = (parentId) => {
    return categories.filter(cat => cat.parent_id === parentId)
  }

  const toggleSubCategories = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  // Available icons
  const availableIcons = [
    '📁', '📂', '🍽️', '🍚', '🍜', '🥘', '🍛', '🍲', '🥗', '🍔', 
    '🌮', '🥪', '🥤', '☕', '🍵', '🧋', '🍹', '🍺', '🍷', '🧃',
    '🥛', '🧊', '🍰', '🧁', '🍩', '🍪', '🍫', '🍭', '🍬', '🍦',
    '🍧', '🍨', '🥩', '🍗', '🍖', '🥓', '🍳', '🥚', '🧈', '🧀',
    '🥐', '🥖', '🏷️', '⭐', '🔥', '💫', '✨', '🌟', '🌈', '🎯'
  ]

  // ============================================================
  // DRAG & DROP FUNCTIONS
  // ============================================================
  
  async function handleDragEnd(event) {
    const { active, over } = event
    
    if (!over) return
    if (active.id === over.id) return
    
    const mainCats = mainCategories
    
    const oldIndex = mainCats.findIndex(cat => cat.id === active.id)
    const newIndex = mainCats.findIndex(cat => cat.id === over.id)
    
    if (oldIndex === -1 || newIndex === -1) return
    
    const newOrder = arrayMove(mainCats, oldIndex, newIndex)
    
    const updates = newOrder.map((cat, index) => ({
      id: cat.id,
      sort_order: index
    }))
    
    const updatedCategories = categories.map(cat => {
      const update = updates.find(u => u.id === cat.id)
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
          .eq('id', update.id)
      }
      setMessage('✅ ' + translate('order_updated'))
      setTimeout(() => setMessage(''), 2000)
    } catch (error) {
      console.error('Error updating order:', error)
      loadCategories()
    }
  }

  async function handleSubDragEnd(event, parentId) {
    const { active, over } = event
    
    if (!over) return
    if (active.id === over.id) return
    
    const subCats = getSubCategories(parentId)
    
    const oldIndex = subCats.findIndex(cat => cat.id === active.id)
    const newIndex = subCats.findIndex(cat => cat.id === over.id)
    
    if (oldIndex === -1 || newIndex === -1) return
    
    const newOrder = arrayMove(subCats, oldIndex, newIndex)
    
    const updates = newOrder.map((cat, index) => ({
      id: cat.id,
      sort_order: index
    }))
    
    const updatedCategories = categories.map(cat => {
      const update = updates.find(u => u.id === cat.id)
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
          .eq('id', update.id)
      }
      setMessage('✅ ' + translate('order_updated'))
      setTimeout(() => setMessage(''), 2000)
    } catch (error) {
      console.error('Error updating order:', error)
      loadCategories()
    }
  }

  // ============================================================
  // CRUD FUNCTIONS
  // ============================================================
  async function addCategory() {
    if (!formData.name) {
      setMessage(`⚠️ ${translate('name')} ${translate('required')}`)
      setTimeout(() => setMessage(''), 2000)
      return
    }

    const { error } = await supabase
      .from('categories')
      .insert([{
        name: formData.name,
        icon: formData.icon || '📁',
        parent_id: formData.parent_id || null,
        sort_order: categories.length
      }])

    if (error) {
      setMessage(`❌ ${translate('error')}: ${error.message}`)
    } else {
      setMessage(translate('category_added'))
      setShowAddModal(false)
      setFormData({ name: '', icon: '📁', parent_id: null })
      loadCategories()
    }
    setTimeout(() => setMessage(''), 2000)
  }

  async function updateCategory() {
    if (!formData.name) {
      setMessage(`⚠️ ${translate('name')} ${translate('required')}`)
      setTimeout(() => setMessage(''), 2000)
      return
    }

    const { error } = await supabase
      .from('categories')
      .update({
        name: formData.name,
        icon: formData.icon || '📁',
        parent_id: formData.parent_id || null
      })
      .eq('id', selectedCategory.id)

    if (error) {
      setMessage(`❌ ${translate('error')}: ${error.message}`)
    } else {
      setMessage(translate('category_updated'))
      setShowEditModal(false)
      setSelectedCategory(null)
      setFormData({ name: '', icon: '📁', parent_id: null })
      loadCategories()
    }
    setTimeout(() => setMessage(''), 2000)
  }

  async function deleteCategory(id, name) {
    const hasSub = categories.some(cat => cat.parent_id === id)
    if (hasSub) {
      setMessage(translate('cannot_delete_with_sub'))
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (!window.confirm(`${translate('confirm_delete')} "${name}"?`)) return

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage(`❌ ${translate('error')}: ${error.message}`)
    } else {
      setMessage(translate('category_deleted'))
      loadCategories()
    }
    setTimeout(() => setMessage(''), 2000)
  }

  const openEditModal = (category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      icon: category.icon || '📁',
      parent_id: category.parent_id || null
    })
    setShowEditModal(true)
  }

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
        {/* ===== HEADER ===== */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{
            color: textColor,
            margin: 0,
            fontSize: isMobile ? '24px' : '30px',
            fontWeight: 'bold'
          }}>
            {translate('manage_categories')}
          </h1>
          <p style={{
            color: textMuted,
            marginTop: '4px',
            fontSize: isMobile ? '13px' : '15px'
          }}>
            {translate('manage_categories_sub')}
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

        {/* ===== MESSAGE ===== */}
        {message && (
          <div style={{
            background: message.includes('✅')
              ? (darkMode ? 'rgba(34,197,94,0.15)' : '#dcfce7')
              : (darkMode ? 'rgba(239,68,68,0.15)' : '#fee2e2'),
            color: message.includes('✅')
              ? (darkMode ? '#4ade80' : '#166534')
              : (darkMode ? '#f87171' : '#991b1b'),
            padding: '12px 20px',
            borderRadius: '40px',
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: isMobile ? '13px' : '14px',
            border: `1px solid ${message.includes('✅') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            fontWeight: '500'
          }}>
            {message}
          </div>
        )}

        {/* ===== ACTION BUTTONS ===== */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => {
              setFormData({ name: '', icon: '📁', parent_id: null })
              setShowAddModal(true)
            }}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              padding: isMobile ? '10px 18px' : '12px 24px',
              border: 'none',
              borderRadius: '40px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: isMobile ? '13px' : '14px',
              boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
              transition: 'all 0.2s'
            }}
          >
            {translate('add_category')}
          </button>
        </div>

        {/* ===== CATEGORIES LIST ===== */}
        {mainCategories.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: isMobile ? '40px 20px' : '80px 20px',
            ...glassEffect,
            borderRadius: '28px'
          }}>
            <span style={{ fontSize: isMobile ? '48px' : '64px', opacity: 0.5 }}>📂</span>
            <p style={{ color: textMuted, marginTop: '12px', fontSize: isMobile ? '14px' : '16px' }}>
              {translate('no_categories')}
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={mainCategories.map(cat => cat.id)}
              strategy={verticalListSortingStrategy}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {mainCategories.map(cat => {
                  const subCats = getSubCategories(cat.id)
                  const isExpanded = expandedCategories[cat.id] || false
                  
                  return (
                    <div key={cat.id}>
                      {/* Main Category */}
                      <SortableCategoryItem
                        category={cat}
                        onEdit={openEditModal}
                        onDelete={deleteCategory}
                        isSub={false}
                        darkMode={darkMode}
                      />
                      
                      {/* Sub Categories - WITH DRAG & DROP */}
                      {isExpanded && subCats.length > 0 && (
                        <div style={{
                          marginLeft: isMobile ? '16px' : '32px',
                          paddingLeft: isMobile ? '12px' : '20px',
                          borderLeft: `2px solid ${borderColor}`,
                          paddingTop: '6px',
                          paddingBottom: '6px',
                          marginTop: '4px'
                        }}>
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(event) => handleSubDragEnd(event, cat.id)}
                          >
                            <SortableContext
                              items={subCats.map(sub => sub.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              {subCats.map(sub => (
                                <SortableCategoryItem
                                  key={sub.id}
                                  category={sub}
                                  onEdit={openEditModal}
                                  onDelete={deleteCategory}
                                  isSub={true}
                                  darkMode={darkMode}
                                />
                              ))}
                            </SortableContext>
                          </DndContext>
                        </div>
                      )}
                      
                      {/* Toggle + Add Sub Button */}
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginTop: '4px',
                        marginBottom: '8px',
                        marginLeft: isMobile ? '0' : '32px'
                      }}>
                        {subCats.length > 0 && (
                          <button
                            onClick={() => toggleSubCategories(cat.id)}
                            style={{
                              background: 'transparent',
                              color: textColor,
                              padding: '4px 12px',
                              border: `1px solid ${borderColor}`,
                              borderRadius: '16px',
                              cursor: 'pointer',
                              fontSize: isMobile ? '11px' : '12px',
                              transition: 'all 0.2s'
                            }}
                          >
                            {isExpanded ? '▲' : '▼'} {subCats.length} {translate('sub_categories')}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setFormData({ name: '', icon: '📂', parent_id: cat.id })
                            setShowAddModal(true)
                          }}
                          style={{
                            background: '#8b5cf6',
                            color: 'white',
                            padding: '4px 12px',
                            border: 'none',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            fontSize: isMobile ? '11px' : '12px',
                            fontWeight: 'bold',
                            transition: 'all 0.2s'
                          }}
                        >
                          + {translate('sub')}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* ========================================================== */}
        {/* ADD MODAL */}
        {/* ========================================================== */}
        {showAddModal && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <h2 style={modalTitleStyle}>
                {formData.parent_id ? translate('add_sub_category') : translate('add_category')}
              </h2>
              
              <label style={labelStyle}>{translate('name')} *</label>
              <input
                type="text"
                placeholder={translate('name')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
              />
              
              <label style={labelStyle}>{translate('icon')}</label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                padding: '8px',
                background: secondaryBg,
                borderRadius: '12px',
                maxHeight: '120px',
                overflowY: 'auto',
                marginBottom: '12px'
              }}>
                {availableIcons.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setFormData({ ...formData, icon })}
                    style={{
                      padding: '6px 10px',
                      background: formData.icon === icon ? '#3b82f6' : 'transparent',
                      border: formData.icon === icon ? 'none' : `1px solid ${borderColor}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: isMobile ? '18px' : '22px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>

              <label style={labelStyle}>{translate('parent_category')}</label>
              <select
                value={formData.parent_id || ''}
                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
                style={inputStyle}
              >
                <option value="">{translate('main')}</option>
                {mainCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={addCategory} style={buttonPrimaryStyle}>
                  {translate('add')}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setFormData({ name: '', icon: '📁', parent_id: null })
                  }}
                  style={buttonSecondaryStyle}
                >
                  {translate('cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* EDIT MODAL */}
        {/* ========================================================== */}
        {showEditModal && selectedCategory && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <h2 style={modalTitleStyle}>{translate('edit_category')}</h2>
              
              <label style={labelStyle}>{translate('name')} *</label>
              <input
                type="text"
                placeholder={translate('name')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
              />
              
              <label style={labelStyle}>{translate('icon')}</label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                padding: '8px',
                background: secondaryBg,
                borderRadius: '12px',
                maxHeight: '120px',
                overflowY: 'auto',
                marginBottom: '12px'
              }}>
                {availableIcons.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setFormData({ ...formData, icon })}
                    style={{
                      padding: '6px 10px',
                      background: formData.icon === icon ? '#3b82f6' : 'transparent',
                      border: formData.icon === icon ? 'none' : `1px solid ${borderColor}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: isMobile ? '18px' : '22px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>

              <label style={labelStyle}>{translate('parent_category')}</label>
              <select
                value={formData.parent_id || ''}
                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
                style={inputStyle}
              >
                <option value="">{translate('main')}</option>
                {mainCategories
                  .filter(cat => cat.id !== selectedCategory.id)
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))
                }
              </select>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={updateCategory} style={buttonPrimaryStyle}>
                  {translate('save')}
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedCategory(null)
                    setFormData({ name: '', icon: '📁', parent_id: null })
                  }}
                  style={buttonSecondaryStyle}
                >
                  {translate('cancel')}
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
            
            .sortable-item {
              transition: all 0.2s ease;
            }
            
            .sortable-item:hover {
              transform: translateY(-1px);
              box-shadow: ${darkMode 
                ? '0 4px 12px rgba(0,0,0,0.3)' 
                : '0 4px 12px rgba(0,0,0,0.08)'};
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
            
            input:focus, select:focus { 
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

export default ManageCategories