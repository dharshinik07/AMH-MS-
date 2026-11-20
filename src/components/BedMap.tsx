"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Phone,
  MessageCircle,
  LayoutGrid,
  List,
  ArrowRightLeft,
  LogOut,
  CreditCard,
  X,
  Hourglass,
  Building2,
  Bed as BedIcon,
  CheckCircle,
} from "lucide-react";
import { useHostel } from "@/lib/store";
import { Room, Bed, Resident } from "@/types/hostel";
import { formatRupee, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { PaymentTimelineStrip, MonthPaymentStatus } from "@/components/ui/PaymentTimelineStrip";
import { getRoomTypeConfig } from "@/config/business";

interface BedMapProps {
  onStartAddResident: (prefill: { branchId: string; roomId: string; bedId: string }) => void;
  onStartVacate: (residentId: string) => void;
  onStartTransfer: (residentId: string) => void;
  onRecordPayment: (residentId: string) => void;
}

export function BedMap({
  onStartAddResident,
  onStartVacate,
  onStartTransfer,
  onRecordPayment,
}: BedMapProps) {
  const { branches, rooms, beds, residents, invoices, selectedBranchId, selectedMonth } = useHostel();

  const [viewMode, setViewMode] = useState<"map" | "table">("map");
  const [filterType, setFilterType] = useState<"ALL" | "AC" | "Non-AC">("ALL");
  const [filterSharing, setFilterSharing] = useState<string>("ALL");
  const [filterFloor, setFilterFloor] = useState<string>("ALL");
  const [vacantOnly, setVacantOnly] = useState<boolean>(false);
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);

  // Filter Rooms
  const filteredRooms = rooms.filter((r) => {
    if (selectedBranchId !== "all" && r.branch_id !== selectedBranchId) return false;
    if (filterType !== "ALL" && r.room_type !== filterType) return false;
    if (filterSharing !== "ALL" && r.sharing_capacity.toString() !== filterSharing) return false;
    if (filterFloor !== "ALL" && r.floor.toString() !== filterFloor) return false;

    if (vacantOnly) {
      const roomBeds = beds.filter((b) => b.room_id === r.id);
      const hasVacant = roomBeds.some((b) => b.status === "vacant");
      if (!hasVacant) return false;
    }
    return true;
  });

  // Selected Resident for the right-side profile drawer
  const activeResident = residents.find((res) => res.id === selectedResidentId);
  const activeResidentRoom = activeResident
    ? rooms.find((rm) => rm.id === beds.find((b) => b.id === activeResident.bed_id)?.room_id)
    : null;
  const activeResidentBranch = activeResident
    ? branches.find((b) => b.id === activeResident.branch_id)
    : null;
  const activeResidentInvoice = activeResident
    ? invoices.find((i) => i.resident_id === activeResident.id && i.month === selectedMonth)
    : null;

  // 12-month timeline for active resident
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
      status: activeResidentInvoice?.status === "paid" ? "paid" : "overdue",
      amount: activeResident?.monthly_rent,
    },
    { month: "Dec", fullMonth: "2026-12", status: "future" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. FILTER & VIEW CONTROLS ROW */}
      <div className="card-ledger p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Floor */}
          <select
            value={filterFloor}
            onChange={(e) => setFilterFloor(e.target.value)}
            className="h-10 px-3 rounded-xl border border-[#E8EAEF] bg-white text-slate-800 text-[13px] font-semibold focus:outline-none focus:border-[#D6AB47]"
          >
            <option value="ALL">All Floors</option>
            <option value="1">1st Floor</option>
            <option value="2">2nd Floor</option>
            <option value="3">3rd Floor</option>
          </select>

          {/* AC / Non-AC */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="h-10 px-3 rounded-xl border border-[#E8EAEF] bg-white text-slate-800 text-[13px] font-semibold focus:outline-none focus:border-[#D6AB47]"
          >
            <option value="ALL">All Room Types</option>
            <option value="AC">AC Rooms</option>
            <option value="Non-AC">Non-AC Rooms</option>
          </select>

          {/* Sharing */}
          <select
            value={filterSharing}
            onChange={(e) => setFilterSharing(e.target.value)}
            className="h-10 px-3 rounded-xl border border-[#E8EAEF] bg-white text-slate-800 text-[13px] font-semibold focus:outline-none focus:border-[#D6AB47]"
          >
            <option value="ALL">All Sharing (1-4)</option>
            <option value="1">1 Sharing</option>
            <option value="2">2 Sharing</option>
            <option value="3">3 Sharing</option>
            <option value="4">4 Sharing</option>
          </select>

          {/* Vacant only checkbox */}
          <label className="flex items-center gap-2 px-3 h-10 rounded-xl border border-[#E8EAEF] bg-white text-[13px] font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={vacantOnly}
              onChange={(e) => setVacantOnly(e.target.checked)}
              className="w-4 h-4 rounded text-[#D6AB47] focus:ring-[#D6AB47]"
            />
            <span>Vacant Only</span>
          </label>
        </div>

        {/* View toggle (Map / Table) */}
        <div className="flex items-center bg-[#F3F4F6] p-1 rounded-xl border border-[#E8EAEF]">
          <button
            onClick={() => setViewMode("map")}
            className={`h-8 px-3 rounded-lg text-[13px] font-bold flex items-center gap-1.5 transition ${
              viewMode === "map"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`h-8 px-3 rounded-lg text-[13px] font-bold flex items-center gap-1.5 transition ${
              viewMode === "table"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* 2. LEGEND BAR (Real chip samples!) */}
      <div className="card-ledger px-4 sm:px-5 py-3 flex flex-wrap items-center gap-3 sm:gap-6 text-[12px] sm:text-[13px] text-slate-700">
        <span className="font-bold text-slate-900">Bed Status:</span>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gold-gradient text-[#0F243F] font-bold text-[11px] flex items-center justify-center shadow-xs ring-1 ring-white/50">
            VK
          </div>
          <span className="font-medium">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg border border-[#0F243F] bg-slate-50 text-[#0F243F] flex items-center justify-center">
            <Hourglass className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium">Notice (30d)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg border border-dashed border-[#F8EDD0] bg-[#FDF8EA] text-[#8A6A1B] font-bold text-[13px] flex items-center justify-center">
            +
          </div>
          <span className="font-medium">Vacant</span>
        </div>
      </div>

      {/* 3. BED MAP GRID (Single col mobile, 2 cols sm/landscape, 3 cols desktop) */}
      {viewMode === "map" ? (
        filteredRooms.length === 0 ? (
          <div className="card-ledger p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FDF8EA] text-[#8A6A1B] flex items-center justify-center border border-[#F8EDD0]">
              <BedIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-serif-heading text-[20px] font-bold text-slate-900">No rooms set up yet</h3>
              <p className="text-[14px] text-slate-500 mt-1 max-w-md">
                Configure your rooms and set bed rates for this branch in Settings to start managing residents.
              </p>
            </div>
            <a
              href="/settings"
              className="btn-primary inline-flex items-center gap-2 mt-2"
            >
              <span>Set up rooms</span>
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredRooms.map((room) => {
              const roomBeds = beds.filter((b) => b.room_id === room.id);
              const branch = branches.find((b) => b.id === room.branch_id);
              const occupiedCount = roomBeds.filter(
                (b) => b.status === "occupied" || b.status === "notice"
              ).length;
              const vacantCount = room.sharing_capacity - occupiedCount;
              const isAC = room.room_type === "AC";
              const cfg = getRoomTypeConfig(room.room_type, room.sharing_capacity);

              return (
                <div
                  key={room.id}
                  className="card-ledger p-5 flex flex-col justify-between space-y-4 hover:border-t-[#D6AB47] border-t-2 border-t-transparent transition-all"
                >
                  {/* Room Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif-heading text-[20px] text-slate-900 font-bold">
                          Room {room.room_no}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isAC
                              ? "bg-[#F8EDD0] text-[#8A6A1B] border border-[#F8EDD0]"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {room.room_type}
                        </span>
                      </div>
                      <div className="text-[13px] text-slate-500 mt-0.5">
                        {cfg ? cfg.officialName : `${room.room_type} • ${room.sharing_capacity} Sharing`} • Floor {room.floor}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {room.attached_bath ? "Attached Bath" : "Common Bath"}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[15px] font-bold tabular-nums text-slate-900">
                        {room.monthly_rent_per_bed ? formatRupee(room.monthly_rent_per_bed) : "Rate not set"}
                      </div>
                      {room.monthly_rent_per_bed ? (
                        <span className="text-[11px] text-slate-500">per bed</span>
                      ) : null}
                    </div>
                  </div>

                {/* 44px BED CHIPS (Occupied = Gold Gradient, Vacant = Dashed Cream with +, Notice = Navy Outline) */}
                <div className="grid grid-cols-2 gap-2.5">
                  {roomBeds.map((bed) => {
                    const resident = residents.find(
                      (r) => r.bed_id === bed.id && r.status !== "vacated"
                    );

                    if (bed.status === "vacant") {
                      return (
                        <button
                          key={bed.id}
                          onClick={() =>
                            onStartAddResident({
                              branchId: room.branch_id,
                              roomId: room.id,
                              bedId: bed.id,
                            })
                          }
                          className="h-[52px] rounded-xl border border-dashed border-[#F8EDD0] hover:border-[#D6AB47] bg-[#FDF8EA] hover:bg-[#F8EDD0]/60 transition flex items-center justify-between px-3 text-left group"
                          title="Click to add resident"
                        >
                          <div className="min-w-0">
                            <span className="text-[13px] font-bold text-slate-800 group-hover:text-[#8A6A1B] block truncate">
                              {bed.bed_label}
                            </span>
                            <span className="text-[11px] text-[#8A6A1B] font-medium">Vacant</span>
                          </div>
                          <span className="text-lg font-bold text-[#8A6A1B] transition-transform duration-200 group-hover:scale-125 group-hover:rotate-90">
                            +
                          </span>
                        </button>
                      );
                    }

                    // Occupied or Notice
                    const isNotice = bed.status === "notice";
                    const initials = resident
                      ? resident.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "RES";

                    return (
                      <button
                        key={bed.id}
                        onClick={() => resident && setSelectedResidentId(resident.id)}
                        className={`h-[52px] rounded-xl p-2 px-3 text-left transition flex items-center justify-between ${
                          isNotice
                            ? "bg-slate-50 border border-[#0F243F] text-slate-900"
                            : "bg-gold-gradient border border-[#D6AB47] shadow-sm hover:brightness-105"
                        }`}
                        title="Click to view resident details"
                      >
                        <div className="min-w-0 pr-1">
                          <span className="text-[13px] font-bold text-[#0F243F] block truncate">
                            {resident?.full_name}
                          </span>
                          <span className="text-[11px] text-[#0F243F]/80 font-medium">
                            {bed.bed_label}
                          </span>
                        </div>

                        <div className="w-7 h-7 rounded-lg bg-[#0F243F] text-white text-[11px] font-bold flex items-center justify-center shrink-0 ring-1 ring-white/50">
                          {isNotice ? <Hourglass className="w-3.5 h-3.5" /> : initials}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Footer status: occupied count with thin gold progress bar and vacant cream chip */}
                <div className="pt-2 border-t border-[#E8EAEF] flex items-center justify-between text-[12px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>
                      {occupiedCount} of {room.sharing_capacity} occupied
                    </span>
                    <div className="w-12 bg-[#F8EDD0] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gold-gradient h-full rounded-full"
                        style={{
                          width: `${(occupiedCount / room.sharing_capacity) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <span
                    className={`font-bold px-2 py-0.5 rounded-full ${
                      vacantCount === 0
                        ? "bg-slate-100 text-slate-500"
                        : "bg-[#FDF8EA] text-[#8A6A1B] border border-[#F8EDD0]"
                    }`}
                  >
                    {vacantCount === 0 ? "Full" : `${vacantCount} Vacant`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        )
      ) : (
        /* TABLE VIEW */
        <div className="card-ledger overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#FDF8EA] border-b border-[#F8EDD0] text-slate-700 font-bold text-[12px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Room No</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Floor</th>
                  <th className="py-3 px-4">Occupancy</th>
                  <th className="py-3 px-4 text-right">Rent / Bed</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EAEF]">
                {filteredRooms.map((r) => {
                  const roomBeds = beds.filter((b) => b.room_id === r.id);
                  const branch = branches.find((b) => b.id === r.branch_id);
                  const occupiedCount = roomBeds.filter(
                    (b) => b.status === "occupied" || b.status === "notice"
                  ).length;

                  return (
                    <tr key={r.id} className="hover:bg-[#FFFDF5] transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        Room {r.room_no}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{branch?.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-[#F8EDD0] text-[#8A6A1B] border border-[#F8EDD0]">
                          {r.room_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">Floor {r.floor}</td>
                      <td className="py-3.5 px-4 font-semibold tabular-nums text-slate-800">
                        {occupiedCount} / {r.sharing_capacity} beds
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold tabular-nums text-slate-900">
                        {formatRupee(r.monthly_rent_per_bed)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setViewMode("map")}
                          className="btn-ghost text-[13px] h-8 px-2.5 font-bold text-[#8A6A1B]"
                        >
                          View Beds
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. RIGHT-SIDE RESIDENT PROFILE DRAWER with Navy Gradient Header & Gold/Rose Figures */}
      <AnimatePresence>
        {activeResident && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="w-full md:max-w-md bg-white h-[100dvh] shadow-2xl flex flex-col justify-between overflow-hidden"
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
                        {activeResidentBranch?.name} • Room {activeResidentRoom?.room_no}
                      </p>
                      <p className="text-[12px] text-[#E2BF6C] font-mono mt-0.5">
                        {activeResident.phone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key Numbers (Rent, Deposit, Outstanding) in Gold/Rose figures */}
                <div className="p-4 sm:p-6 space-y-5">
                  <div className="grid grid-cols-3 gap-2 p-3 sm:p-4 rounded-2xl bg-[#F8F9FC] border border-[#E8EAEF] text-center">
                    <div>
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Monthly Rent
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
                        Outstanding
                      </span>
                      <div className="font-serif-heading text-[16px] sm:text-[18px] font-bold text-[#A61E4D] tabular-nums mt-0.5">
                        {formatRupee(
                          activeResidentInvoice
                            ? activeResidentInvoice.amount_due - activeResidentInvoice.amount_paid
                            : 0
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Action Bar */}
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

                  {/* 12-Month Money Timeline Strip */}
                  <div className="card-ledger p-4 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                      12-Month Payment History
                    </span>
                    <div className="overflow-x-auto no-scrollbar">
                      <PaymentTimelineStrip timeline={sampleTimeline} />
                    </div>
                  </div>

                  {/* Resident Info details */}
                  <div className="space-y-2.5 text-[13px] sm:text-[14px]">
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
                      <span className="font-semibold text-slate-800">
                        {activeResident.emergency_contact || activeResident.parent_phone || "Not recorded"}
                      </span>
                    </div>
                  </div>
                </div>
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
                  <span>Record Rent Payment</span>
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
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
