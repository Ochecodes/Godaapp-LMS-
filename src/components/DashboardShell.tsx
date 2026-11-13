"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  DashboardIdentityContext,
  type DashboardProfileMetadata,
} from "@/components/DashboardIdentity";
import { DashboardIcon } from "@/components/DashboardIcon";

type DashboardShellProps = {
  children: ReactNode;
  fullName: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  emailVerified: boolean;
  profileMetadata: DashboardProfileMetadata;
};

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: "lucide:layout-dashboard" },
  { href: "/dashboard/courses", label: "My Courses", icon: "lucide:book-open" },
  { href: "/dashboard/live", label: "Live Classes", icon: "lucide:video" },
  { href: "/dashboard/resources", label: "Resources", icon: "lucide:files" },
  { href: "/dashboard/community", label: "Community", icon: "lucide:users-round" },
  { href: "/dashboard/support", label: "Support", icon: "lucide:headset" },
  { href: "/dashboard/profile", label: "Profile", icon: "lucide:user-round" },
  { href: "/dashboard/settings", label: "Settings", icon: "lucide:settings-2" },
];

export function DashboardShell({
  children,
  fullName,
  email,
  avatarUrl,
  createdAt,
  emailVerified,
  profileMetadata,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarPreferenceLoaded, setSidebarPreferenceLoaded] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSidebarCollapsed(localStorage.getItem("godaapp-dashboard-sidebar") === "collapsed");
    setSidebarPreferenceLoaded(true);
  }, []);

  useEffect(() => {
    if (sidebarPreferenceLoaded) {
      localStorage.setItem("godaapp-dashboard-sidebar", sidebarCollapsed ? "collapsed" : "expanded");
    }
  }, [sidebarCollapsed, sidebarPreferenceLoaded]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  const sidebar = (isMobile = false) => {
    const isCollapsed = !isMobile && sidebarCollapsed;
    return (
      <aside className={`flex h-full min-h-0 flex-col border-r border-zinc-700 bg-zinc-900 text-white transition-[width] duration-200 ${isCollapsed ? "w-16" : "w-64"}`}>
        <Link aria-label="GodaApp dashboard" className={`flex h-16 items-center gap-3 border-b border-zinc-700 ${isCollapsed ? "justify-center px-2" : "px-5"}`} href="/dashboard" title={isCollapsed ? "GodaApp dashboard" : undefined}>
          <Image alt="GodaApp" className="h-9 w-9 rounded-md object-contain" height={36} src="/logotrans.png" width={36} />
          {!isCollapsed && <span className="font-semibold tracking-tight">GodaApp <span className="text-zinc-400">learn</span></span>}
        </Link>
        <nav aria-label="Student dashboard" className={`flex-1 space-y-1 overflow-y-auto ${isCollapsed ? "p-2" : "p-3"}`}>
          {navigation.map(({ href, label, icon }) => {
            const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className={`flex min-h-10 items-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#068365] ${
                  isCollapsed ? "justify-center px-2" : "gap-3 px-3"
                } ${
                  active ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                }`}
                href={href}
                key={href}
                onFocus={() => router.prefetch(href)}
                onPointerEnter={() => router.prefetch(href)}
                prefetch={false}
                title={isCollapsed ? label : undefined}
              >
                <DashboardIcon aria-hidden="true" className="size-4 shrink-0" icon={icon} />
                {!isCollapsed && label}
              </Link>
            );
          })}
        </nav>
        <div className={`relative border-t border-zinc-700 ${isCollapsed ? "p-2" : "p-3"}`} ref={profileRef}>
          {profileOpen && (
            <div className={`absolute bottom-[calc(100%+0.5rem)] rounded-xl border border-zinc-700 bg-zinc-800 p-1.5 text-white shadow-lg ${isCollapsed ? "left-14 w-52" : "left-3 right-3"}`}>
              <Link
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#068365]"
                href="/dashboard/settings"
                onClick={() => setProfileOpen(false)}
              >
                <DashboardIcon aria-hidden="true" className="size-4 text-zinc-400" icon="lucide:user-round-cog" />
                Edit profile settings
              </Link>
              <Link
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#068365]"
                href="/dashboard/sign-out"
                onClick={() => setProfileOpen(false)}
              >
                <DashboardIcon aria-hidden="true" className="size-4 text-zinc-400" icon="lucide:log-out" />
                Sign out
              </Link>
            </div>
          )}
          <button
            aria-label="Open account menu"
            aria-expanded={profileOpen}
            className={`flex min-h-12 w-full items-center rounded-lg text-left hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#068365] ${isCollapsed ? "justify-center px-1" : "gap-3 px-2"}`}
            onClick={() => setProfileOpen((open) => !open)}
            title={isCollapsed ? fullName : undefined}
            type="button"
          >
            <Avatar avatarUrl={avatarUrl} />
            {!isCollapsed && <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{fullName}</span>
              <span className="block truncate text-xs text-zinc-400">{email}</span>
            </span>}
            {!isCollapsed && <DashboardIcon aria-hidden="true" className={`size-4 shrink-0 text-zinc-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} icon="lucide:chevron-down" />}
          </button>
        </div>
      </aside>
    );
  };

  return (
    <DashboardIdentityContext.Provider
      value={{ fullName, email, avatarUrl, createdAt, emailVerified, profileMetadata }}
    >
      <div className="min-h-screen bg-background text-foreground">
        <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">{sidebar()}</div>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              aria-label="Close dashboard menu"
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
              type="button"
            />
            <div className="relative h-full w-64 max-w-[85vw]">{sidebar(true)}</div>
          </div>
        )}
        <div className={`min-h-screen transition-[padding] duration-200 ${sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"}`}>
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
            <div className="flex items-center gap-3">
              <button
                aria-label={sidebarCollapsed ? "Expand dashboard sidebar" : "Collapse dashboard sidebar"}
                className="hidden size-9 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:inline-flex"
                onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                type="button"
              >
                <DashboardIcon aria-hidden="true" className="size-5" icon={sidebarCollapsed ? "lucide:panel-left-open" : "lucide:panel-left-close"} />
              </button>
              <button
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
                onClick={() => setMobileOpen((open) => !open)}
                type="button"
              >
                <DashboardIcon aria-hidden="true" className="size-5" icon={mobileOpen ? "lucide:x" : "lucide:menu"} />
              </button>
              <p className="text-sm font-medium text-muted-foreground">Student dashboard</p>
            </div>
            <ThemeSwitch />
          </header>
          <div className="min-h-[calc(100vh-4rem)]">{children}</div>
        </div>
      </div>
    </DashboardIdentityContext.Provider>
  );
}

function Avatar({ avatarUrl }: { avatarUrl?: string }) {
  if (avatarUrl) {
    return (
      <Image
        alt=""
        className="size-9 shrink-0 rounded-full border border-border object-cover"
        height={36}
        src={avatarUrl}
        unoptimized
        width={36}
      />
    );
  }
  return (
    <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
      <DashboardIcon aria-hidden="true" className="size-5" icon="lucide:user-round" />
    </span>
  );
}

function ThemeSwitch() {
  const [mode, setMode] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    const stored = localStorage.getItem("godaapp-dashboard-theme");
    if (stored === "light" || stored === "dark" || stored === "system") setMode(stored);
  }, []);

  function cycleMode() {
    const next = mode === "system" ? "dark" : mode === "dark" ? "light" : "system";
    setMode(next);
    localStorage.setItem("godaapp-dashboard-theme", next);
    const dark = next === "dark" || (next === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  }

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const activeMode = localStorage.getItem("godaapp-dashboard-theme") ?? "system";
      document.documentElement.classList.toggle("dark", activeMode === "dark" || (activeMode === "system" && media.matches));
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  const label = mode === "system" ? "system theme" : `${mode} theme`;
  return (
    <button
      aria-label={`Theme: ${label}. Click to change.`}
      className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={cycleMode}
      title={`Theme: ${label}`}
      type="button"
    >
      <DashboardIcon aria-hidden="true" className="size-4" icon={mode === "dark" ? "lucide:moon" : "lucide:sun"} />
    </button>
  );
}
