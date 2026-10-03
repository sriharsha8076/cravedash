import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

// Pages
import LoginPage       from './pages/LoginPage';
import Dashboard       from './pages/Dashboard';
import Orders          from './pages/Orders';
import OrderDetails    from './pages/OrderDetails';
import Leaderboard     from './pages/Leaderboard';
import CustomerPage    from './pages/CustomerPage';
import RestaurantPage  from './pages/RestaurantPage';
import LiveTrackerPage from './pages/LiveTrackerPage';
import AnalyticsPage   from './pages/AnalyticsPage';

/**
 * Redirects to /login if not authenticated.
 * Redirects to the correct home if the role doesn't match the route.
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    // Redirect to role's default home
    const homes = { customer: '/menu', restaurant: '/partner', admin: '/' };
    return <Navigate to={homes[auth.role] || '/'} replace />;
  }
  return children;
}

/**
 * Root application component.
 *
 * Route structure:
 *   /login         → LoginPage    (public)
 *
 *   /menu          → CustomerPage     (customer)
 *   /track/:id     → LiveTrackerPage  (customer)
 *
 *   /partner       → RestaurantPage   (restaurant)
 *
 *   /              → Dashboard        (admin)
 *   /orders        → Orders           (admin)
 *   /orders/:id    → OrderDetails     (admin)
 *   /analytics     → AnalyticsPage    (admin)
 *   /leaderboard   → Leaderboard      (admin + customer)
 */
export default function App() {
  const { auth } = useAuth();
  const location = useLocation();

  // If not logged in and not on /login, redirect
  const isLoginPage = location.pathname === '/login';

  return (
    <>
      {auth && !isLoginPage && <Navbar />}
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={auth ? <Navigate to={
            auth.role === 'customer' ? '/menu' :
            auth.role === 'restaurant' ? '/partner' : '/'
          } replace /> : <LoginPage />}
        />

        {/* Customer routes */}
        <Route path="/menu" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerPage />
          </ProtectedRoute>
        } />
        <Route path="/track/:id" element={
          <ProtectedRoute allowedRoles={['customer', 'admin']}>
            <LiveTrackerPage />
          </ProtectedRoute>
        } />

        {/* Restaurant partner route */}
        <Route path="/partner" element={
          <ProtectedRoute allowedRoles={['restaurant']}>
            <RestaurantPage />
          </ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Orders />
          </ProtectedRoute>
        } />
        <Route path="/orders/:id" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <OrderDetails />
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AnalyticsPage />
          </ProtectedRoute>
        } />
        <Route path="/leaderboard" element={
          <ProtectedRoute allowedRoles={['admin', 'customer']}>
            <Leaderboard />
          </ProtectedRoute>
        } />

        {/* Catch-all — redirect to login or role home */}
        <Route path="*" element={
          auth
            ? <Navigate to={
                auth.role === 'customer' ? '/menu' :
                auth.role === 'restaurant' ? '/partner' : '/'
              } replace />
            : <Navigate to="/login" replace />
        } />
      </Routes>
    </>
  );
}
