import { useNavigate } from 'react-router-dom'
import { useTheme } from '../ThemeContext'

export default function Landing() {
  const navigate = useNavigate()
  const { theme, mode, toggle } = useTheme()

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: theme.bg }}>

      {/* Nav */}
      <nav className="flex justify-between items-center px-8 py-0 md:py-5 border-b" style={{ borderColor: theme.border, backgroundColor: theme.card }}>

        {/* Desktop logo */}
        <img
          src="/logo-long.png"
          alt="Splitventure"
          className="h-10 hidden md:block"
        />
        {/* Mobile logo */}
        <img
          src="/logo-icon.png"
          alt="Splitventure"
          className="h-20 block md:hidden"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium px-4 py-2 rounded-lg transition hover:opacity-70"
            style={{ color: theme.heading }}
          >
            Log In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="text-sm font-semibold px-4 py-2 rounded-lg transition hover:opacity-90 text-white"
            style={{ backgroundColor: theme.accent }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}

      <section className="max-w-4xl mx-auto px-8 pt-12 pb-24 text-center">
        <img src={mode === 'dark' ? '/logo-full-dark.png' : '/logo-full.png'} alt="Splitventure" className="w-128 max-w-full h-auto mx-auto mb-8" />
        <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: theme.muted }}>
          Group travel, simplified
        </p>
        <h2 className="text-6xl font-bold leading-tight mb-6" style={{ color: theme.heading }}>
          Plan trips together.<br />Split costs fairly.
        </h2>
        <p className="text-xl mb-10 max-w-xl mx-auto" style={{ color: theme.muted }}>
          <span className="font-bold" style={{ color: theme.muted }}>SPLIT</span>
          <span style={{ color: theme.muted }}>VENTURE</span>
          {' '}takes the stress out of group travel budgeting. Everyone stays informed, payments stay on track, and friendships stay intact.
        </p>
        <button
          onClick={() => navigate('/signup')}
          className="text-white font-semibold px-8 py-4 rounded-xl text-lg transition hover:opacity-90"
          style={{ backgroundColor: theme.accent }}
        >
          Start planning for free
        </button>
      </section>

      {/* Features */}
      <section className="py-20" style={{ backgroundColor: theme.subtle }}>
        <div className="max-w-4xl mx-auto px-8">
          <h3 className="text-3xl font-bold text-center mb-12" style={{ color: theme.heading }}>
            Everything your group needs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Smart cost splitting', desc: 'Add costs per person, per day, or shared across the group. Splitventure does all the math automatically.' },
              { title: 'Payment plans', desc: 'Weekly, fortnightly, or monthly payment schedules so no one has to pay everything at once.' },
              { title: 'Live tracking', desc: 'See who has paid and how much at a glance. Admins get full visibility, members see their own progress.' },
              { title: 'Trip feed', desc: 'A shared social feed for your group to post updates, excitement, and comments leading up to the trip.' },
              { title: 'Multi-trip support', desc: 'Managing a concert trip and a holiday at the same time? Keep them completely separate.' },
              { title: 'Works on any device', desc: 'Splitventure is a web app that works on any phone, tablet, or computer. No app store needed.' },
            ].map((feature, i) => (
              <div key={i} className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                <h4 className="font-bold text-lg mb-2" style={{ color: theme.heading }}>{feature.title}</h4>
                <p className="text-sm leading-relaxed" style={{ color: theme.muted }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-8 py-20">
        <h3 className="text-3xl font-bold text-center mb-12" style={{ color: theme.heading }}>
          How it works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { step: '01', title: 'Create a trip', desc: 'Set your dates, add your costs, and invite your group.' },
            { step: '02', title: 'Choose a payment plan', desc: 'Pick weekly, fortnightly, or monthly and see exactly what each person owes.' },
            { step: '03', title: 'Track and go', desc: 'Everyone logs their payments as they go. No spreadsheets, no awkward chasing.' },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-5xl font-bold mb-4" style={{ color: theme.border }}>{item.step}</p>
              <h4 className="font-bold text-lg mb-2" style={{ color: theme.heading }}>{item.title}</h4>
              <p className="text-sm leading-relaxed" style={{ color: theme.muted }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center" style={{ backgroundColor: theme.heading }}>
        <h3 className="text-4xl font-bold mb-4" style={{ color: theme.bg }}>Ready to plan your next trip?</h3>
        <p className="mb-8 text-lg" style={{ color: theme.muted }}>Free to use. No credit card required.</p>
        <button
          onClick={() => navigate('/signup')}
          className="font-semibold px-8 py-4 rounded-xl text-lg transition hover:opacity-90"
          style={{ backgroundColor: theme.subtle, color: theme.heading }}
        >
          Create your first trip
        </button>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 text-center text-sm border-t" style={{ color: theme.muted, borderColor: theme.border, backgroundColor: theme.card }}>
        © 2026 Splitventure. Built with care for group adventurers everywhere.
      </footer>

    </div>
  )
}