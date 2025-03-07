"use client"

import { Button } from "@/components/ui/button"
import { Dumbbell, WifiOff } from "lucide-react"
import Link from "next/link"

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <WifiOff className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-3xl font-bold mb-2">You're offline</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        It looks like you're not connected to the internet. Some features may not be available until you reconnect.
      </p>
      <div className="flex flex-col gap-2">
        <Button asChild>
          <Link href="/">
            <Dumbbell className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Link>
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    </div>
  )
}
