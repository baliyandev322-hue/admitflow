'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, Plus, Search, Filter, Phone, 
  Mail, Globe, MapPin, Building2, Calendar, CheckCircle2, 
  AlertTriangle, ShieldAlert, ArrowRight, X, Clock, Sparkles, 
  TrendingUp, RefreshCw, Trash2, Edit3, MessageSquare, 
  ExternalLink, ChevronRight, FileText, CheckSquare, Layers
} from 'lucide-react';
import { SalesProspect, SalesStage, SalesProspectCategory, SalesActivity } from '@/lib/types';

const STAGES: { id: SalesStage; label: string; color: string; badge: string }[] = [
  { id: 'PROSPECT_IDENTIFIED', label: 'Prospect Identified', color: 'border-slate-700 bg-slate-900/60', badge: 'bg-slate-800 text-slate-300' },
  { id: 'CONTACTED', label: 'Contacted', color: 'border-blue-500/40 bg-blue-950/20', badge: 'bg-blue-900/40 text-blue-300' },
  { id: 'INTERESTED', label: 'Interested', color: 'border-indigo-500/40 bg-indigo-950/20', badge: 'bg-indigo-900/40 text-indigo-300' },
  { id: 'DEMO_SCHEDULED', label: 'Demo Scheduled', color: 'border-violet-500/40 bg-violet-950/20', badge: 'bg-violet-900/40 text-violet-300' },
  { id: 'DEMO_COMPLETED', label: 'Demo Completed', color: 'border-purple-500/40 bg-purple-950/20', badge: 'bg-purple-900/40 text-purple-300' },
  { id: 'PILOT_PROPOSED', label: 'Pilot Proposed', color: 'border-amber-500/40 bg-amber-950/20', badge: 'bg-amber-900/40 text-amber-300' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'border-orange-500/40 bg-orange-950/20', badge: 'bg-orange-900/40 text-orange-300' },
  { id: 'WON', label: 'Won', color: 'border-emerald-500/40 bg-emerald-950/20', badge: 'bg-emerald-900/40 text-emerald-300' },
  { id: 'LOST', label: 'Lost', color: 'border-rose-500/40 bg-rose-950/20', badge: 'bg-rose-900/40 text-rose-300' }
];

const CATEGORIES: { id: SalesProspectCategory; label: string }[] = [
  { id: 'IIT_JEE_NEET', label: 'IIT-JEE & NEET' },
  { id: 'CODING_ACADEMY', label: 'Coding Academy' },
  { id: 'CIVIL_SERVICES', label: 'Civil Services / UPSC' },
  { id: 'COMMERCE_CA', label: 'Commerce & CA' },
  { id: 'K12_TUITION', label: 'K-12 & Foundation' },
  { id: 'OTHER', label: 'Other Institutes' }
];

export default function SalesCrmPage() {
  const [session, setSession] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'dashboard' | 'pilot'>('pipeline');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Prospects State
  const [prospects, setProspects] = useState<SalesProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('');

  // Telemetry State
  const [telemetry, setTelemetry] = useState<any>(null);

  // Pilot State
  const [pilotData, setPilotData] = useState<any>(null);
  const [pilotUpdating, setPilotUpdating] = useState(false);
  const [newIssueDesc, setNewIssueDesc] = useState('');
  const [newIssueSeverity, setNewIssueSeverity] = useState<'P0' | 'P1' | 'P2'>('P1');
  const [counselorFeedbackText, setCounselorFeedbackText] = useState('');
  const [ownerFeedbackText, setOwnerFeedbackText] = useState('');

  // Drawer / Modal States
  const [activeProspect, setActiveProspect] = useState<SalesProspect | null>(null);
  const [prospectActivities, setProspectActivities] = useState<SalesActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [newActivityNote, setNewActivityNote] = useState('');
  const [newActivityType, setNewActivityType] = useState<string>('NOTE');
  const [newActivityOutcome, setNewActivityOutcome] = useState('');

  // Add Prospect Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    instituteName: '',
    city: '',
    website: '',
    contactPerson: '',
    email: '',
    phone: '',
    category: 'IIT_JEE_NEET' as SalesProspectCategory,
    branchCount: 1,
    mainProblem: '',
    stage: 'PROSPECT_IDENTIFIED' as SalesStage,
    nextFollowupDate: '',
    dealValueEstimated: 9999,
    notes: ''
  });

  // 1. Authenticate Session
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.user) {
          setSession(d.user);
        }
      })
      .catch(console.error)
      .finally(() => setAuthChecking(false));
  }, []);

  // 2. Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set('search', search);
      if (selectedStage) q.set('stage', selectedStage);
      if (selectedCategory) q.set('category', selectedCategory);

      const [prospectsRes, dashRes, pilotRes] = await Promise.all([
        fetch(`/api/sales/prospects?${q.toString()}`),
        fetch('/api/sales/dashboard'),
        fetch('/api/sales/pilot')
      ]);

      if (prospectsRes.ok) {
        const pData = await prospectsRes.json();
        setProspects(pData.prospects || []);
      }

      if (dashRes.ok) {
        const dData = await dashRes.json();
        setTelemetry(dData.summary);
      }

      if (pilotRes.ok) {
        const piData = await pilotRes.json();
        setPilotData(piData);
        setCounselorFeedbackText(piData.pilot?.counselorFeedback || '');
        setOwnerFeedbackText(piData.pilot?.ownerFeedback || '');
      }
    } catch (e) {
      console.error('Failed to fetch sales data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.role === 'SUPER_ADMIN') {
      fetchData();
    }
  }, [session, search, selectedCategory, selectedStage]);

  // Load prospect details and activities
  const openProspectDrawer = async (p: SalesProspect) => {
    setActiveProspect(p);
    setActivityLoading(true);
    try {
      const res = await fetch(`/api/sales/prospects/${p.id}`);
      if (res.ok) {
        const d = await res.json();
        setActiveProspect(d.prospect);
        setProspectActivities(d.activities || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActivityLoading(false);
    }
  };

  // Stage update handler
  const handleStageChange = async (prospectId: string, newStage: SalesStage) => {
    try {
      const res = await fetch(`/api/sales/prospects/${prospectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
      });
      if (res.ok) {
        const d = await res.json();
        setProspects(prev => prev.map(p => p.id === prospectId ? d.prospect : p));
        if (activeProspect?.id === prospectId) {
          openProspectDrawer(d.prospect);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add Activity Log
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProspect || !newActivityNote.trim()) return;

    try {
      const res = await fetch(`/api/sales/prospects/${activeProspect.id}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: newActivityType,
          outcome: newActivityOutcome,
          notes: newActivityNote
        })
      });
      if (res.ok) {
        const data = await res.json();
        setProspectActivities(prev => [data.activity, ...prev]);
        setNewActivityNote('');
        setNewActivityOutcome('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Prospect
  const handleDeleteProspect = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this prospect from the pipeline?')) return;
    try {
      const res = await fetch(`/api/sales/prospects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProspects(prev => prev.filter(p => p.id !== id));
        setActiveProspect(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create Verified Prospect
  const handleCreateProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      const res = await fetch('/api/sales/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to create prospect');
      } else {
        setProspects(prev => [data.prospect, ...prev]);
        setShowAddModal(false);
        setFormData({
          instituteName: '',
          city: '',
          website: '',
          contactPerson: '',
          email: '',
          phone: '',
          category: 'IIT_JEE_NEET',
          branchCount: 1,
          mainProblem: '',
          stage: 'PROSPECT_IDENTIFIED',
          nextFollowupDate: '',
          dealValueEstimated: 9999,
          notes: ''
        });
      }
    } catch (e: any) {
      setFormError('Network error while creating prospect');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Pilot Control Handlers (Track A)
  const handleUpdatePilot = async (updates: Record<string, any>) => {
    setPilotUpdating(true);
    try {
      const res = await fetch('/api/sales/pilot', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instituteId: 'inst-prerna-pilot', ...updates })
      });
      if (res.ok) {
        const data = await res.json();
        setPilotData((prev: any) => ({ ...prev, pilot: data.pilot }));
      }
    } catch (e) {
      console.error('Failed to update pilot:', e);
    } finally {
      setPilotUpdating(false);
    }
  };

  const handleAddPilotIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssueDesc.trim()) return;
    const currentIssues = pilotData?.pilot?.technicalIssues || [];
    const newIssue = {
      id: `issue-${Date.now()}`,
      issue: newIssueDesc.trim(),
      severity: newIssueSeverity,
      resolved: false,
      createdAt: new Date().toISOString()
    };
    await handleUpdatePilot({ technicalIssues: [newIssue, ...currentIssues] });
    setNewIssueDesc('');
  };

  const handleToggleIssueResolved = async (issueId: string) => {
    const currentIssues = pilotData?.pilot?.technicalIssues || [];
    const updated = currentIssues.map((it: any) => 
      it.id === issueId ? { ...it, resolved: !it.resolved } : it
    );
    await handleUpdatePilot({ technicalIssues: updated });
  };

  // -------------------------------------------------------------
  // Access Denied Screen (Strict Frontend Security Wall)
  // -------------------------------------------------------------
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
          <span>Verifying internal sales authorization...</span>
        </div>
      </div>
    );
  }

  if (!session || session.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Access Denied: SUPER_ADMIN Required</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              This area is strictly restricted to AdmitFlow AI's internal sales operations team. Coaching institute staff accounts do not have permission to view commercial client acquisition pipelines or company telemetry.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5 text-xs">
            <Link
              href="/dashboard"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
            >
              Return to Institute Dashboard
            </Link>
            <Link
              href="/login"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center justify-center gap-2"
            >
              Log in as AdmitFlow Super Admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Authorized Super Admin View
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-4 sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white">AdmitFlow Sales & Growth Portal</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                SUPER_ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400">Internal B2B Coaching Institute Client Pipeline</p>
          </div>
        </div>

        {/* Tab Switcher & Action */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-medium text-xs flex items-center gap-1.5 transition shrink-0"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Institute Dashboard</span>
          </Link>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center text-xs">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'pipeline' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pipeline ({prospects.length})
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Telemetry & MRR
            </button>
            <button
              onClick={() => setActiveTab('pilot')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'pilot' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Prerna Pilot
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Verified Prospect
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* ======================================================== */}
        {/* TAB 1: B2B Pipeline & Prospects Kanban                   */}
        {/* ======================================================== */}
        {activeTab === 'pipeline' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by institute, city, contact person, phone..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>

                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="">All Stages</option>
                  {STAGES.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1.5 rounded-xl border ${
                    viewMode === 'kanban' ? 'bg-slate-800 text-white border-slate-700' : 'text-slate-400 border-slate-800'
                  }`}
                >
                  Kanban View
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-xl border ${
                    viewMode === 'table' ? 'bg-slate-800 text-white border-slate-700' : 'text-slate-400 border-slate-800'
                  }`}
                >
                  Table View
                </button>
              </div>
            </div>

            {/* Kanban Columns */}
            {viewMode === 'kanban' && (
              <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin">
                {STAGES.map(stage => {
                  const stageProspects = prospects.filter(p => p.stage === stage.id);
                  return (
                    <div
                      key={stage.id}
                      className="w-80 shrink-0 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col max-h-[75vh]"
                    >
                      {/* Column Header */}
                      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${stage.badge.includes('emerald') ? 'bg-emerald-400' : stage.badge.includes('blue') ? 'bg-blue-400' : 'bg-slate-400'}`} />
                          <h3 className="font-bold text-xs text-slate-200">{stage.label}</h3>
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                          {stageProspects.length}
                        </span>
                      </div>

                      {/* Cards List */}
                      <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
                        {stageProspects.map(prospect => (
                          <div
                            key={prospect.id}
                            onClick={() => openProspectDrawer(prospect)}
                            className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-indigo-500/50 cursor-pointer space-y-2.5 transition-all shadow-sm group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors">
                                {prospect.instituteName}
                              </h4>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 shrink-0">
                                {prospect.city}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 line-clamp-2">
                              {prospect.mainProblem || 'Target coaching academy prospect.'}
                            </p>

                            <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                              <span className="flex items-center gap-1 font-medium text-slate-300">
                                <Users className="w-3.5 h-3.5 text-slate-500" /> {prospect.contactPerson}
                              </span>
                              <span className="font-semibold text-emerald-400">
                                ₹{prospect.dealValueEstimated ? prospect.dealValueEstimated.toLocaleString('en-IN') : '9,999'}/mo
                              </span>
                            </div>
                          </div>
                        ))}

                        {/* Clean Empty State */}
                        {stageProspects.length === 0 && (
                          <div className="py-8 px-4 text-center text-xs text-slate-500 space-y-1">
                            <p>No prospects in this stage.</p>
                            <p className="text-[10px] text-slate-600">Manual verified additions only.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Institute Name</th>
                      <th className="py-3 px-4">City</th>
                      <th className="py-3 px-4">Contact Person</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Stage</th>
                      <th className="py-3 px-4">Est. Deal</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {prospects.map(p => (
                      <tr key={p.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-4 font-bold text-white">{p.instituteName}</td>
                        <td className="py-3 px-4 text-slate-400">{p.city}</td>
                        <td className="py-3 px-4">
                          <div>{p.contactPerson}</div>
                          <div className="text-[10px] text-slate-500">{p.phone}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{p.category}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 border border-slate-700 text-indigo-300">
                            {p.stage.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-emerald-400">₹{p.dealValueEstimated ? p.dealValueEstimated.toLocaleString('en-IN') : '9,999'}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openProspectDrawer(p)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {prospects.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          Pipeline is clean. Click 'Add Verified Prospect' to register an authorized institute decision-maker.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: Sales Telemetry & Honest MRR Dashboard            */}
        {/* ======================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                  <span>Total Prospects</span>
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-white">{telemetry?.totalProspects ?? prospects.length}</div>
                <div className="text-[10px] text-slate-500">Verified B2B institute leads</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                  <span>Demos Scheduled / Completed</span>
                  <Calendar className="w-4 h-4 text-violet-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {(telemetry?.demoScheduled ?? 0) + (telemetry?.demoCompleted ?? 0)}
                </div>
                <div className="text-[10px] text-slate-500">{telemetry?.demoCompleted ?? 0} Completed pitches</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                  <span>Pilot Proposals Active</span>
                  <FileText className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white">{telemetry?.pilotProposed ?? 0}</div>
                <div className="text-[10px] text-slate-500">Track A & Track B conversion pipeline</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-emerald-500/30 space-y-2 relative overflow-hidden">
                <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                  <span>Actual MRR (Strict Policy)</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400">
                  ₹{(telemetry?.actualMonthlyRecurringRevenue ?? 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> Real revenue only (0 fake counting)
                </div>
              </div>
            </div>

            {/* Honest MRR Policy Banner */}
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-white">Strict Honest Commercial Accounting Policy</div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Under AdmitFlow company policy, trial academies, demo sandboxes, and unpaid pilot institutes (such as Prerna Career Institute during its 14-day evaluation) are strictly excluded from MRR figures. Revenue will increment only after verified Razorpay gateway capture.
                </p>
              </div>
            </div>

            {/* Funnel Stage Breakdown */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
              <h3 className="font-bold text-sm text-white">B2B Conversion Funnel Stages</h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 text-center text-xs">
                {STAGES.map(s => {
                  const count = prospects.filter(p => p.stage === s.id).length;
                  return (
                    <div key={s.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/60 space-y-1">
                      <div className="text-[10px] text-slate-400 font-medium truncate">{s.label}</div>
                      <div className="text-lg font-black text-white">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: Prerna Pilot Command Console (Track A)            */}
        {/* ======================================================== */}
        {activeTab === 'pilot' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 space-y-6 shadow-xl">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <h2 className="text-lg font-bold text-white">[DEMO SANDBOX] Prerna Career Institute</h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      UNVERIFIED_DEMO_TENANT
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Synthetic Test Institute • Multi-Branch Architecture Simulation (Kota & Jaipur) • Communications Prohibited
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    Status: UNVERIFIED DEMO TENANT
                  </span>
                </div>
              </div>

              {/* Authenticity & Demo Notice Banner */}
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-200">Strict Non-Customer & Data Authenticity Notice</div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    This tenant is classified as an <strong>UNVERIFIED_DEMO_TENANT</strong>. Prerna Career Institute is not an actual customer, confirmed prospect, or authorized partner. All listed email addresses, phone numbers, course fees, and scholarship records are synthetic/demo data used solely for software testing. Automated communications (emails, WhatsApp, calendar invites) to these contacts are strictly prohibited.
                  </p>
                </div>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-slate-500">Institute Authenticity</div>
                  <div className="font-bold text-amber-300">
                    🟡 Synthetic Demo Sandbox (Not a Live Customer)
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-slate-500">Website Widget Sandbox</div>
                  <div className="font-bold text-slate-200">
                    🟡 Test Embed Sandbox (/widget?slug=prerna-career-institute)
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-slate-500">Commercial Status</div>
                  <div className="font-bold text-emerald-400">
                    Proposed Tier: ₹9,999/mo (Actual MRR: ₹0)
                  </div>
                </div>
              </div>

              {/* Genuine Metrics Stream */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider">
                  Live Recorded Metrics Stream (No Synthetic Figures)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-slate-500 text-[10px]">Total Recorded Enquiries</div>
                    <div className="text-xl font-bold text-white">{pilotData?.genuineMetrics?.totalRecordedEnquiries ?? 0}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-slate-500 text-[10px]">Student Leads Captured</div>
                    <div className="text-xl font-bold text-white">{pilotData?.genuineMetrics?.leadsCaptured ?? 0}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-slate-500 text-[10px]">Confirmed Appointments</div>
                    <div className="text-xl font-bold text-white">{pilotData?.genuineMetrics?.appointmentsConfirmed ?? 0}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-slate-500 text-[10px]">Prospectus Vector Chunks</div>
                    <div className="text-xl font-bold text-white">{pilotData?.genuineMetrics?.vectorChunksIndexed ?? 4}</div>
                  </div>
                </div>
              </div>

              {/* Acceptance Workflow Controls */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-bold text-xs text-white flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-indigo-400" /> Director Sign-Off & Acceptance Protocol
                  </h4>
                  <Link
                    href="/widget?slug=prerna-career-institute"
                    target="_blank"
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Test Prerna Widget
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Director Acceptance Status</label>
                    <select
                      value={pilotData?.pilot?.ownerAcceptanceStatus || 'PENDING_SIGN_OFF'}
                      onChange={(e) => handleUpdatePilot({ ownerAcceptanceStatus: e.target.value })}
                      disabled={pilotUpdating}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none"
                    >
                      <option value="PENDING_SIGN_OFF">PENDING SIGN OFF</option>
                      <option value="IN_REVIEW">IN REVIEW</option>
                      <option value="APPROVED">APPROVED BY DIRECTOR</option>
                      <option value="REJECTED">REJECTED / CHANGES REQUESTED</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Director Physical Authorization</label>
                    <button
                      onClick={() => handleUpdatePilot({ authorizationConfirmed: !pilotData?.pilot?.authorizationConfirmed })}
                      disabled={pilotUpdating}
                      className={`w-full py-2 px-3 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition ${
                        pilotData?.pilot?.authorizationConfirmed
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {pilotData?.pilot?.authorizationConfirmed ? '✅ Confirmed' : 'Mark as Confirmed'}
                    </button>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Website Widget Deployment</label>
                    <button
                      onClick={() => handleUpdatePilot({ widgetInstallationApproved: !pilotData?.pilot?.widgetInstallationApproved })}
                      disabled={pilotUpdating}
                      className={`w-full py-2 px-3 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition ${
                        pilotData?.pilot?.widgetInstallationApproved
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {pilotData?.pilot?.widgetInstallationApproved ? '✅ Verified on Domain' : 'Mark Verified'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Technical Issues Register */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-bold text-xs text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" /> Technical Issues & Bug Register
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Active: {(pilotData?.pilot?.technicalIssues || []).filter((i: any) => !i.resolved).length}
                  </span>
                </div>

                {/* Log Issue Form */}
                <form onSubmit={handleAddPilotIssue} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    value={newIssueDesc}
                    onChange={(e) => setNewIssueDesc(e.target.value)}
                    placeholder="Describe technical issue, widget bug, or counselor report..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <select
                    value={newIssueSeverity}
                    onChange={(e) => setNewIssueSeverity(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none shrink-0"
                  >
                    <option value="P0">P0 - Critical</option>
                    <option value="P1">P1 - Major</option>
                    <option value="P2">P2 - Minor</option>
                  </select>
                  <button
                    type="submit"
                    disabled={pilotUpdating}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 transition"
                  >
                    Log Issue
                  </button>
                </form>

                {/* Issues List */}
                <div className="space-y-2">
                  {(pilotData?.pilot?.technicalIssues || []).map((issue: any) => (
                    <div
                      key={issue.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                        issue.resolved
                          ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            issue.severity === 'P0'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : issue.severity === 'P1'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}
                        >
                          {issue.severity}
                        </span>
                        <span className={`text-slate-200 ${issue.resolved ? 'line-through text-slate-500' : ''}`}>
                          {issue.issue}
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggleIssueResolved(issue.id)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                          issue.resolved
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/40'
                        }`}
                      >
                        {issue.resolved ? 'Resolved ✅' : 'Mark Resolved'}
                      </button>
                    </div>
                  ))}

                  {(!pilotData?.pilot?.technicalIssues || pilotData.pilot.technicalIssues.length === 0) && (
                    <div className="py-4 text-center text-xs text-slate-500">
                      No technical issues currently recorded for Prerna Career Institute.
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback Notes Form */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-4">
                <h4 className="font-bold text-xs text-white">Pilot Stakeholder Feedback</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Counselor Team Feedback</label>
                    <textarea
                      rows={2}
                      value={counselorFeedbackText}
                      onChange={(e) => setCounselorFeedbackText(e.target.value)}
                      placeholder="Feedback from Sunita Sharma / Vikram Rathore..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Director (Dr. Rajesh Verma) Feedback</label>
                    <textarea
                      rows={2}
                      value={ownerFeedbackText}
                      onChange={(e) => setOwnerFeedbackText(e.target.value)}
                      placeholder="Director feedback on lead quality and conversion..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleUpdatePilot({
                    counselorFeedback: counselorFeedbackText,
                    ownerFeedback: ownerFeedbackText
                  })}
                  disabled={pilotUpdating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
                >
                  Save Feedback Notes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL: Add Verified B2B Prospect                         */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" /> Add Verified B2B Prospect
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProspect} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Institute Official Name *</label>
                <input
                  type="text"
                  required
                  value={formData.instituteName}
                  onChange={e => setFormData({ ...formData, instituteName: e.target.value })}
                  placeholder="e.g. Gurukul Science Academy"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Sikar / Kota / Jaipur"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Key Decision Maker *</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Dr. K.K. Verma (Director)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Branches Count</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.branchCount}
                    onChange={e => setFormData({ ...formData, branchCount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Business Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="director@institute.edu.in"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Business Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91-98XXXXXXXX"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Main Pain Point / Need</label>
                <input
                  type="text"
                  value={formData.mainProblem}
                  onChange={e => setFormData({ ...formData, mainProblem: e.target.value })}
                  placeholder="e.g. Dropping late night queries, slow counselor callback"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs mt-2 transition disabled:opacity-50"
              >
                {formSubmitting ? 'Registering Verified Prospect...' : 'Create B2B Prospect'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER: Prospect Detail & Activity Timeline              */}
      {/* ======================================================== */}
      {activeProspect && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col space-y-5 overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-white">{activeProspect.instituteName}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {activeProspect.city} • {activeProspect.branchCount} Branch(es)
                </div>
              </div>
              <button onClick={() => setActiveProspect(null)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stage Mover */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 block">Sales Stage Progression</label>
              <select
                value={activeProspect.stage}
                onChange={(e) => handleStageChange(activeProspect.id, e.target.value as SalesStage)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-indigo-300 font-bold focus:outline-none"
              >
                {STAGES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <div>
                <span className="text-slate-500 block text-[10px]">Decision Maker</span>
                <span className="font-semibold text-slate-200">{activeProspect.contactPerson}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Phone</span>
                <span className="font-semibold text-slate-200">{activeProspect.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Email</span>
                <span className="font-semibold text-slate-200 truncate block">{activeProspect.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Category</span>
                <span className="font-semibold text-slate-200">{activeProspect.category}</span>
              </div>
            </div>

            {/* Log Sales Activity Form */}
            <form onSubmit={handleAddActivity} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Log Outreach / Interaction
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newActivityType}
                  onChange={e => setNewActivityType(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="CALL">Phone Call</option>
                  <option value="DEMO">Product Demo</option>
                  <option value="MEETING">Meeting</option>
                  <option value="EMAIL">Email Dispatch</option>
                  <option value="NOTE">Internal Note</option>
                </select>
                <input
                  type="text"
                  value={newActivityOutcome}
                  onChange={e => setNewActivityOutcome(e.target.value)}
                  placeholder="Outcome (e.g. Interested)"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <textarea
                required
                value={newActivityNote}
                onChange={e => setNewActivityNote(e.target.value)}
                placeholder="Call notes, owner objections, demo feedback..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
              >
                Log Activity
              </button>
            </form>

            {/* Activity Timeline */}
            <div className="flex-1 space-y-3">
              <h4 className="font-bold text-xs text-slate-300">Sales Activity Timeline</h4>
              {activityLoading ? (
                <div className="py-6 text-center text-xs text-slate-500">Loading timeline...</div>
              ) : (
                <div className="space-y-2 text-xs">
                  {prospectActivities.map(act => (
                    <div key={act.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-indigo-400">{act.activityType}</span>
                        <span className="text-slate-500">{new Date(act.createdAt).toLocaleString('en-IN')}</span>
                      </div>
                      <p className="text-slate-300 text-xs">{act.notes}</p>
                      <div className="text-[10px] text-slate-500">By: {act.performedBy}</div>
                    </div>
                  ))}
                  {prospectActivities.length === 0 && (
                    <div className="py-6 text-center text-xs text-slate-500">No activity recorded yet.</div>
                  )}
                </div>
              )}
            </div>

            {/* Delete Option */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => handleDeleteProspect(activeProspect.id)}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 font-semibold transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete this prospect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
