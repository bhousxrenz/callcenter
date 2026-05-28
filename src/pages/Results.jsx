import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, ComposedChart, AreaChart, Area, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line,
} from 'recharts';
import MetricCard from '../components/MetricCard.jsx';
import './Results.css';

const COLORS = [
  { line: '#2d9cdb', fill: 'rgba(45,156,219,0.12)' },
  { line: '#00c4a7', fill: 'rgba(0,196,167,0.12)' },
  { line: '#f5a623', fill: 'rgba(245,166,35,0.12)' },
  { line: '#8b7cf7', fill: 'rgba(139,124,247,0.12)' },
  { line: '#e05c5c', fill: 'rgba(224,92,92,0.12)' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label} min</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const WaitTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label} min</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>calls: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

function getReco(s) {
  const recos = [];
  if (s.utilPct > 90)
    recos.push({ type: 'warn', text: `Agent utilization is ${s.utilPct}% — very high. Add ${Math.ceil(s.numAgents * 0.2)} more agents to ease pressure.` });
  else if (s.utilPct < 50)
    recos.push({ type: 'info', text: `Utilization is ${s.utilPct}% — agents may be idle. Consider reducing to ${Math.floor(s.numAgents * 0.8)} agents.` });
  else
    recos.push({ type: 'ok', text: `Utilization at ${s.utilPct}% is healthy. Staffing appears well-balanced.` });

  if (s.sla2Min < 70)
    recos.push({ type: 'warn', text: `Only ${s.sla2Min}% of calls answered within 2 min. Increase agents or service throughput.` });
  else if (s.sla2Min >= 90)
    recos.push({ type: 'ok', text: `SLA ${s.sla2Min}% — excellent. Over 90% of callers answered within 2 minutes.` });
  else
    recos.push({ type: 'info', text: `SLA ${s.sla2Min}% — moderate. Target ≥90% for standard call-center benchmarks.` });

  if (s.maxQueueLen > s.numAgents * 2)
    recos.push({ type: 'warn', text: `Peak queue hit ${s.maxQueueLen} callers — more than double agent count. Consider callback queuing.` });

  if (s.avgWaitMin > 3)
    recos.push({ type: 'warn', text: `Average wait of ${s.avgWaitMin} min exceeds 3 min. Consider IVR deflection or additional staffing.` });
  else if (s.avgWaitMin < 0.5)
    recos.push({ type: 'ok', text: `Average wait only ${s.avgWaitMin} min — very fast response time.` });

  return recos;
}

export default function Results() {
  const [results, setResults] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const raw = sessionStorage.getItem('simResults');
    if (raw) {
      try { setResults(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  if (!results) {
    return (
      <div className="results-page page-enter">
        <div className="container no-results">
          <div className="no-results-icon">📊</div>
          <h2 className="no-results-title">No results yet</h2>
          <p className="no-results-desc">Run a simulation first to see results here.</p>
          <Link to="/simulation" className="btn btn-primary">Go to Simulation</Link>
        </div>
      </div>
    );
  }

  const cur = results[activeIdx];
  const s   = cur.summary;
  const recos = getReco(s);

  // Downsample time series to ~150 points for smooth charts
  const step = Math.max(1, Math.floor(cur.timeSeriesData.length / 150));
  const chartData = cur.timeSeriesData.filter((_, i) => i % step === 0);

  return (
    <div className="results-page page-enter">
      <div className="container">

        {/* ── Header ── */}
        <div className="results-header">
          <div>
            <h1 className="results-title">Simulation Results</h1>
            <p className="results-sub">
              {results.length > 1
                ? `Batch run · ${results.length} scenarios`
                : `Scenario: ${cur.scenarioName}`}
            </p>
          </div>
          <div className="results-header-actions">
            <Link to="/simulation" className="btn btn-secondary btn-sm">← Back</Link>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                const data = JSON.stringify(results, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement('a');
                a.href = url; a.download = 'simulation-results.json'; a.click();
              }}
            >
              Export JSON
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                const rows = results.map(r => {
                  const s = r.summary;
                  return `${r.scenarioName},${s.totalArrivals},${s.totalServed},${s.avgWaitMin},${s.maxQueueLen},${s.utilPct},${s.sla2Min}`;
                });
                const csv = ['Scenario,Arrivals,Served,AvgWaitMin,MaxQueue,Utilization%,SLA%', ...rows].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement('a');
                a.href = url; a.download = 'simulation-summary.csv'; a.click();
              }}
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* ── Scenario tabs (for batch) ── */}
        {results.length > 1 && (
          <div className="scenario-tabs">
            {results.map((r, i) => (
              <button
                key={i}
                className={`scenario-tab ${activeIdx === i ? 'active' : ''}`}
                onClick={() => setActiveIdx(i)}
              >
                {r.scenarioName}
              </button>
            ))}
          </div>
        )}

        {/* ── Key metrics ── */}
        <div className="metrics-grid">
          <MetricCard
            label="Total Calls"
            value={s.totalArrivals.toLocaleString()}
            sub={`${s.totalServed.toLocaleString()} served`}
            accent="blue" icon="📞"
          />
          <MetricCard
            label="Avg Wait Time"
            value={s.avgWaitMin}
            unit=" min"
            sub={`SLA: ${s.sla2Min}% ≤2 min`}
            accent={s.avgWaitMin > 3 ? 'red' : s.avgWaitMin > 1.5 ? 'amber' : 'teal'}
            icon="⏱"
          />
          <MetricCard
            label="Agent Utilization"
            value={s.utilPct}
            unit="%"
            sub={`${s.numAgents} agents`}
            accent={s.utilPct > 90 ? 'red' : s.utilPct < 50 ? 'amber' : 'teal'}
            icon="👥"
          />
          <MetricCard
            label="Max Queue Length"
            value={s.maxQueueLen}
            sub={`avg ${s.avgQueueLen} callers`}
            accent={s.maxQueueLen > s.numAgents * 3 ? 'red' : 'amber'}
            icon="📋"
          />
          <MetricCard
            label="Service Level"
            value={s.sla2Min}
            unit="%"
            sub="answered ≤ 2 min"
            accent={s.sla2Min >= 90 ? 'teal' : s.sla2Min >= 70 ? 'amber' : 'red'}
            icon="🎯"
          />
          <MetricCard
            label="Traffic Intensity"
            value={s.rho}
            sub={`λ=${s.arrivalRate}, μ=${s.serviceRate}, c=${s.numAgents}`}
            accent={s.rho > 0.9 ? 'red' : s.rho > 0.75 ? 'amber' : 'blue'}
            icon="⚡"
          />
        </div>

        {/* ── Charts row ── */}
        <div className="charts-row">

          {/* Queue length over time */}
          <div className="chart-card card">
            <p className="section-title">Queue Length Over Time</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 12, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradQ" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2d9cdb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2d9cdb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} label={{ value: 'min', position: 'insideRight', fill: 'var(--text-muted)', fontSize: 10, offset: 10 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="queueLength" name="Queue Length" stroke="#2d9cdb" fill="url(#gradQ)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Utilization over time */}
          <div className="chart-card card">
            <p className="section-title">Agent Utilization Over Time</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 12, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradU" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00c4a7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00c4a7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} label={{ value: 'min', position: 'insideRight', fill: 'var(--text-muted)', fontSize: 10, offset: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="chart-tooltip">
                      <p className="tooltip-label">{label} min</p>
                      {payload.map((p, i) => (
                        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}%</strong></p>
                      ))}
                    </div>
                  );
                }} />
                <Area type="monotone" dataKey="utilization" name="Utilization" stroke="#00c4a7" fill="url(#gradU)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wait-time histogram */}
        <div className="card histogram-card">
          <p className="section-title">Wait Time Distribution</p>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={cur.waitTimeHistogram} margin={{ top: 5, right: 12, left: -10, bottom: 5 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} interval={2} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<WaitTooltip />} />
              <Bar dataKey="count" name="Calls" fill="var(--accent-purple)" opacity={0.85} radius={[3,3,0,0]} />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="chart-note">
            Histogram of individual call wait times (minutes). Showing up to 99th percentile.
          </p>
        </div>

        {/* Multi-scenario comparison (only when batch) */}
        {results.length > 1 && (
          <div className="card compare-card">
            <p className="section-title">Scenario Comparison</p>
            <div className="compare-table-wrap">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>λ</th><th>μ</th><th>Agents</th>
                    <th>ρ</th>
                    <th>Arrivals</th>
                    <th>Avg Wait</th>
                    <th>Utilization</th>
                    <th>SLA</th>
                    <th>Max Queue</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => {
                    const rs = r.summary;
                    return (
                      <tr
                        key={i}
                        className={activeIdx === i ? 'active-row' : ''}
                        onClick={() => setActiveIdx(i)}
                      >
                        <td className="scenario-cell">{r.scenarioName}</td>
                        <td>{rs.arrivalRate}</td>
                        <td>{rs.serviceRate}</td>
                        <td>{rs.numAgents}</td>
                        <td>
                          <span className={`rho-pill ${rs.rho > 0.9 ? 'red' : rs.rho > 0.75 ? 'amber' : 'ok'}`}>
                            {rs.rho}
                          </span>
                        </td>
                        <td>{rs.totalArrivals.toLocaleString()}</td>
                        <td>{rs.avgWaitMin} min</td>
                        <td>
                          <span className={`util-pill ${rs.utilPct > 90 ? 'red' : rs.utilPct < 50 ? 'amber' : 'ok'}`}>
                            {rs.utilPct}%
                          </span>
                        </td>
                        <td>
                          <span className={`sla-pill ${rs.sla2Min >= 90 ? 'ok' : rs.sla2Min >= 70 ? 'amber' : 'red'}`}>
                            {rs.sla2Min}%
                          </span>
                        </td>
                        <td>{rs.maxQueueLen}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Recommendations ── */}
        <div className="recos-card card">
          <p className="section-title">Recommendations — {cur.scenarioName}</p>
          <div className="recos-list">
            {recos.map((r, i) => (
              <div key={i} className={`reco-item reco-${r.type}`}>
                <span className="reco-icon">
                  {r.type === 'ok' ? '✓' : r.type === 'warn' ? '⚠' : 'ℹ'}
                </span>
                {r.text}
              </div>
            ))}
          </div>
        </div>

        {/* ── Raw params ── */}
        <div className="params-summary card">
          <p className="section-title">Simulation Parameters</p>
          <div className="params-row">
            {[
              ['Arrival Rate (λ)', `${s.arrivalRate} calls/hr`],
              ['Service Rate (μ)', `${s.serviceRate} calls/hr/agent`],
              ['Agents (c)',       s.numAgents],
              ['Duration',        `${s.simulationHours} hours`],
              ['Traffic ρ',       s.rho],
              ['Avg Call Duration', `${(60/s.serviceRate).toFixed(1)} min`],
            ].map(([k, v]) => (
              <div key={k} className="param-chip">
                <span className="param-k">{k}</span>
                <span className="param-v">{v}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
