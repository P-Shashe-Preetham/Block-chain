import React from "react";
import { Key, Copy, RefreshCw, CheckCircle2, Shield, Wallet } from "lucide-react";
import { toast } from "sonner";

interface WalletCardProps {
  algoAddress: string | null;
  mnemonic: string | null;
  onGenerate: () => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({ algoAddress, mnemonic, onGenerate }) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="glass-card" id="wallet">
      <div className="card-header-row">
        <div className="card-title-group">
          <div className="title-icon">
            <Wallet size={18} />
          </div>
          <h2 className="card-title">Algorand Wallet & Cryptographic Keypair</h2>
        </div>
        <button type="button" className="btn-secondary" onClick={onGenerate}>
          <RefreshCw size={14} />
          <span>{algoAddress ? "Regenerate Keypair" : "Generate Keypair"}</span>
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: algoAddress ? "1.5fr 1fr" : "1fr", gap: "1.5rem" }}>
        <div style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
          <div className="form-group">
            <label className="form-label">ALGORAND PUBLIC ADDRESS (58 CHARS)</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                readOnly
                className="form-input"
                style={{ flex: 1 }}
                value={algoAddress || "Click 'Generate Keypair' to initialize an Algorand account..."}
              />
              {algoAddress && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => copyToClipboard(algoAddress, "Algorand Address")}
                >
                  <Copy size={14} />
                </button>
              )}
            </div>
          </div>

          {mnemonic && (
            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label className="form-label">24-WORD BIP39 MNEMONIC PASSPHRASE (PRIVATE)</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="password"
                  readOnly
                  className="form-input"
                  style={{ flex: 1, color: "var(--accent-amber)" }}
                  value={mnemonic}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => copyToClipboard(mnemonic, "Mnemonic Passphrase")}
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {algoAddress && (
          <div style={{ background: "rgba(16, 185, 129, 0.04)", padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid rgba(16, 185, 129, 0.2)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <Shield size={18} color="#10b981" />
                <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--accent-emerald)" }}>
                  ACCOUNT STATUS: READY
                </span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                Keypair successfully derived via <code>algosdk.account.generateAccount()</code>. 
                Ready for signing DID registrations and ASA minting transactions.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span style={{ fontSize: "0.8rem", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                ED25519 Elliptic Signature Ready
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
