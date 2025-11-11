"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface DesktopLayoutProps {
  children: ReactNode
  className?: string
}

export function DesktopLayout({ children, className }: DesktopLayoutProps) {
  return (
    <div
      className={cn(
        "hidden min-h-screen flex-col lg:flex",
        className
      )}
    >
      {children}
    </div>
  )
}

interface DesktopHeaderProps {
  children: ReactNode
  className?: string
}

export function DesktopHeader({ children, className }: DesktopHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="flex h-16 items-center px-8">{children}</div>
    </header>
  )
}

interface DesktopContentProps {
  children: ReactNode
  className?: string
}

export function DesktopContent({ children, className }: DesktopContentProps) {
  return (
    <main className={cn("flex flex-1 overflow-hidden", className)}>
      {children}
    </main>
  )
}

interface DesktopSidebarProps {
  children: ReactNode
  className?: string
  side?: "left" | "right"
}

export function DesktopSidebar({
  children,
  className,
  side = "left",
}: DesktopSidebarProps) {
  return (
    <aside
      className={cn(
        "w-72 border-r bg-muted/40 overflow-auto",
        side === "right" && "border-l border-r-0",
        className
      )}
    >
      {children}
    </aside>
  )
}

interface DesktopMainProps {
  children: ReactNode
  className?: string
}

export function DesktopMain({ children, className }: DesktopMainProps) {
  return (
    <div className={cn("flex-1 overflow-auto p-8", className)}>{children}</div>
  )
}

interface DesktopPanelProps {
  children: ReactNode
  className?: string
}

export function DesktopPanel({ children, className }: DesktopPanelProps) {
  return (
    <aside
      className={cn(
        "w-80 border-l bg-muted/40 overflow-auto p-6",
        className
      )}
    >
      {children}
    </aside>
  )
}
