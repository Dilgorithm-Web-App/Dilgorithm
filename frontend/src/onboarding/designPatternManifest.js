/**
 * Maps GoF-style patterns to project locations for reviewers (frontend + backend refs).
 * Principles called out: SRP, OCP, DIP, ISP (narrow hooks), LSP (substitutable steps/filters).
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
};
