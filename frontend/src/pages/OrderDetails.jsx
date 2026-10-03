import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrder, updateOrderStatus } from '../api/api';
import StatusBadge from '../components/StatusBadge';
import StatusTimeline from '../components/StatusTimeline';

// Maps current status → the only valid next status (mirrors backend enum)
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

export default function OrderDetails() {
  const { id }                                = useParams();
  const [order, setOrder]                     = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [notFound, setNotFound]               = useState(false);
  const [loadError, setLoadError]             = useState('');
  const [updating, setUpdating]               = useState(false);
  const [updateSuccess, setUpdateSuccess]     = useState('');
  const [updateError, setUpdateError]         = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setNotFound(false);
      setLoadError('');
      try {
        setOrder(await getOrder(id));
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
        else setLoadError(err.response?.data?.message || 'Failed to load order.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleUpdate() {
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;

    setUpdating(true);
    setUpdateSuccess('');
    setUpdateError('');
    try {
      const updated = await updateOrderStatus(order.id, nextStatus);
      setOrder(updated);
      setUpdateSuccess(`✅ Status updated to "${nextStatus.replace(/_/g, ' ')}"`);
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return (
    <main className="page">
      <p className="loading">Loading order #{id}…</p>
    </main>
  );

  if (notFound) return (
    <main className="page">
      <p className="msg-error">Order #{id} not found.</p>
      <Link to="/orders" style={{ display: 'inline-block', marginTop: 14, fontSize: 13 }}>
        ← Back to orders
      </Link>
    </main>
  );

  if (loadError) return (
    <main className="page">
      <p className="msg-error">{loadError}</p>
      <Link to="/orders" style={{ display: 'inline-block', marginTop: 14, fontSize: 13 }}>
        ← Back to orders
      </Link>
    </main>
  );

  const nextStatus  = NEXT_STATUS[order.status];
  const isDelivered = order.status === 'DELIVERED';

  return (
    <main className="page">
      {/* Breadcrumb */}
      <Link
        to="/orders"
        id="back-to-orders"
        style={{ fontSize: 13, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}
      >
        ← Orders
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
        <h1>Order #{order.id}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="page-subtitle">
        Placed {new Date(order.createdAt).toLocaleString('en-IN', {
          weekday: 'short', day: '2-digit', month: 'long',
          year: 'numeric', hour: '2-digit', minute: '2-digit'
        })}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 20, alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Order details */}
          <div className="card">
            <h2>📋 Order Details</h2>
            <div className="detail-row">
              <span className="detail-label">Customer</span>
              <span className="detail-value" style={{ fontWeight: 600 }}>{order.customer}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Restaurant</span>
              <span className="detail-value">{order.restaurant}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Amount</span>
              <span className="detail-value" style={{ fontSize: 17, fontWeight: 700, color: 'var(--orange)' }}>
                ₹{order.amount.toLocaleString()}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Order ID</span>
              <span className="detail-value" style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                #{order.id}
              </span>
            </div>
          </div>

          {/* Update Status */}
          <div className="card">
            <h2>🔄 Update Status</h2>

            {updateSuccess && (
              <p className="msg-success" style={{ marginBottom: 14 }}>{updateSuccess}</p>
            )}
            {updateError && (
              <p className="msg-error" style={{ marginBottom: 14 }}>{updateError}</p>
            )}

            {isDelivered ? (
              <div style={{
                padding: '14px 16px',
                background: 'var(--green-bg)',
                border: '1px solid rgba(52,211,153,0.2)',
                borderRadius: 'var(--r-sm)',
                color: 'var(--green)',
                fontSize: 13,
                fontWeight: 500,
              }}>
                🎉 This order has been successfully delivered!
              </div>
            ) : (
              <>
                <button
                  id="advance-status"
                  className="btn btn-primary"
                  onClick={handleUpdate}
                  disabled={updating}
                  style={{ fontSize: 14, padding: '10px 20px' }}
                >
                  {updating ? '⏳ Updating…' : NEXT_LABEL[nextStatus]}
                </button>
                <p className="next-status-hint">
                  Next status: <strong>{nextStatus?.replace(/_/g, ' ')}</strong>
                </p>
              </>
            )}
          </div>
        </div>

        {/* Right column – timeline */}
        <div className="card">
          <h2>📍 Progress</h2>
          <StatusTimeline currentStatus={order.status} />
        </div>
      </div>

      {/* Mobile: stack columns */}
      <style>{`
        @media (max-width: 640px) {
          .order-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
