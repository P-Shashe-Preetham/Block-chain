import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Fingerprint, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
export const IdentityModule = ({ algoAddress }) => {
    const [did, setDid] = useState("did:algo:subject001");
    const [pubKey, setPubKey] = useState("0x" + "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0");
    const [submitting, setSubmitting] = useState(false);
    const [registeredDid, setRegisteredDid] = useState(null);
    const handleRegister = async (e) => {
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
            }
            else {
                toast.error(`Registration error: ${data.detail}`);
            }
        }
        catch {
            toast.error("Failed to communicate with Identity Registry smart contract");
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsxs("div", { className: "glass-card", id: "identity", children: [_jsx("div", { className: "card-header-row", children: _jsxs("div", { className: "card-title-group", children: [_jsx("div", { className: "title-icon", children: _jsx(Fingerprint, { size: 18 }) }), _jsxs("div", { children: [_jsx("h2", { className: "card-title", children: "Module 01: On-Chain DID Identity Registry" }), _jsx("span", { style: { fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--accent-emerald)" }, children: "PyTeal Smart Contract (`identity_registry.teal`)" })] })] }) }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "2rem" }, children: [_jsxs("form", { onSubmit: handleRegister, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "SUBJECT DID (W3C COMPLIANT SPECIFICATION)" }), _jsx("input", { type: "text", required: true, className: "form-input", value: did, onChange: (e) => setDid(e.target.value) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "ED25519 / ECC PUBLIC KEY (HEX)" }), _jsx("input", { type: "text", required: true, className: "form-input", value: pubKey, onChange: (e) => setPubKey(e.target.value) })] }), _jsxs("button", { type: "submit", disabled: submitting, className: "btn-primary", style: { width: "100%", marginTop: "0.5rem" }, children: [_jsx(Send, { size: 15 }), _jsx("span", { children: submitting ? "Registering on Algorand..." : "Register DID Identity On-Chain" })] })] }), _jsxs("div", { style: { background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", justifyContent: "space-between" }, children: [_jsxs("div", { children: [_jsx("span", { className: "module-tag", children: "ZERO KNOWLEDGE PRIVACY" }), _jsx("h3", { style: { fontSize: "1rem", fontWeight: 700, margin: "0.75rem 0 0.5rem 0" }, children: "Fail-Closed Identity Standard" }), _jsxs("p", { style: { fontSize: "0.85rem", color: "var(--text-secondary)" }, children: ["No passwords, emails, or PII are stored on-chain. Only the SHA-256 hash digest", _jsx("code", { children: "keccak256(bytes(did))" }), " is indexed into PyTeal global state mapping."] })] }), registeredDid && (_jsxs("div", { style: { marginTop: "1rem", background: "rgba(16, 185, 129, 0.08)", padding: "0.85rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(16, 185, 129, 0.3)" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--accent-emerald)", fontWeight: 700, fontSize: "0.85rem" }, children: [_jsx(CheckCircle2, { size: 15 }), _jsx("span", { children: "REGISTERED ON ALGORAND" })] }), _jsxs("div", { style: { fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginTop: "0.4rem" }, children: [_jsxs("div", { children: [_jsx("strong", { children: "TxID:" }), " ", registeredDid.tx_id] }), _jsxs("div", { children: [_jsx("strong", { children: "Round:" }), " #", registeredDid.round || 1048576] })] })] }))] })] })] }));
};
