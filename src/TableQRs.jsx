import { useState, useEffect } from 'react'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'
import Sidebar from './components/Sidebar'
import QRCode from 'qrcode'
import { supabase } from './lib/supabase'

function TableQRs() {
  const { darkMode } = useTheme()
  const { language } = useLanguage()
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [selectedTables, setSelectedTables] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [printSize, setPrintSize] = useState('large')
  const [qrDataUrls, setQrDataUrls] = useState({})
  const [isMobile, setIsMobile] = useState(false)
  
  // Custom text settings
  const [qrTitle, setQrTitle] = useState('🍽️ Restoran Kita')
  const [qrInstruction, setQrInstruction] = useState('📱 Imbas QR untuk menu digital')
  const [showUrl, setShowUrl] = useState(false)
  const [footerText, setFooterText] = useState('Scan untuk order')
  const [restaurantName, setRestaurantName] = useState('Restoran Kita')
  
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  // ============================================================
  // COMPLETE TRANSLATIONS
  // ============================================================
  const translations = {
    // Header
    qr_title: { en: '📱 Print Table QR Codes', ms: '📱 Cetak QR Meja' },
    qr_subtitle: { en: 'Select tables and print QR codes for digital menu', ms: 'Pilih meja dan cetak QR code untuk menu digital' },
    
    // Buttons
    print_qr: { en: '🖨️ Print QR', ms: '🖨️ Cetak QR' },
    select_all: { en: '✓ Select All', ms: '✓ Pilih Semua' },
    deselect_all: { en: '✖ Deselect All', ms: '✖ Nyahpilih Semua' },
    
    // Settings
    edit_text: { en: '✏️ Edit Text on QR', ms: '✏️ Edit Teks pada QR' },
    restaurant_title: { en: 'Restaurant Title', ms: 'Tajuk Restoran' },
    instruction_text: { en: 'Instruction Text', ms: 'Teks Arahan' },
    footer_text: { en: 'Footer Text', ms: 'Teks Footer' },
    show_url: { en: 'Show URL:', ms: 'Tunjukkan URL:' },
    yes_show_link: { en: 'Yes, show link', ms: 'Ya, tunjukkan link' },
    
    // Print settings
    print_settings: { en: '⚙️ Print Settings', ms: '⚙️ Tetapan Cetakan' },
    qr_size: { en: 'QR Size:', ms: 'Saiz QR:' },
    small: { en: 'Small (150px)', ms: 'Kecil (150px)' },
    medium: { en: 'Medium (200px)', ms: 'Sederhana (200px)' },
    large: { en: 'Large (280px)', ms: 'Besar (280px)' },
    layout: { en: 'Layout:', ms: 'Layout:' },
    layout_desc: { en: '1 page = 2 tables (4 QR per page)', ms: '1 page = 2 meja (4 QR setiap page)' },
    
    // Table selection
    select_tables: { en: '🪑 Select Tables to Print', ms: '🪑 Pilih Meja untuk Dicetak' },
    table: { en: 'Table', ms: 'Meja' },
    
    // Preview
    print_preview: { en: '📄 Print Preview', ms: '📄 Pratonton Cetakan' },
    page: { en: 'Page', ms: 'Muka Surat' },
    of: { en: 'of', ms: '/' },
    loading_qr: { en: 'Loading...', ms: 'Memuatkan...' },
    select_tables_preview: { en: 'Select tables to preview QR codes', ms: 'Pilih meja untuk pratonton QR code' },
    
    // Messages
    no_tables: { en: 'No tables available. Please add tables first.', ms: 'Tiada meja. Sila tambah meja terlebih dahulu.' },
    print_count: { en: 'tables →', ms: 'meja →' },
    pages: { en: 'pages', ms: 'muka surat' },
    scan_to_order: { en: 'Scan to order', ms: 'Scan untuk pesan' },
  }

  const t = (key) => {
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
  const bgColor = darkMode ? '#0a0a16' : '#f1f5f9'
  const cardBg = darkMode ? 'rgba(20, 20, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  const textColor = darkMode ? '#e8edf5' : '#1e293b'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.5)'
  const inputBg = darkMode ? '#1a1a2e' : '#ffffff'
  const inputBorder = darkMode ? '#3d3d5c' : '#cbd5e1'
  const inputText = darkMode ? '#e8edf5' : '#1e293b'
  const secondaryBg = darkMode ? 'rgba(30, 30, 50, 0.6)' : 'rgba(248, 250, 252, 0.8)'
  
  const glassEffect = {
    background: cardBg,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${borderColor}`,
    boxShadow: darkMode 
      ? '0 8px 40px rgba(0,0,0,0.5)' 
      : '0 8px 40px rgba(0,0,0,0.06)'
  }

  const inputStyle = {
    width: '100%',
    padding: isMobile ? '8px 12px' : '10px 14px',
    borderRadius: '12px',
    border: `1px solid ${inputBorder}`,
    background: inputBg,
    color: inputText,
    fontSize: isMobile ? '13px' : '14px',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box'
  }

  const labelStyle = {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '6px',
    fontSize: isMobile ? '11px' : '13px',
    color: textColor
  }

  // ============================================================
  // LOAD DATA
  // ============================================================
  useEffect(() => {
    loadTables()
    loadRestaurantName()
  }, [])

  async function loadRestaurantName() {
    try {
      const { data } = await supabase.from('settings').select('value').eq('key', 'restaurant_name').single()
      if (data && data.value) {
        setRestaurantName(data.value)
        setQrTitle(`🍽️ ${data.value}`)
        setFooterText(`${data.value} • ${t('scan_to_order')}`)
      }
    } catch (err) {
      console.error('Error loading restaurant name:', err)
    }
  }

  // ============================================================
  // QR CODE GENERATION
  // ============================================================
  useEffect(() => {
    const generateQRCodes = async () => {
      const newQrDataUrls = {}
      for (const table of tables) {
        if (selectedTables.includes(table.id)) {
          const url = `${baseUrl}/menu?table=${table.table_number}`
          try {
            const qrDataUrl = await QRCode.toDataURL(url, {
              width: printSize === 'large' ? 280 : printSize === 'medium' ? 200 : 150,
              margin: 2,
              color: { dark: '#1a1a2e', light: '#ffffff' }
            })
            newQrDataUrls[table.table_number] = qrDataUrl
          } catch (err) {
            console.error('QR generation error:', err)
          }
        }
      }
      setQrDataUrls(newQrDataUrls)
    }
    generateQRCodes()
  }, [selectedTables, tables, printSize, baseUrl])

  // ============================================================
  // LOAD TABLES
  // ============================================================
  async function loadTables() {
    setLoading(true)
    const { data, error } = await supabase.from('tables').select('*').order('table_number', { ascending: true })
    if (error) {
      console.error('Error loading tables:', error)
    } else {
      setTables(data || [])
      if (data && data.length > 0) {
        setSelectedTables(data.map(t => t.id))
        setSelectAll(true)
      }
    }
    setLoading(false)
  }

  // ============================================================
  // SELECTION FUNCTIONS
  // ============================================================
  const toggleTable = (tableId) => {
    if (selectedTables.includes(tableId)) {
      setSelectedTables(selectedTables.filter(id => id !== tableId))
      setSelectAll(false)
    } else {
      setSelectedTables([...selectedTables, tableId])
      if (selectedTables.length + 1 === tables.length) {
        setSelectAll(true)
      }
    }
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedTables([])
      setSelectAll(false)
    } else {
      setSelectedTables(tables.map(t => t.id))
      setSelectAll(true)
    }
  }

  const getSelectedTableNumbers = () => {
    return tables.filter(t => selectedTables.includes(t.id)).sort((a, b) => a.table_number - b.table_number)
  }

  // ============================================================
  // PRINT FUNCTION
  // ============================================================
  const handlePrint = () => {
    const selectedTablesList = getSelectedTableNumbers()
    const printWindow = window.open('', '_blank')
    const sizeValue = printSize === 'large' ? 280 : printSize === 'medium' ? 200 : 150
    
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Codes - ${restaurantName}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: white; }
          .page { page-break-after: always; margin-bottom: 20px; }
          .page:last-child { page-break-after: auto; }
          .qr-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; margin-bottom: 40px; }
          .qr-item { text-align: center; border: 2px solid #e2e8f0; border-radius: 20px; padding: 25px 20px; background: white; page-break-inside: avoid; break-inside: avoid; }
          .qr-item h2 { font-size: 20px; margin-bottom: 15px; color: #1e293b; }
          .qr-item h3 { font-size: 22px; margin-bottom: 10px; color: #2563eb; }
          .qr-code { margin: 15px 0; display: flex; justify-content: center; }
          .qr-code img { width: ${sizeValue}px; height: ${sizeValue}px; max-width: ${sizeValue}px; max-height: ${sizeValue}px; }
          .qr-instruction { margin-top: 15px; font-size: 13px; color: #64748b; }
          .qr-url { margin-top: 8px; font-size: 10px; color: #94a3b8; word-break: break-all; }
          .footer-text { margin-top: 15px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          @media print {
            body { padding: 0; margin: 0; }
            .qr-item { break-inside: avoid; page-break-inside: avoid; border: 1px solid #e2e8f0; }
          }
        </style>
      </head>
      <body>
    `

    const tablesPerPage = 2
    for (let i = 0; i < selectedTablesList.length; i += tablesPerPage) {
      const pageTables = selectedTablesList.slice(i, i + tablesPerPage)
      htmlContent += `<div class="page"><div class="qr-grid">`
      
      for (const table of pageTables) {
        const qrDataUrl = qrDataUrls[table.table_number]
        const qrImgTag = qrDataUrl 
          ? `<img src="${qrDataUrl}" alt="QR Code Meja ${table.table_number}" />` 
          : `<div style="width:${sizeValue}px;height:${sizeValue}px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;margin:0 auto">QR Error</div>`
        
        htmlContent += `
          <div class="qr-item">
            <h2>${qrTitle.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h2>
            <h3>${t('table')} ${table.table_number}</h3>
            <div class="qr-code">${qrImgTag}</div>
            <div class="qr-instruction">${qrInstruction.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            ${showUrl ? `<div class="qr-url">${baseUrl}/menu?table=${table.table_number}</div>` : ''}
            <div class="footer-text">${footerText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          </div>
        `
      }
      
      if (pageTables.length === 1) {
        htmlContent += `<div style="visibility:hidden"></div>`
      }
      
      htmlContent += `</div></div>`
    }

    htmlContent += `
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
    
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  // ============================================================
  // HELPERS
  // ============================================================
  const getSizeValue = () => {
    switch(printSize) {
      case 'large': return 280
      case 'medium': return 200
      case 'small': return 150
      default: return 250
    }
  }

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <Sidebar>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          background: bgColor 
        }}>
          <div className="spinner"></div>
        </div>
      </Sidebar>
    )
  }

  // ============================================================
  // RENDER
  // ============================================================
  const selectedTablesList = getSelectedTableNumbers()
  const totalPages = Math.ceil(selectedTablesList.length / 2)

  return (
    <Sidebar>
      <div style={{ 
        padding: isMobile ? '12px' : '24px', 
        maxWidth: '1200px', 
        margin: '0 auto', 
        background: bgColor, 
        minHeight: '100vh' 
      }}>
        
        {/* ===== HEADER ===== */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '10px', 
            flexWrap: 'wrap' 
          }}>
            <div style={{
              width: isMobile ? '48px' : '56px',
              height: isMobile ? '48px' : '56px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '24px' : '28px',
              boxShadow: '0 4px 16px rgba(37,99,235,0.3)'
            }}>
              📱
            </div>
            <div>
              <h1 style={{ 
                margin: 0, 
                fontSize: isMobile ? '22px' : '28px', 
                fontWeight: 'bold', 
                color: textColor 
              }}>
                {t('qr_title')}
              </h1>
              <p style={{ 
                color: textMuted, 
                marginTop: '2px', 
                fontSize: isMobile ? '11px' : '14px' 
              }}>
                {t('qr_subtitle')}
              </p>
            </div>
          </div>
          <div style={{ 
            height: '3px', 
            width: '60px', 
            background: 'linear-gradient(135deg, #2563eb, #8b5cf6)', 
            borderRadius: '3px', 
            marginTop: '6px' 
          }} />
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
            padding: '10px 16px', 
            borderRadius: '40px', 
            marginBottom: '20px', 
            textAlign: 'center',
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: '500',
            border: `1px solid ${message.includes('✅') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`
          }}>
            {message}
          </div>
        )}

        {/* ===== CUSTOM TEXT SETTINGS ===== */}
        <div style={{ 
          ...glassEffect, 
          borderRadius: '20px', 
          padding: isMobile ? '16px' : '20px', 
          marginBottom: '20px' 
        }}>
          <h3 style={{ 
            marginBottom: '12px', 
            fontSize: isMobile ? '14px' : '16px', 
            fontWeight: 'bold', 
            color: textColor 
          }}>
            {t('edit_text')}
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '12px' 
          }}>
            <div>
              <label style={labelStyle}>{t('restaurant_title')}</label>
              <input 
                type="text" 
                value={qrTitle} 
                onChange={(e) => setQrTitle(e.target.value)} 
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)' }}
                onBlur={e => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <label style={labelStyle}>{t('instruction_text')}</label>
              <input 
                type="text" 
                value={qrInstruction} 
                onChange={(e) => setQrInstruction(e.target.value)} 
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)' }}
                onBlur={e => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <label style={labelStyle}>{t('footer_text')}</label>
              <input 
                type="text" 
                value={footerText} 
                onChange={(e) => setFooterText(e.target.value)} 
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)' }}
                onBlur={e => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <label style={{ 
                fontWeight: 'bold', 
                fontSize: isMobile ? '11px' : '13px', 
                color: textColor 
              }}>
                {t('show_url')}
              </label>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                cursor: 'pointer' 
              }}>
                <input 
                  type="checkbox" 
                  checked={showUrl} 
                  onChange={(e) => setShowUrl(e.target.checked)} 
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ color: textColor, fontSize: isMobile ? '12px' : '13px' }}>
                  {t('yes_show_link')}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* ===== PRINT SETTINGS ===== */}
        <div style={{ 
          ...glassEffect, 
          borderRadius: '20px', 
          padding: isMobile ? '16px' : '20px', 
          marginBottom: '20px' 
        }}>
          <h3 style={{ 
            marginBottom: '12px', 
            fontSize: isMobile ? '14px' : '16px', 
            fontWeight: 'bold', 
            color: textColor 
          }}>
            {t('print_settings')}
          </h3>
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            flexWrap: 'wrap', 
            alignItems: 'center' 
          }}>
            <div>
              <label style={{ 
                fontWeight: 'bold', 
                marginRight: '10px', 
                fontSize: isMobile ? '12px' : '13px', 
                color: textColor 
              }}>
                {t('qr_size')}
              </label>
              <select 
                value={printSize} 
                onChange={(e) => setPrintSize(e.target.value)} 
                style={{ 
                  padding: isMobile ? '6px 12px' : '8px 16px', 
                  borderRadius: '30px', 
                  border: `1px solid ${inputBorder}`, 
                  background: inputBg, 
                  color: inputText,
                  fontSize: isMobile ? '12px' : '13px',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)' }}
                onBlur={e => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none' }}
              >
                <option value="small">{t('small')}</option>
                <option value="medium">{t('medium')}</option>
                <option value="large">{t('large')}</option>
              </select>
            </div>
            <div>
              <label style={{ 
                fontWeight: 'bold', 
                marginRight: '10px', 
                fontSize: isMobile ? '12px' : '13px', 
                color: textColor 
              }}>
                {t('layout')}
              </label>
              <span style={{ 
                background: secondaryBg, 
                padding: isMobile ? '4px 10px' : '6px 12px', 
                borderRadius: '20px', 
                fontSize: isMobile ? '11px' : '13px', 
                color: textMuted 
              }}>
                {t('layout_desc')}
              </span>
            </div>
          </div>
        </div>

        {/* ===== TABLE SELECTION ===== */}
        <div style={{ 
          ...glassEffect, 
          borderRadius: '20px', 
          padding: isMobile ? '16px' : '20px', 
          marginBottom: '20px' 
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '16px', 
            flexWrap: 'wrap', 
            gap: '10px' 
          }}>
            <h3 style={{ 
              fontSize: isMobile ? '14px' : '16px', 
              fontWeight: 'bold', 
              color: textColor 
            }}>
              {t('select_tables')}
            </h3>
            <button 
              onClick={toggleSelectAll}
              style={{ 
                background: selectAll ? '#ef4444' : '#22c55e', 
                color: 'white', 
                padding: isMobile ? '6px 16px' : '8px 20px', 
                border: 'none', 
                borderRadius: '30px', 
                cursor: 'pointer', 
                fontWeight: 'bold', 
                fontSize: isMobile ? '12px' : '13px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {selectAll ? t('deselect_all') : t('select_all')}
            </button>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(100px, 1fr))', 
            gap: '10px' 
          }}>
            {tables.length === 0 ? (
              <p style={{ 
                color: textMuted, 
                gridColumn: '1 / -1', 
                textAlign: 'center', 
                padding: '20px' 
              }}>
                {t('no_tables')}
              </p>
            ) : (
              tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => toggleTable(table.id)}
                  style={{
                    padding: isMobile ? '8px' : '12px',
                    background: selectedTables.includes(table.id) 
                      ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' 
                      : secondaryBg,
                    color: selectedTables.includes(table.id) ? 'white' : textColor,
                    border: selectedTables.includes(table.id) 
                      ? 'none' 
                      : `1px solid ${borderColor}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '12px' : '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    if (!selectedTables.includes(table.id)) {
                      e.currentTarget.style.transform = 'scale(0.97)'
                      e.currentTarget.style.borderColor = '#3b82f6'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!selectedTables.includes(table.id)) {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.borderColor = borderColor
                    }
                  }}
                >
                  🪑 {t('table')} {table.table_number}
                </button>
              ))
            )}
          </div>
        </div>

        {/* ===== PRINT PREVIEW & BUTTON ===== */}
        <div style={{ 
          ...glassEffect, 
          borderRadius: '20px', 
          padding: isMobile ? '16px' : '20px' 
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '16px', 
            flexWrap: 'wrap', 
            gap: '10px' 
          }}>
            <h3 style={{ 
              fontSize: isMobile ? '14px' : '16px', 
              fontWeight: 'bold', 
              color: textColor 
            }}>
              {t('print_preview')}
            </h3>
            <button 
              onClick={handlePrint}
              disabled={selectedTablesList.length === 0}
              style={{
                background: selectedTablesList.length === 0 
                  ? (darkMode ? '#2a2a3e' : '#cbd5e1')
                  : 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: selectedTablesList.length === 0 
                  ? (darkMode ? '#666' : '#999')
                  : 'white',
                padding: isMobile ? '8px 16px' : '12px 24px',
                border: 'none',
                borderRadius: '40px',
                cursor: selectedTablesList.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: isMobile ? '12px' : '14px',
                transition: 'all 0.2s',
                opacity: selectedTablesList.length === 0 ? 0.6 : 1
              }}
            >
              🖨️ {t('print_qr')} ({selectedTablesList.length} {t('table')} → {totalPages} {t('pages')})
            </button>
          </div>

          {/* ===== PRINT PREVIEW AREA ===== */}
          <div style={{ 
            background: secondaryBg, 
            borderRadius: '16px', 
            padding: isMobile ? '12px' : '24px', 
            maxHeight: '500px', 
            overflowY: 'auto' 
          }}>
            {selectedTablesList.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: isMobile ? '30px' : '60px', 
                color: textMuted 
              }}>
                <span style={{ fontSize: isMobile ? '36px' : '48px' }}>🪑</span>
                <p style={{ marginTop: '12px', fontSize: isMobile ? '12px' : '14px' }}>
                  {t('select_tables_preview')}
                </p>
              </div>
            ) : (
              <div>
                {(() => {
                  const tablesPerPage = 2
                  const pages = []
                  for (let i = 0; i < selectedTablesList.length; i += tablesPerPage) {
                    pages.push(selectedTablesList.slice(i, i + tablesPerPage))
                  }
                  
                  const sizeValue = getSizeValue()
                  
                  return pages.map((pageTables, pageIndex) => (
                    <div key={pageIndex} style={{ 
                      marginBottom: '24px', 
                      borderBottom: pageIndex !== pages.length - 1 ? `2px dashed ${borderColor}` : 'none', 
                      paddingBottom: '20px' 
                    }}>
                      <div style={{ 
                        fontSize: isMobile ? '10px' : '12px', 
                        color: textMuted, 
                        marginBottom: '8px' 
                      }}>
                        {t('page')} {pageIndex + 1} / {pages.length}
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
                        gap: isMobile ? '16px' : '24px' 
                      }}>
                        {pageTables.map(table => {
                          const qrDataUrl = qrDataUrls[table.table_number]
                          return (
                            <div key={`${table.table_number}`} style={{ 
                              textAlign: 'center', 
                              border: `1px solid ${borderColor}`, 
                              borderRadius: '14px', 
                              padding: isMobile ? '12px' : '20px', 
                              background: cardBg 
                            }}>
                              <h3 style={{ 
                                fontSize: isMobile ? '13px' : '16px', 
                                marginBottom: '6px', 
                                color: textColor 
                              }}>
                                {qrTitle}
                              </h3>
                              <h4 style={{ 
                                fontSize: isMobile ? '16px' : '20px', 
                                marginBottom: '10px', 
                                color: '#2563eb' 
                              }}>
                                {t('table')} {table.table_number}
                              </h4>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                marginBottom: '10px' 
                              }}>
                                {qrDataUrl ? (
                                  <img 
                                    src={qrDataUrl} 
                                    alt={`QR ${t('table')} ${table.table_number}`} 
                                    style={{ 
                                      width: Math.min(sizeValue, 200), 
                                      height: Math.min(sizeValue, 200),
                                      borderRadius: '8px'
                                    }} 
                                  />
                                ) : (
                                  <div style={{ 
                                    width: Math.min(sizeValue, 200), 
                                    height: Math.min(sizeValue, 200), 
                                    background: secondaryBg, 
                                    borderRadius: '12px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    color: textMuted 
                                  }}>
                                    {t('loading_qr')}
                                  </div>
                                )}
                              </div>
                              <div style={{ 
                                fontSize: isMobile ? '10px' : '12px', 
                                color: textMuted 
                              }}>
                                {qrInstruction}
                              </div>
                              {showUrl && (
                                <div style={{ 
                                  fontSize: isMobile ? '8px' : '10px', 
                                  color: textMuted, 
                                  marginTop: '4px' 
                                }}>
                                  {baseUrl}/menu?table={table.table_number}
                                </div>
                              )}
                              <div style={{ 
                                fontSize: isMobile ? '8px' : '10px', 
                                color: textMuted, 
                                marginTop: '8px', 
                                borderTop: `1px solid ${borderColor}`, 
                                paddingTop: '6px' 
                              }}>
                                {footerText}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))
                })}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================== */}
        {/* STYLES */}
        {/* ========================================================== */}
        <style>
          {`
            .spinner { 
              width: 40px; 
              height: 40px; 
              border: 3px solid rgba(59,130,246,0.15); 
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
            
            ::-webkit-scrollbar { 
              width: 6px; 
            }
            
            ::-webkit-scrollbar-track { 
              background: ${darkMode ? '#1a1a2e' : '#e2e8f0'}; 
              border-radius: 10px; 
            }
            
            ::-webkit-scrollbar-thumb { 
              background: ${darkMode ? '#3d3d5c' : '#94a3b8'}; 
              border-radius: 10px; 
            }
            
            button, input, select { 
              transition: all 0.2s ease; 
            }
            
            button:hover:not(:disabled) { 
              opacity: 0.88; 
            }
            
            button:disabled {
              cursor: not-allowed;
            }
            
            input:focus, select:focus { 
              outline: none; 
            }
          `}
        </style>
      </div>
    </Sidebar>
  )
}

export default TableQRs