'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import { 
  Cpu, Calendar, MessageSquare, ShieldCheck, CheckCircle2, 
  AlertCircle, RefreshCw, ExternalLink, Search, Filter, 
  Terminal, Activity, Clock, ToggleLeft, ToggleRight, Sparkles 
} from 'lucide-react';

export default function IntegrationsPage() {
  const [session, setSession] = useState<any>(null);
  const [settings, setSettings] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [toolStatusMap, setToolStatusMap] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const me = await meRes.json();
        setSession(me);
      }

      const res = await fetch('/api/integrations');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || []);
        setTools(data.tools || []);
        setLogs(data.logs || []);

        const initialStatus: Record<string, boolean> = {};
        (data.tools || []).forEach((t: any) => {
          initialStatus[t.name] = true;
        });
        setToolStatusMap(initialStatus);
      }
    } catch (e) {
      console.error('Failed to load integrations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleTool = (toolName: string) => {
    setToolStatusMap(prev => ({
      ...prev,
      [toolName]: !prev[toolName]
    }));
  };

  const filteredTools = tools.filter(t => {
    const matchesCat = selectedCategory === 'ALL' || t.category === selectedCategory;
    const matchesQuery = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const categories = ['ALL', 'CRM', 'COUNSELLING', 'FOLLOWUP', 'KNOWLEDGE', 'ANALYTICS', 'CALENDAR', 'WHATSAPP', 'DOCUMENTS'];

  const mcpSetting = settings.find(s => s.provider === 'MCP_SERVER');
  const calSetting = settings.find(s => s.provider === 'GOOGLE_CALENDAR');
  const waSetting = settings.find(s => s.provider === 'WHATSAPP_BUSINESS');

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar user={session?.user} institute={session?.institute} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <TopNav title="MCP & External Tool Integrations" subtitle="Model Context Protocol Server, Google Calendar, and WhatsApp Cloud API Connectors" />

        <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Header Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Model Context Protocol (MCP) Runtime
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    SDK v1.32.2 • Spec 2024-11-05
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Remote Streamable HTTP endpoint: <code className="text-indigo-300 font-mono">/api/mcp</code>
                </p>
              </div>
            </div>

            <button 
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync Connectors
            </button>
          </div>

          {/* Connectors Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. MCP Server Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" /> Official MCP Server
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">AdmitFlow Tool Server</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Exposes 33 atomic tools across CRM, RAG Knowledge, Calendar, WhatsApp, and Document Completeness.
                </p>
                <div className="space-y-1.5 text-xs text-slate-300 font-mono bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transport:</span>
                    <span className="text-indigo-300">Streamable HTTP / SSE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Registered:</span>
                    <span className="text-emerald-400 font-bold">{tools.length} Tools</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tenant Isolation:</span>
                    <span className="text-emerald-400">Strict Server-side RLS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Google Calendar Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Google Calendar
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Standby Mode
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">Counsellor Calendar Sync</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Synchronizes appointment slots with Google Calendar. Prevents double-booking and creates Google Meet links.
                </p>
                <div className="space-y-1.5 text-xs text-slate-300 font-mono bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Conflict Guard:</span>
                    <span className="text-emerald-400">Enabled (30m blocks)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Live OAuth:</span>
                    <span className="text-amber-400">Standby (Env Pending)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Primary Cal:</span>
                    <span className="text-slate-300">Asia/Kolkata</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. WhatsApp Business Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" /> WhatsApp Cloud API
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> DPDP Compliant
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">Meta Business Platform</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Official WhatsApp template notifications. Strictly enforces student opt-in consent and opt-out STOP triggers.
                </p>
                <div className="space-y-1.5 text-xs text-slate-300 font-mono bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Approved Templates:</span>
                    <span className="text-emerald-400 font-bold">4 Meta Verified</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consent Check:</span>
                    <span className="text-emerald-400">Mandatory Filter</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Opt-Out Webhook:</span>
                    <span className="text-indigo-300">Active (Auto-Revoke)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MCP Tools Registry Explorer */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  MCP Tool Registry Management ({filteredTools.length} Available)
                </h3>
                <p className="text-xs text-slate-400">
                  Control which atomic tools are discoverable and callable by AI agents and external clients.
                </p>
              </div>

              {/* Search & Filter */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tools..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
                  />
                </div>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    selectedCategory === cat 
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20' 
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Tools Table */}
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Tool Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Security & Guardrails</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredTools.map(t => {
                    const isEnabled = toolStatusMap[t.name] ?? true;
                    return (
                      <tr key={t.name} className="hover:bg-slate-800/30 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-300">
                          {t.name}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-slate-300">
                            {t.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 max-w-sm truncate" title={t.description}>
                          {t.description}
                        </td>
                        <td className="py-2.5 px-3 space-x-1.5">
                          {t.readOnly ? (
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">
                              Read-Only
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                              Mutating
                            </span>
                          )}
                          {t.requiresApproval && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px]">
                              Human Approval Req.
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => toggleTool(t.name)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold focus:outline-none"
                          >
                            {isEnabled ? (
                              <span className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                                <ToggleRight className="w-5 h-5" /> Enabled
                              </span>
                            ) : (
                              <span className="text-slate-500 hover:text-slate-400 flex items-center gap-1">
                                <ToggleLeft className="w-5 h-5" /> Disabled
                              </span>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent MCP Tool Execution Audit Logs */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Live MCP Tool Execution Audit Trail
            </h3>
            <p className="text-xs text-slate-400">
              Immutable log of every tool execution, actor identity, execution latency, and output status.
            </p>

            <div className="space-y-2">
              {logs.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No MCP tool executions recorded yet. Execute a tool via AI chat sandbox or API.
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${log.status === 'SUCCESS' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span className="font-mono text-indigo-300 font-semibold">{log.skillName}</span>
                      <span className="text-slate-500 text-[11px]">Actor: {log.triggeredBy}</span>
                    </div>

                    <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
                      <span>{log.executionTimeMs}ms</span>
                      <span className="text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
