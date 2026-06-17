import { useState, useEffect } from 'react'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'
import toast from 'react-hot-toast'
import { supabase } from './lib/supabase'

function Login({ onLogin }) {
  const { darkMode, toggleDarkMode } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [restaurantName, setRestaurantName] = useState('Restoran Kita')
  const [restaurantLogo, setRestaurantLogo] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  
  // Login page text settings from database
  const [loginWelcomeText, setLoginWelcomeText] = useState('Welcome Back!')
  const [loginSubtitleText, setLoginSubtitleText] = useState('Please sign in to continue')
  const [loginBrandingText, setLoginBrandingText] = useState('POS System for Small & Medium Restaurants')
  const [loginFooterText, setLoginFooterText] = useState('© 2024 Restoran Kita • POS System')

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Modern theme colors
  const bgColor = darkMode ? '#0f0f1a' : '#f1f5f9'
  const cardBg = darkMode ? 'rgba(30, 30, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  const textColor = darkMode ? '#f1f5f9' : '#0f172a'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.4)'
  const inputBg = darkMode ? '#1e1e2e' : '#ffffff'
  
  const glassEffect = {
    background: cardBg,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${borderColor}`,
    boxShadow: darkMode ? '0 25px 50px -12px rgba(0,0,0,0.5)' : '0 25px 50px -12px rgba(0,0,0,0.15)'
  }

  useEffect(() => {
    loadRestaurantInfo()
    loadLoginSettings()
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

  async function loadLoginSettings() {
    try {
      const { data: welcomeData } = await supabase.from('settings').select('value').eq('key', 'login_welcome_text').single()
      if (welcomeData) setLoginWelcomeText(welcomeData.value)
      
      const { data: subtitleData } = await supabase.from('settings').select('value').eq('key', 'login_subtitle_text').single()
      if (subtitleData) setLoginSubtitleText(subtitleData.value)
      
      const { data: brandingData } = await supabase.from('settings').select('value').eq('key', 'login_branding_text').single()
      if (brandingData) setLoginBrandingText(brandingData.value)
      
      const { data: footerData } = await supabase.from('settings').select('value').eq('key', 'login_footer_text').single()
      if (footerData) setLoginFooterText(footerData.value)
    } catch (err) {
      console.error('Error loading login settings:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!username || !password) {
      toast.error(language === 'bm' ? 'Sila masukkan nama pengguna dan kata laluan' : 'Please enter username and password')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('username', username.toLowerCase())
        .single()

      if (error || !data) {
        toast.error(language === 'bm' ? 'Nama pengguna atau kata laluan salah' : 'Invalid username or password')
        setLoading(false)
        return
      }

      if (data.password !== password) {
        toast.error(language === 'bm' ? 'Nama pengguna atau kata laluan salah' : 'Invalid username or password')
        setLoading(false)
        return
      }

      const userData = {
        id: data.id,
        username: data.username,
        name: data.name || data.username,
        role: data.role
      }
      
      sessionStorage.setItem('staffAuth', JSON.stringify(userData))
      
      toast.success(`${language === 'bm' ? 'Selamat datang' : 'Welcome'}, ${userData.name}!`)
      
      if (onLogin) {
        onLogin(userData)
      } else {
        if (userData.role === 'admin') {
          window.location.href = '/dashboard'
        } else if (userData.role === 'staff') {
          window.location.href = '/staff'
        } else if (userData.role === 'kitchen') {
          window.location.href = '/kitchen'
        } else {
          window.location.href = '/dashboard'
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      toast.error(language === 'bm' ? 'Ralat log masuk. Sila cuba lagi.' : 'Login error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Translations for static text
  const getLoginText = (key) => {
    const texts = {
      login_title: { bm: 'Sistem POS untuk Restoran Kecil & Sederhana', en: 'POS System for Small & Medium Restaurants' },
      username: { bm: 'Nama Pengguna', en: 'Username' },
      password: { bm: 'Kata Laluan', en: 'Password' },
      enter_username: { bm: 'Masukkan nama pengguna', en: 'Enter username' },
      enter_password: { bm: 'Masukkan kata laluan', en: 'Enter password' },
      login: { bm: 'Log Masuk', en: 'Login' },
      logging_in: { bm: 'Log masuk...', en: 'Logging in...' },
      english: { bm: 'English', en: 'Bahasa Melayu' }
    }
    return texts[key]?.[language] || texts[key]?.en || key
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: bgColor, 
      padding: isMobile ? '16px' : '20px',
      position: 'relative', 
      overflow: 'hidden' 
    }}>
      
      {/* Animated Background Elements */}
      <div style={{ 
        position: 'absolute', 
        top: '-30%', 
        right: '-20%', 
        width: isMobile ? '300px' : '600px', 
        height: isMobile ? '300px' : '600px', 
        background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0) 70%)', 
        borderRadius: '50%', 
        animation: 'float 8s ease-in-out infinite' 
      }} />
      <div style={{ 
        position: 'absolute', 
        bottom: '-30%', 
        left: '-20%', 
        width: isMobile ? '250px' : '500px', 
        height: isMobile ? '250px' : '500px', 
        background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0) 70%)', 
        borderRadius: '50%', 
        animation: 'float 6s ease-in-out infinite reverse' 
      }} />

      {/* Main Container - Responsive Layout */}
      <div style={{ 
        ...glassEffect, 
        borderRadius: isMobile ? '24px' : '40px', 
        maxWidth: isMobile ? '100%' : '1100px', 
        width: '100%', 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        overflow: 'hidden', 
        animation: 'slideUp 0.6s ease' 
      }}>
        
        {/* LEFT SIDE - Branding (desktop only) */}
        {!isMobile && (
          <div style={{ 
            flex: 1, 
            background: 'linear-gradient(135deg, #2563eb, #1e40af, #1e1b4b)', 
            padding: '48px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            textAlign: 'center', 
            color: 'white' 
          }}>
            <div style={{ 
              width: '120px', 
              height: '120px', 
              background: 'rgba(255,255,255,0.1)', 
              borderRadius: '32px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '32px', 
              backdropFilter: 'blur(10px)', 
              border: '1px solid rgba(255,255,255,0.2)' 
            }}>
              {restaurantLogo ? 
                <img src={restaurantLogo} alt={restaurantName} style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '16px' }} /> : 
                <span style={{ fontSize: '64px' }}>🏪</span>
              }
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '-0.5px' }}>{restaurantName}</h1>
            <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '32px', maxWidth: '280px' }}>{getLoginText('login_title')}</p>
            <div style={{ width: '80%', height: '2px', background: 'rgba(255,255,255,0.2)', margin: '24px 0' }} />
            <div style={{ fontSize: '12px', opacity: 0.7 }}>⭐ {loginBrandingText}</div>
          </div>
        )}
        
        {/* Mobile Logo (only on mobile) */}
        {isMobile && (
          <div style={{ 
            textAlign: 'center', 
            padding: '24px 24px 0 24px',
            borderBottom: `1px solid ${borderColor}`
          }}>
            <div style={{ 
              width: '70px', 
              height: '70px', 
              background: 'linear-gradient(135deg, #2563eb, #1e40af)', 
              borderRadius: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 12px auto' 
            }}>
              {restaurantLogo ? 
                <img src={restaurantLogo} alt={restaurantName} style={{ width: '50px', height: '50px', objectFit: 'contain', borderRadius: '12px' }} /> : 
                <span style={{ fontSize: '40px' }}>🏪</span>
              }
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: textColor }}>{restaurantName}</h1>
            <p style={{ fontSize: '12px', color: textMuted, marginTop: '4px' }}>{getLoginText('login_title')}</p>
          </div>
        )}
        
        {/* RIGHT SIDE - Login Form */}
        <div style={{ 
          flex: 1, 
          padding: isMobile ? '24px' : '48px', 
          background: 'transparent' 
        }}>
          
          {/* Top Toggles */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '12px', 
            marginBottom: isMobile ? '16px' : '32px' 
          }}>
            <button 
              onClick={toggleDarkMode} 
              style={{ 
                background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
                color: textColor, 
                padding: '8px', 
                border: `1px solid ${borderColor}`, 
                borderRadius: '40px', 
                cursor: 'pointer', 
                width: '38px', 
                height: '38px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button 
              onClick={() => setLanguage(language === 'bm' ? 'en' : 'bm')} 
              style={{ 
                background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
                color: textColor, 
                padding: '8px 16px', 
                border: `1px solid ${borderColor}`, 
                borderRadius: '40px', 
                cursor: 'pointer', 
                fontSize: '13px', 
                fontWeight: '500' 
              }}
            >
              {language === 'bm' ? '🇺🇸 English' : '🇲🇾 Bahasa'}
            </button>
          </div>
          
          {/* Welcome Text */}
          <div style={{ marginBottom: isMobile ? '20px' : '32px' }}>
            <h2 style={{ 
              margin: 0, 
              color: textColor, 
              fontSize: isMobile ? '24px' : '28px', 
              fontWeight: 'bold', 
              letterSpacing: '-0.5px' 
            }}>
              {loginWelcomeText}
            </h2>
            <p style={{ color: textMuted, fontSize: '14px', marginTop: '8px' }}>
              {loginSubtitleText}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600', 
                color: textColor, 
                fontSize: '13px' 
              }}>
                📧 {getLoginText('username')}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ 
                  position: 'absolute', 
                  left: '16px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  fontSize: '18px', 
                  color: textMuted 
                }}>
                  👤
                </span>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder={getLoginText('enter_username')} 
                  autoComplete="off" 
                  style={{ 
                    width: '100%', 
                    padding: isMobile ? '14px 16px 14px 48px' : '16px 16px 16px 48px', 
                    borderRadius: '24px', 
                    border: `1px solid ${borderColor}`, 
                    background: inputBg, 
                    color: textColor, 
                    fontSize: isMobile ? '14px' : '15px', 
                    outline: 'none', 
                    transition: 'all 0.2s' 
                  }}
                  onFocus={e => { 
                    e.currentTarget.style.borderColor = '#3b82f6'; 
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.15)' 
                  }}
                  onBlur={e => { 
                    e.currentTarget.style.borderColor = borderColor; 
                    e.currentTarget.style.boxShadow = 'none' 
                  }} 
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600', 
                color: textColor, 
                fontSize: '13px' 
              }}>
                🔒 {getLoginText('password')}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ 
                  position: 'absolute', 
                  left: '16px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  fontSize: '18px', 
                  color: textMuted 
                }}>
                  🔑
                </span>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder={getLoginText('enter_password')} 
                  style={{ 
                    width: '100%', 
                    padding: isMobile ? '14px 16px 14px 48px' : '16px 16px 16px 48px', 
                    paddingRight: '50px', 
                    borderRadius: '24px', 
                    border: `1px solid ${borderColor}`, 
                    background: inputBg, 
                    color: textColor, 
                    fontSize: isMobile ? '14px' : '15px', 
                    outline: 'none', 
                    transition: 'all 0.2s' 
                  }}
                  onFocus={e => { 
                    e.currentTarget.style.borderColor = '#3b82f6'; 
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.15)' 
                  }}
                  onBlur={e => { 
                    e.currentTarget.style.borderColor = borderColor; 
                    e.currentTarget.style.boxShadow = 'none' 
                  }} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{ 
                    position: 'absolute', 
                    right: '16px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontSize: '20px', 
                    color: textMuted, 
                    padding: '0' 
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                width: '100%', 
                padding: isMobile ? '14px' : '16px', 
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '60px', 
                fontSize: isMobile ? '15px' : '16px', 
                fontWeight: 'bold', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                opacity: loading ? 0.7 : 1, 
                transition: 'all 0.3s', 
                boxShadow: '0 8px 20px -4px rgba(59,130,246,0.4)' 
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <span className="spinner"></span> {getLoginText('logging_in')}
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span>🔑</span> {getLoginText('login')} <span>→</span>
                </span>
              )}
            </button>
          </form>

          {/* Mobile Branding Text (only on mobile) */}
          {isMobile && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <div style={{ fontSize: '10px', color: textMuted, opacity: 0.7 }}>⭐ {loginBrandingText}</div>
            </div>
          )}

          {/* Footer */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: isMobile ? '24px' : '32px', 
            paddingTop: isMobile ? '16px' : '20px', 
            borderTop: `1px solid ${borderColor}` 
          }}>
            <p style={{ fontSize: '10px', color: textMuted, margin: 0 }}>
              {loginFooterText.replace('{restaurantName}', restaurantName)}
            </p>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes slideUp { 
            from { opacity: 0; transform: translateY(40px); } 
            to { opacity: 1; transform: translateY(0); } 
          }
          @keyframes float { 
            0%, 100% { transform: translateY(0) translateX(0); } 
            50% { transform: translateY(-20px) translateX(10px); } 
          }
          .spinner { 
            width: 18px; 
            height: 18px; 
            border: 2px solid rgba(255,255,255,0.3); 
            border-top-color: white; 
            border-radius: 50%; 
            animation: spin 0.8s linear infinite; 
            display: inline-block; 
          }
          @keyframes spin { 
            to { transform: rotate(360deg); } 
          }
          
          @media (max-width: 480px) {
            input, button {
              font-size: 16px !important;
            }
          }
        `}
      </style>
    </div>
  )
}

export default Login