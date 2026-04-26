import { useState, useEffect, type FormEvent } from 'react'
import { useCurrentUser, useUpdateMe } from '../hooks/useAuth'

const TONE_OPTIONS = [
  { value: 'twitter_casual', label: 'Twitter Casual — very informal, Gen Z' },
  { value: 'balanced', label: 'Balanced — warm but polished (default)' },
  { value: 'professional', label: 'A&R Professional — formal and precise' },
]

export default function AccountPage() {
  const { data: user } = useCurrentUser()
  const { mutate: saveMe, isPending: saving, isSuccess } = useUpdateMe()

  const [artistName, setArtistName] = useState('')
  const [tonePreference, setTonePreference] = useState('balanced')

  useEffect(() => {
    if (user) {
      setArtistName(user.artist_name ?? '')
      setTonePreference(user.tone_preference ?? 'balanced')
    }
  }, [user?.id])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    saveMe({
      artist_name: artistName || null,
      tone_preference: tonePreference,
    })
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your profile and preferences.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Profile</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Username</p>
              <p className="mt-0.5 text-sm text-gray-900">{user?.username ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Email</p>
              <p className="mt-0.5 text-sm text-gray-900">{user?.email ?? '—'}</p>
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
              Artist Name
            </label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="How you want to be known"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
              Agent Tone Preference
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Stored for future use — not yet wired into agent prompts.
            </p>
            <select
              value={tonePreference}
              onChange={(e) => setTonePreference(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {TONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {isSuccess && (
              <span className="text-xs text-green-600 font-medium">Saved.</span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
