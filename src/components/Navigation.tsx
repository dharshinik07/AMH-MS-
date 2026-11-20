"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Bed,
  IndianRupee,
  Users,
  Compass,
  Bell,
  Lock,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useHostel } from "@/lib/store";

interface NavigationProps {
  currentTab: "dashboard" | "rooms" | "rent" | "residents" | "vacancy" | "reports" | "settings";
  setCurrentTab: (tab: any) => void;
  onOpenCommandPalette: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export function Navigation({
  currentTab,
  setCurrentTab,
  onOpenCommandPalette,
  darkMode,
  setDarkMode,
}: NavigationProps) {
  const {
    branches,
    selectedBranchId,
    setSelectedBranchId,
    selectedMonth,
    setSelectedMonth,
    isOnline,
    lockApp,
    invoices,
  } = useHostel();

  const overdueCount = invoices.filter(
    (i) => i.status === "overdue" && i.month === selectedMonth
  ).length;
  const totalNotifications = overdueCount > 0 ? 1 : 0;

  const monthsList = [
    { value: "2026-11", label: "Nov 2026" },
    { value: "2026-10", label: "Oct 2026" },
    { value: "2026-09", label: "Sep 2026" },
    { value: "2026-08", label: "Aug 2026" },
  ];

  return (
    <>
      {/* Offline Alert Strip */}
      {!isOnline && (
        <div className="bg-amber-500 text-black px-4 py-1 text-xs font-semibold flex items-center justify-center gap-2 sticky top-0 z-50">
          <WifiOff className="w-3.5 h-3.5" />
          Offline Mode: Payment entries will be queued locally and synced automatically when connected.
        </div>
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 glass-nav border-b border-gray-200/80 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
            {/* Brand Logo & Title */}
            <div
              onClick={() => setCurrentTab("dashboard")}
              className="flex items-center gap-2.5 cursor-pointer flex-shrink-0"
            >
              <div className="w-9 h-9 rounded-xl bg-gold-gradient flex items-center justify-center shadow-gold-sm text-[#14120E] font-serif font-black text-lg">
                A
              </div>
              <div>
                <h1 className="font-serif-heading font-bold text-base sm:text-lg tracking-tight text-[#0F243F] dark:text-[#F9FAFB] flex items-center gap-1.5">
                  Aishwaraya Hostels
                  <span className="text-[10px] font-sans font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-[#8A6A1B] dark:text-[#E2BF6C] border border-amber-200 dark:border-amber-800">
                    Console
                  </span>
                </h1>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block">
                  Tambaram, Chennai • 8 Branches
                </p>
              </div>
            </div>

            {/* Quick Search & Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Command Palette Trigger */}
              <button
                onClick={onOpenCommandPalette}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-xs text-gray-500 dark:text-gray-400 hover:border-[#D6AB47] transition"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search residents, rooms...</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 font-mono text-[10px]">
                  Ctrl+K
                </kbd>
              </button>

              {/* Month Selector */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#D6AB47]"
              >
                {monthsList.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              {/* Online/Offline Pill */}
              <div
                className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border ${
                  isOnline
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-200"
                }`}
              >
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{isOnline ? "Live" : "Offline"}</span>
              </div>

              {/* Notifications */}
              <button
                onClick={() => setCurrentTab("rent")}
                className="relative p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {totalNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#14120E]" />
                )}
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode((prev) => !prev)}
                className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                title="Toggle Theme"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Lock Console Button */}
              <button
                onClick={lockApp}
                className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition"
                title="Lock Console"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Branch Pill Carousel with Sliding Gold Indicator */}
          <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
            <button
              onClick={() => setSelectedBranchId("all")}
              className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors z-10 ${
                selectedBranchId === "all"
                  ? "text-[#14120E]"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {selectedBranchId === "all" && (
                <motion.div
                  layoutId="branchIndicator"
                  className="absolute inset-0 bg-gold-gradient rounded-full shadow-gold-sm -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              All Branches (8)
            </button>

            {branches.map((b) => {
              const isSelected = selectedBranchId === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBranchId(b.id)}
                  className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors z-10 ${
                    isSelected
                      ? "text-[#14120E]"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="branchIndicator"
                      className="absolute inset-0 bg-gold-gradient rounded-full shadow-gold-sm -z-10"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  {b.name}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Desktop Main Navigation Tabs Bar */}
      <div className="hidden md:block bg-white dark:bg-[#1A1713] border-b border-gray-200/80 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex items-center gap-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: Building2 },
              { id: "rooms", label: "Bed-Map & Rooms", icon: Bed },
              { id: "rent", label: "Rent Collection", icon: IndianRupee },
              { id: "residents", label: "Residents", icon: Users },
              { id: "vacancy", label: "Vacancy Board", icon: Compass },
              { id: "reports", label: "Reports & Dues", icon: SlidersHorizontal },
              { id: "settings", label: "Settings", icon: SlidersHorizontal },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as any)}
                  className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition ${
                    isActive
                      ? "border-[#D6AB47] text-[#8A6A1B] dark:text-[#E2BF6C]"
                      : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Navigation (Thumb-friendly 44px min tap targets) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-sheet border-t border-gray-200/80 dark:border-gray-800 pb-safe">
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {[
            { id: "dashboard", label: "Home", icon: Building2 },
            { id: "rooms", label: "Rooms", icon: Bed },
            { id: "rent", label: "Rent", icon: IndianRupee },
            { id: "residents", label: "Tenants", icon: Users },
            { id: "vacancy", label: "Vacancy", icon: Compass },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as any)}
                className={`flex flex-col items-center justify-center h-full min-h-[44px] transition active:scale-95 ${
                  isActive
                    ? "text-[#8A6A1B] dark:text-[#E2BF6C] font-bold"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive ? "bg-amber-100/60 dark:bg-amber-950/60" : ""}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
