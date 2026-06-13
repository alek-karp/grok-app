"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const NAV_TABS = [
  { label: "Agent", href: "/agent" },
  { label: "Dashboard", href: "/dashboard" },
]

export function Navbar() {
  const pathname = usePathname()

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
        <div className="ml-auto">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
