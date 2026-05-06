import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../ThemeContext'

const getRelativeDate = (weeksFromNow) => {
    const date = new Date()
    date.setDate(date.getDate() + weeksFromNow * 7)
    return date.toISOString().split('T')[0]
}

const demoTrip = {
    name: "Taylor Swift Concert",
    start_date: getRelativeDate(14),
    end_date: getRelativeDate(14.4),
    trip_length_days: 3,
    weeks_until: 14,
    days_until: 98,
    location: "Auckland, New Zealand",
    hotel_address: "123 Queen Street, Auckland CBD",
    members: ["Alice", "Beth", "Carol", "Dana", "Eve"],
    costs: [
        { label: "Concert Tickets", amount: 250, split_type: "per person", due_date: getRelativeDate(3) },
        { label: "Petrol", amount: 600, split_type: "group", due_date: getRelativeDate(10) },
        { label: "Accommodation", amount: 470, split_type: "per person", due_date: getRelativeDate(10) },
        { label: "Food", amount: 80, split_type: "per person per day", due_date: getRelativeDate(14) },
    ],
    payments: [
        { author: "Alice", amount: 250, timestamp: "2025-09-10 10:00" },
        { author: "Beth", amount: 250, timestamp: "2025-09-11 14:30" },
        { author: "Carol", amount: 120, timestamp: "2025-09-12 09:15" },
    ],
    feed: [
        { id: 1, author: "Alice", message: "So excited for this trip!", timestamp: "2025-09-01 10:23" },
        { id: 2, author: "Beth", message: "Me too! I just made my first payment", timestamp: "2025-09-01 11:45" },
        { id: 3, author: "Carol", message: "Has everyone sorted accommodation?", timestamp: "2025-09-02 09:12" },
    ]
}

export default function DemoTrip() {
    const navigate = useNavigate()
    const { theme } = useTheme()
    const [activeTab, setActiveTab] = useState('home')
    const [showSchedule, setShowSchedule] = useState(false)
    const [schedule, setSchedule] = useState('Weekly')

    const numMembers = demoTrip.members.length
    const tripLengthDays = demoTrip.trip_length_days

    const totalCost = demoTrip.costs.reduce((sum, c) => {
        const amount = parseFloat(c.amount) || 0
        if (c.split_type === 'group') return sum + amount
        if (c.split_type === 'per person') return sum + amount * numMembers
        if (c.split_type === 'per person per day') return sum + amount * numMembers * tripLengthDays
        if (c.split_type === 'group per day') return sum + amount * tripLengthDays
        return sum + amount
    }, 0)

    const perPerson = totalCost / numMembers

    const sectionCard = "rounded-2xl shadow-sm p-6 mb-4"

    const tabs = [
        { id: 'home', label: 'Home' },
        { id: 'costs', label: 'Costs' },
        { id: 'social', label: 'Social' },
        { id: 'polls', label: 'Polls' },
    ]

    const getDynamicSchedule = () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const paymentDates = []
        const count = schedule === 'Weekly' ? demoTrip.weeks_until : schedule === 'Fortnightly' ? Math.floor(demoTrip.weeks_until / 2) : Math.floor(demoTrip.weeks_until / 4)
        for (let i = 1; i <= count; i++) {
            const date = new Date(today)
            if (schedule === 'Weekly') date.setDate(date.getDate() + i * 7)
            if (schedule === 'Fortnightly') date.setDate(date.getDate() + i * 14)
            if (schedule === 'Monthly') date.setMonth(date.getMonth() + i)
            paymentDates.push(date)
        }
        const costsWithTotals = demoTrip.costs.map(c => {
            const amount = parseFloat(c.amount) || 0
            let total = 0
            if (c.split_type === 'group') total = amount / numMembers
            if (c.split_type === 'per person') total = amount
            if (c.split_type === 'per person per day') total = amount * tripLengthDays
            if (c.split_type === 'group per day') total = (amount * tripLengthDays) / numMembers
            return { ...c, perPersonTotal: total }
        })
        const minCumulative = paymentDates.map(payDate =>
            costsWithTotals.reduce((sum, c) => {
                if (c.due_date && new Date(c.due_date + 'T00:00:00') <= payDate) return sum + c.perPersonTotal
                return sum
            }, 0)
        )
        const schedulePayments = []
        let cumulative = 0
        for (let i = 0; i < paymentDates.length; i++) {
            const paymentsLeft = paymentDates.length - i
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
            schedulePayments.push({ date: paymentDates[i], amount, cumulative: cumulative + amount, dueItems })
            cumulative += amount
        }
        return schedulePayments
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: theme.bg }}>

            <nav className="border-b px-6 py-4 flex justify-between items-center" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                <button onClick={() => navigate('/dashboard')} className="text-sm font-medium transition hover:opacity-70" style={{ color: theme.accent }}>
                    Back
                </button>
                <h1 className="text-lg font-bold" style={{ color: theme.heading }}>{demoTrip.name}</h1>
                <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: theme.subtle, color: theme.muted }}>
                    Demo
                </span>
            </nav>

            {/* Demo Banner */}
            <div className="px-4 py-3 text-center text-sm font-medium" style={{ backgroundColor: theme.accent, color: 'white' }}>
                This is an example trip to show you how Splitventure works. Create your own trip to get started!
            </div>

            {/* Tabs */}
            <div className="border-b sticky top-0 z-10" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                <div className="max-w-2xl mx-auto flex">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="flex-1 py-3 text-sm font-semibold transition"
                            style={activeTab === tab.id
                                ? { color: theme.accent, borderBottom: `2px solid ${theme.accent}` }
                                : { color: theme.muted }
                            }
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4">

                {/* HOME TAB */}
                {activeTab === 'home' && (
                    <div>
                        <div className={sectionCard} style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <p style={{ color: theme.muted }}>Dates</p>
                                    <p className="font-medium" style={{ color: theme.heading }}>{demoTrip.start_date} → {demoTrip.end_date}</p>
                                </div>
                                <div className="flex justify-between">
                                    <p style={{ color: theme.muted }}>Duration</p>
                                    <p className="font-medium" style={{ color: theme.heading }}>{demoTrip.trip_length_days} days</p>
                                </div>
                                <div className="flex justify-between">
                                    <p style={{ color: theme.muted }}>Members</p>
                                    <p className="font-medium" style={{ color: theme.heading }}>{demoTrip.members.length} people</p>
                                </div>
                                <div className="flex justify-between">
                                    <p style={{ color: theme.muted }}>Total per person</p>
                                    <p className="font-bold" style={{ color: theme.accent }}>${perPerson.toFixed(2)}</p>
                                </div>
                                <div className="flex justify-between">
                                    <p style={{ color: theme.muted }}>Time until trip</p>
                                    <p className="font-medium" style={{ color: theme.heading }}>{demoTrip.weeks_until} weeks ({demoTrip.days_until} days)</p>
                                </div>
                            </div>
                        </div>

                        <div className={sectionCard} style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                            <h3 className="text-lg font-semibold mb-4" style={{ color: theme.heading }}>Trip Details</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <p style={{ color: theme.muted }}>Location</p>
                                    <p className="font-medium" style={{ color: theme.heading }}>{demoTrip.location}</p>
                                </div>
                                <div className="flex justify-between">
                                    <p style={{ color: theme.muted }}>Accommodation</p>
                                    <p className="font-medium" style={{ color: theme.heading }}>{demoTrip.hotel_address}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* COSTS TAB */}
                {activeTab === 'costs' && (
                    <div>
                        <div className={sectionCard} style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                            <h3 className="text-lg font-semibold mb-4" style={{ color: theme.heading }}>Cost Breakdown</h3>
                            <div className="space-y-2 mb-4">
                                {demoTrip.costs.map((cost, i) => (
                                    <div key={i} className="flex justify-between items-center px-3 py-1.5 rounded-lg" style={{ backgroundColor: theme.subtle }}>
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: theme.heading }}>{cost.label}</p>
                                            <p className="text-xs" style={{ color: theme.muted }}>{cost.split_type}</p>
                                        </div>
                                        <p className="text-sm font-semibold" style={{ color: theme.heading }}>${cost.amount}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-2 border-t flex justify-between" style={{ borderColor: theme.border }}>
                                <p className="font-bold" style={{ color: theme.heading }}>Total per person</p>
                                <p className="font-bold text-lg" style={{ color: theme.accent }}>${perPerson.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className={sectionCard} style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                            <h3 className="text-lg font-semibold mb-4" style={{ color: theme.heading }}>Payment Tracker</h3>
                            <div className="space-y-4">
                                {demoTrip.members.map((member, i) => {
                                    const paid = demoTrip.payments.filter(p => p.author === member).reduce((sum, p) => sum + p.amount, 0)
                                    const remaining = perPerson - paid
                                    const percent = Math.min((paid / perPerson) * 100, 100).toFixed(0)
                                    return (
                                        <div key={i}>
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-sm font-medium" style={{ color: theme.heading }}>{member}</p>
                                                <p className="text-sm" style={{ color: theme.muted }}>${paid.toFixed(2)} of ${perPerson.toFixed(2)}</p>
                                            </div>
                                            <div className="w-full rounded-full h-2" style={{ backgroundColor: theme.border }}>
                                                <div className="h-2 rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: theme.accent }} />
                                            </div>
                                            <p className="text-xs mt-1" style={{ color: remaining <= 0 ? theme.success : theme.muted }}>
                                                {remaining <= 0 ? 'Fully paid!' : `$${remaining.toFixed(2)} remaining`}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className={sectionCard} style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                            {!showSchedule ? (
                                <button onClick={() => setShowSchedule(true)} className="text-sm font-medium transition hover:opacity-70" style={{ color: theme.accent }}>
                                    Calculate a payment schedule
                                </button>
                            ) : (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold" style={{ color: theme.heading }}>Payment Schedule</h3>
                                        <button onClick={() => setShowSchedule(false)} className="text-sm" style={{ color: theme.muted }}>Hide</button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                        {["Weekly", "Fortnightly", "Monthly"].map(s => (
                                            <button key={s} onClick={() => setSchedule(s)} className="rounded-xl py-3 text-sm font-semibold transition border-2"
                                                style={schedule === s ? { backgroundColor: theme.accent, color: 'white', borderColor: theme.accent } : { backgroundColor: theme.card, color: theme.accent, borderColor: theme.border }}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="space-y-2">
                                        {getDynamicSchedule().map((payment, i) => (
                                            <div key={i} className="rounded-xl px-4 py-3" style={{ backgroundColor: payment.dueItems.length > 0 ? theme.subtle : theme.bg, border: payment.dueItems.length > 0 ? `1px solid ${theme.accent}` : `1px solid ${theme.border}` }}>
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-sm font-semibold" style={{ color: theme.heading }}>{payment.date.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                        {payment.dueItems.length > 0 && <p className="text-xs mt-0.5" style={{ color: theme.accent }}>Covers: {payment.dueItems.map(d => d.label).join(' & ')}</p>}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold" style={{ color: theme.accent }}>${payment.amount.toFixed(2)}</p>
                                                        <p className="text-xs" style={{ color: theme.muted }}>${payment.cumulative.toFixed(2)} total</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-4 border-t flex justify-between" style={{ borderColor: theme.border }}>
                                        <p className="text-sm font-semibold" style={{ color: theme.heading }}>Total per person</p>
                                        <p className="text-sm font-bold" style={{ color: theme.accent }}>${perPerson.toFixed(2)}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>


                )}

                {/* SOCIAL TAB */}
                {activeTab === 'social' && (
                    <div>
                        <div className={sectionCard} style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                            <h3 className="text-lg font-semibold mb-4" style={{ color: theme.heading }}>Members</h3>
                            <div className="space-y-2">
                                {demoTrip.members.map((member, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <p className="text-sm" style={{ color: theme.heading }}>{member}</p>
                                        <span className="text-xs px-2 py-1 rounded-full" style={i === 0 ? { backgroundColor: theme.subtle, color: theme.accent } : { backgroundColor: theme.subtle, color: theme.muted }}>
                                            {i === 0 ? 'Organiser' : 'Member'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={sectionCard} style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                            <h3 className="text-lg font-semibold mb-4" style={{ color: theme.heading }}>Trip Feed</h3>
                            <div className="space-y-4">
                                {demoTrip.feed.map(post => (
                                    <div key={post.id} className="flex gap-3">
                                        <div className="w-9 h-9 rounded-full font-bold flex items-center justify-center text-sm flex-shrink-0" style={{ backgroundColor: theme.subtle, color: theme.accent }}>
                                            {post.author[0]}
                                        </div>
                                        <div className="rounded-xl px-4 py-3 flex-1" style={{ backgroundColor: theme.subtle }}>
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-sm font-semibold" style={{ color: theme.heading }}>{post.author}</p>
                                                <p className="text-xs" style={{ color: theme.muted }}>{post.timestamp}</p>
                                            </div>
                                            <p className="text-sm" style={{ color: theme.heading }}>{post.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* POLLS TAB */}
                {activeTab === 'polls' && (
                    <div className={sectionCard} style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                        <h3 className="text-lg font-semibold mb-2" style={{ color: theme.heading }}>Polls</h3>
                        <p className="text-sm" style={{ color: theme.muted }}>Organisers can create polls for the group to vote on — like which hotel to book or what day to leave.</p>
                    </div>
                )}

            </div>
        </div>
    )
}