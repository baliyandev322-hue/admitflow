'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import { 
  Calendar, Clock, Video, MapPin, Plus, CheckCircle2, 
  X, AlertCircle, User, Phone, ChevronRight 
} from 'lucide-react';

export default function SchedulerPage() {
  const [session, setSession] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [counsellors, setCounsellors] = useState<any[]>([]);
  const [showBookModal, setShowBookModal] = useState(false);

  // Form State
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [selectedCounsellorId, setSelectedCounsellorId] = useState('');
  const [slotDate, setSlotDate] = useState('2026-11-10');
  const [slotTime, setSlotTime] = useState('14:00');
  const [mode, setMode] = useState<'ONLINE_MEET' | 'OFFLINE_CAMPUS'>('ONLINE_MEET');
  const [bookingError, setBookingError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const m = await meRes.json();
        setSession(m);
      }

      const aptRes = await fetch('/api/counselling');
      if (aptRes.ok) {
        const data = await aptRes.json();
        setAppointments(data.appointments || []);
      }

      const leadsRes = await fetch('/api/leads');
      if (leadsRes.ok) {
        const lData = await leadsRes.json();
        setLeads(lData.leads || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBookSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    const scheduledAt = new Date(`${slotDate}T${slotTime}:00Z`).toISOString();

    try {
      const res = await fetch('/api/counselling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLeadId,
          scheduledAt,
          counsellorId: selectedCounsellorId || undefined,
          mode
        })
      });

      const data = await res.json();
      if (res.ok) {
        setShowBookModal(false);
        setSelectedLeadId('');
        fetchData();
      } else {
        setBookingError(data.error || 'Failed to book slot');
      }
    } catch (e: any) {
      setBookingError(e.message);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/counselling', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100">
      <Sidebar user={session?.user} institute={session?.institute} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopNav 
          institute={session?.institute}
          branches={session?.branches || []}
          title="Counseling Slot Scheduler"
          subtitle="Prevent double-bookings, coordinate counsellor calendars & send Google Meet links"
        />

        <main className="p-6 space-y-6 flex-1 max-w-7xl w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-white">Upcoming Counseling Sessions</h2>
              <p className="text-xs text-slate-400">Total {appointments.length} appointments scheduled</p>
            </div>

            <button
              onClick={() => setShowBookModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 self-start sm:self-auto transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Book Counseling Slot</span>
            </button>
          </div>

          {/* Appointments Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {appointments.map((apt) => {
              const lead = leads.find(l => l.id === apt.leadId);
              const isPast = new Date(apt.scheduledAt).getTime() < Date.now();

              return (
                <div key={apt.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        apt.status === 'SCHEDULED' 
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : apt.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {apt.status}
                      </span>

                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        {apt.mode === 'ONLINE_MEET' ? (
                          <><Video className="w-3.5 h-3.5 text-indigo-400" /> Online Meet</>
                        ) : (
                          <><MapPin className="w-3.5 h-3.5 text-emerald-400" /> Campus Visit</>
                        )}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-white">{lead?.studentName || 'Prospective Student'}</h3>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{lead?.phone || 'Contact on file'}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{new Date(apt.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">Duration: {apt.durationMinutes} minutes</div>
                      {apt.meetingLink && (
                        <a 
                          href={apt.meetingLink} 
                          target="_blank" 
                          rel="noreferrer"
                          className="block text-[11px] text-indigo-400 font-semibold hover:underline truncate pt-0.5"
                        >
                          {apt.meetingLink}
                        </a>
                      )}
                    </div>
                  </div>

                  {apt.status === 'SCHEDULED' && (
                    <div className="pt-2 flex items-center gap-2 border-t border-slate-800">
                      <button
                        onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold text-xs transition-colors"
                      >
                        Mark Completed
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(apt.id, 'CANCELLED')}
                        className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 font-semibold text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {appointments.length === 0 && (
              <div className="col-span-full py-16 text-center text-xs text-slate-500 italic bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                No counseling slots booked yet. Click "Book Counseling Slot" to schedule a session.
              </div>
            )}
          </div>
        </main>
      </div>

      {/* BOOK SLOT MODAL */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-base">Schedule Counseling Session</h3>
              <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            <form onSubmit={handleBookSlot} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Select Student Lead</label>
                <select
                  required
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                >
                  <option value="">Choose a lead from CRM...</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.studentName} ({l.phone})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={slotDate}
                    onChange={(e) => setSlotDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Slot Time</label>
                  <select
                    value={slotTime}
                    onChange={(e) => setSlotTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  >
                    <option value="10:00">10:00 AM</option>
                    <option value="11:30">11:30 AM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:30">03:30 PM</option>
                    <option value="17:00">05:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Counseling Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('ONLINE_MEET')}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition-colors ${
                      mode === 'ONLINE_MEET' 
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' 
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    Google Meet (Online)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('OFFLINE_CAMPUS')}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition-colors ${
                      mode === 'OFFLINE_CAMPUS' 
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' 
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    Campus Visit (Offline)
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold"
                >
                  Confirm Slot Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
