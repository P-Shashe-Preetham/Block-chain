import { useState, useEffect } from "react";
import { CrtBackground } from "@/shaders/crt/CrtBackground";
import "@/shaders/threeui.css";

interface LoadingScreenProps {
  onComplete?: () => void;
  durationMs?: number;
}

export default function LoadingScreen({ onComplete, durationMs = 3800 }: LoadingScreenProps) {
  const [fadingOut, setFadingOut] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleComplete();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs]);

  const handleComplete = () => {
    setFadingOut(true);
    setTimeout(() => {
      setRemoved(true);
      if (onComplete) onComplete();
    }, 700);
  };

  if (removed) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#03100a] transition-opacity duration-700 ease-in-out ${
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-label="Loading Screen"
    >
      <div className="w-full h-full relative">
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
        
        {/* Subtle overlay HUD controls */}
        <div className="absolute bottom-6 right-6 z-10 flex items-center gap-4">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs tracking-wider">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]" />
            INITIALIZING SYSTEM LOGS...
          </div>
          <button
            onClick={handleComplete}
            className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-mono text-xs rounded transition-all duration-200 backdrop-blur-md cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)]"
          >
            ENTER SYSTEM [ESC]
          </button>
        </div>
      </div>
    </div>
  );
}
