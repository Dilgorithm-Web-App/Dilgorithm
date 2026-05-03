/**
 * Adapter pattern (dashboard layer): converts heterogeneous API response
 * shapes into a single UnifiedProfile DTO that all UI components consume.
 *
 * Three source shapes exist:
 *   1. Feed / MatchFeedSerializer  — includes compatibility_score, match_reason
 *   2. User detail                — includes interestList, is_blocked
 *   3. Chat contact               — includes roomName, status, is_online
 *
 * SOLID:
 *   SRP  — only handles data shape conversion.
 *   OCP  — new source shapes add a new adapter method; existing ones unchanged.
 *   DIP  — components depend on the UnifiedProfile contract, not raw API shapes.
 *   LSP  — every adapter method returns the same UnifiedProfile shape.
 */

/**
 * @typedef {object} UnifiedProfile
 * @property {number}   id
 * @property {string}   displayName
 * @property {string}   email
 * @property {string}   username
 * @property {string|null} bio
 * @property {string|null} profileImage
 * @property {string|null} location
 * @property {string|null} education
 * @property {string|null} profession
 * @property {string|null} sect
 * @property {string|null} caste
 * @property {string|null} maritalStatus
 * @property {number|null} age
 * @property {number|null} compatibilityScore
 * @property {string|null} matchReason
 * @property {string[]}   interests
 * @property {boolean}  isFavorite
 * @property {boolean}  isOnline
 * @property {boolean}  isBlocked
 */

/**
 * Adapt a feed / match serializer response to UnifiedProfile.
 * @param {object} raw - raw API object from /feed/ endpoint
 * @returns {UnifiedProfile}
 */
export const adaptFeedProfile = (raw) => ({
    id: raw.id,
    displayName: raw.fullName || raw.username || 'User',
    email: raw.email || '',
    username: raw.username || '',
    bio: raw.bio || null,
    profileImage: raw.profileImage || null,
    location: raw.location || null,
    education: raw.education || null,
    profession: raw.profession || null,
    sect: raw.sect || null,
    caste: raw.caste || null,
    maritalStatus: raw.maritalStatus || null,
    age: raw.age || null,
    compatibilityScore: raw.compatibility_score || null,
    matchReason: raw.match_reason || null,
    interests: [],
    isFavorite: Boolean(raw.is_favorite),
    isOnline: Boolean(raw.is_online),
    isBlocked: false,
});

/**
 * Adapt a user-detail response to UnifiedProfile.
 * @param {object} raw - raw API object from /user/:id/ endpoint
 * @returns {UnifiedProfile}
 */
export const adaptUserDetail = (raw) => ({
    ...adaptFeedProfile(raw),
    interests: Array.isArray(raw.interestList) ? raw.interestList : [],
    isBlocked: Boolean(raw.is_blocked),
});

/**
 * Adapt a chat-contact response to UnifiedProfile.
 * @param {object} raw - raw API object from /chat/contacts/ endpoint
 * @returns {UnifiedProfile}
 */
export const adaptChatContact = (raw) => ({
    id: raw.id,
    displayName: raw.fullName || raw.username || raw.email || 'User',
    email: raw.email || '',
    username: raw.username || '',
    bio: null,
    profileImage: raw.profileImage || null,
    location: null,
    education: null,
    profession: null,
    sect: null,
    caste: null,
    maritalStatus: null,
    age: null,
    compatibilityScore: null,
    matchReason: null,
    interests: [],
    isFavorite: false,
    isOnline: Boolean(raw.is_online),
    isBlocked: false,
});
