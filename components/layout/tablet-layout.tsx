"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface TabletLayoutProps {
  children: ReactNode
  className?: string
}

export function TabletLayout({ children, className }: TabletLayoutProps) {
  return (
    <div
      className={cn(
        "hidden min-h-screen flex-col sm:flex lg:hidden",
        className
      )}
    >
      {children}
    </div>
  )
}

interface TabletHeaderProps {
  children: ReactNode
  className?: string
}

export function TabletHeader({ children, className }: TabletHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="flex h-16 items-center px-6">{children}</div>
    </header>
  )
}

interface TabletContentProps {
  children: ReactNode
  className?: string
}

export function TabletContent({ children, className }: TabletContentProps) {
  return (
    <main className={cn("flex flex-1 overflow-hidden", className)}>
      {children}
    </main>
  )
}

interface TabletSidebarProps {
  children: ReactNode
  className?: string
  side?: "left" | "right"
}

export function TabletSidebar({
  children,
  className,
  side = "left",
}: TabletSidebarProps) {
  return (
    <aside
      className={cn(
        "w-64 border-r bg-muted/40 overflow-auto",
        side === "right" && "border-l border-r-0",
        className
      )}
    >
      {children}
    </aside>
  )
}

interface TabletMainProps {
  children: ReactNode
  className?: string
}

export function TabletMain({ children, className }: TabletMainProps) {
  return (
    <div className={cn("flex-1 overflow-auto p-6", className)}>{children}</div>
  )
}
