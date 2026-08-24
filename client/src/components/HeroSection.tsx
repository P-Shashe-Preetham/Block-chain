import React from "react";
import { ArrowRight, ShieldCheck, Lock, Database, Cpu, Activity, CheckCircle2 } from "lucide-react";

interface HeroSectionProps {
  onExplore: () => void;
  onConnectWallet: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExplore, onConnectWallet }) => {
  return (
    <section className="hero-wrapper" id="top">
      <div className="hero-content">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <span className="module-tag">PRODUCTION READY • ALGORAND BACKED</span>
        </div>
        
        <h1>
          Blockchain-Backed <br />
          <span className="gradient-text">Secure Identity & Asset Vault</span>
        </h1>
        
        <p className="hero-description">
          A fail-closed zero-trust architecture combining PyTeal smart contracts, 
          AES-256-GCM encrypted off-chain storage, and immutable on-chain audit projections.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button type="button" className="btn-primary" onClick={onExplore}>
            <span>Explore Live Dashboard</span>
            <ArrowRight size={16} />
          </button>
          <button type="button" className="btn-secondary" onClick={onConnectWallet}>
            <Lock size={16} />
            <span>Generate Keypair</span>
          </button>
        </div>

        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-value">3</span>
            <span className="stat-label">PyTeal Smart Contracts</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">256-bit</span>
            <span className="stat-label">AES-GCM Encryption</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">97 / 97</span>
            <span className="stat-label">Verified Test Suite</span>
          </div>
        </div>
      </div>

      <div className="trust-art-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Activity size={18} color="#10b981" />
            <span style={{ fontSize: "0.85rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#10b981" }}>
              LIVE TRUST MATRIX
            </span>
          </div>
          <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            ROUND #1048576
          </span>
        </div>

        {/* Visual Trust Graph SVG */}
        <div style={{ background: "rgba(0, 0, 0, 0.4)", borderRadius: "var(--radius-lg)", padding: "1.5rem", border: "1px solid var(--border-color)" }}>
          <svg viewBox="0 0 400 200" style={{ width: "100%", height: "auto" }}>
            <defs>
              <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Connecting Lines */}
            <path d="M 60 100 L 200 40 M 60 100 L 200 160 M 200 40 L 340 100 M 200 160 L 340 100 M 200 40 L 200 160" 
                  stroke="rgba(16, 185, 129, 0.3)" strokeWidth="2" strokeDasharray="4 4" />
            
            {/* Animated Pulses */}
            <circle cx="130" cy="70" r="4" fill="#10b981">
              <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="270" cy="130" r="4" fill="#06b6d4">
              <animate attributeName="opacity" values="0.2;1;0.2" dur="2.5s" repeatCount="indefinite" />
            </circle>

            {/* Nodes */}
            <g transform="translate(60, 100)">
              <circle r="22" fill="#0d111a" stroke="#10b981" strokeWidth="2" filter="url(#glow)" />
              <text textAnchor="middle" dy="4" fill="#10b981" fontSize="10" fontFamily="var(--font-mono)" fontWeight="bold">DID</text>
            </g>

            <g transform="translate(200, 40)">
              <circle r="22" fill="#0d111a" stroke="#06b6d4" strokeWidth="2" filter="url(#glow)" />
              <text textAnchor="middle" dy="4" fill="#06b6d4" fontSize="10" fontFamily="var(--font-mono)" fontWeight="bold">RBAC</text>
            </g>

            <g transform="translate(200, 160)">
              <circle r="22" fill="#0d111a" stroke="#f59e0b" strokeWidth="2" filter="url(#glow)" />
              <text textAnchor="middle" dy="4" fill="#f59e0b" fontSize="10" fontFamily="var(--font-mono)" fontWeight="bold">VAULT</text>
            </g>

            <g transform="translate(340, 100)">
              <circle r="24" fill="#0d111a" stroke="#10b981" strokeWidth="2.5" filter="url(#glow)" />
              <text textAnchor="middle" dy="4" fill="#10b981" fontSize="10" fontFamily="var(--font-mono)" fontWeight="bold">POLICY</text>
            </g>
          </svg>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1.25rem" }}>
          <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", fontFamily: "var(--font-mono)" }}>ON-CHAIN VERIFICATION</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-emerald)" }}>PASS (100% Fail-Closed)</span>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", fontFamily: "var(--font-mono)" }}>DATA PRIVACY</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-cyan)" }}>ZERO PLAINTEXT ON-CHAIN</span>
          </div>
        </div>
      </div>
    </section>
  );
};
