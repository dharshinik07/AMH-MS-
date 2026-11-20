"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Branch,
  Room,
  Bed,
  Resident,
  Invoice,
  Payment,
  User,
  AuditLog,
  PaymentMode,
  FoodPlan,
} from "@/types/hostel";
import {
  INITIAL_BRANCHES,
  INITIAL_USERS,
  generateDemoData,
} from "./seed-data";
import {
  BRANCHES,
  COMPANY,
  COMMERCIAL_RULES,
  generateBedLabels,
  isAllowedRoomConfig,
  getRoomTypeConfig,
  normalizePhone,
  validateDepositSoftRange,
} from "@/config/business";

interface OfflineAction {
  id: string;
  type: "PAYMENT" | "ADD_RESIDENT" | "VACATE";
  payload: any;
  timestamp: string;
}

interface HostelContextType {
  // State
  branches: Branch[];
  rooms: Room[];
  beds: Bed[];
  residents: Resident[];
  invoices: Invoice[];
  payments: Payment[];
  currentUser: User;
  auditLogs: AuditLog[];
  selectedBranchId: string;
  selectedMonth: string;
  isOnline: boolean;
  offlineQueue: OfflineAction[];
  isAuthenticated: boolean;
  isAuthChecking: boolean;
  isLocked: boolean;
  isDemoMode: boolean;
  isPasswordBannerDismissed: boolean;
  
  // Actions
  setSelectedBranchId: (id: string) => void;
  setSelectedMonth: (month: string) => void;
  login: (credentials: {
    username: string;
    password: string;
    keepMeSignedIn?: boolean;
    deviceLabel?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  unlockWithPassword: (password: string) => Promise<{ success: boolean; error?: string; forceSignOut?: boolean }>;
  changePassword: (data: {
    currentPassword?: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<{ success: boolean; error?: string; errors?: string[] }>;
  dismissPasswordBanner: () => void;
  lockApp: () => void;
  
  // Core Business Operations
  addResident: (data: {
    fullName: string;
    phone: string;
    alternatePhone?: string;
    parentName?: string;
    parentPhone?: string;
    occupation: "student" | "working";
    collegeOrCompany?: string;
    foodPlan: FoodPlan;
    branchId: string;
    roomId: string;
    bedId: string;
    monthlyRent: number;
    securityDeposit: number;
    depositPaid: number;
    joinDate: string;
    initialPaymentAmount?: number;
    initialPaymentMode?: PaymentMode;
    initialPaymentRef?: string;
    notes?: string;
  }) => Promise<Resident>;

  vacateResident: (data: {
    residentId: string;
    vacateDate: string;
    reason: string;
    damagesAmount: number;
    extraCharges: number;
  }) => Promise<{ bedId: string; resident: Resident }>;

  transferResident: (data: {
    residentId: string;
    newBedId: string;
    newRoomId: string;
    newBranchId: string;
    newRent?: number;
    effectiveDate: string;
  }) => Promise<void>;

  recordPayment: (data: {
    residentId: string;
    amount: number;
    mode: PaymentMode;
    referenceNo?: string;
    paidOn: string;
    note?: string;
  }) => Promise<Payment>;

  reversePayment: (paymentId: string, reason: string) => Promise<void>;

  // Room Setup Operations (Setup Wizard)
  addRoom: (data: {
    branchId: string;
    roomNo: string;
    floor: number;
    roomType: "AC" | "Non-AC";
    sharing: 2 | 3 | 4 | 6;
    monthlyRentPerBed?: number | null;
    notes?: string;
  }) => Promise<Room>;

  deleteRoom: (roomId: string) => Promise<void>;
  updateRoom: (roomId: string, data: Partial<Room>) => Promise<void>;

  // Management & Backup
  reloadDemoData: () => void;
  clearDemoData: () => void;
  loadDemoData: () => void;
  exportDatabaseJSON: () => void;
  importDatabaseJSON: (jsonString: string) => boolean;

  // KPIs & Calculations
  getBranchMetrics: (branchId?: string) => {
    totalResidents: number;
    totalBeds: number;
    occupiedBeds: number;
    vacantBeds: number;
    noticeBeds: number;
    occupancyRate: number;
    collectedMonth: number;
    pendingMonth: number;
    overdueMonth: number;
    totalOutstanding: number;
    overdueResidentsCount: number;
    hasRooms: boolean;
  };
}

const HostelContext = createContext<HostelContextType | null>(null);

const STORAGE_KEY = "aishwaraya_hostels_db_v3";

export function HostelProvider({ children }: { children: React.ReactNode }) {
  // Navigation / Filter States
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-11");
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>([]);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isPasswordBannerDismissed, setIsPasswordBannerDismissed] = useState<boolean>(false);

  // Core Data States
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Check Active Session on Mount
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
      })
      .finally(() => {
        setIsAuthChecking(false);
      });
  }, []);

  // Load Initial or Stored Data
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const isDemoEnv = process.env.NEXT_PUBLIC_ENABLE_DEMO === "true";

      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure branches always follow verified source of truth exactly
        setBranches(INITIAL_BRANCHES);
        if (parsed.rooms) setRooms(parsed.rooms);
        if (parsed.beds) setBeds(parsed.beds);
        if (parsed.residents) setResidents(parsed.residents);
        if (parsed.invoices) setInvoices(parsed.invoices);
        if (parsed.payments) setPayments(parsed.payments);
        if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
        if (parsed.isDemoMode !== undefined) {
          setIsDemoMode(parsed.isDemoMode && isDemoEnv);
        }
      } else {
        // First load
        setBranches(INITIAL_BRANCHES);
        if (isDemoEnv) {
          // Demo mode enabled via environment variable
          const demo = generateDemoData();
          setRooms(demo.rooms);
          setBeds(demo.beds);
          setResidents(demo.residents);
          setInvoices(demo.invoices);
          setPayments(demo.payments);
          setIsDemoMode(true);
        } else {
          // Strict Production: No invented rooms, no fake demo rents, owner sets up real rooms
          setRooms([]);
          setBeds([]);
          setResidents([]);
          setInvoices([]);
          setPayments([]);
          setIsDemoMode(false);
        }
        setAuditLogs([
          {
            id: "log-init",
            user_name: "A. Sundararajan (Owner)",
            action: "SYSTEM_INIT",
            entity_type: "SYSTEM",
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (e) {
      console.error("Failed to load local hostel storage:", e);
    }
  }, []);

  // Save to LocalStorage on State Change
  useEffect(() => {
    try {
      const payload = {
        branches,
        rooms,
        beds,
        residents,
        invoices,
        payments,
        auditLogs,
        isDemoMode,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Storage quota exceeded or error saving:", e);
    }
  }, [branches, rooms, beds, residents, invoices, payments, auditLogs, isDemoMode]);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Inactivity Auto-Lock (5 minutes of idle, or PWA backgrounded > 5 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    let timer: NodeJS.Timeout;
    let lastActiveTimestamp = Date.now();

    const resetTimer = () => {
      lastActiveTimestamp = Date.now();
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsLocked(true);
      }, 5 * 60 * 1000); // 5 minutes
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const elapsed = Date.now() - lastActiveTimestamp;
        if (elapsed > 5 * 60 * 1000) {
          setIsLocked(true);
        }
      } else {
        lastActiveTimestamp = Date.now();
      }
    };

    const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll", "click"];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    document.addEventListener("visibilitychange", handleVisibilityChange);

    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated]);

  const login = useCallback(
    async (credentials: {
      username: string;
      password: string;
      keepMeSignedIn?: boolean;
      deviceLabel?: string;
    }): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || "Invalid ID or password." };
        }

        // Credentials succeed!
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        setIsLocked(false);

        return { success: true };
      } catch {
        return { success: false, error: "Invalid ID or password." };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setIsAuthenticated(false);
    setIsLocked(false);
  }, []);

  const unlockWithPassword = useCallback(
    async (password: string): Promise<{ success: boolean; error?: string; forceSignOut?: boolean }> => {
      try {
        const res = await fetch("/api/auth/unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setIsLocked(false);
          return { success: true };
        }
        if (data.forceSignOut) {
          setIsAuthenticated(false);
          setIsLocked(false);
          return { success: false, error: data.error, forceSignOut: true };
        }
        return { success: false, error: data.error || "Incorrect password." };
      } catch {
        return { success: false, error: "Incorrect password." };
      }
    },
    []
  );

  const changePassword = useCallback(
    async (data: {
      currentPassword?: string;
      newPassword: string;
      confirmPassword: string;
    }): Promise<{ success: boolean; error?: string; errors?: string[] }> => {
      try {
        const res = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const respData = await res.json();
        if (!res.ok || !respData.success) {
          return { success: false, error: respData.error, errors: respData.errors };
        }
        if (currentUser) {
          setCurrentUser((prev) => ({
            ...prev,
            uses_initial_password: false,
            must_change_password: false,
          }));
        }
        return { success: true };
      } catch {
        return { success: false, error: "Failed to change password." };
      }
    },
    [currentUser]
  );

  const dismissPasswordBanner = useCallback(() => {
    setIsPasswordBannerDismissed(true);
  }, []);

  const lockApp = useCallback(() => {
    setIsLocked(true);
  }, []);

  // 1. ADD RESIDENT FLOW
  const addResident = useCallback(
    async (data: {
      fullName: string;
      phone: string;
      alternatePhone?: string;
      parentName?: string;
      parentPhone?: string;
      occupation: "student" | "working";
      collegeOrCompany?: string;
      foodPlan: FoodPlan;
      branchId: string;
      roomId: string;
      bedId: string;
      monthlyRent: number;
      securityDeposit: number;
      depositPaid: number;
      joinDate: string;
      initialPaymentAmount?: number;
      initialPaymentMode?: PaymentMode;
      initialPaymentRef?: string;
      notes?: string;
    }): Promise<Resident> => {
      if (!data.fullName?.trim()) {
        throw new Error("Resident full name is required.");
      }
      if (!data.phone?.trim()) {
        throw new Error("Phone number is required.");
      }
      const normPhone = normalizePhone(data.phone);

      // Section 2 Rule 3: Rent cannot be unset/zero
      if (!data.monthlyRent || data.monthlyRent <= 0) {
        throw new Error("Bed rent is not set. Please enter the agreed monthly rent.");
      }

      const newResId = `res-${Date.now().toString(36)}`;
      const newResident: Resident = {
        id: newResId,
        full_name: data.fullName.trim(),
        phone: normPhone,
        alternate_phone: data.alternatePhone ? normalizePhone(data.alternatePhone) : undefined,
        parent_name: data.parentName?.trim(),
        parent_phone: data.parentPhone ? normalizePhone(data.parentPhone) : undefined,
        occupation: data.occupation,
        college_or_company: data.collegeOrCompany?.trim(),
        food_plan: data.foodPlan,
        branch_id: data.branchId,
        bed_id: data.bedId,
        monthly_rent: data.monthlyRent,
        security_deposit: data.securityDeposit,
        deposit_paid: data.depositPaid,
        rent_due_day: 5,
        status: "active",
        join_date: data.joinDate,
        notes: data.notes,
      };

      // 1. Mark Bed as Occupied
      setBeds((prev) =>
        prev.map((b) => (b.id === data.bedId ? { ...b, status: "occupied" } : b))
      );

      // 2. Add Resident
      setResidents((prev) => [newResident, ...prev]);

      // 3. Create First Month Invoice
      const monthStr = data.joinDate.slice(0, 7);
      const invId = `inv-${Date.now().toString(36)}`;
      const hasInitialPayment = (data.initialPaymentAmount || 0) > 0;
      const initialAmt = data.initialPaymentAmount || 0;
      const isFull = initialAmt >= data.monthlyRent;

      const newInvoice: Invoice = {
        id: invId,
        invoice_no: `INV-${monthStr.replace("-", "")}-${newResId.slice(-4).toUpperCase()}`,
        resident_id: newResId,
        branch_id: data.branchId,
        month: monthStr,
        amount_due: data.monthlyRent,
        extra_charges: 0,
        discount: 0,
        amount_paid: initialAmt,
        status: isFull ? "paid" : hasInitialPayment ? "partial" : "pending",
        due_date: `${monthStr}-05`,
      };

      setInvoices((prev) => [newInvoice, ...prev]);

      // 4. Record Initial Payment if entered
      if (hasInitialPayment) {
        const payId = `pay-${Date.now().toString(36)}`;
        const newPayment: Payment = {
          id: payId,
          receipt_no: `RCP-${new Date().getFullYear().toString().slice(2)}${String(
            new Date().getMonth() + 1
          ).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`,
          resident_id: newResId,
          invoice_id: invId,
          amount: initialAmt,
          mode: data.initialPaymentMode || "UPI",
          reference_no: data.initialPaymentRef,
          paid_on: data.joinDate,
          received_by: currentUser.id,
          note: "Admission Initial Rent Payment",
        };
        setPayments((prev) => [newPayment, ...prev]);
      }

      // 5. Add Audit Log
      setAuditLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          user_name: currentUser.full_name,
          action: "ADD_RESIDENT",
          entity_type: "RESIDENT",
          entity_id: newResId,
          new_value: { name: newResident.full_name, branch: data.branchId, bed: data.bedId },
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      return newResident;
    },
    [currentUser]
  );

  // 2. VACATE RESIDENT FLOW
  const vacateResident = useCallback(
    async (data: {
      residentId: string;
      vacateDate: string;
      reason: string;
      damagesAmount: number;
      extraCharges: number;
    }): Promise<{ bedId: string; resident: Resident }> => {
      const res = residents.find((r) => r.id === data.residentId);
      if (!res) throw new Error("Resident not found");

      const bedId = res.bed_id || "";

      // 1. Mark Resident as Vacated
      const updatedResident: Resident = {
        ...res,
        status: "vacated",
        vacated_date: data.vacateDate,
        vacate_reason: data.reason,
        bed_id: undefined,
      };

      setResidents((prev) =>
        prev.map((r) => (r.id === data.residentId ? updatedResident : r))
      );

      // 2. Free up the Bed
      if (bedId) {
        setBeds((prev) =>
          prev.map((b) => (b.id === bedId ? { ...b, status: "vacant" } : b))
        );
      }

      // 3. Audit Log
      setAuditLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          user_name: currentUser.full_name,
          action: "VACATE_RESIDENT",
          entity_type: "RESIDENT",
          entity_id: data.residentId,
          new_value: { vacateDate: data.vacateDate, reason: data.reason },
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      return { bedId, resident: updatedResident };
    },
    [residents, currentUser]
  );

  // 3. TRANSFER RESIDENT FLOW
  const transferResident = useCallback(
    async (data: {
      residentId: string;
      newBedId: string;
      newRoomId: string;
      newBranchId: string;
      newRent?: number;
      effectiveDate: string;
    }): Promise<void> => {
      const res = residents.find((r) => r.id === data.residentId);
      if (!res) throw new Error("Resident not found");

      const oldBedId = res.bed_id;

      // 1. Update Bed Statuses
      setBeds((prev) =>
        prev.map((b) => {
          if (b.id === oldBedId) return { ...b, status: "vacant" };
          if (b.id === data.newBedId) return { ...b, status: "occupied" };
          return b;
        })
      );

      // 2. Update Resident
      setResidents((prev) =>
        prev.map((r) =>
          r.id === data.residentId
            ? {
                ...r,
                branch_id: data.newBranchId,
                bed_id: data.newBedId,
                monthly_rent: data.newRent ?? r.monthly_rent,
              }
            : r
        )
      );

      // 3. Audit Log
      setAuditLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          user_name: currentUser.full_name,
          action: "TRANSFER_RESIDENT",
          entity_type: "RESIDENT",
          entity_id: data.residentId,
          new_value: { fromBed: oldBedId, toBed: data.newBedId, toBranch: data.newBranchId },
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [residents, currentUser]
  );

  // 4. RECORD PAYMENT
  const recordPayment = useCallback(
    async (data: {
      residentId: string;
      amount: number;
      mode: PaymentMode;
      referenceNo?: string;
      paidOn: string;
      note?: string;
    }): Promise<Payment> => {
      const newPayId = `pay-${Date.now().toString(36)}`;
      const receiptNo = `RCP-${new Date().getFullYear().toString().slice(2)}${String(
        new Date().getMonth() + 1
      ).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newPayment: Payment = {
        id: newPayId,
        receipt_no: receiptNo,
        resident_id: data.residentId,
        amount: data.amount,
        mode: data.mode,
        reference_no: data.referenceNo,
        paid_on: data.paidOn,
        received_by: currentUser.id,
        note: data.note,
      };

      setPayments((prev) => [newPayment, ...prev]);

      // Auto-apply payment to resident's oldest pending/partial invoice
      setInvoices((prev) => {
        let remaining = data.amount;
        const resInvoices = prev
          .filter((inv) => inv.resident_id === data.residentId && inv.status !== "paid")
          .sort((a, b) => a.month.localeCompare(b.month));

        const updatedMap = new Map<string, Invoice>();

        for (const inv of resInvoices) {
          if (remaining <= 0) break;
          const due = inv.amount_due + inv.extra_charges - inv.discount;
          const needed = due - inv.amount_paid;

          if (remaining >= needed) {
            remaining -= needed;
            updatedMap.set(inv.id, {
              ...inv,
              amount_paid: due,
              status: "paid",
            });
          } else {
            const partialAmt = remaining;
            remaining = 0;
            updatedMap.set(inv.id, {
              ...inv,
              amount_paid: inv.amount_paid + partialAmt,
              status: "partial",
            });
          }
        }

        return prev.map((inv) => updatedMap.get(inv.id) || inv);
      });

      // Audit Log
      setAuditLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          user_name: currentUser.full_name,
          action: "RECORD_PAYMENT",
          entity_type: "PAYMENT",
          entity_id: newPayId,
          new_value: { amount: data.amount, mode: data.mode, receipt: receiptNo },
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      return newPayment;
    },
    [currentUser]
  );

  // 5. REVERSE PAYMENT
  const reversePayment = useCallback(
    async (paymentId: string, reason: string) => {
      const p = payments.find((pay) => pay.id === paymentId);
      if (!p || p.is_reversed) return;

      setPayments((prev) =>
        prev.map((pay) =>
          pay.id === paymentId
            ? { ...pay, is_reversed: true, reversal_reason: reason }
            : pay
        )
      );

      if (p.invoice_id) {
        setInvoices((prev) =>
          prev.map((inv) => {
            if (inv.id === p.invoice_id) {
              const newPaid = Math.max(0, inv.amount_paid - p.amount);
              return {
                ...inv,
                amount_paid: newPaid,
                status: newPaid === 0 ? "overdue" : "partial",
              };
            }
            return inv;
          })
        );
      }

      setAuditLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          user_name: currentUser.full_name,
          action: "REVERSE_PAYMENT",
          entity_type: "PAYMENT",
          entity_id: paymentId,
          new_value: { reason, amount: p.amount },
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [payments, currentUser]
  );

  // 6. SETUP WIZARD & ROOM OPERATIONS (Section 2 & 4)
  const addRoom = useCallback(
    async (data: {
      branchId: string;
      roomNo: string;
      floor: number;
      roomType: "AC" | "Non-AC";
      sharing: 2 | 3 | 4 | 6;
      monthlyRentPerBed?: number | null;
      notes?: string;
    }): Promise<Room> => {
      if (!isAllowedRoomConfig(data.roomType, data.sharing)) {
        throw new Error(
          `Invalid room configuration: ${data.roomType} ${data.sharing}-Sharing is not permitted. Only (AC: 2, 3, 4) and (Non-AC: 2, 4, 6) are allowed.`
        );
      }

      const cfg = getRoomTypeConfig(data.roomType, data.sharing)!;
      const roomId = `rm-${data.branchId}-${data.roomNo}`;

      // Check if room already exists in branch
      if (rooms.some((r) => r.branch_id === data.branchId && r.room_no === data.roomNo)) {
        throw new Error(`Room ${data.roomNo} already exists in this branch.`);
      }

      const newRoom: Room = {
        id: roomId,
        branch_id: data.branchId,
        room_no: data.roomNo,
        floor: data.floor,
        room_type: data.roomType,
        sharing_capacity: data.sharing,
        monthly_rent_per_bed: data.monthlyRentPerBed ?? null,
        attached_bath: cfg.bathroom === "Attached",
        notes: data.notes || cfg.officialName,
        room_type_id: cfg.id,
      };

      // Automatically generate bed labels adhering strictly to Section 3.4
      const labels = generateBedLabels(data.sharing);
      const newBeds: Bed[] = labels.map((lbl, idx) => ({
        id: `bed-${roomId}-${idx + 1}`,
        room_id: roomId,
        bed_label: lbl,
        status: "vacant" as const,
      }));

      setRooms((prev) => [...prev, newRoom]);
      setBeds((prev) => [...prev, ...newBeds]);

      setAuditLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          user_name: currentUser.full_name,
          action: "ADD_ROOM",
          entity_type: "ROOM",
          entity_id: roomId,
          new_value: { roomNo: data.roomNo, branch: data.branchId, sharing: data.sharing },
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      return newRoom;
    },
    [rooms, currentUser]
  );

  const deleteRoom = useCallback(
    async (roomId: string): Promise<void> => {
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      setBeds((prev) => prev.filter((b) => b.room_id !== roomId));
    },
    []
  );

  const updateRoom = useCallback(
    async (roomId: string, data: Partial<Room>): Promise<void> => {
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, ...data } : r))
      );
    },
    []
  );

  // 7. BACKUP & DEMO RESET
  const reloadDemoData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    const demo = generateDemoData();
    setBranches(INITIAL_BRANCHES);
    setRooms(demo.rooms);
    setBeds(demo.beds);
    setResidents(demo.residents);
    setInvoices(demo.invoices);
    setPayments(demo.payments);
    setIsDemoMode(true);
  }, []);

  const clearDemoData = useCallback(() => {
    setRooms([]);
    setBeds([]);
    setResidents([]);
    setInvoices([]);
    setPayments([]);
    setIsDemoMode(false);
  }, []);

  const loadDemoData = useCallback(() => {
    reloadDemoData();
  }, [reloadDemoData]);

  const exportDatabaseJSON = useCallback(() => {
    const data = {
      branches,
      rooms,
      beds,
      residents,
      invoices,
      payments,
      auditLogs,
      exportedAt: new Date().toISOString(),
      version: "3.0",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Aishwaraya_Hostels_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [branches, rooms, beds, residents, invoices, payments, auditLogs]);

  const importDatabaseJSON = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.branches) {
        setBranches(INITIAL_BRANCHES); // Always enforce verified branches
        setRooms(parsed.rooms || []);
        setBeds(parsed.beds || []);
        setResidents(parsed.residents || []);
        setInvoices(parsed.invoices || []);
        setPayments(parsed.payments || []);
        setAuditLogs(parsed.auditLogs || []);
        setIsDemoMode(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // 9. METRICS CALCULATIONS
  const getBranchMetrics = useCallback(
    (branchId?: string) => {
      const targetRooms = branchId && branchId !== "all"
        ? rooms.filter((r) => r.branch_id === branchId)
        : rooms;

      const hasRooms = targetRooms.length > 0;

      const targetBeds = branchId && branchId !== "all"
        ? beds.filter((b) => {
            const rm = rooms.find((r) => r.id === b.room_id);
            return rm?.branch_id === branchId;
          })
        : beds;

      const totalBeds = targetBeds.length;
      const occupiedBeds = targetBeds.filter((b) => b.status === "occupied").length;
      const noticeBeds = targetBeds.filter((b) => b.status === "notice").length;
      const vacantBeds = targetBeds.filter((b) => b.status === "vacant").length;
      const occupancyRate = totalBeds > 0 ? Math.round(((occupiedBeds + noticeBeds) / totalBeds) * 100) : 0;

      const targetInvoices = branchId && branchId !== "all"
        ? invoices.filter((i) => i.branch_id === branchId && i.month === selectedMonth)
        : invoices.filter((i) => i.month === selectedMonth);

      const collectedMonth = targetInvoices.reduce((sum, i) => sum + i.amount_paid, 0);
      const targetDueMonth = targetInvoices.reduce((sum, i) => sum + (i.amount_due + i.extra_charges - i.discount), 0);
      const pendingMonth = Math.max(0, targetDueMonth - collectedMonth);
      
      const overdueInvoices = targetInvoices.filter((i) => i.status === "overdue");
      const overdueMonth = overdueInvoices.reduce(
        (sum, i) => sum + (i.amount_due + i.extra_charges - i.discount - i.amount_paid),
        0
      );

      const allUnpaidInvoices = branchId && branchId !== "all"
        ? invoices.filter((i) => i.branch_id === branchId && i.status !== "paid")
        : invoices.filter((i) => i.status !== "paid");

      const totalOutstanding = allUnpaidInvoices.reduce(
        (sum, i) => sum + (i.amount_due + i.extra_charges - i.discount - i.amount_paid),
        0
      );

      const overdueResidentsCount = new Set(overdueInvoices.map((i) => i.resident_id)).size;
      const totalResidents = occupiedBeds + noticeBeds;

      return {
        totalResidents,
        totalBeds,
        occupiedBeds,
        vacantBeds,
        noticeBeds,
        occupancyRate,
        collectedMonth,
        pendingMonth,
        overdueMonth,
        totalOutstanding,
        overdueResidentsCount,
        hasRooms,
      };
    },
    [beds, rooms, invoices, selectedMonth]
  );

  const value = useMemo(
    () => ({
      branches,
      rooms,
      beds,
      residents,
      invoices,
      payments,
      currentUser,
      auditLogs,
      selectedBranchId,
      selectedMonth,
      isOnline,
      offlineQueue,
      isAuthenticated,
      isAuthChecking,
      isLocked,
      isDemoMode,
      isPasswordBannerDismissed,
      setSelectedBranchId,
      setSelectedMonth,
      login,
      logout,
      unlockWithPassword,
      changePassword,
      dismissPasswordBanner,
      lockApp,
      addResident,
      vacateResident,
      transferResident,
      recordPayment,
      reversePayment,
      addRoom,
      deleteRoom,
      updateRoom,
      reloadDemoData,
      clearDemoData,
      loadDemoData,
      exportDatabaseJSON,
      importDatabaseJSON,
      getBranchMetrics,
    }),
    [
      branches,
      rooms,
      beds,
      residents,
      invoices,
      payments,
      currentUser,
      auditLogs,
      selectedBranchId,
      selectedMonth,
      isOnline,
      offlineQueue,
      isAuthenticated,
      isAuthChecking,
      isLocked,
      isDemoMode,
      isPasswordBannerDismissed,
      setSelectedBranchId,
      setSelectedMonth,
      login,
      logout,
      unlockWithPassword,
      changePassword,
      dismissPasswordBanner,
      lockApp,
      addResident,
      vacateResident,
      transferResident,
      recordPayment,
      reversePayment,
      addRoom,
      deleteRoom,
      updateRoom,
      reloadDemoData,
      clearDemoData,
      loadDemoData,
      exportDatabaseJSON,
      importDatabaseJSON,
      getBranchMetrics,
    ]
  );

  return <HostelContext.Provider value={value}>{children}</HostelContext.Provider>;
}

export function useHostel() {
  const context = useContext(HostelContext);
  if (!context) {
    throw new Error("useHostel must be used within a HostelProvider");
  }
  return context;
}
