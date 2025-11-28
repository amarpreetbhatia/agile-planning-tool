import Link from "next/link"
import { auth } from "@/lib/auth"
import { UserNav } from "@/components/auth/user-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"

export async function Header() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">
              Agile Planning Tool
            </span>
            <span className="font-bold sm:hidden">
              Planning
            </span>
          </Link>
          
          {session?.user && (
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link
                href="/"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Projects
              </Link>
              <Link
                href="/sessions/new"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                New Session
              </Link>
              <Link
                href="/history"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                History
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session?.user ? (
            <UserNav user={session.user} />
          ) : (
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
