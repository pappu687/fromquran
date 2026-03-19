AGENTS guidelines for fromquran-react (Laravel 12 + React).
Build: `npm run build`, SSR: `npm run build:ssr`.
Dev: prefer `composer dev` (or `npm run dev` + `php artisan serve --port 8004`).
Tests: `composer test` or `php artisan test`; single test by name: `php artisan test --filter=TestName`.
Tests: single file: `php artisan test tests/Feature/SomeTest.php`.
Frontend lint/types: `npm run lint`, `npm run types`.
Formatting: `npm run format` / `npm run format:check`; PHP: `./vendor/bin/pint`.
Prettier uses organize-imports + tailwindcss plugins; let them sort imports/classes.
TypeScript: strict types, avoid `any`, define `Props` interfaces/types explicitly.
React: function components + hooks only; no `React.FC`; keep components small and pure.
Imports: use `@/` alias for app code; group node/third-party/local; remove unused imports.
Naming: PascalCase for components/types, camelCase for vars/functions, SCREAMING_SNAKE_CASE for env-style constants.
Error handling: validate inputs, prefer early returns; show user-friendly messages and log unexpected errors.
Backend: follow Laravel conventions; keep controllers thin, push logic into services; use FormRequest for validation.
Routes/contracts: do not change APIs or Inertia props without updating TS types and Wayfinder routes.
UI: follow shadcn/Radix + `cn()` patterns in `resources/js/components/ui` and existing layouts.
SSR: guard `window`/`document` access and side effects for server rendering.
No Cursor (`.cursor/**`, `.cursorrules`) or Copilot (`.github/copilot-instructions.md`) rules currently found; if added, follow them and update this file.
Prefer incremental, focused changes that keep tests green and avoid new deps unless justified.
When unsure, copy patterns from nearby files and keep style consistent.
