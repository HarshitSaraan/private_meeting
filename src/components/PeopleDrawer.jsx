import React from 'react';
import { 
  X, Users, Mic, MicOff, Video, VideoOff, ShieldCheck, 
  Hand, Shield, VolumeX, MessageSquareOff, Trash2 
} from 'lucide-react';

export default function PeopleDrawer({ 
  isOpen, 
  onClose, 
  participants, 
  currentUser,
  isAdmin,
  onMuteAll,
  onToggleChatDisable,
  chatDisabled,
  onToggleAdminRole,
  onRemoveParticipant
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed right-4 top-4 bottom-24 w-80 md:w-96 bg-[#202124] border border-white/10 rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden text-slate-200 animate-fade-in">
      
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#28292c]">
        <div className="flex items-center gap-2 font-semibold text-white">
          <Users className="w-5 h-5 text-blue-400" />
          <span>People in Call ({participants.length})</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Admin Action Bar if user is Admin */}
      {isAdmin && (
        <div className="p-3 bg-[#191a1d] border-b border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Admin Quick Controls
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onMuteAll}
              className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <VolumeX className="w-4 h-4" />
              <span>Mute All Mics</span>
            </button>

            <button
              onClick={onToggleChatDisable}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border ${
                chatDisabled 
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
              }`}
            >
              <MessageSquareOff className="w-4 h-4" />
              <span>{chatDisabled ? 'Enable Chat' : 'Disable Chat'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Participants List */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {participants.map((p) => (
          <div 
            key={p.id}
            className="p-3 rounded-xl bg-[#28292c] hover:bg-[#2e3034] border border-white/5 flex items-center justify-between gap-3 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                style={{ backgroundColor: p.color || '#1a73e8' }}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-white truncate max-w-[120px]">
                    {p.name}
                  </span>
                  {p.isSelf && <span className="text-[10px] text-slate-400">(You)</span>}
                </div>

                <div className="flex items-center gap-1 mt-0.5">
                  {p.isAdmin && (
                    <span className="badge badge-admin text-[9px] py-0 px-1.5">Admin</span>
                  )}
                  {p.handRaised && (
                    <span className="text-[10px] text-amber-400 font-medium flex items-center gap-0.5">
                      <Hand className="w-3 h-3" /> Hand
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Status Icons & Admin Controls dropdown */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-slate-400">
                {p.micEnabled ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-red-400" />}
                {p.videoEnabled ? <Video className="w-3.5 h-3.5 text-blue-400" /> : <VideoOff className="w-3.5 h-3.5 text-slate-500" />}
              </div>

              {/* Multi-Admin Management & Kick Options for Admin */}
              {isAdmin && !p.isSelf && (
                <div className="flex items-center gap-1 pl-2 border-l border-white/10">
                  <button
                    onClick={() => onToggleAdminRole(p.id)}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${
                      p.isAdmin 
                        ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' 
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={p.isAdmin ? "Demote from Admin" : "Make Admin"}
                  >
                    <Shield className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onRemoveParticipant(p.id)}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Remove participant from room"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
