'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Turn = { role: 'user' | 'assistant'; text: string };
type Match = { name: string; area: string; price: string; tag: string };

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function VoiceAssistant() {
  const [supported, setSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [header, setHeader] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const turnsRef = useRef<Turn[]>([]);

  useEffect(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-IN';
    rec.onresult = (e: any) => {
      let final = '';
      let inter = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript;
        else inter += r[0].transcript;
      }
      if (inter) setInterim(inter);
      if (final) {
        setInterim('');
        setTranscript(final.trim());
        handleQuery(final.trim());
      }
    };
    rec.onerror = (e: any) => {
      const code = e?.error;
      let msg = code || 'Voice error';
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        msg =
          "Microphone is blocked. Click the 🔒 icon in your browser's address bar → Site settings → Microphone: Allow → reload this page.";
      } else if (code === 'no-speech') {
        msg = "Didn't catch anything — try again and speak after the beep.";
      } else if (code === 'audio-capture') {
        msg = "No microphone detected. Plug one in or check OS sound settings.";
      } else if (code === 'network') {
        msg = "Network error talking to the speech service. Check your internet.";
      }
      setError(msg);
      setIsListening(false);
    };
    rec.onend = () => setIsListening(false);
    recRef.current = rec;
    return () => {
      try { rec.stop(); } catch {}
      try { window.speechSynthesis.cancel(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { turnsRef.current = turns; }, [turns]);

  function speak(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-IN';
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  }

  async function handleQuery(text: string) {
    setError(null);
    setThinking(true);
    const priorTurns = turnsRef.current;
    setTurns((t) => [...t, { role: 'user', text }]);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, turns: priorTurns }),
      });
      const data = await res.json();
      const reply: string = data.reply ?? "Sorry, I didn't catch that.";
      setTurns((t) => [...t, { role: 'assistant', text: reply }]);
      if (Array.isArray(data.matches) && data.matches.length > 0) setMatches(data.matches);
      if (typeof data.header === 'string' && data.header) setHeader(data.header);
      speak(reply);
    } catch {
      setError('Network error');
    } finally {
      setThinking(false);
    }
  }

  async function toggleMic() {
    setError(null);
    if (!recRef.current) return;
    if (isListening) {
      recRef.current.stop();
      setIsListening(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (e: any) {
      const name = e?.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setError(
          "Microphone permission denied. Click the 🔒 icon in your browser's address bar → Site settings → Microphone: Allow → reload this page.",
        );
      } else if (name === 'NotFoundError') {
        setError('No microphone detected on this device.');
      } else {
        setError(e?.message ?? 'Could not access microphone');
      }
      return;
    }
    try {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setInterim('');
      setTranscript('');
      recRef.current.start();
      setIsListening(true);
    } catch (e: any) {
      setError(e?.message ?? 'Could not start microphone');
    }
  }

  return (
    <main className="min-h-screen bg-[#0b1220] text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs tracking-[0.2em] font-semibold text-sky-400 mb-2">VOICE MODE</div>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">Plexus AI · Voice</h1>
            <p className="mt-2 text-slate-400 max-w-3xl text-sm sm:text-base">
              Speak your buyer's brief — Plexus AI listens, searches the portfolio, and answers back.
            </p>
          </div>
          <Link
            href="/"
            className="text-sky-400 hover:text-sky-300 text-sm border border-sky-500/40 rounded-lg px-3 py-1.5"
          >
            ← Chat mode
          </Link>
        </div>

        {!supported && (
          <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 text-sm px-4 py-3">
            Speech recognition isn't supported in this browser. Try Chrome or Edge on desktop.
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 text-sm px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 rounded-2xl border border-slate-800/80 bg-[#0e1729]/60 p-4 sm:p-5 shadow-2xl">
          {/* Voice panel */}
          <section className="rounded-xl bg-[#0a1322] border border-slate-800/70 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800/70 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-500/90 text-slate-900 font-bold flex items-center justify-center">P</div>
              <div className="flex-1">
                <div className="font-semibold">Plexus AI Agent</div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                  {isListening ? 'listening…' : isSpeaking ? 'speaking…' : thinking ? 'thinking…' : 'online'}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-[420px] max-h-[520px] bg-[radial-gradient(ellipse_at_top,_#0b162a_0%,_#070d1a_70%)]">
              {turns.length === 0 && (
                <div className="text-slate-500 text-sm text-center mt-12">
                  Press the mic and say something like:<br />
                  <span className="text-slate-300">"3 BHK in Gomti Nagar under 2 crore"</span>
                </div>
              )}
              {turns.map((t, i) => (
                <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={
                      'max-w-[78%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-line shadow ' +
                      (t.role === 'user'
                        ? 'bg-emerald-600/90 text-white rounded-br-sm'
                        : 'bg-slate-800/80 text-slate-100 rounded-bl-sm border border-slate-700/50')
                    }
                  >
                    {t.text}
                  </div>
                </div>
              ))}
              {interim && (
                <div className="flex justify-end">
                  <div className="max-w-[78%] rounded-2xl px-3.5 py-2 text-sm bg-emerald-600/40 text-emerald-50 italic rounded-br-sm">
                    {interim}…
                  </div>
                </div>
              )}
              {thinking && (
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
              <span>⚡</span><span>Searched across verified project portfolio</span>
            </div>

            <footer className="flex items-center justify-center gap-4 px-4 py-4 border-t border-slate-800/70 bg-[#0a1322]">
              <button
                onClick={() => { try { window.speechSynthesis.cancel(); } catch {}; setIsSpeaking(false); }}
                disabled={!isSpeaking}
                className="text-xs text-slate-400 hover:text-slate-200 disabled:opacity-40"
              >
                Stop voice
              </button>
              <button
                onClick={toggleMic}
                disabled={!supported}
                className={
                  'relative h-16 w-16 rounded-full flex items-center justify-center text-2xl transition shadow-lg ' +
                  (isListening
                    ? 'bg-rose-500 hover:bg-rose-400 ring-4 ring-rose-500/30 animate-pulse'
                    : 'bg-emerald-500 hover:bg-emerald-400 ring-4 ring-emerald-500/20')
                }
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
              >
                🎤
              </button>
              <div className="text-xs text-slate-500 w-20">
                {isListening ? 'Tap to stop' : 'Tap to speak'}
              </div>
            </footer>
          </section>

          {/* Matches panel */}
          <aside className="rounded-xl border border-sky-500/40 bg-[#0a1322] p-4 flex flex-col">
            <div className="text-[11px] tracking-[0.2em] font-semibold text-sky-400 mb-1">
              BROKER PORTFOLIO MATCH
            </div>
            <div className="text-lg font-semibold text-slate-100">{header ?? 'Awaiting brief…'}</div>
            <div className="text-xs text-slate-400 mt-0.5 mb-4">
              {matches.length} project{matches.length === 1 ? '' : 's'} found
            </div>

            <div className="space-y-3 flex-1">
              {matches.length === 0 && (
                <div className="text-slate-500 text-sm">
                  Tell me BHK, budget and area to surface matches.
                </div>
              )}
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
