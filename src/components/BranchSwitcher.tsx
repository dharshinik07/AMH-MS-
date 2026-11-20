"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, ChevronDown, Search, Check, X } from "lucide-react";
import { useHostel } from "@/lib/store";
import { formatRupee } from "@/lib/utils";
import { getBranchCode } from "@/lib/branchAssets";
import { BottomSheet } from "./ui/BottomSheet";

interface BranchSwitcherProps {
  isMobileFullWidth?: boolean;
}

export function BranchSwitcher({ isMobileFullWidth = false }: BranchSwitcherProps) {
  const { branches, selectedBranchId, setSelectedBranchId, getBranchMetrics } = useHostel();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  // Close on outside click on desktop
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen && !isMobileFullWidth) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isMobileFullWidth]);

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.landmark.toLowerCase().includes(search.toLowerCase()) ||
    b.code.toLowerCase().includes(search.toLowerCase())
  );

  const renderBranchList = () => (
    <div className="space-y-1">
      {/* Option: All Branches */}
      <button
        onClick={() => {
          setSelectedBranchId("all");
          setIsOpen(false);
        }}
        className={`w-full p-3 rounded-xl text-left flex items-center justify-between text-[13px] sm:text-[14px] transition touch-target ${
          selectedBranchId === "all"
            ? "bg-[#FDF8EA] text-[#8A6A1B] font-semibold border border-[#F8EDD0]"
            : "hover:bg-[#F3F4F6] text-slate-800"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F8EDD0] text-[#8A6A1B] font-bold text-[11px] flex items-center justify-center border border-[#F8EDD0] shrink-0">
            ALL
          </div>
          <div>
            <div className="font-semibold text-slate-900">All 8 Branches</div>
            <div className="text-[12px] text-slate-500">All Locations</div>
          </div>
        </div>
        {selectedBranchId === "all" && (
          <Check className="w-4 h-4 text-[#8A6A1B]" />
        )}
      </button>

      <div className="divider-gold-fade my-1.5 opacity-50" />

      {/* Branch Items */}
      {filteredBranches.map((branch) => {
        const metrics = getBranchMetrics(branch.id);
        const isSelected = selectedBranchId === branch.id;
        const branchCode = getBranchCode(branch.id, branch.name);

        return (
          <button
            key={branch.id}
            onClick={() => {
              setSelectedBranchId(branch.id);
              setIsOpen(false);
            }}
            className={`w-full p-3 rounded-xl text-left flex items-center justify-between text-[13px] sm:text-[14px] transition touch-target ${
              isSelected
                ? "bg-[#FDF8EA] text-[#8A6A1B] font-semibold border border-[#F8EDD0]"
                : "hover:bg-[#F3F4F6] text-slate-800"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-9 h-9 rounded-xl bg-[#FDF8EA] text-[#8A6A1B] font-bold text-[11px] flex items-center justify-center border border-[#F8EDD0] shrink-0">
                {branchCode}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 truncate">
                  {branch.name}
                </div>
                <div className="text-[12px] text-slate-500 truncate">
                  {branch.landmark || branch.address}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 text-right">
              <div className="text-[12px]">
                <div className="font-semibold text-slate-800">
                  {metrics.occupancyRate}% Occ.
                </div>
                {metrics.totalOutstanding > 0 ? (
                  <div className="text-[#D6336C] font-semibold tabular-nums text-[11px]">
                    {formatRupee(metrics.totalOutstanding)} due
                  </div>
                ) : (
                  <div className="text-[#8A6A1B] text-[11px]">Clear</div>
                )}
              </div>
              {isSelected && (
                <Check className="w-4 h-4 text-[#8A6A1B]" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={`relative ${isMobileFullWidth ? "w-full" : ""}`} ref={popoverRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-11 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--navy-900)] font-semibold text-[14px] flex items-center justify-between gap-2.5 transition active:scale-[0.98] shadow-xs hover:border-[#D6AB47] focus:outline-none focus:ring-2 focus:ring-[#D6AB47] ${
          isMobileFullWidth ? "w-full" : "min-w-[200px]"
        }`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          <Building2 className="w-4 h-4 text-[#8A6A1B] flex-shrink-0" />
          <span className="truncate">
            {selectedBranchId === "all" ? "All Branches (8)" : selectedBranch?.name}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Mobile BottomSheet (<768px) */}
      {isMobileFullWidth ? (
        <BottomSheet
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Select Branch"
          subtitle="Switch view across 8 branches around Tambaram"
        >
          <div className="space-y-3">
            <div className="sticky top-0 z-10 bg-white pb-1">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#F6F8FB] border border-[#E3E8EF] focus-within:border-[#D6AB47] focus-within:ring-2 focus-within:ring-[#FDF8EA]">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search 8 branches..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-[16px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>
            <div>
              {renderBranchList()}
            </div>
          </div>
        </BottomSheet>
      ) : (
        /* Desktop Popover (≥768px) */
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 4 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-full mt-2 right-0 w-[320px] sm:w-[350px] z-50 bg-[var(--surface)] border border-[#E8EAEF] rounded-2xl shadow-xl overflow-hidden"
            >
              {/* Search Box */}
              <div className="p-3 border-b border-[#E8EAEF] bg-[#F8F9FC]">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#E8EAEF] focus-within:border-[#D6AB47] focus-within:ring-2 focus-within:ring-[#FDF8EA]">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search 8 branches..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* List */}
              <div className="max-h-[300px] overflow-y-auto p-1.5 space-y-1">
                {renderBranchList()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
