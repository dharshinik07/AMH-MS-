"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface SparklineProps {
  data: number[];
  color?: "gold" | "rose" | "navy";
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({
  data,
  color = "gold",
  width = 90,
  height = 32,
  className = "",
}: SparklineProps) {
  const shouldReduceMotion = useReducedMotion();

  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 3;

  const effectiveWidth = width - padding * 2;
  const effectiveHeight = height - padding * 2;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * effectiveWidth;
    const y = height - padding - ((val - min) / range) * effectiveHeight;
    return { x, y };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  // Create area fill path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  let strokeColor = "#D6AB47"; // gold
  let fillColor = "rgba(214, 171, 71, 0.12)";
  let gradientId = "sparkline-gold";

  if (color === "rose") {
    strokeColor = "#D6336C";
    fillColor = "rgba(214, 51, 108, 0.12)";
    gradientId = "sparkline-rose";
  } else if (color === "navy") {
    strokeColor = "#374151";
    fillColor = "rgba(55, 65, 81, 0.1)";
    gradientId = "sparkline-navy";
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible ${className}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path d={areaD} fill={`url(#${gradientId})`} />

      {/* Stroke line */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: shouldReduceMotion ? 1 : 0, opacity: shouldReduceMotion ? 1 : 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* End point dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="2.5"
        fill={strokeColor}
      />
    </svg>
  );
}
