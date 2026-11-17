# Daily Amar Desh IT Management System

An IT infrastructure, inventory, network, IP address, VLAN, switch, and room management system built with Next.js App Router.

## Requirements

- Node.js 20.9 or newer
- npm

## Getting started

1. Install dependencies with `npm install`.
2. Add your Gemini API key to `.env.local` as `GEMINI_API_KEY` when using Gemini features.
3. Start the development server with `npm run dev` and open <http://localhost:3000>.

## Production

- `npm run build` creates the production build.
- `npm start` serves the production build.

## App Router

Dashboard routes live under `src/app/dashboard/`. The shared
`src/app/dashboard/layout.jsx` keeps the sidebar, top bar, and providers mounted
while dashboard pages change. Add each dashboard view in its own `page.jsx`;
use `[id]/page.jsx` for record details and nested folders for actions such as
editing.

The login screen is `/login`. Successful credentials are sent to
`/api/auth/login`, which forwards them to the configured authentication API and
sets an HttpOnly `accessToken` cookie. `src/middleware.js` redirects requests
without that cookie from `/dashboard` to `/login`, and redirects cookie-bearing
requests from `/login` to `/dashboard`.

Middleware checks that the session cookie exists; protected API endpoints must
still validate the bearer token for every data request.
