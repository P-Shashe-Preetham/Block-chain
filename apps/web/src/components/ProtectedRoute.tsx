'use client';

import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useWeb3 } from '@/contexts/Web3Context';
import { ShieldAlert, ArrowLeft, Shield, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole = 'admin' }: ProtectedRouteProps) {
  const { role, isConnected } = useWeb3();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isConnected) {
      setLocation('/login');
    }
  }, [isConnected, setLocation]);

  if (!isConnected) {
    return null; // Don't render until redirected
  }

  const userRole = role?.toLowerCase() || 'user';
  
  if (requiredRole && userRole !== requiredRole.toLowerCase()) {
    return (
      <div className="min-h-screen bg-[#030508] text-zinc-100 flex items-center justify-center p-6 select-none font-sans">
        <div className="max-w-md w-full p-8 rounded-2xl border border-red-500/20 bg-zinc-950/80 backdrop-blur-xl shadow-2xl text-center space-y-6">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400">
            <Lock className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono text-red-400 uppercase tracking-widest block">
              403 // ACCESS RESTRICTED
            </span>
            <h2 className="text-2xl font-serif text-white font-medium">
              Administrative Clearance Required
            </h2>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              The 3D Blockchain Explorer, Governance Console, and Asset Minting controls are
              restricted to administrators.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <button
              onClick={() => setLocation('/dashboard')}
              className="w-full py-2.5 px-4 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] text-zinc-400 hover:text-white text-xs transition-colors cursor-pointer flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to User Workspace</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
