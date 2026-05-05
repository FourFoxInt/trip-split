import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useTheme } from '../ThemeContext'

export default function Dashboard() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  const archiveTrip = async (e, tripId) => {
    e.stopPropagation()
    await supabase.from('trips').update({ archived: true }).eq('id', tripId)
    setTrips(trips.filter(t => t.id !== tripId))
  }

  const deleteTrip = async (e, tripId) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this trip? This cannot be undone.')) return
    await supabase.from('trips').delete().eq('id', tripId)
    setTrips(trips.filter(t => t.id !== tripId))
  }

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session.user)

      const { data: memberTrips } = await supabase
        .from('trip_members')
        .select('trip_id')
        .eq('user_id', session.user.id)

      if (memberTrips && memberTrips.length > 0) {
        const tripIds = memberTrips.map(t => t.trip_id)
        const { data: tripsData } = await supabase
          .from('trips')
          .select('*')
          .in('id', tripIds)
          .eq('archived', false)
        setTrips(tripsData || [])
      }

      setLoading(false)
    }

    loadData()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
      <p style={{ color: theme.muted }}>Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bg }}>

      <nav className="border-b px-6 py-4 flex justify-between items-center" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
        <h1 className="text-2xl font-bold" style={{ color: theme.heading }}>Splitventure</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/profile')}
            className="text-sm font-medium transition hover:opacity-70"
            style={{ color: theme.muted }}
          >
            Profile
          </button>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate('/') }}
            className="text-sm font-medium transition hover:opacity-70"
            style={{ color: theme.muted }}
          >
            Log out
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold" style={{ color: theme.heading }}>My Trips</h2>
          <button
            onClick={() => navigate('/new-trip')}
            className="text-white px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90"
            style={{ backgroundColor: theme.accent }}
          >
            + New Trip
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="rounded-2xl shadow-sm p-8 text-center" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
            <p className="text-lg font-medium mb-1" style={{ color: theme.heading }}>No trips yet!</p>
            <p className="text-sm" style={{ color: theme.muted }}>Create your first trip to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map(trip => (
              <div
                key={trip.id}
                onClick={() => navigate(`/trip/${trip.id}`)}
                className="rounded-2xl shadow-sm p-6 cursor-pointer transition hover:shadow-md"
                style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold mb-1" style={{ color: theme.heading }}>{trip.name}</h3>
                    <p className="text-sm" style={{ color: theme.muted }}>{trip.start_date} → {trip.end_date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xs" style={{ color: theme.muted }}>{trip.trip_length_days} days</p>
                    <div className="flex gap-2">
                      {trip.created_by === user?.id && (
                        <>
                          <button
                            onClick={(e) => archiveTrip(e, trip.id)}
                            className="text-xs px-2 py-1 rounded-full transition hover:opacity-80"
                            style={{ backgroundColor: theme.subtle, color: theme.accent }}
                          >
                            Archive
                          </button>
                          <button
                            onClick={(e) => deleteTrip(e, trip.id)}
                            className="text-xs px-2 py-1 rounded-full transition hover:opacity-80"
                            style={{ backgroundColor: theme.subtle, color: theme.danger }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}