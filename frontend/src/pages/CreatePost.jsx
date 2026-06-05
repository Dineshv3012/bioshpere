import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Sparkles, Send, Save, Image as ImageIcon, Tag, X,
  Lightbulb, FileText, Hash, Search, Wand2, Loader2
} from 'lucide-react'
import { postsAPI, categoriesAPI, aiAPI } from '../api'
import RichTextEditor from '../components/editor/RichTextEditor'
import toast from 'react-hot-toast'

export default function CreatePost() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', content: '', excerpt: '', thumbnail: '',
    category_id: '', tags: [], status: 'draft',
  })
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState('')

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.list().then(r => r.data),
  })

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
      if (!form.tags.includes(tag) && form.tags.length < 8) {
        update('tags', [...form.tags, tag])
      }
      setTagInput('')
    }
  }

  const removeTag = (t) => update('tags', form.tags.filter(x => x !== t))

  const handleSubmit = async (status) => {
    if (!form.title.trim()) return toast.error('Title is required')
    if (!form.content.trim() || form.content === '<p></p>') return toast.error('Content is required')
    setSaving(true)
    try {
      const { data } = await postsAPI.create({ ...form, status, category_id: form.category_id || null })
      toast.success(status === 'published' ? 'Post published!' : 'Draft saved!')
      navigate(`/post/${data.slug}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save post')
    } finally { setSaving(false) }
  }

  // AI helpers
  const aiGenerateTitles = async () => {
    if (!form.title && !form.content) return toast.error('Enter a topic or some content first')
    setAiLoading('titles')
    try {
      const { data } = await aiAPI.generateTitles(form.title || form.content.slice(0, 200))
      const chosen = data.titles?.[0]
      if (chosen) { update('title', chosen); toast.success('Title generated!') }
    } catch { toast.error('AI feature unavailable') } finally { setAiLoading('') }
  }

  const aiGenerateSummary = async () => {
    if (!form.content) return toast.error('Write some content first')
    setAiLoading('summary')
    try {
      const { data } = await aiAPI.generateSummary(form.content)
      update('excerpt', data.summary)
      toast.success('Summary generated!')
    } catch { toast.error('AI feature unavailable') } finally { setAiLoading('') }
  }

  const aiGenerateTags = async () => {
    if (!form.content) return toast.error('Write some content first')
    setAiLoading('tags')
    try {
      const { data } = await aiAPI.generateTags(form.content)
      const newTags = data.tags.filter(t => !form.tags.includes(t)).slice(0, 8 - form.tags.length)
      update('tags', [...form.tags, ...newTags])
      toast.success('Tags generated!')
    } catch { toast.error('AI feature unavailable') } finally { setAiLoading('') }
  }

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const { data } = await postsAPI.uploadImg(file)
      update('thumbnail', data.url)
      toast.success('Thumbnail uploaded!')
    } catch { toast.error('Upload failed') }
  }

  const AIBtn = ({ onClick, loading: isLoading, icon: Icon, label }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={!!aiLoading}
      className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-primary-600/10 text-primary-400 border border-primary-600/20 hover:bg-primary-600/20 transition-all disabled:opacity-50"
    >
      {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
      {label}
    </button>
  )

  return (
    <div className="page-container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Write a new post</h1>
            <p className="text-slate-400 text-sm mt-1">Share your ideas with the world</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleSubmit('draft')} disabled={saving} className="btn-secondary flex items-center gap-2 text-sm">
              <Save size={15} /> Save draft
            </button>
            <button onClick={() => handleSubmit('published')} disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Publish
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Title *</label>
                <AIBtn onClick={aiGenerateTitles} loading={aiLoading === 'titles'} icon={Lightbulb} label="AI Title" />
              </div>
              <input
                value={form.title}
                onChange={e => update('title', e.target.value)}
                placeholder="An unforgettable headline…"
                className="input-field text-lg font-semibold"
              />
            </div>

            {/* Editor */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Content *</label>
              <RichTextEditor content={form.content} onChange={v => update('content', v)} />
            </div>
          </div>

          {/* Sidebar settings */}
          <div className="space-y-5">
            {/* Thumbnail */}
            <div className="glass rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <ImageIcon size={14} /> Thumbnail
              </h3>
              {form.thumbnail ? (
                <div className="relative">
                  <img src={form.thumbnail} alt="thumbnail" className="w-full h-36 object-cover rounded-xl" />
                  <button onClick={() => update('thumbnail', '')} className="absolute top-2 right-2 w-7 h-7 bg-dark-900/80 rounded-full flex items-center justify-center text-slate-300 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-white/[0.08] rounded-xl p-8 flex flex-col items-center cursor-pointer hover:border-primary-500/30 transition-colors">
                  <ImageIcon size={24} className="text-slate-600 mb-2" />
                  <span className="text-xs text-slate-500">Click to upload</span>
                  <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Category */}
            <div className="glass rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Category</h3>
              <select
                value={form.category_id}
                onChange={e => update('category_id', e.target.value)}
                className="input-field text-sm"
              >
                <option value="">No category</option>
                {categories?.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Tag size={14} /> Tags</h3>
                <AIBtn onClick={aiGenerateTags} loading={aiLoading === 'tags'} icon={Hash} label="AI Tags" />
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.tags.map(tag => (
                  <span key={tag} className="badge-blue text-xs flex items-center gap-1">
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors"><X size={10} /></button>
                  </span>
                ))}
              </div>
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="Add tag, press Enter…"
                className="input-field text-sm"
              />
              <p className="text-[11px] text-slate-600 mt-1">{form.tags.length}/8 tags</p>
            </div>

            {/* Excerpt */}
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2"><FileText size={14} /> Excerpt</h3>
                <AIBtn onClick={aiGenerateSummary} loading={aiLoading === 'summary'} icon={Wand2} label="AI Summary" />
              </div>
              <textarea
                value={form.excerpt}
                onChange={e => update('excerpt', e.target.value)}
                placeholder="Brief summary of your post…"
                rows={3}
                className="input-field text-sm resize-none"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
