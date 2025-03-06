"use client"

import type React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { Dumbbell, Home, Settings, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      <Sidebar>
        <SidebarHeader className="flex items-center px-4 py-2">
          <h1 className="text-xl font-bold">Workout AI</h1>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/"}>
                <Link href="/">
                  <Home className="mr-2" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/workouts"}>
                <Link href="/workouts">
                  <Dumbbell className="mr-2" />
                  <span>My Workouts</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/profile"}>
                <Link href="/profile">
                  <User className="mr-2" />
                  <span>Profile</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/settings"}>
                <Link href="/settings">
                  <Settings className="mr-2" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">v1.0.0</span>
            <ModeToggle />
          </div>
        </SidebarFooter>
      </Sidebar>
      <div className="flex-1 flex flex-col">
        <header className="border-b h-14 flex items-center px-4">
          <SidebarTrigger className="mr-4" />
          <div className="flex-1" />
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

