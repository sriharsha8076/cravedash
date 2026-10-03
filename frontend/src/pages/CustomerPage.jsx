import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { getRestaurants, createOrder } from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function CustomerPage() {
  const { auth }                          = useAuth();
  const navigate                          = useNavigate();
  const [restaurants, setRestaurants]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [activeRest, setActiveRest]       = useState(null); // restaurant whose menu is open
  const [cart, setCart]                   = useState([]);   // { item, restaurant, qty }
  const [cartOpen, setCartOpen]           = useState(false);
  const [placing, setPlacing]             = useState(false);
  const [placedOrder, setPlacedOrder]     = useState(null);
  const [search, setSearch]               = useState('');
  const [addedToast, setAddedToast]       = useState(''); // brief "added" notification

  useEffect(() => {
    getRestaurants()
      .then(data => { setRestaurants(data); setLoading(false); })
      .catch(() => { setError('Failed to load restaurants.'); setLoading(false); });
  }, []);

  // ── Cart helpers ─────────────────────────────────────────────────────────
  function addToCart(item, restaurant) {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { item, restaurant, qty: 1 }];
    });
    // Show a brief toast instead of forcibly opening the cart sidebar
    setAddedToast(item.name + ' added to cart!');
    setTimeout(() => setAddedToast(''), 2000);
  }

  function removeFromCart(itemId) {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  }

  function changeQty(itemId, delta) {
    setCart(prev => prev
      .map(c => c.item.id === itemId ? { ...c, qty: Math.max(0, c.qty + delta) } : c)
      .filter(c => c.qty > 0)
    );
  }

  const cartTotal   = cart.reduce((s, c) => s + c.item.price * c.qty, 0);
  const cartCount   = cart.reduce((s, c) => s + c.qty, 0);

  // ── Place order ───────────────────────────────────────────────────────────
  async function handlePlaceOrder() {
    if (!cart.length) return;
    setPlacing(true);
    try {
      // Group by restaurant — place one order per restaurant for simplicity
      const restName = cart[0].restaurant.name;
      const order = await createOrder({
        customer:   auth.name,
        restaurant: restName,
        amount:     cartTotal,
      });
      setPlacedOrder(order);
      setCart([]);
      setCartOpen(false);
    } catch (err) {
      setError('Failed to place order. Is the backend running?');
    } finally {
      setPlacing(false);
    }
  }

  const filtered = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.cuisine.toLowerCase().includes(search.toLowerCase())
  );

  // ── Placed success ────────────────────────────────────────────────────────
  if (placedOrder) {
    return (
      <main className="page">
        <div className="order-success-screen">
          <div className="order-success-icon">🎉</div>
          <h1>Order Placed!</h1>
          <p className="page-subtitle">Your order #{placedOrder.id} is being processed</p>
          <div className="card order-success-card">
            <div className="detail-row">
              <span className="detail-label">Order ID</span>
              <span className="detail-value" style={{ fontFamily: 'monospace', color: 'var(--orange)', fontWeight: 700 }}>
                #{placedOrder.id}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Restaurant</span>
              <span className="detail-value">{placedOrder.restaurant}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Amount</span>
              <span className="detail-value" style={{ fontWeight: 700, fontSize: 17, color: 'var(--orange)' }}>
                ₹{placedOrder.amount.toLocaleString()}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/track/${placedOrder.id}`)}
            >
              🛵 Track Live Order
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setPlacedOrder(null)}
            >
              🍽️ Order More
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page customer-page">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1>👋 Hey, {auth?.name}!</h1>
        <p className="page-subtitle">What are you craving today?</p>

        {/* Search */}
        <div className="customer-search-wrap">
          <span className="customer-search-icon">🔍</span>
          <input
            id="restaurant-search"
            className="customer-search"
            type="text"
            placeholder="Search restaurants or cuisines…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="msg-error" style={{ marginBottom: 20 }}>{error}</p>}

      {/* Restaurant grid */}
      {loading ? (
        <p className="loading">Loading restaurants…</p>
      ) : (
        <div className="restaurant-grid">
          {filtered.map(rest => (
            <div
              key={rest.id}
              className={`restaurant-card ${activeRest?.id === rest.id ? 'expanded' : ''}`}
            >
              {/* Card header */}
              <div
                className="restaurant-card-header"
                onClick={() => setActiveRest(activeRest?.id === rest.id ? null : rest)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setActiveRest(activeRest?.id === rest.id ? null : rest)}
              >
                <div className="restaurant-emoji">{rest.emoji}</div>
                <div className="restaurant-info">
                  <div className="restaurant-name">{rest.name}</div>
                  <div className="restaurant-meta">
                    <span className="restaurant-cuisine">{rest.cuisine}</span>
                    <span className="restaurant-dot">·</span>
                    <span>⭐ {rest.rating}</span>
                    <span className="restaurant-dot">·</span>
                    <span>🕐 {rest.deliveryTime} min</span>
                  </div>
                  <div className="restaurant-desc">{rest.description}</div>
                </div>
                <span className={`restaurant-chevron ${activeRest?.id === rest.id ? 'open' : ''}`}>›</span>
              </div>

              {/* Menu — expanded */}
              {activeRest?.id === rest.id && (
                <div className="restaurant-menu">
                  <div className="menu-divider" />
                  {rest.menu.map(item => {
                    const cartItem = cart.find(c => c.item.id === item.id);
                    return (
                      <div key={item.id} className="menu-item">
                        <span className="menu-item-emoji">{item.emoji}</span>
                        <div className="menu-item-info">
                          <div className="menu-item-name">{item.name}</div>
                          <div className="menu-item-desc">{item.description}</div>
                        </div>
                        <div className="menu-item-right">
                          <div className="menu-item-price">₹{item.price}</div>
                          {cartItem ? (
                            <div className="qty-control">
                              <button
                                className="qty-btn"
                                onClick={() => changeQty(item.id, -1)}
                                id={`qty-dec-${item.id}`}
                              >−</button>
                              <span className="qty-value">{cartItem.qty}</span>
                              <button
                                className="qty-btn"
                                onClick={() => changeQty(item.id, +1)}
                                id={`qty-inc-${item.id}`}
                              >+</button>
                            </div>
                          ) : (
                            <button
                              id={`add-${item.id}`}
                              className="btn btn-primary btn-sm"
                              onClick={() => addToCart(item, rest)}
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="empty-state" style={{ gridColumn: '1/-1' }}>
              No restaurants match "{search}"
            </p>
          )}
        </div>
      )}

      {/* "Added" toast — appears briefly when an item is added */}
      {addedToast && createPortal(
        <div style={{
          position: 'fixed',
          top: 76,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg-3)',
          border: '1px solid var(--orange)',
          color: 'var(--orange)',
          padding: '10px 20px',
          borderRadius: '999px',
          fontSize: 13,
          fontWeight: 600,
          zIndex: 1100,
          boxShadow: '0 4px 20px rgba(255,153,0,0.3)',
          animation: 'fadeInUp 0.2s ease both',
          whiteSpace: 'nowrap',
        }}>
          ✓ {addedToast}
        </div>,
        document.body
      )}

      {/* Floating cart button */}
      {cartCount > 0 && !cartOpen && (
        <button
          id="open-cart"
          className="cart-fab"
          onClick={() => setCartOpen(true)}
        >
          <span className="cart-fab-icon">🛒</span>
          <span className="cart-fab-text">{cartCount} item{cartCount > 1 ? 's' : ''} · ₹{cartTotal.toLocaleString()}</span>
          <span>View Cart →</span>
        </button>
      )}

      {/* Cart sidebar */}
      {cartOpen && createPortal(
        <div className="cart-overlay" onClick={() => setCartOpen(false)}>
          <aside
            className="cart-sidebar"
            onClick={e => e.stopPropagation()}
          >
            <div className="cart-header">
              <h2>🛒 Your Cart</h2>
              <button
                className="modal-close"
                onClick={() => setCartOpen(false)}
                id="close-cart"
              >×</button>
            </div>

            {cart.length === 0 ? (
              <p className="empty-state" style={{ padding: '40px 24px', textAlign: 'center' }}>Cart is empty</p>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(c => (
                    <div key={c.item.id} className="cart-item">
                      <span className="cart-item-emoji">{c.item.emoji}</span>
                      <div className="cart-item-info">
                        <div className="cart-item-name">{c.item.name}</div>
                        <div className="cart-item-from">{c.restaurant.name}</div>
                      </div>
                      <div className="cart-item-right">
                        <div className="qty-control">
                          <button className="qty-btn" onClick={() => changeQty(c.item.id, -1)}>−</button>
                          <span className="qty-value">{c.qty}</span>
                          <button className="qty-btn" onClick={() => changeQty(c.item.id, +1)}>+</button>
                        </div>
                        <div className="cart-item-price">₹{(c.item.price * c.qty).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-footer">
                  <div className="cart-total-row">
                    <span>Total</span>
                    <span className="cart-total-value">₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <button
                    id="place-order"
                    className="btn btn-primary"
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    style={{ width: '100%', padding: '12px', fontSize: 15 }}
                  >
                    {placing ? '⏳ Placing…' : '🎉 Place Order'}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>,
        document.body
      )}
    </main>
  );
}
