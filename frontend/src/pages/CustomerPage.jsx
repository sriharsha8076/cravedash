import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { getRestaurants, createOrder } from '../api/api';
import { useAuth } from '../context/AuthContext';

// ── Promo Codes ──────────────────────────────────────────────
const PROMOS = {
  'CRAVE50':  { type: 'percent', value: 50,  label: '50% off your order!',      color: '#ff9900'  },
  'AWS50':    { type: 'flat',    value: 50,  label: '₹50 flat discount!',         color: '#60a5fa'  },
  'FREEDEL':  { type: 'delivery',value: 40,  label: 'Free delivery!',             color: '#34d399'  },
  'NEWUSER':  { type: 'percent', value: 20,  label: '20% off for new users!',    color: '#a78bfa'  },
};

// ── Local fallback catalogue (mirrors RestaurantController.java) ──────────────
// Used when the backend is unreachable so customers can always browse the menu.
const FALLBACK_RESTAURANTS = [
  {
    id: 'biryani-house', name: 'Biryani House', cuisine: 'Indian',
    description: 'Authentic Hyderabadi dum biryani, slow-cooked to perfection',
    emoji: '🍛', deliveryTime: 35, rating: 4.7,
    menu: [
      { id: 'bh-1', name: 'Chicken Biryani',     price: 349, description: 'Aromatic basmati with tender chicken',        emoji: '🍗' },
      { id: 'bh-2', name: 'Mutton Biryani',      price: 449, description: 'Slow-cooked mutton in rich spices',           emoji: '🐑' },
      { id: 'bh-3', name: 'Veg Biryani',         price: 249, description: 'Garden-fresh veggies in dum style',           emoji: '🥦' },
      { id: 'bh-4', name: 'Raita',               price:  49, description: 'Chilled yogurt with cucumber & mint',         emoji: '🥛' },
      { id: 'bh-5', name: 'Gulab Jamun (2 pcs)', price:  89, description: 'Soft dumplings in rose syrup',                emoji: '🍩' },
    ],
  },
  {
    id: 'pizza-paradiso', name: 'Pizza Paradiso', cuisine: 'Italian',
    description: 'Wood-fired Neapolitan pizzas with the finest imported ingredients',
    emoji: '🍕', deliveryTime: 30, rating: 4.5,
    menu: [
      { id: 'pp-1', name: 'Margherita',       price: 299, description: 'Classic tomato, mozzarella, fresh basil',     emoji: '🍅' },
      { id: 'pp-2', name: 'Pepperoni Blast',  price: 399, description: 'Double pepperoni with smoked gouda',          emoji: '🌶️' },
      { id: 'pp-3', name: 'BBQ Chicken',      price: 429, description: 'Smoky BBQ sauce, grilled chicken, onion',     emoji: '🍗' },
      { id: 'pp-4', name: 'Truffle Mushroom', price: 449, description: 'Truffle oil, wild mushrooms, parmesan',       emoji: '🍄' },
      { id: 'pp-5', name: 'Choco Lava',       price: 179, description: 'Warm molten chocolate cake',                  emoji: '🍫' },
    ],
  },
  {
    id: 'sushi-station', name: 'Sushi Station', cuisine: 'Japanese',
    description: 'Premium fresh sushi & sashimi delivered in eco-friendly packaging',
    emoji: '🍱', deliveryTime: 40, rating: 4.8,
    menu: [
      { id: 'ss-1', name: 'Salmon Nigiri (6 pcs)',  price: 499, description: 'Fresh Atlantic salmon on seasoned rice',    emoji: '🐟' },
      { id: 'ss-2', name: 'Dragon Roll',            price: 549, description: 'Shrimp tempura, avocado, eel sauce',        emoji: '🥑' },
      { id: 'ss-3', name: 'Tuna Sashimi (8 pcs)',  price: 599, description: 'Premium bluefin tuna, thinly sliced',        emoji: '🔪' },
      { id: 'ss-4', name: 'Edamame',                price:  99, description: 'Lightly salted steamed soybeans',            emoji: '🌿' },
      { id: 'ss-5', name: 'Miso Soup',             price: 119, description: 'Traditional white miso with tofu & wakame',  emoji: '🍵' },
    ],
  },
  {
    id: 'burger-barn', name: 'Burger Barn', cuisine: 'American',
    description: 'Smash burgers made fresh, every single order, never frozen',
    emoji: '🍔', deliveryTime: 25, rating: 4.3,
    menu: [
      { id: 'bb-1', name: 'Classic Smash',          price: 199, description: 'Double smash patty, American cheese, pickles',     emoji: '🧀' },
      { id: 'bb-2', name: 'Spicy Jalapeño Burger',  price: 229, description: 'Smash patty, jalapeños, sriracha mayo',            emoji: '🌶️' },
      { id: 'bb-3', name: 'Crispy Chicken Burger',  price: 219, description: 'Southern fried chicken, coleslaw, honey mustard',  emoji: '🍗' },
      { id: 'bb-4', name: 'Loaded Fries',           price: 149, description: 'Fries, cheese sauce, jalapeños, sour cream',       emoji: '🍟' },
      { id: 'bb-5', name: 'Oreo Shake',             price: 179, description: 'Thick Oreo milkshake with whipped cream',          emoji: '🥤' },
    ],
  },
  {
    id: 'tandoor-tales', name: 'Tandoor Tales', cuisine: 'North Indian',
    description: 'Royal Mughlai cuisine — kebabs, curries & freshly baked bread',
    emoji: '🫓', deliveryTime: 45, rating: 4.6,
    menu: [
      { id: 'tt-1', name: 'Butter Chicken',        price: 369, description: 'Creamy tomato gravy with tender chicken',      emoji: '🍛' },
      { id: 'tt-2', name: 'Dal Makhani',           price: 279, description: 'Black lentils slow-cooked overnight',          emoji: '🫘' },
      { id: 'tt-3', name: 'Seekh Kebab (4 pcs)',   price: 329, description: 'Minced lamb kebabs with green chutney',        emoji: '🍢' },
      { id: 'tt-4', name: 'Garlic Naan',           price:  69, description: 'Tandoor-baked bread with garlic butter',       emoji: '🫓' },
      { id: 'tt-5', name: 'Phirni',                price: 129, description: 'Rose-flavoured rice pudding in clay pot',      emoji: '🍮' },
    ],
  },
  {
    id: 'wok-wonder', name: 'Wok Wonder', cuisine: 'Chinese',
    description: 'Street-style Chinese — hakka noodles, dim sum & more',
    emoji: '🥢', deliveryTime: 28, rating: 4.2,
    menu: [
      { id: 'ww-1', name: 'Chicken Hakka Noodles',  price: 199, description: 'Wok-tossed noodles, veggies, soy sauce',     emoji: '🍜' },
      { id: 'ww-2', name: 'Dim Sum Basket (6 pcs)', price: 249, description: 'Steamed pork & shrimp dumplings',            emoji: '🥟' },
      { id: 'ww-3', name: 'Kung Pao Chicken',       price: 279, description: 'Stir-fry with peanuts, chillies & veggies',  emoji: '🥜' },
      { id: 'ww-4', name: 'Fried Rice',             price: 179, description: 'Egg or veg fried rice in wok',              emoji: '🍚' },
      { id: 'ww-5', name: 'Honey Chilli Potato',    price: 159, description: 'Crispy potato fingers in honey chilli glaze',emoji: '🍯' },
    ],
  },
];

const DELIVERY_FEE  = 40;
const TAX_RATE      = 0.05;  // 5% GST

export default function CustomerPage() {
  const { auth }                          = useAuth();
  const navigate                          = useNavigate();
  const [restaurants, setRestaurants]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [backendDown, setBackendDown]     = useState(false); // soft offline flag
  const [activeRest, setActiveRest]       = useState(null);
  const [cart, setCart]                   = useState([]);
  const [cartOpen, setCartOpen]           = useState(false);
  const [placing, setPlacing]             = useState(false);
  const [placedOrder, setPlacedOrder]     = useState(null);
  const [search, setSearch]               = useState('');
  const [addedToast, setAddedToast]       = useState('');
  const [promoInput, setPromoInput]       = useState('');
  const [appliedPromo, setAppliedPromo]   = useState(null);
  const [promoMsg, setPromoMsg]           = useState({ text: '', ok: false });
  const [vegOnly, setVegOnly]             = useState(false);

  useEffect(() => {
    getRestaurants()
      .then(data => { setRestaurants(data); setLoading(false); })
      .catch(() => {
        // Backend unreachable — silently fall back to built-in catalogue
        setRestaurants(FALLBACK_RESTAURANTS);
        setBackendDown(true);
        setLoading(false);
      });
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

  const cartSubtotal  = cart.reduce((s, c) => s + c.item.price * c.qty, 0);
  const cartCount     = cart.reduce((s, c) => s + c.qty, 0);

  // Discount calculation
  let discount = 0;
  let deliveryFee = DELIVERY_FEE;
  if (appliedPromo) {
    if (appliedPromo.type === 'percent')  discount = Math.round(cartSubtotal * appliedPromo.value / 100);
    if (appliedPromo.type === 'flat')     discount = Math.min(appliedPromo.value, cartSubtotal);
    if (appliedPromo.type === 'delivery') deliveryFee = 0;
  }
  const tax       = Math.round((cartSubtotal - discount) * TAX_RATE);
  const cartTotal = cartSubtotal - discount + deliveryFee + tax;

  function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    const promo = PROMOS[code];
    if (!promo) {
      setPromoMsg({ text: '❌ Invalid promo code', ok: false });
      setAppliedPromo(null);
      return;
    }
    setAppliedPromo({ ...promo, code });
    setPromoMsg({ text: `✅ "${code}" applied — ${promo.label}`, ok: true });
    setPromoInput('');
  }

  function removePromo() {
    setAppliedPromo(null);
    setPromoMsg({ text: '', ok: false });
    setPromoInput('');
  }

  // ── Place order ───────────────────────────────────────────────────────────
  async function handlePlaceOrder() {
    if (!cart.length) return;
    setPlacing(true);
    setError('');
    try {
      const restName = cart[0].restaurant.name;
      const order = await createOrder({
        customer:   auth.name,
        restaurant: restName,
        amount:     cartTotal,
      });
      setPlacedOrder(order);
      setCart([]);
      setCartOpen(false);
      setAppliedPromo(null);
      setPromoMsg({ text: '', ok: false });
    } catch (err) {
      setError('Failed to place order. Is the backend running?');
    } finally {
      setPlacing(false);
    }
  }

  const filtered = restaurants.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

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

      {backendDown && (
        <div className="offline-banner">
          ⚡ Menu loaded in offline mode — browsing available, but placing orders requires the backend.
        </div>
      )}
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
                  {/* Promo code quick picks */}
                  <div className="cart-promo-chips">
                    {Object.entries(PROMOS).map(([code, p]) => (
                      <button
                        key={code}
                        className="promo-chip"
                        style={{ '--chip-color': p.color }}
                        onClick={() => setPromoInput(code)}
                        title={p.label}
                      >
                        🏷️ {code}
                      </button>
                    ))}
                  </div>

                  {/* Promo input */}
                  <div className="cart-promo-row">
                    <input
                      className="promo-input"
                      placeholder="Enter promo code…"
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && applyPromo()}
                    />
                    <button className="btn btn-secondary btn-sm" onClick={applyPromo} style={{ flexShrink: 0 }}>Apply</button>
                  </div>
                  {promoMsg.text && (
                    <p style={{ fontSize: 12, color: promoMsg.ok ? 'var(--green)' : 'var(--red)', marginBottom: 10 }}>
                      {promoMsg.text}
                      {promoMsg.ok && <button onClick={removePromo} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: 8, fontSize: 11 }}>✕ Remove</button>}
                    </p>
                  )}

                  {/* Bill breakdown */}
                  <div className="cart-bill-breakdown">
                    <div className="cart-bill-row">
                      <span>Item Total</span>
                      <span>₹{cartSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="cart-bill-row">
                      <span>Delivery Fee</span>
                      {deliveryFee === 0
                        ? <span style={{ color: 'var(--green)' }}>FREE 🎉</span>
                        : <span>₹{deliveryFee}</span>
                      }
                    </div>
                    {discount > 0 && (
                      <div className="cart-bill-row" style={{ color: 'var(--green)' }}>
                        <span>Promo Discount</span>
                        <span>- ₹{discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="cart-bill-row">
                      <span>GST (5%)</span>
                      <span>₹{tax}</span>
                    </div>
                    <div className="cart-bill-row cart-bill-total">
                      <span>Total</span>
                      <span className="cart-total-value">₹{cartTotal.toLocaleString()}</span>
                    </div>
                    {discount > 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--green)', fontSize: 12, fontWeight: 600, marginTop: 6 }}>
                        🎉 You saved ₹{discount.toLocaleString()} on this order!
                      </div>
                    )}
                  </div>

                  <button
                    id="place-order"
                    className="btn btn-primary"
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    style={{ width: '100%', padding: '12px', fontSize: 15 }}
                  >
                    {placing ? '⏳ Placing…' : `🎉 Place Order · ₹${cartTotal.toLocaleString()}`}
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
