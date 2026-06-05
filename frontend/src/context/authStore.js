import { create } from 'zustand'
import { authAPI } from '../api'

const useAuthStore = create((set, get) => ({
  user:    null,
  token:   localStorage.getItem('access_token'),
  loading: false,
  initialized: false,

  setUser:  (user)  => set({ user }),
  setToken: (token) => {
    set({ token })
    if (token) localStorage.setItem('access_token', token)
    else       localStorage.removeItem('access_token')
  },

  initialize: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) { set({ initialized: true }); return }
    try {
      const { data } = await authAPI.me()
      set({ user: data, token, initialized: true })
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      set({ user: null, token: null, initialized: true })
    }
  },

  login: async (email, password) => {
    set({ loading: true })
    try {
      const { data } = await authAPI.login({ email, password })
      localStorage.setItem('access_token',  data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      const { data: me } = await authAPI.me()
      set({ user: me, token: data.access_token, loading: false })
      return { success: true }
    } catch (err) {
      set({ loading: false })
      return { success: false, error: err.response?.data?.detail || 'Login failed' }
    }
  },

  logout: () => {
    authAPI.logout()
    set({ user: null, token: null })
    window.location.href = '/'
  },

  register: async (payload) => {
    set({ loading: true })
    try {
      await authAPI.register(payload)
      set({ loading: false })
      return { success: true }
    } catch (err) {
      set({ loading: false })
      return { success: false, error: err.response?.data?.detail || 'Registration failed' }
    }
  },

  updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),

  isAdmin:      () => get().user?.role === 'admin',
  isModerator:  () => ['admin', 'moderator'].includes(get().user?.role),
}))

export default useAuthStore
