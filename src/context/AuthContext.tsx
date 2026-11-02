import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Address } from '../types/index.ts';
import { apiRequest, getStoredToken, setStoredToken } from '../services/api.ts';

export interface RegisterPayload {
  full_name: string;
  mobile_number?: string;
  phone?: string;
  email: string;
  password: string;
  address?: string;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (payload: {
    full_name?: string;
    phone?: string;
    mobile_number?: string;
    current_password?: string;
    new_password?: string;
  }) => Promise<void>;
  addAddress: (payload: Omit<Address, 'id' | 'user_id'>) => Promise<void>;
  deleteAddress: (id: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await apiRequest<{ success: boolean; user: User }>('/api/auth/me');
      if (data?.user && data.user.full_name) {
        setUser(data.user);
      } else {
        setStoredToken(null);
        setUser(null);
      }
    } catch {
      setStoredToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await apiRequest<{
      success: boolean;
      token: string;
      user: User;
      message?: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim(),
        password,
      }),
    });

    if (!data?.success || !data?.user || !data?.user?.full_name || !data?.token) {
      throw new Error(data?.message || 'Login failed: Invalid user response from server.');
    }

    setStoredToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload: RegisterPayload): Promise<User> => {
    const cleanFullName = (payload.full_name || '').trim();
    const cleanMobile = (payload.mobile_number || payload.phone || '').trim();
    const cleanEmail = (payload.email || '').trim().toLowerCase();
    const cleanAddress = (payload.address || payload.street_address || '').trim();

    const requestBody: Record<string, any> = {
      full_name: cleanFullName,
      mobile_number: cleanMobile,
      phone: cleanMobile,
      email: cleanEmail,
      password: payload.password,
    };

    if (cleanAddress.length > 0) {
      requestBody.address = cleanAddress;
      requestBody.street_address = cleanAddress;
      requestBody.city = (payload.city || 'Mumbai').trim() || 'Mumbai';
      requestBody.state = (payload.state || 'Maharashtra').trim() || 'Maharashtra';
      requestBody.postal_code = (payload.postal_code || '400001').trim() || '400001';
    }

    const data = await apiRequest<{
      success: boolean;
      token: string;
      user: User;
      message?: string;
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (!data?.success || !data?.user || !data?.user?.full_name || !data?.token) {
      throw new Error(
        data?.message || 'Registration failed: Customer record was not returned by server.'
      );
    }

    setStoredToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
  };

  const updateProfile = async (payload: {
    full_name?: string;
    phone?: string;
    mobile_number?: string;
    current_password?: string;
    new_password?: string;
  }) => {
    const data = await apiRequest<{ success: boolean; user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (data?.user && data.user.full_name) {
      setUser(data.user);
    }
  };

  const addAddress = async (payload: Omit<Address, 'id' | 'user_id'>) => {
    const data = await apiRequest<{ success: boolean; addresses: Address[] }>(
      '/api/auth/addresses',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    if (user && Array.isArray(data?.addresses)) {
      setUser({ ...user, addresses: data.addresses });
    }
  };

  const deleteAddress = async (id: number) => {
    const data = await apiRequest<{ success: boolean; addresses: Address[] }>(
      `/api/auth/addresses/${id}`,
      {
        method: 'DELETE',
      }
    );
    if (user && Array.isArray(data?.addresses)) {
      setUser({ ...user, addresses: data.addresses });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
        addAddress,
        deleteAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
