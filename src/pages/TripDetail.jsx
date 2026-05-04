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
  const [showSchedule, setShowSchedule] = useState(false)
  const [showPayments, setShowPayments] = useState(true)
  const [showHistory, setShowHistory] = useState(true)
  const [showMembers, setShowMembers] = useState(true)
  const [showFeed, setShowFeed] = useState(true)
  const [reactions, setReactions] = useState([])
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')

  const [activeFeedTab, setActiveFeedTab] = useState('feed')
  const [votes, setVotes] = useState([])
  const [voteOptions, setVoteOptions] = useState([])
  const [voteResponses, setVoteResponses] = useState([])
  const [showNewVote, setShowNewVote] = useState(false)
  const [newVoteQuestion, setNewVoteQuestion] = useState('')
  const [newVoteEndDate, setNewVoteEndDate] = useState('')
  const [newVoteOptions, setNewVoteOptions] = useState(['', ''])

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
      await loadVotes()
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

  const addReply = async (parentId) => {
    if (!replyText.trim()) return
    setReplyText('')
    setReplyingTo(null)
    await supabase.from('feed_posts').insert({
      trip_id: id,
      user_id: currentUser.id,
      message: replyText,
      parent_id: parentId
    })
    const { data: refreshedFeed } = await supabase
      .from('feed_posts')
      .select('*, profiles(name)')
      .eq('trip_id', id)
      .order('created_at', { ascending: true })
    setFeed(refreshedFeed || [])
  }

  const addComment = async () => {
    if (!newComment.trim()) return
    setNewComment('')
    await supabase.from('feed_posts').insert({ trip_id: id, user_id: currentUser.id, message: newComment })
    const { data: refreshedFeed } = await supabase.from('feed_posts').select('*, profiles(name)').eq('trip_id', id).order('created_at', { ascending: true })
    setFeed(refreshedFeed || [])
  }

  const addVoteOption = () => setNewVoteOptions([...newVoteOptions, ''])

  const updateVoteOption = (index, value) => {
    const updated = newVoteOptions.map((o, i) => i === index ? value : o)
    setNewVoteOptions(updated)
  }

  const removeVoteOption = (index) => {
    setNewVoteOptions(newVoteOptions.filter((_, i) => i !== index))
  }

  const submitVote = async () => {
    if (!newVoteQuestion.trim()) return
    const validOptions = newVoteOptions.filter(o => o.trim() !== '')
    if (validOptions.length < 2) {
      alert('Please add at least 2 options.')
      return
    }

    const { data: vote } = await supabase
      .from('votes')
      .insert({
        trip_id: id,
        created_by: currentUser.id,
        question: newVoteQuestion,
        end_date: newVoteEndDate || null
      })
      .select()
      .single()

    await supabase.from('vote_options').insert(
      validOptions.map(label => ({ vote_id: vote.id, label }))
    )

    setNewVoteQuestion('')
    setNewVoteEndDate('')
    setNewVoteOptions(['', ''])
    setShowNewVote(false)
    loadVotes()
  }

  const castVote = async (voteId, optionId) => {
    const existing = voteResponses.find(r => r.vote_id === voteId && r.user_id === currentUser.id)

    if (existing) {
      if (existing.option_id === optionId) return
      await supabase.from('vote_responses').update({ option_id: optionId }).eq('id', existing.id)
    } else {
      await supabase.from('vote_responses').insert({
        vote_id: voteId,
        option_id: optionId,
        user_id: currentUser.id
      })
    }
    loadVotes()
  }

  const toggleVote = async (voteId, currentState) => {
    await supabase.from('votes').update({ closed: !currentState }).eq('id', voteId)
    loadVotes()
  }

  const loadVotes = async () => {
    const { data: votesData } = await supabase
      .from('votes')
      .select('*')
      .eq('trip_id', id)
      .order('created_at', { ascending: false })
    setVotes(votesData || [])

    const { data: optionsData } = await supabase
      .from('vote_options')
      .select('*')
      .in('vote_id', votesData?.map(v => v.id) || [])
    setVoteOptions(optionsData || [])

    const { data: responsesData } = await supabase
      .from('vote_responses')
      .select('*')
      .in('vote_id', votesData?.map(v => v.id) || [])
    setVoteResponses(responsesData || [])
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

  const getDynamicSchedule = () => {
  if (!trip || costs.length === 0) return []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const paymentDates = []
  const count = getPaymentCount()
  for (let i = 1; i <= count; i++) {
    const date = new Date(today)
    if (schedule === 'Weekly') date.setDate(date.getDate() + i * 7)
    if (schedule === 'Fortnightly') date.setDate(date.getDate() + i * 14)
    if (schedule === 'Monthly') date.setMonth(date.getMonth() + i)
    paymentDates.push(date)
  }

  const costsWithTotals = costs.map(c => {
    const amount = parseFloat(c.amount) || 0
    let total = 0
    if (c.split_type === 'group') total = amount / members.length
    if (c.split_type === 'per person') total = amount
    if (c.split_type === 'per person per day') total = amount * (trip?.trip_length_days || 1)
    if (c.split_type === 'group per day') total = (amount * (trip?.trip_length_days || 1)) / members.length
    return { ...c, perPersonTotal: total }
  })

  const minCumulative = paymentDates.map(payDate => {
    return costsWithTotals.reduce((sum, c) => {
      if (c.due_date && new Date(c.due_date + 'T00:00:00') <= payDate) {
        return sum + c.perPersonTotal
      }
      return sum
    }, 0)
  })

  const payments = []
  let cumulative = 0

  for (let i = 0; i < paymentDates.length; i++) {
    const paymentsLeft = paymentDates.length - i

    // Find the most demanding rate across ALL future deadlines
    let requiredRate = (perPerson - cumulative) / paymentsLeft

    for (let j = i; j < paymentDates.length; j++) {
      if (minCumulative[j] > 0) {
        const needed = minCumulative[j] - cumulative
        const steps = j - i + 1
        const rate = needed / steps
        if (rate > requiredRate) requiredRate = rate
      }
    }

    const amount = Math.round(Math.max(0, requiredRate) * 100) / 100

    const dueItems = costsWithTotals.filter(c => {
      if (!c.due_date) return false
      const due = new Date(c.due_date + 'T00:00:00')
      const prev = i > 0 ? paymentDates[i - 1] : today
      return due > prev && due <= paymentDates[i]
    })

    payments.push({
      date: paymentDates[i],
      amount,
      cumulative: cumulative + amount,
      dueItems
    })
    cumulative += amount
  }

  return payments
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
              {(() => {
                // Group costs by due date
                const grouped = costs.reduce((groups, cost) => {
                  const key = cost.due_date || 'No date set'
                  if (!groups[key]) groups[key] = []
                  groups[key].push(cost)
                  return groups
                }, {})

                // Sort groups by date
                const sortedKeys = Object.keys(grouped).sort((a, b) => {
                  if (a === 'No date set') return 1
                  if (b === 'No date set') return -1
                  return new Date(a) - new Date(b)
                })

                return sortedKeys.map(date => {
                  const groupCosts = grouped[date]
                  const groupTotal = groupCosts.reduce((sum, c) => {
                    const amount = parseFloat(c.amount) || 0
                    if (c.split_type === 'group') return sum + amount
                    if (c.split_type === 'per person') return sum + amount * members.length
                    if (c.split_type === 'per person per day') return sum + amount * members.length * (trip?.trip_length_days || 1)
                    if (c.split_type === 'group per day') return sum + amount * (trip?.trip_length_days || 1)
                    return sum + amount
                  }, 0)
                  const groupPerPerson = members.length > 0 ? groupTotal / members.length : 0
                  const summary = groupCosts.map(c => c.label).join(' & ')

                  return (
                    <div key={date} className="mb-4 last:mb-0">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#ab9f9d' }}>
                            {date === 'No date set' ? 'No date set' : `Due ${new Date(date + 'T00:00:00').toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: '#ab9f9d' }}>{summary}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs" style={{ color: '#ab9f9d' }}>Per person</p>
                          <p className="font-bold" style={{ color: '#3c4f76' }}>${groupPerPerson.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-2">
                        {groupCosts.map((cost, i) => (
                          <div key={i} className="flex justify-between items-center pl-3 py-1.5 rounded-lg" style={{ backgroundColor: '#f5f4fb' }}>
                            <div>
                              <p className="text-sm font-medium" style={{ color: '#383f51' }}>{cost.label}</p>
                              <p className="text-xs" style={{ color: '#ab9f9d' }}>{cost.split_type}</p>
                            </div>
                            <p className="text-sm font-semibold" style={{ color: '#383f51' }}>${cost.amount}</p>
                          </div>
                        ))}
                      </div>

                      <div className="border-t pt-2" style={{ borderColor: '#dddbf1' }} />
                    </div>
                  )
                })
              })()}

              <div className="mt-2 pt-2 flex justify-between items-center">
                <p className="font-bold" style={{ color: '#383f51' }}>Total per person</p>
                <p className="font-bold text-lg" style={{ color: '#3c4f76' }}>${perPerson.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Payment Schedule */}
        <div className={sectionCard} style={sectionBorder}>
          {!showSchedule ? (
            <button
              onClick={() => setShowSchedule(true)}
              className="text-sm font-medium transition hover:opacity-70"
              style={{ color: '#3c4f76' }}
            >
              Calculate a payment schedule
            </button>
          ) : (
            <div>
              <button onClick={() => setShowSchedule(false)} className={toggleBtn}>
                <h3 className="text-lg font-semibold" style={{ color: '#383f51' }}>Payment Schedule</h3>
                <span className="text-sm" style={{ color: '#ab9f9d' }}>▲ Hide</span>
              </button>

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

              <div className="space-y-2">
                {getDynamicSchedule().map((payment, i) => (
                  <div
                    key={i}
                    className="rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: payment.dueItems.length > 0 ? '#dddbf1' : '#f5f4fb',
                      border: payment.dueItems.length > 0 ? '1px solid #3c4f76' : '1px solid #dddbf1'
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#383f51' }}>
                          {payment.date.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        {payment.dueItems.length > 0 && (
                          <p className="text-xs mt-0.5" style={{ color: '#3c4f76' }}>
                            Covers: {payment.dueItems.map(d => d.label).join(' & ')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold" style={{ color: '#3c4f76' }}>${payment.amount.toFixed(2)}</p>
                        <p className="text-xs" style={{ color: '#ab9f9d' }}>${payment.cumulative.toFixed(2)} total</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t flex justify-between" style={{ borderColor: '#dddbf1' }}>
                <p className="text-sm font-semibold" style={{ color: '#383f51' }}>Total per person</p>
                <p className="text-sm font-bold" style={{ color: '#3c4f76' }}>${perPerson.toFixed(2)}</p>
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
        {/* Trip Feed */}
        <div className={sectionCard} style={sectionBorder}>
          <button onClick={() => setShowFeed(!showFeed)} className={toggleBtn}>
            <h3 className="text-lg font-semibold" style={{ color: '#383f51' }}>Trip Feed</h3>
            <span className="text-sm" style={{ color: '#ab9f9d' }}>{showFeed ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {showFeed && (
            <div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveFeedTab('feed')}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition"
                  style={activeFeedTab === 'feed'
                    ? { backgroundColor: '#3c4f76', color: 'white' }
                    : { backgroundColor: '#f5f4fb', color: '#ab9f9d' }
                  }
                >
                  Feed
                </button>
                <button
                  onClick={() => setActiveFeedTab('votes')}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition relative"
                  style={activeFeedTab === 'votes'
                    ? { backgroundColor: '#3c4f76', color: 'white' }
                    : { backgroundColor: '#f5f4fb', color: '#ab9f9d' }
                  }
                >
                  Polls
                  {votes.some(v => !v.closed && !voteResponses.find(r => r.vote_id === v.id && r.user_id === currentUser.id)) && (
                    <span
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: '#c0624e' }}
                    />
                  )}
                </button>
              </div>

              {/* Feed Tab */}
              {activeFeedTab === 'feed' && (
                <div>
                  <div className="space-y-4 mb-6">
                    {feed.length === 0 ? (
                      <p className="text-sm text-center" style={{ color: '#ab9f9d' }}>No posts yet. Say something!</p>
                    ) : (
                      feed
                        .filter(post => !post.parent_id)
                        .map(post => {
                          const postReactions = reactions.filter(r => r.post_id === post.id)
                          const hasReacted = postReactions.some(r => r.user_id === currentUser.id)
                          const replies = feed.filter(r => r.parent_id === post.id)

                          return (
                            <div key={post.id}>
                              <div className="flex gap-3">
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
                                  <div className="flex items-center gap-3">
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
                                          className="absolute bottom-full left-0 mb-2 px-3 py-2 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                                          style={{ backgroundColor: '#383f51', color: '#dddbf1' }}
                                        >
                                          <div className="flex flex-col gap-1">
                                            {postReactions.map((r, i) => (
                                              <span key={i} style={{ color: '#dddbf1' }}>{r.profiles?.name}</span>
                                            ))}
                                          </div>
                                          <div className="absolute top-full left-3 border-4 border-transparent" style={{ borderTopColor: '#383f51' }} />
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                                      className="text-xs transition hover:opacity-70"
                                      style={{ color: '#ab9f9d' }}
                                    >
                                      {replyingTo === post.id ? 'Cancel' : 'Reply'}
                                    </button>
                                  </div>
                                  {replyingTo === post.id && (
                                    <div className="flex gap-2 mt-3">
                                      <input
                                        type="text"
                                        placeholder="Write a reply..."
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addReply(post.id)}
                                        className="flex-1 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                                        style={{ border: '1px solid #dddbf1', color: '#383f51' }}
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => addReply(post.id)}
                                        className="text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-90"
                                        style={{ backgroundColor: '#3c4f76' }}
                                      >
                                        Send
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {replies.length > 0 && (
                                <div className="ml-12 mt-2 space-y-2">
                                  {replies.map(reply => (
                                    <div key={reply.id} className="flex gap-3">
                                      <div
                                        className="w-7 h-7 rounded-full font-bold flex items-center justify-center text-xs flex-shrink-0"
                                        style={{ backgroundColor: '#dddbf1', color: '#3c4f76' }}
                                      >
                                        {reply.profiles?.name?.[0]}
                                      </div>
                                      <div className="rounded-xl px-3 py-2 flex-1" style={{ backgroundColor: '#f5f4fb', border: '1px solid #dddbf1' }}>
                                        <div className="flex justify-between items-center mb-1">
                                          <p className="text-xs font-semibold" style={{ color: '#383f51' }}>{reply.profiles?.name}</p>
                                          <p className="text-xs" style={{ color: '#ab9f9d' }}>{new Date(reply.created_at).toLocaleString()}</p>
                                        </div>
                                        <p className="text-sm" style={{ color: '#383f51' }}>{reply.message}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
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

              {/* Votes Tab */}
              {activeFeedTab === 'votes' && (
                <div className="space-y-4">

                  {currentUser.isAdmin && (
                    <div>
                      {!showNewVote ? (
                        <button
                          onClick={() => setShowNewVote(true)}
                          className="text-sm font-medium transition hover:opacity-70"
                          style={{ color: '#3c4f76' }}
                        >
                          + Create Poll
                        </button>
                      ) : (
                        <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#f5f4fb', border: '1px solid #dddbf1' }}>
                          <p className="text-sm font-semibold" style={{ color: '#383f51' }}>New Poll</p>

                          <input
                            type="text"
                            placeholder="Question e.g. Which hotel should we book?"
                            value={newVoteQuestion}
                            onChange={e => setNewVoteQuestion(e.target.value)}
                            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                            style={{ border: '1px solid #dddbf1', color: '#383f51' }}
                          />

                          <div>
                            <label className="block text-xs mb-1" style={{ color: '#ab9f9d' }}>End Date (optional, cannot be after trip start)</label>
                            <input
                              type="date"
                              value={newVoteEndDate}
                              max={trip?.start_date}
                              onChange={e => setNewVoteEndDate(e.target.value)}
                              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                              style={{ border: '1px solid #dddbf1', color: '#383f51' }}
                            />
                          </div>

                          <div className="space-y-2">
                            {newVoteOptions.map((option, i) => (
                              <div key={i} className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  placeholder={`Option ${i + 1}`}
                                  value={option}
                                  onChange={e => updateVoteOption(i, e.target.value)}
                                  className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none"
                                  style={{ border: '1px solid #dddbf1', color: '#383f51' }}
                                />
                                {newVoteOptions.length > 2 && (
                                  <button
                                    onClick={() => removeVoteOption(i)}
                                    className="text-lg font-bold transition hover:opacity-70"
                                    style={{ color: '#ab9f9d' }}
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              onClick={addVoteOption}
                              className="text-xs transition hover:opacity-70"
                              style={{ color: '#3c4f76' }}
                            >
                              + Add Option
                            </button>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={submitVote}
                              className="text-white px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90"
                              style={{ backgroundColor: '#3c4f76' }}
                            >
                              Post Vote
                            </button>
                            <button
                              onClick={() => setShowNewVote(false)}
                              className="px-4 py-2 rounded-lg text-sm transition hover:opacity-70"
                              style={{ color: '#ab9f9d' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {votes.length === 0 ? (
                    <p className="text-sm text-center" style={{ color: '#ab9f9d' }}>No polls yet.</p>
                  ) : (
                    votes.map(vote => {
                      const options = voteOptions.filter(o => o.vote_id === vote.id)
                      const responses = voteResponses.filter(r => r.vote_id === vote.id)
                      const userResponse = responses.find(r => r.user_id === currentUser.id)
                      const totalVotes = responses.length

                      return (
                        <div key={vote.id} className="rounded-xl p-4" style={{ backgroundColor: '#f5f4fb', border: '1px solid #dddbf1' }}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-sm font-semibold" style={{ color: '#383f51' }}>{vote.question}</p>
                              {vote.end_date && (
                                <p className="text-xs mt-0.5" style={{ color: '#ab9f9d' }}>Closes {vote.end_date}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs px-2 py-1 rounded-full"
                                style={vote.closed
                                  ? { backgroundColor: '#f5f0ec', color: '#ab9f9d' }
                                  : { backgroundColor: '#dddbf1', color: '#3c4f76' }
                                }
                              >
                                {vote.closed ? 'Closed' : 'Open'}
                              </span>
                              {currentUser.isAdmin && (
                                <button
                                  onClick={() => toggleVote(vote.id, vote.closed)}
                                  className="text-xs transition hover:opacity-70"
                                  style={{ color: '#ab9f9d' }}
                                >
                                  {vote.closed ? 'Reopen' : 'Close'}
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            {options.map(option => {
                              const optionVotes = responses.filter(r => r.option_id === option.id).length
                              const percent = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0
                              const isSelected = userResponse?.option_id === option.id

                              return (
                                <div key={option.id}>
                                  <button
                                    onClick={() => !vote.closed && castVote(vote.id, option.id)}
                                    className="w-full text-left rounded-lg px-3 py-2 text-sm transition"
                                    style={{
                                      border: isSelected ? '2px solid #3c4f76' : '1px solid #dddbf1',
                                      backgroundColor: isSelected ? '#dddbf1' : 'white',
                                      color: '#383f51',
                                      cursor: vote.closed ? 'default' : 'pointer'
                                    }}
                                  >
                                    {option.label}
                                  </button>
                                  {(userResponse || vote.closed) && (
                                    <div className="mt-1 px-1">
                                      <div className="w-full rounded-full h-1.5" style={{ backgroundColor: '#dddbf1' }}>
                                        <div
                                          className="h-1.5 rounded-full transition-all"
                                          style={{ width: `${percent}%`, backgroundColor: '#3c4f76' }}
                                        />
                                      </div>
                                      <p className="text-xs mt-0.5" style={{ color: '#ab9f9d' }}>{percent}% · {optionVotes} vote{optionVotes !== 1 ? 's' : ''}</p>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                          <p className="text-xs mt-3" style={{ color: '#ab9f9d' }}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''} total</p>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  )
}