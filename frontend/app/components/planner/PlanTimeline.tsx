"use client";

import { motion } from "framer-motion";
import type { PlanStep } from "@/lib/recoApi";

const TYPE_COLORS: Record<string, string> = {
  cafe: "#FACC15",
  food: "#F97316",
  culture: "#8B5CF6",
  shopping: "#EC4899",
  fan_zone: "#22D3EE",
  match: "#EF4444",
  transport: "#6B7280",
  artisan: "#10B981",
  sunset: "#F59E0B",
  breakfast: "#FB923C",
  activity: "#3B82F6",
  hotel: "#A78BFA",
};

const TYPE_EMOJIS: Record<string, string> = {
  cafe: "☕",
  food: "🍽️",
  culture: "🏛️",
  shopping: "🛍️",
  fan_zone: "🍺",
  match: "⚽",
  transport: "🚇",
  artisan: "🧵",
  sunset: "🌅",
  breakfast: "🥐",
  activity: "🎯",
  hotel: "🏨",
};

function getColor(type: string): string {
  return TYPE_COLORS[type] ?? "#3B82F6";
}
function getEmoji(type: string): string {
  return TYPE_EMOJIS[type] ?? "📍";
}

type Props = {
  steps: PlanStep[];
  activeStep?: number | null;
  onStepClick?: (idx: number) => void;
};

export default function PlanTimeline({ steps, activeStep, onStepClick }: Props) {
  if (steps.length === 0) return null;

  return (
    <div
      className="w-full overflow-x-auto"
      style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}
    >
      <div className="flex items-stretch gap-0 px-3 py-2.5 min-w-max">
        {steps.map((step, idx) => {
          const color = getColor(step.type);
          const emoji = getEmoji(step.type);
          const isActive = activeStep === idx;
          const isMatch = step.type === "match";
          const isLast = idx === steps.length - 1;

          return (
            <div key={idx} className="flex items-center">
              {/* Step card */}
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onStepClick?.(idx)}
                className="relative flex flex-col rounded-xl px-3 py-2 min-w-[130px] max-w-[160px] text-left transition-colors"
                style={{
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: isActive ? color : isMatch ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)",
                  backgroundColor: isActive
                    ? `${color}18`
                    : isMatch
                    ? "rgba(239,68,68,0.06)"
                    : "rgba(255,255,255,0.025)",
                  boxShadow: isActive ? `0 0 0 2px ${color}30, 0 4px 16px ${color}15` : "none",
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="timeline-active"
                    className="absolute -top-px left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )}

                {/* Step number + time */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div
                    className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
                    style={{
                      backgroundColor: color,
                      color: ["#FACC15", "#10B981", "#22D3EE", "#F59E0B", "#FB923C"].includes(color) ? "#000" : "#fff",
                    }}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-white/25 tabular-nums">
                    {step.startTime}
                  </span>
                </div>

                {/* Title */}
                <div
                  className="text-[11px] font-black leading-tight line-clamp-2"
                  style={{
                    color: isActive ? color : isMatch ? "#EF4444" : "rgba(255,255,255,0.75)",
                  }}
                >
                  {step.title}
                </div>

                {/* Footer */}
                <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-white/25">
                  <span>{emoji}</span>
                  <span>{step.estimatedDurationMinutes}min</span>
                  {step.distanceFromUserKm != null && (
                    <>
                      <span className="opacity-30">·</span>
                      <span>{step.distanceFromUserKm.toFixed(1)}km</span>
                    </>
                  )}
                </div>
              </motion.button>

              {/* Connector arrow between steps */}
              {!isLast && (
                <div className="flex items-center px-1 shrink-0">
                  <div className="flex items-center gap-0.5">
                    <div className="w-3 h-px bg-white/12" />
                    <svg width="5" height="8" viewBox="0 0 5 8" fill="none">
                      <path d="M1 1L4 4L1 7" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
