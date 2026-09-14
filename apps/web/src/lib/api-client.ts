const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      let detail = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const error = await res.json();
        detail = error.detail || error.message || detail;
      } catch {
        // Response was not JSON (e.g., HTML error page)
      }
      throw new Error(detail);
    }
    const contentType = res.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      throw new Error(`Invalid response format (expected JSON, got ${contentType})`);
    }
    return res.json();
  }

  // Auth
  getNonce(walletAddress: string) {
    return this.request<{ nonce: string; message: string }>('GET', `/auth/nonce?wallet_address=${walletAddress}`);
  }

  login(walletAddress: string, signature: string, nonce: string) {
    return this.request<{ token: string; role: string; name: string; wallet_address: string }>('POST', '/auth/login', { wallet_address: walletAddress, signature, nonce });
  }

  getMe() {
    return this.request<{ wallet_address: string; role: string; name: string; status: string; did: string | null }>('GET', '/auth/me');
  }

  // Assets
  listAssets(walletAddress?: string) {
    const q = walletAddress ? `?wallet_address=${walletAddress}` : '';
    return this.request<{ assets: unknown[] }>('GET', `/assets${q}`);
  }

  mintAsset(recipient: string, assetId: string, metadataHash: string) {
    return this.request<{ token_id: number; tx_hash: string }>('POST', '/assets/mint', { recipient, asset_id: assetId, metadata_hash: metadataHash });
  }

  // Audit
  getAuditLogs() {
    return this.request<{ logs: unknown[] }>('GET', '/audit/logs');
  }
}

export const apiClient = new ApiClient();
