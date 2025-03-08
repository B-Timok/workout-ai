import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import type { Metadata, Viewport } from 'next'
import { Toaster } from "@/components/ui/toaster"
import ClientWrapper from "@/components/client-wrapper"
// PWA functionality disabled
// import { PWARegister } from "./pwa-register"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Workout Assistant",
  description: "Generate personalized workout routines with AI",
  generator: 'v0.dev',
  // PWA functionality disabled
  // manifest: "/manifest.json",
  // appleWebApp: {
  //   title: "Workout AI",
  //   statusBarStyle: "black-translucent",
  //   capable: true,
  // },
}

export const viewport: Viewport = {
  // themeColor: "#23c65a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA functionality disabled
        <link rel="apple-touch-icon" href="/icons/apple-icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#10b981" />
        */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ClientWrapper>
            {children}
          </ClientWrapper>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}