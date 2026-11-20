"use client";

import React from "react";
import { motion } from "framer-motion";
import { formatRupee } from "@/lib/utils";

interface RentHeatRingProps {
  collected: number;
  totalExpected: number;
  outstanding: number;
  size?: number;
  strokeWidth?: number;
  showDetails?: boolean;
}

export function RentHeatRing({
  collected,
  totalExpected,
  outstanding,
  size = 120,
  strokeWidth = 10,
  showDetails = true,
}: RentHeatRingProps) {
  const percentage = totalExpected > 0 ? Math.min(100, Math.round((collected / totalExpected) * 100)) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200 dark:text-gray-800"
            fill="transparent"
          />

          {/* Animated Gold Arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#goldGradientRing)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeLinecap="round"
            fill="transparent"
          />

          <defs>
            <linearGradient id="goldGradientRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D6AB47" />
              <stop offset="100%" stopColor="#E2BF6C" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Content: Outstanding ₹ amount & % badge */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500">
            Due
          </span>
          <span className="text-xs sm:text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400 leading-tight">
            {formatRupee(outstanding)}
          </span>
          <span className="text-[10px] font-semibold text-[#8A6A1B] dark:text-[#E2BF6C] bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded-full mt-0.5 border border-amber-200/50 dark:border-amber-700/40">
            {percentage}%
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="flex items-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-gray-500 text-[11px]">Paid: {formatRupee(collected)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
