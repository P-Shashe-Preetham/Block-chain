import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Database, Search, RefreshCw } from "lucide-react";
export const AuditStream = () => {
    const [events, setEvents] = useState([
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
        }
        catch {
            // Retain fallback illustrative events if unconfigured
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchAuditLogs();
    }, []);
    const filteredEvents = events.filter((e) => e.event_name.toLowerCase().includes(filterText.toLowerCase()) ||
        e.transaction_hash.toLowerCase().includes(filterText.toLowerCase()));
    return (_jsxs("div", { className: "glass-card", id: "audit", children: [_jsxs("div", { className: "card-header-row", children: [_jsxs("div", { className: "card-title-group", children: [_jsx("div", { className: "title-icon", children: _jsx(Database, { size: 18 }) }), _jsxs("div", { children: [_jsx("h2", { className: "card-title", children: "Real-Time Off-Chain Audit Projection Stream" }), _jsx("span", { style: { fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--accent-emerald)" }, children: "Durable Indexer Sync \u2022 Algorand ASA & Event Log Consumer" })] })] }), _jsxs("div", { style: { display: "flex", gap: "0.75rem" }, children: [_jsxs("div", { style: { position: "relative" }, children: [_jsx(Search, { size: 14, style: { position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" } }), _jsx("input", { type: "text", placeholder: "Search audit stream...", className: "form-input", style: { paddingLeft: "2.25rem", width: "220px", height: "36px", fontSize: "0.8rem" }, value: filterText, onChange: (e) => setFilterText(e.target.value) })] }), _jsxs("button", { type: "button", className: "btn-secondary", style: { padding: "0.4rem 0.85rem", height: "36px" }, onClick: fetchAuditLogs, children: [_jsx(RefreshCw, { size: 14, className: loading ? "animate-spin" : "" }), _jsx("span", { children: "Refresh" })] })] })] }), _jsx("div", { style: { overflowX: "auto" }, children: _jsxs("table", { className: "audit-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "STATUS" }), _jsx("th", { children: "EVENT NAME" }), _jsx("th", { children: "BLOCK ROUND" }), _jsx("th", { children: "TRANSACTION HASH" }), _jsx("th", { children: "CONTRACT ADDRESS" }), _jsx("th", { children: "LOG INDEX" })] }) }), _jsx("tbody", { children: filteredEvents.map((event, idx) => (_jsxs("tr", { children: [_jsx("td", { children: _jsxs("span", { className: "status-badge", style: { padding: "0.2rem 0.5rem", fontSize: "0.65rem" }, children: [_jsx("span", { className: "pulse-dot" }), _jsx("span", { children: event.projection_status || "canonical" })] }) }), _jsx("td", { style: { fontWeight: 700, color: "var(--text-primary)" }, children: event.event_name }), _jsxs("td", { children: ["#", event.block_number] }), _jsx("td", { children: _jsxs("span", { style: { color: "var(--accent-cyan)" }, children: [event.transaction_hash.slice(0, 14), "...", event.transaction_hash.slice(-8)] }) }), _jsxs("td", { children: [event.contract_address.slice(0, 10), "...", event.contract_address.slice(-6)] }), _jsxs("td", { children: ["[", event.log_index, "]"] })] }, event.event_id || idx))) })] }) })] }));
};
