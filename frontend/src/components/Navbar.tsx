import { NavLink, Link } from 'react-router-dom'
import { useLogout, useCurrentUser } from '../hooks/useAuth'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/projects', label: 'Projects' },
  { to: '/tasks', label: 'Tasks' },
]

export default function Navbar() {
  const logout = useLogout()
  const { data: user } = useCurrentUser()
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shrink-0">
      <Link to="/dashboard" className="font-bold text-indigo-600 text-lg mr-8">RolloutRoom</Link>
      <nav className="flex items-center gap-1 flex-1">
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        {user && (
          <Link
            to="/account"
            className="text-sm text-gray-500 hover:text-indigo-600 transition-colors hidden sm:block"
          >
            {user.artist_name || user.username}
          </Link>
        )}
        <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600 transition-colors">
          Sign out
        </button>
      </div>
    </header>
  )
}
