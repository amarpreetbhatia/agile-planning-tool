"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface MobileLayoutProps {
  children: ReactNode
  className?: string
}

export function MobileLayout({ children, className }: MobileLayoutProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col sm:hidden",
        className
      )}
    >
      {children}
    </div>
  )
}

interface MobileHeaderProps {
  children: ReactNode
  className?: string
}

export function MobileHeader({ children, className }: MobileHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="flex h-14 items-center px-4">{children}</div>
    </header>
  )
}

interface MobileContentProps {
  children: ReactNode
  className?: string
}

export function MobileContent({ children, className }: MobileContentProps) {
  return (
    <main className={cn("flex-1 overflow-auto p-4", className)}>
      {children}
    </main>
  )
}

interface MobileBottomSheetProps {
  children: ReactNode
  className?: string
}

export function MobileBottomSheet({
  children,
  className,
}: MobileBottomSheetProps) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t bg-background p-4",
        className
      )}
    >
      {children}
    </div>
  )
}
