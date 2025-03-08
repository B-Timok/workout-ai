"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/utils/supabase/client"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { LayoutDashboard, User2, Menu, Dumbbell, LogOut, ChevronDown, HomeIcon } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getAvatarEmoji } from "@/lib/utils/avatar"

export default function NavigationHeader() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [avatarId, setAvatarId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  const isActivePath = (path: string) => pathname === path

  const navigationItems = [
    { href: "/home-coming-soon", label: "Home", icon: HomeIcon },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/profile", label: "Profile", icon: User2 },
  ]

  useEffect(() => {
    const fetchProfile = async (user: User | null) => {
      // Skip if not authenticated
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) console.error('Error fetching profile:', error);
        else setProfile(data);
      } catch (err) {
        console.error('Error:', err);
      }
    }
    
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          setUser(user)
          setIsLoggedIn(true)

          // Get profile data including avatar_id and username
          await fetchProfile(user)

          const { data: profile } = await supabase
            .from("profiles")
            .select("avatar_id, username, full_name")
            .eq("id", user.id)
            .single()

          if (profile) {
            setAvatarId(profile.avatar_id || null)
            // Use username if available, otherwise full_name, otherwise email
            setUserName(profile.username || profile.full_name || user.email?.split("@")[0] || "User")
          } else {
            // Fallback to email if no profile
            setUserName(user.email?.split("@")[0] || "User")
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: string, session: any) => {
        // Update auth state when it changes
        console.log('Auth state changed in NavHeader', event, session?.user?.id);
        setIsLoggedIn(!!session);
        setUser(session?.user || null);
        
        // If user just logged in, fetch their profile
        if (event === 'SIGNED_IN') {
          fetchProfile(session?.user);
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Desktop Header */}
      <div className="hidden md:block relative w-full h-14">
        {/* Logo and brand - far left */}
        <div className="absolute left-4 top-0 h-full flex items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="font-bold">Workout Assistant</span>
          </Link>
        </div>

        {/* Navigation - centered */}
        <div className="flex justify-center items-center h-full">
          {!loading && user && (
            <nav className="flex items-center space-x-6">
              {navigationItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                    isActivePath(href) ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* User Menu - far right */}
        <div className="absolute right-4 top-0 h-full flex items-center">
          {loading ? (
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-20" />
            </div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8 border border-border">
                    <div className="h-full w-full flex items-center justify-center bg-secondary">
                      {avatarId ? (
                        <span className="text-lg">{getAvatarEmoji(avatarId)}</span>
                      ) : (
                        <AvatarFallback>{userName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                      )}
                    </div>
                  </Avatar>
                  <span className="text-sm font-medium">{userName}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User2 className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action="/auth/signout" method="post" className="w-full">
                    <button type="submit" className="flex items-center w-full">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="flex md:hidden items-center justify-between h-14 px-4">
        <Link href="/dashboard" className="flex items-center">
          <Dumbbell className="h-6 w-6 text-primary" />
        </Link>

        {/* Mobile centered title */}
        <span className="font-bold absolute left-1/2 transform -translate-x-1/2">Workout Assistant</span>

        {/* Mobile Menu Button */}
        {user && (
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 pt-safe">
              {/* User info in mobile menu */}
              <div className="flex items-center space-x-3 mb-6 mt-2">
                <Avatar className="h-10 w-10 border border-border">
                  <div className="h-full w-full flex items-center justify-center bg-secondary">
                    {avatarId ? (
                      <span className="text-2xl">{getAvatarEmoji(avatarId)}</span>
                    ) : (
                      <AvatarFallback>{userName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    )}
                  </div>
                </Avatar>
                <div>
                  <p className="font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="flex flex-col space-y-4">
                {navigationItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                      isActivePath(href) ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Link>
                ))}
                <div className="border-t pt-4 mt-2">
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </form>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}

        {!user && !loading && (
          <Button variant="ghost" asChild size="sm">
            <Link href="/login">Sign In</Link>
          </Button>
        )}
      </div>
    </header>
  )
}
