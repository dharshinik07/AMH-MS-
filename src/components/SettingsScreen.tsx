"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Percent,
  MessageSquare,
  Users2,
  Download,
  Upload,
  Check,
  MapPin,
  Phone,
  ExternalLink,
  Plus,
  Trash2,
  ShieldCheck,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowLeft,
  UserCheck,
  Key,
  Copy,
  Eye,
  EyeOff,
  UserPlus,
  ShieldAlert,
  AlertCircle,
} from "lucide-react";
import { useHostel } from "@/lib/store";
import { formatRupee } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useDevice";
import { validatePasswordPolicy } from "@/lib/auth-crypto";
import {
  BRANCHES,
  COMPANY,
  ROOM_TYPES,
  ALLOWED_SHARING_MAP,
  COMMERCIAL_RULES,
  getRoomTypeConfig,
} from "@/config/business";

type SettingsSubSection =
  | "account"
  | "branches"
  | "rates"
  | "reminders"
  | "roles"
  | "backup"
  | "about";

export function SettingsScreen() {
  const {
    currentUser,
    branches,
    rooms,
    beds,
    addRoom,
    deleteRoom,
    changePassword,
    exportDatabaseJSON,
    importDatabaseJSON,
    isDemoMode,
    clearDemoData,
    loadDemoData,
  } = useHostel();

  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState<SettingsSubSection>("account");
  const [mobileView, setMobileView] = useState<"menu" | "detail">("menu");
  const [templateLang, setTemplateLang] = useState<"en" | "ta">("en");
  const [importSuccess, setImportSuccess] = useState(false);

  // Read URL query parameter if navigated with ?section=account
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const section = params.get("section") as SettingsSubSection;
      if (section && ["account", "branches", "rates", "reminders", "roles", "backup", "about"].includes(section)) {
        setActiveSection(section);
        if (isMobile) setMobileView("detail");
      }
    }
  }, [isMobile]);

  // Account / Change Password state
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [isSubmittingPass, setIsSubmittingPass] = useState(false);

  // Staff management state (Owner only)
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [staffUsername, setStaffUsername] = useState("");
  const [staffFullName, setStaffFullName] = useState("");
  const [staffRole, setStaffRole] = useState<"warden" | "branch_manager">("warden");
  const [staffBranches, setStaffBranches] = useState<string[]>([]);
  const [createStaffError, setCreateStaffError] = useState("");
  const [generatedTempPass, setGeneratedTempPass] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingPass) return;
    setPassError("");
    setPassSuccess("");

    if (!currentUser?.must_change_password && !currentPass) {
      setPassError("Current password is required.");
      return;
    }

    if (newPass !== confirmPass) {
      setPassError("New passwords do not match.");
      return;
    }

    const policy = validatePasswordPolicy(newPass, currentUser?.username);
    if (!policy.isValid) {
      setPassError(policy.errors[0] || "Password does not meet requirements.");
      return;
    }

    setIsSubmittingPass(true);
    const res = await changePassword({
      currentPassword: currentPass,
      newPassword: newPass,
      confirmPassword: confirmPass,
    });
    setIsSubmittingPass(false);

    if (res.success) {
      setPassSuccess("Password updated successfully! All other sessions have been signed out.");
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
    } else {
      setPassError(res.error || "Failed to update password.");
    }
  };

  const fetchStaffList = async () => {
    if (currentUser?.role !== "owner") return;
    setIsLoadingStaff(true);
    try {
      const res = await fetch("/api/auth/staff");
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setStaffUsers(data.users);
      }
    } catch {}
    setIsLoadingStaff(false);
  };

  useEffect(() => {
    if (activeSection === "roles") {
      fetchStaffList();
    }
  }, [activeSection]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateStaffError("");
    try {
      const res = await fetch("/api/auth/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          username: staffUsername,
          full_name: staffFullName,
          role: staffRole,
          assigned_branch_ids: staffBranches,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedTempPass(data.temporaryPassword);
        setStaffUsername("");
        setStaffFullName("");
        setStaffBranches([]);
        fetchStaffList();
      } else {
        setCreateStaffError(data.error || "Failed to create staff account.");
      }
    } catch {
      setCreateStaffError("Failed to create staff account.");
    }
  };

  const handleResetStaffPassword = async (userId: string) => {
    try {
      const res = await fetch("/api/auth/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password", userId }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedTempPass(data.temporaryPassword);
        fetchStaffList();
      }
    } catch {}
  };

  const handleToggleStaffStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/auth/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_status", userId, active: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStaffList();
      }
    } catch {}
  };

  const SETTINGS_ITEMS = [
    { id: "account" as SettingsSubSection, label: "Account & Password", desc: "Change your password and view account security", icon: UserCheck },
    { id: "branches" as SettingsSubSection, label: "Branches & Rooms", desc: "Manage 8 branches, room layout and bed setup", icon: Building2 },
    { id: "rates" as SettingsSubSection, label: "Room Types & Tariff", desc: "Official tariffs, amenities, deposit rules", icon: Percent },
    { id: "reminders" as SettingsSubSection, label: "Reminder Templates", desc: "WhatsApp and SMS reminder templates in English & Tamil", icon: MessageSquare },
    { id: "roles" as SettingsSubSection, label: "Users & Roles", desc: "Manage staff logins, passwords and permissions", icon: Users2 },
    { id: "backup" as SettingsSubSection, label: "Backup & Export", desc: "Export database JSON and restore backups", icon: Download },
    { id: "about" as SettingsSubSection, label: "About Console", desc: "Official hostel contacts, head office, and licensing", icon: Info },
  ];

  // Setup Wizard State
  const [selectedBranchId, setSelectedBranchId] = useState<string>(BRANCHES[0].id);
  const [showAddRoomModal, setShowAddRoomModal] = useState<boolean>(false);
  const [wizardRoomNo, setWizardRoomNo] = useState<string>("");
  const [wizardFloor, setWizardFloor] = useState<number>(1);
  const [wizardType, setWizardType] = useState<"AC" | "Non-AC">("AC");
  const [wizardSharing, setWizardSharing] = useState<2 | 3 | 4 | 6>(2);
  const [wizardRent, setWizardRent] = useState<string>("");
  const [wizardError, setWizardError] = useState<string>("");

  const englishTemplate = `Dear {resident_name},
Gentle reminder regarding your monthly hostel rent of {amount} for {month} at ${COMPANY.name} ({branch}).
Kindly make the payment via UPI or to the warden at your earliest.
Helpline: ${COMPANY.phone}. Thank you!`;

  const tamilTemplate = `அன்புடைய {resident_name},
${COMPANY.name} ({branch}) தங்களது {month} மாத வாடகைத் தொகை {amount} நிலுவையில் உள்ளது.
இதை UPI மூலமாகவோ அல்லது வார்டனிடம் செலுத்துமாறு அன்புடன் கேட்டுக்கொள்கிறோம்.
தொடர்புக்கு: ${COMPANY.phone}. நன்றி!`;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importDatabaseJSON(content);
        if (ok) {
          setImportSuccess(true);
          setTimeout(() => setImportSuccess(false), 3000);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleRoomTypeSelect = (type: "AC" | "Non-AC") => {
    setWizardType(type);
    const allowed = ALLOWED_SHARING_MAP[type];
    setWizardSharing(allowed[0]);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setWizardError("");

    if (!wizardRoomNo.trim()) {
      setWizardError("Please enter a room number (e.g., 101, 202).");
      return;
    }

    try {
      const rentVal = wizardRent.trim() ? Number(wizardRent) : null;
      await addRoom({
        branchId: selectedBranchId,
        roomNo: wizardRoomNo.trim(),
        floor: wizardFloor,
        roomType: wizardType,
        sharing: wizardSharing,
        monthlyRentPerBed: rentVal,
      });

      setWizardRoomNo("");
      setWizardRent("");
      setShowAddRoomModal(false);
    } catch (err: any) {
      setWizardError(err.message || "Failed to create room.");
    }
  };

  const activeBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];
  const activeBranchRooms = rooms.filter((r) => r.branch_id === selectedBranchId);

  return (
    <div className="space-y-6">
      {/* 1. HEADER ROW */}
      <div className="pb-2 border-b border-[#E8EAEF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif-heading text-[24px] sm:text-[28px] text-[#0F243F] font-bold leading-tight">
            Console Settings
          </h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Configure branch room layouts, verified room tariffs, reminder templates and backups
          </p>
        </div>

        {isDemoMode && (
          <button
            onClick={() => clearDemoData()}
            className="btn-secondary text-[12px] h-9 px-3 text-[#D6336C] hover:border-[#D6336C]/40"
          >
            Clear Demo Data
          </button>
        )}
      </div>

      {/* 2. SUB-NAVIGATION & CONTENT LAYOUT */}
      {/* MOBILE MENU VIEW (Shown on mobile when menu is active) */}
      <div className="md:hidden">
        {mobileView === "menu" ? (
          <div className="space-y-3">
            <p className="text-[13px] text-slate-500 pb-1">
              Select a category to view and adjust console settings:
            </p>
            {SETTINGS_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileView("detail");
                  }}
                  className="w-full p-4 rounded-2xl bg-white border border-[#E8EAEF] hover:border-[#D6AB47] active:bg-[#FDF8EA]/40 text-left flex items-center justify-between gap-3.5 transition shadow-xs min-h-[64px]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#FDF8EA] border border-[#F8EDD0] flex items-center justify-center text-[#8A6A1B] shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-[15px] text-slate-900">{item.label}</div>
                      <div className="text-[12px] text-slate-500 truncate">{item.desc}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="pb-3">
            <button
              onClick={() => setMobileView("menu")}
              className="btn-secondary min-h-[44px] px-4 inline-flex items-center gap-2 text-[13px] font-semibold"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>Back to Settings Categories</span>
            </button>
          </div>
        )}
      </div>

      {/* DESKTOP SIDEBAR + CONTENT (Or Mobile Detail View) */}
      <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 ${mobileView === "menu" ? "hidden md:grid" : "grid"}`}>
        {/* Left Sub-Nav (Desktop only, 1 column) */}
        <div className="hidden md:block space-y-1">
          {SETTINGS_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full h-11 px-3.5 rounded-xl text-left text-[14px] font-semibold flex items-center gap-3 transition ${
                  isActive
                    ? "bg-[#FDF8EA] text-[#8A6A1B] border border-[#F8EDD0] shadow-xs"
                    : "text-slate-600 hover:bg-[#F3F4F6] hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#8A6A1B]" : "text-slate-500"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content Pane (3 columns) */}
        <div className="md:col-span-3 space-y-6">
          {/* ACCOUNT & PASSWORD */}
          {activeSection === "account" && (
            <div className="space-y-6">
              {/* Weak password alert if uses initial password */}
              {currentUser?.uses_initial_password && (
                <div className="p-4 rounded-2xl bg-[#FDF8EA] border border-[#D6AB47]/40 text-[#8A6A1B] flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-[#8A6A1B]" />
                  <div className="text-[13px]">
                    <strong className="block text-slate-900">Default Password In Use</strong>
                    You are currently signed in using the default initial password. Change it to keep your hostel data safe.
                  </div>
                </div>
              )}

              {/* Profile Card */}
              <div className="card-ledger p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif-heading text-[18px] text-[#0F243F] font-bold">
                      Account Profile
                    </h3>
                    <p className="text-[13px] text-slate-500">
                      Logged in staff credentials and active role
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[12px] font-bold bg-[#F8EDD0] text-[#8A6A1B] uppercase tracking-wider border border-[#F8EDD0]">
                    {currentUser?.role}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px] pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">Full Name</span>
                    <span className="font-semibold text-slate-800">{currentUser?.full_name}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">Console ID</span>
                    <span className="font-mono font-bold text-[#8A6A1B]">{currentUser?.username}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">Contact Phone</span>
                    <span className="text-slate-700">{currentUser?.phone}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">Contact Email</span>
                    <span className="text-slate-700">{currentUser?.email}</span>
                  </div>
                </div>
              </div>

              {/* Change Password Card */}
              <div className="card-ledger p-6 space-y-5">
                <div>
                  <h3 className="font-serif-heading text-[18px] text-[#0F243F] font-bold">
                    Change Password
                  </h3>
                  <p className="text-[13px] text-slate-500">
                    Updating your password will immediately sign out all other active sessions of this user.
                  </p>
                </div>

                <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 max-w-lg">
                  {!currentUser?.must_change_password && (
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPass ? "text" : "password"}
                          value={currentPass}
                          onChange={(e) => setCurrentPass(e.target.value)}
                          placeholder="Enter your current password"
                          className="w-full h-11 pl-3.5 pr-11 rounded-xl border border-[#E8EAEF] bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[#D6AB47]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? "text" : "password"}
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full h-11 pl-3.5 pr-11 rounded-xl border border-[#E8EAEF] bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[#D6AB47]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full h-11 px-3.5 rounded-xl border border-[#E8EAEF] bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[#D6AB47]"
                    />
                  </div>

                  {/* Password Strength Checklist */}
                  {newPass && (() => {
                    const policy = validatePasswordPolicy(newPass, currentUser?.username);
                    return (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-[12px]">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-700">Password Strength:</span>
                          <span className={
                            policy.label === "Strong" ? "text-emerald-600" :
                            policy.label === "Good" ? "text-cyan-600" :
                            policy.label === "Fair" ? "text-amber-600" : "text-rose-600"
                          }>
                            {policy.label}
                          </span>
                        </div>
                        <div className="flex gap-1 h-1.5">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`flex-1 rounded-full ${
                                policy.score >= step
                                  ? policy.score >= 4
                                    ? "bg-emerald-500"
                                    : policy.score === 3
                                    ? "bg-cyan-500"
                                    : "bg-amber-500"
                                  : "bg-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Check className={`w-3.5 h-3.5 ${policy.checks.minLength ? "text-emerald-500" : "text-slate-300"}`} />
                            <span>8+ characters</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Check className={`w-3.5 h-3.5 ${policy.checks.hasUpper && policy.checks.hasLower ? "text-emerald-500" : "text-slate-300"}`} />
                            <span>Upper & lower case</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Check className={`w-3.5 h-3.5 ${policy.checks.hasNumber ? "text-emerald-500" : "text-slate-300"}`} />
                            <span>At least one number</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Check className={`w-3.5 h-3.5 ${policy.checks.notUsername ? "text-emerald-500" : "text-slate-300"}`} />
                            <span>Not equal to your ID</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {passError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[13px] font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{passError}</span>
                    </div>
                  )}

                  {passSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{passSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingPass}
                    className="btn-primary min-h-[44px] cursor-pointer"
                  >
                    <Key className="w-4 h-4 text-[#0F243F]" />
                    <span>{isSubmittingPass ? "Updating Password..." : "Update Password"}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* BRANCHES & ROOMS (SETUP WIZARD) */}
          {activeSection === "branches" && (
            <div className="space-y-6">
              {/* Branch Network Roster */}
              <div className="card-ledger p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-serif-heading text-[18px] text-[#0F243F] font-bold">
                      Branch Network (8 Locations)
                    </h3>
                    <p className="text-[13px] text-slate-500">
                      Official roster from {COMPANY.name} website. Select a branch to configure rooms.
                    </p>
                  </div>

                  <span className="text-[12px] font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full w-fit">
                    Central Phone: {COMPANY.phone}
                  </span>
                </div>

                <div className="space-y-3">
                  {BRANCHES.map((b) => {
                    const bRooms = rooms.filter((r) => r.branch_id === b.id);
                    const isSelected = selectedBranchId === b.id;

                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBranchId(b.id)}
                        className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[14px] ${
                          isSelected
                            ? "border-[#D6AB47] bg-[#FDF8EA]/30 ring-1 ring-[#D6AB47]"
                            : "border-[#E8EAEF] bg-white hover:border-[#D6AB47]/50"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-slate-900 flex items-center gap-2.5">
                            <span>{b.name}</span>
                            <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#F8EDD0] border border-[#F8EDD0] text-[#8A6A1B]">
                              {b.code}
                            </span>
                            {b.landmark && (
                              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                                • {b.landmark}
                              </span>
                            )}
                          </div>

                          <div className="text-[13px] text-slate-600 mt-1 flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#8A6A1B] shrink-0 mt-0.5" />
                            <span className="leading-snug">{b.address}</span>
                          </div>

                          <div className="text-[12px] text-slate-500 mt-2 flex flex-wrap items-center gap-3">
                            <a
                              href={COMPANY.phoneLink}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[#8A6A1B] hover:underline font-semibold"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call {COMPANY.phone}</span>
                            </a>
                            <a
                              href={COMPANY.whatsappUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-semibold"
                            >
                              <span>WhatsApp</span>
                            </a>
                            <a
                              href={b.mapLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-sky-700 hover:underline font-semibold"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Open in Maps</span>
                            </a>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                          <span className="text-[12px] font-bold text-[#8A6A1B] bg-[#FDF8EA] border border-[#F8EDD0] px-3 py-1 rounded-full shadow-xs">
                            {bRooms.length} Rooms
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            PIN {b.pincode}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Setup Wizard for Selected Branch */}
              <div className="card-ledger p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8EAEF]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif-heading text-[18px] text-[#0F243F] font-bold">
                        Setup Rooms — {activeBranch.name}
                      </h3>
                      <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#F8EDD0] text-[#8A6A1B]">
                        {activeBranch.code}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-500 mt-0.5">
                      Enter real rooms, floors, official sharing type and monthly rent rate per bed.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setWizardError("");
                      setShowAddRoomModal(true);
                    }}
                    className="btn-primary text-[13px] self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Room</span>
                  </button>
                </div>

                {/* Rooms List for Active Branch */}
                {activeBranchRooms.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-[#E8EAEF] bg-[#F8F9FC] space-y-3">
                    <p className="text-[14px] text-slate-600 font-medium">
                      No rooms set up for {activeBranch.name} yet.
                    </p>
                    <p className="text-[12px] text-slate-500 max-w-sm mx-auto">
                      Use the Setup Wizard to add each room. Beds with upper/lower labels and washroom layouts are created automatically based on the official room configuration.
                    </p>
                    <button
                      onClick={() => setShowAddRoomModal(true)}
                      className="btn-primary inline-flex items-center gap-2 mt-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Configure First Room</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {activeBranchRooms.map((rm) => {
                      const cfg = getRoomTypeConfig(rm.room_type, rm.sharing_capacity);
                      const roomBeds = beds.filter((b) => b.room_id === rm.id);
                      return (
                        <div
                          key={rm.id}
                          className="p-4 rounded-xl border border-[#E8EAEF] bg-white flex flex-col justify-between space-y-3 shadow-xs hover:border-[#D6AB47]/40 transition"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[16px] text-slate-900">
                                  Room {rm.room_no}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    rm.room_type === "AC"
                                      ? "bg-[#F8EDD0] text-[#8A6A1B]"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {rm.room_type}
                                </span>
                              </div>
                              <div className="text-[12px] text-slate-600 mt-0.5">
                                {cfg?.officialName || `${rm.room_type} • ${rm.sharing_capacity} Sharing`} • Floor {rm.floor}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {rm.attached_bath ? "Attached Bath" : "Common Bath"}
                              </div>
                            </div>

                            <button
                              onClick={() => deleteRoom(rm.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete Room"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[12px]">
                            <span className="font-bold text-slate-900 tabular-nums">
                              {rm.monthly_rent_per_bed ? `${formatRupee(rm.monthly_rent_per_bed)} / mo` : "Rate not set"}
                            </span>
                            <span className="text-slate-500">
                              {roomBeds.length} beds: {roomBeds.map((b) => b.bed_label).join(", ")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ADD ROOM MODAL (SETUP WIZARD MODAL) */}
          {showAddRoomModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
              <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl border border-[#E8EAEF] shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90dvh] overflow-y-auto pb-safe">
                <div className="flex items-center justify-between pb-2 border-b border-[#E8EAEF]">
                  <h4 className="font-serif-heading text-[18px] text-[#0F243F] font-bold">
                    Add Room — {activeBranch.name}
                  </h4>
                  <button
                    onClick={() => setShowAddRoomModal(false)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                    aria-label="Close dialog"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateRoom} className="space-y-4">
                  {wizardError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[13px] font-medium">
                      {wizardError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-800 mb-1">
                        Room Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 101"
                        value={wizardRoomNo}
                        onChange={(e) => setWizardRoomNo(e.target.value)}
                        className="input-ledger text-[16px] sm:text-[14px]"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-800 mb-1">
                        Floor Number
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={wizardFloor}
                        onChange={(e) => setWizardFloor(Number(e.target.value))}
                        className="input-ledger text-[16px] sm:text-[14px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-800 mb-1">
                      Room Type
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {(["AC", "Non-AC"] as const).map((t) => (
                        <button
                          type="button"
                          key={t}
                          onClick={() => handleRoomTypeSelect(t)}
                          className={`min-h-[44px] rounded-xl border text-[13px] font-bold transition ${
                            wizardType === t
                              ? "bg-[#FDF8EA] border-[#D6AB47] text-[#8A6A1B] ring-1 ring-[#D6AB47]"
                              : "border-[#E8EAEF] bg-white text-slate-700"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-800 mb-1">
                      Sharing Capacity (Allowed: {ALLOWED_SHARING_MAP[wizardType].join(", ")} Sharing)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {ALLOWED_SHARING_MAP[wizardType].map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setWizardSharing(s as any)}
                          className={`min-h-[44px] rounded-xl border text-[13px] font-semibold transition ${
                            wizardSharing === s
                              ? "bg-[#FDF8EA] border-[#D6AB47] text-[#8A6A1B] font-bold"
                              : "border-[#E8EAEF] bg-white text-slate-700"
                          }`}
                        >
                          {s} Sharing
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {getRoomTypeConfig(wizardType, wizardSharing)?.officialName} • {getRoomTypeConfig(wizardType, wizardSharing)?.bathroom} Bath
                    </p>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-800 mb-1">
                      Monthly Rent per Bed (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="Leave blank for 'Rate not set'"
                      value={wizardRent}
                      onChange={(e) => setWizardRent(e.target.value)}
                      className="input-ledger text-[16px] sm:text-[14px] font-bold tabular-nums"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Rents are direct rates set by owner. If left blank, it will show as &quot;Rate not set&quot;.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E8EAEF]">
                    <button
                      type="button"
                      onClick={() => setShowAddRoomModal(false)}
                      className="btn-secondary min-h-[44px] px-4 text-[13px]"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary min-h-[44px] px-4 text-[13px]">
                      Create Room & Beds
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ROOM TYPES & TARIFF (SECTION 3.3) */}
          {activeSection === "rates" && (
            <div className="card-ledger p-6 space-y-6">
              <div>
                <h3 className="font-serif-heading text-[18px] text-[#0F243F] font-bold">
                  Official Room Configurations & Tariff Rules
                </h3>
                <p className="text-[13px] text-slate-500">
                  The verified 6 room configurations from the official website (/rooms).
                </p>
              </div>

              {/* Notice that rates are direct and owner-entered */}
              <div className="p-4 rounded-2xl bg-[#FDF8EA] border border-[#F8EDD0] text-[#8A6A1B] text-[13px] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Direct Rates — Not Publicly Fixed</span>
                </div>
                <p className="text-slate-700">
                  Per official website policy, rent rates are direct and customized per room by the owner. Beds without an entered rent display as <strong>&quot;Rate not set&quot;</strong>.
                </p>
              </div>

              {/* The 6 Verified Configurations Table */}
              <div className="space-y-3">
                <h4 className="font-bold text-[14px] text-slate-800">
                  The 6 Permitted Room Types:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {ROOM_TYPES.map((cfg) => (
                    <div
                      key={cfg.id}
                      className="p-4 rounded-xl border border-[#E8EAEF] bg-white space-y-2 text-[13px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-[14px]">
                          {cfg.officialName}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            cfg.roomType === "AC"
                              ? "bg-[#F8EDD0] text-[#8A6A1B]"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {cfg.roomType}
                        </span>
                      </div>

                      <div className="text-slate-600 text-[12px] space-y-1">
                        <div><strong>Bed Layout:</strong> {cfg.bedLayout}</div>
                        <div><strong>Washroom:</strong> {cfg.bathroom}</div>
                        <div><strong>Inclusions:</strong> {cfg.inclusions.join(", ")}</div>
                        <div className="text-slate-400 text-[11px]">Alias: {cfg.alias}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commercial Terms */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 text-[13px] text-slate-700">
                <div className="font-bold text-slate-900 text-[14px]">Commercial Guidelines:</div>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Security Deposit:</strong> ₹3,000 to ₹5,000 depending on room type (AC/Non-AC).</li>
                  <li><strong>Notice Period:</strong> 30 days prior notice required for full refund on vacating.</li>
                  <li><strong>Food Plans:</strong> 3-time homely South Indian meals (Breakfast, Lunch, Dinner) — choices: <em>Veg</em>, <em>Non-Veg</em>, or <em>No food plan</em>.</li>
                  <li><strong>Brokerage:</strong> {COMMERCIAL_RULES.brokerage}.</li>
                </ul>
              </div>
            </div>
          )}

          {/* REMINDER TEMPLATES */}
          {activeSection === "reminders" && (
            <div className="card-ledger p-6 space-y-5">
              <div>
                <h3 className="font-serif-heading text-[18px] text-[#0F243F] font-bold">
                  WhatsApp Reminder Templates
                </h3>
                <p className="text-[13px] text-slate-500">
                  Customizable messages sent to residents with outstanding balances
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTemplateLang("en")}
                  className={`h-9 px-3.5 rounded-xl text-[13px] font-bold border transition ${
                    templateLang === "en"
                      ? "bg-[#FDF8EA] text-[#8A6A1B] border-[#D6AB47]"
                      : "bg-white text-slate-700 border-[#E8EAEF]"
                  }`}
                >
                  English Template
                </button>
                <button
                  onClick={() => setTemplateLang("ta")}
                  className={`h-9 px-3.5 rounded-xl text-[13px] font-bold border transition ${
                    templateLang === "ta"
                      ? "bg-[#FDF8EA] text-[#8A6A1B] border-[#D6AB47]"
                      : "bg-white text-slate-700 border-[#E8EAEF]"
                  }`}
                >
                  Tamil (தமிழ்) Template
                </button>
              </div>

              <div>
                <textarea
                  rows={6}
                  value={templateLang === "en" ? englishTemplate : tamilTemplate}
                  readOnly
                  className="w-full p-3.5 rounded-2xl border border-[#E8EAEF] bg-[#F8F9FC] text-[13px] font-mono text-slate-800 leading-relaxed outline-none"
                />
                <span className="text-[12px] text-slate-500 mt-1 block">
                  Variables {`{resident_name}`}, {`{amount}`}, {`{month}`} and {`{branch}`} are populated automatically.
                </span>
              </div>
            </div>
          )}

          {/* ROLES */}
          {activeSection === "roles" && (
            <div className="space-y-6">
              {/* Staff Management Card for Owner */}
              {currentUser?.role === "owner" && (
                <div className="card-ledger p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-serif-heading text-[18px] text-[#0F243F] font-bold">
                        Staff Accounts & Access
                      </h3>
                      <p className="text-[13px] text-slate-500">
                        Create and manage logins for branch wardens and managers.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCreateStaffModal(true)}
                      className="btn-primary min-h-[40px] px-3.5 text-[13px] self-start sm:self-auto cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4 text-[#0F243F]" />
                      <span>Add Staff Account</span>
                    </button>
                  </div>

                  {/* Generated Temporary Password Modal / Banner */}
                  {generatedTempPass && (
                    <div className="p-4 rounded-2xl bg-[#FDF8EA] border border-[#D6AB47] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-[#8A6A1B] flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#8A6A1B]" /> Temporary Password Generated
                        </span>
                        <button
                          onClick={() => setGeneratedTempPass(null)}
                          className="text-slate-400 hover:text-slate-700 text-[12px] font-bold"
                        >
                          Dismiss
                        </button>
                      </div>
                      <p className="text-[12px] text-slate-600">
                        Share this temporary password once with the staff member. They will be forced to create their own secure password on first sign-in.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <code className="px-3 py-1.5 rounded-xl bg-white border border-[#E8EAEF] font-mono text-[14px] font-bold text-slate-900 select-all">
                          {generatedTempPass}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedTempPass);
                            setCopyFeedback(true);
                            setTimeout(() => setCopyFeedback(false), 2000);
                          }}
                          className="btn-secondary h-9 px-3 text-[12px] flex items-center gap-1.5 cursor-pointer"
                        >
                          {copyFeedback ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copyFeedback ? "Copied!" : "Copy Password"}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Staff List */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-[14px] text-slate-800">Console Staff Members</h4>
                    {isLoadingStaff ? (
                      <div className="text-center py-6 text-slate-400 text-[13px]">Loading staff accounts...</div>
                    ) : staffUsers.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-[13px]">No staff accounts created yet.</div>
                    ) : (
                      <div className="divide-y divide-[#E8EAEF] border border-[#E8EAEF] rounded-2xl bg-white overflow-hidden">
                        {staffUsers.map((user) => (
                          <div
                            key={user.id}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FDF8EA]/20 transition"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-[14px]">
                                  {user.full_name}
                                </span>
                                <span className="font-mono text-[12px] text-[#8A6A1B] bg-[#F8EDD0] px-2 py-0.5 rounded-full font-bold">
                                  ID: {user.username}
                                </span>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${user.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                  {user.active ? "Active" : "Disabled"}
                                </span>
                                {user.must_change_password && (
                                  <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                                    First Login Pending
                                  </span>
                                )}
                              </div>
                              <div className="text-[12px] text-slate-500 mt-1 flex flex-wrap gap-2">
                                <span>Role: <strong className="capitalize">{user.role}</strong></span>
                                <span>•</span>
                                <span>Email: {user.email}</span>
                                {user.assigned_branch_ids?.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{user.assigned_branch_ids.length} Branch(es) Assigned</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {user.role !== "owner" && (
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleResetStaffPassword(user.id)}
                                  className="btn-secondary h-8 px-2.5 text-[11px] font-bold cursor-pointer"
                                  title="Generate new temporary password"
                                >
                                  Reset Password
                                </button>
                                <button
                                  onClick={() => handleToggleStaffStatus(user.id, user.active)}
                                  className={`h-8 px-2.5 text-[11px] font-bold rounded-xl border transition cursor-pointer ${
                                    user.active
                                      ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                  }`}
                                >
                                  {user.active ? "Disable" : "Enable"}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Staff Roles Overview */}
              <div className="card-ledger p-6 space-y-5">
                <div>
                  <h3 className="font-serif-heading text-[18px] text-[#0F243F] font-bold">
                    Staff Role Privileges
                  </h3>
                  <p className="text-[13px] text-slate-500">
                    Strict access control for Owner and Branch Wardens
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl border border-[#E8EAEF] bg-white">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Owner (Admin)</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F8EDD0] text-[#8A6A1B] border border-[#F8EDD0]">
                        Full Access
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-500 mt-1">
                      Manage all 8 branches, authorize 3 hardware devices, configure room setups, view financials and edit rate cards.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-[#E8EAEF] bg-white">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Branch Warden</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        Branch Scoped
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-500 mt-1">
                      Add/vacate residents, record rent payments and issue receipts within their assigned branch.
                    </p>
                  </div>
                </div>
              </div>

              {/* Create Staff Modal */}
              {showCreateStaffModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="w-full max-w-md rounded-3xl bg-white p-6 space-y-4 shadow-2xl">
                    <div>
                      <h3 className="font-serif-heading text-[20px] font-bold text-slate-900">
                        Create Staff Account
                      </h3>
                      <p className="text-[13px] text-slate-500">
                        Staff will be forced to choose their own password on first login.
                      </p>
                    </div>

                    <form onSubmit={handleCreateStaff} className="space-y-3.5 text-[13px]">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Console ID (Username)
                        </label>
                        <input
                          type="text"
                          required
                          value={staffUsername}
                          onChange={(e) => setStaffUsername(e.target.value)}
                          placeholder="e.g. ramesh.warden"
                          className="input-ledger"
                        />
                        <span className="text-[11px] text-slate-400 mt-0.5 block">
                          4-24 chars, letters, numbers, dot, underscore.
                        </span>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={staffFullName}
                          onChange={(e) => setStaffFullName(e.target.value)}
                          placeholder="e.g. M. Ramesh"
                          className="input-ledger"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Staff Role
                        </label>
                        <select
                          value={staffRole}
                          onChange={(e) => setStaffRole(e.target.value as any)}
                          className="input-ledger"
                        >
                          <option value="warden">Branch Warden</option>
                          <option value="branch_manager">Branch Manager</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Assigned Branches
                        </label>
                        <div className="max-h-32 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-[#E8EAEF] bg-slate-50">
                          {branches.map((b) => (
                            <label key={b.id} className="flex items-center gap-2 cursor-pointer text-[12px]">
                              <input
                                type="checkbox"
                                checked={staffBranches.includes(b.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setStaffBranches([...staffBranches, b.id]);
                                  } else {
                                    setStaffBranches(staffBranches.filter((id) => id !== b.id));
                                  }
                                }}
                                className="accent-[#D6AB47]"
                              />
                              <span className="text-slate-800">{b.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {createStaffError && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-[12px] flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{createStaffError}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateStaffModal(false);
                            setCreateStaffError("");
                          }}
                          className="btn-secondary h-10 px-4 text-[13px]"
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn-primary h-10 px-4 text-[13px]">
                          Create Account
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BACKUP & EXPORT */}
          {activeSection === "backup" && (
            <div className="card-ledger p-6 space-y-5">
              <div>
                <h3 className="font-serif-heading text-[18px] text-[#0F243F] font-bold">
                  Data Backup & Disaster Recovery
                </h3>
                <p className="text-[13px] text-slate-500">
                  Export snapshot of entire hostel database as JSON or import backup file
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-[#E8EAEF] bg-white space-y-3">
                  <div className="font-bold text-slate-900">Export Backup</div>
                  <p className="text-[13px] text-slate-500">
                    Download full encrypted JSON file containing branches, rooms, residents, invoices and audit logs.
                  </p>
                  <button onClick={exportDatabaseJSON} className="btn-primary w-full">
                    <Download className="w-4 h-4" />
                    <span>Download JSON Backup</span>
                  </button>
                </div>

                <div className="p-5 rounded-2xl border border-[#E8EAEF] bg-white space-y-3">
                  <div className="font-bold text-slate-900">Restore Backup</div>
                  <p className="text-[13px] text-slate-500">
                    Import and overwrite local console database from a previously exported JSON backup.
                  </p>
                  <label className="btn-secondary w-full cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Upload JSON Backup</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {importSuccess && (
                    <div className="text-[12px] font-bold text-[#8A6A1B] flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      <span>Database restored successfully!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ABOUT CONSOLE */}
          {activeSection === "about" && (
            <div className="card-ledger p-6 space-y-5">
              <div>
                <h3 className="font-serif-heading text-[18px] text-[#0F243F] font-bold">
                  {COMPANY.name}
                </h3>
                <p className="text-[13px] text-slate-500">
                  {COMPANY.consoleTag} • {COMPANY.segment}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E8EAEF] space-y-3 text-[13px] text-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="font-bold block text-slate-900">Head Office</span>
                    <span className="text-slate-600">{COMPANY.headOfficeFull}</span>
                  </div>
                  <div>
                    <span className="font-bold block text-slate-900">Office Hours</span>
                    <span className="text-slate-600">{COMPANY.officeHours}</span>
                  </div>
                  <div>
                    <span className="font-bold block text-slate-900">Central Contact Phone</span>
                    <a href={COMPANY.phoneLink} className="text-[#8A6A1B] font-semibold hover:underline">
                      {COMPANY.phone}
                    </a>
                  </div>
                  <div>
                    <span className="font-bold block text-slate-900">Official Email</span>
                    <a href={`mailto:${COMPANY.email}`} className="text-[#8A6A1B] font-semibold hover:underline">
                      {COMPANY.email}
                    </a>
                  </div>
                  <div>
                    <span className="font-bold block text-slate-900">Instagram</span>
                    <span className="text-slate-600">{COMPANY.instagram}</span>
                  </div>
                  <div>
                    <span className="font-bold block text-slate-900">Womens PG Status</span>
                    <span className="text-slate-600">{COMPANY.womensSegmentStatus}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
