"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Bed,
  IndianRupee,
  Users,
  Compass,
  BarChart3,
  Smartphone,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  Building2,
  Lock,
  Plus,
  UserPlus,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { useHostel } from "@/lib/store";
import { BranchSwitcher } from "./BranchSwitcher";
import { NavItem } from "./shell/NavItem";
import { NetworkBanner } from "./ui/NetworkBanner";
import { AddResidentModal } from "./AddResidentModal";

export type TabType =
  | "dashboard"
  | "rooms"
  | "rent"
  | "residents"
  | "vacancy"
  | "reports"
  | "settings";

interface AppShellProps {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  onOpenCommandPalette: () => void;
  children: React.ReactNode;
}

export function AppShell({
  currentTab,
  setCurrentTab,
  onOpenCommandPalette,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const {
    currentUser,
    branches,
    selectedBranchId,
    selectedMonth,
    setSelectedMonth,
    invoices,
    residents,
    lockApp,
  } = useHostel();

  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [tabletSidebarOpen, setTabletSidebarOpen] = useState(false);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [isAddResidentOpen, setIsAddResidentOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [prefillResidentId, setPrefillResidentId] = useState<string>("");

  // Scroll detection for hiding/showing bottom nav on mobile
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 8);

      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        // Scrolling down -> hide mobile nav
        setIsNavVisible(false);
      } else {
        // Scrolling up -> show mobile nav
        setIsNavVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);
  const overdueCount = invoices.filter(
    (i) => i.status === "overdue" && i.month === selectedMonth
  ).length;

  const pageTitles: Record<TabType, { title: string; subtitle: string }> = {
    dashboard: {
      title: "Dashboard",
      subtitle: "Executive overview of occupancy, dues and branch health",
    },
    rooms: {
      title: "Rooms & Beds",
      subtitle: "Visual floor-plan bed map and room directory",
    },
    rent: {
      title: "Rent Collection",
      subtitle: "Live ledger of paid, pending, overdue and partial payments",
    },
    residents: {
      title: "Residents",
      subtitle: "Complete tenant roster, food plans and 12-month payment records",
    },
    vacancy: {
      title: "Vacancy Board",
      subtitle: "Live vacant beds across all 8 branches",
    },
    reports: {
      title: "Reports & Aging",
      subtitle: "Collection analytics, aging buckets and financial exports",
    },
    settings: {
      title: "Settings",
      subtitle: "Hostel configurations, rate cards and reminder templates",
    },
  };

  const navSections = [
    {
      group: "OVERVIEW",
      items: [
        { id: "dashboard" as TabType, href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      group: "OPERATIONS",
      items: [
        { id: "rooms" as TabType, href: "/rooms", label: "Rooms & Beds", icon: Bed },
        { id: "rent" as TabType, href: "/rent", label: "Rent Collection", icon: IndianRupee },
        { id: "residents" as TabType, href: "/residents", label: "Residents", icon: Users },
        { id: "vacancy" as TabType, href: "/vacancy", label: "Vacancy Board", icon: Compass },
      ],
    },
    {
      group: "INSIGHTS",
      items: [
        { id: "reports" as TabType, href: "/reports", label: "Reports", icon: BarChart3 },
      ],
    },
    {
      group: "SYSTEM",
      items: [
        { id: "settings" as TabType, href: "/settings", label: "Settings", icon: Settings },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col relative selection:bg-[#F8EDD0] selection:text-[#8A6A1B] overflow-x-clip">
      {/* Offline sync banner */}
      <NetworkBanner />

      {/* Ambient background glows */}
      <div className="ambient-glow-top hidden md:block" />
      <div className="ambient-glow-bottom hidden md:block" />

      {/* 1. TABLET ICON-ONLY SIDEBAR (72px) - Visible md to lg (768px to 1023px) */}
      <aside className="hidden md:flex lg:hidden flex-col w-[72px] fixed inset-y-0 left-0 bg-navy-gradient border-r border-[#293C55] z-40 shadow-xl items-center py-4 justify-between">
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Logo Button expands tablet drawer */}
          <button
            onClick={() => setTabletSidebarOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-xl bg-gold-gradient text-[#0F243F] font-serif text-xl font-bold shadow-[0_6px_16px_rgba(214,171,71,.35)] active:scale-95 transition"
            title="Expand Menu"
            aria-label="Expand Menu"
          >
            A
          </button>

          {/* Quick Icon Links */}
          <nav className="flex flex-col items-center gap-2 w-full px-2">
            {[
              { id: "dashboard" as TabType, href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "rooms" as TabType, href: "/rooms", label: "Rooms", icon: Bed },
              { id: "rent" as TabType, href: "/rent", label: "Rent", icon: IndianRupee },
              { id: "residents" as TabType, href: "/residents", label: "Residents", icon: Users },
              { id: "vacancy" as TabType, href: "/vacancy", label: "Vacancy", icon: Compass },
            ].map((item) => {
              const Icon = item.icon;
              const isActive =
                item.id === "dashboard"
                  ? pathname === "/" || pathname === "/dashboard"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setCurrentTab(item.id)}
                  title={item.label}
                  aria-label={item.label}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${
                    isActive
                      ? "bg-gold-gradient text-[#0F243F] shadow-md font-bold"
                      : "text-[#C9D3E0] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Lock and More */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => setTabletSidebarOpen(true)}
            className="w-11 h-11 rounded-xl text-[#C9D3E0] hover:bg-white/10 hover:text-white flex items-center justify-center transition"
            title="All Navigation"
            aria-label="All Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={lockApp}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/15 text-[#B8C4D4] hover:text-white flex items-center justify-center transition"
            title="Lock Console"
            aria-label="Lock Console"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* TABLET FULL OVERLAY SIDEBAR (Expanded on click) */}
      <AnimatePresence>
        {tabletSidebarOpen && (
          <div className="md:block lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTabletSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="relative z-10 w-[260px] h-full bg-navy-gradient border-r border-[#293C55] shadow-2xl flex flex-col justify-between py-4"
            >
              <div className="px-5 border-b border-[#293C55] pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold-gradient text-[#0F243F] font-serif text-lg font-bold">
                    A
                  </div>
                  <div>
                    <div className="font-bold text-[15px] text-white">Aishwaraya</div>
                    <div className="text-[10px] uppercase tracking-wider text-[#D6AB47]">
                      Hostels Console
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setTabletSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
                {navSections.map((sec) => (
                  <div key={sec.group}>
                    <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#7D8CA3]">
                      {sec.group}
                    </div>
                    <div className="space-y-1">
                      {sec.items.map((it) => (
                        <NavItem
                          key={it.id}
                          href={it.href}
                          label={it.label}
                          icon={it.icon}
                          active={pathname === it.href}
                          onClick={() => {
                            setCurrentTab(it.id);
                            setTabletSidebarOpen(false);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 m-2 rounded-xl bg-white/5 border border-[#293C55]">
                <div className="text-[12px] text-white font-medium">{currentUser.full_name}</div>
                <div className="text-[11px] text-[#D6AB47]">Hostel Staff Console</div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* 2. DESKTOP FIXED SIDEBAR (248px) - Visible ≥ 1024px */}
      <aside className="hidden lg:flex flex-col w-[248px] fixed inset-y-0 left-0 bg-navy-gradient border-r border-[#293C55] z-40 shadow-xl">
        {/* Logo Tile */}
        <div className="h-16 px-5 border-b border-[#293C55] flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gold-gradient text-[#0F243F] font-serif text-xl font-bold shadow-[0_6px_16px_rgba(214,171,71,.35)] shrink-0">
            A
          </div>
          <div className="min-w-0">
            <div className="font-sans font-bold text-[16px] leading-tight text-white tracking-tight truncate">
              Aishwaraya
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#D6AB47]">
              Hostels Console
            </div>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navSections.map((section) => (
            <div key={section.group}>
              <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#7D8CA3]">
                {section.group}
              </div>
              <nav className="isolate space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    item.id === "dashboard"
                      ? pathname === "/" || pathname === "/dashboard"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <NavItem
                      key={item.id}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={isActive}
                      onClick={() => setCurrentTab(item.id)}
                    />
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom User Card */}
        <div className="p-3.5 m-2.5 rounded-2xl bg-white/[0.06] border border-[#293C55] backdrop-blur-md space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8C4D4]">
              Staff Console
            </span>
            <span className="text-[11px] font-bold text-[#8A6A1B] bg-[#F8EDD0] border border-[#E2BF6C] px-2 py-0.5 rounded-full shadow-xs">
              Authenticated
            </span>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <div className="min-w-0 pr-2">
              <div className="text-[13px] font-semibold text-white truncate">
                {currentUser.full_name}
              </div>
              <div className="text-[11px] text-[#B8C4D4] capitalize">
                {currentUser.role}
              </div>
            </div>

            <button
              onClick={lockApp}
              className="p-1.5 rounded-lg text-[#B8C4D4] hover:text-white hover:bg-white/10 transition touch-target flex items-center justify-center"
              title="Lock Console"
              aria-label="Lock Console"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 3. MAIN LAYOUT AREA */}
      <div className="flex-1 flex flex-col md:pl-[72px] lg:pl-[248px] min-w-0 relative z-10">
        {/* Sticky Top Bar (56px on mobile, 64px on md+) */}
        <header
          className={`sticky top-0 z-30 h-14 md:h-16 bg-white/90 backdrop-blur-md border-b border-[#E3E8EF] px-3.5 sm:px-6 md:px-8 flex items-center justify-between gap-2.5 transition-all duration-200 ${
            isScrolled ? "shadow-[0_4px_20px_rgba(15,36,63,0.06)] bg-white/95" : ""
          }`}
        >
          {/* Left: Logo Tile on Mobile (<768px) + Page Title */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            {/* Mobile Logo Tile */}
            <div className="md:hidden grid h-9 w-9 place-items-center rounded-xl bg-gold-gradient text-[#0F243F] font-serif text-lg font-bold shadow-xs shrink-0">
              A
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="font-serif-heading text-[18px] sm:text-[20px] md:text-[22px] font-bold text-[#0F243F] truncate leading-tight">
                {pageTitles[currentTab]?.title || "Console"}
              </h1>
              <div className="w-8 sm:w-10 h-[2.5px] rounded-full bg-gold-gradient mt-0.5" />
            </div>

            {/* Selected Branch Chip (Desktop) */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#EEF2F7] text-[13px] font-semibold text-[#0F243F] border border-[#E3E8EF] shrink-0">
              <Building2 className="w-3.5 h-3.5 text-[#8A6A1B]" />
              <span className="truncate max-w-[140px] md:max-w-none">
                {selectedBranchId === "all" ? "All 8 Branches" : selectedBranch?.name}
              </span>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Desktop Branch Switcher */}
            <div className="hidden sm:block">
              <BranchSwitcher />
            </div>

            {/* Month Selector (Desktop header) */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="hidden sm:block h-10 sm:h-11 px-2.5 sm:px-3 rounded-xl border border-[#E3E8EF] bg-white text-[#0F243F] text-[13px] sm:text-[14px] font-semibold focus-ring-gold shadow-xs cursor-pointer"
            >
              <option value="2026-11">Nov 2026</option>
              <option value="2026-10">Oct 2026</option>
              <option value="2026-09">Sep 2026</option>
              <option value="2026-08">Aug 2026</option>
            </select>

            {/* Search Trigger */}
            <button
              onClick={onOpenCommandPalette}
              className="h-10 sm:h-11 px-2.5 sm:px-3 rounded-xl border border-[#E3E8EF] bg-white hover:bg-[#EEF2F7] text-[#0F243F] flex items-center gap-2 text-[14px] transition shadow-xs focus-ring-gold touch-target"
              title="Search console (Ctrl+K)"
              aria-label="Search console"
            >
              <Search className="w-4 h-4 text-[#6B7A90]" />
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-[#EEF2F7] border border-[#E3E8EF] text-[11px] font-mono text-[#6B7A90]">
                Ctrl+K
              </kbd>
            </button>

            {/* Notifications */}
            <button
              onClick={() => setCurrentTab("rent")}
              className="h-10 sm:h-11 w-10 sm:w-11 rounded-xl border border-[#E3E8EF] bg-white hover:bg-[#EEF2F7] text-[#0F243F] flex items-center justify-center relative transition shadow-xs focus-ring-gold touch-target"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {overdueCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#D6336C] animate-pulse-soft" />
              )}
            </button>
          </div>
        </header>

        {/* Mobile Sub-Header Strip (Branch Switcher + Month Selector Side-by-Side!) */}
        <div className="sm:hidden px-3.5 py-2 bg-white/95 backdrop-blur-md border-b border-[#E3E8EF] flex items-center gap-2 shadow-2xs">
          <div className="flex-1 min-w-0">
            <BranchSwitcher isMobileFullWidth />
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-10 px-2.5 rounded-xl border border-[#E3E8EF] bg-[#F8F9FC] text-[#0F243F] text-[13px] font-semibold focus-ring-gold shadow-2xs shrink-0 cursor-pointer"
          >
            <option value="2026-11">Nov 2026</option>
            <option value="2026-10">Oct 2026</option>
            <option value="2026-09">Sep 2026</option>
            <option value="2026-08">Aug 2026</option>
          </select>
        </div>

        {/* 4. MAIN PAGE CONTENT with Responsive Max-Width (1280px capped, centered) */}
        <main className="flex-1 w-full max-w-[1280px] mx-auto p-3.5 sm:p-6 md:p-8 pb-28 md:pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* 5. FLOATING QUICK ACTION BUTTON (+) ON MOBILE SCREENS (<768px) with Auto-Hide on Scroll */}
      <motion.div
        animate={{ y: isNavVisible ? 0 : 80, opacity: isNavVisible ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="md:hidden fixed bottom-20 right-3.5 z-40 pointer-events-auto"
      >
        <div className="relative">
          <AnimatePresence>
            {fabMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 10 }}
                className="absolute bottom-14 right-0 w-48 bg-white rounded-2xl shadow-2xl border border-[#E3E8EF] p-2 space-y-1 mb-2 text-[#0F243F]"
              >
                <button
                  onClick={() => {
                    setFabMenuOpen(false);
                    setIsAddResidentOpen(true);
                  }}
                  className="w-full h-11 px-3 rounded-xl hover:bg-[#FDF8EA] text-slate-800 hover:text-[#8A6A1B] flex items-center gap-2.5 text-[13px] font-semibold transition"
                >
                  <UserPlus className="w-4 h-4 text-[#8A6A1B]" />
                  <span>New Resident</span>
                </button>
                <button
                  onClick={() => {
                    setFabMenuOpen(false);
                    setCurrentTab("rent");
                  }}
                  className="w-full h-11 px-3 rounded-xl hover:bg-[#FDF8EA] text-slate-800 hover:text-[#8A6A1B] flex items-center gap-2.5 text-[13px] font-semibold transition"
                >
                  <CreditCard className="w-4 h-4 text-[#8A6A1B]" />
                  <span>Collect Rent</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setFabMenuOpen((prev) => !prev)}
            className="w-12 h-12 rounded-full bg-gold-gradient text-[#0F243F] shadow-[0_6px_20px_rgba(214,171,71,.45)] flex items-center justify-center transition active:scale-90"
            aria-label="Quick Actions"
          >
            <motion.div
              animate={{ rotate: fabMenuOpen ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </motion.div>
          </button>
        </div>
      </motion.div>

      {/* 6. MOBILE BOTTOM TAB BAR (<768px) with Auto-Hide on Scroll Down */}
      <motion.nav
        animate={{ y: isNavVisible ? 0 : 80 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 pb-safe bg-[#0F243F] border-t border-[#293C55] grid grid-cols-5 items-center px-1 shadow-2xl isolate"
      >
        {[
          { id: "dashboard" as TabType, href: "/dashboard", label: "Home", icon: LayoutDashboard },
          { id: "rooms" as TabType, href: "/rooms", label: "Rooms", icon: Bed },
          { id: "rent" as TabType, href: "/rent", label: "Rent", icon: IndianRupee },
          { id: "residents" as TabType, href: "/residents", label: "Residents", icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.id === "dashboard"
              ? pathname === "/" || pathname === "/dashboard"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              onClick={() => setCurrentTab(tab.id)}
              className={`relative flex flex-col items-center justify-center h-full min-h-[48px] min-w-[48px] transition rounded-xl ${
                isActive ? "text-[#0F243F] font-bold" : "text-[#C9D3E0] hover:text-white"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="mobile-nav-pill"
                  className="absolute inset-1 -z-10 rounded-xl bg-gold-gradient shadow-[0_4px_12px_rgba(214,171,71,.35)]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Icon className="relative z-10 w-5 h-5" />
              <span className="relative z-10 text-[11px] mt-0.5 leading-none">{tab.label}</span>
            </Link>
          );
        })}

        {/* "More" Menu Button */}
        <button
          onClick={() => setMobileMoreOpen(true)}
          className={`relative flex flex-col items-center justify-center h-full min-h-[48px] min-w-[48px] transition rounded-xl ${
            ["vacancy", "reports", "settings"].includes(currentTab)
              ? "text-[#0F243F] font-bold"
              : "text-[#C9D3E0] hover:text-white"
          }`}
          aria-label="More Options"
        >
          {["vacancy", "reports", "settings"].includes(currentTab) && (
            <motion.span
              layoutId="mobile-nav-pill"
              className="absolute inset-1 -z-10 rounded-xl bg-gold-gradient shadow-[0_4px_12px_rgba(214,171,71,.35)]"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            />
          )}
          <Menu className="relative z-10 w-5 h-5" />
          <span className="relative z-10 text-[11px] mt-0.5 leading-none">More</span>
        </button>
      </motion.nav>

      {/* Mobile "More" Bottom Sheet */}
      <AnimatePresence>
        {mobileMoreOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="w-full bg-[#0F243F] rounded-t-3xl border-t border-[#293C55] p-5 pb-safe max-h-[80dvh] overflow-y-auto shadow-2xl text-white"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-[#293C55] mb-3">
                <span className="font-serif-heading text-[18px] text-white">
                  More Operations
                </span>
                <button
                  onClick={() => setMobileMoreOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-[#C9D3E0] flex items-center justify-center"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5">
                {[
                  { id: "vacancy" as TabType, href: "/vacancy", label: "Vacancy Board", icon: Compass },
                  { id: "reports" as TabType, href: "/reports", label: "Reports & Aging", icon: BarChart3 },
                  { id: "settings" as TabType, href: "/settings", label: "Settings & Rates", icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => {
                        setCurrentTab(item.id);
                        setMobileMoreOpen(false);
                      }}
                      className={`w-full h-12 px-3.5 rounded-xl flex items-center justify-between text-[14px] font-semibold transition touch-target ${
                        isActive
                          ? "bg-gold-gradient text-[#0F243F]"
                          : "text-[#C9D3E0] hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </Link>
                  );
                })}

                <div className="divider-gold-fade my-2 opacity-30" />

                <button
                  onClick={() => {
                    setMobileMoreOpen(false);
                    lockApp();
                  }}
                  className="w-full h-12 px-3.5 rounded-xl flex items-center gap-3 text-[14px] font-semibold text-rose-400 hover:bg-white/5 transition touch-target"
                >
                  <Lock className="w-5 h-5" />
                  <span>Lock Console Now</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Quick Modals */}
      <AddResidentModal
        isOpen={isAddResidentOpen}
        onClose={() => setIsAddResidentOpen(false)}
      />
    </div>
  );
}
