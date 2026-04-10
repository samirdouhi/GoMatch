"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Home,
  Calendar,
  Store,
  Landmark,
  Brain,
  Map as CarteIcon,
  LogIn,
  LogOut,
  X,
  Search,
  Settings,
  Heart,
  History,
  Sparkles,
  HelpCircle,
  Info,
  Mail,
  BadgeCheck,
  User,
} from "lucide-react";
import { logout } from "@/lib/logout";

type ElementMenu = {
  nom: string;
  icone: React.ElementType;
  lien: string;
  description?: string;
  badge?: string;
  external?: boolean;
};

type SectionMenu = {
  titre: string;
  elements: ElementMenu[];
};

type Props = {
  open: boolean;
  onClose: () => void;
};

function estActif(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function readAuthedFromStorage() {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("gomatch_access_token");
}

const SECTIONS_AUTH: SectionMenu[] = [
  {
    titre: "Navigation",
    elements: [
      { nom: "Accueil", icone: Home, lien: "/", description: "Page principale" },
      { nom: "Matchs", icone: Calendar, lien: "/events", description: "Calendrier" },
      { nom: "Culture", icone: Landmark, lien: "/culture", description: "Patrimoine & histoires" },
      { nom: "Carte", icone: CarteIcon, lien: "/map", description: "Explorer autour de toi" },
      { nom: "Que faire ?", icone: Store, lien: "/businesses", description: "Commerces & sorties" },
    ],
  },
  {
    titre: "Intelligent",
    elements: [
      { nom: "Assistant", icone: Brain, lien: "/assistant", description: "Aide & conseils", badge: "IA" },
      { nom: "Recommandations", icone: Sparkles, lien: "/reco", description: "Suggestions" },
    ],
  },
  {
    titre: "Mon espace",
    elements: [
      { nom: "Profil", icone: User, lien: "/profile", description: "Compte & infos" },
      { nom: "Favoris", icone: Heart, lien: "/favorites", description: "Lieux enregistrés" },
      { nom: "Historique", icone: History, lien: "/history", description: "Dernières visites" },
      { nom: "Paramètres", icone: Settings, lien: "/settings", description: "Préférences" },
    ],
  },
];

const INVITE_ACTIONS = [
  {
    label: "Créer un compte",
    href: "/Register",
    variant: "primary" as const,
    icon: BadgeCheck,
  },
  {
    label: "Se connecter",
    href: "/signin",
    variant: "secondary" as const,
    icon: LogIn,
  },
];

const INVITE_LINKS: ElementMenu[] = [
  {
    nom: "Expérience 2030",
    icone: Sparkles,
    lien: "/experience",
    description: "Villes & ambiances",
  },
  {
    nom: "Ajouter votre commerce",
    icone: Store,
    lien: "/ajouter-commerce",
    description: "Rejoindre GoMatch",
  },
  { nom: "Aide", icone: HelpCircle, lien: "/aide", description: "FAQ & support" },
  { nom: "À propos", icone: Info, lien: "/a-propos", description: "Notre mission" },
  { nom: "Contact", icone: Mail, lien: "/contact", description: "Nous écrire" },
];

export function AppSidebar({ open, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAuthed(readAuthedFromStorage());
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    if (open) {
      document.addEventListener("keydown", onKey);
    }

    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!mounted) return;

    const sync = () => setAuthed(readAuthedFromStorage());

    window.addEventListener("storage", sync);
    window.addEventListener("gomatch-auth-changed", sync as EventListener);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("gomatch-auth-changed", sync as EventListener);
    };
  }, [mounted]);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // noop
    } finally {
      window.dispatchEvent(new Event("gomatch-auth-changed"));
      onClose();
      router.replace("/signin");
      router.refresh();
    }
  }

  const inviteFiltered = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return INVITE_LINKS;

    return INVITE_LINKS.filter((it) =>
      `${it.nom} ${it.description ?? ""}`.toLowerCase().includes(q)
    );
  }, [recherche]);

  const authSectionsFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return SECTIONS_AUTH;

    return SECTIONS_AUTH.map((s) => ({
      ...s,
      elements: s.elements.filter((it) =>
        `${it.nom} ${it.description ?? ""}`.toLowerCase().includes(q)
      ),
    })).filter((s) => s.elements.length > 0);
  }, [recherche]);

  if (!mounted) {
    return (
      <div
        className={`fixed inset-0 z-[140] transition-all duration-500 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        <aside
          className={`absolute left-0 top-0 h-screen w-[320px] border-r border-white/10 bg-[#0a0a0a] shadow-2xl transition-transform duration-500 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="absolute left-0 top-0 h-64 w-full bg-[#facc15]/5 blur-[120px] pointer-events-none" />

          <div className="relative flex h-full flex-col overflow-hidden">
            <div className="p-6">
              <div className="mb-8 flex items-center justify-between">
                <Link href="/" onClick={onClose} className="relative h-10 w-32">
                  <Image
                    src="/logoGoMatch2030.png"
                    alt="Logo"
                    fill
                    className="object-contain object-left"
                    priority
                  />
                </Link>

                <button
                  onClick={onClose}
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/40 transition-all hover:border-[#facc15] hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="relative group">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20 transition-colors group-focus-within:text-[#facc15]" />
                <input
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-xs text-white outline-none transition-all placeholder:text-white/20 focus:border-[#facc15]/50"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6 [scrollbar-width:none]">
              <div className="space-y-2">
                <div className="h-4 w-24 rounded bg-white/5" />
                <div className="space-y-1">
                  <div className="h-14 rounded-xl bg-white/5" />
                  <div className="h-14 rounded-xl bg-white/5" />
                  <div className="h-14 rounded-xl bg-white/5" />
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 bg-black/40 p-4">
              <p className="mt-2 text-center text-[9px] font-bold uppercase tracking-widest text-white/10">
                © GoMatch Maroc 2030
              </p>
            </div>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-[140] transition-all duration-500 ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      <aside
        className={`absolute left-0 top-0 h-screen w-[320px] border-r border-white/10 bg-[#0a0a0a] shadow-2xl transition-transform duration-500 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute left-0 top-0 h-64 w-full bg-[#facc15]/5 blur-[120px] pointer-events-none" />

        <div className="relative flex h-full flex-col overflow-hidden">
          <div className="p-6">
            <div className="mb-8 flex items-center justify-between">
              <Link href="/" onClick={onClose} className="relative h-10 w-32">
                <Image
                  src="/logoGoMatch2030.png"
                  alt="Logo"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </Link>

              <button
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/40 transition-all hover:border-[#facc15] hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20 transition-colors group-focus-within:text-[#facc15]" />
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher..."
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-xs text-white outline-none transition-all placeholder:text-white/20 focus:border-[#facc15]/50"
              />
            </div>

            {!authed && (
              <div className="mt-6 flex flex-col gap-2">
                {INVITE_ACTIONS.map((a) => (
                  <Link
                    key={a.href}
                    href={a.href}
                    onClick={onClose}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                      a.variant === "primary"
                        ? "bg-[#facc15] text-black shadow-lg shadow-[#facc15]/10 hover:scale-[1.02]"
                        : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    <a.icon size={14} />
                    {a.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6 [scrollbar-width:none]">
            {!authed ? (
              <div className="space-y-1">
                {inviteFiltered.map((item) => (
                  <SidebarLink
                    key={item.lien}
                    item={item}
                    actif={estActif(pathname, item.lien)}
                    onClick={onClose}
                  />
                ))}
              </div>
            ) : (
              authSectionsFiltrees.map((section) => (
                <div key={section.titre} className="space-y-2">
                  <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                    {section.titre}
                  </h3>

                  <div className="space-y-1">
                    {section.elements.map((item) => (
                      <SidebarLink
                        key={item.lien}
                        item={item}
                        actif={estActif(pathname, item.lien)}
                        onClick={onClose}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-white/5 bg-black/40 p-4">
            {authed && (
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#ef4444] transition-all hover:bg-[#ef4444]/5"
              >
                <LogOut size={16} />
                Quitter la session
              </button>
            )}

            <p className="mt-2 text-center text-[9px] font-bold uppercase tracking-widest text-white/10">
              © GoMatch Maroc 2030
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function SidebarLink({
  item,
  actif,
  onClick,
}: {
  item: ElementMenu;
  actif: boolean;
  onClick: () => void;
}) {
  const Icon = item.icone;

  return (
    <Link
      href={item.lien}
      onClick={onClick}
      className={`group flex items-center gap-4 rounded-xl border px-4 py-3 transition-all ${
        actif
          ? "border-[#facc15]/20 bg-[#facc15]/10 shadow-[0_0_20px_rgba(250,204,21,0.05)]"
          : "border-transparent hover:bg-white/5"
      }`}
    >
      <div
        className={`rounded-lg p-2 transition-colors ${
          actif
            ? "bg-[#facc15] text-black"
            : "bg-white/5 text-white/40 group-hover:text-white"
        }`}
      >
        <Icon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-black uppercase tracking-wider transition-colors ${
              actif
                ? "text-[#facc15]"
                : "text-white/60 group-hover:text-white"
            }`}
          >
            {item.nom}
          </span>

          {item.badge && (
            <span className="rounded-md bg-[#facc15] px-1.5 py-0.5 text-[8px] font-black text-black">
              {item.badge}
            </span>
          )}
        </div>

        <p className="truncate text-[10px] text-white/20">{item.description}</p>
      </div>

      {actif && (
        <div className="h-1.5 w-1.5 rounded-full bg-[#facc15] shadow-[0_0_10px_#facc15]" />
      )}
    </Link>
  );
}