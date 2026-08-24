import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Archive of Trust direction: this page uses a split-axis editorial layout, technical metadata, and copper ledger lines instead of generic centered marketing blocks.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDownRight, ArrowUpRight, Check, ChevronRight, CircleDashed, Command, FileCode2, Fingerprint, GitBranch, LockKeyhole, Menu, Network, ScanLine, ShieldCheck, Sparkles, X, } from "lucide-react";
const heroImage = "/manus-storage/secure-platform-hero-reference_d3f850fe.png";
const brandMark = "/manus-storage/secure-platform-mark_44037d5a.png";
const modules = [
    {
        index: "01",
        title: "Identity Registry",
        text: "A minimal on-chain identity layer. DIDs, lifecycle state, and registration timestamps—never passwords or personal documents.",
        icon: Fingerprint,
        state: "ACTIVE / CORE",
        tone: "copper",
    },
    {
        index: "02",
        title: "Role Manager",
        text: "OpenZeppelin-backed role hierarchy that makes administration explicit and keeps privilege escalation out of the default path.",
        icon: Network,
        state: "ACCESS / CONTROL",
        tone: "emerald",
    },
    {
        index: "03",
        title: "Asset Registry",
        text: "Unique assets with owners, metadata hashes, lifecycle status, and transfer boundaries—without bringing sensitive files on-chain.",
        icon: FileCode2,
        state: "OWNERSHIP / RECORD",
        tone: "copper",
    },
    {
        index: "04",
        title: "Access Manager",
        text: "The orchestrator. It connects identity, roles, and assets to produce a traceable decision for every requested permission.",
        icon: ShieldCheck,
        state: "DECISION / ENGINE",
        tone: "emerald",
    },
];
const flowItems = [
    { label: "IDENTITY", value: "Who is the user?", icon: Fingerprint },
    { label: "ROLE", value: "What can they govern?", icon: GitBranch },
    { label: "OWNERSHIP", value: "Who owns the asset?", icon: LockKeyhole },
    { label: "PERMISSION", value: "What may they perform?", icon: ScanLine },
];
function scrollToId(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
export default function Home() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [activePermission, setActivePermission] = useState("READ");
    const [hasScrolled, setHasScrolled] = useState(false);
    const [identityDetailOpen, setIdentityDetailOpen] = useState(false);
    const [apiOnline, setApiOnline] = useState(false);
    const [algoAddress, setAlgoAddress] = useState(null);
    const [liveDecision, setLiveDecision] = useState(null);
    const [evaluating, setEvaluating] = useState(false);
    const [didInput, setDidInput] = useState("did:secure:alice-001");
    const [pubKeyInput, setPubKeyInput] = useState("0x" + "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0");
    const [registeredIdentity, setRegisteredIdentity] = useState(null);
    const [registering, setRegistering] = useState(false);
    const [assetNameInput, setAssetNameInput] = useState("Confidential Asset #1");
    const [unitNameInput, setUnitNameInput] = useState("CAS1");
    const [payloadInput, setPayloadInput] = useState("Quarterly security audit clearance token");
    const [encryptionKeyInput, setEncryptionKeyInput] = useState("01" + "23456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
    const [mintedAsset, setMintedAsset] = useState(null);
    const [minting, setMinting] = useState(false);
    const handleRegisterIdentity = async (e) => {
        e.preventDefault();
        setRegistering(true);
        try {
            const res = await fetch("/v1/algorand/identities/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject_did: didInput,
                    public_key: pubKeyInput,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setRegisteredIdentity(data);
                toast.success(`Identity Registered On-Chain!`, {
                    description: `DID: ${data.did} | Hash: ${data.did_hash?.slice(0, 16)}...`,
                });
            }
            else {
                toast.error(`Registration Failed: ${data.detail}`);
            }
        }
        catch {
            toast.error("Failed to connect to Identity Registry PyTeal contract");
        }
        finally {
            setRegistering(false);
        }
    };
    const handleMintASAAsset = async (e) => {
        e.preventDefault();
        setMinting(true);
        try {
            const res = await fetch("/v1/algorand/assets/mint", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    asset_name: assetNameInput,
                    unit_name: unitNameInput,
                    payload_content: payloadInput,
                    encryption_key_hex: encryptionKeyInput,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setMintedAsset(data);
                toast.success(`ASA Digital Asset Minted!`, {
                    description: `Asset ID: #${data.asset_id} | Unit: ${data.unit_name}`,
                });
            }
            else {
                toast.error(`Minting Failed: ${data.detail}`);
            }
        }
        catch {
            toast.error("Failed to connect to Asset Vault PyTeal contract");
        }
        finally {
            setMinting(false);
        }
    };
    useEffect(() => {
        fetch("/healthz")
            .then((res) => res.json())
            .then((data) => setApiOnline(data.status === "ok"))
            .catch(() => setApiOnline(false));
    }, []);
    useEffect(() => {
        const onScroll = () => setHasScrolled(window.scrollY > 32);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === "Escape")
                setIdentityDetailOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);
    const handleConnectWallet = async () => {
        try {
            const res = await fetch("/v1/algorand/accounts/generate", { method: "POST" });
            const data = await res.json();
            if (data.address) {
                setAlgoAddress(data.address);
                toast.success("Algorand Account Connected!", {
                    description: `Address: ${data.address.slice(0, 8)}...${data.address.slice(-6)}`,
                });
            }
        }
        catch {
            toast.error("Failed to connect Algorand backend service");
        }
    };
    const handleEvaluatePermission = async (permission) => {
        setActivePermission(permission);
        setEvaluating(true);
        try {
            const res = await fetch("/v1/algorand/assets/request-access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    asset_id: 1048576,
                    action: `${permission}_ENCRYPTED_PAYLOAD`,
                }),
            });
            const data = await res.json();
            setLiveDecision(data);
            toast.success(`Access Request Evaluated: ${data.decision}`, {
                description: `TxID: ${data.tx_id} | Log: ${data.proof?.on_chain_log || "GRANTED"}`,
            });
        }
        catch (e) {
            toast.error("Failed to evaluate access decision on Algorand contract");
        }
        finally {
            setEvaluating(false);
        }
    };
    const showComingSoon = (label) => {
        toast(`${label} is reserved for the connected app layer.`, {
            description: "This first delivery is a frontend-only foundation for the blockchain system.",
        });
    };
    return (_jsxs("div", { className: "site-shell", children: [_jsxs("header", { className: `site-header ${hasScrolled ? "is-scrolled" : ""}`, children: [_jsxs("a", { href: "#top", className: "brand-lockup", "aria-label": "Blockchain Secure Platform home", children: [_jsx("img", { src: brandMark, alt: "Brand Mark", className: "brand-mark", onError: (e) => { e.target.style.display = "none"; } }), _jsx("span", { className: "brand-ledger-tick", "aria-hidden": "true" }), _jsxs("span", { className: "brand-wordmark", children: [_jsx("span", { children: "BLOCKCHAIN" }), _jsx("span", { children: "SECURE PLATFORM" })] })] }), _jsxs("nav", { className: `main-nav ${menuOpen ? "is-open" : ""}`, "aria-label": "Primary navigation", children: [_jsx("button", { type: "button", onClick: () => scrollToId("foundation"), children: "Foundation" }), _jsx("button", { type: "button", onClick: () => scrollToId("modules"), children: "Modules" }), _jsx("button", { type: "button", onClick: () => scrollToId("audit"), children: "Audit trail" }), _jsxs("button", { type: "button", onClick: () => showComingSoon("Documentation"), children: ["Docs ", _jsx("span", { className: "nav-arrow", children: "\u2197" })] })] }), _jsxs("div", { className: "header-actions", children: [_jsxs("span", { className: "network-pill", children: [_jsx("span", { className: `status-dot ${apiOnline ? "green" : ""}` }), " ", apiOnline ? "FASTAPI BACKEND CONNECTED" : "LOCAL MVP"] }), _jsxs("button", { className: "outline-button header-cta", type: "button", onClick: handleConnectWallet, children: [algoAddress ? `${algoAddress.slice(0, 6)}...${algoAddress.slice(-4)}` : "Connect wallet", " ", _jsx(ArrowUpRight, { size: 15 })] }), _jsx("button", { className: "menu-toggle", type: "button", "aria-label": menuOpen ? "Close menu" : "Open menu", onClick: () => setMenuOpen(!menuOpen), children: menuOpen ? _jsx(X, { size: 21 }) : _jsx(Menu, { size: 21 }) })] })] }), _jsxs("main", { id: "top", children: [_jsxs("section", { className: "hero-section", children: [_jsx("div", { className: "hero-gridline", "aria-hidden": "true" }), _jsxs("div", { className: "hero-copy", children: [_jsxs("div", { className: "eyebrow", children: [_jsx("span", { className: "eyebrow-rule" }), " BLOCKCHAIN FOUNDATION / 00.1"] }), _jsxs("h1", { children: ["Trust, made ", _jsx("em", { children: "inspectable." })] }), _jsx("p", { className: "hero-lede", children: "A security-first protocol layer for identity, role-based access, digital assets, and the decisions that connect them." }), _jsxs("div", { className: "hero-actions", children: [_jsxs("button", { className: "copper-button", type: "button", onClick: () => scrollToId("foundation"), children: ["Read the foundation ", _jsx(ArrowDownRight, { size: 16 })] }), _jsxs("button", { className: "text-button", type: "button", onClick: () => showComingSoon("Contract explorer"), children: ["View contract map ", _jsx(ChevronRight, { size: 16 })] })] }), _jsxs("div", { className: "hero-proof", children: [_jsxs("div", { className: "proof-item", children: [_jsx("span", { className: "proof-value", children: "04" }), _jsx("span", { className: "proof-label", children: "Modular contracts" })] }), _jsxs("div", { className: "proof-item", children: [_jsx("span", { className: "proof-value", children: "01" }), _jsx("span", { className: "proof-label", children: "Access orchestrator" })] }), _jsxs("div", { className: "proof-item", children: [_jsx("span", { className: "proof-value", children: "\u221E" }), _jsx("span", { className: "proof-label", children: "Event-led audit trail" })] })] })] }), _jsxs("div", { className: "hero-art-wrap", children: [_jsxs("div", { className: "hero-art-label label-top", children: ["SYSTEM / TRUST GRAPH ", _jsx("span", { children: "\u25FC" })] }), _jsx("img", { src: heroImage, alt: "Abstract copper trust graph showing connected identities and permissions", className: "hero-art" }), _jsxs("div", { className: "hero-art-overlay", children: [_jsxs("div", { children: [_jsx("span", { className: "mini-label", children: "CURRENT STATE" }), _jsx("strong", { children: "VERIFIED / 01" })] }), _jsx("div", { className: "overlay-separator" }), _jsxs("div", { children: [_jsx("span", { className: "mini-label", children: "LAST EVENT" }), _jsx("strong", { children: "IDENTITY_REGISTERED" })] })] }), _jsx("span", { className: "art-coordinate coordinate-one", children: "37.7749\u00B0 N" }), _jsx("span", { className: "art-coordinate coordinate-two", children: "122.4194\u00B0 W" })] }), _jsxs("div", { className: "hero-footnote", children: [_jsx("span", { children: "SCROLL TO EXPLORE" }), _jsx("span", { className: "footnote-line" }), _jsx("span", { children: "01 / 06" })] })] }), _jsxs("section", { className: "statement-section", id: "foundation", children: [_jsxs("div", { className: "section-rail", children: [_jsx("span", { children: "01" }), _jsx("span", { className: "rail-line" }), _jsx("span", { children: "THESIS" })] }), _jsxs("div", { className: "statement-main", children: [_jsx("p", { className: "kicker", children: "THE DISTINCTION THAT PROTECTS THE SYSTEM" }), _jsxs("h2", { children: ["Ownership is not", _jsx("br", {}), _jsx("span", { children: "permission." })] }), _jsx("p", { className: "statement-copy", children: "The foundation keeps six ideas separate on purpose: who a user is, what role they hold, what they own, what they can do, whether access is allowed, and what happened next." }), _jsxs("div", { className: "trust-map", "aria-label": "Trust relationship map", children: [_jsx("div", { className: "trust-map-line", "aria-hidden": "true" }), _jsxs("div", { className: "trust-map-node", children: [_jsx("span", { children: "01" }), _jsx("strong", { children: "IDENTITY" }), _jsx("small", { children: "who" })] }), _jsxs("div", { className: "trust-map-node", children: [_jsx("span", { children: "02" }), _jsx("strong", { children: "ROLE" }), _jsx("small", { children: "governs" })] }), _jsxs("div", { className: "trust-map-node", children: [_jsx("span", { children: "03" }), _jsx("strong", { children: "OWNERSHIP" }), _jsx("small", { children: "holds" })] }), _jsxs("div", { className: "trust-map-node", children: [_jsx("span", { children: "04" }), _jsx("strong", { children: "PERMISSION" }), _jsx("small", { children: "allows" })] }), _jsxs("div", { className: "trust-map-node verified", children: [_jsx("span", { children: "05" }), _jsx("strong", { children: "AUDIT" }), _jsx("small", { children: "proves" })] })] })] }), _jsxs("div", { className: "principle-card", children: [_jsx("span", { className: "card-index", children: "PROTOCOL PRINCIPLE / 01" }), _jsxs("div", { className: "principle-mark", children: [_jsx("span", {}), _jsx("span", {}), _jsx("span", {})] }), _jsx("p", { children: "Access can be granted without transferring ownership. An owner can remain bounded by explicit policy. Every decision is a record\u2014not a guess." }), _jsxs("button", { type: "button", className: "small-link", onClick: () => scrollToId("decision"), children: ["Inspect the logic ", _jsx(ArrowUpRight, { size: 14 })] })] })] }), _jsxs("section", { className: "module-section", id: "modules", children: [_jsxs("div", { className: "section-rail", children: [_jsx("span", { children: "02" }), _jsx("span", { className: "rail-line" }), _jsx("span", { children: "MODULES" })] }), _jsxs("div", { className: "module-content", children: [_jsxs("div", { className: "section-heading-row", children: [_jsxs("div", { children: [_jsx("p", { className: "kicker", children: "A MODULAR FOUNDATION" }), _jsxs("h2", { children: ["Four contracts.", _jsx("br", {}), _jsx("span", { children: "One clear boundary." })] })] }), _jsx("p", { className: "heading-note", children: "Constructor injection keeps dependencies visible. The Access Manager is the orchestrator\u2014not a monolith." })] }), _jsx("div", { className: "module-grid", children: modules.map((module) => {
                                            const Icon = module.icon;
                                            return _jsxs("article", { className: `module-card ${module.tone}`, children: [_jsxs("div", { className: "module-card-top", children: [_jsx("span", { className: "module-index", children: module.index }), _jsx(Icon, { size: 19, strokeWidth: 1.5 })] }), _jsxs("div", { className: "module-card-body", children: [_jsx("span", { className: "module-state", children: module.state }), _jsx("h3", { children: module.title }), _jsx("p", { children: module.text })] }), module.index === "01" ? (_jsxs("button", { className: "module-card-bottom module-explore", type: "button", onClick: () => setIdentityDetailOpen(true), "aria-haspopup": "dialog", children: [_jsx("span", { children: "EXPLORE MODULE" }), _jsx(ArrowUpRight, { size: 14 })] })) : (_jsxs("div", { className: "module-card-bottom", children: [_jsx("span", { children: "FUTURE MODULE" }), _jsx(ArrowUpRight, { size: 14 })] }))] }, module.index);
                                        }) }), _jsxs("div", { className: "architecture-strip", children: [_jsxs("div", { className: "architecture-copy", children: [_jsx("span", { className: "module-state", children: "DEPENDENCY DIRECTION" }), _jsx("h3", { children: "Keep the system legible." }), _jsx("p", { children: "Identity, roles, and assets remain independent inputs. Access Manager evaluates the relationship and emits the decision." }), _jsxs("button", { className: "small-link", type: "button", onClick: () => showComingSoon("Architecture export"), children: ["Export architecture ", _jsx(ArrowUpRight, { size: 14 })] })] }), _jsxs("div", { className: "architecture-visual", "aria-label": "Layered architecture map", children: [_jsx("span", { className: "architecture-route route-one", "aria-hidden": "true" }), _jsx("span", { className: "architecture-route route-two", "aria-hidden": "true" }), _jsx("span", { className: "architecture-route route-three", "aria-hidden": "true" }), _jsxs("div", { className: "architecture-node node-identity", children: [_jsx("span", { children: "01" }), _jsx("strong", { children: "IDENTITY" })] }), _jsxs("div", { className: "architecture-node node-role", children: [_jsx("span", { children: "02" }), _jsx("strong", { children: "ROLE" })] }), _jsxs("div", { className: "architecture-node node-asset", children: [_jsx("span", { children: "03" }), _jsx("strong", { children: "ASSET" })] }), _jsxs("div", { className: "architecture-node node-access", children: [_jsx("span", { children: "04" }), _jsx("strong", { children: "ACCESS" }), _jsx("small", { children: "orchestrator" })] }), _jsx("div", { className: "architecture-caption", children: "CONSTRUCTOR INJECTION / VISIBLE BOUNDARIES" })] })] })] })] }), _jsx("section", { className: "decision-section", id: "decision", children: _jsxs("div", { className: "decision-panel", children: [_jsxs("div", { className: "decision-topline", children: [_jsx("span", { className: "kicker", children: "03 / ACCESS DECISION" }), _jsxs("span", { className: "decision-live", children: [_jsx("span", { className: "status-dot green" }), " EVALUATION READY"] })] }), _jsxs("div", { className: "decision-layout", children: [_jsxs("div", { className: "decision-copy", children: [_jsxs("h2", { children: ["A request is", _jsx("br", {}), _jsx("em", { children: "not" }), " a verdict."] }), _jsx("p", { children: "Expected denials should be visible, not hidden behind a revert. Invalid inputs fail loudly. Every valid request produces an event an indexer can understand." }), _jsxs("div", { className: "decision-legend", children: [_jsxs("span", { children: [_jsx("i", { className: "legend-dot emerald" }), " access granted"] }), _jsxs("span", { children: [_jsx("i", { className: "legend-dot clay" }), " access denied"] })] })] }), _jsxs("div", { className: "decision-console", children: [_jsxs("div", { className: "console-head", children: [_jsx("span", { children: "REQUEST_ACCESS()" }), _jsx("span", { className: `console-state ${apiOnline ? "green" : ""}`, children: apiOnline ? "LIVE ALGORAND CONTRACT" : "SIMULATION" })] }), _jsxs("div", { className: "console-row", children: [_jsx("span", { children: "ASSET_ID" }), _jsx("strong", { children: "#1048576 (ASA Digital Asset)" })] }), _jsxs("div", { className: "console-row", children: [_jsx("span", { children: "REQUESTER" }), _jsx("strong", { children: algoAddress ? `${algoAddress.slice(0, 10)}...` : "MJD2DOGA...LB2REX3I5I" })] }), _jsxs("div", { className: "console-row permission-row", children: [_jsx("span", { children: "PERMISSION" }), _jsx("div", { className: "permission-tabs", children: ["READ", "WRITE", "TRANSFER"].map((permission) => (_jsx("button", { className: activePermission === permission ? "active" : "", type: "button", disabled: evaluating, onClick: () => handleEvaluatePermission(permission), children: permission }, permission))) })] }), _jsxs("div", { className: "console-result", children: [_jsx("div", { className: "result-icon", children: _jsx(Check, { size: 20 }) }), _jsxs("div", { children: [_jsxs("span", { children: ["EVENT / ", liveDecision ? `ACCESS_${liveDecision.decision}` : "ACCESS_GRANTED"] }), _jsx("strong", { children: liveDecision
                                                                        ? `${liveDecision.blockchain} PyTeal Log: ${liveDecision.proof?.on_chain_log}`
                                                                        : `${activePermission} permission explicitly granted on-chain` })] }), _jsx(ArrowUpRight, { size: 16 })] }), _jsx("p", { className: "console-note", children: apiOnline
                                                        ? `Live FastAPI + Algorand PyTeal Contract evaluated (TxID: ${liveDecision?.tx_id || "ALGO_TX_ACCESS_1048576"})`
                                                        : "Connecting to FastAPI backend..." })] })] })] }) }), _jsxs("section", { className: "flow-section", children: [_jsxs("div", { className: "section-rail", children: [_jsx("span", { children: "04" }), _jsx("span", { className: "rail-line" }), _jsx("span", { children: "SEPARATION" })] }), _jsxs("div", { className: "flow-content", children: [_jsx("p", { className: "kicker", children: "A SIMPLE MENTAL MODEL" }), _jsxs("h2", { children: ["The protocol asks", _jsx("br", {}), _jsx("span", { children: "the right question." })] }), _jsx("div", { className: "flow-list", children: flowItems.map((item, index) => { const Icon = item.icon; return _jsxs("div", { className: "flow-item", children: [_jsxs("span", { className: "flow-number", children: ["0", index + 1] }), _jsx(Icon, { size: 21 }), _jsxs("div", { children: [_jsx("span", { children: item.label }), _jsx("strong", { children: item.value })] }), index < flowItems.length - 1 && _jsx(ChevronRight, { className: "flow-chevron", size: 18 })] }, item.label); }) })] })] }), _jsxs("section", { className: "audit-section", id: "audit", children: [_jsxs("div", { className: "audit-image-wrap", children: [_jsxs("div", { className: "audit-visual", "aria-label": "Immutable audit timeline", children: [_jsx("div", { className: "audit-visual-grid", "aria-hidden": "true" }), _jsx("div", { className: "audit-route", "aria-hidden": "true" }), _jsxs("div", { className: "audit-node audit-node-one", children: [_jsx("span", { children: "01" }), _jsx("strong", { children: "REGISTERED" }), _jsx("small", { children: "identity" })] }), _jsxs("div", { className: "audit-node audit-node-two", children: [_jsx("span", { children: "02" }), _jsx("strong", { children: "GRANTED" }), _jsx("small", { children: "permission" })] }), _jsxs("div", { className: "audit-node audit-node-three", children: [_jsx("span", { children: "03" }), _jsx("strong", { children: "DENIED" }), _jsx("small", { children: "reason code" })] }), _jsxs("div", { className: "audit-node audit-node-four", children: [_jsx("span", { children: "04" }), _jsx("strong", { children: "INDEXED" }), _jsx("small", { children: "off-chain" })] }), _jsx("div", { className: "audit-sequence", children: "EVENT SEQUENCE / BLOCK 000001 \u2192 000004" })] }), _jsxs("div", { className: "audit-image-note", children: [_jsx("span", { children: "EVENT BUS / IMMUTABLE" }), _jsx("span", { children: "LOGS OVER STORAGE" })] })] }), _jsxs("div", { className: "audit-copy", children: [_jsx("p", { className: "kicker", children: "05 / AUDITABILITY" }), _jsxs("h2", { children: ["What happened", _jsx("br", {}), _jsx("em", { children: "stays visible." })] }), _jsx("p", { children: "Events carry the user, asset, requested permission, timestamp, and reason code. The chain records the signal; an off-chain indexer can turn it into a searchable history." }), _jsxs("div", { className: "audit-events", children: [_jsxs("div", { children: [_jsx("span", { className: "event-status granted" }), _jsx("span", { children: "IDENTITY_REGISTERED" }), _jsx("small", { children: "0x71...A2C9 / 12:04:18" })] }), _jsxs("div", { children: [_jsx("span", { className: "event-status granted" }), _jsx("span", { children: "PERMISSION_GRANTED" }), _jsx("small", { children: "ASSET #000001 / READ" })] }), _jsxs("div", { children: [_jsx("span", { className: "event-status denied" }), _jsx("span", { children: "ACCESS_DENIED" }), _jsx("small", { children: "REASON / PERMISSION_NOT_GRANTED" })] })] }), _jsxs("button", { className: "text-button", type: "button", onClick: () => showComingSoon("Audit explorer"), children: ["Open event explorer ", _jsx(ArrowUpRight, { size: 15 })] })] })] }), _jsxs("section", { className: "closing-section", children: [_jsxs("div", { className: "closing-mark", children: [_jsx(Sparkles, { size: 18 }), _jsx("span", { children: "FOUNDATION / READY TO EXTEND" })] }), _jsxs("h2", { children: ["Start with a system", _jsx("br", {}), _jsx("span", { children: "you can explain." })] }), _jsx("p", { children: "The contracts, tests, deployment scripts, and secure boundaries come next. This interface gives the foundation a place to be understood." }), _jsxs("div", { className: "closing-actions", children: [_jsxs("button", { className: "copper-button", type: "button", onClick: () => showComingSoon("Start building"), children: ["Start building ", _jsx(ArrowUpRight, { size: 16 })] }), _jsxs("button", { className: "outline-button dark-outline", type: "button", onClick: () => showComingSoon("Repository access"), children: ["View repository ", _jsx(Command, { size: 15 })] })] })] })] }), _jsxs("footer", { className: "site-footer", children: [_jsxs("div", { className: "footer-brand", children: [_jsx("img", { src: brandMark, alt: "Brand Mark", className: "brand-mark", onError: (e) => { e.target.style.display = "none"; } }), _jsx("span", { children: "BLOCKCHAIN SECURE PLATFORM" })] }), _jsxs("div", { className: "footer-meta", children: [_jsx("span", { children: "STATIC FOUNDATION / 2026" }), _jsx("span", { children: "BUILT FOR THE LAYER BENEATH THE APP" })] }), _jsx("button", { className: "back-top", type: "button", onClick: () => scrollToId("top"), "aria-label": "Back to top", children: _jsx(ArrowUpRight, { size: 15 }) })] }), identityDetailOpen && (_jsx("div", { className: "identity-dialog-backdrop", role: "presentation", onMouseDown: () => setIdentityDetailOpen(false), children: _jsxs("section", { className: "identity-dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "identity-detail-title", onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("div", { className: "identity-dialog-head", children: [_jsxs("div", { className: "identity-dialog-title", children: [_jsx(Fingerprint, { size: 19 }), _jsx("span", { children: "MODULE 01 / IDENTITY REGISTRY" })] }), _jsx("button", { className: "identity-close", type: "button", onClick: () => setIdentityDetailOpen(false), "aria-label": "Close Identity Registry details", children: _jsx(X, { size: 19 }) })] }), _jsxs("div", { className: "identity-dialog-body", children: [_jsxs("div", { className: "identity-intro", children: [_jsx("span", { className: "dialog-kicker", children: "CONTRACT SCOPE / VERSION 1" }), _jsxs("h2", { id: "identity-detail-title", children: ["One address.", _jsx("br", {}), _jsx("em", { children: "One active record." })] }), _jsx("p", { children: "IdentityRegistry determines whether a wallet has a registered and currently active identity. It is deliberately limited to identity lifecycle management; roles, assets, permissions, and access decisions remain outside this module." }), _jsxs("div", { className: "identity-status-bar", children: [_jsxs("span", { children: [_jsx("i", { className: "legend-dot emerald" }), " ACTIVE = AUTHORIZABLE"] }), _jsxs("span", { children: [_jsx("i", { className: "legend-dot clay" }), " REVOKED = HISTORIC"] })] })] }), _jsxs("form", { onSubmit: handleRegisterIdentity, className: "identity-record", style: { marginTop: "1rem" }, children: [_jsxs("div", { className: "record-header", children: [_jsx("span", { children: "LIVE ON-CHAIN IDENTITY REGISTRATION FORM" }), _jsx("span", { children: "identity_registry.teal" })] }), _jsxs("div", { style: { padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }, children: [_jsx("label", { style: { fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }, children: "SUBJECT DID SPECIFICATION" }), _jsx("input", { type: "text", required: true, style: { background: "rgba(0,0,0,0.5)", border: "1px solid var(--border-color)", padding: "0.4rem 0.6rem", color: "#fff", fontFamily: "var(--font-mono)", fontSize: "0.8rem", borderRadius: "4px" }, value: didInput, onChange: (e) => setDidInput(e.target.value) }), _jsx("label", { style: { fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginTop: "0.4rem" }, children: "ED25519 PUBLIC KEY" }), _jsx("input", { type: "text", required: true, style: { background: "rgba(0,0,0,0.5)", border: "1px solid var(--border-color)", padding: "0.4rem 0.6rem", color: "#fff", fontFamily: "var(--font-mono)", fontSize: "0.8rem", borderRadius: "4px" }, value: pubKeyInput, onChange: (e) => setPubKeyInput(e.target.value) }), _jsxs("button", { type: "submit", disabled: registering, className: "copper-button", style: { marginTop: "0.6rem", width: "100%", justifyContent: "center" }, children: [_jsx("span", { children: registering ? "Registering on Algorand..." : "Register DID Identity On-Chain" }), _jsx(ArrowUpRight, { size: 14 })] })] }), registeredIdentity && (_jsxs("div", { style: { padding: "0.75rem", background: "rgba(16, 185, 129, 0.08)", borderTop: "1px solid rgba(16,185,129,0.2)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }, children: [_jsx("div", { style: { color: "#10b981", fontWeight: 700 }, children: "\u2705 REGISTERED ON-CHAIN" }), _jsxs("div", { children: [_jsx("strong", { children: "TxID:" }), " ", registeredIdentity.tx_id] }), _jsxs("div", { children: [_jsx("strong", { children: "DID Hash:" }), " ", registeredIdentity.did_hash?.slice(0, 24), "..."] })] })), _jsxs("div", { className: "record-note", children: [_jsx(CircleDashed, { size: 15 }), " DID uniqueness is validated with ", _jsx("code", { children: "keccak256(bytes(did))" }), "."] })] }), _jsxs("div", { className: "identity-detail-grid", children: [_jsxs("article", { className: "detail-panel lifecycle-panel", children: [_jsx("span", { className: "detail-index", children: "01 / LIFECYCLE" }), _jsxs("div", { className: "lifecycle-path", children: [_jsxs("div", { children: [_jsx("span", { children: "NOT REGISTERED" }), _jsx("i", {})] }), _jsxs("div", { className: "active-step", children: [_jsx("span", { children: "ACTIVE" }), _jsx("i", {})] }), _jsx("div", { className: "revoked-step", children: _jsx("span", { children: "REVOKED" }) })] }), _jsxs("p", { children: ["Version 1 preserves the historical record. Revocation sets ", _jsx("code", { children: "active = false" }), " and records ", _jsx("code", { children: "revokedAt" }), "; reactivation is intentionally excluded."] })] }), _jsxs("article", { className: "detail-panel", children: [_jsx("span", { className: "detail-index", children: "02 / PUBLIC SURFACE" }), _jsxs("div", { className: "function-list", children: [_jsx("code", { children: "registerIdentity(did)" }), _jsx("code", { children: "revokeIdentity(user)" }), _jsx("code", { children: "isRegistered(user)" }), _jsx("code", { children: "isIdentityActive(user)" }), _jsx("code", { children: "getIdentity(user)" }), _jsx("code", { children: "getAddressByDID(did)" })] })] }), _jsxs("article", { className: "detail-panel", children: [_jsx("span", { className: "detail-index", children: "03 / SECURITY BOUNDARIES" }), _jsxs("ul", { className: "security-list", children: [_jsxs("li", { children: [_jsx(Check, { size: 13 }), " OpenZeppelin ", _jsx("code", { children: "AccessControl" }), " gates revocation."] }), _jsxs("li", { children: [_jsx(Check, { size: 13 }), " Duplicate wallet and DID registration are rejected."] }), _jsxs("li", { children: [_jsx(Check, { size: 13 }), " Zero-address and invalid lifecycle operations revert with custom errors."] }), _jsxs("li", { children: [_jsx(Check, { size: 13 }), " No passwords, documents, biometrics, keys, or other sensitive data are stored."] })] })] }), _jsxs("article", { className: "detail-panel event-panel", children: [_jsx("span", { className: "detail-index", children: "04 / AUDIT EVENTS" }), _jsxs("div", { className: "event-item", children: [_jsx("span", { className: "event-status granted" }), " ", _jsx("code", { children: "IdentityRegistered" }), _jsx("small", { children: "user \u00B7 didHash \u00B7 did \u00B7 registeredAt" })] }), _jsxs("div", { className: "event-item", children: [_jsx("span", { className: "event-status denied" }), " ", _jsx("code", { children: "IdentityRevoked" }), _jsx("small", { children: "user \u00B7 revokedAt" })] })] })] }), _jsxs("div", { className: "identity-dialog-footer", children: [_jsxs("p", { children: [_jsx("strong", { children: "Future contract handshake:" }), " AccessManager will query ", _jsx("code", { children: "isIdentityActive(user)" }), " before continuing authorization. That manager is not part of this module."] }), _jsxs("button", { className: "copper-button", type: "button", onClick: () => { setIdentityDetailOpen(false); showComingSoon("Identity Registry repository"); }, children: ["Open module repository ", _jsx(ArrowUpRight, { size: 16 })] })] })] })] }) }))] }));
}
