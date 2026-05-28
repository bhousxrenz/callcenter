import './MetricCard.css';

export default function MetricCard({ label, value, unit, sub, accent = 'blue', icon }) {
  return (
    <div className={`metric-card accent-${accent}`}>
      {icon && <div className="metric-icon">{icon}</div>}
      <div className="metric-value">
        {value}
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
      <div className="metric-label">{label}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}
