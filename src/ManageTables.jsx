import { useState, useEffect } from 'react'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'
import Sidebar from './components/Sidebar'
import TableQRCode from './components/TableQRCode'
import { supabase } from './lib/supabase'

function ManageTables() {
  const { darkMode } = useTheme()
  const { language, t } = useLanguage()
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [selectedTable, setSelectedTable] = useState(null)
  const [newTableNumber, setNewTableNumber] = useState('')
  const [newTableCapacity, setNewTableCapacity] = useState(4)
  const [editCapacity, setEditCapacity] = useState(4)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Theme colors
  const bgColor = darkMode ? '#0f0f1a' : '#f1f5f9'
  const textColor = darkMode ? '#f1f5f9' : '#0f172a'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const cardBg = darkMode ? 'rgba(30, 30, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.6)'
  const inputBg = darkMode ? '#1e1e2e' : '#ffffff'
  const secondaryBg = darkMode ? 'rgba(30, 30, 46, 0.8)' : 'rgba(248, 250, 252, 0.9)'
  
  const glassEffect = {
    background: cardBg,
    backdropFilter: 'blur(12px)',
    border: `1px solid ${borderColor}`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
  }

  useEffect(() => {
    loadTables()
  }, [])

  async function loadTables() {
    setLoading(true)
    const { data, error } = await supabase.from('tables').select('*').order('table_number', { ascending: true })
    if (error) {
      console.error('Error loading tables:', error)
    } else {
      setTables(data || [])
    }
    setLoading(false)
  }

  async function addTable() {
    if (!newTableNumber) {
      setMessage('⚠️ ' + (language === 'bm' ? 'Sila masukkan nombor meja' : 'Please enter table number'))
      setTimeout(() => setMessage(''), 2000)
      return
    }

    const tableNum = parseInt(newTableNumber)
    const existing = tables.find(t => t.table_number === tableNum)
    if (existing) {
      setMessage(`⚠️ ${t('table')} ${tableNum} ${t('table_exists')}!`)
      setTimeout(() => setMessage(''), 2000)
      return
    }

    const { error } = await supabase.from('tables').insert([{
      table_number: tableNum,
      status: 'available'
    }])

    if (error) {
      setMessage('❌ ' + t('error_updating') + ': ' + error.message)
    } else {
      setMessage(`✅ ${t('table')} ${tableNum} ${t('table_added')}!`)
      setShowAddModal(false)
      setNewTableNumber('')
      setNewTableCapacity(4)
      loadTables()
    }
    setTimeout(() => setMessage(''), 2000)
  }

  async function updateTableCapacity() {
    if (!selectedTable) return

    const { error } = await supabase
      .from('tables')
      .update({ capacity: parseInt(editCapacity) })
      .eq('id', selectedTable.id)

    if (error) {
      if (error.message.includes('column "capacity" does not exist')) {
        setMessage(`ℹ️ ${t('table')} ${selectedTable.table_number} ${t('table_updated')} (Capacity feature requires database update)`)
      } else {
        setMessage('❌ ' + t('error_updating') + ': ' + error.message)
      }
    } else {
      setMessage(`✅ ${t('table')} ${selectedTable.table_number} ${t('table_updated')} ${t('capacity')} ke ${editCapacity} ${t('capacity_people')}`)
    }
    setShowEditModal(false)
    setSelectedTable(null)
    loadTables()
    setTimeout(() => setMessage(''), 2000)
  }

  async function deleteTable(id, tableNumber) {
    setShowDeleteConfirm(null)
    
    const { data: orders, error: orderError } = await supabase
      .from('customer_orders')
      .select('id')
      .eq('table_number', tableNumber)
      .eq('payment_status', 'unpaid')
      .limit(1)

    if (orders && orders.length > 0) {
      setMessage(`⚠️ ${t('table')} ${tableNumber} ${t('table_has_unpaid_orders')}`)
      setTimeout(() => setMessage(''), 3000)
      return
    }

    const { error } = await supabase.from('tables').delete().eq('id', id)
    if (error) {
      setMessage('❌ ' + t('error_updating') + ': ' + error.message)
    } else {
      setMessage(`✅ ${t('table')} ${tableNumber} ${t('table_deleted')}!`)
      loadTables()
    }
    setTimeout(() => setMessage(''), 2000)
  }

  async function updateTableStatus(id, newStatus) {
    const { error } = await supabase.from('tables').update({ status: newStatus }).eq('id', id)
    if (error) {
      setMessage('❌ ' + t('error_updating') + ': ' + error.message)
    } else {
      loadTables()
    }
    setTimeout(() => setMessage(''), 2000)
  }

  const openEditModal = (table) => {
    setSelectedTable(table)
    setEditCapacity(table.capacity || 4)
    setShowEditModal(true)
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'available':
        return { bg: '#22c55e', icon: '🟢', text: t('status_available') }
      case 'occupied':
        return { bg: '#ef4444', icon: '🔴', text: t('status_occupied') }
      case 'reserved':
        return { bg: '#f59e0b', icon: '🟡', text: t('status_reserved') }
      default:
        return { bg: '#64748b', icon: '⚪', text: t('status_inactive') }
    }
  }

  // Responsive grid columns
  const tableGridCols = isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(320px, 1fr))'

  if (loading) {
    return (
      <Sidebar>
        <div style={{ padding: '20px', textAlign: 'center', background: bgColor, minHeight: '100vh' }}>
          <div className="spinner"></div>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      <div style={{ padding: isMobile ? '12px' : '24px', background: bgColor, minHeight: '100vh' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <div style={{
              width: isMobile ? '44px' : '56px',
              height: isMobile ? '44px' : '56px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '24px' : '28px',
              boxShadow: '0 4px 12px rgba(245,158,11,0.3)'
            }}>
              🪑
            </div>
            <div>
              <h1 style={{ margin: 0, color: textColor, fontSize: isMobile ? '22px' : '28px', fontWeight: 'bold' }}>
                {t('manage_tables')}
              </h1>
              <p style={{ color: textMuted, marginTop: '2px', fontSize: isMobile ? '11px' : '14px' }}>
                {t('manage_tables_desc')}
              </p>
            </div>
          </div>
          <div style={{ height: '3px', width: '60px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', borderRadius: '3px', marginTop: '6px' }} />
        </div>

        {/* Message Alert */}
        {message && (
          <div style={{ 
            background: message.includes('✅') ? '#dcfce7' : message.includes('⚠️') ? '#fef3c7' : message.includes('ℹ️') ? '#dbeafe' : '#fee2e2', 
            color: message.includes('✅') ? '#166534' : message.includes('⚠️') ? '#92400e' : message.includes('ℹ️') ? '#1e40af' : '#991b1b', 
            padding: '10px 16px', 
            borderRadius: '40px', 
            marginBottom: '20px', 
            textAlign: 'center',
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: '500'
          }}>
            {message}
          </div>
        )}

        {/* Stats Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{ ...glassEffect, borderRadius: '20px', padding: isMobile ? '12px 16px' : '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: isMobile ? '24px' : '28px' }}>🪑</span>
            <div>
              <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold', color: textColor }}>{tables.length}</div>
              <div style={{ fontSize: isMobile ? '10px' : '12px', color: textMuted }}>{t('tables')}</div>
            </div>
          </div>
          <div style={{ ...glassEffect, borderRadius: '20px', padding: isMobile ? '12px 16px' : '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: isMobile ? '24px' : '28px' }}>🟢</span>
            <div>
              <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold', color: '#22c55e' }}>{tables.filter(t => t.status === 'available').length}</div>
              <div style={{ fontSize: isMobile ? '10px' : '12px', color: textMuted }}>{t('status_available')}</div>
            </div>
          </div>
          <div style={{ ...glassEffect, borderRadius: '20px', padding: isMobile ? '12px 16px' : '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: isMobile ? '24px' : '28px' }}>🔴</span>
            <div>
              <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold', color: '#ef4444' }}>{tables.filter(t => t.status === 'occupied').length}</div>
              <div style={{ fontSize: isMobile ? '10px' : '12px', color: textMuted }}>{t('status_occupied')}</div>
            </div>
          </div>
          <div style={{ ...glassEffect, borderRadius: '20px', padding: isMobile ? '12px 16px' : '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: isMobile ? '24px' : '28px' }}>🟡</span>
            <div>
              <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold', color: '#f59e0b' }}>{tables.filter(t => t.status === 'reserved').length}</div>
              <div style={{ fontSize: isMobile ? '10px' : '12px', color: textMuted }}>{t('status_reserved')}</div>
            </div>
          </div>
        </div>

        {/* Add Table Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button 
            onClick={() => setShowAddModal(true)}
            style={{ 
              background: 'linear-gradient(135deg, #22c55e, #16a34a)', 
              color: 'white', 
              padding: isMobile ? '8px 20px' : '12px 28px', 
              border: 'none', 
              borderRadius: '40px', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              fontSize: isMobile ? '13px' : '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'transform 0.2s' 
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{ fontSize: isMobile ? '16px' : '18px' }}>+</span> {t('add_table')}
          </button>
        </div>

        {/* Tables Grid */}
        {tables.length === 0 ? (
          <div style={{ textAlign: 'center', padding: isMobile ? '40px 20px' : '80px 20px', ...glassEffect, borderRadius: '24px' }}>
            <span style={{ fontSize: isMobile ? '48px' : '64px', opacity: 0.5 }}>🪑</span>
            <p style={{ color: textMuted, marginTop: '12px', fontSize: isMobile ? '13px' : '14px' }}>{t('no_tables')}</p>
            <button 
              onClick={() => setShowAddModal(true)}
              style={{ 
                marginTop: '16px',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)', 
                color: 'white', 
                padding: isMobile ? '8px 20px' : '10px 24px', 
                border: 'none', 
                borderRadius: '40px', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                fontSize: isMobile ? '13px' : '14px' 
              }}
            >
              + {t('add_table')}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: tableGridCols, gap: isMobile ? '12px' : '24px' }}>
            {tables.map(table => {
              const statusBadge = getStatusBadge(table.status)
              return (
                <div key={table.id} style={{ ...glassEffect, borderRadius: '20px', padding: isMobile ? '12px' : '20px', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}>
                  {/* QR Code */}
                  <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                    <TableQRCode tableNumber={table.table_number} size={isMobile ? 100 : 120} />
                  </div>
                  
                  {/* Table Info */}
                  <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                    <h2 style={{ margin: 0, fontSize: isMobile ? '22px' : '26px', fontWeight: 'bold', color: textColor }}>{t('table')} {table.table_number}</h2>
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ 
                        display: 'inline-block', 
                        background: statusBadge.bg, 
                        color: 'white', 
                        padding: isMobile ? '4px 12px' : '5px 14px', 
                        borderRadius: '30px', 
                        fontSize: isMobile ? '11px' : '12px', 
                        fontWeight: 'bold' 
                      }}>
                        {statusBadge.icon} {statusBadge.text}
                      </span>
                    </div>
                    <p style={{ fontSize: isMobile ? '11px' : '13px', color: textMuted, marginTop: '8px' }}>
                      👥 {t('capacity')}: {table.capacity || 4} {t('capacity_people')}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <select 
                      value={table.status}
                      onChange={(e) => updateTableStatus(table.id, e.target.value)}
                      style={{ 
                        padding: isMobile ? '6px 10px' : '8px 12px', 
                        borderRadius: '30px', 
                        border: `1px solid ${borderColor}`, 
                        background: inputBg, 
                        color: textColor,
                        fontSize: isMobile ? '11px' : '12px',
                        cursor: 'pointer',
                        outline: 'none',
                        flex: 1,
                        minWidth: isMobile ? '80px' : '100px'
                      }}
                    >
                      <option value="available">🟢 {t('status_available')}</option>
                      <option value="occupied">🔴 {t('status_occupied')}</option>
                      <option value="reserved">🟡 {t('status_reserved')}</option>
                    </select>
                    <button 
                      onClick={() => openEditModal(table)}
                      style={{ 
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                        color: 'white', 
                        padding: isMobile ? '6px 12px' : '8px 16px', 
                        border: 'none', 
                        borderRadius: '30px', 
                        cursor: 'pointer', 
                        fontSize: isMobile ? '11px' : '12px', 
                        fontWeight: 'bold',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      ✏️ {t('edit_capacity')}
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm({ id: table.id, tableNumber: table.table_number })}
                      style={{ 
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
                        color: 'white', 
                        padding: isMobile ? '6px 12px' : '8px 16px', 
                        border: 'none', 
                        borderRadius: '30px', 
                        cursor: 'pointer', 
                        fontSize: isMobile ? '11px' : '12px', 
                        fontWeight: 'bold',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      🗑️ {t('delete')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001, animation: 'fadeIn 0.2s ease' }}>
            <div style={{ background: cardBg, padding: isMobile ? '20px' : '28px', borderRadius: '24px', maxWidth: '380px', width: '90%', textAlign: 'center', ...glassEffect, animation: 'popIn 0.3s ease' }}>
              <div style={{ fontSize: isMobile ? '48px' : '56px', marginBottom: '12px' }}>⚠️</div>
              <h3 style={{ margin: 0, color: textColor, fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold' }}>{t('confirm_delete')}?</h3>
              <p style={{ color: textMuted, marginTop: '10px', fontSize: isMobile ? '13px' : '14px' }}>
                {t('table')} {showDeleteConfirm.tableNumber} {language === 'bm' ? 'akan dipadam' : 'will be deleted'}
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => deleteTable(showDeleteConfirm.id, showDeleteConfirm.tableNumber)} style={{ flex: 1, background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', padding: isMobile ? '10px' : '12px', border: 'none', borderRadius: '40px', cursor: 'pointer', fontWeight: 'bold' }}>
                  ✅ {t('delete')}
                </button>
                <button onClick={() => setShowDeleteConfirm(null)} style={{ flex: 1, background: '#6c757d', color: 'white', padding: isMobile ? '10px' : '12px', border: 'none', borderRadius: '40px', cursor: 'pointer', fontWeight: 'bold' }}>
                  ❌ {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Table Modal */}
        {showAddModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: cardBg, padding: isMobile ? '20px' : '32px', borderRadius: '24px', maxWidth: isMobile ? '95%' : '400px', width: '90%', ...glassEffect, animation: 'popIn 0.3s ease' }}>
              <h2 style={{ marginTop: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: 'bold', marginBottom: '16px', color: textColor }}>➕ {t('add_table')}</h2>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: isMobile ? '11px' : '13px', color: textColor }}>{t('table_number')} *</label>
                <input 
                  type="number" 
                  placeholder={language === 'bm' ? 'Contoh: 24' : 'Example: 24'} 
                  value={newTableNumber} 
                  onChange={(e) => setNewTableNumber(e.target.value)} 
                  style={{ width: '100%', padding: isMobile ? '10px' : '12px', borderRadius: '12px', border: `1px solid ${borderColor}`, background: inputBg, color: textColor, outline: 'none', fontSize: isMobile ? '13px' : '14px' }} 
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: isMobile ? '11px' : '13px', color: textColor }}>{t('capacity')} ({t('capacity_people')})</label>
                <input 
                  type="number" 
                  min="1"
                  max="20"
                  placeholder="4" 
                  value={newTableCapacity} 
                  onChange={(e) => setNewTableCapacity(e.target.value)} 
                  style={{ width: '100%', padding: isMobile ? '10px' : '12px', borderRadius: '12px', border: `1px solid ${borderColor}`, background: inputBg, color: textColor, outline: 'none', fontSize: isMobile ? '13px' : '14px' }} 
                />
                <p style={{ fontSize: isMobile ? '9px' : '11px', color: textMuted, marginTop: '4px' }}>
                  {language === 'bm' ? 'Kapasiti meja (bilangan orang)' : 'Table capacity (number of people)'}
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={addTable} style={{ flex: 1, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', padding: isMobile ? '10px' : '14px', border: 'none', borderRadius: '40px', cursor: 'pointer', fontWeight: 'bold', transition: 'transform 0.2s' }}>💾 {t('save')}</button>
                <button onClick={() => setShowAddModal(false)} style={{ flex: 1, background: '#6c757d', color: 'white', padding: isMobile ? '10px' : '14px', border: 'none', borderRadius: '40px', cursor: 'pointer' }}>{t('cancel')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Capacity Modal */}
        {showEditModal && selectedTable && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: cardBg, padding: isMobile ? '20px' : '32px', borderRadius: '24px', maxWidth: isMobile ? '95%' : '400px', width: '90%', ...glassEffect, animation: 'popIn 0.3s ease' }}>
              <h2 style={{ marginTop: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: 'bold', marginBottom: '16px', color: textColor }}>✏️ {t('edit_capacity_for')}</h2>
              
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ width: isMobile ? '60px' : '80px', height: isMobile ? '60px' : '80px', background: secondaryBg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <span style={{ fontSize: isMobile ? '32px' : '40px' }}>🪑</span>
                </div>
                <h3 style={{ marginTop: '10px', fontSize: isMobile ? '16px' : '18px', color: textColor }}>{t('table')} {selectedTable.table_number}</h3>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: isMobile ? '11px' : '13px', color: textColor }}>{t('capacity')} ({t('capacity_people')})</label>
                <input 
                  type="number" 
                  min="1" 
                  max="20"
                  value={editCapacity} 
                  onChange={(e) => setEditCapacity(e.target.value)} 
                  style={{ width: '100%', padding: isMobile ? '10px' : '12px', borderRadius: '12px', border: `1px solid ${borderColor}`, background: inputBg, color: textColor, outline: 'none', fontSize: isMobile ? '13px' : '14px' }} 
                />
                <p style={{ fontSize: isMobile ? '9px' : '11px', color: textMuted, marginTop: '4px' }}>{t('capacity_question')}</p>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={updateTableCapacity} style={{ flex: 1, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', padding: isMobile ? '10px' : '14px', border: 'none', borderRadius: '40px', cursor: 'pointer', fontWeight: 'bold', transition: 'transform 0.2s' }}>💾 {t('save')}</button>
                <button onClick={() => setShowEditModal(false)} style={{ flex: 1, background: '#6c757d', color: 'white', padding: isMobile ? '10px' : '14px', border: 'none', borderRadius: '40px', cursor: 'pointer' }}>{t('cancel')}</button>
              </div>
            </div>
          </div>
        )}

        <style>
          {`
            .spinner {
              width: 40px;
              height: 40px;
              border: 3px solid rgba(59,130,246,0.2);
              border-top-color: #3b82f6;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes popIn {
              0% { opacity: 0; transform: scale(0.95); }
              100% { opacity: 1; transform: scale(1); }
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
    </Sidebar>
  )
}

export default ManageTables