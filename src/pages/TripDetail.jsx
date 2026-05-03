import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'

export default function TripDetail() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [trip, setTrip] = useState(null)
  const [costs, setCosts] = useState([])
  const [members, setMembers] = useState([])
  const [payments, setPayments] = useState([])
  const [feed, setFeed] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [schedule, setSchedule] = useState('Weekly')
  const [newComment, setNewComment] = useState('')
  const [newPayment, setNewPayment] = useState('')
  const [selectedMember, setSelectedMember] = useState('')

  const [showCosts, setShowCosts] = useState(true)
  const [showSchedule, setShowSchedule] = useState(true)
  const [showPayments, setShowPayments] = useState(true)
  const [showHistory, setShowHistory] = useState(true)
  const [showMembers, setShowMembers] = useState(true)
  const [showFeed, setShowFeed] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session.user.id

      const { data: tripData } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .single()
      setTrip(tripData)

      const { data: costsData } = await supabase
        .from('trip_costs')
        .select('*')
        .eq('trip_id', id)
      setCosts(costsData || [])

      const { data: membersData } = await supabase
        .from('trip_members')
        .select('*, profiles(name, email)')
        .eq('trip_id', id)
      setMembers(membersData || [])

      const isAdmin = membersData?.find(m => m.user_id === userId)?.is_admin || false
      setCurrentUser({ id: userId, isAdmin })

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*, profiles(name)')
        .eq('trip_id', id)
      setPayments(paymentsData || [])

      const { data: feedData } = await supabase
        .from('feed_posts')
        .select('*, profiles(name)')
        .eq('trip_id', id)
        .order('created_at', { ascending: true })
      setFeed(feedData || [])

      setLoading(false)
    }

    loadData()
  }, [id])

  const totalCost = costs.reduce((sum, c) => {
    const amount = parseFloat(c.amount) || 0
    if (c.split_type === 'group') return sum + amount
    if (c.split_type === 'per person') return sum + amount * (members.length || 1)
    if (c.split_type === 'per person per day') return sum + amount * (members.length || 1) * (trip?.trip_length_days || 1)
    if (c.split_type === 'group per day') return sum + amount * (trip?.trip_length_days || 1)
    return sum + amount
  }, 0)

  const perPerson = members.length > 0 ? totalCost / members.length : 0

  const getPaymentAmount = () => {
    const weeks = trip?.weeks_until || 1
    const count = getPaymentCount()
    return (perPerson / count).toFixed(2)
  }

  const getPaymentCount = () => {
    const weeks = trip?.weeks_until || 1
    if (schedule === 'Weekly') return Math.max(1, weeks)
    if (schedule === 'Fortnightly') return Math.max(1, Math.floor(weeks / 2))
    if (schedule === 'Monthly') return Math.max(1, Math.floor(weeks / 4))
  }

  const addComment = async () => {
    if (!newComment.trim()) return
    setNewComment('')
    await supabase
      .from('feed_posts')
      .insert({ trip_id: id, user_id: currentUser.id, message: newComment })

    const { data: refreshedFeed } = await supabase
      .from('feed_posts')
      .select('*, profiles(name)')
      .eq('trip_id', id)
      .order('created_at', { ascending: true })
    setFeed(refreshedFeed || [])
  }

  const addPayment = async () => {
    if (!newPayment || isNaN(newPayment)) return
    const targetUserId = currentUser.isAdmin && selectedMember ? selectedMember : currentUser.id
    setNewPayment('')
    setSelectedMember('')

    await supabase
      .from('payments')
      .insert({ trip_id: id, user_id: targetUserId, amount: parseFloat(newPayment) })

    const { data: refreshedPayments } = await supabase
      .from('payments')
      .select('*, profiles(name)')
      .eq('trip_id', id)
    setPayments(refreshedPayments || [])
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">

      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline text-sm">
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-blue-600">Trip Split</h1>
      </nav>

      <div className="max-w-2xl mx-auto p-6 space-y-6">

        {/* Trip Header */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold text-gray-800">{trip?.name}</h2>
          <p className="text-gray-400 text-sm mt-1">{trip?.start_date} → {trip?.end_date} · {trip?.trip_length_days} days · {members.length} members</p>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-white rounded-2xl shadow p-6">
          <button onClick={() => setShowCosts(!showCosts)} className="w-full flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Cost Breakdown</h3>
            <span className="text-gray-400 text-sm">{showCosts ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {showCosts && (
            <div>
              <div className="space-y-3">
                {costs.map((cost, i) => (
                  <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-gray-700">{cost.label}</p>
                      <p className="text-xs text-gray-400">{cost.split_type}</p>
                    </div>
                    <p className="font-semibold text-gray-800">${cost.amount}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between">
                <p className="font-bold text-gray-700">Per Person</p>
                <p className="font-bold text-blue-600 text-lg">${perPerson.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Payment Schedule */}
        <div className="bg-white rounded-2xl shadow p-6">
          <button onClick={() => setShowSchedule(!showSchedule)} className="w-full flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Payment Schedule</h3>
            <span className="text-gray-400 text-sm">{showSchedule ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {showSchedule && (
            <div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {["Weekly", "Fortnightly", "Monthly"].map(s => (
                  <button
                    key={s}
                    onClick={() => setSchedule(s)}
                    className={`border-2 rounded-xl py-3 text-sm font-semibold transition ${schedule === s
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-gray-500 text-sm">{schedule} payment</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">${getPaymentAmount()}</p>
                <p className="text-gray-400 text-sm mt-1">per person · {getPaymentCount()} payments</p>
              </div>
            </div>
          )}
        </div>

        {/* Payment Tracker */}
        <div className="bg-white rounded-2xl shadow p-6">
          <button onClick={() => setShowPayments(!showPayments)} className="w-full flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Payment Tracker</h3>
            <span className="text-gray-400 text-sm">{showPayments ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {showPayments && (
            <div>
              {currentUser.isAdmin ? (
                <div className="space-y-3 mb-6">
                  {members.map((member, i) => {
                    const paid = payments.filter(p => p.user_id === member.user_id).reduce((sum, p) => sum + p.amount, 0)
                    const remaining = perPerson - paid
                    const percent = Math.min((paid / perPerson) * 100, 100).toFixed(0)
                    return (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm font-medium text-gray-700">{member.profiles?.name}</p>
                          <p className="text-sm text-gray-500">${paid.toFixed(2)} of ${perPerson.toFixed(2)}</p>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${percent}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {remaining <= 0 ? 'Fully paid!' : `$${remaining.toFixed(2)} remaining`}
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium text-gray-700">Your payments</p>
                      <p className="text-sm text-gray-500">
                        ${payments.filter(p => p.user_id === currentUser.id).reduce((sum, p) => sum + p.amount, 0).toFixed(2)} of ${perPerson.toFixed(2)}
                      </p>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((payments.filter(p => p.user_id === currentUser.id).reduce((sum, p) => sum + p.amount, 0) / perPerson) * 100, 100).toFixed(0)}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-sm text-gray-500">Group progress</p>
                    <p className="text-lg font-bold text-blue-600">
                      {members.filter(member => {
                        const paid = payments.filter(p => p.user_id === member.user_id).reduce((sum, p) => sum + p.amount, 0)
                        return paid >= perPerson
                      }).length} of {members.length} fully paid
                    </p>
                  </div>
                </div>
              )}
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {currentUser.isAdmin ? 'Log a payment on behalf of a member' : 'Log your payment'}
                </p>
                <div className="flex gap-2">
                  {currentUser.isAdmin && (
                    <select
                      value={selectedMember}
                      onChange={e => setSelectedMember(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" disabled>Select member</option>
                      {members.map((member, i) => (
                        <option key={i} value={member.user_id}>{member.profiles?.name}</option>
                      ))}
                    </select>
                  )}
                  <input
                    type="number"
                    placeholder="Amount $"
                    value={newPayment}
                    onChange={e => setNewPayment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addPayment()}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addPayment}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    Log
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-2xl shadow p-6">
          <button onClick={() => setShowHistory(!showHistory)} className="w-full flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Payment History</h3>
            <span className="text-gray-400 text-sm">{showHistory ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {showHistory && (
            <div className="space-y-3">
              {payments.length === 0 ? (
                <p className="text-gray-400 text-sm text-center">No payments yet.</p>
              ) : (
                [...payments]
                  .filter(p => currentUser.isAdmin ? true : p.user_id === currentUser.id)
                  .reverse()
                  .map((payment, i) => (
                    <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{payment.profiles?.name}</p>
                        <p className="text-xs text-gray-400">{new Date(payment.created_at).toLocaleString()}</p>
                      </div>
                      <p className="text-sm font-bold text-green-600">+${payment.amount.toFixed(2)}</p>
                    </div>
                  ))
              )}
              <div className="pt-2 flex justify-between items-center">
                <p className="text-sm font-semibold text-gray-700">Total collected</p>
                <p className="text-sm font-bold text-blue-600">
                  ${payments
                    .filter(p => currentUser.isAdmin ? true : p.user_id === currentUser.id)
                    .reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Members */}
        <div className="bg-white rounded-2xl shadow p-6">
          <button onClick={() => setShowMembers(!showMembers)} className="w-full flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Members</h3>
            <span className="text-gray-400 text-sm">{showMembers ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {showMembers && (
            <div className="space-y-2">
              {members.map((member, i) => (
                <div key={i} className="flex justify-between items-center">
                  <p className="text-gray-700">{member.profiles?.name}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${member.is_admin ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    {member.is_admin ? 'Admin' : 'Member'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trip Feed */}
        <div className="bg-white rounded-2xl shadow p-6">
          <button onClick={() => setShowFeed(!showFeed)} className="w-full flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Trip Feed</h3>
            <span className="text-gray-400 text-sm">{showFeed ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {showFeed && (
            <div>
              <div className="space-y-4 mb-6">
                {feed.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center">No posts yet. Say something!</p>
                ) : (
                  feed.map(post => (
                    <div key={post.id} className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-sm flex-shrink-0">
                        {post.profiles?.name?.[0]}
                      </div>
                      <div className="bg-gray-50 rounded-xl px-4 py-3 flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm font-semibold text-gray-700">{post.profiles?.name}</p>
                          <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleString()}</p>
                        </div>
                        <p className="text-sm text-gray-600">{post.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Leave a comment..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addComment()}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addComment}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                >
                  Post
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}