/**
 * Simple search store — replaces Zustand store from SGP2.
 * Uses local component state instead of global state.
 * The searchTerm is always empty here since dashboard-financiero
 * doesn't have a global search bar (filtering is done locally in each table).
 */
export function useSearchStore() {
    return { searchTerm: '' }
}
