"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Clock,
  LogOut,
  ShoppingBag,
} from "lucide-react";
import { logoutRequest } from "@/lib/authApi";

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
    icon: Store,
    exact: false,
  },
  {
    label: "Horaires",
    href: "/commercant/horaires",
    icon: Clock,
    exact: false,
  },
];

export default function CommercantSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await logoutRequest();
  };

  return (
    <aside className="hidden h-full w-72 shrink-0 border-r border-white/10 bg-[#05070c] text-white lg:flex lg:flex-col">
      <div className="border-b border-white/10 px-6 py-6">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-2">
          <ShoppingBag className="h-4 w-4 text-orange-400" />
          <span className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-400">
            Espace Commerçant
          </span>
        </div>

        <h2 className="mt-4 text-xl font-black tracking-tight">GOMATCH</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Gérez votre présence sur la plateforme
        </p>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-white text-slate-950"
                  : "text-zinc-300 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
        >
          <LogOut className="h-4 w-4" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
