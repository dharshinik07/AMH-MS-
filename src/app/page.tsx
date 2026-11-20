"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DeviceGate } from "@/components/DeviceGate";
import { AppShell, TabType } from "@/components/AppShell";
import { Dashboard } from "@/components/Dashboard";
import { BedMap } from "@/components/BedMap";
import { RentCollectionScreen } from "@/components/RentCollectionScreen";
import { ResidentsDirectory } from "@/components/ResidentsDirectory";
import { VacancyBoard } from "@/components/VacancyBoard";
import { OutstandingReport } from "@/components/OutstandingReport";
import { SettingsScreen } from "@/components/SettingsScreen";
import { AddResidentModal } from "@/components/AddResidentModal";
import { VacateModal } from "@/components/VacateModal";
import { TransferModal } from "@/components/TransferModal";
import { CommandPalette } from "@/components/CommandPalette";
import { useHostel } from "@/lib/store";

export default function HomePage() {
  const pathname = usePathname();
  const router = useRouter();
  const { setSelectedBranchId } = useHostel();

  const currentTab: TabType = (() => {
    if (pathname === "/rooms") return "rooms";
    if (pathname === "/rent") return "rent";
    if (pathname === "/residents") return "residents";
    if (pathname === "/vacancy") return "vacancy";
    if (pathname === "/reports") return "reports";
    if (pathname === "/settings") return "settings";
    return "dashboard";
  })();

  const setCurrentTab = (tab: TabType) => {
    router.push(tab === "dashboard" ? "/dashboard" : `/${tab}`);
  };

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Modals
  const [isAddResidentOpen, setIsAddResidentOpen] = useState(false);
  const [addResidentPrefill, setAddResidentPrefill] = useState<any>(null);

  const [isVacateOpen, setIsVacateOpen] = useState(false);
  const [vacateResidentId, setVacateResidentId] = useState("");

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferResidentId, setTransferResidentId] = useState("");

  const handleStartAddResident = (prefill?: any) => {
    setAddResidentPrefill(prefill || null);
    setIsAddResidentOpen(true);
  };

  const handleStartVacate = (residentId: string) => {
    setVacateResidentId(residentId);
    setIsVacateOpen(true);
  };

  const handleStartTransfer = (residentId: string) => {
    setTransferResidentId(residentId);
    setIsTransferOpen(true);
  };

  const handleRecordPayment = (residentId: string) => {
    setCurrentTab("rent");
  };

  const handleCommandSelect = (action: string, payload?: any) => {
    if (action === "ADD_RESIDENT") {
      handleStartAddResident();
    } else if (action === "NAVIGATE") {
      setCurrentTab(payload as TabType);
    } else if (action === "VIEW_RESIDENT") {
      setCurrentTab("residents");
    } else if (action === "VIEW_ROOM") {
      setCurrentTab("rooms");
    }
  };

  return (
    <DeviceGate>
      <AppShell
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      >
        {currentTab === "dashboard" && (
          <Dashboard
            onNavigateToRooms={(branchId) => {
              if (branchId) setSelectedBranchId(branchId);
              setCurrentTab("rooms");
            }}
            onNavigateToRent={() => setCurrentTab("rent")}
            onNavigateToVacancy={() => setCurrentTab("vacancy")}
            onStartAddResident={handleStartAddResident}
            onStartVacate={handleStartVacate}
            onRecordPayment={handleRecordPayment}
          />
        )}

        {currentTab === "rooms" && (
          <BedMap
            onStartAddResident={handleStartAddResident}
            onStartVacate={handleStartVacate}
            onStartTransfer={handleStartTransfer}
            onRecordPayment={handleRecordPayment}
          />
        )}

        {currentTab === "rent" && (
          <RentCollectionScreen
            onStartTransfer={handleStartTransfer}
            onStartVacate={handleStartVacate}
          />
        )}

        {currentTab === "residents" && (
          <ResidentsDirectory
            onStartAddResident={() => handleStartAddResident()}
            onStartVacate={handleStartVacate}
            onStartTransfer={handleStartTransfer}
            onRecordPayment={handleRecordPayment}
          />
        )}

        {currentTab === "vacancy" && (
          <VacancyBoard onStartAddResident={handleStartAddResident} />
        )}

        {currentTab === "reports" && <OutstandingReport />}

        {currentTab === "settings" && <SettingsScreen />}

        {/* Global Modals & Command Palette */}
        <AddResidentModal
          isOpen={isAddResidentOpen}
          onClose={() => setIsAddResidentOpen(false)}
          prefill={addResidentPrefill}
        />

        <VacateModal
          isOpen={isVacateOpen}
          onClose={() => setIsVacateOpen(false)}
          residentId={vacateResidentId}
        />

        <TransferModal
          isOpen={isTransferOpen}
          onClose={() => setIsTransferOpen(false)}
          residentId={transferResidentId}
        />

        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onSelectAction={handleCommandSelect}
        />
      </AppShell>
    </DeviceGate>
  );
}
