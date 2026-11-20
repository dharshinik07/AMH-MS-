"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertCircle, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error";
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="pointer-events-auto bg-white border border-[#E8EAEF] rounded-2xl shadow-2xl p-4 flex items-start gap-3 relative overflow-hidden"
              style={{
                borderLeftWidth: "4px",
                borderLeftColor: isSuccess ? "#D6AB47" : "#D6336C",
              }}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isSuccess ? "bg-[#FDF8EA] text-[#8A6A1B]" : "bg-[#FFF1F5] text-[#D6336C]"
                }`}
              >
                {isSuccess ? (
                  <Check className="w-3.5 h-3.5 text-[#8A6A1B]" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-[#D6336C]" />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-2">
                <div className="text-[14px] font-bold text-slate-900 leading-tight">
                  {toast.title}
                </div>
                {toast.description && (
                  <div className="text-[12px] text-slate-600 mt-1 leading-snug">
                    {toast.description}
                  </div>
                )}
              </div>

              <button
                onClick={() => onDismiss(toast.id)}
                className="text-slate-400 hover:text-slate-800 transition p-1"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Gold countdown progress bar */}
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
                className="absolute bottom-0 left-0 h-[3px] bg-gold-gradient"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
