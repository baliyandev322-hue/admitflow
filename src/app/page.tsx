'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Zap, 
  Bot, Database, Users, Calendar, TrendingUp, ChevronRight,
  Globe, MessageSquare, Building2, BarChart3, HelpCircle, Star, Phone
} from 'lucide-react';

export default function HomePage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [demoQuery, setDemoQuery] = useState('Bhaiya, JEE Target batch ki fees kitni hai aur demo class kab milegi?');
  const [demoAnswer, setDemoAnswer] = useState<string | null>(
    'Namaste! Apex Academy mein Target JEE (Main + Advanced) 2027 ki base fee ₹1,45,000 hai, jise aap 3 installments mein pay kar sakte hain. One-time payment par flat 5% early bird concession hai. Aapko 3-day free classroom demo pass mil sakta hai. Kya main aapke liye counseling slot book karun?'
  );
  const [monthlyLeads, setMonthlyLeads] = useState(250);
  const [avgFee, setAvgFee] = useState(45000);

  // ROI Calculator
  const currentDropoffLeads = Math.round(monthlyLeads * 0.65);
  const recoveredAdmissions = Math.max(1, Math.round(currentDropoffLeads * 0.08));
  const addedMonthlyRevenue = recoveredAdmissions * avgFee;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#090d16]/80 border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white">AdmitFlow<span className="text-indigo-400">.ai</span></span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">Vertical AI Agent</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#comparison" className="hover:text-white transition-colors">Comparison</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#roi-calculator" className="hover:text-white transition-colors">ROI Calculator</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link 
              href="/login" 
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
            >
              Start Free Trial
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen(prev => !prev)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white md:hidden"
              title="Toggle Navigation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileNavOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-800/80 flex flex-col space-y-2 text-sm text-slate-300">
            <a href="#features" onClick={() => setMobileNavOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-white">Features</a>
            <a href="#how-it-works" onClick={() => setMobileNavOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-white">How It Works</a>
            <a href="#comparison" onClick={() => setMobileNavOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-white">Comparison</a>
            <a href="#pricing" onClick={() => setMobileNavOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-white">Pricing</a>
            <a href="#roi-calculator" onClick={() => setMobileNavOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-white">ROI Calculator</a>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-20 pb-24 px-6 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-violet-600/20 to-pink-600/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Built Specifically for Indian Coaching Institutes & Training Centers</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15] mb-6">
            Convert Every Student Enquiry into a Confirmed Admission With <span className="gradient-text">Autonomous AI</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed mb-10">
            Stop losing students to competitors after 7 PM. AdmitFlow AI answers fee & syllabus queries in natural Hinglish, schedules counseling sessions, tracks lead drop-offs, and automates counselor follow-ups with zero hallucination.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-base shadow-xl shadow-indigo-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <span>Deploy AI for Your Institute</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-base transition-all flex items-center justify-center gap-2"
            >
              <span>Explore Live Institute Portal</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

          {/* Key Proof Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-2xl font-bold text-indigo-400">3.2 mins</div>
              <div className="text-xs text-slate-400 mt-1">Average Response Time (vs 4 hours manual)</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-2xl font-bold text-emerald-400">100% Grounded</div>
              <div className="text-xs text-slate-400 mt-1">Zero Hallucination on Fee Structures</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-2xl font-bold text-violet-400">+34% Uplift</div>
              <div className="text-xs text-slate-400 mt-1">Counseling Bookings from Night Enquiries</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-2xl font-bold text-amber-400">Hinglish / Hindi</div>
              <div className="text-xs text-slate-400 mt-1">Native Multilingual Conversational Agent</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE PRODUCT DEMO SANDBOX */}
      <section className="py-16 px-6 bg-slate-900/40 border-y border-slate-800/80 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">Live Agent Simulation</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">See How AdmitFlow AI Handles A Real Student</h2>
            <p className="text-sm text-slate-400 mt-2">Test Hinglish queries on our pre-indexed IIT-JEE / NEET prospectus</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Window bar */}
            <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-medium text-slate-400 ml-2">Apex Academy Live Admission Assistant</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                RAG Grounded Active
              </span>
            </div>

            <div className="p-6 space-y-4">
              {/* Student Bubble */}
              <div className="flex items-start gap-3 justify-end">
                <div className="bg-indigo-600/90 text-white p-3.5 rounded-2xl rounded-tr-none max-w-lg text-sm shadow-md">
                  {demoQuery}
                </div>
                <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  ST
                </div>
              </div>

              {/* AI Agent Bubble */}
              {demoAnswer && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-900 border border-slate-800 text-slate-200 p-4 rounded-2xl rounded-tl-none max-w-xl text-sm space-y-2">
                    <p className="leading-relaxed">{demoAnswer}</p>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Source: Apex Official Prospectus (Chunk #2)
                      </span>
                      <span className="text-indigo-400 font-semibold cursor-pointer hover:underline">
                        Slot Available Today @ 3 PM
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="bg-slate-900/60 p-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Try asking:</span>
              <button 
                onClick={() => {
                  setDemoQuery('Kota campus mein hostel aur mess fees kitni hai?');
                  setDemoAnswer('Apex Academy Kota campus mein hostel & mess facility available hai at ₹12,000/month. Isme air-cooled single/twin rooms, vegetarian nutritious food, aur 24/7 security included hai.');
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Hostel & Mess Fees?
              </button>
              <button 
                onClick={() => {
                  setDemoQuery('Agar admission cancel karein toh refund policy kya hai?');
                  setDemoAnswer('Apex Academy refund policy ke mutabik: Batch start hone ke 15 din ke andar withdrawal par 100% refund milta hai (minus ₹2,000 processing fee). 16 se 30 din ke beech 50% refund milta hai. 30 din ke baad koi refund nahi hota.');
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Refund Policy?
              </button>
              <button 
                onClick={() => {
                  setDemoQuery('NEET dropper batch kab shuru ho raha hai aur kitni seats hain?');
                  setDemoAnswer('NEET Achiever Super 40 Batch 18 November se Kota campus mein start ho raha hai. Is batch mein sirf 40 seats hain, jisme se 38 fill ho chuki hain aur keval 2 seats remaining hain. Kripya registration turant complete karein.');
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Batch Seats Left?
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES SECTION */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">Unmatched Vertical Differentiation</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">Engineered Specifically For Education Conversions</h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto mt-3">
            Generic chatbots and WhatsApp mass-message tools lose students. AdmitFlow AI brings dedicated admission workflows.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-7 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Lead Drop-Off Intelligence</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Pinpoint the exact funnel bottleneck where prospective students stall—whether it is post-fee revelation or delayed counselor callbacks. Get automatic re-engagement alerts.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-7 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-violet-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Next Best Action Engine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              The AI prescribes the highest-converting next step for each student lead based on interaction history (e.g., "Send scholarship test pass", "Offer Saturday counseling slot").
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-7 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Institute Knowledge Brain (RAG)</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Upload your PDF prospectus, fee schedule, and scholarship brochures. Our tenant-isolated vector engine grounds every response with 100% data privacy.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-7 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-pink-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Native Hinglish & Hindi AI</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Students talk naturally in colloquial Hinglish (*"Dropper batch ki timing kya hai?"*). AdmitFlow understands local nuance and replies fluently without robotic formality.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-7 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Multi-Branch Intelligence</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Run multiple centers across Kota, Jaipur, Delhi, or Bengaluru? Compare branch-level enquiries, counselor conversion speeds, and admissions from a single unified cockpit.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-7 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Automated Counseling Calendar</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Prevents counselor double bookings, generates instant Google Meet links or campus appointment slots, and sends automated WhatsApp reminders.
            </p>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-6 bg-slate-900/30 border-y border-slate-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">Fast Onboarding</span>
            <h2 className="text-3xl font-extrabold text-white mt-1">Live in Under 10 Minutes</h2>
            <p className="text-slate-400 text-sm mt-2">No complicated coding or month-long IT projects required</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 relative">
              <div className="text-4xl font-extrabold text-slate-800 mb-3">01</div>
              <h4 className="font-bold text-white mb-1">Create Profile</h4>
              <p className="text-xs text-slate-400">Register your institute, configure branch locations, and set AI communication personality.</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 relative">
              <div className="text-4xl font-extrabold text-slate-800 mb-3">02</div>
              <h4 className="font-bold text-white mb-1">Upload Prospectus</h4>
              <p className="text-xs text-slate-400">Upload your PDF brochures or fee guidelines. Our vector RAG indexes them instantly.</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 relative">
              <div className="text-4xl font-extrabold text-slate-800 mb-3">03</div>
              <h4 className="font-bold text-white mb-1">Embed Widget</h4>
              <p className="text-xs text-slate-400">Copy-paste a 1-line script to your website or connect your WhatsApp Business account.</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 relative">
              <div className="text-4xl font-extrabold text-slate-800 mb-3">04</div>
              <h4 className="font-bold text-white mb-1">Convert Leads</h4>
              <p className="text-xs text-slate-400">AI manages 24/7 enquiries, books counseling, and your counselors close admissions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. COMPETITOR COMPARISON MATRIX */}
      <section id="comparison" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">Honest Market Analysis</span>
          <h2 className="text-3xl font-extrabold text-white mt-1">Why Traditional Tools Fall Short for Institutes</h2>
          <p className="text-slate-400 text-sm mt-2">See how AdmitFlow AI compares with generic horizontal software</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80">
                <th className="p-4 font-semibold text-slate-300">Feature / Capability</th>
                <th className="p-4 font-bold text-indigo-400 bg-indigo-950/20">AdmitFlow AI</th>
                <th className="p-4 font-semibold text-slate-400">WATI / AiSensy</th>
                <th className="p-4 font-semibold text-slate-400">Interakt</th>
                <th className="p-4 font-semibold text-slate-400">Traditional CRMs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="p-4 font-medium">Education-Specific RAG Knowledge Brain</td>
                <td className="p-4 font-semibold text-emerald-400 bg-indigo-950/10">Yes (Auto-PDF indexing)</td>
                <td className="p-4 text-slate-500">No (Basic button trees)</td>
                <td className="p-4 text-slate-500">No (E-commerce focused)</td>
                <td className="p-4 text-slate-500">No</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Zero-Hallucination Fee Engine</td>
                <td className="p-4 font-semibold text-emerald-400 bg-indigo-950/10">Yes (Strict DB validation)</td>
                <td className="p-4 text-slate-500">Manual text updates</td>
                <td className="p-4 text-slate-500">Product catalog only</td>
                <td className="p-4 text-slate-500">Manual quote entry</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Next Best Action Recommendation</td>
                <td className="p-4 font-semibold text-emerald-400 bg-indigo-950/10">Yes (Autonomous engine)</td>
                <td className="p-4 text-slate-500">No</td>
                <td className="p-4 text-slate-500">No</td>
                <td className="p-4 text-slate-500">Rule-based tasks only</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Counselor Calendar & Slot Booking</td>
                <td className="p-4 font-semibold text-emerald-400 bg-indigo-950/10">Built-in (Zero double bookings)</td>
                <td className="p-4 text-slate-500">Requires Calendly webhook</td>
                <td className="p-4 text-slate-500">No</td>
                <td className="p-4 text-slate-500">Add-on module ($$$)</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Multi-Branch Analytics</td>
                <td className="p-4 font-semibold text-emerald-400 bg-indigo-950/10">Included in Growth/Pro</td>
                <td className="p-4 text-slate-500">Extra fee per agent</td>
                <td className="p-4 text-slate-500">Single store</td>
                <td className="p-4 text-slate-500">Complex enterprise setup</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Affordability for Coaching Centers</td>
                <td className="p-4 font-semibold text-emerald-400 bg-indigo-950/10">From ₹999/month</td>
                <td className="p-4 text-slate-300">~$49+/mo + Meta charges</td>
                <td className="p-4 text-slate-300">₹1,999+/mo + Meta charges</td>
                <td className="p-4 text-rose-400">₹50,000 to ₹3,00,000/yr</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. ROI CALCULATOR */}
      <section id="roi-calculator" className="py-20 px-6 bg-gradient-to-b from-slate-900/40 to-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl">
          <div className="text-center mb-10">
            <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">Revenue Impact</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Calculate Your Admission Recovery</h2>
            <p className="text-slate-400 text-sm mt-2">See how much lost revenue AdmitFlow AI recovers every month</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span className="text-slate-300">Monthly Student Enquiries:</span>
                  <span className="text-indigo-400">{monthlyLeads} leads/mo</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="1000" 
                  step="25"
                  value={monthlyLeads} 
                  onChange={(e) => setMonthlyLeads(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span className="text-slate-300">Average Course / Batch Fee:</span>
                  <span className="text-emerald-400">₹{avgFee.toLocaleString('en-IN')}</span>
                </div>
                <input 
                  type="range" 
                  min="15000" 
                  max="150000" 
                  step="5000"
                  value={avgFee} 
                  onChange={(e) => setAvgFee(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="text-xs text-slate-400 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                *Based on standard Indian coaching metrics where 65% of leads drop off without an instant 15-minute response or structured follow-up. Recovering just 8% of these yields immediate ROI.
              </div>
            </div>

            <div className="bg-slate-950 p-8 rounded-2xl border border-indigo-500/30 text-center space-y-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Monthly Uplift</div>
              <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                +₹{addedMonthlyRevenue.toLocaleString('en-IN')}
              </div>
              <div className="text-sm font-medium text-slate-300">
                Approx. <span className="text-emerald-400 font-bold">{recoveredAdmissions} additional admissions</span> / month
              </div>
              <div className="pt-4 border-t border-slate-800 text-xs text-slate-400">
                Pays for AdmitFlow AI Growth tier (₹1,999/mo) by <span className="text-white font-bold">{((addedMonthlyRevenue / 1999)).toFixed(0)}x</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PRICING SECTION */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">Simple & Transparent Pricing</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">Invest in Admissions, Not Complex Software</h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto mt-2">
            No hidden setup fees. 14-day free trial on all plans.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Starter */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg text-white">Starter</h3>
              <p className="text-xs text-slate-400 mt-1">Single center / Boutique academy</p>
              <div className="mt-5 mb-6">
                <span className="text-3xl font-extrabold text-white">₹999</span>
                <span className="text-xs text-slate-400"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> 1 Branch Center</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> 500 Active Leads/mo</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Basic AI Web Assistant</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Core CRM Lead Pipeline</li>
              </ul>
            </div>
            <Link href="/signup" className="mt-8 block text-center py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors">
              Start Free Trial
            </Link>
          </div>

          {/* Growth (Featured) */}
          <div className="p-6 rounded-2xl bg-slate-900 border-2 border-indigo-500 relative flex flex-col justify-between shadow-xl shadow-indigo-500/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-[10px] font-extrabold text-white uppercase tracking-wider">
              Most Popular
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Growth</h3>
              <p className="text-xs text-slate-400 mt-1">Fast-growing coaching hubs</p>
              <div className="mt-5 mb-6">
                <span className="text-3xl font-extrabold text-white">₹1,999</span>
                <span className="text-xs text-slate-400"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> Up to 3 Branch Centers</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> 2,500 Active Leads/mo</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> RAG Knowledge Brain (PDFs)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> Counseling Slot Booking</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> Follow-up Task Automation</li>
              </ul>
            </div>
            <Link href="/signup" className="mt-8 block text-center py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all">
              Claim 14-Day Free Pilot
            </Link>
          </div>

          {/* Pro */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg text-white">Pro</h3>
              <p className="text-xs text-slate-400 mt-1">Multi-city coaching networks</p>
              <div className="mt-5 mb-6">
                <span className="text-3xl font-extrabold text-white">₹3,999</span>
                <span className="text-xs text-slate-400"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Unlimited Branches</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> 10,000 Active Leads/mo</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Next Best Action Engine</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Drop-Off Bottleneck Analytics</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Multi-Branch Counselor Ranking</li>
              </ul>
            </div>
            <Link href="/signup" className="mt-8 block text-center py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors">
              Start Free Trial
            </Link>
          </div>

          {/* Enterprise */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg text-white">Enterprise</h3>
              <p className="text-xs text-slate-400 mt-1">National test-prep chains</p>
              <div className="mt-5 mb-6">
                <span className="text-3xl font-extrabold text-white">Custom</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Dedicated Cloud Cluster</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Custom WhatsApp BSP Integration</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> ERP & Biometric Sync</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> 24/7 SLA & Dedicated TAM</li>
              </ul>
            </div>
            <Link href="/signup" className="mt-8 block text-center py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors">
              Talk to Founders
            </Link>
          </div>
        </div>
      </section>

      {/* 9. TESTIMONIALS */}
      <section className="py-20 px-6 bg-slate-900/40 border-t border-slate-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">Founder Testimonials</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Trusted by Progressive Academy Directors</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-1 text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
              </div>
              <p className="text-sm text-slate-300 italic leading-relaxed mb-4">
                "Our counselors in Kota used to get overwhelmed by hundreds of WhatsApp messages during peak admission season. AdmitFlow AI answered all fee & batch queries instantly in Hinglish and pre-booked counseling slots. We converted 18 additional admissions in month one alone!"
              </p>
              <div>
                <div className="font-bold text-white text-sm">Rajesh Sharma</div>
                <div className="text-xs text-slate-400">Director, Apex Academy (Kota & Jaipur)</div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-1 text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
              </div>
              <p className="text-sm text-slate-300 italic leading-relaxed mb-4">
                "The Drop-Off Intelligence is gold. We realized 40% of tech bootcamp leads went cold because counselors weren't following up within 24 hours. The automated task queues and AI Next Best Action completely solved our lead leakage."
              </p>
              <div>
                <div className="font-bold text-white text-sm">Pooja Verma</div>
                <div className="text-xs text-slate-400">Founder & Academic Dean, CodeCraft AI Academy</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="mt-auto border-t border-slate-800 bg-[#060911] px-6 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white">AdmitFlow<span className="text-indigo-400">.ai</span></span>
            </div>
            <p className="text-slate-400 text-xs max-w-sm leading-relaxed mb-4">
              Autonomous AI Admission & Lead Conversion OS for coaching institutes, competitive exam centers, and skill academies across India.
            </p>
            <div className="text-slate-500 text-[11px]">
              DPDP Act (Digital Personal Data Protection) Compliant • Hosted in India
            </div>
          </div>

          <div>
            <div className="font-bold text-white mb-3 text-xs uppercase tracking-wider">Product</div>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Live Portal Demo</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-white mb-3 text-xs uppercase tracking-wider">Legal & Compliance</div>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><span className="text-slate-500">Security & RBAC</span></li>
              <li><span className="text-slate-500">Data Isolation</span></li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-white mb-3 text-xs uppercase tracking-wider">Support & Contact</div>
            <ul className="space-y-2">
              <li><span>Email: founders@admitflow.ai</span></li>
              <li><span>Phone: +91-744-2391000</span></li>
              <li><span>Offices: Kota & Bengaluru</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <div>© {new Date().getFullYear()} AdmitFlow AI Technologies Pvt Ltd. All rights reserved.</div>
          <div className="mt-2 sm:mt-0">Made with ❤️ for Indian Education Centers</div>
        </div>
      </footer>
    </div>
  );
}
