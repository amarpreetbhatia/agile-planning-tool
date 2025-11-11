import { useEffect, useState } from "react"

const MOBILE_BREAKPOINT = 640 // sm breakpoint in Tailwind
const TABLET_BREAKPOINT = 1024 // lg breakpoint in Tailwind

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mql = window.matchMedia(
      `(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`
    )
    const onChange = () => {
      setIsTablet(
        window.innerWidth >= MOBILE_BREAKPOINT &&
          window.innerWidth < TABLET_BREAKPOINT
      )
    }
    mql.addEventListener("change", onChange)
    setIsTablet(
      window.innerWidth >= MOBILE_BREAKPOINT &&
        window.innerWidth < TABLET_BREAKPOINT
    )
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isTablet
}

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${TABLET_BREAKPOINT}px)`)
    const onChange = () => {
      setIsDesktop(window.innerWidth >= TABLET_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsDesktop(window.innerWidth >= TABLET_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isDesktop
}
