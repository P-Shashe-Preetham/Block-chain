import React, { useState } from "react";
import { FileCode2, Lock, ShieldCheck, Cpu, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

export const AssetVaultModule: React.FC = () => {
  const [assetName, setAssetName] = useState("Confidential Financial Records");
  const [unitName, setUnitName] = useState("CFR1");
  const [payloadText, setPayloadText] = useState("CONFIDENTIAL PAYLOAD: Quarterly audit & security clearance token");
  const [encryptionKey, setEncryptionKey] = useState("01" + "23456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
  const [minting, setMinting] = useState(false);
  const [mintedAsset, setMintedAsset] = useState<any>(null);

  const handleMintAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMinting(true);
    try {
      const res = await fetch("/v1/algorand/assets/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_name: assetName,
          unit_name: unitName,
          payload_content: payloadText,
          encryption_key_hex: encryptionKey,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMintedAsset(data);
        toast.success(`ASA Digital Asset Minted!`, {
          description: `Asset ID: #${data.asset_id} | ASA Unit: ${data.unit_name}`,
        });
      } else {
        toast.error(`Minting error: ${data.detail}`);
      }
    } catch {
      toast.error("Failed to communicate with Asset Vault smart contract");
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="glass-card" id="vault">
      <div className="card-header-row">
        <div className="card-title-group">
          <div className="title-icon">
            <FileCode2 size={18} />
          </div>
          <div>
            <h2 className="card-title">Module 03: ASA Digital Asset & AES-256-GCM Vault</h2>
            <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}>
              Algorand ASA Standard + Off-Chain AES Envelope Encryption
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "2rem" }}>
        <form onSubmit={handleMintAsset}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">DIGITAL ASSET NAME</label>
              <input
                type="text"
                required
                className="form-input"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">ASA UNIT SYMBOL (3-6 CHARS)</label>
              <input
                type="text"
                required
                className="form-input"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">PLAINTEXT SENSITIVE PAYLOAD CONTENT</label>
            <textarea
              rows={2}
              required
              className="form-input"
              style={{ resize: "vertical" }}
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">256-BIT SYMMETRIC SECRET ENCRYPTION KEY (HEX)</label>
            <input
              type="text"
              required
              className="form-input"
              style={{ color: "var(--accent-amber)" }}
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={minting}
            className="btn-primary"
            style={{ width: "100%", marginTop: "0.5rem" }}
          >
            <Lock size={15} />
            <span>{minting ? "Encrypting & Minting ASA..." : "Encrypt & Mint ASA Asset On-Chain"}</span>
          </button>
        </form>

        <div style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <span className="module-tag" style={{ color: "var(--accent-cyan)", background: "rgba(6, 182, 212, 0.1)" }}>
              AES-256-GCM ENVELOPE
            </span>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0.75rem 0 0.5rem 0" }}>
              Off-Chain Ciphertext + On-Chain Hash Integrity
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              The sensitive payload is encrypted off-chain using AES-256-GCM (12-byte IV + 16-byte MAC tag). 
              Only the 32-byte SHA-256 hash digest is bound to the Algorand ASA URL metadata.
            </p>
          </div>

          {mintedAsset ? (
            <div style={{ marginTop: "1rem", background: "rgba(6, 182, 212, 0.08)", padding: "0.85rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(6, 182, 212, 0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--accent-cyan)", fontWeight: 700, fontSize: "0.85rem" }}>
                <ShieldCheck size={15} />
                <span>ASA MINTED: ID #{mintedAsset.asset_id}</span>
              </div>
              <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginTop: "0.4rem" }}>
                <div><strong>SHA-256 Digest:</strong> {mintedAsset.on_chain_hash_sha256?.slice(0, 20)}...</div>
                <div><strong>AES Ciphertext:</strong> {mintedAsset.encrypted_payload?.ciphertext_b64?.slice(0, 16)}...</div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "0.85rem", background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-color)", textAlign: "center" }}>
              <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                Awaiting ASA minting transaction...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
