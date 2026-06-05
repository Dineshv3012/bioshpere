import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users, FileText, MessageCircle, Eye, TrendingUp, Activity } from 'lucide-react'
import { adminAPI } from '../../api'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

// Demo chart data
const chartData = [
  { name: 'Jan', users: 40, posts: 24 },
  { name: 'Feb', users: 65, posts: 38 },
  { name: 'Mar', users: 55, posts: 45 },
  { name: 'Apr', users: 80, posts: 60 },
  { name: 'May', users: 75, posts: 52 },
  { name: 'Jun', users: 110, posts: 78 },
  { name: 'Jul', users: 130, posts: 95 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl p-3 text-xs border border-white/10">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminAPI.stats().then(r => r.data),
  })

  const statCards = [
    { icon: Users,       label: 'Total Users',    value: stats?.total_users    || 0, color: 'from-blue-600 to-blue-800',   glow: 'shadow-blue-600/20' },
    { icon: FileText,    label: 'Total Posts',    value: stats?.total_posts    || 0, color: 'from-violet-600 to-violet-800', glow: 'shadow-violet-600/20' },
    { icon: MessageCircle,label:'Total Comments', value: stats?.total_comments || 0, color: 'from-emerald-600 to-emerald-800',glow: 'shadow-emerald-600/20' },
    { icon: Eye,         label: 'Total Views',    value: stats?.total_views    || 0, color: 'from-sky-600 to-sky-800',      glow: 'shadow-sky-600/20' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Platform analytics at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, label, value, color, glow }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`glass rounded-2xl p-5 shadow-xl ${glow}`}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-lg`}>
              <Icon size={18} className="text-white" />
            </div>
            {isLoading ? (
              <div className="h-7 bg-white/5 rounded w-16 animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-5">
            <TrendingUp size={14} className="text-primary-400" /> User Growth
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="users" stroke="#2563EB" strokeWidth={2} fill="url(#colorUsers)" name="Users" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-5">
            <Activity size={14} className="text-sky-400" /> Posts Published
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="posts" fill="#38BDF8" radius={[4, 4, 0, 0]} name="Posts" opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
