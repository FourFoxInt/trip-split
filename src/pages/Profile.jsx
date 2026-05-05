import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useTheme } from '../ThemeContext.jsx'

export default function Profile() {
  const navigate = useNavigate()
  const { theme, mode, toggle } = useTheme()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setName(profile?.name || '')
      setEmail(session.user.email || '')
      setLoading(false)
    }
    loadProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('profiles').update({ name }).eq('id', session.user.id)
    setMessage('Profile updated!')
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
      <p style={{ color: theme.muted }}>Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bg }}>

      <nav className="border-b px-6 py-4 flex justify-between items-center" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm font-medium transition hover:opacity-70"
          style={{ color: theme.accent }}
        >
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold" style={{ color: theme.heading }}>Splitventure</h1>
      </nav>

      <div className="max-w-md mx-auto p-6 space-y-6">

        <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
          <h2 className="text-xl font-bold mb-6" style={{ color: theme.heading }}>Profile Settings</h2>

          {message && (
            <div className="text-sm rounded-lg px-4 py-2 mb-4" style={{ backgroundColor: theme.subtle, color: theme.accent }}>
              {message}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.heading }}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-lg px-4 py-2 text-sm focus:outline-none"
                style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.heading }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.heading }}>Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-lg px-4 py-2 text-sm"
                style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.subtle, color: theme.muted }}
              />
              <p className="text-xs mt-1" style={{ color: theme.muted }}>Email cannot be changed.</p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full text-white font-semibold py-2.5 rounded-lg transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: theme.accent }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: theme.heading }}>Appearance</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium" style={{ color: theme.heading }}>Dark Mode</p>
              <p className="text-xs" style={{ color: theme.muted }}>{mode === 'dark' ? 'Currently using dark mode' : 'Currently using light mode'}</p>
            </div>
            <button
              onClick={toggle}
              className="w-14 h-7 rounded-full transition-all relative"
              style={{ backgroundColor: mode === 'dark' ? theme.accent : theme.border }}
            >
              <div
                className="w-5 h-5 rounded-full bg-white absolute top-1 transition-all"
                style={{ left: mode === 'dark' ? '30px' : '4px' }}
              />
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}