"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Clock,
  LogOut,
  ShoppingBag,
  UserCircle2,
  ArrowLeft,
  PlusCircle,
  Camera,
} from "lucide-react";
import { logout } from "@/lib/logout";

const menuItems = [
  {
    label: "Mon commerce",
    href: "/commercant",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Créer mon commerce",
    href: "/commercant/create-commerce",
    icon: PlusCircle,
    exact: false,
  },
  {
    label: "Horaires",
    href: "/commercant/horaires",
    icon: Clock,
    exact: false,
  },
  {
    label: "Mon profil",
    href: "/commercant/profile",
    icon: UserCircle2,
    exact: false,
  },
];

function useIsActive(href: string, exact: boolean) {
  const pathname = usePathname();
  return exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");
}

// ── Sidebar desktop (lg+) ─────────────────────────────────────────────────────

export default function CommercantSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
  };

  function isActive(href: string, exact: boolean) {
    return exact
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* ── Sidebar desktop ── */}
      <aside className="hidden h-full w-72 shrink-0 border-r border-white/[0.07] bg-[#04060b] text-white lg:flex lg:flex-col">
        {/* En-tête */}
        <div className="border-b border-white/[0.07] px-6 py-6">
          <div className="inline-flex items-center gap-2.5 rounded-2xl border border-orange-500/25 bg-orange-500/10 px-4 py-2">
            <ShoppingBag className="h-4 w-4 text-orange-400" />
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-400">
              Espace Commerçant
            </span>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">GOMATCH</h2>
              <p className="text-xs text-zinc-500">Gérez votre commerce</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
            Navigation
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                  active
                    ? "bg-gradient-to-r from-orange-500/20 to-orange-500/5 text-orange-300 ring-1 ring-orange-500/30"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-orange-400" : ""}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="my-4 h-px bg-white/[0.06]" />

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Espace touriste</span>
          </button>
        </nav>

        {/* Bas */}
        <div className="border-t border-white/[0.07] p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-red-400/80 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ── Bottom bar mobile (< lg) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center border-t border-white/[0.07] bg-[#04060b]/95 backdrop-blur-md lg:hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors ${
                active ? "text-orange-400" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}

        {/* Déconnexion */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-semibold text-zinc-500 transition-colors hover:text-red-400"
        >
          <LogOut className="h-5 w-5" />
          <span>Sortir</span>
        </button>
      </nav>
    </>
  );
}
