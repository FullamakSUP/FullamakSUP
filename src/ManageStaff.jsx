import { useState, useEffect } from 'react'
import { useTheme } from './context/ThemeContext'
import { useLanguage } from './context/LanguageContext'
import Sidebar from './components/Sidebar'
import { supabase, supabaseAdmin } from './lib/supabase'
import toast from 'react-hot-toast'

function ManageStaff() {
  const { darkMode } = useTheme()
  const { language } = useLanguage()
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
  const [isMobile, setIsMobile] = useState(false)
  const [resetPasswordData, setResetPasswordData] = useState({ password: '', confirmPassword: '' })
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'staff',
    name: '',
    permissions: 'pos'
  })

  // ============================================================
  // TRANSLATIONS
  // ============================================================
  const translations = {
    team_access: { en: 'Team & Access', ms: 'Pasukan & Akses' },
    team_subtitle: { en: 'Manage restaurant staff and system access control', ms: 'Urus kakitangan restoran dan kawalan akses sistem' },
    stats_total_staff: { en: 'Total Staff', ms: 'Jumlah Staff' },
    stats_admin: { en: 'Admins', ms: 'Admin' },
    stats_kitchen_access: { en: 'Kitchen Access', ms: 'Akses Dapur' },
    stats_pos_staff: { en: 'POS Staff', ms: 'Staff POS' },
    search_staff: { en: 'Search staff...', ms: 'Cari staff...' },
    add_staff: { en: 'Add Staff', ms: 'Tambah Staff' },
    staff_found: { en: 'staff found', ms: 'staff dijumpai' },
    no_staff: { en: 'No staff members found', ms: 'Tiada staff dijumpai' },
    admin: { en: 'Admin', ms: 'Admin' },
    staff: { en: 'Staff', ms: 'Staff' },
    kitchen_staff: { en: 'Kitchen', ms: 'Dapur' },
    full_access_role: { en: 'Full Access', ms: 'Akses Penuh' },
    kitchen_only: { en: 'Kitchen Only', ms: 'Dapur Sahaja' },
    pos_only: { en: 'POS Only', ms: 'POS Sahaja' },
    both_access: { en: 'POS + Kitchen', ms: 'POS + Dapur' },
    access: { en: 'Access', ms: 'Akses' },
    edit: { en: 'Edit', ms: 'Edit' },
    delete: { en: 'Delete', ms: 'Hapus' },
    reset_password: { en: 'Reset Password', ms: 'Reset Kata Laluan' },
    save: { en: 'Save', ms: 'Simpan' },
    cancel: { en: 'Cancel', ms: 'Batal' },
    add: { en: 'Add', ms: 'Tambah' },
    reset: { en: 'Reset', ms: 'Reset' },
    email: { en: 'Email', ms: 'Emel' },
    username: { en: 'Username', ms: 'Nama Pengguna' },
    password: { en: 'Password', ms: 'Kata Laluan' },
    confirm_password: { en: 'Confirm Password', ms: 'Sahkan Kata Laluan' },
    new_password: { en: 'New Password', ms: 'Kata Laluan Baru' },
    confirm_new_password: { en: 'Confirm New Password', ms: 'Sahkan Kata Laluan Baru' },
    full_name: { en: 'Full Name', ms: 'Nama Penuh' },
    password_optional: { en: 'Password (optional - leave blank to keep current)', ms: 'Kata Laluan (optional - kosongkan untuk kekal)' },
    min_6_chars: { en: 'min 6 characters', ms: 'min 6 aksara' },
    add_staff_title: { en: 'Add Staff', ms: 'Tambah Staff' },
    edit_staff_title: { en: 'Edit Staff', ms: 'Edit Staff' },
    reset_password_title: { en: 'Reset Password', ms: 'Reset Kata Laluan' },
    reset_password_for: { en: 'Reset password for', ms: 'Reset kata laluan untuk' },
    staff_added: { en: 'Staff added successfully!', ms: 'Staff berjaya ditambah!' },
    staff_updated: { en: 'Staff updated successfully!', ms: 'Staff berjaya dikemaskini!' },
    staff_deleted: { en: 'Staff deleted successfully!', ms: 'Staff berjaya dihapus!' },
    password_reset_success: { en: 'Password reset successfully!', ms: 'Kata laluan berjaya direset!' },
    password_required: { en: 'Password is required!', ms: 'Kata laluan diperlukan!' },
    password_min_length: { en: 'Password must be at least 6 characters!', ms: 'Kata laluan sekurang-kurangnya 6 aksara!' },
    not_match: { en: 'do not match!', ms: 'tidak sepadan!' },
    required: { en: 'is required!', ms: 'diperlukan!' },
    already_exists: { en: 'already exists!', ms: 'sudah wujud!' },
    error_updating: { en: 'Error updating', ms: 'Ralat mengemaskini' },
    cannot_delete_admin: { en: 'Cannot delete admin account!', ms: 'Tidak boleh hapus akaun admin!' },
    cannot_delete_self: { en: 'You cannot delete your own account!', ms: 'Anda tidak boleh hapus akaun sendiri!' },
    cannot_change_role: { en: 'Cannot change role of admin or yourself', ms: 'Tidak boleh tukar peranan admin atau diri sendiri' },
    confirm_delete: { en: 'Confirm Delete', ms: 'Sahkan Hapus' },
    pos: { en: 'POS', ms: 'POS' },
    kitchen: { en: 'Kitchen', ms: 'Dapur' },
    select_access: { en: 'Select which apps this staff can access', ms: 'Pilih aplikasi yang boleh diakses oleh kakitangan ini' },
    update_email: { en: 'Update Email', ms: 'Kemaskini Emel' },
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
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // ============================================================
  // THEME COLORS
  // ============================================================
  const bgColor = darkMode ? '#0a0a16' : '#f1f5f9'
  const cardBg = darkMode ? 'rgba(20, 20, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  const textColor = darkMode ? '#e8edf5' : '#1e293b'
  const textMuted = darkMode ? '#94a3b8' : '#64748b'
  const borderColor = darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.5)'
  const secondaryBg = darkMode ? 'rgba(30, 30, 50, 0.6)' : 'rgba(248, 250, 252, 0.8)'
  const inputBg = darkMode ? '#1a1a2e' : '#ffffff'
  const inputBorder = darkMode ? '#3d3d5c' : '#cbd5e1'
  const inputText = darkMode ? '#e8edf5' : '#1e293b'
  
  const glassEffect = {
    background: cardBg,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${borderColor}`,
    boxShadow: darkMode 
      ? '0 8px 40px rgba(0,0,0,0.5)' 
      : '0 8px 40px rgba(0,0,0,0.06)'
  }

  const inputStyle = {
    width: '100%',
    padding: '14px',
    marginBottom: '14px',
    borderRadius: '16px',
    border: `1px solid ${inputBorder}`,
    background: inputBg,
    color: inputText,
    outline: 'none',
    fontSize: isMobile ? '14px' : '15px',
    transition: 'all 0.2s',
    boxSizing: 'border-box'
  }

  const labelStyle = {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '8px',
    fontSize: '13px',
    color: textColor
  }

  // ============================================================
  // LOAD STAFF
  // ============================================================
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

  // ============================================================
  // CRUD FUNCTIONS - DENGAN SERVICE ROLE KEY
  // ============================================================
  
  // ✅ ADD STAFF
  async function addStaff() {
    if (!formData.email || !formData.username || !formData.password) {
      setMessage(`⚠️ ${t('email')}, ${t('username')} & ${t('password')} ${t('required')}`)
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage(`⚠️ ${t('password')} & ${t('confirm_password')} ${t('not_match')}`)
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (formData.password.length < 6) {
      setMessage(`⚠️ ${t('password_min_length')}`)
      setTimeout(() => setMessage(''), 3000)
      return
    }

    const existing = staff.find(s => s.username === formData.username.toLowerCase())
    if (existing) {
      setMessage(`⚠️ ${t('username')} "${formData.username}" ${t('already_exists')}`)
      setTimeout(() => setMessage(''), 3000)
      return
    }

    try {
      // 1. Create user using ADMIN client (service role)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: formData.email.toLowerCase(),
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          name: formData.name || formData.username,
          role: formData.role
        }
      })

      if (authError) throw authError

      // 2. Insert into staff table
      let permissions = formData.permissions
      if (formData.role === 'admin') {
        permissions = 'all'
      }

      const { error: staffError } = await supabase.from('staff').insert([{
        username: formData.username.toLowerCase(),
        name: formData.name || formData.username,
        role: formData.role,
        permissions: permissions,
        auth_id: authData.user.id,
        password: null
      }])

      if (staffError) throw staffError

      setMessage(`✅ ${t('staff_added')}`)
      toast.success(t('staff_added'))
      setTimeout(() => setMessage(''), 3000)
      setShowAddModal(false)
      setFormData({ email: '', username: '', password: '', confirmPassword: '', role: 'staff', name: '', permissions: 'pos' })
      loadStaff()

    } catch (error) {
      console.error('Add staff error:', error)
      setMessage(`❌ ${t('error_updating')}: ${error.message}`)
      toast.error(error.message)
    }
  }

  // ✅ UPDATE STAFF
  async function updateStaff() {
    if (!formData.username) {
      setMessage(`⚠️ ${t('username')} ${t('required')}`)
      return
    }

    try {
      let permissions = formData.permissions
      if (formData.role === 'admin') {
        permissions = 'all'
      }

      const updateData = {
        role: formData.role,
        name: formData.name || formData.username,
        permissions: permissions
      }

      // Update staff table
      const { error: staffError } = await supabase
        .from('staff')
        .update(updateData)
        .eq('id', selectedStaff.id)

      if (staffError) throw staffError

      // Update auth user metadata
      if (selectedStaff.auth_id) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          selectedStaff.auth_id,
          {
            user_metadata: {
              name: formData.name || formData.username,
              role: formData.role
            }
          }
        )
        if (authError) console.error('Auth update error:', authError)
      }

      // Update password if provided
      if (formData.password) {
        if (formData.password !== formData.confirmPassword) {
          setMessage(`⚠️ ${t('password')} & ${t('confirm_password')} ${t('not_match')}`)
          return
        }
        if (formData.password.length < 6) {
          setMessage(`⚠️ ${t('password_min_length')}`)
          return
        }

        const { error: passError } = await supabaseAdmin.auth.admin.updateUserById(
          selectedStaff.auth_id,
          { password: formData.password }
        )
        if (passError) throw passError
      }

      setMessage(`✅ ${t('staff_updated')}`)
      toast.success(t('staff_updated'))
      setTimeout(() => setMessage(''), 3000)
      setShowEditModal(false)
      setSelectedStaff(null)
      setFormData({ email: '', username: '', password: '', confirmPassword: '', role: 'staff', name: '', permissions: 'pos' })
      loadStaff()

    } catch (error) {
      console.error('Update staff error:', error)
      setMessage(`❌ ${t('error_updating')}: ${error.message}`)
      toast.error(error.message)
    }
  }

  // ✅ UPDATE EMAIL
  async function updateStaffEmail() {
    if (!formData.email) {
      setMessage(`⚠️ ${t('email')} ${t('required')}`)
      return
    }

    try {
      if (!selectedStaff?.auth_id) {
        toast.error('Staff not linked to auth')
        return
      }

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        selectedStaff.auth_id,
        { email: formData.email.toLowerCase() }
      )

      if (authError) throw authError

      setMessage(`✅ Email updated successfully!`)
      toast.success('Email updated!')
      setTimeout(() => setMessage(''), 3000)
      loadStaff()

    } catch (error) {
      console.error('Update email error:', error)
      setMessage(`❌ ${t('error_updating')}: ${error.message}`)
      toast.error(error.message)
    }
  }

  // ✅ RESET PASSWORD
  async function resetPassword() {
    if (!resetPasswordData.password) {
      setMessage(`⚠️ ${t('password_required')}`)
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (resetPasswordData.password !== resetPasswordData.confirmPassword) {
      setMessage(`⚠️ ${t('password')} & ${t('confirm_password')} ${t('not_match')}`)
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (resetPasswordData.password.length < 6) {
      setMessage(`⚠️ ${t('password_min_length')}`)
      setTimeout(() => setMessage(''), 3000)
      return
    }

    try {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        selectedStaff.auth_id,
        { password: resetPasswordData.password }
      )

      if (authError) throw authError

      setMessage(`✅ ${t('password_reset_success')}`)
      toast.success(t('password_reset_success'))
      setTimeout(() => setMessage(''), 3000)
      setShowResetPasswordModal(false)
      setSelectedStaff(null)
      setResetPasswordData({ password: '', confirmPassword: '' })

    } catch (error) {
      console.error('Reset password error:', error)
      setMessage(`❌ ${t('error_updating')}: ${error.message}`)
      toast.error(error.message)
    }
  }

  // ✅ DELETE STAFF
  async function deleteStaff(id, username) {
    setShowDeleteConfirm(null)
    
    if (username === 'admin') {
      setMessage(`⚠️ ${t('cannot_delete_admin')}`)
      toast.error(t('cannot_delete_admin'))
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (currentUser && currentUser.id === id) {
      setMessage(`⚠️ ${t('cannot_delete_self')}`)
      toast.error(t('cannot_delete_self'))
      setTimeout(() => setMessage(''), 3000)
      return
    }

    try {
      const { data: staffData, error: fetchError } = await supabase
        .from('staff')
        .select('auth_id')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      if (staffData?.auth_id) {
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
          staffData.auth_id
        )
        if (authError) console.error('Auth delete error:', authError)
      }

      const { error: staffError } = await supabase
        .from('staff')
        .delete()
        .eq('id', id)

      if (staffError) throw staffError

      setMessage(`✅ ${t('staff_deleted')}`)
      toast.success(t('staff_deleted'))
      setTimeout(() => setMessage(''), 3000)
      loadStaff()

    } catch (error) {
      console.error('Delete staff error:', error)
      setMessage(`❌ ${t('error_updating')}: ${error.message}`)
      toast.error(error.message)
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================
  const openEditModal = (staffMember) => {
    setSelectedStaff(staffMember)
    setFormData({
      email: '',
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

  // ============================================================
  // STATS
  // ============================================================
  const totalStaff = staff.length
  const adminCount = staff.filter(s => s.role === 'admin').length
  const kitchenCount = staff.filter(s => s.role === 'kitchen' || s.permissions === 'kitchen' || s.permissions === 'both').length
  const staffCount = staff.filter(s => s.role === 'staff').length

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <Sidebar>
        <div style={{ 
          padding: '24px', 
          maxWidth: '1000px', 
          margin: '0 auto', 
          background: bgColor, 
          minHeight: '100vh', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <div className="spinner"></div>
        </div>
      </Sidebar>
    )
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <Sidebar>
      <div style={{ 
        padding: isMobile ? '12px' : '24px', 
        maxWidth: '1000px', 
        margin: '0 auto', 
        background: bgColor, 
        minHeight: '100vh' 
      }}>
        
        {/* HEADER */}
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
              <h1 style={{ margin: 0, color: textColor, fontSize: isMobile ? '22px' : '28px', fontWeight: 'bold' }}>
                {t('team_access')}
              </h1>
              <p style={{ color: textMuted, marginTop: '4px', fontSize: isMobile ? '12px' : '14px' }}>
                {t('team_subtitle')}
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

        {/* MESSAGE */}
        {message && (
          <div style={{ 
            background: message.includes('✅') 
              ? (darkMode ? 'rgba(34,197,94,0.15)' : '#dcfce7')
              : message.includes('⚠️') 
                ? (darkMode ? 'rgba(245,158,11,0.15)' : '#fef3c7')
                : (darkMode ? 'rgba(239,68,68,0.15)' : '#fee2e2'),
            color: message.includes('✅') 
              ? (darkMode ? '#4ade80' : '#166534')
              : message.includes('⚠️') 
                ? (darkMode ? '#fbbf24' : '#92400e')
                : (darkMode ? '#f87171' : '#991b1b'),
            padding: '14px 20px', 
            borderRadius: '60px', 
            marginBottom: '24px', 
            textAlign: 'center',
            fontSize: isMobile ? '13px' : '14px',
            fontWeight: '500',
            border: `1px solid ${message.includes('✅') ? 'rgba(34,197,94,0.2)' : message.includes('⚠️') ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`
          }}>
            {message}
          </div>
        )}

        {/* STATS */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '16px', 
          marginBottom: '28px' 
        }}>
          <div style={{ ...glassEffect, borderRadius: '24px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>👥</div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: textColor }}>{totalStaff}</div>
              <div style={{ fontSize: '12px', color: textMuted }}>{t('stats_total_staff')}</div>
            </div>
          </div>
          <div style={{ ...glassEffect, borderRadius: '24px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>👑</div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: textColor }}>{adminCount}</div>
              <div style={{ fontSize: '12px', color: textMuted }}>{t('stats_admin')}</div>
            </div>
          </div>
          <div style={{ ...glassEffect, borderRadius: '24px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🍳</div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: textColor }}>{kitchenCount}</div>
              <div style={{ fontSize: '12px', color: textMuted }}>{t('stats_kitchen_access')}</div>
            </div>
          </div>
          <div style={{ ...glassEffect, borderRadius: '24px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🧾</div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: textColor }}>{staffCount}</div>
              <div style={{ fontSize: '12px', color: textMuted }}>{t('stats_pos_staff')}</div>
            </div>
          </div>
        </div>

        {/* SEARCH & ADD */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, ...glassEffect, borderRadius: '60px', padding: '4px 20px', display: 'flex', alignItems: 'center', minWidth: isMobile ? '150px' : '200px' }}>
            <span style={{ fontSize: '18px', marginRight: '12px', color: textMuted }}>🔍</span>
            <input type="text" placeholder={t('search_staff')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '14px 0', border: 'none', background: 'transparent', color: textColor, fontSize: isMobile ? '13px' : '14px', outline: 'none' }} />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ background: 'transparent', border: 'none', color: textMuted, cursor: 'pointer', fontSize: '16px', padding: '4px' }}>✕</button>
            )}
          </div>
          <button onClick={() => setShowAddModal(true)} style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', padding: isMobile ? '10px 20px' : '12px 28px', border: 'none', borderRadius: '40px', cursor: 'pointer', fontWeight: 'bold', fontSize: isMobile ? '13px' : '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '18px' }}>+</span> {t('add_staff')}
          </button>
        </div>

        {/* STAFF COUNT */}
        <div style={{ marginBottom: '16px', fontSize: isMobile ? '12px' : '13px', color: textMuted }}>
          📊 {filteredStaff.length} {t('staff_found')}
        </div>

        {/* STAFF LIST */}
        {filteredStaff.length === 0 ? (
          <div style={{ textAlign: 'center', padding: isMobile ? '40px 20px' : '80px 20px', ...glassEffect, borderRadius: '28px' }}>
            <span style={{ fontSize: isMobile ? '48px' : '64px', opacity: 0.5 }}>👥</span>
            <p style={{ color: textMuted, marginTop: '16px', fontSize: isMobile ? '14px' : '16px' }}>{t('no_staff')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredStaff.map(member => {
              const roleBadge = getRoleBadge(member.role, member.permissions)
              const avatarIcon = getAvatarIcon(member.role, member.permissions)
              const permissionsText = getPermissionsText(member.permissions, member.role)
              
              return (
                <div key={member.id} style={{ ...glassEffect, borderRadius: '20px', padding: isMobile ? '14px 16px' : '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: isMobile ? '48px' : '60px', height: isMobile ? '48px' : '60px', background: secondaryBg, borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '28px' : '36px', border: `2px solid ${borderColor}` }}>
                      {avatarIcon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: isMobile ? '15px' : '17px', color: textColor }}>{member.name || member.username}</div>
                      <div style={{ fontSize: isMobile ? '11px' : '12px', color: textMuted, marginTop: '2px' }}>@{member.username}</div>
                      <div style={{ fontSize: isMobile ? '10px' : '11px', color: '#8b5cf6', marginTop: '2px' }}>{permissionsText}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ background: roleBadge.bg, color: 'white', padding: isMobile ? '4px 12px' : '6px 16px', borderRadius: '40px', fontSize: isMobile ? '10px' : '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {roleBadge.icon} {roleBadge.text}
                    </span>
                    
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button onClick={() => openEditModal(member)} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: isMobile ? '6px 12px' : '8px 16px', border: 'none', borderRadius: '40px', cursor: 'pointer', fontWeight: 'bold', fontSize: isMobile ? '10px' : '12px', transition: 'all 0.2s' }}>✏️ {t('edit')}</button>
                      <button onClick={() => openResetPasswordModal(member)} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', padding: isMobile ? '6px 12px' : '8px 16px', border: 'none', borderRadius: '40px', cursor: 'pointer', fontWeight: 'bold', fontSize: isMobile ? '10px' : '12px', transition: 'all 0.2s' }}>🔑 {t('reset_password')}</button>
                      <button onClick={() => setShowDeleteConfirm({ id: member.id, username: member.username, name: member.name })} style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', padding: isMobile ? '6px 12px' : '8px 16px', border: 'none', borderRadius: '40px', cursor: 'pointer', fontWeight: 'bold', fontSize: isMobile ? '10px' : '12px', transition: 'all 0.2s' }}>🗑️ {t('delete')}</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ===== DELETE CONFIRMATION ===== */}
        {showDeleteConfirm && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001, animation: 'fadeIn 0.2s ease' }}>
            <div style={{ background: cardBg, padding: isMobile ? '24px' : '28px', borderRadius: '28px', maxWidth: '380px', width: '90%', textAlign: 'center', ...glassEffect, animation: 'popIn 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>⚠️</div>
              <h3 style={{ margin: 0, color: textColor, fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold' }}>{t('confirm_delete')}</h3>
              <p style={{ color: textMuted, marginTop: '12px', fontSize: isMobile ? '13px' : '14px' }}>"{showDeleteConfirm.name || showDeleteConfirm.username}" {language === 'bm' ? 'akan dipadam' : 'will be deleted'}</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button onClick={() => deleteStaff(showDeleteConfirm.id, showDeleteConfirm.username)} style={{ flex: 1, background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', padding: '12px', border: 'none', borderRadius: '40px', cursor: 'pointer', fontWeight: 'bold' }}>✅ {t('delete')}</button>
                <button onClick={() => setShowDeleteConfirm(null)} style={{ flex: 1, background: '#64748b', color: 'white', padding: '12px', border: 'none', borderRadius: '40px', cursor: 'pointer', fontWeight: 'bold' }}>❌ {t('cancel')}</button>
              </div>
            </div>
          </div>
        )}

        {/* ===== ADD STAFF MODAL ===== */}
        {showAddModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: cardBg, padding: isMobile ? '24px' : '32px', borderRadius: '32px', maxWidth: '480px', width: '90%', ...glassEffect, animation: 'popIn 0.3s ease' }}>
              <h2 style={{ marginTop: 0, color: textColor, fontSize: isMobile ? '20px' : '22px', fontWeight: 'bold' }}>{t('add_staff_title')}</h2>
              
              <label style={labelStyle}>📧 {t('email')} *</label>
              <input type="email" placeholder={t('email')} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={inputStyle} onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)' }} onBlur={e => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none' }} />
              
              <label style={labelStyle}>👤 {t('username')} *</label>
              <input type="text" placeholder={t('username')} value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} style={inputStyle} onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)' }} onBlur={e => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none' }} />
              
              <label style={labelStyle}>🔒 {t('password')} * ({t('min_6_chars')})</label>
              <div style={{ position: 'relative', marginBottom: '14px' }}>
                <input type={showPassword ? "text" : "password"} placeholder={t('password')} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} style={{ ...inputStyle, paddingRight: '45px', marginBottom: 0 }} onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)' }} onBlur={e => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: textMuted }}>{showPassword ? '🙈' : '👁️'}</button>
              </div>
              
              <label style={labelStyle}>🔒 {t('confirm_password')} *</label>
              <input type="password" placeholder={t('confirm_password')} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} style={inputStyle} onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)' }} onBlur={e => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none' }} />
              
              <label style={labelStyle}>📛 {t('full_name')}</label>
              <input type="text" placeholder={t('full_name')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={inputStyle} onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)' }} onBlur={e => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none' }} />
              
              <label style={labelStyle}>🎭 {t('role')}</label>
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} style={inputStyle} onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)' }} onBlur={e => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none' }}>
                <option value="staff">👤 {t('staff')}</option>
                <option value="kitchen">🍳 {t('kitchen_staff')}</option>
                <option value="admin">👑 {t('admin')}</option>
              </select>
              
              {formData.role !== 'admin' && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>🚪 {t('access')}</label>
                  <select value={formData.permissions} onChange={(e) => setFormData({ ...formData, permissions: e.target.value })} style={inputStyle} onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)' }} onBlur={e => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none' }}>
                    <option value="pos">🧾 {t('pos_only')}</option>
                    <option value="kitchen">🍳 {t('kitchen_only')}</option>
                    <option value="both">🧾 + 🍳 {t('both_access')}</option>
                  </select>
                  <p style={{ fontSize: '11px', color: textMuted, marginTop: '4px' }}>{t('select_access')}</p>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={addStaff} style={{ flex: 1, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', padding: '14px', border: 'none', borderRadius: '60px', cursor: 'pointer', fontWeight: 'bold' }}>{t('add')}</button>
                <button onClick={() => setShowAddModal(false)} style={{ flex: 1, background: '#64748b', color: 'white', padding: '14px', border: 'none', borderRadius: '60px', cursor: 'pointer' }}>{t('cancel')}</button>
              </div>
            </div>
          </div>
        )}

        {/* ===== EDIT STAFF MODAL ===== */}
        {showEditModal && selectedStaff && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: cardBg, padding: isMobile ? '24px' : '32px', borderRadius: '32px', maxWidth: '480px', width: '90%', ...glassEffect, animation: 'popIn 0.3s ease' }}>
              <h2 style={{ marginTop: 0, color: textColor, fontSize: isMobile ? '20px' : '22px', fontWeight: 'bold' }}>{t('edit_staff_title')}</h2>
              
              <label style={labelStyle}>👤 {t('username')}</label>
              <input type="text" value={formData.username} disabled style={{ ...inputStyle, background: darkMode ? '#2a2a3e' : '#f0f0f0', color: darkMode ? '#888' : '#999', cursor: 'not-allowed' }} />
              
              <label style={labelStyle}>📧 {t('email')}</label>
              <input type="email" placeholder={t('email')} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={inputStyle} onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)' }} onBlur={e => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none' }} />
              <button onClick={updateStaffEmail} style={{ width: '100%', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', padding: '10px', border: 'none', borderRadius: '40px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '14px' }}>📧 {t('update_email')}</button>
              
              <label style={labelStyle}>🔒 {t('password_optional')}</label>
              <div style={{ position: 'relative', marginBottom: '14px' }}>
                <input type={showPassword ? "text" : "password"} placeholder={t('password_optional')} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} style={{ ...inputStyle, paddingRight: '45px', marginBottom: 0 }} onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)' }} onBlur={e => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: textMuted }}>{showPassword ? '🙈' : '👁️'}</button>
              </div>
              
              <label style={labelStyle}>🔒 {t('confirm_password')}</label>
              <input type="password" placeholder={t('confirm_password')} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} style={inputStyle} onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)' }} onBlur={e => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none' }} />
              
              <label style={labelStyle}>📛 {t('full_name')}</label>
              <input type="text" placeholder={t('full_name')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={inputStyle} onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)' }} onBlur={e => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none' }} />
              
              <label style={labelStyle}>🎭 {t('role')}</label>
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} disabled={selectedStaff.username === 'admin' || (currentUser && currentUser.id === selectedStaff.id)} style={{ ...inputStyle, background: (selectedStaff.username === 'admin' || (currentUser && currentUser.id === selectedStaff.id)) ? (darkMode ? '#2a2a3e' : '#f0f0f0') : inputBg, cursor: (selectedStaff.username === 'admin' || (currentUser && currentUser.id === selectedStaff.id)) ? 'not-allowed' : 'pointer' }}>
                <option value="staff">👤 {t('staff')}</option>
                <option value="kitchen">🍳 {t('kitchen_staff')}</option>
                <option value="admin">👑 {t('admin')}</option>
              </select>
              
              {formData.role !== 'admin' && selectedStaff.username !== 'admin' && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>🚪 {t('access')}</label>
                  <select value={formData.permissions} onChange={(e) => setFormData({ ...formData, permissions: e.target.value })} style={inputStyle} onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)' }} onBlur={e => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none' }}>
                    <option value="pos">🧾 {t('pos_only')}</option>
                    <option value="kitchen">🍳 {t('kitchen_only')}</option>
                    <option value="both">🧾 + 🍳 {t('both_access')}</option>
                  </select>
                  <p style={{ fontSize: '11px', color: textMuted, marginTop: '4px' }}>{t('select_access')}</p>
                </div>
              )}
              
              {(selectedStaff.username === 'admin' || (currentUser && currentUser.id === selectedStaff.id)) && (
                <p style={{ fontSize: '11px', color: '#f59e0b', marginBottom: '15px' }}>⚠️ {t('cannot_change_role')}</p>
              )}
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={updateStaff} style={{ flex: 1, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', padding: '14px', border: 'none', borderRadius: '60px', cursor: 'pointer', fontWeight: 'bold' }}>{t('save')}</button>
                <button onClick={() => setShowEditModal(false)} style={{ flex: 1, background: '#64748b', color: 'white', padding: '14px', border: 'none', borderRadius: '60px', cursor: 'pointer' }}>{t('cancel')}</button>
              </div>
            </div>
          </div>
        )}

        {/* ===== RESET PASSWORD MODAL ===== */}
        {showResetPasswordModal && selectedStaff && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: cardBg, padding: isMobile ? '24px' : '32px', borderRadius: '32px', maxWidth: '480px', width: '90%', ...glassEffect, animation: 'popIn 0.3s ease' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}><span style={{ fontSize: '28px' }}>🔑</span></div>
                <h2 style={{ marginTop: 0, color: textColor, fontSize: isMobile ? '20px' : '22px', fontWeight: 'bold' }}>{t('reset_password_title')}</h2>
                <p style={{ color: textMuted, fontSize: isMobile ? '12px' : '13px' }}>{t('reset_password_for')} <strong>{selectedStaff.name || selectedStaff.username}</strong></p>
              </div>
              
              <label style={labelStyle}>🔒 {t('new_password')} * ({t('min_6_chars')})</label>
              <div style={{ position: 'relative', marginBottom: '14px' }}>
                <input type={showPassword ? "text" : "password"} placeholder={t('new_password')} value={resetPasswordData.password} onChange={(e) => setResetPasswordData({ ...resetPasswordData, password: e.target.value })} style={{ ...inputStyle, paddingRight: '45px', marginBottom: 0 }} onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)' }} onBlur={e => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: textMuted }}>{showPassword ? '🙈' : '👁️'}</button>
              </div>
              
              <label style={labelStyle}>🔒 {t('confirm_new_password')} *</label>
              <input type="password" placeholder={t('confirm_new_password')} value={resetPasswordData.confirmPassword} onChange={(e) => setResetPasswordData({ ...resetPasswordData, confirmPassword: e.target.value })} style={{ ...inputStyle, marginBottom: '24px' }} onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)' }} onBlur={e => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none' }} />
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={resetPassword} style={{ flex: 1, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', padding: '14px', border: 'none', borderRadius: '60px', cursor: 'pointer', fontWeight: 'bold' }}>🔑 {t('reset')}</button>
                <button onClick={() => setShowResetPasswordModal(false)} style={{ flex: 1, background: '#64748b', color: 'white', padding: '14px', border: 'none', borderRadius: '60px', cursor: 'pointer' }}>{t('cancel')}</button>
              </div>
            </div>
          </div>
        )}

        <style>
          {`
            .spinner { width: 48px; height: 48px; border: 4px solid rgba(59,130,246,0.15); border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes popIn { 0% { opacity: 0; transform: scale(0.95) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: ${darkMode ? '#1a1a2e' : '#e2e8f0'}; border-radius: 10px; }
            ::-webkit-scrollbar-thumb { background: ${darkMode ? '#3d3d5c' : '#94a3b8'}; border-radius: 10px; }
            button, input, select { transition: all 0.2s ease; }
            button:hover:not(:disabled) { opacity: 0.88; transform: scale(0.97); }
            button:active:not(:disabled) { transform: scale(0.93); }
            input:focus, select:focus { outline: none; }
          `}
        </style>
      </div>
    </Sidebar>
  )
}

export default ManageStaff