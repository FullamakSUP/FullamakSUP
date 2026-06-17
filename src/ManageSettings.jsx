import { useState, useEffect } from 'react'
import { useLanguage } from './context/LanguageContext'
import { useTheme } from './context/ThemeContext'
import Sidebar from './components/Sidebar'
import { supabase } from './lib/supabase'

function ManageSettings() {
  const { language, setLanguage, t } = useLanguage()
  const { darkMode } = useTheme()
  
  // BUCKET NAME - konsisten dengan ManageMenu.jsx
  const STORAGE_BUCKET = 'restaurant-logos'  // ← guna bucket yang sama dengan ManageMenu
  
  const [settings, setSettings] = useState({
    restaurant_name: 'Restoran Kita',
    service_charge: 6,
    tax: 6,
    printer_type: 'thermal',
    auto_print: true,
    notification_sound: true,
    logo_url: '',
    kitchen_enabled: true,
    special_menu_enabled: false,
    special_menu_title: 'Istimewa Hari Ini',
    business_hours_start: '09:00',
    business_hours_end: '22:00',
    login_welcome_text: 'Welcome Back!',
    login_subtitle_text: 'Please sign in to continue',
    login_branding_text: 'POS System for Small & Medium Restaurants',
    login_footer_text: '© 2024 Restoran Kita • POS System',
    auto_complete_enabled: true,
    auto_complete_minutes: 5
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [kitchenEnabled, setKitchenEnabled] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteType, setDeleteType] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Modern theme colors
  const bgColor = darkMode ? '#0f0f1a' : '#f1f5f9'
  const cardBg = darkMode ? 'rgba(30, 30, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  const textColor = darkMode ? '#f1f5f9' : '#0f172a'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.6)'
  const secondaryBg = darkMode ? 'rgba(30, 30, 46, 0.8)' : 'rgba(248, 250, 252, 0.9)'
  const inputBg = darkMode ? '#1e1e2e' : '#ffffff'
  
  const glassEffect = {
    background: cardBg,
    backdropFilter: 'blur(12px)',
    border: `1px solid ${borderColor}`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
  }

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('settings').select('key, value')
      if (error) console.error('Error loading settings:', error)
      if (data && data.length > 0) {
        const newSettings = { ...settings }
        data.forEach(item => {
          if (item.key === 'service_charge' || item.key === 'tax' || item.key === 'auto_complete_minutes') {
            newSettings[item.key] = parseFloat(item.value) || 0
          } else if (item.key === 'auto_print' || item.key === 'notification_sound' || item.key === 'kitchen_enabled' || item.key === 'special_menu_enabled' || item.key === 'auto_complete_enabled') {
            newSettings[item.key] = item.value === 'true'
          } else {
            newSettings[item.key] = item.value
          }
        })
        setSettings(newSettings)
        setKitchenEnabled(newSettings.kitchen_enabled)
      }
    } catch (err) {
      console.error('Error:', err)
    }
    setLoading(false)
  }

  async function uploadLogo(file) {
    if (!file) return
    setUploadingLogo(true)
    const fileName = `logo-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, file)
    if (error) {
      console.error('Upload error:', error)
      setMessage('❌ ' + t('upload_failed'))
      setUploadingLogo(false)
      return
    }
    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName)
    const logoUrl = urlData.publicUrl
    await supabase.from('settings').upsert({ key: 'logo_url', value: logoUrl }, { onConflict: 'key' })
    setSettings(prev => ({ ...prev, logo_url: logoUrl }))
    setMessage('✅ ' + t('logo_uploaded'))
    setTimeout(() => setMessage(''), 3000)
    setUploadingLogo(false)
  }

  async function deleteLogo() {
    if (!settings.logo_url) return
    if (!window.confirm(t('delete_image'))) return
    const fileName = settings.logo_url.split('/').pop()
    await supabase.storage.from(STORAGE_BUCKET).remove([fileName])
    await supabase.from('settings').upsert({ key: 'logo_url', value: '' }, { onConflict: 'key' })
    setSettings(prev => ({ ...prev, logo_url: '' }))
    setMessage('✅ ' + t('logo_deleted'))
    setTimeout(() => setMessage(''), 3000)
  }

  async function saveSettings() {
    setSaving(true)
    setMessage('')
    try {
      const updates = [
        { key: 'restaurant_name', value: settings.restaurant_name },
        { key: 'service_charge', value: settings.service_charge.toString() },
        { key: 'tax', value: settings.tax.toString() },
        { key: 'printer_type', value: settings.printer_type },
        { key: 'auto_print', value: settings.auto_print.toString() },
        { key: 'notification_sound', value: settings.notification_sound.toString() },
        { key: 'kitchen_enabled', value: kitchenEnabled.toString() },
        { key: 'special_menu_enabled', value: settings.special_menu_enabled.toString() },
        { key: 'special_menu_title', value: settings.special_menu_title },
        { key: 'business_hours_start', value: settings.business_hours_start },
        { key: 'business_hours_end', value: settings.business_hours_end },
        { key: 'login_welcome_text', value: settings.login_welcome_text },
        { key: 'login_subtitle_text', value: settings.login_subtitle_text },
        { key: 'login_branding_text', value: settings.login_branding_text },
        { key: 'login_footer_text', value: settings.login_footer_text },
        { key: 'auto_complete_enabled', value: settings.auto_complete_enabled.toString() },
        { key: 'auto_complete_minutes', value: settings.auto_complete_minutes.toString() }
      ]
      let hasError = false
      for (const update of updates) {
        const { error } = await supabase.from('settings').upsert({ key: update.key, value: update.value }, { onConflict: 'key' })
        if (error) { console.error('Error saving:', update.key, error); hasError = true }
      }
      if (hasError) {
        setMessage('❌ ' + t('save_error'))
      } else {
        setMessage('✅ ' + t('settings_saved'))
        await loadSettings()
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (err) {
      setMessage('❌ ' + t('error_updating') + ': ' + err.message)
    }
    setSaving(false)
  }

  const updateSetting = (key, value) => { setSettings(prev => ({ ...prev, [key]: value })) }

  // ========== DELETE DATA FUNCTIONS ==========
  const openDeleteModal = (type) => {
    setDeleteType(type)
    setDeleteConfirmText('')
    setShowDeleteModal(true)
  }

  const executeDelete = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setMessage('⚠️ Sila taip "DELETE" untuk mengesahkan')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    let success = false
    let errorMsg = ''

    switch(deleteType) {
      case 'orders':
        const { error: ordersError } = await supabase.from('customer_orders').delete().neq('id', 0)
        if (ordersError) {
          errorMsg = ordersError.message
        } else {
          success = true
          setMessage('✅ Semua pesanan berjaya dipadam!')
        }
        break
      
      case 'menu':
        const { error: menuError } = await supabase.from('menu').delete().neq('id', 0)
        if (menuError) {
          errorMsg = menuError.message
        } else {
          success = true
          setMessage('✅ Semua menu berjaya dipadam!')
        }
        break
      
      case 'categories':
        const { error: categoriesError } = await supabase.from('categories').delete().neq('id', 0)
        if (categoriesError) {
          errorMsg = categoriesError.message
        } else {
          success = true
          setMessage('✅ Semua kategori berjaya dipadam!')
        }
        break
      
      case 'tables':
        const { error: tablesError } = await supabase.from('tables').delete().neq('id', 0)
        if (tablesError) {
          errorMsg = tablesError.message
        } else {
          // Re-create tables 1-23 (without capacity column)
          for (let i = 1; i <= 23; i++) {
            await supabase.from('tables').insert([{ table_number: i, status: 'available' }])
          }
          success = true
          setMessage('✅ Semua meja telah direset!')
        }
        break
      
      case 'promotions':
        const { error: promosError } = await supabase.from('promotions').delete().neq('id', 0)
        if (promosError) {
          errorMsg = promosError.message
        } else {
          success = true
          setMessage('✅ Semua promosi berjaya dipadam!')
        }
        break
      
      case 'all_data':
        // Delete all data except staff and settings
        await supabase.from('customer_orders').delete().neq('id', 0)
        await supabase.from('menu').delete().neq('id', 0)
        await supabase.from('categories').delete().neq('id', 0)
        await supabase.from('promotions').delete().neq('id', 0)
        await supabase.from('drink_options').delete().neq('id', 0)
        
        // Reset tables
        await supabase.from('tables').delete().neq('id', 0)
        for (let i = 1; i <= 23; i++) {
          await supabase.from('tables').insert([{ table_number: i, status: 'available' }])
        }
        
        success = true
        setMessage('✅ Semua data (kecuali staff & settings) berjaya dipadam!')
        break
      
      default:
        break
    }

    if (!success && errorMsg) {
      setMessage('❌ Ralat: ' + errorMsg)
    }
    
    setShowDeleteModal(false)
    setDeleteType('')
    setDeleteConfirmText('')
    setTimeout(() => setMessage(''), 3000)
  }

  if (loading) {
    return (
      <Sidebar>
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', background: bgColor, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="spinner"></div>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', background: bgColor, minHeight: '100vh' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #6c757d, #495057)',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: '0 8px 20px rgba(108,117,125,0.3)'
            }}>
              ⚙️
            </div>
            <div>
              <h1 style={{ margin: 0, color: textColor, fontSize: '28px', fontWeight: 'bold' }}>
                {t('system_settings')}
              </h1>
              <p style={{ color: textMuted, marginTop: '4px', fontSize: '14px' }}>
                {language === 'bm' ? 'Urus tetapan sistem restoran anda' : 'Manage your restaurant system settings'}
              </p>
            </div>
          </div>
          <div style={{ 
            height: '4px', 
            width: '80px', 
            background: 'linear-gradient(135deg, #6c757d, #3b82f6)', 
            borderRadius: '4px',
            marginTop: '8px'
          }} />
        </div>

        {/* Message Alert */}
        {message && (
          <div style={{ 
            background: message.includes('✅') ? '#dcfce7' : '#fee2e2', 
            color: message.includes('✅') ? '#166534' : '#991b1b', 
            padding: '14px 20px', 
            borderRadius: '60px', 
            marginBottom: '24px', 
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {message}
          </div>
        )}

        {/* Main Settings Card */}
        <div style={{ ...glassEffect, borderRadius: '28px', padding: '28px' }}>
          
          {/* Section 1: Language */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>🌐</span>
              <h3 style={{ margin: 0, color: textColor, fontSize: '17px', fontWeight: 'bold' }}>{t('language')}</h3>
            </div>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)} 
              style={{ 
                width: '100%', 
                padding: '14px', 
                borderRadius: '16px', 
                border: `1px solid ${borderColor}`, 
                fontSize: '14px', 
                background: inputBg, 
                color: textColor,
                outline: 'none'
              }}
            >
              <option value="bm">🇲🇾 Bahasa Melayu</option>
              <option value="en">🇺🇸 English</option>
            </select>
          </div>

          {/* Section 2: Restaurant Info */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>🏪</span>
              <h3 style={{ margin: 0, color: textColor, fontSize: '17px', fontWeight: 'bold' }}>
                {language === 'bm' ? 'Maklumat Restoran' : 'Restaurant Info'}
              </h3>
            </div>
            
            {/* Logo Upload */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: textColor }}>🖼️ {t('restaurant_logo')}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                {settings.logo_url ? (
                  <div style={{ position: 'relative' }}>
                    <img src={settings.logo_url} alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '16px', border: `1px solid ${borderColor}` }} />
                    <button onClick={deleteLogo} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                  </div>
                ) : (
                  <div style={{ width: '80px', height: '80px', background: secondaryBg, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${borderColor}` }}>
                    <span style={{ fontSize: '40px' }}>🏪</span>
                  </div>
                )}
                <div>
                  <input type="file" accept="image/*" onChange={(e) => { if (e.target.files[0]) uploadLogo(e.target.files[0]) }} style={{ display: 'none' }} id="logo-upload" />
                  <label htmlFor="logo-upload" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', padding: '10px 20px', borderRadius: '40px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                    {uploadingLogo ? '⏳ ' + t('uploading') : '📤 ' + t('select_logo')}
                  </label>
                  <p style={{ fontSize: '11px', color: textMuted, marginTop: '8px' }}>
                    {language === 'bm' ? 'Format: JPG, PNG (Saiz terbaik: 200x200px)' : 'Format: JPG, PNG (Best size: 200x200px)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Restaurant Name */}
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: textColor }}>📛 {t('restaurant_name')}</label>
              <input type="text" value={settings.restaurant_name} onChange={(e) => updateSetting('restaurant_name', e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, fontSize: '14px', background: inputBg, color: textColor, outline: 'none' }} />
            </div>
          </div>

          {/* Section 3: Tax & Service Charge */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>💰</span>
              <h3 style={{ margin: 0, color: textColor, fontSize: '17px', fontWeight: 'bold' }}>
                {language === 'bm' ? 'Cukai & Caj Perkhidmatan' : 'Tax & Service Charge'}
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: textColor }}>{t('service_charge')} (%)</label>
                <input type="number" step="0.5" min="0" max="100" value={settings.service_charge} onChange={(e) => updateSetting('service_charge', parseFloat(e.target.value) || 0)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, fontSize: '14px', background: inputBg, color: textColor, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: textColor }}>{t('tax')} (%)</label>
                <input type="number" step="0.5" min="0" max="100" value={settings.tax} onChange={(e) => updateSetting('tax', parseFloat(e.target.value) || 0)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, fontSize: '14px', background: inputBg, color: textColor, outline: 'none' }} />
              </div>
            </div>
          </div>

          {/* Section 4: Printer Settings */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>🖨️</span>
              <h3 style={{ margin: 0, color: textColor, fontSize: '17px', fontWeight: 'bold' }}>
                {language === 'bm' ? 'Pencetakan' : 'Printing'}
              </h3>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: textColor }}>{t('printer_type')}</label>
              <select value={settings.printer_type} onChange={(e) => updateSetting('printer_type', e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, fontSize: '14px', background: inputBg, color: textColor, outline: 'none' }}>
                <option value="thermal">🖨️ {t('thermal_printer')}</option>
                <option value="a4">📄 {t('a4_printer')}</option>
                <option value="none">❌ {t('no_printer')}</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: secondaryBg, borderRadius: '16px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '13px', color: textColor }}>🖨️ {t('auto_print')}</label>
                <label style={{ position: 'relative', display: 'inline-block', width: '52px', height: '26px' }}>
                  <input type="checkbox" checked={settings.auto_print} onChange={(e) => updateSetting('auto_print', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: settings.auto_print ? '#22c55e' : '#64748b', transition: '.3s', borderRadius: '34px' }}>
                    <span style={{ position: 'absolute', height: '20px', width: '20px', left: '3px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%', transform: settings.auto_print ? 'translateX(26px)' : 'none' }} />
                  </span>
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: secondaryBg, borderRadius: '16px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '13px', color: textColor }}>🔔 {t('notification_sound')}</label>
                <label style={{ position: 'relative', display: 'inline-block', width: '52px', height: '26px' }}>
                  <input type="checkbox" checked={settings.notification_sound} onChange={(e) => updateSetting('notification_sound', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: settings.notification_sound ? '#22c55e' : '#64748b', transition: '.3s', borderRadius: '34px' }}>
                    <span style={{ position: 'absolute', height: '20px', width: '20px', left: '3px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%', transform: settings.notification_sound ? 'translateX(26px)' : 'none' }} />
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 5: Kitchen Settings */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>🍳</span>
              <h3 style={{ margin: 0, color: textColor, fontSize: '17px', fontWeight: 'bold' }}>
                {language === 'bm' ? 'Dapur Digital' : 'Digital Kitchen'}
              </h3>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: secondaryBg, borderRadius: '20px' }}>
              <div>
                <label style={{ fontWeight: 'bold', fontSize: '14px', color: textColor }}>{t('kitchen_app')}</label>
                <p style={{ fontSize: '11px', color: textMuted, marginTop: '4px' }}>{t('kitchen_on_off')}</p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '52px', height: '26px' }}>
                <input type="checkbox" checked={kitchenEnabled} onChange={(e) => setKitchenEnabled(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: kitchenEnabled ? '#22c55e' : '#64748b', transition: '.3s', borderRadius: '34px' }}>
                  <span style={{ position: 'absolute', height: '20px', width: '20px', left: '3px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%', transform: kitchenEnabled ? 'translateX(26px)' : 'none' }} />
                </span>
              </label>
            </div>

            {/* Auto Complete Settings */}
            {!kitchenEnabled && (
              <div style={{ marginTop: '16px', padding: '16px', background: secondaryBg, borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontWeight: 'bold', fontSize: '14px', color: textColor }}>⏱️ {t('auto_complete')}</label>
                    <p style={{ fontSize: '11px', color: textMuted, marginTop: '2px' }}>
                      {language === 'bm' ? 'Pesanan akan dilengkapkan secara automatik selepas X minit' : 'Order will be auto completed after X minutes'}
                    </p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '52px', height: '26px' }}>
                    <input type="checkbox" checked={settings.auto_complete_enabled} onChange={(e) => updateSetting('auto_complete_enabled', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: settings.auto_complete_enabled ? '#22c55e' : '#64748b', transition: '.3s', borderRadius: '34px' }}>
                      <span style={{ position: 'absolute', height: '20px', width: '20px', left: '3px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%', transform: settings.auto_complete_enabled ? 'translateX(26px)' : 'none' }} />
                    </span>
                  </label>
                </div>
                
                {settings.auto_complete_enabled && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: textColor }}>
                      ⏱️ {t('minutes_to_complete')}
                    </label>
                    <input 
                      type="number" 
                      min="1" 
                      max="30" 
                      value={settings.auto_complete_minutes} 
                      onChange={(e) => updateSetting('auto_complete_minutes', parseInt(e.target.value) || 5)} 
                      style={{ width: '100%', padding: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, fontSize: '14px', background: inputBg, color: textColor, outline: 'none' }} 
                    />
                    <p style={{ fontSize: '11px', color: textMuted, marginTop: '4px' }}>
                      {language === 'bm' ? 'Pesanan akan dilengkapkan secara automatik selepas' : 'Order will be auto completed after'} {settings.auto_complete_minutes} {language === 'bm' ? 'minit' : 'minutes'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 6: Special Menu Settings */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>⭐</span>
              <h3 style={{ margin: 0, color: textColor, fontSize: '17px', fontWeight: 'bold' }}>
                {language === 'bm' ? 'Menu Istimewa' : 'Special Menu'}
              </h3>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: secondaryBg, borderRadius: '20px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontWeight: 'bold', fontSize: '14px', color: textColor }}>{t('enable_special_menu')}</label>
                <p style={{ fontSize: '11px', color: textMuted, marginTop: '4px' }}>
                  {language === 'bm' ? 'Paparkan menu istimewa di laman utama' : 'Display special menu on main page'}
                </p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '52px', height: '26px' }}>
                <input type="checkbox" checked={settings.special_menu_enabled} onChange={(e) => updateSetting('special_menu_enabled', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: settings.special_menu_enabled ? '#22c55e' : '#64748b', transition: '.3s', borderRadius: '34px' }}>
                  <span style={{ position: 'absolute', height: '20px', width: '20px', left: '3px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%', transform: settings.special_menu_enabled ? 'translateX(26px)' : 'none' }} />
                </span>
              </label>
            </div>

            {settings.special_menu_enabled && (
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: textColor }}>⭐ {t('special_menu_title')}</label>
                <input type="text" value={settings.special_menu_title} onChange={(e) => updateSetting('special_menu_title', e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, fontSize: '14px', background: inputBg, color: textColor, outline: 'none' }} />
              </div>
            )}
          </div>

          {/* Section 7: Business Hours */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>⏰</span>
              <h3 style={{ margin: 0, color: textColor, fontSize: '17px', fontWeight: 'bold' }}>{t('business_hours')}</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: textColor }}>🕐 {t('start')}</label>
                <input type="time" value={settings.business_hours_start} onChange={(e) => updateSetting('business_hours_start', e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, fontSize: '14px', background: inputBg, color: textColor, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: textColor }}>🕐 {t('end')}</label>
                <input type="time" value={settings.business_hours_end} onChange={(e) => updateSetting('business_hours_end', e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, fontSize: '14px', background: inputBg, color: textColor, outline: 'none' }} />
              </div>
            </div>
          </div>

          {/* Section 8: Login Page Settings */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>🔐</span>
              <h3 style={{ margin: 0, color: textColor, fontSize: '17px', fontWeight: 'bold' }}>{t('login_page')}</h3>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: textColor }}>👋 {t('welcome_text')}</label>
              <input type="text" value={settings.login_welcome_text} onChange={(e) => updateSetting('login_welcome_text', e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, fontSize: '14px', background: inputBg, color: textColor, outline: 'none' }} />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: textColor }}>📝 {t('subtitle_text')}</label>
              <input type="text" value={settings.login_subtitle_text} onChange={(e) => updateSetting('login_subtitle_text', e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, fontSize: '14px', background: inputBg, color: textColor, outline: 'none' }} />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: textColor }}>⭐ {t('branding_text')}</label>
              <input type="text" value={settings.login_branding_text} onChange={(e) => updateSetting('login_branding_text', e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, fontSize: '14px', background: inputBg, color: textColor, outline: 'none' }} />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: textColor }}>© {t('footer_text')}</label>
              <input type="text" value={settings.login_footer_text} onChange={(e) => updateSetting('login_footer_text', e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, fontSize: '14px', background: inputBg, color: textColor, outline: 'none' }} />
            </div>
          </div>

          {/* Section 9: Preview */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>📊</span>
              <h3 style={{ margin: 0, color: textColor, fontSize: '17px', fontWeight: 'bold' }}>{t('preview')}</h3>
            </div>
            <div style={{ background: secondaryBg, borderRadius: '20px', padding: '20px' }}>
              <div style={{ fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: textColor }}>
                  <span>{t('subtotal')} ({t('example')}):</span>
                  <span>RM 100.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: textColor }}>
                  <span>{t('service_charge')} ({settings.service_charge}%):</span>
                  <span>RM {(100 * settings.service_charge / 100).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: textColor }}>
                  <span>{t('tax')} ({settings.tax}%):</span>
                  <span>RM {(100 * settings.tax / 100).toFixed(2)}</span>
                </div>
                <div style={{ borderTop: `1px solid ${borderColor}`, margin: '14px 0', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px' }}>
                  <span style={{ color: textColor }}>{t('total')}:</span>
                  <span style={{ color: '#22c55e' }}>RM {(100 + (100 * settings.service_charge / 100) + (100 * settings.tax / 100)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 10: Danger Zone */}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: `2px solid #ef4444` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <h3 style={{ margin: 0, color: '#ef4444', fontSize: '17px', fontWeight: 'bold' }}>
                {language === 'bm' ? 'Zon Berbahaya - Padam Data' : 'Danger Zone - Delete Data'}
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: textMuted, marginBottom: '20px' }}>
              {language === 'bm' 
                ? 'Berhati-hati! Tindakan ini tidak boleh dibatalkan. Data yang dipadam tidak dapat dipulihkan.' 
                : 'Caution! This action cannot be undone. Deleted data cannot be recovered.'}
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              <button 
                onClick={() => openDeleteModal('orders')}
                style={{ background: '#ef4444', color: 'white', padding: '12px 16px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                🗑️ Delete All Orders
              </button>
              <button 
                onClick={() => openDeleteModal('menu')}
                style={{ background: '#ef4444', color: 'white', padding: '12px 16px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                🗑️ Delete All Menu
              </button>
              <button 
                onClick={() => openDeleteModal('categories')}
                style={{ background: '#ef4444', color: 'white', padding: '12px 16px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                🗑️ Delete All Categories
              </button>
              <button 
                onClick={() => openDeleteModal('tables')}
                style={{ background: '#ef4444', color: 'white', padding: '12px 16px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                🗑️ Reset All Tables
              </button>
              <button 
                onClick={() => openDeleteModal('promotions')}
                style={{ background: '#ef4444', color: 'white', padding: '12px 16px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                🗑️ Delete All Promotions
              </button>
              <button 
                onClick={() => openDeleteModal('all_data')}
                style={{ background: '#dc2626', color: 'white', padding: '12px 16px', border: '2px solid #fff', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                ⚠️ Reset ALL Data (Except Staff)
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
            <button onClick={saveSettings} disabled={saving} style={{ flex: 1, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', padding: '14px', border: 'none', borderRadius: '60px', fontSize: '15px', fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, transition: 'transform 0.2s' }} onMouseEnter={e => !saving && (e.currentTarget.style.transform = 'scale(1.02)')} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              {saving ? '⏳ ' + t('saving') : '💾 ' + t('save')}
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease' }}>
            <div style={{ background: cardBg, padding: '32px', borderRadius: '28px', maxWidth: '450px', width: '90%', ...glassEffect, animation: 'popIn 0.3s ease' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ width: '60px', height: '60px', background: '#ef4444', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                  <span style={{ fontSize: '28px' }}>⚠️</span>
                </div>
                <h2 style={{ marginTop: 0, color: textColor, fontSize: '22px', fontWeight: 'bold' }}>
                  {deleteType === 'orders' && 'Padam Semua Pesanan?'}
                  {deleteType === 'menu' && 'Padam Semua Menu?'}
                  {deleteType === 'categories' && 'Padam Semua Kategori?'}
                  {deleteType === 'tables' && 'Reset Semua Meja?'}
                  {deleteType === 'promotions' && 'Padam Semua Promosi?'}
                  {deleteType === 'all_data' && 'Reset SEMUA Data?'}
                </h2>
                <p style={{ color: textMuted, fontSize: '13px', marginTop: '8px' }}>
                  {deleteType === 'all_data' 
                    ? 'Tindakan ini akan memadam SEMUA data pesanan, menu, kategori, promosi, dan meja. Staff dan tetapan akan kekal.' 
                    : 'Tindakan ini TIDAK BOLEH dibatalkan. Semua data akan hilang.'}
                </p>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: textColor }}>
                  Taip <span style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: '16px' }}>DELETE</span> untuk sahkan:
                </label>
                <input 
                  type="text" 
                  value={deleteConfirmText} 
                  onChange={(e) => setDeleteConfirmText(e.target.value)} 
                  placeholder="DELETE" 
                  style={{ width: '100%', padding: '14px', borderRadius: '16px', border: `2px solid ${deleteConfirmText === 'DELETE' ? '#22c55e' : '#ef4444'}`, background: inputBg, color: textColor, outline: 'none', fontSize: '14px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 'bold' }} 
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={executeDelete} disabled={deleteConfirmText !== 'DELETE'} style={{ flex: 1, background: deleteConfirmText === 'DELETE' ? '#ef4444' : '#cbd5e1', color: 'white', padding: '14px', border: 'none', borderRadius: '60px', cursor: deleteConfirmText === 'DELETE' ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                  ✅ Ya, Padam
                </button>
                <button onClick={() => setShowDeleteModal(false)} style={{ flex: 1, background: '#64748b', color: 'white', padding: '14px', border: 'none', borderRadius: '60px', cursor: 'pointer', fontWeight: 'bold' }}>
                  ❌ Batal
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
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: ${darkMode ? '#2a2a3e' : '#e2e8f0'}; border-radius: 10px; }
            ::-webkit-scrollbar-thumb { background: ${darkMode ? '#555' : '#94a3b8'}; border-radius: 10px; }
          `}
        </style>
      </div>
    </Sidebar>
  )
}

export default ManageSettings