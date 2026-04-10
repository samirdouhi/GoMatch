"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Store,
  Building2,
  Tags,
  Users,
  BarChart3,
  Shield,
  UserCircle2,
  LogOut,
  AlertCircle,
} from "lucide-react";
import { getMyAdminProfileStatus } from "@/lib/adminProfileApi";
import { logoutRequest } from "@/lib/authApi";

const menuItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Demandes commerçants",
    href: "/admin/commercants",
    icon: Store,
  },
  {
    label: "Commerces",
    href: "/admin/commerces",
    icon: Building2,
  },
  {
    label: "Catégories",
    href: "/admin/categories",
    icon: Tags,
  },
  {
    label: "Tags culturels",
    href: "/admin/tagsculturels",
    icon: Tags,
  },
  {
    label: "Utilisateurs",
    href: "/admin/utilisateurs",
    icon: Users,
  },
  {
    label: "Statistiques",
    href: "/admin/statistiques",
    icon: BarChart3,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [profileIncomplete, setProfileIncomplete] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadProfileStatus() {
      try {
        const status = await getMyAdminProfileStatus();
        if (!mounted) return;

        setProfileIncomplete(!status.isComplete);
      } catch {
        if (!mounted) return;

        setProfileIncomplete(true);
      }
    }

    function handleStatusChanged() {
      void loadProfileStatus();
    }

    void loadProfileStatus();

    window.addEventListener(
      "admin-profile-status-changed",
      handleStatusChanged
    );

    return () => {
      mounted = false;
      window.removeEventListener(
        "admin-profile-status-changed",
        handleStatusChanged
      );
    };
  }, []);

  const handleLogout = async () => {
    await logoutRequest();
  };

  return (
    <aside className="hidden h-full w-72 shrink-0 border-r border-white/10 bg-[#05070c] text-white lg:flex lg:flex-col">
      <div className="border-b border-white/10 px-6 py-6">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-2">
          <Shield className="h-4 w-4 text-amber-400" />
          <span className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-400">
            Admin Panel
          </span>
        </div>

        <h2 className="mt-4 text-xl font-black tracking-tight">GOMATCH</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Espace d’administration sécurisé
        </p>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

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

      <div className="space-y-3 border-t border-white/10 p-4">
        <Link
          href="/admin/profile"
          className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            pathname === "/admin/profile" ||
            pathname.startsWith("/admin/profile/")
              ? "bg-white text-slate-950"
              : "text-zinc-300 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          <span className="flex items-center gap-3">
            <UserCircle2 className="h-4 w-4" />
            <span>Profil</span>
          </span>

          {profileIncomplete && (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-red-300">
              <AlertCircle className="h-3 w-3" />
              Alerte
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}