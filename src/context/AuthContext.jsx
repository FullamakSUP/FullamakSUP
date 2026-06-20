// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: staffData } = await supabase
          .from('staff')
          .select('id, username, name, role')
          .eq('auth_id', session.user.id)
          .single()
        
        if (staffData) {
          setUser({
            id: staffData.id,
            email: session.user.email,
            username: staffData.username,
            name: staffData.name || staffData.username,
            role: staffData.role || 'staff'
          })
        }
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: staffData } = await supabase
            .from('staff')
            .select('id, username, name, role')
            .eq('auth_id', session.user.id)
            .single()
          
          if (staffData) {
            setUser({
              id: staffData.id,
              email: session.user.email,
              username: staffData.username,
              name: staffData.name || staffData.username,
              role: staffData.role || 'staff'
            })
          }
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    sessionStorage.removeItem('staffAuth')
    return { error }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)