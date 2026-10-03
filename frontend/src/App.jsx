import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Leaderboard from './pages/Leaderboard';

/**
 * Root application component.
 *
 * Route structure:
 *   /              → Dashboard   (stats + recent orders + top leaderboard)
 *   /orders        → Orders      (full order list + filters + create-order modal)
 *   /orders/:id    → OrderDetails (single order + status advancement)
 *   /leaderboard   → Leaderboard (top 20 customers by points)
 *   *              → 404 fallback
 */
export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"             element={<Dashboard />} />
        <Route path="/orders"       element={<Orders />} />
        <Route path="/orders/:id"   element={<OrderDetails />} />
        <Route path="/leaderboard"  element={<Leaderboard />} />
        <Route path="*"             element={<NotFound />} />
      </Routes>
    </>
  );
}

function NotFound() {
  return (
    <main className="page">
      <div className="not-found">
        <h1>404</h1>
        <p>Oops! This page doesn't exist.</p>
        <a href="/" style={{ display: 'inline-block', marginTop: 20 }}
           className="btn btn-primary">
          ← Go to Dashboard
        </a>
      </div>
    </main>
  );
}
