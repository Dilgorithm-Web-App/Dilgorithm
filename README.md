# Dilgorithm
# Dilgorithm: AI-Powered Matching & Social Platform

Dilgorithm is a full-stack web application designed to connect users based on deep compatibility. Utilizing an intelligent matching engine, real-time WebSockets, and a robust AI preference system, Dilgorithm calculates percentage-based matches and allows users to communicate instantly in a secure, filtered environment.

## Key Features

*   **Intelligent Match Feed:** An AI-driven engine compares user profiles, interests, and criteria to generate a dynamic feed of highly compatible partners, complete with a "Compatibility Score."
*   **Dynamic Preferences System:** Users can define specific interests (comma-separated), religious sects, and location preferences to fine-tune their AI match results.
*   **Family Background Profiling:** A complete integration allowing users to add and manage family details, which the AI engine uses to further enrich match compatibility.
*   **Advanced Dynamic Filtering:** Functional frontend filters (e.g., caste, education) integrated with backend APIs, along with a transparent "Why this match" reasoning.
*   **Real-Time Chat:** Integrated Django Channels and WebSockets enable instantaneous, bidirectional messaging between matched users.
*   **Automated Moderation:** A built-in security layer acts as a profanity and bot filter, automatically blocking toxic messages before they reach the chat room.
*   **Secure Authentication:** End-to-end JWT (JSON Web Token) authentication for seamless, secure login and session management.

## 🛠️ Tech Stack

**Frontend:**
*   React (via Vite)
*   React Router DOM (Protected routing)
*   Axios (API communication)
*   Context API (Global state & auth management)
*   *(Upcoming: Tailwind CSS for UI/UX styling)*

**Backend:**
*   Django & Django REST Framework (DRF)
*   Django Channels / WebSockets (Real-time infrastructure)
*   SimpleJWT (Authentication)
*   SQLite / PostgreSQL (Database)

## 🚀 Getting Started

Follow these steps to run the Dilgorithm project locally on your machine.

### Prerequisites
*   Node.js (v18+)
*   Python (3.10+)

### 1. Backend Setup (Django)
Navigate to the backend directory, activate the virtual environment, and start the server:
```bash
cd backend
# Activate virtual environment (Windows)
.\venv\Scripts\activate
# Install requirements
pip install -r requirements.txt
# Run migrations
python manage.py migrate
# Start the Daphne/ASGI server
python manage.py runserver
```

---

## Supplement: additional features, architecture, and setup

The sections below **add to** the description above and reflect the current codebase (auth flows, onboarding, patterns, environment variables, and frontend run instructions). They do not replace the original feature list.

### Additional and expanded features

*   **Email/password login** with **Google reCAPTCHA**; **Google OAuth** sign-in (client `VITE_GOOGLE_CLIENT_ID`, server verification as configured).
*   **Registration** with profile basics, then **email OTP (2FA)** (`register/init-2fa/`, `register/verify-2fa/`). Successful verification returns **JWT access and refresh** tokens.
*   **Profile photo step** (`/register/photo`) after OTP: user adds a photo before continuing; stored on `profile.images`; **dashboard header avatar** uses the first image.
*   **Match feed** implementation uses `backend/accounts/ai_engine.py` and **`matching_patterns.py`** (adapter, template-method scoring, composite filters).
*   **Search**, **filters** (e.g. education, caste), and **favorites** API/UI.
*   **Engagement & moderation** summary, **app configuration** (language, permissions on profile), **Settings**, **About Us**, **Preferences**; shared **dashboard layout** (sidebar + header).
*   **Multi-step onboarding** (profession, education, location, marital status, sect, time spans, top 3 interests) with documented **GoF-style patterns** (see **Design patterns** below).
*   **Figma-export HTML slides** under `frontend/public/figma-import/` (and `frontend/figma-import/`) where used.

### Tech stack (current detail)

In addition to the stack listed earlier, the repo now also uses:

| Layer | Notes |
|--------|--------|
| **Frontend** | React 19, Vite 8, React Router 7, `@react-oauth/google`, `react-google-recaptcha` |
| **Backend** | Django 6, DRF, SimpleJWT, django-cors-headers, Channels / Daphne, Google Auth libs |
| **Database** | `settings.py` may be configured for **Microsoft SQL Server** (`mssql-django`, ODBC); adjust `DATABASES` for your environment |

### Repository layout (expanded subfolders)

> Note: dependency/generated folders such as `.git/`, `venv/`, and `node_modules/` are omitted for readability.

```text
Dilgorithm/
├── backend/
│   ├── .django_cache/
│   ├── accounts/
│   │   ├── filters/
│   │   ├── management/
│   │   │   └── commands/
│   │   ├── migrations/
│   │   └── services/
│   ├── backend/
│   └── manage.py
├── frontend/
│   ├── dist/
│   │   ├── assets/
│   │   └── figma-import/
│   ├── figma-import/
│   ├── public/
│   │   └── figma-import/
│   └── src/
│       ├── assets/
│       ├── auth/
│       ├── catalog/
│       │   ├── adapters/
│       │   ├── composite/
│       │   ├── factory/
│       │   └── states/
│       ├── chat/
│       │   └── ws/
│       ├── components/
│       ├── data/
│       ├── features/
│       │   ├── favorites/
│       │   └── search/
│       ├── hooks/
│       ├── onboarding/
│       │   ├── adapters/
│       │   ├── components/
│       │   │   └── steps/
│       │   ├── composite/
│       │   ├── config/
│       │   ├── factory/
│       │   ├── hooks/
│       │   ├── layouts/
│       │   ├── observer/
│       │   ├── patterns/
│       │   ├── services/
│       │   ├── store/
│       │   └── templates/
│       ├── pages/
│       ├── patterns/
│       ├── photoUpload/
│       └── utils/
└── README.md
```

### Design patterns and principles

**Machine-readable index (single source of truth for pattern locations + SOLID map):**  
`frontend/src/onboarding/designPatternManifest.js`  
It exports **`DESIGN_PATTERN_MANIFEST`**, which bundles GoF pattern paths, feature stacks (`chatWebSocketStack`, `favoritesFeedSync`), and nested **`solidPrinciples`** / **`engineeringPrinciples`** (DRY / KISS / layout consistency).

**Backend structural patterns:** `backend/accounts/patterns.py` (EventBus, ViewResponseFactory, AccountStateMachine, NotificationService).  
**Matching / scoring patterns:** `backend/accounts/matching_patterns.py` (Adapter, Template Method, Composite, Iterator for the AI pipeline).

---

#### SOLID (detailed)

These five principles structure how modules depend on each other and how new behavior is added without breaking callers.

| Principle | Meaning | How Dilgorithm applies it |
|-----------|---------|---------------------------|
| **S — Single Responsibility** | A class or module should have only one reason to change: one job, one axis of change. | **UI pages** orchestrate (fetch, navigate, local UI state) but do not reimplement API shapes—**`ApiResponseAdapter`** normalises data; **`formatApiError`** only turns HTTP errors into user-visible strings; **Django `services/`** (e.g. chat, group chat, search query) own persistence and rules; **`ViewResponseFactory`** centralises JSON response building so views are not a mix of ad-hoc `Response({...})` calls. |
| **O — Open/Closed** | Software should be **open for extension** (new behavior) but **closed for modification** of stable cores: add new types instead of growing giant `if/else` trees. | New onboarding steps are registered via **`StepFactory`**; new search filters are added as **leaves in `FilterComposite`**; new account lifecycle transitions go through **new `AccountState` handling** in `AccountStateMachine` rather than scattered `if accountStatus == ...` in many files; new API success/error shapes are extended through **`ViewResponseFactory`** helpers rather than one-off response blobs everywhere. |
| **L — Liskov Substitution** | Subtypes must be usable anywhere their base type is expected: same expectations for inputs/outputs, no surprise stricter preconditions. | **Account state** objects (`ActiveState`, `SuspendedState`, `BannedState`) all implement the same transition contract; **`CompatibilityScoringTemplate`** subclasses honor the template’s hooks; **adapter methods** in `ApiResponseAdapter` return the same **UnifiedProfile**-shaped result so screens can swap data sources without branching on “which endpoint” in every component. |
| **I — Interface Segregation** | Prefer many small, focused interfaces over one “fat” interface that forces every client to depend on methods they do not use. | **`EventBus`** exposes a minimal **subscribe / publish** API; **`NotificationService`** exposes narrow notification methods, not a dump of the whole app; avoid passing huge “context” objects into every child—pass only what a component needs. |
| **D — Dependency Inversion** | High-level modules should depend on **abstractions** (contracts, DTOs, facades), not on low-level details (raw JSON keys, ORM calls inside JSX, hard-coded URLs). | **React** depends on **UnifiedProfile** (adapter output), not on raw DRF field names in every file; **chat** uses an injectable **WebSocket** and **token resolver** in `ChatWebSocketClient` so connection logic is not hopelessly tied to one global; **Django views** lean on **serializers** and **services** and **ViewResponseFactory** instead of embedding SQL/ORM logic in the view function body. |

---

#### Additional engineering principles (used alongside SOLID)

| Principle | Meaning | In this project |
|-----------|---------|-----------------|
| **DRY (Don’t Repeat Yourself)** | Every piece of knowledge should have a **single authoritative** place; avoid copy-pasting the same error-parsing or field-mapping logic. | Central **`formatApiError`** for Axios/DRF errors; **adapters** for API shapes; **`ViewResponseFactory`** for HTTP JSON bodies on the backend. |
| **KISS (Keep It Simple, Stupid)** | Prefer straightforward structure and names over clever one-off tricks that are hard to maintain. | Small modules, explicit route and folder names, dashboard layouts using simple **max-width + margin-inline: auto** for centered columns (`hp-grid`, `sp-wrap`, `fd-wrap`). |
| **Consistency** | Same kinds of UI/API behavior should look and behave the same everywhere. | Shared **`DashboardLayout`**; toast **`NotificationService`**; **`TAB_CONFIG`**-style registries where tabs drive UI (e.g. admin moderation). |
| **Separation of concerns** | Networking, presentation, domain rules, and persistence stay in different layers. | **`api.js`** handles auth headers and refresh; **pages** compose UX; **services/** on Django hold business rules; **consumers.py** bridges WebSockets to services. |
| **Observer / pub-sub for domain events** | Screens should not hard-wire to each other; they react to **named events**. | Frontend **`eventBus`** (`favorite.toggled`, `user.blocked`, `report.submitted`, …); backend **`event_bus`** for `user.registered`, `report.created`, etc. |
| **Anti-corruption / Adapter boundary** | External APIs (and serializer quirks) are translated at the edge into **your** domain shape before UI use. | **`ApiResponseAdapter`**, **`adaptChatContact`**, onboarding **`profileAdapter`**, backend **`InterestAdapter`** for scoring. |

---

#### Gang of Four (GoF) and related patterns (where they live)

These classic patterns are **named and located** in `designPatternManifest.js`. Summary:

| Pattern | Role | Primary locations |
|---------|------|-------------------|
| **State** | Encapsulate behavior that changes when internal state changes. | Onboarding: `FlowState.js`; dashboard: `PageState.js`; backend: `AccountStateMachine` in `patterns.py`. |
| **Template Method** | Define algorithm skeleton; subclasses/hooks fill steps. | Onboarding: `OnboardingStepTemplate.jsx`; dashboard: `ProfileCardTemplate.jsx`; backend: `CompatibilityScoringTemplate` in `matching_patterns.py`. |
| **Adapter** | Convert foreign interfaces into the interface your app expects. | Onboarding: `profileAdapter.js`; dashboard: `ApiResponseAdapter.js`; backend: `InterestAdapter`. |
| **Observer** | Notify dependents when state/events change without tight coupling. | Onboarding: `ProgressSubject.js` / store; dashboard: `EventBus.js`; backend: `EventBus` in `patterns.py`. |
| **Iterator** | Sequential access without exposing internals. | Onboarding: `StepIterator.js`; dashboard: `MatchIterator.js`; backend: `ranked_match_records` and iterators in matching pipeline. |
| **Singleton** | One shared instance for a coordinated resource. | Onboarding: `UserFormDataStore.js`; dashboard: `NotificationService.js`; backend: `NotificationService` / module-level helpers in `patterns.py`. |
| **Factory** | Create objects/components without baking concrete types into callers. | Onboarding: `StepFactory.jsx`; dashboard: `PageFactory.jsx`; backend: `ViewResponseFactory`. |
| **Composite** | Treat individual objects and compositions uniformly. | Onboarding: `FormFieldComposite.js`; dashboard: `FilterComposite.js`; backend: `ProfileFilterComposite` + filter leaves. |

**Composite stacks (multi-pattern):**

- **Chat WebSocket stack** (`ChatWebSocketClient.js`, plus `consumers.py`, `jwt_ws_middleware.py`, chat services): combines connection **state**, **observer**-style events, message **composite**, retry **iterator** behavior, message **adapter**, URL **factory**, and single-flight token access (**singleton**-like)—with **DIP** via injectable WebSocket and token resolver.
- **Favorites from feed** (`features/favorites/favoriteIdsFromFeed.js`): **SRP** derivation of favorite IDs from feed rows; small **adapter**/factory helpers so Feed/Search do not depend on raw row shapes.

---

#### Practical rules for contributors

- Prefer **`ViewResponseFactory`** (or consistent serializer responses) in Django views instead of ad-hoc `Response(...)` shapes.
- Prefer **`formatApiError`** (or one shared helper) over repeating `err.response?.data?.detail` chains in React.
- Prefer **`eventBus` / backend `event_bus`** for cross-feature reactions instead of importing unrelated screens into each other.
- Prefer **new files under `accounts/services/`** for heavy logic instead of growing `views.py` indefinitely (large views file is acknowledged technical debt).

---

### API overview (`/api/accounts/`)

| Method | Path | Notes |
|--------|------|--------|
| POST | `register/init-2fa/` | Start OTP registration |
| POST | `register/verify-2fa/` | Verify OTP; returns `access`, `refresh`, `email`, `username` |
| POST | `login/` | Email/password + captcha |
| POST | `google-login/` | Google credential + captcha |
| POST | `token/refresh/` | JWT refresh |
| GET/PATCH | `profile/` | Profile (`images`, onboarding fields, etc.) |
| GET/PATCH | `preferences/` | Interests / partner criteria |
| GET | `feed/` | Ranked matches |
| POST | `favorites/toggle/` | Favorite / unfavorite |
| GET/PUT | `app-configuration/` | App config on profile |
| GET | `engagement-summary/` | Engagement counts |
| … | `chat/…`, `interests/available/`, `filters/`, `family/` | See `backend/accounts/urls.py` |

### Profile model (summary)

`UserProfile` includes fields such as `fullName`, `bio`, `images`, `identityDocs`, `profession`, `education`, `location`, `maritalStatus`, `sect`, `caste`, and **favorites** (M2M). See migrations under `backend/accounts/migrations/`.

### Environment variables

**Backend (`backend/.env`)** — loaded via `python-dotenv` in `settings.py`:

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CLIENT_ID` | Google verification (if used) |
| `RECAPTCHA_SECRET_KEY` | Captcha on login / Google routes |
| `EMAIL_*`, `DEFAULT_FROM_EMAIL` | SMTP for registration OTP |

**Frontend (`frontend/.env`)**:

| Variable | Purpose |
|----------|---------|
| `VITE_GOOGLE_CLIENT_ID` | Google button |
| `VITE_RECAPTCHA_SITE_KEY` | reCAPTCHA widget |
| `VITE_API_BASE_URL` | Optional; default **`/api/`** with Vite dev proxy to Django |

### 2. Frontend setup (React / Vite)

```bash
cd frontend
npm install
npm run dev
```

Vite uses **port `5174`** (`strictPort: true`) and proxies **`/api` → `http://127.0.0.1:8000`**. Prefer one host (e.g. `http://localhost:5174`) so **localStorage** tokens are consistent.

**Production build:**

```bash
cd frontend
npm run build
npm run preview   # optional
```

Serve `dist/` and reverse-proxy `/api` to Django or set `VITE_API_BASE_URL` as needed.

### Changelog summary (recent engineering)

*   **Login Page Aesthetics:** Visually enhanced and modernized the login page with a cohesive aesthetic (linear gradient background, improved typography hierarchy, standardized button layouts, refined link styling, and cleaner reCAPTCHA integration).
*   **Dynamic Frontend Integration:** Replaced static mock data with dynamic backend integration for user interests, chat contacts, caste and education filters, and the "Why this match" logic. Connected heart/favorite buttons to backend APIs.
*   **Family Member Feature:** End-to-end implementation including backend models, API endpoints (`/family/`), AI matching engine updates for family background considerations, and a dynamic React component (`FamilyForm.jsx`).
*   **AI Engine Optimization:** Refined `ai_engine.py` logic to accurately calculate and rank compatibility scores, seamlessly processing user interests, partner criteria, and profile data.
*   Registration: 2FA OTP, JWT on verify, **profile photo** step and `profile.images`.
*   Dashboard avatar from first profile image; Preferences / About / Engagement / App configuration pages; API base URL + dev proxy.
*   Backend: onboarding profile fields, caste, favorites, engagement summary; matching refactored through **`matching_patterns.py`**.
*   Onboarding: pattern manifest and documented GoF usage; logo asset transparency fixes and UI polish.

### Contributing and GitHub insights

Use a **verified** `user.email` on GitHub and merge work into the **default branch** if you want contributor stats to match local history.

### License / course

Maintained for **Software Design & Analysis** (FAST / Dilgorithm team). Add a `LICENSE` file if you distribute beyond the course.

### Team

**Dilgorithm-Web-App** organization; per-developer percentages can be derived from `git shortlog` / `git log --numstat` on this repository.
