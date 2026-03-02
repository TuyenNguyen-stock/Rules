import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isOpen: boolean;
  onClose: () => void;
  opponentName: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, isOpen, onClose, opponentName }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
      {/* Backdrop for mobile to close when clicking outside */}
      <div className="absolute inset-0 bg-black/20 pointer-events-auto sm:bg-transparent" onClick={onClose}></div>

      <div className="pointer-events-auto bg-slate-900 border border-slate-700 w-full sm:w-80 h-[60vh] sm:h-[500px] sm:rounded-xl shadow-2xl flex flex-col overflow-hidden sm:mr-4 sm:mb-20 sm:absolute sm:bottom-0 sm:right-0 animate-fade-in">
        {/* Header */}
        <div className="bg-slate-800 p-3 border-b border-slate-700 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-white flex items-center gap-2">
            💬 Chat với {opponentName}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            ✕
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/50">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 text-sm mt-4">Hãy nói xin chào! 👋</div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'ME' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-xl text-sm break-words ${
                  msg.sender === 'ME'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-700 text-slate-200 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-500 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-slate-900 border border-slate-600 rounded-full px-4 py-2 text-sm outline-none focus:border-blue-500 text-white"
            autoFocus
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-50 disabled:bg-slate-700 transition-colors"
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
};
