import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { TrendingUp, Zap, Compass, Rss, ArrowRight, Flame } from 'lucide-react'
import { postsAPI, categoriesAPI } from '../api'
import PostCard from '../components/PostCard'
import useAuthStore from '../context/authStore'

const SORTS = [
  { key: 'latest',    label: 'Latest',    icon: Zap },
  { key: 'popular',   label: 'Trending',  icon: TrendingUp },
  { key: 'most_liked',label: 'Most Liked',icon: Flame },
]

export default function Home() {
  const { user } = useAuthStore()
  const [sort, setSort] = useState('latest')
  const [category, setCategory] = useState(null)
  const [page, setPage] = useState(1)

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts', sort, category, page],
    queryFn: () => postsAPI.list({ sort, category, page, per_page: 9 }).then(r => r.data),
    keepPreviousData: true,
  })

  const { data: trending } = useQuery({
    queryKey: ['trending'],
    queryFn: () => postsAPI.trending().then(r => r.data),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.list().then(r => r.data),
  })

  const { data: feed } = useQuery({
    queryKey: ['feed'],
    queryFn: () => postsAPI.feed({ per_page: 5 }).then(r => r.data),
    enabled: !!user,
  })

  return (
    <div className="page-container py-10">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 relative mb-12"
      >
        {/* Glow bg */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-600/10 rounded-full blur-3xl" />
          <div className="absolute top-10 left-1/3 w-[200px] h-[200px] bg-sky-400/5 rounded-full blur-2xl" />
        </div>
        <div className="badge-sky mx-auto mb-6 w-fit text-sm px-4 py-1.5 flex items-center gap-2">
          <Compass size={14} /> AI-Powered Blogging Platform
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-5">
          Ideas worth<br />
          <span className="gradient-text">reading & sharing</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-lg mx-auto mb-8">
          Discover thoughtful articles from writers around the world. Share your ideas, grow your audience.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {user ? (
            <Link to="/write" className="btn-primary flex items-center gap-2">
              Start writing <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary flex items-center gap-2">
                Get started free <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="btn-secondary">Sign in</Link>
            </>
          )}
        </div>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main feed */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 glass rounded-xl p-1 w-fit">
            {SORTS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setSort(key); setPage(1) }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  sort === key ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* Category pills */}
          {categories && (
            <div className="flex gap-2 flex-wrap mb-6">
              <button
                onClick={() => { setCategory(null); setPage(1) }}
                className={`badge transition-all cursor-pointer ${!category ? 'badge-blue' : 'badge-gray hover:badge-blue'}`}
              >
                All
              </button>
              {categories.slice(0, 8).map(cat => (
                <button
                  key={cat.slug}
                  onClick={() => { setCategory(cat.slug === category ? null : cat.slug); setPage(1) }}
                  className={`badge transition-all cursor-pointer ${category === cat.slug ? 'badge-blue' : 'badge-gray hover:badge-blue'}`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Posts grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-white/5" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-white/5 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-full" />
                    <div className="h-3 bg-white/5 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts?.items?.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-500">No articles found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {posts?.items?.map((post, i) => (
                  <PostCard key={post.id} post={post} index={i} variant="featured" />
                ))}
              </div>
              {/* Pagination */}
              {posts?.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-sm px-4 py-2 disabled:opacity-40">
                    Prev
                  </button>
                  <span className="text-sm text-slate-400">{page} / {posts.pages}</span>
                  <button disabled={page === posts.pages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-sm px-4 py-2 disabled:opacity-40">
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Feed for logged-in users */}
          {user && feed?.items?.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <Rss size={14} className="text-primary-400" /> Following Feed
              </h3>
              <div className="space-y-3">
                {feed.items.map((post, i) => (
                  <PostCard key={post.id} post={post} index={i} variant="compact" />
                ))}
              </div>
            </div>
          )}

          {/* Trending */}
          {trending?.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <TrendingUp size={14} className="text-sky-400" /> Trending Now
              </h3>
              <div className="space-y-3">
                {trending.map((post, i) => (
                  <Link key={post.id} to={`/post/${post.slug}`} className="flex items-start gap-3 group">
                    <span className="text-2xl font-bold text-white/10 leading-none w-7 shrink-0 mt-0.5">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <p className="text-sm text-slate-300 group-hover:text-white transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">{post.views} views</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {categories && (
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Explore Topics</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <Link
                    key={cat.slug}
                    to={`/category/${cat.slug}`}
                    className="badge-gray hover:badge-blue transition-all text-xs cursor-pointer"
                  >
                    {cat.icon && <span>{cat.icon}</span>} {cat.name}
                    {cat.posts_count > 0 && <span className="opacity-50 ml-1">({cat.posts_count})</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
