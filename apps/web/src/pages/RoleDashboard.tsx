import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useWeb3 } from "@/contexts/Web3Context";
import { apiClient } from "@/lib/api-client";

export default function RoleDashboard() {
  const { account: wallet, role, isConnected, isConnecting, error, connectWallet, disconnectWallet } = useWeb3();

  // Asset and Log State
  const [assets, setAssets] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  // Mint Asset Form State
  const [assetName, setAssetName] = useState("");
  const [assetDesc, setAssetDesc] = useState("");
  const [assetType, setAssetType] = useState("");
  const [assetIpfs, setAssetIpfs] = useState("");

  // Consent State
  const [consents, setConsents] = useState<any[]>([]);

  // Registration State
  const [did, setDid] = useState("");
  const [piiData, setPiiData] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (isConnected && wallet) {
      fetchDashboardData(wallet, role || "USER");
    }
  }, [isConnected, wallet, role]);

  const fetchDashboardData = async (userWallet: string, userRole: string) => {
    try {
      // Check identity status
      const idRes = await fetch(`/api/identity/status/${userWallet}`);
      if (idRes.ok) {
        const idData = await idRes.json();
        setIsRegistered(idData.registered);
      }

      const data = await apiClient.listAssets(userWallet);
      setAssets(data.assets || []);

      const consentsRes = await fetch(`/api/rbac/consents/${userWallet}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("jwt")}` }
      });
      if (consentsRes.ok) {
        const data = await consentsRes.json();
        setConsents(data.consents || []);
      }

      if (userRole === "AUDITOR" || userRole === "ADMIN" || userRole === "ENTERPRISE") {
        const logData: any = await apiClient.getAuditLogs();
        setLogs(logData.logs || logData.audit_logs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/identity/register", {
        method: "POST",
        headers: {
           "Content-Type": "application/json",
           "Authorization": `Bearer ${localStorage.getItem("jwt")}`
        },
        body: JSON.stringify({
          did,
          pii_data: piiData,
          wallet_address: wallet,
          signature: "dummy_signature_for_now"
        })
      });
      if (res.ok) {
        alert("Identity registered successfully");
        setIsRegistered(true);
      } else {
        alert("Failed to register identity");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGrantConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    const requester = window.prompt("Enter requester wallet address:");
    if (!requester) return;

    try {
      const res = await fetch("/api/rbac/grant-consent", {
        method: "POST",
        headers: {
           "Content-Type": "application/json",
           "Authorization": `Bearer ${localStorage.getItem("jwt")}`
        },
        body: JSON.stringify({
          requester_wallet: requester,
          asset_id: "ALL", // simplifying
          access_level: "READ",
          duration_seconds: 3600
        })
      });
      if (res.ok) {
        alert("Consent granted");
        fetchDashboardData(wallet!, role!);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeConsent = async (consentId: string) => {
    try {
      const res = await fetch(`/api/rbac/revoke-consent/${consentId}`, {
        method: "POST",
        headers: {
           "Authorization": `Bearer ${localStorage.getItem("jwt")}`
        }
      });
      if (res.ok) {
        alert("Consent revoked");
        fetchDashboardData(wallet!, role!);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMintAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.mintAsset(wallet!, assetName, assetDesc);
      if (res.token_id) {
        alert("Asset Minted successfully");
        fetchDashboardData(wallet!, role!);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to mint asset");
    }
  };

  const handleRequestAccess = async (assetId: string) => {
    try {
      const res = await fetch("/api/rbac/request-access", {
        method: "POST",
        headers: {
           "Content-Type": "application/json",
           "Authorization": `Bearer ${localStorage.getItem("jwt")}`
        },
        body: JSON.stringify({
          owner_wallet: wallet,
          asset_id: assetId,
          access_level: "READ"
        })
      });
      if (res.ok) {
        alert("Access requested successfully");
      } else {
        alert("Access denied or consent required");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <Card className="w-[400px] border-zinc-800 bg-zinc-900">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-emerald-400">Digital Asset Platform</CardTitle>
            <CardDescription className="text-zinc-400">SIWE Authentication Gateway</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8 flex-col space-y-4">
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button onClick={connectWallet} disabled={isConnecting} variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full">
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8">
      <header className="flex justify-between items-center mb-12 pb-4 border-b border-zinc-800">
        <h1 className="text-3xl font-bold text-white tracking-tight">Digital Asset Platform</h1>
        <div className="flex items-center gap-4">
           <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-semibold text-emerald-400 border border-emerald-900/50">
             ROLE: {role}
           </span>
            <span className="text-sm font-mono text-zinc-400 bg-zinc-900 px-3 py-1 rounded border border-zinc-800">
              {wallet ? (wallet.length > 12 ? `${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 4)}` : wallet) : "Connected"}
            </span>
           <Button variant="outline" size="sm" onClick={disconnectWallet} className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">Disconnect</Button>
        </div>
      </header>
      
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800 mb-8">
          <TabsTrigger value="dashboard">My Dashboard</TabsTrigger>
          {(role === "ADMIN" || role === "ENTERPRISE") && <TabsTrigger value="mint">Mint Asset</TabsTrigger>}
          {(role === "AUDITOR" || role === "ADMIN") && <TabsTrigger value="audit">Audit Logs</TabsTrigger>}
        </TabsList>

        <TabsContent value="dashboard">
          <Card className="border-zinc-800 bg-zinc-900 shadow-none mb-4">
            <CardHeader>
              <CardTitle className="text-emerald-400">Identity Status</CardTitle>
              <CardDescription className="text-zinc-400">Your DID and Registration status</CardDescription>
            </CardHeader>
            <CardContent>
              {isRegistered ? (
                <div className="text-emerald-400 font-bold">✓ Identity Registered</div>
              ) : (
                <form onSubmit={handleRegisterIdentity} className="flex gap-4">
                   <Input value={did} onChange={e => setDid(e.target.value)} placeholder="did:ethr:..." className="bg-zinc-950 border-zinc-800 text-zinc-200" required />
                   <Input value={piiData} onChange={e => setPiiData(e.target.value)} placeholder="Encrypted PII Data" className="bg-zinc-950 border-zinc-800 text-zinc-200" required />
                   <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Register Identity</Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900 shadow-none mb-4">
            <CardHeader>
              <CardTitle className="text-emerald-400">Owned Assets</CardTitle>
              <CardDescription className="text-zinc-400">Digital assets bound to your identity</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">ID</TableHead>
                    <TableHead className="text-zinc-400">Name</TableHead>
                    <TableHead className="text-zinc-400">Type</TableHead>
                    <TableHead className="text-zinc-400">IPFS CID</TableHead>
                    <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.length === 0 ? (
                    <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell colSpan={5} className="text-center text-zinc-500 py-8">No assets found.</TableCell>
                    </TableRow>
                  ) : (
                    assets.map((a, idx) => (
                      <TableRow key={a.asset_id || a.token_id || idx} className="border-zinc-800 hover:bg-zinc-800/50">
                        <TableCell className="font-mono text-xs">{a.asset_id || a.token_id || `ASSET-${idx}`}</TableCell>
                        <TableCell className="text-zinc-200">{a.name || a.asset_id || "Asset"}</TableCell>
                        <TableCell className="text-zinc-400">{a.asset_type || a.status || "ACTIVE"}</TableCell>
                        <TableCell className="font-mono text-xs text-zinc-500">
                          {a.ipfs_cid || (a.metadata_hash ? `${String(a.metadata_hash).substring(0, 10)}...` : "N/A")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleRequestAccess(String(a.asset_id || a.token_id))} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20">
                            Request Access
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900 shadow-none">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-emerald-400">Active Consents</CardTitle>
                  <CardDescription className="text-zinc-400">Manage who has access to your assets</CardDescription>
                </div>
                <Button onClick={handleGrantConsent} size="sm" className="bg-blue-600 hover:bg-blue-700">Grant Consent</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Consent ID</TableHead>
                    <TableHead className="text-zinc-400">Requester</TableHead>
                    <TableHead className="text-zinc-400">Asset</TableHead>
                    <TableHead className="text-zinc-400 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consents.length === 0 ? (
                    <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell colSpan={4} className="text-center text-zinc-500 py-8">No active consents.</TableCell>
                    </TableRow>
                  ) : (
                    consents.map((c, idx) => {
                      const reqWallet = c.requester_wallet || c.tsp_wallet || c.user_wallet || "";
                      const displayWallet = reqWallet ? (reqWallet.length > 10 ? `${reqWallet.substring(0, 8)}...` : reqWallet) : "N/A";
                      return (
                        <TableRow key={c.consent_id || idx} className="border-zinc-800 hover:bg-zinc-800/50">
                          <TableCell className="font-mono text-xs">{c.consent_id || `cst_${idx}`}</TableCell>
                          <TableCell className="font-mono text-xs text-zinc-400">{displayWallet}</TableCell>
                          <TableCell className="text-zinc-400">{c.asset_id || c.bank_wallet || "ALL"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleRevokeConsent(c.consent_id)} className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                              Revoke Consent
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {(role === "ADMIN" || role === "ENTERPRISE") && (
          <TabsContent value="mint">
            <Card className="border-zinc-800 bg-zinc-900 shadow-none max-w-2xl">
              <CardHeader>
                <CardTitle className="text-emerald-400">Mint New Digital Asset</CardTitle>
                <CardDescription className="text-zinc-400">Register an ERC-721 token and store metadata securely.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleMintAsset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-zinc-300">Asset Name</Label>
                    <Input id="name" value={assetName} onChange={e => setAssetName(e.target.value)} required className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc" className="text-zinc-300">Description</Label>
                    <Input id="desc" value={assetDesc} onChange={e => setAssetDesc(e.target.value)} required className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-zinc-300">Asset Type</Label>
                    <Input id="type" value={assetType} onChange={e => setAssetType(e.target.value)} required placeholder="e.g., SENSITIVE_DOCUMENT" className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ipfs" className="text-zinc-300">IPFS CID</Label>
                    <Input id="ipfs" value={assetIpfs} onChange={e => setAssetIpfs(e.target.value)} required placeholder="Qm..." className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-emerald-500" />
                  </div>
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4">
                    Mint & Broadcast
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {(role === "AUDITOR" || role === "ADMIN") && (
          <TabsContent value="audit">
            <Card className="border-zinc-800 bg-zinc-900 shadow-none">
              <CardHeader>
                <CardTitle className="text-emerald-400">Immutable Audit Logs</CardTitle>
                <CardDescription className="text-zinc-400">EVM-indexed AccessAttemptLogged events</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-400">Timestamp</TableHead>
                      <TableHead className="text-zinc-400">Action</TableHead>
                      <TableHead className="text-zinc-400">Asset ID</TableHead>
                      <TableHead className="text-zinc-400">Requester</TableHead>
                      <TableHead className="text-zinc-400">Status</TableHead>
                      <TableHead className="text-zinc-400">Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                        <TableCell colSpan={6} className="text-center text-zinc-500 py-8">No audit logs found.</TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log, idx) => {
                        const reqWallet = log.requester_wallet || log.tsp_wallet || log.user_wallet || log.requester || "";
                        const displayWallet = reqWallet ? (reqWallet.length > 10 ? `${reqWallet.substring(0, 8)}...` : reqWallet) : "N/A";
                        let displayTime = "N/A";
                        if (log.timestamp) {
                          try {
                            const dateObj = typeof log.timestamp === "number" ? new Date(log.timestamp * 1000) : new Date(log.timestamp);
                            displayTime = isNaN(dateObj.getTime()) ? String(log.timestamp) : dateObj.toLocaleString();
                          } catch {
                            displayTime = String(log.timestamp);
                          }
                        }
                        return (
                          <TableRow key={log.log_id || idx} className="border-zinc-800 hover:bg-zinc-800/50">
                            <TableCell className="text-zinc-400 text-xs">{displayTime}</TableCell>
                            <TableCell className="font-semibold text-zinc-200">{log.action || log.data_type || "ACCESS"}</TableCell>
                            <TableCell className="font-mono text-xs text-zinc-500">{log.asset_id || log.token_id || log.bank_wallet || "N/A"}</TableCell>
                            <TableCell className="font-mono text-xs text-zinc-500">{displayWallet}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${log.granted ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                                {log.granted ? 'GRANTED' : 'DENIED'}
                              </span>
                            </TableCell>
                            <TableCell className="text-zinc-400 text-sm">{log.reason || "N/A"}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
