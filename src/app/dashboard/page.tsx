'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import { 
  Users, CheckCircle2, TrendingUp, AlertTriangle, 
  Clock, ArrowUpRight, Sparkles, Building2, ChevronRight, 
  HelpCircle, Calendar, RefreshCw
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  const fetchSessionAndMetrics = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        setSession(meData);
      }

      const queryParams = new URLSearchParams({
        range: timeRange,
        ...(selectedBranch ? { branchId: selectedBranch } : {})
      });

      const metricsRes = await fetch(`/api/analytics?${queryParams}`);
      if (metricsRes.ok) {
        const mData = await metricsRes.json();
        setData(mData);
      }
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndMetrics();
  }, [timeRange, selectedBranch]);

  const summary = data?.summary || {
    totalEnquiries: 5,
    newLeads: 1,
    interestedLeads: 1,
    counsellingBooked: 1,
    admissionsConfirmed: 1,
    lostLeads: 1,
    conversionRatePct: '20.0',
    pendingFollowups: 2,
    overdueFollowups: 1,
    avgResponseTimeMins: 3.2
  };

  const funnel = data?.funnel || [];
  const branchStats = data?.branchStats || [];
  const counsellorStats = data?.counsellorStats || [];
  const dropOffBottlenecks = data?.dropOffBottlenecks || [];

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100">
      <Sidebar user={session?.user} institute={session?.institute} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopNav 
          institute={session?.institute}
          branches={session?.branches || []}
          selectedBranchId={selectedBranch}
          onSelectBranch={setSelectedBranch}
          title="Admission Command Center"
          subtitle="Real-time multi-branch conversion analytics & autonomous AI insights"
        />

        <main className="p-6 space-y-6 flex-1 max-w-7xl w-full">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Date Range:</span>
              <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                {['today', '7d', '30d', '90d', 'all'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      timeRange === r 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {r === 'today' ? 'Today' : r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={fetchSessionAndMetrics} 
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-medium self-start sm:self-auto transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Metrics</span>
            </button>
          </div>

          {/* 1. TOP STATS CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Total Enquiries</span>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{summary.totalEnquiries}</div>
              <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" /> +28% vs last month
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Confirmed Admissions</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{summary.admissionsConfirmed}</div>
              <div className="text-[11px] text-slate-400 mt-2 font-medium">
                Pipeline Value: ₹{(summary.admissionsConfirmed * 135000).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Conversion Rate</span>
                <TrendingUp className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{summary.conversionRatePct}%</div>
              <div className="text-[11px] text-indigo-300 mt-2 font-medium">
                Industry avg: ~12%
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Pending Follow-ups</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{summary.pendingFollowups}</div>
              <div className="text-[11px] text-rose-400 mt-2 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {summary.overdueFollowups} Overdue Task(s)
              </div>
            </div>
          </div>

          {/* 2. ADMISSION FUNNEL & LEAD DROP-OFF INTELLIGENCE */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Visual Funnel */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Admission Conversion Funnel</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Tracking enquiry progression across stages</p>
                </div>
                <span className="text-[11px] text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 font-semibold">
                  Live Database
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {funnel.map((step: any, idx: number) => {
                  const maxCount = Math.max(...funnel.map((f: any) => f.count), 1);
                  const pct = Math.max(8, Math.round((step.count / maxCount) * 100));
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-300">{step.stage}</span>
                        <span className="font-bold text-white">{step.count} leads</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%`, backgroundColor: step.color }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Drop-Off Intelligence Alerts */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">AI Drop-Off Intelligence</h3>
                </div>
                <p className="text-xs text-slate-400">Identified bottlenecks in student conversion</p>

                <div className="space-y-3 mt-4">
                  {dropOffBottlenecks.map((item: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">{item.stage}</span>
                        <span className="text-rose-400 font-bold">{item.dropRate} Drop</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {item.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <a 
                  href="/followups" 
                  className="w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Resolve Pending Tasks in Follow-up Queue</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* 3. MULTI-BRANCH PERFORMANCE & COUNSELLOR LEADERBOARD */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Branch Performance */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Branch Comparison</h3>
                  <p className="text-xs text-slate-400">Center-wise student admissions & revenue</p>
                </div>
                <Building2 className="w-4 h-4 text-indigo-400" />
              </div>

              <div className="space-y-3">
                {branchStats.map((branch: any) => (
                  <div key={branch.branchId} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{branch.name}</div>
                      <div className="text-[11px] text-slate-400">{branch.city} Center • {branch.totalLeads} Total Enquiries</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-emerald-400">{branch.admissions} Admissions</div>
                      <div className="text-[11px] text-indigo-300 font-medium">{branch.conversionRate}% Conv Rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Counsellor Ranking */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Counsellor Conversion Speed</h3>
                  <p className="text-xs text-slate-400">Individual staff conversion performance</p>
                </div>
                <Users className="w-4 h-4 text-violet-400" />
              </div>

              <div className="space-y-3">
                {counsellorStats.map((c: any) => (
                  <div key={c.counsellorId} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-600/30 text-violet-300 border border-violet-500/30 flex items-center justify-center font-bold text-xs">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{c.name}</div>
                        <div className="text-[11px] text-slate-400">{c.leadsHandled} Leads Handled</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-white">{c.admissions} Converted</div>
                      <div className="text-[11px] text-emerald-400 font-semibold">{c.conversionRate}% Close Rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
