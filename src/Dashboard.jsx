import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'
import Sidebar from './components/Sidebar'
import { supabase } from './lib/supabase'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

function Dashboard() {
  const { darkMode } = useTheme()
  const { language, t } = useLanguage()
  const [todaySales, setTodaySales] = useState(0)
  const [todayOrders, setTodayOrders] = useState(0)
  const [activeTables, setActiveTables] = useState(0)
  const [topItems, setTopItems] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [restaurantName, setRestaurantName] = useState('KedaiPOS')
  const [logoUrl, setLogoUrl] = useState('')
  const [dateRange, setDateRange] = useState('week')
  const [chartData, setChartData] = useState({ labels: [], sales: [], orders: [] })
  const [paymentMethodData, setPaymentMethodData] = useState({ cash: 0, tng: 0, bank: 0 })
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [chartType, setChartType] = useState('bar')
  const [peakHoursData, setPeakHoursData] = useState({ labels: [], counts: [] })
  const [topCategoriesData, setTopCategoriesData] = useState({ labels: [], counts: [] })
  const [exporting, setExporting] = useState(false)
  const [logoError, setLogoError] = useState(false)
  
  const dashboardRef = useRef(null)

  async function loadRestaurantInfo() {
    try {
      const { data: nameData } = await supabase.from('settings').select('value').eq('key', 'restaurant_name').single()
      if (nameData?.value) setRestaurantName(nameData.value)
      
      const { data: logoData } = await supabase.from('settings').select('value').eq('key', 'logo_url').single()
      if (logoData?.value) {
        setLogoUrl(logoData.value)
        setLogoError(false)
      } else {
        setLogoUrl('')
      }
    } catch (err) {
      console.error('Error loading restaurant info:', err)
    }
  }

  useEffect(() => {
    loadRestaurantInfo()
    loadDashboard()
    
    const settingsSubscription = supabase
      .channel('settings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        loadRestaurantInfo()
      })
      .subscribe()
    
    return () => settingsSubscription.unsubscribe()
  }, [])

  useEffect(() => {
    let interval
    if (autoRefresh) {
      interval = setInterval(() => {
        loadDashboard()
        toast(t('auto_refresh_notify'), { duration: 2000, icon: '🔄' })

      }, 30000)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [autoRefresh, dateRange])

  function getDateRangeDates(range) {
    const today = new Date()
    if (range === 'today') return [today.toISOString().split('T')[0]]
    else if (range === 'week') {
      const dates = []
      for (let i = 6; i >= 0; i--) { 
        const date = new Date()
        date.setDate(today.getDate() - i)
        dates.push(date.toISOString().split('T')[0])
      }
      return dates
    } else if (range === 'month') {
      const dates = []
      for (let i = 29; i >= 0; i--) { 
        const date = new Date()
        date.setDate(today.getDate() - i)
        dates.push(date.toISOString().split('T')[0])
      }
      return dates
    }
    return []
  }

  async function loadDashboard() {
    setLoading(true)
    try {
      // Only use customer_orders table
      const { data: customerOrders } = await supabase
        .from('customer_orders')
        .select('*')
        .order('created_at', { ascending: false })
      
      const allOrders = customerOrders || []
      
      const dateRangeList = getDateRangeDates(dateRange)
      const filteredOrders = allOrders.filter(o => 
        o.payment_status === 'paid' && 
        o.created_at && 
        dateRangeList.includes(o.created_at.split('T')[0])
      )
      
      const todaySalesTotal = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0)
      setTodaySales(todaySalesTotal)
      setTodayOrders(filteredOrders.length)
      
      // Build chart data
      const labels = []
      const salesData = []
      const ordersData = []
      const dayNames = language === 'bm' ? ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const monthNames = language === 'bm' ? ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      
      if (dateRange === 'week') {
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          const dayOrders = allOrders.filter(o => 
            o.payment_status === 'paid' && 
            o.created_at?.startsWith(dateStr)
          )
          const dayTotal = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
          labels.push(dayNames[date.getDay()])
          salesData.push(dayTotal)
          ordersData.push(dayOrders.length)
        }
      } else if (dateRange === 'month') {
        for (let i = 29; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          const dayOrders = allOrders.filter(o => 
            o.payment_status === 'paid' && 
            o.created_at?.startsWith(dateStr)
          )
          const dayTotal = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
          labels.push(`${date.getDate()} ${monthNames[date.getMonth()]}`)
          salesData.push(dayTotal)
          ordersData.push(dayOrders.length)
        }
      } else {
        labels.push(t('today'))
        const dateStr = new Date().toISOString().split('T')[0]
        const dayOrders = allOrders.filter(o => 
          o.payment_status === 'paid' && 
          o.created_at?.startsWith(dateStr)
        )
        const dayTotal = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
        salesData.push(dayTotal)
        ordersData.push(dayOrders.length)
      }
      
      setChartData({ labels, sales: salesData, orders: ordersData })
      
      // Payment method breakdown
      const paidOrders = allOrders.filter(o => o.payment_status === 'paid')
      const cashTotal = paidOrders.filter(o => o.payment_method === 'cash').reduce((s, o) => s + (o.total || 0), 0)
      const tngTotal = paidOrders.filter(o => o.payment_method === 'tng').reduce((s, o) => s + (o.total || 0), 0)
      const bankTotal = paidOrders.filter(o => o.payment_method === 'bank').reduce((s, o) => s + (o.total || 0), 0)
      setPaymentMethodData({ cash: cashTotal, tng: tngTotal, bank: bankTotal })
      
      // Active tables
      const { data: activeTablesData } = await supabase
        .from('customer_orders')
        .select('table_number')
        .eq('payment_status', 'unpaid')
        .not('table_number', 'eq', 0)
      const uniqueTables = [...new Set(activeTablesData?.map(o => o.table_number) || [])]
      setActiveTables(uniqueTables.length)
      
      // Top items
      const itemCount = {}
      allOrders.forEach(order => { 
        if (order.items && Array.isArray(order.items)) { 
          order.items.forEach(item => { 
            const name = item.name
            itemCount[name] = (itemCount[name] || 0) + (item.quantity || 1)
          }) 
        } 
      })
      const topItemsList = Object.entries(itemCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }))
      setTopItems(topItemsList)
      
      // Recent orders (last 10)
      const recentOrdersList = allOrders
        .filter(o => o.created_at)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10)
      setRecentOrders(recentOrdersList)
      
      // Low stock items
      const { data: menuItems } = await supabase
        .from('menu')
        .select('*')
        .order('stock', { ascending: true })
      const lowStock = (menuItems || [])
        .filter(item => item.stock <= 10 && item.stock > 0)
        .slice(0, 10)
      const outOfStock = (menuItems || [])
        .filter(item => item.stock === 0)
        .slice(0, 10)
      setLowStockItems([...outOfStock, ...lowStock])
      
      // Peak hours (10am - 10pm)
      const todayStr = new Date().toISOString().split('T')[0]
      const todayPaidOrders = allOrders.filter(o => 
        o.payment_status === 'paid' && 
        o.created_at?.startsWith(todayStr)
      )
      const hourCounts = new Array(24).fill(0)
      todayPaidOrders.forEach(order => { 
        if (order.created_at) {
          const hour = new Date(order.created_at).getHours()
          hourCounts[hour]++
        }
      })
      const hourLabels = []
      const hourData = []
      for (let i = 10; i <= 22; i++) { 
        hourLabels.push(`${i}:00`)
        hourData.push(hourCounts[i])
      }
      setPeakHoursData({ labels: hourLabels, counts: hourData })
      
      // Top categories
      const { data: menuWithCategories } = await supabase
        .from('menu')
        .select('name, category')
      const categoryMap = new Map()
      menuWithCategories?.forEach(item => { 
        categoryMap.set(item.name, item.category || 'Lain-lain')
      })
      
      const categoryCount = {}
      allOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const category = categoryMap.get(item.name) || (language === 'bm' ? 'Lain-lain' : 'Others')
            categoryCount[category] = (categoryCount[category] || 0) + (item.quantity || 1)
          })
        }
      })
      const sortedCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
      setTopCategoriesData({ 
        labels: sortedCategories.map(c => c[0]), 
        counts: sortedCategories.map(c => c[1]) 
      })
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error(t('error_updating'))
    }
    setLoading(false)
  }

  const handleManualRefresh = async () => {
    toast.loading(t('loading'), { duration: 1000 })
    await loadRestaurantInfo()
    await loadDashboard()
    toast.success(t('refresh_data'))
  }

  const exportToExcel = () => {
    try {
      const exportData = recentOrders.map(order => ({
        [t('id')]: order.order_number || order.id,
        [t('customer_name')]: order.customer_name || (language === 'bm' ? 'Tetamu' : 'Guest'),
        [t('table_number')]: order.table_number || '-',
        [t('total') + ' (RM)']: order.total?.toFixed(2) || '0.00',
        [t('payment_method')]: order.payment_method === 'cash' ? '💵 Tunai' : order.payment_method === 'tng' ? '📱 TnG' : order.payment_method === 'bank' ? '🏦 Bank' : '-',
        [t('status')]: order.payment_status === 'paid' ? (language === 'bm' ? 'Sudah Bayar' : 'Paid') : (language === 'bm' ? 'Belum Bayar' : 'Unpaid'),
        [t('date')]: order.created_at ? new Date(order.created_at).toLocaleString() : '-'
      }))
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, t('recent_orders'))
      XLSX.writeFile(wb, `dashboard_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Excel ' + (language === 'bm' ? 'dieksport berjaya!' : 'exported successfully!'))
    } catch (error) {
      console.error('Export error:', error)
      toast.error(t('error_updating'))
    }
  }

  const exportToPDF = async () => {
    setExporting(true)
    try {
      const element = dashboardRef.current
      if (!element) { 
        toast.error(t('error_updating'))
        setExporting(false)
        return 
      }
      const canvas = await html2canvas(element, { 
        scale: 2, 
        backgroundColor: darkMode ? '#1a1a2e' : '#f8f9fa', 
        logging: false 
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const imgWidth = 280
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 5, 5, imgWidth, imgHeight)
      pdf.save(`dashboard_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF ' + (language === 'bm' ? 'dieksport berjaya!' : 'exported successfully!'))
    } catch (error) {
      console.error('PDF export error:', error)
      toast.error(t('error_updating'))
    }
    setExporting(false)
  }

  const chartTextColor = darkMode ? '#e0e0e0' : '#333'
  const chartGridColor = darkMode ? '#444' : '#e0e0e0'
  
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { position: 'top', labels: { color: chartTextColor, font: { size: 11 } } }, 
      tooltip: { backgroundColor: darkMode ? '#333' : '#fff', titleColor: darkMode ? '#fff' : '#333', bodyColor: darkMode ? '#fff' : '#333' } 
    },
    scales: { y: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } }, x: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } } }
  }
  
  const salesChartData = {
    labels: chartData.labels,
    datasets: [
      { label: t('sales') + ' (RM)', data: chartData.sales, backgroundColor: 'rgba(34, 197, 94, 0.7)', borderColor: '#22c55e', borderWidth: 1, borderRadius: 8 },
      { label: t('orders'), data: chartData.orders, backgroundColor: 'rgba(59, 130, 246, 0.7)', borderColor: '#3b82f6', borderWidth: 1, borderRadius: 8 }
    ]
  }
  
  const paymentChartData = {
    labels: [t('cash'), t('tng'), t('bank')],
    datasets: [{ data: [paymentMethodData.cash, paymentMethodData.tng, paymentMethodData.bank], backgroundColor: ['#22c55e', '#06b6d4', '#8b5cf6'], borderWidth: 0 }]
  }
  
  const paymentChartOptions = { 
    responsive: true, 
    maintainAspectRatio: false, 
    plugins: { legend: { position: 'bottom', labels: { color: chartTextColor, font: { size: 10 } } } } 
  }
  
  const peakHoursChartData = { 
    labels: peakHoursData.labels, 
    datasets: [{ label: t('orders'), data: peakHoursData.counts, backgroundColor: 'rgba(245, 158, 11, 0.7)', borderColor: '#f59e0b', borderWidth: 1, borderRadius: 8 }] 
  }
  
  const topCategoriesChartData = { 
    labels: topCategoriesData.labels, 
    datasets: [{ data: topCategoriesData.counts, backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'], borderWidth: 0 }] 
  }

  const bgColor = darkMode ? '#0f0f1a' : '#f1f5f9'
  const cardBg = darkMode ? 'rgba(30, 30, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  const textColor = darkMode ? '#f1f5f9' : '#0f172a'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.6)'
  const secondaryBg = darkMode ? 'rgba(30, 30, 46, 0.8)' : 'rgba(248, 250, 252, 0.9)'
  const glassEffect = { background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${borderColor}`, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)' }

  if (loading) {
    return (
      <Sidebar>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div className="spinner"></div>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      <div ref={dashboardRef}>
        <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', background: bgColor, minHeight: '100vh' }}>
          
          {/* Header Section */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            
            {/* Logo Display */}
            <div style={{ marginBottom: '15px', minHeight: '80px' }}>
              {logoUrl && !logoError ? (
                <img 
                  src={logoUrl} 
                  alt={restaurantName} 
                  style={{ 
                    height: '70px', 
                    width: 'auto', 
                    maxWidth: '200px',
                    objectFit: 'contain', 
                    borderRadius: '12px',
                    display: 'inline-block',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }} 
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div style={{ 
                  width: '70px', 
                  height: '70px', 
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
                }}>
                  🏪
                </div>
              )}
            </div>
            
            <h1 style={{ margin: '10px 0 5px 0', color: textColor, fontSize: '28px', fontWeight: 'bold' }}>
              {restaurantName}
            </h1>
            <p style={{ color: textMuted, fontSize: '14px' }}>{t('dashboard')} {t('summary')}</p>
            
            {/* Control Panel */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '20px', padding: '12px 20px', background: secondaryBg, borderRadius: '60px' }}>
              <select value={dateRange} onChange={(e) => { setDateRange(e.target.value); setTimeout(() => loadDashboard(), 100) }} style={{ padding: '8px 20px', borderRadius: '40px', border: `1px solid ${borderColor}`, background: cardBg, color: textColor, cursor: 'pointer' }}>
                <option value="today">📅 {t('today')}</option>
                <option value="week">📊 {t('week')}</option>
                <option value="month">📈 {t('month')}</option>
              </select>
              <select value={chartType} onChange={(e) => setChartType(e.target.value)} style={{ padding: '8px 20px', borderRadius: '40px', border: `1px solid ${borderColor}`, background: cardBg, color: textColor, cursor: 'pointer' }}>
                <option value="bar">📊 Bar {t('chart')}</option>
                <option value="line">📈 Line {t('chart')}</option>
              </select>
              <button onClick={exportToExcel} disabled={exporting} style={{ padding: '8px 20px', borderRadius: '40px', background: '#22c55e', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>📎 Export Excel</button>
              <button onClick={exportToPDF} disabled={exporting} style={{ padding: '8px 20px', borderRadius: '40px', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>📄 Export PDF</button>
              <button onClick={handleManualRefresh} style={{ padding: '8px 20px', borderRadius: '40px', background: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>🔄 {t('refresh_data')}</button>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                <span style={{ fontSize: '12px', color: textColor }}>🔄 {t('auto_refresh')}</span>
              </label>
            </div>
            <p style={{ fontSize: '11px', color: textMuted, marginTop: '12px' }}>{t('last_updated')}: {lastUpdated.toLocaleTimeString()}</p>
          </div>

          {/* Low Stock Alert */}
          {lowStockItems.length > 0 && (
            <div style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderRadius: '28px', padding: '20px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '28px' }}>⚠️</span>
                <h2 style={{ margin: 0, fontSize: '18px', color: 'white', fontWeight: 'bold' }}>{t('low_stock_alert')}</h2>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {lowStockItems.map(item => (
                  <div key={item.id} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '40px', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'white' }}>{item.name}</span>
                    <span style={{ background: item.stock === 0 ? '#dc3545' : '#f59e0b', color: 'white', padding: '2px 10px', borderRadius: '30px', fontSize: '11px', fontWeight: 'bold' }}>
                      {item.stock === 0 ? (language === 'bm' ? 'Habis Stok' : 'Out of Stock') : `${item.stock} ${t('left')}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            {[
              { icon: '💰', label: 'today_sales', value: `RM ${todaySales.toFixed(2)}`, gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
              { icon: '📋', label: 'total_orders', value: `${todayOrders} ${t('orders')}`, gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
              { icon: '🪑', label: 'active_tables', value: `${activeTables} ${t('tables')}`, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
              { icon: '🍽️', label: 'popular_items', value: `${topItems.length} ${t('items')}`, gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }
            ].map((card, idx) => (
              <div key={idx} style={{ background: card.gradient, borderRadius: '28px', padding: '24px', color: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', transition: 'transform 0.25s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ fontSize: '44px', marginBottom: '12px' }}>{card.icon}</div>
                <div style={{ fontSize: '13px', opacity: 0.9 }}>{t(card.label)}</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px' }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '28px' }}>
            <div style={{ ...glassEffect, borderRadius: '28px', padding: '20px' }}>
              <h2 style={{ marginTop: 0, marginBottom: '16px', color: textColor, fontSize: '17px', fontWeight: 'bold' }}>📊 {t('sales_trend')}</h2>
              <div style={{ height: '280px' }}>{chartType === 'bar' ? <Bar data={salesChartData} options={barChartOptions} /> : <Line data={salesChartData} options={barChartOptions} />}</div>
            </div>
            <div style={{ ...glassEffect, borderRadius: '28px', padding: '20px' }}>
              <h2 style={{ marginTop: 0, marginBottom: '16px', color: textColor, fontSize: '17px', fontWeight: 'bold' }}>💰 {t('payment_breakdown')}</h2>
              <div style={{ height: '220px' }}><Doughnut data={paymentChartData} options={paymentChartOptions} /></div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px', flexWrap: 'wrap' }}>
                <div><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#22c55e', borderRadius: '2px', marginRight: '6px' }}></span> {t('cash')}: RM {paymentMethodData.cash.toFixed(2)}</div>
                <div><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#06b6d4', borderRadius: '2px', marginRight: '6px' }}></span> {t('tng')}: RM {paymentMethodData.tng.toFixed(2)}</div>
                <div><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#8b5cf6', borderRadius: '2px', marginRight: '6px' }}></span> {t('bank')}: RM {paymentMethodData.bank.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px', marginBottom: '28px' }}>
            <div style={{ ...glassEffect, borderRadius: '28px', padding: '20px' }}>
              <h2 style={{ marginTop: 0, marginBottom: '16px', color: textColor, fontSize: '17px', fontWeight: 'bold' }}>⏰ {t('peak_hours')}</h2>
              <div style={{ height: '240px' }}><Bar data={peakHoursChartData} options={barChartOptions} /></div>
            </div>
            <div style={{ ...glassEffect, borderRadius: '28px', padding: '20px' }}>
              <h2 style={{ marginTop: 0, marginBottom: '16px', color: textColor, fontSize: '17px', fontWeight: 'bold' }}>🏷️ {t('top_categories')}</h2>
              <div style={{ height: '240px' }}><Doughnut data={topCategoriesChartData} options={paymentChartOptions} /></div>
            </div>
          </div>

          {/* Popular Items & Recent Orders */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '28px' }}>
            <div style={{ flex: 1, ...glassEffect, borderRadius: '28px', padding: '20px' }}>
              <h2 style={{ marginTop: 0, marginBottom: '20px', color: textColor, fontSize: '17px', fontWeight: 'bold' }}>🔥 {t('popular_items')}</h2>
              {topItems.length === 0 ? <p style={{ textAlign: 'center', padding: '40px', color: textMuted }}>{t('no_data')}</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {topItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: secondaryBg, borderRadius: '20px' }}>
                      <div><span style={{ display: 'inline-block', width: '28px', height: '28px', background: idx < 3 ? '#f59e0b' : '#94a3b8', color: '#fff', borderRadius: '50%', textAlign: 'center', lineHeight: '28px', fontWeight: 'bold', fontSize: '13px', marginRight: '14px' }}>{idx + 1}</span><strong style={{ color: textColor }}>{item.name}</strong></div>
                      <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{item.count} {t('times')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ flex: 1.5, ...glassEffect, borderRadius: '28px', padding: '20px' }}>
              <h2 style={{ marginTop: 0, marginBottom: '20px', color: textColor, fontSize: '17px', fontWeight: 'bold' }}>📋 {t('recent_orders')}</h2>
              {recentOrders.length === 0 ? <p style={{ textAlign: 'center', padding: '40px', color: textMuted }}>{t('no_data')}</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                  {recentOrders.map(order => (
                    <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: secondaryBg, borderRadius: '20px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: textColor }}>{order.customer_name || (language === 'bm' ? 'Tetamu' : 'Guest')}</div>
                        <div style={{ fontSize: '11px', color: textMuted, marginTop: '4px' }}>{order.order_type === 'take_away' ? `🥡 ${t('take_away')}` : (order.table_number ? `${t('table')} ${order.table_number}` : 'POS')} • {order.created_at ? new Date(order.created_at).toLocaleTimeString() : '-'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', color: '#22c55e', fontSize: '16px' }}>RM {order.total?.toFixed(2) || '0.00'}</div>
                        <div style={{ fontSize: '11px', marginTop: '4px' }}>{order.payment_status === 'paid' ? <span style={{ color: '#22c55e' }}>✅ {t('paid')}</span> : <span style={{ color: '#ef4444' }}>⏳ {t('unpaid')}</span>}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style>
        {`
          .spinner { width: 48px; height: 48px; border: 4px solid rgba(59,130,246,0.2); border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
          @keyframes spin { to { transform: rotate(360deg); } }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: ${darkMode ? '#2a2a3e' : '#e2e8f0'}; border-radius: 10px; }
          ::-webkit-scrollbar-thumb { background: ${darkMode ? '#555' : '#94a3b8'}; border-radius: 10px; }
        `}
      </style>
    </Sidebar>
  )
}

export default Dashboard