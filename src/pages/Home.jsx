import { Link } from 'react-router-dom';
import './Home.css';

const FEATURES = [
  {
    icon: '⚡',
    title: 'Discrete-Event Engine',
    desc: 'Faithfully simulates each call arrival and departure as individual events in a priority-sorted timeline, giving statistically accurate M/M/c queue dynamics.',
  },
  {
    icon: '📊',
    title: 'Real-Time Metrics',
    desc: 'Track queue length, agent utilization, average wait time, and service-level agreements — updated across the full simulated period.',
  },
  {
    icon: '📁',
    title: 'CSV Data Upload',
    desc: 'Upload your own scenario parameters as a CSV file to batch-run multiple configurations: morning peak, afternoon, evening, and more — all at once.',
  },
  {
    icon: '📈',
    title: 'Visual Analytics',
    desc: 'Interactive charts show queue depth and utilization over time, plus a wait-time distribution histogram to spot bottlenecks at a glance.',
  },
  {
    icon: '🎯',
    title: 'Staffing Recommendations',
    desc: 'Automatically surface insights about under/over-staffing and whether your SLA (answer within 2 minutes) target is being met.',
  },
  {
    icon: '🔁',
    title: 'Reproducible Results',
    desc: 'Every run uses a seeded random-number generator so results can be replicated exactly for reporting and comparison.',
  },
];

const STEPS = [
  { n: '01', label: 'Set Parameters', desc: 'Enter arrival rate, service rate, and agent count manually — or upload a CSV.' },
  { n: '02', label: 'Run Simulation', desc: 'The DES engine processes thousands of events in milliseconds.' },
  { n: '03', label: 'Analyze Results', desc: 'Review charts, metrics, and actionable staffing recommendations.' },
];

export default function Home() {
  return (
    <div className="home page-enter">

      {/* ── HERO ── */}
      <section className="hero">
        <div className="container">
          <div className="hero-eyebrow">
            <span className="badge badge-blue">Discrete-Event Simulation</span>
            <span className="badge badge-teal">M/M/c Queue Model</span>
          </div>

          <h1 className="hero-title">
            Model Queue Formation<br />
            <span className="hero-title-accent">in Call Centers</span>
          </h1>

          <p className="hero-desc">
            Simulate customer arrival patterns, agent service times, and
            queue dynamics using a mathematically rigorous DES engine.
            Evaluate system performance and discover strategies to
            reduce waiting time and maximize efficiency.
          </p>

          <div className="hero-ctas">
            <Link to="/simulation" className="btn btn-primary btn-lg">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <polygon points="4,2 14,8 4,14" fill="currentColor"/>
              </svg>
              Start Simulation
            </Link>
            <a href="/sample-data.csv" download className="btn btn-secondary btn-lg">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v8M4 7l4 4 4-4M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Sample CSV
            </a>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-val">M/M/c</span>
              <span className="hero-stat-lbl">Queue Model</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat">
              <span className="hero-stat-val">~300</span>
              <span className="hero-stat-lbl">Time Snapshots</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat">
              <span className="hero-stat-val">Poisson</span>
              <span className="hero-stat-lbl">Arrival Process</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat">
              <span className="hero-stat-val">Exp.</span>
              <span className="hero-stat-lbl">Service Times</span>
            </div>
          </div>
        </div>

        {/* decorative pulse rings */}
        <div className="hero-ring ring-1" />
        <div className="hero-ring ring-2" />
        <div className="hero-ring ring-3" />
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how-section container">
        <p className="section-title">How it works</p>
        <div className="steps-row">
          {STEPS.map((s, i) => (
            <div key={i} className="step-card">
              <span className="step-num">{s.n}</span>
              <h3 className="step-label">{s.label}</h3>
              <p className="step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features-section container">
        <p className="section-title">Features</p>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── THEORY BLOCK ── */}
      <section className="theory-section container">
        <div className="theory-card card">
          <div className="theory-left">
            <p className="section-title">The Math</p>
            <h2 className="theory-heading">M/M/c Queueing Theory</h2>
            <p className="theory-body">
              This simulator implements the classical <strong>M/M/c</strong> model where customer
              arrivals follow a <strong>Poisson process</strong> with rate <em>λ</em>, service times
              are <strong>exponentially distributed</strong> with rate <em>μ</em> per agent, and
              there are <em>c</em> parallel servers.
            </p>
            <p className="theory-body">
              The traffic intensity <em>ρ = λ / (c·μ)</em> must remain below 1 for the queue to
              remain stable. The simulator traces each discrete event (arrival, service start,
              departure) to accumulate time-averaged statistics with full temporal resolution.
            </p>
            <Link to="/simulation" className="btn btn-teal" style={{ marginTop: '16px' }}>
              Run a simulation →
            </Link>
          </div>
          <div className="theory-right">
            <div className="theory-formula">
              <div className="formula-block">
                <span className="formula-label">Traffic Intensity</span>
                <span className="formula">ρ = λ / (c · μ)</span>
              </div>
              <div className="formula-block">
                <span className="formula-label">Mean Queue Length</span>
                <span className="formula">Lq = C(c,λ/μ) · ρ / (1−ρ)</span>
              </div>
              <div className="formula-block">
                <span className="formula-label">Mean Wait Time</span>
                <span className="formula">Wq = Lq / λ</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer container">
        <p className="footer-text">
          CallSim — Discrete-Event Simulation for Call Center Queue Analysis
        </p>
      </footer>

    </div>
  );
}
