"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Building2,
  Bed,
  Check,
  Share2,
  Camera,
  CheckCircle2,
} from "lucide-react";
import { useHostel } from "@/lib/store";
import { FoodPlan, PaymentMode } from "@/types/hostel";
import { formatRupee } from "@/lib/utils";
import {
  COMPANY,
  COMMERCIAL_RULES,
  validateDepositSoftRange,
  getRoomTypeConfig,
  formatOfficialBedTitle,
} from "@/config/business";

interface AddResidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefill?: {
    branchId: string;
    roomId: string;
    bedId: string;
  };
}

export function AddResidentModal({ isOpen, onClose, prefill }: AddResidentModalProps) {
  const { branches, rooms, beds, addResident } = useHostel();

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdResident, setCreatedResident] = useState<any>(null);

  // Form State
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [selectedBedId, setSelectedBedId] = useState<string>("");

  const [fullName, setFullName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [parentName, setParentName] = useState<string>("");
  const [parentPhone, setParentPhone] = useState<string>("");
  const [occupation, setOccupation] = useState<"student" | "working">("working");
  const [collegeOrCompany, setCollegeOrCompany] = useState<string>("");
  const [foodPlan, setFoodPlan] = useState<FoodPlan>("Non-Veg");
  const [idPhoto, setIdPhoto] = useState<string>("");

  const [monthlyRent, setMonthlyRent] = useState<number>(0);
  const [securityDeposit, setSecurityDeposit] = useState<number>(4000);
  const [joinDate, setJoinDate] = useState<string>("2026-11-20");
  const [recordInitialPayment, setRecordInitialPayment] = useState<boolean>(true);
  const [initialPaymentAmount, setInitialPaymentAmount] = useState<number>(0);
  const [initialPaymentMode, setInitialPaymentMode] = useState<PaymentMode>("UPI");
  const [initialPaymentRef, setInitialPaymentRef] = useState<string>("");

  // Restore draft from localStorage
  useEffect(() => {
    try {
      const draft = localStorage.getItem("amh_resident_draft");
      if (draft) {
        const p = JSON.parse(draft);
        if (p.fullName && !fullName) setFullName(p.fullName);
        if (p.phone && !phone) setPhone(p.phone);
        if (p.parentName && !parentName) setParentName(p.parentName);
        if (p.parentPhone && !parentPhone) setParentPhone(p.parentPhone);
        if (p.collegeOrCompany && !collegeOrCompany) setCollegeOrCompany(p.collegeOrCompany);
      }
    } catch {}
  }, []);

  // Autosave draft
  useEffect(() => {
    if (fullName || phone) {
      try {
        localStorage.setItem(
          "amh_resident_draft",
          JSON.stringify({ fullName, phone, parentName, parentPhone, collegeOrCompany })
        );
      } catch {}
    }
  }, [fullName, phone, parentName, parentPhone, collegeOrCompany]);

  // Client-side image compression to <400KB
  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        setIdPhoto(compressed);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle Prefill from Bed-Map click
  useEffect(() => {
    if (prefill) {
      if (prefill.branchId) setSelectedBranchId(prefill.branchId);
      if (prefill.roomId) {
        setSelectedRoomId(prefill.roomId);
        const room = rooms.find((r) => r.id === prefill.roomId);
        if (room) {
          const rentVal = room.monthly_rent_per_bed || 0;
          setMonthlyRent(rentVal);
          setInitialPaymentAmount(rentVal);
          setSecurityDeposit(room.room_type === "AC" ? 5000 : 3500);
        }
      }
      if (prefill.bedId) {
        setSelectedBedId(prefill.bedId);
        setStep(2); // Jump to details if bed is already picked! (Under 30s flow)
      }
    } else {
      setSelectedBranchId(branches[0]?.id || "");
    }
  }, [prefill, branches, rooms]);

  if (!isOpen) return null;

  const branchRooms = rooms.filter((r) => r.branch_id === selectedBranchId);
  const roomBeds = beds.filter((b) => b.room_id === selectedRoomId);
  const vacantBeds = roomBeds.filter((b) => b.status === "vacant");

  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    setSelectedBedId("");
    const rm = rooms.find((r) => r.id === roomId);
    if (rm) {
      const rentVal = rm.monthly_rent_per_bed || 0;
      setMonthlyRent(rentVal);
      setInitialPaymentAmount(rentVal);
      setSecurityDeposit(rm.room_type === "AC" ? 5000 : 3500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !selectedBedId || !selectedRoomId || !selectedBranchId) return;

    setIsSubmitting(true);
    try {
      const res = await addResident({
        fullName,
        phone,
        parentName,
        parentPhone,
        occupation,
        collegeOrCompany,
        foodPlan,
        branchId: selectedBranchId,
        roomId: selectedRoomId,
        bedId: selectedBedId,
        monthlyRent,
        securityDeposit,
        depositPaid: securityDeposit,
        joinDate,
        initialPaymentAmount: recordInitialPayment ? initialPaymentAmount : 0,
        initialPaymentMode,
        initialPaymentRef,
      });

      setCreatedResident(res);
      try {
        localStorage.removeItem("amh_resident_draft");
      } catch {}
      setStep(4); // Success screen
      try {
        confetti({
          particleCount: 28,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#D6AB47", "#E2BF6C", "#F8EDD0", "#8A6A1B"],
        });
      } catch (e) {}
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const branch = branches.find((b) => b.id === selectedBranchId);
  const room = rooms.find((r) => r.id === selectedRoomId);
  const bed = beds.find((b) => b.id === selectedBedId);

  const getWhatsAppWelcomeMessage = () => {
    if (!createdResident) return "";
    const foodStr = foodPlan === "No food plan" ? "No food plan" : `3 Meals Daily (${foodPlan})`;
    return `*Aishwaraya Hostels & PG - Admission Confirmation*
Dear ${createdResident.full_name},
Welcome to Aishwaraya Hostels & PG! Your admission has been confirmed.

• Branch: ${branch?.name}
• Room: ${room?.room_no} (${room ? getRoomTypeConfig(room.room_type, room.sharing_capacity)?.officialName || room.room_type : ""})
• Bed: ${bed?.bed_label}
• Monthly Rent: ${formatRupee(monthlyRent)}
• Security Deposit: ${formatRupee(securityDeposit)} (Refundable with 30-day notice)
• Food Plan: ${foodStr}

For assistance, contact Central Office: ${COMPANY.phone}.
Head Office: ${COMPANY.headOffice}.`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        className="w-full max-w-[560px] bg-white rounded-t-3xl sm:rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col h-[100dvh] sm:h-auto sm:max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="font-serif-heading text-[20px] text-[var(--ink)]">
              Add New Resident
            </h2>
            <p className="text-[13px] text-[var(--ink-3)]">
              Fast admission flow in under 30 seconds
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

        {/* Stepper with Gold Progress Line */}
        {step <= 3 && (
          <div className="px-6 pt-3 pb-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
            <div className="flex items-center justify-between mb-2">
              {[
                { num: 1, label: "Bed Picker" },
                { num: 2, label: "Details" },
                { num: 3, label: "Rent & Deposit" },
              ].map((s) => (
                <div key={s.num} className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold ${
                      step === s.num
                        ? "bg-[var(--gold)] text-[var(--ink)]"
                        : step > s.num
                        ? "bg-[var(--ink)] text-white"
                        : "bg-[var(--border)] text-[var(--ink-3)]"
                    }`}
                  >
                    {step > s.num ? "✓" : s.num}
                  </div>
                  <span
                    className={`text-[13px] font-medium hidden sm:inline ${
                      step === s.num ? "text-[var(--ink)] font-semibold" : "text-[var(--ink-3)]"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Gold Progress Track */}
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--gold)] transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 overflow-y-auto">
          {/* STEP 1: BED PICKER */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                  1. Select Branch
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => {
                    setSelectedBranchId(e.target.value);
                    setSelectedRoomId("");
                    setSelectedBedId("");
                  }}
                  className="input-ledger font-medium"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}{b.landmark ? ` (${b.landmark})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                  2. Select Room
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[180px] overflow-y-auto p-1">
                  {branchRooms.map((rm) => {
                    const vacCount = beds.filter(
                      (b) => b.room_id === rm.id && b.status === "vacant"
                    ).length;
                    const isSelected = selectedRoomId === rm.id;
                    return (
                      <button
                        type="button"
                        key={rm.id}
                        onClick={() => handleRoomChange(rm.id)}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          isSelected
                            ? "border-[var(--gold)] bg-[var(--gold-tint)] ring-2 ring-[var(--gold)]"
                            : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"
                        }`}
                      >
                        <div className="font-semibold text-[14px] text-[var(--ink)]">
                          Room {rm.room_no}
                        </div>
                        <div className="text-[12px] text-[var(--ink-3)]">
                          {rm.room_type} • {rm.sharing_capacity} Share
                        </div>
                        <div className="text-[12px] font-semibold text-[var(--gold-deep)] mt-1">
                          {vacCount > 0 ? `${vacCount} Bed Vacant` : "Full"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedRoomId && (
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                    3. Select Vacant Bed
                  </label>
                  {vacantBeds.length === 0 ? (
                    <div className="notice-gold text-[13px]">
                      No vacant beds in Room {room?.room_no}. Please select another room.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5">
                      {vacantBeds.map((b) => (
                        <button
                          type="button"
                          key={b.id}
                          onClick={() => setSelectedBedId(b.id)}
                          className={`p-3 rounded-xl border text-center font-semibold text-[14px] transition flex items-center justify-center gap-2 ${
                            selectedBedId === b.id
                              ? "bg-[var(--gold)] text-[var(--ink)] border-[var(--gold)] font-bold shadow-sm"
                              : "border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-2)]"
                          }`}
                        >
                          <Bed className="w-4 h-4" />
                          <span>{b.bed_label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: RESIDENT DETAILS */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="notice-gold flex items-center justify-between text-[13px]">
                <div>
                  <span className="font-bold">
                    {branch?.name} • Room {room?.room_no}
                  </span>
                  <p className="text-[12px]">Bed: {bed?.bed_label || "Assigned Bed"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="font-bold underline text-[var(--gold-deep)]"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karthik Sundaram"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-ledger"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                    Phone (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98400 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-ledger"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                    Occupation
                  </label>
                  <select
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value as any)}
                    className="input-ledger font-medium"
                  >
                    <option value="working">Working Professional</option>
                    <option value="student">College Student</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                  College / Company Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cognizant MEPZ / Bharath University"
                  value={collegeOrCompany}
                  onChange={(e) => setCollegeOrCompany(e.target.value)}
                  className="input-ledger"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                    Parent / Guardian Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. S. Nathan"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="input-ledger"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                    Parent Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 94440 12345"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="input-ledger"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                  Food Plan
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(["Non-Veg", "Veg", "No food plan"] as const).map((fp) => (
                    <button
                      type="button"
                      key={fp}
                      onClick={() => setFoodPlan(fp)}
                      className={`h-11 rounded-xl border text-[13px] font-semibold transition ${
                        foodPlan === fp
                          ? "bg-[var(--gold-tint)] border-[var(--gold)] text-[var(--gold-deep)] font-bold shadow-xs"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--ink-2)]"
                      }`}
                    >
                      {fp}
                    </button>
                  ))}
                </div>
              </div>

              {/* ID Proof / Camera Photo Capture with Client-Side Compression */}
              <div>
                <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                  Resident Photo / Aadhaar Card
                </label>
                <div className="flex items-center gap-3">
                  <label className="btn-secondary h-11 px-4 cursor-pointer inline-flex items-center gap-2 text-[13px] touch-target">
                    <Camera className="w-4 h-4 text-slate-600" />
                    <span>{idPhoto ? "Retake Photo / ID" : "Capture Photo / ID"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageCapture}
                      className="hidden"
                    />
                  </label>
                  {idPhoto && (
                    <div className="flex items-center gap-2 text-[12px] text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Captured (&lt;400 KB)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RENT & DEPOSIT */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                    Monthly Rent (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="Enter agreed monthly rent"
                    value={monthlyRent || ""}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setMonthlyRent(v);
                      setInitialPaymentAmount(v);
                    }}
                    className="input-ledger font-bold tabular-nums"
                  />
                  {(!monthlyRent || monthlyRent <= 0) && (
                    <p className="text-[12px] text-amber-700 font-medium mt-1">
                      Rate not set on room. Please enter agreed monthly rent.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                    Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    value={securityDeposit || ""}
                    onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                    className="input-ledger font-bold tabular-nums"
                  />
                  {(() => {
                    const check = validateDepositSoftRange(securityDeposit);
                    if (!check.valid && securityDeposit > 0) {
                      return (
                        <p className="text-[11px] text-amber-700 font-medium mt-1">
                          {check.warning}
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                  Admission / Join Date
                </label>
                <input
                  type="date"
                  value={joinDate}
                  onChange={(e) => setJoinDate(e.target.value)}
                  className="input-ledger font-medium"
                />
              </div>

              {/* First Payment Record */}
              <div className="card-ledger p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-[var(--ink)]">
                    Record Initial Rent Payment Now
                  </span>
                  <input
                    type="checkbox"
                    checked={recordInitialPayment}
                    onChange={(e) => setRecordInitialPayment(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border)] text-[var(--gold)] focus:ring-[var(--gold)]"
                  />
                </div>

                {recordInitialPayment && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
                    <div>
                      <label className="block text-[12px] font-medium text-[var(--ink-3)] mb-1">
                        Amount Paid (₹)
                      </label>
                      <input
                        type="number"
                        value={initialPaymentAmount}
                        onChange={(e) => setInitialPaymentAmount(Number(e.target.value))}
                        className="input-ledger font-bold tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] font-medium text-[var(--ink-3)] mb-1">
                        Payment Mode
                      </label>
                      <select
                        value={initialPaymentMode}
                        onChange={(e) => setInitialPaymentMode(e.target.value as any)}
                        className="input-ledger font-medium"
                      >
                        <option value="UPI">UPI / GPay / PhonePe</option>
                        <option value="Cash">Cash to Warden</option>
                        <option value="Bank">Bank Transfer / IMPS</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === 4 && createdResident && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[var(--gold-tint)] border border-[var(--gold-border)] text-[var(--gold-deep)] flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-serif-heading text-[22px] text-[var(--ink)]">
                  Resident Successfully Added!
                </h3>
                <p className="text-[13px] text-[var(--ink-3)] mt-1">
                  Bed <span className="font-semibold text-[var(--ink)]">{bed?.bed_label}</span> in Room {room?.room_no} is now occupied.
                </p>
              </div>

              <div className="card-ledger p-4 text-left text-[14px] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--ink-3)]">Resident Name:</span>
                  <span className="font-semibold text-[var(--ink)]">{createdResident.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ink-3)]">Phone:</span>
                  <span className="text-[var(--ink)]">{createdResident.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ink-3)]">Monthly Rent:</span>
                  <span className="font-bold tabular-nums text-[var(--ink)]">
                    {formatRupee(createdResident.monthly_rent)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href={`https://wa.me/${createdResident.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                    getWhatsAppWelcomeMessage()
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary w-full"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Welcome on WhatsApp</span>
                </a>

                <button onClick={onClose} className="btn-secondary w-full">
                  Close & View Bed-Map
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation (Sticky with Safe Area Inset) */}
        {step <= 3 && (
          <div className="p-4 border-t border-[var(--border)] bg-white pb-safe flex items-center justify-between shrink-0 shadow-sm">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="btn-ghost"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                disabled={step === 1 && !selectedBedId}
                onClick={() => setStep((s) => s + 1)}
                className="btn-primary"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting || !fullName || !phone}
                onClick={handleSubmit}
                className="btn-primary"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? "Saving..." : "Confirm & Admit"}</span>
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
