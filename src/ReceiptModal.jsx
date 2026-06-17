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

  // ========== TRANSLATIONS ==========
  const translations = {
    thank_you: { en: 'Thank you for dining with us!', ms: 'Terima kasih kerana makan di sini!' },
    order_number: { en: 'Order Number', ms: 'Nombor Pesanan' },
    type: { en: 'Type', ms: 'Jenis' },
    customer_name: { en: 'Customer', ms: 'Pelanggan' },
    phone: { en: 'Phone', ms: 'Telefon' },
    date: { en: 'Date', ms: 'Tarikh' },
    cashier: { en: 'Cashier', ms: 'Kru' },
    item: { en: 'Item', ms: 'Item' },
    price: { en: 'Price', ms: 'Harga' },
    subtotal: { en: 'Subtotal', ms: 'Subtotal' },
    service_charge: { en: 'Service Charge', ms: 'Caj Perkhidmatan' },
    tax: { en: 'Tax', ms: 'Cukai' },
    total: { en: 'Total', ms: 'Jumlah' },
    payment_method: { en: 'Payment Method', ms: 'Kaedah Bayaran' },
    btn_print: { en: '🖨️ Print', ms: '🖨️ Cetak' },
    close: { en: 'Close', ms: 'Tutup' },
    take_away: { en: 'Take Away', ms: 'Bungkus' },
    table_number: { en: 'Table', ms: 'Meja' },
    walk_in: { en: 'Walk-in', ms: 'Walk-in' },
    cash: { en: 'Cash', ms: 'Tunai' },
    tng: { en: 'TnG', ms: 'TnG' },
    bank: { en: 'Bank', ms: 'Bank' },
    receipt_footer: { en: 'Thank you and see you again!', ms: 'Terima kasih dan jumpa lagi!' },
    hot: { en: 'Hot', ms: 'Panas' },
    cold: { en: 'Cold', ms: 'Sejuk' },
    takeaway_drink: { en: 'Takeaway', ms: 'Bungkus' },
    free: { en: 'FREE', ms: 'PERCUMA' },
    promo_used: { en: '🎁 Promotions Used', ms: '🎁 Promosi Digunakan' },
    promo_bundle: { en: 'Bundle Deal', ms: 'Tawaran Bundle' },
    track_order: { en: '🔍 Track your order:', ms: '🔍 Jejak pesanan anda:' },
    click_here: { en: 'click here', ms: 'klik di sini' },
    or_enter: { en: 'Or enter order number at', ms: 'Atau masukkan nombor pesanan di' },
    receipt_title: { en: 'Receipt', ms: 'Resit' },
    qty: { en: 'Qty', ms: 'Bil' }
  }

  const t = (key) => {
    if (!translations[key]) return key
    return language === 'en' ? translations[key].en : translations[key].ms
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

  // Dark mode colors
  const modalBg = darkMode ? 'rgba(25, 25, 45, 0.98)' : 'rgba(255, 255, 255, 0.98)'
  const receiptBg = darkMode ? 'rgba(25, 25, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  const textColor = darkMode ? '#e8edf5' : '#0f172a'
  const textMuted = darkMode ? '#9aa8b9' : '#64748b'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.4)' : 'rgba(203, 213, 225, 0.6)'
  
  const glassEffect = {
    background: modalBg,
    backdropFilter: 'blur(12px)',
    border: `1px solid ${borderColor}`,
    boxShadow: darkMode 
      ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
      : '0 8px 32px rgba(0, 0, 0, 0.08)'
  }

  useEffect(() => {
    loadRestaurantInfo()
    loadCashierInfo()
  }, [])

  // Auto print when modal opens if setting is enabled
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

  const printReceipt = () => {
    const printContent = receiptRef.current.innerHTML
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html><head><title>Receipt ${restaurantName}</title>
      <style>
        body{font-family:'Courier New',monospace;margin:0;padding:20px;background:white;color:black}
        .receipt{max-width:300px;margin:0 auto;font-size:12px}
        .header{text-align:center;border-bottom:1px dashed #000;padding-bottom:10px;margin-bottom:10px}
        .header h1{margin:0;font-size:18px}
        .logo{max-width:60px;margin-bottom:5px}
        .divider{border-top:1px dashed #000;margin:10px 0}
        .items{width:100%;margin:10px 0}
        .items th,.items td{text-align:left;padding:3px 0}
        .items th:last-child,.items td:last-child{text-align:right}
        .promo-box{background:#f3e8ff;padding:8px;border-radius:8px;margin:8px 0;font-size:10px}
        .footer{text-align:center;margin-top:20px;border-top:1px dashed #000;padding-top:10px;font-size:10px}
        @media print{body{margin:0;padding:0}}
      </style>
      </head><body><div class="receipt">${printContent}</div><script>window.print();window.close();<\/script></body></html>
    `)
    printWindow.document.close()
  }

  const downloadAsPDF = () => {
    const printContent = receiptRef.current.innerHTML
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html><head><title>Receipt ${restaurantName}</title>
      <style>
        body{font-family:'Courier New',monospace;margin:0;padding:20px;background:white;color:black}
        .receipt{max-width:300px;margin:0 auto;font-size:12px}
        .header{text-align:center;border-bottom:1px dashed #000;padding-bottom:10px;margin-bottom:10px}
        .header h1{margin:0;font-size:18px}
        .logo{max-width:60px;margin-bottom:5px}
        .divider{border-top:1px dashed #000;margin:10px 0}
        .items{width:100%;margin:10px 0}
        .items th,.items td{text-align:left;padding:3px 0}
        .items th:last-child,.items td:last-child{text-align:right}
        .promo-box{background:#f3e8ff;padding:8px;border-radius:8px;margin:8px 0;font-size:10px}
        .footer{text-align:center;margin-top:20px;border-top:1px dashed #000;padding-top:10px;font-size:10px}
      </style>
      </head><body><div class="receipt">${printContent}</div><script>window.print();<\/script></body></html>
    `)
    printWindow.document.close()
    toast.success('PDF ready to save!')
  }

  const getPaymentMethodText = () => {
    if (order.payment_method === 'cash') return `💵 ${t('cash')}`
    if (order.payment_method === 'tng') return `📱 ${t('tng')}`
    if (order.payment_method === 'bank') return `🏦 ${t('bank')}`
    return '-'
  }

  const hasPromoItems = order.items?.some(item => item.is_free || item.is_promo_item)
  const subtotal = order.subtotal || order.total || 0
  const serviceCharge = order.service_charge || 0
  const tax = order.tax || 0
  const grandTotal = order.grand_total || (subtotal + serviceCharge + tax)

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', 
      display: 'flex', justifyContent: 'center', alignItems: 'center', 
      zIndex: 2000, animation: 'fadeIn 0.2s ease' 
    }}>
      <div style={{ 
        ...glassEffect, 
        borderRadius: '28px', 
        maxWidth: '420px', 
        width: '90%', 
        maxHeight: '90vh', 
        overflowY: 'auto',
        animation: 'popIn 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)'
      }}>
        
        {/* Receipt Content */}
        <div ref={receiptRef} style={{ padding: '24px', background: receiptBg, color: textColor }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', borderBottom: `1px dashed ${borderColor}`, paddingBottom: '12px' }}>
            {restaurantLogo ? (
              <img src={restaurantLogo} alt={restaurantName} style={{ maxWidth: '60px', marginBottom: '5px', borderRadius: '12px' }} />
            ) : (
              <span style={{ fontSize: '40px' }}>🏪</span>
            )}
            <h2 style={{ margin: '8px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: textColor }}>{restaurantName}</h2>
            <p style={{ margin: '5px 0', fontSize: '10px', color: textMuted }}>📄 {t('receipt_title')}</p>
          </div>
          
          {/* Order Details */}
          <div style={{ marginBottom: '12px', fontSize: '11px', marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: textMuted }}>{t('order_number')}:</span>
              <span style={{ color: textColor, fontWeight: 'bold' }}>{order.order_number || `ORD-${order.id}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: textMuted }}>{t('type')}:</span>
              <span style={{ color: textColor, fontWeight: 'bold' }}>{getOrderTypeText()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: textMuted }}>{t('customer_name')}:</span>
              <span style={{ color: textColor, fontWeight: 'bold' }}>{order.customer_name || 'Walk-in'}</span>
            </div>
            {order.customer_phone && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: textMuted }}>{t('phone')}:</span>
                <span style={{ color: textColor, fontWeight: 'bold' }}>{order.customer_phone}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: textMuted }}>{t('date')}:</span>
              <span style={{ color: textColor, fontWeight: 'bold' }}>{formatDate(order.paid_at || order.created_at)}</span>
            </div>
            {cashierName && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', paddingTop: '6px', borderTop: `1px dashed ${borderColor}` }}>
                <span style={{ color: textMuted }}>{t('cashier')}:</span>
                <span style={{ color: textColor, fontWeight: 'bold' }}>{cashierName}</span>
              </div>
            )}
          </div>
          
          <div style={{ borderTop: `1px dashed ${borderColor}`, margin: '12px 0' }}></div>
          
          {/* Items Table */}
          <table style={{ width: '100%', margin: '12px 0', fontSize: '11px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                <th style={{ textAlign: 'left', padding: '6px', color: textMuted }}>{t('item')}</th>
                <th style={{ textAlign: 'center', padding: '6px', color: textMuted }}>{t('qty')}</th>
                <th style={{ textAlign: 'right', padding: '6px', color: textMuted }}>{t('price')}</th>
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
                  <tr key={idx} style={{ borderBottom: idx !== order.items.length - 1 ? `1px solid ${borderColor}` : 'none' }}>
                    <td style={{ textAlign: 'left', padding: '6px', color: textColor }}>
                      {item.name}
                      {optionLabel && (
                        <span style={{ 
                          background: item.option_type === 'Bungkus' ? '#8b5cf6' : 
                                     item.option_type === 'Panas' ? '#f97316' : '#06b6d4',
                          color: 'white',
                          padding: '1px 8px',
                          borderRadius: '12px',
                          fontSize: '8px',
                          marginLeft: '4px',
                          fontWeight: 'bold'
                        }}>
                          {optionLabel}
                        </span>
                      )}
                      {isFree && <span style={{ color: '#22c55e', fontSize: '9px', marginLeft: '4px', fontWeight: 'bold' }}>({t('free')})</span>}
                      {isPromo && !isFree && <span style={{ color: '#8b5cf6', fontSize: '9px', marginLeft: '4px' }}>(PROMO)</span>}
                      {item.option_name && !item.option_type && <span style={{ fontSize: '9px', color: '#f59e0b', marginLeft: '4px' }}>({item.option_name})</span>}
                    </td>
                    <td style={{ textAlign: 'center', padding: '6px', color: textColor }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '6px', color: isFree ? '#22c55e' : '#22c55e', fontWeight: isFree ? 'bold' : 'normal' }}>
                      {isFree ? 'FREE' : `RM ${(item.price * item.quantity).toFixed(2)}`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          
          <div style={{ borderTop: `1px dashed ${borderColor}`, margin: '12px 0' }}></div>
          
          {/* Promo Section */}
          {hasPromoItems && (
            <div style={{ marginTop: '8px', marginBottom: '12px', padding: '10px', background: '#f3e8ff', borderRadius: '12px', fontSize: '10px' }}>
              <div style={{ fontWeight: 'bold', color: '#7c3aed', marginBottom: '4px' }}>{t('promo_used')}</div>
              {order.items?.filter(i => i.is_free).map((item, idx) => (
                <div key={idx} style={{ marginLeft: '8px', color: '#1e293b' }}>
                  • {item.name.replace(' (FREE)', '').replace(' 🎁 (FREE)', '')} - {t('free')}
                </div>
              ))}
              {order.items?.filter(i => i.is_promo_item && i.price === 0 && !i.is_free).map((item, idx) => (
                <div key={idx} style={{ marginLeft: '8px', color: '#1e293b' }}>
                  • {item.promo_name || t('promo_bundle')} ({t('item')} dalam promosi)
                </div>
              ))}
              {order.items?.filter(i => i.is_promo_item && i.price > 0).map((item, idx) => (
                <div key={idx} style={{ marginLeft: '8px', color: '#1e293b' }}>
                  • {item.promo_name || t('promo_bundle')} - RM {item.price?.toFixed(2)}
                </div>
              ))}
            </div>
          )}
          
          {/* Totals */}
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
              <span style={{ color: textMuted }}>{t('subtotal')}:</span>
              <span style={{ color: textColor }}>RM {subtotal.toFixed(2)}</span>
            </div>
            {serviceCharge > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                <span style={{ color: textMuted }}>{t('service_charge')}:</span>
                <span style={{ color: textColor }}>RM {serviceCharge.toFixed(2)}</span>
              </div>
            )}
            {tax > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                <span style={{ color: textMuted }}>{t('tax')}:</span>
                <span style={{ color: textColor }}>RM {tax.toFixed(2)}</span>
              </div>
            )}
            <div style={{ borderTop: `1px dashed ${borderColor}`, margin: '12px 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
              <span style={{ color: textColor }}>{t('total')}:</span>
              <span style={{ color: '#22c55e' }}>RM {grandTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: textMuted }}>{t('payment_method')}:</span>
              <span style={{ color: textColor, fontWeight: 'bold' }}>{getPaymentMethodText()}</span>
            </div>
          </div>
          
          {/* Tracking Section */}
          <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '12px', borderTop: `1px dashed ${borderColor}` }}>
            <p style={{ fontSize: '10px', color: textMuted, marginBottom: '8px' }}>
              {t('track_order')} 
              <a 
                href={`${window.location.origin}/track?order=${order.order_number}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#3b82f6', textDecoration: 'none', marginLeft: '4px', fontWeight: 'bold' }}
              >
                {t('click_here')}
              </a>
            </p>
            <p style={{ fontSize: '8px', color: textMuted }}>
              {t('or_enter')} {window.location.origin}/track
            </p>
          </div>
          
          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '16px', borderTop: `1px dashed ${borderColor}`, paddingTop: '12px', fontSize: '10px' }}>
            <p style={{ margin: '5px 0', color: textColor, fontWeight: 'bold' }}>{t('thank_you')}</p>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#f59e0b' }}>⭐ ⭐ ⭐ ⭐ ⭐</p>
            <p style={{ margin: '5px 0', fontSize: '8px', color: textMuted }}>{t('receipt_footer')}</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${borderColor}`, display: 'flex', gap: '12px', background: modalBg, borderRadius: '0 0 28px 28px', flexWrap: 'wrap' }}>
          <button 
            id="receipt-print-btn"
            onClick={printReceipt} 
            style={{ 
              flex: 1, 
              minWidth: '80px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
              color: 'white', 
              padding: '12px', 
              border: 'none', 
              borderRadius: '40px', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              transition: 'all 0.2s',
              fontSize: '13px'
            }}
          >
            🖨️ {t('btn_print')}
          </button>
          <button 
            onClick={downloadAsPDF} 
            style={{ 
              flex: 1, 
              minWidth: '80px',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)', 
              color: 'white', 
              padding: '12px', 
              border: 'none', 
              borderRadius: '40px', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              transition: 'all 0.2s',
              fontSize: '13px'
            }}
          >
            📄 PDF
          </button>
          <button 
            onClick={onClose} 
            style={{ 
              flex: 1, 
              minWidth: '80px',
              background: '#64748b', 
              color: 'white', 
              padding: '12px', 
              border: 'none', 
              borderRadius: '40px', 
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.2s',
              fontSize: '13px'
            }}
          >
            ❌ {t('close')}
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes popIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
          button:hover { opacity: 0.85; transform: scale(0.98); }
        `}
      </style>
    </div>
  )
}

export default ReceiptModal