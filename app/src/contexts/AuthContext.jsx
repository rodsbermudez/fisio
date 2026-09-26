import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const ADMIN_TOKEN_KEY = 'admin_token';
const AUTH_TOKEN_KEY = 'auth_token';
const IMPERSONATED_TENANT_KEY = 'impersonated_tenant';

function getStoredImpersonatedTenant() {
  try {
    const stored = localStorage.getItem(IMPERSONATED_TENANT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedTenant, setImpersonatedTenant] = useState(getStoredImpersonatedTenant);

  const isAuthenticated = !!user;
  const isImpersonating = !!impersonatedTenant;
  const isAdmin = isAuthenticated && user.role === 'admin' && !isImpersonating;

  // Check if user is already authenticated on mount
  useEffect(() => {
    let token = localStorage.getItem(AUTH_TOKEN_KEY);

    // Recover admin session if the browser is in an inconsistent state
    // (e.g., auth_token was cleared but admin_token still exists).
    if (!token) {
      const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (adminToken) {
        token = adminToken;
        localStorage.setItem(AUTH_TOKEN_KEY, adminToken);
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(IMPERSONATED_TENANT_KEY);
        setImpersonatedTenant(null);
      }
    }

    if (token) {
      api.get('/me')
        .then((response) => {
          setUser(response.data.user);
        })
        .catch(() => {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          localStorage.removeItem(IMPERSONATED_TENANT_KEY);
          setUser(null);
          setImpersonatedTenant(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const clearImpersonationStorage = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(IMPERSONATED_TENANT_KEY);
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await api.post('/login', { email, password });
    const { user, token } = response.data;

    // Clear any leftover impersonation state
    clearImpersonationStorage();
    setImpersonatedTenant(null);

    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setUser(user);

    return user;
  }, [clearImpersonationStorage]);

  const register = useCallback(async (data) => {
    const response = await api.post('/register', {
      name: data.name,
      email: data.email,
      password: data.password,
      password_confirmation: data.passwordConfirmation,
      tenant_type: data.tenantType,
      tenant_name: data.tenantName,
      tenant_document: data.tenantDocument,
      phone: data.phone,
      crm: data.crm,
    });

    const { user, token } = response.data;

    clearImpersonationStorage();
    setImpersonatedTenant(null);

    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setUser(user);

    return user;
  }, [clearImpersonationStorage]);

  const startImpersonation = useCallback(async (token, tenant) => {
    // Save admin token and switch to clinic token
    const adminToken = localStorage.getItem(AUTH_TOKEN_KEY);
    localStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(IMPERSONATED_TENANT_KEY, JSON.stringify(tenant));
    setImpersonatedTenant(tenant);

    // Refresh current user as the clinic owner
    const response = await api.get('/me');
    setUser(response.data.user);
  }, []);

  const stopImpersonation = useCallback(async () => {
    try {
      // Revoke the temporary clinic token
      await api.post('/logout');
    } catch (error) {
      console.error('Erro ao encerrar impersonação:', error);
    }

    const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (adminToken) {
      localStorage.setItem(AUTH_TOKEN_KEY, adminToken);
    }
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(IMPERSONATED_TENANT_KEY);
    setImpersonatedTenant(null);

    // Refresh current user as admin
    if (adminToken) {
      const response = await api.get('/me');
      setUser(response.data.user);
    } else {
      setUser(null);
    }
  }, []);

  const logout = useCallback(async () => {
    // If impersonating a clinic, "Sair" means return to the admin panel
    // instead of fully logging out.
    if (impersonatedTenant) {
      await stopImpersonation();
      return;
    }

    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(IMPERSONATED_TENANT_KEY);
      setUser(null);
      setImpersonatedTenant(null);
    }
  }, [impersonatedTenant, stopImpersonation]);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    isAdmin,
    isImpersonating,
    impersonatedTenant,
    startImpersonation,
    stopImpersonation,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
