"use client";

import React, { useRef } from "react";

interface SegmentItem {
  id: string;
  label: string;
  count?: number;
  badge?: string;
  icon?: React.ReactNode;
}

interface SegmentedScrollerProps {
  items: SegmentItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function SegmentedScroller({
  items,
  selectedId,
  onSelect,
  className = "",
}: SegmentedScrollerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`relative w-full ${className}`}>
      {/* Scrollable track with snap */}
      <div
        ref={containerRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1 px-0.5"
      >
        {items.map((item) => {
          const isSelected = item.id === selectedId;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`snap-start shrink-0 h-10 px-3.5 rounded-xl font-semibold text-[13px] sm:text-[14px] flex items-center gap-2 transition touch-target ${
                isSelected
                  ? "bg-gold-gradient text-[#0F243F] shadow-sm font-bold"
                  : "bg-white text-slate-700 border border-[#E3E8EF] hover:bg-[#EEF2F7]"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {typeof item.count === "number" && (
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold tabular-nums ${
                    isSelected
                      ? "bg-[#0F243F] text-white"
                      : "bg-[#EEF2F7] text-slate-700"
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
