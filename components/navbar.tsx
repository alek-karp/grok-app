import { ModeToggle } from "@/components/mode-toggle"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="relative flex h-14 items-center px-4">
        <div className="absolute left-1/2 -translate-x-1/2 font-semibold tracking-tight">
          Grok App
        </div>
        <div className="ml-auto">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
