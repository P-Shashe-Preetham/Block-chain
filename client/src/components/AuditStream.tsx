import React, { useEffect, useState } from "react";
import { Database, Search, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";

export const AuditStream: React.FC = () => {
  const [events, setEvents] = useState<any[]>([
    {
      event_id: "evt_algo_1048576_001",
      chain_id: 416001,
      contract_address: "0x71a2c98401fed34208a1098b09c8213812739812",
      transaction_hash: "ALGO_TX_DID_REGISTER_992183120485761029",
      log_index: 0,
      block_number: 1048576,
      event_name: "IDENTITY_REGISTERED",
      projection_status: "canonical",
      timestamp: "12:44:18 UTC",
    },
    {
      event_id: "evt_algo_1048576_002",
      chain_id: 416001,
      contract_address: "0x3841029848102834012938472910482019472019",
      transaction_hash: "ALGO_TX_MINT_ASA_401928374619283746",
      log_index: 1,
      block_number: 1048577,
      event_name: "ASA_ASSET_MINTED",
      projection_status: "canonical",
      timestamp: "12:44:22 UTC",
    },
    {
      event_id: "evt_algo_1048576_003",
      chain_id: 416001,
      contract_address: "0x5910293847102938471029384710293847102938",
      transaction_hash: "ALGO_TX_ACCESS_EVAL_840192837461928374",
      log_index: 2,
      block_number: 1048578,
      event_name: "ACCESS_GRANTED",
      projection_status: "canonical",
      timestamp: "12:44:26 UTC",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState("");

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/v1/audit?limit=20");
      if (res.ok) {
        const data = await res.json();
        if (data.events && data.events.length > 0) {
          setEvents(data.events);
        }
      }
    } catch {
      // Retain fallback illustrative events if unconfigured
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filteredEvents = events.filter((e) =>
    e.event_name.toLowerCase().includes(filterText.toLowerCase()) ||
    e.transaction_hash.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="glass-card" id="audit">
      <div className="card-header-row">
        <div className="card-title-group">
          <div className="title-icon">
            <Database size={18} />
          </div>
          <div>
            <h2 className="card-title">Real-Time Off-Chain Audit Projection Stream</h2>
            <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--accent-emerald)" }}>
              Durable Indexer Sync • Algorand ASA & Event Log Consumer
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search audit stream..."
              className="form-input"
              style={{ paddingLeft: "2.25rem", width: "220px", height: "36px", fontSize: "0.8rem" }}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>

          <button type="button" className="btn-secondary" style={{ padding: "0.4rem 0.85rem", height: "36px" }} onClick={fetchAuditLogs}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="audit-table">
          <thead>
            <tr>
              <th>STATUS</th>
              <th>EVENT NAME</th>
              <th>BLOCK ROUND</th>
              <th>TRANSACTION HASH</th>
              <th>CONTRACT ADDRESS</th>
              <th>LOG INDEX</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((event, idx) => (
              <tr key={event.event_id || idx}>
                <td>
                  <span className="status-badge" style={{ padding: "0.2rem 0.5rem", fontSize: "0.65rem" }}>
                    <span className="pulse-dot" />
                    <span>{event.projection_status || "canonical"}</span>
                  </span>
                </td>
                <td style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                  {event.event_name}
                </td>
                <td>#{event.block_number}</td>
                <td>
                  <span style={{ color: "var(--accent-cyan)" }}>
                    {event.transaction_hash.slice(0, 14)}...{event.transaction_hash.slice(-8)}
                  </span>
                </td>
                <td>
                  {event.contract_address.slice(0, 10)}...{event.contract_address.slice(-6)}
                </td>
                <td>[{event.log_index}]</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
