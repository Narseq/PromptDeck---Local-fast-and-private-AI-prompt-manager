"use client";

import {
  Copy,
  Download,
  FileText,
  History,
  Pencil,
  RotateCcw,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { LOCALE_NAMES, type Locale } from "@/lib/i18n/messages";
import { availableLanguages, localizePrompt } from "@/lib/localize";
import { useI18n } from "@/lib/i18n/use-i18n";
import { extractVariables } from "@/lib/variables";
import type { Prompt } from "@/lib/types";
import { Button, Menu, TagChip, type MenuItem } from "./ui";

export interface PromptActions {
  onCopy: (prompt: Prompt) => void;
  onEdit: (prompt: Prompt) => void;
  onToggleFavorite: (prompt: Prompt) => void;
  onDuplicate: (prompt: Prompt) => void;
  onHistory: (prompt: Prompt) => void;
  onTrash: (prompt: Prompt) => void;
  onRestore: (prompt: Prompt) => void;
  onDeleteForever: (prompt: Prompt) => void;
}

/** Triggers a browser download of a same-origin URL without leaving the page. */
function downloadFile(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = "";
  link.click();
}

export function PromptCard({ prompt, actions }: { prompt: Prompt; actions: PromptActions }) {
  const { t } = useI18n();
  const [shown, setShown] = useState<Locale>(prompt.language);
  const languages = availableLanguages(prompt);
  const shownLanguage = languages.includes(shown) ? shown : prompt.language;
  const view = localizePrompt(prompt, shownLanguage);
  const variableCount = extractVariables(view.content).length;

  const menuItems: MenuItem[] = prompt.isDeleted
    ? [
        {
          label: t("card.restore"),
          icon: <RotateCcw size={14} aria-hidden />,
          onSelect: () => actions.onRestore(prompt),
        },
        {
          label: t("card.deletePermanently"),
          icon: <XCircle size={14} aria-hidden />,
          danger: true,
          onSelect: () => actions.onDeleteForever(prompt),
        },
      ]
    : [
        {
          label: t("card.edit"),
          icon: <Pencil size={14} aria-hidden />,
          onSelect: () => actions.onEdit(prompt),
        },
        {
          label: t("card.duplicate"),
          icon: <Copy size={14} aria-hidden />,
          onSelect: () => actions.onDuplicate(prompt),
        },
        {
          label: t("card.history"),
          icon: <History size={14} aria-hidden />,
          onSelect: () => actions.onHistory(prompt),
        },
        {
          label: t("card.exportMd"),
          icon: <FileText size={14} aria-hidden />,
          onSelect: () =>
            downloadFile(`/api/prompts/${prompt.id}/export?format=md&lang=${shownLanguage}`),
        },
        {
          label: t("card.exportTxt"),
          icon: <Download size={14} aria-hidden />,
          onSelect: () =>
            downloadFile(`/api/prompts/${prompt.id}/export?format=txt&lang=${shownLanguage}`),
        },
        {
          label: t("card.trash"),
          icon: <Trash2 size={14} aria-hidden />,
          danger: true,
          onSelect: () => actions.onTrash(prompt),
        },
      ];

  return (
    <article className="border-border bg-surface hover:border-accent/60 flex flex-col gap-3 rounded-2xl border p-4 transition">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold" title={view.title}>
            {view.title}
          </h3>
          {prompt.description && (
            <p className="text-muted mt-0.5 line-clamp-2 text-sm">{prompt.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center">
          {!prompt.isDeleted && (
            <Button
              variant="ghost"
              className="p-1.5"
              aria-pressed={prompt.isFavorite}
              aria-label={prompt.isFavorite ? t("card.removeFavorite") : t("card.addFavorite")}
              onClick={() => actions.onToggleFavorite(prompt)}
            >
              <Star
                size={18}
                aria-hidden
                className={cn(prompt.isFavorite && "fill-amber-400 text-amber-400")}
              />
            </Button>
          )}
          <Menu label={t("card.actionsFor", { title: view.title })} items={menuItems} />
        </div>
      </header>

      <pre className="bg-bg text-muted line-clamp-4 max-h-24 overflow-hidden rounded-lg p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
        {view.content}
      </pre>

      {languages.length > 1 && (
        <div role="group" aria-label={t("card.languages")} className="flex flex-wrap gap-1">
          {languages.map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={code === shownLanguage}
              aria-label={t("card.showIn", { language: LOCALE_NAMES[code] })}
              title={LOCALE_NAMES[code]}
              onClick={() => setShown(code)}
              className={cn(
                "rounded-md border px-2 py-0.5 text-xs font-medium uppercase transition",
                code === shownLanguage
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border text-muted hover:text-fg",
              )}
            >
              {code}
            </button>
          ))}
        </div>
      )}

      {(prompt.categoryName || prompt.tags.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {prompt.categoryName && (
            <span className="bg-surface-2 text-muted rounded-full px-2 py-0.5 text-xs">
              {prompt.categoryName}
            </span>
          )}
          {prompt.tags.map((tag) => (
            <TagChip key={tag.id} name={tag.name} color={tag.color} />
          ))}
        </div>
      )}

      <footer className="mt-auto flex items-center justify-between gap-2 pt-1">
        <p className="text-muted text-xs">
          {t("card.used", { count: prompt.usageCount })}
          {variableCount > 0 && ` · ${t("card.variables", { count: variableCount })}`}
        </p>
        {prompt.isDeleted ? (
          <Button onClick={() => actions.onRestore(prompt)}>
            <RotateCcw size={16} aria-hidden /> {t("card.restore")}
          </Button>
        ) : (
          <Button variant="primary" onClick={() => actions.onCopy(view)}>
            <Copy size={16} aria-hidden /> {t("card.copy")}
          </Button>
        )}
      </footer>
    </article>
  );
}
