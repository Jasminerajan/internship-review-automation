import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  User as UserIcon,
  Sparkles,
  Calendar,
  Layers,
  Award,
  Video,
  ArrowRight,
  RefreshCw,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { User, ChatMessage } from '../types/index.js';
import { api } from '../api.js';

interface ChatViewProps {
  currentUser: User;
  onNavigateTab: (tab: string, targetId?: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ currentUser, onNavigateTab }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize conversation with warm, supportive mentor welcome
  useEffect(() => {
    const firstName = currentUser.name ? currentUser.name.split(' ')[0] : 'there';
    const initialWelcome: ChatMessage = {
      id: `welcome-${currentUser.id}`,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      text: `Hey ${firstName}! 👋 Great to see you. I'm **InternMate**, your AI internship mentor.

Whether you want to check what task to tackle next, get advice on acceptance criteria, walk through submission feedback, or see when we're meeting next, I'm right here with you.

How's your day going, and what can I help you with?`,
      quickReplies: [
        'What is my task today?',
        'When is my next meeting?',
        'How did my last submission go?',
        "I'm feeling a bit stuck on my task",
      ],
    };

    setMessages([initialWelcome]);
  }, [currentUser.id, currentUser.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toISOString(),
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const botReply = await api.sendChatMessage(currentUser.id, text, historyPayload);
      setMessages((prev) => [...prev, botReply]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        text: `⚠️ **Error communicating with AI service:** ${err.message || 'Please check your connection and retry.'}`,
        quickReplies: ['What is my task today?', 'When is my next meeting?'],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    const firstName = currentUser.name ? currentUser.name.split(' ')[0] : 'there';
    setMessages([
      {
        id: `welcome-${currentUser.id}-${Date.now()}`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        text: `Hey ${firstName}! 👋 Great to see you. I'm **InternMate**, your AI internship mentor.

Whether you want to check what task to tackle next, get advice on acceptance criteria, walk through submission feedback, or see when we're meeting next, I'm right here with you.

How's your day going, and what can I help you with?`,
        quickReplies: [
          'What is my task today?',
          'When is my next meeting?',
          'How did my last submission go?',
          "I'm feeling a bit stuck on my task",
        ],
      },
    ]);
    setInputText('');
    setIsLoading(false);
  };

  const handleCardClick = (card: NonNullable<ChatMessage['contextCards']>[number]) => {
    if (card.type === 'meeting') {
      onNavigateTab('meetings', card.linkId);
    } else if (card.type === 'task') {
      onNavigateTab('tasks', card.linkId);
    } else if (card.type === 'evaluation') {
      onNavigateTab('submissions', card.linkId);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl backdrop-blur-sm overflow-hidden">
      {/* Chat header bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
              <Bot className="h-5 w-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">InternMate AI Mentor</h2>
              <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 text-[10px] font-medium text-emerald-400">
                Mentor Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Grounded on records for <span className="text-blue-300 font-medium">{currentUser.name}</span> ({currentUser.id})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-slate-300">
            <ShieldAlert className="h-3.5 w-3.5 text-blue-400" />
            Isolated Sandbox RBAC
          </span>
          <button
            onClick={handleResetChat}
            className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:border-slate-600 hover:text-white transition-colors"
            title="Reset Chat Session"
          >
            <RefreshCw className="h-3 w-3" />
            <span className="hidden sm:inline">Reset Chat</span>
          </button>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className="flex-shrink-0 mt-1">
              {msg.sender === 'user' ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-8 w-8 rounded-full border border-blue-500/50 object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-400">
                  <Sparkles className="h-4 w-4" />
                </div>
              )}
            </div>

            {/* Bubble */}
            <div className="flex flex-col space-y-2 max-w-[85%]">
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 shadow-md'
                }`}
              >
                {/* Text rendered with basic formatting */}
                <div className="whitespace-pre-wrap space-y-2">
                  {msg.text.split('\n\n').map((paragraph, i) => (
                    <p key={i}>
                      {paragraph.split('**').map((chunk, j) =>
                        j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{chunk}</strong> : chunk
                      )}
                    </p>
                  ))}
                </div>

                {/* Context Cards if any */}
                {msg.contextCards && msg.contextCards.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-slate-700/80 pt-3">
                    {msg.contextCards.map((card, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleCardClick(card)}
                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900/80 p-3 hover:border-blue-500 hover:bg-slate-900 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                              card.type === 'meeting'
                                ? 'bg-indigo-500/20 text-indigo-400'
                                : card.type === 'task'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {card.type === 'meeting' ? (
                              <Calendar className="h-4 w-4" />
                            ) : card.type === 'task' ? (
                              <Layers className="h-4 w-4" />
                            ) : (
                              <Award className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-white truncate">{card.title}</span>
                              {card.badgeText && (
                                <span className="rounded bg-blue-500/20 border border-blue-500/40 px-1.5 py-0.2 text-[9px] font-bold text-blue-300">
                                  {card.badgeText}
                                </span>
                              )}
                            </div>
                            {card.subtitle && (
                              <p className="text-[11px] text-slate-400 truncate">{card.subtitle}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-blue-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                          <span>{card.type === 'meeting' ? 'Join' : 'View'}</span>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Timestamp & Quick Replies */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Quick Reply Chips */}
              {msg.quickReplies && msg.quickReplies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {msg.quickReplies.map((qr, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(qr)}
                      className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs text-slate-300 hover:border-blue-500 hover:bg-blue-600/10 hover:text-blue-300 transition-colors"
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 max-w-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-400 animate-pulse">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl border border-slate-700/80 bg-slate-800/80 px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-ping" />
              <span>InternMate is querying your authorized database records...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-slate-800 bg-slate-900/90 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask InternMate (e.g. "What is my task today?", "Show pending tasks", "When is my next meeting?")...`}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Strict Privacy: Grounded exclusively on <span className="text-slate-400">{currentUser.id}</span> data. No cross-intern access.
          </span>
          <span className="text-blue-400/80">Gemini 3.8 Flash Engine</span>
        </div>
      </div>
    </div>
  );
};
