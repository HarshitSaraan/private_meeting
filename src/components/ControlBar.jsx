import React, { useState } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, Monitor, Hand, Edit3, 
  MessageSquare, Users, ShieldCheck, Disc, PhoneOff, Copy, Check 
} from 'lucide-react';

export default function ControlBar({
  meetingCode,
  meetingTitle,
  micEnabled,
  onToggleMic,
  videoEnabled,
  onToggleVideo,
  isScreenSharing,
  onToggleScreenShare,
  handRaised,
  onToggleHand,
  isWhiteboardOpen,
  onToggleWhiteboard,
  isChatOpen,
  onToggleChat,
  isPeopleOpen,
  onTogglePeople,
  isAdmin,
  isRecording,
  onToggleRecording,
  onLeaveMeeting,
  unreadCount = 0
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (!meetingCode) return;
    const url = `${window.location.origin}/#${meetingCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="w-full h-20 bg-[#202124] border-t border-white/10 px-4 md:px-6 flex items-center justify-between z-30 select-none shrink-0">
      
      {/* Left Room Code & Info */}
      <div className="hidden sm:flex items-center gap-3 min-w-[200px]">
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2d2f31] hover:bg-[#3c4043] text-xs font-medium text-slate-200 transition-colors border border-white/10"
          title="Copy Meeting Code Link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
          <span className="font-mono">{copied ? 'Copied Link' : meetingCode}</span>
        </button>

        {isAdmin && (
          <span className="badge badge-admin text-[10px]">
            <ShieldCheck className="w-3 h-3" /> Admin Mode
          </span>
        )}
      </div>

      {/* Main Center Floating Controls Pill */}
      <div className="flex items-center gap-2 md:gap-3 bg-[#2d2f31]/90 p-2 rounded-full border border-white/10 shadow-2xl mx-auto">
        
        {/* Mic Toggle */}
        <button
          onClick={onToggleMic}
          className={`btn-icon ${micEnabled ? 'active' : 'off'}`}
          title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Video Toggle */}
        <button
          onClick={onToggleVideo}
          className={`btn-icon ${videoEnabled ? 'active' : 'off'}`}
          title={videoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Screen Share */}
        <button
          onClick={onToggleScreenShare}
          className={`btn-icon ${isScreenSharing ? 'active ring-2 ring-blue-400' : ''}`}
          title={isScreenSharing ? 'Stop Sharing Screen' : 'Share Screen'}
        >
          <Monitor className="w-5 h-5" />
        </button>

        {/* Raise Hand */}
        <button
          onClick={onToggleHand}
          className={`btn-icon ${handRaised ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold' : ''}`}
          title={handRaised ? 'Lower Hand' : 'Raise Hand'}
        >
          <Hand className="w-5 h-5" />
        </button>

        {/* Whiteboard Canvas */}
        <button
          onClick={onToggleWhiteboard}
          className={`btn-icon ${isWhiteboardOpen ? 'active' : ''}`}
          title="Open Collaborative Whiteboard"
        >
          <Edit3 className="w-5 h-5 text-purple-300" />
        </button>

        {/* Admin Meeting Recording Control */}
        <button
          onClick={onToggleRecording}
          className={`btn-icon ${isRecording ? 'bg-red-600 text-white pulse-rec' : ''}`}
          title={isRecording ? 'Stop Recording' : 'Start Recording Meeting'}
        >
          <Disc className={`w-5 h-5 ${isRecording ? 'text-white' : 'text-red-400'}`} />
        </button>

        {/* End / Leave Meeting Button */}
        <button
          onClick={onLeaveMeeting}
          className="btn-icon bg-red-600 hover:bg-red-700 text-white w-14 rounded-full border-none shadow-lg shadow-red-600/30"
          title="Leave Meeting"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>

      {/* Right Side Drawers Toggles */}
      <div className="flex items-center gap-2 min-w-[200px] justify-end">
        {/* Chat Drawer Button */}
        <button
          onClick={onToggleChat}
          className={`btn-icon relative ${isChatOpen ? 'active' : ''}`}
          title="In-meeting Chat"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#202124]">
              {unreadCount}
            </span>
          )}
        </button>

        {/* People Drawer Button */}
        <button
          onClick={onTogglePeople}
          className={`btn-icon ${isPeopleOpen ? 'active' : ''}`}
          title="Participants & Admin Controls"
        >
          <Users className="w-5 h-5" />
        </button>
      </div>

    </footer>
  );
}
