import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Hand, ShieldCheck, User } from 'lucide-react';

export default function VideoTile({ participant, isSelf, isPresenter, onPin }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream, participant.videoEnabled]);

  return (
    <div 
      className={`relative w-full h-full min-h-[180px] bg-[#202124] rounded-2xl overflow-hidden border transition-all duration-200 group flex items-center justify-center ${
        participant.isSpeaking ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-white/10'
      }`}
    >
      {/* Video Stream or Avatar Fallback */}
      {participant.videoEnabled && participant.stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf} // prevent echo for local stream
          className={`w-full h-full object-cover ${isSelf ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative">
            <div 
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl transition-all ${
                participant.isSpeaking ? 'ring-4 ring-emerald-500/80 scale-105' : ''
              }`}
              style={{ backgroundColor: participant.color || '#1a73e8' }}
            >
              {participant.avatar ? (
                <img src={participant.avatar} alt={participant.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                participant.name?.charAt(0).toUpperCase() || <User className="w-10 h-10" />
              )}
            </div>

            {/* Speaking Pulse Wave Animation */}
            {participant.isSpeaking && (
              <span className="absolute -inset-2 rounded-full border-2 border-emerald-400 animate-ping opacity-75"></span>
            )}
          </div>
          <span className="text-sm font-semibold text-slate-200 tracking-wide">
            {participant.name}
          </span>
        </div>
      )}

      {/* Raised Hand Banner Badge */}
      {participant.handRaised && (
        <div className="absolute top-3 left-3 z-10 bg-amber-500 text-slate-950 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg animate-bounce">
          <Hand className="w-4 h-4 fill-slate-950" />
          <span>Hand Raised</span>
        </div>
      )}

      {/* Top Right Admin/Role Badges */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        {participant.isAdmin && (
          <span className="badge badge-admin flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Admin
          </span>
        )}
      </div>

      {/* Bottom Control / Info Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-semibold max-w-[80%]">
          <span className="truncate">
            {participant.name} {isSelf && '(You)'}
          </span>

          {/* Mic Status Icon */}
          <div className="pl-1 border-l border-white/20">
            {participant.micEnabled ? (
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <MicOff className="w-3.5 h-3.5 text-red-400" />
            )}
          </div>
        </div>

        {/* Hover Action to Pin Stream */}
        <button
          onClick={() => onPin && onPin(participant.id)}
          className="pointer-events-auto opacity-0 group-hover:opacity-100 p-2 rounded-full bg-black/70 text-slate-300 hover:text-white hover:bg-black/90 transition-all border border-white/10"
          title="Spotlight Video"
        >
          <User className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
