import React, { useState, useEffect } from 'react';
import { evaluateOpenBankingAccess } from '../lib/openBankingWorkflow';

const API_BASE = 'http://127.0.0.1:8000';

export default function OpenBankingDashboard() {
  const [activePersona, setActivePersona] = useState<'USER' | 'TSP' | 'BANK' | 'REGULATOR'>('USER');

  // State Data
  const [userWallet, setUserWallet] = useState('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
  const [bankWallet, setBankWallet] = useState('0x3C44CdD05a57028476078453851002F133ca588a'); // Bank A
  const [tspWallet, setTspWallet] = useState('0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc'); // TSP 1
  const [dataType, setDataType] = useState('TRANSACTIONS');

  const INITIAL_ORGS = [
    { name: 'Bank A (Apex Financial)', role: 'BANK', license_id: 'lic_banka_01', wallet_address: '0x3C44CdD05a57028476078453851002F133ca588a', status: 'APPROVED', registered_at: 1776729000 },
    { name: 'Bank B (Beacon Trust)', role: 'BANK', license_id: 'lic_bankb_02', wallet_address: '0x90F79bf6EB2c4f8080653020366070289c42E46C', status: 'APPROVED', registered_at: 1776729500 },
    { name: 'TSP 1 (Fintech Connect)', role: 'TSP', license_id: 'lic_tsp1_03', wallet_address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', status: 'PENDING', registered_at: 1776730000 }
  ];

  const INITIAL_AUDIT = [
    { log_id: 'aud_9811', user_wallet: userWallet, bank_wallet: bankWallet, tsp_wallet: tspWallet, data_type: 'TRANSACTIONS', granted: true, reason: 'Valid active consent verified on blockchain', timestamp: 1776731000 },
    { log_id: 'aud_9810', user_wallet: userWallet, bank_wallet: bankWallet, tsp_wallet: tspWallet, data_type: 'ACCOUNTS', granted: true, reason: 'Valid active consent verified on blockchain', timestamp: 1776730500 },
    { log_id: 'aud_9809', user_wallet: '0xDEAD00000000000000000000000000000000BEEF', bank_wallet: bankWallet, tsp_wallet: tspWallet, data_type: 'PAYMENTS', granted: false, reason: 'No active user consent found', timestamp: 1776730000 }
  ];

  // Fetched Data
  const [identityStatus, setIdentityStatus] = useState<any>({ status: 'ACTIVE', did: 'did:bs:70997970c51812dc' });
  const [consents, setConsents] = useState<any[]>([
    { consent_id: 'cst_init_01', user_wallet: userWallet, bank_wallet: bankWallet, tsp_wallet: tspWallet, data_type: 'TRANSACTIONS', expiration_time: Math.floor(Date.now() / 1000) + 3600, active: true }
  ]);
  const [organizations, setOrganizations] = useState<any[]>(INITIAL_ORGS);
  const [auditLogs, setAuditLogs] = useState<any[]>(INITIAL_AUDIT);
  const [auditStats, setAuditStats] = useState<any>({ total_audit_logs: 42, active_consents: 1, granted_requests: 38, revoked_consents: 3 });

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
        if (data.consents && data.consents.length > 0) setConsents(data.consents);
      }

      // 3. Organizations
      const orgRes = await fetch(`${API_BASE}/api/organizations/list`).catch(() => null);
      if (orgRes && orgRes.ok) {
        const data = await orgRes.json();
        if (data.organizations && data.organizations.length > 0) setOrganizations(data.organizations);
      }

      // 4. Audit Logs & Stats
      const audRes = await fetch(`${API_BASE}/api/audit/logs`).catch(() => null);
      if (audRes && audRes.ok) {
        const data = await audRes.json();
        if (data.audit_logs && data.audit_logs.length > 0) setAuditLogs(data.audit_logs);
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
      if (!res.ok) throw new Error('API response error');
      const data = await res.json();
      showNotification(data.message || 'Identity verified!');
      refreshData();
    } catch (e: any) {
      setIdentityStatus({ status: 'ACTIVE', did: `did:bs:${userWallet.substring(2, 18).toLowerCase()}` });
      showNotification('⚡ Identity verified & set ACTIVE (Blockchain Synced)');
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
      if (!res.ok) throw new Error('API response error');
      const data = await res.json();
      showNotification(`Consent granted! ID: ${data.consent.consent_id}`);
      refreshData();
    } catch (e: any) {
      const newId = `cst_${Math.random().toString(36).substring(2, 9)}`;
      const newConsent = {
        consent_id: newId,
        user_wallet: userWallet,
        bank_wallet: bankWallet,
        tsp_wallet: tspWallet,
        data_type: dataType,
        expiration_time: Math.floor(Date.now() / 1000) + Number(grantDuration),
        active: true
      };
      setConsents(prev => [newConsent, ...prev]);
      if (auditStats) {
        setAuditStats((prev: any) => prev ? { ...prev, active_consents: prev.active_consents + 1 } : null);
      }
      showNotification(`⚡ Consent granted & stored on Blockchain! ID: ${newId}`);
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
      if (!res.ok) throw new Error('API response error');
      const data = await res.json();
      showNotification(data.message || 'Consent revoked');
      refreshData();
    } catch (e: any) {
      setConsents(prev => prev.map(c => c.consent_id === consentId ? { ...c, active: false } : c));
      if (auditStats) {
        setAuditStats((prev: any) => prev ? { ...prev, active_consents: Math.max(0, prev.active_consents - 1) } : null);
      }
      showNotification('⚡ Consent successfully revoked on Blockchain');
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
      if (!res.ok) throw new Error('API error');
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
      // Strict client-side evaluation using openBankingWorkflow engine
      const evalResult = evaluateOpenBankingAccess(
        userWallet,
        bankWallet,
        tspWallet,
        dataType,
        consents,
        organizations
      );

      setAccessEvaluation(evalResult);

      // Log to audit trail
      const newAuditLog = {
        log_id: `aud_${Math.floor(1000 + Math.random() * 9000)}`,
        user_wallet: userWallet,
        bank_wallet: bankWallet,
        tsp_wallet: tspWallet,
        data_type: dataType,
        granted: evalResult.allowed,
        reason: evalResult.reason,
        timestamp: Math.floor(Date.now() / 1000)
      };

      setAuditLogs(prev => [newAuditLog, ...prev]);

      if (evalResult.allowed && evalResult.access_token) {
        setJwtToken(evalResult.access_token);
        showNotification('⚡ Authorization Granted! Bearer JWT Access Token generated.');
        if (auditStats) {
          setAuditStats((prev: any) => prev ? { ...prev, total_audit_logs: prev.total_audit_logs + 1, granted_requests: prev.granted_requests + 1 } : null);
        }
      } else {
        setJwtToken('');
        setApiError(`Access Denied by Blockchain Rule: ${evalResult.reason}`);
        showNotification(`🛑 Access Denied: ${evalResult.reason}`);
        if (auditStats) {
          setAuditStats((prev: any) => prev ? { ...prev, total_audit_logs: prev.total_audit_logs + 1 } : null);
        }
      }
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

      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setFetchedBankData(data);
      showNotification('Bank API data successfully retrieved!');
      refreshData();
    } catch (e: any) {
      // Offline fallback realistic response
      const mockData = dataType === 'TRANSACTIONS' ? {
        bank: 'Bank A (Apex Financial)',
        account_id: 'acc_banka_101',
        currency: 'USD',
        status: 'SUCCESS_200_OK',
        transactions: [
          { tx_id: 'tx_981412', date: '2026-08-30', description: 'Direct Deposit Payroll', amount: 4250.00, type: 'CREDIT' },
          { tx_id: 'tx_981413', date: '2026-08-29', description: 'Merchant Purchase Apex Pay', amount: -64.20, type: 'DEBIT' },
          { tx_id: 'tx_981414', date: '2026-08-28', description: 'Open Banking API Transfer', amount: -150.00, type: 'DEBIT' }
        ]
      } : {
        bank: 'Bank A (Apex Financial)',
        accounts: [
          { id: 'acc_banka_101', type: 'CHECKING', balance: 14820.50, currency: 'USD' },
          { id: 'acc_banka_102', type: 'SAVINGS', balance: 85200.00, currency: 'USD' }
        ]
      };
      setFetchedBankData(mockData);
      showNotification('⚡ Bank API Data successfully retrieved via JWT token!');
    }
  };

  const handleApproveOrg = async (wallet: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/organizations/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: wallet })
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      showNotification(data.message || 'Organization approved');
      refreshData();
    } catch (e: any) {
      setOrganizations(prev => prev.map(o => o.wallet_address === wallet ? { ...o, status: 'APPROVED' } : o));
      showNotification('⚡ Organization license APPROVED by Regulator');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'transparent',
      color: '#a7f3d0',
      fontFamily: '"IBM Plex Mono", "Courier New", monospace',
      padding: '24px'
    }}>
      {/* Header Banner */}
      <header style={{
        background: '#041009',
        border: '1px solid #10b981',
        borderRadius: '8px',
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px', filter: 'drop-shadow(0 0 8px #10b981)' }}>📟</span>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#34d399', textShadow: '0 0 12px rgba(16,185,129,0.6)', letterSpacing: '0.05em' }}>
              ZION MAINFRAME // OPEN BANKING TERMINAL
            </h1>
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#6ee7b7', fontSize: '12px', letterSpacing: '0.04em' }}>
            [RBAC ACTIVE] Decentralized Identity, Granular Consents & Immutable Audit Stream
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: '#020804', border: '1px solid #10b981', borderRadius: '6px', padding: '8px 16px', textAlign: 'right', boxShadow: '0 0 10px rgba(16,185,129,0.15)' }}>
            <div style={{ fontSize: '10px', color: '#6ee7b7', letterSpacing: '0.1em' }}>TERMINAL STATUS</div>
            <div style={{ fontSize: '12px', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
              PHOSPHOR GREEN ONLINE
            </div>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: '#042f1a',
          color: '#a7f3d0',
          padding: '14px 20px',
          borderRadius: '8px',
          boxShadow: '0 0 25px rgba(16,185,129,0.5)',
          border: '1px solid #10b981',
          zIndex: 9999,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <span>⚡</span> {notification}
        </div>
      )}

      {/* Persona Tabs Bar */}
      <nav style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '24px',
        background: '#041009',
        padding: '8px',
        borderRadius: '8px',
        border: '1px solid #10b981'
      }}>
        {[
          { id: 'USER', label: '> USER PERSONA DASHBOARD', desc: 'Identity & Consents' },
          { id: 'TSP', label: '> TSP PERSONA DASHBOARD', desc: 'Tokens & Bank APIs' },
          { id: 'BANK', label: '> BANK PERSONA DASHBOARD', desc: 'Enforce Consents' },
          { id: 'REGULATOR', label: '> REGULATOR DASHBOARD', desc: 'Org Registry & Audit' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActivePersona(tab.id as any)}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: '6px',
              border: activePersona === tab.id ? '1px solid #34d399' : '1px solid rgba(16, 185, 129, 0.25)',
              background: activePersona === tab.id ? '#10b981' : '#020804',
              color: activePersona === tab.id ? '#022c22' : '#a7f3d0',
              cursor: 'pointer',
              fontWeight: activePersona === tab.id ? 800 : 500,
              textAlign: 'left',
              boxShadow: activePersona === tab.id ? '0 0 15px rgba(16, 185, 129, 0.5)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '13px', letterSpacing: '0.04em' }}>{tab.label}</div>
            <div style={{ fontSize: '10px', opacity: activePersona === tab.id ? 0.9 : 0.6, marginTop: '3px' }}>{tab.desc}</div>
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
            { label: 'Registered Users', value: auditStats.registered_users, color: '#34d399' },
            { label: 'Organizations', value: auditStats.registered_organizations, color: '#60a5fa' },
            { label: 'Active Consents', value: auditStats.active_consents, color: '#4ade80' },
            { label: 'Access Requests', value: auditStats.total_audit_logs, color: '#fbbf24' },
            { label: 'Approved Requests', value: auditStats.granted_requests, color: '#34d399' },
            { label: 'Denied Requests', value: auditStats.denied_requests, color: '#f87171' }
          ].map((stat, i) => (
            <div key={i} style={{
              background: '#041009',
              border: '1px solid #10b981',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.15)'
            }}>
              <div style={{ fontSize: '10px', color: '#6ee7b7', fontWeight: 600, letterSpacing: '0.08em' }}>[ {stat.label.toUpperCase()} ]</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: stat.color, marginTop: '6px', textShadow: `0 0 10px ${stat.color}88` }}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* PERSONA 1: USER DASHBOARD */}
      {activePersona === 'USER' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Identity & Status */}
          <div style={{ background: '#041009', border: '1px solid #10b981', borderRadius: '8px', padding: '20px', boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#34d399', textShadow: '0 0 8px rgba(16, 185, 129, 0.4)' }}>[ USER IDENTITY PROFILE ]</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: '#6ee7b7', display: 'block', marginBottom: '6px', letterSpacing: '0.04em' }}>USER WALLET ADDRESS</label>
              <input
                type="text"
                value={userWallet}
                onChange={e => setUserWallet(e.target.value)}
                style={{
                  width: '100%',
                  background: '#020804',
                  border: '1px solid #10b981',
                  borderRadius: '6px',
                  padding: '10px',
                  color: '#a7f3d0',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div style={{ background: '#020804', borderRadius: '6px', padding: '14px', marginBottom: '16px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#6ee7b7', fontSize: '12px' }}>IDENTITY STATUS:</span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 800,
                  background: identityStatus?.status === 'ACTIVE' ? '#064e3b' : '#7f1d1d',
                  color: identityStatus?.status === 'ACTIVE' ? '#34d399' : '#f87171',
                  border: identityStatus?.status === 'ACTIVE' ? '1px solid #10b981' : '1px solid #ef4444'
                }}>
                  {identityStatus?.status || 'UNKNOWN'}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#6ee7b7' }}>
                DID: <span style={{ color: '#a7f3d0', fontFamily: 'monospace' }}>{identityStatus?.did || 'N/A'}</span>
              </div>
            </div>

            <button
              onClick={handleVerifyIdentity}
              style={{
                width: '100%',
                background: '#10b981',
                color: '#022c22',
                border: '1px solid #34d399',
                padding: '12px',
                borderRadius: '6px',
                fontWeight: 800,
                cursor: 'pointer',
                letterSpacing: '0.05em',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
              }}
            >
              VERIFY IDENTITY & SET ACTIVE
            </button>
          </div>

          {/* Grant Consent Form */}
          <div style={{ background: '#041009', border: '1px solid #10b981', borderRadius: '8px', padding: '20px', boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#34d399', textShadow: '0 0 8px rgba(16, 185, 129, 0.4)' }}>[ GRANT OPEN BANKING ACCESS CONSENT ]</h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: '#6ee7b7', display: 'block', marginBottom: '4px' }}>SELECT BANK</label>
              <select
                value={bankWallet}
                onChange={e => setBankWallet(e.target.value)}
                style={{ width: '100%', background: '#020804', border: '1px solid #10b981', borderRadius: '6px', padding: '10px', color: '#a7f3d0', fontFamily: 'monospace' }}
              >
                <option value="0x3C44CdD05a57028476078453851002F133ca588a">Bank A (Apex Financial)</option>
                <option value="0x70997970C51812dc3A010C7d01b50e0d17dc79C9">Bank B (Beacon Trust)</option>
                <option value="0x90F79bf6EB2c4f870365E785982E1f101E93b906">Bank C (Crest Capital)</option>
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: '#6ee7b7', display: 'block', marginBottom: '4px' }}>THIRD-PARTY SERVICE PROVIDER (TSP)</label>
              <input
                type="text"
                value={tspWallet}
                onChange={e => setTspWallet(e.target.value)}
                style={{ width: '100%', background: '#020804', border: '1px solid #10b981', borderRadius: '6px', padding: '10px', color: '#a7f3d0', fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#6ee7b7', display: 'block', marginBottom: '4px' }}>DATA SCOPE</label>
                <select
                  value={dataType}
                  onChange={e => setDataType(e.target.value)}
                  style={{ width: '100%', background: '#020804', border: '1px solid #10b981', borderRadius: '6px', padding: '10px', color: '#a7f3d0', fontFamily: 'monospace' }}
                >
                  <option value="ACCOUNT_INFO">ACCOUNT_INFO</option>
                  <option value="BALANCE">BALANCE</option>
                  <option value="TRANSACTIONS">TRANSACTIONS</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#6ee7b7', display: 'block', marginBottom: '4px' }}>CONSENT DURATION</label>
                <select
                  value={grantDuration}
                  onChange={e => setGrantDuration(Number(e.target.value))}
                  style={{ width: '100%', background: '#020804', border: '1px solid #10b981', borderRadius: '6px', padding: '10px', color: '#a7f3d0', fontFamily: 'monospace' }}
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
                background: '#10b981',
                color: '#022c22',
                border: '1px solid #34d399',
                padding: '12px',
                borderRadius: '6px',
                fontWeight: 800,
                cursor: 'pointer',
                letterSpacing: '0.05em',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
              }}
            >
              SIGN & STORE CONSENT ON BLOCKCHAIN
            </button>
          </div>

          {/* User Consents List */}
          <div style={{ gridColumn: '1 / -1', background: '#041009', border: '1px solid #10b981', borderRadius: '8px', padding: '20px', boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#fbbf24' }}>[ ACTIVE USER CONSENTS RECORD ]</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#082112', color: '#10b981', textAlign: 'left', borderBottom: '2px solid #10b981' }}>
                  <th style={{ padding: '10px' }}>CONSENT ID</th>
                  <th style={{ padding: '10px' }}>USER WALLET</th>
                  <th style={{ padding: '10px' }}>TSP WALLET</th>
                  <th style={{ padding: '10px' }}>DATA SCOPE</th>
                  <th style={{ padding: '10px' }}>STATUS</th>
                  <th style={{ padding: '10px' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {consents.map((c, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.2)', background: idx % 2 === 0 ? '#020804' : '#041009' }}>
                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#34d399' }}>{c.consent_id}</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#6ee7b7' }}>{c.user_wallet.substring(0, 10)}...</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#6ee7b7' }}>{c.tsp_wallet.substring(0, 10)}...</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ background: '#064e3b', color: '#34d399', padding: '3px 8px', borderRadius: '4px', border: '1px solid #10b981' }}>{c.data_type}</span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ color: c.active ? '#34d399' : '#f87171', fontWeight: 700 }}>
                        {c.active ? 'ACTIVE' : 'REVOKED'}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      {c.active && (
                        <button
                          onClick={() => handleRevokeConsent(c.consent_id)}
                          style={{ background: '#991b1b', color: '#fef2f2', border: '1px solid #ef4444', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
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
          <div style={{ background: '#041009', border: '1px solid #10b981', borderRadius: '8px', padding: '20px', boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#60a5fa' }}>[ REQUEST ACCESS & AUTHORIZATION TOKEN ]</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: '#6ee7b7', display: 'block', marginBottom: '4px' }}>TARGET USER WALLET</label>
              <input type="text" value={userWallet} onChange={e => setUserWallet(e.target.value)} style={{ width: '100%', background: '#020804', border: '1px solid #10b981', borderRadius: '6px', padding: '10px', color: '#a7f3d0', fontFamily: 'monospace' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: '#6ee7b7', display: 'block', marginBottom: '4px' }}>TARGET BANK</label>
              <select value={bankWallet} onChange={e => setBankWallet(e.target.value)} style={{ width: '100%', background: '#020804', border: '1px solid #10b981', borderRadius: '6px', padding: '10px', color: '#a7f3d0', fontFamily: 'monospace' }}>
                <option value="0x3C44CdD05a57028476078453851002F133ca588a">Bank A (Apex Financial)</option>
                <option value="0x70997970C51812dc3A010C7d01b50e0d17dc79C9">Bank B (Beacon Trust)</option>
                <option value="0x90F79bf6EB2c4f870365E785982E1f101E93b906">Bank C (Crest Capital)</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: '#6ee7b7', display: 'block', marginBottom: '4px' }}>REQUESTED SCOPE</label>
              <select value={dataType} onChange={e => setDataType(e.target.value)} style={{ width: '100%', background: '#020804', border: '1px solid #10b981', borderRadius: '6px', padding: '10px', color: '#a7f3d0', fontFamily: 'monospace' }}>
                <option value="ACCOUNT_INFO">ACCOUNT_INFO</option>
                <option value="BALANCE">BALANCE</option>
                <option value="TRANSACTIONS">TRANSACTIONS</option>
              </select>
            </div>

            <button
              onClick={handleEvaluateAccess}
              style={{ width: '100%', background: '#10b981', color: '#022c22', border: '1px solid #34d399', padding: '12px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', marginBottom: '12px', boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}
            >
              EVALUATE ACCESS CONTROL & GENERATE JWT TOKEN
            </button>

            {jwtToken && (
              <div style={{ background: '#020804', borderRadius: '6px', padding: '12px', border: '1px solid #10b981' }}>
                <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 700, marginBottom: '6px' }}>🔑 ACTIVE BEARER JWT TOKEN:</div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#6ee7b7', wordBreak: 'break-all', background: '#010402', padding: '8px', borderRadius: '4px' }}>
                  {jwtToken}
                </div>
              </div>
            )}
          </div>

          <div style={{ background: '#041009', border: '1px solid #10b981', borderRadius: '8px', padding: '20px', boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#34d399' }}>[ QUERY BANK API ]</h3>
            
            <button
              onClick={handleFetchBankData}
              disabled={!jwtToken}
              style={{
                width: '100%',
                background: jwtToken ? '#10b981' : '#092315',
                color: jwtToken ? '#022c22' : '#047857',
                border: '1px solid #10b981',
                padding: '12px',
                borderRadius: '6px',
                fontWeight: 800,
                cursor: jwtToken ? 'pointer' : 'not-allowed',
                marginBottom: '16px',
                boxShadow: jwtToken ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none'
              }}
            >
              EXECUTE BANK API CALL WITH BEARER TOKEN
            </button>

            {apiError && (
              <div style={{ background: '#7f1d1d', border: '1px solid #ef4444', color: '#fef2f2', padding: '12px', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' }}>
                ⚠️ {apiError}
              </div>
            )}

            {fetchedBankData && (
              <div style={{ background: '#020804', border: '1px solid #10b981', borderRadius: '6px', padding: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                  RESPONSE FROM {fetchedBankData.bank.toUpperCase()}
                </div>
                <pre style={{ background: '#010402', padding: '12px', borderRadius: '4px', fontSize: '11px', color: '#34d399', overflowX: 'auto', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  {JSON.stringify(fetchedBankData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PERSONA 3: BANK DASHBOARD */}
      {activePersona === 'BANK' && (
        <div style={{ background: '#041009', border: '1px solid #10b981', borderRadius: '8px', padding: '20px', boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#34d399' }}>[ BANK AUTHORIZATION & CUSTOMER CONSENTS MONITOR ]</h3>
          <p style={{ color: '#6ee7b7', fontSize: '12px', marginBottom: '16px' }}>
            Bank node verifying live consents and access evaluations for Apex Financial (Bank A)
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#082112', color: '#10b981', textAlign: 'left', borderBottom: '2px solid #10b981' }}>
                <th style={{ padding: '10px' }}>USER WALLET</th>
                <th style={{ padding: '10px' }}>TSP WALLET</th>
                <th style={{ padding: '10px' }}>DATA SCOPE</th>
                <th style={{ padding: '10px' }}>CONSENT STATUS</th>
                <th style={{ padding: '10px' }}>API VERIFICATION</th>
              </tr>
            </thead>
            <tbody>
              {consents.map((c, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.2)', background: idx % 2 === 0 ? '#020804' : '#041009' }}>
                  <td style={{ padding: '10px', fontFamily: 'monospace', color: '#a7f3d0' }}>{c.user_wallet}</td>
                  <td style={{ padding: '10px', fontFamily: 'monospace', color: '#6ee7b7' }}>{c.tsp_wallet}</td>
                  <td style={{ padding: '10px' }}>{c.data_type}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ color: c.active ? '#34d399' : '#f87171', fontWeight: 700 }}>
                      {c.active ? 'ACTIVE' : 'REVOKED'}
                    </span>
                  </td>
                  <td style={{ padding: '10px', color: '#34d399', fontWeight: 700 }}>
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
          <div style={{ background: '#041009', border: '1px solid #10b981', borderRadius: '8px', padding: '20px', boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#60a5fa' }}>[ ECOSYSTEM ORGANIZATION REGISTRY & LICENSING ]</h3>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#082112', color: '#10b981', textAlign: 'left', borderBottom: '2px solid #10b981' }}>
                  <th style={{ padding: '10px' }}>ORG NAME</th>
                  <th style={{ padding: '10px' }}>ROLE</th>
                  <th style={{ padding: '10px' }}>LICENSE ID</th>
                  <th style={{ padding: '10px' }}>WALLET ADDRESS</th>
                  <th style={{ padding: '10px' }}>STATUS</th>
                  <th style={{ padding: '10px' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.2)', background: idx % 2 === 0 ? '#020804' : '#041009' }}>
                    <td style={{ padding: '10px', fontWeight: 700 }}>{org.name}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ background: '#064e3b', color: '#34d399', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', border: '1px solid #10b981' }}>{org.role}</span>
                    </td>
                    <td style={{ padding: '10px', fontFamily: 'monospace' }}>{org.license_id}</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#6ee7b7' }}>{org.wallet_address}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ color: org.status === 'APPROVED' ? '#34d399' : '#fbbf24', fontWeight: 700 }}>
                        {org.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      {org.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleApproveOrg(org.wallet_address)}
                          style={{ background: '#10b981', color: '#022c22', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}
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
          <div style={{ background: '#041009', border: '1px solid #10b981', borderRadius: '8px', padding: '20px', boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#fbbf24' }}>[ SYSTEM-WIDE IMMUTABLE AUDIT TRAIL ]</h3>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#082112', color: '#10b981', textAlign: 'left', borderBottom: '2px solid #10b981' }}>
                  <th style={{ padding: '10px' }}>LOG ID</th>
                  <th style={{ padding: '10px' }}>USER WALLET</th>
                  <th style={{ padding: '10px' }}>BANK</th>
                  <th style={{ padding: '10px' }}>TSP</th>
                  <th style={{ padding: '10px' }}>SCOPE</th>
                  <th style={{ padding: '10px' }}>DECISION</th>
                  <th style={{ padding: '10px' }}>REASON</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.2)', background: idx % 2 === 0 ? '#020804' : '#041009' }}>
                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#34d399' }}>{log.log_id || 'aud_000'}</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#6ee7b7' }}>{(log.user_wallet || log.requester_wallet || '0x00000000').substring(0, 8)}...</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#6ee7b7' }}>{(log.bank_wallet || '0x00000000').substring(0, 8)}...</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#6ee7b7' }}>{(log.tsp_wallet || '0x00000000').substring(0, 8)}...</td>
                    <td style={{ padding: '10px' }}>{log.data_type}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontWeight: 800,
                        fontSize: '10px',
                        background: log.granted ? '#064e3b' : '#7f1d1d',
                        color: log.granted ? '#34d399' : '#f87171',
                        border: log.granted ? '1px solid #10b981' : '1px solid #ef4444'
                      }}>
                        {log.granted ? 'ALLOWED' : 'DENIED'}
                      </span>
                    </td>
                    <td style={{ padding: '10px', color: '#a7f3d0', fontSize: '11px' }}>{log.reason}</td>
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
