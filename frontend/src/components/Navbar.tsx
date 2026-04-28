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
  const [mobileOpen, setMobileOpen] = useState(false)
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
    <header className="relative h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 shrink-0 z-40">
      <Link to="/dashboard" className="font-bold text-indigo-600 text-lg mr-6 flex-shrink-0">
        RolloutRoom
      </Link>

      {/* Desktop nav links — hidden on mobile */}
      <nav className="hidden md:flex items-center gap-1 flex-1">
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

      {/* Mobile spacer pushes account + hamburger to the right */}
      <div className="flex-1 md:hidden" />

      {/* Account avatar/dropdown — always visible */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
            {initials}
          </span>
          <span className="hidden sm:block">Account</span>
          <svg
            className={`hidden sm:block w-3 h-3 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 12 8"
          >
            <path d="M1 1.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

      {/* Hamburger button — mobile only */}
      <button
        onClick={() => setMobileOpen((v) => !v)}
        className="ml-1 md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
        aria-label="Toggle navigation menu"
      >
        {mobileOpen ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
            <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Mobile nav drawer — full-width dropdown below header */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 md:hidden">
          {user && (
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-800">{user.artist_name || user.username}</p>
              <p className="text-[11px] text-gray-400">{user.email}</p>
            </div>
          )}
          <nav className="py-1">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-3.5 text-sm font-medium transition-colors ${
                    isActive ? 'text-indigo-700 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="px-4 py-2 border-t border-gray-100">
            <button
              onClick={() => { navigate('/account'); setMobileOpen(false) }}
              className="w-full text-left py-3 text-sm text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Account settings
            </button>
            <button
              onClick={() => { setMobileOpen(false); logout() }}
              className="w-full text-left py-3 text-sm text-red-600"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  )
}