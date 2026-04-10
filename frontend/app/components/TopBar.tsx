"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Menu, X, ChevronDown, User, Settings, Home,
  Calendar, Landmark, Map as CarteIcon, Heart,
  LogOut, CreditCard, Ticket, HelpCircle, LucideIcon
} from "lucide-react";
import { logout } from "@/lib/logout";

type TopBarProps = {
  sidebarCollapsed?: boolean;
  sidebarOpen?: boolean; // ✅ Ajouté pour corriger l'erreur de type
  onToggleSidebar?: () => void;
};

const NAV_ITEMS = [
  { label: "Accueil", href: "/", icon: Home },
  { label: "Matchs", href: "/events", icon: Calendar },
  { label: "Culture", href: "/culture", icon: Landmark },
  { label: "Carte", href: "/carte", icon: CarteIcon },
];

export function TopBar({ sidebarCollapsed, onToggleSidebar }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const moreRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

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
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    window.dispatchEvent(new Event("gomatch-auth-changed"));
    router.push("/signin");
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header className="sticky top-0 z-[110] w-full bg-black/40 backdrop-blur-3xl">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
          <div className="grid grid-cols-3 h-20 items-center">
            
            {/* GAUCHE : BURGER & LOGO */}
            <div className="flex items-center gap-4 justify-self-start">
              <button 
                onClick={onToggleSidebar}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:border-[#facc15] transition-all"
              >
                {sidebarCollapsed ? <Menu size={22} /> : <X size={22} />}
              </button>

              <Link href="/" className="flex items-center gap-3">
                <div className="relative h-10 w-10 md:h-11 md:w-11">
                  <Image src="/LogoGoMatch2030.png" alt="Logo" fill className="object-contain" priority />
                </div>
                <motion.h1 
                  className="hidden md:block text-xl font-[1000] tracking-tighter italic uppercase bg-clip-text text-transparent bg-gradient-to-r from-[#facc15] via-white to-[#facc15] bg-[length:200%_auto]"
                  animate={{ backgroundPosition: ["0% center", "200% center"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                  Gomatch
                </motion.h1>
              </Link>
            </div>

            {/* CENTRE : NAVIGATION */}
            <div className="flex justify-center">
              {authed && (
                <nav className="hidden lg:flex items-center gap-8">
                  {NAV_ITEMS.map((item) => (
                    <Link key={item.href} href={item.href} className="relative py-2 group">
                      <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${isActive(item.href) ? "text-[#facc15]" : "text-white/40 group-hover:text-white"}`}>
                        {item.label}
                      </span>
                      {isActive(item.href) && (
                        <motion.div layoutId="nav-line" className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#facc15] shadow-[0_0_12px_#facc15]" />
                      )}
                    </Link>
                  ))}
                </nav>
              )}
            </div>

            {/* DROITE : DYNAMIQUE (AIDE OU NOTIF) & PROFIL */}
            <div className="flex items-center gap-4 justify-self-end">
              
              {authed ? (
                /* MODE CONNECTÉ : BOUTON NOTIFICATION */
                <div className="relative" ref={notifRef}>
                  <button 
                    onClick={() => setNotifOpen(!notifOpen)}
                    className={`p-2.5 rounded-xl border transition-all ${notifOpen ? "border-[#facc15] bg-[#facc15]/10 shadow-[0_0_15px_#facc15]" : "border-white/5 bg-white/5 hover:border-[#facc15]/50"}`}
                  >
                    <Bell size={20} className={notifOpen ? "text-[#facc15]" : "text-white/40"} />
                  </button>
                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 12 }} exit={{ opacity: 0, y: 15 }}
                        className="absolute right-0 top-full w-72 rounded-2xl border border-white/10 bg-black/95 p-4 shadow-2xl backdrop-blur-3xl z-[150]"
                      >
                        <h3 className="text-[10px] font-black uppercase text-[#facc15] mb-2">Alertes</h3>
                        <p className="text-[11px] text-white/40">Aucune notification.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* MODE INVITÉ : BOUTON AIDE */
                <Link 
                  href="/aide"
                  className="p-2.5 rounded-xl border border-white/5 bg-white/5 text-white/40 hover:text-[#facc15] hover:border-[#facc15]/50 transition-all"
                >
                  <HelpCircle size={20} />
                </Link>
              )}

              {/* SECTION PROFIL / CONNEXION */}
              <div className="relative" ref={moreRef}>
                {!authed ? (
                  <Link href="/signin">
                    <motion.div 
                      className="relative bg-[#facc15] px-6 py-2.5 rounded-xl overflow-hidden shadow-lg flex items-center justify-center min-w-[120px]"
                      whileHover="hover"
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div 
                        className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
                        variants={{ hover: { x: ["-100%", "150%"] } }}
                        transition={{ duration: 0.6 }}
                        initial={{ x: "-100%" }}
                      />
                      <span className="relative z-10 text-[10px] font-[1000] text-black uppercase tracking-widest text-center w-full block">
                        Connexion
                      </span>
                    </motion.div>
                  </Link>
                ) : (
                  <button onClick={() => setMoreOpen(!moreOpen)} className="flex items-center gap-2 p-1 border border-white/10 rounded-xl bg-black/40 hover:border-[#facc15]/30 transition-all">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#facc15] to-[#ef4444] flex items-center justify-center text-black font-black text-xs">JD</div>
                    <ChevronDown size={14} className={`text-white/20 transition-transform ${moreOpen ? "rotate-180 text-[#facc15]" : ""}`} />
                  </button>
                )}

                <AnimatePresence>
                  {moreOpen && authed && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 12 }} exit={{ opacity: 0, y: 15 }}
                      className="absolute right-0 top-full w-64 rounded-2xl border border-white/10 bg-[#0a0a0a] p-2 shadow-2xl z-[150]"
                    >
                      <div className="grid grid-cols-1">
                        <MenuLink href="/profile" icon={User} label="Profil" />
                        <MenuLink href="/favorites" icon={Heart} label="Favoris" />
                        <MenuLink href="/tickets" icon={Ticket} label="Billets" />
                        <MenuLink href="/wallet" icon={CreditCard} label="Wallet" />
                        <MenuLink href="/Settings" icon={Settings} label="Paramètres" />
                        <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase text-[#ef4444] hover:bg-[#ef4444]/10 transition-all">
                          <LogOut size={14} /> Quitter
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#facc15]/30 to-transparent" />
      </header>

      {/* --- BOTTOM BAR MOBILE --- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[110] bg-black/60 backdrop-blur-2xl border-t border-white/10 px-4 pb-8 pt-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Link href="/" className={`p-3 ${isActive('/') ? 'text-[#facc15]' : 'text-white/20'}`}><Home size={24} /></Link>
          <Link href="/events" className={`p-3 ${isActive('/events') ? 'text-[#facc15]' : 'text-white/20'}`}><Calendar size={24} /></Link>
          <button onClick={onToggleSidebar} className="flex h-14 w-14 -translate-y-6 items-center justify-center rounded-2xl bg-[#facc15] text-black shadow-lg active:scale-90"><Menu size={28} /></button>
          <Link href="/culture" className={`p-3 ${isActive('/culture') ? 'text-[#facc15]' : 'text-white/20'}`}><Landmark size={24} /></Link>
          <Link href="/map" className={`p-3 ${isActive('/map') ? 'text-[#facc15]' : 'text-white/20'}`}><CarteIcon size={24} /></Link>
        </div>
      </nav>
    </>
  );
}

function MenuLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase text-white/40 hover:text-[#facc15] hover:bg-white/5 transition-all">
      <Icon size={14} /> {label}
    </Link>
  );
}







