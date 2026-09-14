import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { apiClient } from '../lib/api-client';

const EXPECTED_CHAIN_ID = '0x7a69'; // 31337 in hex (Hardhat)

interface Web3State {
  account: string | null;
  chainId: string | null;
  role: string | null;
  token: string | null;
  userName: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  error: string | null;
}

interface Web3ContextType extends Web3State {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Web3State>({
    account: null,
    chainId: null,
    role: null,
    token: null,
    userName: null,
    isConnected: false,
    isConnecting: false,
    provider: null,
    signer: null,
    error: null,
  });

  const disconnectWallet = useCallback(() => {
    setState({
      account: null,
      chainId: null,
      role: null,
      token: null,
      userName: null,
      isConnected: false,
      isConnecting: false,
      provider: null,
      signer: null,
      error: null,
    });
    apiClient.setToken(null);
    localStorage.removeItem("jwt");
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setState(prev => ({ ...prev, error: 'MetaMask is not installed' }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const account = accounts[0];
      
      const network = await provider.getNetwork();
      const chainIdHex = '0x' + network.chainId.toString(16);
      
      if (chainIdHex !== EXPECTED_CHAIN_ID) {
        setState(prev => ({ ...prev, isConnecting: false, error: 'Please switch to Hardhat network (31337)' }));
        return;
      }

      const signer = await provider.getSigner();

      // Get challenge
      const { nonce, message } = await apiClient.getNonce(account);

      // Sign message
      const signature = await signer.signMessage(message);

      // Login
      const loginRes = await apiClient.login(account, signature, nonce);

      apiClient.setToken(loginRes.token);
      localStorage.setItem("jwt", loginRes.token);

      setState({
        account: loginRes.wallet_address,
        chainId: chainIdHex,
        role: loginRes.role,
        token: loginRes.token,
        userName: loginRes.name,
        isConnected: true,
        isConnecting: false,
        provider,
        signer,
        error: null,
      });

    } catch (err: any) {
      console.error(err);
      setState(prev => ({ ...prev, isConnecting: false, error: err.message || 'Failed to connect' }));
    }
  }, []);

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: EXPECTED_CHAIN_ID }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: EXPECTED_CHAIN_ID,
                chainName: 'Hardhat Local',
                rpcUrls: ['http://127.0.0.1:8545'],
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
              },
            ],
          });
        } catch (addError) {
          console.error(addError);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: unknown[]) => {
      if ((accounts as string[]).length === 0) {
        disconnectWallet();
      } else {
        disconnectWallet(); // Forces user to re-auth with new wallet
      }
    };

    const handleChainChanged = (chainId: unknown) => {
      if (chainId !== EXPECTED_CHAIN_ID) {
        setState(prev => ({ ...prev, chainId: chainId as string }));
      }
    };

    const handleDisconnect = () => {
      disconnectWallet();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged as any);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [disconnectWallet]);

  return (
    <Web3Context.Provider value={{ ...state, connectWallet, disconnectWallet, switchNetwork }}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}
