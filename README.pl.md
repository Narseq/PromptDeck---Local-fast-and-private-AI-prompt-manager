# PromptDeck

**Lokalny, szybki i prywatny menedżer promptów AI.** Zapisuj, porządkuj, wyszukuj, taguj, wersjonuj i kopiuj prompty — bez kont, bez chmury, bez telemetrii. Twoje dane trafiają do jednego pliku SQLite na Twoim komputerze.

[English README](README.md)

<!-- Miejsce na zrzut ekranu lub GIF demo, np.: ![PromptDeck](docs/screenshot.png) -->

## Funkcje

- **Zarządzanie promptami** — tworzenie, edycja, duplikowanie i usuwanie; tytuł, opis, kategoria, tagi i ulubione.
- **Zmienne** — placeholdery `{{jezyk}}`, `{{temat}}`, `{{ton}}`; przed skopiowaniem uzupełniasz je w prostym formularzu z podglądem na żywo.
- **Organizacja** — kolorowe tagi, kategorie (domyślnie Coding, Writing, Marketing, Discord, Debugging, Translation), ulubione, ostatnio używane oraz kosz z przywracaniem i trwałym usuwaniem.
- **Wyszukiwanie i filtry** — szukanie po tytule, treści, opisie i tagach; filtry: kategoria, tag, ulubione, ostatnio używane; sortowanie: najnowsze, najstarsze, najczęściej używane, A–Z.
- **Kopiowanie jednym kliknięciem** z licznikiem użyć. `Ctrl+K` (`Cmd+K` na macOS) przenosi do wyszukiwarki.
- **Wersjonowanie** — każda zmiana tytułu, treści lub opisu tworzy nową wersję. Możesz przeglądać historię, porównać wersję z aktualną (diff liniowy) i ją przywrócić.
- **Import / eksport** — eksport wszystkiego do JSON, import z JSON (duplikaty są pomijane) oraz eksport pojedynczego promptu do `.md` lub `.txt`.
- **Wersje językowe promptu** — ten sam prompt po angielsku, polsku, niemiecku i rosyjsku. Wybierasz język oryginału, dodajesz tłumaczenia w zakładkach, przełączasz język na karcie i kopiujesz lub eksportujesz potrzebną wersję. Tłumaczenia wpisujesz sam (bez chmurowego tłumacza); są uwzględniane w wyszukiwaniu i eksporcie JSON.
- **Wielojęzyczny interfejs** — angielski, polski, niemiecki (Deutsch) i rosyjski (Русский). Język jest wykrywany z przeglądarki i można go zmienić w nagłówku; wybór jest zapamiętywany.
- **Interfejs** — domyślnie ciemny motyw, opcjonalnie jasny, responsywny układ, powiadomienia toast, dostępne z klawiatury okna dialogowe i czytelne puste stany.
- **Prywatność** — brak logowania i zewnętrznych usług.

## Szybki start

### Przez npm

Wymagania: Node.js 22 lub nowszy.

```bash
git clone https://github.com/Narseq/PromptDeck---Local-fast-and-private-AI-prompt-manager.git
cd PromptDeck---Local-fast-and-private-AI-prompt-manager
npm install
npm run dev
```

Otwórz <http://localhost:3000>. Baza powstaje automatycznie w `./data/promptdeck.db` przy pierwszym uruchomieniu i zawiera 10 przykładowych promptów (ustaw `SEED_EXAMPLES=false`, aby je pominąć).

Wersja produkcyjna:

```bash
npm run build
npm start
```

### Przez Docker Compose

```bash
docker compose up --build
```

Otwórz <http://localhost:3000>. Dane są w wolumenie `promptdeck-data`, więc przetrwają restart i przebudowanie. Usuniesz je poleceniem `docker compose down -v`.

## Konfiguracja

Skopiuj `.env.example` do `.env.local`, aby zmienić ustawienia.

| Zmienna         | Domyślnie              | Opis                                                 |
| --------------- | ---------------------- | ---------------------------------------------------- |
| `DATABASE_PATH` | `./data/promptdeck.db` | Lokalizacja pliku SQLite.                            |
| `SEED_EXAMPLES` | `true`                 | Dodaj przykładowe prompty przy tworzeniu nowej bazy. |

## Skrypty

| Polecenie           | Działanie                    |
| ------------------- | ---------------------------- |
| `npm run dev`       | Serwer deweloperski          |
| `npm run build`     | Build produkcyjny            |
| `npm start`         | Uruchomienie builda          |
| `npm run lint`      | ESLint                       |
| `npm run typecheck` | Sprawdzenie typów TypeScript |
| `npm test`          | Testy jednostkowe (Vitest)   |
| `npm run format`    | Formatowanie Prettier        |

## Struktura projektu

```
src/
  app/            Next.js App Router: strona, layout, style
    api/          Endpointy REST (prompty, tagi, kategorie, import/eksport, statystyki)
  components/     Interfejs React (lista, karty, okna dialogowe, panel boczny)
  services/       Logika: prompty, wersje, tagi, kategorie, import/eksport
  db/             Połączenie z SQLite, schemat (tworzony automatycznie), dane przykładowe
  lib/            Walidacja Zod, helpery API, parsowanie zmiennych, formaty eksportu, typy
    i18n/         Tłumaczenia interfejsu (messages.ts) i hook useI18n
tests/            Testy jednostkowe (Vitest, SQLite w pamięci)
docs/             Oryginalna specyfikacja projektu
```

Warstwy: **UI → endpointy API (walidacja Zod) → serwisy → SQLite**.

## Roadmapa

- [ ] Indeks pełnotekstowy SQLite FTS5 z rankingiem dla bardzo dużych bibliotek
- [ ] Skróty klawiszowe do nawigacji i kopiowania
- [ ] Zmiana nazw tagów i kategorii z poziomu UI
- [ ] Widok tabeli jako alternatywa dla kart
- [ ] Opcjonalny import plików Markdown
- [ ] Kolejne języki (dodaj katalog w `src/lib/i18n/messages.ts`)

## Współtworzenie

Wkład jest mile widziany. Przeczytaj [CONTRIBUTING.md](CONTRIBUTING.md) oraz [Kodeks postępowania](CODE_OF_CONDUCT.md), a potem otwórz issue lub pull request.

## Licencja

[MIT](LICENSE)
