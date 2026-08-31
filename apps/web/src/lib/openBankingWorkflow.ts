export interface UserConsent {
  consent_id: string;
  user_wallet: string;
  bank_wallet: string;
  tsp_wallet: string;
  data_type: string;
  expiration_time: number;
  active: boolean;
}

export interface Organization {
  name: string;
  role: 'BANK' | 'TSP' | 'REGULATOR';
  license_id: string;
  wallet_address: string;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED';
  registered_at: number;
}

export interface AuditLogEntry {
  log_id: string;
  user_wallet: string;
  bank_wallet: string;
  tsp_wallet: string;
  data_type: string;
  granted: boolean;
  reason: string;
  timestamp: number;
}

export interface AccessEvaluationResult {
  allowed: boolean;
  reason: string;
  access_token?: string;
}

/**
 * Evaluates whether a TSP request is authorized based on active consent on the blockchain
 */
export function evaluateOpenBankingAccess(
  userWallet: string,
  bankWallet: string,
  tspWallet: string,
  dataType: string,
  consents: UserConsent[],
  organizations: Organization[]
): AccessEvaluationResult {
  // 1. Verify TSP registration and licensing
  const tspOrg = organizations.find(o => o.wallet_address.toLowerCase() === tspWallet.toLowerCase());
  if (!tspOrg) {
    return { allowed: false, reason: 'TSP organization is not registered in the ecosystem registry.' };
  }
  if (tspOrg.status !== 'APPROVED') {
    return { allowed: false, reason: 'TSP organization license is PENDING or SUSPENDED.' };
  }

  // 2. Verify Bank registration
  const bankOrg = organizations.find(o => o.wallet_address.toLowerCase() === bankWallet.toLowerCase());
  if (!bankOrg || bankOrg.status !== 'APPROVED') {
    return { allowed: false, reason: 'Destination Bank is not an approved entity in the ecosystem.' };
  }

  // 3. Search for matching active user consent
  const currentTime = Math.floor(Date.now() / 1000);
  const matchingConsent = consents.find(c =>
    c.user_wallet.toLowerCase() === userWallet.toLowerCase() &&
    c.bank_wallet.toLowerCase() === bankWallet.toLowerCase() &&
    c.tsp_wallet.toLowerCase() === tspWallet.toLowerCase() &&
    c.data_type === dataType &&
    c.active &&
    c.expiration_time > currentTime
  );

  if (!matchingConsent) {
    return { allowed: false, reason: 'No valid, active consent record found for this User-Bank-TSP scope combination.' };
  }

  // 4. Generate Bearer JWT Access Token payload
  const tokenPayload = {
    sub: userWallet,
    aud: bankWallet,
    iss: tspWallet,
    scope: dataType,
    consent_id: matchingConsent.consent_id,
    exp: matchingConsent.expiration_time
  };
  const mockJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(tokenPayload))}.crypto_sig_z9x8`;

  return {
    allowed: true,
    reason: 'Active consent verified on blockchain.',
    access_token: mockJwt
  };
}

/**
 * Creates a new consent entry
 */
export function grantUserConsent(
  userWallet: string,
  bankWallet: string,
  tspWallet: string,
  dataType: string,
  durationSeconds: number
): UserConsent {
  const currentTime = Math.floor(Date.now() / 1000);
  return {
    consent_id: `cst_${Math.random().toString(36).substring(2, 9)}`,
    user_wallet: userWallet,
    bank_wallet: bankWallet,
    tsp_wallet: tspWallet,
    data_type: dataType,
    expiration_time: currentTime + durationSeconds,
    active: true
  };
}

/**
 * Revokes a consent entry by ID
 */
export function revokeUserConsent(consentId: string, consents: UserConsent[]): UserConsent[] {
  return consents.map(c => c.consent_id === consentId ? { ...c, active: false } : c);
}

/**
 * Updates organization status
 */
export function approveOrganization(walletAddress: string, organizations: Organization[]): Organization[] {
  return organizations.map(o => o.wallet_address.toLowerCase() === walletAddress.toLowerCase() ? { ...o, status: 'APPROVED' } : o);
}
