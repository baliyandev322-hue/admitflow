'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import { 
  Settings, Bot, MessageSquare, Copy, Check, 
  ExternalLink, Shield, Code, CheckCircle2 
} from 'lucide-react';

export default function SettingsPage() {
  const [session, setSession] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [aiTone, setAiTone] = useState('helpful_professional');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        setSession(data);
        if (data.institute) {
          setName(data.institute.name || '');
          setPhone(data.institute.phone || '');
          setEmail(data.institute.email || '');
          setAiTone(data.institute.aiTone || 'helpful_professional');
          setWelcomeMessage(data.institute.welcomeMessage || '');
        }
      })
      .catch(console.error);
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/institutes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          aiTone,
          welcomeMessage
        })
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const widgetScript = `<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://admitflow.ai'}/api/widget/embed.js?institute=${session?.institute?.slug || 'apex-academy'}" async></script>`;

  const copyWidgetCode = () => {
    navigator.clipboard.writeText(widgetScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100">
      <Sidebar user={session?.user} institute={session?.institute} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopNav 
          institute={session?.institute}
          branches={session?.branches || []}
          title="Institute Settings & Multi-Channel Integrations"
          subtitle="Configure AI tone, embed website chat widget & setup WhatsApp Business webhooks"
        />

        <main className="p-6 space-y-6 flex-1 max-w-7xl w-full">
          {/* Onboarding Checklist */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider text-indigo-400">
              Institute Setup Completion Checklist:
            </h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="text-slate-300">Institute Profile Created</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="text-slate-300">Courses & Batches Seeded</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="text-slate-300">Knowledge Prospectus Indexed</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-indigo-400">
                <Code className="w-4 h-4 shrink-0" />
                <span className="text-slate-300">Embed Widget on Website</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* 1. EMBEDDABLE WEB WIDGET */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Code className="w-4 h-4 text-indigo-400" /> Embed Chat Widget on Your Website
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Copy and paste this script before the closing <code>&lt;/body&gt;</code> tag on WordPress, Webflow, or custom code.
                </p>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-indigo-300 overflow-x-auto whitespace-pre-wrap">
                  {widgetScript}
                </pre>
                <button
                  onClick={copyWidgetCode}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Copy Snippet"
                >
                  {copiedScript ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="pt-2">
                <a
                  href="/widget"
                  target="_blank"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  <span>Test Standalone Widget Window</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* 2. WHATSAPP BUSINESS PLATFORM INTEGRATION */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" /> WhatsApp Cloud API Connection
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Connect Meta WhatsApp Business Platform webhook to receive student messages directly into AdmitFlow.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Webhook Ingestion Callback URL</label>
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : 'https://admitflow.ai'}/api/chat`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 font-mono text-[11px] focus:outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Connection Status:</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Ready to Bind
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. AI PERSONALITY & INSTITUTE PROFILE FORM */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-violet-400" /> AI Assistant Persona & Communication Preferences
              </h3>
              <p className="text-xs text-slate-400 mt-1">Customize how your AI agent addresses students and parents</p>
            </div>

            {savedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Settings updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Institute Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">AI Conversational Tone</label>
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  >
                    <option value="helpful_professional">Helpful & Professional (Recommended)</option>
                    <option value="energetic">Energetic & Motivating (Best for Tech)</option>
                    <option value="academic">Academic & Formal (Best for UPSC / Medical)</option>
                    <option value="friendly">Warm & Friendly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Opening Welcome Message</label>
                <textarea
                  rows={3}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
