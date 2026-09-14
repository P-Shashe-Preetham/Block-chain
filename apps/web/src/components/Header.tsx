import React from "react";
import { ShieldCheck, LogOut, Wallet } from "lucide-react";
import { useWeb3 } from "@/contexts/Web3Context";

interface HeaderProps {
  onScrollTo: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onScrollTo,
}) => {
  const { isConnected, account, role, connectWallet, disconnectWallet } = useWeb3();

  const getRoleColor = (roleStr?: string | null) => {
    switch (roleStr?.toUpperCase()) {
      case 'ADMIN': return 'bg-red-950/40 border-red-500/30 text-red-400';
      case 'MANAGER': return 'bg-blue-950/40 border-blue-500/30 text-blue-400';
      case 'AUDITOR': return 'bg-amber-950/40 border-amber-500/30 text-amber-400';
      default: return 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400';
    }
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <a href="#top" className="brand-logo" onClick={() => onScrollTo("top")}>
          <div className="brand-icon">
            <ShieldCheck size={22} />
          </div>
          <div className="brand-text">
            <span className="title">BEL DIGITAL ASSET PLATFORM</span>
            <span className="subtitle">IDENTITY • ACCESS • VAULT</span>
          </div>
        </a>

        <nav className="nav-links">
          <button type="button" className="nav-link" onClick={() => onScrollTo("wallet")}>
            Wallet
          </button>
          <button type="button" className="nav-link" onClick={() => onScrollTo("identity")}>
            Identity DID
          </button>
          <button type="button" className="nav-link" onClick={() => onScrollTo("vault")}>
            Asset Vault
          </button>
          <button type="button" className="nav-link" onClick={() => onScrollTo("evaluator")}>
            Access Evaluator
          </button>
          <button type="button" className="nav-link" onClick={() => onScrollTo("audit")}>
            Audit Stream
          </button>
          <a href="/dashboard" className="nav-link" style={{ color: "var(--copper-bright)", fontWeight: 600 }}>
            3D Blockchain
          </a>
        </nav>

        <div className="header-status-group">
          {isConnected ? (
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 text-[10px] font-mono border rounded ${getRoleColor(role)}`}>
                {role?.toUpperCase() || 'USER'}
              </span>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
                <Wallet size={14} className="text-zinc-400" />
                <span>{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : ''}</span>
              </div>
              <button onClick={disconnectWallet} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Disconnect">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button type="button" className="btn-primary" onClick={connectWallet}>
              <Wallet size={16} />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
