// Register.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'
import useAuthStore from '../context/authStore'
import toast from 'react-hot-toast'

export function Register() {
  const navigate = useNavigate()
  const { register, loading } = useAuthStore()
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' })
  const [show, setShow] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await register(form)
    if (res.success) {
      setDone(true)
    } else {
      toast.error(res.error)
    }
  }

  if (done) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-10 text-center max-w-md w-full">
          <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Check your email!</h2>
          <p className="text-slate-400 text-sm">We sent a verification link to <strong className="text-white">{form.email}</strong>. Click it to activate your account.</p>
          <Link to="/login" className="btn-primary mt-6 inline-flex">Go to login</Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-sky-400 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-600/30">
            <Sparkles size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400 text-sm mt-1">Join thousands of writers on BlogSphere</p>
        </div>
        <div className="glass rounded-2xl p-7 border border-white/[0.08]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="John Doe" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
              <input type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="johndoe" required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" required className="input-field pr-11" />
                <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create account <ArrowRight size={16} /></>}
            </button>
          </form>
          <div className="mt-5 pt-5 border-t border-white/[0.06] text-center">
            <p className="text-sm text-slate-400">Already have an account?{' '}<Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link></p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { authAPI } = await import('../api')
      await authAPI.forgotPassword(email)
      setSent(true)
    } catch { } finally { setLoading(false) }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass rounded-2xl p-8 border border-white/[0.08]">
          {sent ? (
            <div className="text-center">
              <CheckCircle2 size={44} className="text-emerald-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Email sent!</h2>
              <p className="text-slate-400 text-sm">If that email exists, you'll receive a reset link shortly.</p>
              <Link to="/login" className="btn-primary mt-6 inline-flex">Back to login</Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Reset password</h1>
              <p className="text-slate-400 text-sm mb-6">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="input-field" />
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send reset link'}
                </button>
              </form>
              <div className="mt-4 text-center"><Link to="/login" className="text-sm text-slate-400 hover:text-white">← Back to login</Link></div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)
  const token = new URLSearchParams(window.location.search).get('token')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { authAPI } = await import('../api')
      await authAPI.resetPassword({ token, new_password: password })
      toast.success('Password reset! Please login.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reset password')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass rounded-2xl p-8 border border-white/[0.08]">
          <h1 className="text-2xl font-bold text-white mb-2">New password</h1>
          <p className="text-slate-400 text-sm mb-6">Enter your new password below.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required minLength={8} className="input-field pr-11" />
              <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Reset password'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export function VerifyEmail() {
  const [status, setStatus] = useState('verifying')
  const token = new URLSearchParams(window.location.search).get('token')

  useState(() => {
    import('../api').then(({ authAPI }) => {
      authAPI.verifyEmail(token)
        .then(() => setStatus('success'))
        .catch(() => setStatus('error'))
    })
  })

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-10 text-center max-w-md w-full">
        {status === 'verifying' && <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />}
        {status === 'success' && <>
          <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Email verified!</h2>
          <p className="text-slate-400 text-sm mb-6">Your account is now active. Welcome to BlogSphere!</p>
          <Link to="/login" className="btn-primary">Sign in now</Link>
        </>}
        {status === 'error' && <>
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-white mb-2">Verification failed</h2>
          <p className="text-slate-400 text-sm mb-6">The link is invalid or has expired.</p>
          <Link to="/register" className="btn-primary">Register again</Link>
        </>}
      </div>
    </div>
  )
}

export default Register
