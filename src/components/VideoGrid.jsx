import React from 'react';
import VideoTile from './VideoTile';
import { Monitor, X } from 'lucide-react';

export default function VideoGrid({ 
  participants, 
  screenShareStream, 
  screenSharerName, 
  onStopScreenShare,
  pinnedId,
  onPin 
}) {
  const count = participants.length;

  let gridClass = 'grid-1';
  if (count === 2) gridClass = 'grid-2';
  else if (count >= 3 && count <= 4) gridClass = 'grid-3';
  else if (count >= 5 && count <= 6) gridClass = 'grid-5';
  else if (count >= 7 && count <= 9) gridClass = 'grid-7';
  else if (count > 9) gridClass = 'grid-more';

  // If someone is sharing screen
  if (screenShareStream) {
    return (
      <div className="presentation-layout animate-fade-in">
        {/* Main Screen Share Viewport */}
        <div className="presentation-main group">
          <video
            ref={(el) => { if (el) el.srcObject = screenShareStream; }}
            autoPlay
            playsInline
            className="w-full h-full object-contain bg-black"
          />

          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-black/75 backdrop-blur-md border border-blue-500/50 text-white text-xs font-semibold shadow-xl">
            <Monitor className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>{screenSharerName || 'Team Member'} is presenting screen</span>
          </div>

          {onStopScreenShare && (
            <button
              onClick={onStopScreenShare}
              className="absolute top-4 right-4 z-20 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xl transition-all"
            >
              <X className="w-4 h-4" />
              <span>Stop Presenting</span>
            </button>
          )}
        </div>

        {/* Sidebar Participant Tile Stack */}
        <div className="presentation-sidebar">
          {participants.map((p) => (
            <div key={p.id} className="h-44 w-full flex-shrink-0">
              <VideoTile participant={p} isSelf={p.isSelf} onPin={onPin} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`video-grid-container ${gridClass} animate-fade-in`}>
      {participants.map((p) => (
        <VideoTile key={p.id} participant={p} isSelf={p.isSelf} onPin={onPin} />
      ))}
    </div>
  );
}
