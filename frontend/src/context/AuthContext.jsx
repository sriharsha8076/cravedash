import { createContext, useContext, useState, useEffect } from 'react';

/**
 * AuthContext — global role-based auth state.
 *
 * Roles: 'customer' | 'restaurant' | 'admin'
 *
 * For this demo, there is no real JWT. Role + user name are chosen on the
 * login page and persisted in localStorage so a page refresh doesn't
 * immediately log the user out.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const saved = localStorage.getItem('cravedash_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  function login(role, name, restaurantId = null) {
    const session = { role, name, restaurantId };
    setAuth(session);
    localStorage.setItem('cravedash_auth', JSON.stringify(session));
  }

  function logout() {
    setAuth(null);
    localStorage.removeItem('cravedash_auth');
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook — throws if used outside AuthProvider */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
