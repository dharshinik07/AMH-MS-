"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Download, Share2, FileSpreadsheet, Building2, BarChart2, TrendingUp, AlertTriangle, Phone, MessageCircle } from "lucide-react";
import { useHostel } from "@/lib/store";
import { formatRupee, formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";

export function OutstandingReport() {
  const { branches, residents, invoices, rooms, beds, selectedMonth, getBranchMetrics } = useHostel();
  const shouldReduceMotion = useReducedMotion();

  const [agingFilter, setAgingFilter] = useState<"ALL" | "0-7" | "8-30" | "30+">("ALL");

  const todayMs = Date.parse("2026-11-20");

  const unpaidItems = invoices
    .filter((inv) => inv.status !== "paid")
    .map((inv) => {
      const res = residents.find((r) => r.id === inv.resident_id);
      const branch = branches.find((b) => b.id === inv.branch_id);
      const bed = beds.find((b) => b.id === res?.bed_id);
      const room = rooms.find((r) => r.id === bed?.room_id);

      const balance = inv.amount_due + inv.extra_charges - inv.discount - inv.amount_paid;
      const dueMs = Date.parse(inv.due_date);
      const diffTime = todayMs - dueMs;
      const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

      let bucket: "0-7" | "8-30" | "30+" = "0-7";
      if (diffDays > 30) bucket = "30+";
      else if (diffDays >= 8) bucket = "8-30";

      return {
        invoice: inv,
        resident: res,
        branch,
        room,
        balance,
        daysOverdue: diffDays,
        bucket,
      };
    })
    .filter((item) => item.resident && item.branch);

  const bucket0to7 = unpaidItems.filter((i) => i.bucket === "0-7");
  const bucket8to30 = unpaidItems.filter((i) => i.bucket === "8-30");
  const bucket30plus = unpaidItems.filter((i) => i.bucket === "30+");

  const sum0to7 = bucket0to7.reduce((s, i) => s + i.balance, 0);
  const sum8to30 = bucket8to30.reduce((s, i) => s + i.balance, 0);
  const sum30plus = bucket30plus.reduce((s, i) => s + i.balance, 0);
  const totalOutstanding = unpaidItems.reduce((s, i) => s + i.balance, 0);

  const filteredItems = unpaidItems.filter((it) => {
    if (agingFilter !== "ALL" && it.bucket !== agingFilter) return false;
    return true;
  });

  const handleExportCSV = async () => {
    let csv = "Invoice No,Resident Name,Phone,Branch,Room,Due Date,Days Overdue,Outstanding (INR)\n";
    unpaidItems.forEach((it) => {
      csv += `"${it.invoice.invoice_no}","${it.resident?.full_name}","${it.resident?.phone}","${it.branch?.name}","${it.room?.room_no}","${it.invoice.due_date}",${it.daysOverdue},${it.balance}\n`;
    });

    const filename = `Aishwaraya_Hostels_Outstanding_Report_${selectedMonth.replace("-", "")}.csv`;

    if (typeof navigator !== "undefined" && navigator.canShare && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
      try {
        const file = new File([csv], filename, { type: "text/csv" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "Aishwaraya Hostels - Outstanding Dues Report",
            text: `Outstanding rent report: ${unpaidItems.length} residents, Total: ${formatRupee(totalOutstanding)}`,
            files: [file],
          });
          return;
        }
      } catch (err) {
        // Fallback to direct download
      }
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Mock month comparison data for the bar chart (using gold gradient bars, navy line, rose only for outstanding)
  const monthlyTrends = [
    { month: "Aug", expected: 480000, collected: 465000, outstanding: 15000 },
    { month: "Sep", expected: 510000, collected: 495000, outstanding: 15000 },
    { month: "Oct", expected: 525000, collected: 505000, outstanding: 20000 },
    { month: "Nov", expected: 540000, collected: 395000, outstanding: 145000 },
  ];

  return (
    <div className="space-y-8">
      {/* 1. HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8EAEF]">
        <div>
          <h2 className="font-serif-heading text-[24px] sm:text-[28px] text-slate-900 font-bold leading-tight">
            Financial & Aging Reports
          </h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Collection comparison, occupancy trend and aging breakdown across all 8 branches
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="btn-secondary min-h-[44px] justify-center sm:w-auto w-full"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>Export Excel / CSV</span>
        </button>
      </div>

      {/* 2. CHARTS (Gold gradient bars, navy line, rose for outstanding) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Monthly Collection vs Outstanding */}
        <div className="card-ledger p-6 space-y-4">
          <div>
            <h3 className="font-serif-heading text-[18px] text-slate-900 font-bold">
              Monthly Billed vs Collections
            </h3>
            <p className="text-[13px] text-slate-500">
              Gold gradient bars for collected rent, rose for overdue gap
            </p>
          </div>

          <div className="h-52 flex items-end justify-between gap-4 pt-6 border-b border-[#E8EAEF] relative">
            {/* Light Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-dashed border-slate-200 w-full" />
              <div className="border-b border-dashed border-slate-200 w-full" />
              <div className="border-b border-dashed border-slate-200 w-full" />
              <div className="border-b border-dashed border-slate-200 w-full" />
            </div>

            {monthlyTrends.map((t) => {
              const colHeight = Math.round((t.collected / 550000) * 100);
              const outHeight = Math.round((t.outstanding / 550000) * 100);

              return (
                <div key={t.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end z-10">
                  <div className="w-full flex items-end justify-center gap-2 h-full">
                    {/* Collected (Gold gradient) */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${colHeight}%` }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className="w-5 bg-gold-gradient rounded-t-lg shadow-sm"
                      title={`Collected: ${formatRupee(t.collected)}`}
                    />
                    {/* Outstanding (Rose gradient) */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${outHeight}%` }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                      className="w-4 bg-gradient-to-t from-[#D6336C] to-[#A61E4D] rounded-t-lg shadow-xs"
                      title={`Overdue: ${formatRupee(t.outstanding)}`}
                    />
                  </div>
                  <span className="text-[12px] text-slate-600 font-bold truncate">
                    {t.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-5 text-[13px] pt-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-gold-gradient shadow-xs" />
              <span className="text-slate-700 font-medium">Collected Rent</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-gradient-to-r from-[#D6336C] to-[#A61E4D]" />
              <span className="text-slate-700 font-medium">Outstanding / Overdue</span>
            </div>
          </div>
        </div>

        {/* Chart B: Occupancy Trend (Navy trend bars + line) */}
        <div className="card-ledger p-6 space-y-4">
          <div>
            <h3 className="font-serif-heading text-[18px] text-slate-900 font-bold">
              Quarterly Occupancy Stability
            </h3>
            <p className="text-[13px] text-slate-500">
              Average bed occupancy rate across all 8 branches
            </p>
          </div>

          <div className="h-52 flex items-end justify-between gap-6 pt-6 border-b border-[#E8EAEF] relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-dashed border-slate-200 w-full" />
              <div className="border-b border-dashed border-slate-200 w-full" />
              <div className="border-b border-dashed border-slate-200 w-full" />
              <div className="border-b border-dashed border-slate-200 w-full" />
            </div>

            {[
              { label: "Q1 2026", rate: 82 },
              { label: "Q2 2026", rate: 86 },
              { label: "Q3 2026", rate: 91 },
              { label: "Q4 (Current)", rate: 88 },
            ].map((q) => (
              <div key={q.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end z-10">
                <div className="w-full flex items-end justify-center h-full">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${q.rate}%` }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="w-7 bg-gradient-to-t from-[#0F243F] to-[#0A1B30] rounded-t-lg relative group shadow-sm"
                  >
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] font-bold text-white bg-slate-900 px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition">
                      {q.rate}%
                    </span>
                  </motion.div>
                </div>
                <span className="text-[12px] text-slate-600 font-bold">
                  {q.label}
                </span>
              </div>
            ))}
          </div>

          <div className="text-[13px] text-slate-600 pt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span>Consistently operating above 85% occupancy threshold across all 8 branches.</span>
          </div>
        </div>
      </div>

      {/* 3. AGING BREAKDOWN CARDS */}
      <div>
        <h3 className="font-serif-heading text-[18px] text-slate-900 font-bold mb-3">
          Outstanding Rent Aging Analysis
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Bucket 1: 0-7 Days (Grace Period) */}
          <button
            onClick={() => setAgingFilter(agingFilter === "0-7" ? "ALL" : "0-7")}
            className={`p-5 rounded-2xl border text-left transition-all ${
              agingFilter === "0-7"
                ? "bg-[#FDF8EA] border-[#D6AB47] ring-2 ring-[#D6AB47]"
                : "bg-white border-[#E8EAEF] hover:bg-[#FFFDF5]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-wider text-slate-600">
                0-7 Days (Current Grace)
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {bucket0to7.length} records
              </span>
            </div>
            <div className="font-serif-heading text-[24px] font-bold text-slate-900 tabular-nums mt-2">
              {formatRupee(sum0to7)}
            </div>
            <p className="text-[12px] text-slate-500 mt-1">Normal cycle follow-ups</p>
          </button>

          {/* Bucket 2: 8-30 Days (Follow-up) */}
          <button
            onClick={() => setAgingFilter(agingFilter === "8-30" ? "ALL" : "8-30")}
            className={`p-5 rounded-2xl border text-left transition-all ${
              agingFilter === "8-30"
                ? "bg-[#FDF8EA] border-[#D6AB47] ring-2 ring-[#D6AB47]"
                : "bg-white border-[#E8EAEF] hover:bg-[#FFFDF5]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#8A6A1B]">
                8-30 Days (Follow-up)
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F8EDD0] text-[#8A6A1B] border border-[#F8EDD0]">
                {bucket8to30.length} records
              </span>
            </div>
            <div className="font-serif-heading text-[24px] font-bold text-[#8A6A1B] tabular-nums mt-2">
              {formatRupee(sum8to30)}
            </div>
            <p className="text-[12px] text-slate-500 mt-1">WhatsApp reminders queued</p>
          </button>

          {/* Bucket 3: 30+ Days (Critical Overdue in Rose) */}
          <button
            onClick={() => setAgingFilter(agingFilter === "30+" ? "ALL" : "30+")}
            className={`p-5 rounded-2xl border text-left transition-all ${
              agingFilter === "30+"
                ? "bg-[#FFF1F5] border-[#D6336C] ring-2 ring-[#D6336C]"
                : "bg-[#FFF1F5]/40 border-rose-200 hover:bg-[#FFF1F5]/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#A61E4D]">
                30+ Days (Critical Overdue)
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFF1F5] text-[#D6336C] border border-rose-200">
                {bucket30plus.length} records
              </span>
            </div>
            <div className="font-serif-heading text-[24px] font-bold text-[#A61E4D] tabular-nums mt-2">
              {formatRupee(sum30plus)}
            </div>
            <p className="text-[12px] text-[#A61E4D] font-medium mt-1">Requires warden intervention</p>
          </button>
        </div>
      </div>

      {/* 4. AGING INVOICE DRILLDOWN (Dual: Desktop Table + Mobile Cards) */}
      <div className="card-ledger overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-[#E8EAEF] flex items-center justify-between">
          <span className="font-serif-heading text-[16px] font-bold text-slate-900">
            {agingFilter === "ALL" ? "All Unpaid Invoices" : `Aging Bucket: ${agingFilter} Days`}
          </span>
          {agingFilter !== "ALL" && (
            <button
              onClick={() => setAgingFilter("ALL")}
              className="text-[13px] font-bold text-[#8A6A1B] hover:underline min-h-[44px] flex items-center"
            >
              Show All Buckets
            </button>
          )}
        </div>

        {/* DESKTOP TABLE (Hidden on Mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#FDF8EA] border-b border-[#F8EDD0] text-slate-700 font-bold text-[12px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">Resident Name</th>
                <th className="py-3 px-4">Branch / Room</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-center">Days Overdue</th>
                <th className="py-3 px-4 text-right">Outstanding (₹)</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EAEF]">
              {filteredItems.map((it) => (
                <tr key={it.invoice.id} className="hover:bg-[#FFFDF5] bg-white transition">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <Avatar name={it.resident?.full_name || "Resident"} size="sm" />
                      <div>
                        <div className="font-bold text-slate-900">{it.resident?.full_name}</div>
                        <div className="text-[12px] text-slate-500 font-mono">{it.resident?.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{it.branch?.name}</div>
                    <div className="text-[12px] text-slate-500">Room {it.room?.room_no}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 text-[13px]">
                    {formatDate(it.invoice.due_date)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${
                        it.daysOverdue > 30
                          ? "bg-[#FFF1F5] text-[#A61E4D] border border-rose-200"
                          : it.daysOverdue >= 8
                          ? "bg-[#F8EDD0] text-[#8A6A1B] border border-[#F8EDD0]"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {it.daysOverdue} days
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold tabular-nums">
                    <span className={it.daysOverdue >= 8 ? "text-[#A61E4D]" : "text-slate-900"}>
                      {formatRupee(it.balance)}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right">
                    <a
                      href={`https://wa.me/${it.resident?.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        `Dear ${it.resident?.full_name}, this is an urgent reminder from Aishwaraya Hostels & PG. Outstanding dues of ${formatRupee(it.balance)} for Room ${it.room?.room_no} are ${it.daysOverdue} days overdue. Please clear at the counter.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary h-8 px-3 text-[12px]"
                    >
                      Remind
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE AGING CARDS (Shown on Mobile) */}
        <div className="md:hidden divide-y divide-[#E8EAEF]">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-[14px]">
              No outstanding dues matching this aging filter.
            </div>
          ) : (
            filteredItems.map((it) => (
              <div key={it.invoice.id} className="p-4 space-y-3 bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={it.resident?.full_name || "Resident"} size="sm" />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-[14px] truncate">
                        {it.resident?.full_name}
                      </div>
                      <div className="text-[12px] text-slate-500 font-mono">
                        {it.resident?.phone}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      it.daysOverdue > 30
                        ? "bg-[#FFF1F5] text-[#A61E4D] border border-rose-200"
                        : it.daysOverdue >= 8
                        ? "bg-[#F8EDD0] text-[#8A6A1B] border border-[#F8EDD0]"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {it.daysOverdue}d overdue
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#F8F9FC] border border-[#E8EAEF] flex items-center justify-between text-[13px]">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Branch & Room</span>
                    <span className="font-semibold text-slate-800 text-[12px]">
                      {it.branch?.name} • Rm {it.room?.room_no}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 text-[11px] block">Due Amount</span>
                    <span
                      className={`font-bold tabular-nums text-[15px] ${
                        it.daysOverdue >= 8 ? "text-[#A61E4D]" : "text-slate-900"
                      }`}
                    >
                      {formatRupee(it.balance)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={`tel:${it.resident?.phone}`}
                    className="btn-secondary min-h-[44px] flex items-center justify-center gap-2 text-[13px] font-semibold"
                  >
                    <Phone className="w-4 h-4 text-slate-600" />
                    <span>Call</span>
                  </a>

                  <a
                    href={`https://wa.me/${it.resident?.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `Dear ${it.resident?.full_name}, this is an urgent reminder from Aishwaraya Hostels & PG. Outstanding dues of ${formatRupee(it.balance)} for Room ${it.room?.room_no} are ${it.daysOverdue} days overdue. Please clear at the counter.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary min-h-[44px] flex items-center justify-center gap-1.5 text-[13px] font-semibold"
                  >
                    <MessageCircle className="w-4 h-4 text-[#0F243F]" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
