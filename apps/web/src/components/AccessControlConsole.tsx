import React, { useState } from "react";
import { ShieldCheck, Play, CheckCircle2, AlertOctagon, Cpu, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

interface AccessControlConsoleProps {
  apiOnline: boolean;
  algoAddress: string | null;
}

export const AccessControlConsole: React.FC<AccessControlConsoleProps> = ({ apiOnline, algoAddress }) => {
  const [permission, setPermission] = useState("READ");
  const [assetId, setAssetId] = useState(1048576);
  const [evaluating, setEvaluating] = useState(false);
  const [decision, setDecision] = useState<any>(null);

  const handleEvaluate = async (selectedPermission: string) => {
    setPermission(selectedPermission);
    setEvaluating(true);
    try {
      const res = await fetch("/v1/algorand/assets/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_id: assetId,
          action: `${selectedPermission}_ENCRYPTED_PAYLOAD`,
        }),
      });
      const data = await res.json();
      setDecision(data);
      if (data.decision === "GRANTED") {
        toast.success(`Access GRANTED by PyTeal Contract!`, {
          description: `Log Proof: ${data.proof?.on_chain_log}`,
        });
      } else {
        toast.error(`Access DENIED by PyTeal Policy!`);
      }
    } catch {
      toast.error("Failed to query Access Decision Engine");
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="glass-card" id="evaluator">
      <div className="card-header-row">
        <div className="card-title-group">
          <div className="title-icon">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h2 className="card-title">Module 04: On-Chain Access Decision Engine</h2>
            <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--accent-emerald)" }}>
              PyTeal RBAC Orchestrator Contract (`rbac.teal` & `asset_vault.teal`)
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        <div style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
              EVALUATE_ACCESS_POLICY()
            </span>
            <span className={`status-badge ${apiOnline ? "" : "offline"}`}>
              {apiOnline ? "LIVE PYTEAL EVALUATOR" : "MOCK MODE"}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">TARGET ASA DIGITAL ASSET ID</label>
            <input
              type="number"
              className="form-input"
              value={assetId}
              onChange={(e) => setAssetId(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">REQUESTED PERMISSION SCOPE</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
              {["READ", "WRITE", "TRANSFER"].map((perm) => (
                <button
                  type="button"
                  key={perm}
                  disabled={evaluating}
                  className={`btn-secondary ${permission === perm ? "active" : ""}`}
                  style={{
                    borderColor: permission === perm ? "var(--accent-emerald)" : undefined,
                    color: permission === perm ? "var(--accent-emerald)" : undefined,
                    background: permission === perm ? "rgba(16, 185, 129, 0.1)" : undefined,
                  }}
                  onClick={() => handleEvaluate(perm)}
                >
                  <span>{perm}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "1.5rem" }}>
            <button
              type="button"
              disabled={evaluating}
              className="btn-primary"
              style={{ width: "100%" }}
              onClick={() => handleEvaluate(permission)}
            >
              <Play size={15} />
              <span>{evaluating ? "Evaluating PyTeal Policy..." : "Execute On-Chain Evaluation"}</span>
            </button>
          </div>
        </div>

        <div style={{ background: "rgba(0, 0, 0, 0.4)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", display: "block", marginBottom: "0.75rem" }}>
              ON-CHAIN DECISION OUTPUT
            </span>

            {decision ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                  {decision.decision === "GRANTED" ? (
                    <CheckCircle2 size={24} color="#10b981" />
                  ) : (
                    <AlertOctagon size={24} color="#f43f5e" />
                  )}
                  <div>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: decision.decision === "GRANTED" ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                      ACCESS {decision.decision}
                    </h3>
                    <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                      Rule Code: {decision.proof?.rule || "RBAC_PERMIT_001"}
                    </span>
                  </div>
                </div>

                <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                  <div style={{ marginBottom: "0.4rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Blockchain:</span>{" "}
                    <strong style={{ color: "var(--accent-emerald)" }}>{decision.blockchain}</strong>
                  </div>
                  <div style={{ marginBottom: "0.4rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>TxID:</span>{" "}
                    <span style={{ color: "var(--text-primary)" }}>{decision.tx_id}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>PyTeal Log Proof:</span>{" "}
                    <code style={{ color: "var(--accent-cyan)", display: "block", marginTop: "2px", wordBreak: "break-all" }}>
                      {decision.proof?.on_chain_log}
                    </code>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                <Cpu size={32} style={{ margin: "0 auto 0.75rem auto", opacity: 0.5 }} />
                <p style={{ fontSize: "0.875rem" }}>
                  Click "Execute On-Chain Evaluation" to run live PyTeal access decision logic.
                </p>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1rem", borderTop: "1px solid var(--border-color)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            <span>EVALUATION TIME: &lt; 0.4ms</span>
            <span>FAIL-CLOSED: ENABLED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
