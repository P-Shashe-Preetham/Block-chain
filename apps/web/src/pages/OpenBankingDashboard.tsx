import React, { useState, useEffect } from 'react';

const API_BASE = 'http://127.0.0.1:8000';

export default function OpenBankingDashboard() {
  const [activePersona, setActivePersona] = useState<'USER' | 'TSP' | 'BANK' | 'REGULATOR'>('USER');

  // State Data
  const [userWallet, setUserWallet] = useState('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
  const [bankWallet, setBankWallet] = useState('0x3C44CdD05a57028476078453851002F133ca588a'); // Bank A
  const [tspWallet, setTspWallet] = useState('0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc'); // TSP 1
  const [dataType, setDataType] = useState('TRANSACTIONS');

  // Fetched Data
  const [identityStatus, setIdentityStatus] = useState<any>(null);
  const [consents, setConsents] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditStats, setAuditStats] = useState<any>(null);

  // TSP Flow State
  const [accessEvaluation, setAccessEvaluation] = useState<any>(null);
  const [jwtToken, setJwtToken] = useState<string>('');
  const [fetchedBankData, setFetchedBankData] = useState<any>(null);
  const [apiError, setApiError] = useState<string>('');

  // Form State
  const [grantDuration, setGrantDuration] = useState<number>(3600);
  const [notification, setNotification] = useState<string>('');

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [userWallet]);

  const refreshData = async () => {
    try {
      // 1. Identity Status
      const idRes = await fetch(`${API_BASE}/api/identity/status/${userWallet}`).catch(() => null);
      if (idRes && idRes.ok) setIdentityStatus(await idRes.json());

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
    } catch (e) {
      console.warn("API offline or connection failed:", e);
    }
  };

  const showNotification = (msg: string) => {
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
    } catch (e: any) {
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
    } catch (e: any) {
      showNotification('Error granting consent: ' + e.message);
    }
  };

  const handleRevokeConsent = async (consentId: string) => {
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
    } catch (e: any) {
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
      } else {
        setJwtToken('');
        setApiError(`Access Denied: ${data.reason}`);
      }
      refreshData();
    } catch (e: any) {
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
      } else {
        setFetchedBankData(data);
        showNotification('Bank API data successfully retrieved!');
      }
      refreshData();
    } catch (e: any) {
      setApiError('Bank API request failed: ' + e.message);
    }
  };

  const handleApproveOrg = async (wallet: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/organizations/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: wallet })
      });
      const data = await res.json();
      showNotification(data.message || 'Organization approved');
      refreshData();
    } catch (e: any) {
      showNotification('Approve failed: ' + e.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0f1d',
      color: '#f1f5f9',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      padding: '24px'
    }}>
      {/* Header Banner */}
      <header style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid #334155',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>🔐</span>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Open Banking Blockchain Identity & Access Control
            </h1>
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Decentralized Role-Based Access Control, Granular Consent Management & Cryptographic Audit System
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '8px 16px', textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#64748b' }}>SYSTEM STATUS</div>
            <div style={{ fontSize: '13px', color: '#4ade80', fontWeight: 600 }}>🟢 FastAPI & Hardhat Online</div>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {notification && (
        <div style={{
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
        }}>
          <span>✨</span> {notification}
        </div>
      )}

      {/* Persona Tabs Bar */}
      <nav style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        background: '#0f172a',
        padding: '8px',
        borderRadius: '14px',
        border: '1px solid #1e293b'
      }}>
        {[
          { id: 'USER', label: '👤 User Persona Dashboard', desc: 'Manage Identity & Consents' },
          { id: 'TSP', label: '⚡ TSP Persona Dashboard', desc: 'Request Tokens & Fetch APIs' },
          { id: 'BANK', label: '🏦 Bank Persona Dashboard', desc: 'Monitor Consents & Access' },
          { id: 'REGULATOR', label: '🛡️ Regulator Dashboard', desc: 'Approve Orgs & Audit Logs' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActivePersona(tab.id as any)}
            style={{
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
            }}
          >
            <div style={{ fontSize: '15px' }}>{tab.label}</div>
            <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>{tab.desc}</div>
          </button>
        ))}
      </nav>

      {/* Stats Summary Panel */}
      {auditStats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {[
            { label: 'Registered Users', value: auditStats.registered_users, color: '#38bdf8' },
            { label: 'Organizations', value: auditStats.registered_organizations, color: '#a855f7' },
            { label: 'Active Consents', value: auditStats.active_consents, color: '#4ade80' },
            { label: 'Access Requests', value: auditStats.total_audit_logs, color: '#f59e0b' },
            { label: 'Approved Requests', value: auditStats.granted_requests, color: '#22c55e' },
            { label: 'Denied Requests', value: auditStats.denied_requests, color: '#ef4444' }
          ].map((stat, i) => (
            <div key={i} style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{stat.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: stat.color, marginTop: '4px' }}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* PERSONA 1: USER DASHBOARD */}
      {activePersona === 'USER' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Identity & Status */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#38bdf8' }}>👤 User Identity Profile</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>User Wallet Address</label>
              <input
                type="text"
                value={userWallet}
                onChange={e => setUserWallet(e.target.value)}
                style={{
                  width: '100%',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '10px',
                  color: '#f8fafc',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>Identity Status:</span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: identityStatus?.status === 'ACTIVE' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: identityStatus?.status === 'ACTIVE' ? '#4ade80' : '#ef4444'
                }}>
                  {identityStatus?.status || 'UNKNOWN'}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                DID: <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>{identityStatus?.did || 'N/A'}</span>
              </div>
            </div>

            <button
              onClick={handleVerifyIdentity}
              style={{
                width: '100%',
                background: 'linear-gradient(90deg, #0284c7, #2563eb)',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Verify Identity & Set ACTIVE
            </button>
          </div>

          {/* Grant Consent Form */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#4ade80' }}>📝 Grant Open Banking Access Consent</h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Select Bank</label>
              <select
                value={bankWallet}
                onChange={e => setBankWallet(e.target.value)}
                style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: '#fff' }}
              >
                <option value="0x3C44CdD05a57028476078453851002F133ca588a">Bank A (Apex Financial)</option>
                <option value="0x70997970C51812dc3A010C7d01b50e0d17dc79C9">Bank B (Beacon Trust)</option>
                <option value="0x90F79bf6EB2c4f870365E785982E1f101E93b906">Bank C (Crest Capital)</option>
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Third-Party Service Provider (TSP)</label>
              <input
                type="text"
                value={tspWallet}
                onChange={e => setTspWallet(e.target.value)}
                style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: '#fff', fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Data Scope</label>
                <select
                  value={dataType}
                  onChange={e => setDataType(e.target.value)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: '#fff' }}
                >
                  <option value="ACCOUNT_INFO">ACCOUNT_INFO</option>
                  <option value="BALANCE">BALANCE</option>
                  <option value="TRANSACTIONS">TRANSACTIONS</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Consent Duration</label>
                <select
                  value={grantDuration}
                  onChange={e => setGrantDuration(Number(e.target.value))}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: '#fff' }}
                >
                  <option value={3600}>1 Hour</option>
                  <option value={86400}>24 Hours</option>
                  <option value={604800}>7 Days</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGrantConsent}
              style={{
                width: '100%',
                background: 'linear-gradient(90deg, #16a34a, #059669)',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Sign & Store Consent On Blockchain
            </button>
          </div>

          {/* User Consents List */}
          <div style={{ gridColumn: '1 / -1', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#f59e0b' }}>📋 Active User Consents</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#1e293b', color: '#94a3b8', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Consent ID</th>
                  <th style={{ padding: '12px' }}>User Wallet</th>
                  <th style={{ padding: '12px' }}>TSP Wallet</th>
                  <th style={{ padding: '12px' }}>Data Scope</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {consents.map((c, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#38bdf8' }}>{c.consent_id}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#94a3b8' }}>{c.user_wallet.substring(0, 10)}...</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#94a3b8' }}>{c.tsp_wallet.substring(0, 10)}...</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: '#334155', padding: '4px 8px', borderRadius: '6px' }}>{c.data_type}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ color: c.active ? '#4ade80' : '#ef4444', fontWeight: 600 }}>
                        {c.active ? 'ACTIVE' : 'REVOKED'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {c.active && (
                        <button
                          onClick={() => handleRevokeConsent(c.consent_id)}
                          style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PERSONA 2: TSP DASHBOARD */}
      {activePersona === 'TSP' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#a855f7' }}>⚡ Request Access & Authorization Token</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Target User Wallet</label>
              <input type="text" value={userWallet} onChange={e => setUserWallet(e.target.value)} style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: '#fff', fontFamily: 'monospace' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Target Bank</label>
              <select value={bankWallet} onChange={e => setBankWallet(e.target.value)} style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: '#fff' }}>
                <option value="0x3C44CdD05a57028476078453851002F133ca588a">Bank A (Apex Financial)</option>
                <option value="0x70997970C51812dc3A010C7d01b50e0d17dc79C9">Bank B (Beacon Trust)</option>
                <option value="0x90F79bf6EB2c4f870365E785982E1f101E93b906">Bank C (Crest Capital)</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Requested Scope</label>
              <select value={dataType} onChange={e => setDataType(e.target.value)} style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: '#fff' }}>
                <option value="ACCOUNT_INFO">ACCOUNT_INFO</option>
                <option value="BALANCE">BALANCE</option>
                <option value="TRANSACTIONS">TRANSACTIONS</option>
              </select>
            </div>

            <button
              onClick={handleEvaluateAccess}
              style={{ width: '100%', background: 'linear-gradient(90deg, #7c3aed, #9333ea)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', marginBottom: '12px' }}
            >
              Evaluate Access Control & Generate JWT Token
            </button>

            {jwtToken && (
              <div style={{ background: '#1e293b', borderRadius: '8px', padding: '12px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '12px', color: '#4ade80', fontWeight: 600, marginBottom: '6px' }}>🔑 Active Bearer JWT Token:</div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#cbd5e1', wordBreak: 'break-all', background: '#0f172a', padding: '8px', borderRadius: '6px' }}>
                  {jwtToken}
                </div>
              </div>
            )}
          </div>

          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#38bdf8' }}>🏦 Query Bank API</h3>
            
            <button
              onClick={handleFetchBankData}
              disabled={!jwtToken}
              style={{
                width: '100%',
                background: jwtToken ? 'linear-gradient(90deg, #0284c7, #2563eb)' : '#334155',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: jwtToken ? 'pointer' : 'not-allowed',
                marginBottom: '16px'
              }}
            >
              Execute Bank API Call with Bearer Token
            </button>

            {apiError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                ⚠️ {apiError}
              </div>
            )}

            {fetchedBankData && (
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                  Response from {fetchedBankData.bank}
                </div>
                <pre style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#4ade80', overflowX: 'auto' }}>
                  {JSON.stringify(fetchedBankData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PERSONA 3: BANK DASHBOARD */}
      {activePersona === 'BANK' && (
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#38bdf8' }}>🏦 Bank Authorization & Customer Consents Monitor</h3>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px' }}>
            Bank node verifying live consents and access evaluations for Apex Financial (Bank A)
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#1e293b', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>User Wallet</th>
                <th style={{ padding: '12px' }}>TSP Wallet</th>
                <th style={{ padding: '12px' }}>Data Scope</th>
                <th style={{ padding: '12px' }}>Consent Status</th>
                <th style={{ padding: '12px' }}>API Verification</th>
              </tr>
            </thead>
            <tbody>
              {consents.map((c, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', color: '#f8fafc' }}>{c.user_wallet}</td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', color: '#94a3b8' }}>{c.tsp_wallet}</td>
                  <td style={{ padding: '12px' }}>{c.data_type}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ color: c.active ? '#4ade80' : '#ef4444', fontWeight: 600 }}>
                      {c.active ? 'ACTIVE' : 'REVOKED'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#38bdf8', fontWeight: 600 }}>
                    {c.active ? '✅ ENFORCED BY BLOCKCHAIN' : '🛑 BLOCKED AT API GATEWAY'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PERSONA 4: REGULATOR DASHBOARD */}
      {activePersona === 'REGULATOR' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {/* Organizations Management */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#a855f7' }}>🛡️ Ecosystem Organization Registry & Licensing</h3>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#1e293b', color: '#94a3b8', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Org Name</th>
                  <th style={{ padding: '12px' }}>Role</th>
                  <th style={{ padding: '12px' }}>License ID</th>
                  <th style={{ padding: '12px' }}>Wallet Address</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{org.name}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: '#334155', padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>{org.role}</span>
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>{org.license_id}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#94a3b8' }}>{org.wallet_address}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ color: org.status === 'APPROVED' ? '#4ade80' : '#f59e0b', fontWeight: 600 }}>
                        {org.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {org.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleApproveOrg(org.wallet_address)}
                          style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Audit Logs Stream */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#f59e0b' }}>📜 System-Wide Immutable Audit Trail</h3>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#1e293b', color: '#94a3b8', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Log ID</th>
                  <th style={{ padding: '12px' }}>User Wallet</th>
                  <th style={{ padding: '12px' }}>Bank</th>
                  <th style={{ padding: '12px' }}>TSP</th>
                  <th style={{ padding: '12px' }}>Scope</th>
                  <th style={{ padding: '12px' }}>Decision</th>
                  <th style={{ padding: '12px' }}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#38bdf8' }}>{log.log_id}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#94a3b8' }}>{log.user_wallet.substring(0, 8)}...</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#94a3b8' }}>{log.bank_wallet.substring(0, 8)}...</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#94a3b8' }}>{log.tsp_wallet.substring(0, 8)}...</td>
                    <td style={{ padding: '12px' }}>{log.data_type}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '11px',
                        background: log.granted ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: log.granted ? '#4ade80' : '#ef4444'
                      }}>
                        {log.granted ? 'ALLOWED' : 'DENIED'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#cbd5e1', fontSize: '12px' }}>{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
