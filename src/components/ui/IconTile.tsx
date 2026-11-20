"use client";

import React from "react";

interface IconTileProps {
  children: React.ReactNode;
  variant?: "gold" | "navy" | "rose";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function IconTile({
  children,
  variant = "gold",
  size = "md",
  className = "",
}: IconTileProps) {
  let sizeClasses = "w-10 h-10 rounded-xl"; // 40px rounded-12px
  if (size === "sm") sizeClasses = "w-8 h-8 rounded-lg";
  if (size === "lg") sizeClasses = "w-12 h-12 rounded-2xl";

  let variantClasses = "bg-[#FDF8EA] text-[#8A6A1B] border border-[#F8EDD0]";
  if (variant === "navy") {
    variantClasses = "bg-[#0F243F] text-[#D6AB47] shadow-sm";
  } else if (variant === "rose") {
    variantClasses = "bg-[#FFF1F5] text-[#D6336C] border border-rose-200";
  }

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </div>
  );
}
