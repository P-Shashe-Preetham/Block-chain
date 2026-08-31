import React, { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { HeroSection } from "../components/HeroSection";
import { WalletCard } from "../components/WalletCard";
import { IdentityModule } from "../components/IdentityModule";
import { AssetVaultModule } from "../components/AssetVaultModule";
import { AccessControlConsole } from "../components/AccessControlConsole";
import { AuditStream } from "../components/AuditStream";
import { Footer } from "../components/Footer";
import { toast } from "sonner";

export default function Dashboard() {
  const [apiOnline, setApiOnline] = useState(false);
  const [algoAddress, setAlgoAddress] = useState<string | null>(null);
  const [mnemonic, setMnemonic] = useState<string | null>(null);

  useEffect(() => {
    fetch("/healthz")
      .then((res) => res.json())
      .then((data) => setApiOnline(data.status === "ok"))
      .catch(() => setApiOnline(false));
  }, []);

  const handleGenerateWallet = async () => {
    try {
      const res = await fetch("/v1/algorand/accounts/generate", { method: "POST" });
      const data = await res.json();
      if (data.address) {
        setAlgoAddress(data.address);
        setMnemonic(data.mnemonic);
        toast.success("Algorand Keypair Generated!", {
          description: `Address: ${data.address.slice(0, 10)}...${data.address.slice(-6)}`,
        });
      }
    } catch {
      toast.error("Failed to communicate with Algorand backend service");
    }
  };

  const handleScrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="app-shell">
      {/* Ambient Radial Lights */}
      <div className="ambient-bg">
        <div className="ambient-blob-1" />
        <div className="ambient-blob-2" />
        <div className="ambient-grid" />
      </div>

      <Header
        apiOnline={apiOnline}
        algoAddress={algoAddress}
        onConnectWallet={handleGenerateWallet}
        onScrollTo={handleScrollTo}
      />

      <main className="main-container">
        <HeroSection
          onExplore={() => handleScrollTo("wallet")}
          onConnectWallet={handleGenerateWallet}
        />

        <WalletCard
          algoAddress={algoAddress}
          mnemonic={mnemonic}
          onGenerate={handleGenerateWallet}
        />

        <IdentityModule algoAddress={algoAddress} />

        <AssetVaultModule />

        <AccessControlConsole
          apiOnline={apiOnline}
          algoAddress={algoAddress}
        />

        <AuditStream />
      </main>

      <Footer />
    </div>
  );
}
