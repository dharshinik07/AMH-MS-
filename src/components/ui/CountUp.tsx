"use client";

import React, { useEffect, useRef, useState } from "react";
import { animate, useMotionValue, useReducedMotion } from "framer-motion";
import { formatRupee } from "@/lib/utils";

interface CountUpProps {
  value: number;
  isCurrency?: boolean;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function CountUp({
  value,
  isCurrency = false,
  prefix = "",
  suffix = "",
  duration = 0.9,
  className = "",
}: CountUpProps) {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<string>(() =>
    isCurrency ? formatRupee(value) : `${prefix}${Math.round(value).toLocaleString("en-IN")}${suffix}`
  );
  
  const motionVal = useMotionValue(0);
  const prevValRef = useRef(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(
        isCurrency
          ? formatRupee(value)
          : `${prefix}${Math.round(value).toLocaleString("en-IN")}${suffix}`
      );
      prevValRef.current = value;
      return;
    }

    const start = prevValRef.current;
    motionVal.set(start);

    const controls = animate(motionVal, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        if (isCurrency) {
          setDisplayValue(formatRupee(Math.round(latest)));
        } else {
          setDisplayValue(
            `${prefix}${Math.round(latest).toLocaleString("en-IN")}${suffix}`
          );
        }
      },
      onComplete: () => {
        prevValRef.current = value;
      },
    });

    return () => controls.stop();
  }, [value, isCurrency, prefix, suffix, duration, shouldReduceMotion, motionVal]);

  return <span className={`tabular-nums ${className}`}>{displayValue}</span>;
}
