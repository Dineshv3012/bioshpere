import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PenSquare, Search, Bell, BookmarkIcon, User, LogOut,
  LayoutDashboard, ChevronDown, Menu, X, Shield, Sparkles
} from 'lucide-react'
import useAuthStore from '../../context/authStore'
import { notificationsAPI } from '../../api'
import { useQuery } from '@tanstack/react-query'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const dropRef = useRef(null)

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.list().then(r => r.data),
    enabled: !!user,
    refetchInterval: 30000,
  })
  const unread = notifData?.filter(n => !n.is_read).length || 0

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`)
      setSearchVal('')
    }
  }

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/[0.06]">
      <nav className="page-container flex items-center justify-between h-16 gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-sky-400 flex items-center justify-center shadow-lg shadow-primary-600/30">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg text-white hidden sm:block">
            Blog<span className="gradient-text">Sphere</span>
          </span>
        </Link>

        {/* Search – desktop */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-sm">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Search articles…"
              className="w-full bg-white/5 border border-white/[0.08] text-slate-300 placeholder-slate-600 text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-primary-500/40 focus:ring-1 focus:ring-primary-500/30 transition-all"
            />
          </div>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/write" className="btn-primary hidden sm:flex items-center gap-2 text-sm py-2">
                <PenSquare size={15} /> Write
              </Link>

              <Link to="/bookmarks" className="btn-ghost relative p-2">
                <BookmarkIcon size={19} />
              </Link>

              {/* Notifications */}
              <button className="btn-ghost relative p-2">
                <Bell size={19} />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {/* User menu */}
              <div ref={dropRef} className="relative">
                <button
                  onClick={() => setDropOpen(v => !v)}
                  className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-white/5 transition-colors"
                >
                  <img
                    src={user.profile_image || `https://ui-avatars.com/api/?name=${user.username}&background=1E3A8A&color=fff`}
                    alt={user.username}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-600/30"
                  />
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {dropOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 glass border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
                    >
                      <div className="p-3 border-b border-white/[0.06]">
                        <p className="text-sm font-semibold text-white">{user.full_name || user.username}</p>
                        <p className="text-xs text-slate-400 mt-0.5">@{user.username}</p>
                      </div>
                      <div className="py-1">
                        {[
                          { to: `/profile/${user.username}`, icon: User, label: 'Profile' },
                          { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                          { to: '/bookmarks', icon: BookmarkIcon, label: 'Bookmarks' },
                          ...(user.role === 'admin' ? [{ to: '/admin', icon: Shield, label: 'Admin Panel' }] : []),
                        ].map(({ to, icon: Icon, label }) => (
                          <Link
                            key={to}
                            to={to}
                            onClick={() => setDropOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <Icon size={15} /> {label}
                          </Link>
                        ))}
                      </div>
                      <div className="py-1 border-t border-white/[0.06]">
                        <button
                          onClick={logout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
                        >
                          <LogOut size={15} /> Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Link to="/login"    className="btn-ghost text-sm">Sign in</Link>
              <Link to="/register" className="btn-primary text-sm py-2 hidden sm:flex">Get started</Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button onClick={() => setMenuOpen(v => !v)} className="btn-ghost p-2 md:hidden">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-white/[0.06] overflow-hidden"
          >
            <div className="page-container py-4 space-y-2">
              <form onSubmit={(e) => { handleSearch(e); setMenuOpen(false) }} className="flex gap-2">
                <input
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  placeholder="Search…"
                  className="input-field text-sm py-2"
                />
                <button type="submit" className="btn-primary py-2 px-4 text-sm">Go</button>
              </form>
              {user && (
                <Link to="/write" onClick={() => setMenuOpen(false)} className="btn-primary flex items-center gap-2 text-sm w-full justify-center">
                  <PenSquare size={15} /> Write a post
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
