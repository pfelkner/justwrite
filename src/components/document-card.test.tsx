import { describe, it, expect } from 'vitest'

const SWIPE_THRESHOLD = 100

// Swipe detection logic tests (pure functions extracted from component)
describe('DocumentCard swipe detection', () => {
    const shouldTriggerDelete = (xValue: number) => xValue < -SWIPE_THRESHOLD

    const shouldTriggerClick = (xValue: number) => Math.abs(xValue) < 10

    describe('shouldTriggerDelete', () => {
        it('triggers delete when swiped past threshold (-100px)', () => {
            expect(shouldTriggerDelete(-101)).toBe(true)
            expect(shouldTriggerDelete(-150)).toBe(true)
            expect(shouldTriggerDelete(-200)).toBe(true)
        })

        it('does not trigger delete when not swiped far enough', () => {
            expect(shouldTriggerDelete(-100)).toBe(false)
            expect(shouldTriggerDelete(-50)).toBe(false)
            expect(shouldTriggerDelete(0)).toBe(false)
        })

        it('does not trigger delete when swiped right', () => {
            expect(shouldTriggerDelete(50)).toBe(false)
            expect(shouldTriggerDelete(100)).toBe(false)
        })
    })

    describe('shouldTriggerClick', () => {
        it('triggers click when card has not moved significantly', () => {
            expect(shouldTriggerClick(0)).toBe(true)
            expect(shouldTriggerClick(5)).toBe(true)
            expect(shouldTriggerClick(-5)).toBe(true)
            expect(shouldTriggerClick(9)).toBe(true)
            expect(shouldTriggerClick(-9)).toBe(true)
        })

        it('does not trigger click when card has been swiped', () => {
            expect(shouldTriggerClick(10)).toBe(false)
            expect(shouldTriggerClick(-10)).toBe(false)
            expect(shouldTriggerClick(50)).toBe(false)
            expect(shouldTriggerClick(-100)).toBe(false)
        })
    })
})
