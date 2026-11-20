"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  CreditCard,
  Search,
  MoreVertical,
  MessageCircle,
  FileText,
  Download,
  X,
  Check,
  CheckCircle,
  ArrowRightLeft,
  LogOut,
  Send,
  Clock,
  AlertCircle,
  CircleDot,
  Coins,
} from "lucide-react";
import { useHostel } from "@/lib/store";
import { formatRupee, formatDate, generateRentReceiptPDF } from "@/lib/utils";
import { InvoiceStatus, PaymentMode } from "@/types/hostel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";

interface RentCollectionScreenProps {
  onStartTransfer?: (residentId: string) => void;
  onStartVacate?: (residentId: string) => void;
}

export function RentCollectionScreen({
  onStartTransfer,
  onStartVacate,
}: RentCollectionScreenProps) {
  const {
    branches,
    rooms,
    beds,
    residents,
    invoices,
    payments,
    selectedBranchId,
    selectedMonth,
    recordPayment,
  } = useHostel();

  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<InvoiceStatus | "all">("pending");
  const [search, setSearch] = useState("");
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [openMenuInvoiceId, setOpenMenuInvoiceId] = useState<string | null>(null);

  // Collect Modal State
  const [collectTarget, setCollectTarget] = useState<any>(null);
  const [mobileActionInvoice, setMobileActionInvoice] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number>(6500);
  const [payDate, setPayDate] = useState<string>("2026-11-20");
  const [payMode, setPayMode] = useState<PaymentMode>("UPI");
  const [payRef, setPayRef] = useState("");
  const [payNote, setPayNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error", title: string, description?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Month Invoices
  const monthInvoices = invoices.filter((inv) => {
    if (inv.month !== selectedMonth) return false;
    if (selectedBranchId !== "all" && inv.branch_id !== selectedBranchId) return false;
    return true;
  });

  // Category counts and ₹ totals
  const paidList = monthInvoices.filter((i) => i.status === "paid");
  const pendingList = monthInvoices.filter((i) => i.status === "pending");
  const overdueList = monthInvoices.filter((i) => i.status === "overdue");
  const partialList = monthInvoices.filter((i) => i.status === "partial");

  const paidTotal = paidList.reduce((sum, i) => sum + i.amount_paid, 0);
  const pendingTotal = pendingList.reduce((sum, i) => sum + (i.amount_due - i.amount_paid), 0);
  const overdueTotal = overdueList.reduce((sum, i) => sum + (i.amount_due - i.amount_paid), 0);
  const partialTotal = partialList.reduce((sum, i) => sum + (i.amount_due - i.amount_paid), 0);

  // Filtered List
  const displayedInvoices = monthInvoices.filter((inv) => {
    if (activeTab !== "all" && inv.status !== activeTab) return false;
    if (search.trim()) {
      const res = residents.find((r) => r.id === inv.resident_id);
      const rm = rooms.find((r) => r.id === beds.find((b) => b.id === res?.bed_id)?.room_id);
      const q = search.toLowerCase();
      const matchName = res?.full_name.toLowerCase().includes(q);
      const matchPhone = res?.phone.includes(q);
      const matchRoom = rm?.room_no.toLowerCase().includes(q);
      return matchName || matchPhone || matchRoom;
    }
    return true;
  });

  const handleOpenCollect = (inv: any, res: any) => {
    setCollectTarget({ invoice: inv, resident: res });
    const balance = inv.amount_due + inv.extra_charges - inv.discount - inv.amount_paid;
    setPayAmount(balance > 0 ? balance : res.monthly_rent);
    setPayRef("");
    setPayNote("Monthly rent settlement");
  };

  const handleSavePayment = async () => {
    if (!collectTarget || payAmount <= 0) return;
    setIsSubmitting(true);
    try {
      const payment = await recordPayment({
        residentId: collectTarget.resident.id,
        amount: payAmount,
        mode: payMode,
        referenceNo: payRef,
        paidOn: "2026-11-20",
        note: payNote,
      });

      const res = collectTarget.resident;
      const bed = beds.find((b) => b.id === res.bed_id);
      const room = rooms.find((r) => r.id === bed?.room_id);
      const branch = branches.find((b) => b.id === res.branch_id);

      // Auto-trigger PDF receipt download
      generateRentReceiptPDF({
        payment,
        resident: res,
        room: room || rooms[0],
        branch: branch || branches[0],
      });

      addToast(
        "success",
        `Payment of ${formatRupee(payAmount)} Recorded`,
        `Receipt ${payment.receipt_no} generated and downloaded.`
      );
      setCollectTarget(null);
    } catch (err) {
      addToast("error", "Failed to record payment", "Please check your connection and retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedInvoiceIds.length === displayedInvoices.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(displayedInvoices.map((i) => i.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedInvoiceIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkReminders = () => {
    const count = selectedInvoiceIds.length;
    addToast(
      "success",
      `Dispatched WhatsApp Reminders to ${count} Residents`,
      "Official rent notice templates delivered to contacts."
    );
    setSelectedInvoiceIds([]);
  };

  return (
    <div className="space-y-6">
      {/* 1. SEGMENTED COLORED STAT TILES (Acting as tabs with snap scroll on mobile) */}
      <div className="flex md:grid overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory gap-3 sm:gap-4 pb-1 md:pb-0 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            id: "pending" as const,
            label: "Pending",
            count: pendingList.length,
            total: pendingTotal,
            icon: Clock,
            baseClass: "bg-[#FDF8EA] border-[#F8EDD0] text-slate-800",
            iconClass: "text-[#8A6A1B]",
            totalClass: "text-slate-900",
          },
          {
            id: "overdue" as const,
            label: "Overdue (7+ days)",
            count: overdueList.length,
            total: overdueTotal,
            icon: AlertCircle,
            baseClass: "bg-[#FFF1F5] border-rose-200 text-slate-800",
            iconClass: "text-[#D6336C]",
            totalClass: "text-[#A61E4D]",
          },
          {
            id: "partial" as const,
            label: "Partial Paid",
            count: partialList.length,
            total: partialTotal,
            icon: CircleDot,
            baseClass: "bg-white border-[#E8EAEF] text-slate-800",
            iconClass: "text-[#D6AB47]",
            totalClass: "text-slate-900",
          },
          {
            id: "paid" as const,
            label: "Paid / Collected",
            count: paidList.length,
            total: paidTotal,
            icon: CheckCircle,
            baseClass: "bg-gradient-to-r from-[#D6AB47] to-[#E2BF6C] text-[#0F243F] border-transparent shadow-md",
            iconClass: "text-[#0F243F]",
            totalClass: "text-[#0F243F]",
          },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`snap-start shrink-0 min-w-[155px] md:min-w-0 flex-1 relative rounded-2xl p-3.5 sm:p-5 text-left border transition-all duration-200 touch-target ${
                tab.baseClass
              } ${
                isSelected
                  ? "ring-2 ring-[#D6AB47] shadow-lg scale-[1.02]"
                  : "hover:scale-[1.01] hover:shadow-xs opacity-90 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${tab.iconClass}`} />
                  <span className="text-[12px] sm:text-[13px] font-bold truncate">{tab.label}</span>
                </div>
                <span
                  className={`text-[11px] sm:text-[12px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${
                    tab.id === "paid"
                      ? "bg-[#0F243F]/15 text-[#0F243F]"
                      : "bg-white/80 border border-black/5 text-slate-800"
                  }`}
                >
                  {tab.count}
                </span>
              </div>

              <div
                className={`font-serif-heading text-[18px] sm:text-[24px] font-bold tabular-nums mt-2 leading-tight truncate ${tab.totalClass}`}
              >
                {formatRupee(tab.total)}
              </div>

              {/* Downward Notch on Selected Tile */}
              {isSelected && (
                <div className="hidden sm:block absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 border-r border-b border-[#D6AB47] bg-inherit z-10" />
              )}
            </button>
          );
        })}
      </div>

      {/* 2. SEARCH & FILTER ROW (Sticky on scroll) */}
      <div className="card-ledger p-3 sm:p-3.5 flex items-center gap-3 sticky top-14 md:top-16 z-20 bg-white/95 backdrop-blur-md shadow-xs">
        <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
        <input
          type="text"
          placeholder="Filter by resident, phone or room..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-[16px] sm:text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-[13px] text-slate-500 hover:text-slate-900 font-bold pr-2 touch-target"
          >
            Clear
          </button>
        )}
      </div>

      {/* 3. DESKTOP TABLE WITH STICKY HEADER (≥768px) */}
      <div className="hidden md:block card-ledger overflow-hidden relative shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#FDF8EA] border-b border-[#F8EDD0] text-slate-700 font-bold text-[12px] uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      displayedInvoices.length > 0 &&
                      selectedInvoiceIds.length === displayedInvoices.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-[#D6AB47] focus:ring-[#D6AB47]"
                    aria-label="Select all"
                  />
                </th>
                <th className="py-3.5 px-4">Resident</th>
                <th className="py-3.5 px-4">Branch / Room / Bed</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4 text-right">Amount Due</th>
                <th className="py-3.5 px-4 text-right">Paid</th>
                <th className="py-3.5 px-4 text-right">Balance</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EAEF]">
              {displayedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-[#FDF8EA] border border-[#F8EDD0] flex items-center justify-center text-[#8A6A1B]">
                        <Coins className="w-7 h-7" />
                      </div>
                      <h4 className="font-serif-heading text-[17px] font-bold text-slate-900">
                        No payment records match this filter
                      </h4>
                      <p className="text-[13px] text-slate-500">
                        Try switching category tabs above or clearing your search query.
                      </p>
                      {search && (
                        <button
                          onClick={() => setSearch("")}
                          className="btn-secondary h-9 px-4 text-[13px]"
                        >
                          Clear search filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayedInvoices.map((inv) => {
                  const res = residents.find((r) => r.id === inv.resident_id);
                  const bed = beds.find((b) => b.id === res?.bed_id);
                  const room = rooms.find((rm) => rm.id === bed?.room_id);
                  const branch = branches.find((b) => b.id === inv.branch_id);
                  const balance = inv.amount_due + inv.extra_charges - inv.discount - inv.amount_paid;
                  const isChecked = selectedInvoiceIds.includes(inv.id);
                  const isOverdue = inv.status === "overdue";

                  return (
                    <tr
                      key={inv.id}
                      className={`transition duration-150 ${
                        isChecked
                          ? "bg-[#FDF8EA]/70"
                          : isOverdue
                          ? "bg-[#FFF1F5]/20 hover:bg-[#FFF1F5]/40"
                          : "hover:bg-[#FFFDF5] bg-white"
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(inv.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[#D6AB47] focus:ring-[#D6AB47]"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={res?.full_name || "Resident"} size="sm" />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">
                              {res?.full_name}
                            </div>
                            <div className="text-[12px] text-slate-500 truncate">{res?.phone}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-[13px] font-semibold text-slate-800">
                          {branch?.name}
                        </div>
                        <div className="text-[12px] text-slate-500">
                          Room {room?.room_no} • Bed {bed?.bed_label}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[13px] text-slate-700">
                        {inv.due_date ? formatDate(inv.due_date) : "5th of month"}
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-slate-900">
                        {formatRupee(inv.amount_due)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-[#8A6A1B]">
                        {formatRupee(inv.amount_paid)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold tabular-nums">
                        {balance > 0 ? (
                          <span className={isOverdue ? "text-[#A61E4D]" : "text-slate-900"}>
                            {formatRupee(balance)}
                          </span>
                        ) : (
                          <span className="text-[#8A6A1B] font-semibold">₹0</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={inv.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {balance > 0 ? (
                            <button
                              onClick={() => handleOpenCollect(inv, res)}
                              className="btn-primary h-8 px-3 text-[12px] font-bold"
                            >
                              Collect
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const lastPayment = payments.find((p) => p.invoice_id === inv.id);
                                if (lastPayment && res) {
                                  generateRentReceiptPDF({
                                    payment: lastPayment,
                                    resident: res,
                                    room: room || rooms[0],
                                    branch: branch || branches[0],
                                  });
                                }
                              }}
                              className="btn-secondary h-8 px-2.5 text-[12px] font-semibold"
                              title="Download Receipt PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick WhatsApp Reminder */}
                          {res && (
                            <a
                              href={`https://wa.me/${res.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                `Hello ${res.full_name}, this is a gentle reminder regarding hostel rent for ${inv.month}. Balance due: ${formatRupee(balance)}. Please settle at the counter. - Aishwaraya Hostels`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                              title="Send WhatsApp Reminder"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE RESIDENT CARDS LIST (<768px) */}
      <div className="md:hidden space-y-3">
        {displayedInvoices.length === 0 ? (
          <div className="card-ledger p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FDF8EA] border border-[#F8EDD0] flex items-center justify-center text-[#8A6A1B] mx-auto">
              <Coins className="w-6 h-6" />
            </div>
            <h4 className="font-serif-heading text-[16px] font-bold text-slate-900">
              No matching records
            </h4>
            <p className="text-[12px] text-slate-500">
              Switch category tabs above or clear your search query.
            </p>
          </div>
        ) : (
          displayedInvoices.map((inv) => {
            const res = residents.find((r) => r.id === inv.resident_id);
            const bed = beds.find((b) => b.id === res?.bed_id);
            const room = rooms.find((rm) => rm.id === bed?.room_id);
            const branch = branches.find((b) => b.id === inv.branch_id);
            const balance = inv.amount_due + inv.extra_charges - inv.discount - inv.amount_paid;

            return (
              <div
                key={inv.id}
                className="card-ledger p-4 space-y-3 relative overflow-hidden"
              >
                {/* Header: Resident Avatar + Name + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={res?.full_name || "Resident"} size="md" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-[15px] text-[#0F243F] truncate">
                        {res?.full_name}
                      </h4>
                      <p className="text-[12px] text-slate-500 truncate">
                        {branch?.name} • Rm {room?.room_no} ({bed?.bed_label})
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>

                {/* Amount Details */}
                <div className="p-3 rounded-xl bg-[#F6F8FB] border border-[#E3E8EF] flex items-center justify-between text-[12px]">
                  <div>
                    <span className="text-[#6B7A90] block">Due Date</span>
                    <span className="font-semibold text-slate-800">{inv.due_date}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7A90] block">Billed</span>
                    <span className="font-semibold text-slate-800 tabular-nums">
                      {formatRupee(inv.amount_due)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#6B7A90] block">Balance</span>
                    <span
                      className={`font-bold tabular-nums text-[14px] ${
                        balance > 0 ? "text-[#D6336C]" : "text-[#8A6A1B]"
                      }`}
                    >
                      {formatRupee(balance)}
                    </span>
                  </div>
                </div>

                {/* Mobile Action Row */}
                <div className="flex items-center gap-2 pt-1">
                  {balance > 0 ? (
                    <button
                      onClick={() => handleOpenCollect(inv, res)}
                      className="btn-primary flex-1 h-11 text-[13px] font-bold touch-target"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Collect {formatRupee(balance)}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const pmts = payments.filter((p) => p.resident_id === res?.id);
                        const lastPmt = pmts[pmts.length - 1];
                        if (lastPmt && res) {
                          generateRentReceiptPDF({
                            payment: lastPmt,
                            resident: res,
                            room: room || rooms[0],
                            branch: branch || branches[0],
                          });
                        }
                      }}
                      className="btn-secondary flex-1 h-11 text-[13px] font-bold touch-target"
                    >
                      <Download className="w-4 h-4" />
                      <span>Receipt PDF</span>
                    </button>
                  )}

                  {/* WhatsApp Reminder */}
                  {res && balance > 0 && (
                    <a
                      href={`https://wa.me/${res.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        `Hello ${res.full_name}, this is a gentle reminder regarding hostel rent for ${inv.month}. Balance due: ${formatRupee(balance)}. Please settle at the counter. - Aishwaraya Hostels`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-11 h-11 rounded-xl border border-[#E3E8EF] bg-white text-slate-700 hover:text-emerald-700 flex items-center justify-center shrink-0 touch-target"
                      title="WhatsApp Remind"
                    >
                      <MessageCircle className="w-5 h-5 text-emerald-600" />
                    </a>
                  )}

                  {/* More Options "..." */}
                  <button
                    onClick={() => setMobileActionInvoice({ invoice: inv, resident: res, room, branch, balance })}
                    className="w-11 h-11 rounded-xl border border-[#E3E8EF] bg-white text-slate-600 flex items-center justify-center shrink-0 touch-target"
                    aria-label="More actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mobile Action Bottom Sheet ("⋯" menu) */}
      <AnimatePresence>
        {mobileActionInvoice && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="w-full bg-white rounded-t-3xl p-5 pb-safe max-h-[75vh] overflow-y-auto shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E3E8EF]">
                <div>
                  <h3 className="font-bold text-[16px] text-[#0F243F]">
                    {mobileActionInvoice.resident?.full_name}
                  </h3>
                  <p className="text-[12px] text-slate-500">
                    {mobileActionInvoice.branch?.name} • Rm {mobileActionInvoice.room?.room_no}
                  </p>
                </div>
                <button
                  onClick={() => setMobileActionInvoice(null)}
                  className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  onClick={() => {
                    handleOpenCollect(mobileActionInvoice.invoice, mobileActionInvoice.resident);
                    setMobileActionInvoice(null);
                  }}
                  className="w-full h-12 px-3 rounded-xl hover:bg-[#FDF8EA] text-slate-800 flex items-center gap-3 text-[14px] font-semibold"
                >
                  <CreditCard className="w-4 h-4 text-[#8A6A1B]" />
                  <span>Record Rent Payment</span>
                </button>

                {onStartTransfer && (
                  <button
                    onClick={() => {
                      onStartTransfer(mobileActionInvoice.resident.id);
                      setMobileActionInvoice(null);
                    }}
                    className="w-full h-12 px-3 rounded-xl hover:bg-slate-50 text-slate-800 flex items-center gap-3 text-[14px] font-semibold"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-slate-600" />
                    <span>Transfer Room / Branch</span>
                  </button>
                )}

                {onStartVacate && (
                  <button
                    onClick={() => {
                      onStartVacate(mobileActionInvoice.resident.id);
                      setMobileActionInvoice(null);
                    }}
                    className="w-full h-12 px-3 rounded-xl hover:bg-rose-50 text-rose-700 flex items-center gap-3 text-[14px] font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Initiate Vacate Notice</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. BULK ACTION FLOATING BAR */}
      <AnimatePresence>
        {selectedInvoiceIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0F243F] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4"
          >
            <span className="text-[13px] font-semibold text-[#E2BF6C]">
              {selectedInvoiceIds.length} residents selected
            </span>
            <div className="h-4 w-px bg-white/20" />
            <button
              onClick={handleBulkReminders}
              className="btn-primary h-9 px-4 text-[13px]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send WhatsApp Reminders</span>
            </button>
            <button
              onClick={() => setSelectedInvoiceIds([])}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. COLLECT PAYMENT MODAL / BOTTOM SHEET ON MOBILE */}
      <AnimatePresence>
        {collectTarget && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl border border-[#E8EAEF] shadow-2xl overflow-hidden p-5 md:p-6 space-y-4 pb-safe max-h-[90dvh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#E8EAEF] pb-3">
                <div>
                  <h3 className="font-serif-heading text-[18px] text-slate-900 font-bold">
                    Record Payment
                  </h3>
                  <p className="text-[12px] sm:text-[13px] text-slate-500">
                    {collectTarget.resident.full_name} • {collectTarget.invoice.month}
                  </p>
                </div>
                <button
                  onClick={() => setCollectTarget(null)}
                  className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 touch-target"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Amount Received (₹)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="input-ledger font-bold text-[20px] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Payment Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["UPI", "Cash", "Bank"] as PaymentMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPayMode(mode)}
                        className={`h-11 rounded-xl font-bold text-[13px] border transition touch-target ${
                          payMode === mode
                            ? "bg-[#FDF8EA] text-[#8A6A1B] border-[#D6AB47] shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="input-ledger font-medium text-[14px]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Reference / UTR No (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI-20261120-1284"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="input-ledger"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E8EAEF]">
                <button
                  type="button"
                  onClick={() => setCollectTarget(null)}
                  className="btn-secondary flex-1 md:flex-initial h-11 touch-target"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePayment}
                  className="btn-primary flex-1 md:flex-initial h-11 touch-target text-[13px] sm:text-[14px]"
                  disabled={isSubmitting || payAmount <= 0}
                >
                  {isSubmitting ? "Generating..." : "Save & Share Receipt"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
