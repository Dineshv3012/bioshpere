import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, FileText, Tag, BarChart2, Sparkles, ChevronRight } from 'lucide-react'
import Navbar from './Navbar'

const navItems = [
  { to: '/admin',        icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/users',  icon: Users,           label: 'Users' },
  { to: '/admin/posts',  icon: FileText,        label: 'Posts' },
]

export default function AdminLayout() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen flex flex-col bg-dark-900">
      <Navbar />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r border-white/[0.06] hidden lg:block">
          <div className="sticky top-16 p-4">
            <div className="flex items-center gap-2 px-2 py-3 mb-4">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-primary-600 to-sky-400 flex items-center justify-center">
                <Sparkles size={12} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Admin Panel</span>
            </div>
            <nav className="space-y-1">
              {navItems.map(({ to, icon: Icon, label }) => {
                const active = pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      active
                        ? 'bg-primary-600/20 text-primary-400 border border-primary-600/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                    {active && <ChevronRight size={14} className="ml-auto" />}
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
