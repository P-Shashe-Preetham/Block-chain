// Archive of Trust direction: the app shell stays quiet and editorial, with an ink canvas, warm paper surfaces, and copper / emerald status cues.
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { Web3Provider, useWeb3 } from "./contexts/Web3Context";
import { ProtectedRoute } from "./components/ProtectedRoute";
import AssetChainPage from "./pages/AssetChainPage";
// import Home from "./pages/Home";
import OpenBankingDashboard from "./pages/OpenBankingDashboard";
import PlatformDashboard from "./pages/PlatformDashboard";
import LoginPage from "./pages/LoginPage";
import RoleDashboard from "./pages/RoleDashboard";

function Router() {
  const { isConnected } = useWeb3();
  return (
    <Switch>
      <Route path="/">
        {isConnected ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
      </Route>
      <Route path="/login" component={LoginPage} />
      <Route path="/dashboard" component={RoleDashboard} />
      <Route path="/role-dashboard" component={RoleDashboard} />
      
      {/* Protected Admin-Only Routes */}
      <Route path="/platform">
        <ProtectedRoute requiredRole="admin">
          <RoleDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/blockchain">
        <ProtectedRoute requiredRole="admin">
          <RoleDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute requiredRole="admin">
          <RoleDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/assets/create">
        <ProtectedRoute requiredRole="admin">
          <RoleDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/asset-chain">
        <ProtectedRoute requiredRole="admin">
          <RoleDashboard />
        </ProtectedRoute>
      </Route>

      {/* Public / User Routes */}
      <Route path="/open-banking" component={OpenBankingDashboard} />
      {/* <Route path="/home" component={Home} /> */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <Web3Provider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </Web3Provider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
