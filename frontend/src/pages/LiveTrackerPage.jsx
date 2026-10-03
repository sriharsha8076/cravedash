import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrder } from '../api/api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['PLACED', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const STATUS_META = {
  PLACED:           { label: 'Order Placed',       emoji: '📋', eta: '—', desc: 'Your order has been received by the restaurant.' },
  ACCEPTED:         { label: 'Order Accepted',      emoji: '✅', eta: '~40 min', desc: 'The restaurant confirmed your order.' },
  PREPARING:        { label: 'Preparing Your Food', emoji: '👨‍🍳', eta: '~30 min', desc: 'The chefs are working on your food.' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',   emoji: '🛵', eta: '~15 min', desc: 'Your food is on its way!' },
  DELIVERED:        { label: 'Delivered!',           emoji: '🎉', eta: 'Enjoy!',  desc: 'Your order has arrived. Enjoy your meal!' },
};

export default function LiveTrackerPage() {
  const { id }              = useParams();
  const { auth }            = useAuth();
  const [order, setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  async function fetchOrder() {
    try {
      const data = await getOrder(id);
      setOrder(data);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      if (err.response?.status === 404) setError(`Order #${id} not found.`);
      else setError('Failed to load order. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrder();
    // Poll every 8s to detect status changes
    const interval = setInterval(fetchOrder, 8_000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return (
    <main className="page">
      <p className="loading">Loading tracker for order #{id}…</p>
    </main>
  );

  if (error) return (
    <main className="page">
      <p className="msg-error">{error}</p>
      <Link to="/" style={{ display: 'inline-block', marginTop: 14 }} className="btn btn-secondary">
        ← Go Home
      </Link>
    </main>
  );

  const currentIdx = STATUSES.indexOf(order.status);
  const meta = STATUS_META[order.status];
  const isDelivered = order.status === 'DELIVERED';

  return (
    <main className="page tracker-page">
      {/* Back */}
      <Link to="/" className="tracker-back">← Home</Link>

      {/* Header */}
      <div className="tracker-header">
        <div className={`tracker-main-emoji ${isDelivered ? 'bounce' : 'pulse-slow'}`}>
          {meta.emoji}
        </div>
        <h1 className="tracker-status-title">{meta.label}</h1>
        <p className="tracker-desc">{meta.desc}</p>
        {!isDelivered && (
          <div className="tracker-eta">
            <span className="tracker-eta-label">Estimated Time</span>
            <span className="tracker-eta-value">{meta.eta}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="tracker-progress-wrap">
        <div
          className="tracker-progress-bar"
          style={{ width: `${((currentIdx + 1) / STATUSES.length) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="tracker-steps">
        {STATUSES.map((status, idx) => {
          const isDone    = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isPending = idx > currentIdx;
          const sm = STATUS_META[status];

          return (
            <div
              key={status}
              className={`tracker-step ${isDone ? 'done' : isCurrent ? 'current' : 'pending'}`}
            >
              <div className="tracker-step-icon-wrap">
                <div className="tracker-step-connector-before" />
                <div className={`tracker-step-dot ${isDone ? 'done' : isCurrent ? 'current' : ''}`}>
                  {isDone ? '✓' : isCurrent ? sm.emoji : idx + 1}
                </div>
                <div className="tracker-step-connector-after" />
              </div>
              <div className="tracker-step-content">
                <div className="tracker-step-label">{sm.label}</div>
                {isCurrent && <div className="tracker-step-badge">Current</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order summary */}
      <div className="card tracker-order-card">
        <h2>📋 Order Summary</h2>
        <div className="detail-row">
          <span className="detail-label">Order ID</span>
          <span className="detail-value" style={{ fontFamily: 'monospace', color: 'var(--orange)' }}>#{order.id}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Customer</span>
          <span className="detail-value">{order.customer}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Restaurant</span>
          <span className="detail-value">{order.restaurant}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Amount</span>
          <span className="detail-value" style={{ fontWeight: 700, color: 'var(--orange)', fontSize: 17 }}>
            ₹{order.amount.toLocaleString()}
          </span>
        </div>
        {lastUpdated && (
          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 14, textAlign: 'right' }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {isDelivered && (
        <div className="tracker-delivered-msg">
          <span>🌟</span>
          <span>Thank you, {order.customer}! You earned <strong>10 loyalty points</strong>.</span>
        </div>
      )}
    </main>
  );
}
