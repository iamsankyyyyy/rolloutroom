import { useState, useEffect, type FormEvent } from 'react'
import { useCurrentUser, useUpdateMe } from '../hooks/useAuth'
import { apiClient } from '../api/client'

const TONE_OPTIONS = [
  { value: 'twitter_casual', label: 'Casual — relaxed, Gen Z friendly' },
  { value: 'balanced', label: 'Balanced — warm but polished (default)' },
  { value: 'professional', label: 'A&R Pro — formal and precise' },
]

const PLATFORM_OPTIONS = [
  { value: '', label: 'Select your main stage…' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'spotify', label: 'Spotify' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'soundcloud', label: 'SoundCloud' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'bandcamp', label: 'Bandcamp' },
  { value: 'apple_music', label: 'Apple Music' },
]

export default function AccountPage() {
  const { data: user } = useCurrentUser()
  const { mutate: saveProfile, isPending: savingProfile, isSuccess: profileSaved } = useUpdateMe()
  const { mutate: savePrefs, isPending: savingPrefs, isSuccess: prefsSaved } = useUpdateMe()

  const [artistName, setArtistName] = useState('')
  const [genre, setGenre] = useState('')
  const [primaryPlatform, setPrimaryPlatform] = useState('')
  const [bio, setBio] = useState('')
  const [tonePreference, setTonePreference] = useState('balanced')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setArtistName(user.artist_name ?? '')
      setGenre(user.genre ?? '')
      setPrimaryPlatform(user.primary_platform ?? '')
      setBio(user.bio ?? '')
      setTonePreference(user.tone_preference ?? 'balanced')
    }
  }, [user?.id])

  function handleProfileSave(e: FormEvent) {
    e.preventDefault()
    saveProfile({
      artist_name: artistName || null,
      genre: genre || null,
      primary_platform: primaryPlatform || null,
      bio: bio || null,
    })
  }

  function handlePrefSave(e: FormEvent) {
    e.preventDefault()
    savePrefs({ tone_preference: tonePreference })
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault()
    setPwError('')
    if (newPassword !== confirmPassword) { setPwError('New passwords do not match.'); return }
    if (newPassword.length < 6) { setPwError('New password must be at least 6 characters.'); return }
    setPwSaving(true)
    try {
      await apiClient.post('/users/me/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      setPwSuccess(true)
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setTimeout(() => setPwSuccess(false), 4000)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setPwError(detail ?? 'Failed to change password.')
    } finally {
      setPwSaving(false)
    }
  }

  const initials = (user?.artist_name || user?.username || '?')
    .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Artist Profile & Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Tell your team about you — they use this context to give better advice.
        </p>
      </div>

      {/* Artist Profile */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Artist Profile</h2>
            <p className="text-xs text-gray-400">Shared with your AI team as context</p>
          </div>
        </div>
        <form onSubmit={handleProfileSave} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Stage Name</label>
              <input type="text" value={artistName} onChange={(e) => setArtistName(e.target.value)}
                placeholder="How fans know you"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Genre</label>
              <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g. Afrobeats, dark pop, lo-fi R&B"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Primary Platform</label>
            <select value={primaryPlatform} onChange={(e) => setPrimaryPlatform(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {PLATFORM_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Artist Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
              placeholder="Your sound, where you're based, what you're working on…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={savingProfile}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
              {savingProfile ? 'Saving…' : 'Save profile'}
            </button>
            {profileSaved && <span className="text-xs text-green-600 font-medium">Profile saved.</span>}
          </div>
        </form>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-800">Account Info</h2>
          <p className="text-xs text-gray-400">Contact support to change email or username</p>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Username</p>
            <p className="mt-1 text-sm text-gray-900">{user?.username ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Email</p>
            <p className="mt-1 text-sm text-gray-900">{user?.email ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Agent Preferences */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-800">Agent Preferences</h2>
          <p className="text-xs text-gray-400">How your AI team writes and speaks to you</p>
        </div>
        <form onSubmit={handlePrefSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Communication Tone</label>
            <select value={tonePreference} onChange={(e) => setTonePreference(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {TONE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={savingPrefs}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
              {savingPrefs ? 'Saving…' : 'Save preferences'}
            </button>
            {prefsSaved && <span className="text-xs text-green-600 font-medium">Preferences saved.</span>}
          </div>
        </form>
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-800">Security</h2>
          <p className="text-xs text-gray-400">Change your login password</p>
        </div>
        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters" required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password" required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          {pwError && <p className="text-xs text-red-600">{pwError}</p>}
          {pwSuccess && <p className="text-xs text-green-600 font-medium">Password changed successfully.</p>}
          <button type="submit" disabled={pwSaving}
            className="bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
            {pwSaving ? 'Updating…' : 'Change password'}
          </button>
        </form>
      </div>
    </div>
  )
}