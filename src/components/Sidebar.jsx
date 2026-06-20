import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { supabase } from '../lib/supabase'

function Sidebar({ children }) {
  const { darkMode, toggleDarkMode } = useTheme()
  const { language, setLanguage } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [restaurantName, setRestaurantName] = useState('Restoran Kita')
  const [restaurantLogo, setRestaurantLogo] = useState('')
  const [logoError, setLogoError] = useState(false)

  const userStr = sessionStorage.getItem('staffAuth')
  const user = userStr ? JSON.parse(userStr) : null

  // ============================================================
  // TRANSLATIONS
  // ============================================================
  const translations = {
    dashboard: { en: 'Dashboard', ms: 'Papan Pemuka' },
    pos: { en: 'POS', ms: 'POS' },
    kitchen: { en: 'Kitchen', ms: 'Dapur' },
    manage_menu: { en: 'Manage Menu', ms: 'Urus Menu' },
    manage_categories: { en: 'Categories', ms: 'Kategori' },
    manage_staff: { en: 'Staff', ms: 'Staff' },
    manage_tables: { en: 'Tables', ms: 'Meja' },
    table_qrs: { en: 'Table QR', ms: 'QR Meja' },
    system_settings: { en: 'Settings', ms: 'Tetapan' },
    reports: { en: 'Reports', ms: 'Laporan' },
    admin: { en: 'Admin', ms: 'Admin' },
    staff: { en: 'Staff', ms: 'Staff' },
    kitchen_role: { en: 'Kitchen', ms: 'Dapur' },
    logout: { en: 'Logout', ms: 'Log Keluar' },
    light_mode: { en: 'Light Mode', ms: 'Mod Terang' },
    dark_mode: { en: 'Dark Mode', ms: 'Mod Gelap' },
    english: { en: 'English', ms: 'English' },
    bahasa: { en: 'Bahasa Melayu', ms: 'Bahasa Melayu' },
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
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setCollapsed(true)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // ============================================================
  // LOAD RESTAURANT INFO - FIXED REALTIME
  // ============================================================
  const loadRestaurantInfo = async () => {
    try {
      const { data: nameData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'restaurant_name')
        .single()
      
      if (nameData && nameData.value) {
        setRestaurantName(nameData.value)
      }
      
      const { data: logoData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'logo_url')
        .single()
      
      if (logoData && logoData.value && logoData.value !== '') {
        setRestaurantLogo(logoData.value)
        setLogoError(false)
      }
    } catch (err) {
      console.error('Error loading restaurant info:', err)
    }
  }

  // ✅ FIXED: Correct order - create channel, add callback, then subscribe
  useEffect(() => {
    loadRestaurantInfo()
    
    const settingsChannel = supabase
      .channel('sidebar_settings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'settings' },
        (payload) => {
          if (payload.new && payload.new.key === 'restaurant_name') {
            setRestaurantName(payload.new.value)
          }
          if (payload.new && payload.new.key === 'logo_url') {
            setRestaurantLogo(payload.new.value || '')
            setLogoError(false)
          }
        }
      )
      .subscribe()
    
    return () => {
      settingsChannel.unsubscribe()
    }
  }, [])

  // ============================================================
  // HANDLE LOGOUT
  // ============================================================
  const handleLogout = () => {
    sessionStorage.removeItem('staffAuth')
    navigate('/login')
  }

  // ============================================================
  // THEME COLORS
  // ============================================================
  const sidebarBg = darkMode ? '#0a0a16' : '#ffffff'
  const sidebarBorder = darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.5)'
  const textColor = darkMode ? '#e8edf5' : '#1e293b'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const activeBg = darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)'
  const activeColor = '#3b82f6'
  const hoverBg = darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
  const hoverBgDark = darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'

  // ============================================================
  // HELPERS
  // ============================================================
  const isActive = (path) => location.pathname === path

  const getRoleText = () => {
    if (user?.role === 'admin') return t('admin')
    if (user?.role === 'kitchen') return t('kitchen_role')
    return t('staff')
  }

  const getRoleIcon = () => {
    if (user?.role === 'admin') return '👑'
    if (user?.role === 'kitchen') return '🍳'
    return '👤'
  }

  // ============================================================
  // MENU ITEMS
  // ============================================================
  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'dashboard', roles: ['admin'] },
    { path: '/staff', icon: '🧾', label: 'pos', roles: ['admin', 'staff'] },
    { path: '/kitchen', icon: '🍳', label: 'kitchen', roles: ['admin', 'staff', 'kitchen'] },
    { path: '/manage-menu', icon: '📋', label: 'manage_menu', roles: ['admin'] },
    { path: '/manage-categories', icon: '📂', label: 'manage_categories', roles: ['admin'] },
    { path: '/manage-staff', icon: '👥', label: 'manage_staff', roles: ['admin'] },
    { path: '/manage-tables', icon: '🪑', label: 'manage_tables', roles: ['admin'] },
    { path: '/table-qrs', icon: '📱', label: 'table_qrs', roles: ['admin'] },
    { path: '/manage-settings', icon: '⚙️', label: 'system_settings', roles: ['admin'] },
    { path: '/admin-report', icon: '📈', label: 'reports', roles: ['admin'] },
  ]

  const getLabel = (item) => {
    const labelMap = {
      'dashboard': t('dashboard'),
      'pos': t('pos'),
      'kitchen': t('kitchen'),
      'manage_menu': t('manage_menu'),
      'manage_categories': t('manage_categories'),
      'manage_staff': t('manage_staff'),
      'manage_tables': t('manage_tables'),
      'table_qrs': t('table_qrs'),
      'system_settings': t('system_settings'),
      'reports': t('reports')
    }
    return labelMap[item.label] || item.label
  }

  const filteredMenu = menuItems.filter(item => {
    if (!user) return false
    return item.roles.includes(user.role)
  })

  const sidebarWidth = collapsed ? '72px' : '260px'

  // ============================================================
  // RENDER - KEEP ORIGINAL
  // ============================================================
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      
      {/* DESKTOP SIDEBAR */}
      <div style={{
        width: isMobile ? '0px' : sidebarWidth,
        minWidth: isMobile ? '0px' : sidebarWidth,
        background: sidebarBg,
        borderRight: `1px solid ${sidebarBorder}`,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 1000,
        display: isMobile ? 'none' : 'flex',
        flexDirection: 'column',
        boxShadow: darkMode 
          ? '4px 0 20px rgba(0,0,0,0.3)' 
          : '4px 0 20px rgba(0,0,0,0.04)'
      }}>
        
        {/* LOGO */}
        <div style={{
          padding: collapsed ? '16px 12px' : '20px 18px',
          borderBottom: `1px solid ${sidebarBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: collapsed ? 0 : '14px',
          minHeight: '70px'
        }}>
          {restaurantLogo && !logoError && restaurantLogo !== '' ? (
            <img 
              src={restaurantLogo} 
              alt={restaurantName} 
              style={{ 
                width: collapsed ? '40px' : '40px', 
                height: collapsed ? '40px' : '40px', 
                objectFit: 'contain', 
                borderRadius: '10px',
                backgroundColor: '#fff',
                padding: '4px',
                flexShrink: 0
              }} 
              onError={() => setLogoError(true)}
            />
          ) : (
            <div style={{ 
              width: collapsed ? '40px' : '40px', 
              height: collapsed ? '40px' : '40px', 
              background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: collapsed ? '20px' : '20px',
              color: 'white',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(245,158,11,0.3)'
            }}>
              🏪
            </div>
          )}
          
          {!collapsed && (
            <span style={{ 
              fontWeight: 'bold', 
              fontSize: '15px', 
              color: textColor,
              flex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {restaurantName}
            </span>
          )}
          
          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                background: hoverBg,
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                color: textMuted,
                padding: '4px 8px',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              onMouseEnter={e => e.currentTarget.style.background = hoverBgDark}
              onMouseLeave={e => e.currentTarget.style.background = hoverBg}
            >
              {collapsed ? '→' : '←'}
            </button>
          )}
        </div>

        {/* USER INFO */}
        <div style={{
          padding: collapsed ? '16px 12px' : '20px 18px',
          borderBottom: `1px solid ${sidebarBorder}`,
          textAlign: collapsed ? 'center' : 'left',
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? 0 : '12px',
          flexDirection: collapsed ? 'column' : 'row'
        }}>
          <div style={{
            width: collapsed ? '40px' : '44px',
            height: collapsed ? '40px' : '44px',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: collapsed ? '18px' : '20px',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
          }}>
            {getRoleIcon()}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontWeight: 'bold', 
                color: textColor, 
                fontSize: '14px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {user?.name || user?.username || 'Staff'}
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: textMuted, 
                marginTop: '2px' 
              }}>
                {getRoleText()}
              </div>
            </div>
          )}
        </div>

        {/* NAVIGATION */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {filteredMenu.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? '0' : '12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '10px' : '10px 14px',
                marginBottom: '4px',
                background: isActive(item.path) ? activeBg : 'transparent',
                color: isActive(item.path) ? activeColor : textColor,
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: isActive(item.path) ? '600' : '400',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={e => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = hoverBg
                }
              }}
              onMouseLeave={e => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {isActive(item.path) && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '3px',
                  height: '24px',
                  background: activeColor,
                  borderRadius: '0 4px 4px 0'
                }} />
              )}
              <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && (
                <span style={{ 
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {getLabel(item)}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* BOTTOM ACTIONS */}
        <div style={{
          padding: collapsed ? '12px 12px' : '16px 18px',
          borderTop: `1px solid ${sidebarBorder}`,
          marginTop: 'auto'
        }}>
          <button
            onClick={toggleDarkMode}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? '0' : '12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '8px' : '8px 14px',
              background: 'transparent',
              color: textColor,
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '4px'
            }}
            onMouseEnter={e => e.currentTarget.style.background = hoverBg}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{darkMode ? '☀️' : '🌙'}</span>
            {!collapsed && <span>{darkMode ? t('light_mode') : t('dark_mode')}</span>}
          </button>
          
          <button
            onClick={() => setLanguage(language === 'bm' ? 'en' : 'bm')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? '0' : '12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '8px' : '8px 14px',
              background: 'transparent',
              color: textColor,
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '4px'
            }}
            onMouseEnter={e => e.currentTarget.style.background = hoverBg}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: '18px', flexShrink: 0 }}>
              {language === 'bm' ? '🇺🇸' : '🇲🇾'}
            </span>
            {!collapsed && <span>{language === 'bm' ? t('english') : t('bahasa')}</span>}
          </button>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? '0' : '12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '8px' : '8px 14px',
              background: 'transparent',
              color: '#ef4444',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: '18px', flexShrink: 0 }}>🚪</span>
            {!collapsed && <span>{t('logout')}</span>}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{
        marginLeft: isMobile ? '0px' : sidebarWidth,
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        width: isMobile ? '100%' : `calc(100% - ${sidebarWidth})`,
        minHeight: '100vh',
        paddingBottom: isMobile ? '70px' : '0px',
        background: darkMode ? '#0a0a16' : '#f1f5f9'
      }}>
        
        {/* MOBILE HEADER */}
        <div style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 99,
          background: sidebarBg,
          borderBottom: `1px solid ${sidebarBorder}`,
          padding: '10px 16px',
          display: isMobile ? 'flex' : 'none',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: darkMode 
            ? '0 2px 12px rgba(0,0,0,0.3)' 
            : '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <button
            onClick={() => setMobileMenuOpen(true)}
            style={{
              background: hoverBg,
              border: 'none',
              borderRadius: '10px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '20px',
              color: textColor,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = hoverBgDark}
            onMouseLeave={e => e.currentTarget.style.background = hoverBg}
          >
            ☰
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {restaurantLogo && !logoError && restaurantLogo !== '' ? (
              <img 
                src={restaurantLogo} 
                alt={restaurantName} 
                style={{ 
                  height: '28px', 
                  width: '28px', 
                  borderRadius: '8px', 
                  objectFit: 'contain',
                  background: '#fff',
                  padding: '2px'
                }} 
              />
            ) : (
              <span style={{ fontSize: '22px' }}>🏪</span>
            )}
            <span style={{ 
              fontWeight: 'bold', 
              fontSize: '14px', 
              color: textColor 
            }}>
              {restaurantName}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              onClick={toggleDarkMode} 
              style={{ 
                background: hoverBg, 
                border: 'none', 
                borderRadius: '8px', 
                padding: '6px 8px', 
                cursor: 'pointer', 
                fontSize: '14px',
                transition: 'all 0.2s ease',
                color: textColor
              }}
              onMouseEnter={e => e.currentTarget.style.background = hoverBgDark}
              onMouseLeave={e => e.currentTarget.style.background = hoverBg}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button 
              onClick={handleLogout} 
              style={{ 
                background: hoverBg, 
                border: 'none', 
                borderRadius: '8px', 
                padding: '6px 8px', 
                cursor: 'pointer', 
                fontSize: '14px', 
                color: '#ef4444',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = hoverBg}
            >
              🚪
            </button>
          </div>
        </div>
        
        {/* CHILDREN */}
        <div style={{ 
          padding: isMobile ? '12px' : '24px',
          minHeight: 'calc(100vh - 60px)'
        }}>
          {children}
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 150,
          display: 'flex',
          animation: 'fadeIn 0.2s ease'
        }}
        onClick={() => setMobileMenuOpen(false)}>
          <div style={{
            width: '280px',
            background: sidebarBg,
            height: '100%',
            overflowY: 'auto',
            animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '4px 0 30px rgba(0,0,0,0.2)'
          }}
          onClick={(e) => e.stopPropagation()}>
            
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${sidebarBorder}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {restaurantLogo && !logoError && restaurantLogo !== '' ? (
                  <img 
                    src={restaurantLogo} 
                    alt={restaurantName} 
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '8px', 
                      objectFit: 'contain',
                      background: '#fff',
                      padding: '2px'
                    }} 
                  />
                ) : (
                  <span style={{ fontSize: '28px' }}>🏪</span>
                )}
                <span style={{ 
                  fontWeight: 'bold', 
                  fontSize: '16px', 
                  color: textColor 
                }}>
                  {restaurantName}
                </span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)} 
                style={{ 
                  background: hoverBg, 
                  border: 'none', 
                  fontSize: '20px', 
                  cursor: 'pointer',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  color: textMuted,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = hoverBgDark}
                onMouseLeave={e => e.currentTarget.style.background = hoverBg}
              >
                ✕
              </button>
            </div>
            
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${sidebarBorder}`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
              }}>
                {getRoleIcon()}
              </div>
              <div>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: textColor,
                  fontSize: '14px'
                }}>
                  {user?.name || user?.username || 'Staff'}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: textMuted,
                  marginTop: '2px'
                }}>
                  {getRoleText()}
                </div>
              </div>
            </div>
            
            <nav style={{ padding: '16px' }}>
              {filteredMenu.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path)
                    setMobileMenuOpen(false)
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    marginBottom: '4px',
                    background: isActive(item.path) ? activeBg : 'transparent',
                    color: isActive(item.path) ? activeColor : textColor,
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: isActive(item.path) ? '600' : '400',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={e => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.background = hoverBg
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {isActive(item.path) && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '24px',
                      background: activeColor,
                      borderRadius: '0 4px 4px 0'
                    }} />
                  )}
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  <span>{getLabel(item)}</span>
                </button>
              ))}
            </nav>
            
            <div style={{ 
              padding: '16px', 
              borderTop: `1px solid ${sidebarBorder}`,
              marginTop: 'auto'
            }}>
              <button 
                onClick={toggleDarkMode} 
                style={{ 
                  width: '100%', 
                  padding: '10px 14px', 
                  textAlign: 'left', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  borderRadius: '10px',
                  transition: 'all 0.2s ease',
                  color: textColor,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={e => e.currentTarget.style.background = hoverBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '18px' }}>{darkMode ? '☀️' : '🌙'}</span>
                {darkMode ? t('light_mode') : t('dark_mode')}
              </button>
              
              <button 
                onClick={() => setLanguage(language === 'bm' ? 'en' : 'bm')} 
                style={{ 
                  width: '100%', 
                  padding: '10px 14px', 
                  textAlign: 'left', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  borderRadius: '10px',
                  marginTop: '4px',
                  transition: 'all 0.2s ease',
                  color: textColor,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={e => e.currentTarget.style.background = hoverBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '18px' }}>
                  {language === 'bm' ? '🇺🇸' : '🇲🇾'}
                </span>
                {language === 'bm' ? t('english') : t('bahasa')}
              </button>
              
              <button 
                onClick={handleLogout} 
                style={{ 
                  width: '100%', 
                  padding: '10px 14px', 
                  textAlign: 'left', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: '#ef4444',
                  borderRadius: '10px',
                  marginTop: '8px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '18px' }}>🚪</span>
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideIn {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
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
          
          ::-webkit-scrollbar-thumb:hover {
            background: ${darkMode ? '#4d4d6c' : '#64748b'};
          }
        `}
      </style>
    </div>
  )
}

export default Sidebar