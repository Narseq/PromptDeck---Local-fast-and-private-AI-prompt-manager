"use client";

import { Clock, Folder, Inbox, Settings2, Star, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { Category, Stats, Tag } from "@/lib/types";
import type { ListPromptsQuery } from "@/lib/validation";

export type View = ListPromptsQuery["view"];

interface SidebarProps {
  view: View;
  categoryId: string | undefined;
  tagId: string | undefined;
  stats: Stats;
  categories: Category[];
  tags: Tag[];
  onView: (view: View) => void;
  onCategory: (id: string | undefined) => void;
  onTag: (id: string | undefined) => void;
  onOrganize: () => void;
}

function NavButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition",
        active
          ? "bg-accent/15 text-accent font-medium"
          : "text-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate" title={label}>
        {label}
      </span>
      {count !== undefined && <span className="text-xs tabular-nums opacity-70">{count}</span>}
    </button>
  );
}

export function Sidebar(props: SidebarProps) {
  const { view, categoryId, tagId, stats, categories, tags } = props;
  const { t } = useI18n();
  return (
    <nav aria-label={t("nav.library")} className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <div className="space-y-0.5">
        <NavButton
          active={view === "all"}
          onClick={() => props.onView("all")}
          icon={<Inbox size={16} aria-hidden />}
          label={t("nav.all")}
          count={stats.all}
        />
        <NavButton
          active={view === "favorites"}
          onClick={() => props.onView("favorites")}
          icon={<Star size={16} aria-hidden />}
          label={t("nav.favorites")}
          count={stats.favorites}
        />
        <NavButton
          active={view === "recent"}
          onClick={() => props.onView("recent")}
          icon={<Clock size={16} aria-hidden />}
          label={t("nav.recent")}
          count={stats.recent}
        />
        <NavButton
          active={view === "trash"}
          onClick={() => props.onView("trash")}
          icon={<Trash2 size={16} aria-hidden />}
          label={t("nav.trash")}
          count={stats.trash}
        />
      </div>

      <section aria-labelledby="sidebar-categories">
        <h2
          id="sidebar-categories"
          className="text-muted mb-1 px-3 text-xs font-semibold tracking-wide uppercase"
        >
          {t("nav.categories")}
        </h2>
        <div className="space-y-0.5">
          {categories.map((category) => (
            <NavButton
              key={category.id}
              active={categoryId === category.id}
              onClick={() => props.onCategory(categoryId === category.id ? undefined : category.id)}
              icon={<Folder size={16} aria-hidden />}
              label={category.name}
              count={category.promptCount}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="sidebar-tags">
        <h2
          id="sidebar-tags"
          className="text-muted mb-1 px-3 text-xs font-semibold tracking-wide uppercase"
        >
          {t("nav.tags")}
        </h2>
        {tags.length === 0 ? (
          <p className="text-muted px-3 text-sm">{t("nav.noTags")}</p>
        ) : (
          <div className="space-y-0.5">
            {tags.map((tag) => (
              <NavButton
                key={tag.id}
                active={tagId === tag.id}
                onClick={() => props.onTag(tagId === tag.id ? undefined : tag.id)}
                icon={
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: tag.color }}
                    aria-hidden
                  />
                }
                label={tag.name}
                count={tag.promptCount}
              />
            ))}
          </div>
        )}
      </section>

      <div className="mt-auto">
        <NavButton
          active={false}
          onClick={props.onOrganize}
          icon={<Settings2 size={16} aria-hidden />}
          label={t("nav.manage")}
        />
      </div>
    </nav>
  );
}
