"use client";

import React from "react";
import { FolderOpen } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-14 text-center rounded-3xl border border-dashed border-[#E8EAEF] bg-white my-4 shadow-xs">
      <div className="w-14 h-14 rounded-2xl bg-[#FDF8EA] text-[#8A6A1B] border border-[#F8EDD0] flex items-center justify-center mb-3.5 shadow-xs">
        {icon || <FolderOpen className="w-6 h-6" />}
      </div>
      <h3 className="font-serif-heading text-[19px] font-bold text-slate-900 mb-1">
        {title}
      </h3>
      <p className="text-[13px] text-slate-500 max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-secondary text-[13px]">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
