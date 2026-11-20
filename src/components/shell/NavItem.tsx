"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick?: () => void;
}

export function NavItem({ href, label, icon: Icon, active, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className="group relative flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-[#C9D3E0] transition-colors hover:bg-white/5 hover:text-white data-[active=true]:text-[#0F243F] data-[active=true]:font-bold"
      data-active={active}
    >
      {active && (
        <motion.span
          layoutId="nav-active-pill"
          className="absolute inset-0 -z-10 rounded-xl bg-gold-gradient shadow-[0_6px_18px_rgba(214,171,71,.35)]"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      <Icon className="relative z-10 h-[18px] w-[18px] shrink-0" />
      <span className="relative z-10 truncate">{label}</span>
    </Link>
  );
}
