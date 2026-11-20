"use client";

import React from "react";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  const getInitials = (str: string) => {
    if (!str) return "AM";
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Hash the name to pick one of the 3 styles
  const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const styleIndex = getHash(name || "A") % 3;

  let sizeClasses = "w-9 h-9 text-[13px]";
  if (size === "sm") sizeClasses = "w-7 h-7 text-[11px]";
  if (size === "lg") sizeClasses = "w-11 h-11 text-[14px]";
  if (size === "xl") sizeClasses = "w-14 h-14 text-[17px]";

  // Style 0: gold gradient with navy text
  // Style 1: navy (#0F243F) with gold (#E2BF6C) text
  // Style 2: cream (#FDF8EA) with gold-700 (#8A6A1B) text
  let styleClasses = "bg-gold-gradient text-[#0F243F] font-bold shadow-sm";
  if (styleIndex === 1) {
    styleClasses = "bg-[#0F243F] text-[#E2BF6C] font-bold shadow-sm";
  } else if (styleIndex === 2) {
    styleClasses = "bg-[#FDF8EA] text-[#8A6A1B] border border-[#F8EDD0] font-bold shadow-sm";
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 ring-2 ring-white select-none ${sizeClasses} ${styleClasses} ${className}`}
      title={name}
    >
      <span>{getInitials(name)}</span>
    </div>
  );
}
