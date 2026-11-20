import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import jsPDF from "jspdf";
import { VacateSettlement, Payment, Resident, Room, Branch } from "@/types/hostel";
import { COMPANY } from "@/config/business";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format numbers using Indian digit grouping system
 * e.g. 125000 -> ₹1,25,000
 */
export function formatRupee(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "₹0";
  const isNegative = amount < 0;
  const abs = Math.abs(Math.round(amount));
  const s = abs.toString();
  
  if (s.length <= 3) {
    return `${isNegative ? "-" : ""}₹${s}`;
  }
  
  const lastThree = s.substring(s.length - 3);
  const otherNumbers = s.substring(0, s.length - 3);
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  return `${isNegative ? "-" : ""}₹${formatted}`;
}

/**
 * Format date into standard Indian hostel format: DD-MMM-YYYY
 */
export function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return "-";
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Calculates vacate settlement details according to business rules:
 * Net Settlement = Unpaid Invoices + Prorated Rent (if mid-month) + Damages - Security Deposit
 */
export function calculateVacateSettlement(params: {
  resident: Resident;
  branch: Branch;
  room: Room;
  bedLabel: string;
  vacateDateStr: string;
  unpaidInvoicesSum: number;
  damagesAmount: number;
  extraCharges: number;
  reason: string;
}): VacateSettlement {
  const { resident, branch, room, bedLabel, vacateDateStr, unpaidInvoicesSum, damagesAmount, extraCharges, reason } = params;
  
  const vacateDate = new Date(vacateDateStr);
  const dayOfMonth = vacateDate.getDate();
  const daysInMonth = new Date(vacateDate.getFullYear(), vacateDate.getMonth() + 1, 0).getDate();
  
  // If unpaid invoices already include the current month, don't double charge.
  // If leaving mid-month, prorate the days stayed if not already billed:
  const proratedRent = 0; // standard Tamil Nadu PG handles either full month or invoice balance
  
  const totalDues = unpaidInvoicesSum + proratedRent + damagesAmount + extraCharges;
  const depositPaid = resident.deposit_paid || 0;
  const netPayable = totalDues - depositPaid;
  
  return {
    resident_id: resident.id,
    resident_name: resident.full_name,
    room_no: room.room_no,
    bed_label: bedLabel,
    branch_name: branch.name,
    join_date: resident.join_date,
    vacate_date: vacateDateStr,
    deposit_paid: depositPaid,
    pending_rent: unpaidInvoicesSum,
    prorated_rent: proratedRent,
    damages_charges: damagesAmount,
    extra_charges: extraCharges,
    net_payable: netPayable,
    refund_amount: netPayable < 0 ? Math.abs(netPayable) : 0,
    resident_balance_due: netPayable > 0 ? netPayable : 0,
    reason,
  };
}

/**
 * Generate official PDF receipt for rent payment
 */
export function generateRentReceiptPDF(params: {
  payment: Payment;
  resident: Resident;
  room: Room;
  branch: Branch;
}) {
  const { payment, resident, room, branch } = params;
  const doc = new jsPDF({ unit: "pt", format: "a5" }); // A5 receipt slip

  // Gold header bar
  doc.setFillColor(214, 171, 71); // #D6AB47
  doc.rect(0, 0, 420, 60, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("AISHWARAYA HOSTELS & PG", 210, 28, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Official Payment Receipt / Acknowledgement", 210, 46, { align: "center" });

  // Receipt meta
  doc.setTextColor(15, 36, 63); // #0F243F
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Receipt No: ${payment.receipt_no}`, 30, 85);
  doc.text(`Date: ${formatDate(payment.paid_on)}`, 300, 85);

  // Line divider
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(1);
  doc.line(30, 95, 390, 95);

  // Resident details box
  doc.setFillColor(254, 252, 243);
  doc.roundedRect(30, 105, 360, 90, 6, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Resident Information", 45, 125);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(`Name: ${resident.full_name}`, 45, 145);
  doc.text(`Phone: ${resident.phone}`, 45, 162);
  doc.text(`Branch: ${branch.name}`, 220, 145);
  doc.text(`Room: ${room.room_no} (${room.room_type})`, 220, 162);
  doc.text(`Company / College: ${resident.college_or_company || "N/A"}`, 45, 180);

  // Payment Breakdown
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Payment Breakdown", 30, 220);

  doc.setFillColor(243, 244, 246);
  doc.rect(30, 230, 360, 24, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Description", 40, 245);
  doc.text("Mode / Ref", 220, 245);
  doc.text("Amount", 350, 245, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.text("Monthly Hostel Rent & Food", 40, 275);
  doc.text(`${payment.mode} ${payment.reference_no ? "(" + payment.reference_no + ")" : ""}`, 220, 275);
  doc.setFont("helvetica", "bold");
  doc.text(formatRupee(payment.amount), 350, 275, { align: "right" });

  // Total Box
  doc.setDrawColor(214, 171, 71);
  doc.setLineWidth(1.5);
  doc.rect(30, 300, 360, 35);
  doc.setFontSize(12);
  doc.setTextColor(138, 106, 27); // #8A6A1B
  doc.text("TOTAL AMOUNT RECEIVED:", 45, 322);
  doc.setFontSize(14);
  doc.text(formatRupee(payment.amount), 350, 323, { align: "right" });

  // Signatures & footer
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Head Office: ${COMPANY.headOffice}.`, 210, 370, { align: "center" });
  doc.text(`Enquiries & Support: ${COMPANY.phone} | Computer generated staff acknowledgement.`, 210, 385, { align: "center" });

  doc.save(`Aishwaraya_Receipt_${payment.receipt_no}.pdf`);
}

/**
 * Generate official Vacate Settlement PDF Slip
 */
export function generateVacateSettlementPDF(settlement: VacateSettlement) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  // Header banner
  doc.setFillColor(214, 171, 71);
  doc.rect(0, 0, 595, 75, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("AISHWARAYA HOSTELS & PG", 297, 35, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("RESIDENT VACATE & DEPOSIT SETTLEMENT CLEARANCE SLIP", 297, 55, { align: "center" });

  // Info
  doc.setTextColor(15, 36, 63);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Settlement Date: ${formatDate(settlement.vacate_date)}`, 40, 105);
  doc.text(`Branch: ${settlement.branch_name}`, 400, 105);

  doc.setDrawColor(229, 231, 235);
  doc.line(40, 115, 555, 115);

  // Resident profile summary
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(40, 125, 515, 75, 6, 6, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Resident: ${settlement.resident_name}`, 55, 145);
  doc.text(`Room & Bed: ${settlement.room_no} (${settlement.bed_label})`, 330, 145);
  doc.setFont("helvetica", "normal");
  doc.text(`Admission Date: ${formatDate(settlement.join_date)}`, 55, 168);
  doc.text(`Vacate Reason: ${settlement.reason || "Personal / Relocation"}`, 55, 186);

  // Financial Breakdown Table
  let y = 230;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Financial Settlement Breakdown", 40, y);

  y += 15;
  doc.setFillColor(243, 244, 246);
  doc.rect(40, y, 515, 26, "F");
  doc.setFontSize(10);
  doc.text("Particulars", 55, y + 17);
  doc.text("Credit (To Resident)", 360, y + 17, { align: "right" });
  doc.text("Debit (Dues/Charges)", 510, y + 17, { align: "right" });

  y += 26;
  // Row 1: Security Deposit
  doc.setFont("helvetica", "normal");
  doc.text("Refundable Security Deposit Held", 55, y + 20);
  doc.text(formatRupee(settlement.deposit_paid), 360, y + 20, { align: "right" });
  doc.text("₹0", 510, y + 20, { align: "right" });

  y += 30;
  // Row 2: Unpaid Rent
  doc.text("Pending Rent / Arrears", 55, y + 20);
  doc.text("₹0", 360, y + 20, { align: "right" });
  doc.text(formatRupee(settlement.pending_rent), 510, y + 20, { align: "right" });

  y += 30;
  // Row 3: Damages & Cleaning
  doc.text("Damages, Room Maintenance & Cleaning Fee", 55, y + 20);
  doc.text("₹0", 360, y + 20, { align: "right" });
  doc.text(formatRupee(settlement.damages_charges + settlement.extra_charges), 510, y + 20, { align: "right" });

  y += 40;
  // Summary Highlight Box
  if (settlement.refund_amount > 0) {
    doc.setFillColor(236, 253, 245); // light green
    doc.setDrawColor(16, 185, 129); // emerald
    doc.rect(40, y, 515, 50, "FD");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(6, 95, 70);
    doc.setFontSize(13);
    doc.text("NET REFUND AMOUNT PAYABLE TO RESIDENT:", 55, y + 32);
    doc.setFontSize(16);
    doc.text(formatRupee(settlement.refund_amount), 520, y + 32, { align: "right" });
  } else {
    doc.setFillColor(254, 242, 242); // light red
    doc.setDrawColor(225, 29, 72); // rose
    doc.rect(40, y, 515, 50, "FD");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(159, 18, 57);
    doc.setFontSize(13);
    doc.text("NET BALANCE DUE FROM RESIDENT:", 55, y + 32);
    doc.setFontSize(16);
    doc.text(formatRupee(settlement.resident_balance_due), 520, y + 32, { align: "right" });
  }

  // Clearances & Declarations
  y += 85;
  doc.setTextColor(15, 36, 63);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.text("• All hostel amenities, keys, and room assets have been surrendered in acceptable condition.", 40, y);
  doc.text("• The resident has cleared dues or accepted the deposit refund specified above.", 40, y + 16);
  doc.text("• The resident record has been marked VACATED and the assigned bed is officially freed.", 40, y + 32);

  // Signatures
  y += 100;
  doc.line(60, y, 200, y);
  doc.line(395, y, 535, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Resident Signature", 130, y + 15, { align: "center" });
  doc.text("Warden / Authorized Signatory", 465, y + 15, { align: "center" });

  doc.save(`Aishwaraya_Vacate_Settlement_${settlement.resident_name.replace(/\s+/g, '_')}.pdf`);
}
