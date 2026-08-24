import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Archive of Trust direction: the app shell stays quiet and editorial, with an ink canvas, warm paper surfaces, and copper / emerald status cues.
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
function Router() {
    return (_jsxs(Switch, { children: [_jsx(Route, { path: "/", component: Home }), _jsx(Route, { path: "/404", component: NotFound }), _jsx(Route, { component: NotFound })] }));
}
export default function App() {
    return (_jsx(ErrorBoundary, { children: _jsx(ThemeProvider, { defaultTheme: "light", children: _jsxs(TooltipProvider, { children: [_jsx(Toaster, {}), _jsx(Router, {})] }) }) }));
}
