"use client";

import { Plus } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { api, jsonBody } from "@/lib/client";
import { cn } from "@/lib/cn";
import { LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n/messages";
import { isLocale } from "@/lib/i18n/translate";
import { useI18n } from "@/lib/i18n/use-i18n";
import { extractVariables } from "@/lib/variables";
import type { Category, Prompt, Tag } from "@/lib/types";
import { Button, Field, inputClass, Modal, TagChip } from "./ui";

interface PromptFormDialogProps {
  /** `"new"` creates a prompt, a Prompt edits it, `null` keeps the dialog closed. */
  target: Prompt | "new" | null;
  categories: Category[];
  tags: Tag[];
  onClose: () => void;
  /** Called after a successful save or after a tag was created, so the caller can refresh. */
  onSaved: (message?: string) => void;
}

type Texts = Record<Locale, { title: string; content: string }>;

function initialTexts(prompt: Prompt | null): Texts {
  const texts = Object.fromEntries(
    LOCALES.map((code) => [code, { title: "", content: "" }]),
  ) as Texts;
  if (prompt) {
    texts[prompt.language] = { title: prompt.title, content: prompt.content };
    for (const translation of prompt.translations) {
      texts[translation.language] = { title: translation.title, content: translation.content };
    }
  }
  return texts;
}

export function PromptFormDialog({ target, onClose, ...rest }: PromptFormDialogProps) {
  const { t } = useI18n();
  return (
    <Modal
      open={target !== null}
      onClose={onClose}
      title={target === "new" ? t("form.titleNew") : t("form.titleEdit")}
      wide
    >
      {target && (
        <PromptForm
          key={target === "new" ? "new" : target.id}
          prompt={target === "new" ? null : target}
          onClose={onClose}
          {...rest}
        />
      )}
    </Modal>
  );
}

function PromptForm({
  prompt,
  categories,
  tags,
  onClose,
  onSaved,
}: Omit<PromptFormDialogProps, "target"> & { prompt: Prompt | null }) {
  const { t, locale } = useI18n();
  const tabsId = useId();
  const [language, setLanguage] = useState<Locale>(prompt?.language ?? locale);
  const [active, setActive] = useState<Locale>(prompt?.language ?? locale);
  const [texts, setTexts] = useState<Texts>(() => initialTexts(prompt));
  const [description, setDescription] = useState(prompt?.description ?? "");
  const [categoryId, setCategoryId] = useState(prompt?.categoryId ?? "");
  const [tagIds, setTagIds] = useState<string[]>(prompt?.tags.map((tag) => tag.id) ?? []);
  const [isFavorite, setIsFavorite] = useState(prompt?.isFavorite ?? false);
  const [newTag, setNewTag] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const activeText = texts[active];
  const isOriginalTab = active === language;
  const variables = useMemo(() => extractVariables(activeText.content), [activeText.content]);

  const updateText = (field: "title" | "content", value: string) =>
    setTexts((current) => ({ ...current, [active]: { ...current[active], [field]: value } }));

  const toggleTag = (id: string) =>
    setTagIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );

  const addTag = async () => {
    const name = newTag.trim();
    if (!name) return;
    try {
      const tag = await api<Tag>("/api/tags", {
        method: "POST",
        ...jsonBody({ name, color: newTagColor }),
      });
      setTagIds((current) => [...current, tag.id]);
      setNewTag("");
      setError(null);
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("form.errorTag"));
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const original = texts[language];
    if (!original.title.trim() || !original.content.trim()) {
      setActive(language);
      setError(t("form.errorOriginal", { language: LOCALE_NAMES[language] }));
      return;
    }
    setSaving(true);
    setError(null);
    const body = {
      title: original.title,
      description,
      content: original.content,
      language,
      translations: LOCALES.filter((code) => code !== language && texts[code].content.trim()).map(
        (code) => ({ language: code, ...texts[code] }),
      ),
      categoryId: categoryId || null,
      tagIds,
      isFavorite,
    };
    try {
      if (prompt) {
        await api(`/api/prompts/${prompt.id}`, { method: "PATCH", ...jsonBody(body) });
      } else {
        await api("/api/prompts", { method: "POST", ...jsonBody(body) });
      }
      onSaved(prompt ? t("toast.saved") : t("toast.created"));
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("form.errorSave"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("form.language")}>
          {(id) => (
            <select
              id={id}
              className={inputClass}
              value={language}
              onChange={(event) => {
                if (isLocale(event.target.value)) {
                  setLanguage(event.target.value);
                  setActive(event.target.value);
                }
              }}
            >
              {LOCALES.map((code) => (
                <option key={code} value={code}>
                  {LOCALE_NAMES[code]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label={t("form.category")}>
          {(id) => (
            <select
              id={id}
              className={inputClass}
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">{t("form.noCategory")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <Field label={t("form.description")} hint={t("form.descriptionHint")}>
        {(id) => (
          <input
            id={id}
            className={inputClass}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
          />
        )}
      </Field>

      <div className="space-y-3">
        <p className="text-muted text-xs">{t("form.variantsHint")}</p>
        <div role="tablist" aria-label={t("card.languages")} className="flex flex-wrap gap-1.5">
          {LOCALES.map((code) => (
            <button
              key={code}
              type="button"
              role="tab"
              id={`${tabsId}-tab-${code}`}
              aria-selected={code === active}
              aria-controls={`${tabsId}-panel`}
              onClick={() => setActive(code)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition",
                code === active
                  ? "border-accent bg-accent/15 text-accent font-medium"
                  : "border-border text-muted hover:text-fg",
              )}
            >
              {LOCALE_NAMES[code]}
              {code === language && (
                <span className="text-xs opacity-70">({t("form.variantOriginal")})</span>
              )}
              {texts[code].content.trim() && (
                <>
                  <span className="bg-accent size-1.5 rounded-full" aria-hidden />
                  <span className="sr-only">{t("form.variantFilled")}</span>
                </>
              )}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`${tabsId}-panel`}
          aria-labelledby={`${tabsId}-tab-${active}`}
          className="space-y-4"
        >
          <Field
            label={t("form.title")}
            hint={isOriginalTab ? undefined : t("form.variantTitleHint")}
          >
            {(id) => (
              <input
                id={id}
                className={inputClass}
                value={activeText.title}
                onChange={(event) => updateText("title", event.target.value)}
                required={isOriginalTab}
                maxLength={200}
              />
            )}
          </Field>
          <Field label={t("form.prompt")} hint={t("form.promptHint")}>
            {(id) => (
              <textarea
                id={id}
                className={cn(inputClass, "min-h-48 font-mono")}
                value={activeText.content}
                onChange={(event) => updateText("content", event.target.value)}
                required={isOriginalTab}
                maxLength={50000}
              />
            )}
          </Field>
          {variables.length > 0 && (
            <p className="text-muted text-xs">
              {t("form.variables", { list: variables.map((name) => `{{${name}}}`).join(", ") })}
            </p>
          )}
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("form.tags")}</legend>
        <div className="flex flex-wrap gap-2">
          {tags.length === 0 && <p className="text-muted text-sm">{t("form.noTagsYet")}</p>}
          {tags.map((tag) => (
            <label key={tag.id} className="cursor-pointer">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={tagIds.includes(tag.id)}
                onChange={() => toggleTag(tag.id)}
              />
              <span className="ring-offset-surface peer-checked:ring-accent peer-focus-visible:outline-accent inline-block rounded-full opacity-50 ring-offset-2 peer-checked:opacity-100 peer-checked:ring-2 peer-focus-visible:outline-2">
                <TagChip name={tag.name} color={tag.color} />
              </span>
            </label>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            aria-label={t("form.newTagName")}
            className={cn(inputClass, "max-w-48")}
            placeholder={t("form.newTag")}
            value={newTag}
            maxLength={40}
            onChange={(event) => setNewTag(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void addTag();
              }
            }}
          />
          <input
            type="color"
            aria-label={t("form.newTagColor")}
            className="border-border bg-bg h-9 w-10 cursor-pointer rounded-lg border p-1"
            value={newTagColor}
            onChange={(event) => setNewTagColor(event.target.value)}
          />
          <Button onClick={() => void addTag()} disabled={!newTag.trim()}>
            <Plus size={16} aria-hidden /> {t("form.addTag")}
          </Button>
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isFavorite}
          onChange={(event) => setIsFavorite(event.target.checked)}
          className="size-4 accent-[var(--accent)]"
        />
        {t("form.favorite")}
      </label>

      {error && (
        <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button onClick={onClose}>{t("form.cancel")}</Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? t("form.saving") : t("form.save")}
        </Button>
      </div>
    </form>
  );
}
