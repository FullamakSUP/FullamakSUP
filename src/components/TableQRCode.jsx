import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'

function TableQRCode({ 
  tableNumber, 
  size = 150,
  showLabel = true,
  showInstruction = true,
  label = null,
  instruction = null,
  className = '',
  style = {}
}) {
  const [qrUrl, setQrUrl] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const { darkMode } = useTheme()
  const { language } = useLanguage()

  // ============================================================
  // TRANSLATIONS
  // ============================================================
  const translations = {
    table: { en: 'Table', ms: 'Meja' },
    scan_to_order: { en: 'Scan to order', ms: 'Scan untuk pesan' },
    qr_error: { en: 'QR Error', ms: 'Ralat QR' },
  }

  const t = (key) => {
    if (!translations[key]) return key
    return language === 'en' ? translations[key].en : translations[key].ms
  }

  // ============================================================
  // GENERATE QR CODE
  // ============================================================
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    const menuUrl = `${window.location.origin}/menu?table=${tableNumber}`
    
    // QR Code options
    const qrOptions = {
      width: size,
      margin: 2,
      color: {
        dark: darkMode ? '#e8edf5' : '#1a1a2e',
        light: darkMode ? '#1a1a2e' : '#ffffff'
      },
      errorCorrectionLevel: 'H'
    }

    QRCode.toDataURL(menuUrl, qrOptions)
      .then((url) => {
        if (isMounted) {
          setQrUrl(url)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('QR generation error:', err)
        if (isMounted) {
          setError(err.message)
          setLoading(false)
        }
      })
    
    return () => { 
      isMounted = false 
    }
  }, [tableNumber, size, darkMode])

  // ============================================================
  // THEME COLORS
  // ============================================================
  const textColor = darkMode ? '#e8edf5' : '#1e293b'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const bgPlaceholder = darkMode ? '#1a1a2e' : '#f1f5f9'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.5)'

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <div 
        style={{ 
          textAlign: 'center',
          ...style
        }}
        className={className}
      >
        <div style={{ 
          width: size, 
          height: size, 
          background: bgPlaceholder,
          borderRadius: '12px',
          animation: 'pulse 1.5s ease-in-out infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          border: `1px solid ${borderColor}`
        }}>
          <div style={{
            width: '30px',
            height: '30px',
            border: '3px solid rgba(59,130,246,0.15)',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>
        {showLabel && (
          <p style={{ 
            marginTop: '8px', 
            fontSize: '12px', 
            fontWeight: 'bold', 
            color: textColor 
          }}>
            {label || `${t('table')} ${tableNumber}`}
          </p>
        )}
        {showInstruction && (
          <p style={{ 
            fontSize: '10px', 
            color: textMuted,
            marginTop: '2px'
          }}>
            {instruction || t('scan_to_order')}
          </p>
        )}
        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.6; }
            }
          `}
        </style>
      </div>
    )
  }

  // ============================================================
  // ERROR STATE
  // ============================================================
  if (error) {
    return (
      <div 
        style={{ 
          textAlign: 'center',
          ...style
        }}
        className={className}
      >
        <div style={{ 
          width: size, 
          height: size, 
          background: darkMode ? 'rgba(239,68,68,0.15)' : '#fee2e2',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          border: `1px solid ${darkMode ? 'rgba(239,68,68,0.3)' : '#fecaca'}`,
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontSize: size > 100 ? '32px' : '24px' }}>⚠️</span>
          <span style={{ 
            fontSize: size > 100 ? '12px' : '10px', 
            color: darkMode ? '#f87171' : '#991b1b',
            fontWeight: 'bold'
          }}>
            {t('qr_error')}
          </span>
        </div>
        {showLabel && (
          <p style={{ 
            marginTop: '8px', 
            fontSize: '12px', 
            fontWeight: 'bold', 
            color: textColor 
          }}>
            {label || `${t('table')} ${tableNumber}`}
          </p>
        )}
        {showInstruction && (
          <p style={{ 
            fontSize: '10px', 
            color: textMuted,
            marginTop: '2px'
          }}>
            {instruction || t('scan_to_order')}
          </p>
        )}
      </div>
    )
  }

  // ============================================================
  // SUCCESS STATE
  // ============================================================
  return (
    <div 
      style={{ 
        textAlign: 'center',
        ...style
      }}
      className={className}
    >
      <div style={{
        position: 'relative',
        display: 'inline-block',
        padding: '4px',
        background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
        borderRadius: '14px',
        border: `1px solid ${borderColor}`
      }}>
        <img 
          src={qrUrl} 
          alt={`QR Code ${t('table')} ${tableNumber}`} 
          style={{ 
            width: size, 
            height: size, 
            borderRadius: '10px',
            display: 'block'
          }} 
          loading="lazy"
        />
      </div>
      
      {showLabel && (
        <p style={{ 
          marginTop: '8px', 
          fontSize: '13px', 
          fontWeight: 'bold', 
          color: textColor,
          letterSpacing: '0.5px'
        }}>
          {label || `${t('table')} ${tableNumber}`}
        </p>
      )}
      
      {showInstruction && (
        <p style={{ 
          fontSize: '10px', 
          color: textMuted,
          marginTop: '2px',
          letterSpacing: '0.3px'
        }}>
          {instruction || t('scan_to_order')}
        </p>
      )}

      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
        `}
      </style>
    </div>
  )
}

export default TableQRCode