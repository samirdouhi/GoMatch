"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, ChevronDown, User, Settings, Home,
  Calendar, Landmark, Map as CarteIcon, Heart,
  LogOut, CreditCard, Ticket, HelpCircle, LucideIcon,
  Compass, Bot, Trophy, LayoutGrid,
} from "lucide-react";
import { logout } from "@/lib/logout";
import { NotificationBell } from "@/app/components/notifications/NotificationBell";

type TopBarProps = {
  sidebarCollapsed?: boolean;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
};

const NAV_ITEMS_GUEST: typeof NAV_ITEMS_AUTH = [];

const NAV_ITEMS_AUTH = [
  { label: "Accueil",     href: "/",            icon: Home },
  { label: "Mon espace",  href: "/dashboard",   icon: LayoutGrid },
  { label: "Matchs",      href: "/matches",     icon: Calendar },
  { label: "Explore",     href: "/explore",     icon: Compass },
  { label: "Culture",     href: "/culture",     icon: Landmark },
  { label: "Expérience",  href: "/experience",  icon: Trophy },
  { label: "Carte",       href: "/test-map",    icon: CarteIcon },
  { label: "Assistant",   href: "/assistant",   icon: Bot },
];

export function TopBar({ sidebarCollapsed, onToggleSidebar }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = () => setAuthed(!!localStorage.getItem("gomatch_access_token"));
    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("gomatch-auth-changed", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("gomatch-auth-changed", checkAuth);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {/* ── DESKTOP TOPBAR ── */}
      <header
        className="sticky top-0 z-[110] w-full backdrop-blur-2xl border-b border-white/5"
        style={{ background: 'rgba(3,3,5,0.96)' }}
      >
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
          <div className="grid grid-cols-3 h-16 items-center">

            {/* LEFT: burger + logo */}
            <div className="flex items-center gap-3 justify-self-start">
              <button
                onClick={onToggleSidebar}
                className="hidden lg:flex p-2 rounded-xl border border-white/8 text-white/40 hover:text-[#facc15] hover:border-[#facc15]/30 transition-all"
              >
                {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
              </button>

              <Link href="/" className="flex items-center gap-2.5">
                <div className="relative h-9 w-9">
                  <Image src="/LogoGoMatch2030.png" alt="Logo" fill className="object-contain" priority />
                </div>
                <motion.h1
                  className="hidden md:block text-lg font-[1000] tracking-tighter italic uppercase bg-clip-text text-transparent bg-gradient-to-r from-[#facc15] via-white to-[#facc15] bg-[length:200%_auto]"
                  animate={{ backgroundPosition: ["0% center", "200% center"] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                >
                  GoMatch
                </motion.h1>
              </Link>
            </div>

            {/* CENTER: nav */}
            <div className="flex justify-center">
              <nav className="hidden lg:flex items-center gap-6">
                {(authed ? NAV_ITEMS_AUTH : NAV_ITEMS_GUEST).map((item) => (
                  <Link key={item.href} href={item.href} className="relative py-1.5 group">
                    <span className={`whitespace-nowrap text-[11px] font-black uppercase tracking-[0.18em] transition-colors ${
                      isActive(item.href) ? "text-[#facc15]" : "text-white/35 group-hover:text-white/80"
                    }`}>
                      {item.label}
                    </span>
                    {isActive(item.href) && (
                      <motion.div layoutId="nav-line" className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-[#facc15] shadow-[0_0_10px_#facc15]" />
                    )}
                  </Link>
                ))}
              </nav>
            </div>

            {/* RIGHT: notifications + profile */}
            <div className="flex items-center gap-3 justify-self-end">
              {authed ? (
                <NotificationBell />
              ) : (
                <Link href="/aide" className="p-2 rounded-xl border border-white/8 text-white/30 hover:text-[#facc15] hover:border-[#facc15]/30 transition-all">
                  <HelpCircle size={18} />
                </Link>
              )}

              <div className="relative" ref={moreRef}>
                {!authed ? (
                  <Link href="/signin">
                    <motion.div
                      className="relative bg-[#facc15] px-5 py-2 rounded-xl overflow-hidden shadow-lg"
                      whileHover="hover" whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
                        variants={{ hover: { x: ["-100%", "150%"] } }}
                        transition={{ duration: 0.6 }}
                        initial={{ x: "-100%" }}
                      />
                      <span className="relative z-10 text-[10px] font-[1000] text-black uppercase tracking-widest">
                        Connexion
                      </span>
                    </motion.div>
                  </Link>
                ) : (
                  <button
                    onClick={() => setMoreOpen(!moreOpen)}
                    className="flex items-center gap-2 p-1 border border-white/10 rounded-xl bg-white/5 hover:border-[#facc15]/30 transition-all"
                  >
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#facc15] to-[#ef4444] flex items-center justify-center text-black font-black text-xs">G</div>
                    <ChevronDown size={13} className={`text-white/25 transition-transform ${moreOpen ? "rotate-180 text-[#facc15]" : ""}`} />
                  </button>
                )}

                <AnimatePresence>
                  {moreOpen && authed && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 8 }} exit={{ opacity: 0, y: 12 }}
                      className="absolute right-0 top-full w-56 rounded-2xl border border-white/10 bg-[#0a0a0b] p-2 shadow-2xl z-[150]"
                    >
                      <MenuLink href="/profile"  icon={User}       label="Profil" />
                      <MenuLink href="/favorites" icon={Heart}      label="Favoris" />
                      <MenuLink href="/tickets"   icon={Ticket}     label="Billets" />
                      <MenuLink href="/wallet"    icon={CreditCard} label="Wallet" />
                      <MenuLink href="/Settings"  icon={Settings}   label="Paramètres" />
                      <div className="my-1 border-t border-white/5" />
                      <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase text-red-400 hover:bg-red-500/10 transition-all">
                        <LogOut size={13} /> Déconnexion
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-[#facc15]/20 to-transparent" />
      </header>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav
        className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-[420px] z-[110] rounded-3xl px-2 py-2 shadow-2xl"
        style={{ background: 'rgba(6,6,10,0.97)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-around">
          {(authed ? [
            { href: "/",          icon: Home,        label: "Accueil"   },
            { href: "/dashboard", icon: LayoutGrid,  label: "Mon espace" },
            { href: "/matches",   icon: Calendar,    label: "Matchs"    },
            { href: "/explore",   icon: Compass,     label: "Explore"   },
            { href: "/assistant", icon: Bot,         label: "Assistant" },
            { href: "/test-map",  icon: CarteIcon,   label: "Carte"     },
          ] : []).map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${
                isActive(href) ? "text-[#facc15]" : "text-white/30 hover:text-white/60"
              }`}
            >
              <Icon size={20} />
              <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
            </Link>
          ))}
          <button
            onClick={onToggleSidebar}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-white/30 hover:text-white/60 transition-all"
          >
            <Menu size={20} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}

function MenuLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase text-white/40 hover:text-[#facc15] hover:bg-white/5 transition-all">
      <Icon size={13} /> {label}
    </Link>
  );
}
