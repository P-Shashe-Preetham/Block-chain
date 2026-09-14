import { useWeb3 } from '../contexts/Web3Context';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { Shield, Wallet, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function LoginPage() {
  const { isConnected, isConnecting, error, connectWallet, switchNetwork } = useWeb3();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isConnected) {
      setLocation('/dashboard');
    }
  }, [isConnected, setLocation]);

  const isWrongNetwork = error?.includes('network') || error?.includes('Chain ID') || error?.includes('unsupported');
  const isMetaMaskMissing = error?.includes('MetaMask is not installed');

  return (
    <div className="min-h-screen bg-[#030508] text-zinc-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full">
        <Card className="bg-zinc-950/80 border-white/[0.08] backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-[var(--copper)]">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <CardTitle className="text-2xl font-serif text-white mb-2">
                BEL Digital Asset Platform
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Sign in securely using your Ethereum wallet. No passwords needed.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{error}</p>
                  {isWrongNetwork && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={switchNetwork}
                      className="mt-3 w-full border-red-500/30 hover:bg-red-500/10 text-red-400"
                    >
                      Switch Network
                    </Button>
                  )}
                  {isMetaMaskMissing && (
                    <a 
                      href="https://metamask.io" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-3 text-red-300 hover:text-red-200 underline"
                    >
                      Install MetaMask <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            )}

            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full h-12 bg-gradient-to-r from-[var(--copper)] to-[var(--copper-bright)] hover:opacity-90 text-white font-medium text-sm rounded-xl"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5 mr-2" />
                  Connect MetaMask Wallet
                </>
              )}
            </Button>
            
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.08]">
              <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/[0.04]">
                <h4 className="text-xs font-semibold text-white mb-1">Admin</h4>
                <p className="text-[10px] text-zinc-500">Full system access & minting</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/[0.04]">
                <h4 className="text-xs font-semibold text-white mb-1">Manager</h4>
                <p className="text-[10px] text-zinc-500">Approve & oversee assets</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/[0.04]">
                <h4 className="text-xs font-semibold text-white mb-1">Auditor</h4>
                <p className="text-[10px] text-zinc-500">Read-only compliance view</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/[0.04]">
                <h4 className="text-xs font-semibold text-white mb-1">User</h4>
                <p className="text-[10px] text-zinc-500">Manage personal identity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
