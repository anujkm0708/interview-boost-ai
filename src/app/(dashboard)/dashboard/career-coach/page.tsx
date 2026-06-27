'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Trash2,
  MessageSquare,
  Clock,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface StoredSession {
  messages: { id: string; role: 'user' | 'assistant'; content: string; timestamp: string }[];
  savedAt: string; // ISO string
}

const STORAGE_KEY = 'careerlift_coach_history';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in ms

const SUGGESTIONS = [
  'How can I improve my resume for tech roles?',
  'What should I prepare for a behavioral interview?',
  'How do I negotiate a better salary?',
  'What skills should I learn for career growth?',
  'How do I write a strong LinkedIn headline?',
  'Tips for transitioning to a new career field',
];

/* ── localStorage helpers ───────────────────────────────────────────────── */
function loadHistory(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const session: StoredSession = JSON.parse(raw);
    const age = Date.now() - new Date(session.savedAt).getTime();
    if (age > TTL_MS) {
      // Expired — purge
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    return session.messages.map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
  } catch {
    return [];
  }
}

function saveHistory(messages: Message[]) {
  try {
    const session: StoredSession = {
      messages: messages.map((m) => ({
        ...m,
        timestamp: m.timestamp.toISOString(),
      })),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

/* ── Component ──────────────────────────────────────────────────────────── */
export default function CareerCoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sessionAge, setSessionAge] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Load history from localStorage on mount ──────────────────────────────
  useEffect(() => {
    const stored = loadHistory();
    setMessages(stored);

    // Compute session age for the header badge
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const session: StoredSession = JSON.parse(raw);
        setSessionAge(timeAgo(new Date(session.savedAt)));
      }
    } catch {}

    // Also try to sync from Supabase (best-effort — non-blocking)
    fetch('/api/career-coach/chat')
      .then((r) => r.ok ? r.json() : [])
      .then((data: any[]) => {
        if (data && data.length > 0 && stored.length === 0) {
          // Only populate from server if localStorage was empty
          const mapped: Message[] = data.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.created_at),
          }));
          setMessages(mapped);
          saveHistory(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));

    if (stored.length > 0) {
      setLoadingHistory(false);
    }
  }, []);

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Persist to localStorage whenever messages change ─────────────────────
  useEffect(() => {
    if (!loadingHistory && messages.length > 0) {
      saveHistory(messages);
    }
  }, [messages, loadingHistory]);

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = useCallback(async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/career-coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error('Chat failed');
      const data = await res.json();

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, messages]);

  // ── Clear chat ───────────────────────────────────────────────────────────
  const handleClear = async () => {
    clearHistory();
    setMessages([]);
    setSessionAge(null);
    // Also try server-side clear (non-fatal)
    fetch('/api/career-coach/chat', { method: 'DELETE' }).catch(() => {});
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loadingHistory) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">AI Career Coach</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-muted-foreground">Personalized career advice & guidance</p>
              {messages.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <Clock className="h-2.5 w-2.5" />
                  Saved · expires in 24h
                </span>
              )}
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">How can I help you today?</h2>
            <p className="text-sm text-muted-foreground mb-2 max-w-md">
              I can help with resume feedback, interview preparation, career advice, salary negotiation, and more.
            </p>
            <p className="text-xs text-muted-foreground/60 mb-8 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Your conversation is saved for 24 hours and restored when you return.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-left text-sm text-foreground transition-all hover:border-primary/50 hover:bg-primary/5"
                >
                  <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Session restored notice */}
            {sessionAge && (
              <div className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 text-primary" />
                  Conversation restored from {sessionAge} · Auto-clears after 24h
                </span>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  msg.role === 'assistant'
                    ? 'bg-gradient-to-br from-primary to-accent'
                    : 'bg-muted'
                }`}>
                  {msg.role === 'assistant' ? (
                    <Bot className="h-4 w-4 text-white" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-1.5 ${
                    msg.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                  }`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}

        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="rounded-2xl bg-muted px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border pt-4">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your career..."
            rows={1}
            className="flex-1 rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent text-white transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Conversation auto-saved for 24h · AI Career Coach provides general guidance.
        </p>
      </div>
    </div>
  );
}
