'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import { 
  Bot, Send, User, Sparkles, CheckCircle2, 
  AlertCircle, Phone, ArrowRight, ShieldCheck, RefreshCw 
} from 'lucide-react';

export default function ChatSandboxPage() {
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([
    {
      sender: 'bot',
      content: 'Namaste! Main Apex Academy ka AI Admission Assistant hoon. Aap hamare IIT-JEE, NEET, ya Foundation courses ke baare mein kuch bhi pooch sakte hain!',
      sources: []
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [language, setLanguage] = useState<'hinglish' | 'hindi' | 'english'>('hinglish');
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [capturedLeadNotification, setCapturedLeadNotification] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => setSession(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage;
    setInputMessage('');
    setMessages(prev => [...prev, { sender: 'user', content: userText }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instituteId: session?.institute?.id,
          message: userText,
          language,
          studentName: studentName || undefined,
          phone: studentPhone || undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            content: data.reply,
            isGrounded: data.isGrounded,
            sources: data.sources || [],
            suggestCounseling: data.suggestCounselingBooking
          }
        ]);

        if (data.capturedLead) {
          setCapturedLeadNotification(data.capturedLead);
        }
      } else {
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            content: 'An error occurred while processing your request. Please try again.',
            sources: []
          }
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        sender: 'bot',
        content: language === 'hinglish' 
          ? 'Namaste! Main Apex Academy ka AI Admission Assistant hoon. Aap hamare IIT-JEE, NEET, ya Foundation courses ke baare mein kuch bhi pooch sakte hain!'
          : 'Hello! I am your AI Admission Assistant. Feel free to ask about our courses, syllabus, and fees.',
        sources: []
      }
    ]);
    setCapturedLeadNotification(null);
  };

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100">
      <Sidebar user={session?.user} institute={session?.institute} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopNav 
          institute={session?.institute}
          branches={session?.branches || []}
          title="AI Enquiry Assistant Sandbox"
          subtitle="Simulate student conversations in Hinglish, Hindi & English with live RAG citation inspection"
        />

        <main className="p-6 space-y-6 flex-1 max-w-7xl w-full">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* 1. CHAT WINDOW */}
            <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col h-[700px] overflow-hidden shadow-2xl">
              {/* Chat Header */}
              <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">AdmitFlow Admission Bot</h3>
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active • RAG Vector Grounding Enabled
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 text-[11px]">
                    {(['hinglish', 'english', 'hindi'] as const).map(l => (
                      <button
                        key={l}
                        onClick={() => setLanguage(l)}
                        className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-colors ${
                          language === l ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleResetChat}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
                    title="Reset Chat"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {messages.map((m, idx) => {
                  const isUser = m.sender === 'user';
                  return (
                    <div key={idx} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {!isUser && (
                        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white shrink-0">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div className={`p-4 rounded-2xl max-w-lg text-xs space-y-2 leading-relaxed ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                      }`}>
                        <p className="whitespace-pre-wrap">{m.content}</p>

                        {!isUser && m.sources && m.sources.length > 0 && (
                          <div className="pt-2 border-t border-slate-800 text-[10px] space-y-1">
                            <div className="font-bold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Grounded Source:
                            </div>
                            <div className="text-slate-400 italic">
                              "{m.sources[0]?.text?.slice(0, 110)}..."
                            </div>
                          </div>
                        )}
                      </div>

                      {isUser && (
                        <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-white shrink-0 font-bold text-xs">
                          ST
                        </div>
                      )}
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex items-center gap-2 text-xs text-indigo-400 pl-11">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-slate-400 text-[11px] ml-1">AI Agent searching knowledge brain...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    language === 'hinglish' 
                      ? 'Type in Hinglish (e.g. JEE Target batch ki fees kitni hai?)...' 
                      : 'Ask about courses, syllabus, counseling slots...'
                  }
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={loading || !inputMessage.trim()}
                  className="p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* 2. SIMULATED STUDENT IDENTITY & LEAD CAPTURE CONTROLS */}
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-400" /> Simulated Student Identity
                  </h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    When student provides phone number, AI automatically creates and qualifies a CRM lead.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Student Name</label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Tanmay Bhatia"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      placeholder="+91-9811223344"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {capturedLeadNotification && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Lead Captured in CRM!
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Created lead for <strong>{capturedLeadNotification.studentName}</strong> with initial score of {capturedLeadNotification.leadScore} pts.
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Prompts to Test */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
                <span className="font-bold text-white uppercase text-[10px] tracking-wider text-slate-400">
                  Quick Hinglish Test Questions:
                </span>
                <div className="space-y-2">
                  <button
                    onClick={() => setInputMessage('NEET dropper batch ki total fees kitni hai aur installment options kya hain?')}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-slate-300 transition-colors"
                  >
                    "NEET dropper batch fees & installments?"
                  </button>
                  <button
                    onClick={() => setInputMessage('Kya mujhe 3 days ka free classroom demo mil sakta hai?')}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-slate-300 transition-colors"
                  >
                    "3-day classroom demo pass?"
                  </button>
                  <button
                    onClick={() => setInputMessage('Kota campus mein hostel aur mess facility ka kya charge hai?')}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-slate-300 transition-colors"
                  >
                    "Hostel & mess charges in Kota?"
                  </button>
                  <button
                    onClick={() => setInputMessage('Refund policy kya hai agar main 10 din baad admission cancel karun?')}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-slate-300 transition-colors"
                  >
                    "Refund policy for 10-day cancellation?"
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
