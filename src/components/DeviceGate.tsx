"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Loader2,
  Lock,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import { useHostel } from "@/lib/store";
import { validatePasswordPolicy } from "@/lib/auth-crypto";

export function DeviceGate({ children }: { children: React.ReactNode }) {
  const {
    isAuthenticated,
    isAuthChecking,
    isLocked,
    currentUser,
    login,
    logout,
    unlockWithPassword,
    changePassword,
  } = useHostel();

  // Login form state
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [keepMeSignedIn, setKeepMeSignedIn] = useState<boolean>(true);
  const [capsLockActive, setCapsLockActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loginSuccess, setLoginSuccess] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);

  // Inactivity unlock state
  const [unlockPassword, setUnlockPassword] = useState<string>("");
  const [showUnlockPassword, setShowUnlockPassword] = useState<boolean>(false);
  const [unlockError, setUnlockError] = useState<string>("");
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  const [unlockShake, setUnlockShake] = useState<boolean>(false);

  // First-login password change state
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [firstChangeError, setFirstChangeError] = useState<string>("");
  const [isChangingFirst, setIsChangingFirst] = useState<boolean>(false);

  const passwordInputRef = useRef<HTMLInputElement>(null);
  const unlockInputRef = useRef<HTMLInputElement>(null);

  // Caps lock detector
  const handleKeyModifier = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === "function") {
      setCapsLockActive(e.getModifierState("CapsLock"));
    }
  };

  const triggerShake = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(true);
    setTimeout(() => setter(false), 220);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([40, 60, 40]);
      } catch {}
    }
  };

  // 1. Submit Login Form
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || loginSuccess) return;

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setErrorMessage("Invalid ID or password.");
      triggerShake(setShake);
      setPassword("");
      passwordInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const result = await login({
      username: trimmedUser,
      password,
      keepMeSignedIn,
    });

    setIsSubmitting(false);

    if (result.success) {
      setLoginSuccess(true);
    } else {
      setErrorMessage(result.error || "Invalid ID or password.");
      triggerShake(setShake);
      setPassword("");
      passwordInputRef.current?.focus();
    }
  };

  // 2. Submit Inactivity Unlock Form
  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUnlocking) return;

    if (!unlockPassword) {
      setUnlockError("Please enter your password.");
      triggerShake(setUnlockShake);
      return;
    }

    setIsUnlocking(true);
    setUnlockError("");

    const result = await unlockWithPassword(unlockPassword);
    setIsUnlocking(false);

    if (result.success) {
      setUnlockPassword("");
      setUnlockError("");
    } else {
      setUnlockError(result.error || "Incorrect password.");
      setUnlockPassword("");
      triggerShake(setUnlockShake);
      unlockInputRef.current?.focus();
    }
  };

  // 3. Submit First-Login Password Change Form
  const handleFirstPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isChangingFirst) return;

    if (newPassword !== confirmPassword) {
      setFirstChangeError("Passwords do not match.");
      return;
    }

    const policy = validatePasswordPolicy(newPassword, currentUser?.username);
    if (!policy.isValid) {
      setFirstChangeError(policy.errors[0] || "Password does not meet security requirements.");
      return;
    }

    setIsChangingFirst(true);
    setFirstChangeError("");

    const res = await changePassword({
      newPassword,
      confirmPassword,
    });

    setIsChangingFirst(false);

    if (!res.success) {
      setFirstChangeError(res.error || "Failed to set password.");
    }
  };

  // Initial session check splash
  if (isAuthChecking) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-[#0F243F] via-[#0F243F] to-[#0A1B30] text-white flex flex-col items-center justify-center p-4">
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
          className="w-16 h-16 rounded-2xl bg-gold-gradient text-[#0F243F] font-serif font-black text-3xl flex items-center justify-center shadow-[0_4px_24px_rgba(214,171,71,0.4)]"
        >
          A
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 1: LOGIN SCREEN (Replaces PIN Pad)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-[#0F243F] via-[#0F243F] to-[#0A1B30] text-white flex flex-col items-center justify-center p-4 pt-safe pb-safe relative overflow-y-auto">
        {/* Soft Gold Radial Glows */}
        <div className="absolute top-1/4 -right-24 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(214,171,71,0.18)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-1/4 -left-24 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(214,171,71,0.14)_0%,transparent_70%)] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={
            shake
              ? { x: [0, -12, 12, -8, 8, -4, 4, 0], opacity: 1, y: 0 }
              : { opacity: 1, y: 0 }
          }
          transition={{ duration: shake ? 0.22 : 0.3, ease: "easeOut" }}
          className="w-full max-w-[420px] rounded-3xl bg-white/[0.08] backdrop-blur-xl border border-white/15 p-6 sm:p-8 text-slate-100 shadow-2xl relative z-10 my-auto"
        >
          {/* Logo Tile */}
          <div className="flex flex-col items-center text-center space-y-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gold-gradient text-[#0F243F] font-serif font-black text-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(214,171,71,0.4)]">
              A
            </div>
            <div>
              <h1 className="font-serif-heading text-[22px] sm:text-[24px] font-bold text-white tracking-tight">
                Aishwaraya Hostels & PG
              </h1>
              <p className="text-[13px] text-slate-300 mt-0.5 tracking-wide uppercase font-semibold">
                Hostels Console
              </p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* ID Field */}
            <div>
              <label
                htmlFor="auth-id"
                className="block text-[13px] font-semibold text-slate-200 mb-1.5"
              >
                ID
              </label>
              <input
                id="auth-id"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                placeholder="Enter your ID"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrorMessage("");
                }}
                disabled={isSubmitting || loginSuccess}
                className="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-[16px] focus:outline-none focus:ring-2 focus:ring-[#D6AB47] transition shadow-inner"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="auth-password"
                  className="block text-[13px] font-semibold text-slate-200"
                >
                  Password
                </label>
                {capsLockActive && (
                  <span className="text-[11px] text-[#FF85A1] font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Caps Lock is on
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  ref={passwordInputRef}
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage("");
                  }}
                  onKeyDown={handleKeyModifier}
                  onKeyUp={handleKeyModifier}
                  disabled={isSubmitting || loginSuccess}
                  className="w-full h-12 pl-4 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-[16px] focus:outline-none focus:ring-2 focus:ring-[#D6AB47] transition shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-0 top-0 h-12 w-12 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-300 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Keep me signed in checkbox */}
            <div className="flex items-center gap-2.5 pt-1">
              <input
                id="keep-signed-in"
                type="checkbox"
                checked={keepMeSignedIn}
                onChange={(e) => setKeepMeSignedIn(e.target.checked)}
                className="w-4 h-4 rounded border-white/30 text-[#D6AB47] focus:ring-[#D6AB47] bg-white/10 accent-[#D6AB47] cursor-pointer"
              />
              <label
                htmlFor="keep-signed-in"
                className="text-[13px] text-slate-300 select-none cursor-pointer"
              >
                Keep me signed in on this device
              </label>
            </div>

            {/* Error Message with aria-live */}
            <div aria-live="polite" className="min-h-[22px]">
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[13px] text-[#FF85A1] font-semibold flex items-center gap-1.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || loginSuccess}
              className="w-full h-12 rounded-xl bg-gold-gradient text-[#0F243F] font-bold text-[15px] shadow-[0_4px_16px_rgba(214,171,71,0.35)] flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-60 cursor-pointer"
            >
              {loginSuccess ? (
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2 font-black"
                >
                  <Check className="w-5 h-5 stroke-[3]" /> Authenticated
                </motion.span>
              ) : isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>

          {/* Footer Assistance */}
          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <p className="text-[12px] text-slate-400">
              Forgot your password?{" "}
              <span className="text-[#E2BF6C] font-semibold">
                Ask the owner to reset it.
              </span>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 2: FIRST-LOGIN FORCED PASSWORD CHANGE
  // =========================================================================
  if (currentUser?.must_change_password) {
    const policy = validatePasswordPolicy(newPassword, currentUser.username);

    return (
      <div className="min-h-dvh bg-gradient-to-br from-[#0F243F] via-[#0F243F] to-[#0A1B30] text-white flex flex-col items-center justify-center p-4 pt-safe pb-safe relative overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[440px] rounded-3xl bg-white/[0.08] backdrop-blur-xl border border-white/15 p-6 sm:p-8 text-slate-100 shadow-2xl relative z-10"
        >
          <div className="w-12 h-12 rounded-2xl bg-gold-gradient text-[#0F243F] font-serif font-black text-xl flex items-center justify-center mx-auto shadow-md mb-4">
            A
          </div>
          <div className="text-center mb-6">
            <h2 className="font-serif-heading text-[22px] font-bold text-white">
              Set Your Password
            </h2>
            <p className="text-[13px] text-slate-300 mt-1">
              Welcome, <strong className="text-[#E2BF6C]">{currentUser.full_name}</strong>. Please
              set a secure personal password to activate your console account.
            </p>
          </div>

          <form onSubmit={handleFirstPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-slate-200 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full h-12 pl-4 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-[16px] focus:outline-none focus:ring-2 focus:ring-[#D6AB47]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-0 top-0 h-12 w-12 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-300 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-200 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-[16px] focus:outline-none focus:ring-2 focus:ring-[#D6AB47]"
              />
            </div>

            {/* Password Strength Checklist */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-[12px]">
              <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                <span>Password Strength</span>
                <span
                  className={
                    policy.label === "Strong"
                      ? "text-emerald-400 font-bold"
                      : policy.label === "Good"
                      ? "text-cyan-400 font-bold"
                      : policy.label === "Fair"
                      ? "text-amber-300 font-bold"
                      : "text-slate-400"
                  }
                >
                  {policy.label}
                </span>
              </div>
              <div className="flex gap-1 h-1.5 mb-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 rounded-full ${
                      policy.score >= step
                        ? policy.score >= 4
                          ? "bg-emerald-400"
                          : policy.score === 3
                          ? "bg-cyan-400"
                          : "bg-amber-300"
                        : "bg-white/15"
                    }`}
                  />
                ))}
              </div>
              <div className="space-y-1 text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Check
                    className={`w-3.5 h-3.5 ${
                      policy.checks.minLength ? "text-emerald-400" : "text-white/30"
                    }`}
                  />
                  <span>At least 8 characters</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check
                    className={`w-3.5 h-3.5 ${
                      policy.checks.hasUpper && policy.checks.hasLower
                        ? "text-emerald-400"
                        : "text-white/30"
                    }`}
                  />
                  <span>Uppercase & lowercase letters</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check
                    className={`w-3.5 h-3.5 ${
                      policy.checks.hasNumber ? "text-emerald-400" : "text-white/30"
                    }`}
                  />
                  <span>At least one number (0-9)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check
                    className={`w-3.5 h-3.5 ${
                      policy.checks.notUsername ? "text-emerald-400" : "text-white/30"
                    }`}
                  />
                  <span>Cannot match your ID ({currentUser.username})</span>
                </div>
              </div>
            </div>

            {firstChangeError && (
              <div className="text-[13px] text-[#FF85A1] font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{firstChangeError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isChangingFirst}
              className="w-full h-12 rounded-xl bg-gold-gradient text-[#0F243F] font-bold text-[15px] shadow-lg flex items-center justify-center gap-2 hover:opacity-95 transition"
            >
              {isChangingFirst ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Password & Enter Console"}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 3: INACTIVITY LOCK SCREEN (Replaces PIN Unlock)
  // =========================================================================
  if (isLocked) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-[#0F243F] via-[#0F243F] to-[#0A1B30] text-white flex flex-col items-center justify-center p-4 pt-safe pb-safe relative overflow-hidden">
        <div className="absolute top-1/4 -right-20 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(214,171,71,0.2)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(214,171,71,0.15)_0%,transparent_70%)] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={
            unlockShake
              ? { x: [0, -12, 12, -8, 8, -4, 4, 0], opacity: 1, y: 0 }
              : { opacity: 1, y: 0 }
          }
          transition={{ duration: unlockShake ? 0.22 : 0.3, ease: "easeOut" }}
          className="w-full max-w-sm rounded-3xl bg-white/[0.08] backdrop-blur-xl border border-white/15 p-6 sm:p-8 text-center flex flex-col items-center space-y-5 shadow-2xl relative z-10"
        >
          <div className="w-14 h-14 rounded-2xl bg-gold-gradient text-[#0F243F] font-serif font-black text-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(214,171,71,0.4)]">
            A
          </div>

          <div>
            <h2 className="font-serif-heading text-[22px] font-bold text-white tracking-tight">
              Aishwaraya Hostels
            </h2>
            <p className="text-[13px] text-slate-300 mt-0.5">
              Console Inactive • Re-enter password to unlock
            </p>
          </div>

          {/* User Info (Read-only) */}
          <div className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-left">
            <div className="text-[11px] uppercase font-bold text-slate-400">Signed In Account</div>
            <div className="text-[14px] font-bold text-white truncate mt-0.5">
              {currentUser?.full_name || "Hostel Staff"}
            </div>
            <div className="text-[12px] text-[#E2BF6C] font-mono">
              ID: {currentUser?.username || "Aishowner"}
            </div>
          </div>

          <form onSubmit={handleUnlockSubmit} className="w-full space-y-4">
            <div className="text-left">
              <label
                htmlFor="unlock-password"
                className="block text-[13px] font-semibold text-slate-200 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  ref={unlockInputRef}
                  id="unlock-password"
                  type={showUnlockPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={unlockPassword}
                  onChange={(e) => {
                    setUnlockPassword(e.target.value);
                    setUnlockError("");
                  }}
                  onKeyDown={handleKeyModifier}
                  onKeyUp={handleKeyModifier}
                  disabled={isUnlocking}
                  className="w-full h-12 pl-4 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-[16px] focus:outline-none focus:ring-2 focus:ring-[#D6AB47]"
                />
                <button
                  type="button"
                  onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                  aria-label={showUnlockPassword ? "Hide password" : "Show password"}
                  className="absolute right-0 top-0 h-12 w-12 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-300 hover:text-white"
                >
                  {showUnlockPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {unlockError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[13px] text-[#FF85A1] font-semibold text-left flex items-center gap-1.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{unlockError}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isUnlocking}
              className="w-full h-12 rounded-xl bg-gold-gradient text-[#0F243F] font-bold text-[15px] shadow-lg flex items-center justify-center gap-2 hover:opacity-95 transition cursor-pointer"
            >
              {isUnlocking ? <Loader2 className="w-5 h-5 animate-spin" /> : "Unlock Console"}
            </button>
          </form>

          <button
            onClick={() => logout()}
            className="text-[13px] text-slate-400 hover:text-white transition flex items-center gap-1.5 font-semibold pt-1"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out of account
          </button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
