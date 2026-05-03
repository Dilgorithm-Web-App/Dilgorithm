/**
 * Factory: maps UI state → stable query params for `GET accounts/search/` (DIP: SearchPage stays thin).
 * Empty strings are omitted so defaults stay clean.
 */

/**
 * @param {{ nameQuery?: string; filterState?: Record<string,string>; page?: number; pageSize?: number }} opts
 */
export function buildProfileSearchParams({ nameQuery = '', filterState = {}, page = 1, pageSize } = {}) {
    const params = {};
    params.page = page;
    if (pageSize != null && Number.isFinite(pageSize)) {
        params.page_size = Math.min(Number(pageSize), 100);
    }
    const n = (nameQuery || '').trim();
    if (n) params.name = n;
    if (filterState.location?.trim()) params.location = filterState.location.trim();
    if (filterState.sect?.trim()) params.sect = filterState.sect.trim();
    if (filterState.caste?.trim()) params.caste = filterState.caste.trim();
    if (filterState.education?.trim()) params.education = filterState.education.trim();
    return params;
}
