'use client';

import React from 'react';
import { Building2, Bell, Shield, ChevronDown } from 'lucide-react';

interface TopNavProps {
  institute?: any;
  branches?: any[];
  selectedBranchId?: string;
  onSelectBranch?: (id: string) => void;
  title: string;
  subtitle?: string;
}

export default function TopNav({
  institute,
  branches = [],
  selectedBranchId,
  onSelectBranch,
  title,
  subtitle
}: TopNavProps) {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div>
        <h1 className="text-base font-bold text-white leading-tight">{title}</h1>
        {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Multi-Branch Filter Dropdown */}
        {branches.length > 0 && onSelectBranch && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedBranchId || ''}
              onChange={(e) => onSelectBranch(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">All Branches (Global)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-900">
                  {b.city} - {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tenant Protection Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>Tenant Isolated</span>
        </div>

        {/* Notification Bell */}
        <div className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
        </div>
      </div>
    </header>
  );
}
