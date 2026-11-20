"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useLockBodyScroll } from "@/hooks/useDevice";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeight?: string;
  fullScreenMobile?: boolean;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = "max-h-[88dvh]",
  fullScreenMobile = false,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  useLockBodyScroll(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overscroll-contain">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Sheet Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className={`relative z-10 w-full bg-white rounded-t-3xl shadow-2xl flex flex-col border-t border-[#E3E8EF] overscroll-contain ${
              fullScreenMobile
                ? "h-[100dvh] sm:h-auto sm:max-h-[88dvh] sm:rounded-t-3xl sm:max-w-xl"
                : `${maxHeight} sm:max-w-xl`
            }`}
          >
            {/* Grab Handle */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1.2 rounded-full bg-slate-300" />
            </div>

            {/* Header */}
            {title && (
              <div className="px-5 py-3 border-b border-[#E3E8EF] flex items-center justify-between">
                <div className="min-w-0 pr-4">
                  <h3 className="font-serif-heading text-[18px] text-[#0F243F] font-bold truncate">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-[12px] text-slate-500 truncate">{subtitle}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-[#EEF2F7] text-slate-600 hover:text-[#0F243F] flex items-center justify-center shrink-0"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 pb-safe space-y-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
