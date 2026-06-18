import { useState, useEffect, useRef } from 'react'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'

function PasswordModal({ onSuccess, onClose, title, subtitle, requiredPassword = 'kedai123' }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const inputRef = useRef(null)
  const { darkMode } = useTheme()
  const { language } = useLanguage()

  // ============================================================
  // COMPLETE TRANSLATIONS
  // ============================================================
  const translations = {
    // Modal
    password_title: { en: '🔐 Enter Password', ms: '🔐 Masukkan Password' },
    password_subtitle: { en: 'Please enter password to continue', ms: 'Sila masukkan password untuk meneruskan' },
    enter_password: { en: 'Enter password', ms: 'Masukkan password' },
    
    // Buttons
    submit: { en: '✅ Submit', ms: '✅ Sahkan' },
    cancel: { en: '❌ Cancel', ms: '❌ Batal' },
    
    // Errors
    incorrect_password: { en: '⚠️ Incorrect password!', ms: '⚠️ Password salah!' },
    too_many_attempts: { en: '⚠️ Too many failed attempts. Please try again later.', ms: '⚠️ Terlalu banyak percubaan gagal. Sila cuba lagi nanti.' },
    locked_message: { en: '🔒 Locked for 30 seconds', ms: '🔒 Dikunci selama 30 saat' },
    
    // Placeholder
    password_placeholder: { en: 'Enter password...', ms: 'Masukkan password...' },
    
    // Show/Hide password
    show_password: { en: 'Show password', ms: 'Tunjukkan password' },
    hide_password: { en: 'Hide password', ms: 'Sembunyikan password' },
  }

  const t = (key) => {
    if (!translations[key]) return key
    return language === 'en' ? translations[key].en : translations[key].ms
  }

  // ============================================================
  // THEME COLORS
  // ============================================================
  const modalBg = darkMode ? 'rgba(0,0,0,0.92)' : 'rgba(0,0,0,0.8)'
  const cardBg = darkMode ? 'rgba(20, 20, 40, 0.98)' : 'rgba(255, 255, 255, 0.98)'
  const textColor = darkMode ? '#e8edf5' : '#1e293b'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.4)' : 'rgba(203, 213, 225, 0.5)'
  const inputBg = darkMode ? '#1a1a2e' : '#ffffff'
  const inputBorder = darkMode ? '#3d3d5c' : '#cbd5e1'
  const inputText = darkMode ? '#e8edf5' : '#1e293b'
  const errorBg = darkMode ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)'
  
  const glassEffect = {
    background: cardBg,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${borderColor}`,
    boxShadow: darkMode 
      ? '0 25px 60px -12px rgba(0,0,0,0.7)' 
      : '0 25px 60px -12px rgba(0,0,0,0.15)'
  }

  // ============================================================
  // HANDLE ESC KEY
  // ============================================================
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  // ============================================================
  // AUTO FOCUS INPUT
  // ============================================================
  useEffect(() => {
    if (inputRef.current && !isLocked) {
      setTimeout(() => inputRef.current.focus(), 100)
    }
  }, [isLocked])

  // ============================================================
  // LOCK TIMER
  // ============================================================
  useEffect(() => {
    let timer
    if (isLocked) {
      timer = setTimeout(() => {
        setIsLocked(false)
        setAttempts(0)
      }, 30000) // Lock for 30 seconds
    }
    return () => clearTimeout(timer)
  }, [isLocked])

  // ============================================================
  // HANDLE SUBMIT
  // ============================================================
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (isLocked) {
      setError(t('too_many_attempts'))
      return
    }

    if (!password.trim()) {
      setError(language === 'bm' ? '⚠️ Sila masukkan password' : '⚠️ Please enter password')
      return
    }

    if (password === requiredPassword) {
      setError('')
      setPassword('')
      setAttempts(0)
      onSuccess()
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setError(t('incorrect_password'))
      setPassword('')
      
      if (newAttempts >= 3) {
        setIsLocked(true)
        setError(t('too_many_attempts'))
        setTimeout(() => {
          setError('')
        }, 30000)
      }
    }
  }

  // ============================================================
  // RENDER
  // ============================================================
  const modalTitle = title || t('password_title')
  const modalSubtitle = subtitle || t('password_subtitle')
  const isError = error && !isLocked

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: modalBg,
      backdropFilter: 'blur(10px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      animation: 'fadeIn 0.25s ease',
      padding: '16px'
    }}>
      <div style={{
        ...glassEffect,
        padding: '32px',
        borderRadius: '28px',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
        animation: 'popIn 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background element */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />
        
        {/* Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          background: isLocked 
            ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
            : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          borderRadius: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          boxShadow: isLocked 
            ? '0 8px 24px rgba(239,68,68,0.3)' 
            : '0 8px 24px rgba(59,130,246,0.3)',
          position: 'relative',
          zIndex: 1,
          transition: 'all 0.3s'
        }}>
          <span style={{ fontSize: '30px' }}>
            {isLocked ? '🔒' : '🔐'}
          </span>
        </div>
        
        {/* Title */}
        <h2 style={{ 
          margin: 0, 
          color: textColor, 
          fontSize: '22px', 
          fontWeight: 'bold',
          position: 'relative',
          zIndex: 1
        }}>
          {modalTitle}
        </h2>
        
        {/* Subtitle */}
        <p style={{ 
          color: textMuted, 
          fontSize: '13px', 
          marginTop: '8px', 
          marginBottom: '24px',
          position: 'relative',
          zIndex: 1
        }}>
          {isLocked ? t('locked_message') : modalSubtitle}
        </p>
        
        {/* Lock timer indicator */}
        {isLocked && (
          <div style={{
            background: errorBg,
            padding: '10px 16px',
            borderRadius: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            border: `1px solid rgba(239,68,68,0.2)`,
            position: 'relative',
            zIndex: 1
          }}>
            <span style={{ fontSize: '18px' }}>⏳</span>
            <span style={{ color: '#ef4444', fontSize: '13px', fontWeight: '500' }}>
              {language === 'bm' ? 'Sila tunggu 30 saat' : 'Please wait 30 seconds'}
            </span>
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'relative', marginBottom: isError ? '12px' : '20px' }}>
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError('')
              }}
              placeholder={t('password_placeholder')}
              disabled={isLocked}
              autoFocus
              style={{
                width: '100%',
                padding: '14px 48px 14px 16px',
                borderRadius: '16px',
                border: `2px solid ${isError ? '#ef4444' : isLocked ? '#64748b' : inputBorder}`,
                background: isLocked ? (darkMode ? '#2a2a3e' : '#f0f0f0') : inputBg,
                color: isLocked ? (darkMode ? '#666' : '#999') : inputText,
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.25s',
                cursor: isLocked ? 'not-allowed' : 'text'
              }}
              onFocus={(e) => {
                if (!isLocked) {
                  e.currentTarget.style.borderColor = '#3b82f6'
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.12)'
                }
              }}
              onBlur={(e) => {
                if (!isLocked) {
                  e.currentTarget.style.borderColor = isError ? '#ef4444' : inputBorder
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            />
            
            {/* Show/Hide Password Toggle */}
            {!isLocked && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: textMuted,
                  padding: '4px',
                  transition: 'all 0.2s',
                  opacity: password ? 0.7 : 0.4
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = password ? 0.7 : 0.4}
                title={showPassword ? t('hide_password') : t('show_password')}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            )}
          </div>
          
          {/* Error Message */}
          {error && !isLocked && (
            <p style={{ 
              color: '#ef4444', 
              marginBottom: '20px', 
              fontSize: '13px',
              background: errorBg,
              padding: '10px 14px',
              borderRadius: '12px',
              border: `1px solid rgba(239,68,68,0.2)`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center',
              animation: 'shake 0.3s ease'
            }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              {error}
            </p>
          )}
          
          {/* Attempts indicator */}
          {attempts > 0 && !isLocked && !error && (
            <p style={{ 
              color: textMuted, 
              fontSize: '11px', 
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              {language === 'bm' 
                ? `Percubaan: ${attempts}/3` 
                : `Attempts: ${attempts}/3`}
            </p>
          )}
          
          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="submit" 
              disabled={isLocked}
              style={{ 
                flex: 1.5, 
                background: isLocked 
                  ? (darkMode ? '#2a2a3e' : '#cbd5e1')
                  : 'linear-gradient(135deg, #3b82f6, #1d4ed8)', 
                color: isLocked ? (darkMode ? '#666' : '#999') : 'white', 
                padding: '14px', 
                border: 'none', 
                borderRadius: '40px', 
                cursor: isLocked ? 'not-allowed' : 'pointer', 
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'all 0.2s',
                boxShadow: isLocked 
                  ? 'none' 
                  : '0 8px 24px -4px rgba(59,130,246,0.4)',
                opacity: isLocked ? 0.6 : 1
              }}
              onMouseEnter={e => {
                if (!isLocked) {
                  e.currentTarget.style.transform = 'scale(0.97)'
                  e.currentTarget.style.boxShadow = '0 4px 16px -2px rgba(59,130,246,0.3)'
                }
              }}
              onMouseLeave={e => {
                if (!isLocked) {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(59,130,246,0.4)'
                }
              }}
            >
              {isLocked ? '⏳' : '✅'} {t('submit')}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              style={{ 
                flex: 1, 
                background: darkMode ? '#475569' : '#64748b', 
                color: 'white', 
                padding: '14px', 
                border: 'none', 
                borderRadius: '40px', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              ❌ {t('cancel')}
            </button>
          </div>
        </form>
      </div>

      {/* ===== STYLES ===== */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes popIn {
            0% { opacity: 0; transform: scale(0.92) translateY(15px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-8px); }
            40%, 80% { transform: translateX(8px); }
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

export default PasswordModal