// Archive of Trust direction: this page uses a split-axis editorial layout, technical metadata, and copper ledger lines instead of generic centered marketing blocks.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleDashed,
  Command,
  FileCode2,
  Fingerprint,
  GitBranch,
  LockKeyhole,
  Menu,
  Network,
  ScanLine,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

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

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePermission, setActivePermission] = useState("READ");
  const [hasScrolled, setHasScrolled] = useState(false);
  const [identityDetailOpen, setIdentityDetailOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [algoAddress, setAlgoAddress] = useState<string | null>(null);
  const [liveDecision, setLiveDecision] = useState<any>(null);
  const [evaluating, setEvaluating] = useState(false);

  const [didInput, setDidInput] = useState("did:secure:alice-001");
  const [pubKeyInput, setPubKeyInput] = useState("0x" + "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0");
  const [registeredIdentity, setRegisteredIdentity] = useState<any>(null);
  const [registering, setRegistering] = useState(false);

  const [assetNameInput, setAssetNameInput] = useState("Confidential Asset #1");
  const [unitNameInput, setUnitNameInput] = useState("CAS1");
  const [payloadInput, setPayloadInput] = useState("Quarterly security audit clearance token");
  const [encryptionKeyInput, setEncryptionKeyInput] = useState("01" + "23456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
  const [mintedAsset, setMintedAsset] = useState<any>(null);
  const [minting, setMinting] = useState(false);

  const handleRegisterIdentity = async (e: React.FormEvent) => {
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
      } else {
        toast.error(`Registration Failed: ${data.detail}`);
      }
    } catch {
      toast.error("Failed to connect to Identity Registry PyTeal contract");
    } finally {
      setRegistering(false);
    }
  };

  const handleMintASAAsset = async (e: React.FormEvent) => {
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
      } else {
        toast.error(`Minting Failed: ${data.detail}`);
      }
    } catch {
      toast.error("Failed to connect to Asset Vault PyTeal contract");
    } finally {
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
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIdentityDetailOpen(false);
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
    } catch {
      toast.error("Failed to connect Algorand backend service");
    }
  };

  const handleEvaluatePermission = async (permission: string) => {
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
    } catch (e) {
      toast.error("Failed to evaluate access decision on Algorand contract");
    } finally {
      setEvaluating(false);
    }
  };

  const showComingSoon = (label: string) => {
    toast(`${label} is reserved for the connected app layer.`, {
      description: "This first delivery is a frontend-only foundation for the blockchain system.",
    });
  };

  return (
    <div className="site-shell">
      <header className={`site-header ${hasScrolled ? "is-scrolled" : ""}`}>
        <a href="#top" className="brand-lockup" aria-label="Blockchain Secure Platform home">
          <img src={brandMark} alt="" className="brand-mark" />
          <span className="brand-ledger-tick" aria-hidden="true" />
          <span className="brand-wordmark">
            <span>BLOCKCHAIN</span>
            <span>SECURE PLATFORM</span>
          </span>
        </a>
        <nav className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="Primary navigation">
          <button type="button" onClick={() => scrollToId("foundation")}>Foundation</button>
          <button type="button" onClick={() => scrollToId("modules")}>Modules</button>
          <button type="button" onClick={() => scrollToId("audit")}>Audit trail</button>
          <button type="button" onClick={() => showComingSoon("Documentation")}>Docs <span className="nav-arrow">↗</span></button>
        </nav>
        <div className="header-actions">
          <span className="network-pill">
            <span className={`status-dot ${apiOnline ? "green" : ""}`} /> {apiOnline ? "FASTAPI BACKEND CONNECTED" : "LOCAL MVP"}
          </span>
          <button className="outline-button header-cta" type="button" onClick={handleConnectWallet}>
            {algoAddress ? `${algoAddress.slice(0, 6)}...${algoAddress.slice(-4)}` : "Connect wallet"} <ArrowUpRight size={15} />
          </button>
          <button className="menu-toggle" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-gridline" aria-hidden="true" />
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-rule" /> BLOCKCHAIN FOUNDATION / 00.1</div>
            <h1>Trust, made <em>inspectable.</em></h1>
            <p className="hero-lede">A security-first protocol layer for identity, role-based access, digital assets, and the decisions that connect them.</p>
            <div className="hero-actions">
              <button className="copper-button" type="button" onClick={() => scrollToId("foundation")}>Read the foundation <ArrowDownRight size={16} /></button>
              <button className="text-button" type="button" onClick={() => showComingSoon("Contract explorer")}>View contract map <ChevronRight size={16} /></button>
            </div>
            <div className="hero-proof">
              <div className="proof-item"><span className="proof-value">04</span><span className="proof-label">Modular contracts</span></div>
              <div className="proof-item"><span className="proof-value">01</span><span className="proof-label">Access orchestrator</span></div>
              <div className="proof-item"><span className="proof-value">∞</span><span className="proof-label">Event-led audit trail</span></div>
            </div>
          </div>
          <div className="hero-art-wrap">
            <div className="hero-art-label label-top">SYSTEM / TRUST GRAPH <span>◼</span></div>
            <img src={heroImage} alt="Abstract copper trust graph showing connected identities and permissions" className="hero-art" />
            <div className="hero-art-overlay">
              <div><span className="mini-label">CURRENT STATE</span><strong>VERIFIED / 01</strong></div>
              <div className="overlay-separator" />
              <div><span className="mini-label">LAST EVENT</span><strong>IDENTITY_REGISTERED</strong></div>
            </div>
            <span className="art-coordinate coordinate-one">37.7749° N</span>
            <span className="art-coordinate coordinate-two">122.4194° W</span>
          </div>
          <div className="hero-footnote"><span>SCROLL TO EXPLORE</span><span className="footnote-line" /><span>01 / 06</span></div>
        </section>

        <section className="statement-section" id="foundation">
          <div className="section-rail"><span>01</span><span className="rail-line" /><span>THESIS</span></div>
          <div className="statement-main">
            <p className="kicker">THE DISTINCTION THAT PROTECTS THE SYSTEM</p>
            <h2>Ownership is not<br /><span>permission.</span></h2>
            <p className="statement-copy">The foundation keeps six ideas separate on purpose: who a user is, what role they hold, what they own, what they can do, whether access is allowed, and what happened next.</p>
            <div className="trust-map" aria-label="Trust relationship map">
              <div className="trust-map-line" aria-hidden="true" />
              <div className="trust-map-node"><span>01</span><strong>IDENTITY</strong><small>who</small></div>
              <div className="trust-map-node"><span>02</span><strong>ROLE</strong><small>governs</small></div>
              <div className="trust-map-node"><span>03</span><strong>OWNERSHIP</strong><small>holds</small></div>
              <div className="trust-map-node"><span>04</span><strong>PERMISSION</strong><small>allows</small></div>
              <div className="trust-map-node verified"><span>05</span><strong>AUDIT</strong><small>proves</small></div>
            </div>
          </div>
          <div className="principle-card">
            <span className="card-index">PROTOCOL PRINCIPLE / 01</span>
            <div className="principle-mark"><span /><span /><span /></div>
            <p>Access can be granted without transferring ownership. An owner can remain bounded by explicit policy. Every decision is a record—not a guess.</p>
            <button type="button" className="small-link" onClick={() => scrollToId("decision")}>Inspect the logic <ArrowUpRight size={14} /></button>
          </div>
        </section>

        <section className="module-section" id="modules">
          <div className="section-rail"><span>02</span><span className="rail-line" /><span>MODULES</span></div>
          <div className="module-content">
            <div className="section-heading-row">
              <div><p className="kicker">A MODULAR FOUNDATION</p><h2>Four contracts.<br /><span>One clear boundary.</span></h2></div>
              <p className="heading-note">Constructor injection keeps dependencies visible. The Access Manager is the orchestrator—not a monolith.</p>
            </div>
            <div className="module-grid">
              {modules.map((module) => {
                const Icon = module.icon;
                return <article className={`module-card ${module.tone}`} key={module.index}>
                  <div className="module-card-top"><span className="module-index">{module.index}</span><Icon size={19} strokeWidth={1.5} /></div>
                  <div className="module-card-body"><span className="module-state">{module.state}</span><h3>{module.title}</h3><p>{module.text}</p></div>
                  {module.index === "01" ? (
                    <button className="module-card-bottom module-explore" type="button" onClick={() => setIdentityDetailOpen(true)} aria-haspopup="dialog">
                      <span>EXPLORE MODULE</span><ArrowUpRight size={14} />
                    </button>
                  ) : (
                    <div className="module-card-bottom"><span>FUTURE MODULE</span><ArrowUpRight size={14} /></div>
                  )}
                </article>;
              })}
            </div>
            <div className="architecture-strip">
              <div className="architecture-copy"><span className="module-state">DEPENDENCY DIRECTION</span><h3>Keep the system legible.</h3><p>Identity, roles, and assets remain independent inputs. Access Manager evaluates the relationship and emits the decision.</p><button className="small-link" type="button" onClick={() => showComingSoon("Architecture export")}>Export architecture <ArrowUpRight size={14} /></button></div>
              <div className="architecture-visual" aria-label="Layered architecture map">
                <span className="architecture-route route-one" aria-hidden="true" />
                <span className="architecture-route route-two" aria-hidden="true" />
                <span className="architecture-route route-three" aria-hidden="true" />
                <div className="architecture-node node-identity"><span>01</span><strong>IDENTITY</strong></div>
                <div className="architecture-node node-role"><span>02</span><strong>ROLE</strong></div>
                <div className="architecture-node node-asset"><span>03</span><strong>ASSET</strong></div>
                <div className="architecture-node node-access"><span>04</span><strong>ACCESS</strong><small>orchestrator</small></div>
                <div className="architecture-caption">CONSTRUCTOR INJECTION / VISIBLE BOUNDARIES</div>
              </div>
            </div>
          </div>
        </section>

        <section className="decision-section" id="decision">
          <div className="decision-panel">
            <div className="decision-topline"><span className="kicker">03 / ACCESS DECISION</span><span className="decision-live"><span className="status-dot green" /> EVALUATION READY</span></div>
            <div className="decision-layout">
              <div className="decision-copy"><h2>A request is<br /><em>not</em> a verdict.</h2><p>Expected denials should be visible, not hidden behind a revert. Invalid inputs fail loudly. Every valid request produces an event an indexer can understand.</p><div className="decision-legend"><span><i className="legend-dot emerald" /> access granted</span><span><i className="legend-dot clay" /> access denied</span></div></div>
              <div className="decision-console">
                <div className="console-head">
                  <span>REQUEST_ACCESS()</span>
                  <span className={`console-state ${apiOnline ? "green" : ""}`}>
                    {apiOnline ? "LIVE ALGORAND CONTRACT" : "SIMULATION"}
                  </span>
                </div>
                <div className="console-row"><span>ASSET_ID</span><strong>#1048576 (ASA Digital Asset)</strong></div>
                <div className="console-row"><span>REQUESTER</span><strong>{algoAddress ? `${algoAddress.slice(0, 10)}...` : "MJD2DOGA...LB2REX3I5I"}</strong></div>
                <div className="console-row permission-row">
                  <span>PERMISSION</span>
                  <div className="permission-tabs">
                    {["READ", "WRITE", "TRANSFER"].map((permission) => (
                      <button
                        className={activePermission === permission ? "active" : ""}
                        type="button"
                        key={permission}
                        disabled={evaluating}
                        onClick={() => handleEvaluatePermission(permission)}
                      >
                        {permission}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="console-result">
                  <div className="result-icon"><Check size={20} /></div>
                  <div>
                    <span>EVENT / {liveDecision ? `ACCESS_${liveDecision.decision}` : "ACCESS_GRANTED"}</span>
                    <strong>
                      {liveDecision
                        ? `${liveDecision.blockchain} PyTeal Log: ${liveDecision.proof?.on_chain_log}`
                        : `${activePermission} permission explicitly granted on-chain`}
                    </strong>
                  </div>
                  <ArrowUpRight size={16} />
                </div>
                <p className="console-note">
                  {apiOnline
                    ? `Live FastAPI + Algorand PyTeal Contract evaluated (TxID: ${liveDecision?.tx_id || "ALGO_TX_ACCESS_1048576"})`
                    : "Connecting to FastAPI backend..."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flow-section">
          <div className="section-rail"><span>04</span><span className="rail-line" /><span>SEPARATION</span></div>
          <div className="flow-content"><p className="kicker">A SIMPLE MENTAL MODEL</p><h2>The protocol asks<br /><span>the right question.</span></h2><div className="flow-list">{flowItems.map((item, index) => { const Icon = item.icon; return <div className="flow-item" key={item.label}><span className="flow-number">0{index + 1}</span><Icon size={21} /><div><span>{item.label}</span><strong>{item.value}</strong></div>{index < flowItems.length - 1 && <ChevronRight className="flow-chevron" size={18} />}</div>; })}</div></div>
        </section>

        <section className="audit-section" id="audit">
          <div className="audit-image-wrap">
            <div className="audit-visual" aria-label="Immutable audit timeline">
              <div className="audit-visual-grid" aria-hidden="true" />
              <div className="audit-route" aria-hidden="true" />
              <div className="audit-node audit-node-one"><span>01</span><strong>REGISTERED</strong><small>identity</small></div>
              <div className="audit-node audit-node-two"><span>02</span><strong>GRANTED</strong><small>permission</small></div>
              <div className="audit-node audit-node-three"><span>03</span><strong>DENIED</strong><small>reason code</small></div>
              <div className="audit-node audit-node-four"><span>04</span><strong>INDEXED</strong><small>off-chain</small></div>
              <div className="audit-sequence">EVENT SEQUENCE / BLOCK 000001 → 000004</div>
            </div>
            <div className="audit-image-note"><span>EVENT BUS / IMMUTABLE</span><span>LOGS OVER STORAGE</span></div>
          </div>
          <div className="audit-copy"><p className="kicker">05 / AUDITABILITY</p><h2>What happened<br /><em>stays visible.</em></h2><p>Events carry the user, asset, requested permission, timestamp, and reason code. The chain records the signal; an off-chain indexer can turn it into a searchable history.</p><div className="audit-events"><div><span className="event-status granted" /><span>IDENTITY_REGISTERED</span><small>0x71...A2C9 / 12:04:18</small></div><div><span className="event-status granted" /><span>PERMISSION_GRANTED</span><small>ASSET #000001 / READ</small></div><div><span className="event-status denied" /><span>ACCESS_DENIED</span><small>REASON / PERMISSION_NOT_GRANTED</small></div></div><button className="text-button" type="button" onClick={() => showComingSoon("Audit explorer")}>Open event explorer <ArrowUpRight size={15} /></button></div>
        </section>

        <section className="closing-section">
          <div className="closing-mark"><Sparkles size={18} /><span>FOUNDATION / READY TO EXTEND</span></div>
          <h2>Start with a system<br /><span>you can explain.</span></h2>
          <p>The contracts, tests, deployment scripts, and secure boundaries come next. This interface gives the foundation a place to be understood.</p>
          <div className="closing-actions"><button className="copper-button" type="button" onClick={() => showComingSoon("Start building")}>Start building <ArrowUpRight size={16} /></button><button className="outline-button dark-outline" type="button" onClick={() => showComingSoon("Repository access")}>View repository <Command size={15} /></button></div>
        </section>
      </main>

      <footer className="site-footer"><div className="footer-brand"><img src={brandMark} alt="" className="brand-mark" /><span>BLOCKCHAIN SECURE PLATFORM</span></div><div className="footer-meta"><span>STATIC FOUNDATION / 2026</span><span>BUILT FOR THE LAYER BENEATH THE APP</span></div><button className="back-top" type="button" onClick={() => scrollToId("top")} aria-label="Back to top"><ArrowUpRight size={15} /></button></footer>

      {identityDetailOpen && (
        <div className="identity-dialog-backdrop" role="presentation" onMouseDown={() => setIdentityDetailOpen(false)}>
          <section className="identity-dialog" role="dialog" aria-modal="true" aria-labelledby="identity-detail-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="identity-dialog-head">
              <div className="identity-dialog-title"><Fingerprint size={19} /><span>MODULE 01 / IDENTITY REGISTRY</span></div>
              <button className="identity-close" type="button" onClick={() => setIdentityDetailOpen(false)} aria-label="Close Identity Registry details"><X size={19} /></button>
            </div>

            <div className="identity-dialog-body">
              <div className="identity-intro">
                <span className="dialog-kicker">CONTRACT SCOPE / VERSION 1</span>
                <h2 id="identity-detail-title">One address.<br /><em>One active record.</em></h2>
                <p>IdentityRegistry determines whether a wallet has a registered and currently active identity. It is deliberately limited to identity lifecycle management; roles, assets, permissions, and access decisions remain outside this module.</p>
                <div className="identity-status-bar"><span><i className="legend-dot emerald" /> ACTIVE = AUTHORIZABLE</span><span><i className="legend-dot clay" /> REVOKED = HISTORIC</span></div>
              </div>

              <form onSubmit={handleRegisterIdentity} className="identity-record" style={{ marginTop: "1rem" }}>
                <div className="record-header">
                  <span>LIVE ON-CHAIN IDENTITY REGISTRATION FORM</span>
                  <span>identity_registry.teal</span>
                </div>
                <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>SUBJECT DID SPECIFICATION</label>
                  <input
                    type="text"
                    required
                    style={{ background: "rgba(0,0,0,0.5)", border: "1px solid var(--border-color)", padding: "0.4rem 0.6rem", color: "#fff", fontFamily: "var(--font-mono)", fontSize: "0.8rem", borderRadius: "4px" }}
                    value={didInput}
                    onChange={(e) => setDidInput(e.target.value)}
                  />
                  <label style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginTop: "0.4rem" }}>ED25519 PUBLIC KEY</label>
                  <input
                    type="text"
                    required
                    style={{ background: "rgba(0,0,0,0.5)", border: "1px solid var(--border-color)", padding: "0.4rem 0.6rem", color: "#fff", fontFamily: "var(--font-mono)", fontSize: "0.8rem", borderRadius: "4px" }}
                    value={pubKeyInput}
                    onChange={(e) => setPubKeyInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={registering}
                    className="copper-button"
                    style={{ marginTop: "0.6rem", width: "100%", justifyContent: "center" }}
                  >
                    <span>{registering ? "Registering on Algorand..." : "Register DID Identity On-Chain"}</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
                {registeredIdentity && (
                  <div style={{ padding: "0.75rem", background: "rgba(16, 185, 129, 0.08)", borderTop: "1px solid rgba(16,185,129,0.2)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
                    <div style={{ color: "#10b981", fontWeight: 700 }}>✅ REGISTERED ON-CHAIN</div>
                    <div><strong>TxID:</strong> {registeredIdentity.tx_id}</div>
                    <div><strong>DID Hash:</strong> {registeredIdentity.did_hash?.slice(0, 24)}...</div>
                  </div>
                )}
                <div className="record-note"><CircleDashed size={15} /> DID uniqueness is validated with <code>keccak256(bytes(did))</code>.</div>
              </form>

              <div className="identity-detail-grid">
                <article className="detail-panel lifecycle-panel">
                  <span className="detail-index">01 / LIFECYCLE</span>
                  <div className="lifecycle-path"><div><span>NOT REGISTERED</span><i /></div><div className="active-step"><span>ACTIVE</span><i /></div><div className="revoked-step"><span>REVOKED</span></div></div>
                  <p>Version 1 preserves the historical record. Revocation sets <code>active = false</code> and records <code>revokedAt</code>; reactivation is intentionally excluded.</p>
                </article>
                <article className="detail-panel">
                  <span className="detail-index">02 / PUBLIC SURFACE</span>
                  <div className="function-list"><code>registerIdentity(did)</code><code>revokeIdentity(user)</code><code>isRegistered(user)</code><code>isIdentityActive(user)</code><code>getIdentity(user)</code><code>getAddressByDID(did)</code></div>
                </article>
                <article className="detail-panel">
                  <span className="detail-index">03 / SECURITY BOUNDARIES</span>
                  <ul className="security-list"><li><Check size={13} /> OpenZeppelin <code>AccessControl</code> gates revocation.</li><li><Check size={13} /> Duplicate wallet and DID registration are rejected.</li><li><Check size={13} /> Zero-address and invalid lifecycle operations revert with custom errors.</li><li><Check size={13} /> No passwords, documents, biometrics, keys, or other sensitive data are stored.</li></ul>
                </article>
                <article className="detail-panel event-panel">
                  <span className="detail-index">04 / AUDIT EVENTS</span>
                  <div className="event-item"><span className="event-status granted" /> <code>IdentityRegistered</code><small>user · didHash · did · registeredAt</small></div>
                  <div className="event-item"><span className="event-status denied" /> <code>IdentityRevoked</code><small>user · revokedAt</small></div>
                </article>
              </div>

              <div className="identity-dialog-footer"><p><strong>Future contract handshake:</strong> AccessManager will query <code>isIdentityActive(user)</code> before continuing authorization. That manager is not part of this module.</p><button className="copper-button" type="button" onClick={() => { setIdentityDetailOpen(false); showComingSoon("Identity Registry repository"); }}>Open module repository <ArrowUpRight size={16} /></button></div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
