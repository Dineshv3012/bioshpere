import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, Reply, Trash2, Edit2, Flag, ChevronDown, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { commentsAPI } from '../api'
import useAuthStore from '../context/authStore'
import toast from 'react-hot-toast'

function CommentItem({ comment, postId, depth = 0 }) {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [replying, setReplying] = useState(false)
  const [editing, setEditing] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [editText, setEditText] = useState(comment.content)
  const [showReplies, setShowReplies] = useState(true)

  const likeMutation = useMutation({
    mutationFn: () => commentsAPI.like(comment.id),
    onSuccess: () => qc.invalidateQueries(['comments', postId]),
  })

  const deleteMutation = useMutation({
    mutationFn: () => commentsAPI.delete(comment.id),
    onSuccess: () => { qc.invalidateQueries(['comments', postId]); toast.success('Comment deleted') },
  })

  const editMutation = useMutation({
    mutationFn: () => commentsAPI.update(comment.id, { content: editText }),
    onSuccess: () => { qc.invalidateQueries(['comments', postId]); setEditing(false); toast.success('Comment updated') },
  })

  const replyMutation = useMutation({
    mutationFn: () => commentsAPI.create({ post_id: postId, content: replyText, parent_id: comment.id }),
    onSuccess: () => { qc.invalidateQueries(['comments', postId]); setReplying(false); setReplyText('') },
  })

  const isOwner = user?.id === comment.user?.id
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`${depth > 0 ? 'ml-8 border-l border-white/[0.06] pl-5' : ''}`}>
      <div className="flex gap-3 py-3">
        <img
          src={comment.user?.profile_image || `https://ui-avatars.com/api/?name=${comment.user?.username}&background=1E3A8A&color=fff&size=40`}
          alt={comment.user?.username}
          className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-white">{comment.user?.full_name || comment.user?.username}</span>
            <span className="text-[11px] text-slate-500">@{comment.user?.username}</span>
            <span className="text-[11px] text-slate-600">·</span>
            <span className="text-[11px] text-slate-500">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>

          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                className="w-full input-field text-sm min-h-[80px] resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button onClick={() => editMutation.mutate()} disabled={!editText.trim()} className="btn-primary text-xs py-1.5">Save</button>
                <button onClick={() => setEditing(false)} className="btn-secondary text-xs py-1.5">Cancel</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-300 leading-relaxed">{comment.content}</p>
          )}

          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => user ? likeMutation.mutate() : toast.error('Login to like')}
              className={`flex items-center gap-1.5 text-xs transition-colors ${comment.is_liked ? 'text-red-400' : 'text-slate-500 hover:text-red-400'}`}
            >
              <Heart size={12} fill={comment.is_liked ? 'currentColor' : 'none'} /> {comment.likes_count}
            </button>
            {depth < 2 && (
              <button
                onClick={() => user ? setReplying(v => !v) : toast.error('Login to reply')}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-400 transition-colors"
              >
                <Reply size={12} /> Reply
              </button>
            )}
            {isOwner && !editing && (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                <Edit2 size={11} /> Edit
              </button>
            )}
            {(isOwner || isAdmin) && (
              <button
                onClick={() => { if (confirm('Delete this comment?')) deleteMutation.mutate() }}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                <Trash2 size={11} /> Delete
              </button>
            )}
            <button
              onClick={() => commentsAPI.report(comment.id).then(() => toast.success('Comment reported'))}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400 transition-colors ml-auto"
            >
              <Flag size={10} />
            </button>
          </div>

          {/* Reply input */}
          <AnimatePresence>
            {replying && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-2">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={`Reply to @${comment.user?.username}…`}
                  className="w-full input-field text-sm min-h-[70px] resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button onClick={() => replyMutation.mutate()} disabled={!replyText.trim()} className="btn-primary text-xs py-1.5 flex items-center gap-1.5">
                    <Send size={12} /> Reply
                  </button>
                  <button onClick={() => setReplying(false)} className="btn-secondary text-xs py-1.5">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies?.length > 0 && (
        <div>
          <button
            onClick={() => setShowReplies(v => !v)}
            className="ml-12 flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors mb-1"
          >
            <ChevronDown size={12} className={`transition-transform ${showReplies ? 'rotate-180' : ''}`} />
            {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
          </button>
          <AnimatePresence>
            {showReplies && comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} postId={postId} depth={depth + 1} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

export default function CommentSection({ postId }) {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [newComment, setNewComment] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => commentsAPI.getByPost(postId).then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () => commentsAPI.create({ post_id: postId, content: newComment }),
    onSuccess: () => { qc.invalidateQueries(['comments', postId]); setNewComment(''); toast.success('Comment posted!') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to post comment'),
  })

  return (
    <section id="comments" className="mt-12">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        Comments <span className="badge-gray">{data?.total || 0}</span>
      </h3>

      {/* New comment form */}
      {user ? (
        <div className="glass rounded-2xl p-4 mb-8">
          <div className="flex gap-3">
            <img
              src={user.profile_image || `https://ui-avatars.com/api/?name=${user.username}&background=1E3A8A&color=fff`}
              alt={user.username}
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
            <div className="flex-1 space-y-3">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Share your thoughts…"
                className="w-full input-field text-sm min-h-[90px] resize-none"
                rows={3}
              />
              <div className="flex justify-end">
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={!newComment.trim() || createMutation.isPending}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <Send size={14} />
                  {createMutation.isPending ? 'Posting…' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl p-6 mb-8 text-center">
          <p className="text-slate-400 text-sm">
            <a href="/login" className="text-primary-400 hover:underline">Sign in</a> to join the conversation
          </p>
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-white/5 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/5 rounded w-1/4" />
                <div className="h-3 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : data?.items?.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-8">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {data?.items?.map(c => <CommentItem key={c.id} comment={c} postId={postId} />)}
        </div>
      )}
    </section>
  )
}
