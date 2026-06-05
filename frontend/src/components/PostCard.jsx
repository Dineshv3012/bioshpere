import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Bookmark, BookmarkCheck, Eye, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postsAPI } from '../api'
import useAuthStore from '../context/authStore'
import toast from 'react-hot-toast'

export default function PostCard({ post, index = 0, variant = 'default' }) {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const likeMutation = useMutation({
    mutationFn: () => postsAPI.like(post.id),
    onSuccess: () => qc.invalidateQueries(['posts']),
    onError: () => toast.error('Please login to like posts'),
  })

  const bookmarkMutation = useMutation({
    mutationFn: () => postsAPI.bookmark(post.id),
    onSuccess: () => toast.success(post.is_bookmarked ? 'Removed from bookmarks' : 'Saved to bookmarks'),
    onError: () => toast.error('Please login to bookmark posts'),
  })

  if (variant === 'featured') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="glass-hover rounded-2xl overflow-hidden group"
      >
        {post.thumbnail && (
          <div className="relative h-56 overflow-hidden">
            <img
              src={post.thumbnail}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent" />
            {post.category && (
              <span className="absolute top-3 left-3 badge-blue text-xs">
                {post.category.icon} {post.category.name}
              </span>
            )}
          </div>
        )}
        <div className="p-5">
          <Link to={`/post/${post.slug}`}>
            <h2 className="text-lg font-bold text-white leading-snug mb-2 hover:text-primary-400 transition-colors line-clamp-2">
              {post.title}
            </h2>
          </Link>
          {post.excerpt && (
            <p className="text-sm text-slate-400 line-clamp-2 mb-4">{post.excerpt}</p>
          )}
          <div className="flex items-center justify-between">
            <Link to={`/profile/${post.author?.username}`} className="flex items-center gap-2 group/author">
              <img
                src={post.author?.profile_image || `https://ui-avatars.com/api/?name=${post.author?.username}&background=1E3A8A&color=fff`}
                alt={post.author?.username}
                className="w-7 h-7 rounded-full object-cover"
              />
              <div>
                <p className="text-xs font-medium text-slate-300 group-hover/author:text-white transition-colors">
                  {post.author?.full_name || post.author?.username}
                </p>
                <p className="text-[11px] text-slate-500">
                  {post.published_at ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true }) : 'Draft'}
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Clock size={12} /> {post.read_time}m</span>
              <span className="flex items-center gap-1"><Eye size={12} /> {post.views}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.06]">
            <button
              onClick={() => user ? likeMutation.mutate() : toast.error('Login to like')}
              className={`flex items-center gap-1.5 text-xs transition-colors ${post.is_liked ? 'text-red-400' : 'text-slate-500 hover:text-red-400'}`}
            >
              <Heart size={13} fill={post.is_liked ? 'currentColor' : 'none'} /> {post.likes_count}
            </button>
            <Link to={`/post/${post.slug}#comments`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-400 transition-colors">
              <MessageCircle size={13} /> {post.comments_count}
            </Link>
            <button
              onClick={() => user ? bookmarkMutation.mutate() : toast.error('Login to bookmark')}
              className={`ml-auto transition-colors ${post.is_bookmarked ? 'text-primary-400' : 'text-slate-500 hover:text-primary-400'}`}
            >
              {post.is_bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            </button>
          </div>
        </div>
      </motion.article>
    )
  }

  // Compact / list variant
  return (
    <motion.article
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex gap-4 p-4 glass-hover rounded-xl group"
    >
      {post.thumbnail && (
        <img
          src={post.thumbnail}
          alt={post.title}
          className="w-20 h-16 sm:w-24 sm:h-20 rounded-lg object-cover shrink-0 group-hover:scale-105 transition-transform duration-300"
        />
      )}
      <div className="flex-1 min-w-0">
        {post.category && (
          <span className="badge-blue text-[11px] mb-1.5 inline-flex">{post.category.name}</span>
        )}
        <Link to={`/post/${post.slug}`}>
          <h3 className="font-semibold text-slate-200 hover:text-white text-sm leading-snug line-clamp-2 transition-colors">
            {post.title}
          </h3>
        </Link>
        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
          <Link to={`/profile/${post.author?.username}`} className="hover:text-slate-300 transition-colors">
            @{post.author?.username}
          </Link>
          <span>·</span>
          <span className="flex items-center gap-1"><Clock size={10} /> {post.read_time}m</span>
          <span className="flex items-center gap-1"><Heart size={10} /> {post.likes_count}</span>
        </div>
      </div>
    </motion.article>
  )
}
