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