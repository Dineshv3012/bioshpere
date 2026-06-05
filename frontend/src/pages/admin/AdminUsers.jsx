import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, ShieldOff, Trash2, Search, BadgeCheck } from 'lucide-react'
import { adminAPI } from '../../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function AdminUsers() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => adminAPI.users({ page, per_page: 20 }).then(r => r.data),
  })

  const banMutation = useMutation({
    mutationFn: (id) => adminAPI.banUser(id),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('User banned') },
  })
  const unbanMutation = useMutation({
    mutationFn: (id) => adminAPI.unbanUser(id),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('User unbanned') },
  })

  const filtered = data?.items?.filter(u =>
    !search || u.username?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Users <span className="text-slate-500 text-base font-normal">({data?.total || 0})</span></h1>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users…"
            className="bg-white/5 border border-white/[0.08] text-slate-300 placeholder-slate-600 text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-primary-500/40 transition-all w-52"
          />
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['User', 'Email', 'Role', 'Joined', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-5 py-3"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.map(user => (
              <tr key={user.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.profile_image || `https://ui-avatars.com/api/?name=${user.username}&background=1E3A8A&color=fff&size=32`}
                      alt={user.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-white text-sm">{user.full_name || user.username}</p>
                      <p className="text-xs text-slate-500">@{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-400 text-xs">{user.email}</td>
                <td className="px-5 py-3">
                  <span className={`badge text-xs ${user.role === 'admin' ? 'badge-blue' : 'badge-gray'}`}>{user.role}</span>
                </td>
                <td className="px-5 py-3 text-slate-500 text-xs">
                  {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : '-'}
                </td>
                <td className="px-5 py-3">
                  <span className={`badge text-xs ${user.is_banned ? 'badge-red' : user.is_verified ? 'badge-green' : 'badge-gray'}`}>
                    {user.is_banned ? 'Banned' : user.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1">
                    {user.is_banned ? (
                      <button onClick={() => unbanMutation.mutate(user.id)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-slate-500 hover:text-emerald-400 transition-all" title="Unban">
                        <ShieldOff size={14} />
                      </button>
                    ) : (
                      <button onClick={() => { if (confirm(`Ban @${user.username}?`)) banMutation.mutate(user.id) }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all" title="Ban">
                        <Shield size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !isLoading && (
          <div className="text-center py-10 text-slate-500 text-sm">No users found</div>
        )}
      </div>

      {data?.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Prev</button>
          <span className="text-xs text-slate-400">{page} / {data.pages}</span>
          <button disabled={page === data.pages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  )
}
