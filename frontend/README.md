# SOMA Frontend

SOMA is a production-oriented AI SaaS frontend built with Next.js App Router, TypeScript, Tailwind CSS, Firebase Authentication, and Firestore. The experience is designed to feel premium and minimal while still supporting real product workflows such as protected routes, multilingual UI, reusable skills, persistent chat history, memory, analytics, and backend chat orchestration.

## Features

- Premium minimal landing page with Google sign-in
- Firebase authentication with persistent sessions
- Language onboarding flow with English, Tamil, and Hindi
- Protected `/workspace` route
- Real-time Firestore conversation history
- Conversation creation, rename, delete, and resume
- Skill system with 5 built-in skills and custom skill creation
- Multi-agent workflow visualization in AI messages
- Voice input on click and per-message speech output
- Light and dark mode with system preference support
- Settings modal with language, theme, clear history, and logout
- Memory and lightweight analytics persistence hooks
- Modular architecture with `src/app`, `components`, `context`, `hooks`, `lib`, `services`, `store`, and `types`

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Firebase Auth
- Firestore
- Zustand
- Lucide React

## Project Structure

```text
src/
├── app/
├── components/
├── context/
├── hooks/
├── lib/
├── services/
├── store/
└── types/
```

## Environment Setup

Create or update `frontend/.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Run Locally

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Available Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Backend Contract

SOMA expects a FastAPI backend with:

```http
POST /chat
```

Expected request payload includes:

- `message`
- `conversationId`
- `language`
- optional `skill`
- optional `memory`

Expected response may include:

- `message` or `response`
- optional `workflow`
- optional `taskCompleted`
- optional `memoryHints`

## Deployment Notes

- Verified with `npm run lint`
- Verified with `npm run build`
- Ready for Vercel deployment
- Can also be deployed behind Cloud Run with the backend hosted separately
- All runtime config is sourced from environment variables

## Notes

- Firestore stores user profiles, conversations, skills, memory, and analytics
- Route protection is handled client-side because auth is Firebase-driven
- Voice features use browser Web Speech APIs and gracefully degrade if unsupported
