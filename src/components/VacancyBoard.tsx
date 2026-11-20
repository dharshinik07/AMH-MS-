"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Compass,
  Bed,
  Share2,
  Copy,
  Check,
  Building2,
  Sparkles,
} from "lucide-react";
import { useHostel } from "@/lib/store";
import { formatRupee } from "@/lib/utils";
import { COMPANY, getRoomTypeConfig } from "@/config/business";
import { EmptyState } from "@/components/ui/EmptyState";
import { getBranchImage, getBranchCode } from "@/lib/branchAssets";

interface VacancyBoardProps {
  onStartAddResident: (prefill: { branchId: string; roomId: string; bedId: string }) => void;
}

export function VacancyBoard({ onStartAddResident }: VacancyBoardProps) {
  const { branches, rooms, beds, selectedBranchId } = useHostel();

  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [selectedSharingFilter, setSelectedSharingFilter] = useState<string>("ALL");
  const [copied, setCopied] = useState<boolean>(false);

  // Synchronize branch filter if user chose one globally
  const activeBranchId =
    selectedBranchFilter !== "ALL"
      ? selectedBranchFilter
      : selectedBranchId !== "all"
      ? selectedBranchId
      : "ALL";

  const vacantBedList = beds
    .filter((b) => b.status === "vacant")
    .map((b) => {
      const room = rooms.find((r) => r.id === b.room_id);
      const branch = room ? branches.find((br) => br.id === room.branch_id) : null;
      return {
        bed: b,
        room: room!,
        branch: branch!,
      };
    })
    .filter((item) => item.room && item.branch)
    .filter((item) => {
      if (activeBranchId !== "ALL" && item.branch.id !== activeBranchId) return false;
      if (selectedTypeFilter !== "ALL" && item.room.room_type !== selectedTypeFilter) return false;
      if (
        selectedSharingFilter !== "ALL" &&
        item.room.sharing_capacity.toString() !== selectedSharingFilter
      )
        return false;
      return true;
    });

  const generateWhatsAppVacancyText = () => {
    const branchMap = new Map<string, typeof vacantBedList>();
    vacantBedList.forEach((item) => {
      const list = branchMap.get(item.branch.name) || [];
      list.push(item);
      branchMap.set(item.branch.name, list);
    });

    let text = `🏠 *${COMPANY.name.toUpperCase()} - LIVE VACANCY UPDATE*\n`;
    text += `Chennai • Men's PG with 3 Meals Included\n`;
    text += `📅 Date: 20-Nov-2026\n\n`;

    branchMap.forEach((items, branchName) => {
      text += `📍 *${branchName}*\n`;
      items.forEach((it) => {
        const typeName = getRoomTypeConfig(it.room.room_type, it.room.sharing_capacity)?.officialName || `${it.room.room_type}, ${it.room.sharing_capacity}-Share`;
        const rentStr = it.room.monthly_rent_per_bed ? `${formatRupee(it.room.monthly_rent_per_bed)}/mo` : "Rate on request";
        text += `  • Room ${it.room.room_no} (${typeName}) - ${it.bed.bed_label}: ${rentStr}\n`;
      });
      text += `\n`;
    });

    text += `✨ *Amenities:* 3 Times Food (Veg & Non-Veg), High-speed WiFi, RO Water, Inverter Backup, CCTV Security.\n`;
    text += `📞 *Call / WhatsApp for Room Booking:* ${COMPANY.phone}\n`;
    text += `🏢 Head Office: ${COMPANY.headOffice}`;
    return text;
  };

  const handleShareAvailability = async () => {
    const text = generateWhatsAppVacancyText();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Aishwaraya Hostels - Live Vacancy Update",
          text,
        });
        return;
      } catch (err) {}
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleCopyText = () => {
    const text = generateWhatsAppVacancyText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8EAEF]">
        <div>
          <h2 className="font-serif-heading text-[24px] sm:text-[28px] text-slate-900 font-bold leading-tight">
            Live Vacancy Board
          </h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
            {vacantBedList.length} beds available for immediate move-in across 8 branches
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button onClick={handleCopyText} className="btn-secondary h-11 text-[13px] touch-target">
            {copied ? <Check className="w-4 h-4 text-[#8A6A1B]" /> : <Copy className="w-4 h-4" />}
            <span className="hidden xs:inline">{copied ? "Copied!" : "Copy Summary"}</span>
            <span className="xs:hidden">{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            onClick={handleShareAvailability}
            className="btn-primary h-11 text-[13px] touch-target"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Availability</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER ROW */}
      <div className="card-ledger p-3.5 flex flex-wrap items-center gap-3 shadow-sm">
        <select
          value={activeBranchId}
          onChange={(e) => setSelectedBranchFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-[#E8EAEF] bg-white text-slate-800 text-[13px] font-semibold focus:outline-none focus:border-[#D6AB47]"
        >
          <option value="ALL">All 8 Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={selectedTypeFilter}
          onChange={(e) => setSelectedTypeFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-[#E8EAEF] bg-white text-slate-800 text-[13px] font-semibold focus:outline-none focus:border-[#D6AB47]"
        >
          <option value="ALL">All Types (AC & Non-AC)</option>
          <option value="AC">AC Rooms</option>
          <option value="Non-AC">Non-AC Rooms</option>
        </select>

        <select
          value={selectedSharingFilter}
          onChange={(e) => setSelectedSharingFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-[#E8EAEF] bg-white text-slate-800 text-[13px] font-semibold focus:outline-none focus:border-[#D6AB47]"
        >
          <option value="ALL">All Sharing Capacities</option>
          <option value="2">2-Sharing</option>
          <option value="3">3-Sharing</option>
          <option value="4">4-Sharing</option>
          <option value="6">6-Sharing</option>
        </select>
      </div>

      {/* 3. VACANT BEDS GRID with Photo Strip, Cream Gradient section & Pulsing Dot */}
      {vacantBedList.length === 0 ? (
        <EmptyState
          icon={<Bed className="w-6 h-6 text-slate-400" />}
          title="No Vacant Beds Found"
          description="All beds matching the selected filters are currently occupied. Reset filters to view other branches."
          actionLabel="Show All Branches"
          onAction={() => {
            setSelectedBranchFilter("ALL");
            setSelectedTypeFilter("ALL");
            setSelectedSharingFilter("ALL");
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {vacantBedList.map(({ bed, room, branch }) => {
            const branchImg = getBranchImage(branch.id);
            const branchCode = getBranchCode(branch.id, branch.name);
            const isAC = room.room_type === "AC";

            return (
              <div
                key={bed.id}
                className="card-ledger overflow-hidden flex flex-col justify-between shadow-sm transition-transform duration-200 hover:-translate-y-1"
              >
                <div>
                  {/* Branch Photo Strip with navy-to-transparent gradient overlay */}
                  <div className="relative h-28 w-full overflow-hidden bg-slate-900">
                    <img
                      src={branchImg}
                      alt={branch.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F243F] via-[#0F243F]/40 to-transparent" />
                    
                    <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-end justify-between">
                      <div className="min-w-0">
                        <span className="font-serif-heading font-bold text-white text-[15px] truncate block drop-shadow-sm">
                          {branch.name}
                        </span>
                        <span className="text-[11px] text-[#E2BF6C] font-semibold">
                          {branch.landmark}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/40 text-white border border-white/20 backdrop-blur-sm">
                        {branchCode}
                      </span>
                    </div>
                  </div>

                  {/* Cream Gradient Top Section with Room Number and AC Chip */}
                  <div className="p-4 bg-gradient-to-b from-[#FDF8EA] to-white border-b border-[#F8EDD0] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-serif-heading text-[18px] font-bold text-slate-900">
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

                      {/* Ready to Move Gold Badge with Pulsing Dot */}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F8EDD0] border border-[#F8EDD0] text-[#8A6A1B] text-[11px] font-bold shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-[#D6AB47] animate-pulse-soft" />
                        <span>Ready to move</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="font-bold text-[14px] text-slate-800 flex items-center gap-1.5">
                        <Bed className="w-4 h-4 text-[#8A6A1B]" />
                        <span>{bed.bed_label}</span>
                      </div>
                      <span className="text-[12px] text-slate-500 font-medium">
                        {getRoomTypeConfig(room.room_type, room.sharing_capacity)?.officialName || `${room.room_type} • ${room.sharing_capacity} Sharing`} • Floor {room.floor}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer with Big Serif Rent & Gold "Book Bed" button */}
                <div className="p-4 pt-3 bg-white flex items-center justify-between gap-3">
                  <div>
                    <div className="font-serif-heading text-[22px] font-bold text-slate-900 tabular-nums leading-tight">
                      {room.monthly_rent_per_bed ? formatRupee(room.monthly_rent_per_bed) : "Rate on request"}
                    </div>
                    {room.monthly_rent_per_bed ? (
                      <span className="text-[11px] text-slate-500 font-medium">/month with food</span>
                    ) : null}
                  </div>

                  <button
                    onClick={() =>
                      onStartAddResident({
                        branchId: branch.id,
                        roomId: room.id,
                        bedId: bed.id,
                      })
                    }
                    className="btn-primary h-11 px-4 text-[13px] shadow-xs touch-target"
                  >
                    Book Bed
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
