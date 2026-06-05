import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Globe, Twitter, Github, Linkedin, Users, FileText, Calendar, BadgeCheck } from 'lucide-react'
import { format } from 'date-fns'
import { usersAPI, followAPI } from '../api'
import PostCard from '../components/PostCard'
import useAuthStore from '../context/authStore'
import toast from 'react-hot-toast'

export default function Profile() {
  const { username } = useParams()
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => usersAPI.getByUsername(username).then(r => r.data),
  })

  const { data: posts } = useQuery({
    queryKey: ['user-posts', profile?.id],
    queryFn: () => usersAPI.getPosts(profile.id).then(r => r.data),
    enabled: !!profile?.id,
  })

  const followMutation = useMutation({
    mutationFn: () => followAPI.toggle(profile.id),
    onSuccess: (data) => {
      qc.invalidateQueries(['profile', username])
      toast.success(data.data.following ? `Following ${profile.username}` : 'Unfollowed')
    },
  })

  if (isLoading) return (
    <div className="page-container py-10 animate-pulse">
      <div className="h-48 bg-white/5 rounded-2xl mb-6" />
      <div className="flex items-end gap-4 -mt-12 ml-6 mb-8">
        <div className="w-24 h-24 rounded-full bg-white/10" />
      </div>
    </div>
  )

  if (!profile) return (
    <div className="page-container py-20 text-center">
      <p className="text-slate-400">User not found</p>
    </div>
  )

  const isSelf = user?.id === profile.id

  return (
    <div>
      {/* Cover */}
      <div className="h-52 relative overflow-hidden">
        {profile.cover_image ? (
          <img src={profile.cover_image} alt="cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-800/50 via-dark-800 to-dark-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />
      </div>

      <div className="page-container">
        {/* Avatar & follow */}
        <div className="flex items-end justify-between -mt-14 mb-6">
          <img
            src={profile.profile_image || `https://ui-avatars.com/api/?name=${profile.username}&background=1E3A8A&color=fff&size=96`}
            alt={profile.username}
            className="w-24 h-24 rounded-2xl object-cover ring-4 ring-dark-900"
          />
          <div className="flex gap-2 pb-2">
            {!isSelf && user && (
              <button
                onClick={() => followMutation.mutate()}
                className={`text-sm px-5 py-2 rounded-xl border font-medium transition-all ${
                  profile.is_following
                    ? 'bg-primary-600/20 text-primary-400 border-primary-600/30'
                    : 'border-white/10 text-slate-300 hover:bg-primary-600/10 hover:border-primary-500/30'
                }`}
              >
                {profile.is_following ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        {/* Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white">{profile.full_name || profile.username}</h1>
            {profile.is_verified && <BadgeCheck size={20} className="text-sky-400" />}
          </div>
          <p className="text-slate-400 text-sm mb-3">@{profile.username}</p>
          {profile.bio && <p className="text-slate-300 leading-relaxed max-w-lg mb-4">{profile.bio}</p>}

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
                <Globe size={14} /> Website
              </a>
            )}
            {profile.twitter && (
              <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-sky-400 transition-colors">
                <Twitter size={14} /> @{profile.twitter}
              </a>
            )}
            {profile.github && (
              <a href={`https://github.com/${profile.github}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
                <Github size={14} /> {profile.github}
              </a>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar size={13} /> Joined {format(new Date(profile.created_at), 'MMM yyyy')}
            </span>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-5">
            {[
              { icon: FileText, label: 'Posts', value: profile.posts_count },
              { icon: Users, label: 'Followers', value: profile.followers_count },
              { icon: Users, label: 'Following', value: profile.following_count },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Posts */}
        <div>
          <h2 className="text-lg font-bold text-white mb-5">Published Posts</h2>
          {posts?.items?.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">No published posts yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts?.items?.map((post, i) => (
                <PostCard key={post.id} post={post} index={i} variant="featured" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
