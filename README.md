# PromptDeck

**A local, fast and private manager for your AI prompts.** Save, organize, search, tag, version and copy prompts — no accounts, no cloud, no telemetry. Your data lives in a single SQLite file on your machine.

[Polska wersja README](README.pl.md)

<!-- Add a screenshot or demo GIF here, e.g.: ![PromptDeck screenshot](docs/screenshot.png) -->

## Features

- **Prompt management** — create, edit, duplicate and delete prompts with a title, description, category, tags and favorite flag.
- **Variables** — write `{{language}}`, `{{topic}}`, `{{tone}}` placeholders; fill them in a small form (with live preview) before copying.
- **Organization** — colored tags, categories (Coding, Writing, Marketing, Discord, Debugging, Translation by default), favorites, recently used, and a trash with restore and permanent delete.
- **Search and filters** — search across title, content, description and tags; filter by category, tag, favorites or recently used; sort by newest, oldest, most used or A–Z.
- **One-click copy** with a usage counter. Press `Ctrl+K` (`Cmd+K` on macOS) to jump to search.
- **Versioning** — every change to a prompt's title, content or description creates a version. Browse the history, compare a version with the current one (line diff) and restore it.
- **Import / export** — export everything to JSON, import it back (duplicates are skipped), or export a single prompt as `.md` or `.txt`.
- **Prompt language versions** — keep the same prompt in English, Polish, German and Russian. Pick the original language, add translations in tabs, switch language on the card and copy or export the version you need. Translations are written by you (no cloud translation service) and are included in search and JSON export.
- **Multilingual UI** — English, Polish (Polski), German (Deutsch) and Russian (Русский). The language is detected from your browser and can be switched in the header; your choice is remembered.
- **UI** — dark theme by default, light theme optional, responsive layout, toast notifications, keyboard-accessible dialogs and helpful empty states.
- **Private by design** — no login, no external services, no network calls beyond your own server.

## Quick start

### With npm

Requirements: Node.js 22 or newer.

```bash
git clone https://github.com/Narseq/PromptDeck---Local-fast-and-private-AI-prompt-manager.git
cd PromptDeck---Local-fast-and-private-AI-prompt-manager
npm install
npm run dev
```

Open <http://localhost:3000>. The database is created automatically in `./data/promptdeck.db` on first run and filled with 10 example prompts (set `SEED_EXAMPLES=false` to skip them).

For a production build:

```bash
npm run build
npm start
```

### With Docker Compose

```bash
docker compose up --build
```

Open <http://localhost:3000>. Data is stored in the named volume `promptdeck-data`, so it survives restarts and rebuilds. Remove it with `docker compose down -v`.

## Configuration

Copy `.env.example` to `.env.local` to override defaults.

| Variable        | Default                | Description                                            |
| --------------- | ---------------------- | ------------------------------------------------------ |
| `DATABASE_PATH` | `./data/promptdeck.db` | Location of the SQLite file.                           |
| `SEED_EXAMPLES` | `true`                 | Insert example prompts when a new database is created. |

## Scripts

| Command             | What it does                  |
| ------------------- | ----------------------------- |
| `npm run dev`       | Start the development server  |
| `npm run build`     | Create a production build     |
| `npm start`         | Run the production build      |
| `npm run lint`      | Lint with ESLint              |
| `npm run typecheck` | Type-check with TypeScript    |
| `npm test`          | Run unit tests (Vitest)       |
| `npm run format`    | Format the code with Prettier |

## Project structure

```
src/
  app/            Next.js App Router: page, layout, global styles
    api/          REST route handlers (prompts, tags, categories, import/export, stats)
  components/     React UI (list, cards, dialogs, sidebar, theme toggle)
  services/       Business logic: prompts, versions, tags, categories, import/export
  db/             SQLite connection, schema (auto-created) and example data
  lib/            Zod validation, API helpers, variable parsing, export formats, types
    i18n/         UI translations (messages.ts) and the useI18n hook
tests/            Unit tests (Vitest, in-memory SQLite)
docs/             Original project specification
```

Layers: **UI → API route handlers (Zod validation) → services → SQLite**. Services receive the database as an argument, which keeps them easy to test.

### Data model

`prompts`, `tags`, `prompt_tags`, `categories`, `prompt_versions` and `usage_logs`, with indexes for the common filters and sorting. The schema is idempotent and applied on every start.

## Roadmap

- [ ] SQLite FTS5 full-text index with ranking for very large libraries
- [ ] Keyboard shortcuts for navigating and copying prompts
- [ ] Tag and category renaming from the UI
- [ ] Table view as an alternative to cards
- [ ] Optional import of Markdown files
- [ ] More languages (add a catalog in `src/lib/i18n/messages.ts`)

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md) first, then open an issue or a pull request.

## License

[MIT](LICENSE)
