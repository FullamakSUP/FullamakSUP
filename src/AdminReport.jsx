import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'
import Sidebar from './components/Sidebar'
import * as XLSX from 'xlsx'
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
import { Bar, Doughnut } from 'react-chartjs-2'

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

function AdminReport() {
  const { darkMode } = useTheme()
  const { t, language } = useLanguage()
  const [todaySales, setTodaySales] = useState(0)
  const [weekSales, setWeekSales] = useState(0)
  const [monthSales, setMonthSales] = useState(0)
  const [totalSales, setTotalSales] = useState(0)
  const [todayOrders, setTodayOrders] = useState([])
  const [topItems, setTopItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentBreakdown, setPaymentBreakdown] = useState({ cash: 0, tng: 0, bank: 0 })
  const [pendingPayments, setPendingPayments] = useState(0)
  const [orderTypeFilter, setOrderTypeFilter] = useState('all')
  const [totalServiceCharge, setTotalServiceCharge] = useState(0)
  const [totalTax, setTotalTax] = useState(0)
  const [restaurantName, setRestaurantName] = useState('Restoran Kita')
  const [chartType, setChartType] = useState('bar')
  const [salesTrendData, setSalesTrendData] = useState({ labels: [], sales: [] })
  const [isMobile, setIsMobile] = useState(false)
  
  // Delete by Date Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteType, setDeleteType] = useState('')
  const [deleteStartDate, setDeleteStartDate] = useState('')
  const [deleteEndDate, setDeleteEndDate] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  
  // Search and Pagination states
  const [searchOrderTerm, setSearchOrderTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

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
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.6)'
  const secondaryBg = darkMode ? 'rgba(30, 30, 46, 0.8)' : 'rgba(248, 250, 252, 0.9)'
  const inputBg = darkMode ? '#1e1e2e' : '#ffffff'
  
  const glassEffect = {
    background: cardBg,
    backdropFilter: 'blur(12px)',
    border: `1px solid ${borderColor}`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
  }

  useEffect(() => {
    loadReports()
    loadRestaurantName()
  }, [selectedDate, orderTypeFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchOrderTerm, selectedDate])

  async function loadRestaurantName() {
    const { data } = await supabase.from('settings').select('value').eq('key', 'restaurant_name').single()
    if (data) setRestaurantName(data.value)
  }

  async function loadReports() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const todayDate = new Date()
    const dayOfWeek = todayDate.getDay()
    const startOfWeek = new Date(todayDate)
    startOfWeek.setDate(todayDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
    const weekStart = startOfWeek.toISOString().split('T')[0]
    const monthStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1).toISOString().split('T')[0]

    const { data: customerOrders } = await supabase.from('customer_orders').select('*').order('created_at', { ascending: false })
    let allSales = customerOrders || []
    if (orderTypeFilter !== 'all') allSales = allSales.filter(o => o.order_type === orderTypeFilter)
    
    const paidSales = allSales.filter(o => o.payment_status === 'paid')
    const todayTotal = paidSales.filter(o => o.created_at?.startsWith(today)).reduce((sum, o) => sum + (o.total || 0), 0)
    const weekTotal = paidSales.filter(o => o.created_at >= weekStart).reduce((sum, o) => sum + (o.total || 0), 0)
    const monthTotal = paidSales.filter(o => o.created_at >= monthStart).reduce((sum, o) => sum + (o.total || 0), 0)
    const allTimeTotal = paidSales.reduce((sum, o) => sum + (o.total || 0), 0)
    const unpaidCount = allSales.filter(o => o.payment_status === 'unpaid').length
    setPendingPayments(unpaidCount)
    
    const scTotal = paidSales.reduce((sum, o) => sum + (o.service_charge || 0), 0)
    const taxTotal = paidSales.reduce((sum, o) => sum + (o.tax || 0), 0)
    setTotalServiceCharge(scTotal)
    setTotalTax(taxTotal)

    const todaysOrdersList = allSales.filter(o => o.created_at?.startsWith(selectedDate))
    
    const trendLabels = []
    const trendSales = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const daySales = paidSales.filter(o => o.created_at?.startsWith(dateStr)).reduce((sum, o) => sum + (o.total || 0), 0)
      trendLabels.push(date.toLocaleDateString('en', { weekday: 'short' }))
      trendSales.push(daySales)
    }
    setSalesTrendData({ labels: trendLabels, sales: trendSales })
    
    const itemCount = {}
    allSales.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const name = item.name
          itemCount[name] = (itemCount[name] || 0) + (item.quantity || 1)
        })
      }
    })
    const topItemsList = Object.entries(itemCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }))

    const paidOrders = allSales.filter(o => o.payment_status === 'paid')
    const breakdown = {
      cash: paidOrders.filter(o => o.payment_method === 'cash').reduce((s, o) => s + (o.total || 0), 0),
      tng: paidOrders.filter(o => o.payment_method === 'tng').reduce((s, o) => s + (o.total || 0), 0),
      bank: paidOrders.filter(o => o.payment_method === 'bank').reduce((s, o) => s + (o.total || 0), 0)
    }

    setTodaySales(todayTotal)
    setWeekSales(weekTotal)
    setMonthSales(monthTotal)
    setTotalSales(allTimeTotal)
    setTodayOrders(todaysOrdersList)
    setTopItems(topItemsList)
    setPaymentBreakdown(breakdown)
    setLoading(false)
  }

  // ========== DELETE BY DATE FUNCTIONS ==========
  const openDeleteModal = (type) => {
    setDeleteType(type)
    setDeleteStartDate(type === 'single' ? selectedDate : '')
    setDeleteEndDate('')
    setDeleteConfirmText('')
    setShowDeleteModal(true)
  }

  const executeDelete = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('⚠️ Sila taip "DELETE" untuk mengesahkan')
      return
    }

    setDeleting(true)
    
    try {
      let query = supabase.from('customer_orders').delete()
      
      if (deleteType === 'single') {
        if (!deleteStartDate) {
          toast.error('⚠️ Sila pilih tarikh')
          setDeleting(false)
          return
        }
        query = query.eq('payment_status', 'paid').gte('created_at', `${deleteStartDate}T00:00:00`).lt('created_at', `${deleteStartDate}T23:59:59`)
        const { error } = await query
        if (error) throw error
        toast.success(`✅ Semua pesanan pada ${deleteStartDate} berjaya dipadam!`)
      } else if (deleteType === 'range') {
        if (!deleteStartDate || !deleteEndDate) {
          toast.error('⚠️ Sila pilih tarikh mula dan tarikh akhir')
          setDeleting(false)
          return
        }
        if (deleteStartDate > deleteEndDate) {
          toast.error('⚠️ Tarikh mula mestilah lebih awal daripada tarikh akhir')
          setDeleting(false)
          return
        }
        query = query.eq('payment_status', 'paid').gte('created_at', `${deleteStartDate}T00:00:00`).lte('created_at', `${deleteEndDate}T23:59:59`)
        const { error } = await query
        if (error) throw error
        toast.success(`✅ Semua pesanan dari ${deleteStartDate} hingga ${deleteEndDate} berjaya dipadam!`)
      }
      
      await loadReports()
      setShowDeleteModal(false)
      setDeleteType('')
      setDeleteStartDate('')
      setDeleteEndDate('')
      setDeleteConfirmText('')
      
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('❌ Ralat semasa memadam: ' + error.message)
    }
    
    setDeleting(false)
  }

  // Chart options
  const chartTextColor = darkMode ? '#e0e0e0' : '#333'
  const chartGridColor = darkMode ? '#444' : '#e0e0e0'
  
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: chartTextColor, font: { size: isMobile ? 9 : 11 } } },
      tooltip: { backgroundColor: darkMode ? '#333' : '#fff', titleColor: darkMode ? '#fff' : '#333', bodyColor: darkMode ? '#fff' : '#333' }
    },
    scales: {
      y: { ticks: { color: chartTextColor, font: { size: isMobile ? 9 : 11 } }, grid: { color: chartGridColor } },
      x: { ticks: { color: chartTextColor, font: { size: isMobile ? 9 : 11 }, rotation: isMobile ? 45 : 0 }, grid: { color: chartGridColor } }
    }
  }
  
  const salesTrendChartData = {
    labels: salesTrendData.labels,
    datasets: [{ label: 'Sales (RM)', data: salesTrendData.sales, backgroundColor: 'rgba(59, 130, 246, 0.7)', borderColor: '#3b82f6', borderWidth: 1, borderRadius: 8, barPercentage: 0.7 }]
  }
  
  const paymentChartData = {
    labels: [t('cash'), t('tng'), t('bank')],
    datasets: [{ data: [paymentBreakdown.cash, paymentBreakdown.tng, paymentBreakdown.bank], backgroundColor: ['#22c55e', '#06b6d4', '#8b5cf6'], borderWidth: 0, borderRadius: 8 }]
  }
  
  const paymentChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: chartTextColor, font: { size: isMobile ? 9 : 10 } } } } }

  const filteredOrders = todayOrders.filter(order =>
    order.customer_name?.toLowerCase().includes(searchOrderTerm.toLowerCase()) ||
    order.order_number?.toLowerCase().includes(searchOrderTerm.toLowerCase()) ||
    order.items?.some(item => item.name.toLowerCase().includes(searchOrderTerm.toLowerCase()))
  )

  const totalItems = filteredOrders.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentOrders = filteredOrders.slice(startIndex, endIndex)

  const PaginationComponent = () => {
    const pageNumbers = []
    const maxVisible = isMobile ? 3 : 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1)
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i)
    
    return totalPages > 1 ? (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: isMobile ? '4px' : '8px', marginTop: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} style={{ padding: isMobile ? '6px 10px' : '8px 14px', background: currentPage === 1 ? secondaryBg : '#3b82f6', color: currentPage === 1 ? textMuted : 'white', border: 'none', borderRadius: '10px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: isMobile ? '11px' : '13px', fontWeight: '500' }}>«</button>
        <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} style={{ padding: isMobile ? '6px 10px' : '8px 14px', background: currentPage === 1 ? secondaryBg : '#3b82f6', color: currentPage === 1 ? textMuted : 'white', border: 'none', borderRadius: '10px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: isMobile ? '11px' : '13px', fontWeight: '500' }}>‹</button>
        {pageNumbers.map(num => (
          <button key={num} onClick={() => setCurrentPage(num)} style={{ padding: isMobile ? '6px 12px' : '8px 14px', background: currentPage === num ? '#22c55e' : cardBg, color: currentPage === num ? 'white' : textColor, border: `1px solid ${borderColor}`, borderRadius: '10px', cursor: 'pointer', fontWeight: currentPage === num ? 'bold' : '500', fontSize: isMobile ? '11px' : '13px' }}>{num}</button>
        ))}
        <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} style={{ padding: isMobile ? '6px 10px' : '8px 14px', background: currentPage === totalPages ? secondaryBg : '#3b82f6', color: currentPage === totalPages ? textMuted : 'white', border: 'none', borderRadius: '10px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: isMobile ? '11px' : '13px', fontWeight: '500' }}>›</button>
        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} style={{ padding: isMobile ? '6px 10px' : '8px 14px', background: currentPage === totalPages ? secondaryBg : '#3b82f6', color: currentPage === totalPages ? textMuted : 'white', border: 'none', borderRadius: '10px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: isMobile ? '11px' : '13px', fontWeight: '500' }}>»</button>
      </div>
    ) : null
  }

  function exportToCSV() {
    const headers = ['Bil', 'ID Pesanan', 'Jenis', 'No Meja', 'Nama Pelanggan', 'Item', 'Jumlah (RM)', 'Service Charge', 'Tax', 'Kaedah Bayaran', 'Status Bayaran', 'Tarikh', 'Masa']
    const rows = todayOrders.map((order, index) => [
      index + 1,
      order.order_number || `ORD-${order.id}`,
      order.order_type === 'take_away' ? 'Take Away' : order.table_number ? 'Dine In' : 'Walk-in',
      order.table_number || '-',
      order.customer_name || 'Walk-in',
      order.items?.map(i => `${i.name} (x${i.quantity})`).join('; ') || '-',
      order.total?.toFixed(2) || '0.00',
      order.service_charge?.toFixed(2) || '0.00',
      order.tax?.toFixed(2) || '0.00',
      order.payment_method === 'cash' ? 'Tunai' : order.payment_method === 'tng' ? 'Touch n Go' : order.payment_method === 'bank' ? 'Bank Transfer' : '-',
      order.payment_status === 'paid' ? 'Sudah Bayar' : 'Belum Bayar',
      new Date(order.created_at).toLocaleDateString('ms-MY'),
      new Date(order.created_at).toLocaleTimeString('ms-MY')
    ])
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laporan-jualan-${selectedDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV berjaya dimuat turun!')
  }

  function exportToExcel() {
    const headers = ['Bil', 'ID Pesanan', 'Jenis', 'No Meja', 'Nama Pelanggan', 'Item', 'Jumlah (RM)', 'Service Charge', 'Tax', 'Kaedah Bayaran', 'Status Bayaran', 'Tarikh', 'Masa']
    const rows = todayOrders.map((order, index) => [
      index + 1,
      order.order_number || `ORD-${order.id}`,
      order.order_type === 'take_away' ? 'Take Away' : order.table_number ? 'Dine In' : 'Walk-in',
      order.table_number || '-',
      order.customer_name || 'Walk-in',
      order.items?.map(i => `${i.name} (x${i.quantity})`).join('; ') || '-',
      order.total?.toFixed(2) || '0.00',
      order.service_charge?.toFixed(2) || '0.00',
      order.tax?.toFixed(2) || '0.00',
      order.payment_method === 'cash' ? 'Tunai' : order.payment_method === 'tng' ? 'Touch n Go' : order.payment_method === 'bank' ? 'Bank Transfer' : '-',
      order.payment_status === 'paid' ? 'Sudah Bayar' : 'Belum Bayar',
      new Date(order.created_at).toLocaleDateString('ms-MY'),
      new Date(order.created_at).toLocaleTimeString('ms-MY')
    ])

    const wsData = [headers, ...rows]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 10 }]
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Jualan')
    XLSX.writeFile(wb, `laporan-jualan-${selectedDate}.xlsx`)
    toast.success('Excel berjaya dimuat turun!')
  }

  function exportToPDF() {
    const printContent = document.getElementById('report-content').innerHTML
    const originalTitle = document.title
    document.title = `${restaurantName} - Laporan Jualan ${selectedDate}`
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${restaurantName} - Laporan Jualan</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',Arial,sans-serif;padding:20px;font-size:12px;color:#333}.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #2563eb;padding-bottom:20px}.header h1{font-size:24px;color:#1e293b;margin-bottom:5px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:30px}.stat-card{background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;padding:15px;border-radius:12px;text-align:center}.stat-card.green{background:linear-gradient(135deg,#16a34a,#15803d)}.stat-card.orange{background:linear-gradient(135deg,#ea580c,#c2410c)}.stat-card.purple{background:linear-gradient(135deg,#7c3aed,#6d28d9)}.section{margin-bottom:25px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}.section-title{background:#f1f5f9;padding:12px 15px;font-weight:bold;border-bottom:1px solid #e2e8f0}table{width:100%;border-collapse:collapse}th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #e2e8f0}th{background:#f8fafc;font-weight:bold;color:#1e293b}@media print{body{padding:20px}}</style></head><body>${printContent}<script>window.print();<\/script></body></html>`)
    printWindow.document.close()
    document.title = originalTitle
    toast.success('PDF report sedia!')
  }

  if (loading) {
    return (
      <Sidebar>
        <div style={{ padding: '20px', background: bgColor, minHeight: '100vh' }}>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="spinner"></div>
            <p style={{ color: textMuted, marginTop: '20px' }}>{t('loading')}</p>
          </div>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      <div id="report-content" style={{ padding: isMobile ? '12px' : '20px', maxWidth: '1400px', margin: '0 auto', background: bgColor, minHeight: '100vh' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ color: textColor, margin: 0, fontSize: isMobile ? '22px' : '28px', fontWeight: 'bold' }}>📊 {t('sales_report')}</h1>
            <p style={{ color: textMuted, marginTop: '4px', fontSize: isMobile ? '11px' : '14px' }}>{restaurantName} • {t('sales_analysis')}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select value={orderTypeFilter} onChange={(e) => setOrderTypeFilter(e.target.value)} style={{ padding: isMobile ? '6px 12px' : '10px 20px', borderRadius: '30px', border: `1px solid ${borderColor}`, background: cardBg, color: textColor, cursor: 'pointer', fontSize: isMobile ? '11px' : '13px', fontWeight: '500' }}>
              <option value="all">🍽️ {t('all_orders')}</option>
              <option value="dine_in">🍽️ Dine In</option>
              <option value="take_away">🥡 Take Away</option>
            </select>
            <button onClick={exportToCSV} style={{ background: '#22c55e', color: 'white', padding: isMobile ? '6px 12px' : '10px 20px', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', fontSize: isMobile ? '11px' : '13px' }}>📥 CSV</button>
            <button onClick={exportToExcel} style={{ background: '#06b6d4', color: 'white', padding: isMobile ? '6px 12px' : '10px 20px', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', fontSize: isMobile ? '11px' : '13px' }}>📊 Excel</button>
            <button onClick={exportToPDF} style={{ background: '#ef4444', color: 'white', padding: isMobile ? '6px 12px' : '10px 20px', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', fontSize: isMobile ? '11px' : '13px' }}>📄 PDF</button>
          </div>
        </div>

        {/* Stats Cards - Responsive grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: isMobile ? '10px' : '20px', marginBottom: '20px' }}>
          <div style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '20px', padding: isMobile ? '14px' : '22px', color: 'white', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
            <div style={{ fontSize: isMobile ? '28px' : '36px', marginBottom: '6px' }}>📅</div>
            <div style={{ fontSize: isMobile ? '10px' : '13px', opacity: 0.9 }}>{t('today_sales')}</div>
            <div style={{ fontSize: isMobile ? '18px' : '28px', fontWeight: 'bold', marginTop: '4px' }}>RM {todaySales.toFixed(2)}</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', borderRadius: '20px', padding: isMobile ? '14px' : '22px', color: 'white', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}>
            <div style={{ fontSize: isMobile ? '28px' : '36px', marginBottom: '6px' }}>📆</div>
            <div style={{ fontSize: isMobile ? '10px' : '13px', opacity: 0.9 }}>{t('week_sales')}</div>
            <div style={{ fontSize: isMobile ? '18px' : '28px', fontWeight: 'bold', marginTop: '4px' }}>RM {weekSales.toFixed(2)}</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '20px', padding: isMobile ? '14px' : '22px', color: 'white', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
            <div style={{ fontSize: isMobile ? '28px' : '36px', marginBottom: '6px' }}>📅</div>
            <div style={{ fontSize: isMobile ? '10px' : '13px', opacity: 0.9 }}>{t('month_sales')}</div>
            <div style={{ fontSize: isMobile ? '18px' : '28px', fontWeight: 'bold', marginTop: '4px' }}>RM {monthSales.toFixed(2)}</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', borderRadius: '20px', padding: isMobile ? '14px' : '22px', color: 'white', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>
            <div style={{ fontSize: isMobile ? '28px' : '36px', marginBottom: '6px' }}>💰</div>
            <div style={{ fontSize: isMobile ? '10px' : '13px', opacity: 0.9 }}>{t('total_sales')}</div>
            <div style={{ fontSize: isMobile ? '18px' : '28px', fontWeight: 'bold', marginTop: '4px' }}>RM {totalSales.toFixed(2)}</div>
          </div>
        </div>

        {/* Service Charge & Tax & Delete Section */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{ ...glassEffect, borderRadius: '20px', padding: isMobile ? '12px' : '20px', textAlign: 'center' }}>
            <h3 style={{ color: textColor, margin: 0, fontSize: isMobile ? '12px' : '14px', fontWeight: '500' }}>📊 {t('total_service_charge')}</h3>
            <p style={{ fontSize: isMobile ? '18px' : '26px', fontWeight: 'bold', color: '#f59e0b', margin: '6px 0 0 0' }}>RM {totalServiceCharge.toFixed(2)}</p>
          </div>
          <div style={{ ...glassEffect, borderRadius: '20px', padding: isMobile ? '12px' : '20px', textAlign: 'center' }}>
            <h3 style={{ color: textColor, margin: 0, fontSize: isMobile ? '12px' : '14px', fontWeight: '500' }}>🏷️ {t('total_tax')}</h3>
            <p style={{ fontSize: isMobile ? '18px' : '26px', fontWeight: 'bold', color: '#06b6d4', margin: '6px 0 0 0' }}>RM {totalTax.toFixed(2)}</p>
          </div>
          <div style={{ ...glassEffect, borderRadius: '20px', padding: isMobile ? '12px' : '20px', textAlign: 'center' }}>
            <h3 style={{ color: textColor, margin: 0, fontSize: isMobile ? '12px' : '14px', fontWeight: '500', marginBottom: '6px' }}>🗑️ {t('delete_data')}</h3>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => openDeleteModal('single')} style={{ background: '#ef4444', color: 'white', padding: isMobile ? '6px 12px' : '8px 16px', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', fontSize: isMobile ? '10px' : '12px' }}>📅 By Date</button>
              <button onClick={() => openDeleteModal('range')} style={{ background: '#dc2626', color: 'white', padding: isMobile ? '6px 12px' : '8px 16px', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', fontSize: isMobile ? '10px' : '12px' }}>📆 Range</button>
            </div>
          </div>
        </div>

        {/* Pending Payments Alert */}
        {pendingPayments > 0 && (
          <div style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderRadius: '20px', padding: isMobile ? '12px' : '18px', marginBottom: '20px', textAlign: 'center', color: 'white' }}>
            <h3 style={{ margin: 0, fontSize: isMobile ? '13px' : '16px' }}>⚠️ {t('pending_payments_warning')} {pendingPayments} {t('unpaid_orders')}</h3>
            <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: isMobile ? '10px' : '12px' }}>{t('record_payment_staff')}</p>
          </div>
        )}

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div style={{ ...glassEffect, borderRadius: '20px', padding: isMobile ? '12px' : '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ margin: 0, color: textColor, fontSize: isMobile ? '14px' : '17px', fontWeight: 'bold' }}>📈 Sales Trend (Last 7 Days)</h2>
              <select value={chartType} onChange={(e) => setChartType(e.target.value)} style={{ padding: isMobile ? '4px 10px' : '6px 12px', borderRadius: '30px', border: `1px solid ${borderColor}`, background: cardBg, color: textColor, fontSize: isMobile ? '11px' : '12px' }}>
                <option value="bar">Bar</option>
                <option value="line">Line</option>
              </select>
            </div>
            <div style={{ height: isMobile ? '200px' : '260px' }}>
              <Bar data={salesTrendChartData} options={barChartOptions} />
            </div>
          </div>
          
          <div style={{ ...glassEffect, borderRadius: '20px', padding: isMobile ? '12px' : '20px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '12px', color: textColor, fontSize: isMobile ? '14px' : '17px', fontWeight: 'bold' }}>💰 {t('payment_breakdown')}</h2>
            <div style={{ height: isMobile ? '160px' : '220px' }}>
              <Doughnut data={paymentChartData} options={paymentChartOptions} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '10px' : '20px', marginTop: '12px', flexWrap: 'wrap', fontSize: isMobile ? '10px' : '12px' }}>
              <div><span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#22c55e', borderRadius: '2px', marginRight: '4px' }}></span> Cash: RM {paymentBreakdown.cash.toFixed(2)}</div>
              <div><span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#06b6d4', borderRadius: '2px', marginRight: '4px' }}></span> TNG: RM {paymentBreakdown.tng.toFixed(2)}</div>
              <div><span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#8b5cf6', borderRadius: '2px', marginRight: '4px' }}></span> Bank: RM {paymentBreakdown.bank.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Top Items */}
        <div style={{ ...glassEffect, borderRadius: '20px', padding: isMobile ? '12px' : '20px', marginBottom: '20px' }}>
          <h2 style={{ marginTop: 0, marginBottom: '12px', color: textColor, fontSize: isMobile ? '14px' : '17px', fontWeight: 'bold' }}>🔥 {t('top_items')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px' }}>
            {topItems.slice(0, isMobile ? 5 : 10).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '10px' : '14px', background: secondaryBg, borderRadius: '16px' }}>
                <span style={{ color: textColor, fontSize: isMobile ? '13px' : '14px' }}>
                  <span style={{ display: 'inline-block', width: '22px', height: '22px', background: idx < 3 ? '#f59e0b' : '#94a3b8', color: 'white', borderRadius: '50%', textAlign: 'center', lineHeight: '22px', fontWeight: 'bold', fontSize: isMobile ? '11px' : '13px', marginRight: '10px' }}>{idx + 1}</span>
                  <strong>{item.name}</strong>
                </span>
                <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: isMobile ? '12px' : '14px' }}>{t('sold')}: {item.count} {t('times')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div style={{ ...glassEffect, borderRadius: '20px', padding: isMobile ? '12px' : '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ margin: 0, color: textColor, fontSize: isMobile ? '14px' : '17px', fontWeight: 'bold' }}>📋 {t('orders_list')}</h2>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ padding: isMobile ? '8px 12px' : '10px 16px', borderRadius: '30px', border: `1px solid ${borderColor}`, background: inputBg, color: textColor, fontSize: isMobile ? '12px' : '13px', fontWeight: '500' }} />
          </div>

          {/* Search Bar */}
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: isMobile ? '12px' : '14px', color: textMuted }}>🔍</span>
            <input type="text" placeholder={t('search_orders')} value={searchOrderTerm} onChange={(e) => setSearchOrderTerm(e.target.value)} style={{ width: '100%', padding: isMobile ? '10px 12px 10px 36px' : '12px 16px 12px 44px', borderRadius: '40px', border: `1px solid ${borderColor}`, background: inputBg, color: textColor, fontSize: isMobile ? '12px' : '13px', outline: 'none' }} />
          </div>

          {filteredOrders.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '30px', color: textMuted, fontSize: isMobile ? '13px' : '14px' }}>{t('no_orders')}</p>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '700px' : 'auto' }}>
                  <thead>
                    <tr style={{ background: darkMode ? '#2a2a3e' : '#1e293b', color: 'white' }}>
                      <th style={{ padding: isMobile ? '10px' : '14px', textAlign: 'left', fontSize: isMobile ? '11px' : '13px' }}>{t('id')}</th>
                      <th style={{ padding: isMobile ? '10px' : '14px', textAlign: 'left', fontSize: isMobile ? '11px' : '13px' }}>{t('type')}</th>
                      <th style={{ padding: isMobile ? '10px' : '14px', textAlign: 'left', fontSize: isMobile ? '11px' : '13px' }}>{t('customer_name')}</th>
                      <th style={{ padding: isMobile ? '10px' : '14px', textAlign: 'left', fontSize: isMobile ? '11px' : '13px' }}>{t('total')}</th>
                      <th style={{ padding: isMobile ? '10px' : '14px', textAlign: 'left', fontSize: isMobile ? '11px' : '13px' }}>{t('payment_method')}</th>
                      <th style={{ padding: isMobile ? '10px' : '14px', textAlign: 'left', fontSize: isMobile ? '11px' : '13px' }}>{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrders.map(order => (
                      <tr key={order.id} style={{ borderBottom: `1px solid ${borderColor}`, color: textColor }}>
                        <td style={{ padding: isMobile ? '8px' : '12px', fontSize: isMobile ? '11px' : '13px' }}>{order.order_number || `ORD-${order.id}`}</td>
                        <td style={{ padding: isMobile ? '8px' : '12px', fontSize: isMobile ? '11px' : '13px' }}>{order.order_type === 'take_away' ? '🥡 Take Away' : order.table_number ? `🍽️ Table ${order.table_number}` : '🚶 Walk-in'}</td>
                        <td style={{ padding: isMobile ? '8px' : '12px', fontSize: isMobile ? '11px' : '13px', fontWeight: '500' }}>{order.customer_name || 'Walk-in'}</td>
                        <td style={{ padding: isMobile ? '8px' : '12px', fontWeight: 'bold', color: '#22c55e', fontSize: isMobile ? '12px' : '14px' }}>RM {order.total?.toFixed(2)}</td>
                        <td style={{ padding: isMobile ? '8px' : '12px', fontSize: isMobile ? '11px' : '13px' }}>{order.payment_method === 'cash' ? '💵 Cash' : order.payment_method === 'tng' ? '📱 TnG' : order.payment_method === 'bank' ? '🏦 Bank' : '-'}</td>
                        <td style={{ padding: isMobile ? '8px' : '12px' }}>{order.payment_status === 'paid' ? <span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: '30px', fontSize: isMobile ? '9px' : '11px', fontWeight: 'bold' }}>✓ Paid</span> : <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '30px', fontSize: isMobile ? '9px' : '11px', fontWeight: 'bold' }}>⏳ Unpaid</span>}</td>
                       </tr>
                    ))}
                  </tbody>
                 </table>
              </div>
              <PaginationComponent />
              <div style={{ textAlign: 'center', marginTop: '12px', fontSize: isMobile ? '10px' : '12px', color: textMuted }}>
                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} orders
              </div>
            </>
          )}
        </div>

        {/* DELETE MODAL */}
        {showDeleteModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, animation: 'fadeIn 0.2s ease' }}>
            <div style={{ background: cardBg, padding: isMobile ? '20px' : '32px', borderRadius: '24px', maxWidth: isMobile ? '95%' : '450px', width: '90%', ...glassEffect, animation: 'popIn 0.3s ease' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ width: isMobile ? '48px' : '60px', height: isMobile ? '48px' : '60px', background: '#ef4444', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto' }}>
                  <span style={{ fontSize: isMobile ? '24px' : '28px' }}>⚠️</span>
                </div>
                <h2 style={{ marginTop: 0, color: textColor, fontSize: isMobile ? '18px' : '22px', fontWeight: 'bold' }}>
                  {deleteType === 'single' ? 'Padam Pesanan Mengikut Tarikh' : 'Padam Pesanan Mengikut Julat Tarikh'}
                </h2>
                <p style={{ color: textMuted, fontSize: isMobile ? '11px' : '13px', marginTop: '6px' }}>
                  {deleteType === 'single' 
                    ? 'Tindakan ini akan memadam SEMUA pesanan yang telah DIBAYAR pada tarikh yang dipilih.' 
                    : 'Tindakan ini akan memadam SEMUA pesanan yang telah DIBAYAR dalam julat tarikh yang dipilih.'}
                </p>
                <p style={{ color: '#ef4444', fontSize: isMobile ? '10px' : '12px', marginTop: '6px', fontWeight: 'bold' }}>
                  ⚠️ Tindakan ini TIDAK BOLEH dibatalkan!
                </p>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                {deleteType === 'single' ? (
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: isMobile ? '11px' : '13px', color: textColor }}>📅 Pilih Tarikh:</label>
                    <input type="date" value={deleteStartDate} onChange={(e) => setDeleteStartDate(e.target.value)} style={{ width: '100%', padding: isMobile ? '10px' : '12px', borderRadius: '12px', border: `1px solid ${borderColor}`, background: inputBg, color: textColor, outline: 'none', fontSize: isMobile ? '13px' : '14px' }} />
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: isMobile ? '11px' : '13px', color: textColor }}>📅 Tarikh Mula:</label>
                    <input type="date" value={deleteStartDate} onChange={(e) => setDeleteStartDate(e.target.value)} style={{ width: '100%', padding: isMobile ? '10px' : '12px', borderRadius: '12px', border: `1px solid ${borderColor}`, background: inputBg, color: textColor, outline: 'none', fontSize: isMobile ? '13px' : '14px', marginBottom: '10px' }} />
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: isMobile ? '11px' : '13px', color: textColor }}>📅 Tarikh Akhir:</label>
                    <input type="date" value={deleteEndDate} onChange={(e) => setDeleteEndDate(e.target.value)} style={{ width: '100%', padding: isMobile ? '10px' : '12px', borderRadius: '12px', border: `1px solid ${borderColor}`, background: inputBg, color: textColor, outline: 'none', fontSize: isMobile ? '13px' : '14px' }} />
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: isMobile ? '11px' : '13px', color: textColor }}>
                  Taip <span style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: isMobile ? '14px' : '16px' }}>DELETE</span> untuk sahkan:
                </label>
                <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="DELETE" style={{ width: '100%', padding: isMobile ? '10px' : '12px', borderRadius: '12px', border: `2px solid ${deleteConfirmText === 'DELETE' ? '#22c55e' : '#ef4444'}`, background: inputBg, color: textColor, outline: 'none', fontSize: isMobile ? '13px' : '14px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 'bold' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={executeDelete} disabled={deleteConfirmText !== 'DELETE' || deleting} style={{ flex: 1, background: deleteConfirmText === 'DELETE' ? '#ef4444' : '#cbd5e1', color: 'white', padding: isMobile ? '10px' : '14px', border: 'none', borderRadius: '40px', cursor: deleteConfirmText === 'DELETE' ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                  {deleting ? '⏳ Memadam...' : '✅ Ya, Padam'}
                </button>
                <button onClick={() => setShowDeleteModal(false)} style={{ flex: 1, background: '#64748b', color: 'white', padding: isMobile ? '10px' : '14px', border: 'none', borderRadius: '40px', cursor: 'pointer', fontWeight: 'bold' }}>
                  ❌ Batal
                </button>
              </div>
            </div>
          </div>
        )}

        <style>
          {`
            .spinner { width: 40px; height: 40px; border: 3px solid rgba(59,130,246,0.2); border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes popIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
            ::-webkit-scrollbar { width: 6px; height: 6px; }
            ::-webkit-scrollbar-track { background: ${darkMode ? '#2a2a3e' : '#e2e8f0'}; border-radius: 10px; }
            ::-webkit-scrollbar-thumb { background: ${darkMode ? '#555' : '#94a3b8'}; border-radius: 10px; }
            table { border-radius: 12px; overflow: hidden; }
          `}
        </style>
      </div>
    </Sidebar>
  )
}

export default AdminReport