import { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { getHealth } from '../api/api';

/**
 * Sticky navigation bar with brand, nav links, and live MemoryDB health indicator.
 * Polls GET /api/health every 30 seconds.
 */
export default function Navbar() {
  const [health, setHealth] = useState(null); // null = loading

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const data = await getHealth();
        if (!cancelled) setHealth(data.status === 'UP' ? 'up' : 'down');
      } catch {
        if (!cancelled) setHealth('down');
      }
    }

    check();
    const interval = setInterval(check, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">CraveDash</Link>

      <div className="navbar-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/orders"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          Orders
        </NavLink>
        <NavLink
          to="/leaderboard"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          Leaderboard
        </NavLink>
      </div>

      <div className="health-indicator">
        {health === null ? (
          <span style={{ color: 'var(--text-muted)' }}>Checking…</span>
        ) : (
          <>
            <span className={`health-dot ${health}`} />
            <span style={{ color: health === 'up' ? 'var(--green)' : 'var(--red)' }}>
              {health === 'up' ? 'MemoryDB connected' : 'MemoryDB unreachable'}
            </span>
          </>
        )}
      </div>
    </nav>
  );
}
