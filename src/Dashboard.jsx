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
  const { language } = useLanguage()
  
  // ===== STATE =====
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
  const [isMobile, setIsMobile] = useState(false) // ✅ ADA
  
  const dashboardRef = useRef(null)

  // ===== CHECK MOBILE - FIXED =====
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // ===== TRANSLATIONS =====
  const translations = {
    dashboard: { en: 'Dashboard', ms: 'Papan Pemuka' },
    summary: { en: 'Summary', ms: 'Ringkasan' },
    today_sales: { en: "Today's Sales", ms: 'Jualan Hari Ini' },
    total_orders: { en: 'Total Orders', ms: 'Jumlah Pesanan' },
    active_tables: { en: 'Active Tables', ms: 'Meja Aktif' },
    popular_items: { en: 'Popular Items', ms: 'Item Popular' },
    sales_trend: { en: 'Sales Trend', ms: 'Trend Jualan' },
    payment_breakdown: { en: 'Payment Breakdown', ms: 'Pecahan Bayaran' },
    peak_hours: { en: 'Peak Hours', ms: 'Waktu Sibuk' },
    top_categories: { en: 'Top Categories', ms: 'Kategori Teratas' },
    recent_orders: { en: 'Recent Orders', ms: 'Pesanan Terkini' },
    cash: { en: 'Cash', ms: 'Tunai' },
    tng: { en: 'TnG', ms: 'TnG' },
    bank: { en: 'Bank', ms: 'Bank' },
    paid: { en: 'Paid', ms: 'Sudah Bayar' },
    unpaid: { en: 'Unpaid', ms: 'Belum Bayar' },
    left: { en: 'left', ms: 'tinggal' },
    times: { en: 'times', ms: 'kali' },
    tables: { en: 'tables', ms: 'meja' },
    items: { en: 'items', ms: 'item' },
    orders: { en: 'orders', ms: 'pesanan' },
    today: { en: 'Today', ms: 'Hari Ini' },
    week: { en: 'Week', ms: 'Minggu' },
    month: { en: 'Month', ms: 'Bulan' },
    chart: { en: 'Chart', ms: 'Carta' },
    refresh_data: { en: 'Refresh Data', ms: 'Muat Semula' },
    auto_refresh: { en: 'Auto Refresh', ms: 'Auto Muat Semula' },
    auto_refresh_notify: { en: 'Auto refreshed!', ms: 'Auto muat semula!' },
    export_excel: { en: 'Export Excel', ms: 'Eksport Excel' },
    export_pdf: { en: 'Export PDF', ms: 'Eksport PDF' },
    low_stock_alert: { en: 'Low Stock Alert', ms: 'Amaran Stok Rendah' },
    out_of_stock: { en: 'Out of Stock', ms: 'Habis Stok' },
    id: { en: 'ID', ms: 'ID' },
    customer_name: { en: 'Customer', ms: 'Pelanggan' },
    table_number: { en: 'Table', ms: 'Meja' },
    total: { en: 'Total', ms: 'Jumlah' },
    payment_method: { en: 'Payment Method', ms: 'Kaedah Bayaran' },
    status: { en: 'Status', ms: 'Status' },
    date: { en: 'Date', ms: 'Tarikh' },
    take_away: { en: 'Take Away', ms: 'Bungkus' },
    table: { en: 'Table', ms: 'Meja' },
    sales: { en: 'Sales', ms: 'Jualan' },
    guest: { en: 'Guest', ms: 'Tetamu' },
    loading_text: { en: 'Loading...', ms: 'Memuatkan...' },
    no_data: { en: 'No data available', ms: 'Tiada data' },
    error_updating: { en: 'Error updating data!', ms: 'Ralat mengemaskini data!' },
    excel_exported: { en: 'Excel exported successfully!', ms: 'Excel berjaya dieksport!' },
    pdf_exported: { en: 'PDF exported successfully!', ms: 'PDF berjaya dieksport!' },
    export_failed: { en: 'Export failed!', ms: 'Eksport gagal!' },
    last_updated: { en: 'Last updated', ms: 'Kemaskini terakhir' },
  }

  const t = (key) => {
    if (!translations[key]) return key
    return language === 'en' ? translations[key].en : translations[key].ms
  }

  // ===== THEME COLORS =====
  const bgColor = darkMode ? '#0a0a16' : '#f1f5f9'
  const cardBg = darkMode ? 'rgba(20, 20, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  const textColor = darkMode ? '#e8edf5' : '#1e293b'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.5)'
  const secondaryBg = darkMode ? 'rgba(30, 30, 50, 0.6)' : 'rgba(248, 250, 252, 0.8)'
  
  const glassEffect = {
    background: cardBg,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${borderColor}`,
    boxShadow: darkMode 
      ? '0 8px 40px rgba(0,0,0,0.5)' 
      : '0 8px 40px rgba(0,0,0,0.06)'
  }

  // Chart colors
  const chartTextColor = darkMode ? '#e2e8f0' : '#1e293b'
  const chartGridColor = darkMode ? 'rgba(71, 85, 105, 0.4)' : 'rgba(203, 213, 225, 0.5)'
  
  const chartColors = {
    green: 'rgba(34, 197, 94, 0.8)',
    greenBorder: '#22c55e',
    blue: 'rgba(59, 130, 246, 0.8)',
    blueBorder: '#3b82f6',
    orange: 'rgba(245, 158, 11, 0.8)',
    orangeBorder: '#f59e0b',
    purple: 'rgba(139, 92, 246, 0.8)',
    purpleBorder: '#8b5cf6',
    red: 'rgba(239, 68, 68, 0.8)',
    redBorder: '#ef4444',
  }

  // ===== LOAD FUNCTIONS =====
  async function loadRestaurantInfo() {
    try {
      const { data: nameData } = await supabase.from('settings').select('value').eq('key', 'restaurant_name').single()
      if (nameData) setRestaurantName(nameData.value)
      
      const { data: logoData } = await supabase.from('settings').select('value').eq('key', 'logo_url').single()
      if (logoData && logoData.value) {
        setLogoUrl(logoData.value)
        setLogoError(false)
      } else {
        setLogoUrl('')
      }
    } catch (err) {
      console.error('Error loading restaurant info:', err)
    }
  }

  function getDateRangeDates(range) {
    const today = new Date()
    const dates = []
    
    if (range === 'today') {
      dates.push(today.toISOString().split('T')[0])
    } else if (range === 'week') {
      for (let i = 6; i >= 0; i--) { 
        const date = new Date()
        date.setDate(today.getDate() - i)
        dates.push(date.toISOString().split('T')[0])
      }
    } else if (range === 'month') {
      for (let i = 29; i >= 0; i--) { 
        const date = new Date()
        date.setDate(today.getDate() - i)
        dates.push(date.toISOString().split('T')[0])
      }
    }
    return dates
  }

  async function loadDashboard() {
    setLoading(true)
    try {
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
      const dayNames = language === 'en' 
        ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        : ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab']
      const monthNames = language === 'en'
        ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        : ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis']
      
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
        categoryMap.set(item.name, item.category || (language === 'en' ? 'Others' : 'Lain-lain'))
      })
      
      const categoryCount = {}
      allOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const category = categoryMap.get(item.name) || (language === 'en' ? 'Others' : 'Lain-lain')
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

  // ===== EFFECTS =====
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

  // ===== EXPORT FUNCTIONS =====
  const handleManualRefresh = async () => {
    toast.loading(t('loading_text'), { duration: 1000 })
    await loadRestaurantInfo()
    await loadDashboard()
    toast.success(t('refresh_data'))
  }

  const exportToExcel = () => {
    try {
      const exportData = recentOrders.map(order => ({
        [t('id')]: order.order_number || order.id,
        [t('customer_name')]: order.customer_name || t('guest'),
        [t('table_number')]: order.table_number || '-',
        [t('total') + ' (RM)']: order.total?.toFixed(2) || '0.00',
        [t('payment_method')]: order.payment_method === 'cash' ? `💵 ${t('cash')}` : 
                               order.payment_method === 'tng' ? `📱 ${t('tng')}` : 
                               order.payment_method === 'bank' ? `🏦 ${t('bank')}` : '-',
        [t('status')]: order.payment_status === 'paid' ? t('paid') : t('unpaid'),
        [t('date')]: order.created_at ? new Date(order.created_at).toLocaleString() : '-'
      }))
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, t('recent_orders'))
      XLSX.writeFile(wb, `dashboard_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success(t('excel_exported'))
    } catch (error) {
      console.error('Export error:', error)
      toast.error(t('export_failed'))
    }
  }

  const exportToPDF = async () => {
    setExporting(true)
    try {
      const element = dashboardRef.current
      if (!element) { 
        toast.error(t('export_failed'))
        setExporting(false)
        return 
      }
      const canvas = await html2canvas(element, { 
        scale: 2, 
        backgroundColor: darkMode ? '#0f0f1a' : '#f1f5f9', 
        logging: false 
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const imgWidth = 280
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 5, 5, imgWidth, imgHeight)
      pdf.save(`dashboard_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success(t('pdf_exported'))
    } catch (error) {
      console.error('PDF export error:', error)
      toast.error(t('export_failed'))
    }
    setExporting(false)
  }

  // ===== CHART OPTIONS =====
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        position: 'top', 
        labels: { 
          color: chartTextColor, 
          font: { size: 11, weight: '500' },
          padding: 16
        } 
      }, 
      tooltip: { 
        backgroundColor: darkMode ? 'rgba(15,15,26,0.9)' : 'rgba(255,255,255,0.95)', 
        titleColor: chartTextColor, 
        bodyColor: chartTextColor,
        borderColor: borderColor,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8
      } 
    },
    scales: { 
      y: { 
        ticks: { color: chartTextColor, font: { size: 10 } }, 
        grid: { color: chartGridColor } 
      }, 
      x: { 
        ticks: { color: chartTextColor, font: { size: 10 } }, 
        grid: { color: chartGridColor } 
      } 
    },
    animation: { duration: 800 }
  }
  
  const salesChartData = {
    labels: chartData.labels,
    datasets: [
      { 
        label: t('sales') + ' (RM)', 
        data: chartData.sales, 
        backgroundColor: chartColors.green, 
        borderColor: chartColors.greenBorder, 
        borderWidth: 2, 
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(34, 197, 94, 1)'
      },
      { 
        label: t('orders'), 
        data: chartData.orders, 
        backgroundColor: chartColors.blue, 
        borderColor: chartColors.blueBorder, 
        borderWidth: 2, 
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(59, 130, 246, 1)'
      }
    ]
  }
  
  const paymentChartData = {
    labels: [t('cash'), t('tng'), t('bank')],
    datasets: [{ 
      data: [paymentMethodData.cash, paymentMethodData.tng, paymentMethodData.bank], 
      backgroundColor: [chartColors.green, chartColors.blue, chartColors.purple], 
      borderWidth: 2,
      borderColor: darkMode ? 'rgba(15,15,26,0.5)' : 'rgba(255,255,255,0.5)',
      hoverOffset: 8
    }]
  }
  
  const paymentChartOptions = { 
    responsive: true, 
    maintainAspectRatio: false, 
    plugins: { 
      legend: { 
        position: 'bottom', 
        labels: { 
          color: chartTextColor, 
          font: { size: 10, weight: '500' },
          padding: 12
        } 
      },
      tooltip: { 
        backgroundColor: darkMode ? 'rgba(15,15,26,0.9)' : 'rgba(255,255,255,0.95)', 
        titleColor: chartTextColor, 
        bodyColor: chartTextColor,
        borderColor: borderColor,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            let label = context.label || ''
            let value = context.parsed || 0
            return `${label}: RM ${value.toFixed(2)}`
          }
        }
      } 
    },
    animation: { duration: 800 }
  }
  
  const peakHoursChartData = { 
    labels: peakHoursData.labels, 
    datasets: [{ 
      label: t('orders'), 
      data: peakHoursData.counts, 
      backgroundColor: 'rgba(245, 158, 11, 0.7)', 
      borderColor: chartColors.orangeBorder, 
      borderWidth: 2,
      borderRadius: 6,
      hoverBackgroundColor: 'rgba(245, 158, 11, 1)'
    }] 
  }
  
  const topCategoriesChartData = { 
    labels: topCategoriesData.labels, 
    datasets: [{ 
      data: topCategoriesData.counts, 
      backgroundColor: [
        chartColors.green,
        chartColors.blue,
        chartColors.orange,
        chartColors.red,
        chartColors.purple
      ], 
      borderWidth: 2,
      borderColor: darkMode ? 'rgba(15,15,26,0.5)' : 'rgba(255,255,255,0.5)',
      hoverOffset: 8
    }] 
  }

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <Sidebar>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: bgColor
        }}>
          <div className="spinner"></div>
        </div>
      </Sidebar>
    )
  }

  // ===== RENDER =====
  return (
    <Sidebar>
      <div ref={dashboardRef}>
        <div style={{ 
          padding: isMobile ? '12px' : '24px', 
          maxWidth: '1400px', 
          margin: '0 auto', 
          background: bgColor, 
          minHeight: '100vh' 
        }}>
          
          {/* ===== HEADER ===== */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            
            {/* Logo */}
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
            
            <h1 style={{ 
              margin: '10px 0 5px 0', 
              color: textColor, 
              fontSize: isMobile ? '22px' : '28px', 
              fontWeight: 'bold' 
            }}>
              {restaurantName}
            </h1>
            <p style={{ color: textMuted, fontSize: isMobile ? '13px' : '14px' }}>
              {t('dashboard')} - {t('summary')}
            </p>
            
            {/* Control Panel */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '10px', 
              flexWrap: 'wrap', 
              marginTop: '20px', 
              padding: isMobile ? '10px 16px' : '12px 24px', 
              background: secondaryBg, 
              borderRadius: '60px',
              ...glassEffect
            }}>
              <select 
                value={dateRange} 
                onChange={(e) => { setDateRange(e.target.value); setTimeout(() => loadDashboard(), 100) }} 
                style={{ 
                  padding: isMobile ? '6px 14px' : '8px 20px', 
                  borderRadius: '40px', 
                  border: `1px solid ${borderColor}`, 
                  background: cardBg, 
                  color: textColor, 
                  cursor: 'pointer',
                  fontSize: isMobile ? '12px' : '13px',
                  transition: 'all 0.2s'
                }}
              >
                <option value="today">📅 {t('today')}</option>
                <option value="week">📊 {t('week')}</option>
                <option value="month">📈 {t('month')}</option>
              </select>
              
              <select 
                value={chartType} 
                onChange={(e) => setChartType(e.target.value)} 
                style={{ 
                  padding: isMobile ? '6px 14px' : '8px 20px', 
                  borderRadius: '40px', 
                  border: `1px solid ${borderColor}`, 
                  background: cardBg, 
                  color: textColor, 
                  cursor: 'pointer',
                  fontSize: isMobile ? '12px' : '13px',
                  transition: 'all 0.2s'
                }}
              >
                <option value="bar">📊 Bar {t('chart')}</option>
                <option value="line">📈 Line {t('chart')}</option>
              </select>
              
              <button 
                onClick={exportToExcel} 
                disabled={exporting} 
                style={{ 
                  padding: isMobile ? '6px 14px' : '8px 20px', 
                  borderRadius: '40px', 
                  background: '#22c55e', 
                  color: 'white', 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  fontSize: isMobile ? '11px' : '13px',
                  border: 'none',
                  transition: 'all 0.2s',
                  opacity: exporting ? 0.5 : 1
                }}
              >
                📎 {t('export_excel')}
              </button>
              
              <button 
                onClick={exportToPDF} 
                disabled={exporting} 
                style={{ 
                  padding: isMobile ? '6px 14px' : '8px 20px', 
                  borderRadius: '40px', 
                  background: '#ef4444', 
                  color: 'white', 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  fontSize: isMobile ? '11px' : '13px',
                  border: 'none',
                  transition: 'all 0.2s',
                  opacity: exporting ? 0.5 : 1
                }}
              >
                📄 {t('export_pdf')}
              </button>
              
              <button 
                onClick={handleManualRefresh} 
                style={{ 
                  padding: isMobile ? '6px 14px' : '8px 20px', 
                  borderRadius: '40px', 
                  background: '#3b82f6', 
                  color: 'white', 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  fontSize: isMobile ? '11px' : '13px',
                  border: 'none',
                  transition: 'all 0.2s'
                }}
              >
                🔄 {isMobile ? '' : t('refresh_data')}
              </button>
              
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                cursor: 'pointer',
                fontSize: isMobile ? '11px' : '13px',
                color: textColor
              }}>
                <input 
                  type="checkbox" 
                  checked={autoRefresh} 
                  onChange={(e) => setAutoRefresh(e.target.checked)} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }} 
                />
                🔄 {isMobile ? '' : t('auto_refresh')}
              </label>
            </div>
            
            <p style={{ 
              fontSize: isMobile ? '10px' : '11px', 
              color: textMuted, 
              marginTop: '12px' 
            }}>
              {t('last_updated')}: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>

          {/* ===== LOW STOCK ALERT ===== */}
          {lowStockItems.length > 0 && (
            <div style={{ 
              background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
              borderRadius: '28px', 
              padding: isMobile ? '16px' : '20px', 
              marginBottom: '28px',
              boxShadow: '0 8px 24px rgba(239,68,68,0.3)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                marginBottom: '16px' 
              }}>
                <span style={{ fontSize: isMobile ? '24px' : '28px' }}>⚠️</span>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: isMobile ? '16px' : '18px', 
                  color: 'white', 
                  fontWeight: 'bold' 
                }}>
                  {t('low_stock_alert')}
                </h2>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {lowStockItems.slice(0, 10).map(item => (
                  <div key={item.id} style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    borderRadius: '40px', 
                    padding: '6px 16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    backdropFilter: 'blur(4px)'
                  }}>
                    <span style={{ color: 'white', fontSize: isMobile ? '12px' : '13px' }}>
                      {item.name}
                    </span>
                    <span style={{ 
                      background: item.stock === 0 ? '#dc3545' : '#f59e0b', 
                      color: 'white', 
                      padding: '2px 10px', 
                      borderRadius: '30px', 
                      fontSize: isMobile ? '9px' : '10px', 
                      fontWeight: 'bold' 
                    }}>
                      {item.stock === 0 ? t('out_of_stock') : `${item.stock} ${t('left')}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== SUMMARY CARDS ===== */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile 
              ? 'repeat(2, 1fr)' 
              : 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: '16px', 
            marginBottom: '28px' 
          }}>
            {[
              { 
                icon: '💰', 
                label: t('today_sales'), 
                value: `RM ${todaySales.toFixed(2)}`, 
                gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' 
              },
              { 
                icon: '📋', 
                label: t('total_orders'), 
                value: `${todayOrders} ${t('orders')}`, 
                gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' 
              },
              { 
                icon: '🪑', 
                label: t('active_tables'), 
                value: `${activeTables} ${t('tables')}`, 
                gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' 
              },
              { 
                icon: '🍽️', 
                label: t('popular_items'), 
                value: `${topItems.length} ${t('items')}`, 
                gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' 
              }
            ].map((card, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: card.gradient, 
                  borderRadius: '24px', 
                  padding: isMobile ? '16px' : '24px', 
                  color: 'white', 
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)', 
                  transition: 'transform 0.25s, box-shadow 0.25s', 
                  cursor: 'pointer' 
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px)'
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.25)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'
                }}
              >
                <div style={{ fontSize: isMobile ? '32px' : '44px', marginBottom: '8px' }}>
                  {card.icon}
                </div>
                <div style={{ 
                  fontSize: isMobile ? '11px' : '13px', 
                  opacity: 0.9,
                  fontWeight: '500'
                }}>
                  {card.label}
                </div>
                <div style={{ 
                  fontSize: isMobile ? '20px' : '28px', 
                  fontWeight: 'bold', 
                  marginTop: '4px' 
                }}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          {/* ===== CHARTS ROW 1 ===== */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(420px, 1fr))', 
            gap: '20px', 
            marginBottom: '28px' 
          }}>
            <div style={{ ...glassEffect, borderRadius: '24px', padding: isMobile ? '16px' : '20px' }}>
              <h2 style={{ 
                marginTop: 0, 
                marginBottom: '16px', 
                color: textColor, 
                fontSize: isMobile ? '15px' : '17px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📊 {t('sales_trend')}
              </h2>
              <div style={{ height: isMobile ? '220px' : '280px' }}>
                {chartType === 'bar' 
                  ? <Bar data={salesChartData} options={barChartOptions} /> 
                  : <Line data={salesChartData} options={barChartOptions} />
                }
              </div>
            </div>
            
            <div style={{ ...glassEffect, borderRadius: '24px', padding: isMobile ? '16px' : '20px' }}>
              <h2 style={{ 
                marginTop: 0, 
                marginBottom: '16px', 
                color: textColor, 
                fontSize: isMobile ? '15px' : '17px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                💰 {t('payment_breakdown')}
              </h2>
              <div style={{ height: isMobile ? '200px' : '220px' }}>
                <Doughnut data={paymentChartData} options={paymentChartOptions} />
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: isMobile ? '12px' : '24px', 
                marginTop: '16px', 
                flexWrap: 'wrap',
                fontSize: isMobile ? '11px' : '13px',
                color: textColor
              }}>
                <div>
                  <span style={{ 
                    display: 'inline-block', 
                    width: '10px', 
                    height: '10px', 
                    background: chartColors.green, 
                    borderRadius: '2px', 
                    marginRight: '6px' 
                  }}></span> 
                  {t('cash')}: RM {paymentMethodData.cash.toFixed(2)}
                </div>
                <div>
                  <span style={{ 
                    display: 'inline-block', 
                    width: '10px', 
                    height: '10px', 
                    background: chartColors.blue, 
                    borderRadius: '2px', 
                    marginRight: '6px' 
                  }}></span> 
                  {t('tng')}: RM {paymentMethodData.tng.toFixed(2)}
                </div>
                <div>
                  <span style={{ 
                    display: 'inline-block', 
                    width: '10px', 
                    height: '10px', 
                    background: chartColors.purple, 
                    borderRadius: '2px', 
                    marginRight: '6px' 
                  }}></span> 
                  {t('bank')}: RM {paymentMethodData.bank.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* ===== CHARTS ROW 2 ===== */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(380px, 1fr))', 
            gap: '20px', 
            marginBottom: '28px' 
          }}>
            <div style={{ ...glassEffect, borderRadius: '24px', padding: isMobile ? '16px' : '20px' }}>
              <h2 style={{ 
                marginTop: 0, 
                marginBottom: '16px', 
                color: textColor, 
                fontSize: isMobile ? '15px' : '17px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ⏰ {t('peak_hours')}
              </h2>
              <div style={{ height: isMobile ? '200px' : '240px' }}>
                <Bar data={peakHoursChartData} options={barChartOptions} />
              </div>
            </div>
            
            <div style={{ ...glassEffect, borderRadius: '24px', padding: isMobile ? '16px' : '20px' }}>
              <h2 style={{ 
                marginTop: 0, 
                marginBottom: '16px', 
                color: textColor, 
                fontSize: isMobile ? '15px' : '17px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🏷️ {t('top_categories')}
              </h2>
              <div style={{ height: isMobile ? '200px' : '240px' }}>
                <Doughnut data={topCategoriesChartData} options={paymentChartOptions} />
              </div>
            </div>
          </div>

          {/* ===== POPULAR ITEMS & RECENT ORDERS ===== */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1.5fr', 
            gap: '20px', 
            marginBottom: '28px' 
          }}>
            <div style={{ ...glassEffect, borderRadius: '24px', padding: isMobile ? '16px' : '20px' }}>
              <h2 style={{ 
                marginTop: 0, 
                marginBottom: '20px', 
                color: textColor, 
                fontSize: isMobile ? '15px' : '17px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🔥 {t('popular_items')}
              </h2>
              {topItems.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '40px', color: textMuted }}>
                  {t('no_data')}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {topItems.map((item, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: isMobile ? '10px 14px' : '14px 18px', 
                      background: secondaryBg, 
                      borderRadius: '16px',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          width: '28px', 
                          height: '28px', 
                          background: idx < 3 ? '#f59e0b' : '#94a3b8', 
                          color: '#fff', 
                          borderRadius: '50%', 
                          textAlign: 'center', 
                          lineHeight: '28px', 
                          fontWeight: 'bold', 
                          fontSize: '13px' 
                        }}>
                          {idx + 1}
                        </span>
                        <strong style={{ color: textColor, fontSize: isMobile ? '13px' : '14px' }}>
                          {item.name}
                        </strong>
                      </div>
                      <span style={{ 
                        color: '#22c55e', 
                        fontWeight: 'bold',
                        fontSize: isMobile ? '12px' : '13px'
                      }}>
                        {item.count} {t('times')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ ...glassEffect, borderRadius: '24px', padding: isMobile ? '16px' : '20px' }}>
              <h2 style={{ 
                marginTop: 0, 
                marginBottom: '20px', 
                color: textColor, 
                fontSize: isMobile ? '15px' : '17px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📋 {t('recent_orders')}
              </h2>
              {recentOrders.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '40px', color: textMuted }}>
                  {t('no_data')}
                </p>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px', 
                  maxHeight: '400px', 
                  overflowY: 'auto' 
                }}>
                  {recentOrders.map(order => (
                    <div key={order.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: isMobile ? '10px 14px' : '14px 18px', 
                      background: secondaryBg, 
                      borderRadius: '16px',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontWeight: 'bold', 
                          color: textColor,
                          fontSize: isMobile ? '13px' : '14px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {order.customer_name || t('guest')}
                        </div>
                        <div style={{ 
                          fontSize: isMobile ? '10px' : '11px', 
                          color: textMuted, 
                          marginTop: '2px' 
                        }}>
                          {order.order_type === 'take_away' 
                            ? `🥡 ${t('take_away')}` 
                            : (order.table_number ? `${t('table')} ${order.table_number}` : 'POS')
                          } 
                          • {order.created_at ? new Date(order.created_at).toLocaleTimeString() : '-'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                        <div style={{ 
                          fontWeight: 'bold', 
                          color: '#22c55e', 
                          fontSize: isMobile ? '14px' : '16px' 
                        }}>
                          RM {order.total?.toFixed(2) || '0.00'}
                        </div>
                        <div style={{ fontSize: isMobile ? '10px' : '11px', marginTop: '2px' }}>
                          {order.payment_status === 'paid' ? (
                            <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✅ {t('paid')}</span>
                          ) : (
                            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>⏳ {t('unpaid')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* ===== STYLES ===== */}
      <style>
        {`
          .spinner { 
            width: 48px; 
            height: 48px; 
            border: 4px solid rgba(59,130,246,0.15); 
            border-top-color: #3b82f6; 
            border-radius: 50%; 
            animation: spin 1s linear infinite; 
            margin: 0 auto; 
          }
          
          @keyframes spin { 
            to { transform: rotate(360deg); } 
          }
          
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
          
          button, select, input[type="checkbox"] { 
            transition: all 0.2s ease; 
          }
          
          button:hover:not(:disabled) { 
            opacity: 0.85; 
            transform: scale(0.97); 
          }
          
          button:active:not(:disabled) {
            transform: scale(0.93);
          }
          
          button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          select:hover {
            opacity: 0.85;
          }
          
          .card-hover {
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          }
        `}
      </style>
    </Sidebar>
  )
}

export default Dashboard