import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { supabase } from '../lib/supabase'

function Sidebar({ children }) {
  const { darkMode, toggleDarkMode } = useTheme()
  const { language, setLanguage, t } = useLanguage()
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

  // Check if mobile
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

  useEffect(() => {
    loadRestaurantInfo()
    
    const settingsSubscription = supabase
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
      settingsSubscription.unsubscribe()
    }
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem('staffAuth')
    navigate('/login')
  }

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
      'table_qrs': language === 'bm' ? 'QR Meja' : 'Table QR',
      'system_settings': t('system_settings'),
      'reports': t('reports')
    }
    return labelMap[item.label] || item.label
  }

  const filteredMenu = menuItems.filter(item => {
    if (!user) return false
    return item.roles.includes(user.role)
  })

  const sidebarBg = darkMode ? '#0f0f1a' : '#ffffff'
  const sidebarBorder = darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.6)'
  const textColor = darkMode ? '#f1f5f9' : '#0f172a'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const activeBg = darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'
  const activeColor = '#3b82f6'
  const hoverBg = darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'

  const isActive = (path) => location.pathname === path

  const getRoleText = () => {
    if (user?.role === 'admin') return t('admin')
    if (user?.role === 'kitchen') return t('kitchen')
    return t('staff')
  }

  const getRoleIcon = () => {
    if (user?.role === 'admin') return '👑'
    if (user?.role === 'kitchen') return '🍳'
    return '👤'
  }

  // Sidebar width
  const sidebarWidth = collapsed ? '80px' : '280px'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      
      {/* DESKTOP SIDEBAR - FULL VISIBLE */}
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
        flexDirection: 'column'
      }}>
        
        {/* LOGO SECTION */}
        <div style={{
          padding: collapsed ? '20px 12px' : '24px 20px',
          borderBottom: `1px solid ${sidebarBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: collapsed ? 0 : '12px'
        }}>
          {/* Logo Image */}
          {restaurantLogo && !logoError && restaurantLogo !== '' ? (
            <img 
              src={restaurantLogo} 
              alt={restaurantName} 
              style={{ 
                width: collapsed ? '40px' : '36px', 
                height: collapsed ? '40px' : '36px', 
                objectFit: 'contain', 
                borderRadius: '10px',
                backgroundColor: '#fff',
                padding: '4px'
              }} 
              onError={() => setLogoError(true)}
            />
          ) : (
            <div style={{ 
              width: collapsed ? '40px' : '36px', 
              height: collapsed ? '40px' : '36px', 
              background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: collapsed ? '22px' : '20px',
              color: 'white'
            }}>
              🏪
            </div>
          )}
          
          {/* Restaurant Name - only when not collapsed */}
          {!collapsed && (
            <span style={{ 
              fontWeight: 'bold', 
              fontSize: '16px', 
              color: textColor,
              flex: 1
            }}>
              {restaurantName}
            </span>
          )}
          
          {/* Collapse Button */}
          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                background: hoverBg,
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                color: textMuted,
                padding: '6px 8px',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              {collapsed ? '→' : '←'}
            </button>
          )}
        </div>

        {/* USER INFO SECTION */}
        <div style={{
          padding: collapsed ? '16px 12px' : '20px',
          borderBottom: `1px solid ${sidebarBorder}`,
          textAlign: collapsed ? 'center' : 'left'
        }}>
          <div style={{
            width: collapsed ? '44px' : '52px',
            height: collapsed ? '44px' : '52px',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: collapsed ? '0 auto' : '0 0 12px 0',
            fontSize: collapsed ? '22px' : '26px'
          }}>
            {getRoleIcon()}
          </div>
          {!collapsed && (
            <>
              <div style={{ fontWeight: 'bold', color: textColor, fontSize: '14px' }}>{user?.name || user?.username || 'Staff'}</div>
              <div style={{ fontSize: '11px', color: textMuted, marginTop: '4px' }}>{getRoleText()}</div>
            </>
          )}
        </div>

        {/* NAVIGATION MENU */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
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
                padding: collapsed ? '12px' : '12px 16px',
                marginBottom: '6px',
                background: isActive(item.path) ? activeBg : 'transparent',
                color: isActive(item.path) ? activeColor : textColor,
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: isActive(item.path) ? '600' : '400',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{getLabel(item)}</span>}
            </button>
          ))}
        </nav>

        {/* BOTTOM SECTION - Dark Mode, Language, Logout */}
        <div style={{
          padding: collapsed ? '16px 12px' : '20px',
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
              padding: collapsed ? '10px' : '10px 16px',
              background: 'transparent',
              color: textColor,
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '8px'
            }}
          >
            <span style={{ fontSize: '18px' }}>{darkMode ? '☀️' : '🌙'}</span>
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
              padding: collapsed ? '10px' : '10px 16px',
              background: 'transparent',
              color: textColor,
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              marginBottom: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '18px' }}>{language === 'bm' ? '🇺🇸' : '🇲🇾'}</span>
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
              padding: collapsed ? '10px' : '10px 16px',
              background: 'transparent',
              color: '#ef4444',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '18px' }}>🚪</span>
            {!collapsed && <span>{t('logout')}</span>}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT - with margin left for sidebar space */}
      <div style={{
        marginLeft: isMobile ? '0px' : sidebarWidth,
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        width: isMobile ? '100%' : `calc(100% - ${sidebarWidth})`,
        minHeight: '100vh',
        paddingBottom: isMobile ? '70px' : '0px'
      }}>
        
        {/* Mobile Header */}
        <div style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 99,
          background: sidebarBg,
          borderBottom: `1px solid ${sidebarBorder}`,
          padding: '12px 16px',
          display: isMobile ? 'flex' : 'none',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={() => setMobileMenuOpen(true)}
            style={{
              background: hoverBg,
              border: 'none',
              borderRadius: '12px',
              padding: '10px 14px',
              cursor: 'pointer',
              fontSize: '20px',
              color: textColor
            }}
          >
            ☰
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {restaurantLogo && !logoError && restaurantLogo !== '' ? (
              <img src={restaurantLogo} alt={restaurantName} style={{ height: '32px', width: '32px', borderRadius: '8px', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: '24px' }}>🏪</span>
            )}
            <span style={{ fontWeight: 'bold', fontSize: '14px', color: textColor }}>{restaurantName}</span>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={toggleDarkMode} style={{ background: hoverBg, border: 'none', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', fontSize: '14px' }}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={handleLogout} style={{ background: hoverBg, border: 'none', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', fontSize: '14px', color: '#ef4444' }}>
              🚪
            </button>
          </div>
        </div>
        
        {/* Children Content */}
        <div style={{ padding: isMobile ? '16px' : '24px' }}>{children}</div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 150,
          display: 'flex',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            width: '280px',
            background: sidebarBg,
            height: '100%',
            overflowY: 'auto',
            animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: `1px solid ${sidebarBorder}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {restaurantLogo && !logoError && restaurantLogo !== '' ? (
                  <img src={restaurantLogo} alt={restaurantName} style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: '28px' }}>🏪</span>
                )}
                <span style={{ fontWeight: 'bold', fontSize: '16px', color: textColor }}>{restaurantName}</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)} 
                style={{ 
                  background: hoverBg, 
                  border: 'none', 
                  fontSize: '20px', 
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  color: textMuted
                }}
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
                fontSize: '22px'
              }}>
                {getRoleIcon()}
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: textColor }}>{user?.name || user?.username || 'Staff'}</div>
                <div style={{ fontSize: '11px', color: textMuted }}>{getRoleText()}</div>
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
                    padding: '12px 16px',
                    marginBottom: '4px',
                    background: isActive(item.path) ? activeBg : 'transparent',
                    color: isActive(item.path) ? activeColor : textColor,
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  <span>{getLabel(item)}</span>
                </button>
              ))}
            </nav>
            
            <div style={{ padding: '16px', borderTop: `1px solid ${sidebarBorder}` }}>
              <button 
                onClick={toggleDarkMode} 
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  textAlign: 'left', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  color: textColor
                }}
              >
                {darkMode ? '☀️ ' + t('light_mode') : '🌙 ' + t('dark_mode')}
              </button>
              <button 
                onClick={() => setLanguage(language === 'bm' ? 'en' : 'bm')} 
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  textAlign: 'left', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  borderRadius: '8px',
                  marginTop: '4px',
                  transition: 'all 0.2s ease',
                  color: textColor
                }}
              >
                {language === 'bm' ? '🇺🇸 ' + t('english') : '🇲🇾 ' + t('bahasa')}
              </button>
              <button 
                onClick={handleLogout} 
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  textAlign: 'left', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: '#ef4444',
                  borderRadius: '8px',
                  marginTop: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                🚪 {t('logout')}
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
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: ${darkMode ? '#2a2a3e' : '#e2e8f0'};
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb {
            background: ${darkMode ? '#555' : '#94a3b8'};
            border-radius: 10px;
          }
        `}
      </style>
    </div>
  )
}

export default Sidebar