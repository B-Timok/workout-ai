"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/utils/supabase/client";
import { User } from "@supabase/supabase-js";

export default function NavigationHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const supabase = createClient();

  // Check if the link is the current page
  const isActivePath = (path: string) => {
    return pathname === path;
  };

  useEffect(() => {
    // Get current authentication state
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }

    getUser();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={user ? "/" : "/login"} className="font-bold">
              Workout Assistant
            </Link>
            
            <nav className="flex items-center space-x-4">
              {/* Only show these links if the user is logged in */}
              {!loading && user && (
                <>
                  <Link 
                    href="/" 
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActivePath("/") ? "text-primary" : ""
                    }`}
                  >
                    Home
                  </Link>
                  <Link 
                    href="/dashboard" 
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActivePath("/dashboard") ? "text-primary" : ""
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/profile" 
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActivePath("/profile") ? "text-primary" : ""
                    }`}
                  >
                    Profile
                  </Link>
                </>
              )}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Show different auth options based on logged in state */}
            {loading ? (
              <span className="text-sm text-muted-foreground">Loading...</span>
            ) : user ? (
              <form action="/auth/signout" method="post">
                <button type="submit" className="text-sm font-medium transition-colors hover:text-destructive">
                  Sign Out
                </button>
              </form>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActivePath("/login") ? "text-primary" : ""
                  }`}
                >
                  Sign In
                </Link>
                <Link 
                  href="/signup" 
                  className={`text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 ${
                    isActivePath("/signup") ? "bg-primary/90" : ""
                  }`}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
