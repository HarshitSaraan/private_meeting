import React, { useState } from 'react';
import { X, Send, MessageSquare, Lock, Smile } from 'lucide-react';

export default function ChatDrawer({ isOpen, onClose, messages, onSendMessage, chatDisabled, isAdmin }) {
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const quickEmojis = ['👍', '👏', '❤️', '😂', '🎉', '🔥', '🙌', '💡'];

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || (chatDisabled && !isAdmin)) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleEmojiClick = (emoji) => {
    if (chatDisabled && !isAdmin) return;
    onSendMessage(emoji);
  };

  return (
    <div className="fixed right-4 top-20 bottom-24 w-80 md:w-96 bg-[#202124] border border-white/10 rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden text-slate-200 animate-fade-in">
      
      {/* Drawer Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#28292c]">
        <div className="flex items-center gap-2 font-semibold text-white">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <span>In-Meeting Messages</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Admin Chat Lock Notice Banner */}
      {chatDisabled && (
        <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>In-meeting chat has been disabled by room Admin.</span>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
            <MessageSquare className="w-10 h-10 stroke-1" />
            <p className="text-xs font-medium">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex flex-col space-y-1 ${msg.isSelf ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                <span className="font-semibold text-slate-200">{msg.sender}</span>
                <span>{msg.time}</span>
              </div>
              <div 
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.isSelf 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-[#2d2f31] text-slate-100 rounded-tl-none border border-white/5'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Emojis Strip */}
      {(!chatDisabled || isAdmin) && (
        <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between gap-1 overflow-x-auto">
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-base transition-transform hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-[#28292c] flex items-center gap-2">
        <input
          type="text"
          placeholder={chatDisabled && !isAdmin ? "Chat is disabled by admin" : "Send a message..."}
          disabled={chatDisabled && !isAdmin}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="input-field py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={(!inputText.trim()) || (chatDisabled && !isAdmin)}
          className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-all shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
