import React from "react";
import { ShieldCheck, Cpu, Key, ArrowUpRight, CheckCircle2, AlertTriangle } from "lucide-react";

interface HeaderProps {
  apiOnline: boolean;
  algoAddress: string | null;
  onConnectWallet: () => void;
  onScrollTo: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  apiOnline,
  algoAddress,
  onConnectWallet,
  onScrollTo,
}) => {
  return (
    <header className="app-header">
      <div className="header-container">
        <a href="#top" className="brand-logo" onClick={() => onScrollTo("top")}>
          <div className="brand-icon">
            <ShieldCheck size={22} />
          </div>
          <div className="brand-text">
            <span className="title">ALGORAND SECURE PLATFORM</span>
            <span className="subtitle">IDENTITY • ACCESS • VAULT</span>
          </div>
        </a>

        <nav className="nav-links">
          <button type="button" className="nav-link" onClick={() => onScrollTo("wallet")}>
            Wallet / Keypair
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
        </nav>

        <div className="header-status-group">
          <div className={`status-badge ${apiOnline ? "" : "offline"}`}>
            <span className="pulse-dot" />
            <span>{apiOnline ? "FASTAPI + ALGORAND ONLINE" : "OFFLINE / LOCAL"}</span>
          </div>

          <button type="button" className="btn-primary" onClick={onConnectWallet}>
            <Key size={16} />
            <span>
              {algoAddress
                ? `${algoAddress.slice(0, 6)}...${algoAddress.slice(-4)}`
                : "Connect Wallet"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
