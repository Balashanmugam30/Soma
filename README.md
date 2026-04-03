# SOMA

SOMA is a premium AI SaaS frontend focused on planning, execution, reusable skills, persistent memory, and multilingual conversations. The application lives in [`frontend`](./frontend) and is built to be deployment-ready for a real product environment rather than a temporary demo.

## Highlights

- Next.js App Router frontend with TypeScript and Tailwind CSS
- Firebase Google Auth with persistent sessions
- Firestore-backed chat history, skills, memory, and analytics
- Protected workspace with responsive sidebar, topbar, and centered chat layout
- Language onboarding plus full UI translation in English, Tamil, and Hindi
- Voice input on click and per-message speech playback
- Light and dark themes with system preference support
- FastAPI `/chat` integration through a reusable service layer

## Workspace

The frontend codebase is located at:

```bash
frontend/
```

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Populate `frontend/.env.local` with Firebase credentials and the backend URL:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Verification

The frontend has been validated with:

```bash
cd frontend
npm run lint
npm run build
```
