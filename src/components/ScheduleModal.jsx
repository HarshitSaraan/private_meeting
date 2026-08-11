import React, { useState } from 'react';
import { X, Calendar, Clock, Lock, FileText, Check, Sparkles } from 'lucide-react';
import { generateMeetingCode, saveScheduledMeeting } from '../utils/storage';

export default function ScheduleModal({ isOpen, onClose, onMeetingScheduled }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultTime = '14:00';

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(defaultTime);
  const [passcode, setPasscode] = useState('team' + Math.floor(100 + Math.random() * 900));
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a meeting title');
      return;
    }

    const meetingCode = generateMeetingCode();
    const newMeeting = {
      id: 'sched_' + Date.now(),
      title: title.trim(),
      code: meetingCode,
      date,
      time,
      passcode: passcode.trim(),
      description: description.trim(),
      host: 'Team Admin (You)',
      created: Date.now()
    };

    const updatedList = saveScheduledMeeting(newMeeting);
    onMeetingScheduled(updatedList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#202124] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-[#28292c]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Schedule Team Meeting</h3>
              <p className="text-xs text-slate-400">Set up a timed meeting for your private team</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs font-medium text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="input-label">Meeting Name / Topic *</label>
            <input
              type="text"
              placeholder="e.g. Q3 Sprint Planning & Architecture Review"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(''); }}
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Date *</label>
              <div className="relative">
                <input
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field pr-8"
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">Start Time *</label>
              <div className="relative">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="input-field pr-8"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="input-label flex items-center justify-between">
              <span>Security Passcode</span>
              <span className="text-[10px] text-blue-400 font-normal">Team Only Access</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Set access pin"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="input-field font-mono"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="input-label">Agenda / Description (Optional)</label>
            <textarea
              rows={3}
              placeholder="Add agenda items, links, or context for team members..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary px-5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary px-6 shadow-lg shadow-blue-500/25 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Schedule Meeting</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
