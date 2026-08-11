import React from 'react';
import { Disc, Square } from 'lucide-react';

export default function RecordingBanner({ isRecording, recordTime, onStopRecording }) {
  if (!isRecording) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2 rounded-full bg-red-950/80 backdrop-blur-md border border-red-500/50 text-white shadow-2xl animate-fade-in">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
        <Disc className="w-4 h-4 text-red-400 animate-spin" />
        <span className="text-xs font-bold tracking-wider uppercase text-red-200">
          REC {recordTime}
        </span>
      </div>

      <button
        onClick={onStopRecording}
        className="px-3 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-all shadow-md"
        title="Stop & Download Recording"
      >
        <Square className="w-3 h-3 fill-white" />
        <span>Stop</span>
      </button>
    </div>
  );
}
