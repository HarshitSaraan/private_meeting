import React, { useState, useEffect } from 'react';
import { Video, ShieldCheck, Clock } from 'lucide-react';

export default function Navbar({ inMeeting }) {
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
        ' • ' + 
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // In meeting, Navbar should be zero height / omitted
  if (inMeeting) return null;

  return (
    <header className="w-full h-16 bg-[#202124] border-b border-white/10 px-4 md:px-8 flex items-center justify-between text-[#e8eaed] select-none z-20 shrink-0">
      {/* Brand & Team Encrypted Badge */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex items-center gap-2.5 font-bold text-lg md:text-xl tracking-wide shrink-0">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-[#1a73e8] to-[#34a853] flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Meet<span className="text-[#1a73e8]">Private</span>
          </span>
          <span className="hidden sm:inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Team Encrypted
          </span>
        </div>
      </div>

      {/* Right Side Clock (Profile removed as requested) */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 text-xs md:text-sm text-[#9aa0a6] font-medium">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>{timeString}</span>
        </div>
      </div>
    </header>
  );
}
