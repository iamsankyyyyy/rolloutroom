import { Link, Navigate } from 'react-router-dom'

export default function LandingPage() {
  const token = localStorage.getItem('access_token')
  if (token) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Nav */}
      <header className="h-16 border-b border-gray-100 flex items-center px-8 justify-between shrink-0">
        <span className="font-bold text-indigo-600 text-lg">RolloutRoom</span>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Log in
          </Link>
          <Link
            to="/register"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Sign up free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-4">
          For independent artists
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-5 max-w-2xl">
          Your AI release team,<br />always in the room.
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mb-8 leading-relaxed">
          RolloutRoom gives you a personal Manager, Creative Director, and Publicist —
          ready to plan every project from idea to release.
        </p>
        <div className="flex items-center gap-3">
          <Link
            to="/register"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl text-sm transition-colors"
          >
            Get started free
          </Link>
          <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700 px-4 py-3 transition-colors">
            Log in →
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 border-t border-gray-100 py-16 shrink-0">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-10">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                num: '1',
                title: 'Create a project',
                desc: 'Add a song, EP, or album. Fill in the vibe, mood, and goals so your team knows the full picture.',
                color: 'bg-indigo-100 text-indigo-600',
              },
              {
                num: '2',
                title: 'Chat with your team',
                desc: 'Message your Manager, Creative Director, or Publicist about any release decision — they stay in context.',
                color: 'bg-purple-100 text-purple-600',
              },
              {
                num: '3',
                title: 'Turn ideas into action',
                desc: 'Convert insights from Manager messages directly into tasks. Build a checklist your release can actually follow.',
                color: 'bg-rose-100 text-rose-600',
              },
            ].map((step) => (
              <div key={step.num} className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className={`w-8 h-8 rounded-full ${step.color} flex items-center justify-center text-sm font-bold mb-4`}>
                  {step.num}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center shrink-0">
        <p className="text-xs text-gray-400">
          Built for independent artists. © {new Date().getFullYear()} RolloutRoom.
        </p>
      </footer>
    </div>
  )
}
