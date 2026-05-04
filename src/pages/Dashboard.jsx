import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Dashboard() {
  const navigate = useNavigate()
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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#dddbf1' }}>
      <p style={{ color: '#ab9f9d' }}>Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f4fb' }}>

      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center" style={{ borderColor: '#dddbf1' }}>
        <h1 className="text-2xl font-bold" style={{ color: '#383f51' }}>Splitventure</h1>
        <button
          onClick={async () => { await supabase.auth.signOut(); navigate('/') }}
          className="text-sm font-medium transition hover:opacity-70"
          style={{ color: '#ab9f9d' }}
        >
          Log out
        </button>
      </nav>

      <div className="max-w-2xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold" style={{ color: '#383f51' }}>My Trips</h2>
          <button
            onClick={() => navigate('/new-trip')}
            className="text-white px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90"
            style={{ backgroundColor: '#3c4f76' }}
          >
            + New Trip
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center" style={{ border: '1px solid #dddbf1' }}>
            <p className="text-lg font-medium mb-1" style={{ color: '#383f51' }}>No trips yet!</p>
            <p className="text-sm" style={{ color: '#ab9f9d' }}>Create your first trip to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map(trip => (
              <div
                key={trip.id}
                onClick={() => navigate(`/trip/${trip.id}`)}
                className="bg-white rounded-2xl shadow-sm p-6 cursor-pointer transition hover:shadow-md"
                style={{ border: '1px solid #dddbf1' }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold mb-1" style={{ color: '#383f51' }}>{trip.name}</h3>
                    <p className="text-sm" style={{ color: '#ab9f9d' }}>{trip.start_date} → {trip.end_date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xs" style={{ color: '#ab9f9d' }}>{trip.trip_length_days} days</p>
                    <div className="flex gap-2">
                      {trip.created_by === user?.id && (
                        <>
                          <button
                            onClick={(e) => archiveTrip(e, trip.id)}
                            className="text-xs px-2 py-1 rounded-full transition hover:opacity-80"
                            style={{ backgroundColor: '#dddbf1', color: '#3c4f76' }}
                          >
                            Archive
                          </button>
                          <button
                            onClick={(e) => deleteTrip(e, trip.id)}
                            className="text-xs px-2 py-1 rounded-full transition hover:opacity-80"
                            style={{ backgroundColor: '#f5e6e3', color: '#c0624e' }}
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