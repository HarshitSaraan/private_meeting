import React, { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, Calendar, Plus, Keyboard, ArrowRight, ShieldCheck, Clock, Trash2, Copy, Check, Sparkles, UserCheck } from 'lucide-react';
import { generateMeetingCode } from '../utils/storage';

export default function HomeLobby({ 
  userProfile, 
  onSaveProfile, 
  onStartMeeting, 
  scheduledMeetings, 
  onDeleteScheduled,
  onOpenScheduleModal 
}) {
  const [meetingCodeInput, setMeetingCodeInput] = useState('');
  const [userName, setUserName] = useState(userProfile?.name || 'Team Admin');
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [previewStream, setPreviewStream] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const animFrameRef = useRef(null);

  // Initialize camera/mic preview
  useEffect(() => {
    let active = true;

    async function initPreview() {
      try {
        if (!videoEnabled && !micEnabled) {
          if (previewStream) {
            previewStream.getTracks().forEach(t => t.stop());
            setPreviewStream(null);
          }
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoEnabled ? { width: { ideal: 640 }, height: { ideal: 480 } } : false,
          audio: micEnabled
        });

        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        setPreviewStream(stream);

        if (videoRef.current && videoEnabled) {
          videoRef.current.srcObject = stream;
        }

        // Setup audio visualizer for mic test
        if (micEnabled && stream.getAudioTracks().length > 0) {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const analyser = audioCtx.createAnalyser();
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          analyser.fftSize = 64;
          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const updateVolume = () => {
            if (!active) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateVolume);
          };

          audioContextRef.current = audioCtx;
          updateVolume();
        }
      } catch (err) {
        console.warn('Camera/Mic preview fallback:', err);
      }
    }

    initPreview();

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (previewStream) {
        previewStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [videoEnabled, micEnabled]);

  const handleInstantMeeting = () => {
    if (!userName.trim()) {
      setErrorMsg('Please enter your name');
      return;
    }
    const code = generateMeetingCode();
    onSaveProfile({ ...userProfile, name: userName.trim() });
    onStartMeeting({
      code,
      title: `${userName.trim()}'s Instant Team Sync`,
      isAdmin: true, // Meeting creator is Primary Admin!
      isOwner: true,
      userName: userName.trim(),
      micInitial: micEnabled,
      videoInitial: videoEnabled
    });
  };

  const handleJoinByCode = (e) => {
    e.preventDefault();
    const cleanCode = meetingCodeInput.trim().toLowerCase();
    if (!cleanCode) {
      setErrorMsg('Please enter a valid meeting code');
      return;
    }
    if (!userName.trim()) {
      setErrorMsg('Please enter your name');
      return;
    }
    onSaveProfile({ ...userProfile, name: userName.trim() });
    onStartMeeting({
      code: cleanCode,
      title: `Meeting (${cleanCode})`,
      isAdmin: false, // Normal participant initially unless granted by admin
      isOwner: false,
      userName: userName.trim(),
      micInitial: micEnabled,
      videoInitial: videoEnabled
    });
  };

  const handleJoinScheduled = (meeting) => {
    if (!userName.trim()) {
      setErrorMsg('Please enter your name');
      return;
    }
    onSaveProfile({ ...userProfile, name: userName.trim() });
    onStartMeeting({
      code: meeting.code,
      title: meeting.title,
      isAdmin: true, // Creator/Scheduled host has admin rights
      isOwner: true,
      userName: userName.trim(),
      passcode: meeting.passcode,
      micInitial: micEnabled,
      videoInitial: videoEnabled
    });
  };

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 w-full bg-[#121316] text-slate-200 overflow-y-auto px-4 py-8 md:p-12 flex flex-col items-center">
      <div className="w-full max-w-6xl space-y-12">

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Quick Actions */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold tracking-wide">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Private & Secure Team Video Platform</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                Premium video meetings.<br />
                <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
                  Designed for your team only.
                </span>
              </h1>

              <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
                Connect instantly, share screens, whiteboard collaboratively, and control meetings with multi-admin management and instant local recording.
              </p>
            </div>

            {/* Display Name Input */}
            <div className="bg-[#202124] p-4 rounded-xl border border-white/10 max-w-lg space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-400" /> Display Name (Your Meeting Name)
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => { setUserName(e.target.value); setErrorMsg(''); }}
                placeholder="Enter your name"
                className="input-field font-medium text-base text-white"
              />
            </div>

            {errorMsg && (
              <div className="p-3 text-xs font-medium text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg max-w-lg">
                {errorMsg}
              </div>
            )}

            {/* Action Buttons & Code Form */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={handleInstantMeeting}
                className="btn btn-primary px-6 py-3.5 text-base font-semibold shadow-xl shadow-blue-600/30 flex items-center gap-2.5 hover:scale-105 active:scale-95"
              >
                <Video className="w-5 h-5" />
                <span>New Instant Meeting</span>
              </button>

              <button
                onClick={onOpenScheduleModal}
                className="btn btn-secondary px-5 py-3.5 text-base font-semibold flex items-center gap-2.5 hover:border-blue-500/50"
              >
                <Calendar className="w-5 h-5 text-blue-400" />
                <span>Schedule Meeting</span>
              </button>
            </div>

            {/* Join Code Input Form */}
            <form onSubmit={handleJoinByCode} className="flex items-center gap-3 max-w-md pt-2">
              <div className="relative flex-1">
                <Keyboard className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Enter a meeting code (e.g. abc-defg-hij)"
                  value={meetingCodeInput}
                  onChange={(e) => setMeetingCodeInput(e.target.value)}
                  className="input-field pl-11 py-3 text-sm font-mono tracking-wide"
                />
              </div>
              <button
                type="submit"
                disabled={!meetingCodeInput.trim()}
                className="btn btn-secondary px-5 py-3 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <span>Join</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right Column: Interactive Camera Preview */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-md bg-[#202124] border border-white/10 rounded-2xl p-4 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Hardware Setup Test
                </span>
                <span className="text-xs text-slate-500">Self Preview</span>
              </div>

              {/* Video Frame */}
              <div className="relative aspect-video w-full bg-[#121316] rounded-xl overflow-hidden border border-white/10 flex items-center justify-center group shadow-inner">
                {videoEnabled ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <div className="w-16 h-16 rounded-full bg-[#2d2f31] flex items-center justify-center text-slate-400 border border-white/10">
                      <VideoOff className="w-8 h-8" />
                    </div>
                    <span className="text-xs font-medium">Camera is turned off</span>
                  </div>
                )}

                {/* Floating Preview Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
                  <button
                    type="button"
                    onClick={() => setMicEnabled(!micEnabled)}
                    className={`btn-icon ${micEnabled ? 'active' : 'off'}`}
                    title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                  >
                    {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setVideoEnabled(!videoEnabled)}
                    className={`btn-icon ${videoEnabled ? 'active' : 'off'}`}
                    title={videoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                  >
                    {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Audio Volume Visualizer Meter */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-blue-400" /> Mic Input Test
                  </span>
                  <span className="font-mono text-[11px]">{micEnabled ? `${audioLevel}%` : 'Muted'}</span>
                </div>
                <div className="w-full h-1.5 bg-[#2d2f31] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-75 rounded-full"
                    style={{ width: micEnabled ? `${audioLevel}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Scheduled Meetings Dashboard Section */}
        <div className="w-full space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Scheduled Team Meetings</h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-white/10 text-slate-300">
                {scheduledMeetings.length}
              </span>
            </div>

            <button
              onClick={onOpenScheduleModal}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New</span>
            </button>
          </div>

          {scheduledMeetings.length === 0 ? (
            <div className="w-full p-8 text-center bg-[#202124] rounded-2xl border border-white/5 space-y-2">
              <Clock className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-slate-400 text-sm font-medium">No scheduled meetings found.</p>
              <button
                onClick={onOpenScheduleModal}
                className="text-xs font-semibold text-blue-400 hover:underline"
              >
                Schedule one now for your team
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduledMeetings.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#202124] hover:bg-[#28292c] border border-white/10 hover:border-blue-500/30 rounded-2xl p-5 space-y-4 transition-all shadow-md group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-base text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <button
                        onClick={() => onDeleteScheduled(item.id)}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-white/10 transition-colors"
                        title="Delete scheduled meeting"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1 text-blue-400">
                        <Calendar className="w-3.5 h-3.5" /> {item.date}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Clock className="w-3.5 h-3.5" /> {item.time}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => handleCopyCode(item.code, item.id)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                      title="Copy meeting code"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">Code Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="font-mono text-slate-300">{item.code}</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleJoinScheduled(item)}
                      className="btn btn-primary px-4 py-1.5 text-xs font-semibold flex items-center gap-1 shadow-sm"
                    >
                      <span>Join Room</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
