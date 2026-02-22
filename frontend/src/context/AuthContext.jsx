import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/index'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ff_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      localStorage.removeItem('ff_user');
      localStorage.removeItem('ff_token');
      return null;
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ff_token')
    if (token) {
      authService.me()
        .then((res) => setUser(res.data.user))
        .catch(() => logout())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authService.login(email, password)
    const { token, user } = res.data
    localStorage.setItem('ff_token', token)
    localStorage.setItem('ff_user', JSON.stringify(user))
    setUser(user)
    return user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ff_token')
    localStorage.removeItem('ff_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isOwner: user?.role === 'OWNER' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
