# From Quran

From Quran is a Quran reading and research application built with Laravel, Inertia, and React. It combines a reader experience with verse-level and surah-level supporting material such as tafsir, articles, fatwa links, related verses, topics, user submissions, and collections.

This README is written for developers and contributors who need to understand how to run, navigate, and extend the codebase.

## What this project is

- A Quran reader with translation and reading tools
- A research surface for ayah-level and surah-level resources
- A contribution workflow for adding and reviewing supporting resources
- A collections/tagging/search product around Quran study and discovery
- A Laravel monolith with a React frontend delivered through Inertia

## What this projct is not : A better clone of Quran.com

That matters for product decisions. This repository is not trying to recreate Quran.com feature-for-feature or compete on “better version of the same thing.” The direction here is Quran reading plus knowledge graph style exploration, contributor-submitted resources, tagging, collections, related material, and research workflows.

## Stack

- Backend: Laravel 12
- Frontend: React 19 + TypeScript
- App bridge: Inertia.js
- Bundler: Vite
- Styling: Tailwind CSS v4
- UI primitives: Radix UI + local shadcn-style components
- Auth: Laravel Fortify
- Permissions: Spatie Laravel Permission
- Search: Apache Solr
- State: local React state + Zustand where appropriate

## Core Product Areas

- Quran reader: chapter navigation, verse list, reading mode, jump-to-ayah, resources, tafsir, audio, annotations
- Related content: similar ayahs, topical links, resource graph, supporting references
- Search and discovery: search page, topics, public collections
- User contributions: verse and chapter resource submissions
- Admin tools: users, roles, resource types, verse/resource management

## Project Structure

High-signal directories:

- `app/Http/Controllers`:
  Laravel controllers for reader pages, APIs, admin, bookmarks, collections, topics, and settings
- `app/Services`:
  backend service classes, including Quran data and scraping/search integration
- `resources/js/pages`:
  Inertia page entry points
- `resources/js/components/quran`:
  reader-specific UI such as verses, resources, tafsir, sidebar, audio, and navigation
- `resources/js/components/ui`:
  reusable UI primitives
- `resources/js/layouts`:
  app, landing, auth, and reader layouts
- `routes/web.php`:
  page routes, including root-level Quran reader routes like `/{chapterNumber}` and `/{chapterNumber}/{range}`
- `routes/api.php`:
  JSON endpoints used by the reader and related experiences
- `database/migrations`:
  schema definition
- `database/seeders`:
  initial seeders, including roles and permissions

## Local Development

### Requirements

- PHP 8.2+
- Composer
- Node.js and npm
- SQLite for the default local path, unless you configure another database
- Solr only if you are working on search features that depend on it

### First-time setup

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
```

If needed, make sure the local SQLite file exists:

```bash
touch database/database.sqlite
```

### Run the app

Preferred:

```bash
composer dev
```

That starts:

- Laravel app on `http://localhost:8004`
- queue worker
- Laravel logs via `pail`
- Vite dev server

If you want to run pieces manually:

```bash
php artisan serve --port=8004
npm run dev
```

### SSR build

```bash
npm run build:ssr
composer run dev:ssr
```

## Common Commands

```bash
npm run build
npm run build:ssr
npm run lint
npm run types
npm run format
npm run format:check
php artisan test
composer test
./vendor/bin/pint
```

Run a single test:

```bash
php artisan test --filter=TestName
php artisan test tests/Feature/SomeTest.php
```

## Quran Foundation Content API

Audio and resource metadata can be proxied through Laravel at `/api/qf/*`. React must use `resources/js/api/quranFoundation.ts` and must not call Quran Foundation directly.

Required environment values:

```bash
QF_CLIENT_ID=
QF_CLIENT_SECRET=
QF_ENV=prelive
QF_CACHE_STORE=file
```

Use `QF_ENV=prelive` for `https://prelive-oauth2.quran.foundation` and `https://apis-prelive.quran.foundation`. Use `QF_ENV=production` for `https://oauth2.quran.foundation` and `https://apis.quran.foundation`.

The backend uses the client credentials flow with the `content` scope, caches access tokens, refreshes shortly before expiry, and never returns tokens or secrets to the frontend. To smoke-test the integration after configuring credentials, call:

```bash
curl http://localhost:8004/api/qf/verify
php artisan qf:verify
```

## Contributor Workflow

### Frontend conventions

- Use TypeScript strictly and avoid `any`
- Prefer small function components and hooks
- Reuse components from `resources/js/components/ui` before adding new primitives
- Match existing reader patterns in `resources/js/components/quran`
- Use the `@/` alias for application imports
- Guard `window` and `document` access for SSR-sensitive code

### Backend conventions

- Keep controllers thin
- Move reusable logic into services or focused request/response layers
- Use Laravel conventions and existing patterns from nearby files
- Keep route contracts and frontend prop shapes aligned when changing page data

### UI conventions

- Follow the established reader/admin visual language instead of introducing a new one
- Prefer Radix/shadcn-style primitives already in the repo
- Keep interactions accessible and keyboard-friendly
- Avoid clutter in the reader; reading content stays primary

## How the Reader Works

The reader is one of the most active areas in the codebase.

- Page route: `resources/js/pages/quran/reader.tsx`
- Layout shell: `resources/js/layouts/quran-reader-layout.tsx`
- Verse rendering: `resources/js/components/quran/verses-panel.tsx`
- Reader-specific controls and overlays live in `resources/js/components/quran`
- Reader data comes from `QuranReaderPageController` and `/api/quran/*` endpoints

Related page flows:

- `/{chapterNumber}`: chapter reader
- `/{chapterNumber}/{range}`: focused verse/range view
- `/related/{chapterNumber}/{verseNumber}`: dedicated related resources page

## Search Notes

Search is Solr-backed in this project. If you are working on search, indexing, or discovery behavior, inspect:

- `SearchPageController`
- Solr-related service classes and console commands
- any indexing/import commands in `app/Console/Commands`

Do not assume search behavior is fully local-only.

## Seeding and Roles

The repository includes role and permission seeding. Check:

- `database/seeders/DatabaseSeeder.php`
- `database/seeders/RolesAndPermissionsSeeder.php`

If you are working on admin workflows or gated UI, seed roles before testing those flows.

## Good First Areas for Contribution

- Reader UX polish and accessibility
- Resource submission and moderation workflows
- Topic and collection discovery
- Admin usability improvements
- Test coverage around reader navigation and related-resource flows

## Things to check before opening a PR

- The app runs locally on port `8004`
- Your changed page or flow works in both desktop and mobile layouts
- `npm run lint` passes for your affected files
- `npm run types` passes, or you clearly note existing unrelated failures
- Relevant PHP tests pass for backend changes
- You did not introduce unnecessary new dependencies
