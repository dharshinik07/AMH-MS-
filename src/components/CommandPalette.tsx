"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  UserPlus,
  CreditCard,
  Bed,
  Compass,
  Settings,
  X,
} from "lucide-react";
import { useHostel } from "@/lib/store";
import { formatRupee } from "@/lib/utils";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: string, payload?: any) => void;
}

export function CommandPalette({ isOpen, onClose, onSelectAction }: CommandPaletteProps) {
  const { residents, rooms, branches, invoices, selectedMonth } = useHostel();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredResidents = query.trim()
    ? residents
        .filter(
          (r) =>
            r.full_name.toLowerCase().includes(query.toLowerCase()) ||
            r.phone.includes(query) ||
            r.college_or_company?.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const filteredRooms = query.trim()
    ? rooms
        .filter((rm) => rm.room_no.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 4)
    : [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-[560px] card-ledger overflow-hidden flex flex-col shadow-2xl"
        >
          {/* Search Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]">
            <Search className="w-5 h-5 text-[var(--ink-3)]" />
            <input
              type="text"
              autoFocus
              placeholder="Search tenant name, room number, or action..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-[13px] text-[var(--ink-3)] hover:text-[var(--ink)]">
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--ink-3)] text-[11px] font-mono border border-[var(--border)]">
              ESC
            </kbd>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2 space-y-3">
            {/* Quick Actions */}
            <div>
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-3)]">
                Quick Operations
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    onSelectAction("ADD_RESIDENT");
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-[var(--surface-2)] text-[14px] font-medium text-[var(--ink)] transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-gold-gradient text-[var(--ink)] flex items-center justify-center font-bold">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <span>Add New Resident (&lt; 30s Admission Flow)</span>
                </button>

                <button
                  onClick={() => {
                    onSelectAction("NAVIGATE", "rent");
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-[var(--surface-2)] text-[14px] font-medium text-[var(--ink)] transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ink)] flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span>Rent Collection Ledger</span>
                </button>

                <button
                  onClick={() => {
                    onSelectAction("NAVIGATE", "vacancy");
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-[var(--surface-2)] text-[14px] font-medium text-[var(--ink)] transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ink)] flex items-center justify-center font-bold">
                    <Compass className="w-4 h-4" />
                  </div>
                  <span>Live Vacancy Board (Share Availability)</span>
                </button>

                <button
                  onClick={() => {
                    onSelectAction("NAVIGATE", "settings");
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-[var(--surface-2)] text-[14px] font-medium text-[var(--ink)] transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ink)] flex items-center justify-center font-bold">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span>Hostel Settings & Preferences</span>
                </button>
              </div>
            </div>

            {/* Resident Matches */}
            {filteredResidents.length > 0 && (
              <div>
                <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-3)]">
                  Residents ({filteredResidents.length})
                </div>
                <div className="space-y-0.5">
                  {filteredResidents.map((r) => {
                    const branch = branches.find((b) => b.id === r.branch_id);
                    const inv = invoices.find((i) => i.resident_id === r.id && i.month === selectedMonth);
                    return (
                      <button
                        key={r.id}
                        onClick={() => {
                          onSelectAction("VIEW_RESIDENT", r.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-[var(--surface-2)] transition text-[14px]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-md bg-gold-gradient text-[var(--ink)] flex items-center justify-center font-bold text-[12px] flex-shrink-0">
                            {r.full_name[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[var(--ink)] truncate">
                              {r.full_name}
                            </div>
                            <div className="text-[12px] text-[var(--ink-3)] truncate">
                              {branch?.name} • {r.phone}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-[12px] font-semibold tabular-nums text-[var(--ink)]">
                            {formatRupee(r.monthly_rent)}/mo
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Room Matches */}
            {filteredRooms.length > 0 && (
              <div>
                <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-3)]">
                  Rooms ({filteredRooms.length})
                </div>
                <div className="space-y-0.5">
                  {filteredRooms.map((rm) => {
                    const branch = branches.find((b) => b.id === rm.branch_id);
                    return (
                      <button
                        key={rm.id}
                        onClick={() => {
                          onSelectAction("VIEW_ROOM", rm.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-[var(--surface-2)] transition text-[14px]"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--ink-2)]">
                            <Bed className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--ink)]">
                              Room {rm.room_no} ({rm.room_type})
                            </div>
                            <div className="text-[12px] text-[var(--ink-3)]">{branch?.name} • Floor {rm.floor}</div>
                          </div>
                        </div>
                        <div className="text-[13px] font-semibold text-[var(--ink-2)]">
                          {rm.sharing_capacity} Sharing
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
