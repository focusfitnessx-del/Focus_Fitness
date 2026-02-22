import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Toaster } from './components/ui/toaster'
import { useState } from 'react'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import SplashScreen from './components/SplashScreen'
import DashboardPage from './pages/DashboardPage'
import MembersPage from './pages/MembersPage'
import MemberDetailPage from './pages/MemberDetailPage'
import PaymentsPage from './pages/PaymentsPage'
import RemindersPage from './pages/RemindersPage'
import SettingsPage from './pages/SettingsPage'

const Spinner = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
  </div>
)

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { user, loading } = useAuth()
  return (
    <Routes>
      {/* Public landing — always accessible */}
      <Route path="/" element={loading ? <Spinner /> : <LandingPage />} />
      <Route path="/login" element={user && !loading ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      {/* Protected app — pathless layout wrapper */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/members/:id" element={<MemberDetailPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  // Show splash screen only on mobile (future mobile app conversion)
  const [showSplash, setShowSplash] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 768
  )

  return (
    <AuthProvider>
      {showSplash ? (
        <SplashScreen onDone={() => setShowSplash(false)} />
      ) : (
        <>
          <AppRoutes />
          <Toaster />
        </>
      )}
    </AuthProvider>
  )
}
