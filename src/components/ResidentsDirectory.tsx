"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Phone,
  MessageCircle,
  MoreVertical,
  X,
  CreditCard,
  ArrowRightLeft,
  LogOut,
  FileText,
  User,
  Calendar,
} from "lucide-react";
import { useHostel } from "@/lib/store";
import { formatRupee, formatDate } from "@/lib/utils";
import { Resident, ResidentStatus, FoodPlan } from "@/types/hostel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { PaymentTimelineStrip, MonthPaymentStatus } from "@/components/ui/PaymentTimelineStrip";

interface ResidentsDirectoryProps {
  onStartAddResident: () => void;
  onStartVacate: (residentId: string) => void;
  onStartTransfer: (residentId: string) => void;
  onRecordPayment: (residentId: string) => void;
}

export function ResidentsDirectory({
  onStartAddResident,
  onStartVacate,
  onStartTransfer,
  onRecordPayment,
}: ResidentsDirectoryProps) {
  const {
    branches,
    rooms,
    beds,
    residents,
    invoices,
    payments,
    selectedBranchId,
    selectedMonth,
  } = useHostel();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ResidentStatus | "ALL">("active");
  const [foodFilter, setFoodFilter] = useState<FoodPlan | "ALL">("ALL");
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);
  const [profileTab, setProfileTab] = useState<"overview" | "payments" | "documents" | "notes">("overview");

  const filteredResidents = residents.filter((r) => {
    if (selectedBranchId !== "all" && r.branch_id !== selectedBranchId) return false;
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (foodFilter !== "ALL" && r.food_plan !== foodFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = r.full_name.toLowerCase().includes(q);
      const matchPhone = r.phone.includes(q);
      const matchCompany = r.college_or_company?.toLowerCase().includes(q);
      return matchName || matchPhone || matchCompany;
    }
    return true;
  });

  const activeResident = residents.find((r) => r.id === selectedResidentId);
  const activeResidentRoom = activeResident
    ? rooms.find((rm) => rm.id === beds.find((b) => b.id === activeResident.bed_id)?.room_id)
    : null;
  const activeResidentBranch = activeResident
    ? branches.find((b) => b.id === activeResident.branch_id)
    : null;
  const activeResidentInvoices = activeResident
    ? invoices.filter((i) => i.resident_id === activeResident.id)
    : [];
  const activeResidentPayments = activeResident
    ? payments.filter((p) => p.resident_id === activeResident.id)
    : [];

  const activeResidentCurrentInvoice = activeResident
    ? invoices.find((i) => i.resident_id === activeResident.id && i.month === selectedMonth)
    : null;

  const sampleTimeline: MonthPaymentStatus[] = [
    { month: "Jan", fullMonth: "2026-01", status: "paid", amount: activeResident?.monthly_rent },
    { month: "Feb", fullMonth: "2026-02", status: "paid", amount: activeResident?.monthly_rent },
    { month: "Mar", fullMonth: "2026-03", status: "paid", amount: activeResident?.monthly_rent },
    { month: "Apr", fullMonth: "2026-04", status: "paid", amount: activeResident?.monthly_rent },
    { month: "May", fullMonth: "2026-05", status: "paid", amount: activeResident?.monthly_rent },
    { month: "Jun", fullMonth: "2026-06", status: "paid", amount: activeResident?.monthly_rent },
    { month: "Jul", fullMonth: "2026-07", status: "paid", amount: activeResident?.monthly_rent },
    { month: "Aug", fullMonth: "2026-08", status: "paid", amount: activeResident?.monthly_rent },
    { month: "Sep", fullMonth: "2026-09", status: "paid", amount: activeResident?.monthly_rent },
    { month: "Oct", fullMonth: "2026-10", status: "paid", amount: activeResident?.monthly_rent },
    {
      month: "Nov",
      fullMonth: "2026-11",
      status: activeResidentCurrentInvoice?.status === "paid" ? "paid" : "overdue",
      amount: activeResident?.monthly_rent,
    },
    { month: "Dec", fullMonth: "2026-12", status: "future" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8EAEF]">
        <div>
          <h2 className="font-serif-heading text-[24px] text-slate-900 font-bold">
            Residents Directory
          </h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Managing {residents.filter((r) => r.status === "active").length} active residents across 8 branches
          </p>
        </div>

        <button onClick={onStartAddResident} className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>+ Add New Resident</span>
        </button>
      </div>

      {/* 2. SEARCH & FILTER ROW (Sticky on Mobile) */}
      <div className="card-ledger p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs sticky top-14 md:top-16 z-20 bg-white/95 backdrop-blur-md">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F8F9FC] border border-[#E8EAEF] focus-within:border-[#D6AB47]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search name, mobile or college..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-[16px] sm:text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        {/* Desktop Filter Dropdowns */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-10 px-3 rounded-xl border border-[#E8EAEF] bg-white text-slate-800 text-[13px] font-semibold focus:outline-none focus:border-[#D6AB47]"
          >
            <option value="ALL">All Status</option>
            <option value="active">Active Only</option>
            <option value="notice">Notice Period</option>
            <option value="vacated">Vacated</option>
          </select>

          {/* Food Filter */}
          <select
            value={foodFilter}
            onChange={(e) => setFoodFilter(e.target.value as any)}
            className="h-10 px-3 rounded-xl border border-[#E8EAEF] bg-white text-slate-800 text-[13px] font-semibold focus:outline-none focus:border-[#D6AB47]"
          >
            <option value="ALL">All Food Plans</option>
            <option value="Non-Veg">Non-Veg</option>
            <option value="Veg">Veg</option>
            <option value="No food plan">No food plan</option>
          </select>
        </div>

        {/* Mobile Filter Button */}
        <div className="sm:hidden">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="h-10 px-3.5 rounded-xl border border-[#E8EAEF] bg-white text-slate-700 font-semibold text-[13px] flex items-center gap-2 touch-target"
          >
            <span>Filters</span>
            {(statusFilter !== "ALL" || foodFilter !== "ALL") && (
              <span className="w-2 h-2 rounded-full bg-[#D6AB47]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Resident Cards (<768px) */}
      <div className="md:hidden space-y-3">
        {filteredResidents.length === 0 ? (
          <div className="card-ledger p-8 text-center text-slate-500">
            No residents found matching criteria.
          </div>
        ) : (
          filteredResidents.map((res) => {
            const bed = beds.find((b) => b.id === res.bed_id);
            const room = rooms.find((rm) => rm.id === bed?.room_id);
            const branch = branches.find((b) => b.id === res.branch_id);

            return (
              <div
                key={res.id}
                onClick={() => setSelectedResidentId(res.id)}
                className="card-ledger p-4 space-y-3 transition active:bg-[#FDF8EA]/30 touch-target"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={res.full_name} size="md" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-[15px] text-[#0F243F] truncate">
                        {res.full_name}
                      </h4>
                      <p className="text-[12px] text-slate-500 truncate">
                        {branch?.name} • Rm {room?.room_no} ({bed?.bed_label})
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={res.status} size="sm" />
                </div>

                <div className="p-2.5 rounded-xl bg-[#F6F8FB] border border-[#E3E8EF] flex items-center justify-between text-[12px]">
                  <div>
                    <span className="text-[#6B7A90] block">Rent/mo</span>
                    <span className="font-bold text-[#0F243F] tabular-nums">
                      {formatRupee(res.monthly_rent)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7A90] block">Deposit</span>
                    <span className="font-bold text-[#8A6A1B] tabular-nums">
                      {formatRupee(res.deposit_paid)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#6B7A90] block">Food</span>
                    <span className="font-semibold text-slate-700">{res.food_plan}</span>
                  </div>
                </div>

                {/* Quick Mobile Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`tel:${res.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="btn-secondary flex-1 h-10 text-[12px] font-semibold flex items-center justify-center gap-1.5 touch-target"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-600" />
                    <span>Call</span>
                  </a>
                  <a
                    href={`https://wa.me/${res.phone.replace(/[^0-9]/g, "")}`}
                    onClick={(e) => e.stopPropagation()}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary flex-1 h-10 text-[12px] font-semibold flex items-center justify-center gap-1.5 touch-target text-emerald-700"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedResidentId(res.id);
                    }}
                    className="btn-primary h-10 px-3.5 text-[12px] font-bold touch-target"
                  >
                    Profile
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mobile Filters Bottom Sheet */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <div className="sm:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full bg-white rounded-t-3xl p-5 pb-safe space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E8EAEF]">
                <h3 className="font-bold text-[16px] text-slate-900">Filter Residents</h3>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[12px] font-bold uppercase text-slate-600 mb-1.5">
                  Occupancy Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "ALL", label: "All" },
                    { id: "active", label: "Active" },
                    { id: "notice", label: "Notice" },
                    { id: "vacated", label: "Vacated" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStatusFilter(s.id as any)}
                      className={`h-11 rounded-xl text-[13px] font-bold border transition touch-target ${
                        statusFilter === s.id
                          ? "bg-[#FDF8EA] text-[#8A6A1B] border-[#D6AB47]"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold uppercase text-slate-600 mb-1.5">
                  Food Plan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "ALL", label: "All" },
                    { id: "Veg", label: "Veg" },
                    { id: "Non-Veg", label: "Non-Veg" },
                    { id: "No food plan", label: "No Food" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFoodFilter(f.id as any)}
                      className={`h-11 rounded-xl text-[13px] font-bold border transition touch-target ${
                        foodFilter === f.id
                          ? "bg-[#FDF8EA] text-[#8A6A1B] border-[#D6AB47]"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="btn-primary w-full h-11 text-[14px]"
              >
                Apply Filters
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. RESIDENTS TABLE (Desktop ≥768px) */}
      <div className="hidden md:block card-ledger overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#FDF8EA] border-b border-[#F8EDD0] text-slate-700 font-bold text-[12px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Resident Name</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Branch / Room / Bed</th>
                <th className="py-3.5 px-4">Food</th>
                <th className="py-3.5 px-4 text-right">Rent</th>
                <th className="py-3.5 px-4 text-right">Deposit</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EAEF]">
              {filteredResidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No resident records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredResidents.map((res) => {
                  const bed = beds.find((b) => b.id === res.bed_id);
                  const room = rooms.find((rm) => rm.id === bed?.room_id);
                  const branch = branches.find((b) => b.id === res.branch_id);

                  return (
                    <tr
                      key={res.id}
                      onClick={() => setSelectedResidentId(res.id)}
                      className="h-[58px] hover:bg-[#FFFDF5] cursor-pointer transition bg-white"
                    >
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <Avatar name={res.full_name} size="sm" />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">
                              {res.full_name}
                            </div>
                            <div className="text-[12px] text-slate-500 truncate">
                              {res.college_or_company || res.occupation}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-700 tabular-nums font-mono text-[13px]">
                        {res.phone}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          Room {room?.room_no || "-"} ({bed?.bed_label || "-"})
                        </div>
                        <div className="text-[12px] text-slate-500">{branch?.name}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[12px] font-semibold text-slate-700 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                          {res.food_plan}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-bold tabular-nums text-slate-900">
                        {formatRupee(res.monthly_rent)}
                      </td>

                      <td className="py-3 px-4 text-right tabular-nums text-[#8A6A1B] font-semibold">
                        {formatRupee(res.deposit_paid)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={res.status} size="sm" />
                      </td>

                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedResidentId(res.id);
                          }}
                          className="btn-ghost text-[13px] h-8 px-2.5 font-bold text-[#8A6A1B] hover:bg-[#FDF8EA]"
                        >
                          Details →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Resident Cards (<768px) */}
      <div className="md:hidden space-y-3">
        {filteredResidents.length === 0 ? (
          <div className="card-ledger p-8 text-center text-slate-500">
            No residents found matching criteria.
          </div>
        ) : (
          filteredResidents.map((res) => {
            const bed = beds.find((b) => b.id === res.bed_id);
            const room = rooms.find((rm) => rm.id === bed?.room_id);
            const branch = branches.find((b) => b.id === res.branch_id);

            return (
              <div
                key={res.id}
                onClick={() => setSelectedResidentId(res.id)}
                className="card-ledger p-4 space-y-3 transition active:bg-[#FDF8EA]/30 touch-target"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={res.full_name} size="md" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-[15px] text-[#0F243F] truncate">
                        {res.full_name}
                      </h4>
                      <p className="text-[12px] text-slate-500 truncate">
                        {branch?.name} • Rm {room?.room_no} ({bed?.bed_label})
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={res.status} size="sm" />
                </div>

                <div className="p-2.5 rounded-xl bg-[#F6F8FB] border border-[#E3E8EF] flex items-center justify-between text-[12px]">
                  <div>
                    <span className="text-[#6B7A90] block">Rent/mo</span>
                    <span className="font-bold text-[#0F243F] tabular-nums">
                      {formatRupee(res.monthly_rent)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7A90] block">Deposit</span>
                    <span className="font-bold text-[#8A6A1B] tabular-nums">
                      {formatRupee(res.deposit_paid)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#6B7A90] block">Food</span>
                    <span className="font-semibold text-slate-700">{res.food_plan}</span>
                  </div>
                </div>

                {/* Quick Mobile Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`tel:${res.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="btn-secondary flex-1 h-10 text-[12px] font-semibold flex items-center justify-center gap-1.5 touch-target"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-600" />
                    <span>Call</span>
                  </a>
                  <a
                    href={`https://wa.me/${res.phone.replace(/[^0-9]/g, "")}`}
                    onClick={(e) => e.stopPropagation()}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary flex-1 h-10 text-[12px] font-semibold flex items-center justify-center gap-1.5 touch-target text-emerald-700"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedResidentId(res.id);
                    }}
                    className="btn-primary h-10 px-3.5 text-[12px] font-bold touch-target"
                  >
                    Profile
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. RESIDENT PROFILE: FULL-SCREEN SHEET ON MOBILE, SIDE DRAWER ON DESKTOP */}
      <AnimatePresence>
        {selectedResidentId && activeResident && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="w-full md:max-w-[480px] bg-white h-[100dvh] shadow-2xl flex flex-col justify-between border-l border-[#E8EAEF] overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto">
                {/* Navy Gradient Header */}
                <div className="bg-gradient-to-br from-[#0F243F] to-[#0A1B30] text-white p-5 sm:p-6 pt-safe relative">
                  <button
                    onClick={() => setSelectedResidentId(null)}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center touch-target"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-3.5 mt-2">
                    <Avatar name={activeResident.full_name} size="lg" />
                    <div className="min-w-0 pr-6">
                      <h3 className="font-serif-heading text-[20px] sm:text-[22px] font-bold text-white truncate">
                        {activeResident.full_name}
                      </h3>
                      <p className="text-[12px] sm:text-[13px] text-slate-300 truncate">
                        {activeResidentBranch?.name} • Room {activeResidentRoom?.room_no} (
                        {beds.find((b) => b.id === activeResident.bed_id)?.bed_label})
                      </p>
                      <p className="text-[12px] text-[#E2BF6C] font-mono mt-0.5">
                        {activeResident.phone}
                      </p>
                    </div>
                  </div>

                  {/* Profile Tab Switcher */}
                  <div className="flex items-center gap-1 mt-4 pt-3 border-t border-white/10 overflow-x-auto no-scrollbar">
                    {(["overview", "payments", "documents", "notes"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setProfileTab(tab)}
                        className={`h-8 px-3 rounded-lg text-[12px] font-semibold capitalize shrink-0 transition ${
                          profileTab === tab
                            ? "bg-gold-gradient text-[#0F243F] font-bold shadow-xs"
                            : "text-slate-300 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab 1: Overview Content */}
                {profileTab === "overview" && (
                  <div className="p-4 sm:p-6 space-y-5">
                    {/* Key Numbers */}
                    <div className="grid grid-cols-3 gap-2 p-3 sm:p-4 rounded-2xl bg-[#F8F9FC] border border-[#E8EAEF] text-center">
                      <div>
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Rent
                        </span>
                        <div className="font-serif-heading text-[16px] sm:text-[18px] font-bold text-slate-900 tabular-nums mt-0.5">
                          {formatRupee(activeResident.monthly_rent)}
                        </div>
                      </div>
                      <div className="border-x border-[#E8EAEF]">
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Deposit
                        </span>
                        <div className="font-serif-heading text-[16px] sm:text-[18px] font-bold text-[#8A6A1B] tabular-nums mt-0.5">
                          {formatRupee(activeResident.security_deposit)}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Due
                        </span>
                        <div className="font-serif-heading text-[16px] sm:text-[18px] font-bold text-[#A61E4D] tabular-nums mt-0.5">
                          {formatRupee(
                            activeResidentCurrentInvoice
                              ? activeResidentCurrentInvoice.amount_due - activeResidentCurrentInvoice.amount_paid
                              : 0
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Action Bar (Call & WhatsApp) */}
                    <div className="grid grid-cols-2 gap-3">
                      <a
                        href={`tel:${activeResident.phone}`}
                        className="btn-secondary h-11 text-[13px] flex items-center justify-center gap-2 touch-target"
                      >
                        <Phone className="w-4 h-4 text-slate-600" />
                        <span>Call Phone</span>
                      </a>
                      <a
                        href={`https://wa.me/${activeResident.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary h-11 text-[13px] flex items-center justify-center gap-2 touch-target text-emerald-700"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>WhatsApp</span>
                      </a>
                    </div>

                    {/* 12-Month Payment Strip */}
                    <div className="card-ledger p-4 space-y-2.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        12-Month Rent Payment Ledger
                      </div>
                      <div className="overflow-x-auto no-scrollbar">
                        <PaymentTimelineStrip timeline={sampleTimeline} />
                      </div>
                    </div>

                    {/* Details list */}
                    <div className="space-y-2 text-[13px] sm:text-[14px]">
                      <div className="flex justify-between py-2 border-b border-[#E8EAEF]">
                        <span className="text-slate-500">College / Employer</span>
                        <span className="font-semibold text-slate-800">
                          {activeResident.college_or_company || "Not specified"}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#E8EAEF]">
                        <span className="text-slate-500">Joined Date</span>
                        <span className="font-semibold text-slate-800">
                          {formatDate(activeResident.join_date)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#E8EAEF]">
                        <span className="text-slate-500">Food Plan</span>
                        <span className="font-semibold text-slate-800">
                          {activeResident.food_plan}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#E8EAEF]">
                        <span className="text-slate-500">Emergency Contact</span>
                        <span className="font-semibold text-slate-800 font-mono">
                          {activeResident.emergency_contact || activeResident.parent_phone || "Not recorded"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Payments Content */}
                {profileTab === "payments" && (
                  <div className="p-4 sm:p-6 space-y-3">
                    <h4 className="font-bold text-[14px] text-slate-800">Payment History</h4>
                    {activeResidentPayments.length === 0 ? (
                      <p className="text-[13px] text-slate-500 py-6 text-center">
                        No receipts generated yet for this resident.
                      </p>
                    ) : (
                      activeResidentPayments.map((p) => (
                        <div key={p.id} className="p-3 rounded-xl border border-[#E3E8EF] flex items-center justify-between text-[13px]">
                          <div>
                            <div className="font-bold text-slate-900">{formatRupee(p.amount)}</div>
                            <div className="text-[11px] text-slate-500">{p.paid_on} • {p.mode}</div>
                          </div>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                            {p.receipt_no}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab 3: Documents Content */}
                {profileTab === "documents" && (
                  <div className="p-4 sm:p-6 space-y-3">
                    <h4 className="font-bold text-[14px] text-slate-800">KYC & Documents</h4>
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center space-y-2">
                      <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                      <div className="text-[13px] font-medium text-slate-700">Aadhaar / ID Card on File</div>
                      <div className="text-[11px] text-slate-500">Verified during fast check-in admission</div>
                    </div>
                  </div>
                )}

                {/* Tab 4: Notes Content */}
                {profileTab === "notes" && (
                  <div className="p-4 sm:p-6 space-y-3">
                    <h4 className="font-bold text-[14px] text-slate-800">Resident Notes</h4>
                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-[13px] text-slate-700">
                      Standard admission under 30 days notice rule. Security deposit of {formatRupee(activeResident.security_deposit)} collected.
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Docked at the Bottom with Safe Area */}
              <div className="p-4 sm:p-5 border-t border-[#E8EAEF] bg-white pb-safe space-y-2 shadow-lg">
                <button
                  onClick={() => {
                    onRecordPayment(activeResident.id);
                    setSelectedResidentId(null);
                  }}
                  className="btn-primary w-full h-11 touch-target"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Collect Rent Payment</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onStartTransfer(activeResident.id);
                      setSelectedResidentId(null);
                    }}
                    className="btn-secondary w-full h-11 touch-target"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Transfer Room</span>
                  </button>
                  <button
                    onClick={() => {
                      onStartVacate(activeResident.id);
                      setSelectedResidentId(null);
                    }}
                    className="btn-danger w-full h-11 touch-target"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Vacate Bed</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
