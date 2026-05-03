/**
 * Favorites sync from match/feed API rows.
 *
 * SRP: this module only derives “who is favorited” from payloads.
 * Adapter: narrow, stable view of each row (ISP/LSP — unknown rows yield null).
 * Factory: `createFavoritesSetFromFeedRows` constructs the Set (OCP: extend via adapter).
 */

/**
 * @param {unknown} row
 * @returns {{ id: number, isFavorite: boolean } | null}
 */
export function adaptMatchRowToFavoritePair(row) {
    if (!row || typeof row !== 'object') return null;
    const id = row.id;
    if (id == null || id === '') return null;
    const numId = Number(id);
    if (Number.isNaN(numId)) return null;
    return { id: numId, isFavorite: Boolean(row.is_favorite) };
}

/**
 * Iterator-style scan over rows (no array helpers required for the pattern).
 * @param {unknown} rows
 * @returns {Set<number>}
 */
export function createFavoritesSetFromFeedRows(rows) {
    const set = new Set();
    if (!Array.isArray(rows)) return set;
    for (let i = 0; i < rows.length; i += 1) {
        const pair = adaptMatchRowToFavoritePair(rows[i]);
        if (pair?.isFavorite) set.add(pair.id);
    }
    return set;
}
