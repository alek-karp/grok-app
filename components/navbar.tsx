"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PhoneCallIcon } from "lucide-react"

const NAV_TABS = [
  { label: "Agent", href: "/agent" },
  { label: "Dashboard", href: "/dashboard" },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  const startCall = () => {
    const id = crypto.randomUUID()
    router.push(`/call/${id}`)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="flex h-14 items-center px-4">
        <div className="font-semibold tracking-tight">Grok App</div>
        <div className="absolute left-1/2 -translate-x-1/2">
          <Tabs value={pathname}>
            <TabsList>
              {NAV_TABS.map(({ label, href }) => (
                <TabsTrigger key={href} value={href} asChild>
                  <Link href={href}>{label}</Link>
                </TabsTrigger>
              ))}
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
