import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function NewTrip() {
  const navigate = useNavigate()
  const [tripName, setTripName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [members, setMembers] = useState('')
  const [costs, setCosts] = useState([
    { label: '', amount: '', splitType: 'per person' }
  ])
  const [summary, setSummary] = useState(null)

  const addCost = () => {
    setCosts([...costs, { label: '', amount: '', splitType: 'per person' }])
  }

  const removeCost = (index) => {
    setCosts(costs.filter((_, i) => i !== index))
  }

  const updateCost = (index, field, value) => {
    const updated = costs.map((cost, i) =>
      i === index ? { ...cost, [field]: value } : cost
    )
    setCosts(updated)
  }

  const handleCreate = () => {
    const memberList = members.split(',').map(m => m.trim()).filter(m => m !== '')
    const numMembers = memberList.length || 1

    const today = new Date()
    const tripStart = new Date(startDate)
    const tripEnd = new Date(endDate)
    const weeksNum = Math.ceil((tripStart - today) / (1000 * 60 * 60 * 24 * 7)) || 1
    const daysUntilTrip = Math.ceil((tripStart - today) / (1000 * 60 * 60 * 24)) || 1
    const tripLengthDays = Math.ceil((tripEnd - tripStart) / (1000 * 60 * 60 * 24)) + 1 || 1

    const totalCost = costs.reduce((sum, c) => {
      const amount = parseFloat(c.amount) || 0
      if (c.splitType === 'group') return sum + amount
      if (c.splitType === 'per person') return sum + amount * numMembers
      if (c.splitType === 'per person per day') return sum + amount * numMembers * tripLengthDays
      if (c.splitType === 'group per day') return sum + amount * tripLengthDays
      return sum + amount
    }, 0)

    const perPerson = totalCost / numMembers

    setSummary({
      tripName,
      startDate,
      endDate,
      tripLengthDays,
      weeksUntil: weeksNum,
      daysUntilTrip,
      memberList,
      totalCost,
      perPerson,
      weekly: (perPerson / weeksNum).toFixed(2),
      fortnightly: (perPerson / (weeksNum / 2)).toFixed(2),
      monthly: (perPerson / (weeksNum / 4)).toFixed(2),
    })
  }

  return (
    <div className="min-h-screen bg-gray-100">

      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline text-sm">
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-blue-600">Trip Split</h1>
      </nav>

      <div className="max-w-2xl mx-auto p-6 space-y-6">

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Trip</h2>

          <div className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trip Name</label>
              <input
                type="text"
                placeholder="e.g. Taylor Swift Concert"
                value={tripName}
                onChange={e => setTripName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trip Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trip End Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Member Emails (comma separated)</label>
              <input
                type="text"
                placeholder="alice@email.com, beth@email.com"
                value={members}
                onChange={e => setMembers(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Costs</h3>
            <button
              onClick={addCost}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              + Add Cost
            </button>
          </div>

          <div className="space-y-4">
            {costs.map((cost, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  placeholder="Label (e.g. Petrol)"
                  value={cost.label}
                  onChange={e => updateCost(i, 'label', e.target.value)}
                  className="col-span-4 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Amount $"
                  value={cost.amount}
                  onChange={e => updateCost(i, 'amount', e.target.value)}
                  className="col-span-3 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={cost.splitType}
                  onChange={e => updateCost(i, 'splitType', e.target.value)}
                  className="col-span-4 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="per person">Per Person</option>
                  <option value="group">Group Split</option>
                  <option value="per person per day">Per Person/Day</option>
                  <option value="group per day">Group/Day</option>
                </select>

                <button
                  onClick={() => removeCost(i)}
                  className="col-span-1 text-red-400 hover:text-red-600 text-lg font-bold text-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreate}
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition"
        >
          Preview Trip
        </button>

        {summary && (
          <div className="bg-white rounded-2xl shadow p-6 space-y-3">
            <h3 className="text-lg font-semibold text-gray-700">Trip Summary</h3>
            <p className="text-gray-600">Trip: <span className="font-bold">{summary.tripName}</span></p>
            <p className="text-gray-600">Dates: <span className="font-bold">{summary.startDate} → {summary.endDate}</span></p>
            <p className="text-gray-600">Trip Length: <span className="font-bold">{summary.tripLengthDays} days</span></p>
            <p className="text-gray-600">Weeks until trip: <span className="font-bold">{summary.weeksUntil} ({summary.daysUntilTrip} days)</span></p>            <p className="text-gray-600">Members: <span className="font-bold">{summary.memberList.join(', ')}</span></p>
            <p className="text-gray-600">Total Cost: <span className="font-bold text-blue-600">${summary.totalCost.toFixed(2)}</span></p>
            <p className="text-gray-600">Per Person: <span className="font-bold text-blue-600">${summary.perPerson.toFixed(2)}</span></p>
            <div className="border-t pt-3 space-y-1">
              <p className="text-gray-600">Weekly: <span className="font-bold">${summary.weekly}</span></p>
              <p className="text-gray-600">Fortnightly: <span className="font-bold">${summary.fortnightly}</span></p>
              <p className="text-gray-600">Monthly: <span className="font-bold">${summary.monthly}</span></p>
            </div>
            <button className="w-full bg-green-500 text-white font-semibold py-3 rounded-xl hover:bg-green-600 transition mt-2">
              Confirm & Save Trip
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
