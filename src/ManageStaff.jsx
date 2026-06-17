import { useState, useEffect } from 'react'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'
import Sidebar from './components/Sidebar'
import { supabase } from './lib/supabase'

function ManageStaff() {
  const { darkMode } = useTheme()
  const { language, t } = useLanguage()
  const [staff, setStaff] = useState([])
  const [filteredStaff, setFilteredStaff] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [resetPasswordData, setResetPasswordData] = useState({ password: '', confirmPassword: '' })
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'staff',
    name: '',
    permissions: 'pos'
  })

  // Modern theme colors
  const bgColor = darkMode ? '#0f0f1a' : '#f1f5f9'
  const cardBg = darkMode ? 'rgba(30, 30, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  const textColor = darkMode ? '#f1f5f9' : '#0f172a'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.6)'
  const secondaryBg = darkMode ? 'rgba(30, 30, 46, 0.8)' : 'rgba(248, 250, 252, 0.9)'
  const inputBg = darkMode ? '#1e1e2e' : '#ffffff'
  const inputBorder = darkMode ? '#334155' : '#cbd5e1'
  
  const glassEffect = {
    background: cardBg,
    backdropFilter: 'blur(12px)',
    border: `1px solid ${borderColor}`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
  }

  useEffect(() => {
    loadStaff()
    getCurrentUser()
  }, [])

  useEffect(() => {
    const filtered = staff.filter(member =>
      member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredStaff(filtered)
  }, [searchTerm, staff])

  async function getCurrentUser() {
    const savedAuth = sessionStorage.getItem('staffAuth')
    if (savedAuth) {
      const user = JSON.parse(savedAuth)
      setCurrentUser(user)
    }
  }

  async function loadStaff() {
    setLoading(true)
    const { data } = await supabase.from('staff').select('*')
    setStaff(data || [])
    setFilteredStaff(data || [])
    setLoading(false)
  }

  async function addStaff() {
    if (!formData.username || !formData.password) {
      setMessage('⚠️ ' + t('username') + ' & ' + t('password') + ' ' + t('required'))
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('⚠️ ' + t('password') + ' & ' + t('confirm_password') + ' ' + t('not_match'))
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (formData.password.length < 6) {
      setMessage('⚠️ ' + t('password_min_length'))
      setTimeout(() => setMessage(''), 3000)
      return
    }

    const existing = staff.find(s => s.username === formData.username.toLowerCase())
    if (existing) {
      setMessage(`⚠️ ${t('username')} "${formData.username}" ${t('already_exists')}`)
      setTimeout(() => setMessage(''), 3000)
      return
    }

    let permissions = formData.permissions
    if (formData.role === 'admin') {
      permissions = 'all'
    }

    const { error } = await supabase.from('staff').insert([{
      username: formData.username.toLowerCase(),
      password: formData.password,
      role: formData.role,
      name: formData.name || formData.username,
      permissions: permissions
    }])

    if (error) {
      setMessage('❌ ' + t('error_updating') + ': ' + error.message)
    } else {
      setMessage('✅ ' + t('staff_added'))
      setTimeout(() => setMessage(''), 3000)
      setShowAddModal(false)
      setFormData({ username: '', password: '', confirmPassword: '', role: 'staff', name: '', permissions: 'pos' })
      loadStaff()
    }
  }

  async function updateStaff() {
    if (!formData.username) {
      setMessage('⚠️ ' + t('username') + ' ' + t('required'))
      return
    }

    let permissions = formData.permissions
    if (formData.role === 'admin') {
      permissions = 'all'
    }

    const updateData = {
      role: formData.role,
      name: formData.name || formData.username,
      permissions: permissions
    }
    if (formData.password) {
      updateData.password = formData.password
    }

    const { error } = await supabase
      .from('staff')
      .update(updateData)
      .eq('id', selectedStaff.id)

    if (error) {
      setMessage('❌ ' + t('error_updating') + ': ' + error.message)
    } else {
      setMessage('✅ ' + t('staff_updated'))
      setTimeout(() => setMessage(''), 3000)
      setShowEditModal(false)
      setSelectedStaff(null)
      setFormData({ username: '', password: '', confirmPassword: '', role: 'staff', name: '', permissions: 'pos' })
      loadStaff()
    }
  }

  async function resetPassword() {
    if (!resetPasswordData.password) {
      setMessage('⚠️ ' + t('password_required'))
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (resetPasswordData.password !== resetPasswordData.confirmPassword) {
      setMessage('⚠️ ' + t('password') + ' & ' + t('confirm_password') + ' ' + t('not_match'))
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (resetPasswordData.password.length < 6) {
      setMessage('⚠️ ' + t('password_min_length'))
      setTimeout(() => setMessage(''), 3000)
      return
    }

    const { error } = await supabase
      .from('staff')
      .update({ password: resetPasswordData.password })
      .eq('id', selectedStaff.id)

    if (error) {
      setMessage('❌ ' + t('error_updating') + ': ' + error.message)
    } else {
      setMessage('✅ ' + t('password_reset_success'))
      setTimeout(() => setMessage(''), 3000)
      setShowResetPasswordModal(false)
      setSelectedStaff(null)
      setResetPasswordData({ password: '', confirmPassword: '' })
    }
  }

  async function deleteStaff(id, username) {
    setShowDeleteConfirm(null)
    
    if (username === 'admin') {
      setMessage('⚠️ ' + t('cannot_delete_admin'))
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (currentUser && currentUser.id === id) {
      setMessage('⚠️ ' + t('cannot_delete_self'))
      setTimeout(() => setMessage(''), 3000)
      return
    }

    const { error } = await supabase.from('staff').delete().eq('id', id)
    if (error) {
      setMessage('❌ ' + t('error_updating') + ': ' + error.message)
    } else {
      setMessage('✅ ' + t('staff_deleted'))
      setTimeout(() => setMessage(''), 3000)
      loadStaff()
    }
  }

  const openEditModal = (staffMember) => {
    setSelectedStaff(staffMember)
    setFormData({
      username: staffMember.username,
      password: '',
      confirmPassword: '',
      role: staffMember.role,
      name: staffMember.name || '',
      permissions: staffMember.permissions || (staffMember.role === 'admin' ? 'all' : 'pos')
    })
    setShowEditModal(true)
  }

  const openResetPasswordModal = (staffMember) => {
    setSelectedStaff(staffMember)
    setResetPasswordData({ password: '', confirmPassword: '' })
    setShowResetPasswordModal(true)
  }

  const getRoleBadge = (role, permissions) => {
    if (role === 'admin') {
      return { bg: 'linear-gradient(135deg, #ef4444, #dc2626)', icon: '👑', text: t('admin'), access: t('full_access_role') }
    }
    if (role === 'kitchen') {
      if (permissions === 'both') {
        return { bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', icon: '🍳+🧾', text: t('kitchen_staff'), access: t('both_access') }
      }
      return { bg: 'linear-gradient(135deg, #06b6d4, #0891b2)', icon: '🍳', text: t('kitchen_staff'), access: t('kitchen_only') }
    }
    if (permissions === 'both') {
      return { bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', icon: '🧾+🍳', text: t('staff'), access: t('both_access') }
    }
    if (permissions === 'kitchen') {
      return { bg: 'linear-gradient(135deg, #06b6d4, #0891b2)', icon: '🍳', text: t('staff'), access: t('kitchen_only') }
    }
    return { bg: 'linear-gradient(135deg, #22c55e, #16a34a)', icon: '🧾', text: t('staff'), access: t('pos_only') }
  }

  const getAvatarIcon = (role, permissions) => {
    if (role === 'admin') return '👑'
    if (role === 'kitchen') return '🍳'
    if (permissions === 'both') return '🧾+🍳'
    if (permissions === 'kitchen') return '🍳'
    return '🧾'
  }

  const getPermissionsText = (permissions, role) => {
    if (role === 'admin') return `👑 ${t('admin')} - ${t('full_access_role')}`
    if (permissions === 'both') return `🧾 ${t('pos')} + 🍳 ${t('kitchen')}`
    if (permissions === 'kitchen') return `🍳 ${t('kitchen_only')}`
    return `🧾 ${t('pos_only')}`
  }

  const totalStaff = staff.length
  const adminCount = staff.filter(s => s.role === 'admin').length
  const kitchenCount = staff.filter(s => s.role === 'kitchen' || s.permissions === 'kitchen' || s.permissions === 'both').length
  const staffCount = staff.filter(s => s.role === 'staff').length

  if (loading) {
    return (
      <Sidebar>
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', background: bgColor, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="spinner"></div>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', background: bgColor, minHeight: '100vh' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: '0 8px 20px rgba(59,130,246,0.3)'
            }}>
              👥
            </div>
            <div>
              <h1 style={{ margin: 0, color: textColor, fontSize: '28px', fontWeight: 'bold' }}>
                {language === 'bm' ? 'Pasukan & Akses' : 'Team & Access'}
              </h1>
              <p style={{ color: textMuted, marginTop: '4px', fontSize: '14px' }}>
                {language === 'bm' 
                  ? 'Urus kakitangan restoran dan kawalan akses sistem' 
                  : 'Manage restaurant staff and system access control'}
              </p>
            </div>
          </div>
          <div style={{ 
            height: '4px', 
            width: '80px', 
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
            borderRadius: '4px',
            marginTop: '8px'
          }} />
        </div>

        {/* Message Alert */}
        {message && (
          <div style={{ background: message.includes('✅') ? '#dcfce7' : message.includes('⚠️') ? '#fef3c7' : '#fee2e2', color: message.includes('✅') ? '#166534' : message.includes('⚠️') ? '#92400e' : '#991b1b', padding: '14px 20px', borderRadius: '60px', marginBottom: '24px', textAlign: 'center', fontSize: '14px', fontWeight: '500' }}>
            {message}
          </div>
        )}

        {/* Stats Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <div style={{ ...glassEffect, borderRadius: '24px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>👥</div>
            <div><div style={{ fontSize: '24px', fontWeight: 'bold', color: textColor }}>{totalStaff}</div><div style={{ fontSize: '12px', color: textMuted }}>{t('stats_total_staff')}</div></div>
          </div>
          <div style={{ ...glassEffect, borderRadius: '24px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>👑</div>
            <div><div style={{ fontSize: '24px', fontWeight: 'bold', color: textColor }}>{adminCount}</div><div style={{ fontSize: '12px', color: textMuted }}>{t('stats_admin')}</div></div>
          </div>
          <div style={{ ...glassEffect, borderRadius: '24px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🍳</div>
            <div><div style={{ fontSize: '24px', fontWeight: 'bold', color: textColor }}>{kitchenCount}</div><div style={{ fontSize: '12px', color: textMuted }}>{t('stats_kitchen_access')}</div></div>
          </div>
          <div style={{ ...glassEffect, borderRadius: '24px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🧾</div>
            <div><div style={{ fontSize: '24px', fontWeight: 'bold', color: textColor }}>{staffCount}</div><div style={{ fontSize: '12px', color: textMuted }}>{t('stats_pos_staff')}</div></div>
          </div>
        </div>

        {/* Search and Add Button */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, ...glassEffect, borderRadius: '60px', padding: '4px 20px', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '18px', marginRight: '12px', color: textMuted }}>🔍</span>
            <input type="text" placeholder={t('search_staff')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '14px 0', border: 'none', background: 'transparent', color: textColor, fontSize: '14px', outline: 'none' }} />
          </div>
          <button 
            onClick={() => setShowAddModal(true)} 
            style={{ 
              background: 'linear-gradient(135deg, #22c55e, #16a34a)', 
              color: 'white', 
              padding: '12px 28px', 
              border: 'none', 
              borderRadius: '40px', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{ fontSize: '18px' }}>+</span> {t('add_staff')}
          </button>
        </div>

        {/* Staff Count */}
        <div style={{ marginBottom: '16px', fontSize: '13px', color: textMuted }}>
          📊 {filteredStaff.length} {t('staff_found')}
        </div>

        {/* Staff List */}
        {filteredStaff.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', ...glassEffect, borderRadius: '28px' }}>
            <span style={{ fontSize: '64px', opacity: 0.5 }}>👥</span>
            <p style={{ color: textMuted, marginTop: '16px' }}>{t('no_staff')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredStaff.map(member => {
              const roleBadge = getRoleBadge(member.role, member.permissions)
              const avatarIcon = getAvatarIcon(member.role, member.permissions)
              const permissionsText = getPermissionsText(member.permissions, member.role)
              
              return (
                <div key={member.id} style={{ ...glassEffect, borderRadius: '20px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '60px', height: '60px', background: secondaryBg, borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', border: `2px solid ${borderColor}` }}>
                      {avatarIcon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '17px', color: textColor }}>{member.name || member.username}</div>
                      <div style={{ fontSize: '12px', color: textMuted, marginTop: '2px' }}>@{member.username}</div>
                      <div style={{ fontSize: '11px', color: '#8b5cf6', marginTop: '2px' }}>{permissionsText}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ background: roleBadge.bg, color: 'white', padding: '6px 16px', borderRadius: '40px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {roleBadge.icon} {roleBadge.text}
                    </span>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openEditModal(member)} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '8px 18px', border: 'none', borderRadius: '40px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                        ✏️ {t('edit')}
                      </button>
                      <button onClick={() => openResetPasswordModal(member)} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', padding: '8px 18px', border: 'none', borderRadius: '40px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                        🔑 {t('reset_password')}
                      </button>
                      <button onClick={() => setShowDeleteConfirm({ id: member.id, username: member.username, name: member.name })} style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', padding: '8px 18px', border: 'none', borderRadius: '40px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                        🗑️ {t('delete')}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001, animation: 'fadeIn 0.2s ease' }}>
            <div style={{ background: cardBg, padding: '28px', borderRadius: '28px', maxWidth: '380px', width: '90%', textAlign: 'center', ...glassEffect, animation: 'popIn 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>⚠️</div>
              <h3 style={{ margin: 0, color: textColor, fontSize: '20px', fontWeight: 'bold' }}>{t('confirm_delete')}?</h3>
              <p style={{ color: textMuted, marginTop: '12px', fontSize: '14px' }}>
                "{showDeleteConfirm.name || showDeleteConfirm.username}" {language === 'bm' ? 'akan dipadam' : 'will be deleted'}
              </p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button onClick={() => deleteStaff(showDeleteConfirm.id, showDeleteConfirm.username)} style={{ flex: 1, background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', padding: '12px', border: 'none', borderRadius: '40px', cursor: 'pointer', fontWeight: 'bold' }}>
                  ✅ {t('delete')}
                </button>
                <button onClick={() => setShowDeleteConfirm(null)} style={{ flex: 1, background: '#6c757d', color: 'white', padding: '12px', border: 'none', borderRadius: '40px', cursor: 'pointer', fontWeight: 'bold' }}>
                  ❌ {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Staff Modal */}
        {showAddModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: cardBg, padding: '32px', borderRadius: '32px', maxWidth: '480px', width: '90%', ...glassEffect, animation: 'popIn 0.3s ease' }}>
              <h2 style={{ marginTop: 0, color: textColor, fontSize: '22px', fontWeight: 'bold' }}>➕ {t('add_staff')}</h2>
              
              <input type="text" placeholder={t('username') + ' *'} value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} style={{ width: '100%', padding: '14px', marginBottom: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, background: inputBg, color: textColor, outline: 'none', fontSize: '14px' }} />
              
              <div style={{ position: 'relative', marginBottom: '14px' }}>
                <input type={showPassword ? "text" : "password"} placeholder={t('password') + ' * (' + t('min_6_chars') + ')'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, background: inputBg, color: textColor, outline: 'none', paddingRight: '45px', fontSize: '14px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: textMuted }}>{showPassword ? '🙈' : '👁️'}</button>
              </div>
              
              <input type="password" placeholder={t('confirm_password') + ' *'} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} style={{ width: '100%', padding: '14px', marginBottom: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, background: inputBg, color: textColor, outline: 'none', fontSize: '14px' }} />
              
              <input type="text" placeholder={t('full_name')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '14px', marginBottom: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, background: inputBg, color: textColor, outline: 'none', fontSize: '14px' }} />
              
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} style={{ width: '100%', padding: '14px', marginBottom: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, background: inputBg, color: textColor, outline: 'none', fontSize: '14px' }}>
                <option value="staff">👤 {t('staff')}</option>
                <option value="kitchen">🍳 {t('kitchen_staff')}</option>
                <option value="admin">👑 {t('admin')}</option>
              </select>
              
              {formData.role !== 'admin' && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: textColor }}>🚪 {t('access')}</label>
                  <select value={formData.permissions} onChange={(e) => setFormData({ ...formData, permissions: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, background: inputBg, color: textColor, outline: 'none', fontSize: '14px' }}>
                    <option value="pos">🧾 {t('pos_only')}</option>
                    <option value="kitchen">🍳 {t('kitchen_only')}</option>
                    <option value="both">🧾 + 🍳 {t('both_access')}</option>
                  </select>
                  <p style={{ fontSize: '11px', color: textMuted, marginTop: '4px' }}>{language === 'bm' ? 'Pilih aplikasi yang boleh diakses oleh kakitangan ini' : 'Select which apps this staff can access'}</p>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={addStaff} style={{ flex: 1, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', padding: '14px', border: 'none', borderRadius: '60px', cursor: 'pointer', fontWeight: 'bold' }}>{t('add')}</button>
                <button onClick={() => setShowAddModal(false)} style={{ flex: 1, background: '#6c757d', color: 'white', padding: '14px', border: 'none', borderRadius: '60px', cursor: 'pointer' }}>{t('cancel')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Staff Modal */}
        {showEditModal && selectedStaff && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: cardBg, padding: '32px', borderRadius: '32px', maxWidth: '480px', width: '90%', ...glassEffect, animation: 'popIn 0.3s ease' }}>
              <h2 style={{ marginTop: 0, color: textColor, fontSize: '22px', fontWeight: 'bold' }}>✏️ {t('edit_staff')}</h2>
              
              <input type="text" placeholder={t('username')} value={formData.username} disabled style={{ width: '100%', padding: '14px', marginBottom: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, background: darkMode ? '#2a2a3e' : '#f0f0f0', color: darkMode ? '#888' : '#999', outline: 'none', fontSize: '14px' }} />
              
              <div style={{ position: 'relative', marginBottom: '14px' }}>
                <input type={showPassword ? "text" : "password"} placeholder={t('password_optional')} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, background: inputBg, color: textColor, outline: 'none', paddingRight: '45px', fontSize: '14px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: textMuted }}>{showPassword ? '🙈' : '👁️'}</button>
              </div>
              
              <input type="password" placeholder={t('confirm_password')} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} style={{ width: '100%', padding: '14px', marginBottom: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, background: inputBg, color: textColor, outline: 'none', fontSize: '14px' }} />
              
              <input type="text" placeholder={t('full_name')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '14px', marginBottom: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, background: inputBg, color: textColor, outline: 'none', fontSize: '14px' }} />
              
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} disabled={selectedStaff.username === 'admin' || (currentUser && currentUser.id === selectedStaff.id)} style={{ width: '100%', padding: '14px', marginBottom: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, background: (selectedStaff.username === 'admin' || (currentUser && currentUser.id === selectedStaff.id)) ? (darkMode ? '#2a2a3e' : '#f0f0f0') : inputBg, color: textColor, outline: 'none', fontSize: '14px' }}>
                <option value="staff">👤 {t('staff')}</option>
                <option value="kitchen">🍳 {t('kitchen_staff')}</option>
                <option value="admin">👑 {t('admin')}</option>
              </select>
              
              {formData.role !== 'admin' && selectedStaff.username !== 'admin' && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: textColor }}>🚪 {t('access')}</label>
                  <select value={formData.permissions} onChange={(e) => setFormData({ ...formData, permissions: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, background: inputBg, color: textColor, outline: 'none', fontSize: '14px' }}>
                    <option value="pos">🧾 {t('pos_only')}</option>
                    <option value="kitchen">🍳 {t('kitchen_only')}</option>
                    <option value="both">🧾 + 🍳 {t('both_access')}</option>
                  </select>
                  <p style={{ fontSize: '11px', color: textMuted, marginTop: '4px' }}>{language === 'bm' ? 'Pilih aplikasi yang boleh diakses oleh kakitangan ini' : 'Select which apps this staff can access'}</p>
                </div>
              )}
              
              {(selectedStaff.username === 'admin' || (currentUser && currentUser.id === selectedStaff.id)) && (
                <p style={{ fontSize: '11px', color: '#f59e0b', marginBottom: '15px' }}>⚠️ {t('cannot_change_role')}</p>
              )}
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={updateStaff} style={{ flex: 1, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', padding: '14px', border: 'none', borderRadius: '60px', cursor: 'pointer', fontWeight: 'bold' }}>{t('save')}</button>
                <button onClick={() => setShowEditModal(false)} style={{ flex: 1, background: '#6c757d', color: 'white', padding: '14px', border: 'none', borderRadius: '60px', cursor: 'pointer' }}>{t('cancel')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {showResetPasswordModal && selectedStaff && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: cardBg, padding: '32px', borderRadius: '32px', maxWidth: '480px', width: '90%', ...glassEffect, animation: 'popIn 0.3s ease' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}><span style={{ fontSize: '28px' }}>🔑</span></div>
                <h2 style={{ marginTop: 0, color: textColor, fontSize: '22px', fontWeight: 'bold' }}>{t('reset_password')}</h2>
                <p style={{ color: textMuted, fontSize: '13px' }}>{language === 'bm' ? 'Reset kata laluan untuk' : 'Reset password for'} <strong>{selectedStaff.name || selectedStaff.username}</strong></p>
              </div>
              
              <div style={{ position: 'relative', marginBottom: '14px' }}>
                <input type={showPassword ? "text" : "password"} placeholder={t('new_password') + ' * (' + t('min_6_chars') + ')'} value={resetPasswordData.password} onChange={(e) => setResetPasswordData({ ...resetPasswordData, password: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: `1px solid ${borderColor}`, background: inputBg, color: textColor, outline: 'none', paddingRight: '45px', fontSize: '14px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: textMuted }}>{showPassword ? '🙈' : '👁️'}</button>
              </div>
              
              <input type="password" placeholder={t('confirm_new_password') + ' *'} value={resetPasswordData.confirmPassword} onChange={(e) => setResetPasswordData({ ...resetPasswordData, confirmPassword: e.target.value })} style={{ width: '100%', padding: '14px', marginBottom: '24px', borderRadius: '16px', border: `1px solid ${borderColor}`, background: inputBg, color: textColor, outline: 'none', fontSize: '14px' }} />
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={resetPassword} style={{ flex: 1, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', padding: '14px', border: 'none', borderRadius: '60px', cursor: 'pointer', fontWeight: 'bold' }}>🔑 {t('reset')}</button>
                <button onClick={() => setShowResetPasswordModal(false)} style={{ flex: 1, background: '#6c757d', color: 'white', padding: '14px', border: 'none', borderRadius: '60px', cursor: 'pointer' }}>{t('cancel')}</button>
              </div>
            </div>
          </div>
        )}

        <style>
          {`
            .spinner { width: 48px; height: 48px; border: 4px solid rgba(59,130,246,0.2); border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes popIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: ${darkMode ? '#2a2a3e' : '#e2e8f0'}; border-radius: 10px; }
            ::-webkit-scrollbar-thumb { background: ${darkMode ? '#555' : '#94a3b8'}; border-radius: 10px; }
          `}
        </style>
      </div>
    </Sidebar>
  )
}

export default ManageStaff