"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/utils/supabase/client";

/**
 * This component is used for debugging authentication state
 * It monitors session status and logs changes
 */
export default function AuthDebugger() {
  // Use a ref to track initialization and prevent duplicate logs
  const initialized = useRef(false);

  useEffect(() => {
    // Only run once
    if (initialized.current) return;
    initialized.current = true;

    const supabase = createClient();
    
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log("🔄 Session on page load:", session ? "authenticated" : "no session", error);
      if (session) {
        console.log("👤 User ID:", session.user.id);
        if (session.expires_at) {
          console.log("⏱️ Session expires at:", new Date(session.expires_at * 1000).toLocaleString());
        }
        // Check if token is expired based on current time vs expiry time
        const isExpired = session.expires_at ? Date.now() > session.expires_at * 1000 : false;
        console.log("🔑 Token valid:", !isExpired);
      }
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      // Don't log INITIAL_SESSION events to reduce noise
      if (event === 'INITIAL_SESSION') return;
      
      console.log("🔄 Auth state changed:", event, session ? "authenticated" : "no session");
      if (session) {
        console.log("👤 User ID:", session.user.id);
        if (session.expires_at) {
          console.log("⏱️ Session expires at:", new Date(session.expires_at * 1000).toLocaleString());
        }
      }
    });

    // Also add a visibility change listener to track tab switching
    const handleVisibilityChange = () => {
      console.log("📱 Visibility changed:", document.visibilityState);
      if (document.visibilityState === "visible") {
        console.log("🔄 Tab is now active, checking session...");
        checkSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      listener?.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
