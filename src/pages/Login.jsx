import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useTheme } from '../ThemeContext'

export default function Login() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.bg }}>
      <div className="rounded-2xl shadow-sm p-8 w-full max-w-md" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: theme.heading }}>Splitventure</h1>
          <p className="text-sm" style={{ color: theme.muted }}>The joint adventure budgeting app.</p>
        </div>

        {error && (
          <div className="text-sm rounded-lg px-4 py-2 mb-4" style={{ backgroundColor: theme.subtle, color: theme.danger }}>
            {error}
          </div>
        )}

        <div className="space-y-4">

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.heading }}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg px-4 py-2 focus:outline-none text-sm"
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
                className="w-full rounded-lg px-4 py-2 focus:outline-none text-sm"
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

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full text-white font-semibold py-2.5 rounded-lg transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: theme.accent }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>

          <p className="text-center text-sm" style={{ color: theme.muted }}>
            Don't have an account?{' '}
            <span
              onClick={() => navigate('/signup')}
              className="cursor-pointer hover:underline font-medium"
              style={{ color: theme.accent }}
            >
              Sign up
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