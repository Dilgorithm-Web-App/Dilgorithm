/**
 * Maps GoF-style patterns to project locations for reviewers (frontend + backend refs).
 * Also exports `solidPrinciples` and `engineeringPrinciples` for SOLID / DRY / KISS alignment.
 *
 * Updated to include dashboard-layer patterns alongside the original onboarding patterns.
 */
export const DESIGN_PATTERN_MANIFEST = {
    // ─── STATE ───────────────────────────────────────────────────────────
    state: {
        onboarding: 'src/onboarding/patterns/FlowState.js',
        dashboard:  'src/patterns/PageState.js',
        backend:    'backend/accounts/patterns.py → AccountStateMachine',
        note: 'Immutable StepState transitions (onboarding); PageState for async page lifecycle (dashboard); AccountStateMachine for account status transitions (backend).',
    },

    // ─── TEMPLATE METHOD ─────────────────────────────────────────────────
    templateMethod: {
        onboarding: 'src/onboarding/templates/OnboardingStepTemplate.jsx',
        dashboard:  'src/patterns/ProfileCardTemplate.jsx',
        backend:    'backend/accounts/matching_patterns.py → CompatibilityScoringTemplate',
        note: 'Fixed onboarding shell + scoring algorithm skeleton with overridable hooks; ProfileCardTemplate provides fixed card skeleton with variable render slots for Feed/Search/Home.',
    },

    // ─── ADAPTER ─────────────────────────────────────────────────────────
    adapter: {
        onboarding: 'src/onboarding/adapters/profileAdapter.js',
        dashboard:  'src/patterns/ApiResponseAdapter.js',
        backend:    'backend/accounts/matching_patterns.py → InterestAdapter',
        note: 'Shapes external/onboarding data for API or scoring (anti-corruption); ApiResponseAdapter normalises feed/detail/chat API responses into UnifiedProfile DTO.',
    },

    // ─── OBSERVER ────────────────────────────────────────────────────────
    observer: {
        onboarding: 'src/onboarding/observer/ProgressSubject.js',
        dashboard:  'src/patterns/EventBus.js',
        backend:    'backend/accounts/patterns.py → EventBus',
        note: 'Pub/sub for progress (onboarding); EventBus for domain events like favorite.toggled, user.blocked, report.submitted (dashboard + backend).',
    },

    // ─── ITERATOR ────────────────────────────────────────────────────────
    iterator: {
        onboarding: 'src/onboarding/patterns/StepIterator.js',
        dashboard:  'src/patterns/MatchIterator.js',
        backend:    'backend/accounts/matching_patterns.py → ranked_match_records',
        note: 'Sequential step navigation (onboarding); MatchIterator for traversing match lists in Feed/Search/Home (dashboard); backend yields ranked rows.',
    },

    // ─── SINGLETON ───────────────────────────────────────────────────────
    singleton: {
        onboarding: 'src/onboarding/store/UserFormDataStore.js',
        dashboard:  'src/patterns/NotificationService.js',
        backend:    'backend/accounts/patterns.py → NotificationService',
        note: 'Single shared onboarding store instance; NotificationService singleton for toast queue (dashboard); backend notification dispatch singleton.',
    },

    // ─── FACTORY ─────────────────────────────────────────────────────────
    factory: {
        onboarding: 'src/onboarding/factory/StepFactory.jsx',
        dashboard:  'src/patterns/PageFactory.jsx',
        backend:    'backend/accounts/patterns.py → ViewResponseFactory',
        note: 'Creates the correct step component from a step key (onboarding); PageFactory for settings sub-pages; ViewResponseFactory for uniform API responses (backend).',
    },

    // ─── COMPOSITE ───────────────────────────────────────────────────────
    composite: {
        onboarding: 'src/onboarding/composite/FormFieldComposite.js',
        dashboard:  'src/patterns/FilterComposite.js',
        backend:    'backend/accounts/matching_patterns.py → ProfileFilterComposite',
        note: 'Whole-form validation tree (onboarding); FilterComposite for SearchPage filter tree with TextFilterLeaf nodes (dashboard); queryset filters composed uniformly (backend).',
    },
    chatWebSocketStack: {
        path: 'src/chat/ws/ChatWebSocketClient.js',
        backend: 'backend/accounts/consumers.py, jwt_ws_middleware.py, services/chat_message_service.py',
        note: 'Chat: State (connectionState), Observer (SimpleEventSubject), Composite (inboundMessageComposite), Iterator (exponentialBackoff), Adapter (adaptChatServerMessage), Factory (buildChatWebSocketUrl at connect-time, chatWebSocketFactory), Singleton (one native WS per client + getLatestAccessToken in chatSocketConfig). DIP: injectable WebSocket + getToken. SRP: URL/token resolved in _resolveWebSocketUrl before each open/reconnect (no stale JWT closure).',
    },
    favoritesFeedSync: {
        path: 'src/features/favorites/favoriteIdsFromFeed.js',
        note: 'SRP: derive favorite id Set from feed rows. Adapter (adaptMatchRowToFavoritePair), Factory (createFavoritesSetFromFeedRows), Iterator-style row scan. DIP: Feed/Search depend on module, not API shape details.',
    },

    /**
     * SOLID map — how each principle is expressed in this repo (keep in sync when adding layers).
     * Use with GoF sections above; do not duplicate long explanations in random files.
     */
    solidPrinciples: {
        srp: {
            summary: 'One reason to change per module.',
            refs: [
                'src/patterns/ApiResponseAdapter.js — shape only',
                'src/utils/formatApiError.js — HTTP error text only',
                'backend/accounts/services/* — one bounded context per file',
                'backend/accounts/patterns.py — NotificationService vs EventBus vs ViewResponseFactory',
            ],
        },
        ocp: {
            summary: 'Extend via new types/handlers; avoid editing shared cores for one-off behavior.',
            refs: [
                'src/onboarding/factory/StepFactory.jsx',
                'src/patterns/FilterComposite.js — new leaf filters',
                'backend/accounts/patterns.py — AccountState / new EventBus subscribers',
            ],
        },
        lsp: {
            summary: 'Substitutable states, scoring templates, and adapter outputs (same DTO contracts).',
            refs: [
                'backend/accounts/patterns.py — AccountState subclasses',
                'backend/accounts/matching_patterns.py — CompatibilityScoringTemplate hooks',
                'src/patterns/ApiResponseAdapter.js — UnifiedProfile',
            ],
        },
        isp: {
            summary: 'Narrow interfaces; avoid fat “context” objects passed everywhere.',
            refs: [
                'src/patterns/EventBus.js — subscribe/publish only',
                'backend/accounts/patterns.py — NotificationService public methods',
            ],
        },
        dip: {
            summary: 'UI and views depend on contracts (DTOs, factories, bus), not raw API/ORM everywhere.',
            refs: [
                'src/patterns/ApiResponseAdapter.js',
                'src/chat/ws/ChatWebSocketClient.js — injectable WS + token',
                'backend/accounts/views.py — ViewResponseFactory / services delegation',
            ],
        },
    },

    /** KISS / DRY reminders tied to this codebase (not a second pattern catalog). */
    engineeringPrinciples: {
        dry: 'Prefer src/utils/formatApiError.js and shared adapters over duplicated axios error parsing.',
        kiss: 'Prefer small modules and explicit names over clever one-liners in pages and views.',
        consistency: 'Dashboard pages: constrained width wrappers use margin-inline: auto (e.g. hp-grid, sp-wrap, fd-wrap).',
    },
};
