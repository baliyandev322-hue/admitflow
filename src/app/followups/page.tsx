'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import { 
  CheckSquare, Clock, AlertTriangle, CheckCircle2, 
  XCircle, Edit3, Send, Sparkles, MessageSquare, ShieldCheck 
} from 'lucide-react';

export default function FollowupsPage() {
  const [session, setSession] = useState<any>(null);
  const [followups, setFollowups] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'SENT' | 'ALL'>('PENDING');

  const fetchFollowups = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const m = await meRes.json();
        setSession(m);
      }

      const res = await fetch('/api/followups');
      if (res.ok) {
        const data = await res.json();
        setFollowups(data.followups || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, []);

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT' | 'COMPLETE', messageOverride?: string) => {
    try {
      const res = await fetch('/api/followups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action,
          editedMessage: messageOverride
        })
      });
      if (res.ok) {
        setEditingId(null);
        fetchFollowups();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredFollowups = followups.filter(f => {
    if (activeTab === 'PENDING') return f.status === 'PENDING';
    if (activeTab === 'SENT') return f.status === 'SENT';
    return true;
  });

  const overdueCount = followups.filter(f => f.isOverdue).length;

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100">
      <Sidebar user={session?.user} institute={session?.institute} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopNav 
          institute={session?.institute}
          branches={session?.branches || []}
          title="Follow-up Automation & Human Approval"
          subtitle="AI-drafted personalized messages requiring counselor approval before external transmission"
        />

        <main className="p-6 space-y-6 flex-1 max-w-7xl w-full">
          {/* Compliance & Status Banner */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Human-In-The-Loop Guard Enabled</h2>
                <p className="text-xs text-slate-400">
                  Zero automated messages are dispatched without counselor verification to protect brand reputation.
                </p>
              </div>
            </div>

            {overdueCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold self-start sm:self-auto">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{overdueCount} Overdue Reminder(s)</span>
              </div>
            )}
          </div>

          {/* Tab Filter */}
          <div className="flex items-center justify-between">
            <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setActiveTab('PENDING')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${activeTab === 'PENDING' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Needs Approval ({followups.filter(f => f.status === 'PENDING').length})
              </button>
              <button
                onClick={() => setActiveTab('SENT')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${activeTab === 'SENT' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Dispatched ({followups.filter(f => f.status === 'SENT').length})
              </button>
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${activeTab === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                All Follow-ups
              </button>
            </div>
          </div>

          {/* Follow-ups List */}
          <div className="space-y-4">
            {filteredFollowups.map((f) => {
              const isEditing = editingId === f.id;

              return (
                <div 
                  key={f.id} 
                  className={`p-5 rounded-2xl bg-slate-900/60 border transition-all ${
                    f.isOverdue ? 'border-rose-500/40 bg-rose-950/10' : 'border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        f.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : f.status === 'SENT'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {f.status}
                      </span>

                      <span className="text-xs font-semibold text-slate-300">
                        Via {f.channel}
                      </span>

                      {f.isOverdue && (
                        <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Due: {new Date(f.dueDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>

                  {/* Message Draft Box */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 mb-4">
                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI Drafted Follow-up Message:
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 mt-2">
                        <textarea
                          rows={3}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleAction(f.id, 'APPROVE', editText)}
                            className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                          >
                            Save & Approve
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-200 leading-relaxed italic">
                        "{f.suggestedMessage}"
                      </p>
                    )}
                  </div>

                  {/* Actions for Pending Tasks */}
                  {f.status === 'PENDING' && !isEditing && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
                      <div className="text-[11px] text-slate-400">
                        Review copy and approve dispatch to student.
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(f.id);
                            setEditText(f.suggestedMessage);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit Message
                        </button>

                        <button
                          onClick={() => handleAction(f.id, 'REJECT')}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>

                        <button
                          onClick={() => handleAction(f.id, 'APPROVE')}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
                        >
                          <Send className="w-3.5 h-3.5" /> Approve & Dispatch
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredFollowups.length === 0 && (
              <div className="py-16 text-center text-xs text-slate-500 italic bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                No follow-up reminders matching current filter. All student touchpoints are up to date!
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
