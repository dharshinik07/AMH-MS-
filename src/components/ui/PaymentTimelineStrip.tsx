"use client";

import React, { useState } from "react";
import { formatRupee } from "@/lib/utils";

export interface MonthPaymentStatus {
  month: string; // 'Jan', 'Feb', etc.
  fullMonth: string; // '2026-01'
  status: "paid" | "partial" | "due" | "overdue" | "future";
  amount?: number;
}

interface PaymentTimelineStripProps {
  timeline: MonthPaymentStatus[];
  showLegend?: boolean;
}

export function PaymentTimelineStrip({ timeline, showLegend = true }: PaymentTimelineStripProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 sm:gap-2">
        {timeline.map((item, idx) => {
          let dotStyle = "";
          let dotContent = null;

          if (item.status === "paid") {
            // solid gold
            dotStyle = "bg-[#D6AB47] border-[#8A6A1B]";
          } else if (item.status === "partial") {
            // half gold (using linear-gradient)
            dotStyle = "border-[#D6AB47]";
            dotContent = (
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #D6AB47 50%, #FFFFFF 50%)",
                }}
              />
            );
          } else if (item.status === "due") {
            // hollow gold ring
            dotStyle = "bg-white border-2 border-[#D6AB47]";
          } else if (item.status === "overdue") {
            // solid rose
            dotStyle = "bg-[#D6336C] border-[#A61E4D]";
          } else {
            // future = light grey
            dotStyle = "bg-[#E2E8F0] border-[#CBD5E1]";
          }

          return (
            <div
              key={item.fullMonth || idx}
              className="relative flex flex-col items-center group cursor-pointer"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full border transition-transform duration-150 flex items-center justify-center overflow-hidden ${dotStyle} ${
                  hoveredIndex === idx ? "scale-125" : ""
                }`}
              >
                {dotContent}
              </div>

              <span className="text-[12px] text-slate-500 font-medium mt-1 select-none">
                {item.month[0]}
              </span>

              {/* Tooltip */}
              {hoveredIndex === idx && (
                <div className="absolute bottom-full mb-1.5 z-30 px-2.5 py-1.5 rounded-lg bg-[#0F243F] text-white text-[12px] font-medium whitespace-nowrap shadow-lg pointer-events-none">
                  <div className="font-semibold">{item.month} 2026</div>
                  <div className="text-[11px] opacity-90 capitalize">
                    {item.status}: {item.amount ? formatRupee(item.amount) : "No dues"}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showLegend && (
        <div className="flex flex-wrap items-center gap-3 pt-1 text-[12px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D6AB47]" />
            <span>Paid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full border border-[#D6AB47]"
              style={{ background: "linear-gradient(90deg, #D6AB47 50%, #FFFFFF 50%)" }}
            />
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-[#D6AB47] bg-white" />
            <span>Due</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D6336C]" />
            <span>Overdue</span>
          </div>
        </div>
      )}
    </div>
  );
}
