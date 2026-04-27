import { useState, useRef, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useLogout, useCurrentUser } from '../hooks/useAuth'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/agent-chats', label: 'Agent Chats' },
  { to: '/projects', label: 'Projects' },
  { to: '/tasks', label: 'Tasks' },
]

export default function Navbar() {
  const logout = useLogout()
  const navigate = useNavigate()
  const { data: user } = useCurrentUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [menuOpen])

  const initials = (user?.artist_name || user?.username || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shrink-0">
      <Link to="/dashboard" className="font-bold text-indigo-600 text-lg mr-8">
        RolloutRoom
      </Link>

      <nav className="flex items-center gap-1 flex-1">
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Account dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
            {initials}
          </span>
          <span className="hidden sm:block">Account</span>
          <svg
            className={`w-3 h-3 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 12 8"
          >
            <path
              d="M1 1.5l5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 w-52 z-50">
            {user && (
              <div className="px-4 py-2 border-b border-gray-100 mb-1">
                <p className="text-xs font-semibold text-gray-800 truncate">
                  {user.artist_name || user.username}
                </p>
                <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
              </div>
            )}
            <button
              onClick={() => { navigate('/account'); setMenuOpen(false) }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Account settings
            </button>
            <hr className="my-1 border-gray-100" />
            <button
              onClick={() => { setMenuOpen(false); logout() }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}