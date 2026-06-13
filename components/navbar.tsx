"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PhoneCallIcon, CircleDotDashed, LayoutDashboard, SlidersHorizontal } from "lucide-react"
import { ROUTES } from "@/lib/routes"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  const startCall = () => {
    router.push(ROUTES.call(crypto.randomUUID()))
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="flex h-14 items-center px-4">
        <div className="flex items-center gap-1.5 font-semibold tracking-tight">
          <CircleDotDashed className="size-5" style={{ animation: "memento-spin 10s ease-in-out infinite" }} />
          Memento
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 hidden sm:block">
          <Tabs value={pathname}>
            <TabsList>
              <TabsTrigger value={ROUTES.dashboard} asChild>
                <Link href={ROUTES.dashboard} className="flex items-center gap-1.5">
                  <LayoutDashboard className="size-3.5" />
                  Dashboard
                </Link>
              </TabsTrigger>
              <TabsTrigger value={ROUTES.personalization} asChild>
                <Link href={ROUTES.personalization} className="flex items-center gap-1.5">
                  <SlidersHorizontal className="size-3.5" />
                  Personalization
                </Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
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
