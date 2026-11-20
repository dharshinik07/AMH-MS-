"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`rounded-xl bg-[length:200%_100%] animate-[shimmer-gold_1.4s_infinite] bg-gradient-to-r from-slate-100 via-[#F8EDD0]/40 to-slate-100 ${className}`}
    />
  );
}
