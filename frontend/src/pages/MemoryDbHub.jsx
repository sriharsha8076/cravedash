import { useState, useEffect, useCallback } from 'react';
import { getMemoryDbInspect, getMemoryDbBenchmark, getMemoryDbInfo } from '../api/api';

const SECTION_META = {
  counter:          { color: '#f59e0b', icon: '🔢', label: 'Atomic Counter (STRING)'   },
  ordersAll:        { color: '#60a5fa', icon: '📊', label: 'Orders Index (SORTED SET)'  },
  ordersActive:     { color: '#34d399', icon: '🟢', label: 'Active Orders Pool (SET)'   },
  leaderboard:      { color: '#a78bfa', icon: '🏆', label: 'Loyalty Points (SORTED SET)' },
  latestOrderHash:  { color: '#ff9900', icon: '📋', label: 'Latest Order (HASH)'         },
  hashTagInfo:      { color: '#f472b6', icon: '🔗', label: 'Cluster Hash-Tag Info'        },
};

function Tag({ color, children }) {
  return (
    <span style={{
      background: color + '22',
      color,
      border: `1px solid ${color}44`,
      borderRadius: 6,
      padding: '2px 8px',
      fontSize: 11,
      fontWeight: 700,
      fontFamily: 'monospace',
      letterSpacing: 0.5,
    }}>
      {children}
    </span>
  );
}

function KeyCard({ sectionKey, data }) {
  const meta = SECTION_META[sectionKey];
  if (!data || !meta) return null;

  return (
    <div className="memdb-key-card">
      <div className="memdb-key-card-header">
        <span className="memdb-key-card-icon">{meta.icon}</span>
        <div>
          <div className="memdb-key-card-label">{meta.label}</div>
          <code className="memdb-key-card-key">{data.key}</code>
        </div>
        <Tag color={meta.color}>{data.type}</Tag>
      </div>
      <p className="memdb-key-card-desc">{data.desc}</p>

      {/* Render section-specific content */}
      {sectionKey === 'counter' && (
        <div className="memdb-counter-display">
          <span style={{ color: meta.color, fontSize: 32, fontWeight: 800, fontFamily: 'monospace' }}>
            {data.value}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>current value</span>
        </div>
      )}

      {sectionKey === 'ordersAll' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
            <div className="memdb-stat-chip" style={{ background: '#60a5fa22', color: '#60a5fa' }}>
              Total Orders: <strong>{data.totalCount}</strong>
            </div>
          </div>
          {data.latest10?.length > 0 && (
            <div className="memdb-table-wrap">
              <table className="memdb-table">
                <thead><tr><th>Order ID</th><th>Score (epoch-ms)</th></tr></thead>
                <tbody>
                  {data.latest10.slice(0, 5).map(r => (
                    <tr key={r.id}>
                      <td><code style={{ color: '#ff9900' }}>#{r.id}</code></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{r.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {sectionKey === 'ordersActive' && (
        <div>
          <div className="memdb-stat-chip" style={{ background: '#34d39922', color: '#34d399', marginBottom: 10 }}>
            SCARD result: <strong>{data.count}</strong> active orders
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.ids.length === 0
              ? <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No active orders</span>
              : data.ids.map(id => (
                  <Tag key={id} color="#34d399">#{id}</Tag>
                ))
            }
          </div>
        </div>
      )}

      {sectionKey === 'leaderboard' && (
        <div className="memdb-table-wrap">
          {data.top10?.length === 0
            ? <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No entries yet — place and deliver orders to earn points!</p>
            : (
              <table className="memdb-table">
                <thead><tr><th>Rank</th><th>Customer</th><th>Points (ZINCRBY)</th></tr></thead>
                <tbody>
                  {data.top10.map(e => (
                    <tr key={e.rank}>
                      <td style={{ color: '#fbbf24', fontWeight: 700 }}>
                        {e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : `#${e.rank}`}
                      </td>
                      <td>{e.customer}</td>
                      <td style={{ color: '#a78bfa', fontWeight: 700 }}>{e.points} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      )}

      {sectionKey === 'latestOrderHash' && (
        <div className="memdb-table-wrap">
          {Object.keys(data.fields).length === 0
            ? <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No orders placed yet.</p>
            : (
              <table className="memdb-table">
                <thead><tr><th>Field (HSET key)</th><th>Value</th></tr></thead>
                <tbody>
                  {Object.entries(data.fields).map(([k, v]) => (
                    <tr key={k}>
                      <td><code style={{ color: '#ff9900' }}>{k}</code></td>
                      <td style={{ wordBreak: 'break-all' }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      )}

      {sectionKey === 'hashTagInfo' && (
        <div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <div className="memdb-stat-chip" style={{ background: '#f472b622', color: '#f472b6' }}>
              Hash Tag: <strong style={{ fontFamily: 'monospace' }}>{data.hashTag}</strong>
            </div>
            <div className="memdb-stat-chip" style={{ background: '#f472b622', color: '#f472b6' }}>
              Cluster Slot: <strong>{data.slot}</strong>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 10 }}>{data.reason}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.commands?.map(cmd => <Tag key={cmd} color="#f472b6">{cmd}</Tag>)}
          </div>
        </div>
      )}
    </div>
  );
}

function BenchmarkPanel() {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setResult(null);
    try {
      const data = await getMemoryDbBenchmark();
      setResult(data);
    } catch {
      setResult({ error: 'Benchmark failed — is the backend running?' });
    } finally {
      setLoading(false);
    }
  }

  function gauge(val, max = 5) {
    const pct = Math.min((val / max) * 100, 100);
    const color = val < 1 ? '#34d399' : val < 3 ? '#fbbf24' : '#f87171';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 999 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.8s ease' }} />
        </div>
        <span style={{ fontWeight: 700, color, fontFamily: 'monospace', fontSize: 15, minWidth: 60 }}>{val} ms</span>
      </div>
    );
  }

  return (
    <div className="memdb-bench-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>⚡ Live Latency Benchmark</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Runs 50 real READ + WRITE operations against Redis and measures response time</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={run}
          disabled={loading}
          style={{ padding: '8px 18px', fontSize: 13, flexShrink: 0 }}
        >
          {loading ? '⏳ Running…' : '▶ Run Benchmark'}
        </button>
      </div>

      {result && !result.error && (
        <div className="memdb-bench-results">
          <div className="memdb-bench-grid">
            <div className="memdb-bench-metric">
              <div className="memdb-bench-metric-label">📖 Avg Read Latency</div>
              {gauge(result.avgReadMs)}
            </div>
            <div className="memdb-bench-metric">
              <div className="memdb-bench-metric-label">✏️ Avg Write Latency</div>
              {gauge(result.avgWriteMs)}
            </div>
            <div className="memdb-bench-metric">
              <div className="memdb-bench-metric-label">P50 Read (Median)</div>
              {gauge(result.p50ReadMs)}
            </div>
            <div className="memdb-bench-metric">
              <div className="memdb-bench-metric-label">P99 Read Latency</div>
              {gauge(result.p99ReadMs)}
            </div>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>
            {result.note}
          </p>
        </div>
      )}
      {result?.error && <p className="msg-error">{result.error}</p>}
    </div>
  );
}

export default function MemoryDbHub() {
  const [data, setData]       = useState(null);
  const [info, setInfo]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inspect, serverInfo] = await Promise.all([
        getMemoryDbInspect(),
        getMemoryDbInfo(),
      ]);
      setData(inspect);
      setInfo(serverInfo);
      setLastRefresh(new Date());
      setError('');
    } catch {
      setError('Cannot reach backend. Ensure EC2 backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <main className="page memdb-page">
      {/* Header */}
      <div className="memdb-hero">
        <div className="memdb-hero-icon">🧠</div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
            In-Memory Data Store Inspector
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Live snapshot of all Redis data structures powering CraveDash —
            fully compatible with <strong style={{ color: '#ff9900' }}>Amazon MemoryDB for Redis</strong>
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={load}
          disabled={loading}
          style={{ marginLeft: 'auto', flexShrink: 0, padding: '8px 16px', fontSize: 13 }}
        >
          {loading ? '⏳' : '🔄 Refresh'}
        </button>
      </div>

      {/* Server info ribbon */}
      {info && !info.error && (
        <div className="memdb-server-ribbon">
          {info.redis_version && (
            <span className="memdb-ribbon-chip">Redis v{info.redis_version}</span>
          )}
          {info.os && (
            <span className="memdb-ribbon-chip">{info.os}</span>
          )}
          {info.uptime_in_days && (
            <span className="memdb-ribbon-chip">Uptime: {info.uptime_in_days}d {Math.round((info.uptime_in_seconds % 86400) / 3600)}h</span>
          )}
          {lastRefresh && (
            <span className="memdb-ribbon-chip" style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
              Updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
      )}

      {error && <p className="msg-error" style={{ marginBottom: 20 }}>{error}</p>}

      {loading && !data ? (
        <p className="loading">Loading live Redis data…</p>
      ) : data && (
        <>
          {/* Architecture callout */}
          <div className="memdb-arch-callout">
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#ff9900' }}>
              🏗️ Why Amazon MemoryDB? (Not Just a Cache!)
            </h3>
            <div className="memdb-arch-grid">
              {[
                { icon: '⚡', title: 'Sub-millisecond Reads', desc: 'All order data lives in RAM — no disk I/O. Average latency < 1ms.' },
                { icon: '🔒', title: 'ACID Transactions', desc: 'MULTI/EXEC with {cravedash} hash tag ensures atomic order creation across 4 Redis keys.' },
                { icon: '🌍', title: 'Multi-AZ Durability', desc: 'MemoryDB writes to a distributed transaction log before ACK — zero data loss (RPO=0).' },
                { icon: '🏷️', title: 'Rich Data Structures', desc: 'Hash for orders, Sorted Sets for indexes & leaderboard, Set for O(1) active tracking.' },
              ].map(item => (
                <div key={item.title} className="memdb-arch-item">
                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{item.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Benchmark */}
          <BenchmarkPanel />

          {/* Key cards */}
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, marginTop: 8 }}>
            🗂️ Live Redis Key Explorer
          </h2>
          <div className="memdb-keys-grid">
            {Object.entries(data).map(([k, v]) =>
              SECTION_META[k] ? <KeyCard key={k} sectionKey={k} data={v} /> : null
            )}
          </div>
        </>
      )}
    </main>
  );
}
