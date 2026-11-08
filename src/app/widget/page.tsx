'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, CheckCircle2, Phone, Calendar, Video, X } from 'lucide-react';

export default function WidgetPage() {
  const [institute, setInstitute] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([
    {
      sender: 'bot',
      content: 'Namaste! Main Apex Academy Admission Assistant hoon. How can I help you today? Feel free to ask in English or Hinglish!',
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLeadPrompt, setShowLeadPrompt] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [phone, setPhone] = useState('');
  const [dpdpConsent, setDpdpConsent] = useState(true);
  const [leadSaved, setLeadSaved] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let query = '';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get('slug');
      if (slug) query = `?slug=${encodeURIComponent(slug)}`;
    }

    fetch(`/api/institutes${query}`)
      .then(r => r.json())
      .then(data => {
        if (data.institute) {
          setInstitute(data.institute);
          if (data.institute.welcomeMessage) {
            setMessages([
              {
                sender: 'bot',
                content: data.institute.welcomeMessage,
                sources: []
              }
            ]);
          }
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', content: userText }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instituteId: institute?.id,
          message: userText,
          studentName: studentName || undefined,
          phone: phone || undefined,
          language: 'hinglish'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            content: data.reply,
            sources: data.sources || []
          }
        ]);

        if (data.requiresPhonePrompt && !leadSaved) {
          setShowLeadPrompt(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !phone) return;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instituteId: institute?.id,
          message: 'Student shared contact details for counseling.',
          studentName,
          phone,
          whatsappConsent: dpdpConsent,
          language: 'hinglish'
        })
      });

      if (res.ok) {
        setLeadSaved(true);
        setShowLeadPrompt(false);
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            content: `Dhanyawad ${studentName}! Hamare senior admission counselor aapse ${phone} par jaldi connect karenge. Aap chahein toh offline campus counseling slot bhi book kar sakte hain.`
          }
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#090d16] text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Widget Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 p-4 flex items-center justify-between text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm leading-tight">{institute?.name || 'Apex Academy'}</h3>
              {institute?.slug === 'prerna-career-institute' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/30 border border-white/20 text-amber-200 font-semibold tracking-wide">
                  DEMO SANDBOX
                </span>
              )}
            </div>
            <div className="text-[11px] text-indigo-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online • AI Admission Assistant
            </div>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
        {messages.map((m, i) => {
          const isUser = m.sender === 'user';
          return (
            <div key={i} className={`flex items-start gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                isUser 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}>
                {m.content}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-indigo-400 pl-9">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
          </div>
        )}

        {/* Lead Capture Overlay Inside Chat */}
        {showLeadPrompt && !leadSaved && (
          <div className="p-3.5 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 text-xs space-y-2 mt-2">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-indigo-400" /> Share Details for Free Counseling Pass:
            </div>
            <form onSubmit={handleSaveContact} className="space-y-2">
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Student Name"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="WhatsApp Phone Number"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              />
              <label className="flex items-start gap-2 text-[10px] text-slate-400 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={dpdpConsent}
                  onChange={(e) => setDpdpConsent(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0 mt-0.5"
                />
                <span>I consent to receive admission updates & syllabus on WhatsApp (DPDP Act compliant). Reply STOP to opt out anytime.</span>
              </label>
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Submit & Reserve Free Counseling
              </button>
            </form>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask in Hindi, English or Hinglish..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2 rounded-xl bg-indigo-600 text-white disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {institute?.slug === 'prerna-career-institute' && (
        <div className="bg-slate-950 px-3 py-1 text-center text-[10px] text-amber-400/80 border-t border-slate-900">
          ⚠️ Synthetic Testing Sandbox: Demo data only. Not an active customer or commercial agreement.
        </div>
      )}
    </div>
  );
}
