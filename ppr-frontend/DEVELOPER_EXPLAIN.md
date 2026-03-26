# Developer Explain (Next.js App Router)

This document explains how this repo is organized and why it is built this way. It is written for a developer who has experience in React/TS but is new to Next.js App Router.

## What this app is

This is a Next.js 15 App Router frontend for the PPR platform. It provides role-based dashboards (sponsor, provider, user, verifier) with projects, stages, tasks, evidences, and contributions.

The core goals of the architecture are:
- Keep server rendering as the default to reduce client bundle size and improve security.
- Keep UI interactive only where needed (`use client`).
- Keep API shapes stable via shared mappers.
- Keep data fresh (no stale cache for sensitive data).

## How routing works (App Router)

Next.js App Router uses the `src/app` folder to define routes. Each folder with a `page.tsx` is a route. Layouts are shared UI wrappers defined in `layout.tsx`.

Key patterns in this repo:
- `src/app/(app)` is a route group for authenticated routes.
- `src/app/(auth)` is a route group for login, register, forgot password.
- Route groups in parentheses do not affect the URL. They only group files.

Examples:
- `src/app/(app)/provider/page.tsx` maps to `/provider`.
- `src/app/(app)/provider/projects/[id]/page.tsx` maps to `/provider/projects/:id`.
- `src/app/(auth)/login/page.tsx` maps to `/login`.

Layouts:
- `src/app/layout.tsx` is the root layout for the entire app.
- `src/app/(app)/layout.tsx` wraps all authenticated routes.
- `src/app/(auth)/layout.tsx` wraps auth pages.

## Server vs client components

In App Router, components are server components by default. That means they render on the server and can do async data fetching without sending extra JS to the browser.

You only opt into client components when you need browser-only features (state, effects, DOM APIs, Keycloak hooks, localStorage). That is done by adding:

```tsx
'use client'
```

Examples:
- Server component page: `src/app/(app)/provider/page.tsx`
- Client component: `src/components/projects-table.tsx`
- Client auth boundary: `src/components/protected-route.tsx`

Why this matters:
- Server components reduce bundle size and protect data handling from the browser.
- Client components are used only where interactivity or auth hooks are required.

## Data flow and API layer

There are two API clients and two service layers:

1. Client-side API (browser)
- `src/lib/api-client.ts` uses `fetch` and adds a Keycloak Bearer token.
- `src/lib/api-services.ts` exposes React hooks for data operations.

2. Server-side API (server components / server actions)
- `src/lib/api.ts` is a server-only API client that uses `fetch`.
- `src/lib/api-services-server.ts` exposes async functions used in server components.

### Shared mappers (single source of truth)
API responses use snake_case and sometimes inconsistent shapes. We normalize them in one place:

- `src/lib/api-mappers.ts` contains:
  - `transformApiProject`
  - `transformApiPhase`
  - `transformApiTask`
  - `transformApiUser`

Both client and server services import these to prevent drift.

Why this is important:
- It avoids subtle bugs where server and client map fields differently.
- It makes API changes easier to fix in one file.

## Authentication and role protection

Authentication uses Keycloak.

Flow:
1. `KeycloakProvider` is mounted in `src/app/layout.tsx`.
2. On login, Keycloak provides tokens in the browser.
3. The client stores the access token in a cookie (`kc_token`).
4. Server components read that cookie to authenticate server-side API calls.

Key files:
- `src/components/keycloak-provider.tsx` sets and clears the auth cookie.
- `src/components/protected-route.tsx` enforces authentication.
- `src/components/role-protected-route.tsx` enforces role-based access.
- `src/hooks/use-auth.ts` exposes auth state and helper methods.

Why a cookie is used:
- Server components cannot read client memory.
- A cookie bridges auth state so server-side fetches can include the Bearer token.

## Caching and freshness

All server-side API calls are forced to be fresh:
- `cache: 'no-store'`
- `revalidate: 0`

This is implemented in `src/lib/api.ts`. It ensures project lists, tasks, and evidences stay up to date and avoids stale data for sensitive pages.

Server actions (mutations) call `revalidatePath` to refresh relevant pages.

Example:
- `src/app/(app)/provider/my-projects/actions.ts`

## State management

There is no global state library. Most state lives in component state or server fetches. The only cross-session client state is:
- `src/hooks/use-recent-projects.ts` (localStorage)

This keeps the app simpler and avoids unnecessary client bundles.

## Styling

Styling is done with Tailwind CSS v4.
- Global stylesheet: `src/styles/tailwind.css`
- Components use className strings.

## How to add a new feature (quick playbook)

1. Add a route in `src/app`.
2. Decide server vs client component:
   - Use server if you can fetch data on the server and render static HTML.
   - Use client if you need hooks, state, or browser APIs.
3. If you need API data:
   - Server: add a function to `api-services-server.ts`.
   - Client: add a hook to `api-services.ts`.
4. If new API shapes are introduced:
   - Update `api-mappers.ts` so both server and client agree.
5. Wrap with `ProtectedRoute` or `RoleProtectedRoute` if access is restricted.

## Why this architecture

- App Router + server components keeps pages fast and secure by default.
- Shared mappers keep data consistent across server and client.
- Keycloak + cookie bridge enables authenticated server rendering.
- Minimal dependencies and minimal global state keep the codebase easier to reason about.

This architecture favors correctness, predictable data flow, and a clean separation between UI and data logic.
