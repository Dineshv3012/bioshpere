import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Request interceptor – attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor – handle 401 / token refresh
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
            { refresh_token: refresh }
          )
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth ───────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   ()     => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },
  me:                  () => api.get('/auth/me'),
  verifyEmail:         (token) => api.get(`/auth/verify-email?token=${token}`),
  forgotPassword:      (email) => api.post('/auth/forgot-password', { email }),
  resetPassword:       (data)  => api.post('/auth/reset-password', data),
  changePassword:      (data)  => api.post('/auth/change-password', data),
}

// ── Posts ──────────────────────────────────────────────────────────────────────
export const postsAPI = {
  list:       (params) => api.get('/posts', { params }),
  trending:   ()       => api.get('/posts/trending'),
  feed:       (params) => api.get('/posts/feed', { params }),
  get:        (id)     => api.get(`/posts/${id}`),
  getBySlug:  (slug)   => api.get(`/posts/slug/${slug}`),
  create:     (data)   => api.post('/posts', data),
  update:     (id, d)  => api.put(`/posts/${id}`, d),
  delete:     (id)     => api.delete(`/posts/${id}`),
  like:       (id)     => api.post(`/posts/${id}/like`),
  bookmark:   (id)     => api.post(`/posts/${id}/bookmark`),
  uploadImg:  (file)   => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/posts/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

// ── Comments ───────────────────────────────────────────────────────────────────
export const commentsAPI = {
  getByPost: (postId, params) => api.get(`/comments/post/${postId}`, { params }),
  create:    (data)           => api.post('/comments', data),
  update:    (id, d)          => api.put(`/comments/${id}`, d),
  delete:    (id)             => api.delete(`/comments/${id}`),
  like:      (id)             => api.post(`/comments/${id}/like`),
  report:    (id)             => api.post(`/comments/${id}/report`),
}

// ── Users ──────────────────────────────────────────────────────────────────────
export const usersAPI = {
  list:           (params)   => api.get('/users', { params }),
  getByUsername:  (username) => api.get(`/users/${username}`),
  update:         (id, d)    => api.put(`/users/${id}`, d),
  uploadAvatar:   (id, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post(`/users/${id}/avatar`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  getPosts:       (id, p)    => api.get(`/users/${id}/posts`, { params: p }),
  getBookmarks:   (id)       => api.get(`/users/${id}/bookmarks`),
}

// ── Categories ─────────────────────────────────────────────────────────────────
export const categoriesAPI = {
  list:   () => api.get('/categories'),
  create: (d) => api.post('/categories', d),
}

// ── Follow ─────────────────────────────────────────────────────────────────────
export const followAPI = {
  toggle: (userId) => api.post(`/follow/${userId}`),
}

// ── Notifications ──────────────────────────────────────────────────────────────
export const notificationsAPI = {
  list:        ()  => api.get('/notifications'),
  markAllRead: ()  => api.post('/notifications/mark-all-read'),
}

// ── Admin ──────────────────────────────────────────────────────────────────────
export const adminAPI = {
  stats:    ()        => api.get('/admin/stats'),
  users:    (params)  => api.get('/admin/users', { params }),
  banUser:  (id)      => api.post(`/admin/users/${id}/ban`),
  unbanUser:(id)      => api.post(`/admin/users/${id}/unban`),
  posts:    (params)  => api.get('/admin/posts', { params }),
}

// ── AI ─────────────────────────────────────────────────────────────────────────
export const aiAPI = {
  generateTitles:  (topic)   => api.post('/ai/generate-titles', { topic }),
  generateSummary: (content) => api.post('/ai/generate-summary', { content }),
  generateTags:    (content) => api.post('/ai/generate-tags', { content }),
  seoSuggestions:  (d)       => api.post('/ai/seo-suggestions', d),
  grammarCheck:    (content) => api.post('/ai/grammar-check', { content }),
}

export default api
