import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrder, updateOrderStatus } from '../api/api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['PLACED', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const STATUS_META = {
  PLACED:           { label: 'Order Placed',       emoji: '📋', eta: '~40 min', desc: 'Your order has been received by the restaurant.', color: '#60a5fa' },
  ACCEPTED:         { label: 'Order Accepted',      emoji: '✅', eta: '~30 min', desc: 'The restaurant confirmed and is getting started.',  color: '#a78bfa' },
  PREPARING:        { label: 'Preparing Your Food', emoji: '👨‍🍳', eta: '~20 min', desc: 'The chefs are cooking your delicious order.',       color: '#fbbf24' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',    emoji: '🛵', eta: '~12 min', desc: 'Your food is speeding towards you!',                color: '#ff9900' },
  DELIVERED:        { label: 'Delivered! 🎉',        emoji: '🎉', eta: 'Enjoy!',  desc: 'Your order has arrived. Enjoy your meal!',          color: '#34d399' },
};

// Simulated route waypoints (% positions across the map canvas)
const ROUTE = [
  { x: 12, y: 65 },   // restaurant
  { x: 28, y: 48 },
  { x: 42, y: 55 },
  { x: 58, y: 40 },
  { x: 72, y: 52 },
  { x: 85, y: 35 },   // customer home
];

function DeliveryMap({ currentStatus }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const progressRef = useRef(0);

  const statusIdx = STATUSES.indexOf(currentStatus);
  // rider appears between ACCEPTED and DELIVERED
  const riderVisible = statusIdx >= 1;
  // target progress 0..1 based on status
  const targetProgress = Math.max(0, Math.min(1, (statusIdx - 1) / (STATUSES.length - 2)));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;

    function lerp(a, b, t) { return a + (b - a) * t; }
    function pointOnRoute(t) {
      const totalSegments = ROUTE.length - 1;
      const segment = Math.min(Math.floor(t * totalSegments), totalSegments - 1);
      const segT = (t * totalSegments) - segment;
      const from = ROUTE[segment], to = ROUTE[segment + 1];
      return { x: lerp(from.x, to.x, segT), y: lerp(from.y, to.y, segT) };
    }

    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#0f1520');
      grad.addColorStop(1, '#161b26');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 32) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (let gy = 0; gy < H; gy += 32) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

      // Road path (dashed)
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ROUTE.forEach((p, i) => {
        const px = (p.x / 100) * W, py = (p.y / 100) * H;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Completed path glow
      if (riderVisible) {
        const curP = progressRef.current;
        ctx.strokeStyle = 'rgba(255,153,0,0.5)';
        ctx.shadowColor = '#ff9900';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 3;
        ctx.beginPath();
        const steps = 40;
        for (let s = 0; s <= steps; s++) {
          const t = (s / steps) * curP;
          const pt = pointOnRoute(t);
          const px = (pt.x / 100) * W, py = (pt.y / 100) * H;
          s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Restaurant pin
      const rp = ROUTE[0];
      const rx = (rp.x / 100) * W, ry = (rp.y / 100) * H;
      ctx.fillStyle = '#60a5fa';
      ctx.shadowColor = '#60a5fa';
      ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(rx, ry, 10, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🍽️', rx, ry);
      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText('Restaurant', rx, ry + 18);

      // Customer pin
      const cp = ROUTE[ROUTE.length - 1];
      const cx = (cp.x / 100) * W, cy = (cp.y / 100) * H;
      ctx.fillStyle = '#34d399';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏠', cx, cy);
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText('Your Home', cx, cy + 18);

      // Rider
      if (riderVisible) {
        // Smooth toward target
        progressRef.current = lerp(progressRef.current, targetProgress, 0.04);
        const riderPt = pointOnRoute(progressRef.current);
        const rrx = (riderPt.x / 100) * W, rry = (riderPt.y / 100) * H;

        // Pulse ring
        const pulse = 0.5 + 0.5 * Math.sin(frame * 0.1);
        ctx.strokeStyle = `rgba(255,153,0,${0.3 + 0.3 * pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(rrx, rry, 18 + 4 * pulse, 0, Math.PI * 2); ctx.stroke();

        ctx.fillStyle = '#ff9900';
        ctx.shadowColor = '#ff9900';
        ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(rrx, rry, 12, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛵', rrx, rry);

        if (currentStatus === 'DELIVERED') {
          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 11px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Delivered!', rrx, rry - 22);
        }
      }

      frame++;
      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [currentStatus, riderVisible, targetProgress]);

  return (
    <div className="tracker-map-wrap">
      <div className="tracker-map-label">📍 Live Delivery Route</div>
      <canvas ref={canvasRef} width={620} height={200} className="tracker-map-canvas" />
      <div className="tracker-map-legend">
        <span><span style={{ color: '#60a5fa' }}>●</span> Restaurant</span>
        <span><span style={{ color: '#ff9900' }}>🛵</span> Delivery Rider</span>
        <span><span style={{ color: '#34d399' }}>●</span> Your Home</span>
      </div>
    </div>
  );
}

function Confetti() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -200,
      r: Math.random() * 8 + 4,
      color: ['#ff9900','#34d399','#60a5fa','#a78bfa','#fbbf24','#f472b6'][Math.floor(Math.random() * 6)],
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 4 + 2,
      angle: Math.random() * 360,
      va: (Math.random() - 0.5) * 6,
    }));
    let raf;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.5);
        ctx.restore();
        p.x += p.vx; p.y += p.vy; p.angle += p.va;
        if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }
      });
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    const t = setTimeout(() => cancelAnimationFrame(raf), 5000);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }} />;
}

export default function LiveTrackerPage() {
  const { id }                  = useParams();
  const { auth }                = useAuth();
  const [order, setOrder]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [simulating, setSimulating]   = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const simRef = useRef(null);

  const fetchOrder = useCallback(async () => {
    try {
      const data = await getOrder(id);
      setOrder(prev => {
        if (prev && prev.status !== data.status && data.status === 'DELIVERED') setShowConfetti(true);
        return data;
      });
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      if (err.response?.status === 404) setError(`Order #${id} not found.`);
      else setError('Failed to load order.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 8000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  async function simulateDelivery() {
    if (!order || simulating) return;
    setSimulating(true);
    let current = order;
    while (current.status !== 'DELIVERED') {
      const idx = STATUSES.indexOf(current.status);
      if (idx >= STATUSES.length - 1) break;
      const nextStatus = STATUSES[idx + 1];
      await new Promise(r => setTimeout(r, 2800));
      try {
        const updated = await updateOrderStatus(current.id, nextStatus);
        current = updated;
        setOrder(updated);
        setLastUpdated(new Date());
        if (updated.status === 'DELIVERED') setShowConfetti(true);
      } catch { break; }
    }
    setSimulating(false);
  }

  if (loading) return <main className="page"><p className="loading">Loading tracker for order #{id}…</p></main>;
  if (error)   return (
    <main className="page">
      <p className="msg-error">{error}</p>
      <Link to="/menu" className="btn btn-secondary" style={{ display: 'inline-block', marginTop: 14 }}>← Back to Menu</Link>
    </main>
  );

  const currentIdx  = STATUSES.indexOf(order.status);
  const meta        = STATUS_META[order.status];
  const isDelivered = order.status === 'DELIVERED';
  const progress    = ((currentIdx + 1) / STATUSES.length) * 100;

  return (
    <main className="page tracker-page">
      {showConfetti && <Confetti />}

      <Link to="/menu" className="tracker-back">← Back to Menu</Link>

      {/* Status hero */}
      <div className="tracker-header" style={{ borderBottom: `2px solid ${meta.color}22`, paddingBottom: 24 }}>
        <div
          className={isDelivered ? 'bounce' : 'pulse-slow'}
          style={{ fontSize: 52, textAlign: 'center', lineHeight: 1 }}
        >
          {meta.emoji}
        </div>
        <h1 className="tracker-status-title" style={{ color: meta.color }}>{meta.label}</h1>
        <p className="tracker-desc">{meta.desc}</p>

        {!isDelivered && (
          <div className="tracker-eta">
            <span className="tracker-eta-label">Estimated Time</span>
            <span className="tracker-eta-value" style={{ color: meta.color }}>{meta.eta}</span>
          </div>
        )}
      </div>

      {/* Live Route Map */}
      <DeliveryMap currentStatus={order.status} />

      {/* Progress bar */}
      <div className="tracker-progress-wrap">
        <div className="tracker-progress-bar" style={{ width: `${progress}%`, background: meta.color }} />
      </div>

      {/* Steps */}
      <div className="tracker-steps">
        {STATUSES.map((status, idx) => {
          const isDone    = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const sm = STATUS_META[status];
          return (
            <div key={status} className={`tracker-step ${isDone ? 'done' : isCurrent ? 'current' : 'pending'}`}>
              <div className="tracker-step-icon-wrap">
                <div className="tracker-step-connector-before" />
                <div
                  className={`tracker-step-dot ${isDone ? 'done' : isCurrent ? 'current' : ''}`}
                  style={isCurrent ? { borderColor: sm.color, boxShadow: `0 0 0 4px ${sm.color}33` } : {}}
                >
                  {isDone ? '✓' : isCurrent ? sm.emoji : idx + 1}
                </div>
                <div className="tracker-step-connector-after" />
              </div>
              <div className="tracker-step-content">
                <div className="tracker-step-label">{sm.label}</div>
                {isCurrent && <div className="tracker-step-badge" style={{ background: sm.color + '22', color: sm.color }}>Current</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulate button */}
      {!isDelivered && (
        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <button
            className="btn btn-primary"
            onClick={simulateDelivery}
            disabled={simulating}
            style={{ padding: '10px 28px', fontSize: 14 }}
          >
            {simulating ? '🛵 Simulating delivery…' : '⚡ Simulate Live Delivery'}
          </button>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
            Auto-advances order through all stages with a 2.8s delay between each step
          </p>
        </div>
      )}

      {/* Order summary card */}
      <div className="card tracker-order-card">
        <h2>📋 Order Summary</h2>
        <div className="detail-row">
          <span className="detail-label">Order ID</span>
          <span className="detail-value" style={{ fontFamily: 'monospace', color: '#ff9900' }}>#{order.id}</span>
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
          <span className="detail-value" style={{ fontWeight: 700, color: '#ff9900', fontSize: 17 }}>
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
          <span>Thank you, {order.customer}! You earned <strong>10 loyalty points</strong> on the leaderboard!</span>
        </div>
      )}
    </main>
  );
}
