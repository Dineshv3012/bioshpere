import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Heart, Bookmark, BookmarkCheck, Share2, Eye, Clock,
  Tag, Edit, Trash2, User, Calendar, ArrowLeft
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { postsAPI, followAPI } from '../api'
import CommentSection from '../components/CommentSection'
import useAuthStore from '../context/authStore'
import toast from 'react-hot-toast'

export default function BlogPost() {
  const { slug } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => postsAPI.getBySlug(slug).then(r => r.data),
  })

  const likeMutation = useMutation({
    mutationFn: () => postsAPI.like(post.id),
    onSuccess: (data) => {
      qc.invalidateQueries(['post', slug])
      toast.success(data.data.liked ? 'Liked!' : 'Unliked')
    },
    onError: () => toast.error('Please login to like'),
  })

  const bookmarkMutation = useMutation({
    mutationFn: () => postsAPI.bookmark(post.id),
    onSuccess: (data) => {
      qc.invalidateQueries(['post', slug])
      toast.success(data.data.bookmarked ? 'Bookmarked!' : 'Removed from bookmarks')
    },
    onError: () => toast.error('Please login to bookmark'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => postsAPI.delete(post.id),
    onSuccess: () => { toast.success('Post deleted'); navigate('/dashboard') },
  })

  const followMutation = useMutation({
    mutationFn: () => followAPI.toggle(post.author.id),
    onSuccess: () => qc.invalidateQueries(['post', slug]),
  })

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: post.title, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    }
  }

  if (isLoading) return (
    <div className="page-container py-10 max-w-3xl mx-auto animate-pulse space-y-6">
      <div className="h-8 bg-white/5 rounded w-3/4" />
      <div className="h-64 bg-white/5 rounded-2xl" />
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => <div key={i} className="h-4 bg-white/5 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />)}
      </div>
    </div>
  )

  if (error || !post) return (
    <div className="page-container py-20 text-center">
      <p className="text-slate-400 text-lg mb-4">Post not found</p>
      <Link to="/" className="btn-primary">← Back to home</Link>
    </div>
  )

  const isAuthor = user?.id === post.author?.id
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'

  return (
    <div className="page-container py-10">
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8">
          <ArrowLeft size={16} /> Back to feed
        </Link>

        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Category & tags */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {post.category && (
              <Link to={`/category/${post.category.slug}`} className="badge-blue text-xs">{post.category.name}</Link>
            )}
            {post.tags?.map(tag => (
              <Link key={tag.id} to={`/search?tag=${tag.slug}`} className="badge-gray text-xs hover:badge-blue transition-all">
                #{tag.name}
              </Link>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-6">{post.title}</h1>

          {/* Author & meta */}
          <div className="flex items-center justify-between gap-4 mb-8 pb-6 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <img
                src={post.author?.profile_image || `https://ui-avatars.com/api/?name=${post.author?.username}&background=1E3A8A&color=fff`}
                alt={post.author?.username}
                className="w-11 h-11 rounded-full object-cover"
              />
              <div>
                <Link to={`/profile/${post.author?.username}`} className="font-semibold text-white hover:text-primary-400 transition-colors text-sm">
                  {post.author?.full_name || post.author?.username}
                </Link>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {post.published_at ? format(new Date(post.published_at), 'MMM d, yyyy') : 'Draft'}
                  </span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {post.read_time} min read</span>
                  <span className="flex items-center gap-1"><Eye size={10} /> {post.views}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user && !isAuthor && (
                <button
                  onClick={() => followMutation.mutate()}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    post.author?.is_following
                      ? 'bg-primary-600/20 text-primary-400 border-primary-600/30'
                      : 'border-white/10 text-slate-400 hover:border-primary-500/40 hover:text-white'
                  }`}
                >
                  {post.author?.is_following ? 'Following' : 'Follow'}
                </button>
              )}
              {(isAuthor || isAdmin) && (
                <>
                  <Link to={`/edit/${post.id}`} className="btn-ghost p-2"><Edit size={15} /></Link>
                  <button onClick={() => { if (confirm('Delete this post?')) deleteMutation.mutate() }} className="btn-ghost p-2 text-red-400"><Trash2 size={15} /></button>
                </>
              )}
            </div>
          </div>

          {/* Thumbnail */}
          {post.thumbnail && (
            <img src={post.thumbnail} alt={post.title} className="w-full rounded-2xl object-cover max-h-[480px] mb-10" />
          )}

          {/* Content */}
          <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.content }} />

          {/* Actions bar */}
          <div className="flex items-center justify-between mt-12 pt-6 border-t border-white/[0.06]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => user ? likeMutation.mutate() : toast.error('Login to like')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm ${
                  post.is_liked
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'border-white/10 text-slate-400 hover:border-red-500/20 hover:text-red-400'
                }`}
              >
                <Heart size={16} fill={post.is_liked ? 'currentColor' : 'none'} />
                {post.likes_count} Likes
              </button>
              <button
                onClick={() => user ? bookmarkMutation.mutate() : toast.error('Login to bookmark')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm ${
                  post.is_bookmarked
                    ? 'bg-primary-600/10 text-primary-400 border-primary-600/20'
                    : 'border-white/10 text-slate-400 hover:border-primary-500/20 hover:text-primary-400'
                }`}
              >
                {post.is_bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                {post.is_bookmarked ? 'Saved' : 'Save'}
              </button>
            </div>
            <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all text-sm">
              <Share2 size={16} /> Share
            </button>
          </div>

          {/* Author card */}
          <div className="glass rounded-2xl p-6 mt-10 flex items-start gap-4">
            <img
              src={post.author?.profile_image || `https://ui-avatars.com/api/?name=${post.author?.username}&background=1E3A8A&color=fff`}
              alt={post.author?.username}
              className="w-14 h-14 rounded-full object-cover"
            />
            <div>
              <Link to={`/profile/${post.author?.username}`} className="font-semibold text-white hover:text-primary-400 transition-colors">
                {post.author?.full_name || post.author?.username}
              </Link>
              <p className="text-xs text-slate-400 mt-0.5">@{post.author?.username}</p>
              {post.author?.bio && <p className="text-sm text-slate-400 mt-2 leading-relaxed">{post.author.bio}</p>}
            </div>
          </div>

          <CommentSection postId={post.id} />
        </motion.article>
      </div>
    </div>
  )
}
