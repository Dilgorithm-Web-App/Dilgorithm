/**
 * Maps GoF-style patterns to project locations for reviewers (frontend + backend refs).
 * Principles called out: SRP, OCP, DIP, ISP (narrow hooks), LSP (substitutable steps/filters).
 */
export const DESIGN_PATTERN_MANIFEST = {
    state: {
        path: 'src/onboarding/patterns/FlowState.js',
        note: 'Immutable StepState transitions (next/previous); encapsulates step index.',
    },
    templateMethod: {
        path: 'src/onboarding/templates/OnboardingStepTemplate.jsx',
        backend: 'backend/accounts/matching_patterns.py → CompatibilityScoringTemplate',
        note: 'Fixed onboarding shell + scoring algorithm skeleton with overridable hooks.',
    },
    adapter: {
        path: 'src/onboarding/adapters/profileAdapter.js',
        backend: 'backend/accounts/matching_patterns.py → InterestAdapter',
        note: 'Shapes external/onboarding data for API or scoring (anti-corruption).',
    },
    observer: {
        path: 'src/onboarding/observer/ProgressSubject.js',
        note: 'Pub/sub for progress; UserFormDataStore also notifies subscribers.',
    },
    iterator: {
        path: 'src/onboarding/patterns/StepIterator.js',
        backend: 'backend/accounts/matching_patterns.py → ranked_match_records',
        note: 'Sequential step navigation; backend yields ranked rows.',
    },
    singleton: {
        path: 'src/onboarding/store/UserFormDataStore.js',
        note: 'Single shared onboarding store instance for the session.',
    },
    factory: {
        path: 'src/onboarding/factory/StepFactory.jsx',
        note: 'Creates the correct step component from a step key.',
    },
    composite: {
        path: 'src/onboarding/composite/FormFieldComposite.js',
        backend: 'backend/accounts/matching_patterns.py → ProfileFilterComposite',
        note: 'Whole-form validation tree; queryset filters composed uniformly.',
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
};
