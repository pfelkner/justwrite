/**
 * Gamification constants and formulas
 * Single source of truth for XP and leveling system
 */

// ============ CONSTANTS ============

/** XP earned per 10 words written */
export const XP_PER_10_WORDS = 1

/** Maximum XP that can be earned in a single session */
export const MAX_SESSION_XP = 50

/** Base XP required per level (multiplied by level) */
export const XP_PER_LEVEL = 100

// ============ FUNCTIONS ============

/**
 * Calculate XP earned from words written
 * @param wordsWritten - Number of words written in session
 * @returns XP earned (capped at MAX_SESSION_XP)
 */
export function calculateSessionXP(wordsWritten: number): number {
    const rawXP = Math.floor(wordsWritten / 10) * XP_PER_10_WORDS
    return Math.min(MAX_SESSION_XP, rawXP)
}

/**
 * Calculate XP required to complete current level
 * @param level - Current level
 * @returns XP needed to reach next level
 */
export function xpForLevel(level: number): number {
    return level * XP_PER_LEVEL
}

/**
 * Calculate XP progress percentage for current level
 * @param currentXP - Current XP in level
 * @param level - Current level  
 * @returns Percentage (0-100)
 */
export function xpProgressPercent(currentXP: number, level: number): number {
    const required = xpForLevel(level)
    return Math.min(100, Math.round((currentXP / required) * 100))
}
