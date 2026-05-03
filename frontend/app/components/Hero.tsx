"use client";

import React, { useCallback, useRef } from "react";
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { MapPin, Compass, Trophy } from "lucide-react";

const ZigZagTrails = ({ enabled }: { enabled: boolean }) => {
  if (!enabled) return null;
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <svg className="absolute w-full h-full opacity-60">
        <motion.path
          d="M -120 260 L 320 460 L 640 160 L 940 560 L 1320 260 L 1720 460"
          fill="transparent"
          stroke="rgba(250,204,21,0.9)"
          strokeWidth="3"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 1, 0], x: [0, 120] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
        />
        <motion.path
          d="M -220 610 L 420 310 L 720 710 L 1120 220 L 1520 520"
          fill="transparent"
          stroke="rgba(239,68,68,0.85)"
          strokeWidth="3"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0.8, 0], x: [0, -90] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear", delay: 1 }}
        />
      </svg>
      <div className="absolute inset-0 opacity-40 [background:radial-gradient(800px_400px_at_40%_35%,rgba(250,204,21,0.10),transparent_60%),radial-gradient(800px_400px_at_70%_55%,rgba(239,68,68,0.08),transparent_60%)]" />
    </div>
  );
};

const StadiumElements = () => (
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute top-[14%] left-[5%] opacity-25">
      <Trophy className="w-20 h-20 text-yellow-500" />
    </div>
    {/* Grid light-mode: dark lines | dark-mode: white lines */}
    <div className="absolute inset-x-0 bottom-0 h-[55%] opacity-40 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:70px_70px] [transform:rotateX(75deg)] [origin:50%_100%] z-0" />
  </div>
);

export function Hero() {
  const reduceMotion = useReducedMotion();
  const enableSpotlight = !reduceMotion;

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const smoothX = useSpring(mouseX, { damping: 40, stiffness: 70 });
  const smoothY = useSpring(mouseY, { damping: 40, stiffness: 70 });

  const spotlight = useTransform([smoothX, smoothY], ([x, y]: number[]) =>
    `radial-gradient(800px circle at ${x * 100}% ${y * 100}%, rgba(250,204,21,0.10), transparent 70%)`
  );

  const rafRef = useRef<number | null>(null);
  const onMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!enableSpotlight) return;
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    });
  }, [enableSpotlight, mouseX, mouseY]);

  const enableTrails = !reduceMotion;

  return (
    <section
      onMouseMove={onMove}
      className="relative min-h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#010101] text-slate-900 dark:text-white flex items-center justify-center"
    >
      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0">
        {enableSpotlight && (
          <motion.div className="absolute inset-0" style={{ background: spotlight }} />
        )}
        <StadiumElements />
        <div className="hidden md:block">
          <ZigZagTrails enabled={enableTrails} />
        </div>
        <div className="absolute inset-0 [background:radial-gradient(700px_700px_at_0%_50%,rgba(239,68,68,0.08),transparent_60%),radial-gradient(700px_700px_at_100%_50%,rgba(16,185,129,0.08),transparent_60%)]" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 w-full max-w-7xl px-6 text-center">
        <div className="relative mb-6">
          <h1 className="text-5xl md:text-7xl lg:text-[90px] font-[1000] tracking-[-0.05em] leading-[1] md:leading-[0.95]">
            <span className="block text-slate-900 dark:text-white">
              Connectez-vous à la
            </span>
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#ef4444] via-[#facc15] via-[#f97316] to-[#ef4444] bg-[length:200%_auto] animate-flow uppercase italic pt-1">
              culture marocaine authentique
            </span>
          </h1>
        </div>

        <p className="mt-6 mx-auto max-w-3xl text-slate-500 dark:text-white/50 text-lg md:text-xl font-medium leading-relaxed px-4">
          Villes mythiques, événements exclusifs et expériences uniques —{" "}
          <span className="text-slate-900 dark:text-white font-bold italic border-b border-[#facc15]/30">
            en un seul clic.
          </span>
        </p>

        <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-8">
          <Link
            href="/test-map"
            className="group relative flex h-16 items-center justify-center gap-4 rounded-xl bg-[#facc15] px-12 shadow-[0_0_40px_rgba(250,204,21,0.25)] transition-transform hover:scale-105"
          >
            <MapPin className="h-6 w-6 text-black" />
            <span className="text-black font-black uppercase text-sm tracking-widest">
              Explorer Rabat
            </span>
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          <Link
            href="/explore"
            className="group relative flex h-16 items-center justify-center gap-4 rounded-xl bg-[#ef4444] px-12 shadow-[0_0_40px_rgba(239,68,68,0.25)] transition-transform hover:scale-105"
          >
            <Compass className="h-6 w-6 text-white" />
            <span className="text-white font-black uppercase text-sm tracking-widest">
              Activités
            </span>
            <div className="absolute inset-0 rounded-xl bg-white/12 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>

        <div className="mt-20 flex flex-col items-center gap-4 opacity-40">
          <div className="flex items-center gap-6">
            <div className="h-[1.5px] w-24 bg-gradient-to-r from-transparent via-[#facc15] to-transparent" />
            <span className="text-[10px] font-black uppercase tracking-[0.7em] text-slate-700 dark:text-white">
              VIVEZ L&apos;ÉMOTION
            </span>
            <div className="h-[1.5px] w-24 bg-gradient-to-l from-transparent via-[#ef4444] to-transparent" />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-flow { animation: flow 3.2s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-flow { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
