import { useNavigate } from 'react-router-dom'

const dummyTrips = [
  { id: 1, name: "Taylor Swift Concert", date: "2025-08-15", members: 5, total: 3350 },
  { id: 2, name: "Queenstown Weekend", date: "2025-07-01", members: 4, total: 1200 },
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-100">

      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">Trip Split</h1>
        <button className="text-sm text-gray-500 hover:text-red-500 transition">Log out</button>
      </nav>

      <div className="max-w-2xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700">My Trips</h2>
          <button onClick={() => navigate('/new-trip')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
            + New Trip
          </button>
        </div>

        <div className="space-y-4">
          {dummyTrips.map(trip => (
            <div
              key={trip.id}
              onClick={() => navigate(`/trip/${trip.id}`)}
              className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{trip.name}</h3>
                  <p className="text-sm text-gray-400">{trip.members} members · {trip.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-blue-600 font-bold text-lg">${trip.total}</p>
                  <p className="text-xs text-gray-400">total</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}