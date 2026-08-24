import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
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
    const [algoAddress, setAlgoAddress] = useState(null);
    const [mnemonic, setMnemonic] = useState(null);
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
        }
        catch {
            toast.error("Failed to communicate with Algorand backend service");
        }
    };
    const handleScrollTo = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    return (_jsxs("div", { className: "app-shell", children: [_jsxs("div", { className: "ambient-bg", children: [_jsx("div", { className: "ambient-blob-1" }), _jsx("div", { className: "ambient-blob-2" }), _jsx("div", { className: "ambient-grid" })] }), _jsx(Header, { apiOnline: apiOnline, algoAddress: algoAddress, onConnectWallet: handleGenerateWallet, onScrollTo: handleScrollTo }), _jsxs("main", { className: "main-container", children: [_jsx(HeroSection, { onExplore: () => handleScrollTo("wallet"), onConnectWallet: handleGenerateWallet }), _jsx(WalletCard, { algoAddress: algoAddress, mnemonic: mnemonic, onGenerate: handleGenerateWallet }), _jsx(IdentityModule, { algoAddress: algoAddress }), _jsx(AssetVaultModule, {}), _jsx(AccessControlConsole, { apiOnline: apiOnline, algoAddress: algoAddress }), _jsx(AuditStream, {})] }), _jsx(Footer, {})] }));
}
