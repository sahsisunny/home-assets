'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_ENDPOINTS, buildApiUrl } from '@home-assets/tokens';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role?: string;
}

export interface HouseholdInfo {
  id: string;
  name: string;
  plan?: string;
  ownerId?: string;
  members?: any[];
}

interface AuthContextType {
  user: UserProfile | null;
  household: HouseholdInfo | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword?: string;
    agreeToTerms?: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'home_assets_auth_token';
const USER_KEY = 'home_assets_auth_user';

export const AuthProvider: React.FC<{ children: any }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [household, setHousehold] = useState<HouseholdInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on initial load
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          const storedToken = localStorage.getItem(TOKEN_KEY);
          const storedUser = localStorage.getItem(USER_KEY);

          if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));

            // Verify with server /me endpoint
            try {
              const res = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.ME), {
                headers: {
                  Authorization: `Bearer ${storedToken}`,
                },
              });
              if (res.ok) {
                const json = await res.json();
                if (json.success && json.user) {
                  setUser(json.user);
                  setHousehold(json.household);
                  localStorage.setItem(USER_KEY, JSON.stringify(json.user));
                }
              }
            } catch (fetchErr) {
              // Server might be temporarily unreachable, keep stored session
              console.warn('Could not verify session with server:', fetchErr);
            }
          }
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (identifier: string, password?: string) => {
    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.LOGIN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: password || 'SecurePass@123' }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        return { success: false, error: json.error || 'Invalid credentials' };
      }

      setToken(json.token);
      setUser(json.user);
      setHousehold(json.household);

      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, json.token);
        localStorage.setItem(USER_KEY, JSON.stringify(json.user));
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred during login' };
    }
  };

  const register = async (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword?: string;
    agreeToTerms?: boolean;
  }) => {
    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.REGISTER), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          password: data.password,
          confirmPassword: data.confirmPassword || data.password,
          agreeToTerms: data.agreeToTerms !== undefined ? data.agreeToTerms : true,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const errorMsg = Array.isArray(json.error)
          ? json.error.map((e: any) => e.message).join(', ')
          : json.error || 'Registration failed';
        return { success: false, error: errorMsg };
      }

      setToken(json.token);
      setUser(json.user);
      setHousehold(json.household);

      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, json.token);
        localStorage.setItem(USER_KEY, JSON.stringify(json.user));
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during registration' };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(buildApiUrl(API_ENDPOINTS.AUTH.LOGOUT), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.warn('Logout request failed:', err);
    } finally {
      setToken(null);
      setUser(null);
      setHousehold(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.UPDATE_PROFILE), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || 'Profile update failed' };
      }

      const updatedUser = { ...user, ...json.user };
      setUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const refreshSession = async () => {
    if (!token) return;
    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.ME), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setUser(json.user);
          setHousehold(json.household);
        }
      }
    } catch (err) {
      console.error('Session refresh failed:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        household,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
