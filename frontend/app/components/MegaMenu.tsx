"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";

export type NavItem = {
  label: string;
  href: string;
  description: string;
  icon: React.ReactNode;
};

type MegaMenuProps = {
  open: boolean;
  onClose: () => void;
  logoSrc?: string; // optional, if you want to show logo in the panel header too
};

export default function MegaMenu({ open, onClose, logoSrc = "/gomatch-logo.png" }: MegaMenuProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const navItems: NavItem[] = useMemo(
    () => [
      { label: "Home", href: "/", description: "Welcome to Morocco 2030", icon: <ShieldIcon /> },
      { label: "Matches & Events", href: "/events", description: "Stadiums & Fan Zones", icon: <CalendarIcon /> },
      { label: "Local Businesses", href: "/businesses", description: "Shops, artisans & merchants", icon: <StoreIcon /> },
      { label: "Culture & Discovery", href: "/culture", description: "Heritage & Gastronomy", icon: <MuseumIcon /> },
      { label: "Recommendations", href: "/recommendations", description: "AI-powered personalized tips", icon: <SparkIcon /> },
      { label: "Interactive Map", href: "/map", description: "Interactive City Guide", icon: <MapIcon /> },
      // optional:
      { label: "Tickets", href: "/tickets", description: "Secure your spot", icon: <TicketIcon /> },
    ],
    []
  );

  useEffect(() => {
    if (!open) return;

    // focus close button when opened
    const t = setTimeout(() => closeBtnRef.current?.focus(), 0);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    // lock body scroll when open
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Overlay */}
      <button
        aria-label="Close menu overlay"
        onClick={onClose}
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
      />

      {/* Panel */}
      <div className="relative mx-auto max-w-6xl px-4 pt-5">
        <div
          ref={panelRef}
          className="rounded-[28px] bg-white shadow-[0_24px_80px_rgba(0,0,0,.18)] border border-black/10 overflow-hidden"
        >
          {/* Panel top bar */}
          <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-black/5 bg-white/90">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative h-9 w-36 sm:h-10 sm:w-44">
                <Image src={logoSrc} alt="GoMatch" fill className="object-contain" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-extrabold tracking-tight">GoMatch</div>
                <div className="text-xs text-black/55 -mt-0.5">Morocco 2030 • Tournament Explorer</div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden md:inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-[#faf3e0] border border-black/10 text-black/70">
                <span className="h-2 w-2 rounded-full bg-[#006233]" />
                Live matchday mode
              </span>

              <button
                ref={closeBtnRef}
                onClick={onClose}
                className="h-10 w-10 inline-flex items-center justify-center rounded-full bg-black/90 text-white hover:bg-black transition"
                aria-label="Close menu"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
              {/* Left: cards grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-extrabold tracking-[0.16em] text-black/45">
                    TOURNAMENT EXPLORER
                  </div>
                  <a href="/all" className="text-xs font-extrabold text-[#c4161c] hover:opacity-80">
                    VIEW ALL
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {navItems.map((it) => (
                    <NavCard key={it.href} item={it} onClose={onClose} />
                  ))}
                </div>
              </div>

              {/* Right: AI concierge + status */}
              <div className="flex flex-col gap-4">
                <div className="rounded-[24px] bg-[#c4161c] text-white p-6 shadow-[0_18px_55px_rgba(196,22,28,.25)]">
                  <div className="h-12 w-12 rounded-2xl bg-white/18 flex items-center justify-center">
                    <BrainIcon />
                  </div>
                  <div className="mt-4 text-2xl font-extrabold leading-tight">AI Concierge</div>
                  <p className="mt-2 text-sm text-white/85 leading-relaxed">
                    Your personal guide for the 2030 World Cup. Real-time tips, crowd signals, and cultural suggestions.
                  </p>

                  <a
                    href="/ai-guide"
                    className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-white text-[#c4161c] font-extrabold px-4 py-3 hover:translate-y-[-1px] transition"
                    onClick={onClose}
                  >
                    OPEN ASSISTANT
                  </a>
                </div>

                <div className="rounded-[24px] bg-white border border-black/10 p-5 shadow-[0_16px_40px_rgba(0,0,0,.08)]">
                  <div className="text-xs font-extrabold tracking-[0.16em] text-black/45">
                    MATCHDAY STATUS
                  </div>

                  <div className="mt-4 space-y-3">
                    <StatusRow
                      left={<span className="h-2.5 w-2.5 rounded-full bg-[#c4161c]" />}
                      label="12 active matches"
                      right={<Badge tone="live">LIVE</Badge>}
                    />
                    <StatusRow
                      left={<BoltIcon />}
                      label="Transit: fluid"
                      right={<Badge tone="good">OK</Badge>}
                    />
                    <StatusRow
                      left={<FanIcon />}
                      label="Fan zones: high capacity"
                      right={<Badge tone="warn">BUSY</Badge>}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer strip */}
          <div className="px-5 sm:px-6 py-4 bg-[#faf3e0]/70 border-t border-black/5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-sm font-semibold text-black/70">
                Local-first recommendations • Fair impact for small businesses 🇲🇦
              </div>
              <div className="flex items-center gap-2">
                <Pill>⚽ Match-day</Pill>
                <Pill>🕌 Culture</Pill>
                <Pill>🗺️ City Guide</Pill>
              </div>
            </div>
          </div>
        </div>

        {/* bottom spacing */}
        <div className="h-6" />
      </div>
    </div>
  );
}

function NavCard({ item, onClose }: { item: NavItem; onClose: () => void }) {
  return (
    <a
      href={item.href}
      onClick={onClose}
      className="group flex items-center justify-between gap-3 rounded-[20px] border border-black/10 bg-white hover:bg-[#faf3e0]/40 transition p-4 shadow-[0_14px_35px_rgba(0,0,0,.06)]"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-11 w-11 rounded-2xl bg-[#c4161c]/8 border border-black/5 flex items-center justify-center text-[#c4161c]">
          {item.icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-extrabold leading-tight">{item.label}</div>
          <div className="text-xs text-black/55 truncate">{item.description}</div>
        </div>
      </div>

      <span className="text-black/35 group-hover:text-black/70 transition font-black text-lg">›</span>
    </a>
  );
}

function StatusRow({
  left,
  label,
  right,
}: {
  left: React.ReactNode;
  label: string;
  right: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-[#faf3e0] border border-black/10 flex items-center justify-center">
          {left}
        </div>
        <div className="text-sm font-semibold text-black/75">{label}</div>
      </div>
      {right}
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "live" | "good" | "warn" }) {
  const cls =
    tone === "live"
      ? "bg-[#c4161c]/10 text-[#c4161c] border-[#c4161c]/20"
      : tone === "good"
      ? "bg-[#006233]/10 text-[#006233] border-[#006233]/20"
      : "bg-[#f2b705]/20 text-[#6b4a00] border-[#f2b705]/30";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${cls}`}>
      {children}
    </span>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white border border-black/10 px-3 py-1 text-xs font-semibold text-black/70">
      {children}
    </span>
  );
}

/* Icons (tiny inline svg) */
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V7l8-4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 3v3M16 3v3M4 8h16M6 6h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function StoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7l2-3h12l2 3v3a3 3 0 01-3 3 3 3 0 01-3-3 3 3 0 01-3 3 3 3 0 01-3-3 3 3 0 01-3 3 3 3 0 01-3-3V7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M6 22V12m12 10V12M9 22h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function MuseumIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3 3 8h18L12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M5 10v9M9 10v9M15 10v9M19 10v9M4 19h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function SparkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l1.2 4.2L17 7.5l-3.8 1.3L12 13l-1.2-4.2L7 7.5l3.8-1.3L12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M5 14l.8 2.6L8 17.4l-2.2.8L5 21l-.8-2.8L2 17.4l2.2-.8L5 14Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M19 12l.8 2.6 2.2.8-2.2.8L19 19l-.8-2.8-2.2-.8 2.2-.8L19 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
function MapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 3v15M15 6v15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function TicketIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 9a2 2 0 002-2h12a2 2 0 002 2v2a2 2 0 010 4v2a2 2 0 00-2 2H6a2 2 0 00-2-2v-2a2 2 0 010-4V9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M13 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function BrainIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 4a3 3 0 00-3 3v1a2 2 0 00-2 2v1a2 2 0 002 2v1a3 3 0 003 3h1m4-14a3 3 0 013 3v1a2 2 0 012 2v1a2 2 0 01-2 2v1a3 3 0 01-3 3h-1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M10 7h.01M14 7h.01M10 11h.01M14 11h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
function BoltIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-black/75">
      <path d="M13 2 3 14h7l-1 8 12-14h-7l-1-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
function FanIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-black/75">
      <path
        d="M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 3c3 0 4 2 4 4s-2 4-4 5M21 12c0 3-2 4-4 4s-4-2-5-4M12 21c-3 0-4-2-4-4s2-4 4-5M3 12c0-3 2-4 4-4s4 2 5 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
