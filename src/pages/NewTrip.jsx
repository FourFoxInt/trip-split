import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useTheme } from '../ThemeContext'

export default function NewTrip() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [tripName, setTripName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [members, setMembers] = useState('')
  const [costs, setCosts] = useState([
    { label: '', amount: '', splitType: 'per person', dueDate: '' }
  ])
  const [summary, setSummary] = useState(null)

  const addCost = () => {
    setCosts([...costs, { label: '', amount: '', splitType: 'per person', dueDate: startDate }])
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
    if (!tripName || !startDate || !endDate) {
      alert('Please fill in all fields.')
      return
    }

    const memberList = members.split(',').map(m => m.trim()).filter(m => m !== '')
    const numMembers = memberList.length + 1

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

  const handleSave = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session.user.id

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        name: summary.tripName,
        start_date: summary.startDate,
        end_date: summary.endDate,
        weeks_until: summary.weeksUntil,
        days_until: summary.daysUntilTrip,
        trip_length_days: summary.tripLengthDays,
        created_by: userId
      })
      .select()
      .single()

    if (tripError) {
      alert('Error saving trip: ' + tripError.message)
      return
    }

    await supabase.from('trip_members').insert({
      trip_id: trip.id,
      user_id: userId,
      is_admin: true
    })

    await supabase.from('trip_costs').insert(
      costs.map(c => ({
        trip_id: trip.id,
        label: c.label,
        amount: parseFloat(c.amount) || 0,
        split_type: c.splitType,
        due_date: c.dueDate || null
      }))
    )

    for (const email of summary.memberList) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim())
        .single()

      if (profile && profile.id !== userId) {
        await supabase.from('trip_members').insert({
          trip_id: trip.id,
          user_id: profile.id,
          is_admin: false
        })
      }
    }

    navigate(`/trip/${trip.id}`)
  }

  const inputClass = "w-full rounded-lg px-4 py-2 text-sm focus:outline-none"

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

      <div className="max-w-2xl mx-auto p-6 space-y-6">

        <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: theme.heading }}>Create New Trip</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.heading }}>Trip Name</label>
              <input
                type="text"
                placeholder="e.g. Queenstown Weekend"
                value={tripName}
                onChange={e => setTripName(e.target.value)}
                className={inputClass}
                style={{ border: `1px solid ${theme.border}`, color: theme.heading, backgroundColor: theme.bg }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.heading }}>Trip Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value)
                  setCosts(costs.map(c => ({ ...c, dueDate: c.dueDate === '' || c.dueDate === startDate ? e.target.value : c.dueDate })))
                }}
                className={inputClass}
                style={{ border: `1px solid ${theme.border}`, color: theme.heading, backgroundColor: theme.bg }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.heading }}>Trip End Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                className={inputClass}
                style={{ border: `1px solid ${theme.border}`, color: theme.heading, backgroundColor: theme.bg }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.heading }}>Invite Members (comma separated emails)</label>
              <input
                type="text"
                placeholder="friend1@email.com, friend2@email.com"
                value={members}
                onChange={e => setMembers(e.target.value)}
                className={inputClass}
                style={{ border: `1px solid ${theme.border}`, color: theme.heading, backgroundColor: theme.bg }}
              />
              <p className="text-xs mt-1" style={{ color: theme.muted }}>You are automatically added as the trip organiser.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold" style={{ color: theme.heading }}>Costs</h3>
            <button
              onClick={addCost}
              className="text-sm font-medium transition hover:opacity-70"
              style={{ color: theme.accent }}
            >
              + Add Cost
            </button>
          </div>

          <div className="space-y-4">
            {costs.map((cost, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  placeholder="Label"
                  value={cost.label}
                  onChange={e => updateCost(i, 'label', e.target.value)}
                  className="col-span-3 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: `1px solid ${theme.border}`, color: theme.heading, backgroundColor: theme.bg }}
                />
                <input
                  type="number"
                  placeholder="Amount $"
                  value={cost.amount}
                  onChange={e => updateCost(i, 'amount', e.target.value)}
                  className="col-span-2 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: `1px solid ${theme.border}`, color: theme.heading, backgroundColor: theme.bg }}
                />
                <select
                  value={cost.splitType}
                  onChange={e => updateCost(i, 'splitType', e.target.value)}
                  className="col-span-3 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: `1px solid ${theme.border}`, color: theme.heading, backgroundColor: theme.bg }}
                >
                  <option value="per person">Per Person</option>
                  <option value="group">Group Split</option>
                  <option value="per person per day">Per Person/Day</option>
                  <option value="group per day">Group/Day</option>
                </select>
                <input
                  type="date"
                  value={cost.dueDate}
                  max={endDate}
                  onChange={e => updateCost(i, 'dueDate', e.target.value)}
                  className="col-span-3 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: `1px solid ${theme.border}`, color: theme.heading, backgroundColor: theme.bg }}
                />
                <button
                  onClick={() => removeCost(i)}
                  className="col-span-1 text-lg font-bold text-center transition hover:opacity-70"
                  style={{ color: theme.muted }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreate}
          className="w-full text-white font-semibold py-3 rounded-xl transition hover:opacity-90"
          style={{ backgroundColor: theme.accent }}
        >
          Preview Trip
        </button>

        {summary && (
          <div className="rounded-2xl shadow-sm p-6 space-y-3" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
            <h3 className="text-lg font-semibold" style={{ color: theme.heading }}>Trip Summary</h3>

            <div className="space-y-2 text-sm">
              <p style={{ color: theme.muted }}>Trip: <span className="font-semibold" style={{ color: theme.heading }}>{summary.tripName}</span></p>
              <p style={{ color: theme.muted }}>Dates: <span className="font-semibold" style={{ color: theme.heading }}>{summary.startDate} → {summary.endDate}</span></p>
              <p style={{ color: theme.muted }}>Trip Length: <span className="font-semibold" style={{ color: theme.heading }}>{summary.tripLengthDays} days</span></p>
              <p style={{ color: theme.muted }}>Weeks until trip: <span className="font-semibold" style={{ color: theme.heading }}>{summary.weeksUntil} ({summary.daysUntilTrip} days)</span></p>
              <p style={{ color: theme.muted }}>Invited members: <span className="font-semibold" style={{ color: theme.heading }}>{summary.memberList.length > 0 ? summary.memberList.join(', ') : 'None'}</span></p>
              <p style={{ color: theme.muted }}>Total Cost: <span className="font-semibold" style={{ color: theme.accent }}>${summary.totalCost.toFixed(2)}</span></p>
              <p style={{ color: theme.muted }}>Per Person: <span className="font-semibold" style={{ color: theme.accent }}>${summary.perPerson.toFixed(2)}</span></p>
            </div>

            <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: theme.subtle }}>
              <p className="text-sm font-medium" style={{ color: theme.heading }}>Payment options</p>
              <p className="text-sm" style={{ color: theme.muted }}>Weekly: <span className="font-semibold" style={{ color: theme.heading }}>${summary.weekly}</span></p>
              <p className="text-sm" style={{ color: theme.muted }}>Fortnightly: <span className="font-semibold" style={{ color: theme.heading }}>${summary.fortnightly}</span></p>
              <p className="text-sm" style={{ color: theme.muted }}>Monthly: <span className="font-semibold" style={{ color: theme.heading }}>${summary.monthly}</span></p>
            </div>

            <button
              onClick={handleSave}
              className="w-full text-white font-semibold py-3 rounded-xl transition hover:opacity-90 mt-2"
              style={{ backgroundColor: theme.heading }}
            >
              Confirm & Save Trip
            </button>
          </div>
        )}

      </div>
    </div>
  )
}