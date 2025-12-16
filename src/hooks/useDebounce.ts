import { useState, useEffect } from 'react'

/**
 * useDebounce - Verzögert die Aktualisierung eines Werts
 * 
 * @param value - Der zu debouncende Wert
 * @param delay - Verzögerung in Millisekunden
 * @returns Der debounced Wert (ändert sich erst nach `delay` ms Pause)
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearch = useDebounce(searchTerm, 500)
 * 
 * useEffect(() => {
 *   // Wird nur ausgeführt wenn User 500ms nicht getippt hat
 *   searchAPI(debouncedSearch)
 * }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        // Timer setzen der nach `delay` ms den Wert aktualisiert
        const timer = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        // Cleanup: Timer löschen wenn sich `value` ändert oder Komponente unmountet
        return () => {
            clearTimeout(timer)
        }
    }, [value, delay])

    return debouncedValue
}
