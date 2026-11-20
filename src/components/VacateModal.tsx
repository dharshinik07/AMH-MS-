"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Download,
  Share2,
  Check,
} from "lucide-react";
import { useHostel } from "@/lib/store";
import { calculateVacateSettlement, generateVacateSettlementPDF, formatRupee, formatDate } from "@/lib/utils";

interface VacateModalProps {
  isOpen: boolean;
  onClose: () => void;
  residentId: string;
}

export function VacateModal({ isOpen, onClose, residentId }: VacateModalProps) {
  const { residents, rooms, beds, branches, invoices, vacateResident } = useHostel();

  const [step, setStep] = useState<number>(1);
  const [vacateDate, setVacateDate] = useState<string>("2026-11-20");
  const [reason, setReason] = useState<string>("Job Relocation");
  const [damagesAmount, setDamagesAmount] = useState<number>(0);
  const [extraCharges, setExtraCharges] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [settlementResult, setSettlementResult] = useState<any>(null);

  if (!isOpen) return null;

  const resident = residents.find((r) => r.id === residentId);
  if (!resident) return null;

  const bed = beds.find((b) => b.id === resident.bed_id);
  const room = rooms.find((rm) => rm.id === bed?.room_id);
  const branch = branches.find((b) => b.id === resident.branch_id);

  const residentInvoices = invoices.filter(
    (i) => i.resident_id === resident.id && i.status !== "paid"
  );
  const unpaidRentSum = residentInvoices.reduce(
    (sum, inv) => sum + (inv.amount_due + inv.extra_charges - inv.discount - inv.amount_paid),
    0
  );

  const settlement = calculateVacateSettlement({
    resident,
    branch: branch || branches[0],
    room: room || rooms[0],
    bedLabel: bed?.bed_label || "Assigned Bed",
    vacateDateStr: vacateDate,
    unpaidInvoicesSum: unpaidRentSum,
    damagesAmount,
    extraCharges,
    reason,
  });

  const handleConfirmVacate = async () => {
    setIsSubmitting(true);
    try {
      await vacateResident({
        residentId,
        vacateDate,
        reason,
        damagesAmount,
        extraCharges,
      });
      setSettlementResult(settlement);
      // Automatically generate and download PDF settlement slip
      generateVacateSettlementPDF(settlement);
      setStep(3);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppVacateMessage = () => {
    return `*Aishwaraya Hostels & PG - Vacate Settlement*
Dear ${resident.full_name},
Your vacate settlement has been calculated for ${formatDate(vacateDate)}.

• Room: ${room?.room_no} (${bed?.bed_label})
• Security Deposit Held: ${formatRupee(settlement.deposit_paid)}
• Unpaid Rent Dues: ${formatRupee(settlement.pending_rent)}
• Damages / Maintenance: ${formatRupee(settlement.damages_charges + settlement.extra_charges)}

${
  settlement.refund_amount > 0
    ? `*NET REFUND TO YOU: ${formatRupee(settlement.refund_amount)}*`
    : `*NET BALANCE DUE: ${formatRupee(settlement.resident_balance_due)}*`
}

Thank you for staying with Aishwaraya Hostels.
Helpline: +91 90434 56234`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        className="w-full max-w-[540px] bg-white rounded-t-3xl sm:rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col h-[100dvh] sm:h-auto sm:max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="font-serif-heading text-[20px] text-[var(--ink)]">
              Vacate & Deposit Settlement
            </h2>
            <p className="text-[13px] text-[var(--ink-3)]">
              2-step fast checkout in under 30 seconds
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--ink-3)] hover:text-[var(--ink)]"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {/* STEP 1: DATE, REASON, DAMAGES */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="card-ledger p-3.5 flex justify-between items-center text-[14px]">
                <div>
                  <div className="font-semibold text-[var(--ink)]">{resident.full_name}</div>
                  <div className="text-[13px] text-[var(--ink-3)]">
                    {branch?.name} • Room {room?.room_no} ({bed?.bed_label})
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] uppercase font-bold text-[var(--ink-3)]">Deposit Held</div>
                  <div className="font-bold tabular-nums text-[var(--ink)]">
                    {formatRupee(resident.deposit_paid)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                  Vacate Date *
                </label>
                <input
                  type="date"
                  value={vacateDate}
                  onChange={(e) => setVacateDate(e.target.value)}
                  className="input-ledger font-medium"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                  Reason for Vacating
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input-ledger font-medium"
                >
                  <option value="Job Relocation">Job Relocation / Office Transfer</option>
                  <option value="Course Completed">College Course Completed</option>
                  <option value="Personal Reasons">Personal / Family Reasons</option>
                  <option value="Moving to Own Flat">Moving to Own Flat</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                    Room Damages / Repairs (₹)
                  </label>
                  <input
                    type="number"
                    value={damagesAmount}
                    onChange={(e) => setDamagesAmount(Number(e.target.value))}
                    className="input-ledger font-bold tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                    Cleaning Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={extraCharges}
                    onChange={(e) => setExtraCharges(Number(e.target.value))}
                    className="input-ledger font-bold tabular-nums"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SETTLEMENT SUMMARY TABLE WITH GOLD-TINT BOX FOR FINAL AMOUNT */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-[13px] font-bold uppercase tracking-wider text-[var(--ink-3)]">
                Settlement Calculation
              </div>

              <div className="card-ledger p-4 space-y-2.5 text-[14px]">
                <div className="flex justify-between">
                  <span className="text-[var(--ink-2)]">Refundable Deposit Held:</span>
                  <span className="font-semibold tabular-nums text-[var(--ink)]">
                    +{formatRupee(settlement.deposit_paid)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[var(--ink-2)]">Pending Rent Dues:</span>
                  <span className="font-semibold tabular-nums text-[var(--ink)]">
                    -{formatRupee(settlement.pending_rent)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[var(--ink-2)]">Damages & Cleaning Fee:</span>
                  <span className="font-semibold tabular-nums text-[var(--ink)]">
                    -{formatRupee(settlement.damages_charges + settlement.extra_charges)}
                  </span>
                </div>

                <div className="h-px bg-[var(--border)] my-2" />

                {/* Gold-Tint Highlight Box for Net Result */}
                <div className="notice-gold p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[12px] font-bold uppercase tracking-wider text-[var(--gold-deep)]">
                      {settlement.refund_amount > 0 ? "Net Refund to Resident" : "Balance Due from Resident"}
                    </div>
                    <div className="text-[13px] text-[var(--ink-2)] mt-0.5">
                      {settlement.refund_amount > 0 ? "To be paid back via UPI or Cash" : "Collect before clearance"}
                    </div>
                  </div>

                  <div className="font-serif-heading text-[24px] text-[var(--ink)] tabular-nums">
                    {formatRupee(
                      settlement.refund_amount > 0
                        ? settlement.refund_amount
                        : settlement.resident_balance_due
                    )}
                  </div>
                </div>
              </div>

              <p className="text-[13px] text-[var(--ink-3)]">
                Confirming will immediately free Bed{" "}
                <span className="font-semibold text-[var(--ink)]">{bed?.bed_label}</span> and archive the resident record.
              </p>
            </div>
          )}

          {/* STEP 3: VACATE CONFIRMED */}
          {step === 3 && settlementResult && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[var(--gold-tint)] border border-[var(--gold-border)] text-[var(--gold-deep)] flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-serif-heading text-[22px] text-[var(--ink)]">
                  Resident Officially Vacated
                </h3>
                <p className="text-[13px] text-[var(--ink-3)] mt-1">
                  Bed <span className="font-semibold text-[var(--ink)]">{bed?.bed_label}</span> is now VACANT on the live Bed-Map.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => generateVacateSettlementPDF(settlementResult)}
                  className="btn-primary w-full"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Clearance Slip</span>
                </button>

                <a
                  href={`https://wa.me/${resident.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                    getWhatsAppVacateMessage()
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary w-full"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Settlement on WhatsApp</span>
                </a>

                <button onClick={onClose} className="btn-ghost w-full">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer (Sticky with Safe Area Inset) */}
        {step < 3 && (
          <div className="p-4 border-t border-[var(--border)] bg-white pb-safe flex items-center justify-between shrink-0 shadow-xs">
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-ghost"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-primary"
              >
                <span>Review Settlement</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmVacate}
                className="btn-primary"
              >
                <LogOut className="w-4 h-4" />
                <span>{isSubmitting ? "Vacating..." : "Confirm & Free Bed"}</span>
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
