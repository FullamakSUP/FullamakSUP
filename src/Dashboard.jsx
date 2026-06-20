import { useState, useEffect } from 'react'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'
import Sidebar from './components/Sidebar'
import { supabase } from './lib/supabase'

function Dashboard() {
  const { darkMode } = useTheme()
  const { language } = useLanguage()
  const [isMobile, setIsMobile] = useState(false)

  // ===== STATE =====
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    totalItems: 0,
    peakHour: '--'
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [topItems, setTopItems] = useState([])
  const [weeklySales, setWeeklySales] = useState([])
  const [peakHours, setPeakHours] = useState([])

  // ===== CHECK MOBILE =====
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // ===== THEME COLORS =====
  const bgColor = darkMode ? '#0f0f1a' : '#f1f5f9'
  const cardBg = darkMode ? 'rgba(30, 30, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  const textColor = darkMode ? '#f1f5f9' : '#0f172a'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.6)'
  const secondaryBg = darkMode ? 'rgba(30, 30, 46, 0.8)' : 'rgba(248, 250, 252, 0.9)'
  
  const glassEffect = {
    background: cardBg,
    backdropFilter: 'blur(12px)',
    border: `1px solid ${borderColor}`,
    boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.08)'
  }

  // ============================================================
  // TRANSLATIONS
  // ============================================================
  const t = (key) => {
    const translations = {
      dashboard: { en: 'Dashboard', ms: 'Papan Pemuka' },
      today_revenue: { en: "Today's Revenue", ms: 'Jualan Hari Ini' },
      today_orders: { en: "Today's Orders", ms: 'Pesanan Hari Ini' },
      total_items: { en: 'Total Items', ms: 'Jumlah Item' },
      peak_hour: { en: 'Peak Hour', ms: 'Waktu Puncak' },
      weekly_sales: { en: 'Weekly Sales', ms: 'Jualan Mingguan' },
      top_items: { en: 'Top Menu Items', ms: 'Menu Popular' },
      recent_orders: { en: 'Recent Orders', ms: 'Pesanan Terkini' },
      peak_hours: { en: 'Peak Hours', ms: 'Waktu Sibuk' },
      no_orders: { en: 'No orders yet', ms: 'Tiada pesanan lagi' },
      table: { en: 'Table', ms: 'Meja' },
      takeaway: { en: 'Takeaway', ms: 'Bungkus' },
      pending: { en: 'Pending', ms: 'Menunggu' },
      preparing: { en: 'Preparing', ms: 'Sedang Masak' },
      ready: { en: 'Ready', ms: 'Sedia' },
      paid: { en: 'Paid', ms: 'Selesai' },
    }
    return translations[key]?.[language === 'bm' ? 'ms' : 'en'] || key
  }

  // ============================================================
  // LOAD DATA
  // ============================================================
  useEffect(() => {
    loadDashboardData()
    
    const subscription = supabase
      .channel('dashboard-orders')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'customer_orders' }, 
        () => loadDashboardData()
      )
      .subscribe()
    
    return () => subscription.unsubscribe()
  }, [])

  async function loadDashboardData() {
    setLoading(true)
    await Promise.all([
      loadStats(),
      loadRecentOrders(),
      loadTopItems(),
      loadWeeklySales(),
      loadPeakHours()
    ])
    setLoading(false)
  }

  // ============================================================
  // LOAD STATS
  // ============================================================
  async function loadStats() {
    const today = new Date().toISOString().split('T')[0]
    
    const { data: todayOrders } = await supabase
      .from('customer_orders')
      .select('total, payment_status, items')
      .gte('created_at', today)
      .eq('payment_status', 'paid')
    
    const revenue = todayOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0
    const totalItems = todayOrders?.reduce((sum, o) => sum + (o.items?.length || 0), 0) || 0
    
    const { data: allTodayOrders } = await supabase
      .from('customer_orders')
      .select('id, created_at')
      .gte('created_at', today)
    
    const hours = {}
    allTodayOrders?.forEach(order => {
      const hour = new Date(order.created_at).getHours()
      hours[hour] = (hours[hour] || 0) + 1
    })
    
    let peakHour = '--'
    let maxCount = 0
    for (const [hour, count] of Object.entries(hours)) {
      if (count > maxCount) {
        maxCount = count
        peakHour = `${hour}:00`
      }
    }
    
    setStats({
      todayRevenue: revenue,
      todayOrders: allTodayOrders?.length || 0,
      totalItems: totalItems,
      peakHour: peakHour
    })
  }

  // ============================================================
  // LOAD RECENT ORDERS
  // ============================================================
  async function loadRecentOrders() {
    const { data } = await supabase
      .from('customer_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    setRecentOrders(data || [])
  }

  // ============================================================
  // LOAD TOP ITEMS
  // ============================================================
  async function loadTopItems() {
    const { data } = await supabase
      .from('customer_orders')
      .select('items')
      .eq('payment_status', 'paid')
    
    const itemCount = {}
    data?.forEach(order => {
      order.items?.forEach(item => {
        const name = item.name.replace(/ \([^)]*\)/, '').trim()
        itemCount[name] = (itemCount[name] || 0) + (item.quantity || 1)
      })
    })
    
    const sorted = Object.entries(itemCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))
    
    setTopItems(sorted)
  }

  // ============================================================
  // LOAD WEEKLY SALES
  // ============================================================
  async function loadWeeklySales() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = new Date()
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 6)
    
    const { data } = await supabase
      .from('customer_orders')
      .select('total, created_at')
      .gte('created_at', weekAgo.toISOString().split('T')[0])
      .eq('payment_status', 'paid')
    
    const sales = {}
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekAgo)
      date.setDate(date.getDate() + i)
      const key = date.toISOString().split('T')[0]
      sales[key] = 0
    }
    
    data?.forEach(order => {
      const key = order.created_at.split('T')[0]
      if (sales[key] !== undefined) {
        sales[key] += order.total || 0
      }
    })
    
    const result = Object.entries(sales).map(([date, total]) => ({
      day: days[new Date(date).getDay()],
      total: total
    }))
    
    setWeeklySales(result)
  }

  // ============================================================
  // LOAD PEAK HOURS
  // ============================================================
  async function loadPeakHours() {
    const today = new Date().toISOString().split('T')[0]
    
    const { data } = await supabase
      .from('customer_orders')
      .select('created_at')
      .gte('created_at', today)
    
    const hours = {}
    for (let i = 8; i <= 22; i++) {
      hours[i] = 0
    }
    
    data?.forEach(order => {
      const hour = new Date(order.created_at).getHours()
      if (hours[hour] !== undefined) {
        hours[hour]++
      }
    })
    
    const result = Object.entries(hours).map(([hour, count]) => ({
      hour: parseInt(hour),
      count: count
    }))
    
    setPeakHours(result)
  }

  // ============================================================
  // HELPERS
  // ============================================================
  const formatMoney = (amount) => {
    return `RM ${amount.toFixed(2)}`
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#ef4444'
      case 'preparing': return '#f59e0b'
      case 'ready': return '#22c55e'
      case 'paid': return '#3b82f6'
      default: return '#64748b'
    }
  }

  const getStatusLabel = (status) => {
    switch(status) {
      case 'pending': return t('pending')
      case 'preparing': return t('preparing')
      case 'ready': return t('ready')
      case 'paid': return t('paid')
      default: return status
    }
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getOrderType = (order) => {
    return order.order_type === 'take_away' ? '🥡 ' + t('takeaway') : '🍽️ ' + t('table') + ' ' + (order.table_number || '?')
  }

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return (
      <Sidebar>
        <div style={{ 
          padding: '24px', 
          maxWidth: '1400px', 
          margin: '0 auto', 
          background: bgColor, 
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div className="spinner"></div>
          <style>{`
            .spinner {
              width: 48px;
              height: 48px;
              border: 4px solid rgba(59,130,246,0.15);
              border-top-color: #3b82f6;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      </Sidebar>
    )
  }

  const maxSales = Math.max(...weeklySales.map(d => d.total), 1)
  const maxPeak = Math.max(...peakHours.map(h => h.count), 1)

  return (
    <Sidebar>
      <div style={{ 
        padding: isMobile ? '16px' : '24px', 
        maxWidth: '1400px', 
        margin: '0 auto', 
        background: bgColor, 
        minHeight: '100vh' 
      }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ 
            color: textColor, 
            fontSize: isMobile ? '24px' : '30px', 
            fontWeight: 'bold',
            margin: 0
          }}>
            📊 {t('dashboard')}
          </h1>
          <p style={{ color: textMuted, marginTop: '4px', fontSize: '14px' }}>
            {language === 'bm' ? 'Ringkasan prestasi restoran anda' : 'Your restaurant performance summary'}
          </p>
        </div>

        {/* ========================================================== */}
        {/* STATS CARDS */}
        {/* ========================================================== */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ 
            ...glassEffect, 
            borderRadius: '20px', 
            padding: isMobile ? '16px' : '20px',
            borderLeft: '4px solid #3b82f6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                background: 'rgba(59,130,246,0.15)', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                💰
              </div>
              <div>
                <div style={{ fontSize: '12px', color: textMuted }}>{t('today_revenue')}</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#22c55e' }}>
                  {formatMoney(stats.todayRevenue)}
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ 
            ...glassEffect, 
            borderRadius: '20px', 
            padding: isMobile ? '16px' : '20px',
            borderLeft: '4px solid #f59e0b'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                background: 'rgba(245,158,11,0.15)', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                🍽️
              </div>
              <div>
                <div style={{ fontSize: '12px', color: textMuted }}>{t('today_orders')}</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: textColor }}>
                  {stats.todayOrders}
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ 
            ...glassEffect, 
            borderRadius: '20px', 
            padding: isMobile ? '16px' : '20px',
            borderLeft: '4px solid #8b5cf6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                background: 'rgba(139,92,246,0.15)', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                📦
              </div>
              <div>
                <div style={{ fontSize: '12px', color: textMuted }}>{t('total_items')}</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: textColor }}>
                  {stats.totalItems}
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ 
            ...glassEffect, 
            borderRadius: '20px', 
            padding: isMobile ? '16px' : '20px',
            borderLeft: '4px solid #ef4444'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                background: 'rgba(239,68,68,0.15)', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                ⏰
              </div>
              <div>
                <div style={{ fontSize: '12px', color: textMuted }}>{t('peak_hour')}</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: textColor }}>
                  {stats.peakHour}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* SALES CHART + TOP ITEMS */}
        {/* ========================================================== */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
          gap: '20px',
          marginBottom: '24px'
        }}>
          {/* Sales Chart */}
          <div style={{ 
            ...glassEffect, 
            borderRadius: '20px', 
            padding: isMobile ? '16px' : '20px' 
          }}>
            <h3 style={{ 
              color: textColor, 
              fontSize: '16px', 
              fontWeight: 'bold',
              margin: '0 0 16px 0'
            }}>
              📈 {t('weekly_sales')}
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '180px', gap: '8px' }}>
              {weeklySales.map((day, index) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{
                    width: '100%',
                    height: `${Math.max((day.total / maxSales) * 160, 4)}px`,
                    background: 'linear-gradient(180deg, #3b82f6, #2563eb)',
                    borderRadius: '6px 6px 0 0',
                    transition: 'height 0.5s ease',
                    minHeight: '4px'
                  }} />
                  <div style={{ fontSize: '11px', color: textMuted, marginTop: '6px' }}>
                    {day.day}
                  </div>
                  <div style={{ fontSize: '10px', color: '#22c55e', fontWeight: 'bold' }}>
                    {day.total > 0 ? `RM${day.total}` : '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Items */}
          <div style={{ 
            ...glassEffect, 
            borderRadius: '20px', 
            padding: isMobile ? '16px' : '20px' 
          }}>
            <h3 style={{ 
              color: textColor, 
              fontSize: '16px', 
              fontWeight: 'bold',
              margin: '0 0 16px 0'
            }}>
              🏆 {t('top_items')}
            </h3>
            {topItems.length === 0 ? (
              <p style={{ color: textMuted, textAlign: 'center', padding: '20px 0' }}>
                {t('no_orders')}
              </p>
            ) : (
              <div>
                {topItems.map((item, index) => {
                  const maxCount = topItems[0]?.count || 1
                  const percentage = (item.count / maxCount) * 100
                  const colors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#22c55e', '#ef4444']
                  return (
                    <div key={index} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: textColor, fontSize: '13px' }}>
                          {index + 1}. {item.name}
                        </span>
                        <span style={{ color: textMuted, fontSize: '12px' }}>{item.count}x</span>
                      </div>
                      <div style={{ 
                        height: '6px', 
                        background: secondaryBg, 
                        borderRadius: '10px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${percentage}%`,
                          background: colors[index % colors.length],
                          borderRadius: '10px',
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================== */}
        {/* RECENT ORDERS + PEAK HOURS */}
        {/* ========================================================== */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
          gap: '20px',
          marginBottom: '24px'
        }}>
          {/* Recent Orders */}
          <div style={{ 
            ...glassEffect, 
            borderRadius: '20px', 
            padding: isMobile ? '16px' : '20px' 
          }}>
            <h3 style={{ 
              color: textColor, 
              fontSize: '16px', 
              fontWeight: 'bold',
              margin: '0 0 16px 0'
            }}>
              🆕 {t('recent_orders')}
            </h3>
            {recentOrders.length === 0 ? (
              <p style={{ color: textMuted, textAlign: 'center', padding: '20px 0' }}>
                {t('no_orders')}
              </p>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {recentOrders.map(order => (
                  <div key={order.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: `1px solid ${borderColor}`,
                    gap: '8px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: textMuted }}>
                          {order.order_number || `ORD-${order.id}`}
                        </span>
                        <span style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: getStatusColor(order.status),
                          display: 'inline-block'
                        }} />
                        <span style={{ fontSize: '10px', color: textMuted }}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: textColor }}>
                        {getOrderType(order)} • {order.customer_name || 'Guest'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#22c55e' }}>
                        RM {order.total?.toFixed(2) || '0.00'}
                      </div>
                      <div style={{ fontSize: '10px', color: textMuted }}>
                        {formatTime(order.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Peak Hours */}
          <div style={{ 
            ...glassEffect, 
            borderRadius: '20px', 
            padding: isMobile ? '16px' : '20px' 
          }}>
            <h3 style={{ 
              color: textColor, 
              fontSize: '16px', 
              fontWeight: 'bold',
              margin: '0 0 16px 0'
            }}>
              ⏰ {t('peak_hours')}
            </h3>
            {peakHours.every(h => h.count === 0) ? (
              <p style={{ color: textMuted, textAlign: 'center', padding: '20px 0' }}>
                {t('no_orders')}
              </p>
            ) : (
              <div>
                {peakHours.map((hour) => {
                  const percentage = (hour.count / maxPeak) * 100
                  const isPeak = hour.count === maxPeak && maxPeak > 0
                  return (
                    <div key={hour.hour} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginBottom: '6px'
                    }}>
                      <div style={{ 
                        width: '40px', 
                        fontSize: '11px', 
                        color: textMuted,
                        textAlign: 'right'
                      }}>
                        {hour.hour}:00
                      </div>
                      <div style={{ 
                        flex: 1, 
                        height: '16px', 
                        background: secondaryBg, 
                        borderRadius: '10px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${percentage}%`,
                          background: isPeak ? 'linear-gradient(90deg, #f59e0b, #ea580c)' : 'linear-gradient(90deg, #3b82f6, #2563eb)',
                          borderRadius: '10px',
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                      <div style={{ 
                        width: '30px', 
                        fontSize: '11px', 
                        color: textMuted,
                        textAlign: 'left'
                      }}>
                        {hour.count > 0 ? `${hour.count}` : '-'}
                      </div>
                    </div>
                  )
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
            ::-webkit-scrollbar {
              width: 6px;
              height: 6px;
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
    </Sidebar>
  )
}

export default Dashboard