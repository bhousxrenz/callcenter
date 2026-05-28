import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const NAV_LINKS = [
  { path: '/',           label: 'Home'       },
  { path: '/simulation', label: 'Simulation' },
  { path: '/results',    label: 'Results'    },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="9" stroke="var(--accent-blue)" strokeWidth="1.5"/>
              <circle cx="11" cy="11" r="4" stroke="var(--accent-teal)" strokeWidth="1.5"/>
              <circle cx="11" cy="11" r="1.5" fill="var(--accent-teal)"/>
              <line x1="11" y1="2" x2="11" y2="6" stroke="var(--accent-blue)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="11" y1="16" x2="11" y2="20" stroke="var(--accent-blue)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="2" y1="11" x2="6" y2="11" stroke="var(--accent-blue)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="16" y1="11" x2="20" y2="11" stroke="var(--accent-blue)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="brand-name">CallSim</span>
        </Link>

        <ul className="navbar-links">
          {NAV_LINKS.map(({ path, label }) => (
            <li key={path}>
              <Link
                to={path}
                className={`nav-link ${pathname === path ? 'active' : ''}`}
              >
                {label}
                {pathname === path && <span className="nav-dot" />}
              </Link>
            </li>
          ))}
        </ul>

        <div className="navbar-tag">
          <span className="badge badge-teal">DES Engine</span>
        </div>
      </div>
    </nav>
  );
}
