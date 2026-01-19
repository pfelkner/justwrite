import { useState, useEffect } from 'react'

const MOBILE_BREAKPOINT = 768 // Tailwind's md breakpoint

/**
 * useIsMobile - Detects if the viewport is mobile-sized
 *
 * @returns true when viewport width < 768px (Tailwind's md breakpoint)
 *
 * @example
 * const isMobile = useIsMobile()
 *
 * if (isMobile) {
 *   // Show mobile UI (swipe gestures)
 * } else {
 *   // Show desktop UI (hover buttons)
 * }
 */
export function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false
        return window.innerWidth < MOBILE_BREAKPOINT
    })

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
        }

        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    return isMobile
}
