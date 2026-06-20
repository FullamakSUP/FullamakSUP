import { createContext, useState, useContext, useEffect } from 'react'

// ============================================================
// THEME CONTEXT
// ============================================================
const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('kedaipos-theme')
      if (saved !== null) {
        return saved === 'dark'
      }
      // Check system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
      return false
    }
  })

  // ============================================================
  // APPLY THEME
  // ============================================================
  useEffect(() => {
    try {
      localStorage.setItem('kedaipos-theme', darkMode ? 'dark' : 'light')
    } catch {
      // Ignore localStorage errors
    }
    
    const root = document.documentElement
    
    // Set data-theme attribute for CSS variables
    if (darkMode) {
      root.setAttribute('data-theme', 'dark')
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
      
      // Body styles with smooth transition
      document.body.style.background = '#0a0a16'
      document.body.style.color = '#e8edf5'
      document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease'
    } else {
      root.setAttribute('data-theme', 'light')
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
      
      document.body.style.background = '#f1f5f9'
      document.body.style.color = '#0f172a'
      document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease'
    }
    
    // Add/remove class for global styling compatibility
    if (darkMode) {
      document.body.classList.add('dark-mode')
      document.body.classList.remove('light-mode')
    } else {
      document.body.classList.add('light-mode')
      document.body.classList.remove('dark-mode')
    }
    
    // Dispatch custom event for components that need to react to theme changes
    window.dispatchEvent(new CustomEvent('themeChange', { detail: { darkMode } }))
    
  }, [darkMode])

  // ============================================================
  // LISTEN TO SYSTEM THEME CHANGES
  // ============================================================
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e) => {
      // Only update if user hasn't manually set a preference
      if (!localStorage.getItem('kedaipos-theme')) {
        setDarkMode(e.matches)
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // ============================================================
  // TOGGLE FUNCTION
  // ============================================================
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev)
  }

  // ============================================================
  // SET DARK MODE DIRECTLY
  // ============================================================
  const setDark = () => setDarkMode(true)
  const setLight = () => setDarkMode(false)

  // ============================================================
  // GET CURRENT THEME NAME
  // ============================================================
  const theme = darkMode ? 'dark' : 'light'

  // ============================================================
  // PROVIDER
  // ============================================================
  return (
    <ThemeContext.Provider value={{ 
      darkMode, 
      setDarkMode, 
      toggleDarkMode,
      setDark,
      setLight,
      theme
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ============================================================
// USE THEME HOOK
// ============================================================
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// ============================================================
// THEME UTILITIES (Optional helper functions)
// ============================================================
export const getThemeColors = (darkMode) => {
  return {
    // Backgrounds
    bg: darkMode ? '#0a0a16' : '#f1f5f9',
    bgSecondary: darkMode ? '#0f0f1a' : '#e2e8f0',
    bgTertiary: darkMode ? '#1a1a2e' : '#f8fafc',
    
    // Cards
    cardBg: darkMode ? 'rgba(20, 20, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    cardBorder: darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.5)',
    
    // Text
    text: darkMode ? '#e8edf5' : '#1e293b',
    textMuted: darkMode ? '#94a3b8' : '#64748b',
    textLight: darkMode ? '#64748b' : '#94a3b8',
    
    // Borders
    border: darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.5)',
    borderLight: darkMode ? 'rgba(71, 85, 105, 0.15)' : 'rgba(203, 213, 225, 0.3)',
    
    // Inputs
    inputBg: darkMode ? '#1a1a2e' : '#ffffff',
    inputBorder: darkMode ? '#3d3d5c' : '#cbd5e1',
    inputText: darkMode ? '#e8edf5' : '#1e293b',
    
    // Shadows
    shadow: darkMode 
      ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
      : '0 8px 32px rgba(0, 0, 0, 0.06)',
    shadowLight: darkMode 
      ? '0 4px 16px rgba(0, 0, 0, 0.3)' 
      : '0 4px 16px rgba(0, 0, 0, 0.04)',
    shadowHeavy: darkMode 
      ? '0 8px 40px rgba(0, 0, 0, 0.6)' 
      : '0 8px 40px rgba(0, 0, 0, 0.08)',
    
    // Colors (keep consistent across themes)
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryLight: '#60a5fa',
    success: '#22c55e',
    successDark: '#16a34a',
    danger: '#ef4444',
    dangerDark: '#dc2626',
    warning: '#f59e0b',
    warningDark: '#d97706',
    info: '#06b6d4',
    infoDark: '#0891b2',
    purple: '#8b5cf6',
    purpleDark: '#7c3aed',
    
    // Glass effect
    glass: darkMode 
      ? 'rgba(20, 20, 40, 0.8)' 
      : 'rgba(255, 255, 255, 0.8)',
  }
}

// ============================================================
// CSS VARIABLES FOR THEME (to be used in index.css or components)
// ============================================================
export const themeCSSVariables = (darkMode) => {
  const colors = getThemeColors(darkMode)
  return `
    --bg-color: ${colors.bg};
    --bg-secondary: ${colors.bgSecondary};
    --bg-tertiary: ${colors.bgTertiary};
    --card-bg: ${colors.cardBg};
    --card-border: ${colors.cardBorder};
    --text-color: ${colors.text};
    --text-muted: ${colors.textMuted};
    --text-light: ${colors.textLight};
    --border-color: ${colors.border};
    --border-light: ${colors.borderLight};
    --input-bg: ${colors.inputBg};
    --input-border: ${colors.inputBorder};
    --input-text: ${colors.inputText};
    --shadow: ${colors.shadow};
    --shadow-light: ${colors.shadowLight};
    --shadow-heavy: ${colors.shadowHeavy};
    --glass: ${colors.glass};
  `
}