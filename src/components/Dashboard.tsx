"use client";

import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Plus,
  CreditCard,
  Building2,
  ArrowRight,
  Clock,
  AlertCircle,
  Hourglass,
  Bed,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { useHostel } from "@/lib/store";
import { formatRupee } from "@/lib/utils";
import { CountUp } from "@/components/ui/CountUp";
import { Sparkline } from "@/components/ui/Sparkline";
import { IconTile } from "@/components/ui/IconTile";
import { getBranchImage, getBranchCode } from "@/lib/branchAssets";

interface DashboardProps {
  onNavigateToRooms: (branchId?: string) => void;
  onNavigateToRent: () => void;
  onNavigateToVacancy: () => void;
  onStartAddResident: (prefill?: any) => void;
  onStartVacate: (residentId: string) => void;
  onRecordPayment: (residentId: string) => void;
}

export function Dashboard({
  onNavigateToRooms,
  onNavigateToRent,
  onNavigateToVacancy,
  onStartAddResident,
  onStartVacate,
  onRecordPayment,
}: DashboardProps) {
  const {
    currentUser,
    branches,
    residents,
    invoices,
    selectedBranchId,
    setSelectedBranchId,
    selectedMonth,
    getBranchMetrics,
    isDemoMode,
    clearDemoData,
    isPasswordBannerDismissed,
    dismissPasswordBanner,
  } = useHostel();

  const shouldReduceMotion = useReducedMotion();
  const metrics = getBranchMetrics(selectedBranchId);
  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  const totalExpected = metrics.collectedMonth + metrics.pendingMonth;
  const collectionRate =
    totalExpected > 0 ? Math.round((metrics.collectedMonth / totalExpected) * 100) : 0;
  const overduePercent =
    totalExpected > 0 ? Math.round((metrics.overdueMonth / totalExpected) * 100) : 0;
  const pendingNormalPercent = Math.max(0, 100 - collectionRate - overduePercent);

  // Time-based greeting initialized in useEffect for SSR/prerender compatibility
  const [greeting, setGreeting] = useState("Good afternoon");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Filtered residents with overdue or notice
  const overdueResidents = residents
    .filter((r) => {
      if (r.status === "vacated") return false;
      if (selectedBranchId !== "all" && r.branch_id !== selectedBranchId) return false;
      const inv = invoices.find(
        (i) => i.resident_id === r.id && i.month === selectedMonth
      );
      return inv?.status === "overdue";
    })
    .slice(0, 4);

  const noticeResidents = residents
    .filter((r) => {
      if (r.status !== "notice") return false;
      if (selectedBranchId !== "all" && r.branch_id !== selectedBranchId) return false;
      return true;
    })
    .slice(0, 2);

  // Sparkline historical data
  const collectedHistory = [680000, 720000, 780000, 810000, 835000, Math.max(metrics.collectedMonth, 100000)];
  const outstandingHistory = [145000, 130000, 115000, 95000, 105000, Math.max(metrics.totalOutstanding, 10000)];
  const occupancyHistory = [86, 88, 90, 89, 91, Math.max(metrics.occupancyRate, 10)];
  const vacantHistory = [22, 18, 15, 16, 12, Math.max(metrics.vacantBeds, 1)];

  return (
    <div className="space-y-8">
      {/* Demo Data Ribbon */}
      {isDemoMode && (
        <div className="bg-[#F8EDD0] border border-[#D6AB47]/40 text-[#8A6A1B] px-4 py-2.5 rounded-2xl text-[13px] font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded-full bg-[#D6AB47] text-[#0F243F] text-[11px] font-bold uppercase tracking-wider">
              DEMO DATA
            </span>
            <span>Viewing sample residents and rooms for demonstration.</span>
          </div>
          <button
            onClick={() => clearDemoData()}
            className="text-[12px] underline font-bold hover:text-[#0F243F] transition"
          >
            Clear Demo Data
          </button>
        </div>
      )}

      {/* Weak Password Reminder Banner */}
      {currentUser?.uses_initial_password && !isPasswordBannerDismissed && (
        <div className="bg-[#FDF8EA] border border-[#D6AB47]/40 text-[#8A6A1B] p-3.5 sm:p-4 rounded-2xl text-[13px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#F8EDD0] flex items-center justify-center shrink-0 text-[#8A6A1B]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900">Default Password in Use: </span>
              <span className="text-slate-700">You are using the default password. Change it to keep your hostel data safe.</span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => {
                window.location.href = "/settings?section=account";
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gold-gradient text-[#0F243F] font-bold text-[12px] shadow-sm hover:opacity-95 transition cursor-pointer"
            >
              Change password
            </button>
            <button
              onClick={() => dismissPasswordBanner()}
              className="text-slate-400 hover:text-slate-700 text-[12px] font-semibold px-2 py-1 cursor-pointer"
              aria-label="Dismiss banner"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 1. WELCOME HERO BANNER (Full-width card, ~140px tall, radius 24px) */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#0F243F] to-[#152A45] p-5 sm:p-8 text-white overflow-hidden shadow-xl border border-[#293C55]">
        {/* Soft gold radial glow in top right */}
        <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(214,171,71,0.14)_0%,transparent_70%)] pointer-events-none" />

        {/* Diagonal subtle line pattern at 5% opacity */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #FFF 0, #FFF 1px, transparent 0, transparent 14px)",
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-[#293C55] text-[11px] sm:text-[12px] font-semibold text-white mb-2 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[#D6AB47]" />
              <span className="truncate">Aishwaraya Hostels & PG • 8 Branches</span>
            </div>
            <h2 className="font-serif-heading text-[22px] sm:text-[32px] font-bold text-white tracking-tight leading-tight">
              {greeting},{" "}
              <span className="bg-gradient-to-r from-[#D6AB47] to-[#E2BF6C] bg-clip-text text-transparent font-serif-heading font-bold">
                Sundararajan
              </span>
            </h2>
            <p className="text-[12px] sm:text-[14px] text-[#B8C4D4] mt-1">
              Nov 2026 • {metrics.overdueResidentsCount} residents overdue 7+ days across active PG beds
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0 w-full sm:w-auto">
            {/* Gold primary "+ Add Resident" button */}
            <button
              onClick={() => onStartAddResident()}
              className="btn-primary w-full sm:w-auto h-11 justify-center touch-target"
            >
              <Plus className="w-4 h-4 text-[#0F243F]" />
              <span>+ Add Resident</span>
            </button>

            {/* Outline button on navy */}
            <button
              onClick={onNavigateToRent}
              className="h-11 px-4 rounded-xl bg-transparent hover:bg-white/[0.08] text-white font-semibold text-[14px] border border-white/35 transition flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] w-full sm:w-auto touch-target"
            >
              <CreditCard className="w-4 h-4 text-[#D6AB47]" />
              <span>Record Payment</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. FOUR KPI CARDS IN A 2x2 GRID ON MOBILE, 4 ON DESKTOP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
        {/* KPI 1: Collected (Cream gradient card #FDF8EA -> #FFFFFF with gold progress bar + sparkline) */}
        <div className="rounded-2xl p-3.5 sm:p-5 border border-[#E2BF6C]/40 bg-gradient-to-br from-[#FDF8EA] via-white to-white shadow-[0_4px_20px_rgba(214,171,71,0.08)] flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1">
          <div>
            <div className="flex items-center justify-between gap-1.5">
              <IconTile variant="gold" size="sm">
                <CheckCircle2 className="w-4 h-4 text-[#8A6A1B]" />
              </IconTile>
              <div className="hidden xs:block shrink-0">
                <Sparkline data={collectedHistory} color="gold" width={56} height={24} />
              </div>
            </div>

            <span className="text-[10.5px] sm:text-[12px] font-bold uppercase tracking-wider text-[#6B7A90] block mt-2 sm:mt-3 truncate">
              Collected ({selectedMonth})
            </span>
            <div className="font-serif-heading text-[20px] sm:text-[28px] md:text-[32px] font-bold text-[#0F243F] mt-0.5 leading-tight truncate">
              <CountUp value={metrics.collectedMonth} isCurrency />
            </div>
            <div className="text-[11px] sm:text-[13px] text-[#44546A] mt-0.5 sm:mt-1 truncate">
              <span className="font-semibold text-[#8A6A1B]">{collectionRate}%</span> of {formatRupee(totalExpected)} billed
            </div>
          </div>

          <div className="mt-2.5 sm:mt-4 pt-1 sm:pt-2">
            <div className="w-full bg-[#E9EDF3] h-2 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gold-gradient shadow-xs"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(collectionRate, 4)}%` }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        </div>

        {/* KPI 2: Outstanding (White card with rose accent bar on left + sparkline) */}
        <div className="rounded-2xl p-3.5 sm:p-5 border-l-4 border-l-[#D6336C] border border-[#E3E8EF] bg-white shadow-sm flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1">
          <div>
            <div className="flex items-center justify-between gap-1.5">
              <IconTile variant="rose" size="sm">
                <AlertCircle className="w-4 h-4 text-[#D6336C]" />
              </IconTile>
              <div className="hidden xs:block shrink-0">
                <Sparkline data={outstandingHistory} color="rose" width={56} height={24} />
              </div>
            </div>

            <span className="text-[10.5px] sm:text-[12px] font-bold uppercase tracking-wider text-[#6B7A90] block mt-2 sm:mt-3 truncate">
              Total Outstanding
            </span>
            <div className="font-serif-heading text-[20px] sm:text-[28px] md:text-[32px] font-bold text-[#A61E4D] mt-0.5 leading-tight truncate">
              <CountUp value={metrics.totalOutstanding} isCurrency />
            </div>
            <div className="text-[11px] sm:text-[13px] text-[#44546A] mt-0.5 sm:mt-1 truncate">
              <span className="font-semibold text-[#A61E4D]">{metrics.overdueResidentsCount}</span> overdue 7+ days
            </div>
          </div>

          <div className="mt-2.5 sm:mt-4 pt-1 sm:pt-2">
            <button
              onClick={onNavigateToRent}
              className="text-[11.5px] sm:text-[13px] font-bold text-[#8A6A1B] hover:underline inline-flex items-center gap-1"
            >
              <span className="inline sm:hidden">Ledger</span>
              <span className="hidden sm:inline">View collection ledger</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI 3: Occupancy (Mini donut in gold on #EEF2F7 track + sparkline) */}
        <div className="rounded-2xl p-3.5 sm:p-5 border border-[#E3E8EF] bg-white shadow-sm flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1">
          <div>
            <div className="flex items-center justify-between gap-1.5">
              {/* Mini donut with SVG linearGradient */}
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 -rotate-90">
                  <defs>
                    <linearGradient id="goldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#D6AB47" />
                      <stop offset="100%" stopColor="#E2BF6C" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="16"
                    cy="16"
                    r="12"
                    stroke="#EEF2F7"
                    strokeWidth="3.5"
                    fill="none"
                    className="sm:hidden"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="12"
                    stroke="url(#goldStroke)"
                    strokeWidth="3.5"
                    strokeDasharray="75.4"
                    strokeDashoffset={75.4 - (75.4 * metrics.occupancyRate) / 100}
                    strokeLinecap="round"
                    fill="none"
                    className="sm:hidden"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="15"
                    stroke="#EEF2F7"
                    strokeWidth="4"
                    fill="none"
                    className="hidden sm:block"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="15"
                    stroke="url(#goldStroke)"
                    strokeWidth="4"
                    strokeDasharray="94.2"
                    strokeDashoffset={94.2 - (94.2 * metrics.occupancyRate) / 100}
                    strokeLinecap="round"
                    fill="none"
                    className="hidden sm:block"
                  />
                </svg>
                <span className="absolute text-[9px] sm:text-[10px] font-bold text-[#8A6A1B]">
                  {metrics.occupancyRate}%
                </span>
              </div>
              <div className="hidden xs:block shrink-0">
                <Sparkline data={occupancyHistory} color="gold" width={56} height={24} />
              </div>
            </div>

            <span className="text-[10.5px] sm:text-[12px] font-bold uppercase tracking-wider text-[#6B7A90] block mt-2 sm:mt-3 truncate">
              Bed Occupancy
            </span>
            <div className="font-serif-heading text-[20px] sm:text-[28px] md:text-[32px] font-bold text-[#0F243F] mt-0.5 leading-tight truncate">
              <CountUp value={metrics.occupancyRate} suffix="%" />
            </div>
            <div className="text-[11px] sm:text-[13px] text-[#44546A] mt-0.5 sm:mt-1 truncate">
              <span className="font-semibold text-[#0F243F]">{metrics.occupiedBeds}</span> of {metrics.totalBeds} beds
            </div>
          </div>

          <div className="mt-2.5 sm:mt-4 pt-1 sm:pt-2">
            <button
              onClick={() => onNavigateToRooms(selectedBranchId)}
              className="text-[11.5px] sm:text-[13px] font-bold text-[#44546A] hover:text-[#0F243F] hover:underline inline-flex items-center gap-1"
            >
              <span className="inline sm:hidden">Bed-map</span>
              <span className="hidden sm:inline">Explore bed-map</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI 4: Vacant Beds (Navy card #0F243F with white text and gold number) */}
        <div className="rounded-2xl p-3.5 sm:p-5 bg-[#0F243F] border border-[#293C55] text-white shadow-xl flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1">
          <div>
            <div className="flex items-center justify-between gap-1.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#D6AB47] border border-white/10 shrink-0">
                <Bed className="w-4 h-4" />
              </div>
              <div className="hidden xs:block shrink-0">
                <Sparkline data={vacantHistory} color="gold" width={56} height={24} />
              </div>
            </div>

            <span className="text-[10.5px] sm:text-[12px] font-bold uppercase tracking-wider text-[#B8C4D4] block mt-2 sm:mt-3 truncate">
              Vacant Beds
            </span>
            <div className="font-serif-heading text-[20px] sm:text-[28px] md:text-[32px] font-bold text-[#D6AB47] mt-0.5 leading-tight truncate">
              <CountUp value={metrics.vacantBeds} />
            </div>
            <div className="text-[11px] sm:text-[13px] text-[#B8C4D4] mt-0.5 sm:mt-1 truncate">
              Ready for admission
            </div>
          </div>

          <div className="mt-2.5 sm:mt-4 pt-1 sm:pt-2">
            <button
              onClick={onNavigateToVacancy}
              className="text-[11.5px] sm:text-[13px] font-bold text-[#D6AB47] hover:underline inline-flex items-center gap-1"
            >
              <span className="inline sm:hidden">Vacancy</span>
              <span className="hidden sm:inline">Open vacancy board</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. COLLECTION PROGRESS CARD (Segmented bar: Collected [bg-gold-gradient], Pending [gold striped], Overdue [rose gradient]) */}
      <div className="card-ledger p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif-heading text-[18px] text-[#0F243F] font-bold">
              Monthly Rent Collection Progress
            </h3>
            <p className="text-[13px] text-[#6B7A90]">
              Billed for {selectedMonth} across active resident contracts
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[13px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gold-gradient shadow-xs" />
              <span className="text-[#44546A]">Collected:</span>
              <span className="font-bold tabular-nums text-[#0F243F]">
                {formatRupee(metrics.collectedMonth)} ({collectionRate}%)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-striped-gold border border-[#F8EDD0]" />
              <span className="text-[#44546A]">Pending:</span>
              <span className="font-bold tabular-nums text-[#0F243F]">
                {formatRupee(Math.max(0, metrics.pendingMonth - metrics.overdueMonth))} ({pendingNormalPercent}%)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-[#D6336C] to-[#A61E4D]" />
              <span className="text-[#44546A]">Overdue:</span>
              <span className="font-bold tabular-nums text-[#A61E4D]">
                {formatRupee(metrics.overdueMonth)} ({overduePercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* The 14px Rounded Segmented Progress Bar on #E9EDF3 Track */}
        <div className="w-full h-3.5 bg-[#E9EDF3] rounded-full overflow-hidden flex p-0.5 gap-1 border border-[#E3E8EF]">
          {/* Collected Segment */}
          <motion.div
            style={{ width: `${Math.max(collectionRate, 3)}%` }}
            className="h-full rounded-full bg-gold-gradient shadow-xs"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(collectionRate, 3)}%` }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
            title={`Collected: ${collectionRate}%`}
          />

          {/* Pending Segment with stripes */}
          <motion.div
            style={{ width: `${Math.max(pendingNormalPercent, 3)}%` }}
            className="h-full rounded-full bg-striped-gold border border-[#F8EDD0]"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(pendingNormalPercent, 3)}%` }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            title={`Pending: ${pendingNormalPercent}%`}
          />

          {/* Overdue Segment */}
          <motion.div
            style={{ width: `${Math.max(overduePercent, 3)}%` }}
            className="h-full rounded-full bg-gradient-to-r from-[#D6336C] to-[#A61E4D]"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(overduePercent, 3)}%` }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            title={`Overdue: ${overduePercent}%`}
          />
        </div>
      </div>

      {/* If branch has no rooms setup yet, show owner setup callout */}
      {!metrics.hasRooms && selectedBranchId !== "all" && (
        <div className="card-ledger p-8 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FDF8EA] text-[#8A6A1B] flex items-center justify-center border border-[#F8EDD0]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-serif-heading text-[18px] font-bold text-[#0F243F]">
              No rooms set up yet {selectedBranch ? `for ${selectedBranch.name}` : ""}
            </h4>
            <p className="text-[13px] text-[#6B7A90] mt-1 max-w-sm">
              Configure room numbers, floors, sharing types, and rent rates in Settings → Branches & Rooms.
            </p>
          </div>
          <a href="/settings" className="btn-primary mt-1">
            <span>Set up rooms</span>
          </a>
        </div>
      )}

      {/* 4. BRANCHES PERFORMANCE TABLE with 48px Photo Thumbnails & Gold Occupancy Bar */}
      <div className="card-ledger overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E3E8EF] flex items-center justify-between">
          <div>
            <h3 className="font-serif-heading text-[18px] text-[#0F243F] font-bold">
              Branch Performance
            </h3>
            <p className="text-[13px] text-[#6B7A90]">
              Click any branch row to filter the entire console
            </p>
          </div>
          {selectedBranchId !== "all" && (
            <button
              onClick={() => setSelectedBranchId("all")}
              className="text-[13px] font-bold text-[#8A6A1B] hover:underline"
            >
              Reset to All 8 Branches
            </button>
          )}
        </div>

        {/* Desktop Table (≥768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#FDF8EA] border-b border-[#F8EDD0] text-[#0F243F] font-bold text-[12px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Branch</th>
                <th className="py-3.5 px-4">Occupancy</th>
                <th className="py-3.5 px-4 text-right">Collected ({selectedMonth})</th>
                <th className="py-3.5 px-4 text-right">Outstanding (₹)</th>
                <th className="py-3.5 px-4 text-center">Vacant</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E8EF]">
              {branches.map((b, index) => {
                const bMetrics = getBranchMetrics(b.id);
                const isSelected = selectedBranchId === b.id;
                const branchCode = getBranchCode(b.id, b.name);
                const branchImg = getBranchImage(index);

                return (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedBranchId(b.id)}
                    className={`cursor-pointer transition duration-150 ${
                      isSelected
                        ? "bg-[#FDF8EA] border-l-4 border-l-[#D6AB47]"
                        : "hover:bg-[#FFFDF6] bg-white"
                    }`}
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        {/* 48px Photo Thumbnail from Unsplash */}
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[#E3E8EF] shadow-sm">
                          <img
                            src={branchImg}
                            alt={b.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          <span className="absolute bottom-0.5 left-1 text-[9px] font-bold text-[#F8EDD0] tracking-wider">
                            {branchCode}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="font-bold text-[#0F243F] flex items-center gap-2 truncate">
                            <span>{b.name}</span>
                            {isSelected && (
                              <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#F8EDD0] text-[#8A6A1B] border border-[#E2BF6C]">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="text-[13px] text-[#6B7A90] truncate">{b.landmark}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[12px] font-semibold text-[#0F243F]">
                          <span>{bMetrics.occupancyRate}%</span>
                          <span className="text-[#6B7A90] tabular-nums">
                            {bMetrics.occupiedBeds}/{bMetrics.totalBeds}
                          </span>
                        </div>
                        <div className="w-24 bg-[#EEF2F7] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gold-gradient h-full rounded-full"
                            style={{ width: `${bMetrics.occupancyRate}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right font-bold tabular-nums text-[#0F243F]">
                      {formatRupee(bMetrics.collectedMonth)}
                    </td>

                    <td className="py-4 px-4 text-right font-bold tabular-nums">
                      {bMetrics.totalOutstanding > 0 ? (
                        <span className="text-[#A61E4D]">
                          {formatRupee(bMetrics.totalOutstanding)}
                        </span>
                      ) : (
                        <span className="text-[#8A6A1B] font-semibold">₹0</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex px-2.5 py-1 rounded-lg text-[13px] font-bold bg-[#F6F8FB] border border-[#E3E8EF] text-[#0F243F]">
                        {bMetrics.vacantBeds}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBranchId(b.id);
                          onNavigateToRooms(b.id);
                        }}
                        className="btn-ghost text-[13px] h-9 px-3 inline-flex items-center gap-1.5 font-bold text-[#8A6A1B] hover:bg-[#FDF8EA]"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Branch Cards List (<768px) */}
        <div className="md:hidden divide-y divide-[#E3E8EF]">
          {branches.map((b, index) => {
            const bMetrics = getBranchMetrics(b.id);
            const isSelected = selectedBranchId === b.id;
            const branchCode = getBranchCode(b.id, b.name);
            const branchImg = getBranchImage(index);

            return (
              <div
                key={b.id}
                onClick={() => setSelectedBranchId(b.id)}
                className={`p-4 transition active:bg-[#FDF8EA] touch-target ${
                  isSelected ? "bg-[#FDF8EA] border-l-4 border-l-[#D6AB47]" : "bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[#E3E8EF] shadow-xs">
                    <img
                      src={branchImg}
                      alt={b.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className="absolute bottom-0.5 left-1 text-[9px] font-bold text-[#F8EDD0]">
                      {branchCode}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-[14px] text-[#0F243F] truncate">{b.name}</h4>
                      <span className="text-[12px] font-bold text-[#8A6A1B] shrink-0">
                        {bMetrics.occupancyRate}%
                      </span>
                    </div>
                    <div className="text-[12px] text-[#6B7A90] truncate">{b.landmark || b.address}</div>
                  </div>
                </div>

                <div className="w-full bg-[#EEF2F7] h-1.5 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-gold-gradient h-full rounded-full"
                    style={{ width: `${bMetrics.occupancyRate}%` }}
                  />
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#F0F2F5] flex items-center justify-between text-[12px]">
                  <div>
                    <span className="text-[#6B7A90]">Col: </span>
                    <span className="font-bold text-[#0F243F] tabular-nums">
                      {formatRupee(bMetrics.collectedMonth)}
                    </span>
                  </div>
                  <div>
                    {bMetrics.totalOutstanding > 0 ? (
                      <span className="font-bold text-[#D6336C] tabular-nums">
                        {formatRupee(bMetrics.totalOutstanding)} due
                      </span>
                    ) : (
                      <span className="text-[#8A6A1B] font-semibold">Cleared</span>
                    )}
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-[#EEF2F7] text-[#0F243F] font-bold text-[11px] tabular-nums">
                    {bMetrics.vacantBeds} vac
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. NEEDS ATTENTION LIST */}
      <div className="card-ledger p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E3E8EF]">
          <div>
            <h3 className="font-serif-heading text-[18px] text-[#0F243F] font-bold">
              Needs Attention
            </h3>
            <p className="text-[13px] text-[#6B7A90]">
              Overdue rent settlements and upcoming vacate notices
            </p>
          </div>
          <button
            onClick={onNavigateToRent}
            className="text-[13px] font-bold text-[#8A6A1B] hover:underline"
          >
            Open Rent Ledger
          </button>
        </div>

        <div className="space-y-2.5">
          {overdueResidents.length === 0 && noticeResidents.length === 0 ? (
            <p className="text-[14px] text-[#6B7A90] py-6 text-center">
              All resident accounts are in good standing!
            </p>
          ) : (
            <>
              {/* Overdue residents */}
              {overdueResidents.map((r) => {
                const b = branches.find((branch) => branch.id === r.branch_id);
                const inv = invoices.find(
                  (i) => i.resident_id === r.id && i.month === selectedMonth
                );
                const balance = inv ? inv.amount_due - inv.amount_paid : r.monthly_rent;

                return (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-2xl border border-rose-100 bg-[#FFF1F5]/40 hover:bg-[#FFF1F5]/80 transition flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <IconTile variant="rose" size="sm">
                        <AlertCircle className="w-4 h-4 text-[#D6336C]" />
                      </IconTile>
                      <div className="min-w-0">
                        <div className="text-[14px] font-bold text-[#0F243F] truncate">
                          {r.full_name}
                        </div>
                        <div className="text-[13px] text-[#44546A] truncate">
                          {b?.name} • Due since {inv?.due_date || "5th"} • <span className="text-[#A61E4D] font-bold">Overdue {formatRupee(balance)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onRecordPayment(r.id)}
                        className="btn-primary h-11 sm:h-9 px-3.5 text-[13px] touch-target"
                      >
                        Collect
                      </button>
                      <a
                        href={`https://wa.me/${r.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ghost h-11 sm:h-9 px-3 text-[13px] text-[#44546A] hover:bg-white touch-target flex items-center justify-center"
                      >
                        Remind
                      </a>
                    </div>
                  </div>
                );
              })}

              {/* Notice Residents */}
              {noticeResidents.map((r) => {
                const b = branches.find((branch) => branch.id === r.branch_id);
                return (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-2xl border border-[#F8EDD0] bg-[#FDF8EA]/60 hover:bg-[#FDF8EA] transition flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <IconTile variant="gold" size="sm">
                        <Hourglass className="w-4 h-4 text-[#8A6A1B]" />
                      </IconTile>
                      <div className="min-w-0">
                        <div className="text-[14px] font-bold text-[#0F243F] truncate">
                          {r.full_name} (30-Day Notice)
                        </div>
                        <div className="text-[13px] text-[#44546A] truncate">
                          {b?.name} • Notice given on {r.notice_date || "Nov 10"}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onStartVacate(r.id)}
                      className="btn-secondary h-9 px-3.5 text-[13px]"
                    >
                      Settle & Vacate
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
