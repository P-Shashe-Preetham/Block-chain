// Archive of Trust direction: the app shell stays quiet and editorial, with an ink canvas, warm paper surfaces, and copper / emerald status cues.
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingScreen from "./components/LoadingScreen";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import OpenBankingDashboard from "./pages/OpenBankingDashboard";
import { CrtBackground } from "@/shaders/crt/CrtBackground";

function Router() {
  return (
    <Switch>
      <Route path="/" component={OpenBankingDashboard} />
      <Route path="/dashboard" component={OpenBankingDashboard} />
      <Route path="/home" component={Home} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
          
          {/* Full Website CRT Green Phosphor Terminal Background */}
          <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <CrtBackground
              variant="terminal"
              speed={1.00}
              typeSpeed={1.00}
              motion={1.00}
              hue={0}
              saturation={1.00}
              brightness={1.00}
              opacity={1.00}
              className="w-full h-full"
            />
          </div>

          {/* Website Foreground Content */}
          <div className="relative z-10 min-h-screen text-blue-100 selection:bg-cyan-500/30 selection:text-cyan-200">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

