Jesteś doświadczonym full-stack developerem i architektem aplikacji. Zbuduj kompletny, działający projekt open source o nazwie **PromptDeck**.

## Cel projektu

PromptDeck to lokalna, szybka i prywatna aplikacja webowa do zarządzania promptami AI. Użytkownik może zapisywać, organizować, wyszukiwać, tagować, wersjonować i kopiować swoje prompty. Aplikacja ma działać lokalnie, bez kont, bez logowania i bez wysyłania danych do chmury.

Projekt ma być gotowy do publikacji na GitHubie: czysty kod, README, przykładowe dane, skrypty uruchamiające i README po angielsku.

## Stack technologiczny

- Next.js (App Router, TypeScript)
- Tailwind CSS
- shadcn/ui lub podobny zestaw komponentów
- SQLite jako lokalna baza danych
- Prisma ORM albo better-sqlite3 — wybierz rozwiązanie prostsze i bardziej niezawodne dla lokalnej aplikacji
- Zod do walidacji danych
- ESLint + Prettier
- Docker Compose do łatwego uruchomienia
- Testy jednostkowe dla kluczowej logiki

Nie używaj płatnych API, logowania przez Google, Supabase, Firebase ani żadnych usług chmurowych w podstawowej wersji.

## Funkcje MVP

1. **Zarządzanie promptami**
   - Tworzenie, edycja, usuwanie i duplikowanie promptów.
   - Każdy prompt ma: tytuł, treść, opis, tagi, kategorię, ulubione, datę utworzenia i ostatniej modyfikacji.
   - Obsługa zmiennych w promptach, np. {{jezyk}}, {{temat}}, {{ton}}.
   - Przed skopiowaniem promptu użytkownik może uzupełnić zmienne w prostym formularzu.

2. **Organizacja**
   - Tagi z kolorami.
   - Kategorie, np. Coding, Writing, Marketing, Discord, Debugging, Translation.
   - Ulubione.
   - Ostatnio używane.
   - Kosz z możliwością przywrócenia i trwałego usunięcia.

3. **Wyszukiwanie i filtrowanie**
   - Pełnotekstowe wyszukiwanie po tytule, treści, opisie i tagach.
   - Filtry: kategoria, tag, ulubione, ostatnio używane.
   - Sortowanie: najnowsze, najstarsze, najczęściej używane, alfabetycznie.

4. **Kopiowanie**
   - Kopiowanie promptu jednym kliknięciem.
   - Licznik użyć promptu.
   - Opcjonalne skróty klawiszowe, np. Ctrl+K do wyszukiwania.

5. **Wersjonowanie**
   - Przy każdej większej edycji promptu tworzona jest nowa wersja.
   - Użytkownik może zobaczyć historię wersji, przywrócić starszą wersję i porównać zmiany.

6. **Import i eksport**
   - Eksport wszystkich promptów do JSON.
   - Import z JSON.
   - Możliwość eksportu pojedynczego promptu jako plik `.md` lub `.txt`.

7. **UI/UX**
   - Nowoczesny, ciemny motyw jako domyślny.
   - Tryb jasny jako opcja.
   - Responsywny layout: desktop, tablet i mobile.
   - Panel boczny z kategoriami i tagami.
   - Główna lista promptów jako karty lub tabela.
   - Modal do tworzenia i edycji promptu.
   - Toast notifications po kopiowaniu, zapisie i usuwaniu.
   - Puste stany z czytelnymi komunikatami, np. „Brak promptów — dodaj pierwszy”.

## Struktura danych

Zaprojektuj tabele:

- prompts
- tags
- prompt_tags
- categories
- prompt_versions
- usage_logs

Przykładowe pola promptu:

- id
- title
- content
- description
- categoryId
- isFavorite
- isDeleted
- usageCount
- createdAt
- updatedAt

Dodaj sensowne indeksy pod wyszukiwanie i filtrowanie.

## Architektura

- Rozdziel warstwę UI, API, serwisów i dostępu do bazy.
- Wszystkie mutacje waliduj przez Zod.
- Nie przechowuj tokenów ani sekretów w repozytorium.
- Dodaj plik `.env.example`.
- Baza SQLite ma być tworzona automatycznie przy pierwszym uruchomieniu.
- Dodaj migracje lub automatyczną inicjalizację schematu.
- Dodaj seed z 10 przykładowymi promptami w języku polskim i angielskim.

## Strona GitHuba

Stwórz:

- `README.md` po angielsku
- `README.pl.md` po polsku
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `LICENSE` — MIT
- `.github/ISSUE_TEMPLATE/bug_report.yml`
- `.github/ISSUE_TEMPLATE/feature_request.yml`
- `.github/workflows/ci.yml` — lint, typecheck i testy

README musi zawierać:

- nazwę i krótki opis projektu
- screenshot lub miejsce na GIF demo
- listę funkcji
- instrukcję instalacji
- instrukcję uruchomienia przez npm i Docker Compose
- strukturę projektu
- roadmapę
- sekcję „Contributing”
- licencję MIT

## Jakość kodu

- TypeScript strict mode.
- Czytelne nazwy plików, funkcji i komponentów.
- Brak martwego kodu.
- Brak hardcoded sekretów.
- Obsługa błędów w API i formularzach.
- Walidacja danych po stronie serwera.
- Dostępność: semantyczny HTML, etykiety pól, obsługa klawiatury.
- Wydajność: paginacja lub wirtualizacja listy przy większej liczbie promptów.

## Kolejność pracy

1. Stwórz strukturę projektu i konfigurację narzędzi.
2. Zaprojektuj schemat bazy danych.
3. Zaimplementuj CRUD promptów.
4. Dodaj tagi, kategorie i filtrowanie.
5. Dodaj wyszukiwanie, ulubione i licznik użyć.
6. Dodaj wersjonowanie promptów.
7. Dodaj import/eksport JSON.
8. Zbuduj kompletny UI.
9. Dodaj testy, CI, Docker Compose i dokumentację.
10. Na końcu wypisz listę plików, które zostały utworzone, oraz instrukcję uruchomienia.

## Ważne zasady

- Nie wymyślaj funkcji spoza specyfikacji.
- Jeśli czegoś brakuje, najpierw zadaj pytanie.
- Nie twórz fałszywych integracji z AI.
- Nie dodawaj logowania, użytkowników ani synchronizacji chmurowej w MVP.
- Cały interfejs po angielsku, ale komentarze i dokumentację techniczną pisz po angielsku.
- Zadbaj, aby projekt dało się uruchomić jedną komendą po sklonowaniu repo.

Zacznij od wygenerowania pełnej struktury projektu, a następnie implementuj kod plik po pliku.
