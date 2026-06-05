// Dashboard.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { PenSquare, Eye, Heart, MessageCircle, FileText, BarChart2, Plus } from 'lucide-react'
import { postsAPI, usersAPI } from '../api'
import useAuthStore from '../context/authStore'
import PostCard from '../components/PostCard'

export function Dashboard() {
  const { user } = useAuthStore()

  const { data: myPosts } = useQuery({
    queryKey: ['my-posts'],
    queryFn: () => postsAPI.list({ author: user?.username, per_page: 20 }).then(r => r.data),
    enabled: !!user,
  })

  const published = myPosts?.items?.filter(p => p.status === 'published') || []
  const drafts = myPosts?.items?.filter(p => p.status === 'draft') || []
  const totalViews = published.reduce((acc, p) => acc + p.views, 0)
  const totalLikes = published.reduce((acc, p) => acc + p.likes_count, 0)

  return (
    <div className="page-container py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Welcome back, {user?.full_name || user?.username} 👋</p>
        </div>
        <Link to="/write" className="btn-primary flex items-center gap-2 text-sm"><Plus size={15} /> New Post</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: FileText, label: 'Published', value: published.length, color: 'text-primary-400' },
          { icon: PenSquare, label: 'Drafts', value: drafts.length, color: 'text-slate-400' },
          { icon: Eye, label: 'Total Views', value: totalViews, color: 'text-sky-400' },
          { icon: Heart, label: 'Total Likes', value: totalLikes, color: 'text-red-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass rounded-2xl p-5">
            <Icon size={18} className={`${color} mb-3`} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Drafts */}
      {drafts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <PenSquare size={15} className="text-slate-400" /> Drafts ({drafts.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {drafts.map((post, i) => (
              <div key={post.id} className="glass-hover rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-200 line-clamp-1 text-sm">{post.title}</p>
                  <p className="text-xs text-slate-500 mt-1">Last edited {new Date(post.created_at).toLocaleDateString()}</p>
                </div>
                <Link to={`/edit/${post.id}`} className="badge-blue text-xs shrink-0">Edit</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Published */}
      <div>
        <h2 className="text-base font-semibold text-white mb-4">Published Posts</h2>
        {published.length === 0 ? (
          <div className="text-center py-12 glass rounded-2xl">
            <FileText size={36} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm mb-4">No published posts yet</p>
            <Link to="/write" className="btn-primary text-sm">Write your first post</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {published.map((post, i) => <PostCard key={post.id} post={post} index={i} variant="featured" />)}
          </div>
        )}
      </div>
    </div>
  )
}

// Bookmarks.jsx
export function Bookmarks() {
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => usersAPI.getBookmarks(user.id).then(r => r.data),
    enabled: !!user,
  })

  return (
    <div className="page-container py-10">
      <h1 className="text-2xl font-bold text-white mb-8">Bookmarks</h1>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="glass rounded-2xl h-64 animate-pulse" />)}
        </div>
      ) : data?.items?.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl">
          <p className="text-slate-400">No saved posts yet. Start bookmarking articles you love!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data?.items?.map((post, i) => <PostCard key={post.id} post={post} index={i} variant="featured" />)}
        </div>
      )}
    </div>
  )
}

// Search.jsx
export function Search() {
  const [query, setQuery] = useState('')
  const params = new URLSearchParams(window.location.search)
  const initialQ = params.get('q') || ''
  const [q, setQ] = useState(initialQ)

  const { data, isLoading } = useQuery({
    queryKey: ['search', q],
    queryFn: () => postsAPI.list({ search: q, per_page: 20 }).then(r => r.data),
    enabled: !!q,
  })

  return (
    <div className="page-container py-10">
      <h1 className="text-2xl font-bold text-white mb-6">Search</h1>
      <div className="relative mb-8 max-w-xl">
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search articles, topics, authors…"
          className="input-field text-base pl-12"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
      </div>
      {isLoading && <p className="text-slate-400 text-sm">Searching…</p>}
      {data && (
        <div>
          <p className="text-sm text-slate-400 mb-5">{data.total} results for "{q}"</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.items?.map((post, i) => <PostCard key={post.id} post={post} index={i} variant="featured" />)}
          </div>
          {data.items?.length === 0 && (
            <div className="text-center py-16 text-slate-500">No results found for "{q}"</div>
          )}
        </div>
      )}
    </div>
  )
}

// CategoryPage.jsx
import { useParams as useParamsInner } from 'react-router-dom'
export function CategoryPage() {
  const { slug } = useParamsInner()
  const { data, isLoading } = useQuery({
    queryKey: ['category-posts', slug],
    queryFn: () => postsAPI.list({ category: slug, per_page: 12 }).then(r => r.data),
  })

  return (
    <div className="page-container py-10">
      <h1 className="text-2xl font-bold text-white mb-2 capitalize">{slug?.replace(/-/g, ' ')}</h1>
      <p className="text-slate-400 text-sm mb-8">{data?.total || 0} articles in this category</p>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="glass rounded-2xl h-64 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data?.items?.map((post, i) => <PostCard key={post.id} post={post} index={i} variant="featured" />)}
        </div>
      )}
    </div>
  )
}

// NotFound.jsx
export function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-center px-4">
      <div>
        <p className="text-8xl font-bold gradient-text mb-4">404</p>
        <h1 className="text-2xl font-bold text-white mb-3">Page not found</h1>
        <p className="text-slate-400 text-sm mb-8">The page you're looking for doesn't exist or was moved.</p>
        <Link to="/" className="btn-primary">← Back to home</Link>
      </div>
    </div>
  )
}

export default Dashboard
