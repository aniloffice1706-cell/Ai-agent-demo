'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Msg = { role: 'user' | 'assistant'; text: string; time: string };
type Match = { name: string; area: string; price: string; tag: string };

const initialMatches: Match[] = [
  { name: 'Eldeco Saubhagyam', area: 'Gomti Nagar Extension', price: '₹ 1.2 Cr', tag: 'Best Value' },
  { name: 'Omaxe Royal Residency', area: 'Vrindavan Yojna',     price: '₹ 1.5 Cr', tag: 'Park Facing' },
  { name: 'Shalimar One World',   area: 'Sushant Golf City',    price: '₹ 1.8 Cr', tag: 'Premium' },
];

const now = () => {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      text:
        "Here are three options matching your brief:\n\n" +
        '1. Eldeco Saubhagyam — ₹1.2 Cr · Gomti Nagar Extension\n' +
        '2. Omaxe Royal Residency — ₹1.5 Cr · Vrindavan Yojna\n' +
        '3. Shalimar One World — ₹1.8 Cr · Sushant Golf City\n\n' +
        'Are you looking for end-use or investment?',
      time: '',
    },
  ]);
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [header, setHeader] = useState<string>('3 BHK · Lucknow · ₹1–2 Cr');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setMessages((m) => (m[0] && !m[0].time ? [{ ...m[0], time: now() }, ...m.slice(1)] : m));
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    const turns = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, { role: 'user', text, time: now() }]);
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, turns }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: data.reply ?? 'Sorry, I had trouble responding.', time: now() },
      ]);
      if (Array.isArray(data.matches) && data.matches.length > 0) setMatches(data.matches);
      if (typeof data.header === 'string' && data.header) setHeader(data.header);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: 'Network error. Please try again.', time: now() },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b1220] text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs tracking-[0.2em] font-semibold text-sky-400 mb-2">BROKER MODE</div>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">Plexus AI for brokers</h1>
            <p className="mt-2 text-slate-400 max-w-3xl text-sm sm:text-base">
              Buyer gives a requirement → Plexus AI searches the portfolio, asks one clarifying question,
              compares options, and delivers a qualified lead.
            </p>
          </div>
          <Link
            href="/voice"
            className="text-sky-400 hover:text-sky-300 text-sm border border-sky-500/40 rounded-lg px-3 py-1.5 shrink-0"
          >
            🎤 Voice mode →
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 rounded-2xl border border-slate-800/80 bg-[#0e1729]/60 p-4 sm:p-5 shadow-2xl">
          {/* Chat panel */}
          <section className="rounded-xl bg-[#0a1322] border border-slate-800/70 flex flex-col overflow-hidden">
            <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/70 bg-[#0a1322]">
              <button className="text-slate-400 hover:text-slate-200" aria-label="Back">←</button>
              <div className="h-9 w-9 rounded-full bg-emerald-500/90 text-slate-900 font-bold flex items-center justify-center">
                P
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-100">Plexus AI Agent</div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" /> online
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-200 p-1" aria-label="Menu">⋮</button>
            </header>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[radial-gradient(ellipse_at_top,_#0b162a_0%,_#070d1a_70%)] min-h-[420px] max-h-[520px]"
            >
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={
                      'max-w-[78%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-line shadow ' +
                      (m.role === 'user'
                        ? 'bg-emerald-600/90 text-white rounded-br-sm'
                        : 'bg-slate-800/80 text-slate-100 rounded-bl-sm border border-slate-700/50')
                    }
                  >
                    {m.text}
                    <div
                      className={
                        'mt-1 text-[10px] flex items-center gap-1 ' +
                        (m.role === 'user' ? 'text-emerald-100/80 justify-end' : 'text-slate-400')
                      }
                    >
                      <span>{m.time}</span>
                      {m.role === 'user' && <span>✓✓</span>}
                    </div>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-bl-sm px-4 py-2.5">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" />
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:240ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-3 pb-2 pt-1.5 text-[11px] text-amber-400/90 flex items-center gap-1.5">
              <span>⚡</span>
              <span>Searched across verified project portfolio</span>
            </div>

            <footer className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-800/70 bg-[#0a1322]">
              <button className="text-slate-400 hover:text-slate-200 text-lg" aria-label="Emoji">😊</button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Type a message"
                className="flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500 px-2 py-1.5"
              />
              <button
                onClick={send}
                disabled={sending || !input.trim()}
                className="h-9 w-9 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-white flex items-center justify-center"
                aria-label="Send"
              >
                ➤
              </button>
            </footer>
          </section>

          {/* Matches panel */}
          <aside className="rounded-xl border border-sky-500/40 bg-[#0a1322] p-4 flex flex-col">
            <div className="text-[11px] tracking-[0.2em] font-semibold text-sky-400 mb-1">
              BROKER PORTFOLIO MATCH
            </div>
            <div className="text-lg font-semibold text-slate-100">{header}</div>
            <div className="text-xs text-slate-400 mt-0.5 mb-4">
              {matches.length} projects found across portfolio
            </div>

            <div className="space-y-3 flex-1">
              {matches.map((m) => (
                <div
                  key={m.name}
                  className="rounded-lg bg-[#0e1a30] border border-slate-800/80 px-3.5 py-3 hover:border-sky-500/40 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-100 truncate">{m.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{m.area}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-sky-300">{m.price}</div>
                      <div className="mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                        {m.tag}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1.5 text-[11px] text-amber-400/90">
              <div className="flex items-center gap-1.5"><span>⚡</span><span>Searched across verified project inventory</span></div>
              <div className="flex items-center gap-1.5"><span>⚡</span><span>Ranked by buyer fit</span></div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
