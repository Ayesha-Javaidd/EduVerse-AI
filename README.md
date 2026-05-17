# EduVerse Frontend

Angular 19 frontend for the EduVerse multi-tenant e-learning platform.

## Stack

Angular 19

Tailwind CSS

RxJS

Chart.js / ng2-charts

Stripe Embedded Checkout

`ngx-markdown`

## Core Product Areas

- Auth: login, signup, role-based entry flows
- Admin: dashboard, teachers, students, courses, billing, settings
- Super Admin: tenants, subscriptions, platform settings
- Teacher: dashboard, course management, course builder, student tracking
- Student: dashboard, my courses, explore, course details, course player, leaderboard, settings
- Public: landing page, pricing, documentation/help/legal pages

## Configuration

Frontend runtime-style build configuration is centralized here:

- [src/environments/environment.ts](./src/environments/environment.ts)
- [src/environments/environment.development.ts](./src/environments/environment.development.ts)
- [src/app/core/constants/api.constants.ts](./src/app/core/constants/api.constants.ts)
- [src/app/core/constants/app.constants.ts](./src/app/core/constants/app.constants.ts)

If the backend URL, app branding, or shared limits change, update the environment/constants files instead of editing individual services.

## Local Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

App URL:

```text
[http://localhost:4200](https://eduverse-ai-app.vercel.app/)
```

## Build

```bash
npm run build
```

Production output is generated in:

```text
dist/setting-page
```

## Test

```bash
npm test
```

## Project Structure

```text
src/
  app/
    core/         shared app constants, interceptors, global services
    features/     role-based modules and public pages
    layouts/      admin / teacher / student / auth / super-admin shells
    shared/       reusable UI components, shared models, shared services
  environments/   environment-specific build config
```

## UI Guidelines

- Prefer Tailwind utilities over component-specific CSS whenever practical.
- Keep shared visual decisions in reusable components and shared constants.
- Avoid hardcoding API URLs, storage keys, plan caps, or branding strings inside feature components.
- Reuse existing shared components before introducing new one-off markup patterns.

## Notes

- `intl-tel-input` styling still uses a small amount of custom CSS because it is a third-party widget.
- Some complex screens like the course player still keep a limited amount of custom CSS for behavior-heavy layout cases.
- Responsive behavior has been improved in the shared layouts and key pages, but final device QA should still be done in a real browser.
