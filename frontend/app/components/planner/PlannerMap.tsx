"use client";

import dynamic from "next/dynamic";
import type { PlanStep } from "@/lib/recoApi";

const PlannerMapInner = dynamic(() => import("./PlannerMapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0f172a]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-[#FACC15]/30 border-t-[#FACC15] animate-spin" />
        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Chargement carte…</span>
      </div>
    </div>
  ),
});

type Props = {
  steps: PlanStep[];
  route: [number, number][];
  activeStep?: number | null;
  onStepClick?: (idx: number) => void;
  userPosition?: [number, number] | null;
};

export default function PlannerMap(props: Props) {
  return <PlannerMapInner {...props} />;
}
