import React from "react";
import { ShieldCheck, Github, ArrowUpRight } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <ShieldCheck size={20} color="#10b981" />
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
            ALGORAND SECURE PLATFORM • 2026
          </span>
        </div>

        <div>
          <span>Fail-Closed PyTeal Architecture • AES-256-GCM Vault • Vite React Web Console</span>
        </div>

        <a
          href="https://github.com/P-Shashe-Preetham/Blockchain-Based-Secure-Platform-for-Identity-Access-Control-and-Digital-Asset-Management"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-secondary)", textDecoration: "none" }}
        >
          <Github size={16} />
          <span>GitHub Repository</span>
          <ArrowUpRight size={14} />
        </a>
      </div>
    </footer>
  );
};
