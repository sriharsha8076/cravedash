import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStats, getOrders, getLeaderboard } from '../api/api';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
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

  const delivered = stats ? stats.totalOrders - stats.activeOrders : null;

  return (
    <main className="page">
      <h1>Dashboard</h1>
      <p className="page-subtitle">Real-time order management · Amazon MemoryDB (Redis)</p>

      {error && <p className="msg-error" style={{ marginBottom: 24 }}>{error}</p>}

      {/* ── Stat cards ── */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="label">Total Orders</div>
          <div className="value">{loading ? '—' : (stats?.totalOrders ?? '—')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="label">Active Orders</div>
          <div className="value">{loading ? '—' : (stats?.activeOrders ?? '—')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="label">Delivered</div>
          <div className="value">{loading ? '—' : (delivered ?? '—')}</div>
        </div>
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
