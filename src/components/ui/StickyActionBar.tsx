"use client";

import React from "react";

interface StickyActionBarProps {
  children: React.ReactNode;
  className?: string;
}

export function StickyActionBar({ children, className = "" }: StickyActionBarProps) {
  return (
    <div
      className={`sticky bottom-0 left-0 right-0 z-30 p-4 pb-safe bg-white/95 backdrop-blur-md border-t border-[#E3E8EF] shadow-lg flex items-center justify-between gap-3 ${className}`}
    >
      {children}
    </div>
  );
}
