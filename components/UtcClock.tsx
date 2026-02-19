// components/UtcClock.tsx
"use client";

import { useState, useEffect } from "react";

export default function UtcClock() {
  const [time, setTime] = useState<string>("00:00:00 UTC");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // Prevents hydration mismatch

    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');

      setTime(`${hours}:${minutes}:${seconds} UTC`);
    };

    // Set it immediately so there's no 1-second delay on load
    updateTime();
    
    // Tick once per second
    const intervalId = setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Don't render until the client loads
  if (!mounted) {
    return (
      <div className="font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-md text-sm w-[125px] text-center whitespace-nowrap opacity-0">
        00:00:00 UTC
      </div>
    );
  }

  return (
    <div className="font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-md text-sm w-[125px] text-center whitespace-nowrap shadow-[0_0_10px_rgba(52,211,153,0.2)]">
      {time}
    </div>
  );
}