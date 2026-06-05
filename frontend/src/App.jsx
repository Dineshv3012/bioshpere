import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './context/authStore'

// Layout
import Layout from './components/layout/Layout'
import AdminLayout from './components/layout/AdminLayout'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import BlogPost from './pages/BlogPost'
import CreatePost from './pages/CreatePost'
import EditPost from './pages/EditPost'
import Profile from './pages/Profile'
import Dashboard from './pages/Dashboard'
import Bookmarks from './pages/Bookmarks'
import Search from './pages/Search'
import CategoryPage from './pages/CategoryPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminPosts from './pages/admin/AdminPosts'
import NotFound from './pages/NotFound'

// Guards
function ProtectedRoute({ children }) {
  const { user, initialized } = useAuthStore()
  if (!initialized) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, initialized } = useAuthStore()
  if (!initialized) return null
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function GuestRoute({ children }) {
  const { user } = useAuthStore()
  if (user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => { initialize() }, [initialize])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route element={<Layout />}>
          <Route path="/"                  element={<Home />} />
          <Route path="/post/:slug"        element={<BlogPost />} />
          <Route path="/search"            element={<Search />} />
          <Route path="/category/:slug"    element={<CategoryPage />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/verify-email"      element={<VerifyEmail />} />
        </Route>

        {/* Guest only */}
        <Route element={<Layout />}>
          <Route path="/login"          element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register"       element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
          <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
        </Route>

        {/* Protected */}
        <Route element={<Layout />}>
          <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/bookmarks"  element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
          <Route path="/write"      element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
          <Route path="/edit/:id"   element={<ProtectedRoute><EditPost /></ProtectedRoute>} />
        </Route>

        {/* Admin */}
        <Route element={<AdminLayout />}>
          <Route path="/admin"        element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users"  element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/posts"  element={<AdminRoute><AdminPosts /></AdminRoute>} />
        </Route>

        <Route element={<Layout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
