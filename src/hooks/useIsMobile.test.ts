import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from './useIsMobile'

describe('useIsMobile', () => {
    const originalInnerWidth = window.innerWidth

    const setWindowWidth = (width: number) => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: width,
        })
    }

    afterEach(() => {
        setWindowWidth(originalInnerWidth)
    })

    it('returns true when viewport width < 768px', () => {
        setWindowWidth(767)
        const { result } = renderHook(() => useIsMobile())
        expect(result.current).toBe(true)
    })

    it('returns false when viewport width >= 768px', () => {
        setWindowWidth(768)
        const { result } = renderHook(() => useIsMobile())
        expect(result.current).toBe(false)
    })

    it('returns false for desktop viewport (1024px)', () => {
        setWindowWidth(1024)
        const { result } = renderHook(() => useIsMobile())
        expect(result.current).toBe(false)
    })

    it('updates when window resizes from desktop to mobile', () => {
        setWindowWidth(1024)
        const { result } = renderHook(() => useIsMobile())
        expect(result.current).toBe(false)

        act(() => {
            setWindowWidth(600)
            window.dispatchEvent(new Event('resize'))
        })

        expect(result.current).toBe(true)
    })

    it('updates when window resizes from mobile to desktop', () => {
        setWindowWidth(600)
        const { result } = renderHook(() => useIsMobile())
        expect(result.current).toBe(true)

        act(() => {
            setWindowWidth(1024)
            window.dispatchEvent(new Event('resize'))
        })

        expect(result.current).toBe(false)
    })

    it('cleans up resize listener on unmount', () => {
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

        setWindowWidth(1024)
        const { unmount } = renderHook(() => useIsMobile())

        unmount()

        expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
        removeEventListenerSpy.mockRestore()
    })
})
