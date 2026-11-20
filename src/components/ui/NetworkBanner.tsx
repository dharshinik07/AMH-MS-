"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { getPendingActions, removeAction } from "@/lib/offline-queue";

export function NetworkBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const checkPending = async () => {
      const pending = await getPendingActions();
      setPendingCount(pending.length);
    };

    checkPending();

    const handleOnline = async () => {
      setIsOnline(true);
      const pending = await getPendingActions();
      if (pending.length > 0) {
        setIsSyncing(true);
        // Simulate syncing items
        for (const act of pending) {
          await new Promise((r) => setTimeout(r, 200));
          await removeAction(act.id);
        }
        setIsSyncing(false);
        setPendingCount(0);
        setShowSyncSuccess(true);
        setTimeout(() => setShowSyncSuccess(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-amber-600 text-white text-[12px] sm:text-[13px] font-semibold py-1.5 px-4 flex items-center justify-center gap-2 z-50 sticky top-0"
        >
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline mode active: new entries are safely saved and will sync automatically</span>
        </motion.div>
      )}

      {isSyncing && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 bg-[#0F243F] text-white px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-2 shadow-lg border border-[#293C55]"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D6AB47]" />
          <span>Syncing {pendingCount} offline actions...</span>
        </motion.div>
      )}

      {showSyncSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 bg-emerald-700 text-white px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-2 shadow-lg"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>All offline changes synced!</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
