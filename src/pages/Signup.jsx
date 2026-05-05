import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useTheme } from '../ThemeContext'

export default function Signup() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    navigate('/dashboard')
  }

  const inputClass = "w-full rounded-lg px-4 py-2 text-sm focus:outline-none"

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.bg }}>
      <div className="rounded-2xl shadow-sm p-8 w-full max-w-md" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: theme.heading }}>Splitventure</h1>
          <p className="text-sm" style={{ color: theme.muted }}>Create your account</p>
        </div>

        {error && (
          <div className="text-sm rounded-lg px-4 py-2 mb-4" style={{ backgroundColor: theme.subtle, color: theme.danger }}>
            {error}
          </div>
        )}

        <div className="space-y-4">

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.heading }}>Full Name</label>
            <input
              type="text"
              placeholder="Jane Smith"
              value={name}
              onChange={e => setName(e.target.value)}
              className={inputClass}
              style={{ border: `1px solid ${theme.border}`, color: theme.heading, backgroundColor: theme.bg }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.heading }}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputClass}
              style={{ border: `1px solid ${theme.border}`, color: theme.heading, backgroundColor: theme.bg }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.heading }}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputClass}
                style={{ border: `1px solid ${theme.border}`, color: theme.heading, backgroundColor: theme.bg }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-sm transition hover:opacity-70"
                style={{ color: theme.muted }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.heading }}>Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={inputClass}
                style={{ border: `1px solid ${theme.border}`, color: theme.heading, backgroundColor: theme.bg }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-sm transition hover:opacity-70"
                style={{ color: theme.muted }}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full text-white font-semibold py-2.5 rounded-lg transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: theme.accent }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-sm" style={{ color: theme.muted }}>
            Already have an account?{' '}
            <span
              onClick={() => navigate('/login')}
              className="cursor-pointer hover:underline font-medium"
              style={{ color: theme.accent }}
            >
              Log in
            </span>
          </p>

          <p className="text-center text-sm" style={{ color: theme.muted }}>
            <span
              onClick={() => navigate('/')}
              className="cursor-pointer hover:underline"
            >
              Back to home
            </span>
          </p>

        </div>
      </div>
    </div>
  )
}