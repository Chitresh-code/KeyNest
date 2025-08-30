# Frontend Development Guide

[Docs Home](index.md)

This guide covers local development for the Next.js frontend, structure, and common workflows.

---

## Prerequisites

- Node.js 18+

---

## Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local  # if present; otherwise set NEXT_PUBLIC_API_BASE_URL
npm run dev
```

App: http://localhost:3000

Ensure `NEXT_PUBLIC_API_BASE_URL` points to your API (e.g., http://localhost:8001).

---

## Structure

- src/app/: Next.js App Router pages and layouts
- src/components/: UI primitives and feature components
- src/lib/: API client (Axios), stores (Zustand), helpers, constants
- src/types/: TypeScript types

---

## API Client

The Axios client attaches `Authorization: Token <token>` automatically from localStorage.

```ts
// src/lib/api/client.ts
export const apiClient = axios.create({ baseURL: API_CONFIG.baseUrl });
```

Update `NEXT_PUBLIC_API_BASE_URL` in `.env.local` for different environments.

---

## Common Scripts

```bash
npm run dev
npm run build
npm run lint
```

---

Previous: developer-backend.md | Next: contributing.md
