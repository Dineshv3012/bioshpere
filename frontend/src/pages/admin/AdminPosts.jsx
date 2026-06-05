import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Search, Eye, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { adminAPI, postsAPI } from '../../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function AdminPosts() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-posts', page],
    queryFn: () => adminAPI.posts({ page, per_page: 20 }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => postsAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries(['admin-posts']); toast.success('Post deleted') },
    onError: () => toast.error('Failed to delete post'),
  })

  const filtered = data?.items?.filter(p =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.author?.toLowerCase().includes(search.toLowerCase())
  ) || []

  const statusColors = {
    published: 'badge-green',
    draft:     'badge-gray',
    archived:  'badge-red',
    scheduled: 'badge-sky',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">
          Posts <span className="text-slate-500 text-base font-normal">({data?.total || 0})</span>
        </h1>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search posts…"
            className="bg-white/5 border border-white/[0.08] text-slate-300 placeholder-slate-600 text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-primary-500/40 transition-all w-52"
          />
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Title', 'Author', 'Status', 'Views', 'Created', 'Actions'].map(h => (
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
            ) : filtered.map(post => (
              <tr key={post.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3 max-w-xs">
                  <p className="font-medium text-slate-200 line-clamp-1 text-sm">{post.title}</p>
                </td>
                <td className="px-5 py-3 text-slate-400 text-xs">@{post.author}</td>
                <td className="px-5 py-3">
                  <span className={`badge text-xs ${statusColors[post.status] || 'badge-gray'}`}>
                    {post.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-400 text-xs">
                  <span className="flex items-center gap-1"><Eye size={12} /> {post.views?.toLocaleString()}</span>
                </td>
                <td className="px-5 py-3 text-slate-500 text-xs">
                  {post.created_at ? format(new Date(post.created_at), 'MMM d, yyyy') : '-'}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { if (confirm('Delete this post permanently?')) deleteMutation.mutate(post.id) }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
                      title="Delete post"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !isLoading && (
          <div className="text-center py-10 text-slate-500 text-sm">No posts found</div>
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
