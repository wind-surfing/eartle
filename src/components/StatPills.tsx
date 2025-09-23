"use client";

import React from "react";
import { Clock, Target, Trophy } from "lucide-react";

type Props = {
  guesses?: number | null;
  duration?: number | null;
  score?: number | null;
  truncate?: boolean;
  className?: string;
};

export default function StatPills({
  guesses,
  duration,
  score,
  truncate = true,
  className,
}: Props) {
  const thresholdHot = 30;
  const isHot = (n?: number | null) => (n ?? 0) >= thresholdHot;

  const pillBase =
    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs sm:text-sm font-normal transition-all";
  const pillClass = (hot: boolean, lightBorder = false) =>
    hot
      ? `${pillBase} border border-transparent text-white bg-gradient-to-r from-[#4f7cff] to-blue-400`
      : `${pillBase} border ${
          lightBorder ? "border-[#4f7cff]/50" : "border-[#4f7cff]"
        } text-[#4f7cff] bg-[#4f7cff]/5`;

  const fmt = (v?: number | null) => {
    const n = v ?? 0;
    if (!truncate) return String(n);
    if (n <= 0) return "0";
    if (n >= 30) return "30+";
    return String(n);
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <span className={className}>
      <span className={pillClass(isHot(guesses))}>
        <Target className="h-4 w-4" /> {fmt(guesses)} guesses
      </span>
      <span className={pillClass(isHot(duration), true)}>
        <Clock className="h-4 w-4" /> {formatDuration(duration)}
      </span>
      <span className={pillClass(isHot(score), true)}>
        <Trophy className="h-4 w-4" /> {fmt(score)} score
      </span>
    </span>
  );
}
