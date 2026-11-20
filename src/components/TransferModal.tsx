"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRightLeft, X, Check, Bed } from "lucide-react";
import { useHostel } from "@/lib/store";
import { formatRupee } from "@/lib/utils";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  residentId: string;
}

export function TransferModal({ isOpen, onClose, residentId }: TransferModalProps) {
  const { residents, branches, rooms, beds, transferResident } = useHostel();

  const resident = residents.find((r) => r.id === residentId);

  const [targetBranchId, setTargetBranchId] = useState<string>("");
  const [targetRoomId, setTargetRoomId] = useState<string>("");
  const [targetBedId, setTargetBedId] = useState<string>("");
  const [effectiveDate, setEffectiveDate] = useState<string>("2026-11-20");
  const [newRent, setNewRent] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);

  useEffect(() => {
    if (resident) {
      setTargetBranchId(resident.branch_id || branches[0]?.id || "");
      setNewRent(resident.monthly_rent);
    }
  }, [resident, branches]);

  if (!isOpen || !resident) return null;

  const currentBed = beds.find((b) => b.id === resident.bed_id);
  const currentRoom = rooms.find((r) => r.id === currentBed?.room_id);
  const currentBranch = branches.find((b) => b.id === resident.branch_id);

  const availableRooms = rooms.filter((r) => r.branch_id === targetBranchId);
  const targetRoom = rooms.find((r) => r.id === targetRoomId);
  const availableBeds = beds.filter((b) => b.room_id === targetRoomId && b.status === "vacant");

  const handleRoomSelect = (roomId: string) => {
    setTargetRoomId(roomId);
    setTargetBedId("");
    const rm = rooms.find((r) => r.id === roomId);
    if (rm) {
      setNewRent(rm.monthly_rent_per_bed ?? resident.monthly_rent);
    }
  };

  const handleExecuteTransfer = async () => {
    if (!targetBedId || !targetRoomId || !targetBranchId) return;
    setIsSubmitting(true);
    try {
      await transferResident({
        residentId,
        newBedId: targetBedId,
        newRoomId: targetRoomId,
        newBranchId: targetBranchId,
        newRent,
        effectiveDate,
      });
      setIsDone(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-[480px] card-ledger p-6 space-y-4"
      >
        {isDone ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-[var(--gold-tint)] border border-[var(--gold-border)] text-[var(--gold-deep)] flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-serif-heading text-[20px] text-[var(--ink)]">
                Bed Transfer Successful!
              </h3>
              <p className="text-[13px] text-[var(--ink-3)] mt-1">
                {resident.full_name} moved to Room {targetRoom?.room_no} in{" "}
                {branches.find((b) => b.id === targetBranchId)?.name}.
              </p>
            </div>
            <button onClick={onClose} className="btn-primary w-full">
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="font-serif-heading text-[20px] text-[var(--ink)]">
                  Transfer Bed / Branch
                </h3>
                <p className="text-[13px] text-[var(--ink-3)]">{resident.full_name}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-[var(--ink-3)] hover:text-[var(--ink)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="card-ledger p-3 text-[13px] text-[var(--ink-3)]">
              <span className="font-semibold text-[var(--ink)]">Current Stay:</span>
              <p>
                {currentBranch?.name} • Room {currentRoom?.room_no} ({currentBed?.bed_label}) •{" "}
                {formatRupee(resident.monthly_rent)}/mo
              </p>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                1. Select Destination Branch
              </label>
              <select
                value={targetBranchId}
                onChange={(e) => {
                  setTargetBranchId(e.target.value);
                  setTargetRoomId("");
                  setTargetBedId("");
                }}
                className="input-ledger font-medium"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                2. Select Destination Room
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                {availableRooms.map((rm) => {
                  const vac = beds.filter((b) => b.room_id === rm.id && b.status === "vacant").length;
                  const isSel = targetRoomId === rm.id;
                  return (
                    <button
                      key={rm.id}
                      type="button"
                      disabled={vac === 0}
                      onClick={() => handleRoomSelect(rm.id)}
                      className={`p-2 rounded-xl border text-left text-[13px] transition ${
                        isSel
                          ? "border-[var(--gold)] bg-[var(--gold-tint)] ring-2 ring-[var(--gold)]"
                          : vac === 0
                          ? "opacity-40 cursor-not-allowed bg-[var(--surface-2)] border-[var(--border)]"
                          : "bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-2)]"
                      }`}
                    >
                      <div className="font-semibold text-[var(--ink)]">Room {rm.room_no}</div>
                      <div className="text-[11px] text-[var(--ink-3)]">
                        {rm.room_type} • {vac} Vacant
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {targetRoomId && (
              <div>
                <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                  3. Select Bed
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableBeds.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setTargetBedId(b.id)}
                      className={`p-2.5 rounded-xl border text-[13px] font-semibold transition flex items-center justify-center gap-1.5 ${
                        targetBedId === b.id
                          ? "bg-[var(--gold)] text-[var(--ink)] border-[var(--gold)] font-bold shadow-sm"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-2)]"
                      }`}
                    >
                      <Bed className="w-3.5 h-3.5" />
                      <span>{b.bed_label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                  Effective Rent (₹)
                </label>
                <input
                  type="number"
                  value={newRent}
                  onChange={(e) => setNewRent(Number(e.target.value))}
                  className="input-ledger font-bold tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                  Effective Date
                </label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="input-ledger font-medium"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button onClick={onClose} className="btn-secondary w-1/2">
                Cancel
              </button>

              <button
                disabled={isSubmitting || !targetBedId}
                onClick={handleExecuteTransfer}
                className="btn-primary w-1/2"
              >
                {isSubmitting ? "Transferring..." : "Confirm Move"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
