"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Dumbbell, Menu } from "lucide-react"
import React, { useState } from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function HomeHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Desktop Header */}
      <div className="hidden md:block relative w-full h-14">
        {/* Logo - Left */}
        <div className="absolute left-4 top-0 h-full flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="font-bold">Athlos</span>
          </Link>
        </div>

        {/* Navigation - Center */}
        <div className="flex justify-center items-center h-full">
          <nav className="flex items-center space-x-6">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#testimonials"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Testimonials
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#about"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
          </nav>
        </div>

        {/* Auth & Theme - Right */}
        <div className="absolute right-4 top-0 h-full flex items-center space-x-4">
          <ModeToggle />
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="flex md:hidden items-center justify-between h-14 px-4">
        {/* Left side - Theme Toggle */}
        <Dumbbell className="h-6 w-6 text-primary" />

        {/* Center - Title */}
        <span className="font-bold absolute left-1/2 transform -translate-x-1/2">Athlos</span>

        {/* Right side - Menu Button or Sign In */}
        <div className="flex items-center space-x-1">
          <ModeToggle />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col space-y-4 mt-8">
                <Link
                  href="#features"
                  className="text-sm font-medium px-2 py-2 hover:bg-accent hover:text-accent-foreground rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  href="#testimonials"
                  className="text-sm font-medium px-2 py-2 hover:bg-accent hover:text-accent-foreground rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Testimonials
                </Link>
                <Link
                  href="#pricing"
                  className="text-sm font-medium px-2 py-2 hover:bg-accent hover:text-accent-foreground rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  href="#about"
                  className="text-sm font-medium px-2 py-2 hover:bg-accent hover:text-accent-foreground rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                <div className="border-t pt-4 mt-2">
                  <div className="flex flex-col space-y-2">
                    <Button variant="outline" asChild className="justify-center">
                      <Link href="/login">Sign In</Link>
                    </Button>
                    <Button asChild className="justify-center">
                      <Link href="/signup">Get Started Free</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

