import { Routes, Route, Navigate } from 'react-router-dom'
import StaffApp from './StaffApp'
import CustomerMenu from './CustomerMenu'
import CustomerDisplay from './CustomerDisplay'
import AdminReport from './AdminReport'
import ProtectedRoute from './ProtectedRoute'
import ManageMenu from './ManageMenu'
import ManageCategories from './ManageCategories'
import ManageStaff from './ManageStaff'
import ManageSettings from './ManageSettings'
import ManageTables from './ManageTables'
import TableQRs from './TableQRs'
import KitchenApp from './KitchenApp'
import Dashboard from './Dashboard'
import Login from './Login'
import TrackOrder from './TrackOrder'

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/menu" element={<CustomerMenu />} />
      <Route path="/display" element={<CustomerDisplay />} />
      <Route path="/track" element={<TrackOrder />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><Dashboard /></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><StaffApp /></ProtectedRoute>} />
      <Route path="/kitchen" element={<ProtectedRoute allowedRoles={['admin', 'staff', 'kitchen']}><KitchenApp /></ProtectedRoute>} />
      <Route path="/admin-report" element={<ProtectedRoute allowedRoles={['admin']}><AdminReport /></ProtectedRoute>} />
      <Route path="/manage-menu" element={<ProtectedRoute allowedRoles={['admin']}><ManageMenu /></ProtectedRoute>} />
      <Route path="/manage-categories" element={<ProtectedRoute allowedRoles={['admin']}><ManageCategories /></ProtectedRoute>} />
      <Route path="/manage-staff" element={<ProtectedRoute allowedRoles={['admin']}><ManageStaff /></ProtectedRoute>} />
      <Route path="/manage-tables" element={<ProtectedRoute allowedRoles={['admin']}><ManageTables /></ProtectedRoute>} />
      <Route path="/table-qrs" element={<ProtectedRoute allowedRoles={['admin']}><TableQRs /></ProtectedRoute>} />
      <Route path="/manage-settings" element={<ProtectedRoute allowedRoles={['admin']}><ManageSettings /></ProtectedRoute>} />
      
      {/* Default */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App