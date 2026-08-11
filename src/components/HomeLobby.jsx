import React, { useState } from 'react';
import { Video, Calendar, Keyboard, ArrowRight, ShieldCheck, Trash2, Copy, Check, UserCheck, AlertCircle } from 'lucide-react';
import { generateMeetingCode, isValidMeetingCode, registerActiveRoom } from '../utils/storage';

export default function HomeLobby({ 
  userProfile, 
  onSaveProfile, 
  onStartMeeting, 
  scheduledMeetings, 
  onDeleteScheduled,
  onOpenScheduleModal 
}) {
  const [meetingCodeInput, setMeetingCodeInput] = useState('');
  const [userName, setUserName] = useState(userProfile?.name || '');
  
  // Validation States
  const [nameError, setNameError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const validateName = () => {
    if (!userName.trim()) {
      setNameError('Name is required');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleInstantMeeting = () => {
    if (!validateName()) return;

    const code = generateMeetingCode();
    // Register active room in storage so room code is valid
    registerActiveRoom(code, `${userName.trim()}'s Meeting`, userName.trim());

    onSaveProfile({ ...userProfile, name: userName.trim() });
    onStartMeeting({
      code,
      title: `Meeting (${code})`,
      isAdmin: true, // Creator is Host
      isOwner: true,
      userName: userName.trim(),
      micInitial: true,
      videoInitial: true
    });
  };

  const handleJoinByCode = (e) => {
    e.preventDefault();
    setCodeError('');

    if (!validateName()) return;

    const cleanCode = meetingCodeInput.trim().toLowerCase();
    if (!cleanCode) {
      setCodeError('Please enter a meeting code');
      return;
    }

    // Check if meeting code exists in active or scheduled meetings
    if (!isValidMeetingCode(cleanCode)) {
      setCodeError('Invalid meeting code. Meeting does not exist.');
      return;
    }

    onSaveProfile({ ...userProfile, name: userName.trim() });
    onStartMeeting({
      code: cleanCode,
      title: `Meeting (${cleanCode})`,
      isAdmin: false, // Participant requesting to join
      isOwner: false,
      userName: userName.trim(),
      micInitial: true,
      videoInitial: true
    });
  };

  const handleJoinScheduled = (meeting) => {
    if (!validateName()) return;

    onSaveProfile({ ...userProfile, name: userName.trim() });
    onStartMeeting({
      code: meeting.code,
      title: meeting.title,
      isAdmin: true, // Host of scheduled meeting
      isOwner: true,
      userName: userName.trim(),
      passcode: meeting.passcode,
      micInitial: true,
      videoInitial: true
    });
  };

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 w-full bg-[#121316] text-slate-200 overflow-y-auto px-4 py-8 md:p-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl space-y-8 animate-fade-in">

        {/* Clean Hero Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold tracking-wide">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Private & Secure Team Video Platform</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            designed for <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">thepreproute</span>
          </h1>
        </div>

        {/* Form Container */}
        <div className="bg-[#202124] p-6 md:p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6">
          
          {/* Display Name Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-400" /> Your Name *
              </span>
              {nameError && (
                <span className="text-red-400 text-xs font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {nameError}
                </span>
              )}
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => { setUserName(e.target.value); setNameError(''); }}
              placeholder="Enter your name"
              className={`input-field font-medium text-base text-white transition-all ${
                nameError ? 'border-red-500 ring-2 ring-red-500/30 bg-red-500/5' : ''
              }`}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={handleInstantMeeting}
              className="btn btn-primary flex-1 py-3.5 text-base font-semibold shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-95"
            >
              <Video className="w-5 h-5" />
              <span>New Instant Meeting</span>
            </button>

            <button
              onClick={onOpenScheduleModal}
              className="btn btn-secondary flex-1 py-3.5 text-base font-semibold flex items-center justify-center gap-2.5 hover:border-blue-500/50"
            >
              <Calendar className="w-5 h-5 text-blue-400" />
              <span>Schedule Meeting</span>
            </button>
          </div>

          {/* Join Code Input Form */}
          <form onSubmit={handleJoinByCode} className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Keyboard className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Enter a meeting code (e.g. abc-defg-hij)"
                  value={meetingCodeInput}
                  onChange={(e) => { setMeetingCodeInput(e.target.value); setCodeError(''); }}
                  className={`input-field pl-11 py-3 text-sm font-mono tracking-wide ${
                    codeError ? 'border-red-500 ring-2 ring-red-500/30 bg-red-500/5' : ''
                  }`}
                />
              </div>
              <button
                type="submit"
                className="btn btn-secondary px-6 py-3 text-sm font-semibold flex items-center gap-1.5"
              >
                <span>Join</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {codeError && (
              <p className="text-red-400 text-xs font-medium flex items-center gap-1 pt-1">
                <AlertCircle className="w-3.5 h-3.5" /> {codeError}
              </p>
            )}
          </form>

        </div>

        {/* Scheduled Meetings Section */}
        {scheduledMeetings.length > 0 && (
          <div className="w-full space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white">Scheduled Team Meetings</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scheduledMeetings.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#202124] hover:bg-[#28292c] border border-white/10 hover:border-blue-500/30 rounded-2xl p-5 space-y-3 transition-all shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm text-white line-clamp-1">
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
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="text-blue-400">{item.date}</span>
                      <span>•</span>
                      <span className="text-emerald-400">{item.time}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => handleCopyCode(item.code, item.id)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedId === item.id ? (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Copied
                        </span>
                      ) : (
                        <span className="font-mono text-slate-300">{item.code}</span>
                      )}
                    </button>

                    <button
                      onClick={() => handleJoinScheduled(item)}
                      className="btn btn-primary px-3.5 py-1 text-xs font-semibold flex items-center gap-1"
                    >
                      <span>Join Room</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
