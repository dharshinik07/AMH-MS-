import { z } from "zod";
import {
  ALLOWED_PINCODES,
  COMMERCIAL_RULES,
  isAllowedRoomConfig,
  normalizePhone,
  validateDepositSoftRange,
} from "@/config/business";

/**
 * Normalizes Indian 10-digit phone to +91 XXXXXXXXXX
 */
export const PhoneSchema = z.string().transform((val) => {
  const digits = val.replace(/\D/g, "");
  if (digits.length === 10) return `+91 ${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+91 ${digits.slice(2)}`;
  return val.trim();
}).refine((val) => {
  const digits = val.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 12 && digits.startsWith("91"));
}, {
  message: "Phone number must be a valid 10-digit Indian mobile number.",
});

/**
 * Pincode validation: must be one of the verified Tambaram cluster pincodes
 */
export const PincodeSchema = z.string().refine((val) => {
  return (ALLOWED_PINCODES as readonly string[]).includes(val.trim());
}, {
  message: `Pincode must be one of the verified branch pincodes: ${ALLOWED_PINCODES.join(", ")}.`,
});

/**
 * Food plan schema: 3 allowed choices
 */
export const FoodPlanSchema = z.enum(COMMERCIAL_RULES.foodPlans);

/**
 * Security deposit schema: positive number with soft warning helper
 */
export const SecurityDepositSchema = z.number().min(0, "Deposit must be non-negative");

/**
 * Notice period schema: default 30 days
 */
export const NoticePeriodSchema = z.number().int().default(COMMERCIAL_RULES.deposit.noticeDays);

/**
 * Room configuration validator
 */
export const RoomConfigSchema = z.object({
  roomType: z.enum(["AC", "Non-AC"]),
  sharing: z.number().int(),
}).refine((data) => isAllowedRoomConfig(data.roomType, data.sharing), {
  message: "Invalid room configuration. Permitted combinations: (AC: 2, 3, 4) and (Non-AC: 2, 4, 6).",
});

/**
 * Add Resident payload schema
 */
export const AddResidentSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: PhoneSchema,
  alternatePhone: z.string().optional().transform((v) => (v ? normalizePhone(v) : undefined)),
  parentName: z.string().optional(),
  parentPhone: z.string().optional().transform((v) => (v ? normalizePhone(v) : undefined)),
  occupation: z.enum(["student", "working"]),
  collegeOrCompany: z.string().optional(),
  foodPlan: FoodPlanSchema,
  branchId: z.string().min(1, "Branch selection is required"),
  roomId: z.string().min(1, "Room selection is required"),
  bedId: z.string().min(1, "Bed selection is required"),
  monthlyRent: z.number().min(1, "Monthly rent is required and must be greater than zero"),
  securityDeposit: SecurityDepositSchema,
  depositPaid: z.number().min(0),
  joinDate: z.string(),
  initialPaymentAmount: z.number().optional(),
  initialPaymentMode: z.enum(["Cash", "UPI", "Bank", "Card"]).optional(),
  initialPaymentRef: z.string().optional(),
  notes: z.string().optional(),
});
