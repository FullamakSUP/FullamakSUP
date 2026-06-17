import { Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

function ProtectedRoute({ children, allowedRoles = [] }) {
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const savedAuth = sessionStorage.getItem('staffAuth')
      if (savedAuth) {
        try {
          const auth = JSON.parse(savedAuth)
          setUserRole(auth.role)
        } catch (e) {
          setUserRole(null)
        }
      } else {
        setUserRole(null)
      }
      setLoading(false)
    }
    
    checkAuth()
    window.addEventListener('storage', checkAuth)
    
    return () => {
      window.removeEventListener('storage', checkAuth)
    }
  }, [])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#f1f5f9'
      }}>
        <div className="spinner"></div>
      </div>
    )
  }

  if (!userRole) {
    return <Navigate to="/login" replace />
  }

  // If allowedRoles is empty, allow all authenticated users
  if (allowedRoles.length === 0) {
    return children
  }

  // Check if user role is allowed
  if (!allowedRoles.includes(userRole)) {
    // Redirect based on role
    if (userRole === 'kitchen') {
      return <Navigate to="/kitchen" replace />
    } else if (userRole === 'staff') {
      return <Navigate to="/staff" replace />
    } else if (userRole === 'admin') {
      return <Navigate to="/dashboard" replace />
    }
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute