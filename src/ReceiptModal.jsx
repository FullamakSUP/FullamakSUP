import { useRef, useState, useEffect } from 'react'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'
import toast from 'react-hot-toast'
import { supabase } from './lib/supabase'

function ReceiptModal({ order, onClose }) {
  const receiptRef = useRef()
  const { darkMode } = useTheme()
  const { language } = useLanguage()
  const [restaurantName, setRestaurantName] = useState('Restoran Kita')
  const [restaurantLogo, setRestaurantLogo] = useState('')
  const [cashierName, setCashierName] = useState('')
  const [isMobile, setIsMobile] = useState(false)

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
  // COMPLETE TRANSLATIONS
  // ============================================================
  const translations = {
    // Header
    receipt_title: { en: '🧾 Receipt', ms: '🧾 Resit' },
    
    // Thank you
    thank_you: { en: 'Thank you for dining with us!', ms: 'Terima kasih kerana makan di sini!' },
    receipt_footer: { en: 'Thank you and see you again!', ms: 'Terima kasih dan jumpa lagi!' },
    
    // Labels
    order_number: { en: 'Order Number', ms: 'Nombor Pesanan' },
    type: { en: 'Type', ms: 'Jenis' },
    customer_name: { en: 'Customer', ms: 'Pelanggan' },
    phone: { en: 'Phone', ms: 'Telefon' },
    date: { en: 'Date', ms: 'Tarikh' },
    cashier: { en: 'Cashier', ms: 'Kru' },
    item: { en: 'Item', ms: 'Item' },
    qty: { en: 'Qty', ms: 'Bil' },
    price: { en: 'Price', ms: 'Harga' },
    subtotal: { en: 'Subtotal', ms: 'Subtotal' },
    service_charge: { en: 'Service Charge', ms: 'Caj Perkhidmatan' },
    tax: { en: 'Tax', ms: 'Cukai' },
    total: { en: 'Total', ms: 'Jumlah' },
    payment_method: { en: 'Payment Method', ms: 'Kaedah Bayaran' },
    
    // Order types
    take_away: { en: 'Take Away', ms: 'Bungkus' },
    table_number: { en: 'Table', ms: 'Meja' },
    walk_in: { en: 'Walk-in', ms: 'Walk-in' },
    
    // Payment methods
    cash: { en: 'Cash', ms: 'Tunai' },
    tng: { en: 'TnG', ms: 'TnG' },
    bank: { en: 'Bank', ms: 'Bank' },
    
    // Drink options
    hot: { en: 'Hot', ms: 'Panas' },
    cold: { en: 'Cold', ms: 'Sejuk' },
    takeaway_drink: { en: 'Takeaway', ms: 'Bungkus' },
    
    // Promo
    free: { en: 'FREE', ms: 'PERCUMA' },
    promo_used: { en: '🎁 Promotions Used', ms: '🎁 Promosi Digunakan' },
    promo_bundle: { en: 'Bundle Deal', ms: 'Tawaran Bundle' },
    
    // Tracking
    track_order: { en: '🔍 Track your order:', ms: '🔍 Jejak pesanan anda:' },
    click_here: { en: 'click here', ms: 'klik di sini' },
    or_enter: { en: 'Or enter order number at', ms: 'Atau masukkan nombor pesanan di' },
    
    // Buttons
    btn_print: { en: '🖨️ Print', ms: '🖨️ Cetak' },
    btn_pdf: { en: '📄 PDF', ms: '📄 PDF' },
    close: { en: '❌ Close', ms: '❌ Tutup' },
    
    // Messages
    pdf_ready: { en: 'PDF ready to save!', ms: 'PDF sedia untuk disimpan!' },
    no_order_data: { en: 'No order data available', ms: 'Tiada data pesanan' },
  }

  const t = (key) => {
    if (!translations[key]) return key
    return language === 'en' ? translations[key].en : translations[key].ms
  }

  // ============================================================
  // THEME COLORS
  // ============================================================
  const modalBg = darkMode ? 'rgba(20, 20, 40, 0.98)' : 'rgba(255, 255, 255, 0.98)'
  const receiptBg = darkMode ? 'rgba(20, 20, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  const textColor = darkMode ? '#e8edf5' : '#0f172a'
  const textMuted = darkMode ? '#9aa8b9' : '#64748b'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.4)' : 'rgba(203, 213, 225, 0.6)'
  const secondaryBg = darkMode ? 'rgba(30, 30, 50, 0.6)' : 'rgba(248, 250, 252, 0.8)'
  
  const glassEffect = {
    background: modalBg,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${borderColor}`,
    boxShadow: darkMode 
      ? '0 8px 40px rgba(0, 0, 0, 0.6)' 
      : '0 8px 40px rgba(0, 0, 0, 0.08)'
  }

  // ============================================================
  // GET DRINK OPTION LABEL
  // ============================================================
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

  // ============================================================
  // LOAD DATA
  // ============================================================
  useEffect(() => {
    loadRestaurantInfo()
    loadCashierInfo()
  }, [])

  // Auto print when modal opens
  useEffect(() => {
    const checkAndAutoPrint = async () => {
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
            printReceipt()
          }, 500)
        }
      } catch (err) {
        console.error('Auto print check error:', err)
      }
    }
    
    checkAndAutoPrint()
  }, [])

  async function loadRestaurantInfo() {
    try {
      const { data: nameData } = await supabase.from('settings').select('value').eq('key', 'restaurant_name').single()
      if (nameData) setRestaurantName(nameData.value)
      
      const { data: logoData } = await supabase.from('settings').select('value').eq('key', 'logo_url').single()
      if (logoData && logoData.value) setRestaurantLogo(logoData.value)
    } catch (err) {
      console.error('Error loading restaurant info:', err)
    }
  }

  async function loadCashierInfo() {
    const userStr = sessionStorage.getItem('staffAuth')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setCashierName(user.name || user.username || 'Staff')
      } catch (e) {
        setCashierName('Staff')
      }
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString(language === 'bm' ? 'ms-MY' : 'en-US', {
      timeZone: 'Asia/Kuala_Lumpur',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getOrderTypeText = () => {
    if (order.order_type === 'take_away') return `🥡 ${t('take_away')}`
    if (order.table_number && order.table_number > 0) return `🍽️ ${t('table_number')} ${order.table_number}`
    return `🚶 ${t('walk_in')}`
  }

  const getPaymentMethodText = () => {
    if (order.payment_method === 'cash') return `💵 ${t('cash')}`
    if (order.payment_method === 'tng') return `📱 ${t('tng')}`
    if (order.payment_method === 'bank') return `🏦 ${t('bank')}`
    return '-'
  }

  // ============================================================
  // PRINT RECEIPT - FIXED DARK MODE SUPPORT
  // ============================================================
  const printReceipt = () => {
    const printContent = receiptRef.current?.innerHTML || ''
    const isDark = darkMode
    
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${restaurantName}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 20px; 
            background: ${isDark ? '#1a1a2e' : '#ffffff'}; 
            color: ${isDark ? '#e8edf5' : '#0f172a'};
          }
          .receipt { 
            max-width: 320px; 
            margin: 0 auto; 
            font-size: 12px;
            background: ${isDark ? '#1a1a2e' : '#ffffff'};
            padding: 16px;
            border-radius: 12px;
          }
          .header { 
            text-align: center; 
            border-bottom: 1px dashed ${isDark ? '#475569' : '#94a3b8'}; 
            padding-bottom: 12px; 
            margin-bottom: 12px; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 18px; 
            color: ${isDark ? '#f1f5f9' : '#0f172a'};
          }
          .header .sub {
            font-size: 10px;
            color: ${isDark ? '#94a3b8' : '#64748b'};
            margin-top: 4px;
          }
          .logo { 
            max-width: 60px; 
            margin-bottom: 6px; 
            border-radius: 12px;
          }
          .divider { 
            border-top: 1px dashed ${isDark ? '#475569' : '#94a3b8'}; 
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
            color: ${isDark ? '#e8edf5' : '#0f172a'};
          }
          .items th:last-child, .items td:last-child { 
            text-align: right; 
          }
          .items th {
            font-size: 10px;
            color: ${isDark ? '#94a3b8' : '#64748b'};
            border-bottom: 1px solid ${isDark ? '#475569' : '#e2e8f0'};
          }
          .total-row {
            font-size: 16px;
            font-weight: bold;
            color: ${isDark ? '#4ade80' : '#22c55e'};
          }
          .footer { 
            text-align: center; 
            margin-top: 16px; 
            border-top: 1px dashed ${isDark ? '#475569' : '#94a3b8'}; 
            padding-top: 12px; 
            font-size: 10px; 
            color: ${isDark ? '#94a3b8' : '#64748b'};
          }
          .footer .stars {
            font-size: 16px;
            letter-spacing: 4px;
            color: #f59e0b;
          }
          .label { color: ${isDark ? '#94a3b8' : '#64748b'}; }
          .amount { font-weight: bold; }
          .amount-green { color: ${isDark ? '#4ade80' : '#22c55e'}; }
          .order-info {
            font-size: 11px;
            color: ${isDark ? '#94a3b8' : '#64748b'};
            margin: 2px 0;
          }
          .promo-box {
            background: ${isDark ? 'rgba(139,92,246,0.15)' : '#f3e8ff'};
            padding: 8px;
            border-radius: 8px;
            margin: 8px 0;
            font-size: 10px;
          }
          .promo-box .promo-title {
            font-weight: bold;
            color: ${isDark ? '#a78bfa' : '#7c3aed'};
            margin-bottom: 4px;
          }
          .free-tag {
            color: #22c55e;
            font-weight: bold;
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
            .promo-box { background: #f3e8ff !important; }
            .promo-box .promo-title { color: #7c3aed !important; }
            .free-tag { color: #22c55e !important; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">${printContent}</div>
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
    `)
    printWindow.document.close()
  }

  // ============================================================
  // DOWNLOAD AS PDF
  // ============================================================
  const downloadAsPDF = () => {
    const printContent = receiptRef.current?.innerHTML || ''
    const isDark = darkMode
    
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${restaurantName}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 20px; 
            background: ${isDark ? '#1a1a2e' : '#ffffff'}; 
            color: ${isDark ? '#e8edf5' : '#0f172a'};
          }
          .receipt { 
            max-width: 320px; 
            margin: 0 auto; 
            font-size: 12px;
            background: ${isDark ? '#1a1a2e' : '#ffffff'};
            padding: 16px;
            border-radius: 12px;
          }
          .header { text-align: center; border-bottom: 1px dashed ${isDark ? '#475569' : '#94a3b8'}; padding-bottom: 12px; margin-bottom: 12px; }
          .header h1 { margin: 0; font-size: 18px; color: ${isDark ? '#f1f5f9' : '#0f172a'}; }
          .header .sub { font-size: 10px; color: ${isDark ? '#94a3b8' : '#64748b'}; margin-top: 4px; }
          .logo { max-width: 60px; margin-bottom: 6px; border-radius: 12px; }
          .divider { border-top: 1px dashed ${isDark ? '#475569' : '#94a3b8'}; margin: 10px 0; }
          .items { width: 100%; margin: 10px 0; border-collapse: collapse; }
          .items th, .items td { text-align: left; padding: 4px 0; color: ${isDark ? '#e8edf5' : '#0f172a'}; }
          .items th:last-child, .items td:last-child { text-align: right; }
          .items th { font-size: 10px; color: ${isDark ? '#94a3b8' : '#64748b'}; border-bottom: 1px solid ${isDark ? '#475569' : '#e2e8f0'}; }
          .total-row { font-size: 16px; font-weight: bold; color: ${isDark ? '#4ade80' : '#22c55e'}; }
          .footer { text-align: center; margin-top: 16px; border-top: 1px dashed ${isDark ? '#475569' : '#94a3b8'}; padding-top: 12px; font-size: 10px; color: ${isDark ? '#94a3b8' : '#64748b'}; }
          .footer .stars { font-size: 16px; letter-spacing: 4px; color: #f59e0b; }
          .label { color: ${isDark ? '#94a3b8' : '#64748b'}; }
          .amount { font-weight: bold; }
          .amount-green { color: ${isDark ? '#4ade80' : '#22c55e'}; }
          .order-info { font-size: 11px; color: ${isDark ? '#94a3b8' : '#64748b'}; margin: 2px 0; }
          .promo-box { background: ${isDark ? 'rgba(139,92,246,0.15)' : '#f3e8ff'}; padding: 8px; border-radius: 8px; margin: 8px 0; font-size: 10px; }
          .promo-box .promo-title { font-weight: bold; color: ${isDark ? '#a78bfa' : '#7c3aed'}; margin-bottom: 4px; }
          .free-tag { color: #22c55e; font-weight: bold; }
          @media print { body { margin: 0; padding: 0; } }
        </style>
      </head>
      <body>
        <div class="receipt">${printContent}</div>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
            }, 300);
          }
        <\/script>
      </body>
      </html>
    `)
    printWindow.document.close()
    toast.success(t('pdf_ready'))
  }

  // ============================================================
  // COMPUTED VALUES
  // ============================================================
  const hasPromoItems = order.items?.some(item => item.is_free || item.is_promo_item)
  const subtotal = order.subtotal || order.total || 0
  const serviceCharge = order.service_charge || 0
  const tax = order.tax || 0
  const grandTotal = order.grand_total || (subtotal + serviceCharge + tax)

  if (!order) {
    return (
      <div style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', 
        display: 'flex', justifyContent: 'center', alignItems: 'center', 
        zIndex: 2000 
      }}>
        <div style={{ background: modalBg, padding: '40px', borderRadius: '24px', textAlign: 'center' }}>
          <span style={{ fontSize: '48px' }}>📄</span>
          <p style={{ color: textColor, marginTop: '12px' }}>{t('no_order_data')}</p>
          <button onClick={onClose} style={{ marginTop: '16px', padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '40px', cursor: 'pointer' }}>❌ {t('close')}</button>
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', 
      display: 'flex', justifyContent: 'center', alignItems: 'center', 
      zIndex: 2000, animation: 'fadeIn 0.25s ease' 
    }}>
      <div style={{ 
        ...glassEffect, 
        borderRadius: isMobile ? '20px' : '28px', 
        maxWidth: isMobile ? '95%' : '420px', 
        width: '100%', 
        maxHeight: '90vh', 
        overflowY: 'auto',
        animation: 'popIn 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* ===== RECEIPT CONTENT ===== */}
        <div ref={receiptRef} style={{ 
          padding: isMobile ? '16px' : '24px', 
          background: receiptBg, 
          color: textColor,
          flex: 1
        }}>
          
          {/* Header */}
          <div style={{ 
            textAlign: 'center', 
            borderBottom: `1px dashed ${borderColor}`, 
            paddingBottom: '12px' 
          }}>
            {restaurantLogo ? (
              <img 
                src={restaurantLogo} 
                alt={restaurantName} 
                style={{ 
                  maxWidth: '60px', 
                  marginBottom: '6px', 
                  borderRadius: '12px',
                  display: 'block',
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }} 
              />
            ) : (
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '4px' }}>🏪</span>
            )}
            <h2 style={{ 
              margin: '4px 0 0 0', 
              fontSize: isMobile ? '15px' : '16px', 
              fontWeight: 'bold', 
              color: textColor 
            }}>
              {restaurantName}
            </h2>
            <p style={{ 
              margin: '2px 0', 
              fontSize: isMobile ? '9px' : '10px', 
              color: textMuted 
            }}>
              📄 {t('receipt_title')}
            </p>
          </div>
          
          {/* Order Details */}
          <div style={{ 
            marginBottom: '12px', 
            fontSize: isMobile ? '10px' : '11px', 
            marginTop: '12px' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: textMuted }}>{t('order_number')}:</span>
              <span style={{ color: textColor, fontWeight: 'bold' }}>{order.order_number || `ORD-${order.id}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: textMuted }}>{t('type')}:</span>
              <span style={{ color: textColor, fontWeight: 'bold' }}>{getOrderTypeText()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: textMuted }}>{t('customer_name')}:</span>
              <span style={{ color: textColor, fontWeight: 'bold' }}>{order.customer_name || 'Walk-in'}</span>
            </div>
            {order.customer_phone && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: textMuted }}>{t('phone')}:</span>
                <span style={{ color: textColor, fontWeight: 'bold' }}>{order.customer_phone}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: textMuted }}>{t('date')}:</span>
              <span style={{ color: textColor, fontWeight: 'bold' }}>{formatDate(order.paid_at || order.created_at)}</span>
            </div>
            {cashierName && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginTop: '6px', 
                paddingTop: '6px', 
                borderTop: `1px dashed ${borderColor}` 
              }}>
                <span style={{ color: textMuted }}>{t('cashier')}:</span>
                <span style={{ color: textColor, fontWeight: 'bold' }}>{cashierName}</span>
              </div>
            )}
          </div>
          
          <div className="divider" style={{ borderTop: `1px dashed ${borderColor}`, margin: '10px 0' }}></div>
          
          {/* Items Table */}
          <table style={{ 
            width: '100%', 
            margin: '10px 0', 
            fontSize: isMobile ? '10px' : '11px', 
            borderCollapse: 'collapse' 
          }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                <th style={{ textAlign: 'left', padding: '4px', color: textMuted }}>{t('item')}</th>
                <th style={{ textAlign: 'center', padding: '4px', color: textMuted }}>{t('qty')}</th>
                <th style={{ textAlign: 'right', padding: '4px', color: textMuted }}>{t('price')}</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => {
                let optionLabel = ''
                if (item.option_type === 'Panas') optionLabel = `🔥 ${t('hot')}`
                else if (item.option_type === 'Sejuk') optionLabel = `🧊 ${t('cold')}`
                else if (item.option_type === 'Bungkus') optionLabel = `📦 ${t('takeaway_drink')}`
                
                const isFree = item.is_free || false
                const isPromo = item.is_promo_item || false
                
                return (
                  <tr key={idx} style={{ 
                    borderBottom: idx !== order.items.length - 1 ? `1px solid ${borderColor}` : 'none' 
                  }}>
                    <td style={{ textAlign: 'left', padding: '4px', color: textColor }}>
                      {item.name}
                      {optionLabel && (
                        <span style={{ 
                          background: item.option_type === 'Bungkus' ? '#8b5cf6' : 
                                     item.option_type === 'Panas' ? '#f97316' : '#06b6d4',
                          color: 'white',
                          padding: '1px 6px',
                          borderRadius: '10px',
                          fontSize: '8px',
                          marginLeft: '4px',
                          fontWeight: 'bold',
                          display: 'inline-block'
                        }}>
                          {optionLabel}
                        </span>
                      )}
                      {isFree && (
                        <span style={{ 
                          color: '#22c55e', 
                          fontSize: isMobile ? '8px' : '9px', 
                          marginLeft: '4px', 
                          fontWeight: 'bold' 
                        }}>
                          ({t('free')})
                        </span>
                      )}
                      {isPromo && !isFree && (
                        <span style={{ 
                          color: '#8b5cf6', 
                          fontSize: isMobile ? '8px' : '9px', 
                          marginLeft: '4px' 
                        }}>
                          (PROMO)
                        </span>
                      )}
                      {item.option_name && !item.option_type && (
                        <span style={{ 
                          fontSize: isMobile ? '8px' : '9px', 
                          color: '#f59e0b', 
                          marginLeft: '4px' 
                        }}>
                          ({item.option_name})
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', padding: '4px', color: textColor }}>
                      {item.quantity}
                    </td>
                    <td style={{ 
                      textAlign: 'right', 
                      padding: '4px', 
                      color: isFree ? '#22c55e' : '#22c55e', 
                      fontWeight: isFree ? 'bold' : 'normal' 
                    }}>
                      {isFree ? 'FREE' : `RM ${(item.price * item.quantity).toFixed(2)}`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          
          <div className="divider" style={{ borderTop: `1px dashed ${borderColor}`, margin: '10px 0' }}></div>
          
          {/* Promo Section */}
          {hasPromoItems && (
            <div style={{ 
              marginTop: '8px', 
              marginBottom: '12px', 
              padding: '10px', 
              background: darkMode ? 'rgba(139,92,246,0.12)' : '#f3e8ff', 
              borderRadius: '12px', 
              fontSize: isMobile ? '9px' : '10px' 
            }}>
              <div style={{ 
                fontWeight: 'bold', 
                color: darkMode ? '#a78bfa' : '#7c3aed', 
                marginBottom: '4px' 
              }}>
                {t('promo_used')}
              </div>
              {order.items?.filter(i => i.is_free).map((item, idx) => (
                <div key={idx} style={{ marginLeft: '8px', color: textColor }}>
                  • {item.name.replace(' (FREE)', '').replace(' 🎁 (FREE)', '')} - <span className="free-tag">{t('free')}</span>
                </div>
              ))}
              {order.items?.filter(i => i.is_promo_item && i.price === 0 && !i.is_free).map((item, idx) => (
                <div key={idx} style={{ marginLeft: '8px', color: textColor }}>
                  • {item.promo_name || t('promo_bundle')} ({t('item')} dalam promosi)
                </div>
              ))}
              {order.items?.filter(i => i.is_promo_item && i.price > 0).map((item, idx) => (
                <div key={idx} style={{ marginLeft: '8px', color: textColor }}>
                  • {item.promo_name || t('promo_bundle')} - RM {item.price?.toFixed(2)}
                </div>
              ))}
            </div>
          )}
          
          {/* Totals */}
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? '10px' : '11px', marginBottom: '4px' }}>
              <span style={{ color: textMuted }}>{t('subtotal')}:</span>
              <span style={{ color: textColor }}>RM {subtotal.toFixed(2)}</span>
            </div>
            {serviceCharge > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? '10px' : '11px', marginBottom: '4px' }}>
                <span style={{ color: textMuted }}>{t('service_charge')}:</span>
                <span style={{ color: textColor }}>RM {serviceCharge.toFixed(2)}</span>
              </div>
            )}
            {tax > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? '10px' : '11px', marginBottom: '4px' }}>
                <span style={{ color: textMuted }}>{t('tax')}:</span>
                <span style={{ color: textColor }}>RM {tax.toFixed(2)}</span>
              </div>
            )}
            <div className="divider" style={{ borderTop: `1px dashed ${borderColor}`, margin: '10px 0' }}></div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: isMobile ? '15px' : '16px', 
              fontWeight: 'bold', 
              marginBottom: '8px' 
            }}>
              <span style={{ color: textColor }}>{t('total')}:</span>
              <span style={{ color: '#22c55e' }}>RM {grandTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? '10px' : '11px' }}>
              <span style={{ color: textMuted }}>{t('payment_method')}:</span>
              <span style={{ color: textColor, fontWeight: 'bold' }}>{getPaymentMethodText()}</span>
            </div>
          </div>
          
          {/* Tracking Section */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '16px', 
            paddingTop: '12px', 
            borderTop: `1px dashed ${borderColor}` 
          }}>
            <p style={{ fontSize: isMobile ? '9px' : '10px', color: textMuted, marginBottom: '6px' }}>
              {t('track_order')} 
              <a 
                href={`${window.location.origin}/track?order=${order.order_number}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  color: '#3b82f6', 
                  textDecoration: 'none', 
                  marginLeft: '4px', 
                  fontWeight: 'bold' 
                }}
              >
                {t('click_here')}
              </a>
            </p>
            <p style={{ fontSize: isMobile ? '7px' : '8px', color: textMuted }}>
              {t('or_enter')} {window.location.origin}/track
            </p>
          </div>
          
          {/* Footer */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '14px', 
            borderTop: `1px dashed ${borderColor}`, 
            paddingTop: '12px', 
            fontSize: isMobile ? '9px' : '10px' 
          }}>
            <p style={{ margin: '4px 0', color: textColor, fontWeight: 'bold' }}>
              {t('thank_you')}
            </p>
            <p style={{ margin: '4px 0', fontSize: isMobile ? '14px' : '16px', color: '#f59e0b', letterSpacing: '4px' }}>
              ⭐ ⭐ ⭐ ⭐ ⭐
            </p>
            <p style={{ margin: '4px 0', fontSize: isMobile ? '7px' : '8px', color: textMuted }}>
              {t('receipt_footer')}
            </p>
          </div>
        </div>
        
        {/* ===== ACTION BUTTONS ===== */}
        <div style={{ 
          padding: isMobile ? '12px 16px' : '16px 20px', 
          borderTop: `1px solid ${borderColor}`, 
          display: 'flex', 
          gap: '10px', 
          background: modalBg, 
          borderRadius: '0 0 28px 28px', 
          flexWrap: 'wrap',
          flexShrink: 0
        }}>
          <button 
            id="receipt-print-btn"
            onClick={printReceipt} 
            style={{ 
              flex: 1, 
              minWidth: isMobile ? '60px' : '80px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
              color: 'white', 
              padding: isMobile ? '10px' : '12px', 
              border: 'none', 
              borderRadius: '40px', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              transition: 'all 0.2s',
              fontSize: isMobile ? '12px' : '13px'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            🖨️ {t('btn_print')}
          </button>
          
          <button 
            onClick={downloadAsPDF} 
            style={{ 
              flex: 1, 
              minWidth: isMobile ? '60px' : '80px',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)', 
              color: 'white', 
              padding: isMobile ? '10px' : '12px', 
              border: 'none', 
              borderRadius: '40px', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              transition: 'all 0.2s',
              fontSize: isMobile ? '12px' : '13px'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            📄 {t('btn_pdf')}
          </button>
          
          <button 
            onClick={onClose} 
            style={{ 
              flex: 1, 
              minWidth: isMobile ? '60px' : '80px',
              background: darkMode ? '#475569' : '#64748b', 
              color: 'white', 
              padding: isMobile ? '10px' : '12px', 
              border: 'none', 
              borderRadius: '40px', 
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.2s',
              fontSize: isMobile ? '12px' : '13px'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            ❌ {t('close')}
          </button>
        </div>
      </div>

      {/* ===== STYLES ===== */}
      <style>
        {`
          @keyframes fadeIn { 
            from { opacity: 0; } 
            to { opacity: 1; } 
          }
          
          @keyframes popIn { 
            0% { opacity: 0; transform: scale(0.92) translateY(10px); } 
            100% { opacity: 1; transform: scale(1) translateY(0); } 
          }
          
          button { 
            transition: all 0.2s ease; 
          }
          
          button:hover:not(:disabled) { 
            opacity: 0.85; 
          }
          
          ::-webkit-scrollbar { 
            width: 4px; 
          }
          
          ::-webkit-scrollbar-track { 
            background: ${darkMode ? '#1a1a2e' : '#e2e8f0'}; 
            border-radius: 10px; 
          }
          
          ::-webkit-scrollbar-thumb { 
            background: ${darkMode ? '#3d3d5c' : '#94a3b8'}; 
            border-radius: 10px; 
          }
        `}
      </style>
    </div>
  )
}

export default ReceiptModal