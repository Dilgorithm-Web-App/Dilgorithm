/**
 * Adapter pattern: normalize Django responses into a stable UI-facing shape (DIP).
 */
export function adaptFiltersPayload(raw) {
    if (!raw || typeof raw !== 'object') {
        return { locations: [], sects: [], caste: [], education: [] };
    }
    const loc = raw.locations ?? raw.location;
    const sect = raw.sects ?? raw.sect;
    return {
        locations: Array.isArray(loc) ? loc : [],
        sects: Array.isArray(sect) ? sect : [],
        caste: Array.isArray(raw.caste) ? raw.caste : [],
        education: Array.isArray(raw.education) ? raw.education : [],
    };
}

export function adaptInterestsPayload(raw) {
    const list = raw?.interests;
    return Array.isArray(list) ? list : [];
}
