import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { FileCode2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
export const AssetVaultModule = () => {
    const [assetName, setAssetName] = useState("Confidential Financial Records");
    const [unitName, setUnitName] = useState("CFR1");
    const [payloadText, setPayloadText] = useState("CONFIDENTIAL PAYLOAD: Quarterly audit & security clearance token");
    const [encryptionKey, setEncryptionKey] = useState("01" + "23456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
    const [minting, setMinting] = useState(false);
    const [mintedAsset, setMintedAsset] = useState(null);
    const handleMintAsset = async (e) => {
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
            }
            else {
                toast.error(`Minting error: ${data.detail}`);
            }
        }
        catch {
            toast.error("Failed to communicate with Asset Vault smart contract");
        }
        finally {
            setMinting(false);
        }
    };
    return (_jsxs("div", { className: "glass-card", id: "vault", children: [_jsx("div", { className: "card-header-row", children: _jsxs("div", { className: "card-title-group", children: [_jsx("div", { className: "title-icon", children: _jsx(FileCode2, { size: 18 }) }), _jsxs("div", { children: [_jsx("h2", { className: "card-title", children: "Module 03: ASA Digital Asset & AES-256-GCM Vault" }), _jsx("span", { style: { fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }, children: "Algorand ASA Standard + Off-Chain AES Envelope Encryption" })] })] }) }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "2rem" }, children: [_jsxs("form", { onSubmit: handleMintAsset, children: [_jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "DIGITAL ASSET NAME" }), _jsx("input", { type: "text", required: true, className: "form-input", value: assetName, onChange: (e) => setAssetName(e.target.value) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "ASA UNIT SYMBOL (3-6 CHARS)" }), _jsx("input", { type: "text", required: true, className: "form-input", value: unitName, onChange: (e) => setUnitName(e.target.value) })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "PLAINTEXT SENSITIVE PAYLOAD CONTENT" }), _jsx("textarea", { rows: 2, required: true, className: "form-input", style: { resize: "vertical" }, value: payloadText, onChange: (e) => setPayloadText(e.target.value) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "256-BIT SYMMETRIC SECRET ENCRYPTION KEY (HEX)" }), _jsx("input", { type: "text", required: true, className: "form-input", style: { color: "var(--accent-amber)" }, value: encryptionKey, onChange: (e) => setEncryptionKey(e.target.value) })] }), _jsxs("button", { type: "submit", disabled: minting, className: "btn-primary", style: { width: "100%", marginTop: "0.5rem" }, children: [_jsx(Lock, { size: 15 }), _jsx("span", { children: minting ? "Encrypting & Minting ASA..." : "Encrypt & Mint ASA Asset On-Chain" })] })] }), _jsxs("div", { style: { background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", justifyContent: "space-between" }, children: [_jsxs("div", { children: [_jsx("span", { className: "module-tag", style: { color: "var(--accent-cyan)", background: "rgba(6, 182, 212, 0.1)" }, children: "AES-256-GCM ENVELOPE" }), _jsx("h3", { style: { fontSize: "1rem", fontWeight: 700, margin: "0.75rem 0 0.5rem 0" }, children: "Off-Chain Ciphertext + On-Chain Hash Integrity" }), _jsx("p", { style: { fontSize: "0.85rem", color: "var(--text-secondary)" }, children: "The sensitive payload is encrypted off-chain using AES-256-GCM (12-byte IV + 16-byte MAC tag). Only the 32-byte SHA-256 hash digest is bound to the Algorand ASA URL metadata." })] }), mintedAsset ? (_jsxs("div", { style: { marginTop: "1rem", background: "rgba(6, 182, 212, 0.08)", padding: "0.85rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(6, 182, 212, 0.3)" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--accent-cyan)", fontWeight: 700, fontSize: "0.85rem" }, children: [_jsx(ShieldCheck, { size: 15 }), _jsxs("span", { children: ["ASA MINTED: ID #", mintedAsset.asset_id] })] }), _jsxs("div", { style: { fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginTop: "0.4rem" }, children: [_jsxs("div", { children: [_jsx("strong", { children: "SHA-256 Digest:" }), " ", mintedAsset.on_chain_hash_sha256?.slice(0, 20), "..."] }), _jsxs("div", { children: [_jsx("strong", { children: "AES Ciphertext:" }), " ", mintedAsset.encrypted_payload?.ciphertext_b64?.slice(0, 16), "..."] })] })] })) : (_jsx("div", { style: { padding: "0.85rem", background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-color)", textAlign: "center" }, children: _jsx("span", { style: { fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }, children: "Awaiting ASA minting transaction..." }) }))] })] })] }));
};
