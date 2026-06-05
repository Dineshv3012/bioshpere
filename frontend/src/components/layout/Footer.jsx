import { Link } from 'react-router-dom'
import { Sparkles, Github, Twitter, Linkedin } from 'lucide-react'

const links = {
  Platform: [
    { label: 'Home', to: '/' },
    { label: 'Write', to: '/write' },
    { label: 'Trending', to: '/?sort=popular' },
    { label: 'Search', to: '/search' },
  ],
  Categories: [
    { label: 'Technology', to: '/category/technology' },
    { label: 'Programming', to: '/category/programming' },
    { label: 'AI', to: '/category/ai' },
    { label: 'Business', to: '/category/business' },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] mt-20">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-sky-400 flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <span className="font-bold text-white">Blog<span className="gradient-text">Sphere</span></span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed">
              The modern platform for thoughtful writers and curious readers.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 glass rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:border-primary-500/40 transition-all">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {items.map(({ label, to }) => (
                  <li key={to}>
                    <Link to={to} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Stay updated</h4>
            <p className="text-sm text-slate-500 mb-3">Get the best articles in your inbox.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-white/5 border border-white/[0.08] text-slate-300 placeholder-slate-600 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500/40 transition-all"
              />
              <button className="btn-primary text-xs py-2 px-3">Subscribe</button>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} BlogSphere. All rights reserved.</p>
          <p className="text-xs text-slate-600">Built with FastAPI + React</p>
        </div>
      </div>
    </footer>
  )
}
