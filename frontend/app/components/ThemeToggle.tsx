"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const current = theme === "system" ? systemTheme : theme;

  const options = [
    { key: "light", icon: Sun, label: "Light" },
    { key: "dark", icon: Moon, label: "Dark" },
    { key: "system", icon: Monitor, label: "System" },
  ];

  return (
    <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-black/40 p-1.5 backdrop-blur-xl shadow-2xl">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.key;

        return (
          <button
            key={option.key}
            type="button"
            onClick={() => setTheme(option.key)}
            className="relative h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300 group"
            aria-label={option.label}
          >
            {/* Background actif animé */}
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-xl bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}

            {/* Icône avec effet Neon au survol */}
            <Icon
              className={[
                "relative z-10 h-4 w-4 transition-all duration-300",
                isActive 
                  ? "text-black stroke-[2.5px]" 
                  : "text-zinc-500 group-hover:text-amber-400 group-hover:drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]",
              ].join(" ")}
            />
          </button>
        );
      })}
    </div>
  );
}


