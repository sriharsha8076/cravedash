import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrders } from '../api/api';
import StatusBadge from '../components/StatusBadge';
import CreateOrderModal from '../components/CreateOrderModal';

export default function Orders() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter]       = useState('ALL');

  async function fetchOrders() {
    setLoading(true);
    setError('');
    try {
      setOrders(await getOrders());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchOrders(); }, []);

  function handleCreated() {
    setShowModal(false);
    fetchOrders();
  }

  const STATUS_FILTERS = ['ALL', 'PLACED', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];

  const displayed = filter === 'ALL'
    ? orders
    : orders.filter((o) => o.status === filter);

  return (
    <main className="page">
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div>
          <h1>Orders</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>
            {orders.length} order{orders.length !== 1 ? 's' : ''} · newest first
          </p>
        </div>
        <button
          id="open-create-order"
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          + New Order
        </button>
      </div>

      {/* Status filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            id={`filter-${s.toLowerCase()}`}
            onClick={() => setFilter(s)}
            className="btn btn-secondary btn-sm"
            style={{
              color: filter === s ? 'var(--orange)' : undefined,
              borderColor: filter === s ? 'var(--orange)' : undefined,
              background: filter === s ? 'var(--orange-glow)' : undefined,
            }}
          >
            {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
            {s === 'ALL'
              ? ` (${orders.length})`
              : ` (${orders.filter(o => o.status === s).length})`
            }
          </button>
        ))}
      </div>

      {error && <p className="msg-error" style={{ margin: '0 0 16px' }}>{error}</p>}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p className="loading" style={{ padding: '20px 24px' }}>Loading orders…</p>
        ) : displayed.length === 0 ? (
          <p className="empty-state">
            {filter === 'ALL' ? 'No orders yet. Create the first one!' : `No orders with status "${filter.replace(/_/g, ' ')}".`}
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Restaurant</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 700, color: 'var(--orange)' }}>
                      #{o.id}
                    </td>
                    <td style={{ fontWeight: 500 }}>{o.customer}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{o.restaurant}</td>
                    <td style={{ fontWeight: 600 }}>₹{o.amount.toLocaleString()}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {new Date(o.createdAt).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td>
                      <Link
                        to={`/orders/${o.id}`}
                        id={`view-order-${o.id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <CreateOrderModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </main>
  );
}
