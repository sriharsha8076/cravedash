import { useEffect, useState } from 'react';
import { getAnalytics } from '../api/api';

/** Simple bar chart rendered purely in CSS/HTML — no canvas library needed */
function BarChart({ data, valueKey, labelKey, color = 'var(--orange)', prefix = '₹', height = 140 }) {
  if (!data || data.length === 0) return <p className="empty-state">No data yet.</p>;
  const max = Math.max(...data.map(d => d[valueKey]));
  return (
    <div className="bar-chart">
      {data.map((d, i) => {
        const pct = max > 0 ? (d[valueKey] / max) * 100 : 0;
        return (
          <div key={i} className="bar-col">
            <div className="bar-value">
              {prefix}{Number(d[valueKey]).toLocaleString()}
            </div>
            <div className="bar-track" style={{ height }}>
              <div
                className="bar-fill"
                style={{
                  height: `${pct}%`,
                  background: `linear-gradient(180deg, ${color}, ${color}88)`,
                  animationDelay: `${i * 60}ms`,
                }}
              />
            </div>
            <div className="bar-label">{d[labelKey]}</div>
          </div>
        );
      })}
    </div>
  );
}

/** Donut-style status breakdown */
function StatusDonut({ data }) {
  const STATUS_COLORS = {
    PLACED:           '#60a5fa',
    ACCEPTED:         '#fbbf24',
    PREPARING:        '#a78bfa',
    OUT_FOR_DELIVERY: '#ff9900',
    DELIVERED:        '#34d399',
  };

  const entries = Object.entries(data || {});
  const total   = entries.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="status-breakdown">
      {entries.map(([status, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const color = STATUS_COLORS[status] || 'var(--text-muted)';
        return (
          <div key={status} className="status-bar-row">
            <div className="status-bar-label">
              <span className="status-dot" style={{ background: color }} />
              <span>{status.replace(/_/g, ' ')}</span>
            </div>
            <div className="status-bar-track">
              <div
                className="status-bar-fill"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
            <div className="status-bar-count">
              <span style={{ color, fontWeight: 700 }}>{count}</span>
              <span className="status-bar-pct">{pct}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    getAnalytics()
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('Failed to load analytics. Is the backend running?'); setLoading(false); });
  }, []);

  const deliveryRate = data && data.totalOrders > 0
    ? Math.round(((data.totalOrders - (data.ordersByStatus?.PLACED ?? 0) - (data.ordersByStatus?.ACCEPTED ?? 0) - (data.ordersByStatus?.PREPARING ?? 0) - (data.ordersByStatus?.OUT_FOR_DELIVERY ?? 0)) / data.totalOrders) * 100)
    : null;

  return (
    <main className="page">
      {/* Hero */}
      <div className="analytics-hero">
        <div>
          <h1>📊 Analytics</h1>
          <p className="page-subtitle">Real-time insights from Amazon MemoryDB · Last 7 days</p>
        </div>
      </div>

      {error && <p className="msg-error" style={{ marginBottom: 24 }}>{error}</p>}

      {loading ? (
        <p className="loading">Loading analytics…</p>
      ) : (
        <>
          {/* KPI row */}
          <div className="stat-grid stat-grid-4 analytics-kpi-grid">
            <div className="stat-card stat-card-orange">
              <div className="stat-card-accent-bar" />
              <div className="stat-icon">💰</div>
              <div className="label">Total Revenue</div>
              <div className="value">₹{Number(data?.totalRevenue || 0).toLocaleString()}</div>
              <div className="stat-card-footer">All orders</div>
            </div>
            <div className="stat-card stat-card-blue">
              <div className="stat-card-accent-bar" />
              <div className="stat-icon">📦</div>
              <div className="label">Total Orders</div>
              <div className="value">{data?.totalOrders ?? 0}</div>
              <div className="stat-card-footer">Placed so far</div>
            </div>
            <div className="stat-card stat-card-purple">
              <div className="stat-card-accent-bar" />
              <div className="stat-icon">💳</div>
              <div className="label">Avg Order Value</div>
              <div className="value">₹{Number(data?.avgOrderValue || 0).toLocaleString()}</div>
              <div className="stat-card-footer">Per order</div>
            </div>
            <div className="stat-card stat-card-green">
              <div className="stat-card-accent-bar" />
              <div className="stat-icon">🎯</div>
              <div className="label">Delivery Rate</div>
              <div className="value">{deliveryRate !== null ? `${deliveryRate}%` : '—'}</div>
              <div className="stat-card-footer">Orders delivered</div>
            </div>
          </div>

          {/* Revenue chart */}
          <div className="card analytics-card" style={{ marginBottom: 24 }}>
            <h2>📈 Revenue — Last 7 Days</h2>
            <BarChart
              data={data?.revenueByDay || []}
              valueKey="revenue"
              labelKey="date"
              color="var(--orange)"
              prefix="₹"
              height={160}
            />
          </div>

          {/* Orders per day chart */}
          <div className="card analytics-card" style={{ marginBottom: 24 }}>
            <h2>🗓️ Orders — Last 7 Days</h2>
            <BarChart
              data={data?.revenueByDay || []}
              valueKey="orders"
              labelKey="date"
              color="var(--blue)"
              prefix=""
              height={120}
            />
          </div>

          {/* Side by side: status breakdown + top restaurants */}
          <div className="analytics-grid-2">
            <div className="card analytics-card">
              <h2>🥧 Orders by Status</h2>
              <StatusDonut data={data?.ordersByStatus} />
            </div>

            <div className="card analytics-card">
              <h2>🏆 Top Restaurants</h2>
              {(data?.topRestaurants || []).length === 0 ? (
                <p className="empty-state">No orders yet.</p>
              ) : (
                <div className="top-restaurants">
                  {(data?.topRestaurants || []).map((r, i) => (
                    <div key={r.name} className="top-rest-row">
                      <div className="top-rest-rank">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </div>
                      <div className="top-rest-info">
                        <div className="top-rest-name">{r.name}</div>
                        <div className="top-rest-meta">
                          {r.orders} order{r.orders !== 1 ? 's' : ''} · ₹{Number(r.revenue).toLocaleString()}
                        </div>
                      </div>
                      <div className="top-rest-revenue" style={{ color: 'var(--orange)' }}>
                        ₹{Number(r.revenue).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
