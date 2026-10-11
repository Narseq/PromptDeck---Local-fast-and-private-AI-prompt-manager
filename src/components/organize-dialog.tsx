"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { api, jsonBody } from "@/lib/client";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { Category, Tag } from "@/lib/types";
import { Button, inputClass, Modal } from "./ui";

interface OrganizeDialogProps {
  open: boolean;
  categories: Category[];
  tags: Tag[];
  onClose: () => void;
  onChanged: (message?: string) => void;
}

export function OrganizeDialog({
  open,
  categories,
  tags,
  onClose,
  onChanged,
}: OrganizeDialogProps) {
  const { t } = useI18n();
  const [categoryName, setCategoryName] = useState("");
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState("#6366f1");
  const [error, setError] = useState<string | null>(null);

  const attempt = async (action: () => Promise<unknown>, message?: string) => {
    try {
      await action();
      setError(null);
      onChanged(message);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("toast.error"));
      return false;
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t("organize.title")} wide>
      {error && (
        <p role="alert" className="bg-danger/10 text-danger mb-4 rounded-lg px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <div className="grid gap-8 md:grid-cols-2">
        <section aria-labelledby="org-tags" className="space-y-3">
          <h3 id="org-tags" className="font-semibold">
            {t("organize.tags")}
          </h3>
          <ul className="space-y-2">
            {tags.map((tag) => (
              <li key={tag.id} className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label={t("organize.colorOf", { name: tag.name })}
                  className="border-border bg-bg h-9 w-10 shrink-0 cursor-pointer rounded-lg border p-1"
                  key={tag.color}
                  defaultValue={tag.color}
                  onBlur={(event) => {
                    if (event.target.value === tag.color) return;
                    void attempt(() =>
                      api(`/api/tags/${tag.id}`, {
                        method: "PATCH",
                        ...jsonBody({ color: event.target.value }),
                      }),
                    );
                  }}
                />
                <span className="min-w-0 flex-1 truncate text-sm">{tag.name}</span>
                <span className="text-muted text-xs">{tag.promptCount}</span>
                <Button
                  variant="ghost"
                  className="p-1.5"
                  aria-label={t("organize.deleteTag", { name: tag.name })}
                  onClick={() =>
                    void attempt(
                      () => api(`/api/tags/${tag.id}`, { method: "DELETE" }),
                      t("toast.tagDeleted"),
                    )
                  }
                >
                  <Trash2 size={16} aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
          <form
            className="flex items-center gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const ok = await attempt(
                () =>
                  api("/api/tags", {
                    method: "POST",
                    ...jsonBody({ name: tagName, color: tagColor }),
                  }),
                t("toast.tagCreated"),
              );
              if (ok) setTagName("");
            }}
          >
            <input
              type="color"
              aria-label={t("organize.newTagColor")}
              className="border-border bg-bg h-9 w-10 shrink-0 cursor-pointer rounded-lg border p-1"
              value={tagColor}
              onChange={(event) => setTagColor(event.target.value)}
            />
            <input
              aria-label={t("organize.newTagName")}
              className={inputClass}
              placeholder={t("organize.newTag")}
              value={tagName}
              maxLength={40}
              onChange={(event) => setTagName(event.target.value)}
              required
            />
            <Button type="submit" aria-label={t("organize.addTag")}>
              <Plus size={16} aria-hidden />
            </Button>
          </form>
        </section>

        <section aria-labelledby="org-categories" className="space-y-3">
          <h3 id="org-categories" className="font-semibold">
            {t("organize.categories")}
          </h3>
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm">{category.name}</span>
                <span className="text-muted text-xs">{category.promptCount}</span>
                <Button
                  variant="ghost"
                  className="p-1.5"
                  aria-label={t("organize.deleteCategory", { name: category.name })}
                  onClick={() =>
                    void attempt(
                      () => api(`/api/categories/${category.id}`, { method: "DELETE" }),
                      t("toast.categoryDeleted"),
                    )
                  }
                >
                  <Trash2 size={16} aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
          <form
            className="flex items-center gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const ok = await attempt(
                () =>
                  api("/api/categories", { method: "POST", ...jsonBody({ name: categoryName }) }),
                t("toast.categoryCreated"),
              );
              if (ok) setCategoryName("");
            }}
          >
            <input
              aria-label={t("organize.newCategoryName")}
              className={inputClass}
              placeholder={t("organize.newCategory")}
              value={categoryName}
              maxLength={40}
              onChange={(event) => setCategoryName(event.target.value)}
              required
            />
            <Button type="submit" aria-label={t("organize.addCategory")}>
              <Plus size={16} aria-hidden />
            </Button>
          </form>
          <p className="text-muted text-xs">{t("organize.categoryNote")}</p>
        </section>
      </div>
    </Modal>
  );
}
