# Aishwaraya Hostels Console — Mobile & All-Device Verification Guide

## 1. Executive Summary

The **Aishwaraya Hostels Staff Console** is engineered from the ground up to provide a native-app-grade experience across all smartphones, foldables, tablets, laptops, and desktop workstations. Because the console enforces a strict **3-device hardware lock** (typically: Owner iPhone, Head Warden Android Phone, Tambaram Office PC), mobile ergonomics, touch responsiveness, safe area handling, and network resilience are mission-critical.

---

## 2. Device & Viewport Matrix

| Form Factor | Viewport (W x H) | Typical Devices | Navigation Mode | Key Behaviors Verified |
| :--- | :--- | :--- | :--- | :--- |
| **Small Phone** | 320 x 568 px | iPhone SE (1st Gen), Alcatel Go | Mobile AppShell | Compact KPI grid (2x2), zero horizontal overflow, full-width touch cards |
| **Standard Android** | 360 x 800 px | Galaxy A-series, Redmi, Vivo | Mobile AppShell | Native `inputMode="numeric"`, 16px input font (no auto-zoom), 44px tap targets |
| **Compact iOS** | 375 x 667 px | iPhone SE (2nd/3rd Gen), iPhone 8 | Mobile AppShell | Safe area padding (`env(safe-area-inset-bottom)`), bottom tab bar (64px) |
| **Modern iPhone** | 390 x 844 px | iPhone 12 / 13 / 14 / 15 | Mobile AppShell | Dynamic viewport (`100dvh`), auto-hide bottom nav on scroll down, reappears on scroll up |
| **Large Android** | 412 x 915 px | Pixel 7/8, Galaxy S23/S24 | Mobile AppShell | Snap-scroll filter chips, tactile haptic feedback (`navigator.vibrate`) on PIN pad |
| **Large iPhone** | 430 x 932 px | iPhone 14/15 Pro Max, Plus | Mobile AppShell | Dynamic Island safe-area accommodation, floating gold FAB (+) button |
| **Phone Landscape** | 844 x 390 px | Any phone rotated horizontally | Mobile AppShell | Compact header, 2-column room layouts, bottom sheet scroll limits |
| **Foldable (Outer)** | 344 x 882 px | Samsung Galaxy Z Fold (Cover Screen) | Mobile AppShell | Fluid typography, non-wrapping numeric metrics, responsive card grid |
| **Foldable (Inner)** | 673 x 720 px | Samsung Galaxy Z Fold (Unfolded) | Hybrid AppShell | Dual-column bed layout, spacious touch controls, 2-column stat cards |
| **Tablet Portrait** | 768 x 1024 px | iPad Mini, iPad (10th Gen) | Tablet Rail (72px) | Compact icon rail, tap-to-expand overlay sidebar with gold logo tile |
| **Tablet Landscape** | 1024 x 768 px | iPad Air, iPad Pro, Android Tab | Permanent Sidebar | 248px permanent dark navy sidebar, desktop data tables with avatar thumbnails |
| **Laptop / Desktop** | 1280 to 2560 px | MacBook, ThinkPad, 4K Monitor | Permanent Sidebar | 1280px capped & centered content container, keyboard shortcuts (`Ctrl+K`, `Esc`) |

---

## 3. Platform & Browser Ergonomics Implemented

### 3.1. iOS Safari & Installed PWA
- **Viewport Meta:**
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  ```
  *(Note: `maximum-scale=1` and `user-scalable=no` are strictly omitted to comply with WCAG 2.1 AA accessibility guidelines).*
- **Theme Color & Status Bar:** `#0F243F` applied to status bar and browser navigation header.
- **Safe Area Insets:** Utility classes `pt-safe`, `pb-safe`, and `bottom-safe` use CSS `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` so buttons and bottom bars never collide with the iOS home swipe indicator or notch.
- **No iOS Auto-Zoom on Form Inputs:** All input elements, selects, and textareas enforce `font-size: 16px` on mobile viewports (<768px). iOS Safari only zooms when font size is less than 16px; this design keeps the viewport rock-solid.
- **100dvh Geometry:** Root layouts use `h-dvh` and `min-h-dvh` (Dynamic Viewport Height) to eliminate jumping caused by the Safari URL bar collapsing during scroll.
- **Body Scroll Locking:** Modals and bottom sheets use `useLockBodyScroll` which records negative scroll offset and sets `position: fixed` to prevent background inertia scroll bouncing.

### 3.2. Android Chrome & Samsung Internet
- **Numeric Keyboards:** Rent payment amounts, deposit inputs, and phone numbers use `inputMode="numeric"` or `type="tel"` to trigger the large phone keypad immediately.
- **Tactile Haptic Feedback:** The 6-digit PIN keypad in `DeviceGate.tsx` triggers micro-vibrations (`navigator.vibrate(12)`) on digit presses and a distinct pulse pattern (`[30, 50, 30]`) on incorrect PIN entry.
- **Native Date Pickers:** Payment and move-in date pickers open the native Android calendar modal.
- **Web Share Integration:** Vacancy sharing and CSV report exports use `navigator.share` with automatic fallback to WhatsApp or direct file download.

### 3.3. Offline Sync Queue (IndexedDB)
- **`src/lib/offline-queue.ts`:** Captures staff actions (Rent Payments, Resident Admissions, Bed Transfers, Vacate Settlements) when staff are inside basement rooms or low-signal areas.
- **`NetworkBanner.tsx`:** Displays a non-intrusive warning pill when connection drops, and an automatic green sync confirmation when connection restores.

---

## 4. Screen-by-Screen Mobile & Responsive Audit

### 4.1. Dashboard (`src/components/Dashboard.tsx`)
- **Mobile Hero Banner:** Displays warden greeting, current month collection status, and quick action buttons.
- **KPI Cards:** Formatted in a balanced 2x2 grid on mobile with responsive fluid typography (`text-[20px] sm:text-[24px]`).
- **Progress Bar:** High-contrast gradient bar (Gold collected, Amber pending, Rose overdue) with responsive wrapped legend.
- **Branch Performance:** Responsive table switches from a multi-column desktop grid to compact mobile cards with branch photo thumbnail, occupancy bar, collected amount, and outstanding dues.
- **Needs Attention:** Emergency action cards with &ge;44px buttons for one-tap WhatsApp reminders and phone calls.

### 4.2. Rent Collection (`src/components/RentCollectionScreen.tsx`)
- **Stat Tiles:** Snap-scrollable horizontal carousel on mobile with soft edge fades.
- **Sticky Search & Month Selector:** Search bar stays pinned during scroll.
- **Dual View:** Desktop table (`hidden md:block`) / Mobile cards (`md:hidden`) with resident avatar, due date badge, large balance, and 44px primary "Collect" button.
- **Collect Payment Bottom Sheet:** Opens from the bottom on phones with prefilled room rent, payment method selector (GPay/UPI, Cash, Bank Transfer), native date picker, and sticky action bar.

### 4.3. Residents Directory (`src/components/ResidentsDirectory.tsx`)
- **Sticky Search & Filter:** Filter chip drawer with instant status counts.
- **Mobile Resident Cards:** Clean cards with room badge, phone, admission date, rent amount, and dedicated call/WhatsApp buttons.
- **Full-Screen Profile Sheet:** Complete 360-degree resident sheet on mobile featuring Overview, Payment History, Documents (ID proofs with camera capture), and Notes tabs, plus docked action buttons.

### 4.4. Bed & Room Layout (`src/components/BedMap.tsx`)
- **Grid Layout:** Single column on mobile (<480px), 2 columns on landscape/tablets (480–768px), 3 columns on desktop.
- **Touch-Friendly Bed Chips:** Minimum 44px height bed pills with clear state colors (Emerald for occupied, Amber for notice, Slate for vacant).
- **Bed Detail Bottom Sheet:** Full resident summary, check-in date, monthly rent, and transfer/vacate actions.

### 4.5. Add Resident Modal (`src/components/AddResidentModal.tsx`)
- **Full-Screen 3-Step Wizard:** Step 1 (Personal Info & Camera ID capture), Step 2 (Branch, Room & Bed allocation), Step 3 (Rent, Deposit & Initial payment).
- **Client-Side Image Compression:** Photos taken with phone camera are downscaled via HTML Canvas to `< 400 KB` before saving.
- **Draft Autosave:** Form state is saved in `localStorage` to prevent data loss if the browser refreshes or the phone switches apps.
- **Docked Action Bar:** "Back" and "Next / Complete Admission" buttons remain locked to the bottom with `pb-safe`.

### 4.6. Vacate Modal (`src/components/VacateModal.tsx`)
- **2-Step Settlement Flow:** Step 1 (Move-out date & reason), Step 2 (Deposit refund vs unpaid rent calculation).
- **Financial Balance Card:** Clear gold/rose settlement card showing net refund payable to resident or pending dues to collect.

### 4.7. Vacancy Board (`src/components/VacancyBoard.tsx`)
- **Public & Warden Sharing:** One-tap sharing using Web Share API or WhatsApp with pre-formatted vacancy details per branch.
- **Room Photo Strips:** Lazy-loaded room photos with responsive aspect ratio.

### 4.8. Financial & Aging Reports (`src/components/OutstandingReport.tsx`)
- **Aging Analysis Cards:** 3 buckets (0–7 days grace, 8–30 days follow-up, 30+ days critical overdue).
- **Dual View Aging Drilldown:** Desktop multi-column table / Mobile aging cards with resident avatar, branch & room, overdue badge, balance in bold, and 44px WhatsApp Remind button.
- **Native Share Export:** Supports native CSV file sharing on mobile and direct CSV download on desktop.

### 4.9. Staff Devices (`src/components/DevicesScreen.tsx`)
- **Hardware Slots:** 3 enforced slots displaying hardware platform, city, IP address, and last seen timestamp.
- **Touch Actions:** &ge;44px Rename and Revoke buttons.
- **PWA Guidance:** Guidance card explaining PWA storage isolation and slot allocation.

### 4.10. Settings & Room Wizard (`src/components/SettingsScreen.tsx`)
- **Mobile Drill-In Navigation:** On mobile (<768px), displays a top-level menu of 6 settings categories. Tapping any category smoothly navigates into the sub-screen with a "← Back to Settings Categories" header.
- **Desktop Side-by-Side:** On desktop (&ge;768px), maintains the 1-column left sub-navigation and 3-column content pane.
- **Add Room Wizard:** Responsive modal adapts to bottom sheet on mobile with 16px inputs and comfortable sharing selectors.

### 4.11. Device Gate & PIN Pad (`src/components/DeviceGate.tsx`)
- **Center PIN Card:** Centered card with `pt-safe` and `pb-safe` preventing off-screen clipping on short phones.
- **Large Keypad Keys:** 52px+ touch keys with tactile vibration on press and distinct pattern on incorrect PIN.

---

## 5. Automated Playwright Test Suite

The test suite (`tests/mobile-responsive.spec.ts`) tests all 13 viewports plus touch target sizes, mobile bottom bar interactions, and input font size enforcement.

### Test Execution Command
```bash
pnpm exec playwright test tests/mobile-responsive.spec.ts
```

### Verified Test Results (16/16 Passed)
```
Running 16 tests using 1 worker

  ok  1 [chromium] › tests\mobile-responsive.spec.ts:21:5 › Render and check horizontal overflow on iPhone-SE-1st-320px (320x568)
  ok  2 [chromium] › tests\mobile-responsive.spec.ts:21:5 › Render and check horizontal overflow on Android-Small-360px (360x800)
  ok  3 [chromium] › tests\mobile-responsive.spec.ts:21:5 › Render and check horizontal overflow on iPhone-SE-375px (375x667)
  ok  4 [chromium] › tests\mobile-responsive.spec.ts:21:5 › Render and check horizontal overflow on iPhone-14-390px (390x844)
  ok  5 [chromium] › tests\mobile-responsive.spec.ts:21:5 › Render and check horizontal overflow on Galaxy-S24-412px (412x915)
  ok  6 [chromium] › tests\mobile-responsive.spec.ts:21:5 › Render and check horizontal overflow on iPhone-Max-430px (430x932)
  ok  7 [chromium] › tests\mobile-responsive.spec.ts:21:5 › Render and check horizontal overflow on Phone-Landscape-844x390 (844x390)
  ok  8 [chromium] › tests\mobile-responsive.spec.ts:21:5 › Render and check horizontal overflow on Z-Fold-Outer-344px (344x882)
  ok  9 [chromium] › tests\mobile-responsive.spec.ts:21:5 › Render and check horizontal overflow on Z-Fold-Inner-673px (673x720)
  ok 10 [chromium] › tests\mobile-responsive.spec.ts:21:5 › Render and check horizontal overflow on iPad-Mini-768px (768x1024)
  ok 11 [chromium] › tests\mobile-responsive.spec.ts:21:5 › Render and check horizontal overflow on iPad-Landscape-1024px (1024x768)
  ok 12 [chromium] › tests\mobile-responsive.spec.ts:21:5 › Render and check horizontal overflow on Laptop-1280px (1280x800)
  ok 13 [chromium] › tests\mobile-responsive.spec.ts:21:5 › Render and check horizontal overflow on Desktop-1440px (1440x900)
  ok 14 [chromium] › tests\mobile-responsive.spec.ts:61:3 › Mobile Tab Navigation and Sheet Interactions on 375px
  ok 15 [chromium] › tests\mobile-responsive.spec.ts:116:3 › Touch Target Sizing Verification on 390px (>= 44px)
  ok 16 [chromium] › tests\mobile-responsive.spec.ts:140:3 › Input Font-Size Verification on Mobile (>= 16px to prevent iOS auto-zoom)

  16 passed (100% success)
```

---

## 6. Manual Testing Verification Protocol for Staff

When testing on physical hardware:

1. **Owner iPhone (Safari):**
   - Open console URL in Safari.
   - Tap Share button &rarr; "Add to Home Screen".
   - Launch from Home Screen: verify standalone mode, full-screen display with no Safari navigation bars, safe area padding around notch and home bar.
   - Tap any text input (e.g., search): verify that the screen **does NOT auto-zoom**.
   - Scroll down on the dashboard: verify bottom tab bar smoothly auto-hides; scroll up: verify it reappears.

2. **Warden Phone (Android Chrome / Samsung Internet):**
   - Open console URL in Chrome.
   - Tap "Collect Rent" on any resident: verify keypad opens with numeric layout.
   - Enter invalid PIN on lock screen: verify haptic pulse vibration.
   - Turn off Wi-Fi / Mobile Data: verify Network Banner displays "Offline Mode", record a payment, re-enable Wi-Fi: verify automatic sync.

3. **Office Computer (Chrome / Edge):**
   - Verify permanent 248px navy sidebar on left.
   - Verify `Ctrl+K` opens the quick search command palette.
   - Verify full multi-column tables with avatar photos and action menus.
