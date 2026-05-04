import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Nav */}
      <nav className="flex justify-between items-center px-8 py-5 border-b border-gray-100">
        <h1 className="text-2xl font-bold" style={{ color: '#383f51' }}>Splitventure</h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium px-4 py-2 rounded-lg transition hover:bg-gray-100"
            style={{ color: '#383f51' }}
          >
            Log In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="text-sm font-semibold px-4 py-2 rounded-lg transition text-white"
            style={{ backgroundColor: '#3c4f76' }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 py-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#ab9f9d' }}>
          Group travel, simplified
        </p>
        <h2 className="text-6xl font-bold leading-tight mb-6" style={{ color: '#383f51' }}>
          Plan trips together.<br />Split costs fairly.
        </h2>
        <p className="text-xl mb-10 max-w-xl mx-auto" style={{ color: '#ab9f9d' }}>
          Splitventure takes the stress out of group travel budgeting. Everyone stays informed, payments stay on track, and friendships stay intact.
        </p>
        <button
          onClick={() => navigate('/signup')}
          className="text-white font-semibold px-8 py-4 rounded-xl text-lg transition hover:opacity-90"
          style={{ backgroundColor: '#3c4f76' }}
        >
          Start planning for free
        </button>
      </section>

      {/* Features */}
      <section style={{ backgroundColor: '#dddbf1' }} className="py-20">
        <div className="max-w-4xl mx-auto px-8">
          <h3 className="text-3xl font-bold text-center mb-12" style={{ color: '#383f51' }}>
            Everything your group needs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Smart cost splitting',
                desc: 'Add costs per person, per day, or shared across the group. Splitventure does all the math automatically.'
              },
              {
                title: 'Payment plans',
                desc: 'Weekly, fortnightly, or monthly payment schedules so no one has to pay everything at once.'
              },
              {
                title: 'Live tracking',
                desc: 'See who has paid and how much at a glance. Admins get full visibility, members see their own progress.'
              },
              {
                title: 'Trip feed',
                desc: 'A shared social feed for your group to post updates, excitement, and comments leading up to the trip.'
              },
              {
                title: 'Multi-trip support',
                desc: 'Managing a concert trip and a holiday at the same time? Keep them completely separate.'
              },
              {
                title: 'Works on any device',
                desc: 'Splitventure is a web app that works on any phone, tablet, or computer. No app store needed.'
              },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                <h4 className="font-bold text-lg mb-2" style={{ color: '#383f51' }}>{feature.title}</h4>
                <p className="text-sm leading-relaxed" style={{ color: '#ab9f9d' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-8 py-20">
        <h3 className="text-3xl font-bold text-center mb-12" style={{ color: '#383f51' }}>
          How it works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { step: '01', title: 'Create a trip', desc: 'Set your dates, add your costs, and invite your group.' },
            { step: '02', title: 'Choose a payment plan', desc: 'Pick weekly, fortnightly, or monthly and see exactly what each person owes.' },
            { step: '03', title: 'Track and go', desc: 'Everyone logs their payments as they go. No spreadsheets, no awkward chasing.' },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-5xl font-bold mb-4" style={{ color: '#dddbf1' }}>{item.step}</p>
              <h4 className="font-bold text-lg mb-2" style={{ color: '#383f51' }}>{item.title}</h4>
              <p className="text-sm leading-relaxed" style={{ color: '#ab9f9d' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ backgroundColor: '#383f51' }} className="py-20 text-center">
        <h3 className="text-4xl font-bold text-white mb-4">Ready to plan your next trip?</h3>
        <p className="mb-8 text-lg" style={{ color: '#ab9f9d' }}>Free to use. No credit card required.</p>
        <button
          onClick={() => navigate('/signup')}
          className="font-semibold px-8 py-4 rounded-xl text-lg transition hover:opacity-90"
          style={{ backgroundColor: '#dddbf1', color: '#383f51' }}
        >
          Create your first trip
        </button>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 text-center text-sm border-t border-gray-100" style={{ color: '#ab9f9d' }}>
        © 2026 Splitventure. Built with care for group adventurers everywhere.
      </footer>

    </div>
  )
}