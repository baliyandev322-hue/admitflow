'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import { 
  CreditCard, CheckCircle2, ShieldCheck, Zap, 
  Sparkles, ArrowRight, AlertCircle 
} from 'lucide-react';
import { SubscriptionTier } from '@/lib/types';

export default function BillingPage() {
  const [session, setSession] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);

  const fetchBilling = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const m = await meRes.json();
        setSession(m);
      }

      const res = await fetch('/api/billing');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const handleUpgrade = async (targetTier: SubscriptionTier) => {
    setLoading(true);
    setReceipt(null);
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetTier,
          testMode: true
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSubscription(data.subscription);
        setReceipt(data.paymentReceipt);
      } else {
        alert(data.error || 'Upgrade failed');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const leadsUsed = subscription?.leadsUsed || 0;
  const leadsQuota = subscription?.leadsQuota || 2500;
  const leadsPercent = Math.min(100, Math.round((leadsUsed / leadsQuota) * 100));

  const ragUsed = subscription?.ragQueriesUsed || 0;
  const ragQuota = subscription?.ragQueriesQuota || 1000;
  const ragPercent = Math.min(100, Math.round((ragUsed / ragQuota) * 100));

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100">
      <Sidebar user={session?.user} institute={session?.institute} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopNav 
          institute={session?.institute}
          branches={session?.branches || []}
          title="Billing & Subscription Plans"
          subtitle="Manage active SaaS tier, monitor usage meters & process Razorpay test upgrades"
        />

        <main className="p-6 space-y-6 flex-1 max-w-7xl w-full">
          {/* Active Tier Summary Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900/60 to-slate-900/60 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider">Current Active Plan</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {subscription?.status || 'ACTIVE'}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white">
                {subscription?.tier || 'GROWTH'} TIER
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Billing cycle renews on {new Date(subscription?.currentPeriodEnd || Date.now() + 30*24*60*60*1000).toLocaleDateString('en-IN', { dateStyle: 'long' })}
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-white">Razorpay Secure Billing</div>
                <div className="text-[11px] text-slate-400">Zero card details stored on server</div>
              </div>
            </div>
          </div>

          {receipt && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Plan updated! Simulated Transaction: <strong>{receipt.transactionId}</strong> ({receipt.gateway})</span>
              </div>
              <span className="text-[11px] text-slate-400">{new Date(receipt.timestamp).toLocaleTimeString()}</span>
            </div>
          )}

          {/* Usage Meters */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">Active Student Leads Quota</span>
                <span className="text-slate-400">{leadsUsed} / {leadsQuota} leads</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${leadsPercent}%` }} />
              </div>
              <div className="text-[11px] text-slate-400">{100 - leadsPercent}% monthly capacity remaining</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">RAG Vector Queries Quota</span>
                <span className="text-slate-400">{ragUsed} / {ragQuota} queries</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${ragPercent}%` }} />
              </div>
              <div className="text-[11px] text-slate-400">{100 - ragPercent}% monthly capacity remaining</div>
            </div>
          </div>

          {/* Pricing Upgrade Grid */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Upgrade or Change Plan Tier</h3>

            <div className="grid md:grid-cols-4 gap-5">
              {/* Starter */}
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">Starter</h4>
                  <div className="my-3">
                    <span className="text-2xl font-black text-white">₹999</span>
                    <span className="text-xs text-slate-400"> /mo</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 1 Branch Center</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 500 Leads Quota</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Basic AI Web Assistant</li>
                  </ul>
                </div>
                <button
                  disabled={loading || subscription?.tier === 'STARTER'}
                  onClick={() => handleUpgrade('STARTER')}
                  className="mt-6 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors disabled:opacity-40"
                >
                  {subscription?.tier === 'STARTER' ? 'Current Plan' : 'Downgrade to Starter'}
                </button>
              </div>

              {/* Growth */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/50 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">Growth</h4>
                  <div className="my-3">
                    <span className="text-2xl font-black text-white">₹1,999</span>
                    <span className="text-xs text-slate-400"> /mo</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Up to 3 Branches</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> 2,500 Leads Quota</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> RAG Knowledge Brain</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Follow-up Automation</li>
                  </ul>
                </div>
                <button
                  disabled={loading || subscription?.tier === 'GROWTH'}
                  onClick={() => handleUpgrade('GROWTH')}
                  className="mt-6 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all disabled:opacity-40"
                >
                  {subscription?.tier === 'GROWTH' ? 'Current Plan' : 'Select Growth Tier'}
                </button>
              </div>

              {/* Pro */}
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">Pro</h4>
                  <div className="my-3">
                    <span className="text-2xl font-black text-white">₹3,999</span>
                    <span className="text-xs text-slate-400"> /mo</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Unlimited Branches</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 10,000 Leads Quota</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Next Best Action Engine</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Drop-Off Bottleneck Alerts</li>
                  </ul>
                </div>
                <button
                  disabled={loading || subscription?.tier === 'PRO'}
                  onClick={() => handleUpgrade('PRO')}
                  className="mt-6 w-full py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all disabled:opacity-40"
                >
                  {subscription?.tier === 'PRO' ? 'Current Plan' : 'Upgrade to Pro'}
                </button>
              </div>

              {/* Enterprise */}
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">Enterprise</h4>
                  <div className="my-3">
                    <span className="text-2xl font-black text-white">Custom</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Dedicated Cloud Cluster</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Custom WhatsApp BSP</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 24/7 Dedicated Support</li>
                  </ul>
                </div>
                <button
                  disabled={loading || subscription?.tier === 'ENTERPRISE'}
                  onClick={() => handleUpgrade('ENTERPRISE')}
                  className="mt-6 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors disabled:opacity-40"
                >
                  Contact Enterprise Team
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
