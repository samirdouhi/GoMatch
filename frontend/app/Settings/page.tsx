"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

type ThemeValue = "light" | "dark" | "system";

function ThemeOption({
  value,
  label,
  icon,
  active,
  onSelect,
}: {
  value: ThemeValue;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onSelect: (v: ThemeValue) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={[
        "relative flex w-full items-center justify-between rounded-2xl border p-5 transition-all duration-300",
        active
          ? "border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
          : "border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white dark:border-white/5 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10",
      ].join(" ")}
    >
      <div className="flex items-center gap-4">
        <div
          className={[
            "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
            active
              ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]"
              : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-zinc-400",
          ].join(" ")}
        >
          {icon}
        </div>

        <div className="text-left">
          <span
            className={[
              "block font-bold tracking-tight",
              active ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-zinc-400",
            ].join(" ")}
          >
            {label}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:opacity-50 dark:text-zinc-400">
            Interface 2030
          </span>
        </div>
      </div>

      {active && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-amber-500"
        >
          <CheckCircle2 className="h-6 w-6" />
        </motion.div>
      )}
    </button>
  );
}

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const current = (theme === "system" ? resolvedTheme : theme) as "light" | "dark";

  return (
    <div className="min-h-full px-6 py-12 lg:py-20">
      <div className="mx-auto max-w-2xl">
        <header className="mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-2 flex items-center gap-2 text-amber-500"
          >
            <div className="h-1 w-8 rounded-full bg-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">
              Configuration
            </span>
          </motion.div>

          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white sm:text-5xl">
            Paramètres <span className="italic text-amber-500">Système</span>
          </h1>
        </header>

        <section className="space-y-8">
          <div className="flex items-end justify-between border-b border-slate-200 pb-4 dark:border-white/5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Apparence
              </h2>
              <p className="text-sm text-slate-500 dark:text-zinc-500">
                Personnalisez votre expérience visuelle.
              </p>
            </div>

            <div className="text-right">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600">
                Actuel
              </span>
              <span className="text-sm font-black uppercase italic text-amber-500">
                {current}
              </span>
            </div>
          </div>

          <motion.div
            className="grid gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ThemeOption
              value="light"
              label="Mode Lumineux"
              icon={<Sun className="h-6 w-6" />}
              active={theme === "light"}
              onSelect={(v) => setTheme(v)}
            />

            <ThemeOption
              value="dark"
              label="Mode Sombre"
              icon={<Moon className="h-6 w-6" />}
              active={theme === "dark"}
              onSelect={(v) => setTheme(v)}
            />

            <ThemeOption
              value="system"
              label="Système"
              icon={<Monitor className="h-6 w-6" />}
              active={theme === "system"}
              onSelect={(v) => setTheme(v)}
            />
          </motion.div>
        </section>

        <footer className="mt-16 border-t border-slate-200 pt-8 opacity-50 dark:border-white/5 dark:opacity-30">
          <p className="text-center text-[10px] font-medium tracking-[0.2em] text-slate-500 dark:text-zinc-400">
            GOMATCH ENGINE V.2.0.30 — RABAT / CASABLANCA
          </p>
        </footer>
      </div>
    </div>
  );
}