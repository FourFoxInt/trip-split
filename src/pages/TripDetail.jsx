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
  const [reactions, setReactions] = useState([])

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session.user.id

      const { data: tripData } = await supabase.from('trips').select('*').eq('id', id).single()
      setTrip(tripData)

      const { data: costsData } = await supabase.from('trip_costs').select('*').eq('trip_id', id)
      setCosts(costsData || [])

      const { data: membersData } = await supabase.from('trip_members').select('*, profiles(name, email)').eq('trip_id', id)
      setMembers(membersData || [])

      const isAdmin = membersData?.find(m => m.user_id === userId)?.is_admin || false
      setCurrentUser({ id: userId, isAdmin })

      const { data: paymentsData } = await supabase.from('payments').select('*, profiles(name)').eq('trip_id', id)
      setPayments(paymentsData || [])

      const { data: feedData } = await supabase.from('feed_posts').select('*, profiles(name)').eq('trip_id', id).order('created_at', { ascending: true })
      setFeed(feedData || [])

      const { data: reactionsData } = await supabase
        .from('post_reactions')
        .select('*, profiles(name)')
        .in('post_id', feedData?.map(p => p.id) || [])
      setReactions(reactionsData || [])

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

  const getPaymentCount = () => {
    const weeks = trip?.weeks_until || 1
    if (schedule === 'Weekly') return Math.max(1, weeks)
    if (schedule === 'Fortnightly') return Math.max(1, Math.floor(weeks / 2))
    if (schedule === 'Monthly') return Math.max(1, Math.floor(weeks / 4))
  }

  const getPaymentAmount = () => (perPerson / getPaymentCount()).toFixed(2)

  const addComment = async () => {
    if (!newComment.trim()) return
    setNewComment('')
    await supabase.from('feed_posts').insert({ trip_id: id, user_id: currentUser.id, message: newComment })
    const { data: refreshedFeed } = await supabase.from('feed_posts').select('*, profiles(name)').eq('trip_id', id).order('created_at', { ascending: true })
    setFeed(refreshedFeed || [])
  }

  const addPayment = async () => {
    if (!newPayment || isNaN(newPayment)) return
    const targetUserId = currentUser.isAdmin && selectedMember ? selectedMember : currentUser.id
    setNewPayment('')
    setSelectedMember('')
    await supabase.from('payments').insert({ trip_id: id, user_id: targetUserId, amount: parseFloat(newPayment) })
    const { data: refreshedPayments } = await supabase.from('payments').select('*, profiles(name)').eq('trip_id', id)
    setPayments(refreshedPayments || [])
  }

  const sectionCard = "bg-white rounded-2xl shadow-sm p-6"
  const sectionBorder = { border: '1px solid #dddbf1' }
  const toggleBtn = "w-full flex justify-between items-center mb-4"

  const toggleReaction = async (postId) => {
    const existing = reactions.find(r => r.post_id === postId && r.user_id === currentUser.id)

    if (existing) {
      await supabase.from('post_reactions').delete().eq('id', existing.id)
      setReactions(reactions.filter(r => r.id !== existing.id))
    } else {
      const { data } = await supabase
        .from('post_reactions')
        .insert({ post_id: postId, user_id: currentUser.id })
        .select()
        .single()
      setReactions([...reactions, data])
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f4fb' }}>
      <p style={{ color: '#ab9f9d' }}>Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f4fb' }}>

      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center" style={{ borderColor: '#dddbf1' }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm font-medium transition hover:opacity-70"
          style={{ color: '#3c4f76' }}
        >
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold" style={{ color: '#383f51' }}>Splitventure</h1>
      </nav>

      <div className="max-w-2xl mx-auto p-6 space-y-6">

        {/* Trip Header */}
        <div className={sectionCard} style={sectionBorder}>
          <h2 className="text-2xl font-bold mb-1" style={{ color: '#383f51' }}>{trip?.name}</h2>
          <p className="text-sm" style={{ color: '#ab9f9d' }}>
            {trip?.start_date} → {trip?.end_date} · {trip?.trip_length_days} days · {members.length} members
          </p>
        </div>

        {/* Cost Breakdown */}
        <div className={sectionCard} style={sectionBorder}>
          <button onClick={() => setShowCosts(!showCosts)} className={toggleBtn}>
            <h3 className="text-lg font-semibold" style={{ color: '#383f51' }}>Cost Breakdown</h3>
            <span className="text-sm" style={{ color: '#ab9f9d' }}>{showCosts ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {showCosts && (
            <div>
              <div className="space-y-3">
                {costs.map((cost, i) => (
                  <div key={i} className="flex justify-between items-center pb-2 border-b last:border-0" style={{ borderColor: '#dddbf1' }}>
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#383f51' }}>{cost.label}</p>
                      <p className="text-xs" style={{ color: '#ab9f9d' }}>{cost.split_type}</p>
                    </div>
                    <p className="font-semibold text-sm" style={{ color: '#383f51' }}>${cost.amount}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 flex justify-between items-center border-t" style={{ borderColor: '#dddbf1' }}>
                <p className="font-bold" style={{ color: '#383f51' }}>Per Person</p>
                <p className="font-bold text-lg" style={{ color: '#3c4f76' }}>${perPerson.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Payment Schedule */}
        <div className={sectionCard} style={sectionBorder}>
          <button onClick={() => setShowSchedule(!showSchedule)} className={toggleBtn}>
            <h3 className="text-lg font-semibold" style={{ color: '#383f51' }}>Payment Schedule</h3>
            <span className="text-sm" style={{ color: '#ab9f9d' }}>{showSchedule ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {showSchedule && (
            <div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {["Weekly", "Fortnightly", "Monthly"].map(s => (
                  <button
                    key={s}
                    onClick={() => setSchedule(s)}
                    className="rounded-xl py-3 text-sm font-semibold transition border-2"
                    style={schedule === s
                      ? { backgroundColor: '#3c4f76', color: 'white', borderColor: '#3c4f76' }
                      : { backgroundColor: 'white', color: '#3c4f76', borderColor: '#dddbf1' }
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#f5f4fb' }}>
                <p className="text-sm" style={{ color: '#ab9f9d' }}>{schedule} payment</p>
                <p className="text-3xl font-bold mt-1" style={{ color: '#3c4f76' }}>${getPaymentAmount()}</p>
                <p className="text-sm mt-1" style={{ color: '#ab9f9d' }}>per person · {getPaymentCount()} payments</p>
              </div>
            </div>
          )}
        </div>

        {/* Payment Tracker */}
        <div className={sectionCard} style={sectionBorder}>
          <button onClick={() => setShowPayments(!showPayments)} className={toggleBtn}>
            <h3 className="text-lg font-semibold" style={{ color: '#383f51' }}>Payment Tracker</h3>
            <span className="text-sm" style={{ color: '#ab9f9d' }}>{showPayments ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {showPayments && (
            <div>
              {currentUser.isAdmin ? (
                <div className="space-y-4 mb-6">
                  {members.map((member, i) => {
                    const paid = payments.filter(p => p.user_id === member.user_id).reduce((sum, p) => sum + p.amount, 0)
                    const remaining = perPerson - paid
                    const percent = Math.min((paid / perPerson) * 100, 100).toFixed(0)
                    return (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm font-medium" style={{ color: '#383f51' }}>{member.profiles?.name}</p>
                          <p className="text-sm" style={{ color: '#ab9f9d' }}>${paid.toFixed(2)} of ${perPerson.toFixed(2)}</p>
                        </div>
                        <div className="w-full rounded-full h-2" style={{ backgroundColor: '#dddbf1' }}>
                          <div className="h-2 rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: '#3c4f76' }} />
                        </div>
                        <p className="text-xs mt-1" style={{ color: remaining <= 0 ? '#5a8a6a' : '#ab9f9d' }}>
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
                      <p className="text-sm font-medium" style={{ color: '#383f51' }}>Your payments</p>
                      <p className="text-sm" style={{ color: '#ab9f9d' }}>
                        ${payments.filter(p => p.user_id === currentUser.id).reduce((sum, p) => sum + p.amount, 0).toFixed(2)} of ${perPerson.toFixed(2)}
                      </p>
                    </div>
                    <div className="w-full rounded-full h-2" style={{ backgroundColor: '#dddbf1' }}>
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min((payments.filter(p => p.user_id === currentUser.id).reduce((sum, p) => sum + p.amount, 0) / perPerson) * 100, 100).toFixed(0)}%`,
                          backgroundColor: '#3c4f76'
                        }}
                      />
                    </div>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ backgroundColor: '#f5f4fb' }}>
                    <p className="text-sm" style={{ color: '#ab9f9d' }}>Group progress</p>
                    <p className="text-lg font-bold" style={{ color: '#3c4f76' }}>
                      {members.filter(member => {
                        const paid = payments.filter(p => p.user_id === member.user_id).reduce((sum, p) => sum + p.amount, 0)
                        return paid >= perPerson
                      }).length} of {members.length} fully paid
                    </p>
                  </div>
                </div>
              )}
              <div className="border-t pt-4" style={{ borderColor: '#dddbf1' }}>
                <p className="text-sm font-medium mb-2" style={{ color: '#383f51' }}>
                  {currentUser.isAdmin ? 'Log a payment on behalf of a member' : 'Log your payment'}
                </p>
                <div className="flex gap-2">
                  {currentUser.isAdmin && (
                    <select
                      value={selectedMember}
                      onChange={e => setSelectedMember(e.target.value)}
                      className="rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ border: '1px solid #dddbf1', color: '#383f51' }}
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
                    className="flex-1 rounded-lg px-4 py-2 text-sm focus:outline-none"
                    style={{ border: '1px solid #dddbf1', color: '#383f51' }}
                  />
                  <button
                    onClick={addPayment}
                    className="text-white px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90"
                    style={{ backgroundColor: '#3c4f76' }}
                  >
                    Log
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className={sectionCard} style={sectionBorder}>
          <button onClick={() => setShowHistory(!showHistory)} className={toggleBtn}>
            <h3 className="text-lg font-semibold" style={{ color: '#383f51' }}>Payment History</h3>
            <span className="text-sm" style={{ color: '#ab9f9d' }}>{showHistory ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {showHistory && (
            <div className="space-y-3">
              {payments.length === 0 ? (
                <p className="text-sm text-center" style={{ color: '#ab9f9d' }}>No payments yet.</p>
              ) : (
                [...payments]
                  .filter(p => currentUser.isAdmin ? true : p.user_id === currentUser.id)
                  .reverse()
                  .map((payment, i) => (
                    <div key={i} className="flex justify-between items-center pb-2 border-b last:border-0" style={{ borderColor: '#dddbf1' }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#383f51' }}>{payment.profiles?.name}</p>
                        <p className="text-xs" style={{ color: '#ab9f9d' }}>{new Date(payment.created_at).toLocaleString()}</p>
                      </div>
                      <p className="text-sm font-bold" style={{ color: '#5a8a6a' }}>+${payment.amount.toFixed(2)}</p>
                    </div>
                  ))
              )}
              <div className="pt-2 flex justify-between items-center">
                <p className="text-sm font-semibold" style={{ color: '#383f51' }}>Total collected</p>
                <p className="text-sm font-bold" style={{ color: '#3c4f76' }}>
                  ${payments.filter(p => currentUser.isAdmin ? true : p.user_id === currentUser.id).reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Members */}
        <div className={sectionCard} style={sectionBorder}>
          <button onClick={() => setShowMembers(!showMembers)} className={toggleBtn}>
            <h3 className="text-lg font-semibold" style={{ color: '#383f51' }}>Members</h3>
            <span className="text-sm" style={{ color: '#ab9f9d' }}>{showMembers ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {showMembers && (
            <div className="space-y-2">
              {members.map((member, i) => (
                <div key={i} className="flex justify-between items-center">
                  <p className="text-sm" style={{ color: '#383f51' }}>{member.profiles?.name}</p>
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={member.is_admin
                      ? { backgroundColor: '#dddbf1', color: '#3c4f76' }
                      : { backgroundColor: '#f5f0ec', color: '#ab9f9d' }
                    }
                  >
                    {member.is_admin ? 'Organiser' : 'Member'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trip Feed */}
        <div className={sectionCard} style={sectionBorder}>
          <button onClick={() => setShowFeed(!showFeed)} className={toggleBtn}>
            <h3 className="text-lg font-semibold" style={{ color: '#383f51' }}>Trip Feed</h3>
            <span className="text-sm" style={{ color: '#ab9f9d' }}>{showFeed ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {showFeed && (
            <div>
              <div className="space-y-4 mb-6">
                {feed.length === 0 ? (
                  <p className="text-sm text-center" style={{ color: '#ab9f9d' }}>No posts yet. Say something!</p>
                ) : (
                  feed.map(post => {
                    const postReactions = reactions.filter(r => r.post_id === post.id)
                    const hasReacted = postReactions.some(r => r.user_id === currentUser.id)

                    return (
                      <div key={post.id} className="flex gap-3">
                        <div
                          className="w-9 h-9 rounded-full font-bold flex items-center justify-center text-sm flex-shrink-0"
                          style={{ backgroundColor: '#dddbf1', color: '#3c4f76' }}
                        >
                          {post.profiles?.name?.[0]}
                        </div>
                        <div className="rounded-xl px-4 py-3 flex-1" style={{ backgroundColor: '#f5f4fb' }}>
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-sm font-semibold" style={{ color: '#383f51' }}>{post.profiles?.name}</p>
                            <p className="text-xs" style={{ color: '#ab9f9d' }}>{new Date(post.created_at).toLocaleString()}</p>
                          </div>
                          <p className="text-sm mb-2" style={{ color: '#383f51' }}>{post.message}</p>
                          <div className="relative group inline-block">
                            <button
                              onClick={() => toggleReaction(post.id)}
                              className="flex items-center gap-1 transition hover:opacity-70"
                              style={{ color: hasReacted ? '#c0624e' : '#ab9f9d' }}
                            >
                              <span className="text-xl">{hasReacted ? '♥' : '♡'}</span>
                              {postReactions.length > 0 && <span className="text-xs">{postReactions.length}</span>}
                            </button>

                            {postReactions.length > 0 && (
                              <div
                                className="absolute bottom-full left-0 mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                                style={{ backgroundColor: '#383f51', color: '#dddbf1' }}
                              >
                                <div className="flex flex-col gap-1">
                                  {postReactions.map((r, i) => (
                                    <span key={i} style={{ color: '#dddbf1' }}>{r.profiles?.name}</span>
                                  ))}
                                </div>
                                <div
                                  className="absolute top-full left-3 border-4 border-transparent"
                                  style={{ borderTopColor: '#383f51' }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Leave a comment..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addComment()}
                  className="flex-1 rounded-lg px-4 py-2 text-sm focus:outline-none"
                  style={{ border: '1px solid #dddbf1', color: '#383f51' }}
                />
                <button
                  onClick={addComment}
                  className="text-white px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90"
                  style={{ backgroundColor: '#3c4f76' }}
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