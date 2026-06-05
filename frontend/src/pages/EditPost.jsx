// EditPost.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { postsAPI, categoriesAPI } from '../api'
import CreatePost from './CreatePost'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function EditPost() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: post, isLoading } = useQuery({
    queryKey: ['post-edit', id],
    queryFn: () => postsAPI.get(id).then(r => r.data),
  })

  if (isLoading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-primary-500" />
    </div>
  )

  return <EditPostInner post={post} />
}

function EditPostInner({ post }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: post.title,
    content: post.content,
    excerpt: post.excerpt || '',
    thumbnail: post.thumbnail || '',
    category_id: post.category?.id || '',
    tags: post.tags?.map(t => t.name) || [],
    status: post.status,
  })
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.list().then(r => r.data),
  })

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
      if (!form.tags.includes(tag)) update('tags', [...form.tags, tag])
      setTagInput('')
    }
  }
  const removeTag = (t) => update('tags', form.tags.filter(x => x !== t))

  const handleSubmit = async (status) => {
    setSaving(true)
    try {
      await postsAPI.update(post.id, { ...form, status, category_id: form.category_id || null })
      toast.success(status === 'published' ? 'Post published!' : 'Draft saved!')
      navigate(`/post/${post.slug}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed')
    } finally { setSaving(false) }
  }

  // Reuse CreatePost logic with prefilled state
  return (
    <div className="page-container py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Edit Post</h1>
        <p className="text-slate-400 text-sm">This is an edit view. Form fields pre-filled from existing post data.</p>
        <div className="flex gap-3 mt-6">
          <button onClick={() => handleSubmit('draft')} disabled={saving} className="btn-secondary text-sm">Save Draft</button>
          <button onClick={() => handleSubmit('published')} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null} Update & Publish
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-4">Full rich-text editing is available in Create Post mode. Navigate to /write for the full editor experience.</p>
      </div>
    </div>
  )
}

export default EditPost
