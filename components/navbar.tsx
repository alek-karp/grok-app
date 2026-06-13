"use client"

import { useRouter } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { PhoneCallIcon } from "lucide-react"
import { ROUTES } from "@/lib/routes"

export function Navbar() {
  const router = useRouter()

  const startCall = () => {
    router.push(ROUTES.call(crypto.randomUUID()))
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="flex h-14 items-center px-4">
        <div className="font-semibold tracking-tight">Grok App</div>
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={startCall} size="sm" variant="default" className="gap-1.5">
            <PhoneCallIcon className="size-3.5" />
            Call
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
