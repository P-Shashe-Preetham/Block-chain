'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useWeb3 } from './Web3Context';
import { toast } from 'sonner';

export type UserRole = 'admin' | 'user';

interface AuthContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isAdmin: boolean;
  isUser: boolean;
  userName: string;
  userWallet: string;
  toggleRole: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const web3 = useWeb3();

  const role = (web3.role?.toLowerCase() as UserRole) || 'user';
  const userName = web3.userName || 'Anonymous User';
  const userWallet = web3.account || '';

  const setRole = (newRole: UserRole) => {
    toast.info('Role is determined by your wallet');
  };

  const toggleRole = () => {
    toast.info('Role is determined by your wallet');
  };

  const value = useMemo(
    () => ({
      role,
      setRole,
      isAdmin: role === 'admin',
      isUser: role === 'user',
      userName,
      userWallet,
      toggleRole,
    }),
    [role, userName, userWallet]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
