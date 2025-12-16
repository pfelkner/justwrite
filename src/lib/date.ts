/**
 * Date utility functions for consistent formatting across the app
 */

/**
 * Get today's date as ISO string (YYYY-MM-DD) in user's local timezone
 * Uses the user's browser timezone, not UTC
 * Used for: Check-ins, daily stats, session recording
 */
export function getTodayISO(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * Format a timestamp to localized date string (German format: DD.MM.YYYY)
 * Used for: Document cards, activity display
 */
export function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('de-DE')
}

/**
 * Format a Date to localized time string (German format: HH:MM)
 * Used for: Save indicator, last edit time
 */
export function formatTime(date: Date): string {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Get the user's timezone
 * Used for: Profile creation
 */
export function getUserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
}
