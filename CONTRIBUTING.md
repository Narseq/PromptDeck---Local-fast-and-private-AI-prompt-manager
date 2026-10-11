# Contributing to PromptDeck

Thanks for your interest! PromptDeck is a small, local-first app, and we want to keep it simple and private.

## Ground rules

- Be kind — see the [Code of Conduct](CODE_OF_CONDUCT.md).
- Keep the scope focused: no accounts, no cloud services, no telemetry.
- Open an issue before starting large changes so we can agree on the approach.

## Development setup

Requirements: Node.js 22 or newer.

```bash
npm install
npm run dev
```

The SQLite database is created in `./data` on first run. Delete the file to start fresh.

## Before opening a pull request

Run all checks locally; CI runs the same ones:

```bash
npm run lint
npm run typecheck
npm test
npm run format:check
```

## Guidelines

- TypeScript strict mode; avoid `any`.
- Validate every API input with Zod (`src/lib/validation.ts`).
- Keep layers separate: UI components call the API, route handlers validate and delegate to `src/services`, services talk to SQLite.
- Add or update unit tests for changes to services and `src/lib`.
- Keep the UI accessible: labels for inputs, semantic HTML, keyboard support.
- Write code, comments and documentation in English.
- User-facing text goes through `useI18n()`; add every new string to all four catalogs in `src/lib/i18n/messages.ts` (a test checks that no key is missing).

## Commit and pull request style

- Use short, imperative commit messages (`Add tag color editing`).
- Describe what changed and why in the pull request, and link the related issue.
- Keep pull requests small and focused.

## Reporting bugs and requesting features

Use the issue templates. For bugs, include steps to reproduce, what you expected, what happened, and your environment (OS, Node.js version, npm or Docker).
