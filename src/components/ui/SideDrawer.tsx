"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useLockBodyScroll } from "@/hooks/useDevice";

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export function SideDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "sm:max-w-md",
}: SideDrawerProps) {
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
        <div className="fixed inset-0 z-50 flex justify-end overscroll-contain">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer / Fullscreen Sheet on mobile */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className={`relative z-10 w-full h-[100dvh] bg-white shadow-2xl flex flex-col justify-between overflow-hidden border-l border-[#E3E8EF] ${maxWidth}`}
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-[#0F243F] to-[#0A1B30] text-white p-5 pt-safe flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-4">
                {typeof title === "string" ? (
                  <h3 className="font-serif-heading text-[18px] sm:text-[20px] font-bold text-white truncate">
                    {title}
                  </h3>
                ) : (
                  title
                )}
                {subtitle && (
                  <div className="text-[12px] sm:text-[13px] text-slate-300 truncate mt-0.5">
                    {subtitle}
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
              {children}
            </div>

            {/* Sticky Action Footer */}
            {footer && (
              <div className="p-4 sm:p-5 border-t border-[#E3E8EF] bg-white pb-safe shrink-0 shadow-lg">
                {footer}
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
