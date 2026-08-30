import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
const API_BASE = 'http://127.0.0.1:8000';
export default function OpenBankingDashboard() {
    const [activePersona, setActivePersona] = useState('USER');
    // State Data
    const [userWallet, setUserWallet] = useState('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
    const [bankWallet, setBankWallet] = useState('0x3C44CdD05a57028476078453851002F133ca588a'); // Bank A
    const [tspWallet, setTspWallet] = useState('0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc'); // TSP 1
    const [dataType, setDataType] = useState('TRANSACTIONS');
    // Fetched Data
    const [identityStatus, setIdentityStatus] = useState(null);
    const [consents, setConsents] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [auditStats, setAuditStats] = useState(null);
    // TSP Flow State
    const [accessEvaluation, setAccessEvaluation] = useState(null);
    const [jwtToken, setJwtToken] = useState('');
    const [fetchedBankData, setFetchedBankData] = useState(null);
    const [apiError, setApiError] = useState('');
    // Form State
    const [grantDuration, setGrantDuration] = useState(3600);
    const [notification, setNotification] = useState('');
    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 5000);
        return () => clearInterval(interval);
    }, [userWallet]);
    const refreshData = async () => {
        try {
            // 1. Identity Status
            const idRes = await fetch(`${API_BASE}/api/identity/status/${userWallet}`).catch(() => null);
            if (idRes && idRes.ok)
                setIdentityStatus(await idRes.json());
            // 2. Consents
            const cRes = await fetch(`${API_BASE}/api/consent/list`).catch(() => null);
            if (cRes && cRes.ok) {
                const data = await cRes.json();
                setConsents(data.consents || []);
            }
            // 3. Organizations
            const orgRes = await fetch(`${API_BASE}/api/organizations/list`).catch(() => null);
            if (orgRes && orgRes.ok) {
                const data = await orgRes.json();
                setOrganizations(data.organizations || []);
            }
            // 4. Audit Logs & Stats
            const audRes = await fetch(`${API_BASE}/api/audit/logs`).catch(() => null);
            if (audRes && audRes.ok) {
                const data = await audRes.json();
                setAuditLogs(data.audit_logs || []);
            }
            const statRes = await fetch(`${API_BASE}/api/audit/stats`).catch(() => null);
            if (statRes && statRes.ok) {
                setAuditStats(await statRes.json());
            }
        }
        catch (e) {
            console.warn("API offline or connection failed:", e);
        }
    };
    const showNotification = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(''), 4000);
    };
    // Actions
    const handleVerifyIdentity = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/identity/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet_address: userWallet })
            });
            const data = await res.json();
            showNotification(data.message || 'Identity verified!');
            refreshData();
        }
        catch (e) {
            showNotification('Failed to verify identity: ' + e.message);
        }
    };
    const handleGrantConsent = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/consent/grant`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_wallet: userWallet,
                    bank_wallet: bankWallet,
                    tsp_wallet: tspWallet,
                    data_type: dataType,
                    duration_seconds: Number(grantDuration)
                })
            });
            const data = await res.json();
            showNotification(`Consent granted! ID: ${data.consent.consent_id}`);
            refreshData();
        }
        catch (e) {
            showNotification('Error granting consent: ' + e.message);
        }
    };
    const handleRevokeConsent = async (consentId) => {
        try {
            const res = await fetch(`${API_BASE}/api/consent/revoke`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    consent_id: consentId,
                    user_wallet: userWallet
                })
            });
            const data = await res.json();
            showNotification(data.message || 'Consent revoked');
            refreshData();
        }
        catch (e) {
            showNotification('Error revoking consent: ' + e.message);
        }
    };
    const handleEvaluateAccess = async () => {
        setApiError('');
        setFetchedBankData(null);
        try {
            const res = await fetch(`${API_BASE}/api/access/evaluate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_wallet: userWallet,
                    bank_wallet: bankWallet,
                    tsp_wallet: tspWallet,
                    data_type: dataType
                })
            });
            const data = await res.json();
            setAccessEvaluation(data);
            if (data.allowed && data.access_token) {
                setJwtToken(data.access_token);
                showNotification('Authorization granted! JWT Access Token generated.');
            }
            else {
                setJwtToken('');
                setApiError(`Access Denied: ${data.reason}`);
            }
            refreshData();
        }
        catch (e) {
            setApiError('Error evaluating access: ' + e.message);
        }
    };
    const handleFetchBankData = async () => {
        if (!jwtToken) {
            setApiError('No JWT Access Token available. Request token first.');
            return;
        }
        setApiError('');
        try {
            const endpoint = dataType === 'TRANSACTIONS'
                ? `${API_BASE}/api/banks/bank-a/transactions/acc_banka_101`
                : `${API_BASE}/api/banks/bank-a/accounts`;
            const res = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${jwtToken}` }
            });
            const data = await res.json();
            if (!res.ok) {
                setApiError(data.detail || 'Access Denied by Bank API');
                setFetchedBankData(null);
            }
            else {
                setFetchedBankData(data);
                showNotification('Bank API data successfully retrieved!');
            }
            refreshData();
        }
        catch (e) {
            setApiError('Bank API request failed: ' + e.message);
        }
    };
    const handleApproveOrg = async (wallet) => {
        try {
            const res = await fetch(`${API_BASE}/api/organizations/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet_address: wallet })
            });
            const data = await res.json();
            showNotification(data.message || 'Organization approved');
            refreshData();
        }
        catch (e) {
            showNotification('Approve failed: ' + e.message);
        }
    };
    return (_jsxs("div", { style: {
            minHeight: '100vh',
            backgroundColor: '#0a0f1d',
            color: '#f1f5f9',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            padding: '24px'
        }, children: [_jsxs("header", { style: {
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    border: '1px solid #334155',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '24px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }, children: [_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [_jsx("span", { style: { fontSize: '28px' }, children: "\uD83D\uDD10" }), _jsx("h1", { style: { margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }, children: "Open Banking Blockchain Identity & Access Control" })] }), _jsx("p", { style: { margin: '6px 0 0 0', color: '#94a3b8', fontSize: '14px' }, children: "Decentralized Role-Based Access Control, Granular Consent Management & Cryptographic Audit System" })] }), _jsx("div", { style: { display: 'flex', gap: '16px', alignItems: 'center' }, children: _jsxs("div", { style: { background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '8px 16px', textAlign: 'right' }, children: [_jsx("div", { style: { fontSize: '11px', color: '#64748b' }, children: "SYSTEM STATUS" }), _jsx("div", { style: { fontSize: '13px', color: '#4ade80', fontWeight: 600 }, children: "\uD83D\uDFE2 FastAPI & Hardhat Online" })] }) })] }), notification && (_jsxs("div", { style: {
                    position: 'fixed',
                    top: '24px',
                    right: '24px',
                    background: 'linear-gradient(90deg, #0284c7, #2563eb)',
                    color: '#ffffff',
                    padding: '14px 20px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                    zIndex: 9999,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    animation: 'fadeIn 0.3s ease'
                }, children: [_jsx("span", { children: "\u2728" }), " ", notification] })), _jsx("nav", { style: {
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '24px',
                    background: '#0f172a',
                    padding: '8px',
                    borderRadius: '14px',
                    border: '1px solid #1e293b'
                }, children: [
                    { id: 'USER', label: '👤 User Persona Dashboard', desc: 'Manage Identity & Consents' },
                    { id: 'TSP', label: '⚡ TSP Persona Dashboard', desc: 'Request Tokens & Fetch APIs' },
                    { id: 'BANK', label: '🏦 Bank Persona Dashboard', desc: 'Monitor Consents & Access' },
                    { id: 'REGULATOR', label: '🛡️ Regulator Dashboard', desc: 'Approve Orgs & Audit Logs' }
                ].map(tab => (_jsxs("button", { onClick: () => setActivePersona(tab.id), style: {
                        flex: 1,
                        padding: '14px 16px',
                        borderRadius: '10px',
                        border: activePersona === tab.id ? '1px solid #38bdf8' : '1px solid transparent',
                        background: activePersona === tab.id ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' : 'transparent',
                        color: activePersona === tab.id ? '#38bdf8' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: activePersona === tab.id ? 700 : 500,
                        textAlign: 'left',
                        transition: 'all 0.2s ease'
                    }, children: [_jsx("div", { style: { fontSize: '15px' }, children: tab.label }), _jsx("div", { style: { fontSize: '11px', opacity: 0.7, marginTop: '2px' }, children: tab.desc })] }, tab.id))) }), auditStats && (_jsx("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px'
                }, children: [
                    { label: 'Registered Users', value: auditStats.registered_users, color: '#38bdf8' },
                    { label: 'Organizations', value: auditStats.registered_organizations, color: '#a855f7' },
                    { label: 'Active Consents', value: auditStats.active_consents, color: '#4ade80' },
                    { label: 'Access Requests', value: auditStats.total_audit_logs, color: '#f59e0b' },
                    { label: 'Approved Requests', value: auditStats.granted_requests, color: '#22c55e' },
                    { label: 'Denied Requests', value: auditStats.denied_requests, color: '#ef4444' }
                ].map((stat, i) => (_jsxs("div", { style: {
                        background: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '12px',
                        padding: '16px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }, children: [_jsx("div", { style: { fontSize: '12px', color: '#64748b', fontWeight: 600 }, children: stat.label }), _jsx("div", { style: { fontSize: '24px', fontWeight: 800, color: stat.color, marginTop: '4px' }, children: stat.value })] }, i))) })), activePersona === 'USER' && (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }, children: [_jsxs("div", { style: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', color: '#38bdf8' }, children: "\uD83D\uDC64 User Identity Profile" }), _jsxs("div", { style: { marginBottom: '16px' }, children: [_jsx("label", { style: { fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }, children: "User Wallet Address" }), _jsx("input", { type: "text", value: userWallet, onChange: e => setUserWallet(e.target.value), style: {
                                            width: '100%',
                                            background: '#1e293b',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            padding: '10px',
                                            color: '#f8fafc',
                                            fontFamily: 'monospace'
                                        } })] }), _jsxs("div", { style: { background: '#1e293b', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid #334155' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }, children: [_jsx("span", { style: { color: '#94a3b8', fontSize: '13px' }, children: "Identity Status:" }), _jsx("span", { style: {
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: 700,
                                                    background: identityStatus?.status === 'ACTIVE' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                    color: identityStatus?.status === 'ACTIVE' ? '#4ade80' : '#ef4444'
                                                }, children: identityStatus?.status || 'UNKNOWN' })] }), _jsxs("div", { style: { fontSize: '12px', color: '#94a3b8' }, children: ["DID: ", _jsx("span", { style: { color: '#cbd5e1', fontFamily: 'monospace' }, children: identityStatus?.did || 'N/A' })] })] }), _jsx("button", { onClick: handleVerifyIdentity, style: {
                                    width: '100%',
                                    background: 'linear-gradient(90deg, #0284c7, #2563eb)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }, children: "Verify Identity & Set ACTIVE" })] }), _jsxs("div", { style: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', color: '#4ade80' }, children: "\uD83D\uDCDD Grant Open Banking Access Consent" }), _jsxs("div", { style: { marginBottom: '12px' }, children: [_jsx("label", { style: { fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }, children: "Select Bank" }), _jsxs("select", { value: bankWallet, onChange: e => setBankWallet(e.target.value), style: { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: '#fff' }, children: [_jsx("option", { value: "0x3C44CdD05a57028476078453851002F133ca588a", children: "Bank A (Apex Financial)" }), _jsx("option", { value: "0x70997970C51812dc3A010C7d01b50e0d17dc79C9", children: "Bank B (Beacon Trust)" }), _jsx("option", { value: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", children: "Bank C (Crest Capital)" })] })] }), _jsxs("div", { style: { marginBottom: '12px' }, children: [_jsx("label", { style: { fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }, children: "Third-Party Service Provider (TSP)" }), _jsx("input", { type: "text", value: tspWallet, onChange: e => setTspWallet(e.target.value), style: { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: '#fff', fontFamily: 'monospace' } })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }, children: [_jsxs("div", { children: [_jsx("label", { style: { fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }, children: "Data Scope" }), _jsxs("select", { value: dataType, onChange: e => setDataType(e.target.value), style: { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: '#fff' }, children: [_jsx("option", { value: "ACCOUNT_INFO", children: "ACCOUNT_INFO" }), _jsx("option", { value: "BALANCE", children: "BALANCE" }), _jsx("option", { value: "TRANSACTIONS", children: "TRANSACTIONS" })] })] }), _jsxs("div", { children: [_jsx("label", { style: { fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }, children: "Consent Duration" }), _jsxs("select", { value: grantDuration, onChange: e => setGrantDuration(Number(e.target.value)), style: { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: '#fff' }, children: [_jsx("option", { value: 3600, children: "1 Hour" }), _jsx("option", { value: 86400, children: "24 Hours" }), _jsx("option", { value: 604800, children: "7 Days" })] })] })] }), _jsx("button", { onClick: handleGrantConsent, style: {
                                    width: '100%',
                                    background: 'linear-gradient(90deg, #16a34a, #059669)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }, children: "Sign & Store Consent On Blockchain" })] }), _jsxs("div", { style: { gridColumn: '1 / -1', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', color: '#f59e0b' }, children: "\uD83D\uDCCB Active User Consents" }), _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { background: '#1e293b', color: '#94a3b8', textAlign: 'left' }, children: [_jsx("th", { style: { padding: '12px' }, children: "Consent ID" }), _jsx("th", { style: { padding: '12px' }, children: "User Wallet" }), _jsx("th", { style: { padding: '12px' }, children: "TSP Wallet" }), _jsx("th", { style: { padding: '12px' }, children: "Data Scope" }), _jsx("th", { style: { padding: '12px' }, children: "Status" }), _jsx("th", { style: { padding: '12px' }, children: "Action" })] }) }), _jsx("tbody", { children: consents.map((c, idx) => (_jsxs("tr", { style: { borderBottom: '1px solid #1e293b' }, children: [_jsx("td", { style: { padding: '12px', fontFamily: 'monospace', color: '#38bdf8' }, children: c.consent_id }), _jsxs("td", { style: { padding: '12px', fontFamily: 'monospace', color: '#94a3b8' }, children: [c.user_wallet.substring(0, 10), "..."] }), _jsxs("td", { style: { padding: '12px', fontFamily: 'monospace', color: '#94a3b8' }, children: [c.tsp_wallet.substring(0, 10), "..."] }), _jsx("td", { style: { padding: '12px' }, children: _jsx("span", { style: { background: '#334155', padding: '4px 8px', borderRadius: '6px' }, children: c.data_type }) }), _jsx("td", { style: { padding: '12px' }, children: _jsx("span", { style: { color: c.active ? '#4ade80' : '#ef4444', fontWeight: 600 }, children: c.active ? 'ACTIVE' : 'REVOKED' }) }), _jsx("td", { style: { padding: '12px' }, children: c.active && (_jsx("button", { onClick: () => handleRevokeConsent(c.consent_id), style: { background: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }, children: "Revoke" })) })] }, idx))) })] })] })] })), activePersona === 'TSP' && (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }, children: [_jsxs("div", { style: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', color: '#a855f7' }, children: "\u26A1 Request Access & Authorization Token" }), _jsxs("div", { style: { marginBottom: '12px' }, children: [_jsx("label", { style: { fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }, children: "Target User Wallet" }), _jsx("input", { type: "text", value: userWallet, onChange: e => setUserWallet(e.target.value), style: { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: '#fff', fontFamily: 'monospace' } })] }), _jsxs("div", { style: { marginBottom: '12px' }, children: [_jsx("label", { style: { fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }, children: "Target Bank" }), _jsxs("select", { value: bankWallet, onChange: e => setBankWallet(e.target.value), style: { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: '#fff' }, children: [_jsx("option", { value: "0x3C44CdD05a57028476078453851002F133ca588a", children: "Bank A (Apex Financial)" }), _jsx("option", { value: "0x70997970C51812dc3A010C7d01b50e0d17dc79C9", children: "Bank B (Beacon Trust)" }), _jsx("option", { value: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", children: "Bank C (Crest Capital)" })] })] }), _jsxs("div", { style: { marginBottom: '16px' }, children: [_jsx("label", { style: { fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }, children: "Requested Scope" }), _jsxs("select", { value: dataType, onChange: e => setDataType(e.target.value), style: { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: '#fff' }, children: [_jsx("option", { value: "ACCOUNT_INFO", children: "ACCOUNT_INFO" }), _jsx("option", { value: "BALANCE", children: "BALANCE" }), _jsx("option", { value: "TRANSACTIONS", children: "TRANSACTIONS" })] })] }), _jsx("button", { onClick: handleEvaluateAccess, style: { width: '100%', background: 'linear-gradient(90deg, #7c3aed, #9333ea)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', marginBottom: '12px' }, children: "Evaluate Access Control & Generate JWT Token" }), jwtToken && (_jsxs("div", { style: { background: '#1e293b', borderRadius: '8px', padding: '12px', border: '1px solid #334155' }, children: [_jsx("div", { style: { fontSize: '12px', color: '#4ade80', fontWeight: 600, marginBottom: '6px' }, children: "\uD83D\uDD11 Active Bearer JWT Token:" }), _jsx("div", { style: { fontSize: '11px', fontFamily: 'monospace', color: '#cbd5e1', wordBreak: 'break-all', background: '#0f172a', padding: '8px', borderRadius: '6px' }, children: jwtToken })] }))] }), _jsxs("div", { style: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', color: '#38bdf8' }, children: "\uD83C\uDFE6 Query Bank API" }), _jsx("button", { onClick: handleFetchBankData, disabled: !jwtToken, style: {
                                    width: '100%',
                                    background: jwtToken ? 'linear-gradient(90deg, #0284c7, #2563eb)' : '#334155',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    cursor: jwtToken ? 'pointer' : 'not-allowed',
                                    marginBottom: '16px'
                                }, children: "Execute Bank API Call with Bearer Token" }), apiError && (_jsxs("div", { style: { background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }, children: ["\u26A0\uFE0F ", apiError] })), fetchedBankData && (_jsxs("div", { style: { background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }, children: [_jsxs("div", { style: { fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }, children: ["Response from ", fetchedBankData.bank] }), _jsx("pre", { style: { background: '#0f172a', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#4ade80', overflowX: 'auto' }, children: JSON.stringify(fetchedBankData, null, 2) })] }))] })] })), activePersona === 'BANK' && (_jsxs("div", { style: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', color: '#38bdf8' }, children: "\uD83C\uDFE6 Bank Authorization & Customer Consents Monitor" }), _jsx("p", { style: { color: '#94a3b8', fontSize: '13px', marginBottom: '16px' }, children: "Bank node verifying live consents and access evaluations for Apex Financial (Bank A)" }), _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { background: '#1e293b', color: '#94a3b8', textAlign: 'left' }, children: [_jsx("th", { style: { padding: '12px' }, children: "User Wallet" }), _jsx("th", { style: { padding: '12px' }, children: "TSP Wallet" }), _jsx("th", { style: { padding: '12px' }, children: "Data Scope" }), _jsx("th", { style: { padding: '12px' }, children: "Consent Status" }), _jsx("th", { style: { padding: '12px' }, children: "API Verification" })] }) }), _jsx("tbody", { children: consents.map((c, idx) => (_jsxs("tr", { style: { borderBottom: '1px solid #1e293b' }, children: [_jsx("td", { style: { padding: '12px', fontFamily: 'monospace', color: '#f8fafc' }, children: c.user_wallet }), _jsx("td", { style: { padding: '12px', fontFamily: 'monospace', color: '#94a3b8' }, children: c.tsp_wallet }), _jsx("td", { style: { padding: '12px' }, children: c.data_type }), _jsx("td", { style: { padding: '12px' }, children: _jsx("span", { style: { color: c.active ? '#4ade80' : '#ef4444', fontWeight: 600 }, children: c.active ? 'ACTIVE' : 'REVOKED' }) }), _jsx("td", { style: { padding: '12px', color: '#38bdf8', fontWeight: 600 }, children: c.active ? '✅ ENFORCED BY BLOCKCHAIN' : '🛑 BLOCKED AT API GATEWAY' })] }, idx))) })] })] })), activePersona === 'REGULATOR' && (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }, children: [_jsxs("div", { style: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', color: '#a855f7' }, children: "\uD83D\uDEE1\uFE0F Ecosystem Organization Registry & Licensing" }), _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { background: '#1e293b', color: '#94a3b8', textAlign: 'left' }, children: [_jsx("th", { style: { padding: '12px' }, children: "Org Name" }), _jsx("th", { style: { padding: '12px' }, children: "Role" }), _jsx("th", { style: { padding: '12px' }, children: "License ID" }), _jsx("th", { style: { padding: '12px' }, children: "Wallet Address" }), _jsx("th", { style: { padding: '12px' }, children: "Status" }), _jsx("th", { style: { padding: '12px' }, children: "Action" })] }) }), _jsx("tbody", { children: organizations.map((org, idx) => (_jsxs("tr", { style: { borderBottom: '1px solid #1e293b' }, children: [_jsx("td", { style: { padding: '12px', fontWeight: 600 }, children: org.name }), _jsx("td", { style: { padding: '12px' }, children: _jsx("span", { style: { background: '#334155', padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }, children: org.role }) }), _jsx("td", { style: { padding: '12px', fontFamily: 'monospace' }, children: org.license_id }), _jsx("td", { style: { padding: '12px', fontFamily: 'monospace', color: '#94a3b8' }, children: org.wallet_address }), _jsx("td", { style: { padding: '12px' }, children: _jsx("span", { style: { color: org.status === 'APPROVED' ? '#4ade80' : '#f59e0b', fontWeight: 600 }, children: org.status }) }), _jsx("td", { style: { padding: '12px' }, children: org.status !== 'APPROVED' && (_jsx("button", { onClick: () => handleApproveOrg(org.wallet_address), style: { background: '#16a34a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }, children: "Approve" })) })] }, idx))) })] })] }), _jsxs("div", { style: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', color: '#f59e0b' }, children: "\uD83D\uDCDC System-Wide Immutable Audit Trail" }), _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { background: '#1e293b', color: '#94a3b8', textAlign: 'left' }, children: [_jsx("th", { style: { padding: '12px' }, children: "Log ID" }), _jsx("th", { style: { padding: '12px' }, children: "User Wallet" }), _jsx("th", { style: { padding: '12px' }, children: "Bank" }), _jsx("th", { style: { padding: '12px' }, children: "TSP" }), _jsx("th", { style: { padding: '12px' }, children: "Scope" }), _jsx("th", { style: { padding: '12px' }, children: "Decision" }), _jsx("th", { style: { padding: '12px' }, children: "Reason" })] }) }), _jsx("tbody", { children: auditLogs.map((log, idx) => (_jsxs("tr", { style: { borderBottom: '1px solid #1e293b' }, children: [_jsx("td", { style: { padding: '12px', fontFamily: 'monospace', color: '#38bdf8' }, children: log.log_id }), _jsxs("td", { style: { padding: '12px', fontFamily: 'monospace', color: '#94a3b8' }, children: [log.user_wallet.substring(0, 8), "..."] }), _jsxs("td", { style: { padding: '12px', fontFamily: 'monospace', color: '#94a3b8' }, children: [log.bank_wallet.substring(0, 8), "..."] }), _jsxs("td", { style: { padding: '12px', fontFamily: 'monospace', color: '#94a3b8' }, children: [log.tsp_wallet.substring(0, 8), "..."] }), _jsx("td", { style: { padding: '12px' }, children: log.data_type }), _jsx("td", { style: { padding: '12px' }, children: _jsx("span", { style: {
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            fontWeight: 700,
                                                            fontSize: '11px',
                                                            background: log.granted ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                            color: log.granted ? '#4ade80' : '#ef4444'
                                                        }, children: log.granted ? 'ALLOWED' : 'DENIED' }) }), _jsx("td", { style: { padding: '12px', color: '#cbd5e1', fontSize: '12px' }, children: log.reason })] }, idx))) })] })] })] }))] }));
}
