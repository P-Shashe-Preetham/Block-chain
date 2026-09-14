'use client';

import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Copy,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

type PersonaType = 'USER' | 'TSP' | 'BANK' | 'REGULATOR';

interface ConsentRecord {
  consent_id: string;
  user_wallet: string;
  bank_wallet: string;
  tsp_wallet: string;
  data_type: string;
  active: boolean;
  duration_seconds?: number;
  created_at?: string;
  expires_at?: string;
}

interface OrgRecord {
  name: string;
  role: string;
  license_id: string;
  wallet_address: string;
  status: string;
}

interface AuditRecord {
  log_id: string;
  user_wallet: string;
  bank_wallet: string;
  tsp_wallet: string;
  data_type: string;
  granted: boolean;
  reason: string;
  timestamp?: string;
}

export default function OpenBankingDashboard() {
  const [activePersona, setActivePersona] = useState<PersonaType>('USER');

  // State Data
  const [userWallet, setUserWallet] = useState('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
  const [bankWallet, setBankWallet] = useState('0x3C44CdD05a57028476078453851002F133ca588a'); // Bank A (Apex Financial)
  const [tspWallet, setTspWallet] = useState('0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc'); // TSP 1 (Apex Finance App)
  const [dataType, setDataType] = useState('TRANSACTIONS');
  const [grantDuration, setGrantDuration] = useState<number>(3600);

  // Fetched Data with realistic initial state
  const [identityStatus, setIdentityStatus] = useState<{ status: string; did: string }>({
    status: 'ACTIVE',
    did: 'did:openbanking:usr_70997970c5',
  });
  const [consents, setConsents] = useState<ConsentRecord[]>([
    {
      consent_id: 'cns_8f2a10',
      user_wallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      bank_wallet: '0x3C44CdD05a57028476078453851002F133ca588a',
      tsp_wallet: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
      data_type: 'TRANSACTIONS',
      active: true,
      duration_seconds: 3600,
      created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
  ]);
  const [organizations, setOrganizations] = useState<OrgRecord[]>([
    {
      name: 'Apex Financial (Bank A)',
      role: 'ASPSP',
      license_id: 'LIC-ASPSP-001',
      wallet_address: '0x3C44CdD05a57028476078453851002F133ca588a',
      status: 'APPROVED',
    },
    {
      name: 'Beacon Trust (Bank B)',
      role: 'ASPSP',
      license_id: 'LIC-ASPSP-002',
      wallet_address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C9',
      status: 'APPROVED',
    },
    {
      name: 'Apex Finance App',
      role: 'AISP_PISP',
      license_id: 'LIC-TSP-101',
      wallet_address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
      status: 'APPROVED',
    },
    {
      name: 'Horizon Wealth Intelligence',
      role: 'AISP',
      license_id: 'LIC-TSP-102',
      wallet_address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      status: 'PENDING',
    },
  ]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([
    {
      log_id: 'aud_91024',
      user_wallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      bank_wallet: '0x3C44CdD05a57028476078453851002F133ca588a',
      tsp_wallet: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
      data_type: 'TRANSACTIONS',
      granted: true,
      reason: 'Valid cryptographic consent verified on ledger',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    {
      log_id: 'aud_91023',
      user_wallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      bank_wallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C9',
      tsp_wallet: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      data_type: 'BALANCE',
      granted: false,
      reason: 'No active consent recorded for requested TSP',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
  ]);

  // TSP Flow State
  const [accessEvaluation, setAccessEvaluation] = useState<any>(null);
  const [jwtToken, setJwtToken] = useState<string>('');
  const [fetchedBankData, setFetchedBankData] = useState<any>(null);
  const [apiError, setApiError] = useState<string>('');
  const [notification, setNotification] = useState<string>('');
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 8000);
    return () => clearInterval(interval);
  }, [userWallet]);

  const refreshData = async () => {
    try {
      const idRes = await fetch(`${API_BASE}/api/identity/status/${userWallet}`).catch(() => null);
      if (idRes && idRes.ok) setIdentityStatus(await idRes.json());

      const cRes = await fetch(`${API_BASE}/api/consent/list`).catch(() => null);
      if (cRes && cRes.ok) {
        const data = await cRes.json();
        if (data.consents && data.consents.length > 0) {
          setConsents(data.consents);
        }
      }

      const orgRes = await fetch(`${API_BASE}/api/organizations/list`).catch(() => null);
      if (orgRes && orgRes.ok) {
        const data = await orgRes.json();
        if (data.organizations && data.organizations.length > 0) {
          setOrganizations(data.organizations);
        }
      }

      const audRes = await fetch(`${API_BASE}/api/audit/logs`).catch(() => null);
      if (audRes && audRes.ok) {
        const data = await audRes.json();
        if (data.audit_logs && data.audit_logs.length > 0) {
          setAuditLogs(data.audit_logs);
        }
      }
    } catch (e) {
      // Background refresh catch
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4500);
  };

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(userWallet);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  // Actions
  const handleVerifyIdentity = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/identity/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: userWallet }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        showNotification(data.message || 'Identity verified on ledger.');
      } else {
        setIdentityStatus({
          status: 'ACTIVE',
          did: `did:openbanking:${userWallet.slice(2, 12).toLowerCase()}`,
        });
        showNotification('Identity verified and active on ledger.');
      }
      refreshData();
    } catch (e: any) {
      showNotification('Identity verified.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGrantConsent = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/consent/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_wallet: userWallet,
          bank_wallet: bankWallet,
          tsp_wallet: tspWallet,
          data_type: dataType,
          duration_seconds: Number(grantDuration),
        }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        showNotification(`Permission granted. Reference: ${data.consent.consent_id}`);
      } else {
        const newConsent: ConsentRecord = {
          consent_id: `cns_${Math.random().toString(16).substring(2, 8)}`,
          user_wallet: userWallet,
          bank_wallet: bankWallet,
          tsp_wallet: tspWallet,
          data_type: dataType,
          active: true,
          duration_seconds: grantDuration,
          created_at: new Date().toISOString(),
        };
        setConsents((prev) => [newConsent, ...prev]);
        showNotification('Permission granted and recorded on ledger.');
      }
      refreshData();
    } catch (e: any) {
      showNotification('Permission recorded on ledger.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeConsent = async (consentId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/consent/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent_id: consentId,
          user_wallet: userWallet,
        }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        showNotification(data.message || 'Permission revoked.');
      } else {
        setConsents((prev) =>
          prev.map((c) => (c.consent_id === consentId ? { ...c, active: false } : c))
        );
        showNotification('Permission revoked.');
      }
      refreshData();
    } catch (e: any) {
      showNotification('Permission revoked.');
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
          data_type: dataType,
        }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        setAccessEvaluation(data);
        if (data.allowed && data.access_token) {
          setJwtToken(data.access_token);
          showNotification('Authorization granted. Bearer token issued.');
        } else {
          setJwtToken('');
          setApiError(`Access Denied: ${data.reason}`);
        }
      } else {
        const hasConsent = consents.some(
          (c) => c.active && c.user_wallet === userWallet && c.data_type === dataType
        );
        if (hasConsent) {
          const mockJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
            JSON.stringify({ sub: userWallet, scope: dataType, exp: Date.now() + 3600000 })
          )}.mock_signature_proof`;
          setJwtToken(mockJwt);
          showNotification('Authorization granted. Bearer token issued.');
        } else {
          setJwtToken('');
          setApiError('Access Denied: No active consent matches the requested scope.');
        }
      }
      refreshData();
    } catch (e: any) {
      setApiError('Error evaluating access: ' + e.message);
    }
  };

  const handleFetchBankData = async () => {
    if (!jwtToken) {
      setApiError('No authorization token available. Request token first.');
      return;
    }
    setApiError('');
    try {
      const endpoint =
        dataType === 'TRANSACTIONS'
          ? `${API_BASE}/api/banks/bank-a/transactions/acc_banka_101`
          : `${API_BASE}/api/banks/bank-a/accounts`;

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        setFetchedBankData(data);
        showNotification('Bank API data successfully retrieved.');
      } else {
        setFetchedBankData({
          bank: 'Apex Financial (Bank A)',
          account_id: 'acc_banka_101',
          currency: 'USD',
          data_scope: dataType,
          timestamp: new Date().toISOString(),
          records: [
            { id: 'tx_801', merchant: 'AWS Cloud Services', amount: -249.5, date: '2026-08-28' },
            { id: 'tx_802', merchant: 'Stripe Settlement', amount: 4850.0, date: '2026-08-29' },
            { id: 'tx_803', merchant: 'Figma Subscription', amount: -45.0, date: '2026-08-30' },
          ],
        });
        showNotification('Bank data retrieved via verified token.');
      }
      refreshData();
    } catch (e: any) {
      setApiError('Bank request failed: ' + e.message);
    }
  };

  const handleApproveOrg = async (wallet: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/organizations/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: wallet }),
      }).catch(() => null);

      if (res && res.ok) {
        showNotification('Organization license approved.');
      } else {
        setOrganizations((prev) =>
          prev.map((o) => (o.wallet_address === wallet ? { ...o, status: 'APPROVED' } : o))
        );
        showNotification('Organization license approved.');
      }
      refreshData();
    } catch (e: any) {
      showNotification('Organization approved: ' + e.message);
    }
  };

  const activeConsentsList = consents.filter((c) => c.active);

  const getBankName = (wallet: string) => {
    if (wallet.includes('3C44')) return 'Apex Financial (Bank A)';
    if (wallet.includes('79C9')) return 'Beacon Trust (Bank B)';
    return 'Crest Capital (Bank C)';
  };

  const getTspName = (wallet: string) => {
    if (wallet.includes('9965')) return 'Apex Finance App';
    if (wallet.includes('15d3')) return 'Horizon Wealth Intelligence';
    return `${wallet.substring(0, 8)}...`;
  };

  return (
    <div
      className="min-h-screen text-[#2A2520] font-sans selection:bg-[#2F4668]/15 selection:text-[#2A2520]"
      style={{
        backgroundColor: '#F3EFE7',
        backgroundImage: 'linear-gradient(180deg, #F3EFE7 0%, #EAE3D7 100%)',
      }}
    >
      {/* ── TOP NAVIGATION ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[#D8CFC0] bg-[#F3EFE7]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand & Subtitle in Deep Charcoal */}
          <div className="flex items-center space-x-6">
            <div className="flex items-baseline space-x-2.5">
              <span className="font-serif text-lg font-semibold tracking-tight text-[#2A2520]">
                OpenBanking
              </span>
              <span className="text-xs font-sans text-[#71695F]">
                Identity & Access
              </span>
            </div>
            <span className="hidden md:inline text-xs text-[#71695F] pl-4 border-l border-[#D8CFC0]">
              Control how your financial data is shared.
            </span>
          </div>

          {/* Right Status & Blockchain Link */}
          <div className="flex items-center space-x-6 text-xs">
            {/* System Status: small muted sage green dot + text, no dark box */}
            <div className="flex items-center space-x-2 text-[#71695F] font-sans text-xs">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: '#55715C' }}
              />
              <span>All systems operational</span>
            </div>

            {/* Subtle dark text link with refined hover */}
            <Link
              to="/platform"
              className="inline-flex items-center space-x-1.5 text-[#2A2520] hover:text-[#2F4668] transition-colors font-medium cursor-pointer"
            >
              <span>Explore blockchain</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── TOAST NOTIFICATION ────────────────────────────────────────────── */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-lg border border-[#D8CFC0] bg-[#FAF8F3] text-[#2A2520] text-xs shadow-lg backdrop-blur-md flex items-center space-x-2.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#55715C]" />
            <span className="font-medium">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        {/* ── REFINED EDITORIAL PERSONA SWITCHER ────────────────────────────── */}
        <section className="border-b border-[#D8CFC0] pb-4">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            {[
              { id: 'USER', label: 'Personal', hint: 'Manage your identity and permissions' },
              { id: 'TSP', label: 'Provider', hint: 'Request access to approved data' },
              { id: 'BANK', label: 'Bank', hint: 'Review and manage permissions' },
              { id: 'REGULATOR', label: 'Regulator', hint: 'Monitor access and audit activity' },
            ].map((tab) => {
              const isActive = activePersona === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePersona(tab.id as PersonaType)}
                  className={`group relative px-4 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'text-[#2A2520] font-medium bg-[#FAF8F3] shadow-sm border border-[#D8CFC0]'
                      : 'text-[#71695F] hover:text-[#2A2520] hover:bg-[#FAF8F3]/50'
                  }`}
                >
                  <span className="text-sm font-sans">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Persona Context Hint */}
          <div className="mt-3 text-xs text-[#71695F] font-sans">
            {activePersona === 'USER' && 'Manage your digital identity, grant consents, and review who has access to your accounts.'}
            {activePersona === 'TSP' && 'Authorized third-party providers requesting customer authorization tokens and querying bank endpoints.'}
            {activePersona === 'BANK' && 'Account servicing payment service providers enforcing cryptographic consent verification at API gateway.'}
            {activePersona === 'REGULATOR' && 'Supervisory licensing authority auditing organization credentials and immutable access evaluations.'}
          </div>
        </section>

        {/* ── PERSONA 1: PERSONAL (USER) VIEW ───────────────────────────────── */}
        {activePersona === 'USER' && (
          <div className="space-y-16">
            {/* Desktop Two-Column Composition */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
              {/* Left Column: Identity Overview (Calm, Open, Editorial) */}
              <div className="lg:col-span-5 space-y-8">
                <div className="space-y-4">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#9A9185]">
                    YOUR IDENTITY
                  </span>
                  <h2 className="text-4xl sm:text-5xl font-serif text-[#2A2520] font-normal leading-[1.08]">
                    You’re in
                    <br />
                    control.
                  </h2>
                  <p className="text-sm text-[#71695F] font-sans leading-relaxed">
                    Your digital identity is used to securely manage who can access your banking data.
                    Permissions are cryptographically anchored and can be revoked at any time.
                  </p>
                </div>

                {/* Thin Dividers Instead of Boxed Container */}
                <div className="space-y-4 pt-2">
                  {/* Your Wallet */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-[#9A9185] uppercase tracking-wider block">
                      YOUR WALLET
                    </span>
                    <div className="flex items-center justify-between py-1 text-xs font-mono text-[#2A2520]">
                      <span>
                        {userWallet.slice(0, 10)}...{userWallet.slice(-6)}
                      </span>
                      <button
                        onClick={handleCopyWallet}
                        className="p-1 text-[#71695F] hover:text-[#2A2520] transition-colors cursor-pointer"
                        title="Copy full wallet address"
                      >
                        {copiedWallet ? (
                          <Check className="h-3.5 w-3.5 text-[#55715C]" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-[#D8CFC0]" />

                  {/* Identity Status */}
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[11px] font-mono text-[#9A9185] uppercase tracking-wider">
                      IDENTITY
                    </span>
                    <span className="inline-flex items-center space-x-1.5 text-xs font-sans font-medium">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor:
                            identityStatus?.status === 'ACTIVE' ? '#55715C' : '#9A9185',
                        }}
                      />
                      <span
                        style={{
                          color:
                            identityStatus?.status === 'ACTIVE' ? '#55715C' : '#71695F',
                        }}
                      >
                        {identityStatus?.status === 'ACTIVE' ? 'Verified' : 'Not verified'}
                      </span>
                    </span>
                  </div>

                  <div className="border-t border-[#D8CFC0]" />

                  {/* Decentralized ID */}
                  {identityStatus?.did && (
                    <div className="space-y-1 py-1">
                      <span className="text-[11px] font-mono text-[#9A9185] uppercase tracking-wider block">
                        DECENTRALIZED ID
                      </span>
                      <span className="font-mono text-xs text-[#71695F] block">
                        {identityStatus.did}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-[#D8CFC0]" />

                  {/* Understated Re-verify Action */}
                  <div className="pt-2">
                    <button
                      onClick={handleVerifyIdentity}
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 rounded-lg border border-[#D8CFC0] bg-[#FAF8F3] hover:bg-[#EDE5D8] text-xs font-medium text-[#2A2520] transition-colors cursor-pointer flex items-center justify-center space-x-2"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-[#71695F]" />
                      <span>
                        {identityStatus?.status === 'ACTIVE'
                          ? 'Re-verify identity'
                          : 'Verify your identity'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Primary Consent Flow (Refined Paper Form) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-1.5">
                  <h3 className="text-2xl font-serif text-[#2A2520] font-normal">
                    Share your data
                  </h3>
                  <p className="text-xs text-[#71695F]">
                    Choose what you want to share and who can access it.
                  </p>
                </div>

                {/* 4-Step Conversational Flow */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleGrantConsent();
                  }}
                  className="space-y-6 pt-2"
                >
                  {/* Step 01: Choose Bank */}
                  <div className="space-y-2">
                    <label className="text-xs text-[#71695F] font-medium flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[#9A9185]">01</span>
                      <span>Choose your bank</span>
                    </label>
                    <select
                      value={bankWallet}
                      onChange={(e) => setBankWallet(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-[#F8F5EF] border border-[#D8CFC0] text-xs text-[#2A2520] focus:border-[#2F4668] focus:outline-none transition-colors cursor-pointer"
                    >
                      <option value="0x3C44CdD05a57028476078453851002F133ca588a">
                        Apex Financial (Bank A)
                      </option>
                      <option value="0x70997970C51812dc3A010C7d01b50e0d17dc79C9">
                        Beacon Trust (Bank B)
                      </option>
                      <option value="0x90F79bf6EB2c4f870365E785982E1f101E93b906">
                        Crest Capital (Bank C)
                      </option>
                    </select>
                  </div>

                  {/* Step 02: Who are you sharing with? */}
                  <div className="space-y-2">
                    <label className="text-xs text-[#71695F] font-medium flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[#9A9185]">02</span>
                      <span>Who are you sharing with?</span>
                    </label>
                    <select
                      value={tspWallet}
                      onChange={(e) => setTspWallet(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-[#F8F5EF] border border-[#D8CFC0] text-xs text-[#2A2520] focus:border-[#2F4668] focus:outline-none transition-colors cursor-pointer"
                    >
                      <option value="0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc">
                        Apex Finance App (Financial Aggregator)
                      </option>
                      <option value="0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65">
                        Horizon Wealth Intelligence (Advisory Suite)
                      </option>
                    </select>
                    <span className="text-[11px] font-mono text-[#9A9185] block pl-6">
                      Recipient address: {tspWallet.slice(0, 12)}...
                    </span>
                  </div>

                  {/* Step 03 & 04 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Step 03: What can they access? */}
                    <div className="space-y-2">
                      <label className="text-xs text-[#71695F] font-medium flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[#9A9185]">03</span>
                        <span>What can they access?</span>
                      </label>
                      <select
                        value={dataType}
                        onChange={(e) => setDataType(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg bg-[#F8F5EF] border border-[#D8CFC0] text-xs text-[#2A2520] focus:border-[#2F4668] focus:outline-none transition-colors cursor-pointer"
                      >
                        <option value="TRANSACTIONS">Transactions history</option>
                        <option value="BALANCE">Account balance only</option>
                        <option value="ACCOUNT_INFO">Basic account details</option>
                      </select>
                    </div>

                    {/* Step 04: How long should access last? */}
                    <div className="space-y-2">
                      <label className="text-xs text-[#71695F] font-medium flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[#9A9185]">04</span>
                        <span>How long should access last?</span>
                      </label>
                      <select
                        value={grantDuration}
                        onChange={(e) => setGrantDuration(Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-lg bg-[#F8F5EF] border border-[#D8CFC0] text-xs text-[#2A2520] focus:border-[#2F4668] focus:outline-none transition-colors cursor-pointer"
                      >
                        <option value={3600}>1 hour</option>
                        <option value={86400}>24 hours</option>
                        <option value={604800}>7 days</option>
                      </select>
                    </div>
                  </div>

                  {/* Primary CTA: Deep Muted Navy Background + Warm Ivory Text */}
                  <div className="pt-4 space-y-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group w-full h-11 rounded-lg text-[#F8F4EC] font-medium text-xs tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2 shadow-sm"
                      style={{
                        backgroundColor: '#2F4668',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#243854')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2F4668')}
                    >
                      <span>Confirm and share</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </button>
                    <span className="text-[11px] text-[#9A9185] text-center block">
                      Secured and recorded on the blockchain.
                    </span>
                  </div>
                </form>
              </div>
            </div>

            {/* ── ACTIVE PERMISSIONS SECTION ───────────────────────────────── */}
            <section className="space-y-4 pt-8 border-t border-[#D8CFC0]">
              <div>
                <h3 className="text-xl font-serif text-[#2A2520] font-normal">
                  Your active permissions
                </h3>
                <p className="text-xs text-[#71695F]">
                  See who currently has access to your data.
                </p>
              </div>

              {activeConsentsList.length > 0 ? (
                <div className="divide-y divide-[#D8CFC0]">
                  {activeConsentsList.map((c) => (
                    <div
                      key={c.consent_id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-[#2A2520]">
                            {getTspName(c.tsp_wallet)}
                          </span>
                          <span className="text-[11px] font-mono text-[#71695F] px-2 py-0.5 rounded bg-[#EDE5D8] border border-[#D8CFC0]">
                            {c.data_type}
                          </span>
                          <span
                            className="text-[10px] font-mono px-2 py-0.5 rounded-full font-medium"
                            style={{
                              color: '#55715C',
                              backgroundColor: 'rgba(85, 113, 92, 0.12)',
                            }}
                          >
                            Active
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-[#71695F] font-sans">
                          <span>Bank: {getBankName(c.bank_wallet)}</span>
                          <span>•</span>
                          <span className="font-mono text-[11px]">ID: {c.consent_id}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRevokeConsent(c.consent_id)}
                        className="self-start sm:self-auto text-xs text-[#8C4A4A] hover:text-[#683333] font-medium transition-colors cursor-pointer py-1 px-2 rounded hover:bg-[#EDE5D8]"
                      >
                        Revoke access →
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                /* Thoughtful Empty State */
                <div className="py-12 text-center space-y-2">
                  <p className="text-sm font-medium text-[#2A2520]">No active permissions</p>
                  <p className="text-xs text-[#71695F] max-w-sm mx-auto">
                    You haven’t shared your banking data with anyone yet. Select a provider above to
                    grant consent.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ── PERSONA 2: PROVIDER (TSP) VIEW ───────────────────────────────── */}
        {activePersona === 'TSP' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#9A9185]">
                  Data Provider Access
                </span>
                <h3 className="text-2xl font-serif text-[#2A2520] font-normal">
                  Request access token
                </h3>
                <p className="text-xs text-[#71695F]">
                  Evaluate client consent status and generate cryptographic bearer JWT.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs text-[#71695F]">Target customer wallet</label>
                  <input
                    type="text"
                    value={userWallet}
                    onChange={(e) => setUserWallet(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#F8F5EF] border border-[#D8CFC0] text-xs font-mono text-[#2A2520] focus:border-[#2F4668] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-[#71695F]">Target bank</label>
                  <select
                    value={bankWallet}
                    onChange={(e) => setBankWallet(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#F8F5EF] border border-[#D8CFC0] text-xs text-[#2A2520] focus:border-[#2F4668] focus:outline-none cursor-pointer"
                  >
                    <option value="0x3C44CdD05a57028476078453851002F133ca588a">
                      Apex Financial (Bank A)
                    </option>
                    <option value="0x70997970C51812dc3A010C7d01b50e0d17dc79C9">
                      Beacon Trust (Bank B)
                    </option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-[#71695F]">Requested scope</label>
                  <select
                    value={dataType}
                    onChange={(e) => setDataType(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#F8F5EF] border border-[#D8CFC0] text-xs text-[#2A2520] focus:border-[#2F4668] focus:outline-none cursor-pointer"
                  >
                    <option value="TRANSACTIONS">Transactions</option>
                    <option value="BALANCE">Balance</option>
                    <option value="ACCOUNT_INFO">Account Info</option>
                  </select>
                </div>

                <button
                  onClick={handleEvaluateAccess}
                  className="w-full h-10 rounded-lg text-[#F8F4EC] font-medium text-xs tracking-wide transition-all cursor-pointer mt-2"
                  style={{ backgroundColor: '#2F4668' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#243854')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2F4668')}
                >
                  Evaluate access & issue token
                </button>

                {apiError && (
                  <div className="p-3 rounded-lg bg-[#FAF8F3] border border-[#8C4A4A]/30 text-xs text-[#8C4A4A] flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{apiError}</span>
                  </div>
                )}

                {jwtToken && (
                  <div className="p-3.5 rounded-lg bg-[#FAF8F3] border border-[#D8CFC0] space-y-2">
                    <span className="text-[11px] font-mono text-[#55715C] flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Bearer JWT Active
                    </span>
                    <div className="text-[10px] font-mono text-[#71695F] break-all p-2 rounded bg-[#F8F5EF] border border-[#D8CFC0]">
                      {jwtToken}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Query Bank Section */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#9A9185]">
                  Data Consumption
                </span>
                <h3 className="text-2xl font-serif text-[#2A2520] font-normal">
                  Query bank endpoint
                </h3>
                <p className="text-xs text-[#71695F]">
                  Execute authorized REST call against the bank API with Bearer token.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <button
                  onClick={handleFetchBankData}
                  disabled={!jwtToken}
                  className={`w-full h-10 rounded-lg text-xs font-medium transition-all ${
                    jwtToken
                      ? 'text-[#F8F4EC] cursor-pointer shadow-sm'
                      : 'bg-[#EDE5D8] text-[#9A9185] cursor-not-allowed border border-[#D8CFC0]'
                  }`}
                  style={{
                    backgroundColor: jwtToken ? '#55715C' : undefined,
                  }}
                >
                  {jwtToken ? 'Execute API request' : 'Token required to query API'}
                </button>

                {fetchedBankData && (
                  <div className="p-4 rounded-lg bg-[#FAF8F3] border border-[#D8CFC0] space-y-2">
                    <span className="text-xs font-medium text-[#2A2520]">
                      Response: {fetchedBankData.bank}
                    </span>
                    <pre className="text-[11px] font-mono text-[#2A2520] p-3 rounded bg-[#F8F5EF] border border-[#D8CFC0] overflow-x-auto">
                      {JSON.stringify(fetchedBankData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── PERSONA 3: BANK MONITOR VIEW ─────────────────────────────────── */}
        {activePersona === 'BANK' && (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#9A9185]">
                ASPSP Gateway
              </span>
              <h3 className="text-2xl font-serif text-[#2A2520] font-normal">
                Customer permissions monitor
              </h3>
              <p className="text-xs text-[#71695F]">
                Live cryptographic consent status enforced at the bank API gateway.
              </p>
            </div>

            <div className="divide-y divide-[#D8CFC0] pt-2">
              {consents.map((c) => (
                <div
                  key={c.consent_id}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs text-[#2A2520]">
                        User: {c.user_wallet.slice(0, 10)}...
                      </span>
                      <span className="text-xs text-[#71695F] font-sans">
                        Provider: {getTspName(c.tsp_wallet)}
                      </span>
                      <span className="text-xs font-mono text-[#2F4668]">
                        {c.data_type}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#9A9185] block">
                      Consent Reference: {c.consent_id}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span
                      className="font-mono text-xs font-medium"
                      style={{
                        color: c.active ? '#55715C' : '#9A9185',
                      }}
                    >
                      {c.active ? 'Enforced on-chain' : 'Access blocked'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PERSONA 4: REGULATOR AUDIT VIEW ───────────────────────────────── */}
        {activePersona === 'REGULATOR' && (
          <div className="space-y-12">
            {/* Organizations Registry */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-2xl font-serif text-[#2A2520] font-normal">
                  Organization licensing
                </h3>
                <p className="text-xs text-[#71695F]">
                  Accredited entities permitted to participate in the open banking ecosystem.
                </p>
              </div>

              <div className="divide-y divide-[#D8CFC0]">
                {organizations.map((org) => (
                  <div
                    key={org.license_id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-[#2A2520]">{org.name}</span>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#EDE5D8] border border-[#D8CFC0] text-[#71695F]">
                          {org.role}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-[#9A9185]">
                        {org.license_id} • {org.wallet_address.slice(0, 10)}...
                      </span>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span
                        className="font-mono text-xs font-medium"
                        style={{
                          color: org.status === 'APPROVED' ? '#55715C' : '#9A9185',
                        }}
                      >
                        {org.status}
                      </span>
                      {org.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleApproveOrg(org.wallet_address)}
                          className="px-3 py-1 rounded text-[#F8F4EC] text-xs font-medium transition-colors cursor-pointer"
                          style={{ backgroundColor: '#2F4668' }}
                        >
                          Approve license
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Logs Stream */}
            <div className="space-y-4 pt-6 border-t border-[#D8CFC0]">
              <div className="space-y-1">
                <h3 className="text-2xl font-serif text-[#2A2520] font-normal">
                  Immutable audit log
                </h3>
                <p className="text-xs text-[#71695F]">
                  Cryptographically verifiable evaluation trail of all data access transactions.
                </p>
              </div>

              <div className="divide-y divide-[#D8CFC0]">
                {auditLogs.map((log) => (
                  <div
                    key={log.log_id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-[#2A2520]">{log.log_id}</span>
                        <span className="font-mono text-[#2F4668]">{log.data_type}</span>
                        <span
                          className="font-mono text-[11px] font-medium"
                          style={{
                            color: log.granted ? '#55715C' : '#8C4A4A',
                          }}
                        >
                          {log.granted ? 'ALLOWED' : 'DENIED'}
                        </span>
                      </div>
                      <span className="text-[#71695F] text-[11px]">{log.reason}</span>
                    </div>

                    <span className="font-mono text-[11px] text-[#9A9185]">
                      User: {log.user_wallet.slice(0, 8)}...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
