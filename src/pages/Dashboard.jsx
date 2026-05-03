import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Dashboard() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session.user)

      const { data: memberTrips } = await supabase
        .from('trip_members')
        .select('trip_id')
        .eq('user_id', session.user.id)

      console.log('User ID:', session.user.id)
      console.log('Member trips:', memberTrips)

      if (memberTrips && memberTrips.length > 0) {
        const tripIds = memberTrips.map(t => t.trip_id)
        const { data: tripsData } = await supabase
          .from('trips')
          .select('*')
          .in('id', tripIds)
        setTrips(tripsData || [])
      }

      setLoading(false)
    }

    loadData()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">

      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">Trip Split</h1>
        <button
          onClick={async () => { await supabase.auth.signOut(); navigate('/') }}
          className="text-sm text-gray-500 hover:text-red-500 transition"
        >
          Log out
        </button>
      </nav>

      <div className="max-w-2xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700">My Trips</h2>
          <button
            onClick={() => navigate('/new-trip')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
          >
            + New Trip
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400">
            <p className="text-lg">No trips yet!</p>
            <p className="text-sm mt-1">Create your first trip to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map(trip => (
              <div
                key={trip.id}
                onClick={() => navigate(`/trip/${trip.id}`)}
                className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{trip.name}</h3>
                    <p className="text-sm text-gray-400">{trip.start_date} → {trip.end_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{trip.trip_length_days} days</p>
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