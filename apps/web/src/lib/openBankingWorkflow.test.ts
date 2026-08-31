import { describe, expect, it } from 'vitest';
import {
  grantUserConsent,
  revokeUserConsent,
  evaluateOpenBankingAccess,
  approveOrganization,
  UserConsent,
  Organization
} from './openBankingWorkflow';

describe('Open Banking Logic Engine & Authorization Rules', () => {
  const userWallet = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  const bankWallet = '0x3C44CdD05a57028476078453851002F133ca588a';
  const tspWallet = '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc';

  const defaultOrgs: Organization[] = [
    { name: 'Bank A', role: 'BANK', license_id: 'lic_01', wallet_address: bankWallet, status: 'APPROVED', registered_at: 1000 },
    { name: 'TSP 1', role: 'TSP', license_id: 'lic_02', wallet_address: tspWallet, status: 'APPROVED', registered_at: 1000 }
  ];

  it('correctly creates a new active user consent with specified duration', () => {
    const consent = grantUserConsent(userWallet, bankWallet, tspWallet, 'TRANSACTIONS', 3600);
    expect(consent.active).toBe(true);
    expect(consent.user_wallet).toBe(userWallet);
    expect(consent.bank_wallet).toBe(bankWallet);
    expect(consent.tsp_wallet).toBe(tspWallet);
    expect(consent.data_type).toBe('TRANSACTIONS');
    expect(consent.expiration_time).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('revokes an active consent by setting active to false', () => {
    const consent = grantUserConsent(userWallet, bankWallet, tspWallet, 'TRANSACTIONS', 3600);
    const consentsList: UserConsent[] = [consent];

    const updatedConsents = revokeUserConsent(consent.consent_id, consentsList);
    expect(updatedConsents[0].active).toBe(false);
  });

  it('grants access & issues JWT token when valid consent and approved orgs exist', () => {
    const consent = grantUserConsent(userWallet, bankWallet, tspWallet, 'TRANSACTIONS', 3600);
    const result = evaluateOpenBankingAccess(userWallet, bankWallet, tspWallet, 'TRANSACTIONS', [consent], defaultOrgs);

    expect(result.allowed).toBe(true);
    expect(result.access_token).toBeDefined();
    expect(result.access_token).toContain('eyJhbGciOiJIUzI1');
  });

  it('denies access when no consent exists for the requested scope', () => {
    const consent = grantUserConsent(userWallet, bankWallet, tspWallet, 'ACCOUNTS', 3600); // Different scope
    const result = evaluateOpenBankingAccess(userWallet, bankWallet, tspWallet, 'TRANSACTIONS', [consent], defaultOrgs);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('No valid, active consent record found');
  });

  it('denies access when consent is expired', () => {
    const expiredConsent: UserConsent = {
      consent_id: 'cst_expired',
      user_wallet: userWallet,
      bank_wallet: bankWallet,
      tsp_wallet: tspWallet,
      data_type: 'TRANSACTIONS',
      expiration_time: Math.floor(Date.now() / 1000) - 10, // 10 seconds in past
      active: true
    };

    const result = evaluateOpenBankingAccess(userWallet, bankWallet, tspWallet, 'TRANSACTIONS', [expiredConsent], defaultOrgs);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('No valid, active consent record found');
  });

  it('denies access when TSP organization status is PENDING', () => {
    const consent = grantUserConsent(userWallet, bankWallet, tspWallet, 'TRANSACTIONS', 3600);
    const pendingOrgs: Organization[] = [
      { name: 'Bank A', role: 'BANK', license_id: 'lic_01', wallet_address: bankWallet, status: 'APPROVED', registered_at: 1000 },
      { name: 'TSP 1', role: 'TSP', license_id: 'lic_02', wallet_address: tspWallet, status: 'PENDING', registered_at: 1000 }
    ];

    const result = evaluateOpenBankingAccess(userWallet, bankWallet, tspWallet, 'TRANSACTIONS', [consent], pendingOrgs);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('TSP organization license is PENDING');
  });

  it('successfully approves a PENDING organization license', () => {
    const pendingOrgs: Organization[] = [
      { name: 'TSP 1', role: 'TSP', license_id: 'lic_02', wallet_address: tspWallet, status: 'PENDING', registered_at: 1000 }
    ];

    const approvedList = approveOrganization(tspWallet, pendingOrgs);
    expect(approvedList[0].status).toBe('APPROVED');
  });
});
