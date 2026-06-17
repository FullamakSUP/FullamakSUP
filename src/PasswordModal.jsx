import { useState, useEffect } from 'react'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'

function PasswordModal({ onSuccess, onClose, title = 'Masukkan Password' }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { darkMode } = useTheme()
  const { language } = useLanguage()

  // Dark mode colors
  const modalBg = darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.8)'
  const cardBg = darkMode ? '#1e1e2e' : '#ffffff'
  const textColor = darkMode ? '#f1f5f9' : '#1e293b'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const borderColor = darkMode ? '#334155' : '#e2e8f0'
  const inputBg = darkMode ? '#0f0f1a' : '#ffffff'

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    // You can change this password or make it dynamic from settings
    const validPassword = 'kedai123'
    
    if (password === validPassword) {
      setError('')
      setPassword('')
      onSuccess()
    } else {
      setError(language === 'bm' ? 'Password salah!' : 'Incorrect password!')
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: modalBg,
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        background: cardBg,
        padding: '32px',
        borderRadius: '24px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        border: `1px solid ${borderColor}`,
        animation: 'popIn 0.3s ease'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          borderRadius: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto'
        }}>
          <span style={{ fontSize: '28px' }}>🔐</span>
        </div>
        
        <h2 style={{ margin: 0, color: textColor, fontSize: '22px', fontWeight: 'bold' }}>{title}</h2>
        <p style={{ color: textMuted, fontSize: '13px', marginTop: '8px', marginBottom: '24px' }}>
          {language === 'bm' ? 'Sila masukkan password untuk meneruskan' : 'Please enter password to continue'}
        </p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={language === 'bm' ? 'Masukkan password' : 'Enter password'}
            autoFocus
            style={{
              width: '100%',
              padding: '14px',
              marginBottom: '16px',
              borderRadius: '16px',
              border: `1px solid ${error ? '#ef4444' : borderColor}`,
              background: inputBg,
              color: textColor,
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'all 0.2s'
            }}
          />
          
          {error && (
            <p style={{ 
              color: '#ef4444', 
              marginBottom: '20px', 
              fontSize: '13px',
              background: 'rgba(239,68,68,0.1)',
              padding: '8px',
              borderRadius: '12px'
            }}>
              ⚠️ {error}
            </p>
          )}
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="submit" 
              style={{ 
                flex: 1, 
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', 
                color: 'white', 
                padding: '12px', 
                border: 'none', 
                borderRadius: '40px', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              ✅ {language === 'bm' ? 'Sahkan' : 'Submit'}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              style={{ 
                flex: 1, 
                background: '#64748b', 
                color: 'white', 
                padding: '12px', 
                border: 'none', 
                borderRadius: '40px', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              ❌ {language === 'bm' ? 'Batal' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes popIn {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
    </div>
  )
}

export default PasswordModal