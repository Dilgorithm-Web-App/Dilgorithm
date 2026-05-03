# Dilgorithm
# Dilgorithm: AI-Powered Matching & Social Platform

Dilgorithm is a full-stack web application designed to connect users based on deep compatibility. Utilizing an intelligent matching engine, real-time WebSockets, and a robust AI preference system, Dilgorithm calculates percentage-based matches and allows users to communicate instantly in a secure, filtered environment.

## ✨ Key Features

*   **Intelligent Match Feed:** An AI-driven engine compares user profiles, interests, and criteria to generate a dynamic feed of highly compatible partners, complete with a "Compatibility Score."
*   **Dynamic Preferences System:** Users can define specific interests (comma-separated), religious sects, and location preferences to fine-tune their AI match results.
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
*   Enterprise-Grade Search Engine: Transitioned from client-side filtering to a full-backend search engine. Supports multi-criteria filtering (Sect, Caste, Location, Education) with optimized PageNumberPagination.
*    Privacy-Aware Discovery: Search results and match feeds automatically respect user privacy, excluding blocked users and the requester’s own profile via a dedicated ProfileSearchQuery service.
*   Robust Registration Validation: Implemented strict data integrity layers including Age Gating (18+), string-only name validation, and flexible profile metrics (optional height/weight).
*   High-Fidelity Onboarding: A multi-step visual interface captured from Figma prototypes for gathering intent-based data like "Time span for marriage" and "Top 3 Interests."
*   Advanced WebSocket Security: Integrated real-time "Blocking Guards" within Django Channels that instantly sever connections if a user is blocked during an active session.

### Tech stack (current detail)

In addition to the stack listed earlier, the repo now also uses:

| Layer | Notes |
|--------|--------|
| **Frontend** | React 19, Vite 8, React Router 7, `@react-oauth/google`, `react-google-recaptcha` |
| **Backend** | Django 6, DRF, SimpleJWT, django-cors-headers, Channels / Daphne, Google Auth libs |
| **Database** | `settings.py` may be configured for **Microsoft SQL Server** (`mssql-django`, ODBC); adjust `DATABASES` for your environment |


###  Security & Validation Logic
*   Identity Guard: Regex-based validation to ensure names contain only alphabetic characters and only 18+users can register.
*   Socket Integrity: Dynamic token refresh logic ensures WebSocket connections don't drop due to expired JWTs.
*   Access Control: Global middleware ensures users without a profile photo are redirected to the upload step before accessing the dashboard.

*   
### Repository layout (high level)

```
Dilgorithm/
├── backend/
│   ├── accounts/     # models, views, serializers, ai_engine, matching_patterns, …
│   ├── backend/      # settings, urls, asgi/wsgi
│   └── manage.py
├── frontend/
│   ├── public/figma-import/
│   └── src/          # pages, components, onboarding (patterns), api.js
└── README.md
```

### Design patterns and principles

Central index: `frontend/src/onboarding/designPatternManifest.js`

| Pattern | Primary location(s) |
|--------|----------------------|
| **State** | `frontend/src/onboarding/patterns/FlowState.js` |
| **Template Method** | `frontend/src/onboarding/templates/OnboardingStepTemplate.jsx`; `backend/accounts/matching_patterns.py` (`CompatibilityScoringTemplate`) |
| **Adapter** | `frontend/src/onboarding/adapters/profileAdapter.js`; `InterestAdapter` in `matching_patterns.py` |
| **Observer** | `frontend/src/onboarding/observer/ProgressSubject.js`; `UserFormDataStore` subscriptions |
| **Iterator** | `frontend/src/onboarding/patterns/StepIterator.js`; `ranked_match_records` in `matching_patterns.py` |
| **Singleton** | `frontend/src/onboarding/store/UserFormDataStore.js` |
| **Factory** | `frontend/src/onboarding/factory/StepFactory.jsx` |
| **Composite** | `frontend/src/onboarding/composite/FormFieldComposite.js`; `ProfileFilterComposite` in `matching_patterns.py` |

Principles reflected in structure: **SRP**, **OCP**, **DIP** (e.g. injectable onboarding API service; DTO adapter for scoring).

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
