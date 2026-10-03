import { useEffect, useState } from 'react';
import { getLeaderboard } from '../api/api';

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        setEntries(await getLeaderboard(20));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load leaderboard.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main className="page">
      <h1>🏆 Leaderboard</h1>
      <p className="page-subtitle">
        Customers earn <strong style={{ color: 'var(--orange)' }}>10 points</strong> per delivered order · Top 20 shown
      </p>

      {error && <p className="msg-error" style={{ marginBottom: 16 }}>{error}</p>}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p className="loading" style={{ padding: '20px 24px' }}>Loading rankings…</p>
        ) : entries.length === 0 ? (
          <p className="empty-state">
            No points yet. Deliver an order to earn points.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Rank</th>
                  <th>Customer</th>
                  <th>Points</th>
                  <th>Orders Delivered</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr
                    key={e.name}
                    className={`rank-${e.rank}`}
                    style={{
                      background: e.rank <= 3 ? 'rgba(255,153,0,0.04)' : undefined,
                    }}
                  >
                    <td>
                      <span style={{ fontSize: e.rank <= 3 ? 20 : 14, fontWeight: 700 }}>
                        {MEDALS[e.rank] ?? `#${e.rank}`}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontWeight: e.rank <= 3 ? 700 : 500,
                        fontSize: e.rank === 1 ? 15 : 13,
                      }}>
                        {e.name}
                      </span>
                    </td>
                    <td>
                      <span className="points-pill">⭐ {e.points} pts</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {Math.round(e.points / 10)} order{e.points !== 10 ? 's' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Points explainer */}
      {!loading && entries.length > 0 && (
        <div style={{
          marginTop: 20,
          padding: '12px 16px',
          background: 'var(--glass)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--r-md)',
          fontSize: 12.5,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          💡 Points are awarded automatically when an order is marked as <strong style={{ color: 'var(--green)' }}>Delivered</strong>.
          Backed by a Redis Sorted Set (ZINCRBY) on Amazon MemoryDB.
        </div>
      )}
    </main>
  );
}
