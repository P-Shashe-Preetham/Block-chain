/** Evidence Ledger style: editorial ledger rail, evidence-first hierarchy, dark ink/green signal, and explicit authority limits. */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AuditApiUnavailableError,
  apiBaseUrl,
  listAuditEvents,
  statusLabel,
  type ProjectionStatus,
} from "./lib/api";

const navigation = ["Evidence overview", "Audit projection", "Transaction intent", "Verifier", "Control register"] as const;

const controlRows = [
  ["Identity verifier", "Blocked external", "No approved OIDC/DID profile"],
  ["Network / custody", "Blocked external", "No approved chain/finality/deployer"],
  ["Storage / KMS", "Blocked external", "Policy references only"],
  ["Web console", "Repository-native", "Audit read only; no signer"],
] as const;

function compactHash(value: string): string {
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

function App() {
  const [section, setSection] = useState<(typeof navigation)[number]>("Evidence overview");
  const [filter, setFilter] = useState<ProjectionStatus | "all">("all");
  const baseUrl = useMemo(apiBaseUrl, []);
  const auditQuery = useQuery({
    queryKey: ["audit-events", baseUrl, filter],
    queryFn: () => listAuditEvents(baseUrl, { limit: 25, projectionStatus: filter === "all" ? undefined : filter }),
    enabled: Boolean(baseUrl),
  });
  const unavailableMessage = auditQuery.error instanceof AuditApiUnavailableError
    ? auditQuery.error.message
    : "The audit projection is unavailable until a configured backend and approved authentication boundary are present.";

  return (
    <div className="ledger-shell">
      <a className="skip-link" href="#main-content">Skip to evidence workspace</a>
      <aside className="rail" aria-label="Evidence Ledger navigation">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span><small>Secure Platform</small><strong>Evidence Ledger</strong></span>
        </div>
        <div className="authority-stamp"><span>Scope / local demo</span><code>CONTRACT AUTHORITY</code></div>
        <nav aria-label="Console sections">
          {navigation.map((item) => (
            <button className={section === item ? "nav-item selected" : "nav-item"} key={item} onClick={() => setSection(item)}>
              <span aria-hidden="true">{section === item ? "◆" : "◇"}</span>{item}
            </button>
          ))}
        </nav>
        <section className="boundary-note" aria-labelledby="maturity-title">
          <p id="maturity-title">Maturity boundary</p>
          <span>Identity verification, chain submission, key custody, and production finality are approval-gated.</span>
        </section>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div><small>Operational record</small><strong>{section}</strong></div>
          <span className="status-chip quiet">No browser secret storage</span>
        </header>

        <main id="main-content" className="content" tabIndex={-1}>
          <section className="hero" aria-labelledby="page-title">
            <div>
              <p className="eyebrow"><span aria-hidden="true">◆</span> Chain-of-trust review</p>
              <h1 id="page-title">Review what the projection can prove.</h1>
              <p>A bounded view of sanitized contract-derived evidence and explicit operating limits. This browser cannot authorize, sign, submit, or confirm a blockchain transaction.</p>
            </div>
            <div className="hero-annotation"><small>Evidence horizon</small><strong>{baseUrl ? "Configured" : "Unconfigured"}</strong><span>Finality is visible only when a future approved network policy exists.</span></div>
          </section>

          <section className="summary-grid" aria-label="Console scope summary">
            <article><span>Projection source</span><strong>Sanitized API only</strong><p>Raw logs and decoded payloads are deliberately excluded.</p></article>
            <article><span>Transaction intents</span><strong>Record only</strong><p>The API contract reports <code>on_chain_submission=false</code>.</p></article>
            <article><span>Independent verifier</span><strong>Not connected</strong><p>It will require approved chain, ABI, and deployment inputs.</p></article>
          </section>

          <section className="evidence-layout" aria-labelledby="audit-title">
            <article className="paper-panel">
              <div className="panel-heading">
                <div><p className="eyebrow dark">Projection register</p><h2 id="audit-title">Sanitized audit evidence</h2></div>
                <label className="filter-label">Status
                  <select value={filter} onChange={(event) => setFilter(event.target.value as ProjectionStatus | "all")}>
                    <option value="all">All allowed statuses</option>
                    <option value="canonical">Canonical</option>
                    <option value="unfinalized">Unfinalized</option>
                    <option value="uncertain">Uncertain</option>
                  </select>
                </label>
              </div>
              {auditQuery.isFetching && <p className="notice">Refreshing bounded projection…</p>}
              {baseUrl && auditQuery.data && (
                auditQuery.data.length ? <ul className="event-list">{auditQuery.data.map((event) => <li key={event.event_id}>
                  <span className="event-index">#{event.log_index}</span>
                  <span><strong>{event.event_name}</strong><small>{compactHash(event.transaction_hash)} · block {event.block_number}</small></span>
                  <span className={`status-chip ${event.projection_status}`}>{statusLabel(event.projection_status)}</span>
                </li>)}</ul> : <p className="empty-state">The configured sanitized projection returned no records for this filter.</p>
              )}
              {!baseUrl && <p className="empty-state">{unavailableMessage}</p>}
              {baseUrl && auditQuery.isError && <p className="error-state" role="alert">{unavailableMessage}</p>}
              {baseUrl && <button className="text-action" onClick={() => void auditQuery.refetch()}>Refresh sanitized projection</button>}
            </article>

            <aside className="annotation-stack" aria-label="Trust annotations">
              <section className="dark-card"><p className="eyebrow">Network finality</p><strong>Approval-gated</strong><span>Unfinalized and uncertain records must stay visible. No current network policy is asserted.</span></section>
              <section className="paper-panel narrow"><p className="eyebrow dark">Storage boundary</p><strong>Ciphertext only.</strong><span>Declared policy rejects sensitive and unknown payload classes. No object storage or KMS is connected.</span></section>
            </aside>
          </section>

          <section className="control-table" aria-labelledby="control-title">
            <div><p className="eyebrow">Release controls</p><h2 id="control-title">Visible gates, not hidden assumptions</h2></div>
            <div role="table" aria-label="Current final-project control status">
              {controlRows.map(([control, status, detail]) => <div className="control-row" role="row" key={control}>
                <strong role="cell">{control}</strong><span role="cell" className="status-chip blocked">{status}</span><span role="cell">{detail}</span>
              </div>)}
            </div>
          </section>

          <footer>Repository-native Evidence Ledger console · no real identity or organizational asset data · browser views are never canonical.</footer>
        </main>
      </div>
    </div>
  );
}

export default App;
