import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRestaurants } from '../api/api';

const ROLES = [
  {
    key: 'customer',
    label: 'Customer',
    emoji: '🛍️',
    desc: 'Browse restaurants, add to cart & track your order live',
    color: '#60a5fa',
  },
  {
    key: 'restaurant',
    label: 'Restaurant Partner',
    emoji: '👨‍🍳',
    desc: 'Manage incoming orders, accept & advance order status',
    color: '#34d399',
  },
  {
    key: 'admin',
    label: 'Admin',
    emoji: '🛡️',
    desc: 'Full dashboard access — analytics, leaderboard, all orders',
    color: '#ff9900',
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [step, setStep]           = useState(1); // 1 = pick role, 2 = enter name
  const [role, setRole]           = useState(null);
  const [name, setName]           = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (role === 'restaurant') {
      getRestaurants().then(setRestaurants).catch(() => {});
    }
  }, [role]);

  function handleRoleSelect(r) {
    setRole(r.key);
    setStep(2);
    setError('');
  }

  function handleLogin(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Please enter your name.'); return; }
    if (role === 'restaurant' && !selectedRestaurant) {
      setError('Please select your restaurant.'); return;
    }
    setLoading(true);
    // Slight delay for UX polish
    setTimeout(() => {
      login(role, trimmed, role === 'restaurant' ? selectedRestaurant : null);
      setLoading(false);
    }, 400);
  }

  const selectedRoleObj = ROLES.find(r => r.key === role);

  return (
    <div className="login-page">
      {/* Background orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      <div className="login-container">
        {/* Brand */}
        <div className="login-brand">
          <span className="login-brand-icon">🍔</span>
          <h1 className="login-brand-name">CraveDash</h1>
          <p className="login-brand-tagline">Order Management Platform</p>
        </div>

        {step === 1 && (
          <div className="login-step" key="step1">
            <h2 className="login-step-title">Choose your role</h2>
            <p className="login-step-subtitle">Select how you want to use CraveDash today</p>
            <div className="role-cards">
              {ROLES.map((r) => (
                <button
                  key={r.key}
                  id={`role-${r.key}`}
                  className="role-card"
                  onClick={() => handleRoleSelect(r)}
                  style={{ '--role-color': r.color }}
                >
                  <span className="role-emoji">{r.emoji}</span>
                  <span className="role-label">{r.label}</span>
                  <span className="role-desc">{r.desc}</span>
                  <span className="role-arrow">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && selectedRoleObj && (
          <div className="login-step" key="step2">
            <button
              className="login-back"
              onClick={() => { setStep(1); setRole(null); setError(''); }}
            >
              ← Back
            </button>
            <div className="login-role-badge" style={{ '--role-color': selectedRoleObj.color }}>
              <span>{selectedRoleObj.emoji}</span>
              <span>{selectedRoleObj.label}</span>
            </div>
            <h2 className="login-step-title">Welcome! What's your name?</h2>
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="login-name">Your Name</label>
                <input
                  id="login-name"
                  type="text"
                  placeholder={role === 'customer' ? 'e.g. Priya Sharma' : role === 'restaurant' ? 'Your name' : 'Admin name'}
                  value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  autoFocus
                />
              </div>

              {role === 'restaurant' && (
                <div className="form-group">
                  <label htmlFor="login-restaurant">Your Restaurant</label>
                  <select
                    id="login-restaurant"
                    value={selectedRestaurant}
                    onChange={e => { setSelectedRestaurant(e.target.value); setError(''); }}
                  >
                    <option value="">— Select restaurant —</option>
                    {restaurants.map(r => (
                      <option key={r.id} value={r.name}>{r.emoji} {r.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {error && <p className="field-error" style={{ marginBottom: 8 }}>{error}</p>}

              <button
                id="login-submit"
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', padding: '12px', fontSize: 15, marginTop: 8 }}
              >
                {loading ? '⏳ Entering…' : `Enter as ${selectedRoleObj.label} →`}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
