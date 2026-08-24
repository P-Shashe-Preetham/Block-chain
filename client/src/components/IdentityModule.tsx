import React, { useState } from "react";
import { Fingerprint, UserCheck, Send, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface IdentityModuleProps {
  algoAddress: string | null;
}

export const IdentityModule: React.FC<IdentityModuleProps> = ({ algoAddress }) => {
  const [did, setDid] = useState("did:algo:subject001");
  const [pubKey, setPubKey] = useState(
    "0x" + "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0"
  );
  const [submitting, setSubmitting] = useState(false);
  const [registeredDid, setRegisteredDid] = useState<any>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/v1/algorand/identities/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_did: did,
          public_key: pubKey,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setRegisteredDid(data);
        toast.success(`Identity Registered!`, {
          description: `DID: ${data.did} | Hash: ${data.did_hash?.slice(0, 16)}...`,
        });
      } else {
        toast.error(`Registration error: ${data.detail}`);
      }
    } catch {
      toast.error("Failed to communicate with Identity Registry smart contract");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-card" id="identity">
      <div className="card-header-row">
        <div className="card-title-group">
          <div className="title-icon">
            <Fingerprint size={18} />
          </div>
          <div>
            <h2 className="card-title">Module 01: On-Chain DID Identity Registry</h2>
            <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--accent-emerald)" }}>
              PyTeal Smart Contract (`identity_registry.teal`)
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "2rem" }}>
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">SUBJECT DID (W3C COMPLIANT SPECIFICATION)</label>
            <input
              type="text"
              required
              className="form-input"
              value={did}
              onChange={(e) => setDid(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">ED25519 / ECC PUBLIC KEY (HEX)</label>
            <input
              type="text"
              required
              className="form-input"
              value={pubKey}
              onChange={(e) => setPubKey(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
            style={{ width: "100%", marginTop: "0.5rem" }}
          >
            <Send size={15} />
            <span>{submitting ? "Registering on Algorand..." : "Register DID Identity On-Chain"}</span>
          </button>
        </form>

        <div style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <span className="module-tag">ZERO KNOWLEDGE PRIVACY</span>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0.75rem 0 0.5rem 0" }}>
              Fail-Closed Identity Standard
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              No passwords, emails, or PII are stored on-chain. Only the SHA-256 hash digest 
              <code>keccak256(bytes(did))</code> is indexed into PyTeal global state mapping.
            </p>
          </div>

          {registeredDid && (
            <div style={{ marginTop: "1rem", background: "rgba(16, 185, 129, 0.08)", padding: "0.85rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--accent-emerald)", fontWeight: 700, fontSize: "0.85rem" }}>
                <CheckCircle2 size={15} />
                <span>REGISTERED ON ALGORAND</span>
              </div>
              <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginTop: "0.4rem" }}>
                <div><strong>TxID:</strong> {registeredDid.tx_id}</div>
                <div><strong>Round:</strong> #{registeredDid.round || 1048576}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
