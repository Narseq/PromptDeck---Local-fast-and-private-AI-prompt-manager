import type { Locale } from "./i18n/messages";

export interface Category {
  id: string;
  name: string;
  promptCount: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  promptCount: number;
}

export interface TagRef {
  id: string;
  name: string;
  color: string;
}

/** The prompt text in another language; an empty title means "reuse the original title". */
export interface PromptTranslation {
  language: Locale;
  title: string;
  content: string;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  description: string;
  /** Language of `title` and `content`; other languages live in `translations`. */
  language: Locale;
  translations: PromptTranslation[];
  categoryId: string | null;
  categoryName: string | null;
  tags: TagRef[];
  isFavorite: boolean;
  isDeleted: boolean;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromptVersion {
  id: string;
  promptId: string;
  version: number;
  title: string;
  content: string;
  description: string;
  createdAt: string;
}

export type SortOption = "newest" | "oldest" | "most-used" | "alphabetical";

export interface PromptPage {
  items: Prompt[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Stats {
  all: number;
  favorites: number;
  recent: number;
  trash: number;
}
