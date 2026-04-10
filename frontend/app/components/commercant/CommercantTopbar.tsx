"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, UserCircle2, ShoppingBag } from "lucide-react";

function getPageTitle(pathname: string): { title: string; subtitle: string } {
  if (pathname === "/commercant") return { title: "Mon commerce", subtitle: "Vue d'ensemble de votre activité" };
  if (pathname.startsWith("/commercant/create-commerce")) return { title: "Créer mon commerce", subtitle: "Enregistrez votre commerce sur GoMatch" };
  if (pathname.startsWith("/commercant/edit")) return { title: "Modifier le commerce", subtitle: "Mettez à jour vos informations" };
  if (pathname.startsWith("/commercant/horaires")) return { title: "Horaires", subtitle: "Gérez vos horaires d'ouverture" };
  if (pathname.startsWith("/commercant/profile")) return { title: "Mon profil", subtitle: "Informations de votre compte commerçant" };
  return { title: "Espace commerçant", subtitle: "Gérez votre présence sur GoMatch" };
}

export default function CommercantTopbar() {
  const pathname = usePathname();
  const { title, subtitle } = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#04060b]/90 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6 lg:px-8">
        {/* Titre dynamique */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/30 to-orange-500/10">
            <ShoppingBag className="h-4 w-4 text-orange-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">{title}</h1>
            <p className="text-[11px] text-zinc-500">{subtitle}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>

          <Link
            href="/commercant/profile"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Profil"
          >
            <UserCircle2 className="h-4 w-4" />
          </Link>

          <div className="ml-1 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
            Commerçant
          </div>
        </div>
      </div>
    </header>
  );
}
