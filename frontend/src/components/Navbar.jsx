import { useEffect, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { getHealth } from '../api/api';
import { useAuth } from '../context/AuthContext';

/**
 * Sticky navigation bar.
 * - Shows role-aware navigation links
 * - Live MemoryDB health indicator (polls every 30s)
 * - Role badge + logout
 */
export default function Navbar() {
  const { auth, logout }    = useAuth();
  const navigate            = useNavigate();
  const [health, setHealth] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const role = auth?.role;

  // Role-specific nav links
  const navLinks = {
    customer: [
      { to: '/menu',         label: '🍽️ Menu' },
      { to: '/leaderboard',  label: '🏆 Leaderboard' },
      { to: '/memorydb',     label: '🧠 MemoryDB' },
    ],
    restaurant: [
      { to: '/partner',      label: '📋 My Orders' },
      { to: '/memorydb',     label: '🧠 MemoryDB' },
    ],
    admin: [
      { to: '/',             label: '📊 Dashboard',    end: true },
      { to: '/orders',       label: '📦 Orders' },
      { to: '/analytics',    label: '📈 Analytics' },
      { to: '/leaderboard',  label: '🏆 Leaderboard' },
      { to: '/memorydb',     label: '🧠 MemoryDB' },
    ],
  };

  const links = navLinks[role] || [];

  const ROLE_COLORS = {
    customer:   'var(--blue)',
    restaurant: 'var(--green)',
    admin:      'var(--orange)',
  };

  const ROLE_EMOJIS = {
    customer:   '🛍️',
    restaurant: '👨‍🍳',
    admin:      '🛡️',
  };

  return (
    <nav className="navbar">
      <Link to={role === 'customer' ? '/menu' : role === 'restaurant' ? '/partner' : '/'} className="navbar-brand">
        CraveDash
      </Link>

      {/* Nav links */}
      <div className="navbar-nav">
        {links.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </div>

      {/* Right side */}
      <div className="navbar-right">
        {/* Health */}
        <div className="health-indicator">
          {health === null ? (
            <span style={{ color: 'var(--text-muted)' }}>Checking…</span>
          ) : (
            <>
              <span className={`health-dot ${health}`} />
              <span style={{ color: health === 'up' ? 'var(--green)' : 'var(--red)' }}>
                {health === 'up' ? 'MemoryDB ✓' : 'MemoryDB ✗'}
              </span>
            </>
          )}
        </div>

        {/* Role badge + user */}
        {auth && (
          <div className="navbar-user" style={{ '--role-color': ROLE_COLORS[role] }}>
            <span className="navbar-user-emoji">{ROLE_EMOJIS[role]}</span>
            <span className="navbar-user-name">{auth.name}</span>
            <button
              id="logout-btn"
              className="navbar-logout"
              onClick={handleLogout}
              title="Logout"
            >
              ⏏
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
