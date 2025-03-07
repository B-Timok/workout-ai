import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import type { Metadata, Viewport } from 'next'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Workout Assistant",
  description: "Generate personalized workout routines with AI",
  generator: 'v0.dev',
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Workout AI",
    statusBarStyle: "black-translucent",
    capable: true,
  },
}

export const viewport: Viewport = {
  themeColor: "#10b981",
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
      <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Workout AI" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}