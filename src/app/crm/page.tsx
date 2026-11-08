'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import { 
  Users, Search, Plus, Filter, Download, 
  Phone, Mail, Calendar, Sparkles, ChevronRight,
  Clock, CheckCircle, AlertCircle, X, MessageSquare, ArrowRight
} from 'lucide-react';
import { LeadStatus } from '@/lib/types';

const STAGES: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'NEW', label: 'New Enquiry', color: 'border-blue-500/50 bg-blue-500/5 text-blue-400' },
  { id: 'CONTACTED', label: 'Contacted', color: 'border-indigo-500/50 bg-indigo-500/5 text-indigo-400' },
  { id: 'INTERESTED', label: 'Interested', color: 'border-violet-500/50 bg-violet-500/5 text-violet-400' },
  { id: 'COUNSELLING_SCHEDULED', label: 'Counseling Scheduled', color: 'border-pink-500/50 bg-pink-500/5 text-pink-400' },
  { id: 'TRIAL_CLASS', label: 'Trial Class', color: 'border-amber-500/50 bg-amber-500/5 text-amber-400' },
  { id: 'ADMISSION_CONFIRMED', label: 'Admission Confirmed', color: 'border-emerald-500/50 bg-emerald-500/5 text-emerald-400' },
  { id: 'LOST', label: 'Lost', color: 'border-rose-500/50 bg-rose-500/5 text-rose-400' }
];

export default function CrmPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Lead Detail / Modal
  const [activeLead, setActiveLead] = useState<any>(null);
  const [leadActivities, setLeadActivities] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadCourse, setNewLeadCourse] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLeads = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const m = await meRes.json();
        setSession(m);
        setBranches(m.branches || []);
      }

      const coursesRes = await fetch('/api/courses');
      if (coursesRes.ok) {
        const cData = await coursesRes.json();
        setCourses(cData.courses || []);
      }

      const q = new URLSearchParams();
      if (search) q.set('search', search);
      if (selectedStage) q.set('status', selectedStage);

      const res = await fetch(`/api/leads?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, selectedStage]);

  const openLeadDetail = async (lead: any) => {
    setActiveLead(lead);
    try {
      const res = await fetch(`/api/leads/${lead.id}/activity`);
      if (res.ok) {
        const data = await res.json();
        setLeadActivities(data.activities || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status: newStatus })
      });
      if (res.ok) {
        fetchLeads();
        if (activeLead && activeLead.id === leadId) {
          setActiveLead({ ...activeLead, status: newStatus });
          openLeadDetail({ ...activeLead, status: newStatus });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerNextAction = async (leadId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/next-action`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (activeLead) {
          setActiveLead({ ...activeLead, nextBestAction: data.data.recommendedAction });
        }
        fetchLeads();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !activeLead) return;

    try {
      const res = await fetch(`/api/leads/${activeLead.id}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newNote, activityType: 'COUNSELLOR_NOTE' })
      });
      if (res.ok) {
        setNewNote('');
        openLeadDetail(activeLead);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: newLeadName,
          phone: newLeadPhone,
          courseId: newLeadCourse,
          source: 'DIRECT_WALKIN'
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewLeadName('');
        setNewLeadPhone('');
        fetchLeads();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create lead');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const exportCSV = () => {
    const headers = ['Student Name', 'Phone', 'Email', 'Course', 'Status', 'Source', 'Lead Score', 'Created At'];
    const rows = leads.map(l => [
      `"${l.studentName}"`,
      `"${l.phone}"`,
      `"${l.email || ''}"`,
      `"${l.courseId || ''}"`,
      `"${l.status}"`,
      `"${l.source}"`,
      l.leadScore,
      `"${l.createdAt}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `admitflow_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100">
      <Sidebar user={session?.user} institute={session?.institute} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopNav 
          institute={session?.institute}
          branches={session?.branches || []}
          title="Lead Management CRM"
          subtitle="Pipeline stages, automated scoring & Next Best Action execution"
        />

        <main className="p-6 space-y-6 flex-1 max-w-7xl w-full">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by student name or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-medium focus:outline-none"
              >
                <option value="">All Stages</option>
                {STAGES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  Kanban
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  Table
                </button>
              </div>

              <button
                onClick={exportCSV}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Export CSV"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Lead</span>
              </button>
            </div>
          </div>

          {/* KANBAN VIEW */}
          {viewMode === 'kanban' ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {STAGES.map((stage) => {
                const stageLeads = leads.filter(l => l.status === stage.id);
                return (
                  <div key={stage.id} className="w-72 shrink-0 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${stage.color.split(' ')[0]}`} />
                        {stage.label}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-slate-300">
                        {stageLeads.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] pr-1">
                      {stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => openLeadDetail(lead)}
                          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all hover:scale-[1.01] shadow-sm space-y-2 group"
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-xs text-white group-hover:text-indigo-400 transition-colors">
                              {lead.studentName}
                            </span>
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {lead.leadScore} pts
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{lead.phone}</span>
                          </div>

                          {lead.nextBestAction && (
                            <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-[10px] text-indigo-300 flex items-start gap-1.5">
                              <Sparkles className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{lead.nextBestAction}</span>
                            </div>
                          )}

                          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/80">
                            <span>{lead.source?.replace('_', ' ')}</span>
                            <span>{new Date(lead.lastInteractionAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      ))}

                      {stageLeads.length === 0 && (
                        <div className="py-8 text-center text-xs text-slate-600 italic">
                          No leads in this stage
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold">
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Phone</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Score</th>
                    <th className="p-3.5">Source</th>
                    <th className="p-3.5">Next Best Action</th>
                    <th className="p-3.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {leads.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/40 cursor-pointer" onClick={() => openLeadDetail(l)}>
                      <td className="p-3.5 font-bold text-white">{l.studentName}</td>
                      <td className="p-3.5 text-slate-400">{l.phone}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {l.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-emerald-400">{l.leadScore}</td>
                      <td className="p-3.5 text-slate-400">{l.source}</td>
                      <td className="p-3.5 text-indigo-300 max-w-xs truncate">{l.nextBestAction || '—'}</td>
                      <td className="p-3.5 text-indigo-400 font-semibold hover:underline">View</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* LEAD DETAIL DRAWER */}
      {activeLead && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">{activeLead.studentName}</h2>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{activeLead.phone}</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">{activeLead.leadScore} Points</span>
              </div>
            </div>
            <button onClick={() => setActiveLead(null)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex-1 space-y-6 text-xs">
            {/* Stage Selector */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Lead Stage</label>
              <select
                value={activeLead.status}
                onChange={(e) => handleStatusChange(activeLead.id, e.target.value as LeadStatus)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:outline-none"
              >
                {STAGES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* AI Next Best Action Card */}
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> AI Next Best Action
                </span>
                <button
                  onClick={() => handleTriggerNextAction(activeLead.id)}
                  disabled={actionLoading}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Calculating...' : 'Recalculate'}
                </button>
              </div>
              <p className="text-slate-200 leading-relaxed font-medium">
                {activeLead.nextBestAction || 'No recommendation calculated yet.'}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`https://wa.me/${activeLead.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-semibold text-center transition-colors"
              >
                Open WhatsApp
              </a>
              <a
                href={`tel:${activeLead.phone}`}
                className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-center transition-colors"
              >
                Call Student
              </a>
            </div>

            {/* Activity Timeline */}
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-white">Interaction History & Timeline</h3>

              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Log counselor notes (e.g. Student prefers morning batch, father called)..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="submit"
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
                >
                  Save Counselor Note
                </button>
              </form>

              <div className="space-y-2.5 pt-2">
                {leadActivities.map((act) => (
                  <div key={act.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span className="font-bold text-indigo-400">{act.activityType}</span>
                      <span>{new Date(act.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{act.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD LEAD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-base">Add New Student Lead</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  placeholder="e.g. Vikramaditya Rathore"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value)}
                  placeholder="+91-9876543210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Interested Course</label>
                <select
                  value={newLeadCourse}
                  onChange={(e) => setNewLeadCourse(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                >
                  <option value="">Select a Course...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
