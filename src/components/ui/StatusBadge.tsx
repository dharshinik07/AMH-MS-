"use client";

import React from "react";
import { Check, Clock, AlertCircle, CircleDot, Hourglass } from "lucide-react";
import { InvoiceStatus, ResidentStatus, BedStatus } from "@/types/hostel";

interface StatusBadgeProps {
  status: InvoiceStatus | ResidentStatus | BedStatus | "paid" | "partial" | "pending" | "overdue" | "vacant" | "occupied" | "notice";
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const norm = status.toLowerCase();

  const isSmall = size === "sm";
  const sizeClasses = isSmall
    ? "px-2 py-0.5 text-[12px] gap-1"
    : "px-2.5 py-1 text-[13px] gap-1.5 font-medium";

  if (norm === "paid") {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-[#F8EDD0] border border-[#F8EDD0] text-[#8A6A1B] font-semibold ${sizeClasses}`}
      >
        <Check className={isSmall ? "w-3 h-3 text-[#8A6A1B]" : "w-3.5 h-3.5 text-[#8A6A1B]"} />
        <span>Paid</span>
      </span>
    );
  }

  if (norm === "partial") {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-white border border-[#D6AB47] text-[#8A6A1B] font-semibold ${sizeClasses}`}
      >
        <CircleDot className={isSmall ? "w-3 h-3 text-[#D6AB47]" : "w-3.5 h-3.5 text-[#D6AB47]"} />
        <span>Partial</span>
      </span>
    );
  }

  if (norm === "pending") {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-[#FDF8EA] border border-[#F8EDD0] text-[#6B7280] font-medium ${sizeClasses}`}
      >
        <Clock className={isSmall ? "w-3 h-3 text-[#6B7280]" : "w-3.5 h-3.5 text-[#6B7280]"} />
        <span>Pending</span>
      </span>
    );
  }

  if (norm === "overdue") {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-[#FFF1F5] border border-rose-200 text-[#A61E4D] font-semibold ${sizeClasses}`}
      >
        <AlertCircle className={isSmall ? "w-3 h-3 text-[#D6336C]" : "w-3.5 h-3.5 text-[#D6336C]"} />
        <span>Overdue</span>
      </span>
    );
  }

  if (norm === "notice") {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-slate-100 border border-slate-200 text-[#374151] font-semibold ${sizeClasses}`}
      >
        <Hourglass className={isSmall ? "w-3 h-3 text-[#374151]" : "w-3.5 h-3.5 text-[#374151]"} />
        <span>Notice</span>
      </span>
    );
  }

  if (norm === "vacant") {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-white border border-dashed border-[#CBD5E1] text-[#6B7280] ${sizeClasses}`}
      >
        <span>+ Vacant</span>
      </span>
    );
  }

  // Active / Occupied
  return (
    <span
      className={`inline-flex items-center rounded-full bg-[#FDF8EA] text-[#8A6A1B] border border-[#F8EDD0] font-semibold ${sizeClasses}`}
    >
      <Check className={isSmall ? "w-3 h-3 text-[#8A6A1B]" : "w-3.5 h-3.5 text-[#8A6A1B]"} />
      <span>Active</span>
    </span>
  );
}
