"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { countryOptions } from "@/lib/countries";
import * as Flags from "country-flag-icons/react/3x2";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export default function NationaliteSelect({ value, onChange, error }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    return countryOptions.filter((country) =>
      country.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  const selected = countryOptions.find((c) => c.name === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="space-y-2 relative z-[100]">
      <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">
        Nationalité
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`cyber-input neon-focus text-left flex items-center justify-between transition-all ${
          error ? "border-red-500/40" : ""
        } ${open ? "border-amber-500/50 bg-amber-500/5" : ""}`}
      >
        <span className="flex items-center gap-3 min-w-0">
          {selected && (() => {
            const Flag = Flags[selected.code as keyof typeof Flags];
            return Flag ? <Flag className="w-5 h-4 rounded-sm shrink-0 shadow-sm" /> : null;
          })()}
          <span className={`${selected ? "text-white" : "text-zinc-500"} truncate text-sm font-medium`}>
            {selected?.name || "Choisir une nationalité"}
          </span>
        </span>
        <span className={`text-amber-400 text-[10px] transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 top-full z-[999] mt-2 w-full rounded-2xl border border-white/10 bg-[#0A0C10]/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden"
          >
            <div className="p-3 border-b border-white/5 bg-white/5">
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un pays..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>

            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {filtered.length > 0 ? (
                filtered.map((country) => {
                  const Flag = Flags[country.code as keyof typeof Flags];
                  const isSelected = country.name === value;

                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => {
                        onChange(country.name);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all ${
                        isSelected 
                          ? "bg-amber-500/10 text-amber-400" 
                          : "text-zinc-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {Flag ? <Flag className="w-5 h-4 rounded-sm shrink-0" /> : null}
                      <span className="text-sm font-medium">{country.name}</span>
                      {isSelected && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_#fbbf24]" />}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-8 text-center text-xs text-zinc-500 uppercase tracking-widest font-bold">
                  Aucun résultat
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-2 text-[9px] font-black uppercase tracking-widest text-red-500 drop-shadow-[0_0_6px_#ef4444]">
          {error}
        </p>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(251, 191, 36, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 191, 36, 0.5);
        }
      `}</style>
    </div>
  );
}