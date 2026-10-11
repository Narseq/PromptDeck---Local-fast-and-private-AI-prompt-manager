"use client";

import { Download, FileUp, Menu as MenuIcon, Plus, Search, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { api, copyText, jsonBody } from "@/lib/client";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { Category, Prompt, PromptPage, SortOption, Stats, Tag } from "@/lib/types";
import { extractVariables } from "@/lib/variables";
import { HistoryDialog } from "./history-dialog";
import { OrganizeDialog } from "./organize-dialog";
import { PromptCard, type PromptActions } from "./prompt-card";
import { PromptFormDialog } from "./prompt-form-dialog";
import { Sidebar, type View } from "./sidebar";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { Button, ConfirmDialog, inputClass } from "./ui";
import { UseDialog } from "./use-dialog";

const SORT_OPTIONS: SortOption[] = ["newest", "oldest", "most-used", "alphabetical"];

const EMPTY_STATS: Stats = { all: 0, favorites: 0, recent: 0, trash: 0 };

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const errorMessage = (cause: unknown) => (cause instanceof Error ? cause.message : String(cause));

export function PromptDeck() {
  const { t } = useI18n();
  const [view, setView] = useState<View>("all");
  const [categoryId, setCategoryId] = useState<string>();
  const [tagId, setTagId] = useState<string>();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [items, setItems] = useState<Prompt[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);

  const [editing, setEditing] = useState<Prompt | "new" | null>(null);
  const [using, setUsing] = useState<Prompt | null>(null);
  const [historyOf, setHistoryOf] = useState<Prompt | null>(null);
  const [organizing, setOrganizing] = useState(false);
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    label: string;
    action: () => void;
  } | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounced(search.trim(), 250);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ view, sort, pageSize: "24" });
    if (categoryId) params.set("categoryId", categoryId);
    if (tagId) params.set("tagId", tagId);
    if (debouncedSearch) params.set("q", debouncedSearch);
    return params.toString();
  }, [view, sort, categoryId, tagId, debouncedSearch]);
  const requestKey = `${queryString}#${reloadKey}`;
  const isLoading = loadedKey !== requestKey;

  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;
    api<PromptPage>(`/api/prompts?${queryString}`)
      .then((result) => {
        if (cancelled) return;
        setItems(result.items);
        setTotal(result.total);
        setPage(1);
        setLoadError(null);
        setLoadedKey(requestKey);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setLoadError(errorMessage(cause));
        setLoadedKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [queryString, requestKey]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api<Category[]>("/api/categories"),
      api<Tag[]>("/api/tags"),
      api<Stats>("/api/stats"),
    ])
      .then(([nextCategories, nextTags, nextStats]) => {
        if (cancelled) return;
        setCategories(nextCategories);
        setTags(nextTags);
        setStats(nextStats);
      })
      .catch((cause: unknown) => !cancelled && toast.error(errorMessage(cause)));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Ctrl/Cmd+K focuses the search field.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const loadMore = async () => {
    try {
      const result = await api<PromptPage>(`/api/prompts?${queryString}&page=${page + 1}`);
      setItems((current) => [...current, ...result.items]);
      setTotal(result.total);
      setPage(result.page);
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  };

  const run = async (action: () => Promise<unknown>, success?: string) => {
    try {
      await action();
      if (success) toast.success(success);
      refresh();
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  };

  const copyPrompt = async (prompt: Prompt, text: string) => {
    try {
      await copyText(text);
      await api(`/api/prompts/${prompt.id}/use`, { method: "POST" });
      toast.success(t("toast.copied"));
      setUsing(null);
      refresh();
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  };

  const actions: PromptActions = {
    onCopy: (prompt) => {
      if (extractVariables(prompt.content).length > 0) setUsing(prompt);
      else void copyPrompt(prompt, prompt.content);
    },
    onEdit: setEditing,
    onToggleFavorite: (prompt) =>
      run(() =>
        api(`/api/prompts/${prompt.id}`, {
          method: "PATCH",
          ...jsonBody({ isFavorite: !prompt.isFavorite }),
        }),
      ),
    onDuplicate: (prompt) =>
      run(
        () => api(`/api/prompts/${prompt.id}/duplicate`, { method: "POST" }),
        t("toast.duplicated"),
      ),
    onHistory: setHistoryOf,
    onTrash: (prompt) =>
      run(() => api(`/api/prompts/${prompt.id}`, { method: "DELETE" }), t("toast.trashed")),
    onRestore: (prompt) =>
      run(() => api(`/api/prompts/${prompt.id}/restore`, { method: "POST" }), t("toast.restored")),
    onDeleteForever: (prompt) =>
      setConfirm({
        title: t("confirm.title"),
        message: `“${prompt.title}” and its version history will be removed. This cannot be undone.`,
        label: t("confirm.button"),
        action: () =>
          void run(
            () => api(`/api/prompts/${prompt.id}?permanent=true`, { method: "DELETE" }),
            t("toast.deleted"),
          ),
      }),
  };

  const importFile = async (file: File) => {
    try {
      const payload: unknown = JSON.parse(await file.text());
      const result = await api<{ imported: number; skipped: number }>("/api/import", {
        method: "POST",
        ...jsonBody(payload),
      });
      toast.success(t("toast.imported", { imported: result.imported, skipped: result.skipped }));
      refresh();
    } catch (cause) {
      toast.error(
        cause instanceof SyntaxError
          ? t("toast.importInvalid")
          : t("toast.importFailed", { message: errorMessage(cause) }),
      );
    }
  };

  const hasFilters = Boolean(debouncedSearch || categoryId || tagId);
  const sidebar = (
    <Sidebar
      view={view}
      categoryId={categoryId}
      tagId={tagId}
      stats={stats}
      categories={categories}
      tags={tags}
      onView={(next) => {
        setView(next);
        setSidebarOpen(false);
      }}
      onCategory={(id) => {
        setCategoryId(id);
        setSidebarOpen(false);
      }}
      onTag={(id) => {
        setTagId(id);
        setSidebarOpen(false);
      }}
      onOrganize={() => {
        setSidebarOpen(false);
        setOrganizing(true);
      }}
    />
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-border bg-bg/90 sticky top-0 z-20 flex items-center gap-2 border-b px-3 py-3 backdrop-blur sm:gap-3 sm:px-5">
        <Button
          variant="ghost"
          className="p-2 lg:hidden"
          aria-label={t("nav.open")}
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen(true)}
        >
          <MenuIcon size={20} aria-hidden />
        </Button>
        <div className="flex items-center gap-2 font-semibold">
          <Sparkles size={20} className="text-accent" aria-hidden />
          <span className="hidden sm:inline">PromptDeck</span>
        </div>
        <div className="relative mx-auto w-full max-w-xl">
          <Search
            size={16}
            className="text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            aria-hidden
          />
          <input
            ref={searchRef}
            type="search"
            aria-label={t("header.searchLabel")}
            placeholder={t("header.search")}
            className={cn(inputClass, "pl-9")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Button variant="primary" onClick={() => setEditing("new")}>
          <Plus size={16} aria-hidden />
          <span className="hidden sm:inline">{t("header.newPrompt")}</span>
          <span className="sr-only sm:hidden">{t("header.newPrompt")}</span>
        </Button>
        <LanguageSwitcher />
        <ThemeToggle />
      </header>

      <div className="flex flex-1">
        <aside className="border-border sticky top-[61px] hidden h-[calc(100dvh-61px)] w-64 shrink-0 border-r lg:block">
          {sidebar}
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-30 lg:hidden">
            <button
              type="button"
              aria-label={t("nav.close")}
              className="absolute inset-0 bg-black/60"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="border-border bg-surface relative h-full w-72 max-w-[85%] border-r">
              {sidebar}
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted text-sm" aria-live="polite">
              {isLoading && items.length === 0
                ? t("list.loading")
                : t("list.count", { count: total })}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-muted flex items-center gap-2 text-sm">
                {t("list.sort")}
                <select
                  className={cn(inputClass, "w-auto py-1.5")}
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortOption)}
                  disabled={view === "recent"}
                >
                  {SORT_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {t(`list.sort.${value}`)}
                    </option>
                  ))}
                </select>
              </label>
              <Button onClick={() => importRef.current?.click()}>
                <FileUp size={16} aria-hidden /> {t("list.import")}
              </Button>
              <input
                ref={importRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                aria-label={t("list.importLabel")}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void importFile(file);
                }}
              />
              <a
                href="/api/export"
                download
                className="border-border bg-surface-2 hover:border-accent inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
              >
                <Download size={16} aria-hidden /> {t("list.export")}
              </a>
            </div>
          </div>

          {loadError ? (
            <p
              role="alert"
              className="border-danger/40 bg-danger/10 text-danger rounded-xl border p-4 text-sm"
            >
              {t("list.loadError", { message: loadError })}
            </p>
          ) : items.length === 0 && !isLoading ? (
            <div className="border-border flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
              <p className="text-muted">
                {hasFilters ? t("list.noMatch") : t(`list.empty.${view}`)}
              </p>
              {!hasFilters && view === "all" && (
                <Button variant="primary" onClick={() => setEditing("new")}>
                  <Plus size={16} aria-hidden /> {t("list.addFirst")}
                </Button>
              )}
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
                  isLoading && "opacity-60 transition-opacity",
                )}
              >
                {items.map((prompt) => (
                  <PromptCard key={prompt.id} prompt={prompt} actions={actions} />
                ))}
              </div>
              {items.length < total && (
                <div className="mt-6 flex justify-center">
                  <Button onClick={() => void loadMore()}>
                    {t("list.loadMore", { remaining: total - items.length })}
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <PromptFormDialog
        target={editing}
        categories={categories}
        tags={tags}
        onClose={() => setEditing(null)}
        onSaved={(message) => {
          if (message) toast.success(message);
          refresh();
        }}
      />
      <UseDialog prompt={using} onClose={() => setUsing(null)} onCopy={copyPrompt} />
      <HistoryDialog
        prompt={historyOf}
        onClose={() => setHistoryOf(null)}
        onRestored={(message) => {
          toast.success(message);
          refresh();
        }}
      />
      <OrganizeDialog
        open={organizing}
        categories={categories}
        tags={tags}
        onClose={() => setOrganizing(false)}
        onChanged={(message) => {
          if (message) toast.success(message);
          refresh();
        }}
      />
      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
        confirmLabel={confirm?.label ?? ""}
        onConfirm={() => confirm?.action()}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
