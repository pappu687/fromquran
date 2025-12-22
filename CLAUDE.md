# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

From Quran is an enhanced Quran platform similar to Quran.com with additional features including tagged resources (YouTube Tafseer, podcasts, articles), ayah cross-references, related hadith/fiqh, and comprehensive search capabilities.

**Stack:**
- Frontend: React 19 with Inertia.js (SSR capable)
- Backend: Laravel 12 with Fortify (authentication)
- Build: Vite 7 with TypeScript 5.7
- Styling: Tailwind CSS 4 with Radix UI components
- State Management: Inertia.js props & React hooks

## Development Commands

### Initial Setup
```bash
composer setup  # Runs install, env copy, key generation, migrations, npm install & build
```

### Development Server
```bash
composer dev    # Starts 4 concurrent processes:
                # - Laravel server (port 8004)
                # - Queue listener
                # - Pail logs
                # - Vite dev server
```

### Development with SSR
```bash
composer dev:ssr  # Build SSR then run: server, queue, logs, and SSR runtime
```

### Testing
```bash
composer test           # Clear config cache and run PHPUnit
php artisan test        # Run full test suite
php artisan test --filter=TestName  # Run specific test
```

### Frontend Development
```bash
npm run dev             # Start Vite dev server (used by composer dev)
npm run build           # Production build
npm run build:ssr       # Build both client and SSR bundles
npm run lint            # ESLint auto-fix
npm run format          # Prettier auto-format resources/
npm run format:check    # Check formatting without changes
npm run types           # TypeScript type check (no emit)
```

### Laravel Artisan
```bash
php artisan serve --port 8004   # Start development server
php artisan queue:listen         # Queue worker
php artisan pail                 # Real-time logs
php artisan migrate              # Run migrations
php artisan tinker               # Interactive REPL
```

### Code Quality
```bash
./vendor/bin/pint       # Laravel Pint (PHP CS Fixer)
npm run lint            # ESLint with auto-fix
npm run format          # Prettier formatting
npm run types           # TypeScript type checking
```

### Data Import
```bash
php artisan quran:import-data                           # Import from docs/quran_en.json
php artisan quran:import-data --path=custom/file.json   # Custom path
```

## Architecture

### Backend Structure

**Database Schema:** Converted from Quran.com Ruby on Rails API to Laravel. Core tables include:
- `chapters`, `verses`, `words` - Quran content hierarchy
- `juzs`, `hizbs` - Navigation divisions
- `translations`, `tafsirs` - Multi-language content
- `languages`, `authors`, `resource_contents` - Content management system
- `audio_recitations`, `audio_files`, `audio_segments` - Audio system
- `api_clients`, `api_client_request_stats` - API client management
- `char_types`, `roots`, `tokens` - Morphological analysis

**Models:** 26+ Eloquent models in `app/Models/` with proper relationships (belongsTo, hasMany, etc.)

**Controllers:**
- `QuranController` - Chapters, verses, editions, search, juzs
- `BookmarkController` - User bookmarks (requires auth)
- `Settings/*Controller` - Profile, password, 2FA

**API Routes (`routes/api.php`):**
- `/api/quran/chapters` - List all chapters
- `/api/quran/chapters/{id}/verses` - Verses by chapter
- `/api/quran/editions` - Available translations
- `/api/quran/search` - Search functionality
- `/api/quran/juzs` - Juz list
- `/api/quran/juzs/{id}/verses` - Verses by juz
- `/api/bookmarks/*` - Bookmark CRUD (auth required)

**Artisan Commands:**
- `ImportQuranData` - Import Quran data from JSON files (see IMPORT_COMMAND_GUIDE.md)

### Frontend Structure

**Entry Points:**
- `resources/js/app.tsx` - Client-side entry (CSR)
- `resources/js/ssr.tsx` - Server-side entry (SSR)

**Directory Organization:**
- `resources/js/pages/` - Inertia page components (auth/, quran/, settings/)
- `resources/js/components/` - Reusable React components (app-header, sidebar, etc.)
- `resources/js/layouts/` - Layout wrappers
- `resources/js/routes/` - Wayfinder route definitions
- `resources/js/actions/` - Server actions
- `resources/js/hooks/` - Custom React hooks
- `resources/js/types/` - TypeScript type definitions
- `resources/js/lib/` - Utility functions

**Key Features:**
- React Compiler enabled (babel-plugin-react-compiler)
- Laravel Wayfinder integration for type-safe routing
- Inertia.js for SPA-like navigation without building an API
- Radix UI components (@radix-ui/*) for accessible primitives
- Headless UI for additional accessible components
- Lucide React for icons

**Styling:**
- Tailwind CSS 4 with Vite plugin
- `class-variance-authority` for component variants
- `tailwind-merge` (via `clsx`) for className merging
- `tw-animate-css` for animations

### Configuration Files

**Vite (`vite.config.ts`):**
- Input: `resources/css/app.css`, `resources/js/app.tsx`
- SSR: `resources/js/ssr.tsx`
- Plugins: laravel-vite-plugin, @vitejs/plugin-react, @tailwindcss/vite, wayfinder
- React Compiler enabled via Babel

**TypeScript (`tsconfig.json`):**
- Strict mode configuration
- JSX: react-jsx (automatic runtime)
- Paths configured for `@/` alias

**ESLint (`eslint.config.js`):**
- ESLint 9 flat config
- Plugins: react, react-hooks, typescript-eslint
- Prettier integration

**Composer Scripts:**
- `composer setup` - Complete project setup
- `composer dev` - Development environment with concurrently running services
- `composer test` - Run PHPUnit tests

## Important Notes

### Inertia.js Pattern
This project uses Inertia.js, which means:
- No REST API for frontend (uses Inertia responses)
- Page components receive props from Laravel controllers
- Form submissions use Inertia's `useForm` hook
- Navigation uses Inertia's `router` or `<Link>` component

### Laravel Wayfinder
Type-safe routing is handled by Laravel Wayfinder:
- Route definitions in `resources/js/routes/`
- Auto-generated type-safe route functions
- Form variants enabled in vite config

### SSR Considerations
When working with SSR:
- Use `npm run build:ssr` to build both client and SSR bundles
- SSR entry point is `resources/js/ssr.tsx`
- Start SSR server with `php artisan inertia:start-ssr`
- Use `composer dev:ssr` for SSR development mode

### Database
- Default DB: SQLite (`database/database.sqlite`)
- Migrations follow Laravel 12 conventions
- Test environment uses in-memory SQLite

### Authentication
- Laravel Fortify handles auth
- Routes: login, register, password reset, 2FA
- Protected routes use `auth:sanctum` middleware

## Data Import Process

The project includes comprehensive documentation for importing Quran data:
- See `IMPORT_COMMAND_GUIDE.md` for detailed instructions
- See `QURAN_API_CONVERSION.md` for schema details and Ruby to Laravel conversion notes
- JSON file expected at `docs/quran_en.json` (or custom path via `--path` flag)
- Import creates 114 chapters, ~6,236 verses with translations

## File References

When implementing features, key files to reference:
- Database schema: `database/migrations/2024_01_01_*`
- Models: `app/Models/*`
- API structure: `QURAN_API_CONVERSION.md`
- Import process: `IMPORT_COMMAND_GUIDE.md`
- Frontend routing: `resources/js/routes/*`
- Page components: `resources/js/pages/*`
