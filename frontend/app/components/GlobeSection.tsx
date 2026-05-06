"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import createGlobe from "cobe";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

type Marker = { location: [number, number]; size: number };

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(!!mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

export function GlobeSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const markers: Marker[] = useMemo(() => [
    { location: [34.0209, -6.8416], size: 0.1 },
    { location: [33.5731, -7.5898], size: 0.12 },
    { location: [31.6295, -7.9811], size: 0.1 },
    { location: [35.7595, -5.834], size: 0.08 },
    { location: [30.4278, -9.5981], size: 0.08 },
    { location: [34.0333, -5.0], size: 0.08 },
  ], []);

  useEffect(() => {
    if (!canvasRef.current || !wrapRef.current) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    let globe: ReturnType<typeof createGlobe> | null = null;
    let phi = 0;
    let theta = 0.25;
    let pointerX = 0;
    let pointerY = 0;

    const onPointerMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      pointerX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      pointerY = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    wrap.addEventListener("pointermove", onPointerMove, { passive: true });

    const makeGlobe = (size: number) => {
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      canvas.width = Math.floor(size * DPR);
      canvas.height = Math.floor(size * DPR);
      globe?.destroy?.();
      globe = createGlobe(canvas, {
        devicePixelRatio: DPR,
        width: canvas.width,
        height: canvas.height,
        phi, theta, dark: 1, diffuse: 1.25, mapSamples: 16000, mapBrightness: 6.2,
        baseColor: [0.1, 0.1, 0.1],
        markerColor: [251 / 255, 191 / 255, 36 / 255],
        glowColor: [251 / 255, 191 / 255, 36 / 255],
        markers,
        onRender: (state) => {
          state.width = canvas.width;
          state.height = canvas.height;
          if (!reducedMotion) {
            phi += 0.0032;
            const targetTheta = 0.25 + pointerY * 0.08;
            theta += (targetTheta - theta) * 0.08;
            state.phi = phi + pointerX * 0.06;
            state.theta = theta;
          } else {
            state.phi = phi;
            state.theta = 0.25;
          }
        },
      });
    };

    let raf = 0;
    let lastSize = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = wrap.getBoundingClientRect();
        const next = Math.max(260, Math.min(720, Math.floor(rect.width)));
        if (Math.abs(next - lastSize) >= 2) { lastSize = next; makeGlobe(next); }
      });
    });
    ro.observe(wrap);
    const initRect = wrap.getBoundingClientRect();
    lastSize = Math.max(260, Math.min(720, Math.floor(initRect.width)));
    makeGlobe(lastSize);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); wrap.removeEventListener("pointermove", onPointerMove); globe?.destroy?.(); };
  }, [markers, reducedMotion]);

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-white dark:bg-black py-10 sm:py-14">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-amber-600/10 blur-3xl" />
        <div className="absolute -bottom-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-red-500/5 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.35),rgba(255,255,255,0.92))] dark:bg-[linear-gradient(to_bottom,rgba(0,0,0,0.35),rgba(0,0,0,0.92))]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(251,191,36,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(251,191,36,0.1)_1px,transparent_1px)] [background-size:44px_44px]" />
      </div>

      <div className="container relative mx-auto flex min-h-[100svh] flex-col px-4 lg:min-h-0 lg:flex-none">
        <div className="grid flex-1 items-stretch gap-10 lg:grid-cols-2 lg:gap-12">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="flex h-full max-w-xl flex-col justify-center"
          >
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-sm text-amber-700 dark:text-amber-200/80">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Maroc 2030 • Votre guide local exclusif
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
              Vivez le Maroc{" "}
              <span className="text-amber-500 italic">autour des stades</span>, pas seulement le match.
            </h2>

            <p className="mt-5 text-base leading-relaxed text-slate-500 dark:text-zinc-400 sm:text-lg">
              Découvrez des adresses authentiques près de vous : restaurants, cafés, artisans et expériences culturelles. Le patrimoine marocain à portée de main.
            </p>

            <div className="mt-7 grid gap-3">
              {[
                { icon: MapPin, color: "text-amber-500", title: "Autour de vous, en temps réel", desc: "Cafés, restaurants et artisans à moins de 10 minutes du stade ou de votre fan zone." },
                { icon: Clock, color: "text-red-500", title: "Idéal avant / après match", desc: "Des idées rapides selon votre temps : 30 min, 1h, ou une soirée complète au cœur de la médina." },
                { icon: ShieldCheck, color: "text-amber-400", title: "Commerces vérifiés", desc: "Des lieux sélectionnés pour leur authenticité et leur accueil légendaire." },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] p-4 transition-colors hover:border-amber-500/20">
                  <Icon className={`mt-0.5 h-5 w-5 ${color}`} />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{title}</div>
                    <div className="text-sm text-slate-500 dark:text-zinc-500">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { value: "+1000", color: "text-amber-500", label: "Artisans partenaires" },
                { value: "24/7", color: "text-slate-900 dark:text-white", label: "Guide temps réel" },
                { value: "2030", color: "text-red-500", label: "Vision Mondiale" },
              ].map(({ value, color, label }) => (
                <div key={label} className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] p-4">
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-slate-500 dark:text-zinc-500 uppercase tracking-tighter">{label}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild className="h-12 w-full rounded-2xl bg-amber-500 px-6 text-black font-bold hover:bg-amber-400 sm:w-auto transition-all shadow-[0_10px_20px_-10px_rgba(245,158,11,0.5)]">
                <Link href="/explore">Découvrir autour de moi <ArrowRight className="ml-2 h-4 w-4 stroke-[3px]" /></Link>
              </Button>
              <Button
                variant="outline"
                className="h-12 w-full rounded-2xl border-slate-200 bg-transparent px-6 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/5 sm:w-auto"
                onClick={() => document.getElementById("comment-ca-marche")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                Comment ça marche ?
              </Button>
            </div>
          </motion.div>

          {/* Right – Globe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="flex h-full items-center"
          >
            <div className="w-full rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-slate-100/60 dark:bg-[#0A0C10]/60 backdrop-blur-xl p-4 sm:p-5 shadow-[0_40px_120px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between gap-3 px-2 mb-2">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Carte interactive du Maroc</div>
                  <div className="text-xs text-slate-500 dark:text-zinc-500">Points d'intérêt autour des stades et fan zones</div>
                </div>
                <div className="hidden rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest sm:inline-flex">
                  LIVE 2030
                </div>
              </div>

              <div
                ref={wrapRef}
                className="relative mt-4 mx-auto w-full max-w-[380px] sm:max-w-[540px] lg:max-w-[640px] aspect-square rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-200/40 dark:bg-black/40 p-3 flex items-center justify-center overflow-hidden"
              >
                <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-slate-300 dark:ring-white/10" />
                <canvas ref={canvasRef} className="block select-none" aria-label="Globe interactif du Maroc" role="img" />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { accent: "text-amber-500 dark:text-amber-500", label: "Populaire", title: "Gastronomie locale" },
                  { accent: "text-red-600 dark:text-red-500", label: "Culture", title: "Médinas & Souks" },
                ].map(({ accent, label, title }) => (
                  <div key={title} className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-4 transition-all hover:bg-slate-50 dark:hover:bg-white/[0.05]">
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${accent}`}>{label}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{title}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
