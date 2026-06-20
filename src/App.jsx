import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect, Suspense, lazy } from 'react'
import { ThemeProvider, useTheme } from './context/ThemeContext'  // 👈 Tambah useTheme
import { LanguageProvider, useLanguage } from './context/LanguageContext'  // 👈 Tambah useLanguage
import toast from 'react-hot-toast'

// Lazy load components for better performance
const StaffApp = lazy(() => import('./StaffApp'))
const CustomerMenu = lazy(() => import('./CustomerMenu'))
const CustomerDisplay = lazy(() => import('./CustomerDisplay'))
const AdminReport = lazy(() => import('./AdminReport'))
const ProtectedRoute = lazy(() => import('./ProtectedRoute'))
const ManageMenu = lazy(() => import('./ManageMenu'))
const ManageCategories = lazy(() => import('./ManageCategories'))
const ManageStaff = lazy(() => import('./ManageStaff'))
const ManageSettings = lazy(() => import('./ManageSettings'))
const ManageTables = lazy(() => import('./ManageTables'))
const TableQRs = lazy(() => import('./TableQRs'))
const KitchenApp = lazy(() => import('./KitchenApp'))
const Dashboard = lazy(() => import('./Dashboard'))
const Login = lazy(() => import('./Login'))
const TrackOrder = lazy(() => import('./TrackOrder'))

// ============================================================
// LOADING COMPONENT
// ============================================================
function LoadingSpinner() {
  const { darkMode } = useTheme()
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: darkMode ? '#0a0a16' : '#f0f4f8',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div className="spinner-global"></div>
      <p style={{
        color: darkMode ? '#94a3b8' : '#64748b',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        Loading...
      </p>
      <style>
        {`
          .spinner-global {
            width: 48px;
            height: 48px;
            border: 4px solid rgba(59,130,246,0.15);
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin-global 1s linear infinite;
          }
          @keyframes spin-global {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

// ============================================================
// WRAPPED COMPONENT WITH CONTEXTS
// ============================================================
function AppWrapper() {
  const { darkMode } = useTheme()
  const { language } = useLanguage()  // 👈 Tambah ini
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(false)

  // Check mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Track page views
  useEffect(() => {
    console.log(`📍 Page: ${location.pathname}`)
  }, [location])

  // ============================================================
  // COMPLETE TRANSLATIONS FOR APP
  // ============================================================
  const translations = {
    app_title: { en: 'KedaiPOS - Restaurant POS System', ms: 'KedaiPOS - Sistem POS Restoran' },
    loading: { en: 'Loading...', ms: 'Memuatkan...' },
    page_not_found: { en: 'Page Not Found', ms: 'Halaman Tidak Dijumpai' },
    go_back: { en: '← Go Back', ms: '← Kembali' },
    go_home: { en: '🏠 Go Home', ms: '🏠 Ke Laman Utama' },
  }

  const t = (key) => {
    if (!translations[key]) return key
    return language === 'en' ? translations[key].en : translations[key].ms
  }

  // ============================================================
  // THEME COLORS
  // ============================================================
  const bgColor = darkMode ? '#0a0a16' : '#f0f4f8'
  const textColor = darkMode ? '#f1f5f9' : '#0f172a'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.5)'
  const cardBg = darkMode ? 'rgba(20, 20, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  
  const glassEffect = {
    background: cardBg,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${borderColor}`,
    boxShadow: darkMode 
      ? '0 8px 40px rgba(0, 0, 0, 0.5)' 
      : '0 8px 40px rgba(0, 0, 0, 0.06)'
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/login" element={<Login />} />
        <Route path="/menu" element={<CustomerMenu />} />
        <Route path="/display" element={<CustomerDisplay />} />
        <Route path="/track" element={<TrackOrder />} />
        
        {/* ===== PROTECTED ROUTES ===== */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/staff" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <StaffApp />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/kitchen" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'kitchen']}>
              <KitchenApp />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin-report" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminReport />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/manage-menu" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageMenu />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/manage-categories" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageCategories />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/manage-staff" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageStaff />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/manage-tables" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageTables />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/table-qrs" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TableQRs />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/manage-settings" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageSettings />
            </ProtectedRoute>
          } 
        />
        
        {/* ===== DEFAULT ROUTES ===== */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* ===== 404 NOT FOUND ===== */}
        <Route 
          path="*" 
          element={
            <div style={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              background: bgColor,
              padding: isMobile ? '20px' : '40px',
              textAlign: 'center'
            }}>
              <div style={{
                ...glassEffect,
                borderRadius: '28px',
                padding: isMobile ? '32px' : '48px',
                maxWidth: '420px',
                width: '100%'
              }}>
                <div style={{ fontSize: isMobile ? '64px' : '80px', marginBottom: '16px' }}>
                  🔍
                </div>
                <h1 style={{
                  color: textColor,
                  fontSize: isMobile ? '24px' : '32px',
                  fontWeight: 'bold',
                  margin: '0 0 8px 0'
                }}>
                  404
                </h1>
                <p style={{
                  color: textMuted,
                  fontSize: isMobile ? '14px' : '16px',
                  margin: '0 0 24px 0'
                }}>
                  {t('page_not_found')}
                </p>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => window.history.back()}
                    style={{
                      padding: isMobile ? '10px 20px' : '12px 28px',
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '40px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: isMobile ? '13px' : '14px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.97)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {t('go_back')}
                  </button>
                  <button
                    onClick={() => window.location.href = '/'}
                    style={{
                      padding: isMobile ? '10px 20px' : '12px 28px',
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '40px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: isMobile ? '13px' : '14px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.97)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {t('go_home')}
                  </button>
                </div>
              </div>
            </div>
          } 
        />
      </Routes>
    </Suspense>
  )
}

// ============================================================
// MAIN APP - WITH CONTEXT PROVIDERS
// ============================================================
function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppWrapper />
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App