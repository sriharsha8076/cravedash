import { useEffect, useState, useCallback } from 'react';
import { getOrders, updateOrderStatus } from '../api/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const NEXT_STATUS = {
  PLACED:           'ACCEPTED',
  ACCEPTED:         'PREPARING',
  PREPARING:        'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
  DELIVERED:        null,
};

const NEXT_LABEL = {
  ACCEPTED:         '✅ Accept Order',
  PREPARING:        '👨‍🍳 Mark Preparing',
  OUT_FOR_DELIVERY: '🛵 Mark Out for Delivery',
  DELIVERED:        '🎉 Mark Delivered',
};

export default function RestaurantPage() {
  const { auth }                = useAuth();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filter, setFilter]     = useState('ACTIVE'); // ACTIVE | ALL
  const [updating, setUpdating] = useState({}); // { [orderId]: true }
  const [toast, setToast]       = useState('');

  const fetchOrders = useCallback(async () => {
    setError('');
    try {
      // Use ?restaurant= query param added to the backend
      const params = auth.restaurantId
        ? `?restaurant=${encodeURIComponent(auth.restaurantId)}`
        : '';
      const data = await getOrders(auth.restaurantId);
      setOrders(data);
    } catch {
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [auth.restaurantId]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10_000); // auto-refresh every 10s
    return () => clearInterval(interval);
  }, [fetchOrders]);

  async function advanceStatus(order) {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdating(prev => ({ ...prev, [order.id]: true }));
    try {
      await updateOrderStatus(order.id, next);
      showToast(`Order #${order.id} → ${next.replace(/_/g, ' ')}`);
      await fetchOrders();
    } catch {
      setError('Failed to update order status.');
    } finally {
      setUpdating(prev => ({ ...prev, [order.id]: false }));
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const STATUS_PRIORITY = ['PLACED', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];

  const displayed = orders
    .filter(o => filter === 'ALL' || o.status !== 'DELIVERED')
    .sort((a, b) => STATUS_PRIORITY.indexOf(a.status) - STATUS_PRIORITY.indexOf(b.status));

  const activeCount = orders.filter(o => o.status !== 'DELIVERED').length;

  return (
    <main className="page">
      {/* Toast */}
      {toast && <div className="partner-toast">{toast}</div>}

      {/* Header */}
      <div className="section-header" style={{ marginBottom: 8 }}>
        <div>
          <h1>👨‍🍳 {auth.restaurantId || 'Restaurant'} Orders</h1>
          <p className="page-subtitle">
            {activeCount} active order{activeCount !== 1 ? 's' : ''} · Auto-refreshes every 10s
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchOrders}>↻ Refresh</button>
      </div>

      {/* Filter tabs */}
      <div className="partner-tabs">
        {[
          { key: 'ACTIVE', label: `🔥 Active (${activeCount})` },
          { key: 'ALL',    label: `📋 All (${orders.length})` },
        ].map(t => (
          <button
            key={t.key}
            id={`partner-tab-${t.key.toLowerCase()}`}
            className={`partner-tab ${filter === t.key ? 'active' : ''}`}
            onClick={() => setFilter(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="msg-error" style={{ marginBottom: 16 }}>{error}</p>}

      {loading ? (
        <p className="loading">Loading orders…</p>
      ) : displayed.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 8 }}>✨</div>
          <p>No {filter === 'ACTIVE' ? 'active ' : ''}orders right now.</p>
          {filter === 'ACTIVE' && (
            <p style={{ fontSize: 12, marginTop: 4 }}>New orders will appear automatically.</p>
          )}
        </div>
      ) : (
        <div className="partner-orders-grid">
          {displayed.map(order => {
            const next = NEXT_STATUS[order.status];
            const isUpdating = updating[order.id];
            const isDelivered = order.status === 'DELIVERED';

            return (
              <div
                key={order.id}
                className={`partner-order-card status-card-${order.status.toLowerCase()}`}
              >
                <div className="partner-order-header">
                  <span className="partner-order-id">#{order.id}</span>
                  <StatusBadge status={order.status} />
                </div>

                <div className="partner-order-customer">
                  <span className="partner-order-icon">👤</span>
                  <span className="partner-customer-name">{order.customer}</span>
                </div>

                <div className="partner-order-amount">
                  ₹{order.amount.toLocaleString()}
                </div>

                <div className="partner-order-time">
                  {new Date(order.createdAt).toLocaleString('en-IN', {
                    hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short'
                  })}
                </div>

                {!isDelivered && next && (
                  <button
                    id={`advance-${order.id}`}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: 12 }}
                    onClick={() => advanceStatus(order)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? '⏳ Updating…' : NEXT_LABEL[next]}
                  </button>
                )}

                {isDelivered && (
                  <div className="partner-delivered-badge">🎉 Delivered</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
