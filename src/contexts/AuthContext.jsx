import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    const payload = parseJwt(token);
    if (payload && payload.username) {
      setUser({ id: payload.user_id, username: payload.username, role_id: payload.role_id });
    } else {
      // invalid token
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
    }
  }, [token]);

  const login = (newToken) => {
    if (!newToken) return;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    // set user synchronously so route guards see it immediately
    const payload = parseJwt(newToken);
    if (payload) {
      setUser({ id: payload.user_id ?? payload.id, username: payload.username ?? payload.name, role_id: payload.role_id ?? payload.role });
    }
    // after login send everyone to the home page; admins can access admin pages via the admin links
    navigate('/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  const requireAuth = (callback) => {
    if (!token) {
      navigate('/login');
      return;
    }
    callback();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, requireAuth, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);