import React from 'react';
import { 
  Mic, MicOff, Video, VideoOff, Monitor, Hand, Edit3, 
  MessageSquare, Users, ShieldCheck, Disc, PhoneOff, Settings 
} from 'lucide-react';

export default function ControlBar({
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
  return (
    <footer className="w-full h-20 bg-[#202124] border-t border-white/10 px-4 md:px-8 flex items-center justify-between z-30 select-none">
      
      {/* Left Info / Time */}
      <div className="hidden sm:flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-300 tracking-wide">
          Private Team Meeting
        </span>
        {isAdmin && (
          <span className="badge badge-admin text-[10px]">
            <ShieldCheck className="w-3 h-3" /> Admin Mode
          </span>
        )}
      </div>

      {/* Main Bottom Control Buttons Pill */}
      <div className="flex items-center gap-2 md:gap-3 bg-[#2d2f31]/90 p-2 rounded-full border border-white/10 shadow-2xl mx-auto">
        
        {/* Mic Toggle */}
        <button
          onClick={onToggleMic}
          className={`btn-icon ${micEnabled ? 'active' : 'off'}`}
          title={micEnabled ? 'Turn off mic (Ctrl+D)' : 'Turn on mic (Ctrl+D)'}
        >
          {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Video Toggle */}
        <button
          onClick={onToggleVideo}
          className={`btn-icon ${videoEnabled ? 'active' : 'off'}`}
          title={videoEnabled ? 'Turn off camera (Ctrl+E)' : 'Turn on camera (Ctrl+E)'}
        >
          {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Screen Share */}
        <button
          onClick={onToggleScreenShare}
          className={`btn-icon ${isScreenSharing ? 'active ring-2 ring-blue-400' : ''}`}
          title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
        >
          <Monitor className="w-5 h-5" />
        </button>

        {/* Raise Hand */}
        <button
          onClick={onToggleHand}
          className={`btn-icon ${handRaised ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold' : ''}`}
          title={handRaised ? 'Lower hand' : 'Raise hand'}
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

      {/* Right Drawer Toggles */}
      <div className="flex items-center gap-2">
        
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
