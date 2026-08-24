import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { ShieldCheck, Play, CheckCircle2, AlertOctagon, Cpu } from "lucide-react";
import { toast } from "sonner";
export const AccessControlConsole = ({ apiOnline, algoAddress }) => {
    const [permission, setPermission] = useState("READ");
    const [assetId, setAssetId] = useState(1048576);
    const [evaluating, setEvaluating] = useState(false);
    const [decision, setDecision] = useState(null);
    const handleEvaluate = async (selectedPermission) => {
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
            }
            else {
                toast.error(`Access DENIED by PyTeal Policy!`);
            }
        }
        catch {
            toast.error("Failed to query Access Decision Engine");
        }
        finally {
            setEvaluating(false);
        }
    };
    return (_jsxs("div", { className: "glass-card", id: "evaluator", children: [_jsx("div", { className: "card-header-row", children: _jsxs("div", { className: "card-title-group", children: [_jsx("div", { className: "title-icon", children: _jsx(ShieldCheck, { size: 18 }) }), _jsxs("div", { children: [_jsx("h2", { className: "card-title", children: "Module 04: On-Chain Access Decision Engine" }), _jsx("span", { style: { fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--accent-emerald)" }, children: "PyTeal RBAC Orchestrator Contract (`rbac.teal` & `asset_vault.teal`)" })] })] }) }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }, children: [_jsxs("div", { style: { background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }, children: [_jsx("span", { style: { fontSize: "0.8rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }, children: "EVALUATE_ACCESS_POLICY()" }), _jsx("span", { className: `status-badge ${apiOnline ? "" : "offline"}`, children: apiOnline ? "LIVE PYTEAL EVALUATOR" : "MOCK MODE" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "TARGET ASA DIGITAL ASSET ID" }), _jsx("input", { type: "number", className: "form-input", value: assetId, onChange: (e) => setAssetId(Number(e.target.value)) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "REQUESTED PERMISSION SCOPE" }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }, children: ["READ", "WRITE", "TRANSFER"].map((perm) => (_jsx("button", { type: "button", disabled: evaluating, className: `btn-secondary ${permission === perm ? "active" : ""}`, style: {
                                                borderColor: permission === perm ? "var(--accent-emerald)" : undefined,
                                                color: permission === perm ? "var(--accent-emerald)" : undefined,
                                                background: permission === perm ? "rgba(16, 185, 129, 0.1)" : undefined,
                                            }, onClick: () => handleEvaluate(perm), children: _jsx("span", { children: perm }) }, perm))) })] }), _jsx("div", { style: { marginTop: "1.5rem" }, children: _jsxs("button", { type: "button", disabled: evaluating, className: "btn-primary", style: { width: "100%" }, onClick: () => handleEvaluate(permission), children: [_jsx(Play, { size: 15 }), _jsx("span", { children: evaluating ? "Evaluating PyTeal Policy..." : "Execute On-Chain Evaluation" })] }) })] }), _jsxs("div", { style: { background: "rgba(0, 0, 0, 0.4)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", justifyContent: "space-between" }, children: [_jsxs("div", { children: [_jsx("span", { style: { fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", display: "block", marginBottom: "0.75rem" }, children: "ON-CHAIN DECISION OUTPUT" }), decision ? (_jsxs("div", { children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }, children: [decision.decision === "GRANTED" ? (_jsx(CheckCircle2, { size: 24, color: "#10b981" })) : (_jsx(AlertOctagon, { size: 24, color: "#f43f5e" })), _jsxs("div", { children: [_jsxs("h3", { style: { fontSize: "1.2rem", fontWeight: 800, color: decision.decision === "GRANTED" ? "var(--accent-emerald)" : "var(--accent-rose)" }, children: ["ACCESS ", decision.decision] }), _jsxs("span", { style: { fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }, children: ["Rule Code: ", decision.proof?.rule || "RBAC_PERMIT_001"] })] })] }), _jsxs("div", { style: { background: "rgba(255, 255, 255, 0.03)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }, children: [_jsxs("div", { style: { marginBottom: "0.4rem" }, children: [_jsx("span", { style: { color: "var(--text-muted)" }, children: "Blockchain:" }), " ", _jsx("strong", { style: { color: "var(--accent-emerald)" }, children: decision.blockchain })] }), _jsxs("div", { style: { marginBottom: "0.4rem" }, children: [_jsx("span", { style: { color: "var(--text-muted)" }, children: "TxID:" }), " ", _jsx("span", { style: { color: "var(--text-primary)" }, children: decision.tx_id })] }), _jsxs("div", { children: [_jsx("span", { style: { color: "var(--text-muted)" }, children: "PyTeal Log Proof:" }), " ", _jsx("code", { style: { color: "var(--accent-cyan)", display: "block", marginTop: "2px", wordBreak: "break-all" }, children: decision.proof?.on_chain_log })] })] })] })) : (_jsxs("div", { style: { padding: "2rem", textAlign: "center", color: "var(--text-muted)" }, children: [_jsx(Cpu, { size: 32, style: { margin: "0 auto 0.75rem auto", opacity: 0.5 } }), _jsx("p", { style: { fontSize: "0.875rem" }, children: "Click \"Execute On-Chain Evaluation\" to run live PyTeal access decision logic." })] }))] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1rem", borderTop: "1px solid var(--border-color)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }, children: [_jsx("span", { children: "EVALUATION TIME: < 0.4ms" }), _jsx("span", { children: "FAIL-CLOSED: ENABLED" })] })] })] })] }));
};
