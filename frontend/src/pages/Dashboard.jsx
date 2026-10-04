import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStats, getOrders, getLeaderboard } from '../api/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

/** Mini sparkline bar (pure CSS) */
function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="stat-mini-bar-track">
      <div
        className="stat-mini-bar-fill"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

export default function Dashboard() {
  const { auth } = useAuth();
  const [stats, setStats]             = useState(null);
  const [orders, setOrders]           = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [statsData, ordersData, lbData] = await Promise.all([
          getStats(),
          getOrders(),
          getLeaderboard(5),
        ]);
        setStats(statsData);
        setOrders(ordersData.slice(0, 5));
        setLeaderboard(lbData);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data. Is the backend running?');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const delivered    = stats ? stats.totalOrders - stats.activeOrders : null;
  const deliveryRate = stats && stats.totalOrders > 0
    ? Math.round((delivered / stats.totalOrders) * 100)
    : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <main className="page">

      {/* ── Hero banner ── */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-left">
          <div className="dashboard-hero-greeting">{greeting}, {auth?.name || 'Admin'} 👋</div>
          <h1 className="dashboard-hero-title">Operations Dashboard</h1>
          <p className="dashboard-hero-sub">
            Real-time order management · powered by{' '}
            <span className="dashboard-hero-highlight">Amazon MemoryDB for Redis</span>
          </p>
        </div>
        <div className="dashboard-hero-actions">
          <Link to="/orders" id="dash-new-order" className="btn btn-primary">
            ＋ New Order
          </Link>
          <Link to="/analytics" className="btn btn-secondary">
            📈 Analytics
          </Link>
        </div>
      </div>

      {error && <p className="msg-error" style={{ marginBottom: 24 }}>{error}</p>}

      {/* ── Stat cards ── */}
      <div className="stat-grid stat-grid-4">

        <div className="stat-card stat-card-blue">
          <div className="stat-card-accent-bar" />
          <div className="stat-icon">📦</div>
          <div className="label">Total Orders</div>
          <div className="value">{loading ? '—' : (stats?.totalOrders ?? '—')}</div>
          {!loading && stats && (
            <MiniBar value={stats.totalOrders} max={Math.max(stats.totalOrders, 1)} color="var(--blue)" />
          )}
          <div className="stat-card-footer">All time</div>
        </div>

        <div className="stat-card stat-card-orange">
          <div className="stat-card-accent-bar" />
          <div className="stat-icon">🔥</div>
          <div className="label">Active Orders</div>
          <div className="value">{loading ? '—' : (stats?.activeOrders ?? '—')}</div>
          {!loading && stats && (
            <MiniBar value={stats.activeOrders} max={Math.max(stats.totalOrders, 1)} color="var(--orange)" />
          )}
          <div className="stat-card-footer">In progress</div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="stat-card-accent-bar" />
          <div className="stat-icon">✅</div>
          <div className="label">Delivered</div>
          <div className="value">{loading ? '—' : (delivered ?? '—')}</div>
          {!loading && stats && (
            <MiniBar value={delivered} max={Math.max(stats.totalOrders, 1)} color="var(--green)" />
          )}
          <div className="stat-card-footer">Completed</div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="stat-card-accent-bar" />
          <div className="stat-icon">🎯</div>
          <div className="label">Delivery Rate</div>
          <div className="value">{loading ? '—' : (deliveryRate !== null ? `${deliveryRate}%` : '—')}</div>
          {!loading && stats && (
            <MiniBar value={deliveryRate ?? 0} max={100} color="var(--purple)" />
          )}
          <div className="stat-card-footer">Success ratio</div>
        </div>

      </div>

      {/* ── Quick-action chips ── */}
      <div className="dashboard-quick-links">
        <Link to="/orders"      className="quick-chip"><span>📦</span> All Orders</Link>
        <Link to="/analytics"   className="quick-chip"><span>📈</span> Analytics</Link>
        <Link to="/leaderboard" className="quick-chip"><span>🏆</span> Leaderboard</Link>
        <Link to="/memorydb"    className="quick-chip"><span>🧠</span> MemoryDB Hub</Link>
      </div>

      {/* ── Recent orders ── */}
      <div style={{ marginBottom: 36 }}>
        <div className="section-header">
          <h2>Recent Orders</h2>
          <Link to="/orders" id="view-all-orders" className="btn btn-secondary btn-sm">
            View all →
          </Link>
        </div>
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <p className="loading" style={{ padding: '20px 24px' }}>Loading orders…</p>
          ) : orders.length === 0 ? (
            <p className="empty-state">No orders yet. Create the first one!</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Restaurant</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600, color: 'var(--orange)' }}>
                        #{o.id}
                      </td>
                      <td>{o.customer}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{o.restaurant}</td>
                      <td style={{ fontWeight: 600 }}>₹{o.amount.toLocaleString()}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td>
                        <Link
                          to={`/orders/${o.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Leaderboard preview ── */}
      <div>
        <div className="section-header">
          <h2>🏆 Top Customers</h2>
          <Link to="/leaderboard" id="view-leaderboard" className="btn btn-secondary btn-sm">
            Full leaderboard →
          </Link>
        </div>
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <p className="loading" style={{ padding: '20px 24px' }}>Loading leaderboard…</p>
          ) : leaderboard.length === 0 ? (
            <p className="empty-state">No points yet. Deliver an order to earn points.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Customer</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((e) => (
                    <tr key={e.name} className={`rank-${e.rank}`}>
                      <td style={{ fontWeight: 700, fontSize: 15 }}>
                        {e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : `#${e.rank}`}
                      </td>
                      <td style={{ fontWeight: 500 }}>{e.name}</td>
                      <td>
                        <span className="points-pill">⭐ {e.points} pts</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
