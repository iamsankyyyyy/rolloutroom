import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 mt-auto shrink-0">
      <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">RolloutRoom</p>
          <p className="text-xs text-gray-400 mt-0.5">Multi-agent release assistant for solo artists.</p>
        </div>
        <nav className="flex flex-wrap items-center gap-5 text-xs text-gray-400">
          <Link to="/agent-chats" className="hover:text-white transition-colors">
            How agents work
          </Link>
          <Link to="/dashboard" className="hover:text-white transition-colors">
            Dashboard
          </Link>
          <a
            href="mailto:feedback@rolloutroom.app"
            className="hover:text-white transition-colors"
          >
            Contact / Feedback
          </a>
          <Link to="/account" className="hover:text-white transition-colors">
            Account settings
          </Link>
        </nav>
      </div>
    </footer>
  )
}