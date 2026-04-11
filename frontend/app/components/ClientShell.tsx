"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./AppSideBar";
import { TopBar } from "./TopBar";

const LOCALES = ["fr", "en", "ar"] as const;
type Locale = (typeof LOCALES)[number];

function isLocale(x: string): x is Locale {
  return (LOCALES as readonly string[]).includes(x);
}

function stripTrailingSlash(p: string) {
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

function normalizePath(pathname: string) {
  let p = pathname || "/";
  p = p.split("?")[0].split("#")[0];
  p = stripTrailingSlash(p);

  const parts = p.split("/").filter(Boolean);
  if (parts.length > 0 && isLocale(parts[0])) {
    p = "/" + parts.slice(1).join("/");
    p = stripTrailingSlash(p);
  }

  return p || "/";
}

const AUTH_REGEX = /(^|\/)(signin|login|register|forgot-password)(\/|$)/i;
const NO_SCROLL_REGEX = /(^|\/)(signin|login|register|onboarding)(\/|$)/i;

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const rawPathname = usePathname() ?? "";
  const pathname = useMemo(() => normalizePath(rawPathname), [rawPathname]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAuthPage = useMemo(() => AUTH_REGEX.test(pathname), [pathname]);
  const noScrollPage = useMemo(() => NO_SCROLL_REGEX.test(pathname), [pathname]);

  const isAssistant = useMemo(() => {
    return pathname === "/assistant" || pathname.startsWith("/assistant/");
  }, [pathname]);

  const isOnboarding = useMemo(() => {
    return pathname === "/onboarding" || pathname.startsWith("/onboarding/");
  }, [pathname]);

  const isAdminRoute = useMemo(() => {
    return pathname === "/admin" || pathname.startsWith("/admin/");
  }, [pathname]);

  const isCommercantRoute = useMemo(() => {
    return pathname === "/commercant" || pathname.startsWith("/commercant/");
  }, [pathname]);

  useEffect(() => {
    if (!isOnboarding) return;

    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [isOnboarding]);

  const shellKey = rawPathname;

  if (isAuthPage) {
    return (
      <div key={shellKey} className="min-h-screen text-foreground bg-transparent">
        <main className="min-h-screen overflow-hidden bg-transparent">
          {children}
        </main>
      </div>
    );
  }

  if (isOnboarding) {
    return (
      <div key={shellKey} className="h-screen overflow-hidden text-foreground bg-transparent">
        <main className="h-full overflow-hidden bg-transparent">
          {children}
        </main>
      </div>
    );
  }

  if (isAdminRoute || isCommercantRoute) {
    return <>{children}</>;
  }

  return (
    <div key={shellKey} className="flex h-screen flex-col text-foreground bg-transparent">
      <TopBar
        sidebarCollapsed={!sidebarOpen}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main
        className={[
          "flex-1 min-h-0 overscroll-contain",
          isAssistant ? "overflow-hidden p-0" : noScrollPage ? "overflow-hidden" : "overflow-y-auto",
          isAssistant ? "" : "pb-24 lg:pb-0",
          "bg-transparent",
        ].join(" ")}
      >
        {children}
      </main>
    </div>
  );
}
