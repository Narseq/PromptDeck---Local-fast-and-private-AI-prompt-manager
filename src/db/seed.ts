import type { Db } from "./client";
import { createPrompt } from "@/services/prompts";
import { createTag } from "@/services/tags";

const SEED_TAGS = [
  { name: "review", color: "#f59e0b" },
  { name: "refactor", color: "#10b981" },
  { name: "email", color: "#3b82f6" },
  { name: "polski", color: "#ef4444" },
  { name: "english", color: "#8b5cf6" },
  { name: "social", color: "#ec4899" },
  { name: "bugs", color: "#f97316" },
];

const SEED_PROMPTS = [
  {
    title: "Code review checklist",
    language: "en",
    translations: [
      {
        language: "pl",
        title: "Lista kontrolna code review",
        content:
          "Działaj jako doświadczony inżynier {{language}}. Zrecenzuj poniższy kod pod kątem poprawności, czytelności, wydajności i bezpieczeństwa. Wypisz problemy według wagi i zaproponuj konkretne poprawki.\n\n{{code}}",
      },
      {
        language: "de",
        title: "Code-Review-Checkliste",
        content:
          "Agiere als erfahrener {{language}}-Entwickler. Prüfe den folgenden Code auf Korrektheit, Lesbarkeit, Performance und Sicherheit. Liste die Probleme nach Schweregrad auf und schlage konkrete Korrekturen vor.\n\n{{code}}",
      },
    ],
    description: "Thorough review of a code snippet.",
    category: "Coding",
    tags: ["review", "english"],
    isFavorite: true,
    content:
      "Act as a senior {{language}} engineer. Review the code below for correctness, readability, performance and security. List problems by severity and suggest concrete fixes.\n\n{{code}}",
  },
  {
    title: "Refaktoryzacja kodu",
    language: "pl",
    translations: [],
    description: "Uproszczenie kodu bez zmiany zachowania.",
    category: "Coding",
    tags: ["refactor", "polski"],
    isFavorite: false,
    content:
      "Zrefaktoryzuj poniższy kod w języku {{jezyk}}. Zachowaj dotychczasowe zachowanie, popraw nazwy i usuń duplikację. Wyjaśnij krótko każdą zmianę.\n\n{{kod}}",
  },
  {
    title: "Explain this error",
    language: "en",
    translations: [],
    description: "Find the root cause of a stack trace.",
    category: "Debugging",
    tags: ["bugs", "english"],
    isFavorite: true,
    content:
      "I get the following error in {{framework}}:\n\n{{error}}\n\nExplain the most likely root cause, how to confirm it, and the smallest fix. Ask me for missing details if needed.",
  },
  {
    title: "Debugowanie krok po kroku",
    language: "pl",
    translations: [],
    description: "Systematyczna diagnoza problemu.",
    category: "Debugging",
    tags: ["bugs", "polski"],
    isFavorite: false,
    content:
      "Mam problem: {{problem}}. Oczekiwałem: {{oczekiwanie}}, a dzieje się: {{rzeczywistosc}}. Zaproponuj plan diagnozy w kolejności od najtańszych do najdroższych kroków.",
  },
  {
    title: "Professional email",
    language: "en",
    translations: [
      {
        language: "ru",
        title: "Деловое письмо",
        content:
          "Напиши письмо в {{tone}} тоне для {{recipient}}. Цель: {{goal}}. Не больше 150 слов, в конце — чёткий призыв к действию.\n\nЗаметки:\n{{notes}}",
      },
    ],
    description: "Polished email from rough notes.",
    category: "Writing",
    tags: ["email", "english"],
    isFavorite: false,
    content:
      "Write an email in a {{tone}} tone to {{recipient}}. Goal: {{goal}}. Keep it under 150 words and end with a clear call to action.\n\nNotes:\n{{notes}}",
  },
  {
    title: "Streszczenie tekstu",
    language: "pl",
    translations: [],
    description: "Krótkie streszczenie z najważniejszymi punktami.",
    category: "Writing",
    tags: ["polski"],
    isFavorite: false,
    content:
      "Streść poniższy tekst w {{liczba}} punktach dla odbiorcy: {{odbiorca}}. Zachowaj kluczowe liczby i daty.\n\n{{tekst}}",
  },
  {
    title: "Social media post",
    language: "en",
    translations: [],
    description: "Post tailored to a platform.",
    category: "Marketing",
    tags: ["social", "english"],
    isFavorite: false,
    content:
      "Create 3 variants of a {{platform}} post promoting {{product}} for {{audience}}. Tone: {{tone}}. Include a hook in the first line and 3 relevant hashtags.",
  },
  {
    title: "Opis produktu",
    language: "pl",
    translations: [],
    description: "Opis sklepowy nastawiony na korzyści.",
    category: "Marketing",
    tags: ["polski", "social"],
    isFavorite: true,
    content:
      "Napisz opis produktu „{{produkt}}” dla sklepu internetowego. Grupa docelowa: {{grupa}}. Skup się na korzyściach, nie na cechach. Maksymalnie {{dlugosc}} słów.",
  },
  {
    title: "Discord server rules",
    language: "en",
    translations: [],
    description: "Friendly rules for a community server.",
    category: "Discord",
    tags: ["english"],
    isFavorite: false,
    content:
      "Write a friendly set of rules for a Discord server about {{topic}}. Include sections for general conduct, channel usage and moderation. Keep each rule to one sentence.",
  },
  {
    title: "Tłumaczenie z zachowaniem tonu",
    language: "pl",
    translations: [],
    description: "Tłumaczenie naturalne, nie dosłowne.",
    category: "Translation",
    tags: ["polski", "english"],
    isFavorite: false,
    content:
      "Przetłumacz tekst z języka {{z}} na {{na}}. Zachowaj ton ({{ton}}), idiomy oddaj naturalnymi odpowiednikami, nie tłumacz nazw własnych.\n\n{{tekst}}",
  },
] as const;

/** Inserts example tags and prompts. Expects the default categories to exist already. */
export function seedExamples(db: Db): void {
  const tagIds = new Map(SEED_TAGS.map((tag) => [tag.name, createTag(db, tag).id] as const));
  const categoryIds = new Map(
    (db.prepare("SELECT id, name FROM categories").all() as { id: string; name: string }[]).map(
      (row) => [row.name, row.id] as const,
    ),
  );

  // Created oldest first so "newest" sorting shows the first entries on top.
  [...SEED_PROMPTS].reverse().forEach((prompt, index) => {
    const createdAt = new Date(Date.now() - (SEED_PROMPTS.length - index) * 60_000).toISOString();
    createPrompt(
      db,
      {
        title: prompt.title,
        content: prompt.content,
        description: prompt.description,
        categoryId: categoryIds.get(prompt.category) ?? null,
        tagIds: prompt.tags.flatMap((name) => tagIds.get(name) ?? []),
        isFavorite: prompt.isFavorite,
        language: prompt.language,
        translations: [...prompt.translations],
      },
      { createdAt },
    );
  });
}
