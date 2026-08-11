import React, { useState, useEffect } from 'react';
import { Video, ShieldCheck, Clock, User, LogOut, Copy, Check } from 'lucide-react';

export default function Navbar({ inMeeting, meetingInfo, userProfile, onLeaveMeeting }) {
  const [timeString, setTimeString] = useState('');
  const [copied, setCopied] = useState(false);

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

  const handleCopyLink = () => {
    if (!meetingInfo?.code) return;
    const url = `${window.location.origin}/#${meetingInfo.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full h-16 bg-[#202124] border-b border-white/10 px-4 md:px-6 flex items-center justify-between text-[#e8eaed] select-none z-20 shrink-0">
      {/* Brand & Room Info */}
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

        {inMeeting && meetingInfo && (
          <div className="hidden md:flex items-center gap-3 pl-4 border-l border-white/10">
            <span className="font-semibold text-sm max-w-[180px] lg:max-w-[260px] truncate text-slate-200">
              {meetingInfo.title || 'Team Workspace Meeting'}
            </span>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2d2f31] hover:bg-[#3c4043] text-xs font-medium text-slate-300 transition-colors border border-white/5 shrink-0"
              title="Copy Meeting Link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : meetingInfo.code}</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Side Info & User */}
      <div className="flex items-center gap-3 md:gap-4 shrink-0">
        <div className="hidden sm:flex items-center gap-2 text-xs md:text-sm text-[#9aa0a6] font-medium">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>{timeString}</span>
        </div>

        {inMeeting && (
          <button
            onClick={onLeaveMeeting}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/90 hover:bg-red-600 text-white font-medium text-xs md:text-sm transition-all shadow-md active:scale-95 shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Leave Meeting</span>
          </button>
        )}

        <div className="flex items-center gap-2.5 pl-2 border-l border-white/10 shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#1a73e8] text-white font-bold text-sm flex items-center justify-center shadow-md overflow-hidden border border-white/20 shrink-0">
            {userProfile?.avatar ? (
              <img src={userProfile.avatar} alt={userProfile.name} className="w-full h-full object-cover" />
            ) : (
              userProfile?.name?.charAt(0) || <User className="w-5 h-5" />
            )}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-200 max-w-[120px] truncate">{userProfile?.name || 'Team Member'}</span>
            <span className="text-[10px] text-emerald-400 font-medium">● Connected</span>
          </div>
        </div>
      </div>
    </header>
  );
}
