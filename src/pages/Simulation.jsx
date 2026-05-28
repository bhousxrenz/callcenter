import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { runSimulation, parseCSVParams } from '../simulation/des.js';
import './Simulation.css';

const DEFAULTS = {
  arrivalRate:     120,
  serviceRate:     20,
  numAgents:       8,
  simulationHours: 8,
  seed:            42,
};

const PRESETS = [
  { label: 'Morning Peak',  arrivalRate: 150, serviceRate: 20, numAgents: 10, simulationHours: 4 },
  { label: 'Afternoon Low', arrivalRate: 60,  serviceRate: 20, numAgents: 4,  simulationHours: 4 },
  { label: 'Evening Rush',  arrivalRate: 130, serviceRate: 20, numAgents: 9,  simulationHours: 4 },
  { label: 'Understaffed',  arrivalRate: 120, serviceRate: 20, numAgents: 4,  simulationHours: 4 },
];

export default function Simulation() {
  const navigate = useNavigate();

  const [params, setParams] = useState({ ...DEFAULTS });
  const [csvScenarios, setCsvScenarios] = useState(null);  // parsed CSV rows
  const [csvFilename, setCsvFilename] = useState('');
  const [activeTab, setActiveTab] = useState('manual');    // 'manual' | 'csv'
  const [dragOver, setDragOver] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError]   = useState('');

  // ── Param change ──
  const set = (k) => (e) =>
    setParams((p) => ({ ...p, [k]: parseFloat(e.target.value) || 0 }));

  const applyPreset = (preset) => {
    setParams((p) => ({ ...p, ...preset }));
    setActiveTab('manual');
  };

  // ── CSV parsing ──
  const handleCSV = useCallback((file) => {
    if (!file) return;
    setCsvFilename(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const scenarios = parseCSVParams(data);
        if (scenarios.length === 0) {
          setError('CSV parsed but no valid rows found. Check columns: arrival_rate, service_rate, num_agents, simulation_hours');
          setCsvScenarios(null);
        } else {
          setCsvScenarios(scenarios);
          setError('');
          setActiveTab('csv');
        }
      },
      error: (err) => setError('CSV parse error: ' + err.message),
    });
  }, []);

  const onFileInput = (e) => handleCSV(e.target.files[0]);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleCSV(e.dataTransfer.files[0]);
  };

  // ── Run ──
  const handleRun = () => {
    setError('');
    setRunning(true);

    // Defer to next tick so UI updates first
    setTimeout(() => {
      try {
        let results;
        if (activeTab === 'csv' && csvScenarios?.length) {
          results = csvScenarios.map((sc) => ({
            ...runSimulation({ ...sc, seed: params.seed }),
            scenarioName: sc.scenarioName,
          }));
        } else {
          // Validate
          if (params.arrivalRate <= 0) throw new Error('Arrival rate must be > 0');
          if (params.serviceRate  <= 0) throw new Error('Service rate must be > 0');
          if (params.numAgents    <  1) throw new Error('Number of agents must be ≥ 1');
          if (params.simulationHours < 0.1) throw new Error('Simulation time must be ≥ 0.1 hours');

          const rho = params.arrivalRate / (params.numAgents * params.serviceRate);
          if (rho >= 1) {
            throw new Error(
              `Traffic intensity ρ = ${rho.toFixed(3)} ≥ 1 — queue is unstable. ` +
              `Increase agents or service rate, or decrease arrival rate.`
            );
          }

          const res = runSimulation({ ...params });
          res.scenarioName = 'Custom Scenario';
          results = [res];
        }

        sessionStorage.setItem('simResults', JSON.stringify(results));
        navigate('/results');
      } catch (err) {
        setError(err.message);
        setRunning(false);
      }
    }, 50);
  };

  const rho = params.arrivalRate / (params.numAgents * params.serviceRate);
  const rhoOk = isFinite(rho) && rho < 1 && rho > 0;

  return (
    <div className="sim-page page-enter">
      <div className="container">

        {/* ── Page header ── */}
        <div className="sim-header">
          <div>
            <h1 className="sim-title">Simulation Setup</h1>
            <p className="sim-subtitle">Configure call center parameters or upload a CSV file to batch-run scenarios.</p>
          </div>
          <a href="/sample-data.csv" download className="btn btn-secondary btn-sm">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v8M4 7l4 4 4-4M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Sample CSV
          </a>
        </div>

        <div className="sim-layout">

          {/* ── LEFT: Input panel ── */}
          <div className="sim-inputs">

            {/* Tab switcher */}
            <div className="tab-bar">
              <button
                className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
                onClick={() => setActiveTab('manual')}
              >Manual Input</button>
              <button
                className={`tab-btn ${activeTab === 'csv' ? 'active' : ''}`}
                onClick={() => setActiveTab('csv')}
              >
                CSV Upload
                {csvScenarios && (
                  <span className="tab-count">{csvScenarios.length}</span>
                )}
              </button>
            </div>

            {/* ── MANUAL TAB ── */}
            {activeTab === 'manual' && (
              <div className="tab-content">

                {/* Presets */}
                <div className="presets-section">
                  <p className="section-title" style={{ fontSize: '11px' }}>Quick Presets</p>
                  <div className="presets-grid">
                    {PRESETS.map((p) => (
                      <button key={p.label} className="preset-btn" onClick={() => applyPreset(p)}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divider" />

                {/* Parameters */}
                <div className="params-grid">
                  <div className="form-group">
                    <label className="form-label">Arrival Rate (λ)</label>
                    <input
                      type="number" min="1" max="9999" step="1"
                      className="form-input"
                      value={params.arrivalRate}
                      onChange={set('arrivalRate')}
                    />
                    <span className="form-hint">calls per hour entering the system</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Service Rate (μ)</label>
                    <input
                      type="number" min="1" max="9999" step="1"
                      className="form-input"
                      value={params.serviceRate}
                      onChange={set('serviceRate')}
                    />
                    <span className="form-hint">calls per hour each agent can handle</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Number of Agents (c)</label>
                    <input
                      type="number" min="1" max="500" step="1"
                      className="form-input"
                      value={params.numAgents}
                      onChange={set('numAgents')}
                    />
                    <span className="form-hint">parallel servers / call-takers</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Simulation Duration</label>
                    <input
                      type="number" min="0.1" max="720" step="0.5"
                      className="form-input"
                      value={params.simulationHours}
                      onChange={set('simulationHours')}
                    />
                    <span className="form-hint">simulated hours (e.g. 8 = full shift)</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Random Seed</label>
                    <input
                      type="number" min="1" step="1"
                      className="form-input"
                      value={params.seed}
                      onChange={set('seed')}
                    />
                    <span className="form-hint">fixed seed for reproducible results</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── CSV TAB ── */}
            {activeTab === 'csv' && (
              <div className="tab-content">
                <div
                  className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => document.getElementById('csv-input').click()}
                >
                  <input
                    id="csv-input" type="file" accept=".csv"
                    style={{ display: 'none' }}
                    onChange={onFileInput}
                  />
                  <div className="drop-icon">
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                      <rect width="36" height="36" rx="8" fill="var(--bg-elevated)"/>
                      <path d="M18 10v12M12 16l6-6 6 6M10 26h16" stroke="var(--accent-blue)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="drop-title">
                    {csvFilename || 'Drop your CSV file here'}
                  </p>
                  <p className="drop-hint">or click to browse — .csv only</p>
                </div>

                <div className="csv-schema card" style={{ marginTop: '16px' }}>
                  <p className="section-title" style={{ fontSize: '11px' }}>Expected CSV columns</p>
                  <table className="schema-table">
                    <thead>
                      <tr>
                        <th>Column</th><th>Type</th><th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>scenario_name</td><td>string</td><td>Label for the scenario</td></tr>
                      <tr><td>arrival_rate</td><td>number</td><td>Calls per hour (λ)</td></tr>
                      <tr><td>service_rate</td><td>number</td><td>Calls/hour per agent (μ)</td></tr>
                      <tr><td>num_agents</td><td>number</td><td>Agent count (c)</td></tr>
                      <tr><td>simulation_hours</td><td>number</td><td>Hours to simulate</td></tr>
                    </tbody>
                  </table>
                </div>

                {csvScenarios && (
                  <div className="csv-preview">
                    <p className="section-title" style={{ fontSize: '11px', marginTop: '16px' }}>
                      Loaded Scenarios ({csvScenarios.length})
                    </p>
                    {csvScenarios.map((sc, i) => (
                      <div key={i} className="scenario-row">
                        <span className="scenario-name">{sc.scenarioName}</span>
                        <span className="badge badge-blue">λ={sc.arrivalRate}</span>
                        <span className="badge badge-teal">μ={sc.serviceRate}</span>
                        <span className="badge badge-amber">c={sc.numAgents}</span>
                        <span className="scenario-hours">{sc.simulationHours}h</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT: Status + Run ── */}
          <div className="sim-sidebar">

            {/* System status card */}
            {activeTab === 'manual' && (
              <div className="card status-card">
                <p className="section-title" style={{ fontSize: '11px' }}>System Status</p>

                <div className="status-row">
                  <span className="status-label">Traffic Intensity (ρ)</span>
                  <span className={`status-value ${rhoOk ? 'ok' : 'warn'}`}>
                    {isFinite(rho) ? rho.toFixed(3) : '—'}
                  </span>
                </div>
                <div className="rho-bar-wrap">
                  <div
                    className={`rho-bar ${rho >= 1 ? 'overflow' : ''}`}
                    style={{ width: `${Math.min(rho * 100, 100)}%` }}
                  />
                  <div className="rho-limit-line" />
                </div>
                <p className="form-hint">
                  {rho >= 1
                    ? '⚠ ρ ≥ 1 — queue unstable. Increase agents or reduce load.'
                    : rho > 0.85
                      ? '⚡ High load — consider adding agents.'
                      : rhoOk ? '✓ Stable system — ready to simulate.' : '—'}
                </p>

                <div className="divider" />

                <div className="status-row">
                  <span className="status-label">Avg. call duration</span>
                  <span className="status-value">
                    {params.serviceRate > 0 ? (60 / params.serviceRate).toFixed(1) : '—'} min
                  </span>
                </div>
                <div className="status-row">
                  <span className="status-label">Avg. interarrival</span>
                  <span className="status-value">
                    {params.arrivalRate > 0 ? (60 / params.arrivalRate).toFixed(2) : '—'} min
                  </span>
                </div>
                <div className="status-row">
                  <span className="status-label">Expected calls</span>
                  <span className="status-value">
                    ≈ {Math.round(params.arrivalRate * params.simulationHours).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'csv' && csvScenarios && (
              <div className="card status-card">
                <p className="section-title" style={{ fontSize: '11px' }}>Batch Summary</p>
                <div className="status-row">
                  <span className="status-label">Scenarios loaded</span>
                  <span className="status-value ok">{csvScenarios.length}</span>
                </div>
                <div className="status-row">
                  <span className="status-label">Total sim hours</span>
                  <span className="status-value">
                    {csvScenarios.reduce((a, s) => a + s.simulationHours, 0)}h
                  </span>
                </div>
                <p className="form-hint" style={{ marginTop: '10px' }}>
                  Each scenario runs independently. Results displayed side-by-side on the Results page.
                </p>
              </div>
            )}

            {error && (
              <div className="error-box">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="var(--accent-red)" strokeWidth="1.5"/>
                  <path d="M8 5v4M8 11v.5" stroke="var(--accent-red)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <button
              className="btn btn-primary btn-lg run-btn"
              onClick={handleRun}
              disabled={running || (activeTab === 'csv' && !csvScenarios)}
            >
              {running ? (
                <>
                  <span className="spinner" />
                  Running…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <polygon points="4,2 14,8 4,14" fill="currentColor"/>
                  </svg>
                  {activeTab === 'csv' && csvScenarios
                    ? `Run ${csvScenarios.length} Scenarios`
                    : 'Run Simulation'}
                </>
              )}
            </button>

            <p className="run-hint">
              Results will open automatically on the Results page.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
