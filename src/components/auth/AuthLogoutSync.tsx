"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CHANNEL_NAME = "godaapp-auth";
const SIGNED_OUT_EVENT = "signed-out";
const SIGN_IN_PATHS = new Set(["/sign-in", "/affiliate/sign-in"]);

export function broadcastAuthSignOut(userId: string, redirectTo: string) {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage({ type: SIGNED_OUT_EVENT, userId, redirectTo });
  channel.close();
}

export function AuthLogoutSync() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (SIGN_IN_PATHS.has(pathname)) return;
    if (typeof BroadcastChannel === "undefined") return;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return;
    }
    let currentUserId: string | null = null;
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user.id) currentUserId = session.user.id;
    });

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = async (event: MessageEvent<unknown>) => {
      if (
        typeof event.data !== "object" ||
        event.data === null ||
        !("type" in event.data) ||
        event.data.type !== SIGNED_OUT_EVENT ||
        !("userId" in event.data) ||
        typeof event.data.userId !== "string" ||
        event.data.userId !== currentUserId ||
        !("redirectTo" in event.data) ||
        typeof event.data.redirectTo !== "string" ||
        !SIGN_IN_PATHS.has(event.data.redirectTo)
      ) {
        return;
      }

      try {
        const { error } = await supabase.auth.signOut({ scope: "local" });
        if (error) {
          console.error("[Auth sync] Could not sign out this tab:", error);
          return;
        }
      } catch (error) {
        console.error("[Auth sync] Could not sign out this tab:", error);
        return;
      }
      currentUserId = null;
      const destination = pathname.startsWith("/affiliate")
        ? "/affiliate/sign-in"
        : "/sign-in";
      router.replace(destination);
      router.refresh();
    };

    return () => {
      subscription.unsubscribe();
      channel.close();
    };
  }, [pathname, router]);

  return null;
}
